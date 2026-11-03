import React, { useEffect, useState } from "react";
import { collection, onSnapshot, setDoc, updateDoc, getDoc } from "firebase/firestore";
import { Plus, X, ShieldCheck, ClipboardCheck, User, UserX, UserCheck, Users, Lock, KeyRound, Copy, Wand2, CheckCircle } from "lucide-react";
import {
  db,
  createAccount,
  USER_REF,
  LOGIN_REF,
  normalizeUsername,
  USERNAME_RE,
  internalEmail,
  passwordProblem,
  generatePassword,
  authMessage,
} from "./firebase.js";
import { ROLE_LABELS, ROLE_DESCRIPTIONS } from "./roles.js";
import { styles } from "./styles.js";
import { Kpi } from "./Insumos.jsx";
import { PasswordInput } from "./Cuenta.jsx";

export { USER_REF };
export const USERS_COL = () => collection(db, "usuarios");

// Lista de usuarios en tiempo real. Oculta las cuentas viejas que fueron
// reemplazadas al restablecer una contraseña.
export function useUsuarios(enabled = true) {
  const [list, setList] = useState(null);
  useEffect(() => {
    if (!enabled) return undefined;
    const unsub = onSnapshot(
      USERS_COL(),
      (snap) => setList(snap.docs.map((d) => ({ uid: d.id, ...d.data() })).filter((u) => !u.reemplazadoPor)),
      () => setList([])
    );
    return () => unsub();
  }, [enabled]);
  return list;
}

export function roleIcon(role, size = 13) {
  if (role === "administrador") return <ShieldCheck size={size} />;
  if (role === "jefe_taller") return <ClipboardCheck size={size} />;
  return <User size={size} />;
}

const mono = { fontFamily: "'IBM Plex Mono', monospace" };

