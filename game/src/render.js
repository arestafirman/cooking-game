// render.js — semua gambar digambar kode di canvas 2D (1280x800), tanpa aset
// luar: dapur warung, wajan berasap, bahan vektor, papan order, meja, dan
// layar akhir malam. Tiap frame juga membangun hitZones untuk input.js.

import { INGREDIENTS, ING_BY_ID, RECIPES, formatRp } from './recipes.js';
import { orderTimerColor } from './orders.js';
import { nightStars } from './serve.js';

export const VIEW_W = 1280;
export const VIEW_H = 800;

// Zona klik, dibangun ulang tiap frame oleh drawGame.
export function drawGame(ctx, state) {
  state.hitZones = [];
  drawBackground(ctx);
  drawTopBar(ctx, state);
  drawOrderBoard(ctx, state);
  drawKitchen(ctx, state);
  drawTables(ctx, state);
  drawCounter(ctx, state);
  drawHints(ctx, state);
  drawToast(ctx, state);
  if (state.showRecipes) drawRecipeBook(ctx, state);
  if (state.phase === 'night') drawNightScreen(ctx, state);
  if (state.started === false) drawStartHint(ctx, state);
}

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function zone(state, x, y, w, h, kind, data) {
  state.hitZones.push({ x, y, w, h, kind, data });
}

function text(ctx, s, x, y, size, color, weight = 'bold', align = 'left') {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px "Segoe UI", Arial, sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(s, x, y);
}

// ---------- latar ----------

function drawBackground(ctx) {
  const g = ctx.createLinearGradient(0, 0, 0, VIEW_H);
  g.addColorStop(0, '#2b1a12');
  g.addColorStop(1, '#1d110b');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  // Dinding bata samar.
  ctx.fillStyle = 'rgba(255,255,255,0.03)';
  for (let y = 80; y < 640; y += 46) {
    for (let x = (y / 46) % 2 === 0 ? 0 : 40; x < VIEW_W; x += 80) {
      ctx.fillRect(x, y, 76, 20);
    }
  }
}

