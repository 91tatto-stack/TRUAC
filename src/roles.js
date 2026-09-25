// Control de acceso simple por PIN. No es seguridad robusta (el código es visible
// en el navegador) — solo evita que alguien cambie cosas por accidente o que
// alguien sin PIN entre como administrador. Para seguridad real, habría que mover
// esto a un backend con autenticación (ver README, sección "Siguiente nivel").

export const ROLE_PINS = {
  tecnico: "1234",
  jefe_taller: "0000",
  administrador: "JEDAF",
};

export const ROLE_LABELS = {
  tecnico: "Técnico",
  jefe_taller: "Jefe de taller",
  administrador: "Administrador",
};

// Qué puede hacer cada rol.
export const PERMISSIONS = {
  tecnico: {
    canDelete: false,
    canVerify: false, // no puede firmar el check de pruebas final
  },
  jefe_taller: {
    canDelete: false,
    canVerify: true, // puede firmar el check de pruebas final
  },
  administrador: {
    canDelete: true,
    canVerify: true,
    canEditPins: false, // cambiar PINs se hace editando este archivo y redesplegando
  },
};
