import React, { useMemo, useState } from "react";
import {
  Plus,
  X,
  Search,
  Wallet,
  TrendingUp,
  PiggyBank,
  CalendarDays,
  FileSpreadsheet,
  Pencil,
  Trash2,
  Lock,
  BarChart3,
  Plane,
  Receipt,
} from "lucide-react";
import { styles } from "./styles.js";
import { EXPENSE_CATEGORIES } from "./catalogos.js";
import { Kpi } from "./Insumos.jsx";
import {
  uid,
  fmtMoney,
  fmtCompact,
  saveExpense,
  deleteExpense,
  saveBudget,
  droneCost,
  todayInput,
  parseDay,
  fmtDay,
  MONTHS,
  downloadCsv,
} from "./data.js";

export default function GastosTab({ gastos, insumos, drones, session, perms, notify }) {
  const thisYear = new Date().getFullYear();
  const thisMonth = new Date().getMonth();
  const [year, setYear] = useState(thisYear);
  const [month, setMonth] = useState("");
  const [category, setCategory] = useState("");
  const [query, setQuery] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [editingBudget, setEditingBudget] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const loading = gastos === null;
  const expenses = gastos?.expenses || [];
  const budgets = gastos?.budgets || {};
  const movements = insumos?.movements || [];
  const canEdit = perms.canManageExpenses;

  const years = useMemo(() => {
    const set = new Set([thisYear, thisYear + 1]);
    expenses.forEach((e) => {
      const d = parseDay(e.date);
      if (d) set.add(d.getFullYear());
    });
    Object.keys(budgets).forEach((y) => set.add(Number(y)));
    return Array.from(set).sort((a, b) => b - a);
  }, [expenses, budgets, thisYear]);

  const yearExpenses = expenses.filter((e) => parseDay(e.date)?.getFullYear() === year);
  const executed = yearExpenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const budget = Number(budgets[String(year)]) || 0;
  const pct = budget > 0 ? (executed / budget) * 100 : 0;
  const available = budget - executed;

  const byMonth = MONTHS.map((_, i) =>
    yearExpenses.filter((e) => parseDay(e.date).getMonth() === i).reduce((s, e) => s + (Number(e.amount) || 0), 0)
  );
  const maxMonth = Math.max(...byMonth, 1);
  const monthsElapsed = year === thisYear ? thisMonth + 1 : year < thisYear ? 12 : 0;
  const monthlyAvg = monthsElapsed ? executed / monthsElapsed : 0;

  const byCategory = EXPENSE_CATEGORIES.map((c) => ({
    label: c,
    total: yearExpenses.filter((e) => e.category === c).reduce((s, e) => s + (Number(e.amount) || 0), 0),
    count: yearExpenses.filter((e) => e.category === c).length,
  }))
    .concat(
      // categorías antiguas que ya no estén en la lista
      Array.from(new Set(yearExpenses.map((e) => e.category).filter((c) => c && !EXPENSE_CATEGORIES.includes(c)))).map((c) => ({
        label: c,
        total: yearExpenses.filter((e) => e.category === c).reduce((s, e) => s + (Number(e.amount) || 0), 0),
        count: yearExpenses.filter((e) => e.category === c).length,
      }))
    )
    .filter((c) => c.total > 0)
    .sort((a, b) => b.total - a.total);

  const droneCosts = drones
    .map((d) => ({ drone: d, ...droneCost(d.id, movements, expenses) }))
    .filter((x) => x.total > 0)
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);

  const q = query.trim().toLowerCase();
  const filtered = yearExpenses
    .filter((e) => month === "" || parseDay(e.date).getMonth() === Number(month))
    .filter((e) => !category || e.category === category)
    .filter(
      (e) =>
        !q ||
        [e.concept, e.provider, e.soporte, e.droneName, e.by].some((v) => (v || "").toLowerCase().includes(q))
    )
    .sort((a, b) => parseDay(b.date) - parseDay(a.date) || (b.createdAt || "").localeCompare(a.createdAt || ""));
  const filteredTotal = filtered.reduce((s, e) => s + (Number(e.amount) || 0), 0);

  const barColor = pct > 100 ? "#E05252" : pct >= 85 ? "#F5A623" : "#C9A227";

  function exportCsv() {
    downloadCsv(
      `TRUAC-gastos-${year}${month !== "" ? "-" + String(Number(month) + 1).padStart(2, "0") : ""}.csv`,
      ["Fecha", "Concepto", "Categoría", "Valor", "Proveedor", "Soporte", "Dron", "Registrado por"],
      filtered
        .slice()
        .reverse()
        .map((e) => [e.date, e.concept, e.category, Number(e.amount) || 0, e.provider || "", e.soporte || "", e.droneName || "", e.by])
    );
  }

  async function removeExpense(id) {
    try {
      await deleteExpense(id);
      notify("success", "Gasto eliminado.");
    } catch {
      notify("error", "No se pudo eliminar el gasto.");
    }
    setConfirmDelete(null);
  }

  return (
    <div>
      <div style={styles.pageHead}>
        <div>
          <div style={styles.pageTitle}>Control de gastos</div>
          <div style={styles.pageSub}>Presupuesto de la vigencia, ejecución mes a mes y costo de cada reparación.</div>
        </div>
        <div style={styles.pageActions}>
          {!canEdit && (
            <span style={styles.readOnlyNote}>
              <Lock size={12} /> Solo lectura
            </span>
          )}
          <select value={year} onChange={(e) => { setYear(Number(e.target.value)); setMonth(""); }} style={styles.toolbarInput} title="Vigencia">
            {years.map((y) => (
              <option key={y} value={y}>
                Vigencia {y}
              </option>
            ))}
          </select>
          {canEdit && (
            <button style={styles.newButton} onClick={() => setShowNew(true)}>
              <Plus size={15} />
              Nuevo gasto
            </button>
          )}
        </div>
      </div>

      <div style={styles.kpiGrid}>
        <Kpi icon={PiggyBank} label={`Presupuesto ${year}`} value={budget ? fmtMoney(budget) : "Sin definir"} valueColor={budget ? undefined : "#68707D"}>
          {editingBudget ? (
            <BudgetEditor
              initial={budget}
              onCancel={() => setEditingBudget(false)}
              onSave={async (v) => {
                try {
                  await saveBudget(year, v);
                  notify("success", `Presupuesto ${year} actualizado.`);
                } catch {
                  notify("error", "No se pudo guardar el presupuesto.");
                }
                setEditingBudget(false);
              }}
            />
          ) : canEdit ? (
            <button style={{ ...styles.linkBtn, paddingTop: 6 }} onClick={() => setEditingBudget(true)}>
              <Pencil size={11} />
              {budget ? "Cambiar presupuesto" : "Definir presupuesto"}
            </button>
          ) : (
            <div style={styles.kpiSub}>Lo fija el jefe de taller o el administrador</div>
          )}
        </Kpi>
        <Kpi icon={Wallet} label="Ejecutado" value={fmtMoney(executed)} sub={budget ? `${pct.toFixed(1)}% del presupuesto` : `${yearExpenses.length} gastos registrados`}>
          {budget > 0 && (
            <div style={styles.progressTrack}>
              <div style={{ height: "100%", width: `${Math.min(pct, 100)}%`, background: barColor, borderRadius: 3 }} />
            </div>
          )}
        </Kpi>
        <Kpi
          icon={TrendingUp}
          label="Disponible"
          value={budget ? fmtMoney(available) : "—"}
          valueColor={budget && available < 0 ? "#F09595" : budget ? "#9EE8B8" : "#68707D"}
          sub={budget ? (available < 0 ? "Presupuesto sobregirado" : "Por ejecutar en la vigencia") : "Define el presupuesto para verlo"}
        />
        <Kpi
          icon={CalendarDays}
          label={year === thisYear ? `Gasto de ${MONTHS[thisMonth].toLowerCase()}` : "Promedio mensual"}
          value={fmtMoney(year === thisYear ? byMonth[thisMonth] : monthlyAvg)}
          sub={year === thisYear && monthsElapsed ? `Promedio mensual: ${fmtMoney(monthlyAvg)}` : `${yearExpenses.length} gastos en ${year}`}
        />
      </div>

      <div style={styles.twoCol}>
        <div style={styles.sectionCard}>
          <div style={styles.sectionTitle}>
            <BarChart3 size={13} />
            Gasto por mes · {year}
          </div>
          <div style={styles.monthChart}>
            {byMonth.map((v, i) => {
              const active = month !== "" && Number(month) === i;
              return (
                <div
                  key={i}
                  style={{ ...styles.monthCol, cursor: "pointer" }}
                  title={`${MONTHS[i]}: ${fmtMoney(v)} — clic para filtrar`}
                  onClick={() => setMonth(active ? "" : String(i))}
                >
                  {v > 0 && <div style={{ fontSize: 9.5, color: "#8B92A3", fontFamily: "'IBM Plex Mono', monospace", whiteSpace: "nowrap" }}>{fmtCompact(v)}</div>}
                  <div
                    style={{
                      ...styles.monthBar,
                      height: `${(v / maxMonth) * 78}%`,
                      opacity: month === "" || active ? 1 : 0.35,
                      background: v === 0 ? "#1E3350" : styles.monthBar.background,
                    }}
                  />
                  <div style={{ ...styles.monthLabel, color: active ? "#D4AF37" : year === thisYear && i === thisMonth ? "#E8E9ED" : "#8B92A3" }}>{MONTHS[i]}</div>
                </div>
              );
            })}
          </div>
          <div style={{ ...styles.formHint, marginTop: 10 }}>Haz clic en un mes para filtrar la lista de abajo.</div>
        </div>

        <div style={styles.sectionCard}>
          <div style={styles.sectionTitle}>
            <Receipt size={13} />
            Por categoría · {year}
          </div>
          {byCategory.length === 0 ? (
            <div style={styles.lockedHint}>Sin gastos registrados en {year}.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {byCategory.map((c) => (
                <div key={c.label} style={{ cursor: "pointer" }} onClick={() => setCategory(category === c.label ? "" : c.label)}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8, fontSize: 12.5, marginBottom: 5 }}>
                    <span style={{ color: category === c.label ? "#D4AF37" : "#E8E9ED" }}>{c.label}</span>
                    <span style={{ fontFamily: "'IBM Plex Mono', monospace", color: "#8B92A3", whiteSpace: "nowrap" }}>
                      {fmtMoney(c.total)} · {executed ? Math.round((c.total / executed) * 100) : 0}%
                    </span>
                  </div>
                  <div style={styles.analyticsBarTrack}>
                    <div style={{ ...styles.analyticsBarFill, width: `${(c.total / byCategory[0].total) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={styles.sectionCard}>
        <div style={styles.sectionTitle}>
          <Plane size={13} />
          Costo por dron (acumulado)
        </div>
        {droneCosts.length === 0 ? (
          <div style={styles.lockedHint}>
            Aparece cuando hay insumos del inventario usados en drones o gastos asociados a un dron.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ ...styles.table, minWidth: 560 }}>
              <thead>
                <tr>
                  <th style={styles.th}>Dron</th>
                  <th style={{ ...styles.th, ...styles.thNum }}>Insumos usados</th>
                  <th style={{ ...styles.th, ...styles.thNum }}>Gastos directos</th>
                  <th style={{ ...styles.th, ...styles.thNum }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {droneCosts.map((x) => (
                  <tr key={x.drone.id}>
                    <td style={styles.td}>
                      <div style={{ fontWeight: 500 }}>{x.drone.name}</div>
                      <div style={styles.tdSub}>{x.drone.model}</div>
                    </td>
                    <td style={{ ...styles.td, ...styles.tdNum }}>{fmtMoney(x.insumos)}</td>
                    <td style={{ ...styles.td, ...styles.tdNum }}>{fmtMoney(x.gastos)}</td>
                    <td style={{ ...styles.td, ...styles.tdNum, color: "#D4AF37", fontWeight: 600 }}>{fmtMoney(x.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div style={styles.toolbar}>
        <div style={{ position: "relative", flex: "1 1 220px", maxWidth: 340 }}>
          <Search size={13} color="#68707D" style={{ position: "absolute", left: 10, top: 9 }} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar concepto, proveedor, soporte…" style={{ ...styles.toolbarInput, width: "100%", paddingLeft: 30 }} />
        </div>
        <select value={month} onChange={(e) => setMonth(e.target.value)} style={styles.toolbarInput}>
          <option value="">Todo {year}</option>
          {MONTHS.map((m, i) => (
            <option key={m} value={i}>
              {m} {year}
            </option>
          ))}
        </select>
        <select value={category} onChange={(e) => setCategory(e.target.value)} style={styles.toolbarInput}>
          <option value="">Todas las categorías</option>
          {EXPENSE_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <button style={styles.outlineBtn} onClick={exportCsv} disabled={filtered.length === 0} title="Descargar la lista filtrada para Excel">
          <FileSpreadsheet size={14} />
          Exportar
        </button>
      </div>

      <div style={styles.tableWrap}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Fecha</th>
              <th style={styles.th}>Concepto</th>
              <th style={styles.th}>Categoría</th>
              <th style={styles.th}>Proveedor</th>
              <th style={styles.th}>Dron</th>
              <th style={{ ...styles.th, ...styles.thNum }}>Valor</th>
              {perms.canDelete && <th style={styles.th} />}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={7} style={styles.tableEmpty}>
                  Cargando gastos…
                </td>
              </tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={7} style={styles.tableEmpty}>
                  {yearExpenses.length === 0 ? `No hay gastos registrados en ${year}.` : "Ningún gasto coincide con los filtros."}
                </td>
              </tr>
            )}
            {filtered.map((e) => (
              <tr key={e.id}>
                <td style={{ ...styles.td, whiteSpace: "nowrap", fontFamily: "'IBM Plex Mono', monospace", fontSize: 12 }}>{fmtDay(e.date)}</td>
                <td style={styles.td}>
                  <div>{e.concept}</div>
                  <div style={styles.tdSub}>
                    {e.soporte ? `Soporte ${e.soporte} · ` : ""}por {e.by}
                    {e.movementId ? " · desde inventario" : ""}
                  </div>
                </td>
                <td style={{ ...styles.td, color: "#8B92A3", fontSize: 12 }}>{e.category}</td>
                <td style={{ ...styles.td, color: "#8B92A3", fontSize: 12 }}>{e.provider || "—"}</td>
                <td style={{ ...styles.td, fontSize: 12 }}>{e.droneName || <span style={{ color: "#565C68" }}>—</span>}</td>
                <td style={{ ...styles.td, ...styles.tdNum, fontWeight: 600 }}>{fmtMoney(e.amount)}</td>
                {perms.canDelete && (
                  <td style={{ ...styles.td, width: 1 }}>
                    {confirmDelete === e.id ? (
                      <div style={styles.rowActions}>
                        <button style={styles.dangerBtn} onClick={() => removeExpense(e.id)}>
                          Eliminar
                        </button>
                        <button style={styles.miniBtn} onClick={() => setConfirmDelete(null)}>
                          No
                        </button>
                      </div>
                    ) : (
                      <button style={styles.logDeleteBtn} onClick={() => setConfirmDelete(e.id)} title="Eliminar gasto">
                        <Trash2 size={13} />
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
          {filtered.length > 0 && (
            <tfoot>
              <tr>
                <td colSpan={5} style={{ ...styles.td, borderBottom: "none", color: "#8B92A3", fontSize: 12 }}>
                  {filtered.length} {filtered.length === 1 ? "gasto" : "gastos"}
                  {month !== "" || category || q ? " (filtrado)" : ""}
                </td>
                <td style={{ ...styles.td, ...styles.tdNum, borderBottom: "none", color: "#D4AF37", fontWeight: 600 }}>{fmtMoney(filteredTotal)}</td>
                {perms.canDelete && <td style={{ ...styles.td, borderBottom: "none" }} />}
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {showNew && <ExpenseModal drones={drones} session={session} notify={notify} onClose={() => setShowNew(false)} />}
    </div>
  );
}

function BudgetEditor({ initial, onSave, onCancel }) {
  const [value, setValue] = useState(initial ? String(initial) : "");
  return (
    <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
      <input
        autoFocus
        type="number"
        min="0"
        step="100000"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && onSave(value)}
        placeholder="Valor en COP"
        style={{ ...styles.formInput, padding: "6px 8px", fontSize: 12 }}
      />
      <button style={styles.ghostBtn} onClick={() => onSave(value)}>
        OK
      </button>
      <button style={styles.ghostBtn} onClick={onCancel}>
        <X size={11} />
      </button>
    </div>
  );
}

function ExpenseModal({ drones, session, notify, onClose }) {
  const [day, setDay] = useState(todayInput());
  const [concept, setConcept] = useState("");
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [amount, setAmount] = useState("");
  const [provider, setProvider] = useState("");
  const [soporte, setSoporte] = useState("");
  const [droneId, setDroneId] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (!concept.trim()) return notify("error", "Escribe el concepto del gasto.");
    if (!(Number(amount) > 0)) return notify("error", "El valor debe ser mayor a 0.");
    if (!day) return notify("error", "Elige la fecha del gasto.");
    const drone = drones.find((d) => d.id === droneId);
    setSaving(true);
    try {
      await saveExpense({
        id: uid(),
        date: day,
        concept: concept.trim(),
        category,
        amount: Math.round(Number(amount)),
        provider: provider.trim(),
        soporte: soporte.trim(),
        ...(drone ? { droneId: drone.id, droneName: drone.name } : {}),
        by: session.name,
        createdAt: new Date().toISOString(),
      });
      notify("success", `Gasto de ${fmtMoney(amount)} registrado.`);
      onClose();
    } catch {
      notify("error", "No se pudo guardar. Revisa tu conexión y las reglas de Firestore.");
      setSaving(false);
    }
  }

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modalWide} onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <span style={styles.modalTitle}>Nuevo gasto</span>
          <button style={styles.iconButton} onClick={onClose}>
            <X size={16} />
          </button>
        </div>
        <div style={styles.formField}>
          <label style={styles.formLabel}>Concepto *</label>
          <input autoFocus value={concept} onChange={(e) => setConcept(e.target.value)} placeholder="Ej: Reparación de placa controladora en laboratorio externo" style={styles.formInput} />
        </div>
        <div style={styles.formRow}>
          <div style={styles.formField}>
            <label style={styles.formLabel}>Valor (COP) *</label>
            <input type="number" min="0" step="1000" value={amount} onChange={(e) => setAmount(e.target.value)} style={styles.formInput} />
            {Number(amount) > 0 && <div style={{ ...styles.formHint, marginTop: 4, color: "#8B92A3" }}>{fmtMoney(amount)}</div>}
          </div>
          <div style={styles.formField}>
            <label style={styles.formLabel}>Fecha *</label>
            <input type="date" value={day} onChange={(e) => setDay(e.target.value)} style={styles.formInput} />
          </div>
        </div>
        <div style={styles.formField}>
          <label style={styles.formLabel}>Categoría</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)} style={styles.formInput}>
            {EXPENSE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div style={styles.formRow}>
          <div style={styles.formField}>
            <label style={styles.formLabel}>Proveedor</label>
            <input value={provider} onChange={(e) => setProvider(e.target.value)} placeholder="Opcional" style={styles.formInput} />
          </div>
          <div style={styles.formField}>
            <label style={styles.formLabel}>Soporte (factura / oficio)</label>
            <input value={soporte} onChange={(e) => setSoporte(e.target.value)} placeholder="Opcional" style={styles.formInput} />
          </div>
        </div>
        <div style={styles.formField}>
          <label style={styles.formLabel}>Asociar a un dron (opcional)</label>
          <select value={droneId} onChange={(e) => setDroneId(e.target.value)} style={styles.formInput}>
            <option value="">Gasto general del taller</option>
            {drones.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} — {d.model}
              </option>
            ))}
          </select>
        </div>
        <div style={styles.infoBox}>Las compras de repuestos que entran al almacén regístralas mejor desde Insumos → Entrada: así suben el stock y se cargan aquí automáticamente.</div>
        <div style={styles.formFooter}>
          <span style={styles.formHint}>Registrado por {session.name}</span>
          <button style={{ ...styles.newButton, opacity: saving ? 0.6 : 1 }} onClick={submit} disabled={saving}>
            <Plus size={15} />
            Registrar gasto
          </button>
        </div>
      </div>
    </div>
  );
}
