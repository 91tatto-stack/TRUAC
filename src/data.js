// Datos de Insumos (inventario) y Control de gastos.
//
// Firestore:
//   taller/insumos -> { items: [...], movements: [...] }
//   taller/gastos  -> { expenses: [...], budgets: { "2026": 50000000, ... } }
//
// Los movimientos y los gastos se AGREGAN con arrayUnion, así dos personas
// registrando al mismo tiempo no se pisan. El stock de cada insumo NO se guarda:
// se calcula sumando sus movimientos, así nunca queda descuadrado.

import { useEffect, useState } from "react";
import { doc, onSnapshot, setDoc, arrayUnion, runTransaction } from "firebase/firestore";
import { db } from "./firebase.js";

export const INSUMOS_REF = () => doc(db, "taller", "insumos");
export const GASTOS_REF = () => doc(db, "taller", "gastos");

export function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

// ---------------------------------------------------------------------------
// Suscripciones en tiempo real
// ---------------------------------------------------------------------------

export function useInsumos() {
  const [data, setData] = useState(null);
  useEffect(() => {
    const unsub = onSnapshot(
      INSUMOS_REF(),
      (snap) => {
        const d = snap.exists() ? snap.data() : {};
        setData({ items: d.items || [], movements: d.movements || [] });
      },
      () => setData({ items: [], movements: [], error: true })
    );
    return () => unsub();
  }, []);
  return data;
}

export function useGastos() {
  const [data, setData] = useState(null);
  useEffect(() => {
    const unsub = onSnapshot(
      GASTOS_REF(),
      (snap) => {
        const d = snap.exists() ? snap.data() : {};
        setData({ expenses: d.expenses || [], budgets: d.budgets || {} });
      },
      () => setData({ expenses: [], budgets: {}, error: true })
    );
    return () => unsub();
  }, []);
  return data;
}

// ---------------------------------------------------------------------------
// Escrituras
// ---------------------------------------------------------------------------

export function saveItem(item) {
  return setDoc(INSUMOS_REF(), { items: arrayUnion(item) }, { merge: true });
}

export function saveMovement(movement) {
  return setDoc(INSUMOS_REF(), { movements: arrayUnion(movement) }, { merge: true });
}

export function updateItem(itemId, changes) {
  return runTransaction(db, async (tx) => {
    const snap = await tx.get(INSUMOS_REF());
    const items = snap.exists() ? snap.data().items || [] : [];
    tx.set(INSUMOS_REF(), { items: items.map((it) => (it.id === itemId ? { ...it, ...changes } : it)) }, { merge: true });
  });
}

export function saveExpense(expense) {
  return setDoc(GASTOS_REF(), { expenses: arrayUnion(expense) }, { merge: true });
}

export function deleteExpense(expenseId) {
  return runTransaction(db, async (tx) => {
    const snap = await tx.get(GASTOS_REF());
    const expenses = snap.exists() ? snap.data().expenses || [] : [];
    tx.set(GASTOS_REF(), { expenses: expenses.filter((e) => e.id !== expenseId) }, { merge: true });
  });
}

export function saveBudget(year, amount) {
  return setDoc(GASTOS_REF(), { budgets: { [String(year)]: Number(amount) || 0 } }, { merge: true });
}

// ---------------------------------------------------------------------------
// Cálculos
// ---------------------------------------------------------------------------

// Efecto de un movimiento sobre el stock.
export function signedQty(m) {
  const q = Number(m.quantity) || 0;
  if (m.type === "salida") return -Math.abs(q);
  if (m.type === "ajuste") return q; // el ajuste ya viene con signo
  return Math.abs(q); // entrada, reintegro
}

// Stock, costo promedio y valor de cada insumo.
export function computeStock(items, movements) {
  const map = new Map();
  items.forEach((it) => map.set(it.id, { stock: 0, inQty: 0, inValue: 0, lastMove: null, moves: 0 }));
  movements.forEach((m) => {
    const s = map.get(m.itemId);
    if (!s) return;
    s.stock += signedQty(m);
    s.moves += 1;
    if (m.type === "entrada" && Number(m.unitCost) > 0) {
      s.inQty += Number(m.quantity) || 0;
      s.inValue += (Number(m.quantity) || 0) * Number(m.unitCost);
    }
    if (!s.lastMove || new Date(m.date) > new Date(s.lastMove)) s.lastMove = m.date;
  });
  map.forEach((s) => {
    s.stock = round2(s.stock);
    s.avgCost = s.inQty > 0 ? s.inValue / s.inQty : 0;
    s.value = Math.max(0, s.stock) * s.avgCost;
  });
  return map;
}

export function stockStatus(stock, minStock) {
  if (stock <= 0) return "agotado";
  if (stock <= (Number(minStock) || 0)) return "bajo";
  return "ok";
}

// Costo de un dron: insumos del inventario consumidos (valorizados) + gastos asociados.
export function droneCost(droneId, movements, expenses) {
  let insumos = 0;
  movements.forEach((m) => {
    if (m.droneId !== droneId) return;
    const v = (Number(m.quantity) || 0) * (Number(m.unitCost) || 0);
    if (m.type === "salida") insumos += v;
    if (m.type === "reintegro") insumos -= v;
  });
  const gastos = expenses.filter((e) => e.droneId === droneId).reduce((s, e) => s + (Number(e.amount) || 0), 0);
  return { insumos: Math.max(0, insumos), gastos, total: Math.max(0, insumos) + gastos };
}

export function findItemByName(items, name) {
  const key = (name || "").trim().toLowerCase();
  if (!key) return null;
  return items.find((it) => it.active !== false && it.name.trim().toLowerCase() === key) || null;
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

// ---------------------------------------------------------------------------
// Formato
// ---------------------------------------------------------------------------

const COP = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });
export function fmtMoney(n) {
  return COP.format(Math.round(Number(n) || 0));
}
// $ 9,8 M / $ 480 k — para etiquetas cortas en gráficas.
export function fmtCompact(n) {
  const v = Number(n) || 0;
  if (v >= 1e6) return `$${(v / 1e6).toLocaleString("es-CO", { maximumFractionDigits: 1 })} M`;
  if (v >= 1e3) return `$${Math.round(v / 1e3)} k`;
  return `$${Math.round(v)}`;
}
export function fmtQty(n) {
  return new Intl.NumberFormat("es-CO", { maximumFractionDigits: 2 }).format(Number(n) || 0);
}

export const MONTHS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

export function todayInput() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// Fecha "AAAA-MM-DD" -> objeto Date local (sin corrimiento por zona horaria).
export function parseDay(day) {
  if (!day) return null;
  if (day.length > 10) return new Date(day);
  const [y, m, d] = day.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function fmtDay(day) {
  const d = parseDay(day);
  if (!d) return "—";
  return d.toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" });
}

// ---------------------------------------------------------------------------
// Exportar a Excel (CSV con separador ; que Excel en español abre directo)
// ---------------------------------------------------------------------------

export function downloadCsv(filename, header, rows) {
  const esc = (v) => {
    const s = v === null || v === undefined ? "" : String(v);
    return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const num = (v) => (typeof v === "number" ? String(v).replace(".", ",") : v);
  const csv = [header, ...rows].map((r) => r.map((v) => esc(num(v))).join(";")).join("\r\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
