import { updatePlayer, drawPlayer, player } from "./player.js";
import { updateCamera, camera } from "./camera.js";
import { draw } from "./world.js";
import { updateInteraction, drawInteraction, getOpenClue, dismissOrSkipDialog } from "./interaction.js";
import { drawDialog } from "./ui.js";
import { drawTracker, toggleTracker } from "./tracker.js";
import { loadImage, loadAll } from "./assets.js";
import { getCurrentScene, getCurrentSceneName } from "./scene.js";
import { clues } from "../data/clues.js";
import { entrances } from "../data/scenes.js";
import { updateParticles, drawParticles } from "./particles.js";
import { initBGM, toggleMuteBGM, isBGMMuted, playFootstep, initAudioContext, playBeep } from "./audio.js";
import { setupVirtualControls } from "./input.js";
import { initQuizListeners } from "./quiz.js";


const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

let GAME_W = window.innerWidth;
let GAME_H = window.innerHeight;
let footstepTimer = 0; // ← timer footstep

function resize() {
  GAME_W = window.innerWidth;
  GAME_H = window.innerHeight;
  canvas.width = GAME_W;
  canvas.height = GAME_H;
  ctx.imageSmoothingEnabled = false;
}
window.addEventListener("resize", resize);
window.addEventListener("orientationchange", () => setTimeout(resize, 200));
document.addEventListener("fullscreenchange", () => setTimeout(resize, 150));
document.addEventListener("webkitfullscreenchange", () => setTimeout(resize, 150));

const hint = document.getElementById("hint");
if (hint) {
  setTimeout(() => {
    hint.style.transition = "opacity 1s";
    hint.style.opacity = "0";
  }, 5000);
}

// Kontrol Visibilitas Tombol Virtual saat Dialog Materi Terbuka
let lastDialogState = null;
const dpadEl = document.getElementById("dpad-container");
const actionBtnEl = document.getElementById("actionBtn");

function updateVirtualControlsVisibility(isDialogOpen) {
  if (isDialogOpen === lastDialogState) return;
  lastDialogState = isDialogOpen;

  if (dpadEl) {
    if (isDialogOpen) {
      dpadEl.style.transition = "opacity 0.2s ease, transform 0.2s ease";
      dpadEl.style.opacity = "0";
      dpadEl.style.pointerEvents = "none";
      dpadEl.style.transform = "scale(0.85)";
    } else {
      dpadEl.style.transition = "opacity 0.2s ease, transform 0.2s ease";
      dpadEl.style.opacity = "1";
      dpadEl.style.pointerEvents = "auto";
      dpadEl.style.transform = "scale(1)";
    }
  }

  if (actionBtnEl) {
    const label = actionBtnEl.querySelector(".action-label");
    if (isDialogOpen) {
      actionBtnEl.classList.add("dialog-exit-mode");
      if (label) label.textContent = "KELUAR";
    } else {
      actionBtnEl.classList.remove("dialog-exit-mode");
      if (label) label.textContent = "AKSI";
    }
  }
}

// Ketuk layar (dialog materi HANYA BISA KELUAR LEWAT TOMBOL E)
canvas.addEventListener("pointerdown", (e) => {
  // Jika dialog materi sedang terbuka, sentuhan layar biasa tidak boleh menutup dialog
  if (getOpenClue()) {
    return;
  }
  // Tap pada area badge tracker kanan atas untuk buka/tutup
  if (e.clientY < 60 && e.clientX > GAME_W - 170) {
    toggleTracker();
    playBeep();
  }
});

// DEBUG — ubah ke true kalau mau lihat garis blocker & marker (atau tekan 'B' di keyboard)
window.DEBUG_MODE = false;
window.addEventListener("keydown", (e) => {
  if (e.key.toLowerCase() === "b") {
    window.DEBUG_MODE = !window.DEBUG_MODE;
    console.log("DEBUG_MODE:", window.DEBUG_MODE);
  }
});


