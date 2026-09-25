// Lista fija de modelos de equipo (UAS / C-UAS) que se muestra al crear un dron.
// Esto evita que el mismo modelo quede contado varias veces en las estadísticas
// por errores de tipeo (ej. "DJI Mavic 3" vs "dji mavic3").
//
// Edita esta lista libremente agregando o quitando modelos según el inventario
// real del taller. La opción "Otro / no listado" siempre queda disponible al final.

export const EQUIPMENT_MODELS = [
  "DJI Mavic 3 Enterprise",
  "DJI Matrice 300 RTK",
  "DJI Matrice 350 RTK",
  "DJI Mini 4 Pro",
  "DJI Phantom 4 RTK",
  "Autel EVO II Dual",
  "Parrot ANAFI USA",
  "Sistema Anti-Dron (C-UAS)",
];

export const OTHER_MODEL_OPTION = "Otro / no listado";
