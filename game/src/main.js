// main.js — loop + state game "DAPUR TUTUP 23:00".
// Warung nasi goreng kaki lima, 21:00-23:00. Satu koki, satu wajan, satu
// kompor: order dari 3 meja + ojek online, stok bahan terbatas semalam,
// gosong kalau telat angkat, tip +25% kalau antar 3x beruntun.

import { INGREDIENTS, mulberry32 } from './recipes.js';
import { spawnOrder, tickOrders, waveForClock, resetOrderIds } from './orders.js';
import { emptyWok, wokStartCooking, wokTick, wokTakeDish, wokDump } from './stove.js';
import { freshStock, emptyBoard, counterClick, boardClick } from './counter.js';
import { emptyPlate, plateDish, serveOrder, breakCombo } from './serve.js';
import { drawGame, VIEW_W, VIEW_H } from './render.js';
import { attachInput } from './input.js';
import { sfx, sizzle, toggleMute } from './audio.js';
import { stageShot } from './shots.js';

export const NIGHT_MINUTES = 120;      // 21:00 -> 23:00
export const CLOCK_RATE = 0.4;         // menit game per detik nyata (malam = 5 mnt)
export const SEED_DEFAULT = 20261125;

export function createGame(seed = SEED_DEFAULT) {
  resetOrderIds();
  const state = {
    seed,
    rng: mulberry32(seed),
    phase: 'play',
    started: false,
    time: 0,
    clockMin: 0,
    money: 0,
    combo: 0,
    bestCombo: 0,
    served: 0,
    burnt: 0,
    expired: 0,
    orders: [],
    stock: freshStock(),
    wok: emptyWok(),
    board: emptyBoard(),
    plate: emptyPlate(),
    spawnTimer: 6,
    waveLabel: 'WAVE 1 · 21:00',
    waveBanner: null,
    muted: false,
    showRecipes: false,
    toast: null,
    lastServe: null,
    hitZones: [],
  };
  return state;
}

function showToast(state, text, seconds = 2) {
  state.toast = { text, t: seconds };
}

/** Satu tick simulasi (detik nyata dt). Dipakai loop dan staging shot. */
export function tick(state, dt) {
  state.time += dt;
  if (state.toast && state.toast.t > 0) state.toast.t -= dt;
  if (state.lastServe && state.lastServe.t > 0) state.lastServe.t -= dt;
  if (state.phase !== 'play') return;
  if (!state.started) return;

  state.clockMin += dt * CLOCK_RATE;
  const rule = waveForClock(state.clockMin);
  if (rule.label !== state.waveLabel) {
    state.waveLabel = rule.label;
    if (state.clockMin > 1) {
      state.waveBanner = { text: `${rule.label} — MAKIN RAMAI!`, t: 2.5 };
      sfx.newOrder();
    }
  }
  if (state.waveBanner && state.waveBanner.t > 0) state.waveBanner.t -= dt;

  // Spawn order baru.
  state.spawnTimer -= dt;
  if (state.spawnTimer <= 0 && state.orders.length < rule.maxActive) {
    spawnOrder(state);
    sfx.newOrder();
    state.spawnTimer = rule.spawnEvery * (0.85 + state.rng() * 0.3);
  } else if (state.spawnTimer <= 0) {
    state.spawnTimer = 2;
  }

  // Timer order; yang hangus memutus combo.
  const expired = tickOrders(state, dt);
  for (const order of expired) {
    state.expired += 1;
    breakCombo(state);
    showToast(state, `Order ${order.recipe.name} hangus — pelanggan pulang`, 2.5);
    sfx.error();
  }

  // Wajan.
  const wokEvent = wokTick(state.wok, dt);
  if (wokEvent === 'done') {
    sfx.done();
    showToast(state, `${state.wok.recipe.name} matang — angkat sebelum gosong!`, 2);
  } else if (wokEvent === 'burnt') {
    state.burnt += 1;
    breakCombo(state);
    sfx.burnt();
    showToast(state, 'Gosong! Klik wajan untuk buang', 2.5);
  }
  sizzle(state.wok.cooking && !state.wok.done);

  // Malam berakhir.
  if (state.clockMin >= NIGHT_MINUTES) {
    state.phase = 'night';
    sizzle(false);
    sfx.nightEnd();
  }
}

function zoneAt(state, x, y) {
  for (let i = state.hitZones.length - 1; i >= 0; i -= 1) {
    const z = state.hitZones[i];
    if (x >= z.x && x <= z.x + z.w && y >= z.y && y <= z.y + z.h) return z;
  }
  return null;
}