// ===== LOADING ASET =====
async function init() {
  // Player
  loadImage("char_depan", "assets/tiles/characters/karakter_depan.png");
  loadImage("char_belakang", "assets/tiles/characters/karakter_belakang.png");
  loadImage("char_kanan", "assets/tiles/characters/karakter_kanan.png");
  loadImage("char_kiri", "assets/tiles/characters/karakter_kiri.png");
  loadImage("walk_bawah", "assets/tiles/characters/jalan_bawah.png");
  loadImage("walk_atas", "assets/tiles/characters/jalan_atas.png");
  loadImage("walk_kanan", "assets/tiles/characters/jalan_kanan.png");
  loadImage("walk_kiri", "assets/tiles/characters/jalan_kiri.png");

  // NPC
  loadImage("npc_girl", "assets/tiles/characters/npc/npc_girl.png");
  loadImage("npc_guard", "assets/tiles/characters/npc/npc_guard.png");
  loadImage("npc_oldman", "assets/tiles/characters/npc/npc_oldman.png");

  // Peta outdoor
  loadImage("world", "assets/world/world.png");

  // Interior (6 ruangan)
  loadImage("interior_uks", "assets/world/interior_uks.png");
  loadImage("interior_kelas_a", "assets/world/interior_kelas_a.png");
  loadImage("interior_kelas_b", "assets/world/interior_kelas_b.png");
  loadImage("interior_perpus", "assets/world/interior_perpus.png");
  loadImage("interior_kantin", "assets/world/interior_kantin.png");
  loadImage("interior_kantor", "assets/world/interior_kantor.png");

  // Props
  loadImage("key_gold", "assets/props/key_gold.png");
  loadImage("key_silver", "assets/props/key_silver.png");
  loadImage("key_copper", "assets/props/key_copper.png");
  loadImage("chest_locked", "assets/props/chest_locked.png");
  loadImage("chest_unlocked", "assets/props/chest_unlocked.png");
  loadImage("sign_welcome", "assets/props/sign_welcome.png");

  try {
    await loadAll();
  } catch (e) {
    console.error(e);
    alert("Ada aset yang gagal dimuat. Cek console (F12).");
    return;
  }

  requestAnimationFrame(loop);
}

