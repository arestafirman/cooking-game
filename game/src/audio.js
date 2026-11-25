// audio.js — semua suara disintesis WebAudio sendiri, tanpa file luar.
// Sizzle wajan = noise yang difilter; ding = dua nada sinus; gosong = nada turun.

let ctx = null;
let sizzleNodes = null;
let muted = false;

export function toggleMute() {
  muted = !muted;
  if (muted) sizzle(false);
  return muted;
}

export function isMuted() {
  return muted;
}

function ensureCtx() {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function tone(freq, dur, type, vol, when = 0) {
  if (muted) return;
  const ac = ensureCtx();
  if (!ac) return;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(vol, ac.currentTime + when);
  gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + when + dur);
  osc.connect(gain);
  gain.connect(ac.destination);
  osc.start(ac.currentTime + when);
  osc.stop(ac.currentTime + when + dur + 0.05);
}

export const sfx = {
  click() { tone(660, 0.07, 'triangle', 0.12); },
  chop() { tone(180, 0.08, 'square', 0.15); tone(90, 0.1, 'sine', 0.2); },
  add() { tone(520, 0.08, 'sine', 0.12); tone(780, 0.1, 'sine', 0.1, 0.05); },
  cookStart() { tone(330, 0.15, 'sawtooth', 0.08); tone(495, 0.2, 'sawtooth', 0.06, 0.1); },
  done() { tone(880, 0.12, 'sine', 0.16); tone(1318, 0.25, 'sine', 0.16, 0.1); },
  serve() { tone(1046, 0.1, 'sine', 0.16); tone(1568, 0.3, 'sine', 0.14, 0.08); },
  error() { tone(220, 0.15, 'square', 0.08); },
  burnt() { tone(300, 0.5, 'sawtooth', 0.12); tone(150, 0.7, 'sawtooth', 0.1, 0.15); },
  newOrder() { tone(740, 0.08, 'triangle', 0.1); tone(988, 0.12, 'triangle', 0.1, 0.07); },
  nightEnd() {
    tone(523, 0.2, 'sine', 0.15);
    tone(659, 0.2, 'sine', 0.15, 0.18);
    tone(784, 0.4, 'sine', 0.15, 0.36);
  },
};

/** Desis wajan selama memasak; panggil tiap frame dengan status masak. */
export function sizzle(on) {
  if (muted) on = false;
  const ac = ensureCtx();
  if (!ac) return;
  if (on && !sizzleNodes) {
    const len = ac.sampleRate * 1;
    const buf = ac.createBuffer(1, len, ac.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i += 1) data[i] = Math.random() * 2 - 1;
    const src = ac.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    const filter = ac.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 4200;
    filter.Q.value = 0.6;
    const gain = ac.createGain();
    gain.gain.value = 0.05;
    src.connect(filter);
    filter.connect(gain);
    gain.connect(ac.destination);
    src.start();
    sizzleNodes = { src, gain };
  } else if (!on && sizzleNodes) {
    try { sizzleNodes.src.stop(); } catch { /* sudah berhenti */ }
    sizzleNodes = null;
  }
}
