// stove.js — satu tungku, satu wajan. Masak butuh resep lengkap di wajan;
// kalau hidangan matang tidak segera diangkat, gosong dan wajan harus dibuang
// isinya. Tekanan game ini datang dari antrean di tungku tunggal ini.

import { matchRecipe, isPartialMatch } from './recipes.js';

export const BURN_GRACE_SECONDS = 4;

/** Wajan kosong baru. */
export function emptyWok() {
  return {
    items: [],        // id bahan di dalam wajan
    cooking: false,   // sedang di atas api
    recipe: null,     // resep yang sedang dimasak
    progress: 0,      // 0..1 selama memasak
    cookTime: 0,      // detik total masak resep ini
    done: false,      // matang, siap diangkat
    burnTimer: 0,     // detik sejak matang; lewat grace = gosong
    burnt: false,     // gosong, harus dibuang
    invalid: false,   // isi wajan bukan awal resep mana pun
  };
}

/** Masukkan satu bahan ke wajan; kembalikan false bila wajan penuh (4). */
export function wokAdd(wok, ingredientId) {
  if (wok.items.length >= 4 || wok.cooking) return false;
  wok.items.push(ingredientId);
  wok.invalid = matchRecipe(wok.items) === null && !isPartialMatch(wok.items);
  return true;
}

/** Mulai masak bila isi wajan = satu resep lengkap. Kembalikan resepnya. */
export function wokStartCooking(wok) {
  const recipe = matchRecipe(wok.items);
  if (!recipe || wok.cooking) return null;
  wok.cooking = true;
  wok.recipe = recipe;
  wok.cookTime = recipe.cook;
  wok.progress = 0;
  wok.done = false;
  wok.burnTimer = 0;
  wok.burnt = false;
  return recipe;
}

/** Majukan masakan; kembalikan 'done' saat baru matang, 'burnt' saat gosong. */
export function wokTick(wok, dt) {
  if (!wok.cooking) return null;
  if (!wok.done) {
    wok.progress += dt / wok.cookTime;
    if (wok.progress >= 1) {
      wok.progress = 1;
      wok.done = true;
      wok.burnTimer = 0;
      return 'done';
    }
    return null;
  }
  wok.burnTimer += dt;
  if (wok.burnTimer >= BURN_GRACE_SECONDS) {
    wok.burnt = true;
    wok.cooking = false;
    return 'burnt';
  }
  return null;
}

/** Angkat hidangan matang ke piring; kembalikan resepnya atau null. */
export function wokTakeDish(wok) {
  if (!wok.done || wok.burnt) return null;
  const recipe = wok.recipe;
  wok.items = [];
  wok.cooking = false;
  wok.recipe = null;
  wok.progress = 0;
  wok.done = false;
  wok.burnTimer = 0;
  wok.invalid = false;
  return recipe;
}

/** Buang isi wajan gosong / salah racik; kembalikan true bila ada yang dibuang. */
export function wokDump(wok) {
  if (wok.items.length === 0) return false;
  wok.items = [];
  wok.cooking = false;
  wok.recipe = null;
  wok.progress = 0;
  wok.done = false;
  wok.burnTimer = 0;
  wok.burnt = false;
  wok.invalid = false;
  return true;
}
