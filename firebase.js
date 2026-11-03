import { initializeApp, deleteApp } from "firebase/app";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from "firebase/auth";

// Configuración pública del proyecto Firebase. Estos valores NO son secretos:
// la seguridad real la ponen Firebase Authentication + las reglas de
// firestore.rules (sin sesión iniciada no se puede leer ni escribir nada).
export const firebaseConfig = {
  apiKey: "AIzaSyCxAtNdRwS-iUJosWhrWln8nBGkpCmUQvY",
  authDomain: "truac-64f44.firebaseapp.com",
  projectId: "truac-64f44",
  storageBucket: "truac-64f44.firebasestorage.app",
  messagingSenderId: "591853303294",
  appId: "1:591853303294:web:d4fd463459e84b47333caf",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
auth.languageCode = "es";

// ---------------------------------------------------------------------------
// Usuarios por nombre de usuario (sin correo)
// ---------------------------------------------------------------------------
// Firebase Authentication necesita un "correo" por cuenta. Para que cada
// persona entre solo con USUARIO + CONTRASEÑA, la app arma un correo interno
// (ej. jperez@truac-64f44.firebaseapp.com) que nadie usa ni recibe.
// La colección logins/{usuario} dice qué correo interno tiene cada usuario.

export const LOGIN_REF = (username) => doc(db, "logins", username);
export const USER_REF = (uid) => doc(db, "usuarios", uid);
const INTERNAL_DOMAIN = firebaseConfig.authDomain;

export function normalizeUsername(v) {
  return (v || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // quita tildes
    .replace(/ñ/g, "n");
}

export const USERNAME_RE = /^[a-z0-9][a-z0-9._-]{2,29}$/;

export function internalEmail(username, reset = false) {
  return reset ? `${username}.r${Date.now().toString(36)}@${INTERNAL_DOMAIN}` : `${username}@${INTERNAL_DOMAIN}`;
}

// Mínimo 8 caracteres, con letras y números. (Si en Firebase activas una
// política más estricta, Firebase también la exige.)
export function passwordProblem(p) {
  if (!p || p.length < 8) return "La contraseña debe tener mínimo 8 caracteres.";
  if (!/[A-Za-z]/.test(p) || !/[0-9]/.test(p)) return "La contraseña debe tener letras y números.";
  return "";
}

// Contraseña temporal fácil de dictar: ej. "Taller-4827-kv"
export function generatePassword() {
  const words = ["Taller", "Dron", "Rotor", "Helice", "Radar", "Enlace", "Gimbal", "Bateria"];
  const r = new Uint32Array(3);
  crypto.getRandomValues(r);
  const letters = "abcdefghjkmnpqrstuvwxyz";
  return `${words[r[0] % words.length]}-${String(1000 + (r[1] % 9000))}-${letters[r[2] % 23]}${letters[(r[2] >> 8) % 23]}`;
}

// Inicia sesión con usuario (o con correo, para cuentas de administrador con correo real).
export async function loginWithUsername(userOrEmail, password) {
  const v = (userOrEmail || "").trim();
  let email = v;
  if (!v.includes("@")) {
    const snap = await getDoc(LOGIN_REF(normalizeUsername(v)));
    if (!snap.exists()) {
      const err = new Error("not-found");
      err.code = "auth/invalid-credential";
      throw err;
    }
    email = snap.data().email;
  }
  return signInWithEmailAndPassword(auth, email, password);
}

// Crea una cuenta nueva SIN cerrar la sesión del administrador (usa una app
// secundaria temporal, porque Firebase cambia la sesión al usuario creado).
export async function createAccount(email, password) {
  const secondary = initializeApp(firebaseConfig, `alta-${Date.now()}`);
  try {
    const secAuth = getAuth(secondary);
    const cred = await createUserWithEmailAndPassword(secAuth, email, password);
    await signOut(secAuth);
    return cred.user.uid;
  } finally {
    await deleteApp(secondary);
  }
}

// El usuario cambia su propia contraseña (pide la actual por seguridad).
export async function changeOwnPassword(current, next) {
  const user = auth.currentUser;
  const cred = EmailAuthProvider.credential(user.email, current);
  await reauthenticateWithCredential(user, cred);
  await updatePassword(user, next);
}

export const AUTH_ERRORS = {
  "auth/invalid-credential": "Usuario o contraseña incorrectos.",
  "auth/wrong-password": "Contraseña incorrecta.",
  "auth/user-not-found": "Usuario o contraseña incorrectos.",
  "auth/invalid-email": "Usuario no válido.",
  "auth/user-disabled": "Esta cuenta fue deshabilitada.",
  "auth/too-many-requests": "Demasiados intentos fallidos. Espera unos minutos.",
  "auth/network-request-failed": "Sin conexión a internet.",
  "auth/weak-password": "La contraseña es muy débil.",
  "auth/password-does-not-meet-requirements": "La contraseña no cumple la política del taller (revisa largo, mayúsculas, números y símbolos).",
  "auth/email-already-in-use": "Ese usuario ya existe.",
  "auth/operation-not-allowed": "Falta activar «Correo electrónico/contraseña» en Firebase Authentication.",
  "permission-denied": "No tienes permiso para esta acción. ¿Publicaste las reglas nuevas de Firestore?",
};

export function authMessage(err, fallback = "No se pudo completar. Intenta de nuevo.") {
  return AUTH_ERRORS[err?.code] || fallback;
}
