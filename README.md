# TRUAC — Taller de Reparación de UAS y C-UAS

App web para seguir el mantenimiento de drones por etapas (Diagnóstico → Reparación
→ Pruebas → Listo), compartida en tiempo real entre varios técnicos, con cuentas
individuales (correo + contraseña propia) y roles Técnico / Jefe de taller /
Administrador.

La app tiene estas pestañas:

- **Taller** — el tablero de drones por etapas (lo de siempre).
- **Insumos** — inventario de repuestos y materiales: stock, stock mínimo con
  alerta, entradas (compras), salidas, ajustes por conteo físico y kardex de
  cada insumo. Cuando un técnico registra "insumos usados" en un dron y el
  nombre coincide con un insumo del inventario, se descuenta solo.
- **Control de gastos** — presupuesto por vigencia, gasto ejecutado y
  disponible, gasto por mes y por categoría, costo de cada dron (insumos
  usados + gastos asociados) y lista de gastos con filtros. Las entradas de
  inventario con costo pueden cargarse aquí automáticamente.
- **Usuarios** (solo Administrador) — crear cuentas, asignar rol, desactivar
  a quien sale del taller y reenviar el correo de contraseña.

Ambas pestañas exportan a Excel (archivo .csv que Excel abre directo).

## ⚠️ Cuentas con usuario y contraseña

Cada persona entra con **usuario + contraseña**. El administrador los crea
desde la pestaña **Usuarios**; no se necesita correo.

### Si nunca configuraste las cuentas (vienes de los PIN)

1. Firebase → **Authentication** → **Comenzar** → *Sign-in method* →
   **Correo electrónico/contraseña** → Habilitar → Guardar.
2. Authentication → **Usuarios** → **Agregar usuario**: tu correo y una
   contraseña fuerte. Copia el **UID**.
3. Firestore → **Iniciar colección** `usuarios` → ID del documento = **tu UID**
   → campos: `nombre` (string), `email` (string, tu correo), `rol` (string)
   = `administrador`, `activo` (boolean) = `true`.
4. Sigue con los pasos de abajo.

### Para actualizar (todos)

1. Firestore → **Reglas** → pega `firestore.rules` → **Publicar**.
2. Copia los archivos nuevos a tu carpeta del proyecto y súbelos:
   `git add .` → `git commit -m "usuarios con contraseña"` → `git push`.
   Vercel lo publica solo en 1–2 minutos.
3. Entra con tu correo y contraseña de administrador.
4. *(Opcional)* Para entrar tú también con un usuario corto: Firestore →
   **Iniciar colección** `logins` → ID del documento = el usuario que quieras
   (ej. `jadmin`) → campos `email` (tu correo) y `uid` (tu UID).
5. Pestaña **Usuarios** → **Nuevo usuario** → nombre, usuario, contraseña y
   rol → la app te muestra los datos para entregarlos en persona.

Si alguien olvida su contraseña: **Usuarios → Nueva contraseña**. Si sale del
taller: **Desactivar**. Cada usuario cambia su clave con el botón 🔑 de arriba.

Los drones, insumos, gastos y logo que ya tienes no cambian.

## 1. Requisitos

- Node.js 18 o superior instalado en tu computador.
- Una cuenta de Google (para Firebase, es gratis).
- Una cuenta en Vercel o Netlify (para publicar el sitio, gratis).
- Opcional: un dominio propio si quieres algo tipo `taller.midominio.com`.

## 2. Crear la base de datos (Firebase, gratis)

1. Ve a https://console.firebase.google.com y crea un proyecto nuevo (el nombre no importa).
2. En el menú lateral: **Compilación → Firestore Database → Crear base de datos**.
   Elige el modo que te ofrezca por defecto y cualquier región cercana a tu país.
3. Ve a **Configuración del proyecto** (ícono de engranaje) → pestaña **Tus apps**
   → ícono web `</>` → dale un nombre (ej. "taller-drones") → **Registrar app**.
4. Firebase te muestra un bloque `const firebaseConfig = { ... }`. Copia esos valores.
5. Abre `src/firebase.js` en este proyecto y reemplaza los valores de ejemplo por
   los tuyos.
6. En Firestore, ve a la pestaña **Reglas** y pega el contenido del archivo
   `firestore.rules` que ya viene en este proyecto. Publica los cambios.

*Nota sobre fotos:* las fotos de los drones se agregan pegando un enlace/URL de
una imagen ya alojada en algún sitio (Google Drive con enlace público, Google
Fotos, Imgur, etc.), no subiendo el archivo directamente. Firebase Storage
(subida real de archivos) requiere activar el plan de pago Blaze — si más
adelante quieres esa opción, dímelo y lo agregamos.

## 3. Usuarios y roles

No hay PIN. El administrador crea cada cuenta (usuario + contraseña inicial)
en la pestaña **Usuarios** y le asigna el rol. Si se marca «cambiar al primer
ingreso», la persona crea su propia contraseña al entrar y nadie más la
conoce. Las cuentas se **desactivan**, no se borran, para conservar el historial.

Detalle técnico: Firebase exige un correo por cuenta, así que la app usa uno
interno (`usuario@truac-64f44.firebaseapp.com`) que nadie recibe. Como
Firebase no permite que el administrador cambie la clave de otro desde la web
sin un servidor de pago, «Nueva contraseña» crea una cuenta de acceso nueva
con el mismo usuario, nombre y rol, y desactiva la anterior.

