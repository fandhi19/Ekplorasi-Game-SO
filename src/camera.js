import { getCurrentScene } from "./scene.js";
import { player } from "./player.js";

export const camera = { x: 0, y: 0 };

export function updateCamera(canvasW, canvasH) {
  const scene = getCurrentScene();

  let tx = player.x + player.w / 2 - canvasW / 2;
  let ty = player.y + player.h / 2 - canvasH / 2;

  tx = Math.max(0, Math.min(tx, Math.max(0, scene.worldW - canvasW)));
  ty = Math.max(0, Math.min(ty, Math.max(0, scene.worldH - canvasH)));

  camera.x += (tx - camera.x) * 0.15;
  camera.y += (ty - camera.y) * 0.15;
}
