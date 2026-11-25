// counter.js — meja bahan (counter) + talenan. Stok bahan terbatas semalam:
// habis berarti resep yang memakainya tidak bisa dibuat lagi. Ayam dan sayur
// harus dicincang dulu di talenan (klik 3x) sebelum masuk wajan.

import { INGREDIENTS, ING_BY_ID } from './recipes.js';
import { wokAdd } from './stove.js';

export const CHOPS_NEEDED = 3;

/** Stok awal semalam, satu angka per bahan. */
export function freshStock() {
  const stock = {};
  for (const ing of INGREDIENTS) stock[ing.id] = ing.stock;
  return stock;
}

/** Talenan kosong baru. */
export function emptyBoard() {
  return { item: null, chops: 0 };
}

/**
 * Klik satu tile bahan. Bahan biasa langsung masuk wajan; bahan yang harus
 * dicincang naik ke talenan. Kembalikan { ok, reason } untuk umpan balik.
 */
export function counterClick(state, ingredientId) {
  const ing = ING_BY_ID[ingredientId];
  if (!ing) return { ok: false, reason: 'bahan tidak dikenal' };
  if (state.stock[ingredientId] <= 0) return { ok: false, reason: `${ing.name} habis!` };
  if (state.wok.cooking) return { ok: false, reason: 'wajan sedang memasak' };
  if (ing.chop) {
    if (state.board.item) return { ok: false, reason: 'talenan masih dipakai' };
    state.board.item = ingredientId;
    state.board.chops = 0;
    state.stock[ingredientId] -= 1;
    return { ok: true, reason: 'cincang dulu di talenan' };
  }
  if (!wokAdd(state.wok, ingredientId)) return { ok: false, reason: 'wajan penuh' };
  state.stock[ingredientId] -= 1;
  return { ok: true, reason: '' };
}

/**
 * Klik talenan: satu cincangan. Setelah 3x, bahan pindah otomatis ke wajan.
 * Kembalikan 'chopped' saat bahan masuk wajan, 'chopping' saat masih dicincang.
 */
export function boardClick(state) {
  const board = state.board;
  if (!board.item) return null;
  board.chops += 1;
  if (board.chops < CHOPS_NEEDED) return 'chopping';
  const item = board.item;
  board.item = null;
  board.chops = 0;
  wokAdd(state.wok, item);
  return 'chopped';
}