El rol **Jefe de taller** es el único, junto con Administrador, que puede firmar
la verificación final del check de pruebas antes de marcar un dron como Listo.

Permisos (en `src/roles.js` para los botones y en `firestore.rules` para la base de datos):

| Acción | Técnico | Jefe de taller | Administrador |
|---|---|---|---|
| Ver inventario y gastos | Sí | Sí | Sí |
| Descontar insumos al registrarlos en un dron | Sí | Sí | Sí |
| Crear insumos, entradas, salidas y ajustes | No | Sí | Sí |
| Registrar gastos y fijar presupuesto | No | Sí | Sí |
| Eliminar gastos | No | No | Sí |
| Crear usuarios y asignar roles | No | No | Sí |

Las categorías de insumos y de gastos están en `src/catalogos.js`; edítalas
igual que la lista de modelos en `src/models.js`.

## 4. Probar en tu computador (opcional pero recomendado)

Abre una terminal en esta carpeta y ejecuta:

```bash
npm install
npm run dev
```

Te dará una dirección como `http://localhost:5173`. Ábrela en el navegador y
prueba entrar con tu cuenta de Administrador y con una de Técnico, crear un dron, moverlo de
etapa, etc.

## 5. Publicarlo en línea

La forma más simple es con **Vercel** (también funciona igual de bien con Netlify):

1. Crea un repositorio en GitHub y sube esta carpeta completa
   (`git init`, `git add .`, `git commit -m "primera version"`, luego
   crear el repo en GitHub y hacer `git push`).
2. Ve a https://vercel.com, inicia sesión con tu cuenta de GitHub.
3. **Add New → Project**, elige el repositorio que acabas de subir.
4. Vercel detecta automáticamente que es un proyecto Vite: deja la configuración
   por defecto (Build command: `npm run build`, Output directory: `dist`).
5. Dale a **Deploy**. En un minuto te da una URL pública como
   `taller-drones.vercel.app` — ya está en línea.

### Usar tu propio dominio

En el proyecto dentro de Vercel: **Settings → Domains → Add** → escribe tu
dominio (ej. `taller.tuempresa.com`) → Vercel te da uno o dos registros DNS
(tipo CNAME o A) para agregar donde compraste el dominio (GoDaddy, Namecheap,
etc.). Una vez agregados, Vercel activa el dominio automáticamente (puede
tardar de minutos a un par de horas).

## 6. Seguridad

- El login usa **Firebase Authentication**; los intentos fallidos repetidos se
  bloquean temporalmente.
- Las reglas de `firestore.rules` exigen sesión iniciada y cuenta activa para
  leer o escribir cualquier dato, y revisan el rol en el servidor: aunque
  alguien modifique el código en su navegador, no puede saltarse los permisos.
- Un técnico solo puede descontar insumos **a su propio nombre**; no puede
  crear insumos, registrar entradas, ajustes ni gastos.
- La configuración de `src/firebase.js` es pública por diseño (así funciona
  Firebase en la web); no da acceso a los datos sin una cuenta válida.

## Cómo se calculan stock y costos

- El **stock** no se guarda: se calcula sumando los movimientos del insumo
  (entradas + reintegros − salidas ± ajustes). Así nunca queda descuadrado y
  cada cambio queda en el kardex con quién lo hizo.
- El **costo promedio** de un insumo es el promedio ponderado de sus entradas
  con costo. Las salidas se valorizan a ese costo en el momento de la salida.
- Si el administrador borra un insumo registrado en un dron, la cantidad vuelve
  al inventario como "reintegro".
- Para corregir el stock usa **Ajuste por conteo físico** (desde el kardex):
  escribes lo que contaste y la app registra la diferencia con el motivo.
- Dar de baja un insumo lo oculta del inventario pero conserva su historial.

Límite a tener en cuenta: cada documento de Firestore admite ~1 MB, lo que da
para varios miles de movimientos y gastos. Cuando el taller lleve años de uso,
el siguiente paso sería pasar movimientos y gastos a colecciones propias.

## Estructura del proyecto

```
taller-drones/
├── src/
│   ├── App.jsx        componente principal (pestañas, tablero, panel de detalle, login)
│   ├── Usuarios.jsx    pestaña de usuarios (solo administrador)
│   ├── Cuenta.jsx      cambio de contraseña
│   ├── Insumos.jsx     pestaña de inventario (insumos, movimientos, kardex)
│   ├── Gastos.jsx      pestaña de control de gastos y presupuesto
│   ├── data.js         lectura/escritura de insumos y gastos, cálculos, exportar
│   ├── catalogos.js    categorías de insumos y de gastos (editable)
│   ├── models.js       modelos de equipo (editable)
│   ├── firebase.js     conexión a Firestore y Authentication
│   ├── roles.js        roles y permisos
│   ├── styles.js       estilos de la app (colores, tablas, tarjetas)
│   ├── main.jsx        punto de entrada de React
│   └── styles.css      estilos globales y ajustes para celular
├── firestore.rules      reglas de acceso a la base de datos
├── index.html
├── package.json
└── vite.config.js
```
