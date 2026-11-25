// shots.js — staging 4 scene screenshot (?shot=rush|cook|serve|night).
// Setiap scene dibangun dari state game ASLI lewat fungsi game yang sama
// (spawnOrder, wokStartCooking, plateDish, serveOrder), dengan seed tetap,
// jadi frame yang difoto = gameplay nyata, bukan mockup. Waktu animasi
// dibekukan (state.time tetap) supaya tiap run menghasilkan frame sama.

import { recipeById } from './recipes.js';
import { spawnOrder, waveForClock } from './orders.js';
import { wokStartCooking } from './stove.js';
import { plateDish } from './serve.js';
import { NIGHT_MINUTES } from './main.js';

/** Isi wajan dengan resep lengkap lalu mulai masak di progress tertentu. */
function stageCooking(state, recipeId, progress) {
  const recipe = recipeById(recipeId);
  state.wok.items = [...recipe.items];
  const started = wokStartCooking(state.wok);
  if (started) state.wok.progress = progress;
}

/** Tambah order lalu atur resep/timer/meja-nya secara eksplisit. */
function stageOrder(state, recipeId, timeLeft, total, tableIndex) {
  const order = spawnOrder(state);
  order.recipe = recipeById(recipeId);
  order.timeLeft = timeLeft;
  order.total = total;
  order.table = [
    { id: 'meja1', label: 'MEJA 1' },
    { id: 'meja2', label: 'MEJA 2' },
    { id: 'meja3', label: 'MEJA 3' },
    { id: 'ojek', label: 'OJEK ONLINE' },
  ][tableIndex % 4];
  return order;
}

function baseScene(state, clockMin, money) {
  state.started = true;
  state.clockMin = clockMin;
  state.money = money;
  state.waveLabel = waveForClock(clockMin).label;
  state.time = 3.7; // beku: asap & kedip deterministik
  state.orders = [];
  state.spawnTimer = 99;
}

export function stageShot(name, state) {
  if (name === 'rush') {
    // Wave-3 rush: 5 order menumpuk, wajan berasap, piring terisi, 00:38 lagi.
    baseScene(state, NIGHT_MINUTES - 38 / 60, 287500);
    state.served = 17;
    state.combo = 3;
    state.bestCombo = 4;
    state.burnt = 1;
    state.expired = 1;
    state.stock.nasi = 6;
    state.stock.ayam = 2;
    state.stock.kerupuk = 1;
    stageOrder(state, 'nasgor-pedas', 12, 60, 0);
    stageOrder(state, 'ayamgep-komplit', 24, 60, 1);
    stageOrder(state, 'nassayur-komplit', 31, 60, 2);
    stageOrder(state, 'nasdadar-spesial', 44, 60, 3);
    stageOrder(state, 'nasgor-komplit', 52, 60, 1);
    stageCooking(state, 'nasgor-pedas', 0.62);
    state.board.item = 'ayam';
    state.board.chops = 2;
    plateDish(state, recipeById('ayamgep-pedas'));
    return;
  }
  if (name === 'cook') {
    // Tengah malam: wajan memasak, talenan dipakai, 3 order jalan.
    baseScene(state, 35, 68000);
    state.served = 4;
    state.combo = 1;
    state.bestCombo = 2;
    state.stock.nasi = 19;
    state.stock.telur = 12;
    stageOrder(state, 'nasgor-pedas', 58, 95, 0);
    stageOrder(state, 'nassayur-pedas', 71, 95, 2);
    stageOrder(state, 'nasdadar-pedas', 83, 95, 3);
    stageCooking(state, 'ayamgep-pedas', 0.45);
    state.board.item = 'sayur';
    state.board.chops = 1;
    return;
  }
  if (name === 'serve') {
    // Piring siap antar ke order yang cocok, tip baru saja masuk.
    baseScene(state, 70, 154000);
    state.served = 9;
    state.combo = 3;
    state.bestCombo = 3;
    state.stock.nasi = 14;
    const dish = recipeById('ayamgep-pedas');
    plateDish(state, dish);
    stageOrder(state, 'ayamgep-pedas', 48, 75, 1);
    stageOrder(state, 'nasgor-komplit', 55, 75, 0);
    stageOrder(state, 'nassayur-spesial', 63, 75, 3);
    state.lastServe = { text: '+Rp 25.650 · TIP +Rp 4.750', t: 2.0, combo: 3 };
    return;
  }
  if (name === 'night') {
    // Layar akhir malam: total, 3 bintang, rekap order.
    baseScene(state, NIGHT_MINUTES, 386500);
    state.phase = 'night';
    state.served = 21;
    state.burnt = 2;
    state.expired = 1;
    state.bestCombo = 5;
    state.combo = 0;
    state.stock.nasi = 2;
    return;
  }
  // Nama tak dikenal: fallback ke scene cook.
  stageShot('cook', state);
}
