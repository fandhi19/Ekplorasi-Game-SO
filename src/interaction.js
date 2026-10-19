import { clues } from "../data/clues.js";
import { entrances } from "../data/scenes.js";
import { player } from "./player.js";
import { keys } from "./input.js";
import { markRead, isRead, addKey, hasKey, markChestOpened, isChestOpened } from "./progress.js";
import { get } from "./assets.js";
import { getCurrentSceneName, setCurrentScene } from "./scene.js";
import { isTypingDone, skipTypewriter, resetTypewriter } from "./ui.js";
import { spawnPop } from "./particles.js";
import { playBeep, playDing, playKaching, playLocked } from "./audio.js";
import { openQuiz, isQuizOpen } from "./quiz.js";


const INTERACT_RADIUS = 90;
const DEFAULT_HIDDEN_RANGE = 320;
const DEFAULT_REVEAL_RANGE = 130;

let lastE = false;
let activeClue = null;
let openClue = null;
let activeEntrance = null;

const TYPE_COLORS = { sign: "#8B4513", item: "#F5B700", gate: "#7F8C8D", npc: "#2E86DE" };
const TYPE_LABELS = { sign: "P", item: "I", gate: "G", npc: "N" };

export function getOpenClue() {
  return openClue;
}
export function getActiveClue() {
  return activeClue;
}
export function getActiveEntrance() {
  return activeEntrance;
}

// ====== VISIBILITAS KUNCI HIDDEN ======
function getKeyVisibility(c) {
  if (!c.hidden) return { alpha: 1, hintAlpha: 0, distance: 0 };

  const px = player.x + player.w / 2;
  const py = player.y + player.h / 2;
  const cx = c.x + c.w / 2;
  const cy = c.y + c.h / 2;
  const d = Math.hypot(px - cx, py - cy);

  const hiddenRange = c.hiddenRange || DEFAULT_HIDDEN_RANGE;
  const revealRange = c.revealRange || DEFAULT_REVEAL_RANGE;

  if (d > hiddenRange) return { alpha: 0, hintAlpha: 0, distance: d };
  if (d < revealRange) return { alpha: 1, hintAlpha: 1, distance: d };

  const t = (hiddenRange - d) / (hiddenRange - revealRange);
  return { alpha: t * 0.9, hintAlpha: Math.min(1, t * 1.5), distance: d };
}

function getCluesInScene() {
  const s = getCurrentSceneName();
  return clues.filter((c) => {
    if ((c.scene || "outdoor") !== s) return false;
    if (c.type === "key" && hasKey(c.keyId)) return false;
    return true;
  });
}

export function dismissOrSkipDialog() {
  if (openClue) {
    if (!isTypingDone()) {
      skipTypewriter();
    } else {
      openClue = null;
      resetTypewriter();
    }
    return true;
  }
  return false;
}

export function updateInteraction() {
  if (isQuizOpen()) {
    return;
  }

  const eDown = !!keys["e"];
  const ePressed = eDown && !lastE;
  lastE = eDown;

  if (openClue) {
    if (ePressed && !isTypingDone()) {
      skipTypewriter();
      keys["e"] = false;
      return;
    }
    if (ePressed || keys["escape"]) {
      openClue = null;
      resetTypewriter();
      keys["e"] = false;
      lastE = true;
    }
    return;
  }

  const px = player.x + player.w / 2;
  const py = player.y + player.h / 2;
  const sceneName = getCurrentSceneName();

  // Cari clue terdekat
  let closest = null;
  let closestDist = Infinity;
  for (const c of getCluesInScene()) {
    const cx = c.x + c.w / 2;
    const cy = c.y + c.h / 2;
    const d = Math.hypot(px - cx, py - cy);
    if (d < INTERACT_RADIUS + Math.max(c.w, c.h) / 2 && d < closestDist) {
      closest = c;
      closestDist = d;
    }
  }
  activeClue = closest;

  // Cari pintu terdekat
  activeEntrance = null;
  for (const e of entrances) {
    if (e.from !== sceneName) continue;
    const d = Math.hypot(px - e.x, py - e.y);
    if (d < e.radius) {
      activeEntrance = e;
      break;
    }
  }

  if (ePressed) {
    // Prioritas: pintu
    if (activeEntrance) {
      playBeep();
      setCurrentScene(activeEntrance.to);
      player.x = activeEntrance.spawnX;
      player.y = activeEntrance.spawnY;
      return;
    }

    if (activeClue) {
      // ===== KUNCI =====
      if (activeClue.type === "key") {
        addKey(activeClue.keyId);
        markRead(activeClue.id);
        playDing();
        spawnPop(activeClue.x + activeClue.w / 2, activeClue.y + activeClue.h / 2);
        openClue = {
          ...activeClue,
          title: "🔑 " + activeClue.title,
          text: activeClue.text + "\n\n[Kunci tersimpan di tas kamu]",
        };
        return;
      }

      // ===== PETI =====
      if (activeClue.type === "chest") {
        const opened = isChestOpened(activeClue.id);

        // 1) Sudah pernah dibuka -> buka kembali informasi materinya
        if (opened) {
          playBeep();
          openClue = {
            ...activeClue,
            title: "📖 " + activeClue.title,
            text: activeClue.text + "\n\n[Peti ini sudah kamu buka sebelumnya]",
          };
          return;
        }

        // 2) Belum dibuka -> langsung berikan tantangan tebak-tebakan hiburan pembuka peti!
        if (activeClue.quiz) {
          openQuiz(activeClue, (unlockedClue) => {
            playKaching();
            markChestOpened(unlockedClue.id);
            markRead(unlockedClue.id);
            spawnPop(unlockedClue.x + unlockedClue.w / 2, unlockedClue.y + unlockedClue.h / 2);
            // Reset state input agar dialog tidak langsung tertutup tanpa sengaja
            keys["e"] = false;
            keys[" "] = false;
            keys["escape"] = false;
            lastE = true;
            resetTypewriter();
            // Buka dialog informasi dari peti setelah berhasil menjawab kuis
            openClue = {
              ...unlockedClue,
              title: "🔓 " + unlockedClue.title,
            };
          });
          return;
        }

        // 3) Buka langsung jika tidak ada kuis
        playKaching();
        markChestOpened(activeClue.id);
        markRead(activeClue.id);
        spawnPop(activeClue.x + activeClue.w / 2, activeClue.y + activeClue.h / 2);
        openClue = {
          ...activeClue,
          title: "🔓 " + activeClue.title,
        };
        return;
      }


      // ===== CLUE BIASA =====
      const wasAlreadyRead = isRead(activeClue.id);
      playBeep();
      openClue = activeClue;
      markRead(activeClue.id);
      if (!wasAlreadyRead) {
        spawnPop(activeClue.x + activeClue.w / 2, activeClue.y + activeClue.h / 2);
      }
    }
  }
}

