import React, { useState, useEffect, useRef, useCallback } from "react";
import { doc, onSnapshot, setDoc, arrayUnion } from "firebase/firestore";
import { jsPDF } from "jspdf";
import { db } from "./firebase.js";
import { ROLE_PINS, ROLE_LABELS, PERMISSIONS } from "./roles.js";
import { EQUIPMENT_MODELS, OTHER_MODEL_OPTION } from "./models.js";
import { INVENTORY_SEED } from "./inventorySeed.js";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from "recharts";
import {
  Search,
  Wrench,
  CheckCircle2,
  PackageCheck,
  Plus,
  X,
  Clock,
  User,
  MessageSquare,
  ArrowRight,
  Loader2,
  AlertTriangle,
  CheckCircle,
  Info,
  BarChart3,
  Trash2,
  Radio,
  LogOut,
  ShieldCheck,
  Building2,
  UserPlus,
  ClipboardCheck,
  Square,
  CheckSquare,
  Package,
  Timer,
  Send,
  Undo2,
  FileDown,
  Boxes,
  Pencil,
  Save,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const STAGES = [
  { id: "diagnostico", label: "Diagnóstico", icon: Search, accent: "#4C8DFF", accentDim: "#1E2A47" },
  { id: "reparacion", label: "Reparación", icon: Wrench, accent: "#F5A623", accentDim: "#3B2D14" },
  { id: "pruebas", label: "Pruebas", icon: CheckCircle2, accent: "#5EC8D8", accentDim: "#173538" },
  { id: "listo", label: "Listo", icon: PackageCheck, accent: "#4ADE80", accentDim: "#173A28" },
];

const STAGE_INDEX = Object.fromEntries(STAGES.map((s, i) => [s.id, i]));

const TEST_CHECKLIST = [
  { id: "motores", label: "Motores y hélices sin daños, giran correctamente" },
  { id: "bateria", label: "Batería carga, descarga y sostiene voltaje normal" },
  { id: "gps", label: "GPS y sensores calibrados" },
  { id: "camara", label: "Cámara / gimbal estabiliza correctamente" },
  { id: "enlace", label: "Enlace de radio control y telemetría estable" },
  { id: "vuelo", label: "Vuelo de prueba completado sin fallas" },
];

const DOC_REF = () => doc(db, "taller", "flota");
const CONFIG_REF = () => doc(db, "taller", "config");
const INVENTORY_REF = () => doc(db, "taller", "inventario");
const SESSION_KEY = "taller-drones:sesion";

// Normaliza un nombre de insumo para poder comparar/agrupar sin que
// mayúsculas, tildes o espacios extra generen duplicados.
function normalizeName(name) {
  return (name || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}
function fmtDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" });
}
function fmtDateTime(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return `${d.toLocaleDateString("es-CO", { day: "2-digit", month: "short" })}, ${d.toLocaleTimeString("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}
function daysSince(iso) {
  if (!iso) return 0;
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86400000));
}
function isDispatched(drone) {
  return (drone.dispatches || []).some((x) => !x.returnDate);
}
function openDispatchOf(drone) {
  return (drone.dispatches || []).find((x) => !x.returnDate);
}

function generateDispatchPdf(drone, dispatch) {
  const doc = new jsPDF();
  const marginX = 18;
  let y = 20;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("TRUAC", marginX, y);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  y += 6;
  doc.text("Taller de Reparación de UAS y C-UAS", marginX, y);
  y += 4;
  doc.setDrawColor(180);
  doc.line(marginX, y, 192, y);
  y += 10;

  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text("Acta de salida de aeronave no tripulada (UAS)", marginX, y);
  y += 10;

  const row = (label, value) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(`${label}:`, marginX, y);
    doc.setFont("helvetica", "normal");
    doc.text(String(value || "—"), marginX + 55, y);
    y += 7;
  };

  row("Serial o Placa FAC", drone.name);
  row("Modelo", drone.model);
  row("Procedencia / UMA", drone.origin);
  row("Técnico asignado", drone.technician);
  row("Oficio de salida", dispatch.oficio);
  row("Fecha de salida", fmtDateTime(dispatch.dispatchDate));
  row("Registrado por", dispatch.dispatchBy);
  if (dispatch.returnDate) {
    row("Fecha de retorno", fmtDateTime(dispatch.returnDate));
    row("Retorno registrado por", dispatch.returnBy);
  }

  y += 3;
  doc.line(marginX, y, 192, y);
  y += 10;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Check de pruebas operacionales", marginX, y);
  y += 7;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  TEST_CHECKLIST.forEach((item) => {
    const ok = !!drone.testChecklist?.[item.id];
    doc.text(`${ok ? "[X]" : "[ ]"} ${item.label}`, marginX, y);
    y += 6;
  });

  y += 3;
  if (drone.verification) {
    doc.setFont("helvetica", "bold");
    doc.text(
      `Verificación aprobada por: ${drone.verification.approvedBy} (${ROLE_LABELS[drone.verification.role]}) — ${fmtDateTime(drone.verification.date)}`,
      marginX,
      y
    );
    doc.setFont("helvetica", "normal");
    y += 10;
  }

  const materials = drone.materials || [];
  if (materials.length) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Insumos y materiales usados", marginX, y);
    y += 7;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    materials.forEach((m) => {
      doc.text(`- ${m.quantity} ${m.unit} de ${m.name} (${fmtDate(m.date)})`, marginX, y);
      y += 6;
    });
    y += 4;
  }

  const laborLog = drone.laborLog || [];
  const totalHours = laborLog.reduce((sum, l) => sum + (Number(l.hours) || 0), 0);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(`Tiempo hombre total invertido: ${totalHours}h`, marginX, y);
  y += 10;
  doc.setFont("helvetica", "normal");

  y += 10;
  doc.line(marginX, y, 100, y);
  doc.line(120, y, 192, y);
  y += 5;
  doc.setFontSize(9);
  doc.text("Firma jefe de taller", marginX, y);
  doc.text("Firma técnico responsable", 120, y);

  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text(`Documento generado el ${fmtDateTime(new Date().toISOString())} — anexar al oficio ${dispatch.oficio}`, marginX, 285);

  doc.save(`TRUAC-oficio-${dispatch.oficio || "sin-numero"}-${drone.name}.pdf`);
}

// ---------------------------------------------------------------------------
// Root
// ---------------------------------------------------------------------------

export default function App() {
  const [session, setSession] = useState(() => {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  function login(role, name) {
    const next = { role, name };
    localStorage.setItem(SESSION_KEY, JSON.stringify(next));
    setSession(next);
  }
  function logout() {
    localStorage.removeItem(SESSION_KEY);
    setSession(null);
  }

  if (!session) return <LoginGate onLogin={login} />;
  return <Dashboard session={session} onLogout={logout} />;
}

// ---------------------------------------------------------------------------
// Login gate (selección de rol + PIN)
// ---------------------------------------------------------------------------

function LoginGate({ onLogin }) {
  const [role, setRole] = useState(null);
  const [pin, setPin] = useState("");
  const [name, setName] = useState("");
  const [addingNew, setAddingNew] = useState(false);
  const [error, setError] = useState("");
  const [roster, setRoster] = useState([]);

  // Lista de técnicos compartida — crece sola cada vez que alguien nuevo entra.
  useEffect(() => {
    const unsub = onSnapshot(
      CONFIG_REF(),
      (snap) => setRoster(snap.exists() ? snap.data().tecnicos || [] : []),
      () => setRoster([])
    );
    return () => unsub();
  }, []);

  async function submit() {
    const finalName = name.trim();
    if (!finalName) {
      setError("Ingresa o selecciona tu nombre.");
      return;
    }
    if (pin !== ROLE_PINS[role]) {
      setError("PIN incorrecto.");
      return;
    }
    if (!roster.includes(finalName)) {
      try {
        await setDoc(CONFIG_REF(), { tecnicos: arrayUnion(finalName) }, { merge: true });
      } catch {
        /* si falla el registro en la lista, igual dejamos entrar */
      }
    }
    onLogin(role, finalName);
  }

  return (
    <div style={styles.loginShell}>
      <div style={styles.loginCard}>
        <div style={styles.logoMark}>
          <Radio size={20} color="#D4AF37" />
        </div>
        <div style={styles.loginTitle}>TRUAC</div>
        <div style={styles.loginSubtitle}>Taller de Reparación de UAS y C-UAS</div>

        {!role ? (
          <>
            <div style={{ ...styles.panelSectionLabel, marginTop: 18 }}>Selecciona tu rol</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
              {Object.keys(ROLE_PINS).map((r) => (
                <button key={r} style={styles.roleBtn} onClick={() => setRole(r)}>
                  {r === "administrador" ? <ShieldCheck size={15} /> : r === "jefe_taller" ? <ClipboardCheck size={15} /> : <User size={15} />}
                  {ROLE_LABELS[r]}
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <div style={{ ...styles.panelSectionLabel, marginTop: 18 }}>{ROLE_LABELS[role]}</div>

            {roster.length > 0 && !addingNew ? (
              <>
                <select
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{ ...styles.formInput, marginTop: 8 }}
                >
                  <option value="">Selecciona tu nombre…</option>
                  {roster.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
                <button
                  style={styles.linkBtn}
                  onClick={() => {
                    setAddingNew(true);
                    setName("");
                  }}
                >
                  <UserPlus size={12} />
                  Soy nuevo, no estoy en la lista
                </button>
              </>
            ) : (
              <>
                <input
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Escribe tu nombre"
                  style={{ ...styles.formInput, marginTop: 8 }}
                />
                {roster.length > 0 && (
                  <button style={styles.linkBtn} onClick={() => setAddingNew(false)}>
                    Elegir de la lista
                  </button>
                )}
              </>
            )}

            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder="PIN"
              style={{ ...styles.formInput, marginTop: 8 }}
            />
            {error && <div style={styles.loginError}>{error}</div>}
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button style={styles.ghostBtn} onClick={() => { setRole(null); setError(""); setPin(""); setName(""); }}>
                Volver
              </button>
              <button style={{ ...styles.newButton, flex: 1, justifyContent: "center" }} onClick={submit}>
                Entrar
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

function Dashboard({ session, onLogout }) {
  const [drones, setDrones] = useState(null); // null = cargando
  const [saveError, setSaveError] = useState(false);
  const [showNewModal, setShowNewModal] = useState(false);
  const [showMaterialsPanel, setShowMaterialsPanel] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [logoUrl, setLogoUrl] = useState("");
  const [inventory, setInventory] = useState([]);
  const [toast, setToast] = useState(null);
  const saveTimer = useRef(null);
  const toastTimer = useRef(null);
  const perms = PERMISSIONS[session.role] || PERMISSIONS.tecnico;

  function notify(type, message) {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ type, message });
    toastTimer.current = setTimeout(() => setToast(null), 4000);
  }

  useEffect(() => {
    const unsub = onSnapshot(
      DOC_REF(),
      (snap) => setDrones(snap.exists() ? snap.data().drones || [] : []),
      () => setDrones([])
    );
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(
      CONFIG_REF(),
      (snap) => setLogoUrl(snap.exists() ? snap.data().logoUrl || "" : ""),
      () => setLogoUrl("")
    );
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(
      INVENTORY_REF(),
      (snap) => setInventory(snap.exists() ? snap.data().items || [] : []),
      () => setInventory([])
    );
    return () => unsub();
  }, []);

  function updateLogo(url) {
    setDoc(CONFIG_REF(), { logoUrl: url }, { merge: true }).catch(() => {});
  }

  function persistInventory(next) {
    setInventory(next);
    setDoc(INVENTORY_REF(), { items: next }).catch(() => {
      notify("error", "No se pudo guardar el catálogo de inventario.");
    });
  }

  function addInventoryItem({ name, unit, initialQuantity }) {
    if (!name.trim()) {
      notify("error", "Escribe el nombre de la pieza o insumo.");
      return;
    }
    const key = normalizeName(name);
    if (inventory.some((it) => normalizeName(it.name) === key)) {
      notify("error", "Ya existe una pieza con ese nombre en el catálogo.");
      return;
    }
    const entry = { id: uid(), name: name.trim(), unit: unit.trim() || "u", initialQuantity: Number(initialQuantity) || 0 };
    persistInventory([...inventory, entry]);
    notify("success", "Pieza agregada al catálogo.");
  }

  function updateInventoryItem(itemId, changes) {
    persistInventory(inventory.map((it) => (it.id === itemId ? { ...it, ...changes } : it)));
    notify("success", "Catálogo actualizado.");
  }

  function removeInventoryItem(itemId) {
    persistInventory(inventory.filter((it) => it.id !== itemId));
    notify("success", "Pieza eliminada del catálogo.");
  }

  function importInventorySeed() {
    const existingKeys = new Set(inventory.map((it) => normalizeName(it.name)));
    const toAdd = INVENTORY_SEED.filter((it) => !existingKeys.has(normalizeName(it.name))).map((it) => ({ ...it, id: uid() }));
    if (toAdd.length === 0) {
      notify("info", "El catálogo del Excel ya está cargado por completo.");
      return;
    }
    persistInventory([...inventory, ...toAdd]);
    notify("success", `Se cargaron ${toAdd.length} piezas del catálogo del Excel.`);
  }

  const persist = useCallback((next) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try {
        await setDoc(DOC_REF(), { drones: next });
        setSaveError(false);
      } catch {
        setSaveError(true);
        notify("error", "No se pudo guardar el cambio. Revisa tu conexión a internet.");
      }
    }, 200);
  }, []);

  function updateDrones(updater) {
    setDrones((prev) => {
      const next = typeof updater === "function" ? updater(prev || []) : updater;
      persist(next);
      return next;
    });
  }

  function addDrone({ name, model, origin, photoUrl, notes }) {
    if (!name.trim()) {
      notify("error", "El identificador del dron es obligatorio.");
      return;
    }
    if (!model.trim()) {
      notify("error", "Escribe el modelo del equipo (elegiste 'Otro' pero no lo especificaste).");
      return;
    }
    const now = new Date().toISOString();
    const drone = {
      id: uid(),
      name: name.trim(),
      model: model.trim(),
      origin: origin.trim(),
      photoUrl: photoUrl.trim(),
      stage: "diagnostico",
      technician: session.name,
      entryDate: now,
      stageSince: now,
      testChecklist: {},
      verification: null,
      materials: [],
      laborLog: [],
      dispatches: [],
      history: [
        { id: uid(), date: now, type: "created", text: "Dron ingresado al taller", technician: session.name },
        ...(notes && notes.trim() ? [{ id: uid(), date: now, type: "note", text: notes.trim(), technician: session.name, stage: "diagnostico" }] : []),
      ],
    };
    updateDrones((prev) => [drone, ...prev]);
    setShowNewModal(false);
    notify("success", `${drone.name} fue registrado en Diagnóstico.`);
  }

  function moveStage(droneId, targetStageId) {
    const now = new Date().toISOString();
    let blocked = false;
    updateDrones((prev) =>
      prev.map((d) => {
        if (d.id !== droneId || d.stage === targetStageId) return d;
        if (targetStageId === "listo" && !d.verification) {
          blocked = true;
          return d; // requiere check de pruebas firmado
        }
        const label = STAGES.find((s) => s.id === targetStageId)?.label;
        return {
          ...d,
          stage: targetStageId,
          stageSince: now,
          lastMaintenanceDate: targetStageId === "listo" ? now : d.lastMaintenanceDate,
          history: [{ id: uid(), date: now, type: "stage_change", text: `Movido a ${label}`, technician: session.name }, ...d.history],
        };
      })
    );
    if (blocked) notify("error", "Falta firmar el check de pruebas antes de marcarlo como Listo.");
  }

  function toggleChecklistItem(droneId, itemId) {
    updateDrones((prev) =>
      prev.map((d) => {
        if (d.id !== droneId || d.verification) return d; // bloqueado si ya está firmado
        return { ...d, testChecklist: { ...d.testChecklist, [itemId]: !d.testChecklist?.[itemId] } };
      })
    );
  }

  function verifyDrone(droneId) {
    const now = new Date().toISOString();
    let missing = false;
    updateDrones((prev) =>
      prev.map((d) => {
        if (d.id !== droneId) return d;
        const allChecked = TEST_CHECKLIST.every((item) => d.testChecklist?.[item.id]);
        if (!allChecked) {
          missing = true;
          return d;
        }
        return {
          ...d,
          verification: { approvedBy: session.name, role: session.role, date: now },
          history: [
            { id: uid(), date: now, type: "verification", text: `Check de pruebas aprobado por ${session.name} (${ROLE_LABELS[session.role]})`, technician: session.name },
            ...d.history,
          ],
        };
      })
    );
    if (missing) notify("error", "Debes marcar los 6 puntos del check de pruebas antes de firmar.");
    else notify("success", "Verificación firmada correctamente.");
  }

  function unverifyDrone(droneId) {
    const now = new Date().toISOString();
    updateDrones((prev) =>
      prev.map((d) =>
        d.id !== droneId
          ? d
          : {
              ...d,
              verification: null,
              history: [{ id: uid(), date: now, type: "verification", text: "Verificación retirada", technician: session.name }, ...d.history],
            }
      )
    );
  }

  function addNote(droneId, text) {
    if (!text.trim()) {
      notify("error", "Escribe algo antes de guardar la nota.");
      return;
    }
    const now = new Date().toISOString();
    updateDrones((prev) =>
      prev.map((d) =>
        d.id !== droneId
          ? d
          : { ...d, history: [{ id: uid(), date: now, type: "note", text: text.trim(), technician: session.name, stage: d.stage }, ...d.history] }
      )
    );
    notify("success", "Nota guardada.");
  }

  function assignTechnician(droneId, name) {
    const now = new Date().toISOString();
    updateDrones((prev) =>
      prev.map((d) =>
        d.id !== droneId
          ? d
          : {
              ...d,
              technician: name,
              history: [{ id: uid(), date: now, type: "assign", text: `Asignado a ${name}`, technician: session.name }, ...d.history],
            }
      )
    );
  }

  function assignOrigin(droneId, origin) {
    const now = new Date().toISOString();
    updateDrones((prev) =>
      prev.map((d) =>
        d.id !== droneId
          ? d
          : {
              ...d,
              origin,
              history: [{ id: uid(), date: now, type: "origin", text: `Procedencia: ${origin}`, technician: session.name }, ...d.history],
            }
      )
    );
  }

  function assignPhoto(droneId, photoUrl) {
    updateDrones((prev) => prev.map((d) => (d.id !== droneId ? d : { ...d, photoUrl })));
  }

  function addMaterial(droneId, { name, quantity, unit }) {
    if (!name.trim()) {
      notify("error", "Escribe el nombre del insumo.");
      return;
    }
    if (!quantity || quantity <= 0) {
      notify("error", "La cantidad debe ser mayor a 0.");
      return;
    }
    const now = new Date().toISOString();
    updateDrones((prev) =>
      prev.map((d) => {
        if (d.id !== droneId) return d;
        const entry = { id: uid(), name: name.trim(), quantity, unit: unit.trim() || "u", date: now, technician: session.name, stage: d.stage };
        return {
          ...d,
          materials: [entry, ...(d.materials || [])],
          history: [
            { id: uid(), date: now, type: "material", text: `Insumo usado: ${quantity} ${entry.unit} de ${entry.name}`, technician: session.name, stage: d.stage },
            ...d.history,
          ],
        };
      })
    );
    notify("success", "Insumo registrado.");
  }

  function removeMaterial(droneId, materialId) {
    if (!perms.canDelete) return;
    updateDrones((prev) =>
      prev.map((d) => (d.id !== droneId ? d : { ...d, materials: (d.materials || []).filter((m) => m.id !== materialId) }))
    );
  }

  function addLabor(droneId, { hours, description }) {
    if (!hours || hours <= 0) {
      notify("error", "Escribe cuántas horas trabajaste (mayor a 0).");
      return;
    }
    const now = new Date().toISOString();
    updateDrones((prev) =>
      prev.map((d) => {
        if (d.id !== droneId) return d;
        const entry = { id: uid(), hours, description: description.trim(), date: now, technician: session.name, stage: d.stage };
        return {
          ...d,
          laborLog: [entry, ...(d.laborLog || [])],
          history: [
            { id: uid(), date: now, type: "labor", text: `Registró ${hours}h de trabajo${description ? `: ${description}` : ""}`, technician: session.name, stage: d.stage },
            ...d.history,
          ],
        };
      })
    );
    notify("success", "Horas registradas.");
  }

  function removeLabor(droneId, laborId) {
    if (!perms.canDelete) return;
    updateDrones((prev) =>
      prev.map((d) => (d.id !== droneId ? d : { ...d, laborLog: (d.laborLog || []).filter((l) => l.id !== laborId) }))
    );
  }

  function registerDispatch(droneId, oficio) {
    if (!oficio.trim()) {
      notify("error", "Escribe el número de oficio antes de registrar la salida.");
      return;
    }
    const now = new Date().toISOString();
    let result = "ok";
    updateDrones((prev) =>
      prev.map((d) => {
        if (d.id !== droneId) return d;
        if (d.stage !== "listo") {
          result = "not_ready";
          return d;
        }
        const open = (d.dispatches || []).some((x) => !x.returnDate);
        if (open) {
          result = "already_open";
          return d;
        }
        const entry = { id: uid(), oficio: oficio.trim(), dispatchDate: now, dispatchBy: session.name, returnDate: null, returnBy: null };
        return {
          ...d,
          dispatches: [entry, ...(d.dispatches || [])],
          history: [
            { id: uid(), date: now, type: "dispatch", text: `Salida del taller mediante oficio ${entry.oficio}`, technician: session.name, stage: d.stage },
            ...d.history,
          ],
        };
      })
    );
    if (result === "not_ready") notify("error", "El dron debe estar en la etapa Listo para registrar la salida.");
    else if (result === "already_open") notify("error", "Este dron ya tiene una salida registrada sin retorno.");
    else notify("success", `Salida registrada con el oficio ${oficio.trim()}.`);
  }

  function registerReturn(droneId, dispatchId) {
    const now = new Date().toISOString();
    updateDrones((prev) =>
      prev.map((d) => {
        if (d.id !== droneId) return d;
        const dispatch = (d.dispatches || []).find((x) => x.id === dispatchId);
        if (!dispatch || dispatch.returnDate) return d;
        return {
          ...d,
          dispatches: d.dispatches.map((x) => (x.id === dispatchId ? { ...x, returnDate: now, returnBy: session.name } : x)),
          history: [
            { id: uid(), date: now, type: "dispatch", text: `Retorno a la base (oficio ${dispatch.oficio})`, technician: session.name, stage: d.stage },
            ...d.history,
          ],
        };
      })
    );
    notify("success", "Retorno al taller registrado.");
  }


  function removeDrone(droneId) {
    if (!perms.canDelete) return;
    updateDrones((prev) => prev.filter((d) => d.id !== droneId));
    setSelectedId(null);
  }

  const loading = drones === null;
  const list = drones || [];
  const activeList = list.filter((d) => !isDispatched(d));
  const dispatchedList = list.filter((d) => isDispatched(d));
  const counts = STAGES.reduce((acc, s) => {
    acc[s.id] = activeList.filter((d) => d.stage === s.id).length;
    return acc;
  }, {});
  const selected = list.find((d) => d.id === selectedId) || null;
  const materialsUsedByKey = (() => {
    const map = new Map();
    list.forEach((d) =>
      (d.materials || []).forEach((m) => {
        const key = normalizeName(m.name);
        if (!key) return;
        map.set(key, (map.get(key) || 0) + (Number(m.quantity) || 0));
      })
    );
    return map;
  })();

  return (
    <div style={styles.appShell}>
      <Toast toast={toast} onDismiss={() => setToast(null)} />
      <Header
        session={session}
        onLogout={onLogout}
        total={list.length}
        onNew={() => setShowNewModal(true)}
        onOpenMaterialsPanel={() => setShowMaterialsPanel(true)}
        saveError={saveError}
        logoUrl={logoUrl}
        canEditLogo={perms.canDelete}
        onEditLogo={updateLogo}
      />
      <FlagStripe />
      <AssemblyLine counts={counts} />

      {loading ? (
        <div style={styles.loadingRow}>
          <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />
          <span>Cargando flota…</span>
        </div>
      ) : list.length === 0 ? (
        <EmptyState onNew={() => setShowNewModal(true)} />
      ) : (
        <div style={styles.board}>
          {STAGES.map((stage) => (
            <StageColumn key={stage.id} stage={stage} drones={activeList.filter((d) => d.stage === stage.id)} onOpen={setSelectedId} />
          ))}
        </div>
      )}

      {dispatchedList.length > 0 && (
        <div style={styles.dispatchedSection}>
          <div style={styles.dispatchedHeader}>
            <Send size={13} color="#D4AF37" />
            Fuera del taller — entregados ({dispatchedList.length})
          </div>
          <div style={styles.dispatchedGrid}>
            {dispatchedList.map((d) => {
              const dp = openDispatchOf(d);
              return (
                <div key={d.id} style={styles.dispatchedCard} onClick={() => setSelectedId(d.id)}>
                  <div style={styles.cardName}>{d.name}</div>
                  <div style={styles.cardModel}>{d.model}</div>
                  <div style={styles.dispatchedMeta}>
                    Oficio {dp.oficio} · salió {fmtDate(dp.dispatchDate)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {showNewModal && <NewDroneModal onClose={() => setShowNewModal(false)} onCreate={addDrone} defaultTech={session.name} />}
      {showMaterialsPanel && (
        <AnalyticsModal
          drones={list}
          inventory={inventory}
          canEditInventory={perms.canDelete}
          onAddInventoryItem={addInventoryItem}
          onUpdateInventoryItem={updateInventoryItem}
          onRemoveInventoryItem={removeInventoryItem}
          onImportSeed={importInventorySeed}
          onClose={() => setShowMaterialsPanel(false)}
        />
      )}

      {selected && (
        <DetailPanel
          drone={selected}
          perms={perms}
          inventory={inventory}
          materialsUsedByKey={materialsUsedByKey}
          onClose={() => setSelectedId(null)}
          onMoveStage={moveStage}
          onAddNote={addNote}
          onAssign={assignTechnician}
          onAssignOrigin={assignOrigin}
          onAssignPhoto={assignPhoto}
          onToggleChecklist={toggleChecklistItem}
          onVerify={verifyDrone}
          onUnverify={unverifyDrone}
          onAddMaterial={addMaterial}
          onRemoveMaterial={removeMaterial}
          onAddLabor={addLabor}
          onRemoveLabor={removeLabor}
          onRegisterDispatch={registerDispatch}
          onRegisterReturn={registerReturn}
          onDelete={removeDrone}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Header + assembly line
// ---------------------------------------------------------------------------

function Header({ session, onLogout, total, onNew, onOpenMaterialsPanel, saveError, logoUrl, canEditLogo, onEditLogo }) {
  function editLogo() {
    const url = window.prompt("Pega la URL de la imagen del logo (déjalo vacío para quitarlo):", logoUrl || "");
    if (url !== null) onEditLogo(url.trim());
  }

  return (
    <div style={styles.header}>
      <div style={styles.headerLeft}>
        <div
          style={{ ...styles.logoMark, cursor: canEditLogo ? "pointer" : "default", padding: logoUrl ? 0 : undefined, overflow: "hidden" }}
          onClick={canEditLogo ? editLogo : undefined}
          title={canEditLogo ? "Clic para cambiar el logo" : undefined}
        >
          {logoUrl ? (
            <img src={logoUrl} alt="Logo del taller" style={styles.logoImg} />
          ) : (
            <Radio size={18} color="#D4AF37" />
          )}
        </div>
        <div>
          <div style={styles.title}>TRUAC</div>
          <div style={styles.subtitle}>
            {total} {total === 1 ? "dron activo" : "drones activos"} en el taller
          </div>
        </div>
      </div>

      <div style={styles.headerRight}>
        {saveError && (
          <div style={styles.saveErrorBadge}>
            <AlertTriangle size={13} />
            Sin conexión al guardar
          </div>
        )}
        <div style={styles.sessionBadge}>
          {session.role === "administrador" ? <ShieldCheck size={13} /> : session.role === "jefe_taller" ? <ClipboardCheck size={13} /> : <User size={13} />}
          {session.name} · {ROLE_LABELS[session.role]}
        </div>
        <button style={styles.iconButton} onClick={onOpenMaterialsPanel} title="Análisis de insumos">
          <BarChart3 size={14} />
        </button>
        <button style={styles.iconButton} onClick={onLogout} title="Cerrar sesión">
          <LogOut size={14} />
        </button>
        <button style={styles.newButton} onClick={onNew}>
          <Plus size={15} />
          Nuevo dron
        </button>
      </div>
    </div>
  );
}

function FlagStripe() {
  return <div style={styles.flagStripe} />;
}

function Toast({ toast, onDismiss }) {
  if (!toast) return null;
  const config = {
    error: { icon: AlertTriangle, color: "#F09595", bg: "#3A1616", border: "#5C2323" },
    success: { icon: CheckCircle, color: "#9EE8B8", bg: "#173A28", border: "#2A6B4A" },
    info: { icon: Info, color: "#8EC5F5", bg: "#16263A", border: "#26466B" },
  }[toast.type] || { icon: Info, color: "#8EC5F5", bg: "#16263A", border: "#26466B" };
  const Icon = config.icon;
  return (
    <div style={{ ...styles.toast, background: config.bg, borderColor: config.border }}>
      <Icon size={15} color={config.color} style={{ flexShrink: 0 }} />
      <span style={{ ...styles.toastText, color: config.color }}>{toast.message}</span>
      <button style={styles.toastClose} onClick={onDismiss}>
        <X size={13} color={config.color} />
      </button>
    </div>
  );
}

function AssemblyLine({ counts }) {
  return (
    <div style={styles.lineWrap}>
      <div style={styles.lineTrack} />
      {STAGES.map((stage) => {
        const Icon = stage.icon;
        return (
          <div key={stage.id} style={styles.lineNode}>
            <div style={{ ...styles.lineCircle, borderColor: stage.accent, background: "#0A1220" }}>
              <Icon size={16} color={stage.accent} />
            </div>
            <div style={styles.lineLabel}>{stage.label}</div>
            <div style={{ ...styles.lineCount, color: stage.accent }}>{counts[stage.id] ?? 0}</div>
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Board / columns / cards
// ---------------------------------------------------------------------------

function StageColumn({ stage, drones, onOpen }) {
  const Icon = stage.icon;
  return (
    <div style={styles.column}>
      <div style={styles.columnHeader}>
        <Icon size={14} color={stage.accent} />
        <span style={{ ...styles.columnTitle, color: stage.accent }}>{stage.label}</span>
        <span style={styles.columnCount}>{drones.length}</span>
      </div>
      <div style={styles.columnBody}>
        {drones.length === 0 ? (
          <div style={styles.columnEmpty}>Sin drones en esta etapa</div>
        ) : (
          drones
            .slice()
            .sort((a, b) => new Date(b.stageSince) - new Date(a.stageSince))
            .map((d) => <DroneCard key={d.id} drone={d} stage={stage} onOpen={onOpen} />)
        )}
      </div>
    </div>
  );
}

function DroneCard({ drone, stage, onOpen }) {
  const days = daysSince(drone.stageSince);
  const noteCount = drone.history.filter((h) => h.type === "note").length;
  return (
    <div style={{ ...styles.card, borderLeftColor: stage.accent, display: "flex", gap: 10 }} onClick={() => onOpen(drone.id)}>
      {drone.photoUrl && (
        <img src={drone.photoUrl} alt={drone.name} style={styles.cardThumb} />
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={styles.cardName}>{drone.name}</div>
        <div style={styles.cardModel}>{drone.model}</div>
        {drone.origin && (
          <div style={styles.originTag}>
            <Building2 size={10} />
            {drone.origin}
          </div>
        )}
        <div style={styles.cardMetaRow}>
          <span style={styles.cardMetaItem}>
            <User size={11} /> {drone.technician}
          </span>
          <span style={styles.cardMetaItem}>
            <Clock size={11} /> {days === 0 ? "hoy" : `${days}d`}
          </span>
          {noteCount > 0 && (
            <span style={styles.cardMetaItem}>
              <MessageSquare size={11} /> {noteCount}
            </span>
          )}
          {drone.lastMaintenanceDate && (
            <span style={styles.cardMetaItem} title="Último mantenimiento completado">
              <ShieldCheck size={11} /> {fmtDate(drone.lastMaintenanceDate)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyState({ onNew }) {
  return (
    <div style={styles.emptyState}>
      <div style={styles.emptyIconWrap}>
        <Wrench size={22} color="#565C68" />
      </div>
      <div style={styles.emptyTitle}>Empieza tu primera línea de trabajo</div>
      <div style={styles.emptyBody}>Registra un dron para verlo avanzar por diagnóstico, reparación, pruebas y entrega.</div>
      <button style={styles.newButton} onClick={onNew}>
        <Plus size={15} />
        Agregar dron
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// New drone modal
// ---------------------------------------------------------------------------

function AnalyticsModal({
  drones,
  onClose,
  inventory = [],
  canEditInventory = false,
  onAddInventoryItem,
  onUpdateInventoryItem,
  onRemoveInventoryItem,
  onImportSeed,
}) {
  const [tab, setTab] = useState("materials");

  // Mapa normalizado insumo -> catálogo (para cruzar con lo usado y calcular "quedan").
  const inventoryByKey = (() => {
    const map = new Map();
    inventory.forEach((it) => map.set(normalizeName(it.name), it));
    return map;
  })();

  const materialStats = (() => {
    const map = new Map();
    drones.forEach((d) => {
      (d.materials || []).forEach((m) => {
        const key = normalizeName(m.name);
        if (!key) return;
        if (!map.has(key)) {
          map.set(key, { label: m.name.trim(), occurrences: 0, totalQuantity: 0, unit: m.unit || "u", drones: new Set(), lastDate: m.date });
        }
        const entry = map.get(key);
        entry.occurrences += 1;
        entry.totalQuantity += Number(m.quantity) || 0;
        entry.drones.add(d.name);
        if (new Date(m.date) > new Date(entry.lastDate)) entry.lastDate = m.date;
      });
    });
    // Cruza cada insumo usado con su catálogo para calcular cuántas piezas quedan.
    map.forEach((entry, key) => {
      const item = inventoryByKey.get(key);
      entry.remaining = item ? item.initialQuantity - entry.totalQuantity : null;
    });
    return Array.from(map.values()).sort((a, b) => b.occurrences - a.occurrences);
  })();

  // Cuánto se ha usado de cada pieza del catálogo, para la pestaña Inventario
  // (incluye piezas del catálogo que aún no se han usado, con 0).
  const usedByKey = (() => {
    const map = new Map();
    materialStats.forEach((s) => map.set(normalizeName(s.label), s.totalQuantity));
    return map;
  })();

  const laborByTech = (() => {
    const map = new Map();
    drones.forEach((d) => {
      (d.laborLog || []).forEach((l) => {
        const key = (l.technician || "Sin asignar").trim();
        if (!map.has(key)) map.set(key, { label: key, hours: 0, occurrences: 0, drones: new Set(), lastDate: l.date });
        const entry = map.get(key);
        entry.hours += Number(l.hours) || 0;
        entry.occurrences += 1;
        entry.drones.add(d.name);
        if (new Date(l.date) > new Date(entry.lastDate)) entry.lastDate = l.date;
      });
    });
    return Array.from(map.values()).sort((a, b) => b.hours - a.hours);
  })();

  const laborByModel = (() => {
    const map = new Map();
    drones.forEach((d) => {
      const key = (d.model || "Sin modelo").trim();
      const totalHours = (d.laborLog || []).reduce((sum, l) => sum + (Number(l.hours) || 0), 0);
      if (totalHours === 0) return;
      if (!map.has(key)) map.set(key, { label: key, hours: 0, occurrences: 0, drones: new Set() });
      const entry = map.get(key);
      entry.hours += totalHours;
      entry.occurrences += (d.laborLog || []).length;
      entry.drones.add(d.name);
    });
    return Array.from(map.values()).sort((a, b) => b.hours - a.hours);
  })();

  // Cuántas veces llegó cada dron a "Listo" — para ver cuáles requieren mantenimiento recurrente.
  const droneMaintenanceStats = (() => {
    const map = new Map();
    drones.forEach((d) => {
      const count = (d.history || []).filter((h) => h.type === "stage_change" && h.text === "Movido a Listo").length;
      if (count === 0) return;
      map.set(d.id, { label: `${d.name}${d.model ? ` (${d.model})` : ""}`, value: count });
    });
    return Array.from(map.values()).sort((a, b) => b.value - a.value);
  })();

  // En cuántos drones distintos trabajó cada técnico (notas, insumos, horas, asignación o verificación).
  const techDroneStats = (() => {
    const map = new Map();
    drones.forEach((d) => {
      const techs = new Set();
      if (d.technician) techs.add(d.technician);
      (d.history || []).forEach((h) => h.technician && techs.add(h.technician));
      techs.forEach((t) => {
        if (!map.has(t)) map.set(t, new Set());
        map.get(t).add(d.id);
      });
    });
    return Array.from(map.entries())
      .map(([label, set]) => ({ label, value: set.size }))
      .sort((a, b) => b.value - a.value);
  })();

  // Tiempo promedio en el taller (ingreso -> último mantenimiento completado).
  const avgDaysInWorkshop = (() => {
    const finished = drones.filter((d) => d.lastMaintenanceDate);
    if (finished.length === 0) return null;
    const totalDays = finished.reduce((sum, d) => sum + Math.max(0, Math.floor((new Date(d.lastMaintenanceDate) - new Date(d.entryDate)) / 86400000)), 0);
    return Math.round((totalDays / finished.length) * 10) / 10;
  })();

  // Drones por etapa actual (incluye los que están fuera del taller entregados, sin importar etapa).
  const stageCountStats = STAGES.map((s) => ({
    label: s.label,
    value: drones.filter((d) => d.stage === s.id).length,
    color: s.accent,
  }));

  const TABS = [
    { id: "charts", label: "Gráficas", icon: BarChart3 },
    { id: "materials", label: "Insumos más usados", icon: Package },
    { id: "techHours", label: "Horas por técnico", icon: User },
    { id: "modelHours", label: "Horas por tipo de equipo", icon: BarChart3 },
    { id: "inventory", label: "Inventario", icon: Boxes },
  ];

  // Barra horizontal genérica para la pestaña de Gráficas — un solo color por
  // gráfico (una sola serie), etiquetas legibles y tooltip al pasar el mouse.
  function RankedBarChart({ data, color, unit, maxItems = 8 }) {
    const rows = data.slice(0, maxItems);
    if (rows.length === 0) return <div style={styles.lockedHint}>Aún no hay datos suficientes.</div>;
    const height = Math.max(120, rows.length * 40);
    return (
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 28, bottom: 4, left: 4 }} barCategoryGap={10}>
          <CartesianGrid horizontal={false} stroke="#1E3350" />
          <XAxis type="number" tick={{ fill: "#8B92A3", fontSize: 11 }} axisLine={{ stroke: "#1E3350" }} tickLine={false} allowDecimals={false} />
          <YAxis
            type="category"
            dataKey="label"
            width={150}
            tick={{ fill: "#C7CCD9", fontSize: 11 }}
            axisLine={{ stroke: "#1E3350" }}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: "rgba(255,255,255,0.04)" }}
            contentStyle={{ background: "#0F1B2E", border: "1px solid #1E3350", borderRadius: 8, fontSize: 12 }}
            labelStyle={{ color: "#C7CCD9" }}
            itemStyle={{ color }}
            formatter={(value) => [`${value}${unit ? ` ${unit}` : ""}`, ""]}
          />
          <Bar dataKey="value" fill={color} radius={[0, 4, 4, 0]} maxBarSize={22}>
            <LabelList dataKey="value" position="right" fill="#C7CCD9" fontSize={11} formatter={(v) => `${v}${unit ? ` ${unit}` : ""}`} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );
  }

  function ChartCard({ title, hint, children }) {
    return (
      <div style={styles.chartCard}>
        <div style={styles.chartCardTitle}>{title}</div>
        {children}
        {hint && <div style={{ ...styles.formHint, marginTop: 6 }}>{hint}</div>}
      </div>
    );
  }

  function renderList(stats, kind) {
    if (stats.length === 0) return <div style={styles.lockedHint}>Aún no hay datos suficientes para mostrar esta lista.</div>;
    const maxValue = kind === "materials" ? stats[0].occurrences : stats[0].hours;
    return (
      <div style={styles.analyticsList}>
        {stats.map((s, i) => (
          <div key={s.label} style={styles.analyticsRow}>
            <div style={styles.analyticsRank}>#{i + 1}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={styles.analyticsName}>{s.label}</div>
              <div style={styles.analyticsBarTrack}>
                <div
                  style={{
                    ...styles.analyticsBarFill,
                    width: `${((kind === "materials" ? s.occurrences : s.hours) / (maxValue || 1)) * 100}%`,
                  }}
                />
              </div>
              <div style={styles.analyticsMeta}>
                {kind === "materials" ? (
                  <>
                    {s.occurrences} {s.occurrences === 1 ? "vez registrado" : "veces registrado"} · {s.totalQuantity} {s.unit} en total ·{" "}
                    {s.drones.size} {s.drones.size === 1 ? "dron" : "drones"} distintos · última vez {fmtDate(s.lastDate)}
                    {s.remaining !== null && s.remaining !== undefined && (
                      <>
                        {" · "}
                        <span style={{ color: s.remaining <= 0 ? "#F5877A" : s.remaining <= 3 ? "#F5A623" : "#9EE8B8", fontWeight: 600 }}>
                          Quedan: {s.remaining} {s.unit}
                        </span>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    {s.hours}h en total · {s.occurrences} {s.occurrences === 1 ? "registro" : "registros"} · {s.drones.size}{" "}
                    {s.drones.size === 1 ? "dron" : "drones"} distintos
                    {s.lastDate ? ` · última vez ${fmtDate(s.lastDate)}` : ""}
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={{ ...styles.modal, ...styles.analyticsModal }} onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <div>
            <span style={styles.modalTitle}>Análisis de la flota</span>
            <div style={styles.panelModel}>Datos acumulados de todos los drones</div>
          </div>
          <button style={styles.iconButton} onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div style={styles.stageTabRow}>
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                style={{
                  ...styles.stageTabBtn,
                  borderColor: active ? "#D4AF37" : "#1E3350",
                  color: active ? "#D4AF37" : "#8B92A3",
                  background: active ? "#2A2405" : "transparent",
                }}
                onClick={() => setTab(t.id)}
              >
                <Icon size={12} />
                {t.label}
              </button>
            );
          })}
        </div>

        {tab === "charts" && (
          <div style={styles.chartsGrid}>
            <ChartCard title="Horas trabajadas por técnico" hint="Suma de tiempo hombre registrado por cada técnico en toda la flota.">
              <RankedBarChart data={laborByTech.map((s) => ({ label: s.label, value: s.hours }))} color="#4C8DFF" unit="h" />
            </ChartCard>
            <ChartCard title="Piezas / insumos más utilizados" hint="Top de insumos por número de veces registrados (no por cantidad).">
              <RankedBarChart data={materialStats.map((s) => ({ label: s.label, value: s.occurrences }))} color="#D4AF37" maxItems={10} />
            </ChartCard>
            <ChartCard title="Horas por tipo de equipo" hint="Tiempo hombre acumulado según el modelo del dron.">
              <RankedBarChart data={laborByModel.map((s) => ({ label: s.label, value: s.hours }))} color="#5EC8D8" unit="h" />
            </ChartCard>
            <ChartCard title="Drones con más mantenimientos" hint="Cuántas veces cada dron ha llegado a la etapa Listo — útil para detectar fallas recurrentes.">
              <RankedBarChart data={droneMaintenanceStats} color="#4ADE80" />
            </ChartCard>
            <ChartCard title="Técnicos con más drones atendidos" hint="En cuántos drones distintos ha trabajado cada técnico (asignación, notas, insumos o tiempo hombre).">
              <RankedBarChart data={techDroneStats} color="#F5A623" />
            </ChartCard>
            <ChartCard title="Drones por etapa actual" hint="Distribución de toda la flota, incluyendo los que están fuera del taller entregados.">
              <RankedBarChart data={stageCountStats} color="#D4AF37" maxItems={4} />
            </ChartCard>
            {avgDaysInWorkshop !== null && (
              <ChartCard title="Tiempo promedio en el taller" hint="Días entre el ingreso y el último mantenimiento completado, promediado entre los drones que ya pasaron por Listo.">
                <div style={styles.statTile}>
                  <div style={styles.statTileValue}>{avgDaysInWorkshop}</div>
                  <div style={styles.statTileLabel}>días en promedio</div>
                </div>
              </ChartCard>
            )}
          </div>
        )}
        {tab === "materials" && renderList(materialStats, "materials")}
        {tab === "techHours" && renderList(laborByTech, "hours")}
        {tab === "modelHours" && renderList(laborByModel, "hours")}
        {tab === "inventory" && (
          <InventoryTab
            inventory={inventory}
            usedByKey={usedByKey}
            canEdit={canEditInventory}
            onAdd={onAddInventoryItem}
            onUpdate={onUpdateInventoryItem}
            onRemove={onRemoveInventoryItem}
            onImportSeed={onImportSeed}
          />
        )}

        {tab !== "charts" && (
          <div style={{ ...styles.formHint, marginTop: 14 }}>
            {tab === "materials"
              ? "Útil para detectar piezas que fallan seguido y priorizar compras o revisar causas recurrentes."
              : tab === "techHours"
              ? "Útil para ver la carga de trabajo real de cada técnico."
              : tab === "modelHours"
              ? "Útil para ver qué modelos de equipo consumen más tiempo de mantenimiento."
              : "Catálogo de piezas e insumos del taller. La cantidad inicial se descuenta con cada insumo registrado en un dron para mostrar cuánto queda."}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Inventario — catálogo editable de piezas/insumos con cantidades restantes
// ---------------------------------------------------------------------------

function InventoryTab({ inventory, usedByKey, canEdit, onAdd, onUpdate, onRemove, onImportSeed }) {
  const [newName, setNewName] = useState("");
  const [newUnit, setNewUnit] = useState("u");
  const [newQty, setNewQty] = useState("0");
  const [editingId, setEditingId] = useState(null);
  const [editQty, setEditQty] = useState("");

  const sorted = inventory.slice().sort((a, b) => a.name.localeCompare(b.name, "es"));

  return (
    <div>
      {canEdit && onImportSeed && (
        <button style={{ ...styles.ghostBtn, marginBottom: 10 }} onClick={onImportSeed}>
          <FileDown size={13} />
          Cargar catálogo desde Excel ({INVENTORY_SEED.length} piezas)
        </button>
      )}
      {sorted.length === 0 ? (
        <div style={styles.lockedHint}>
          Aún no hay piezas en el catálogo{canEdit ? ". Agrega la primera abajo o carga el catálogo del Excel." : "; pídele a un administrador que lo cargue."}
        </div>
      ) : (
        <div style={styles.analyticsList}>
          {sorted.map((item) => {
            const used = usedByKey.get(normalizeName(item.name)) || 0;
            const remaining = item.initialQuantity - used;
            const isEditing = editingId === item.id;
            return (
              <div key={item.id} style={styles.analyticsRow}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={styles.analyticsName}>{item.name}</div>
                  <div style={styles.analyticsMeta}>
                    {isEditing ? (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                        Cantidad inicial:
                        <input
                          autoFocus
                          type="number"
                          min="0"
                          value={editQty}
                          onChange={(e) => setEditQty(e.target.value)}
                          style={{ ...styles.formInput, width: 70, padding: "4px 8px" }}
                        />
                        {item.unit}
                        <button
                          style={styles.logDeleteBtn}
                          title="Guardar"
                          onClick={() => {
                            onUpdate(item.id, { initialQuantity: Number(editQty) || 0 });
                            setEditingId(null);
                          }}
                        >
                          <Save size={13} color="#9EE8B8" />
                        </button>
                        <button style={styles.logDeleteBtn} title="Cancelar" onClick={() => setEditingId(null)}>
                          <X size={13} color="#8B92A3" />
                        </button>
                      </span>
                    ) : (
                      <>
                        Cantidad inicial: {item.initialQuantity} {item.unit} · usadas: {used} {item.unit} ·{" "}
                        <span style={{ color: remaining <= 0 ? "#F5877A" : remaining <= 3 ? "#F5A623" : "#9EE8B8", fontWeight: 600 }}>
                          Quedan: {remaining} {item.unit}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                {canEdit && !isEditing && (
                  <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                    <button
                      style={styles.logDeleteBtn}
                      title="Editar cantidad"
                      onClick={() => {
                        setEditingId(item.id);
                        setEditQty(String(item.initialQuantity));
                      }}
                    >
                      <Pencil size={13} color="#8B92A3" />
                    </button>
                    <button style={styles.logDeleteBtn} title="Quitar del catálogo" onClick={() => onRemove(item.id)}>
                      <Trash2 size={13} color="#F5877A" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {canEdit && (
        <div style={{ ...styles.logForm, marginTop: 14 }}>
          <div style={styles.subBlockLabel}>Agregar pieza al catálogo</div>
          <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Nombre de la pieza / insumo *" style={styles.formInput} />
          <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
            <input
              type="number"
              min="0"
              step="1"
              value={newQty}
              onChange={(e) => setNewQty(e.target.value)}
              placeholder="Cantidad inicial"
              style={{ ...styles.formInput, width: 110 }}
            />
            <input value={newUnit} onChange={(e) => setNewUnit(e.target.value)} placeholder="unidad" style={{ ...styles.formInput, width: 90 }} />
            <button
              style={{ ...styles.ghostBtn, flex: 1, opacity: newName.trim() ? 1 : 0.4 }}
              disabled={!newName.trim()}
              onClick={() => {
                onAdd({ name: newName, unit: newUnit, initialQuantity: newQty });
                setNewName("");
                setNewUnit("u");
                setNewQty("0");
              }}
            >
              <Plus size={13} />
              Agregar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function NewDroneModal({ onClose, onCreate, defaultTech }) {
  const [name, setName] = useState("");
  const [model, setModel] = useState(EQUIPMENT_MODELS[0]);
  const [customModel, setCustomModel] = useState("");
  const [origin, setOrigin] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [notes, setNotes] = useState("");
  const isOther = model === OTHER_MODEL_OPTION;
  const finalModel = isOther ? customModel : model;

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <span style={styles.modalTitle}>Nuevo dron</span>
          <button style={styles.iconButton} onClick={onClose}>
            <X size={16} />
          </button>
        </div>
        <div style={styles.formField}>
          <label style={styles.formLabel}>Identificador *</label>
          <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: FAC7000" style={styles.formInput} />
        </div>
        <div style={styles.formField}>
          <label style={styles.formLabel}>Tipo de equipo / modelo *</label>
          <select value={model} onChange={(e) => setModel(e.target.value)} style={styles.formInput}>
            {EQUIPMENT_MODELS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
            <option value={OTHER_MODEL_OPTION}>{OTHER_MODEL_OPTION}</option>
          </select>
          {isOther && (
            <input
              autoFocus
              value={customModel}
              onChange={(e) => setCustomModel(e.target.value)}
              placeholder="Escribe el modelo"
              style={{ ...styles.formInput, marginTop: 6 }}
            />
          )}
        </div>
        <div style={styles.formField}>
          <label style={styles.formLabel}>Procedencia / cliente</label>
          <input value={origin} onChange={(e) => setOrigin(e.target.value)} placeholder="Ej: UMA" style={styles.formInput} />
        </div>
        <div style={styles.formField}>
          <label style={styles.formLabel}>Foto (URL de imagen, opcional)</label>
          <input value={photoUrl} onChange={(e) => setPhotoUrl(e.target.value)} placeholder="https://…" style={styles.formInput} />
          {photoUrl && <img src={photoUrl} alt="Vista previa" style={styles.photoPreview} />}
        </div>
        <div style={styles.formField}>
          <label style={styles.formLabel}>Nota inicial (opcional)</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Motivo de ingreso, daños reportados, etc." style={styles.formTextarea} rows={3} />
        </div>
        <div style={styles.formFooter}>
          <span style={styles.formHint}>Entrará en la etapa Diagnóstico, técnico: {defaultTech}</span>
          <button
            style={styles.newButton}
            onClick={() => onCreate({ name, model: finalModel, origin, photoUrl, notes })}
          >
            <Plus size={15} />
            Registrar
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Detail panel
// ---------------------------------------------------------------------------

const OTHER_MATERIAL_OPTION = "Otro / no está en el catálogo";

function DetailPanel({
  drone,
  perms,
  inventory = [],
  materialsUsedByKey = new Map(),
  onClose,
  onMoveStage,
  onAddNote,
  onAssign,
  onAssignOrigin,
  onAssignPhoto,
  onToggleChecklist,
  onVerify,
  onUnverify,
  onAddMaterial,
  onRemoveMaterial,
  onAddLabor,
  onRemoveLabor,
  onRegisterDispatch,
  onRegisterReturn,
  onDelete,
}) {
  const [noteDraft, setNoteDraft] = useState("");
  const [editingTech, setEditingTech] = useState(false);
  const [techDraft, setTechDraft] = useState(drone.technician);
  const [editingOrigin, setEditingOrigin] = useState(false);
  const [originDraft, setOriginDraft] = useState(drone.origin || "");
  const [editingPhoto, setEditingPhoto] = useState(false);
  const [photoDraft, setPhotoDraft] = useState(drone.photoUrl || "");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [matCatalogChoice, setMatCatalogChoice] = useState("");
  const [matName, setMatName] = useState("");
  const [matQty, setMatQty] = useState("1");
  const [matUnit, setMatUnit] = useState("u");
  const hasCatalog = inventory.length > 0;
  const selectedCatalogValue = matCatalogChoice || (hasCatalog ? inventory[0].name : OTHER_MATERIAL_OPTION);
  const isOtherMaterial = !hasCatalog || selectedCatalogValue === OTHER_MATERIAL_OPTION;
  const [laborHours, setLaborHours] = useState("");
  const [laborDesc, setLaborDesc] = useState("");
  const [activeTab, setActiveTab] = useState(drone.stage);
  const [oficioDraft, setOficioDraft] = useState("");
  const currentIdx = STAGE_INDEX[drone.stage];
  const maintenanceCount = drone.history.filter((h) => h.type === "stage_change" && h.text === "Movido a Listo").length;
  const openDispatch = (drone.dispatches || []).find((x) => !x.returnDate);

  useEffect(() => {
    setTechDraft(drone.technician);
    setOriginDraft(drone.origin || "");
    setPhotoDraft(drone.photoUrl || "");
    setEditingPhoto(false);
    setConfirmDelete(false);
    setActiveTab(drone.stage);
    setOficioDraft("");
    setMatCatalogChoice("");
    setMatName("");
  }, [drone.id]);

  function submitNote() {
    onAddNote(drone.id, noteDraft);
    if (noteDraft.trim()) setNoteDraft("");
  }

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.sidePanel} onClick={(e) => e.stopPropagation()}>
        {drone.photoUrl && !editingPhoto && (
          <div style={styles.detailPhotoWrap} onClick={() => setEditingPhoto(true)}>
            <img src={drone.photoUrl} alt={drone.name} style={styles.detailPhoto} />
            <div style={styles.detailPhotoEditHint}>Cambiar foto</div>
          </div>
        )}
        {(!drone.photoUrl || editingPhoto) && (
          <div style={styles.formField}>
            <label style={styles.formLabel}>Foto (URL de imagen)</label>
            <div style={{ display: "flex", gap: 6 }}>
              <input
                autoFocus={editingPhoto}
                value={photoDraft}
                onChange={(e) => setPhotoDraft(e.target.value)}
                placeholder="https://…"
                style={styles.formInput}
              />
              <button
                style={styles.ghostBtn}
                onClick={() => {
                  onAssignPhoto(drone.id, photoDraft.trim());
                  setEditingPhoto(false);
                }}
              >
                Guardar
              </button>
            </div>
          </div>
        )}

        <div style={styles.modalHeader}>
          <div>
            <div style={styles.modalTitle}>{drone.name}</div>
            <div style={styles.panelModel}>{drone.model || "Sin modelo especificado"}</div>
          </div>
          <button style={styles.iconButton} onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div style={styles.panelSection}>
          <div style={styles.panelSectionLabel}>Etapa</div>
          <div style={styles.stageRow}>
            {STAGES.map((s) => {
              const Icon = s.icon;
              const active = s.id === drone.stage;
              const locked = s.id === "listo" && !drone.verification;
              return (
                <button
                  key={s.id}
                  style={{
                    ...styles.stageBtn,
                    background: active ? s.accentDim : "transparent",
                    borderColor: active ? s.accent : "#1E3350",
                    color: active ? s.accent : locked ? "#4A4F59" : "#8B92A3",
                    opacity: locked ? 0.6 : 1,
                  }}
                  title={locked ? "Falta firmar el check de pruebas" : undefined}
                  onClick={() => onMoveStage(drone.id, s.id)}
                >
                  <Icon size={13} />
                  {s.label}
                </button>
              );
            })}
          </div>
          {currentIdx < STAGES.length - 1 && (
            <>
              <button
                style={{ ...styles.advanceBtn, opacity: STAGES[currentIdx + 1].id === "listo" && !drone.verification ? 0.5 : 1 }}
                onClick={() => onMoveStage(drone.id, STAGES[currentIdx + 1].id)}
              >
                Avanzar a {STAGES[currentIdx + 1].label}
                <ArrowRight size={13} />
              </button>
              {STAGES[currentIdx + 1].id === "listo" && !drone.verification && (
                <div style={styles.lockedHint}>Falta firmar el check de pruebas para marcarlo como Listo.</div>
              )}
            </>
          )}
        </div>

        <div style={styles.panelSection}>
          <div style={styles.metaGrid}>
            <div>
              <div style={styles.panelSectionLabel}>Técnico asignado</div>
              {editingTech ? (
                <input
                  autoFocus
                  value={techDraft}
                  onChange={(e) => setTechDraft(e.target.value)}
                  onBlur={() => {
                    const v = techDraft.trim();
                    if (v && v !== drone.technician) onAssign(drone.id, v);
                    setEditingTech(false);
                  }}
                  onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
                  style={styles.formInput}
                />
              ) : (
                <button style={styles.metaValueBtn} onClick={() => setEditingTech(true)}>
                  {drone.technician}
                </button>
              )}
            </div>
            <div>
              <div style={styles.panelSectionLabel}>Procedencia / cliente</div>
              {editingOrigin ? (
                <input
                  autoFocus
                  value={originDraft}
                  onChange={(e) => setOriginDraft(e.target.value)}
                  onBlur={() => {
                    const v = originDraft.trim();
                    if (v !== (drone.origin || "")) onAssignOrigin(drone.id, v);
                    setEditingOrigin(false);
                  }}
                  onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
                  placeholder="Ej: UMA"
                  style={styles.formInput}
                />
              ) : (
                <button style={styles.metaValueBtn} onClick={() => setEditingOrigin(true)}>
                  {drone.origin || "Agregar procedencia"}
                </button>
              )}
            </div>
            <div>
              <div style={styles.panelSectionLabel}>Ingreso al taller</div>
              <div style={styles.metaValue}>{fmtDate(drone.entryDate)}</div>
            </div>
            <div>
              <div style={styles.panelSectionLabel}>En esta etapa desde</div>
              <div style={styles.metaValue}>
                {fmtDate(drone.stageSince)} · {daysSince(drone.stageSince)}d
              </div>
            </div>
            <div>
              <div style={styles.panelSectionLabel}>Último mantenimiento</div>
              <div style={styles.metaValue}>
                {drone.lastMaintenanceDate ? fmtDate(drone.lastMaintenanceDate) : "Aún no ha salido"}
              </div>
            </div>
            <div>
              <div style={styles.panelSectionLabel}>Mantenimientos completados</div>
              <div style={styles.metaValue}>{maintenanceCount}</div>
            </div>
          </div>
        </div>

        <div style={styles.panelSection}>
          <div style={styles.panelSectionLabel}>Salida y retorno del taller</div>
          {drone.stage !== "listo" && !openDispatch && (
            <div style={styles.lockedHint}>Disponible cuando el dron esté en la etapa Listo.</div>
          )}
          {drone.stage === "listo" && !openDispatch && (
            <div style={styles.logForm}>
              <input
                value={oficioDraft}
                onChange={(e) => setOficioDraft(e.target.value)}
                placeholder="Número de oficio * (ej: OFICIO-2026-0142)"
                style={styles.formInput}
              />
              <button
                style={{ ...styles.advanceBtn, width: "100%", marginTop: 6, opacity: oficioDraft.trim() ? 1 : 0.4 }}
                onClick={() => {
                  onRegisterDispatch(drone.id, oficioDraft);
                  if (oficioDraft.trim()) setOficioDraft("");
                }}
              >
                <Send size={13} />
                Registrar salida
              </button>
            </div>
          )}
          {openDispatch && (
            <div style={styles.verifiedBadge}>
              <Send size={14} color="#D4AF37" />
              <div style={{ flex: 1 }}>
                <div style={{ ...styles.verifiedText, color: "#D4AF37" }}>Salió mediante oficio {openDispatch.oficio}</div>
                <div style={styles.historyMeta}>
                  {fmtDateTime(openDispatch.dispatchDate)} · {openDispatch.dispatchBy}
                </div>
              </div>
              <button style={{ ...styles.ghostBtn, flexShrink: 0 }} onClick={() => onRegisterReturn(drone.id, openDispatch.id)}>
                <Undo2 size={12} />
                Retorno
              </button>
            </div>
          )}
          {(drone.dispatches || []).length > 0 && (
            <div style={{ ...styles.logList, marginTop: 10 }}>
              {drone.dispatches.map((dp) => (
                <div key={dp.id} style={styles.logRow}>
                  {dp.returnDate ? <Undo2 size={13} color="#8B92A3" /> : <Send size={13} color="#D4AF37" />}
                  <div style={{ flex: 1 }}>
                    <div style={styles.checklistLabel}>Oficio {dp.oficio}</div>
                    <div style={styles.historyMeta}>
                      Salió {fmtDate(dp.dispatchDate)}
                      {dp.returnDate ? ` · Retornó ${fmtDate(dp.returnDate)}` : " · Aún fuera del taller"}
                    </div>
                  </div>
                  <button style={styles.logDeleteBtn} onClick={() => generateDispatchPdf(drone, dp)} title="Generar documento PDF">
                    <FileDown size={14} color="#8B92A3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={styles.panelSection}>
          <div style={styles.panelSectionLabel}>Registros por etapa</div>
          <div style={styles.stageTabRow}>
            {STAGES.map((s) => {
              const Icon = s.icon;
              const isActive = activeTab === s.id;
              return (
                <button
                  key={s.id}
                  style={{
                    ...styles.stageTabBtn,
                    borderColor: isActive ? s.accent : "#1E3350",
                    color: isActive ? s.accent : "#8B92A3",
                    background: isActive ? s.accentDim : "transparent",
                  }}
                  onClick={() => setActiveTab(s.id)}
                >
                  <Icon size={12} />
                  {s.label}
                </button>
              );
            })}
          </div>

          {(() => {
            const isCurrentStage = activeTab === drone.stage;
            const stageNotes = drone.history.filter((h) => h.type === "note" && h.stage === activeTab);
            const stageMaterials = (drone.materials || []).filter((m) => m.stage === activeTab);
            const stageLabor = (drone.laborLog || []).filter((l) => l.stage === activeTab);

            return (
              <>
                {activeTab === "pruebas" && (
                  <div style={styles.subBlock}>
                    <div style={styles.subBlockLabel}>Check de pruebas</div>
                    <div style={styles.checklist}>
                      {TEST_CHECKLIST.map((item) => {
                        const checked = !!drone.testChecklist?.[item.id];
                        const lockedList = !!drone.verification;
                        return (
                          <div
                            key={item.id}
                            style={{ ...styles.checklistItem, cursor: lockedList ? "default" : "pointer", opacity: lockedList && !checked ? 0.5 : 1 }}
                            onClick={() => !lockedList && onToggleChecklist(drone.id, item.id)}
                          >
                            {checked ? <CheckSquare size={16} color="#4ADE80" /> : <Square size={16} color="#565C68" />}
                            <span style={styles.checklistLabel}>{item.label}</span>
                          </div>
                        );
                      })}
                    </div>
                    {drone.verification ? (
                      <div style={styles.verifiedBadge}>
                        <ClipboardCheck size={14} color="#4ADE80" />
                        <div>
                          <div style={styles.verifiedText}>
                            Aprobado por {drone.verification.approvedBy} · {ROLE_LABELS[drone.verification.role]}
                          </div>
                          <div style={styles.historyMeta}>{fmtDateTime(drone.verification.date)}</div>
                        </div>
                        {perms.canVerify && (
                          <button style={{ ...styles.linkBtn, marginLeft: "auto", paddingTop: 0 }} onClick={() => onUnverify(drone.id)}>
                            Quitar
                          </button>
                        )}
                      </div>
                    ) : perms.canVerify ? (
                      <button
                        style={{ ...styles.advanceBtn, opacity: TEST_CHECKLIST.every((i) => drone.testChecklist?.[i.id]) ? 1 : 0.4 }}
                        disabled={!TEST_CHECKLIST.every((i) => drone.testChecklist?.[i.id])}
                        onClick={() => onVerify(drone.id)}
                      >
                        <ClipboardCheck size={13} />
                        Firmar verificación final
                      </button>
                    ) : (
                      <div style={styles.lockedHint}>Solo el jefe de taller o el administrador pueden firmar la verificación final.</div>
                    )}
                  </div>
                )}

                <div style={styles.subBlock}>
                  <div style={styles.subBlockLabel}>Notas de {STAGES.find((s) => s.id === activeTab)?.label}</div>
                  <div style={styles.historyList}>
                    {stageNotes.length === 0 && <div style={styles.lockedHint}>Sin notas en esta etapa aún.</div>}
                    {stageNotes.map((h) => (
                      <div key={h.id} style={styles.historyItem}>
                        <div style={styles.historyDot} />
                        <div style={{ flex: 1 }}>
                          <div style={styles.historyText}>{h.text}</div>
                          <div style={styles.historyMeta}>
                            {fmtDateTime(h.date)} · {h.technician}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {isCurrentStage && (
                    <>
                      <textarea
                        value={noteDraft}
                        onChange={(e) => setNoteDraft(e.target.value)}
                        placeholder="Describe lo que se hizo o encontró…"
                        style={{ ...styles.formTextarea, marginTop: 8 }}
                        rows={2}
                      />
                      <button style={{ ...styles.advanceBtn, opacity: noteDraft.trim() ? 1 : 0.4, marginTop: 8 }} onClick={submitNote}>
                        <MessageSquare size={13} />
                        Guardar nota
                      </button>
                    </>
                  )}
                </div>

                <div style={styles.subBlock}>
                  <div style={styles.subBlockLabel}>Insumos usados en {STAGES.find((s) => s.id === activeTab)?.label}</div>
                  <div style={styles.logList}>
                    {stageMaterials.length === 0 && <div style={styles.lockedHint}>Sin insumos registrados en esta etapa.</div>}
                    {stageMaterials.map((m) => (
                      <div key={m.id} style={styles.logRow}>
                        <Package size={13} color="#8B92A3" />
                        <div style={{ flex: 1 }}>
                          <div style={styles.checklistLabel}>
                            {m.quantity} {m.unit} · {m.name}
                          </div>
                          <div style={styles.historyMeta}>
                            {fmtDate(m.date)} · {m.technician}
                          </div>
                        </div>
                        {perms.canDelete && (
                          <button style={styles.logDeleteBtn} onClick={() => onRemoveMaterial(drone.id, m.id)}>
                            <X size={12} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  {isCurrentStage && (
                    <div style={styles.logForm}>
                      {hasCatalog ? (
                        <>
                          <select
                            value={selectedCatalogValue}
                            onChange={(e) => {
                              const v = e.target.value;
                              setMatCatalogChoice(v);
                              const item = inventory.find((it) => it.name === v);
                              if (item) setMatUnit(item.unit);
                            }}
                            style={styles.formInput}
                          >
                            {inventory.map((it) => {
                              const used = materialsUsedByKey.get(normalizeName(it.name)) || 0;
                              const remaining = it.initialQuantity - used;
                              return (
                                <option key={it.id} value={it.name}>
                                  {it.name} (quedan {remaining} {it.unit})
                                </option>
                              );
                            })}
                            <option value={OTHER_MATERIAL_OPTION}>{OTHER_MATERIAL_OPTION}</option>
                          </select>
                          {isOtherMaterial && (
                            <input
                              autoFocus
                              value={matName}
                              onChange={(e) => setMatName(e.target.value)}
                              placeholder="Insumo * (ej: hélice, batería 4S)"
                              style={{ ...styles.formInput, marginTop: 6 }}
                            />
                          )}
                        </>
                      ) : (
                        <input value={matName} onChange={(e) => setMatName(e.target.value)} placeholder="Insumo * (ej: hélice, batería 4S)" style={styles.formInput} />
                      )}
                      <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={matQty}
                          onChange={(e) => setMatQty(e.target.value)}
                          style={{ ...styles.formInput, width: 70 }}
                        />
                        <input value={matUnit} onChange={(e) => setMatUnit(e.target.value)} placeholder="unidad" style={{ ...styles.formInput, width: 90 }} />
                        <button
                          style={{ ...styles.ghostBtn, flex: 1 }}
                          onClick={() => {
                            const finalName = isOtherMaterial ? matName : selectedCatalogValue;
                            onAddMaterial(drone.id, { name: finalName, quantity: Number(matQty) || 0, unit: matUnit });
                            setMatCatalogChoice("");
                            setMatName("");
                            setMatQty("1");
                            setMatUnit("u");
                          }}
                        >
                          <Plus size={13} />
                          Agregar
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div style={styles.subBlock}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                    <div style={styles.subBlockLabel}>Tiempo hombre en {STAGES.find((s) => s.id === activeTab)?.label}</div>
                    <div style={styles.laborTotal}>
                      <Timer size={12} />
                      {stageLabor.reduce((sum, l) => sum + (Number(l.hours) || 0), 0)}h
                    </div>
                  </div>
                  <div style={styles.logList}>
                    {stageLabor.length === 0 && <div style={styles.lockedHint}>Sin horas registradas en esta etapa.</div>}
                    {stageLabor.map((l) => (
                      <div key={l.id} style={styles.logRow}>
                        <Timer size={13} color="#8B92A3" />
                        <div style={{ flex: 1 }}>
                          <div style={styles.checklistLabel}>
                            {l.hours}h · {l.technician}
                            {l.description ? ` — ${l.description}` : ""}
                          </div>
                          <div style={styles.historyMeta}>{fmtDate(l.date)}</div>
                        </div>
                        {perms.canDelete && (
                          <button style={styles.logDeleteBtn} onClick={() => onRemoveLabor(drone.id, l.id)}>
                            <X size={12} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  {isCurrentStage && (
                    <div style={styles.logForm}>
                      <div style={{ display: "flex", gap: 6 }}>
                        <input
                          type="number"
                          min="0"
                          step="0.5"
                          value={laborHours}
                          onChange={(e) => setLaborHours(e.target.value)}
                          placeholder="Horas *"
                          style={{ ...styles.formInput, width: 80 }}
                        />
                        <input value={laborDesc} onChange={(e) => setLaborDesc(e.target.value)} placeholder="Descripción (opcional)" style={styles.formInput} />
                      </div>
                      <button
                        style={{ ...styles.ghostBtn, width: "100%", marginTop: 6 }}
                        onClick={() => {
                          onAddLabor(drone.id, { hours: Number(laborHours), description: laborDesc });
                          setLaborHours("");
                          setLaborDesc("");
                        }}
                      >
                        <Plus size={13} />
                        Registrar horas
                      </button>
                    </div>
                  )}
                </div>
              </>
            );
          })()}
        </div>

        <div style={styles.panelSection}>
          <div style={styles.panelSectionLabel}>Historial completo</div>
          <div style={styles.historyList}>
            {drone.history.map((h) => (
              <div key={h.id} style={styles.historyItem}>
                <div style={styles.historyDot} />
                <div style={{ flex: 1 }}>
                  <div style={styles.historyText}>{h.text}</div>
                  <div style={styles.historyMeta}>
                    {fmtDateTime(h.date)} · {h.technician}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {perms.canDelete && (
          <div style={styles.panelFooter}>
            {confirmDelete ? (
              <div style={styles.confirmRow}>
                <span style={styles.confirmText}>¿Eliminar este dron del taller?</span>
                <button style={styles.dangerBtn} onClick={() => onDelete(drone.id)}>
                  Eliminar
                </button>
                <button style={styles.ghostBtn} onClick={() => setConfirmDelete(false)}>
                  Cancelar
                </button>
              </div>
            ) : (
              <button style={styles.deleteLink} onClick={() => setConfirmDelete(true)}>
                <Trash2 size={12} />
                Eliminar dron
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const FONT_HEAD = "'Oswald', sans-serif";
const FONT_BODY = "'Inter', sans-serif";
const FONT_MONO = "'IBM Plex Mono', monospace";

const styles = {
  loginShell: {
    minHeight: "100vh",
    background: "#060B14",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  loginCard: {
    background: "#101E33",
    border: "1px solid #1E3350",
    borderRadius: 14,
    padding: 28,
    width: 340,
    maxWidth: "92vw",
  },
  loginTitle: { fontFamily: FONT_HEAD, fontSize: 19, fontWeight: 600, marginTop: 14, letterSpacing: 0.5 },
  loginSubtitle: { fontSize: 11.5, color: "#8B92A3", marginTop: 3, fontFamily: FONT_MONO },
  loginError: { fontSize: 12, color: "#F09595", marginTop: 8 },
  roleBtn: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 13,
    color: "#E8E9ED",
    background: "#0A1220",
    border: "1px solid #1E3350",
    borderRadius: 8,
    padding: "10px 12px",
    cursor: "pointer",
    fontFamily: FONT_BODY,
  },
  sessionBadge: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontSize: 11.5,
    color: "#8B92A3",
    background: "#101E33",
    border: "1px solid #1E3350",
    borderRadius: 7,
    padding: "7px 10px",
    fontFamily: FONT_MONO,
  },
  toast: {
    position: "fixed",
    top: 16,
    left: "50%",
    transform: "translateX(-50%)",
    zIndex: 100,
    display: "flex",
    alignItems: "center",
    gap: 9,
    border: "1px solid",
    borderRadius: 9,
    padding: "10px 12px",
    maxWidth: "90vw",
    boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
    fontFamily: "'Inter', sans-serif",
  },
  toastText: { fontSize: 12.5, lineHeight: 1.4 },
  toastClose: { background: "transparent", border: "none", cursor: "pointer", padding: 2, flexShrink: 0, display: "flex" },
  analyticsList: { display: "flex", flexDirection: "column", gap: 14, maxHeight: 420, overflowY: "auto" },
  analyticsRow: { display: "flex", gap: 10, alignItems: "flex-start" },
  analyticsRank: { fontSize: 12, color: "#D4AF37", fontFamily: FONT_MONO, fontWeight: 600, width: 26, flexShrink: 0, paddingTop: 1 },
  analyticsName: { fontSize: 13, fontWeight: 500, marginBottom: 5, textTransform: "capitalize" },
  analyticsBarTrack: { height: 6, background: "#0A1220", borderRadius: 3, overflow: "hidden", marginBottom: 5 },
  analyticsBarFill: { height: "100%", background: "linear-gradient(90deg, #C9A227, #E8C158)", borderRadius: 3 },
  analyticsMeta: { fontSize: 10.5, color: "#8B92A3", fontFamily: FONT_MONO, lineHeight: 1.5 },
  appShell: {
    background: "#0A1220",
    minHeight: "100vh",
    padding: "24px 26px 40px",
    fontFamily: FONT_BODY,
    color: "#E8E9ED",
    backgroundImage: "linear-gradient(#101E33 1px, transparent 1px), linear-gradient(90deg, #101E33 1px, transparent 1px)",
    backgroundSize: "28px 28px",
    backgroundPosition: "-1px -1px",
  },
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 4 },
  flagStripe: {
    height: 3,
    borderRadius: 2,
    marginBottom: 22,
    background: "linear-gradient(90deg, #C9A227 0 50%, #1B4B8F 50% 75%, #C8373B 75% 100%)",
  },
  logoImg: { width: "100%", height: "100%", objectFit: "cover" },
  headerLeft: { display: "flex", alignItems: "center", gap: 10 },
  logoMark: {
    width: 34,
    height: 34,
    borderRadius: 8,
    background: "#0F2A4D",
    border: "1px solid #C9A227",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  title: { fontFamily: FONT_HEAD, fontSize: 17, fontWeight: 600, letterSpacing: 0.3 },
  subtitle: { fontSize: 12, color: "#8B92A3", marginTop: 1, fontFamily: FONT_MONO },
  headerRight: { display: "flex", alignItems: "center", gap: 8 },
  saveErrorBadge: {
    display: "flex",
    alignItems: "center",
    gap: 5,
    fontSize: 11,
    color: "#F5A623",
    background: "#3B2D14",
    border: "1px solid #5C4419",
    borderRadius: 6,
    padding: "5px 8px",
  },
  newButton: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontSize: 12.5,
    fontWeight: 500,
    color: "#1A1400",
    background: "#C9A227",
    border: "none",
    borderRadius: 7,
    padding: "8px 13px",
    cursor: "pointer",
    fontFamily: FONT_BODY,
  },
  lineWrap: { position: "relative", display: "flex", justifyContent: "space-between", padding: "6px 18px 26px", marginBottom: 6 },
  lineTrack: { position: "absolute", top: 18, left: 46, right: 46, height: 1, background: "#1E3350" },
  lineNode: { position: "relative", display: "flex", flexDirection: "column", alignItems: "center", gap: 6, zIndex: 1 },
  lineCircle: { width: 36, height: 36, borderRadius: "50%", border: "1.5px solid", display: "flex", alignItems: "center", justifyContent: "center" },
  lineLabel: { fontSize: 10.5, color: "#8B92A3", fontFamily: FONT_MONO, letterSpacing: 0.3 },
  lineCount: { fontSize: 13, fontWeight: 600, fontFamily: FONT_MONO, marginTop: -3 },
  loadingRow: { display: "flex", alignItems: "center", gap: 8, color: "#8B92A3", fontSize: 13, padding: "40px 0", justifyContent: "center" },
  board: { display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 12 },
  dispatchedSection: { marginTop: 22, paddingTop: 18, borderTop: "1px dashed #1E3350" },
  dispatchedHeader: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontSize: 12,
    fontWeight: 500,
    color: "#D4AF37",
    fontFamily: FONT_MONO,
    marginBottom: 12,
  },
  dispatchedGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 10 },
  dispatchedCard: {
    background: "#122238",
    border: "1px solid #1C2E4A",
    borderLeft: "3px solid #D4AF37",
    borderRadius: 8,
    padding: "9px 11px",
    cursor: "pointer",
    opacity: 0.85,
  },
  dispatchedMeta: { fontSize: 10.5, color: "#8B92A3", fontFamily: FONT_MONO, marginTop: 6 },
  column: { background: "#0D1A2C", border: "1px solid #16273F", borderRadius: 10, display: "flex", flexDirection: "column", minHeight: 260, maxHeight: 560 },
  columnHeader: { display: "flex", alignItems: "center", gap: 6, padding: "10px 12px", borderBottom: "1px solid #16273F" },
  columnTitle: { fontSize: 12, fontWeight: 500, fontFamily: FONT_MONO, letterSpacing: 0.2, flex: 1 },
  columnCount: { fontSize: 11, color: "#565C68", fontFamily: FONT_MONO },
  columnBody: { padding: 8, display: "flex", flexDirection: "column", gap: 8, overflowY: "auto", flex: 1 },
  columnEmpty: { fontSize: 11, color: "#4A4F59", textAlign: "center", padding: "18px 8px" },
  card: { background: "#122238", border: "1px solid #1C2E4A", borderLeft: "3px solid", borderRadius: 8, padding: "9px 11px", cursor: "pointer" },
  cardThumb: { width: 44, height: 44, borderRadius: 6, objectFit: "cover", flexShrink: 0, border: "1px solid #1C2E4A" },
  cardName: { fontSize: 12.5, fontWeight: 500, marginBottom: 2 },
  cardModel: { fontSize: 11, color: "#8B92A3", marginBottom: 6 },
  originTag: {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    fontSize: 10,
    color: "#AFA9EC",
    background: "#26215C",
    border: "1px solid #3C3489",
    borderRadius: 5,
    padding: "2px 6px",
    marginBottom: 7,
    fontFamily: FONT_MONO,
  },
  linkBtn: {
    display: "flex",
    alignItems: "center",
    gap: 5,
    fontSize: 11,
    color: "#D4AF37",
    background: "transparent",
    border: "none",
    cursor: "pointer",
    padding: "6px 0 0",
    fontFamily: FONT_BODY,
  },
  cardMetaRow: { display: "flex", gap: 10, flexWrap: "wrap" },
  cardMetaItem: { display: "flex", alignItems: "center", gap: 3, fontSize: 10.5, color: "#68707D", fontFamily: FONT_MONO },
  emptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "56px 20px",
    textAlign: "center",
    border: "1px dashed #1E3350",
    borderRadius: 10,
    gap: 6,
  },
  emptyIconWrap: { width: 44, height: 44, borderRadius: 10, background: "#101E33", border: "1px solid #1E3350", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 6 },
  emptyTitle: { fontFamily: FONT_HEAD, fontSize: 15, fontWeight: 600 },
  emptyBody: { fontSize: 12.5, color: "#8B92A3", maxWidth: 320, marginBottom: 10, lineHeight: 1.5 },
  overlay: { position: "fixed", inset: 0, background: "rgba(8,9,11,0.6)", display: "flex", alignItems: "center", justifyContent: "flex-end", zIndex: 50 },
  modal: { background: "#101E33", border: "1px solid #1E3350", borderRadius: 12, padding: 20, width: 380, maxWidth: "92vw", margin: "auto" },
  analyticsModal: { width: 760, maxWidth: "94vw", maxHeight: "88vh", overflowY: "auto" },
  chartsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 14 },
  chartCard: { background: "#0C1728", border: "1px solid #1E3350", borderRadius: 10, padding: "14px 14px 6px" },
  chartCardTitle: { fontFamily: FONT_HEAD, fontSize: 13, letterSpacing: 0.3, color: "#E7EAF2", marginBottom: 8 },
  statTile: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "18px 0" },
  statTileValue: { fontFamily: FONT_HEAD, fontSize: 34, color: "#D4AF37", lineHeight: 1 },
  statTileLabel: { fontSize: 12, color: "#8B92A3", marginTop: 6 },
  sidePanel: { background: "#101E33", border: "1px solid #1E3350", borderRadius: "12px 0 0 12px", padding: 20, width: 380, maxWidth: "92vw", height: "100%", maxHeight: "100vh", overflowY: "auto" },
  modalHeader: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 },
  modalTitle: { fontFamily: FONT_HEAD, fontSize: 16, fontWeight: 600 },
  panelModel: { fontSize: 11.5, color: "#8B92A3", marginTop: 2, fontFamily: FONT_MONO },
  iconButton: {
    background: "transparent",
    border: "1px solid #1E3350",
    borderRadius: 6,
    width: 26,
    height: 26,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#8B92A3",
    cursor: "pointer",
    flexShrink: 0,
  },
  formField: { marginBottom: 12 },
  formLabel: { display: "block", fontSize: 11, color: "#8B92A3", marginBottom: 5, fontFamily: FONT_MONO },
  formInput: { width: "100%", fontSize: 13, color: "#E8E9ED", background: "#0A1220", border: "1px solid #1E3350", borderRadius: 7, padding: "8px 10px", outline: "none", fontFamily: FONT_BODY },
  formTextarea: { width: "100%", fontSize: 13, color: "#E8E9ED", background: "#0A1220", border: "1px solid #1E3350", borderRadius: 7, padding: "8px 10px", outline: "none", resize: "vertical", fontFamily: FONT_BODY },
  formFooter: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginTop: 4 },
  formHint: { fontSize: 10.5, color: "#565C68" },
  photoPreview: { width: "100%", maxHeight: 140, objectFit: "cover", borderRadius: 7, marginTop: 8, border: "1px solid #1E3350" },
  fileDropZone: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 12.5,
    color: "#8B92A3",
    background: "#0A1220",
    border: "1px dashed #1E3350",
    borderRadius: 7,
    padding: "10px 12px",
    cursor: "pointer",
    fontFamily: FONT_BODY,
  },
  detailPhotoWrap: { position: "relative", marginBottom: 16, cursor: "pointer" },
  detailPhoto: { width: "100%", height: 160, objectFit: "cover", borderRadius: 8, display: "block" },
  detailPhotoEditHint: {
    position: "absolute",
    bottom: 8,
    right: 8,
    fontSize: 10.5,
    color: "#E8E9ED",
    background: "rgba(10,18,32,0.75)",
    borderRadius: 5,
    padding: "3px 7px",
  },
  panelSection: { marginBottom: 18, paddingBottom: 18, borderBottom: "1px solid #16273F" },
  panelSectionLabel: { fontSize: 10.5, color: "#565C68", fontFamily: FONT_MONO, letterSpacing: 0.3, marginBottom: 8, textTransform: "uppercase" },
  stageRow: { display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 },
  stageBtn: { display: "flex", alignItems: "center", gap: 5, fontSize: 11.5, border: "1px solid", borderRadius: 7, padding: "6px 9px", cursor: "pointer", fontFamily: FONT_BODY },
  advanceBtn: { display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#1A1400", background: "#C9A227", border: "none", borderRadius: 7, padding: "8px 11px", cursor: "pointer", fontFamily: FONT_BODY },
  metaGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", rowGap: 12, columnGap: 10 },
  metaValue: { fontSize: 12.5, fontFamily: FONT_MONO },
  metaValueBtn: { fontSize: 12.5, fontFamily: FONT_BODY, background: "transparent", border: "none", borderBottom: "1px dashed #4A4F59", color: "#E8E9ED", padding: 0, cursor: "pointer" },
  historyList: { display: "flex", flexDirection: "column", gap: 12, maxHeight: 220, overflowY: "auto" },
  historyItem: { display: "flex", gap: 9 },
  historyDot: { width: 6, height: 6, borderRadius: "50%", background: "#4C8DFF", marginTop: 5, flexShrink: 0 },
  historyText: { fontSize: 12.5, lineHeight: 1.45 },
  historyMeta: { fontSize: 10.5, color: "#565C68", fontFamily: FONT_MONO, marginTop: 2 },
  checklist: { display: "flex", flexDirection: "column", gap: 9, marginBottom: 12 },
  checklistItem: { display: "flex", alignItems: "flex-start", gap: 8 },
  checklistLabel: { fontSize: 12.5, lineHeight: 1.4 },
  verifiedBadge: {
    display: "flex",
    alignItems: "flex-start",
    gap: 8,
    background: "#173A28",
    border: "1px solid #2A6B4A",
    borderRadius: 8,
    padding: "10px 12px",
  },
  verifiedText: { fontSize: 12, color: "#9EE8B8", fontWeight: 500 },
  lockedHint: { fontSize: 11, color: "#8B92A3", marginTop: 8, lineHeight: 1.4 },
  logList: { display: "flex", flexDirection: "column", gap: 10, marginBottom: 10 },
  logRow: { display: "flex", alignItems: "flex-start", gap: 8 },
  logDeleteBtn: {
    background: "transparent",
    border: "none",
    color: "#565C68",
    cursor: "pointer",
    padding: 2,
    flexShrink: 0,
  },
  logForm: { background: "#0A1220", border: "1px solid #1E3350", borderRadius: 8, padding: 10 },
  stageTabRow: { display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 },
  stageTabBtn: {
    display: "flex",
    alignItems: "center",
    gap: 5,
    fontSize: 11,
    border: "1px solid",
    borderRadius: 7,
    padding: "6px 9px",
    cursor: "pointer",
    fontFamily: FONT_BODY,
  },
  subBlock: { marginBottom: 16, paddingBottom: 16, borderBottom: "1px solid #16273F" },
  subBlockLabel: { fontSize: 10.5, color: "#565C68", fontFamily: FONT_MONO, letterSpacing: 0.3, marginBottom: 8 },
  laborTotal: {
    display: "flex",
    alignItems: "center",
    gap: 5,
    fontSize: 11,
    color: "#D4AF37",
    fontFamily: FONT_MONO,
  },
  panelFooter: { marginTop: 4 },
  deleteLink: { display: "flex", alignItems: "center", gap: 5, fontSize: 11.5, color: "#68707D", background: "transparent", border: "none", cursor: "pointer", padding: 0 },
  confirmRow: { display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" },
  confirmText: { fontSize: 11.5, color: "#8B92A3" },
  dangerBtn: { fontSize: 11.5, color: "#FCEBEB", background: "#712B13", border: "none", borderRadius: 6, padding: "5px 10px", cursor: "pointer" },
  ghostBtn: { fontSize: 11.5, color: "#8B92A3", background: "transparent", border: "1px solid #1E3350", borderRadius: 6, padding: "5px 10px", cursor: "pointer" },
};
