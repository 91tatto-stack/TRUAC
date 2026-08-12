# TRUAC — Taller de Reparación de UAS y C-UAS

App web para seguir el mantenimiento de drones por etapas (Diagnóstico → Reparación
→ Pruebas → Listo), compartida en tiempo real entre varios técnicos, con acceso
por rol (Técnico / Administrador) protegido por PIN.

## 1. Requisitos

- Node.js 18 o superior instalado en tu computador.
- Una cuenta de Google (para Firebase, es gratis).
- Una cuenta en Vercel o Netlify (para publicar el sitio, gratis).
- Opcional: un dominio propio si quieres algo tipo `taller.midominio.com`.


## 2.  los PINs de acceso


```js
export const ROLE_PINS = {
  tecnico: "1234",
  jefe_taller: "5678",
  administrador: "9999",
};
```


El rol **Jefe de taller** es el único, junto con Administrador, que puede firmar
la verificación final del check de pruebas antes de marcar un dron como Listo.


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

## 6. Nota sobre la seguridad del PIN

El PIN de esta app es una barrera simple para evitar que alguien entre o borre
algo por accidente — no es autenticación real. El código que compara el PIN
corre en el navegador, así que alguien con conocimientos técnicos podría
saltárselo, y las reglas de Firestore (`firestore.rules`) actualmente permiten
leer y escribir a cualquiera que tenga la URL de la base de datos. Para un
taller interno esto normalmente es suficiente.

Si más adelante quieres seguridad real (usuarios con contraseña propia,
permisos por persona, registro de quién hizo qué de forma verificable), el
siguiente paso natural es agregar **Firebase Authentication** (login con
correo o Google) y ajustar `firestore.rules` para exigir que el usuario esté
autenticado. Puedes pedirme ayuda con eso cuando lo necesites.

## Estructura del proyecto

```
taller-drones/
├── src/
│   ├── App.jsx        componente principal (tablero, panel de detalle, login)
│   ├── firebase.js     configuración de conexión a Firestore
│   ├── roles.js         PINs y permisos por rol
│   ├── main.jsx          punto de entrada de React
│   └── styles.css        estilos globales
├── firestore.rules      reglas de acceso a la base de datos
├── index.html
├── package.json
└── vite.config.js
```
