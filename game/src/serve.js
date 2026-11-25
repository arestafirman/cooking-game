// serve.js — plating + antar ke meja + tip. Hidangan matang diangkat dari
// wajan ke piring, lalu klik order yang resepnya cocok untuk mengantar.
// Antar 3 order beruntun tanpa gosong/hangus = tip +25%.

import { formatRp } from './recipes.js';
import { orderById, removeOrder } from './orders.js';

export const COMBO_FOR_TIP = 3;
export const TIP_RATE = 0.25;

/** Piring kosong baru. */
export function emptyPlate() {
  return { recipe: null, servedFlash: 0 };
}

/** Letakkan hidangan matang di piring; false bila piring sudah terisi. */
export function plateDish(state, recipe) {
  if (state.plate.recipe) return false;
  state.plate.recipe = recipe;
  state.plate.servedFlash = 0;
  return true;
}

/**
 * Antar piring ke satu order. Resep harus cocok persis.
 * Kembalikan { ok, earned, tip, combo } atau { ok:false, reason }.
 */
export function serveOrder(state, orderId) {
  const order = orderById(state, orderId);
  if (!order) return { ok: false, reason: 'order tidak ada' };
  if (!state.plate.recipe) return { ok: false, reason: 'piring kosong' };
  if (state.plate.recipe.id !== order.recipe.id) {
    order.flash = 0.6;
    return { ok: false, reason: `bukan ${order.recipe.name}` };
  }
  const base = order.recipe.price;
  // Bonus cepat: antar saat timer masih >50% = +10% harga.
  const fast = order.timeLeft / order.total > 0.5;
  const fastBonus = fast ? Math.round(base * 0.1) : 0;
  state.combo += 1;
  const tip = state.combo >= COMBO_FOR_TIP ? Math.round(base * TIP_RATE) : 0;
  const earned = base + fastBonus + tip;
  state.money += earned;
  state.served += 1;
  if (state.combo > state.bestCombo) state.bestCombo = state.combo;
  state.plate.recipe = null;
  state.plate.servedFlash = 1.2;
  state.lastServe = {
    text: `+${formatRp(earned)}${tip > 0 ? ` · TIP +${formatRp(tip)}` : ''}${fast ? ' · CEPAT!' : ''}`,
    t: 2.2,
    combo: state.combo,
  };
  removeOrder(state, orderId);
  return { ok: true, earned, tip, combo: state.combo };
}

/** Combo putus (gosong / order hangus). */
export function breakCombo(state) {
  state.combo = 0;
}

/** Bintang akhir malam dari jumlah order yang berhasil diantar. */
export function nightStars(state) {
  if (state.served >= 18) return 3;
  if (state.served >= 12) return 2;
  if (state.served >= 7) return 1;
  return 0;
}
