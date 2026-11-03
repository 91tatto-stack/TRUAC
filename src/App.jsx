import React, { useState, useEffect, useRef, useCallback } from "react";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { jsPDF } from "jspdf";
import { db, auth, loginWithUsername, authMessage } from "./firebase.js";
import { ChangePasswordForm, ChangePasswordModal, PasswordInput } from "./Cuenta.jsx";
import { ROLE_LABELS, PERMISSIONS } from "./roles.js";
import UsuariosTab, { useUsuarios, USER_REF, roleIcon } from "./Usuarios.jsx";
import { EQUIPMENT_MODELS, OTHER_MODEL_OPTION } from "./models.js";
import { styles } from "./styles.js";
import InsumosTab from "./Insumos.jsx";
import GastosTab from "./Gastos.jsx";
import {
  useInsumos,
  useGastos,
  computeStock,
  stockStatus,
  saveMovement,
  findItemByName,
  droneCost,
  fmtMoney,
  fmtQty,
} from "./data.js";
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
  Users,
  KeyRound,
  Eye,
  EyeOff,
  ClipboardCheck,
  Square,
  CheckSquare,
  Package,
  Timer,
  Send,
  Undo2,
  FileDown,
  Wallet,
  LayoutGrid,
  Coins,
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
const VIEW_KEY = "taller-drones:pestana";

const VIEWS = [
  { id: "taller", label: "Taller", icon: LayoutGrid },
  { id: "insumos", label: "Insumos", icon: Package },
  { id: "gastos", label: "Control de gastos", icon: Wallet },
  { id: "usuarios", label: "Usuarios", icon: Users, adminOnly: true },
];

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

