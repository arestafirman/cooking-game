// input.js — klik mouse + keyboard. Semua klik dipetakan ke zona yang
// dihitung render.js tiap frame (hitZones): tile bahan, talenan, wajan,
// tombol MASAK, tombol BUANG, piring, kartu order, tombol mulai ulang.

export function attachInput(canvas, game) {
  canvas.addEventListener('click', (event) => {
    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) * (canvas.width / rect.width);
    const y = (event.clientY - rect.top) * (canvas.height / rect.height);
    game.handleClick(x, y);
  });

  window.addEventListener('keydown', (event) => {
    if (event.repeat) return;
    const key = event.key.toLowerCase();
    if (key >= '1' && key <= '8') {
      game.handleHotkey(Number(key) - 1);
    } else if (key === ' ' || key === 'enter') {
      event.preventDefault();
      game.handleHotkey('cook');
    } else if (key === 'r') {
      game.handleHotkey('restart');
    } else if (key === 'm') {
      game.handleHotkey('mute');
    } else if (key === 'b') {
      game.handleHotkey('recipes');
    }
  });
}