export function drawInteraction(ctx, camera) {
  for (const c of getCluesInScene()) {
    const sx = Math.floor(c.x - camera.x);
    const sy = Math.floor(c.y - camera.y);
    const read = isRead(c.id);

    // ===== KUNCI =====
    if (c.type === "key") {
      const vis = getKeyVisibility(c);
      if (vis.alpha > 0.05) {
        drawKey(ctx, sx, sy, c.w, c.h, vis.alpha, c.sprite || "key_gold");
      }
      if (vis.hintAlpha > 0 && vis.alpha < 0.95) {
        drawHintSparkle(ctx, sx + c.w / 2, sy + c.h / 2, vis.hintAlpha);
      }
      continue;
    }

    // ===== PETI =====
    if (c.type === "chest") {
      const opened = isChestOpened(c.id);
      drawChest(ctx, sx, sy, c.w, c.h, opened);
      if (read) drawCheckmark(ctx, sx + c.w - 6, sy + 6);
      continue;
    }

    // ===== ITEM BERTEMA KHUSUS (itemStyle) =====
    if (c.itemStyle) {
      const isHovered = activeClue && activeClue.id === c.id;
      drawStyledItem(ctx, sx, sy, c.w, c.h, c.itemStyle, isHovered);
      if (read) drawCheckmark(ctx, sx + c.w - 6, sy + 6);
      continue;
    }

    // ===== CLUE BIASA =====
    let img = c.sprite ? get(c.sprite) : get(c.type);
    if (img && img.complete && img.naturalWidth > 0) {
      ctx.drawImage(img, sx, sy, c.w, c.h);
    } else {
      ctx.fillStyle = TYPE_COLORS[c.type] || "#888";
      ctx.fillRect(sx, sy, c.w, c.h);
      ctx.strokeStyle = "rgba(0,0,0,0.4)";
      ctx.lineWidth = 2;
      ctx.strokeRect(sx, sy, c.w, c.h);
      ctx.fillStyle = "#fff";
      ctx.font = "bold 24px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(TYPE_LABELS[c.type] || "?", sx + c.w / 2, sy + c.h / 2);
    }

    if (read) drawCheckmark(ctx, sx + c.w - 6, sy + 6);
  }

  // ===== BUBBLE "TEKAN E" =====
  if (activeClue && !openClue && !activeEntrance) {
    const sx = activeClue.x - camera.x + activeClue.w / 2;
    const sy = activeClue.y - camera.y - 20;

    let label = "Tekan E";
    if (activeClue.type === "key") {
      label = "🔑 Ambil Kunci (E)";
    } else if (activeClue.type === "chest") {
      const opened = isChestOpened(activeClue.id);
      if (opened) {
        label = "📖 Baca lagi (E)";
      } else {
        label = activeClue.quiz ? "🎮 Tebak-Tebakan Peti (E)" : "🔓 Buka Peti (E)";
      }
    } else if (isRead(activeClue.id)) {
      label = "Baca lagi (E)";
    }

    ctx.fillStyle = "rgba(0,0,0,0.8)";
    ctx.font = "bold 18px sans-serif";
    const tw = ctx.measureText(label).width;
    ctx.fillRect(sx - tw / 2 - 14, sy - 26, tw + 28, 34);
    ctx.strokeStyle = "#f5b700";
    ctx.lineWidth = 2;
    ctx.strokeRect(sx - tw / 2 - 14, sy - 26, tw + 28, 34);
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, sx, sy - 6);
  }

  // ===== BUBBLE PINTU =====
  if (activeEntrance) {
    const ex = activeEntrance.x - camera.x;
    const ey = activeEntrance.y - camera.y - 30;

    ctx.fillStyle = "rgba(0, 100, 200, 0.9)";
    const label = `${activeEntrance.label} (E)`;
    ctx.font = "bold 18px sans-serif";
    const tw = ctx.measureText(label).width;
    ctx.fillRect(ex - tw / 2 - 14, ey - 20, tw + 28, 34);
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, ex, ey - 3);
  }
}

