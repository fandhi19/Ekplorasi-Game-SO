import { isDown } from "./input.js";
import { isSolid } from "./world.js";
import { get } from "./assets.js";

export const player = {
  x: 1462,
  y: 1889,
  w: 64,
  h: 64,
  speed: 250,
  facing: "down",
  moving: false,
  animTime: 0,
};

const SPRITE_MAP = {
  down: { idle: "char_depan", walk: "walk_bawah" },
  up: { idle: "char_belakang", walk: "walk_atas" },
  left: { idle: "char_kiri", walk: "walk_kiri" },
  right: { idle: "char_kanan", walk: "walk_kanan" },
};

const FLIP_RIGHT = false;
const ANIM_FPS = 8;

export function updatePlayer(dt) {
  let dx = 0,
    dy = 0;
  if (isDown("a", "arrowleft")) dx -= 1;
  if (isDown("d", "arrowright")) dx += 1;
  if (isDown("w", "arrowup")) dy -= 1;
  if (isDown("s", "arrowdown")) dy += 1;

  player.moving = dx !== 0 || dy !== 0;

  if (player.moving) {
    if (Math.abs(dx) > Math.abs(dy)) {
      player.facing = dx > 0 ? "right" : "left";
    } else {
      player.facing = dy > 0 ? "down" : "up";
    }
  }

  if (dx && dy) {
    const len = Math.sqrt(dx * dx + dy * dy);
    dx /= len;
    dy /= len;
  }

  const nx = player.x + dx * player.speed * dt;
  const ny = player.y + dy * player.speed * dt;

  if (!collides(nx, player.y)) player.x = nx;
  if (!collides(player.x, ny)) player.y = ny;

  player.animTime += dt;
}

function collides(x, y) {
  const w = player.w,
    h = player.h;
  // Cek 4 sudut player + titik tengah (biar lebih akurat)
  return isSolid(x, y) || isSolid(x + w, y) || isSolid(x, y + h) || isSolid(x + w, y + h) || isSolid(x + w / 2, y + h / 2);
}

export function drawPlayer(ctx, camera) {
  const sx = Math.floor(player.x - camera.x);
  const sy = Math.floor(player.y - camera.y);

  const map = SPRITE_MAP[player.facing];

  let key;
  if (player.moving) {
    const frame = Math.floor(player.animTime * ANIM_FPS) % 2;
    key = frame === 0 ? map.idle : map.walk;
  } else {
    key = map.idle;
  }

  const img = get(key);

  if (!img || !img.complete || img.naturalWidth === 0) {
    ctx.fillStyle = "#ffcc00";
    ctx.fillRect(sx, sy, player.w, player.h);
    return;
  }

  const flip = player.facing === "right" && FLIP_RIGHT;

  ctx.save();
  if (flip) {
    ctx.translate(sx + player.w, sy);
    ctx.scale(-1, 1);
    ctx.drawImage(img, 0, 0, player.w, player.h);
  } else {
    ctx.drawImage(img, sx, sy, player.w, player.h);
  }
  ctx.restore();
}
