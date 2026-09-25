// Catálogo inicial de piezas/insumos, generado a partir del Excel
// "CONTROL_INGRESO_Y_SALIDA_MATERIAL_TRUAC.xlsx" (hoja PRODUCTOS) que compartió Julián.
// La cantidad inicial corresponde al STOCK actual reportado en esa hoja en el
// momento de la carga — a partir de ahí, TRUAC descuenta lo que se registre como
// insumo usado en cada dron para mantener el conteo de "quedan" al día.
//
// Se importa una sola vez desde la pestaña Inventario (botón "Cargar catálogo
// desde Excel"), y puedes editar, agregar o quitar piezas libremente después.

export const INVENTORY_SEED = [
  {
    "name": "Brazo Delantero Derecho (MAVIC 2 PRO)",
    "unit": "u",
    "initialQuantity": 11
  },
  {
    "name": "Brazo Delantero Izquierdo (MAVIC 2 PRO)",
    "unit": "u",
    "initialQuantity": 13
  },
  {
    "name": "Brazo Trasero Derecho (MAVIC 2 PRO)",
    "unit": "u",
    "initialQuantity": 13
  },
  {
    "name": "Brazo Trasero Izquierdo (MAVIC 2 PRO)",
    "unit": "u",
    "initialQuantity": 14
  },
  {
    "name": "Carcasa Superior (MAVIC 2 PRO)",
    "unit": "u",
    "initialQuantity": 14
  },
  {
    "name": "Carcasa Media (MAVIC 2 PRO)",
    "unit": "u",
    "initialQuantity": 13
  },
  {
    "name": "Carcasa Inferior (MAVIC 2 PRO)",
    "unit": "u",
    "initialQuantity": 15
  },
  {
    "name": "Módulo Esc (MAVIC 2 PRO)",
    "unit": "u",
    "initialQuantity": 15
  },
  {
    "name": "Hélice Brazo Delantero Derecho (MAVIC 2 PRO)",
    "unit": "u",
    "initialQuantity": 16
  },
  {
    "name": "Hélice Brazo Delantero Izquierdo (MAVIC 2 PRO)",
    "unit": "u",
    "initialQuantity": 16
  },
  {
    "name": "Hélice Brazo Trasero Derecho (MAVIC 2 PRO)",
    "unit": "u",
    "initialQuantity": 16
  },
  {
    "name": "Hélice Brazo Trasero Izquierdo (MAVIC 2 PRO)",
    "unit": "u",
    "initialQuantity": 16
  },
  {
    "name": "Brazo Delantero Derecho (MAVIC AIR 2)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "Brazo Delantero Izquierdo (MAVIC AIR 2)",
    "unit": "u",
    "initialQuantity": 1
  },
  {
    "name": "Brazo Trasero Derecho (MAVIC AIR 2)",
    "unit": "u",
    "initialQuantity": 1
  },
  {
    "name": "Brazo Trasero Izquierdo (MAVIC AIR 2)",
    "unit": "u",
    "initialQuantity": 1
  },
  {
    "name": "Carcasa Superior (MAVIC AIR 2)",
    "unit": "u",
    "initialQuantity": 1
  },
  {
    "name": "Carcasa Media (MAVIC AIR 2)",
    "unit": "u",
    "initialQuantity": 1
  },
  {
    "name": "Carcasa Inferior (MAVIC AIR 2)",
    "unit": "u",
    "initialQuantity": 1
  },
  {
    "name": "Módulo Esc (MAVIC AIR 2)",
    "unit": "u",
    "initialQuantity": 1
  },
  {
    "name": "Hélice Brazo Delantero Derecho (MAVIC AIR 2)",
    "unit": "u",
    "initialQuantity": 21
  },
  {
    "name": "Hélice Brazo Delantero Izquierdo (MAVIC AIR 2)",
    "unit": "u",
    "initialQuantity": 21
  },
  {
    "name": "Hélice Brazo Trasero Derecho (MAVIC AIR 2)",
    "unit": "u",
    "initialQuantity": 21
  },
  {
    "name": "Hélice Brazo Trasero Izquierdo (MAVIC AIR 2)",
    "unit": "u",
    "initialQuantity": 21
  },
  {
    "name": "Brazo Delantero Derecho(Motor Dron) (Mavic Phantom 4 PRO v 2.0)",
    "unit": "u",
    "initialQuantity": 1
  },
  {
    "name": "Brazo Delantero Izquierdo(Motor Dron) (Mavic Phantom 4 PRO v 2.0)",
    "unit": "u",
    "initialQuantity": 1
  },
  {
    "name": "Brazo Trasero Derecho(Motor Dron) (Mavic Phantom 4 PRO v 2.0)",
    "unit": "u",
    "initialQuantity": 1
  },
  {
    "name": "Brazo Trasero Izquierdo(Motor Dron) (Mavic Phantom 4 PRO v 2.0)",
    "unit": "u",
    "initialQuantity": 1
  },
  {
    "name": "Carcasa Superior (Mavic Phantom 4 PRO v 2.0)",
    "unit": "u",
    "initialQuantity": 1
  },
  {
    "name": "Carcasa Inferior (Mavic Phantom 4 PRO v 2.0)",
    "unit": "u",
    "initialQuantity": 1
  },
  {
    "name": "Módulo Esc (Mavic Phantom 4 PRO v 2.0)",
    "unit": "u",
    "initialQuantity": 2
  },
  {
    "name": "Hélice Brazo Delantero Derecho (Mavic Phantom 4 PRO v 2.0)",
    "unit": "u",
    "initialQuantity": 1
  },
  {
    "name": "Hélice Brazo Delantero Izquierdo (Mavic Phantom 4 PRO v 2.0)",
    "unit": "u",
    "initialQuantity": 1
  },
  {
    "name": "Hélice Brazo Trasero Derecho (Mavic Phantom 4 PRO v 2.0)",
    "unit": "u",
    "initialQuantity": 1
  },
  {
    "name": "Brazo Delantero Derecho (MAVIC MINI 2)",
    "unit": "u",
    "initialQuantity": 1
  },
  {
    "name": "Brazo Delantero Izquierdo (MAVIC MINI 2)",
    "unit": "u",
    "initialQuantity": 2
  },
  {
    "name": "Brazo Trasero Derecho (MAVIC MINI 2)",
    "unit": "u",
    "initialQuantity": 2
  },
  {
    "name": "Brazo Trasero Izquierdo (MAVIC MINI 2)",
    "unit": "u",
    "initialQuantity": 2
  },
  {
    "name": "Carcasa Superior (MAVIC MINI 2)",
    "unit": "u",
    "initialQuantity": 3
  },
  {
    "name": "Carcasa Media (MAVIC MINI 2)",
    "unit": "u",
    "initialQuantity": 3
  },
  {
    "name": "Carcasa Inferior (MAVIC MINI 2)",
    "unit": "u",
    "initialQuantity": 3
  },
  {
    "name": "Módulo Esc (MAVIC MINI 2)",
    "unit": "u",
    "initialQuantity": 3
  },
  {
    "name": "Hélice Brazo Delantero Derecho (MAVIC MINI 2)",
    "unit": "u",
    "initialQuantity": 8
  },
  {
    "name": "Hélice Brazo Delantero Izquierdo (MAVIC MINI 2)",
    "unit": "u",
    "initialQuantity": 8
  },
  {
    "name": "Hélice Brazo Trasero Derecho (MAVIC MINI 2)",
    "unit": "u",
    "initialQuantity": 8
  },
  {
    "name": "Hélice Brazo Trasero Izquierdo (MAVIC MINI 2)",
    "unit": "u",
    "initialQuantity": 11
  },
  {
    "name": "4Erkm5E6G60Sk5 (MAVIC 3E)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "4Erpm71Ea3Kkc5 (MAVIC 3E)",
    "unit": "u",
    "initialQuantity": 1
  },
  {
    "name": "4Erpm8Aea3Lrqf (MAVIC 3E)",
    "unit": "u",
    "initialQuantity": 1
  },
  {
    "name": "4Erpmbaea3Lrmc (MAVIC 3E)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "4Erpm71Ea3Kjzj (MAVIC 3E)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "4Erpm8Aea3Lrkj (MAVIC 3E)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "4Erpm71Ea3Kk51 (MAVIC 3E)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "4Erpm71Ea3Kk9A (MAVIC 3E)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "4Erpm8Aea3Lrmj (MAVIC 3E)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "4Erpm8Aea3Lrpu (MAVIC 3E)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "4Erpm8Aea3Lrh8 (MAVIC 3E)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "4Erkm5E6G60Lm5 (MAVIC 3E)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "4Erpm85Ea3Lefd (MAVIC 3E)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "4Erpm71Ea3Kjwl (MAVIC 3E)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "4Erpm8Aea3Lrdr (MAVIC 3E)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "4Erpm8Aea3Lra7 (MAVIC 3E)",
    "unit": "u",
    "initialQuantity": 1
  },
  {
    "name": "4Erpm8Aea3Lrq9 (MAVIC 3E)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "4Erpm8Aea3Lrf1 (MAVIC 3E)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "4Erpm71Ea3Kju9 (MAVIC 3E)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "4Erkm8W6G503Ta (MAVIC 3E)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "4Erpm71Ea3Kkm8 (MAVIC 3E)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "4Erpm71Ea3Kkmh (MAVIC 3E)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "4Erkm8V6G52C1A (MAVIC 3E)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "4Erkm5E6G60Ht5 (MAVIC 3E)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "4Erpla7Da0C7Xh (MAVIC 3E)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "4Erpm71Ea3Kjsv (MAVIC 3E)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "4Erpm8Aea3Lrj4 (MAVIC 3E)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "4Erpm8Aea3Lrm6 (MAVIC 3E)",
    "unit": "u",
    "initialQuantity": 1
  },
  {
    "name": "4Erpm8Aea3Lrkp (MAVIC 3E)",
    "unit": "u",
    "initialQuantity": 1
  },
  {
    "name": "4Erpm85Ea3Lez3 (MAVIC 3E)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "4Erpm85Ea3Lewy (MAVIC 3E)",
    "unit": "u",
    "initialQuantity": 1
  },
  {
    "name": "4Erpm8Aea3Lrfg (MAVIC 3E)",
    "unit": "u",
    "initialQuantity": 1
  },
  {
    "name": "4Erpm8Aea3Lrke (MAVIC 3E)",
    "unit": "u",
    "initialQuantity": 1
  },
  {
    "name": "0P2Akc6537047U (MAVIC 2)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "0P2Akb453700L3 (MAVIC 2)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "0P2Akac537038Z (MAVIC 2)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "0P2Akae53701Vl (MAVIC 2)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "0P2Akbj53702K2 (MAVIC 2)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "0P2Akbk53700L4 (MAVIC 2)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "0P2Dh1F5430166 (MAVIC 2)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "161Al9D63900Tl (MATRICE 30 T)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "4Bupm9Cda4208H (MATRICE 30 T)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "4Bupm9Bda420Qb (MATRICE 30 T)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "4Bupm9Bda420Re (MATRICE 30 T)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "4Bupm9Bda420Rd (MATRICE 30 T)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "4Bupm9Bda420Qx (MATRICE 30 T)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "4Bupm9Bda420Rm (MATRICE 30 T)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "4Bupm9Bda420Rt (MATRICE 30 T)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "4Bupm9Bda420Qt (MATRICE 30 T)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "4Bupm9Bda420Qv (MATRICE 30 T)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "4Bupm9Bda420Rp (MATRICE 30 T)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "4Bupm9Bda420Qh (MATRICE 30 T)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "4Bupm9Bda420Ru (MATRICE 30 T)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "4Bupm9Cda4208E (MATRICE 30 T)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "4Bupm8Kda420Dc (MATRICE 30 T)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "4Bupm8Kda420Gv (MATRICE 30 T)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "4Bupm9Cda4208Z (MATRICE 30 T)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "4Bupm9Bda420Qk (MATRICE 30 T)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "4Bupm9Cda4207X (MATRICE 30 T)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "4Bupm9Bda420Ql (MATRICE 30 T)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "4Bupm9Bda420Qs (MATRICE 30 T)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "4Bupm9Bda420Qr (MATRICE 30 T)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "52Xpmapca400Sr (MINI 3 PRO)",
    "unit": "u",
    "initialQuantity": 1
  },
  {
    "name": "52Xpmaqca401G9 (MINI 3 PRO)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "52Xpmapca400D9 (MINI 3 PRO)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "52Xpmapca400Rk (MINI 3 PRO)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "52Xpmaqca401Nb (MINI 3 PRO)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "52Xpmaqca4018K (MINI 3 PRO)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "52Xpmaqca401Lc (MINI 3 PRO)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "52Xpmapca400Cq (MINI 3 PRO)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "52Xpmapca40118 (MINI 3 PRO)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "52Xpmapca4011A (MINI 3 PRO)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "52Xpmaqca401Dy (MINI 3 PRO)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "52Xpmapca400Dg (MINI 3 PRO)",
    "unit": "u",
    "initialQuantity": 1
  },
  {
    "name": "52Xpmapca4010X (MINI 3 PRO)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "52Xpmapca40101 (MINI 3 PRO)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "52Xpmaqca401Kq (MINI 3 PRO)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "52Xpmapca4010A (MINI 3 PRO)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "52Xpmaqca401K9 (MINI 3 PRO)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "52Xpmaqca401G0 (MINI 3 PRO)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "52Xpmaqca401L8 (MINI 3 PRO)",
    "unit": "u",
    "initialQuantity": 1
  },
  {
    "name": "4Erkm8W6G50Aua (MATRICE 30 T)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "4Erkm5V6G50C7A (MATRICE 30 T)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "Carcasa Sensores Delanteros (MATRICE 30 T)",
    "unit": "u",
    "initialQuantity": 4
  },
  {
    "name": "Carcasa Sensores Traseros (MATRICE 30 T)",
    "unit": "u",
    "initialQuantity": 8
  },
  {
    "name": "Carcasa Interna Inferior (MATRICE 30 T)",
    "unit": "u",
    "initialQuantity": 4
  },
  {
    "name": "Carcasa Externa Inferior (MATRICE 30 T)",
    "unit": "u",
    "initialQuantity": 4
  },
  {
    "name": "Soporte Interno (MATRICE 30 T)",
    "unit": "u",
    "initialQuantity": 4
  },
  {
    "name": "Filtro Aire (MATRICE 30 T)",
    "unit": "u",
    "initialQuantity": 4
  },
  {
    "name": "Carcasa Antena Delantera (MATRICE 30 T)",
    "unit": "u",
    "initialQuantity": 4
  },
  {
    "name": "Carcasa Antena Trasera (MATRICE 30 T)",
    "unit": "u",
    "initialQuantity": 4
  },
  {
    "name": "Tren Aterrizaje Trasero (MATRICE 30 T)",
    "unit": "u",
    "initialQuantity": 3
  },
  {
    "name": "Soporte Interno Metalizado (MATRICE 30 T)",
    "unit": "u",
    "initialQuantity": 4
  },
  {
    "name": "Carcasa Media (MATRICE 30 T)",
    "unit": "u",
    "initialQuantity": 4
  },
  {
    "name": "Soporte Brazo Superior Derecho (MATRICE 30 T)",
    "unit": "u",
    "initialQuantity": 4
  },
  {
    "name": "Soporte Brazo Inferioir Derecho (MATRICE 30 T)",
    "unit": "u",
    "initialQuantity": 4
  },
  {
    "name": "Soporte Brazo Superioir Izquierdo (MATRICE 30 T)",
    "unit": "u",
    "initialQuantity": 4
  },
  {
    "name": "Carcasa Inferior (MATRICE 30 T)",
    "unit": "u",
    "initialQuantity": 4
  },
  {
    "name": "Brazo Delantero Derecho (MATRICE 30 T)",
    "unit": "u",
    "initialQuantity": 17
  },
  {
    "name": "Brazo Delantero Izquierdo (MATRICE 30 T)",
    "unit": "u",
    "initialQuantity": 17
  },
  {
    "name": "Brazo Trasero Izquiero (MATRICE 30 T)",
    "unit": "u",
    "initialQuantity": 17
  },
  {
    "name": "Brazo Trasero Derecho (MATRICE 30 T)",
    "unit": "u",
    "initialQuantity": 15
  },
  {
    "name": "Sistema Deteccion Inferior (MATRICE 30 T)",
    "unit": "u",
    "initialQuantity": 6
  },
  {
    "name": "Sensor Trasero (MATRICE 30 T)",
    "unit": "u",
    "initialQuantity": 1
  },
  {
    "name": "Helices Delanteros Derecha (MATRICE 30 T)",
    "unit": "u",
    "initialQuantity": 31
  },
  {
    "name": "Helice Trasera Derecha (MATRICE 30 T)",
    "unit": "u",
    "initialQuantity": 32
  },
  {
    "name": "Helice Delantera Izquierda (MATRICE 30 T)",
    "unit": "u",
    "initialQuantity": 2
  },
  {
    "name": "Helice Trasera Izquierda (MATRICE 30 T)",
    "unit": "u",
    "initialQuantity": 32
  },
  {
    "name": "Carcasa Inferior (MAVIC3T)",
    "unit": "u",
    "initialQuantity": 9
  },
  {
    "name": "Brazo Delantero Izquierdo (MAVIC3T)",
    "unit": "u",
    "initialQuantity": 15
  },
  {
    "name": "Carcasa Media (MAVIC3T)",
    "unit": "u",
    "initialQuantity": 8
  },
  {
    "name": "Carcasa Superior (MAVIC3T)",
    "unit": "u",
    "initialQuantity": 9
  },
  {
    "name": "Sensor Vision Delantero (MAVIC AIR 2)",
    "unit": "u",
    "initialQuantity": 1
  },
  {
    "name": "Brazo Delantero Derecho (MAVIC3T)",
    "unit": "u",
    "initialQuantity": 15
  },
  {
    "name": "Helices Lado A (MAVIC3T)",
    "unit": "u",
    "initialQuantity": 26
  },
  {
    "name": "Helices Lado B (MAVIC3T)",
    "unit": "u",
    "initialQuantity": 25
  },
  {
    "name": "Brazo Trasero Derecho (MAVIC3T)",
    "unit": "u",
    "initialQuantity": 14
  },
  {
    "name": "0P2Ambm53800T4 (MAVIC 2)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "0P2Ambm538007U (MAVIC 2)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "0P2Ambm53800Tb (MAVIC 2)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "0P2Ambm53800Du (MAVIC 2)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "0P2Ambm53801Xr (MAVIC 2)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "0P2Ambm538008Y (MAVIC 2)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "0P2Ambm5380031 (MAVIC 2)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "0P2Ambm53800N5 (MAVIC 2)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "0P2Ambm53800T5 (MAVIC 2)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "0P2Ambm538012R (MAVIC 2)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "0P2Ambm53801F3 (MAVIC 2)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "0P2Ambm53801Dr (MAVIC 2)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "0P2Ambm53800Sk (MAVIC 2)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "0P2Ambm53800Ra (MAVIC 2)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "0P2Ambm538016V (MAVIC 2)",
    "unit": "u",
    "initialQuantity": 1
  },
  {
    "name": "0P2Ambm538017E (MAVIC 2)",
    "unit": "u",
    "initialQuantity": 1
  },
  {
    "name": "0P2Ambm53800Qf (MAVIC 2)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "0P2Ambm538014U (MAVIC 2)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "0P2Ambm538017K (MAVIC 2)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "0P2Ambm53800K6 (MAVIC 2)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "0P2Ambm5380184 (MAVIC 2)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "0P2Ambm53801D1 (MAVIC 2)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "0P2Ambm53800Ub (MAVIC 2)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "0P2Ambm53800Kf (MAVIC 2)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "0P2Ambm538018K (MAVIC 2)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "0P2Ambm53800S0 (MAVIC 2)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "0P2Ambm538008K (MAVIC 2)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "0P2Ambm53800Q3 (MAVIC 2)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "0P2Ambm53800N1 (MAVIC 2)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "0P2Ambm53801Ax (MAVIC 2)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "0P2Ambm53800D5 (MAVIC 2)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "0P2Ambm53800Ce (MAVIC 2)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "0P2Ambm538019F (MAVIC 2)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "0P2Ambm53800Sn (MAVIC 2)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "0P2Ambm53800Sa (MAVIC 2)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "0P2Ambm53801Ce (MAVIC 2)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "0P2Ambm538020Y (MAVIC 2)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "0P2Ambm53801F6 (MAVIC 2)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "0P2Ambm5380083 (MAVIC 2)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "0P2Ambm53800Zx (MAVIC 2)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "0P2Ambm538001N (MAVIC 2)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "0P2Ambm5380110 (MAVIC 2)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "0P2Ambm53800U6 (MAVIC 2)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "0P2Ambm538003A (MAVIC 2)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "0P2Ambm53800Z4 (MAVIC 2)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "0P2Ambm538012B (MAVIC 2)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "0P2Ambm538010S (MAVIC 2)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "0P2Ambm53801Ez (MAVIC 2)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "0P2Ambm53800S4 (MAVIC 2)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "0P2Ambm538003X (MAVIC 2)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "0P2Ambm53800Sl (MAVIC 2)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "0P2Ambm53800Ja (MAVIC 2)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "0P2Ambm538018Q (MAVIC 2)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "0P2Ambm53801Pn (MAVIC 2)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "0P2Ambm53800P3 (MAVIC 2)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "0P2Ambm53800Df (MAVIC 2)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "0P2Ambm53800Ty (MAVIC 2)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "0P2Ambm538004T (MAVIC 2)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "0P2Ambm53800Ca (MAVIC 2)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "0P2Al5F53703Fl (MAVIC 2)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "0P2Al5C5370242 (MAVIC 2)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "0P2Al5C5370148 (MAVIC 2)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "0P2Al5J53700K5 (MAVIC 2)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "0P2Am7P53800U5 (MAVIC 2)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "0P2Am7N538019X (MAVIC 2)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "0P2Ah6N534015Y (MAVIC 2)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "0P2Ambm5380149 (MAVIC 2)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "4Bupm9Ada420Lz (MATRICE 30T)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "4Bupm9Ada420Kq (MATRICE 30T)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "4Bupm9Ada4208F (MATRICE 30T)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "4Bupm9Ada42079 (MATRICE 30T)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "4Bupm9Ada420H1 (MATRICE 30T)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "4Bupm9Ada4202L (MATRICE 30T)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "4Bupm9Ada420Kc (MATRICE 30T)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "4Bupm9Ada4203F (MATRICE 30T)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "4Bupm9Ada420Kp (MATRICE 30T)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "4Bupm9Ada420Ks (MATRICE 30T)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "4Bupm9Ada420Gv (MATRICE 30T)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "4Bupm9Ada4209A (MATRICE 30T)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "4Bupm9Ada420C9 (MATRICE 30T)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "4Bupm9Ada420F4 (MATRICE 30T)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "4Bupm9Ada420Hg (MATRICE 30T)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "4Bupm9Ada420K1 (MATRICE 30T)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "4Bupm9Ada420Kv (MATRICE 30T)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "4Bupm9Ada420Kl (MATRICE 30T)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "4Bupm9Ada420Km (MATRICE 30T)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "4Bupm9Ada420Dh (MATRICE 30T)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "4Bupm9Ada420Jw (MATRICE 30T)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "4Bupm9Ada4206G (MATRICE 30T)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "4Bupm9Lda420Dn (MATRICE 30T)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "4Bupm9Lda42053 (MATRICE 30T)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "4Bupm9Lda420An (MATRICE 30T)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "4Bupm9Lda420El (MATRICE 30T)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "4Bupm9Lda4204X (MATRICE 30T)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "4Bupm9Lda420E4 (MATRICE 30T)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "4Bupm9Lda420Es (MATRICE 30T)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "4Bupm9Lda420Dz (MATRICE 30T)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "4Bupm9Lda420As (MATRICE 30T)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "4Bupm9Lda420Ev (MATRICE 30T)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "4Bupm9Lda420D6 (MATRICE 30T)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "4Bupm9Lda420A0 (MATRICE 30T)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "4Bupm9Lda420Er (MATRICE 30T)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "4Bupm9Lda4209B (MATRICE 30T)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "4Bupm9Lda420Ab (MATRICE 30T)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "4Bupm9Lda4204Z (MATRICE 30T)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "4Bupm9Lda420Ex (MATRICE 30T)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "4Bupm9Lda420C2 (MATRICE 30T)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "4Bupm9Lda4209L (MATRICE 30T)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "4Bupm9Lda420Ad (MATRICE 30T)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "4Bupm8Lda4205X (MATRICE 30T)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "4Bupm8Lda42068 (MATRICE 30T)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "4Bupm8Lda4206E (MATRICE 30T)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "4Bupm8Lda4206H (MATRICE 30T)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "4Bupm8Jda420Jj (MATRICE 30T)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "4Bupm8Jda420Jc (MATRICE 30T)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "4Bupm9Jda4206H (MATRICE 30T)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "4Bupm9Jda4205D (MATRICE 30T)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "4Bupm9Jda4204P (MATRICE 30T)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "4Bupm9Jda42058 (MATRICE 30T)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "4Bupm9Gda420Mv (MATRICE 30T)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "4Bupm9Gda420Jx (MATRICE 30T)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "4Bupm9Gda420Jz (MATRICE 30T)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "4Bupm9Gda420Nf (MATRICE 30T)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "4Bupm9Gda4221E (MATRICE 30T)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "4Bupm9Gda42206 (MATRICE 30T)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "4Bupm9Dda42086 (MATRICE 30T)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "4Bupm99Da420B4 (MATRICE 30T)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "4Bupm9Eda4201T (MATRICE 30T)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "4Bupm8Kda4203D (MATRICE 30T)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "4Bupm8Kda4203K (MATRICE 30T)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "4Bupm9Cda42Bu (MATRICE 30T)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "4Bupm9Cda420Bt (MATRICE 30T)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "4Erkm8W6G510Ea (MINI 3 PRO)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "4Erkm8W6G512Pa (MINI 3 PRO)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "4Erkm8W6G5128A (MINI 3 PRO)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "4Erkm8W6G513Ga (MINI 3 PRO)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "4Erkm8W6G515Za (MINI 3 PRO)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "4Erkm8W6G515Ta (MINI 3 PRO)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "4Erkm8W6G50Cda (MINI 3 PRO)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "4Erkm8W6G50Rba (MINI 3 PRO)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "4Erkm8W6G50Vqa (MINI 3 PRO)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "4Erkm8W6G501Ua (MINI 3 PRO)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "4Erkm8W6G508Ca (MINI 3 PRO)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "4Erkm8W6G5003A (MINI 3 PRO)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "4Erkm8W6G50T6A (MINI 3 PRO)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "4Erkm8W6G50Bsa (MINI 3 PRO)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "4Erkm8W6G50Sma (MINI 3 PRO)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "4Erkm8W6G50Zaa (MINI 3 PRO)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "4Erkm8V6G501Pa (MINI 3 PRO)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "4Erkm8V6G501Da (MINI 3 PRO)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "4Erkm8V6G50Fza (MINI 3 PRO)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "4Erkm8V6G500Ya (MINI 3 PRO)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "4Erkm8V6G50Qja (MINI 3 PRO)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "4Erkm8V6G50Bva (MINI 3 PRO)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "4Erkm8V6G500Ua (MINI 3 PRO)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "4Erkm8V6G5158A (MINI 3 PRO)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "4Erkm8V6G51Una (MINI 3 PRO)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "4Erkm8V6G51U4A (MINI 3 PRO)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "4Erkm8V6G51Uva (MINI 3 PRO)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "4Erkm8V6G51T5A (MINI 3 PRO)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "4Erkm8V6G5268A (MINI 3 PRO)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "4Erkm8V6G52Dya (MINI 3 PRO)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "4Erkm8V6G523La (MINI 3 PRO)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "4Erkm8V6G52Cna (MINI 3 PRO)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "4Erkm8V6G521Ga (MINI 3 PRO)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "4Erkm8U6G52D4A (MINI 3 PRO)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "4Erkm8U6G52Tca (MINI 3 PRO)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "4Erkm8U6G521Ta (MINI 3 PRO)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "4Erkm8U6G52Cla (MINI 3 PRO)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "4Erkm8U6G52Xya (MINI 3 PRO)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "4Erkm8U6G51Uja (MINI 3 PRO)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "4Erkm8U6G510Ua (MINI 3 PRO)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "4Erkm8S6G51Wsa (MINI 3 PRO)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "4Erkm8S6G51Vha (MINI 3 PRO)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "4Erkm8S6G50Ysa (MINI 3 PRO)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "4Erkm8S6G50P2A (MINI 3 PRO)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "4Erkm8S6G522Ka (MINI 3 PRO)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "4Erkm8S6G5330A (MINI 3 PRO)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "Maletin Original Mavic 2 (MAVIC 2)",
    "unit": "u",
    "initialQuantity": 0
  },
  {
    "name": "Helice Mini 4 Pro (MINI 4 PRO)",
    "unit": "u",
    "initialQuantity": 1
  },
  {
    "name": "Carcasa Completa (MATRICE 30T)",
    "unit": "u",
    "initialQuantity": 3
  },
  {
    "name": "Helice Trasera Derecha (MAVIC3T)",
    "unit": "u",
    "initialQuantity": 35
  },
  {
    "name": "Helice Trasera Izquierda (MAVIC3T)",
    "unit": "u",
    "initialQuantity": 35
  },
  {
    "name": "Brazo Tracero Izquierdo (MAVIC3T)",
    "unit": "u",
    "initialQuantity": 15
  },
  {
    "name": "Helice Delantera Derecha (MINI 4 PRO)",
    "unit": "u",
    "initialQuantity": 21
  },
  {
    "name": "Helice Delantera Izquierda (MINI 4 PRO)",
    "unit": "u",
    "initialQuantity": 21
  },
  {
    "name": "Helice Trasera Derecha (MINI 4 PRO)",
    "unit": "u",
    "initialQuantity": 20
  },
  {
    "name": "Helice Trasera Izquierda (MINI 4 PRO)",
    "unit": "u",
    "initialQuantity": 20
  },
  {
    "name": "Brazo Delantero Derecho (MINI 4 PRO)",
    "unit": "u",
    "initialQuantity": 12
  },
  {
    "name": "Brazo Delantero Izquierdo (MINI 4 PRO)",
    "unit": "u",
    "initialQuantity": 12
  },
  {
    "name": "Brazo Trasero Derecho (MINI 4 PRO)",
    "unit": "u",
    "initialQuantity": 12
  },
  {
    "name": "Brazo Trasero Izquierdo (MINI 4 PRO)",
    "unit": "u",
    "initialQuantity": 12
  },
  {
    "name": "Carcasa Superior (MINI 4 PRO)",
    "unit": "u",
    "initialQuantity": 10
  },
  {
    "name": "Carcasa Media (MINI 4 PRO)",
    "unit": "u",
    "initialQuantity": 10
  },
  {
    "name": "Carcasa Inferior (MINI 4 PRO)",
    "unit": "u",
    "initialQuantity": 10
  },
  {
    "name": "Helice Delantera Derecha (MAVIC3T)",
    "unit": "u",
    "initialQuantity": 10
  },
  {
    "name": "Helice Delantera Izquierda (MAVIC3T)",
    "unit": "u",
    "initialQuantity": 10
  },
  {
    "name": "Almohadilla Aterrizaje (DRON)",
    "unit": "u",
    "initialQuantity": 8
  },
  {
    "name": "Correa Radio Control (DRON)",
    "unit": "u",
    "initialQuantity": 8
  },
  {
    "name": "Carcasa Superior (MATRICE30T)",
    "unit": "u",
    "initialQuantity": 3
  }
];
