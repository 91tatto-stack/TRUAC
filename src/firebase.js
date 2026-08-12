import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// 1. Ve a https://console.firebase.google.com -> crea un proyecto (gratis).
// 2. Dentro del proyecto: "Compilación" -> "Firestore Database" -> "Crear base de datos"
//    (modo producción está bien, las reglas se ajustan en firestore.rules).
// 3. "Configuración del proyecto" -> "Tus apps" -> icono web (</>) -> registra la app.
// 4. Copia el objeto de configuración que te muestra Firebase y pégalo aquí abajo,
//    reemplazando los valores de ejemplo.

const firebaseConfig = {
  apiKey: "AIzaSyCxAtNdRwS-iUJosWhrWln8nBGkpCmUQvY",
  authDomain: "truac-64f44.firebaseapp.com",
  projectId: "truac-64f44",
  storageBucket: "truac-64f44.firebasestorage.app",
  messagingSenderId: "591853303294",
  appId: "1:591853303294:web:d4fd463459e84b47333caf",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
