import React, { useState } from "react";
import { updateDoc } from "firebase/firestore";
import { X, Eye, EyeOff, KeyRound } from "lucide-react";
import { changeOwnPassword, passwordProblem, authMessage, USER_REF } from "./firebase.js";
import { styles } from "./styles.js";

export function PasswordInput({ value, onChange, autoFocus, autoComplete = "new-password", onEnter }) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ position: "relative" }}>
      <input
        autoFocus={autoFocus}
        type={show ? "text" : "password"}
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => onEnter && e.key === "Enter" && onEnter()}
        style={{ ...styles.formInput, paddingRight: 36 }}
      />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        title={show ? "Ocultar" : "Mostrar"}
        style={{ position: "absolute", right: 6, top: 6, background: "transparent", border: "none", color: "#8B92A3", cursor: "pointer", padding: 2 }}
      >
        {show ? <EyeOff size={15} /> : <Eye size={15} />}
      </button>
    </div>
  );
}

// Formulario para que el usuario cambie su propia contraseña.
// forced = true cuando el administrador pidió cambio al primer ingreso.
export function ChangePasswordForm({ uid, forced, onDone, onCancel, onLogout }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    setError("");
    if (!current) return setError("Escribe tu contraseña actual.");
    const p = passwordProblem(next);
    if (p) return setError(p);
    if (next !== confirm) return setError("Las contraseñas nuevas no coinciden.");
    if (next === current) return setError("La contraseña nueva debe ser diferente a la actual.");
    setBusy(true);
    try {
      await changeOwnPassword(current, next);
      await updateDoc(USER_REF(uid), { debeCambiarClave: false, claveCambiada: new Date().toISOString() }).catch(() => {});
      onDone();
    } catch (err) {
      setError(
        err?.code === "auth/invalid-credential" || err?.code === "auth/wrong-password"
          ? "La contraseña actual no es correcta."
          : authMessage(err, "No se pudo cambiar la contraseña.")
      );
      setBusy(false);
    }
  }

  return (
    <>
      {forced && (
        <div style={{ ...styles.infoBox, marginTop: 14 }}>
          Es tu primer ingreso. Crea una contraseña personal que solo tú conozcas.
        </div>
      )}
      <label style={{ ...styles.formLabel, marginTop: 10 }}>{forced ? "Contraseña que te entregaron" : "Contraseña actual"}</label>
      <PasswordInput autoFocus value={current} onChange={setCurrent} autoComplete="current-password" onEnter={submit} />
      <label style={{ ...styles.formLabel, marginTop: 10 }}>Contraseña nueva</label>
      <PasswordInput value={next} onChange={setNext} onEnter={submit} />
      <label style={{ ...styles.formLabel, marginTop: 10 }}>Repite la contraseña nueva</label>
      <PasswordInput value={confirm} onChange={setConfirm} onEnter={submit} />
      <div style={{ ...styles.formHint, marginTop: 6 }}>Mínimo 8 caracteres, con letras y números.</div>
      {error && <div style={styles.loginError}>{error}</div>}
      <button
        style={{ ...styles.newButton, width: "100%", justifyContent: "center", marginTop: 14, opacity: busy ? 0.6 : 1 }}
        onClick={submit}
        disabled={busy}
      >
        <KeyRound size={14} /> {busy ? "Guardando…" : "Guardar contraseña"}
      </button>
      {forced ? (
        <button style={{ ...styles.linkBtn, marginTop: 6 }} onClick={onLogout}>
          Cerrar sesión
        </button>
      ) : (
        <button style={{ ...styles.linkBtn, marginTop: 6 }} onClick={onCancel}>
          Cancelar
        </button>
      )}
    </>
  );
}

export function ChangePasswordModal({ uid, notify, onClose }) {
  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <span style={styles.modalTitle}>Cambiar mi contraseña</span>
          <button style={styles.iconButton} onClick={onClose}>
            <X size={16} />
          </button>
        </div>
        <ChangePasswordForm
          uid={uid}
          onCancel={onClose}
          onDone={() => {
            notify("success", "Contraseña actualizada.");
            onClose();
          }}
        />
      </div>
    </div>
  );
}