// ===== RENDER KUNCI =====
function drawKey(ctx, x, y, w, h, alpha = 1, spriteKey = "key_gold") {
  const cx = x + w / 2;
  const cy = y + h / 2;
  const bob = Math.sin(performance.now() / 300) * 3;

  ctx.save();
  ctx.globalAlpha = alpha;

  // Warna glow sesuai jenis kunci
  let glowColor = "rgba(255, 215, 0, 0.7)"; // emas (default)
  if (spriteKey === "key_silver") glowColor = "rgba(200, 200, 220, 0.7)";
  if (spriteKey === "key_copper") glowColor = "rgba(200, 120, 60, 0.7)";
  if (spriteKey === "key_crystal") glowColor = "rgba(160, 224, 255, 0.7)";
  if (spriteKey === "key_iron") glowColor = "rgba(120, 120, 120, 0.7)";
  if (spriteKey === "key_wood") glowColor = "rgba(139, 111, 71, 0.7)";

  const glow = ctx.createRadialGradient(cx, cy + bob, 2, cx, cy + bob, w * 1.2);
  glow.addColorStop(0, glowColor);
  glow.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(cx, cy + bob, w * 1.2, 0, Math.PI * 2);
  ctx.fill();

  // Sprite PNG
  const img = get(spriteKey);
  if (img && img.complete && img.naturalWidth > 0) {
    ctx.drawImage(img, x, y + bob, w, h);
  } else {
    // Fallback
    ctx.fillStyle = "#FFD700";
    ctx.beginPath();
    ctx.arc(cx - 8, cy + bob, w * 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#B8860B";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = "#FFD700";
    ctx.fillRect(cx, cy + bob - h * 0.06, w * 0.35, h * 0.12);
  }

  ctx.restore();
}

// ===== KILAU HINT =====
function drawHintSparkle(ctx, cx, cy, intensity) {
  const t = performance.now() / 200;
  const pulse = (Math.sin(t) + 1) / 2;
  const size = (3 + pulse * 6) * intensity;
  const alpha = (0.4 + pulse * 0.6) * intensity;

  ctx.save();
  ctx.globalAlpha = alpha;

  ctx.fillStyle = "#FFD700";
  ctx.translate(cx, cy);
  ctx.beginPath();
  ctx.moveTo(0, -size);
  ctx.lineTo(size * 0.25, -size * 0.25);
  ctx.lineTo(size, 0);
  ctx.lineTo(size * 0.25, size * 0.25);
  ctx.lineTo(0, size);
  ctx.lineTo(-size * 0.25, size * 0.25);
  ctx.lineTo(-size, 0);
  ctx.lineTo(-size * 0.25, -size * 0.25);
  ctx.closePath();
  ctx.fill();

  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, size * 1.5);
  g.addColorStop(0, "rgba(255, 240, 150, 0.8)");
  g.addColorStop(1, "rgba(255, 215, 0, 0)");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, size * 1.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// ===== RENDER PETI =====
function drawChest(ctx, x, y, w, h, opened) {
  const cx = x + w / 2;
  const cy = y + h / 2;

  ctx.save();

  // Glow hijau kalau SUDAH DIBUKA
  if (opened) {
    const glow = ctx.createRadialGradient(cx, cy, 10, cx, cy, w * 0.9);
    glow.addColorStop(0, "rgba(39, 174, 96, 0.4)");
    glow.addColorStop(1, "rgba(39, 174, 96, 0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(cx, cy, w * 0.9, 0, Math.PI * 2);
    ctx.fill();
  }

  const key = opened ? "chest_unlocked" : "chest_locked";
  const img = get(key);
  if (img && img.complete && img.naturalWidth > 0) {
    ctx.drawImage(img, x, y, w, h);
  } else {
    // Fallback
    ctx.fillStyle = opened ? "#8B4513" : "#5a3520";
    ctx.fillRect(x, y + h * 0.4, w, h * 0.6);
    ctx.strokeStyle = "#3a2010";
    ctx.lineWidth = 3;
    ctx.strokeRect(x, y + h * 0.4, w, h * 0.6);

    ctx.fillStyle = opened ? "#A0522D" : "#6b4a30";
    ctx.beginPath();
    ctx.ellipse(cx, y + h * 0.4, w / 2, h * 0.4, 0, Math.PI, 0);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#FFD700";
    ctx.fillRect(x, y + h * 0.55, w, 5);
    ctx.fillRect(cx - 3, y, 6, h);
  }

  ctx.restore();
}

// ===== CHECKMARK =====
function drawCheckmark(ctx, cx, cy) {
  ctx.fillStyle = "#27ae60";
  ctx.beginPath();
  ctx.arc(cx, cy, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(cx - 6, cy);
  ctx.lineTo(cx - 2, cy + 4);
  ctx.lineTo(cx + 6, cy - 5);
  ctx.stroke();
}

// ============================================================
// PROCEDURAL PIXEL-ART RENDERERS UNTUK ITEM INTERAKTIF
// Menggantikan kotak kuning "I" dengan visual tematik & animasi
// ============================================================

function drawStyledItem(ctx, x, y, w, h, style, isHovered) {
  switch (style) {
    case "book":
      drawBook(ctx, x, y, w, h, isHovered);
      break;
    case "blackboard":
      drawBlackboard(ctx, x, y, w, h, isHovered);
      break;
    case "desktop_pc":
      drawComputer(ctx, x, y, w, h, isHovered);
      break;
    case "mobile_device":
      drawMobile(ctx, x, y, w, h, isHovered);
      break;
    case "embedded_chip":
      drawChip(ctx, x, y, w, h, isHovered);
      break;
    case "server_rack":
      drawServerRack(ctx, x, y, w, h, isHovered);
      break;
    case "document":
      drawDocument(ctx, x, y, w, h, isHovered);
      break;
    case "medical":
      drawMedical(ctx, x, y, w, h, isHovered);
      break;
    default:
      ctx.fillStyle = TYPE_COLORS["item"] || "#F5B700";
      ctx.fillRect(x, y, w, h);
      break;
  }
}

// 1. BUKU ENSIKLOPEDIA LAPISAN BAWANG (Perpustakaan)
function drawBook(ctx, x, y, w, h, isHovered) {
  const cx = x + w / 2;
  const t = performance.now() / 360;
  const bob = Math.sin(t) * 3.5;
  const cy = y + h / 2 + bob;

  ctx.save();

  // Shadow di lantai
  ctx.fillStyle = "rgba(0, 0, 0, 0.28)";
  ctx.beginPath();
  ctx.ellipse(cx, y + h - 4, w * 0.36, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  // Aura emas melingkar magis
  const auraR = w * (isHovered ? 0.8 : 0.65);
  const aura = ctx.createRadialGradient(cx, cy, 4, cx, cy, auraR);
  aura.addColorStop(0, isHovered ? "rgba(245, 183, 0, 0.55)" : "rgba(245, 183, 0, 0.3)");
  aura.addColorStop(1, "rgba(245, 183, 0, 0)");
  ctx.fillStyle = aura;
  ctx.beginPath();
  ctx.arc(cx, cy, auraR, 0, Math.PI * 2);
  ctx.fill();

  const bookW = w * 0.88;
  const bookH = h * 0.66;
  const bx = cx - bookW / 2;
  const by = cy - bookH / 2;

  // Sampul luar kulit tebal (leather burgundy cover)
  ctx.fillStyle = "#5c1313";
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(bx - 3, by - 2, bookW + 6, bookH + 7, 5);
  } else {
    ctx.rect(bx - 3, by - 2, bookW + 6, bookH + 7);
  }
  ctx.fill();
  ctx.strokeStyle = "#d4af37";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Tumpukan lembaran halaman samping
  ctx.fillStyle = "#d2b48c";
  ctx.fillRect(bx, by + bookH - 2, bookW, 4);

  const halfW = (bookW - 4) / 2;
  const spineX = cx;

  // Halaman kiri (cream parchment)
  ctx.fillStyle = "#fcf8eb";
  ctx.beginPath();
  ctx.moveTo(bx + 2, by + 2);
  ctx.lineTo(spineX - 1, by + 5);
  ctx.lineTo(spineX - 1, by + bookH - 2);
  ctx.lineTo(bx + 2, by + bookH - 4);
  ctx.closePath();
  ctx.fill();

  // Halaman kanan (white parchment)
  ctx.fillStyle = "#fffef7";
  ctx.beginPath();
  ctx.moveTo(spineX + 1, by + 5);
  ctx.lineTo(bx + bookW - 2, by + 2);
  ctx.lineTo(bx + bookW - 2, by + bookH - 4);
  ctx.lineTo(spineX + 1, by + bookH - 2);
  ctx.closePath();
  ctx.fill();

  // Lipatan tengah / spine shadow
  ctx.fillStyle = "rgba(100, 60, 20, 0.35)";
  ctx.fillRect(spineX - 2, by + 4, 4, bookH - 6);

  // Pita pembatas buku merah (ribbon)
  ctx.strokeStyle = "#c0392b";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(spineX, by + 4);
  ctx.quadraticCurveTo(spineX + 4, by + bookH + 4, spineX + 2, by + bookH + 10);
  ctx.stroke();
  ctx.fillStyle = "#f5b700";
  ctx.fillRect(spineX, by + bookH + 9, 3, 3);

  // Garis-garis tulisan di halaman kiri
  ctx.fillStyle = "rgba(80, 50, 30, 0.45)";
  for (let i = 0; i < 4; i++) {
    const ly = by + 10 + i * 7;
    ctx.fillRect(bx + 6, ly, halfW - 10, 2);
  }

  // Garis-garis tulisan di halaman kanan
  for (let i = 0; i < 4; i++) {
    const ly = by + 10 + i * 7;
    ctx.fillRect(spineX + 5, ly, halfW - 10, 2);
  }

  // Lambang diagram bawang melingkar mini di pojok kanan
  ctx.strokeStyle = "rgba(180, 100, 20, 0.65)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(bx + bookW - 14, by + bookH - 12, 5, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(bx + bookW - 14, by + bookH - 12, 2.5, 0, Math.PI * 2);
  ctx.stroke();

  // Partikel sihir kecil melayang di atas buku
  const spT = performance.now() / 400;
  for (let p = 0; p < 2; p++) {
    const offset = p * 2.5;
    const px = cx + Math.sin(spT + offset) * 16;
    const py = by - 4 - ((spT * 10 + offset * 8) % 18);
    const pAlpha = 0.8 - ((spT * 10 + offset * 8) % 18) / 18;
    ctx.fillStyle = `rgba(255, 230, 100, ${Math.max(0, pAlpha)})`;
    ctx.fillRect(px, py, 2.5, 2.5);
  }

  ctx.restore();
}

// 2. PAPAN TULIS TEORI OS (Kelas A)
function drawBlackboard(ctx, x, y, w, h, isHovered) {
  ctx.save();

  // Kaki kayu di belakang
  ctx.fillStyle = "#3e2723";
  ctx.fillRect(x + 10, y + h - 10, 6, 10);
  ctx.fillRect(x + w - 16, y + h - 10, 6, 10);

  // Bingkai kayu luar
  ctx.fillStyle = "#5d4037";
  ctx.fillRect(x + 4, y + 4, w - 8, h - 14);
  ctx.strokeStyle = isHovered ? "#f5b700" : "#3e2723";
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 4, y + 4, w - 8, h - 14);

  // Permukaan papan tulis hijau gelap
  const bw = w - 16;
  const bh = h - 22;
  ctx.fillStyle = "#1e392a";
  ctx.fillRect(x + 8, y + 8, bw, bh);

  // Rak kapur di bawah papan
  ctx.fillStyle = "#4e342e";
  ctx.fillRect(x + 6, y + h - 12, w - 12, 4);

  // Kapur putih & kuning di rak
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(x + 14, y + h - 14, 8, 3);
  ctx.fillStyle = "#fff59d";
  ctx.fillRect(x + 25, y + h - 14, 6, 3);
  // Penghapus kayu
  ctx.fillStyle = "#8d6e63";
  ctx.fillRect(x + w - 24, y + h - 15, 12, 4);

  // Header kapur: "OS: TEORI"
  ctx.fillStyle = "#fff59d";
  ctx.font = "bold 9px monospace";
  ctx.textAlign = "center";
  ctx.fillText("OS: TEORI", x + w / 2, y + 17);

  // Diagram kapur alur: [ HARDWARE <-> OS ]
  ctx.strokeStyle = "rgba(255,255,255,0.75)";
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 10, y + 22, bw - 4, 12);
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.font = "7px sans-serif";
  ctx.fillText("HARDWARE <-> APP", x + w / 2, y + 31);

  // Garis-garis tulisan kapur bawah
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.fillRect(x + 12, y + 39, bw - 8, 1.5);
  ctx.fillRect(x + 12, y + 43, bw - 16, 1.5);

  ctx.restore();
}

// 3. MONITOR DESKTOP PC (Lab Komputer - Misi 4)
function drawComputer(ctx, x, y, w, h, isHovered) {
  ctx.save();
  const cx = x + w / 2;

  // Bayangan meja
  ctx.fillStyle = "rgba(0,0,0,0.25)";
  ctx.beginPath();
  ctx.ellipse(cx, y + h - 6, w * 0.38, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Stand monitor
  ctx.fillStyle = "#1e272e";
  ctx.fillRect(cx - 3, y + h - 18, 6, 12);
  ctx.fillStyle = "#2f3640";
  ctx.fillRect(cx - 14, y + h - 8, 28, 4);

  // Bezel layar monitor
  const mw = w - 14;
  const mh = h - 22;
  const mx = x + 7;
  const my = y + 4;
  ctx.fillStyle = "#2d3436";
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(mx, my, mw, mh, 4);
  else ctx.rect(mx, my, mw, mh);
  ctx.fill();
  ctx.strokeStyle = isHovered ? "#00cec9" : "#636e72";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Layar menyala (Cyan/Blue Desktop)
  ctx.fillStyle = "#0f1c2e";
  ctx.fillRect(mx + 3, my + 3, mw - 6, mh - 6);

  const screenG = ctx.createLinearGradient(mx + 3, my + 3, mx + 3, my + mh - 3);
  screenG.addColorStop(0, "#0052d4");
  screenG.addColorStop(1, "#4364f7");
  ctx.fillStyle = screenG;
  ctx.fillRect(mx + 3, my + 3, mw - 6, mh - 10);

  // Desktop Icons (3 kotak kecil di kiri)
  const iconColors = ["#00cec9", "#ffeaa7", "#ff7675"];
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = iconColors[i];
    ctx.fillRect(mx + 6, my + 6 + i * 6, 4, 4);
  }

  // Window aktif di tengah
  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.fillRect(mx + 15, my + 6, mw - 22, mh - 18);
  ctx.fillStyle = "#2d3436";
  ctx.fillRect(mx + 15, my + 6, mw - 22, 3);
  ctx.fillStyle = "#0984e3";
  ctx.fillRect(mx + 17, my + 11, mw - 26, 1.5);
  ctx.fillStyle = "#b2bec3";
  ctx.fillRect(mx + 17, my + 14, mw - 30, 1.5);

  // Taskbar bawah
  ctx.fillStyle = "#1e272e";
  ctx.fillRect(mx + 3, my + mh - 7, mw - 6, 4);
  ctx.fillStyle = "#0984e3";
  ctx.fillRect(mx + 5, my + mh - 6, 3, 2);

  // Keyboard mini di depan
  ctx.fillStyle = "#636e72";
  ctx.fillRect(cx - 15, y + h - 6, 30, 4);
  ctx.fillStyle = "#dfe6e9";
  for (let k = 0; k < 4; k++) {
    ctx.fillRect(cx - 13 + k * 7, y + h - 5, 5, 2);
  }

  ctx.restore();
}

// 4. SMARTPHONE / TABLET MOBILE OS (Lab Komputer - Misi 4)
function drawMobile(ctx, x, y, w, h, isHovered) {
  ctx.save();
  const cx = x + w / 2;
  const cy = y + h / 2;

  // Bayangan
  ctx.fillStyle = "rgba(0,0,0,0.25)";
  ctx.beginPath();
  ctx.ellipse(cx, y + h - 6, 16, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  const pw = 36;
  const ph = 52;
  const px = cx - pw / 2;
  const py = cy - ph / 2;

  ctx.fillStyle = "#2d3436";
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(px, py, pw, ph, 7);
  else ctx.rect(px, py, pw, ph);
  ctx.fill();
  ctx.strokeStyle = isHovered ? "#a29bfe" : "#636e72";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Layar mobile
  const sx = px + 3;
  const sy = py + 4;
  const sw = pw - 6;
  const sh = ph - 8;

  const mobGrad = ctx.createLinearGradient(sx, sy, sx, sy + sh);
  mobGrad.addColorStop(0, "#6c5ce7");
  mobGrad.addColorStop(1, "#00cec9");
  ctx.fillStyle = mobGrad;
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(sx, sy, sw, sh, 4);
  else ctx.rect(sx, sy, sw, sh);
  ctx.fill();

  // Status bar atas (Jam & baterai)
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.fillRect(sx + 3, sy + 2, 8, 1.5);
  ctx.fillRect(sx + sw - 6, sy + 2, 4, 2);

  // Grid aplikasi mobile (2 baris x 3 kolom)
  const appColors = [
    "#fab1a0", "#ffeaa7", "#55efc4",
    "#fd79a8", "#74b9ff", "#a29bfe"
  ];
  for (let r = 0; r < 2; r++) {
    for (let c = 0; c < 3; c++) {
      const idx = r * 3 + c;
      const ax = sx + 4 + c * 8;
      const ay = sy + 7 + r * 9;
      ctx.fillStyle = appColors[idx];
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(ax, ay, 6, 6, 1.5);
      else ctx.rect(ax, ay, 6, 6);
      ctx.fill();
    }
  }

  // Dock bawah
  ctx.fillStyle = "rgba(255,255,255,0.3)";
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(sx + 3, sy + sh - 9, sw - 6, 6, 2);
  else ctx.rect(sx + 3, sy + sh - 9, sw - 6, 6);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(sx + 5, sy + sh - 7, 4, 3);
  ctx.fillStyle = "#2ecc71";
  ctx.fillRect(sx + 13, sy + sh - 7, 4, 3);
  ctx.fillStyle = "#3498db";
  ctx.fillRect(sx + 21, sy + sh - 7, 4, 3);

  // Home bar
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.fillRect(cx - 5, py + ph - 3, 10, 1.5);

  ctx.restore();
}

// 5. CHIP SIRKUIT EMBEDDED OS (Lab Komputer - Misi 4)
function drawChip(ctx, x, y, w, h, isHovered) {
  ctx.save();
  const cx = x + w / 2;
  const cy = y + h / 2;

  // Bayangan
  ctx.fillStyle = "rgba(0,0,0,0.25)";
  ctx.beginPath();
  ctx.ellipse(cx, y + h - 5, w * 0.35, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Papan PCB hijau
  const pw = w * 0.78;
  const ph = h * 0.78;
  const px = cx - pw / 2;
  const py = cy - ph / 2;

  ctx.fillStyle = "#0c4b33";
  ctx.fillRect(px, py, pw, ph);
  ctx.strokeStyle = isHovered ? "#2ecc71" : "#082b1d";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(px, py, pw, ph);

  // Baut sudut emas
  ctx.fillStyle = "#f1c40f";
  ctx.beginPath();
  ctx.arc(px + 4, py + 4, 2, 0, Math.PI * 2);
  ctx.arc(px + pw - 4, py + 4, 2, 0, Math.PI * 2);
  ctx.arc(px + 4, py + ph - 4, 2, 0, Math.PI * 2);
  ctx.arc(px + pw - 4, py + ph - 4, 2, 0, Math.PI * 2);
  ctx.fill();

  // Jalur tembaga sirkuit
  ctx.strokeStyle = "rgba(212, 175, 55, 0.65)";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(px + 10, py + 4);
  ctx.lineTo(px + 10, py + 12);
  ctx.lineTo(cx - 8, py + 12);
  ctx.moveTo(px + pw - 4, py + 14);
  ctx.lineTo(px + pw - 10, py + 14);
  ctx.lineTo(px + pw - 10, cy - 4);
  ctx.moveTo(px + 4, py + ph - 12);
  ctx.lineTo(px + 12, py + ph - 12);
  ctx.lineTo(px + 12, cy + 6);
  ctx.stroke();

  // Pin perak chip
  ctx.fillStyle = "#bdc3c7";
  for (let i = 0; i < 5; i++) {
    const pinY = cy - 10 + i * 5;
    ctx.fillRect(cx - 16, pinY, 3, 2);
    ctx.fillRect(cx + 13, pinY, 3, 2);
  }

  // IC chip tengah
  ctx.fillStyle = "#1e272e";
  ctx.fillRect(cx - 13, cy - 12, 26, 24);
  ctx.strokeStyle = "#485460";
  ctx.lineWidth = 1;
  ctx.strokeRect(cx - 13, cy - 12, 26, 24);

  // Label mikrochip
  ctx.fillStyle = "#e1b12c";
  ctx.font = "bold 6px monospace";
  ctx.textAlign = "center";
  ctx.fillText("RTOS", cx, cy - 1);
  ctx.fillStyle = "#bdc3c7";
  ctx.font = "5px monospace";
  ctx.fillText("MCU-32", cx, cy + 6);

  // LED indikator berkedip
  const blinkT = performance.now() / 300;
  const greenOn = Math.sin(blinkT) > 0;
  const redOn = Math.cos(blinkT) > 0;

  ctx.fillStyle = greenOn ? "#2ecc71" : "#145a32";
  ctx.beginPath();
  ctx.arc(px + 8, py + ph - 6, 2, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = redOn ? "#e74c3c" : "#641e16";
  ctx.beginPath();
  ctx.arc(px + 14, py + ph - 6, 2, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// 6. SERVER RACK TOWER (Lab Komputer - Misi 4)
function drawServerRack(ctx, x, y, w, h, isHovered) {
  ctx.save();
  const cx = x + w / 2;

  // Bayangan
  ctx.fillStyle = "rgba(0,0,0,0.3)";
  ctx.beginPath();
  ctx.ellipse(cx, y + h - 4, w * 0.38, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Bodi rack cabinet
  const rw = w * 0.8;
  const rh = h * 0.88;
  const rx = cx - rw / 2;
  const ry = y + h - rh - 6;

  ctx.fillStyle = "#1e272e";
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(rx, ry, rw, rh, 3);
  else ctx.rect(rx, ry, rw, rh);
  ctx.fill();
  ctx.strokeStyle = isHovered ? "#00d2d3" : "#353b48";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // 3 unit server blade
  const slotCount = 3;
  const slotH = (rh - 12) / slotCount;
  const t = performance.now() / 250;

  for (let i = 0; i < slotCount; i++) {
    const sy = ry + 6 + i * slotH;

    ctx.fillStyle = "#2f3640";
    ctx.fillRect(rx + 4, sy + 1, rw - 8, slotH - 3);
    ctx.strokeStyle = "#485460";
    ctx.lineWidth = 1;
    ctx.strokeRect(rx + 4, sy + 1, rw - 8, slotH - 3);

    // Ventilasi cooling
    ctx.fillStyle = "#1e272e";
    for (let v = 0; v < 4; v++) {
      ctx.fillRect(rx + 8 + v * 4, sy + 3, 2, slotH - 7);
    }

    // Drive bay
    ctx.fillStyle = "#222f3e";
    ctx.fillRect(rx + 28, sy + 3, rw - 44, slotH - 7);

    // Lampu LED aktivitas server
    const ledX = rx + rw - 13;
    const ledOn = Math.sin(t + i * 2) > -0.2;
    const ledBlue = Math.cos(t * 1.5 + i) > 0;

    ctx.fillStyle = "#10ac84";
    ctx.beginPath();
    ctx.arc(ledX, sy + 4, 1.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = ledOn ? (ledBlue ? "#00d2d3" : "#ff9f43") : "#222f3e";
    ctx.beginPath();
    ctx.arc(ledX, sy + slotH - 6, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

// 7. BERKAS DOKUMEN SISTEM OPERASI (Kantin - Misi 5)
function drawDocument(ctx, x, y, w, h, isHovered) {
  ctx.save();
  const cx = x + w / 2;
  const cy = y + h / 2;

  // Bayangan meja
  ctx.fillStyle = "rgba(0,0,0,0.22)";
  ctx.beginPath();
  ctx.ellipse(cx, y + h - 6, w * 0.32, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Papan clipboard kayu
  const cw = w * 0.68;
  const ch = h * 0.82;
  const cpx = cx - cw / 2;
  const cpy = cy - ch / 2;

  ctx.fillStyle = "#8d5b2c";
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(cpx, cpy, cw, ch, 4);
  else ctx.rect(cpx, cpy, cw, ch);
  ctx.fill();
  ctx.strokeStyle = isHovered ? "#f1c40f" : "#5c3815";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Kertas di atas clipboard
  const px = cpx + 3;
  const py = cpy + 6;
  const pw = cw - 6;
  const ph = ch - 9;

  ctx.fillStyle = "#fdfefe";
  ctx.fillRect(px, py, pw, ph);

  // Klip binder logam di atas
  ctx.fillStyle = "#7f8c8d";
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(cx - 10, cpy - 2, 20, 8, 2);
  else ctx.rect(cx - 10, cpy - 2, 20, 8);
  ctx.fill();
  ctx.fillStyle = "#bdc3c7";
  ctx.fillRect(cx - 6, cpy - 1, 12, 3);

  // Garis-garis tulisan paragraf
  ctx.fillStyle = "#34495e";
  ctx.fillRect(px + 4, py + 8, pw - 8, 2);
  ctx.fillStyle = "#95a5a6";
  for (let i = 0; i < 4; i++) {
    const lw = i === 3 ? pw - 14 : pw - 8;
    ctx.fillRect(px + 4, py + 14 + i * 5, lw, 1.5);
  }

  // Segel stempel emas / merah
  ctx.fillStyle = isHovered ? "#e74c3c" : "#e67e22";
  ctx.beginPath();
  ctx.arc(px + pw - 7, py + ph - 8, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 5px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("OS", px + pw - 7, py + ph - 6);

  ctx.restore();
}

// 8. REKAM MEDIS DETEKTIF TROUBLESHOOTING (UKS - Misi 6)
function drawMedical(ctx, x, y, w, h, isHovered) {
  ctx.save();
  const cx = x + w / 2;
  const cy = y + h / 2;

  // Bayangan
  ctx.fillStyle = "rgba(0,0,0,0.22)";
  ctx.beginPath();
  ctx.ellipse(cx, y + h - 6, w * 0.32, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Papan clipboard medis abu gelap
  const cw = w * 0.68;
  const ch = h * 0.82;
  const cpx = cx - cw / 2;
  const cpy = cy - ch / 2;

  ctx.fillStyle = "#2c3e50";
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(cpx, cpy, cw, ch, 4);
  else ctx.rect(cpx, cpy, cw, ch);
  ctx.fill();
  ctx.strokeStyle = isHovered ? "#e74c3c" : "#1a252f";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Kertas formulir rekam medis
  const px = cpx + 3;
  const py = cpy + 6;
  const pw = cw - 6;
  const ph = ch - 9;

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(px, py, pw, ph);

  // Klip binder perak
  ctx.fillStyle = "#95a5a6";
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(cx - 10, cpy - 2, 20, 8, 2);
  else ctx.rect(cx - 10, cpy - 2, 20, 8);
  ctx.fill();

  // Simbol Palang Merah (Red Cross)
  ctx.fillStyle = "#e74c3c";
  ctx.fillRect(px + 4, py + 4, 3, 9);
  ctx.fillRect(px + 1, py + 7, 9, 3);

  // Header teks
  ctx.fillStyle = "#2c3e50";
  ctx.font = "bold 6px sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("DIAGNOSIS", px + 12, py + 10);

  // Garis detak jantung ECG hijau (pulse wave)
  ctx.strokeStyle = "#27ae60";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  const ecgY = py + 20;
  ctx.moveTo(px + 3, ecgY);
  ctx.lineTo(px + 8, ecgY);
  ctx.lineTo(px + 11, ecgY - 5);
  ctx.lineTo(px + 14, ecgY + 5);
  ctx.lineTo(px + 17, ecgY);
  ctx.lineTo(px + pw - 4, ecgY);
  ctx.stroke();

  // Garis-garis tulisan resep / catatan troubleshooting
  ctx.fillStyle = "#7f8c8d";
  for (let i = 0; i < 3; i++) {
    ctx.fillRect(px + 4, py + 26 + i * 4, pw - 8, 1.5);
  }

  ctx.restore();
}

