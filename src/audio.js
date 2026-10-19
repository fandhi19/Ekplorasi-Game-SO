// ============================================
// SISTEM AUDIO — BGM + Sound Effects
// ============================================

let bgm = null;
let bgmStarted = false;
let bgmVolume = 0.5;

export function initBGM(src) {
  if (bgm) return;
  bgm = new Audio(src);
  bgm.loop = true;
  bgm.volume = bgmVolume;
  bgm.preload = "auto";

  tryPlayBGM();
}

function tryPlayBGM() {
  if (!bgm || bgmStarted) return;
  const p = bgm.play();
  if (p && p.then) {
    p.then(() => {
      bgmStarted = true;
    }).catch(() => {});
  } else {
    bgmStarted = true;
  }
}

export function setBGMVolume(v) {
  bgmVolume = Math.max(0, Math.min(1, v));
  if (bgm) bgm.volume = bgmVolume;
}

export function getBGMVolume() {
  return bgmVolume;
}

export function muteBGM() {
  if (bgm) bgm.muted = true;
}

export function unmuteBGM() {
  if (bgm) bgm.muted = false;
}

export function toggleMuteBGM() {
  if (!bgm) return false;
  bgm.muted = !bgm.muted;
  return bgm.muted;
}

export function isBGMMuted() {
  return bgm ? bgm.muted : false;
}

export function pauseBGM() {
  if (bgm && !bgm.paused) bgm.pause();
}

export function resumeBGM() {
  if (bgm && bgm.paused) bgm.play().catch(() => {});
}

export function isBGMPlaying() {
  return bgm && !bgm.paused && bgmStarted;
}

// ============================================
// SOUND EFFECTS — Procedural (no files needed)
// ============================================

let audioCtx = null;

function getAudioCtx() {
  if (!audioCtx) {
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      console.warn("AudioContext tidak didukung");
      return null;
    }
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

// ⚡ Paksa aktifkan AudioContext saat user klik pertama kali
export function initAudioContext() {
  const ctx = getAudioCtx();
  if (!ctx) return null;

  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, ctx.currentTime);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.01);
  } catch (e) {}

  return ctx;
}

function playTone(freq, duration, type = "sine", volume = 0.3) {
  try {
    const ctx = getAudioCtx();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);

    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  } catch (e) {}
}

export function playFootstep() {
  try {
    const ctx = getAudioCtx();
    if (!ctx) return;

    const now = ctx.currentTime;

    // ===== Layer 1: Thud rendah (bass) =====
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";

    const baseFreq = 200 + Math.random() * 40;
    osc1.frequency.setValueAtTime(baseFreq, now);
    osc1.frequency.exponentialRampToValueAtTime(baseFreq * 0.5, now + 0.1);

    gain1.gain.setValueAtTime(0.4, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.12);

    // ===== Layer 2: Click tinggi (biar kedengaran di speaker kecil) =====
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "triangle";

    osc2.frequency.setValueAtTime(1200, now);
    osc2.frequency.exponentialRampToValueAtTime(400, now + 0.05);

    gain2.gain.setValueAtTime(0.12, now);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now);
    osc2.stop(now + 0.08);
  } catch (e) {}
}

export function playDing() {
  playTone(880, 0.5, "sine", 0.35);
  setTimeout(() => playTone(1320, 0.4, "sine", 0.2), 60);
  setTimeout(() => playTone(1760, 0.3, "sine", 0.1), 120);
}

export function playKaching() {
  playTone(1200, 0.08, "square", 0.25);
  setTimeout(() => playTone(1600, 0.25, "square", 0.22), 60);
}

export function playBeep() {
  playTone(650, 0.06, "square", 0.15);
}

export function playLocked() {
  playTone(180, 0.15, "sawtooth", 0.2);
  setTimeout(() => playTone(140, 0.2, "sawtooth", 0.2), 100);
}

export function playVictory() {
  const notes = [523, 659, 784, 1047];
  notes.forEach((freq, i) => {
    setTimeout(() => playTone(freq, 0.4, "sine", 0.3), i * 100);
  });
}
