// orders.js — papan order: order datang dari 3 meja + ojek online,
// masing-masing punya resep, timer sendiri, dan harga. Timer habis = order
// hangus, combo putus. Wave makin malam makin cepat dan makin banyak.

import { pickRecipe } from './recipes.js';

export const TABLES = [
  { id: 'meja1', label: 'MEJA 1', x: 0 },
  { id: 'meja2', label: 'MEJA 2', x: 1 },
  { id: 'meja3', label: 'MEJA 3', x: 2 },
  { id: 'ojek',  label: 'OJEK ONLINE', x: 3 },
];

export const MAX_ORDERS = 5;

// Durasi order (detik) dan jeda spawn (detik) per wave.
export const WAVE_RULES = [
  { wave: 1, label: 'WAVE 1 · 21:00', orderTime: 95, spawnEvery: 13, maxActive: 3 },
  { wave: 2, label: 'WAVE 2 · 22:00', orderTime: 75, spawnEvery: 10, maxActive: 4 },
  { wave: 3, label: 'WAVE 3 · RUSH 23:00', orderTime: 60, spawnEvery: 7, maxActive: 5 },
];

export function waveForClock(clockMin) {
  if (clockMin < 40) return WAVE_RULES[0];
  if (clockMin < 80) return WAVE_RULES[1];
  return WAVE_RULES[2];
}

let nextOrderId = 1;

export function resetOrderIds() {
  nextOrderId = 1;
}

/** Buat satu order baru dari RNG; sumber meja/ojek bergiliran acak. */
export function spawnOrder(state) {
  const rule = waveForClock(state.clockMin);
  const recipe = pickRecipe(state.rng);
  const table = TABLES[Math.floor(state.rng() * TABLES.length)];
  const order = {
    id: nextOrderId++,
    recipe,
    table,
    timeLeft: rule.orderTime,
    total: rule.orderTime,
    flash: 0,
  };
  state.orders.push(order);
  return order;
}

/** Majukan semua timer order; kembalikan order yang hangus pada tick ini. */
export function tickOrders(state, dt) {
  const expired = [];
  for (const order of state.orders) {
    order.timeLeft -= dt;
    if (order.flash > 0) order.flash -= dt;
  }
  state.orders = state.orders.filter((order) => {
    if (order.timeLeft <= 0) {
      expired.push(order);
      return false;
    }
    return true;
  });
  return expired;
}

/** Warna timer: hijau -> kuning -> merah seiring waktu habis. */
export function orderTimerColor(order) {
  const frac = order.timeLeft / order.total;
  if (frac > 0.5) return '#58b368';
  if (frac > 0.25) return '#f2b705';
  return '#e23b2e';
}

export function orderById(state, id) {
  return state.orders.find((o) => o.id === id) ?? null;
}

export function removeOrder(state, id) {
  state.orders = state.orders.filter((o) => o.id !== id);
}