// ===== GAME LOOP =====
let last = performance.now();
function loop(now) {
  const dt = Math.min((now - last) / 1000, 0.05);
  last = now;

  // Update
  const currentOpenClue = getOpenClue();
  updateVirtualControlsVisibility(!!currentOpenClue);

  if (!currentOpenClue) updatePlayer(dt);
  updateCamera(GAME_W, GAME_H);
  updateInteraction();
  updateParticles(dt, camera, GAME_W, GAME_H);

  // ===== FOOTSTEP SOUND =====
  // PENTING: ini harus di dalam loop(), bukan di luar!
  if (!getOpenClue() && player.moving) {
    footstepTimer += dt;
    if (footstepTimer >= 0.4) {
      playFootstep();
      footstepTimer = 0;
    }
  } else {
    footstepTimer = 0.4;
  }

  // Clear
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, GAME_W, GAME_H);

  // Render
  draw(ctx, camera, GAME_W, GAME_H);
  drawParticles(ctx, camera);
  drawInteraction(ctx, camera);
  drawPlayer(ctx, camera);
  drawTracker(ctx, GAME_W, GAME_H);
  drawDialog(ctx, GAME_W, GAME_H, getOpenClue());

  // ====== DEBUG OVERLAY ======
  if (window.DEBUG_MODE) {
    const scene = getCurrentScene();
    const sceneName = getCurrentSceneName();

    // 1. BLOCKERS
    for (const b of scene.blockers) {
      const sx = b.x - camera.x;
      const sy = b.y - camera.y;
      const isThin = b.w <= 20 || b.h <= 20;
      ctx.fillStyle = isThin ? "rgba(255,255,0,0.5)" : "rgba(255,0,0,0.3)";
      ctx.strokeStyle = isThin ? "rgba(255,255,0,1)" : "rgba(255,0,0,0.8)";
      ctx.lineWidth = 2;
      ctx.fillRect(sx, sy, b.w, b.h);
      ctx.strokeRect(sx, sy, b.w, b.h);
    }

    // 2. MARKER CLUE/NPC
    const cluesInScene = clues.filter((c) => (c.scene || "outdoor") === sceneName);
    for (const c of cluesInScene) {
      const cx = c.x + c.w / 2 - camera.x;
      const cy = c.y + c.h / 2 - camera.y;

      ctx.fillStyle = "rgba(0, 200, 255, 0.35)";
      ctx.beginPath();
      ctx.arc(cx, cy, c.w / 2 + 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = "rgba(0, 200, 255, 1)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, c.w / 2 + 6, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = "rgba(0, 200, 255, 0.8)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx - 12, cy);
      ctx.lineTo(cx + 12, cy);
      ctx.moveTo(cx, cy - 12);
      ctx.lineTo(cx, cy + 12);
      ctx.stroke();

      ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
      const label = `${c.type.toUpperCase()}: ${c.x},${c.y}`;
      ctx.font = "bold 12px monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const tw = ctx.measureText(label).width;
      ctx.fillRect(cx - tw / 2 - 6, cy - c.h / 2 - 30, tw + 12, 18);
      ctx.fillStyle = "#0ff";
      ctx.fillText(label, cx, cy - c.h / 2 - 21);
    }

    // 3. MARKER PINTU
    for (const e of entrances) {
      if (e.from !== sceneName) continue;
      const ex = e.x - camera.x;
      const ey = e.y - camera.y;

      ctx.fillStyle = "rgba(255, 140, 0, 0.35)";
      ctx.beginPath();
      ctx.arc(ex, ey, e.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = "rgba(255, 140, 0, 1)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(ex, ey, e.radius, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = "rgba(255, 140, 0, 0.9)";
      ctx.beginPath();
      ctx.moveTo(ex - 12, ey);
      ctx.lineTo(ex + 12, ey);
      ctx.moveTo(ex, ey - 12);
      ctx.lineTo(ex, ey + 12);
      ctx.stroke();

      ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
      const elabel = `GATE → ${e.to}: ${e.x},${e.y}`;
      ctx.font = "bold 12px monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const ew = ctx.measureText(elabel).width;
      ctx.fillRect(ex - ew / 2 - 6, ey - e.radius - 24, ew + 12, 18);
      ctx.fillStyle = "#fa0";
      ctx.fillText(elabel, ex, ey - e.radius - 15);
    }

    // 4. MARKER PLAYER
    const px = player.x + player.w / 2 - camera.x;
    const py = player.y + player.h / 2 - camera.y;
    const r = player.w / 2 - 2;

    ctx.fillStyle = "rgba(0, 255, 100, 0.35)";
    ctx.beginPath();
    ctx.arc(px, py, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "rgba(0, 255, 100, 1)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(px, py, r, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = "rgba(0, 255, 100, 0.8)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(px - 12, py);
    ctx.lineTo(px + 12, py);
    ctx.moveTo(px, py - 12);
    ctx.lineTo(px, py + 12);
    ctx.stroke();

    ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
    const plabel = `PLAYER: ${Math.round(player.x)},${Math.round(player.y)}`;
    ctx.font = "bold 12px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const pw = ctx.measureText(plabel).width;
    ctx.fillRect(px - pw / 2 - 6, py - player.h / 2 - 30, pw + 12, 18);
    ctx.fillStyle = "#0f8";
    ctx.fillText(plabel, px, py - player.h / 2 - 21);

    // 5. INFO SCENE
    ctx.fillStyle = "rgba(0,0,0,0.75)";
    ctx.fillRect(10, 10, 220, 30);
    ctx.fillStyle = "#fa0";
    ctx.font = "bold 14px monospace";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(`Scene: ${sceneName}`, 20, 25);
  }

  requestAnimationFrame(loop);
}

// ===== START =====
resize();
init();
setupVirtualControls(); // ← aktifkan kontrol sentuh mobile & tablet
initQuizListeners(); // ← aktifkan modal kuis tantangan buka peti


// ===== TOP QUICK BAR HANDLERS =====
const soundBtn = document.getElementById("soundBtn");
const trackerBtn = document.getElementById("trackerBtn");
const fullscreenBtn = document.getElementById("fullscreenBtn");

function updateSoundButton() {
  if (soundBtn) {
    soundBtn.textContent = isBGMMuted() ? "🔇" : "🔊";
  }
}

if (soundBtn) {
  soundBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleMuteBGM();
    updateSoundButton();
  });
}

