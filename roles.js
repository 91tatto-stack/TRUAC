// Roles y permisos de TRUAC.
//
// Ya NO hay PIN por rol: cada persona entra con su propio correo y contraseña
// (Firebase Authentication) y su rol está guardado en Firestore, en
// usuarios/{uid}. Solo el Administrador crea cuentas y asigna roles desde la
// pestaña "Usuarios".
//
// Estos permisos controlan qué botones ve cada rol. Lo que REALMENTE impide
// que alguien haga algo sin permiso son las reglas de firestore.rules; si
// cambias un permiso aquí, cambia también la regla correspondiente.

export const ROLE_LABELS = {
  tecnico: "Técnico",
  jefe_taller: "Jefe de taller",
  administrador: "Administrador",
};

export const ROLE_DESCRIPTIONS = {
  tecnico: "Trabaja en el tablero: notas, horas e insumos usados en cada dron.",
  jefe_taller: "Supervisor: todo lo del técnico + firma pruebas, ingresa inventario y registra gastos.",
  administrador: "Control total: eliminar registros, logo y gestión de usuarios.",
};

export const PERMISSIONS = {
  //  canManageInventory: crear insumos, registrar entradas/salidas/ajustes manuales.
  //  canManageExpenses:  registrar gastos y fijar el presupuesto de la vigencia.
  //  (Los técnicos igual descuentan insumos del inventario cuando registran
  //  "insumos usados" en un dron; solo no pueden mover el inventario a mano.)
  tecnico: {
    canDelete: false,
    canVerify: false,
    canManageInventory: false,
    canManageExpenses: false,
    canManageUsers: false,
  },
  jefe_taller: {
    canDelete: false,
    canVerify: true,
    canManageInventory: true,
    canManageExpenses: true,
    canManageUsers: false,
  },
  administrador: {
    canDelete: true,
    canVerify: true,
    canManageInventory: true,
    canManageExpenses: true,
    canManageUsers: true,
  },
};
