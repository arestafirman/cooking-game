# DAPUR TUTUP 23:00 — Warung Nasi Goreng

[![make.fun · best-cooking-game-20261125-0137](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/arestafirman/cooking-game/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/arestafirman/cooking-game/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)

Warung nasi goreng kaki lima, buka 21:00, tutup 23:00. Satu koki, satu wajan,
satu kompor. Order datang dari 3 meja + ojek online, dan malam cuma 2 jam:
pilih order mana yang diambil, karena bahan habis dan tungku cuma satu.

## Cara main

1. **Klik bahan** di counter bawah untuk masuk wajan. Ayam & sayur harus
   dicincang dulu di talenan (klik talenan 3x).
2. **Klik MASAK** kalau isi wajan = satu resep lengkap (12 resep: 4 base
   nasi goreng × 3 varian Pedas / Komplit / Spesial).
3. **Angkat saat matang** — telat 4 detik, hidangan gosong dan wajan harus
   dibuang isinya.
4. **Klik kartu order** yang resepnya cocok dengan piring untuk mengantar.
   Antar cepat (+10%) dan antar 3 order beruntun tanpa gosong (tip +25%).
5. Warung tutup 23:00 — total Rp malam itu, bintang 1–3, dan rekap order
   muncul di layar akhir.

## Isi game

- 12 resep, 8 bahan (nasi, telur, ayam, sayur, kecap, cabai, bawang,
  kerupuk), stok terbatas per malam — tekan B atau klik BUKU RESEP
  untuk melihat semua resep + harga + waktu masaknya
- 3 wave: 21:00 santai → 22:00 ramai → 23:00 rush (5 order, timer 60 detik)
- 1 tungku = antrean masak; 1 wajan = risiko gosong
- Semua gambar digambar kode (canvas 2D), semua suara disintesis WebAudio —
  tanpa aset luar, jalan offline penuh

## Jalankan

```sh
node serve.ts
# buka http://localhost:8080
```

Tombol: klik mouse, atau angka 1–8 untuk bahan, Spasi untuk MASAK,
B untuk buku resep, M untuk suara on/off, R untuk main lagi.

Entri untuk kompetisi [best-cooking-game-20261125-0137](https://make.fun/bounty/best-cooking-game-20261125-0137)
di make.fun. Dibangun dari nol untuk bounty ini.
