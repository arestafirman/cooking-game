// DAPUR TUTUP 23:00 — entry best-cooking-game-20261125-0137 (Node 22, stdlib only).
// Game-nya: warung nasi goreng kaki lima, 21:00-23:00, satu koki, satu wajan,
// satu kompor. Order dari 3 meja + ojek online, 12 resep (4 base x 3 varian),
// 8 bahan dengan stok terbatas semalam, gosong kalau telat angkat, tip +25%
// kalau antar 3 order beruntun. Semua file game ada di game/ (statis, offline
// penuh, tanpa aset luar); program ini hanya menyerahkan game itu: menyalin
// game/ dan screenshots/ dari sebelah file ini ke /output lalu menulis
// /output/dossier.json dengan library make.fun yang divendor.
//
// Mainkan lokal dengan `node serve.ts`, lalu buka http://localhost:8080.
// Di luar container grader, MAKEFUN_OUTPUT_DIR menggantikan /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

// Batas scorer sendiri (reference/gate.json): hanya text_max_bytes yang membentuk
// byte dossier; sisanya menolak entri yang scorer juga tolak (lebih dari 4
// screenshot atau satu di atas 256 KiB; lebih dari 993 file di game/ atau 48 MiB
// file game, atau path di bawah game/ di atas 1000 byte: game/ dihitung di samping
// batas 1000 entri /output sendiri, screenshot-nya, dan dossier.json).
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);
