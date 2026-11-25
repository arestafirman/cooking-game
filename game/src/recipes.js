// recipes.js — 12 resep warung "DAPUR TUTUP 23:00": 4 base nasi goreng x 3 varian.
// Setiap resep = daftar bahan yang harus masuk wajan, persis, tanpa urutan.
// Harga dalam rupiah; varian menaikkan harga dan waktu masak.

export const INGREDIENTS = [
  { id: 'nasi',    name: 'Nasi',    color: '#f5eeda', dark: '#d9cba6', stock: 24, chop: false, price: 0 },
  { id: 'telur',   name: 'Telur',   color: '#ffd94d', dark: '#e0a92e', stock: 14, chop: false, price: 0 },
  { id: 'ayam',    name: 'Ayam',    color: '#c98a4b', dark: '#8f5a26', stock: 10, chop: true,  price: 0 },
  { id: 'sayur',   name: 'Sayur',   color: '#58b368', dark: '#2f7d3d', stock: 10, chop: true,  price: 0 },
  { id: 'kecap',   name: 'Kecap',   color: '#5b3a29', dark: '#3a2418', stock: 12, chop: false, price: 0 },
  { id: 'cabai',   name: 'Cabai',   color: '#e23b2e', dark: '#a31f16', stock: 10, chop: false, price: 0 },
  { id: 'bawang',  name: 'Bawang',  color: '#f2c14e', dark: '#c78f1d', stock: 12, chop: false, price: 0 },
  { id: 'kerupuk', name: 'Kerupuk', color: '#f7c98b', dark: '#d99a4e', stock: 8,  chop: false, price: 0 },
];

export const ING_BY_ID = Object.fromEntries(INGREDIENTS.map((ing) => [ing.id, ing]));

// 4 base x 3 varian = 12 resep. Varian: Biasa (base saja), Pedas (+cabai),
// Komplit (+kerupuk), Spesial (+ayam, kecuali base ayam -> +telur).
const BASES = [
  { id: 'nasgor',   name: 'Nasi Goreng',       items: ['nasi', 'telur', 'kecap'],  price: 13000, cook: 8 },
  { id: 'ayamgep',  name: 'Nasi Ayam Geprek',  items: ['nasi', 'ayam', 'cabai'],   price: 16000, cook: 10 },
  { id: 'nassayur', name: 'Nasi Sayur Tumis',  items: ['nasi', 'sayur', 'bawang'], price: 12000, cook: 8 },
  { id: 'nasdadar', name: 'Nasi Telur Dadar',  items: ['nasi', 'telur', 'bawang'], price: 11000, cook: 8 },
];

const VARIANTS = [
  { suffix: ' Pedas',   extra: ['cabai'],   priceAdd: 3000, cookAdd: 2 },
  { suffix: ' Komplit', extra: ['kerupuk'], priceAdd: 4000, cookAdd: 1 },
  { suffix: ' Spesial', extra: ['ayam'],    priceAdd: 5000, cookAdd: 2 },
];

export const RECIPES = [];
for (const base of BASES) {
  for (const variant of VARIANTS) {
    // Varian Spesial pada base ayam geprek menambah telur, bukan ayam kedua;
    // varian Pedas pada base yang sudah pedas menambah bawang, bukan cabai kedua.
    const extra = base.id === 'ayamgep' && variant.suffix === ' Spesial' ? ['telur']
      : base.id === 'ayamgep' && variant.suffix === ' Pedas' ? ['bawang']
      : variant.extra;
    const items = [...base.items, ...extra].sort();
    RECIPES.push({
      id: `${base.id}${variant.suffix ? variant.suffix.toLowerCase().replace(' ', '-') : ''}`,
      name: base.name + variant.suffix,
      items,
      price: base.price + variant.priceAdd,
      cook: base.cook + variant.cookAdd,
    });
  }
}

export function recipeById(id) {
  return RECIPES.find((r) => r.id === id) ?? null;
}

/** Resep yang persis cocok dengan isi wajan (urutan bebas), atau null. */
export function matchRecipe(items) {
  const sorted = [...items].sort().join(',');
  return RECIPES.find((r) => r.items.join(',') === sorted) ?? null;
}

/** Apakah isi wajan masih bisa menjadi awal dari suatu resep (prefix valid). */
export function isPartialMatch(items) {
  const sorted = [...items].sort();
  return RECIPES.some((r) => sorted.every((ing, i) => r.items[i] === ing) && r.items.length > sorted.length);
}

/** RNG deterministik (mulberry32) supaya staging screenshot selalu sama. */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function pickRecipe(rng) {
  return RECIPES[Math.floor(rng() * RECIPES.length)];
}

export function formatRp(n) {
  return 'Rp ' + n.toLocaleString('id-ID');
}
