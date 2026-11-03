import React, { useMemo, useState } from "react";
import {
  Plus,
  X,
  Search,
  ArrowDownToLine,
  ArrowUpFromLine,
  SlidersHorizontal,
  History,
  Pencil,
  AlertTriangle,
  FileSpreadsheet,
  Archive,
  Lock,
  Boxes,
  CircleDollarSign,
  Undo2,
} from "lucide-react";
import { styles } from "./styles.js";
import { INSUMO_CATEGORIES, INSUMO_UNITS, PURCHASE_EXPENSE_CATEGORY } from "./catalogos.js";
import {
  uid,
  computeStock,
  stockStatus,
  fmtMoney,
  fmtQty,
  saveItem,
  saveMovement,
  updateItem,
  saveExpense,
  todayInput,
  parseDay,
  downloadCsv,
} from "./data.js";

const MOVE_LABELS = {
  entrada: { label: "Entrada", icon: ArrowDownToLine, style: styles.chipOk },
  salida: { label: "Salida", icon: ArrowUpFromLine, style: styles.chipLow },
  ajuste: { label: "Ajuste", icon: SlidersHorizontal, style: styles.chipMuted },
  reintegro: { label: "Reintegro", icon: Undo2, style: styles.chipOk },
};

function fmtWhen(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" });
}

// Fecha elegida en el formulario -> ISO. Si es hoy, usa la hora actual.
function dayToIso(day) {
  if (!day || day === todayInput()) return new Date().toISOString();
  const d = parseDay(day);
  d.setHours(12, 0, 0, 0);
  return d.toISOString();
}

export function StatusChip({ status }) {
  if (status === "agotado") return <span style={{ ...styles.chip, ...styles.chipOut }}>Agotado</span>;
  if (status === "bajo") return <span style={{ ...styles.chip, ...styles.chipLow }}>Stock bajo</span>;
  return <span style={{ ...styles.chip, ...styles.chipOk }}>Disponible</span>;
}

