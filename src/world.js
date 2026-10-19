import { get } from "./assets.js";
import { getCurrentScene } from "./scene.js";

export const TILE = 64;
export const worldW = 3000;
export const worldH = 2000;

export function isSolid(px, py) {
  const scene = getCurrentScene();
  if (px < 0 || py < 0 || px > scene.worldW || py > scene.worldH) return true;

  for (const b of scene.blockers) {
    if (px >= b.x && px <= b.x + b.w && py >= b.y && py <= b.y + b.h) {
      return true;
    }
  }
  return false;
}

export function draw(ctx, camera, canvasW, canvasH) {
  const scene = getCurrentScene();
  const img = get(scene.image);

  if (img && img.complete && img.naturalWidth > 0) {
    // ⚡ KUNCI: stretch gambar sesuai scene.worldW & scene.worldH
    ctx.drawImage(img, -camera.x, -camera.y, scene.worldW, scene.worldH);
  } else {
    ctx.fillStyle = "#4a8f4a";
    ctx.fillRect(0, 0, canvasW, canvasH);
    ctx.fillStyle = "#fff";
    ctx.font = "20px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`Scene: ${scene.image} — gambar belum di-load`, canvasW / 2, canvasH / 2);
  }
}
