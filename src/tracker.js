import { clues } from "../data/clues.js";
import { isRead, getProgress } from "./progress.js";
import { getCurrentSceneName } from "./scene.js";

// Tracker otomatis tertutup di HP agar tidak menutupi layar, tapi terbuka di desktop
let trackerOpen = typeof window !== "undefined" ? window.innerWidth > 768 : true;

export function isTrackerOpen() {
  return trackerOpen;
}

export function toggleTracker() {
  trackerOpen = !trackerOpen;
  return trackerOpen;
}

export function setTrackerOpen(val) {
  trackerOpen = val;
}

export function drawTracker(ctx, canvasW, canvasH) {
  const sceneName = getCurrentSceneName();
  const cluesInScene = clues.filter((c) => (c.scene || "outdoor") === sceneName);
  const { done, total } = getProgress(clues);

  const isSmallScreen = canvasW < 768;

  // Jika tracker ditutup (mode ringkas untuk mobile)
  if (!trackerOpen) {
    const pillW = isSmallScreen ? 130 : 150;
    const pillH = isSmallScreen ? 32 : 36;
    const pillX = canvasW - pillW - (isSmallScreen ? 12 : 20);
    const pillY = isSmallScreen ? 12 : 20;

    ctx.save();
    ctx.fillStyle = "rgba(18, 18, 28, 0.88)";
    if (ctx.roundRect) {
      ctx.beginPath();
      ctx.roundRect(pillX, pillY, pillW, pillH, 8);
      ctx.fill();
      ctx.strokeStyle = "#f5b700";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    } else {
      ctx.fillRect(pillX, pillY, pillW, pillH);
      ctx.strokeStyle = "#f5b700";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(pillX, pillY, pillW, pillH);
    }

    ctx.fillStyle = "#f5b700";
    ctx.font = isSmallScreen ? "bold 13px sans-serif" : "bold 14px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`📋 Misi: ${done}/${total}`, pillX + pillW / 2, pillY + pillH / 2);
    ctx.restore();
    return;
  }

  // Jika tracker terbuka (mode panel penuh)
  const panelW = isSmallScreen ? Math.min(270, canvasW - 24) : 300;
  const rowH = isSmallScreen ? 22 : 24;
  const panelH = (isSmallScreen ? 70 : 80) + cluesInScene.length * rowH;
  const panelX = canvasW - panelW - (isSmallScreen ? 12 : 20);
  const panelY = isSmallScreen ? 50 : 20;

  ctx.save();
  ctx.fillStyle = "rgba(18, 18, 28, 0.92)";
  ctx.fillRect(panelX, panelY, panelW, panelH);
  ctx.strokeStyle = "#f5b700";
  ctx.lineWidth = 2;
  ctx.strokeRect(panelX, panelY, panelW, panelH);

  // Judul
  ctx.fillStyle = "#f5b700";
  ctx.font = isSmallScreen ? "bold 15px sans-serif" : "bold 18px sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText("Misi Eksplorasi", panelX + 14, panelY + 10);

  // Tombol Tutup di panel (terutama mobile)
  if (isSmallScreen) {
    ctx.fillStyle = "rgba(255, 255, 255, 0.55)";
    ctx.font = "11px sans-serif";
    ctx.textAlign = "right";
    ctx.fillText("✕ Tutup", panelX + panelW - 12, panelY + 12);
  }

  // Info Total
  ctx.fillStyle = "#fff";
  ctx.font = isSmallScreen ? "bold 13px sans-serif" : "bold 15px sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(`Total: ${done} / ${total}`, panelX + 14, panelY + (isSmallScreen ? 30 : 38));

  // Progress Bar
  const barX = panelX + 14;
  const barY = panelY + (isSmallScreen ? 48 : 58);
  const barW = panelW - 28;
  const barH = 5;
  ctx.fillStyle = "rgba(255,255,255,0.15)";
  ctx.fillRect(barX, barY, barW, barH);
  ctx.fillStyle = "#27ae60";
  ctx.fillRect(barX, barY, barW * (done / total || 0), barH);

  // List Clue di Scene
  ctx.font = isSmallScreen ? "12px sans-serif" : "14px sans-serif";
  cluesInScene.forEach((c, i) => {
    const y = panelY + (isSmallScreen ? 62 : 76) + i * rowH;
    const read = isRead(c.id);
    ctx.fillStyle = read ? "#27ae60" : "rgba(255,255,255,0.3)";
    ctx.beginPath();
    ctx.arc(panelX + 20, y + 8, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = read ? "#fff" : "rgba(255,255,255,0.55)";
    ctx.textAlign = "left";
    ctx.fillText(c.title, panelX + 32, y);
  });

  ctx.restore();
}