function clockLabel(clockMin) {
  const total = 21 * 60 + Math.floor(clockMin);
  const hh = Math.floor(total / 60);
  const mm = total % 60;
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

function drawTopBar(ctx, state) {
  ctx.fillStyle = '#3d2318';
  ctx.fillRect(0, 0, VIEW_W, 64);
  ctx.fillStyle = '#f2b705';
  ctx.fillRect(0, 64, VIEW_W, 4);
  text(ctx, 'DAPUR TUTUP 23:00', 16, 34, 26, '#ffd94d');
  text(ctx, 'warung nasi goreng · 1 koki · 1 wajan', 300, 36, 14, '#d9a05b', 'normal');
  const remainSec = Math.max(0, Math.round((120 - state.clockMin) * 60));
  const hh = Math.floor(remainSec / 3600);
  const mm = Math.floor((remainSec % 3600) / 60);
  const ss = remainSec % 60;
  const urgent = remainSec < 600;
  text(ctx, `TUTUP ${hh}:${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`, 640, 34, 26, urgent ? '#ff5a4d' : '#ffffff', 'bold', 'center');
  text(ctx, clockLabel(state.clockMin), 640, 56, 12, '#d9a05b', 'normal', 'center');
  text(ctx, formatRp(state.money), 1264, 30, 28, '#ffffff', 'bold', 'right');
  const comboTxt = state.combo >= 2 ? `COMBO x${state.combo} · TIP +25%` : `COMBO x${state.combo}`;
  text(ctx, comboTxt, 1264, 54, 13, state.combo >= 3 ? '#7dff8a' : '#d9a05b', 'bold', 'right');
  text(ctx, state.waveLabel, 430, 56, 12, '#ffd94d', 'bold');
}

// ---------- papan order ----------

function drawOrderBoard(ctx, state) {
  ctx.fillStyle = '#241610';
  rr(ctx, 8, 76, 288, 556, 12);
  ctx.fill();
  ctx.strokeStyle = '#5b3a29';
  ctx.lineWidth = 2;
  ctx.stroke();
  text(ctx, 'ORDER MASUK', 152, 100, 18, '#ffd94d', 'bold', 'center');
  text(ctx, `${state.orders.length}/5 aktif`, 152, 122, 12, '#d9a05b', 'normal', 'center');
  let y = 136;
  for (const order of state.orders) {
    drawOrderCard(ctx, state, order, 20, y, 264, 92);
    y += 100;
  }
  if (state.orders.length === 0) {
    text(ctx, 'Belum ada order…', 152, 200, 15, '#d9a05b', 'normal', 'center');
  }
}

function drawOrderCard(ctx, state, order, x, y, w, h) {
  const flash = order.flash > 0 && Math.floor(state.time * 8) % 2 === 0;
  const matchesPlate = state.plate.recipe && state.plate.recipe.id === order.recipe.id;
  ctx.fillStyle = flash ? '#5b1f1a' : matchesPlate ? '#2f4d2a' : '#3a2418';
  rr(ctx, x, y, w, h, 10);
  ctx.fill();
  ctx.strokeStyle = matchesPlate ? '#7dff8a' : orderTimerColor(order);
  ctx.lineWidth = matchesPlate ? 3 : 2;
  ctx.stroke();
  if (matchesPlate) {
    ctx.fillStyle = '#7dff8a';
    rr(ctx, x + w - 76, y + 8, 64, 18, 9);
    ctx.fill();
    text(ctx, 'ANTAR!', x + w - 44, y + 18, 11, '#1d3a1a', 'bold', 'center');
  }
  text(ctx, order.table.label, x + 12, y + 16, 12, '#ffd94d');
  text(ctx, formatRp(order.recipe.price), matchesPlate ? x + w - 84 : x + w - 12, y + 16, 15, '#ffffff', 'bold', 'right');
  text(ctx, order.recipe.name, x + 12, y + 38, 16, '#ffffff');
  // Ikon bahan resep.
  let ix = x + 14;
  for (const ing of order.recipe.items) {
    drawIngredient(ctx, ing, ix + 11, y + 66, 11);
    ix += 26;
  }
  // Timer.
  const frac = Math.max(0, order.timeLeft / order.total);
  ctx.fillStyle = '#1d110b';
  rr(ctx, x + 12, y + h - 16, w - 24, 8, 4);
  ctx.fill();
  ctx.fillStyle = orderTimerColor(order);
  rr(ctx, x + 12, y + h - 16, (w - 24) * frac, 8, 4);
  ctx.fill();
  const t = Math.max(0, Math.ceil(order.timeLeft));
  text(ctx, `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`, x + w - 12, y + h - 24, 12, orderTimerColor(order), 'bold', 'right');
  zone(state, x, y, w, h, 'order', order.id);
}

// ---------- dapur tengah ----------

function drawKitchen(ctx, state) {
  // Meja kerja.
  ctx.fillStyle = '#4a2c1a';
  rr(ctx, 304, 76, 672, 556, 12);
  ctx.fill();
  ctx.fillStyle = '#5d3a22';
  ctx.fillRect(304, 76, 672, 10);

  drawBoard(ctx, state);
  drawWok(ctx, state);
  drawCookButtons(ctx, state);
  drawPlate(ctx, state);
}

function drawBoard(ctx, state) {
  const x = 322, y = 120, w = 180, h = 120;
  ctx.fillStyle = '#c98a4b';
  rr(ctx, x, y, w, h, 10);
  ctx.fill();
  ctx.strokeStyle = '#8f5a26';
  ctx.lineWidth = 3;
  ctx.stroke();
  text(ctx, 'TALENAN', x + w / 2, y + 18, 13, '#3a2418', 'bold', 'center');
  if (state.board.item) {
    drawIngredient(ctx, state.board.item, x + w / 2, y + 58, 26);
    const frac = state.board.chops / 3;
    ctx.fillStyle = '#1d110b';
    rr(ctx, x + 16, y + h - 22, w - 32, 10, 5);
    ctx.fill();
    ctx.fillStyle = '#58b368';
    rr(ctx, x + 16, y + h - 22, (w - 32) * frac, 10, 5);
    ctx.fill();
    text(ctx, `cincang ${state.board.chops}/3 — klik talenan`, x + w / 2, y + h + 16, 12, '#ffd94d', 'bold', 'center');
  } else {
    text(ctx, 'ayam & sayur', x + w / 2, y + 56, 13, '#6b4423', 'normal', 'center');
    text(ctx, 'dicincang di sini', x + w / 2, y + 76, 13, '#6b4423', 'normal', 'center');
  }
  zone(state, x, y, w, h, 'board', null);
}

function drawWok(ctx, state) {
  const cx = 640, cy = 300;
  const wok = state.wok;
  // Kompor.
  ctx.fillStyle = '#222';
  rr(ctx, cx - 130, cy + 78, 260, 26, 8);
  ctx.fill();
  // Api saat memasak.
  if (wok.cooking && !wok.done) {
    const flick = Math.sin(state.time * 9) * 6;
    ctx.fillStyle = '#ff7b2e';
    ctx.beginPath();
    ctx.moveTo(cx - 70, cy + 78);
    ctx.quadraticCurveTo(cx - 40, cy + 30 + flick, cx, cy + 62);
    ctx.quadraticCurveTo(cx + 40, cy + 30 + flick, cx + 70, cy + 78);
    ctx.closePath();
    ctx.fill();
  }
  // Wajan.
  ctx.fillStyle = wok.burnt ? '#1a1a1a' : '#33333c';
  ctx.beginPath();
  ctx.ellipse(cx, cy + 40, 130, 52, 0, 0, Math.PI * 2);
  ctx.fill();
  const inner = ctx.createRadialGradient(cx, cy + 28, 10, cx, cy + 28, 130);
  inner.addColorStop(0, wok.burnt ? '#241a12' : '#4a4030');
  inner.addColorStop(1, wok.burnt ? '#2a2a2a' : '#5d5340');
  ctx.fillStyle = inner;
  ctx.beginPath();
  ctx.ellipse(cx, cy + 30, 130, 48, 0, Math.PI, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#77777f';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(cx, cy + 30, 130, 48, 0, Math.PI, Math.PI * 2);
  ctx.stroke();
  // Isi wajan.
  if (wok.items.length > 0) {
    let ix = cx - (wok.items.length - 1) * 26;
    for (const ing of wok.items) {
      drawIngredient(ctx, ing, ix, cy + 26, 20);
      ix += 52;
    }
  }
  if (wok.burnt) {
    text(ctx, 'GOSONG!', cx, cy - 8, 22, '#ff5a4d', 'bold', 'center');
    text(ctx, 'klik wajan untuk buang', cx, cy + 14, 12, '#ffffff', 'normal', 'center');
  } else if (wok.done) {
    const blink = Math.floor(state.time * 3) % 2 === 0;
    text(ctx, 'MATANG — ANGKAT!', cx, cy - 8, 20, blink ? '#7dff8a' : '#ffffff', 'bold', 'center');
    text(ctx, `gosong dalam ${Math.max(0, 4 - wok.burnTimer).toFixed(0)} dtk`, cx, cy + 14, 12, '#ff9a8a', 'bold', 'center');
  } else if (wok.cooking) {
    text(ctx, wok.recipe ? wok.recipe.name : 'Memasak…', cx, cy - 52, 16, '#ffd94d', 'bold', 'center');
    ctx.fillStyle = '#1d110b';
    rr(ctx, cx - 90, cy - 40, 180, 12, 6);
    ctx.fill();
    ctx.fillStyle = '#f2b705';
    rr(ctx, cx - 90, cy - 40, 180 * wok.progress, 12, 6);
    ctx.fill();
  } else if (wok.items.length > 0) {
    const recipe = wok.recipe;
    if (wok.invalid) text(ctx, 'Bukan resep! Buang isinya', cx, cy - 8, 14, '#ff5a4d', 'bold', 'center');
    else text(ctx, 'klik MASAK bila resep lengkap', cx, cy - 8, 13, '#d9a05b', 'normal', 'center');
  } else {
    text(ctx, 'WAJAN KOSONG', cx, cy - 62, 14, '#d9a05b', 'bold', 'center');
    text(ctx, 'klik bahan di bawah', cx, cy - 40, 12, '#d9a05b', 'normal', 'center');
  }
  // Asap saat memasak / matang.
  if (wok.cooking || wok.done) {
    ctx.fillStyle = 'rgba(220,220,220,0.35)';
    for (let i = 0; i < 5; i += 1) {
      const ph = (state.time * 0.5 + i * 0.2) % 1;
      const sx = cx - 50 + i * 25 + Math.sin((state.time + i) * 2) * 8;
      const sy = cy - 20 - ph * 90;
      ctx.beginPath();
      ctx.arc(sx, sy, 10 + ph * 14, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  text(ctx, 'KOMPOR 1 TUNGKU', cx, cy + 118, 12, '#d9a05b', 'bold', 'center');
  zone(state, cx - 130, cy - 30, 260, 140, 'wok', null);
}

function drawCookButtons(ctx, state) {
  const wok = state.wok;
  const canCook = !wok.cooking && wok.items.length > 0 && !wok.invalid;
  const bx = 800, by = 150;
  // Tombol buku resep.
  ctx.fillStyle = '#6b4423';
  rr(ctx, 800, 96, 150, 40, 10);
  ctx.fill();
  ctx.strokeStyle = '#c98a4b';
  ctx.lineWidth = 2;
  ctx.stroke();
  text(ctx, 'BUKU RESEP [B]', 875, 117, 14, '#ffd94d', 'bold', 'center');
  zone(state, 800, 96, 150, 40, 'recipes', null);
  ctx.fillStyle = canCook ? '#e23b2e' : '#5b3a29';
  rr(ctx, bx, by, 150, 56, 12);
  ctx.fill();
  text(ctx, 'MASAK', bx + 75, by + 30, 22, '#ffffff', 'bold', 'center');
  zone(state, bx, by, 150, 56, 'cook', null);
  const dx = 800, dy = 220;
  const canDump = wok.items.length > 0 && !wok.cooking;
  ctx.fillStyle = canDump ? '#8a6a4a' : '#4a3428';
  rr(ctx, dx, dy, 150, 44, 10);
  ctx.fill();
  text(ctx, 'BUANG ISI', dx + 75, dy + 23, 15, '#ffffff', 'bold', 'center');
  zone(state, dx, dy, 150, 44, 'dump', null);
  // Resep yang cocok dengan isi wajan, sebagai petunjuk.
  if (wok.items.length > 0 && !wok.cooking) {
    text(ctx, 'di wajan:', 875, 300, 12, '#d9a05b', 'bold', 'center');
    let iy = 322;
    for (const ing of wok.items) {
      drawIngredient(ctx, ing, 830, iy, 10);
      text(ctx, ING_BY_ID[ing].name, 848, iy, 13, '#ffffff', 'normal');
      iy += 24;
    }
  }
}

function drawPlate(ctx, state) {
  const cx = 640, cy = 520;
  ctx.fillStyle = '#3a2418';
  rr(ctx, cx - 150, cy - 70, 300, 140, 12);
  ctx.fill();
  text(ctx, 'PIRING SAJI', cx, cy - 52, 13, '#ffd94d', 'bold', 'center');
  // Piring.
  ctx.fillStyle = '#f5f0e6';
  ctx.beginPath();
  ctx.ellipse(cx, cy + 10, 95, 34, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#d9d2c2';
  ctx.beginPath();
  ctx.ellipse(cx, cy + 8, 78, 26, 0, 0, Math.PI * 2);
  ctx.fill();
  if (state.plate.recipe) {
    const r = state.plate.recipe;
    // Tumpukan nasi + topping resep.
    ctx.fillStyle = '#f5eeda';
    ctx.beginPath();
    ctx.ellipse(cx, cy + 2, 52, 20, 0, 0, Math.PI * 2);
    ctx.fill();
    let ix = cx - (r.items.length - 1) * 16;
    for (const ing of r.items) {
      if (ing !== 'nasi') drawIngredient(ctx, ing, ix, cy - 6, 12);
      ix += 32;
    }
    text(ctx, r.name, cx, cy + 52, 15, '#ffffff', 'bold', 'center');
    text(ctx, 'klik order yang cocok untuk antar', cx, cy + 70, 12, '#7dff8a', 'normal', 'center');
  } else {
    text(ctx, 'kosong', cx, cy + 6, 14, '#8a6a4a', 'normal', 'center');
  }
  zone(state, cx - 150, cy - 70, 300, 140, 'plate', null);
}

// ---------- meja & ojek ----------

function drawTables(ctx, state) {
  ctx.fillStyle = '#241610';
  rr(ctx, 984, 76, 288, 556, 12);
  ctx.fill();
  ctx.strokeStyle = '#5b3a29';
  ctx.lineWidth = 2;
  ctx.stroke();
  text(ctx, 'MEJA & ANTAR', 1128, 100, 18, '#ffd94d', 'bold', 'center');
  const rows = [
    { label: 'MEJA 1', desc: 'pasangan, pesan nasgor' },
    { label: 'MEJA 2', desc: 'keluarga, pesan 2 porsi' },
    { label: 'MEJA 3', desc: 'sendiri, lapar berat' },
    { label: 'OJEK ONLINE', desc: 'antar cepat = bonus 10%' },
  ];
  let y = 130;
  for (const row of rows) {
    const hasOrder = state.orders.some((o) => o.table.label === row.label);
    ctx.fillStyle = hasOrder ? '#3a2418' : '#2b1a12';
    rr(ctx, 996, y, 264, 96, 10);
    ctx.fill();
    // Meja bundar kecil.
    ctx.fillStyle = '#6b4423';
    ctx.beginPath();
    ctx.arc(1036, y + 48, 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#c98a4b';
    ctx.beginPath();
    ctx.arc(1036, y + 48, 20, 0, Math.PI * 2);
    ctx.fill();
    text(ctx, row.label, 1072, y + 34, 15, '#ffffff');
    text(ctx, row.desc, 1072, y + 58, 12, '#d9a05b', 'normal');
    if (hasOrder) text(ctx, 'MENUNGGU', 1248, y + 34, 12, '#ff9a8a', 'bold', 'right');
    y += 106;
  }
  text(ctx, 'Antar 3x beruntun = TIP +25%', 1128, 566, 13, '#7dff8a', 'bold', 'center');
  text(ctx, `Selesai: ${state.served} · Gosong: ${state.burnt} · Hangus: ${state.expired}`, 1128, 592, 12, '#d9a05b', 'normal', 'center');
  text(ctx, '12 resep · 8 bahan · 1 tungku · 3 wave', 1128, 614, 12, '#8a6a4a', 'normal', 'center');
}

// ---------- counter bahan ----------

function drawCounter(ctx, state) {
  ctx.fillStyle = '#241610';
  rr(ctx, 8, 640, 1264, 152, 12);
  ctx.fill();
  ctx.strokeStyle = '#5b3a29';
  ctx.lineWidth = 2;
  ctx.stroke();
  text(ctx, 'BAHAN — klik untuk masuk wajan (stok semalam terbatas)', 24, 664, 15, '#ffd94d');
  const tileW = 148;
  let x = 16;
  for (let i = 0; i < INGREDIENTS.length; i += 1) {
    const ing = INGREDIENTS[i];
    const stock = state.stock[ing.id];
    const out = stock <= 0;
    const y = 676;
    ctx.fillStyle = out ? '#2b1a12' : '#3a2418';
    rr(ctx, x, y, tileW - 8, 104, 10);
    ctx.fill();
    ctx.strokeStyle = out ? '#4a3428' : ing.color;
    ctx.lineWidth = 2;
    ctx.stroke();
    drawIngredient(ctx, ing.id, x + (tileW - 8) / 2, y + 34, 24);
    text(ctx, ing.name + (ing.chop ? ' ✂' : ''), x + (tileW - 8) / 2, y + 66, 14, out ? '#6b4a3a' : '#ffffff', 'bold', 'center');
    text(ctx, out ? 'HABIS' : `stok ${stock}`, x + (tileW - 8) / 2, y + 88, 12, out ? '#ff5a4d' : '#d9a05b', 'bold', 'center');
    text(ctx, `[${i + 1}]`, x + 10, y + 14, 11, '#8a6a4a', 'normal');
    zone(state, x, y, tileW - 8, 104, 'ingredient', ing.id);
    x += tileW;
  }
}

function drawHints(ctx, state) {
  text(ctx, 'Bahan → cincang → MASAK → angkat → antar. Spasi = MASAK · B = resep · M = suara · R = ulang.', 640, 632 - 8, 12, '#8a6a4a', 'normal', 'center');
}

// ---------- toast & layar ----------

function drawToast(ctx, state) {
  if (state.waveBanner && state.waveBanner.t > 0) {
    const a = Math.min(1, state.waveBanner.t);
    ctx.globalAlpha = a;
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    rr(ctx, 340, 72, 600, 44, 12);
    ctx.fill();
    ctx.strokeStyle = '#f2b705';
    ctx.lineWidth = 2;
    ctx.stroke();
    text(ctx, state.waveBanner.text, 640, 95, 20, '#ffd94d', 'bold', 'center');
    ctx.globalAlpha = 1;
  }
  if (state.toast && state.toast.t > 0) {
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    const w = ctx.measureText(state.toast.text).width + 40;
    rr(ctx, 640 - w / 2, 84, w, 34, 10);
    ctx.fill();
    text(ctx, state.toast.text, 640, 102, 15, '#ffffff', 'bold', 'center');
  }
  if (state.lastServe && state.lastServe.t > 0) {
    const a = Math.min(1, state.lastServe.t);
    ctx.globalAlpha = a;
    text(ctx, state.lastServe.text, 640, 436, 24, '#7dff8a', 'bold', 'center');
    ctx.globalAlpha = 1;
  }
}

function drawStartHint(ctx, state) {
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  rr(ctx, 380, 330, 520, 64, 12);
  ctx.fill();
  text(ctx, 'KLIK DI MANA SAJA UNTUK MULAI MASAK', 640, 352, 20, '#ffd94d', 'bold', 'center');
  text(ctx, 'dapur sudah jalan — order pertama segera datang', 640, 376, 13, '#ffffff', 'normal', 'center');
}

function drawRecipeBook(ctx, state) {
  ctx.fillStyle = 'rgba(10,5,2,0.85)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  const x = 240, y = 80, w = 800, h = 620;
  ctx.fillStyle = '#3a2418';
  rr(ctx, x, y, w, h, 16);
  ctx.fill();
  ctx.strokeStyle = '#f2b705';
  ctx.lineWidth = 3;
  ctx.stroke();
  text(ctx, 'BUKU RESEP — 12 RESEP WARUNG', 640, y + 40, 24, '#ffd94d', 'bold', 'center');
  text(ctx, '4 base nasi goreng × Pedas / Komplit / Spesial · masak di wajan, antar ke order yang cocok', 640, y + 70, 13, '#d9a05b', 'normal', 'center');
  const colW = 380;
  for (let i = 0; i < RECIPES.length; i += 1) {
    const r = RECIPES[i];
    const col = i % 2;
    const row = Math.floor(i / 2);
    const rx = x + 20 + col * (colW + 20);
    const ry = y + 100 + row * 82;
    ctx.fillStyle = '#2b1a12';
    rr(ctx, rx, ry, colW, 72, 10);
    ctx.fill();
    text(ctx, r.name, rx + 12, ry + 20, 15, '#ffffff');
    text(ctx, `${formatRp(r.price)} · ${r.cook} dtk`, rx + colW - 12, ry + 20, 13, '#ffd94d', 'bold', 'right');
    let ix = rx + 24;
    for (const ing of r.items) {
      drawIngredient(ctx, ing, ix, ry + 50, 11);
      ix += 26;
    }
    text(ctx, r.items.map((id) => ING_BY_ID[id].name).join(' + '), rx + 140, ry + 50, 11, '#d9a05b', 'normal');
  }
  text(ctx, 'klik di mana saja / tekan B untuk tutup', 640, y + h - 24, 14, '#ffffff', 'bold', 'center');
}

function drawNightScreen(ctx, state) {
  ctx.fillStyle = 'rgba(10,5,2,0.82)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  const x = 340, y = 130, w = 600, h = 520;
  ctx.fillStyle = '#3a2418';
  rr(ctx, x, y, w, h, 16);
  ctx.fill();
  ctx.strokeStyle = '#f2b705';
  ctx.lineWidth = 3;
  ctx.stroke();
  text(ctx, 'WARUNG TUTUP — 23:00', 640, y + 46, 28, '#ffd94d', 'bold', 'center');
  text(ctx, 'Malam ini di dapur:', 640, y + 84, 15, '#d9a05b', 'normal', 'center');
  text(ctx, formatRp(state.money), 640, y + 140, 44, '#ffffff', 'bold', 'center');
  // Bintang.
  const stars = nightStars(state);
  for (let i = 0; i < 3; i += 1) {
    drawStar(ctx, 640 + (i - 1) * 64, y + 196, 24, i < stars ? '#f2b705' : '#5b3a29');
  }
  text(ctx, `Order selesai: ${state.served}   ·   Gosong: ${state.burnt}   ·   Hangus: ${state.expired}`, 640, y + 250, 16, '#ffffff', 'normal', 'center');
  text(ctx, `Combo terbaik: x${state.bestCombo}`, 640, y + 282, 16, '#7dff8a', 'normal', 'center');
  const verdict = stars === 3 ? 'Warung paling laris malam ini!' : stars === 2 ? 'Dapur lumayan sibuk malam ini.' : stars === 1 ? 'Ada yang lapar, ada yang kecewa.' : 'Wajan dingin, pelanggan pulang.';
  text(ctx, verdict, 640, y + 322, 16, '#ffd94d', 'bold', 'center');
  text(ctx, '12 resep · 8 bahan · 1 tungku · 3 wave', 640, y + 362, 13, '#d9a05b', 'normal', 'center');
  ctx.fillStyle = '#e23b2e';
  rr(ctx, 540, y + 400, 200, 52, 12);
  ctx.fill();
  text(ctx, 'MAIN LAGI [R]', 640, y + 427, 18, '#ffffff', 'bold', 'center');
  zone(state, 540, y + 400, 200, 52, 'restart', null);
}

function drawStar(ctx, cx, cy, r, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < 10; i += 1) {
    const ang = -Math.PI / 2 + (i * Math.PI) / 5;
    const rad = i % 2 === 0 ? r : r * 0.45;
    const px = cx + Math.cos(ang) * rad;
    const py = cy + Math.sin(ang) * rad;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
}

// ---------- ikon bahan (vektor sendiri) ----------

export function drawIngredient(ctx, id, cx, cy, r) {
  ctx.save();
  ctx.translate(cx, cy);
  switch (id) {
    case 'nasi': {
      ctx.fillStyle = '#f5eeda';
      ctx.beginPath();
      ctx.ellipse(0, r * 0.15, r, r * 0.7, 0, Math.PI, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#d9cba6';
      for (let i = -2; i <= 2; i += 1) {
        ctx.beginPath();
        ctx.arc(i * r * 0.32, -r * 0.25 + (i % 2) * r * 0.2, r * 0.09, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case 'telur': {
      ctx.fillStyle = '#fff8e6';
      ctx.beginPath();
      ctx.ellipse(0, 0, r, r * 0.75, 0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffb703';
      ctx.beginPath();
      ctx.arc(r * 0.1, 0, r * 0.45, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#e0a92e';
      ctx.beginPath();
      ctx.arc(r * 0.1, 0, r * 0.22, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'ayam': {
      ctx.fillStyle = '#c98a4b';
      ctx.beginPath();
      ctx.ellipse(-r * 0.15, r * 0.1, r * 0.65, r * 0.5, -0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#8f5a26';
      ctx.beginPath();
      ctx.ellipse(r * 0.35, -r * 0.3, r * 0.4, r * 0.3, 0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#f5eeda';
      ctx.lineWidth = r * 0.14;
      ctx.beginPath();
      ctx.moveTo(r * 0.55, -r * 0.5);
      ctx.lineTo(r * 0.9, -r * 0.85);
      ctx.stroke();
      break;
    }
    case 'sayur': {
      ctx.fillStyle = '#2f7d3d';
      for (let i = -1; i <= 1; i += 1) {
        ctx.beginPath();
        ctx.ellipse(i * r * 0.45, i * r * 0.2, r * 0.5, r * 0.28, i * 0.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#58b368';
      ctx.beginPath();
      ctx.ellipse(0, -r * 0.2, r * 0.45, r * 0.25, -0.3, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'kecap': {
      ctx.fillStyle = '#3a2418';
      rr(ctx, -r * 0.4, -r * 0.5, r * 0.8, r * 1.1, r * 0.2);
      ctx.fill();
      ctx.fillStyle = '#5b3a29';
      ctx.fillRect(-r * 0.22, -r * 0.95, r * 0.44, r * 0.5);
      ctx.fillStyle = '#f2b705';
      ctx.fillRect(-r * 0.4, -r * 0.1, r * 0.8, r * 0.4);
      break;
    }
    case 'cabai': {
      ctx.strokeStyle = '#e23b2e';
      ctx.lineWidth = r * 0.42;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(0, -r * 0.1, r * 0.7, Math.PI * 0.15, Math.PI * 1.05);
      ctx.stroke();
      ctx.strokeStyle = '#2f7d3d';
      ctx.lineWidth = r * 0.18;
      ctx.beginPath();
      ctx.moveTo(-r * 0.55, -r * 0.75);
      ctx.lineTo(-r * 0.8, -r * 1.0);
      ctx.stroke();
      break;
    }
    case 'bawang': {
      ctx.fillStyle = '#e8d8f0';
      ctx.beginPath();
      ctx.arc(0, r * 0.1, r * 0.75, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#b48ec2';
      ctx.lineWidth = r * 0.1;
      ctx.beginPath();
      ctx.arc(0, r * 0.1, r * 0.5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, r * 0.1, r * 0.28, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = '#58b368';
      ctx.lineWidth = r * 0.12;
      ctx.beginPath();
      ctx.moveTo(0, -r * 0.6);
      ctx.lineTo(0, -r * 0.95);
      ctx.stroke();
      break;
    }
    case 'kerupuk': {
      ctx.fillStyle = '#f7c98b';
      ctx.beginPath();
      for (let i = 0; i < 10; i += 1) {
        const ang = (i * Math.PI * 2) / 10;
        const rad = i % 2 === 0 ? r : r * 0.7;
        const px = Math.cos(ang) * rad;
        const py = Math.sin(ang) * rad;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#d99a4e';
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.35, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    default:
      ctx.fillStyle = '#888';
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.6, 0, Math.PI * 2);
      ctx.fill();
  }
  ctx.restore();
}
