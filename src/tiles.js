export const TILE_SIZE = 64;

function makeCanvas() {
  const c = document.createElement("canvas");
  c.width = TILE_SIZE;
  c.height = TILE_SIZE;
  return c;
}

function makeGrass() {
  const c = makeCanvas();
  const ctx = c.getContext("2d");

  ctx.fillStyle = "#4a8f4a";
  ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);

  // Butiran warna
  for (let i = 0; i < 40; i++) {
    const x = Math.random() * TILE_SIZE;
    const y = Math.random() * TILE_SIZE;
    ctx.fillStyle = Math.random() > 0.5 ? "#5a9f5a" : "#3a7f3a";
    ctx.fillRect(x, y, 2, 2);
  }

  // Helai rumput
  ctx.strokeStyle = "#5a9f5a";
  ctx.lineWidth = 1;
  for (let i = 0; i < 8; i++) {
    const x = Math.random() * TILE_SIZE;
    const y = Math.random() * TILE_SIZE;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y - 4);
    ctx.stroke();
  }

  return c;
}

function makeRoad() {
  const c = makeCanvas();
  const ctx = c.getContext("2d");

  ctx.fillStyle = "#c2b280";
  ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);

  // Butiran pasir
  for (let i = 0; i < 60; i++) {
    const x = Math.random() * TILE_SIZE;
    const y = Math.random() * TILE_SIZE;
    ctx.fillStyle = Math.random() > 0.5 ? "#d2c290" : "#a89860";
    ctx.fillRect(x, y, 2, 2);
  }

  // Kerikil kecil
  for (let i = 0; i < 4; i++) {
    const x = Math.random() * TILE_SIZE;
    const y = Math.random() * TILE_SIZE;
    ctx.fillStyle = "#8a7a50";
    ctx.beginPath();
    ctx.arc(x, y, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  return c;
}

function makeWall() {
  const c = makeCanvas();
  const ctx = c.getContext("2d");

  // Background gelap
  ctx.fillStyle = "#3a2a19";
  ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);

  // Bata
  const brickH = 16;
  const brickW = 32;
  for (let row = 0; row < TILE_SIZE / brickH; row++) {
    const offset = (row % 2) * (brickW / 2);
    for (let col = -1; col < TILE_SIZE / brickW + 1; col++) {
      const x = col * brickW + offset;
      const y = row * brickH;
      ctx.fillStyle = "#5b3a29";
      ctx.fillRect(x + 1, y + 1, brickW - 2, brickH - 2);

      // Highlight atas
      ctx.fillStyle = "#7a5a49";
      ctx.fillRect(x + 1, y + 1, brickW - 2, 2);
    }
  }

  return c;
}

// Water (bonus)
function makeWater() {
  const c = makeCanvas();
  const ctx = c.getContext("2d");

  ctx.fillStyle = "#3a6ba8";
  ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);

  // Ripple
  ctx.strokeStyle = "rgba(120, 170, 220, 0.5)";
  ctx.lineWidth = 1;
  for (let i = 0; i < 3; i++) {
    const y = 10 + i * 18;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.quadraticCurveTo(TILE_SIZE / 2, y - 3, TILE_SIZE, y);
    ctx.stroke();
  }

  return c;
}

let cache = null;

export function initTilePatterns() {
  cache = {
    0: makeGrass(),
    1: makeWall(),
    2: makeRoad(),
    3: makeWater(),
  };
}

export function getTileCanvas(id) {
  return cache ? cache[id] : null;
}