export function handleClick(state, x, y) {
  if (state.showRecipes) {
    state.showRecipes = false;
    return;
  }
  if (state.phase === 'night') {
    const z = zoneAt(state, x, y);
    if (z && z.kind === 'restart') restart(state);
    return;
  }
  if (!state.started) {
    state.started = true;
    spawnOrder(state);
    spawnOrder(state);
    sfx.click();
    return;
  }
  const z = zoneAt(state, x, y);
  if (!z) return;
  switch (z.kind) {
    case 'ingredient': {
      const res = counterClick(state, z.data);
      if (res.ok) {
        if (INGREDIENTS.find((i) => i.id === z.data).chop) sfx.chop();
        else sfx.add();
        if (res.reason) showToast(state, res.reason, 1.5);
      } else {
        sfx.error();
        showToast(state, res.reason, 1.8);
      }
      break;
    }
    case 'board': {
      const res = boardClick(state);
      if (res === 'chopping') sfx.chop();
      else if (res === 'chopped') {
        sfx.add();
        showToast(state, 'Bahan cincang masuk wajan', 1.2);
      }
      break;
    }
    case 'cook': {
      const recipe = wokStartCooking(state.wok);
      if (recipe) {
        sfx.cookStart();
        showToast(state, `Memasak ${recipe.name} (${recipe.cook} dtk)`, 1.5);
      } else {
        sfx.error();
        showToast(state, state.wok.items.length === 0 ? 'Wajan kosong' : 'Resep belum lengkap / bukan resep', 1.8);
      }
      break;
    }
    case 'dump': {
      if (wokDump(state.wok)) {
        sfx.error();
        showToast(state, 'Isi wajan dibuang', 1.2);
      }
      break;
    }
    case 'wok': {
      if (state.wok.burnt) {
        wokDump(state.wok);
        showToast(state, 'Wajan gosong dibersihkan', 1.2);
      } else if (state.wok.done) {
        if (state.plate.recipe) {
          sfx.error();
          showToast(state, 'Piring masih terisi — antar dulu', 1.8);
        } else {
          const recipe = wokTakeDish(state.wok);
          if (recipe && plateDish(state, recipe)) {
            sfx.done();
            showToast(state, `${recipe.name} di piring — klik order untuk antar`, 1.8);
          }
        }
      }
      break;
    }
    case 'order': {
      const res = serveOrder(state, z.data);
      if (res.ok) {
        sfx.serve();
      } else {
        sfx.error();
        showToast(state, res.reason, 1.8);
      }
      break;
    }
    case 'plate':
      // Piring hanya info; antar lewat kartu order.
      break;
    case 'recipes':
      state.showRecipes = true;
      sfx.click();
      break;
    default:
      break;
  }
}

export function handleHotkey(state, key) {
  if (state.phase === 'night') {
    if (key === 'restart') restart(state);
    return;
  }
  if (typeof key === 'number') {
    if (!state.started) {
      state.started = true;
      spawnOrder(state);
      spawnOrder(state);
    }
    const ing = INGREDIENTS[key];
    if (ing) handleClick(state, ...ingredientCenter(state, ing.id));
    return;
  }
  if (key === 'cook') {
    const recipe = wokStartCooking(state.wok);
    if (recipe) sfx.cookStart();
  }
  if (key === 'mute') {
    state.muted = toggleMute();
    showToast(state, state.muted ? 'Suara mati [M]' : 'Suara nyala [M]', 1.2);
  }
  if (key === 'recipes') {
    state.showRecipes = !state.showRecipes;
  }
}

function ingredientCenter(state, id) {
  const z = state.hitZones.find((zone) => zone.kind === 'ingredient' && zone.data === id);
  if (!z) return [0, 0];
  return [z.x + z.w / 2, z.y + z.h / 2];
}

export function restart(state) {
  const fresh = createGame(state.seed + 1);
  Object.assign(state, fresh);
  state.started = true;
  spawnOrder(state);
  spawnOrder(state);
}

export function startGame() {
  const params = new URLSearchParams(window.location.search);
  const canvas = document.getElementById('game');
  canvas.width = VIEW_W;
  canvas.height = VIEW_H;
  const ctx = canvas.getContext('2d');
  const seed = Number(params.get('seed') ?? SEED_DEFAULT) || SEED_DEFAULT;
  const state = createGame(seed);

  const game = {
    state,
    handleClick: (x, y) => handleClick(state, x, y),
    handleHotkey: (key) => handleHotkey(state, key),
  };
  attachInput(canvas, game);

  // Mode screenshot: stage scene deterministik, lalu gambar sekali.
  const shot = params.get('shot');
  if (shot) {
    stageShot(shot, state);
    drawGame(ctx, state);
    document.title = `DAPUR TUTUP 23:00 — ${shot}`;
    window.__shotReady = true;
    window.__game = { state, tick, handleClick, draw: () => drawGame(ctx, state) };
    return state;
  }

  // Hook baca-saja untuk pengetesan di browser (tanpa network / eval).
  window.__game = { state, tick, handleClick, draw: () => drawGame(ctx, state) };

  // ?book=1: buka buku resep langsung (untuk screenshot pengetesan).
  if (params.get('book') === '1') {
    state.started = true;
    state.showRecipes = true;
    drawGame(ctx, state);
    window.__shotReady = true;
    return state;
  }

  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    tick(state, dt);
    drawGame(ctx, state);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  return state;
}

if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', startGame);
}