function generateDispatchPdf(drone, dispatch, cost) {
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

  row("Identificador", drone.name);
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
  y += 7;
  if (cost && cost.total > 0) {
    doc.text(`Costo de la reparación: ${fmtMoney(cost.total)}`, marginX, y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    y += 5;
    doc.text(`(insumos del inventario ${fmtMoney(cost.insumos)} + gastos asociados ${fmtMoney(cost.gastos)})`, marginX, y);
    y += 5;
  }
  y += 3;
  doc.setFont("helvetica", "normal");

  y += 10;
  doc.line(marginX, y, 100, y);
  doc.line(120, y, 192, y);
  y += 5;
  doc.setFontSize(9);
  doc.text("Firma jefe de taller / administrador", marginX, y);
  doc.text("Firma técnico responsable", 120, y);

  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text(`Documento generado el ${fmtDateTime(new Date().toISOString())} — anexar al oficio ${dispatch.oficio}`, marginX, 285);

  doc.save(`TRUAC-oficio-${dispatch.oficio || "sin-numero"}-${drone.name}.pdf`);
}

// ---------------------------------------------------------------------------
// Root: sesión con Firebase Authentication + perfil en usuarios/{uid}
// ---------------------------------------------------------------------------

export default function App() {
  // undefined = verificando, null = sin sesión, objeto = usuario de Firebase
  const [authUser, setAuthUser] = useState(undefined);
  // undefined = cargando, null = no existe, objeto = perfil (nombre, rol, activo)
  const [profile, setProfile] = useState(undefined);

  useEffect(() => onAuthStateChanged(auth, (u) => setAuthUser(u || null)), []);

  useEffect(() => {
    if (!authUser) {
      setProfile(undefined);
      return undefined;
    }
    const unsub = onSnapshot(
      USER_REF(authUser.uid),
      (snap) => setProfile(snap.exists() ? snap.data() : null),
      () => setProfile(null)
    );
    return () => unsub();
  }, [authUser]);

  // Limpia la sesión vieja por PIN que pudiera quedar en el navegador.
  useEffect(() => {
    try {
      localStorage.removeItem("taller-drones:sesion");
    } catch {
      /* sin almacenamiento local */
    }
  }, []);

  function logout() {
    signOut(auth).catch(() => {});
  }

  if (authUser === undefined || (authUser && profile === undefined)) return <FullScreenLoader text="Verificando sesión…" />;
  if (!authUser) return <LoginGate />;
  if (!profile || profile.activo !== true || !PERMISSIONS[profile.rol]) {
    return <AccountBlocked missing={!profile} replaced={!!profile?.reemplazadoPor} onLogout={logout} />;
  }
  if (profile.debeCambiarClave) {
    return (
      <div style={styles.loginShell}>
        <div style={styles.loginCard}>
          <LoginBrand />
          <div style={{ ...styles.panelSectionLabel, marginTop: 18 }}>Hola, {profile.nombre}</div>
          <ChangePasswordForm uid={authUser.uid} forced onDone={() => {}} onLogout={logout} />
        </div>
      </div>
    );
  }

  const session = { uid: authUser.uid, username: profile.usuario || authUser.email, name: profile.nombre, role: profile.rol };
  return <Dashboard session={session} onLogout={logout} />;
}

function FullScreenLoader({ text }) {
  return (
    <div style={styles.loginShell}>
      <div style={{ ...styles.loadingRow, padding: 0 }}>
        <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />
        <span>{text}</span>
      </div>
    </div>
  );
}

function LoginBrand() {
  return (
    <>
      <div style={styles.logoMark}>
        <Radio size={20} color="#D4AF37" />
      </div>
      <div style={styles.loginTitle}>TRUAC</div>
      <div style={styles.loginSubtitle}>Taller de Reparación de UAS y C-UAS</div>
    </>
  );
}

function AccountBlocked({ missing, replaced, onLogout }) {
  return (
    <div style={styles.loginShell}>
      <div style={styles.loginCard}>
        <LoginBrand />
        <div style={{ ...styles.warnBox, marginTop: 18 }}>
          {replaced
            ? "Esa contraseña ya no es válida: el administrador te asignó una nueva."
            : missing
            ? "Esta cuenta todavía no tiene un rol asignado en TRUAC."
            : "Esta cuenta está desactivada."}{" "}
          {replaced ? "Pídela al administrador del taller." : "Pídele al administrador del taller que la habilite."}
        </div>
        <button style={{ ...styles.ghostBtn, width: "100%", padding: "8px 10px" }} onClick={onLogout}>
          Volver
        </button>
      </div>
    </div>
  );
}

function LoginGate() {
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [forgot, setForgot] = useState(false);

  async function submit() {
    setError("");
    if (!usuario.trim()) return setError("Escribe tu usuario.");
    if (!password) return setError("Escribe tu contraseña.");
    setBusy(true);
    try {
      await loginWithUsername(usuario, password);
      // onAuthStateChanged se encarga del resto.
    } catch (err) {
      setError(authMessage(err, "No se pudo iniciar sesión. Intenta de nuevo."));
      setBusy(false);
    }
  }

  return (
    <div style={styles.loginShell}>
      <div style={styles.loginCard}>
        <LoginBrand />
        <div style={{ ...styles.panelSectionLabel, marginTop: 18 }}>Iniciar sesión</div>

        <label style={{ ...styles.formLabel, marginTop: 8 }}>Usuario</label>
        <input
          autoFocus
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          value={usuario}
          onChange={(ev) => setUsuario(ev.target.value)}
          onKeyDown={(ev) => ev.key === "Enter" && submit()}
          placeholder="."
          style={styles.formInput}
        />

        <label style={{ ...styles.formLabel, marginTop: 10 }}>Contraseña</label>
        <PasswordInput value={password} onChange={setPassword} autoComplete="current-password" onEnter={submit} />

        {error && <div style={styles.loginError}>{error}</div>}

        <button
          style={{ ...styles.newButton, width: "100%", justifyContent: "center", marginTop: 14, opacity: busy ? 0.6 : 1 }}
          onClick={submit}
          disabled={busy}
        >
          <KeyRound size={14} /> {busy ? "Entrando…" : "Entrar"}
        </button>

        <button style={{ ...styles.linkBtn, marginTop: 6 }} onClick={() => setForgot((v) => !v)}>
          ¿Olvidaste tu contraseña?
        </button>
        {forgot && (
          <div style={{ ...styles.infoBox, marginTop: 8, marginBottom: 0 }}>
            Pídele al administrador del taller que te asigne una nueva desde la pestaña Usuarios.
          </div>
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
  const [toast, setToast] = useState(null);
  const permsForViews = PERMISSIONS[session.role] || PERMISSIONS.tecnico;
  const visibleViews = VIEWS.filter((x) => !x.adminOnly || permsForViews.canManageUsers);
  const [view, setView] = useState(() => {
    try {
      const v = localStorage.getItem(VIEW_KEY);
      return visibleViews.some((x) => x.id === v) ? v : "taller";
    } catch {
      return "taller";
    }
  });
  const [showPwd, setShowPwd] = useState(false);
  const usuarios = useUsuarios();
  const activeNames = (usuarios || []).filter((u) => u.activo).map((u) => u.nombre).sort((a, b) => a.localeCompare(b, "es"));
  const insumos = useInsumos();
  const gastos = useGastos();
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

  function changeView(v) {
    setView(v);
    try {
      localStorage.setItem(VIEW_KEY, v);
    } catch {
      /* sin almacenamiento local: igual cambia de pestaña */
    }
  }

  const inventoryItems = insumos?.items || [];
  const inventoryMoves = insumos?.movements || [];
  const stockMap = React.useMemo(() => computeStock(inventoryItems, inventoryMoves), [inventoryItems, inventoryMoves]);
  const lowStockCount = inventoryItems.filter(
    (it) => it.active !== false && stockStatus(stockMap.get(it.id)?.stock || 0, it.minStock) !== "ok"
  ).length;

  function updateLogo(url) {
    setDoc(CONFIG_REF(), { logoUrl: url }, { merge: true }).catch(() => {});
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
    // Si el nombre coincide con un insumo del inventario, se descuenta del stock.
    const item = findItemByName(inventoryItems, name);
    const info = item ? stockMap.get(item.id) || { stock: 0, avgCost: 0 } : null;
    const drone = (drones || []).find((d) => d.id === droneId);
    const materialId = uid();
    if (item && drone) {
      saveMovement({
        id: uid(),
        itemId: item.id,
        itemName: item.name,
        type: "salida",
        quantity,
        unitCost: Math.round(info.avgCost || 0),
        date: now,
        by: session.name,
        droneId: drone.id,
        droneName: drone.name,
        materialId,
        note: `Usado en ${STAGES.find((s) => s.id === drone.stage)?.label || "reparación"}`,
      }).catch(() => notify("error", "El insumo quedó en el dron, pero no se pudo descontar del inventario."));
    }
    updateDrones((prev) =>
      prev.map((d) => {
        if (d.id !== droneId) return d;
        const entry = {
          id: materialId,
          name: item ? item.name : name.trim(),
          quantity,
          unit: item ? item.unit : unit.trim() || "u",
          date: now,
          technician: session.name,
          stage: d.stage,
          ...(item ? { itemId: item.id, unitCost: Math.round(info.avgCost || 0) } : {}),
        };
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
    if (item && quantity > info.stock) {
      notify("info", `Registrado. Ojo: en el inventario solo había ${fmtQty(info.stock)} ${item.unit} de ${item.name}; revisa el stock.`);
    } else if (item) {
      notify("success", `Insumo registrado y descontado del inventario (quedan ${fmtQty(info.stock - quantity)} ${item.unit}).`);
    } else {
      notify("success", "Insumo registrado (no está en el inventario, no se descontó stock).");
    }
  }

  function removeMaterial(droneId, materialId) {
    if (!perms.canDelete) return;
    const drone = (drones || []).find((d) => d.id === droneId);
    const material = (drone?.materials || []).find((m) => m.id === materialId);
    if (material?.itemId) {
      const item = inventoryItems.find((it) => it.id === material.itemId);
      saveMovement({
        id: uid(),
        itemId: material.itemId,
        itemName: item?.name || material.name,
        type: "reintegro",
        quantity: Number(material.quantity) || 0,
        unitCost: Number(material.unitCost) || 0,
        date: new Date().toISOString(),
        by: session.name,
        droneId: drone.id,
        droneName: drone.name,
        materialId,
        note: "Registro de insumo anulado en el dron",
      }).catch(() => notify("error", "No se pudo devolver el insumo al inventario."));
      notify("success", "Registro eliminado y cantidad devuelta al inventario.");
    }
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

  return (
    <div style={styles.appShell} className="truac-shell">
      <Toast toast={toast} onDismiss={() => setToast(null)} />
      <Header
        session={session}
        onLogout={onLogout}
        onChangePassword={() => setShowPwd(true)}
        total={activeList.length}
        showNew={view === "taller"}
        onNew={() => setShowNewModal(true)}
        onOpenMaterialsPanel={() => setShowMaterialsPanel(true)}
        saveError={saveError}
        logoUrl={logoUrl}
        canEditLogo={perms.canDelete}
        onEditLogo={updateLogo}
      />
      <FlagStripe />
      <NavTabs views={visibleViews} view={view} onChange={changeView} lowStockCount={lowStockCount} />

      {showPwd && <ChangePasswordModal uid={session.uid} notify={notify} onClose={() => setShowPwd(false)} />}
      {view === "usuarios" && perms.canManageUsers && <UsuariosTab usuarios={usuarios} session={session} notify={notify} />}
      {view === "insumos" && <InsumosTab insumos={insumos} drones={list} session={session} perms={perms} notify={notify} />}
      {view === "gastos" && (
        <GastosTab gastos={gastos} insumos={insumos} drones={list} session={session} perms={perms} notify={notify} />
      )}

      {view === "taller" && <AssemblyLine counts={counts} />}

      {view !== "taller" ? null : loading ? (
        <div style={styles.loadingRow}>
          <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />
          <span>Cargando flota…</span>
        </div>
      ) : list.length === 0 ? (
        <EmptyState onNew={() => setShowNewModal(true)} />
      ) : (
        <div style={styles.board} className="truac-board">
          {STAGES.map((stage) => (
            <StageColumn key={stage.id} stage={stage} drones={activeList.filter((d) => d.stage === stage.id)} onOpen={setSelectedId} />
          ))}
        </div>
      )}

      {view === "taller" && dispatchedList.length > 0 && (
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
      {showMaterialsPanel && <AnalyticsModal drones={list} onClose={() => setShowMaterialsPanel(false)} />}

      {selected && (
        <DetailPanel
          drone={selected}
          perms={perms}
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
          technicianNames={activeNames}
          inventoryItems={inventoryItems.filter((it) => it.active !== false)}
          stockMap={stockMap}
          cost={droneCost(selected.id, inventoryMoves, gastos?.expenses || [])}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Header + assembly line
// ---------------------------------------------------------------------------

function Header({ session, onLogout, onChangePassword, total, showNew, onNew, onOpenMaterialsPanel, saveError, logoUrl, canEditLogo, onEditLogo }) {
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

      <div style={styles.headerRight} className="truac-header-right">
        {saveError && (
          <div style={styles.saveErrorBadge}>
            <AlertTriangle size={13} />
            Sin conexión al guardar
          </div>
        )}
        <div style={styles.sessionBadge}>
          {roleIcon(session.role)}
          {session.name} · {ROLE_LABELS[session.role]}
        </div>
        <button style={styles.iconButton} onClick={onOpenMaterialsPanel} title="Análisis de insumos">
          <BarChart3 size={14} />
        </button>
        <button style={styles.iconButton} onClick={onChangePassword} title="Cambiar mi contraseña">
          <KeyRound size={14} />
        </button>
        <button style={styles.iconButton} onClick={onLogout} title="Cerrar sesión">
          <LogOut size={14} />
        </button>
        {showNew && (
          <button style={styles.newButton} onClick={onNew}>
            <Plus size={15} />
            Nuevo dron
          </button>
        )}
      </div>
    </div>
  );
}

function NavTabs({ views, view, onChange, lowStockCount }) {
  return (
    <div style={styles.navTabs} role="tablist">
      {views.map((v) => {
        const Icon = v.icon;
        const active = view === v.id;
        return (
          <button
            key={v.id}
            role="tab"
            aria-selected={active}
            style={{ ...styles.navTab, ...(active ? styles.navTabActive : {}) }}
            onClick={() => onChange(v.id)}
          >
            <Icon size={15} />
            {v.label}
            {v.id === "insumos" && lowStockCount > 0 && (
              <span style={styles.navBadge} title="Insumos con stock bajo o agotado">
                {lowStockCount}
              </span>
            )}
          </button>
        );
      })}
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
    <div style={styles.column} className="truac-column">
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

function AnalyticsModal({ drones, onClose }) {
  const [tab, setTab] = useState("materials");

  const materialStats = (() => {
    const map = new Map();
    drones.forEach((d) => {
      (d.materials || []).forEach((m) => {
        const key = (m.name || "").trim().toLowerCase();
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
    return Array.from(map.values()).sort((a, b) => b.occurrences - a.occurrences);
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

  const TABS = [
    { id: "materials", label: "Insumos más usados", icon: Package },
    { id: "techHours", label: "Horas por técnico", icon: User },
    { id: "modelHours", label: "Horas por tipo de equipo", icon: BarChart3 },
  ];

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
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
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

        {tab === "materials" && renderList(materialStats, "materials")}
        {tab === "techHours" && renderList(laborByTech, "hours")}
        {tab === "modelHours" && renderList(laborByModel, "hours")}

        <div style={{ ...styles.formHint, marginTop: 14 }}>
          {tab === "materials"
            ? "Útil para detectar piezas que fallan seguido y priorizar compras o revisar causas recurrentes."
            : tab === "techHours"
            ? "Útil para ver la carga de trabajo real de cada técnico."
            : "Útil para ver qué modelos de equipo consumen más tiempo de mantenimiento."}
        </div>
      </div>
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
          <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: FAC-7001  O S/N" style={styles.formInput} />
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

function DetailPanel({
  drone,
  perms,
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
  technicianNames = [],
  inventoryItems = [],
  stockMap = new Map(),
  cost = { insumos: 0, gastos: 0, total: 0 },
}) {
  const [noteDraft, setNoteDraft] = useState("");
  const [editingTech, setEditingTech] = useState(false);
  const [techDraft, setTechDraft] = useState(drone.technician);
  const [editingOrigin, setEditingOrigin] = useState(false);
  const [originDraft, setOriginDraft] = useState(drone.origin || "");
  const [editingPhoto, setEditingPhoto] = useState(false);
  const [photoDraft, setPhotoDraft] = useState(drone.photoUrl || "");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [matName, setMatName] = useState("");
  const [matQty, setMatQty] = useState("1");
  const [matUnit, setMatUnit] = useState("u");
  const [laborHours, setLaborHours] = useState("");
  const [laborDesc, setLaborDesc] = useState("");
  const [activeTab, setActiveTab] = useState(drone.stage);
  const [oficioDraft, setOficioDraft] = useState("");
  const currentIdx = STAGE_INDEX[drone.stage];
  const maintenanceCount = drone.history.filter((h) => h.type === "stage_change" && h.text === "Movido a Listo").length;
  const openDispatch = (drone.dispatches || []).find((x) => !x.returnDate);
  const matchedItem = findItemByName(inventoryItems, matName);
  const matchedStock = matchedItem ? stockMap.get(matchedItem.id)?.stock ?? 0 : null;

  useEffect(() => {
    setTechDraft(drone.technician);
    setOriginDraft(drone.origin || "");
    setPhotoDraft(drone.photoUrl || "");
    setEditingPhoto(false);
    setConfirmDelete(false);
    setActiveTab(drone.stage);
    setOficioDraft("");
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

        <datalist id="truac-tecnicos">
          {technicianNames.map((n) => (
            <option key={n} value={n} />
          ))}
        </datalist>
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
                  list="truac-tecnicos"
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
          <div style={{ ...styles.panelSectionLabel, display: "flex", alignItems: "center", gap: 6 }}>
            <Coins size={12} />
            Costo de la reparación
          </div>
          <div style={styles.costBox}>
            <div>
              <div style={styles.costLabel}>Insumos</div>
              <div style={styles.costValue}>{fmtMoney(cost.insumos)}</div>
            </div>
            <div>
              <div style={styles.costLabel}>Gastos</div>
              <div style={styles.costValue}>{fmtMoney(cost.gastos)}</div>
            </div>
            <div>
              <div style={styles.costLabel}>Total</div>
              <div style={{ ...styles.costValue, color: "#D4AF37", fontWeight: 600 }}>{fmtMoney(cost.total)}</div>
            </div>
          </div>
          <div style={{ ...styles.formHint, marginTop: 6 }}>Insumos del inventario usados en este dron + gastos asociados en Control de gastos.</div>
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
                  <button style={styles.logDeleteBtn} onClick={() => generateDispatchPdf(drone, dp, cost)} title="Generar documento PDF">
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
                            {m.itemId ? ` · inventario${m.unitCost ? ` · ${fmtMoney(m.unitCost * m.quantity)}` : ""}` : ""}
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
                      <input
                        value={matName}
                        list="truac-inventario"
                        onChange={(e) => {
                          setMatName(e.target.value);
                          const it = findItemByName(inventoryItems, e.target.value);
                          if (it) setMatUnit(it.unit);
                        }}
                        placeholder="Insumo * (busca en el inventario)"
                        style={styles.formInput}
                      />
                      <datalist id="truac-inventario">
                        {inventoryItems.map((it) => (
                          <option key={it.id} value={it.name}>
                            {`${fmtQty(stockMap.get(it.id)?.stock ?? 0)} ${it.unit} en stock`}
                          </option>
                        ))}
                      </datalist>
                      {matName.trim() && (
                        <div style={{ ...styles.historyMeta, marginTop: 5, color: matchedItem ? (matchedStock > 0 ? "#9EE8B8" : "#F5C26B") : "#8B92A3" }}>
                          {matchedItem
                            ? `Del inventario · ${fmtQty(matchedStock)} ${matchedItem.unit} disponibles — se descontará al agregar`
                            : "No está en el inventario: se registra en el dron pero no descuenta stock"}
                        </div>
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
                        <input
                          value={matUnit}
                          onChange={(e) => setMatUnit(e.target.value)}
                          placeholder="unidad"
                          disabled={!!matchedItem}
                          style={{ ...styles.formInput, width: 90, opacity: matchedItem ? 0.6 : 1 }}
                        />
                        <button
                          style={{ ...styles.ghostBtn, flex: 1 }}
                          onClick={() => {
                            onAddMaterial(drone.id, { name: matName, quantity: Number(matQty) || 0, unit: matUnit });
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