export default function InsumosTab({ insumos, drones, session, perms, notify }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [onlyLow, setOnlyLow] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [itemModal, setItemModal] = useState(null); // { item } | { item: null }
  const [moveModal, setMoveModal] = useState(null); // { item, type }
  const [kardexItem, setKardexItem] = useState(null);

  const loading = insumos === null;
  const items = insumos?.items || [];
  const movements = insumos?.movements || [];
  const stockMap = useMemo(() => computeStock(items, movements), [items, movements]);
  const canEdit = perms.canManageInventory;

  const activeItems = items.filter((it) => it.active !== false);
  const lowItems = activeItems.filter((it) => stockStatus(stockMap.get(it.id)?.stock || 0, it.minStock) !== "ok");
  const inventoryValue = activeItems.reduce((s, it) => s + (stockMap.get(it.id)?.value || 0), 0);
  const now = new Date();
  const movesThisMonth = movements.filter((m) => {
    const d = new Date(m.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  const q = query.trim().toLowerCase();
  const visible = items
    .filter((it) => (showArchived ? it.active === false : it.active !== false))
    .filter((it) => !category || it.category === category)
    .filter((it) => !q || it.name.toLowerCase().includes(q) || (it.location || "").toLowerCase().includes(q))
    .filter((it) => !onlyLow || stockStatus(stockMap.get(it.id)?.stock || 0, it.minStock) !== "ok")
    .sort((a, b) => a.name.localeCompare(b.name, "es"));

  const itemsById = Object.fromEntries(items.map((it) => [it.id, it]));
  const recentMoves = movements
    .slice()
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 12);

  function exportCsv() {
    downloadCsv(
      `TRUAC-inventario-${todayInput()}.csv`,
      ["Insumo", "Categoría", "Unidad", "Stock", "Stock mínimo", "Estado", "Costo promedio", "Valor en inventario", "Ubicación", "Último movimiento"],
      activeItems
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name, "es"))
        .map((it) => {
          const s = stockMap.get(it.id) || {};
          return [
            it.name,
            it.category,
            it.unit,
            s.stock || 0,
            Number(it.minStock) || 0,
            { ok: "Disponible", bajo: "Stock bajo", agotado: "Agotado" }[stockStatus(s.stock || 0, it.minStock)],
            Math.round(s.avgCost || 0),
            Math.round(s.value || 0),
            it.location || "",
            s.lastMove ? fmtWhen(s.lastMove) : "",
          ];
        })
    );
  }

  function exportMovesCsv() {
    downloadCsv(
      `TRUAC-movimientos-insumos-${todayInput()}.csv`,
      ["Fecha", "Tipo", "Insumo", "Cantidad", "Unidad", "Costo unitario", "Valor", "Dron", "Proveedor", "Soporte", "Registrado por", "Nota"],
      movements
        .slice()
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .map((m) => {
          const it = itemsById[m.itemId];
          return [
            fmtWhen(m.date),
            MOVE_LABELS[m.type]?.label || m.type,
            it?.name || m.itemName,
            m.type === "salida" ? -Math.abs(m.quantity) : m.quantity,
            it?.unit || "",
            Math.round(Number(m.unitCost) || 0),
            Math.round((Number(m.unitCost) || 0) * Math.abs(Number(m.quantity) || 0)),
            m.droneName || "",
            m.provider || "",
            m.soporte || "",
            m.by,
            m.note || "",
          ];
        })
    );
  }

  return (
    <div>
      <div style={styles.pageHead}>
        <div>
          <div style={styles.pageTitle}>Insumos y repuestos</div>
          <div style={styles.pageSub}>Inventario del taller. Lo que los técnicos registran como "insumos usados" en un dron se descuenta solo.</div>
        </div>
        <div style={styles.pageActions}>
          {!canEdit && (
            <span style={styles.readOnlyNote}>
              <Lock size={12} /> Solo lectura
            </span>
          )}
          <button style={styles.outlineBtn} onClick={exportCsv} title="Descargar inventario para Excel">
            <FileSpreadsheet size={14} />
            Exportar
          </button>
          {canEdit && (
            <button style={styles.newButton} onClick={() => setItemModal({ item: null })}>
              <Plus size={15} />
              Nuevo insumo
            </button>
          )}
        </div>
      </div>

      <div style={styles.kpiGrid}>
        <Kpi icon={Boxes} label="Referencias activas" value={activeItems.length} sub={`${movements.length} movimientos registrados`} />
        <Kpi
          icon={AlertTriangle}
          label="Stock bajo o agotado"
          value={lowItems.length}
          valueColor={lowItems.length ? "#F5A623" : undefined}
          sub={lowItems.length ? "Haz clic para ver cuáles" : "Todo por encima del mínimo"}
          onClick={lowItems.length ? () => { setOnlyLow(true); setShowArchived(false); } : undefined}
        />
        <Kpi icon={CircleDollarSign} label="Valor del inventario" value={fmtMoney(inventoryValue)} sub="Stock × costo promedio de compra" />
        <Kpi icon={History} label="Movimientos este mes" value={movesThisMonth} sub={now.toLocaleDateString("es-CO", { month: "long", year: "numeric" })} />
      </div>

      <div style={styles.toolbar}>
        <div style={{ position: "relative", flex: "1 1 220px", maxWidth: 340 }}>
          <Search size={13} color="#68707D" style={{ position: "absolute", left: 10, top: 9 }} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar insumo o ubicación…" style={{ ...styles.toolbarInput, width: "100%", paddingLeft: 30 }} />
        </div>
        <select value={category} onChange={(e) => setCategory(e.target.value)} style={styles.toolbarInput}>
          <option value="">Todas las categorías</option>
          {INSUMO_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <button style={{ ...styles.toggleBtn, ...(onlyLow ? styles.toggleBtnOn : {}) }} onClick={() => setOnlyLow((v) => !v)}>
          <AlertTriangle size={12} />
          Solo stock bajo
        </button>
        <button style={{ ...styles.toggleBtn, ...(showArchived ? styles.toggleBtnOn : {}) }} onClick={() => setShowArchived((v) => !v)}>
          <Archive size={12} />
          Dados de baja
        </button>
      </div>

      <div style={{ ...styles.tableWrap, marginBottom: 18 }}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Insumo</th>
              <th style={styles.th}>Categoría</th>
              <th style={{ ...styles.th, ...styles.thNum }}>Stock</th>
              <th style={styles.th}>Estado</th>
              <th style={{ ...styles.th, ...styles.thNum }}>Mínimo</th>
              <th style={{ ...styles.th, ...styles.thNum }}>Costo prom.</th>
              <th style={{ ...styles.th, ...styles.thNum }}>Valor</th>
              <th style={{ ...styles.th, ...styles.thNum }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={8} style={styles.tableEmpty}>
                  Cargando inventario…
                </td>
              </tr>
            )}
            {!loading && visible.length === 0 && (
              <tr>
                <td colSpan={8} style={styles.tableEmpty}>
                  {items.length === 0
                    ? canEdit
                      ? "Aún no hay insumos. Crea el primero con «Nuevo insumo»."
                      : "Aún no hay insumos registrados."
                    : "Ningún insumo coincide con los filtros."}
                </td>
              </tr>
            )}
            {visible.map((it) => {
              const s = stockMap.get(it.id) || { stock: 0, avgCost: 0, value: 0 };
              const status = stockStatus(s.stock, it.minStock);
              return (
                <tr key={it.id}>
                  <td style={styles.td}>
                    <div style={{ fontWeight: 500 }}>{it.name}</div>
                    {it.location && <div style={styles.tdSub}>Ubicación: {it.location}</div>}
                  </td>
                  <td style={{ ...styles.td, color: "#8B92A3", fontSize: 12 }}>{it.category}</td>
                  <td style={{ ...styles.td, ...styles.tdNum, fontWeight: 600, color: status === "ok" ? "#E8E9ED" : status === "bajo" ? "#F5C26B" : "#F09595" }}>
                    {fmtQty(s.stock)} <span style={{ color: "#68707D", fontWeight: 400 }}>{it.unit}</span>
                  </td>
                  <td style={styles.td}>{it.active === false ? <span style={{ ...styles.chip, ...styles.chipMuted }}>De baja</span> : <StatusChip status={status} />}</td>
                  <td style={{ ...styles.td, ...styles.tdNum, color: "#8B92A3" }}>{fmtQty(it.minStock || 0)}</td>
                  <td style={{ ...styles.td, ...styles.tdNum }}>{s.avgCost ? fmtMoney(s.avgCost) : "—"}</td>
                  <td style={{ ...styles.td, ...styles.tdNum }}>{s.value ? fmtMoney(s.value) : "—"}</td>
                  <td style={styles.td}>
                    <div style={styles.rowActions}>
                      {canEdit && it.active !== false && (
                        <>
                          <button style={styles.miniBtn} onClick={() => setMoveModal({ item: it, type: "entrada" })} title="Registrar entrada (compra o recepción)">
                            <ArrowDownToLine size={12} color="#4ADE80" />
                            Entrada
                          </button>
                          <button style={styles.miniBtn} onClick={() => setMoveModal({ item: it, type: "salida" })} title="Registrar salida manual">
                            <ArrowUpFromLine size={12} color="#F5A623" />
                            Salida
                          </button>
                        </>
                      )}
                      <button style={styles.miniBtn} onClick={() => setKardexItem(it)} title="Ver kardex (historial de movimientos)">
                        <History size={12} />
                      </button>
                      {canEdit && (
                        <button style={styles.miniBtn} onClick={() => setItemModal({ item: it })} title="Editar insumo">
                          <Pencil size={12} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div style={styles.sectionCard}>
        <div style={{ ...styles.sectionTitle, justifyContent: "space-between" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <History size={13} />
            Últimos movimientos
          </span>
          {movements.length > 0 && (
            <button style={styles.miniBtn} onClick={exportMovesCsv}>
              <FileSpreadsheet size={12} />
              Exportar todos
            </button>
          )}
        </div>
        {recentMoves.length === 0 ? (
          <div style={styles.lockedHint}>Todavía no hay movimientos de inventario.</div>
        ) : (
          <div style={styles.logList}>
            {recentMoves.map((m) => (
              <MoveRow key={m.id} m={m} item={itemsById[m.itemId]} />
            ))}
          </div>
        )}
      </div>

      {itemModal && (
        <ItemModal
          item={itemModal.item}
          items={items}
          session={session}
          notify={notify}
          onClose={() => setItemModal(null)}
        />
      )}
      {moveModal && (
        <MovementModal
          item={moveModal.item}
          initialType={moveModal.type}
          stockInfo={stockMap.get(moveModal.item.id) || { stock: 0, avgCost: 0 }}
          drones={drones}
          session={session}
          perms={perms}
          notify={notify}
          onClose={() => setMoveModal(null)}
        />
      )}
      {kardexItem && (
        <KardexModal
          item={kardexItem}
          movements={movements.filter((m) => m.itemId === kardexItem.id)}
          stockInfo={stockMap.get(kardexItem.id) || { stock: 0, avgCost: 0 }}
          canEdit={canEdit && kardexItem.active !== false}
          onAdjust={() => {
            setMoveModal({ item: kardexItem, type: "ajuste" });
            setKardexItem(null);
          }}
          onClose={() => setKardexItem(null)}
        />
      )}
    </div>
  );
}

export function Kpi({ icon: Icon, label, value, sub, valueColor, onClick, children }) {
  return (
    <div style={{ ...styles.kpiCard, cursor: onClick ? "pointer" : "default" }} onClick={onClick}>
      <div style={{ ...styles.kpiLabel, display: "flex", alignItems: "center", gap: 6 }}>
        {Icon && <Icon size={12} color="#D4AF37" />}
        {label}
      </div>
      <div className="truac-kpi-value" style={{ ...styles.kpiValue, color: valueColor || "#E8E9ED" }}>{value}</div>
      {sub && <div style={styles.kpiSub}>{sub}</div>}
      {children}
    </div>
  );
}

function MoveRow({ m, item, showItem = true, balance }) {
  const meta = MOVE_LABELS[m.type] || MOVE_LABELS.ajuste;
  const Icon = meta.icon;
  const qty = m.type === "salida" ? -Math.abs(m.quantity) : Number(m.quantity);
  return (
    <div style={{ ...styles.logRow, alignItems: "center" }}>
      <span style={{ ...styles.chip, ...meta.style, minWidth: 84, justifyContent: "center" }}>
        <Icon size={11} />
        {meta.label}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={styles.checklistLabel}>
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", color: qty < 0 ? "#F5C26B" : "#9EE8B8" }}>
            {qty > 0 ? "+" : ""}
            {fmtQty(qty)} {item?.unit || ""}
          </span>
          {showItem && <> · {item?.name || m.itemName}</>}
          {m.droneName && <span style={{ color: "#8B92A3" }}> · dron {m.droneName}</span>}
        </div>
        <div style={styles.historyMeta}>
          {fmtWhen(m.date)} · {m.by}
          {m.unitCost ? ` · ${fmtMoney(m.unitCost)} c/u` : ""}
          {m.provider ? ` · ${m.provider}` : ""}
          {m.soporte ? ` · soporte ${m.soporte}` : ""}
          {m.note ? ` · ${m.note}` : ""}
        </div>
      </div>
      {balance !== undefined && (
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: "#8B92A3", whiteSpace: "nowrap" }}>saldo {fmtQty(balance)}</div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Crear / editar insumo
// ---------------------------------------------------------------------------

function ItemModal({ item, items, session, notify, onClose }) {
  const editing = !!item;
  const [name, setName] = useState(item?.name || "");
  const [cat, setCat] = useState(item?.category || INSUMO_CATEGORIES[0]);
  const [unit, setUnit] = useState(item?.unit || "u");
  const [minStock, setMinStock] = useState(String(item?.minStock ?? "2"));
  const [location, setLocation] = useState(item?.location || "");
  const [initialQty, setInitialQty] = useState("");
  const [initialCost, setInitialCost] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit() {
    const n = name.trim();
    if (!n) return notify("error", "Escribe el nombre del insumo.");
    const dup = items.find((it) => it.id !== item?.id && it.name.trim().toLowerCase() === n.toLowerCase());
    if (dup) return notify("error", `Ya existe un insumo llamado "${dup.name}".`);
    if (Number(minStock) < 0) return notify("error", "El stock mínimo no puede ser negativo.");
    setSaving(true);
    try {
      if (editing) {
        await updateItem(item.id, { name: n, category: cat, unit: unit.trim() || "u", minStock: Number(minStock) || 0, location: location.trim() });
        notify("success", "Insumo actualizado.");
      } else {
        const now = new Date().toISOString();
        const newItem = {
          id: uid(),
          name: n,
          category: cat,
          unit: unit.trim() || "u",
          minStock: Number(minStock) || 0,
          location: location.trim(),
          active: true,
          createdAt: now,
          createdBy: session.name,
        };
        await saveItem(newItem);
        if (Number(initialQty) > 0) {
          await saveMovement({
            id: uid(),
            itemId: newItem.id,
            itemName: newItem.name,
            type: "entrada",
            quantity: Number(initialQty),
            unitCost: Number(initialCost) || 0,
            date: now,
            by: session.name,
            note: "Inventario inicial",
          });
        }
        notify("success", `${n} agregado al inventario.`);
      }
      onClose();
    } catch {
      notify("error", "No se pudo guardar. Revisa tu conexión y las reglas de Firestore.");
      setSaving(false);
    }
  }

  async function toggleArchive() {
    setSaving(true);
    try {
      await updateItem(item.id, { active: item.active === false });
      notify("success", item.active === false ? "Insumo reactivado." : "Insumo dado de baja. Su historial se conserva.");
      onClose();
    } catch {
      notify("error", "No se pudo guardar el cambio.");
      setSaving(false);
    }
  }

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modalWide} onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <span style={styles.modalTitle}>{editing ? "Editar insumo" : "Nuevo insumo"}</span>
          <button style={styles.iconButton} onClick={onClose}>
            <X size={16} />
          </button>
        </div>
        <div style={styles.formField}>
          <label style={styles.formLabel}>Nombre *</label>
          <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Hélice 9453 Mavic 3" style={styles.formInput} />
        </div>
        <div style={styles.formField}>
          <label style={styles.formLabel}>Categoría</label>
          <select value={cat} onChange={(e) => setCat(e.target.value)} style={styles.formInput}>
            {INSUMO_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div style={styles.formRow}>
          <div style={styles.formField}>
            <label style={styles.formLabel}>Unidad</label>
            <input list="truac-units" value={unit} onChange={(e) => setUnit(e.target.value)} style={styles.formInput} />
            <datalist id="truac-units">
              {INSUMO_UNITS.map((u) => (
                <option key={u} value={u} />
              ))}
            </datalist>
          </div>
          <div style={styles.formField}>
            <label style={styles.formLabel}>Stock mínimo (alerta)</label>
            <input type="number" min="0" step="1" value={minStock} onChange={(e) => setMinStock(e.target.value)} style={styles.formInput} />
          </div>
        </div>
        <div style={styles.formField}>
          <label style={styles.formLabel}>Ubicación en el almacén (opcional)</label>
          <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Ej: Estante B, gaveta 3" style={styles.formInput} />
        </div>
        {!editing && (
          <div style={styles.formRow}>
            <div style={styles.formField}>
              <label style={styles.formLabel}>Stock inicial</label>
              <input type="number" min="0" step="1" value={initialQty} onChange={(e) => setInitialQty(e.target.value)} placeholder="0" style={styles.formInput} />
            </div>
            <div style={styles.formField}>
              <label style={styles.formLabel}>Costo unitario (COP)</label>
              <input type="number" min="0" step="100" value={initialCost} onChange={(e) => setInitialCost(e.target.value)} placeholder="0" style={styles.formInput} />
            </div>
          </div>
        )}
        {editing && (
          <div style={styles.infoBox}>Para corregir la cantidad en stock usa «Ajuste por conteo» desde el kardex; así queda el registro de quién y por qué.</div>
        )}
        <div style={styles.formFooter}>
          {editing ? (
            <button style={styles.deleteLink} onClick={toggleArchive} disabled={saving}>
              <Archive size={12} />
              {item.active === false ? "Reactivar insumo" : "Dar de baja"}
            </button>
          ) : (
            <span style={styles.formHint}>El stock inicial no se cuenta como gasto.</span>
          )}
          <button style={{ ...styles.newButton, opacity: saving ? 0.6 : 1 }} onClick={submit} disabled={saving}>
            {editing ? "Guardar cambios" : (
              <>
                <Plus size={15} />
                Crear insumo
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Entrada / salida / ajuste
// ---------------------------------------------------------------------------

function MovementModal({ item, initialType, stockInfo, drones, session, perms, notify, onClose }) {
  const [type, setType] = useState(initialType);
  const [qty, setQty] = useState("");
  const [unitCost, setUnitCost] = useState(stockInfo.avgCost ? String(Math.round(stockInfo.avgCost)) : "");
  const [provider, setProvider] = useState("");
  const [soporte, setSoporte] = useState("");
  const [day, setDay] = useState(todayInput());
  const [droneId, setDroneId] = useState("");
  const [note, setNote] = useState("");
  const [asExpense, setAsExpense] = useState(perms.canManageExpenses);
  const [saving, setSaving] = useState(false);

  const n = Number(qty) || 0;
  const activeDrones = drones.filter((d) => !(d.dispatches || []).some((x) => !x.returnDate));
  const diff = type === "ajuste" ? Math.round((n - stockInfo.stock) * 100) / 100 : 0;
  const total = n * (Number(unitCost) || 0);

  async function submit() {
    if (type !== "ajuste" && n <= 0) return notify("error", "La cantidad debe ser mayor a 0.");
    if (type === "ajuste" && qty === "") return notify("error", "Escribe la cantidad real que contaste.");
    if (type === "ajuste" && diff === 0) return notify("info", "El conteo coincide con el sistema, no hay nada que ajustar.");
    if (type === "ajuste" && !note.trim()) return notify("error", "Explica el motivo del ajuste (ej: conteo físico, daño, pérdida).");
    if (type === "salida" && n > stockInfo.stock) return notify("error", `Solo hay ${fmtQty(stockInfo.stock)} ${item.unit} en stock.`);

    const date = dayToIso(day);
    const drone = drones.find((d) => d.id === droneId);
    const movement = {
      id: uid(),
      itemId: item.id,
      itemName: item.name,
      type,
      quantity: type === "ajuste" ? diff : n,
      unitCost: type === "entrada" ? Number(unitCost) || 0 : Math.round(stockInfo.avgCost || 0),
      date,
      by: session.name,
      ...(type === "entrada" && provider.trim() ? { provider: provider.trim() } : {}),
      ...(type === "entrada" && soporte.trim() ? { soporte: soporte.trim() } : {}),
      ...(type === "salida" && drone ? { droneId: drone.id, droneName: drone.name } : {}),
      ...(note.trim() ? { note: note.trim() } : {}),
    };

    setSaving(true);
    try {
      await saveMovement(movement);
      if (type === "entrada" && asExpense && total > 0) {
        await saveExpense({
          id: uid(),
          date: day,
          concept: `Compra: ${fmtQty(n)} ${item.unit} de ${item.name}`,
          category: PURCHASE_EXPENSE_CATEGORY,
          amount: Math.round(total),
          provider: provider.trim(),
          soporte: soporte.trim(),
          by: session.name,
          createdAt: new Date().toISOString(),
          movementId: movement.id,
        });
      }
      notify(
        "success",
        type === "entrada"
          ? `Entrada registrada${asExpense && total > 0 ? " y cargada a gastos" : ""}.`
          : type === "salida"
          ? "Salida registrada."
          : "Ajuste registrado."
      );
      onClose();
    } catch {
      notify("error", "No se pudo guardar. Revisa tu conexión y las reglas de Firestore.");
      setSaving(false);
    }
  }

  const TYPES = [
    { id: "entrada", label: "Entrada", icon: ArrowDownToLine },
    { id: "salida", label: "Salida", icon: ArrowUpFromLine },
    { id: "ajuste", label: "Ajuste por conteo", icon: SlidersHorizontal },
  ];

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modalWide} onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <div>
            <div style={styles.modalTitle}>{item.name}</div>
            <div style={styles.panelModel}>
              En stock: {fmtQty(stockInfo.stock)} {item.unit}
              {stockInfo.avgCost ? ` · costo prom. ${fmtMoney(stockInfo.avgCost)}` : ""}
            </div>
          </div>
          <button style={styles.iconButton} onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div style={styles.segmented}>
          {TYPES.map((t) => {
            const Icon = t.icon;
            const on = type === t.id;
            return (
              <button key={t.id} style={{ ...styles.toggleBtn, ...(on ? styles.toggleBtnOn : {}), flex: 1, justifyContent: "center" }} onClick={() => setType(t.id)}>
                <Icon size={12} />
                {t.label}
              </button>
            );
          })}
        </div>

        <div style={styles.formRow}>
          <div style={styles.formField}>
            <label style={styles.formLabel}>{type === "ajuste" ? "Cantidad real contada *" : `Cantidad (${item.unit}) *`}</label>
            <input autoFocus type="number" min="0" step="1" value={qty} onChange={(e) => setQty(e.target.value)} style={styles.formInput} />
          </div>
          {type === "entrada" ? (
            <div style={styles.formField}>
              <label style={styles.formLabel}>Costo unitario (COP)</label>
              <input type="number" min="0" step="100" value={unitCost} onChange={(e) => setUnitCost(e.target.value)} placeholder="0" style={styles.formInput} />
            </div>
          ) : (
            <div style={styles.formField}>
              <label style={styles.formLabel}>Fecha</label>
              <input type="date" value={day} max={todayInput()} onChange={(e) => setDay(e.target.value)} style={styles.formInput} />
            </div>
          )}
        </div>

        {type === "entrada" && (
          <>
            <div style={styles.formRow}>
              <div style={styles.formField}>
                <label style={styles.formLabel}>Proveedor</label>
                <input value={provider} onChange={(e) => setProvider(e.target.value)} placeholder="Opcional" style={styles.formInput} />
              </div>
              <div style={styles.formField}>
                <label style={styles.formLabel}>Soporte (factura / remisión / oficio)</label>
                <input value={soporte} onChange={(e) => setSoporte(e.target.value)} placeholder="Opcional" style={styles.formInput} />
              </div>
            </div>
            <div style={styles.formField}>
              <label style={styles.formLabel}>Fecha</label>
              <input type="date" value={day} max={todayInput()} onChange={(e) => setDay(e.target.value)} style={styles.formInput} />
            </div>
            {perms.canManageExpenses && (
              <label style={styles.checkRow}>
                <input type="checkbox" checked={asExpense} onChange={(e) => setAsExpense(e.target.checked)} style={{ marginTop: 2 }} />
                <span>
                  Registrar también como gasto
                  <span style={{ color: "#8B92A3" }}>{total > 0 ? ` (${fmtMoney(total)} en «${PURCHASE_EXPENSE_CATEGORY}»)` : " (necesita costo unitario)"}</span>
                </span>
              </label>
            )}
          </>
        )}

        {type === "salida" && (
          <>
            <div style={styles.formField}>
              <label style={styles.formLabel}>¿Para qué dron? (opcional)</label>
              <select value={droneId} onChange={(e) => setDroneId(e.target.value)} style={styles.formInput}>
                <option value="">Uso general del taller</option>
                {activeDrones.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} — {d.model}
                  </option>
                ))}
              </select>
            </div>
            <div style={styles.infoBox}>Si es para un dron, es mejor registrarlo desde el panel del dron («Insumos usados»): así queda también en su historial.</div>
          </>
        )}

        {type === "ajuste" && qty !== "" && (
          <div style={diff === 0 ? styles.infoBox : styles.warnBox}>
            {diff === 0
              ? "El conteo coincide con el sistema."
              : `El sistema tiene ${fmtQty(stockInfo.stock)}. Se registrará un ajuste de ${diff > 0 ? "+" : ""}${fmtQty(diff)} ${item.unit}.`}
          </div>
        )}

        <div style={styles.formField}>
          <label style={styles.formLabel}>{type === "ajuste" ? "Motivo del ajuste *" : "Nota (opcional)"}</label>
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder={type === "ajuste" ? "Ej: conteo físico mensual" : ""} style={styles.formInput} />
        </div>

        <div style={styles.formFooter}>
          <span style={styles.formHint}>Registrado por {session.name}</span>
          <button style={{ ...styles.newButton, opacity: saving ? 0.6 : 1 }} onClick={submit} disabled={saving}>
            Registrar {type === "ajuste" ? "ajuste" : type}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Kardex
// ---------------------------------------------------------------------------

function KardexModal({ item, movements, stockInfo, canEdit, onAdjust, onClose }) {
  const sorted = movements.slice().sort((a, b) => new Date(a.date) - new Date(b.date));
  let running = 0;
  const withBalance = sorted.map((m) => {
    running += m.type === "salida" ? -Math.abs(m.quantity) : Number(m.quantity) || 0;
    return { m, balance: running };
  });
  withBalance.reverse();

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modalXL} onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <div>
            <div style={styles.modalTitle}>Kardex · {item.name}</div>
            <div style={styles.panelModel}>
              {item.category} · stock actual {fmtQty(stockInfo.stock)} {item.unit}
              {stockInfo.avgCost ? ` · costo prom. ${fmtMoney(stockInfo.avgCost)}` : ""}
            </div>
          </div>
          <button style={styles.iconButton} onClick={onClose}>
            <X size={16} />
          </button>
        </div>
        {canEdit && (
          <button style={{ ...styles.outlineBtn, marginBottom: 14 }} onClick={onAdjust}>
            <SlidersHorizontal size={13} />
            Ajuste por conteo físico
          </button>
        )}
        {withBalance.length === 0 ? (
          <div style={styles.lockedHint}>Este insumo todavía no tiene movimientos.</div>
        ) : (
          <div style={{ ...styles.logList, maxHeight: "60vh", overflowY: "auto" }}>
            {withBalance.map(({ m, balance }) => (
              <MoveRow key={m.id} m={m} item={item} showItem={false} balance={balance} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