export default function UsuariosTab({ usuarios, session, notify }) {
  const [showNew, setShowNew] = useState(false);
  const [resetFor, setResetFor] = useState(null);
  const [handover, setHandover] = useState(null); // { nombre, usuario, clave, forzar }
  const [busy, setBusy] = useState(null);
  const loading = usuarios === null;
  const list = (usuarios || []).slice().sort((a, b) => (b.activo === true) - (a.activo === true) || (a.nombre || "").localeCompare(b.nombre || "", "es"));
  const activos = list.filter((u) => u.activo);

  async function changeRole(u, rol) {
    if (u.uid === session.uid) return notify("error", "No puedes cambiar tu propio rol (evita quedarte sin administrador).");
    setBusy(u.uid);
    try {
      await updateDoc(USER_REF(u.uid), { rol, actualizadoPor: session.name, actualizado: new Date().toISOString() });
      notify("success", `${u.nombre} ahora es ${ROLE_LABELS[rol]}.`);
    } catch (err) {
      notify("error", authMessage(err, "No se pudo cambiar el rol."));
    }
    setBusy(null);
  }

  async function toggleActive(u) {
    if (u.uid === session.uid) return notify("error", "No puedes desactivar tu propia cuenta.");
    setBusy(u.uid);
    try {
      await updateDoc(USER_REF(u.uid), { activo: !u.activo, actualizadoPor: session.name, actualizado: new Date().toISOString() });
      notify("success", u.activo ? `${u.nombre} ya no puede entrar a TRUAC.` : `${u.nombre} puede entrar de nuevo.`);
    } catch (err) {
      notify("error", authMessage(err, "No se pudo guardar el cambio."));
    }
    setBusy(null);
  }

  return (
    <div>
      <div style={styles.pageHead}>
        <div>
          <div style={styles.pageTitle}>Usuarios</div>
          <div style={styles.pageSub}>Tú creas el usuario y la contraseña de cada persona. Solo el administrador ve esta pestaña.</div>
        </div>
        <div style={styles.pageActions}>
          <button style={styles.newButton} onClick={() => setShowNew(true)}>
            <Plus size={15} />
            Nuevo usuario
          </button>
        </div>
      </div>

      <div style={styles.kpiGrid}>
        <Kpi icon={Users} label="Cuentas activas" value={activos.length} sub={`${list.length - activos.length} desactivadas`} />
        <Kpi icon={User} label="Técnicos" value={activos.filter((u) => u.rol === "tecnico").length} />
        <Kpi icon={ClipboardCheck} label="Jefes de taller" value={activos.filter((u) => u.rol === "jefe_taller").length} sub="Pueden ingresar inventario" />
        <Kpi icon={ShieldCheck} label="Administradores" value={activos.filter((u) => u.rol === "administrador").length} />
      </div>

      <div style={styles.tableWrap}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Nombre</th>
              <th style={styles.th}>Usuario</th>
              <th style={styles.th}>Rol</th>
              <th style={styles.th}>Estado</th>
              <th style={{ ...styles.th, ...styles.thNum }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={5} style={styles.tableEmpty}>Cargando usuarios…</td>
              </tr>
            )}
            {list.map((u) => {
              const me = u.uid === session.uid;
              return (
                <tr key={u.uid} style={{ opacity: u.activo ? 1 : 0.55 }}>
                  <td style={styles.td}>
                    <div style={{ fontWeight: 500 }}>
                      {u.grado ? `${u.grado} ` : ""}
                      {u.nombre}
                      {me && <span style={{ color: "#D4AF37", fontSize: 11 }}> · tú</span>}
                    </div>
                  </td>
                  <td style={{ ...styles.td, ...mono, fontSize: 12 }}>
                    {u.usuario || <span style={{ color: "#8B92A3" }}>{u.email}</span>}
                    {u.debeCambiarClave && <div style={styles.tdSub}>Debe cambiar la contraseña al entrar</div>}
                  </td>
                  <td style={styles.td}>
                    <select
                      value={u.rol}
                      disabled={me || busy === u.uid}
                      onChange={(e) => changeRole(u, e.target.value)}
                      style={{ ...styles.toolbarInput, opacity: me ? 0.6 : 1 }}
                      title={me ? "No puedes cambiar tu propio rol" : undefined}
                    >
                      {Object.keys(ROLE_LABELS).map((r) => (
                        <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                      ))}
                    </select>
                  </td>
                  <td style={styles.td}>
                    {u.activo ? <span style={{ ...styles.chip, ...styles.chipOk }}>Activo</span> : <span style={{ ...styles.chip, ...styles.chipOut }}>Desactivado</span>}
                  </td>
                  <td style={styles.td}>
                    <div style={styles.rowActions}>
                      {!me && (
                        <>
                          <button style={styles.miniBtn} disabled={busy === u.uid} onClick={() => setResetFor(u)} title="Asignar una contraseña nueva">
                            <KeyRound size={12} />
                            Nueva contraseña
                          </button>
                          <button style={styles.miniBtn} disabled={busy === u.uid} onClick={() => toggleActive(u)}>
                            {u.activo ? <UserX size={12} color="#F09595" /> : <UserCheck size={12} color="#4ADE80" />}
                            {u.activo ? "Desactivar" : "Activar"}
                          </button>
                        </>
                      )}
                      {me && <span style={{ ...styles.formHint, whiteSpace: "nowrap" }}>Tu clave: botón 🔑 arriba</span>}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div style={{ ...styles.infoBox, marginTop: 14, display: "flex", gap: 8 }}>
        <Lock size={14} style={{ flexShrink: 0, marginTop: 1 }} />
        <span>
          Entrega el usuario y la contraseña <b>en persona</b>. Si marcas «cambiar al primer ingreso», la persona crea su propia contraseña y
          nadie más la conoce. Si alguien olvida su clave, usa <b>Nueva contraseña</b>. Si alguien sale del taller, <b>desactiva</b> su cuenta:
          deja de entrar de inmediato y su historial se conserva.
        </span>
      </div>

      {showNew && (
        <UserFormModal
          mode="new"
          usuarios={list}
          session={session}
          notify={notify}
          onClose={() => setShowNew(false)}
          onCreated={(h) => {
            setShowNew(false);
            setHandover(h);
          }}
        />
      )}
      {resetFor && (
        <UserFormModal
          mode="reset"
          target={resetFor}
          usuarios={list}
          session={session}
          notify={notify}
          onClose={() => setResetFor(null)}
          onCreated={(h) => {
            setResetFor(null);
            setHandover(h);
          }}
        />
      )}
      {handover && <HandoverModal data={handover} notify={notify} onClose={() => setHandover(null)} />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Crear usuario / asignar contraseña nueva
// ---------------------------------------------------------------------------
// Firebase no deja que el administrador cambie la contraseña de otra cuenta
// desde la web (eso exige un servidor de pago). Por eso "Nueva contraseña"
// crea una cuenta de acceso nueva con el MISMO usuario, nombre y rol, y
// desactiva la anterior. Para el usuario y para el historial es lo mismo.

function UserFormModal({ mode, target, usuarios, session, notify, onClose, onCreated }) {
  const isReset = mode === "reset";
  const [nombre, setNombre] = useState(target?.nombre || "");
  const [grado, setGrado] = useState(target?.grado || "");
  const [usuario, setUsuario] = useState(target?.usuario || "");
  const [clave, setClave] = useState(() => generatePassword());
  const [rol, setRol] = useState(target?.rol || "tecnico");
  const [forzar, setForzar] = useState(true);
  const [saving, setSaving] = useState(false);
  const fixedUsername = isReset && !!target?.usuario;

  function suggestUsername(n) {
    if (fixedUsername || usuario) return;
    const parts = normalizeUsername(n).replace(/[^a-z\s]/g, "").split(/\s+/).filter(Boolean);
    if (parts.length >= 2) setUsuario(parts[0][0] + parts[1]);
  }

  async function submit() {
    const n = nombre.trim();
    const u = normalizeUsername(usuario);
    if (!n) return notify("error", "Escribe el nombre completo.");
    if (!USERNAME_RE.test(u)) return notify("error", "Usuario: de 3 a 30 caracteres, solo letras, números, punto, guion o guion bajo, sin espacios.");
    const pp = passwordProblem(clave);
    if (pp) return notify("error", pp);
    if (!isReset && usuarios.some((x) => (x.nombre || "").trim().toLowerCase() === n.toLowerCase()))
      return notify("error", "Ya existe una persona con ese nombre. Agrega un apellido para diferenciarla.");

    setSaving(true);
    try {
      const taken = await getDoc(LOGIN_REF(u));
      if (taken.exists() && !(isReset && taken.data().uid === target.uid)) {
        setSaving(false);
        return notify("error", `El usuario «${u}» ya está en uso. Elige otro.`);
      }
      const now = new Date().toISOString();
      const email = internalEmail(u, isReset);
      const newUid = await createAccount(email, clave);
      await setDoc(USER_REF(newUid), {
        nombre: n,
        grado: grado.trim(),
        usuario: u,
        email,
        rol,
        activo: true,
        debeCambiarClave: forzar,
        creado: isReset ? target.creado || now : now,
        creadoPor: isReset ? target.creadoPor || session.name : session.name,
        ...(isReset ? { reemplazaA: target.uid, claveAsignada: now, claveAsignadaPor: session.name } : {}),
      });
      await setDoc(LOGIN_REF(u), { email, uid: newUid });
      if (isReset) {
        await updateDoc(USER_REF(target.uid), { activo: false, reemplazadoPor: newUid, actualizadoPor: session.name, actualizado: now });
      }
      onCreated({ nombre: n, usuario: u, clave, forzar, reset: isReset });
    } catch (err) {
      notify("error", authMessage(err, "No se pudo crear la cuenta. Revisa tu conexión."));
      setSaving(false);
    }
  }

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modalWide} onClick={(ev) => ev.stopPropagation()}>
        <div style={styles.modalHeader}>
          <div>
            <div style={styles.modalTitle}>{isReset ? "Nueva contraseña" : "Nuevo usuario"}</div>
            {isReset && <div style={styles.panelModel}>{target.nombre}</div>}
          </div>
          <button style={styles.iconButton} onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {!isReset && (
          <div style={styles.formRow}>
            <div style={styles.formField}>
              <label style={styles.formLabel}>Grado (opcional)</label>
              <input value={grado} onChange={(e) => setGrado(e.target.value)} placeholder="Ej: T3, ST, TE" style={styles.formInput} />
            </div>
            <div style={styles.formField}>
              <label style={styles.formLabel}>Nombre completo *</label>
              <input autoFocus value={nombre} onChange={(e) => setNombre(e.target.value)} onBlur={(e) => suggestUsername(e.target.value)} placeholder="Ej: Carlos Pérez" style={styles.formInput} />
            </div>
          </div>
        )}

        <div style={styles.formField}>
          <label style={styles.formLabel}>Usuario *</label>
          <input
            value={usuario}
            disabled={fixedUsername}
            onChange={(e) => setUsuario(e.target.value.toLowerCase().replace(/\s/g, ""))}
            placeholder="Ej: cperez"
            autoComplete="off"
            style={{ ...styles.formInput, ...mono, opacity: fixedUsername ? 0.7 : 1 }}
          />
          {!fixedUsername && <div style={{ ...styles.formHint, marginTop: 4 }}>Sin espacios ni tildes. Es con lo que la persona va a entrar.</div>}
        </div>

        <div style={styles.formField}>
          <label style={styles.formLabel}>Contraseña {isReset ? "nueva" : "inicial"} *</label>
          <div style={{ display: "flex", gap: 6 }}>
            <div style={{ flex: 1 }}>
              <PasswordInput value={clave} onChange={setClave} />
            </div>
            <button style={styles.ghostBtn} onClick={() => setClave(generatePassword())} title="Generar otra contraseña">
              <Wand2 size={13} />
            </button>
          </div>
          <div style={{ ...styles.formHint, marginTop: 4 }}>Mínimo 8 caracteres, con letras y números. Puedes escribir una o usar la generada.</div>
        </div>

        {!isReset && (
          <div style={styles.formField}>
            <label style={styles.formLabel}>Rol</label>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {Object.keys(ROLE_LABELS).map((r) => (
                <label key={r} style={{ ...styles.checkRow, marginBottom: 0, padding: "8px 10px", borderRadius: 8, border: `1px solid ${rol === r ? "#D4AF37" : "#1E3350"}`, background: rol === r ? "#2A2405" : "transparent" }}>
                  <input type="radio" name="rol" checked={rol === r} onChange={() => setRol(r)} style={{ marginTop: 2 }} />
                  <span>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontWeight: 500 }}>
                      {roleIcon(r, 12)} {ROLE_LABELS[r]}
                    </span>
                    <div style={{ fontSize: 11, color: "#8B92A3", marginTop: 2 }}>{ROLE_DESCRIPTIONS[r]}</div>
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        <label style={styles.checkRow}>
          <input type="checkbox" checked={forzar} onChange={(e) => setForzar(e.target.checked)} style={{ marginTop: 2 }} />
          <span>
            Pedir que cambie la contraseña al primer ingreso
            <span style={{ color: "#8B92A3" }}> (recomendado: así solo esa persona la conoce)</span>
          </span>
        </label>

        {isReset && <div style={styles.infoBox}>{target.nombre} seguirá entrando con el mismo usuario; la contraseña anterior deja de funcionar.</div>}

        <div style={styles.formFooter}>
          <span style={styles.formHint}>{isReset ? "Asignada" : "Creado"} por {session.name}</span>
          <button style={{ ...styles.newButton, opacity: saving ? 0.6 : 1 }} onClick={submit} disabled={saving}>
            {isReset ? <KeyRound size={14} /> : <Plus size={15} />}
            {saving ? "Guardando…" : isReset ? "Asignar contraseña" : "Crear usuario"}
          </button>
        </div>
      </div>
    </div>
  );
}

// Muestra los datos de acceso UNA vez para entregarlos a la persona.
function HandoverModal({ data, notify, onClose }) {
  const text = `TRUAC — truac.vercel.app\nUsuario: ${data.usuario}\nContraseña: ${data.clave}`;
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      notify("success", "Datos de acceso copiados.");
    } catch {
      notify("error", "No se pudo copiar; anótalos a mano.");
    }
  }
  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.modalHeader}>
          <span style={{ ...styles.modalTitle, display: "flex", alignItems: "center", gap: 7 }}>
            <CheckCircle size={16} color="#4ADE80" />
            {data.reset ? "Contraseña asignada" : "Usuario creado"}
          </span>
        </div>
        <div style={{ fontSize: 12.5, marginBottom: 10 }}>Entrégale estos datos a <b>{data.nombre}</b>:</div>
        <div style={{ ...styles.costBox, gridTemplateColumns: "1fr", gap: 10 }}>
          <div>
            <div style={styles.costLabel}>Usuario</div>
            <div style={{ ...styles.costValue, fontSize: 16 }}>{data.usuario}</div>
          </div>
          <div>
            <div style={styles.costLabel}>Contraseña</div>
            <div style={{ ...styles.costValue, fontSize: 16, color: "#D4AF37" }}>{data.clave}</div>
          </div>
        </div>
        <div style={{ ...styles.warnBox, marginTop: 12 }}>
          Esta contraseña no se vuelve a mostrar.
          {data.forzar ? " Al entrar, el sistema le pedirá crear una propia." : ""}
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button style={styles.outlineBtn} onClick={copy}>
            <Copy size={13} /> Copiar
          </button>
          <button style={styles.newButton} onClick={onClose}>
            Listo
          </button>
        </div>
      </div>
    </div>
  );
}
