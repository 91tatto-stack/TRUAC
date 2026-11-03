// Listas fijas para las pestañas de Insumos y Control de gastos.
// Igual que models.js: edítalas libremente según la realidad del taller.
// Usar listas fijas evita que la misma categoría quede escrita de varias
// formas y se partan los totales.

export const INSUMO_CATEGORIES = [
  "Hélices y estructura",
  "Motores y ESC",
  "Baterías y energía",
  "Electrónica y sensores",
  "Cámaras y gimbal",
  "Radio y enlace",
  "Consumibles (soldadura, adhesivos, tornillería)",
  "Herramientas",
  "Otros",
];

export const INSUMO_UNITS = ["u", "par", "juego", "kit", "m", "cm", "g", "kg", "ml", "l", "rollo", "caja"];

export const EXPENSE_CATEGORIES = [
  "Repuestos e insumos",
  "Herramientas y equipos",
  "Servicios técnicos externos",
  "Transporte y envíos",
  "Software y licencias",
  "Capacitación",
  "Otros",
];

// Categoría que se usa cuando una entrada de inventario se registra también como gasto.
export const PURCHASE_EXPENSE_CATEGORY = "Repuestos e insumos";