if (trackerBtn) {
  trackerBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleTracker();
    playBeep();
  });
}

// ===== LOCK / REQUEST LANDSCAPE & FULLSCREEN MODE =====
async function requestLandscape() {
  try {
    const doc = document;
    const docEl = doc.documentElement;
    const isFS = doc.fullscreenElement || doc.webkitFullscreenElement || doc.mozFullScreenElement || doc.msFullscreenElement;
    if (!isFS) {
      const req = docEl.requestFullscreen || docEl.webkitRequestFullscreen || docEl.mozRequestFullScreen || docEl.msRequestFullscreen;
      if (req) {
        await req.call(docEl);
      }
    }
  } catch (err) {}

  try {
    if (screen.orientation && screen.orientation.lock) {
      await screen.orientation.lock("landscape");
    }
  } catch (err) {}

  try {
    window.scrollTo(0, 1);
  } catch (err) {}
}

// Aktifkan Fullscreen secara otomatis pada sentuhan atau klik pertama dari awal game
function onFirstUserGesture() {
  requestLandscape();
  window.removeEventListener("pointerdown", onFirstUserGesture);
  window.removeEventListener("touchstart", onFirstUserGesture);
  window.removeEventListener("click", onFirstUserGesture);
}
window.addEventListener("pointerdown", onFirstUserGesture, { passive: true });
window.addEventListener("touchstart", onFirstUserGesture, { passive: true });
window.addEventListener("click", onFirstUserGesture, { passive: true });

// Coba langsung saat halaman dibuka
try {
  requestLandscape();
} catch (e) {}

const lockLandscapeBtn = document.getElementById("lockLandscapeBtn");
if (lockLandscapeBtn) {
  lockLandscapeBtn.addEventListener("click", () => {
    requestLandscape();
  });
}

if (fullscreenBtn) {
  fullscreenBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    if (!document.fullscreenElement) {
      requestLandscape();
    } else {
      document.exitFullscreen().catch(() => {});
    }
  });
}

// ===== OPENING SCREEN HANDLER =====
const opening = document.getElementById("opening");
const startBtn = document.getElementById("startBtn");

if (startBtn) {
  startBtn.addEventListener("click", () => {
    requestLandscape(); // ← kunci/minta mode landscape di mobile
    initAudioContext(); // ← aktifkan audio context
    initBGM("assets/audio/bgm.mp3"); // ← start BGM
    updateSoundButton();
    setTimeout(() => playBeep(), 150); // ← tes suara
    opening.classList.add("fade-out");
    setTimeout(() => {
      opening.style.display = "none";
    }, 800);
  });
}


// ===== MUTE BGM (tombol M) =====
window.addEventListener("keydown", (e) => {
  if (e.key.toLowerCase() === "m") {
    const muted = toggleMuteBGM();
    updateSoundButton();
    console.log(muted ? "🔇 BGM dimatikan" : "🔊 BGM dinyalakan");
  }
});

