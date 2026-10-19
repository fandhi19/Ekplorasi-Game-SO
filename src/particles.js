// ============================================
// SISTEM PARTIKEL
// ============================================

const particles = [];
const MAX_PARTICLES = 120;

let leafTimer = 0;
let butterflyTimer = 0;

const LEAF_SPAWN_INTERVAL = 0.9; // detik antar spawn daun
const BUTTERFLY_SPAWN_INTERVAL = 3.5; // detik antar spawn kupu

// ============ SPAWN FUNCTIONS ============

export function spawnLeaf(x, y) {
  particles.push({
    type: "leaf",
    x,
    y,
    vx: -20 + Math.random() * 40,
    vy: 20 + Math.random() * 25,
    life: 8 + Math.random() * 4,
    maxLife: 12,
    size: 7 + Math.random() * 5,
    color: ["#7ab648", "#5a9438", "#d4a84a", "#c47a3a"][Math.floor(Math.random() * 4)],
    rot: Math.random() * Math.PI * 2,
    rotSpeed: (Math.random() - 0.5) * 2,
    swayPhase: Math.random() * Math.PI * 2,
    swayAmp: 20 + Math.random() * 20,
  });
}

export function spawnButterfly(x, y) {
  particles.push({
    type: "butterfly",
    x,
    y,
    vx: (Math.random() - 0.5) * 60,
    vy: (Math.random() - 0.5) * 60,
    life: 10 + Math.random() * 5,
    maxLife: 15,
    size: 8 + Math.random() * 4,
    color: ["#FF6B6B", "#FFD93D", "#6BCB77", "#4D96FF", "#C780FA"][Math.floor(Math.random() * 5)],
    wingPhase: Math.random() * Math.PI * 2,
    wanderTimer: 0,
  });
}

export function spawnPop(x, y) {
  // Ledakan 14 partikel kecil
  for (let i = 0; i < 14; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 80 + Math.random() * 150;
    particles.push({
      type: "pop",
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 80,
      life: 0.7 + Math.random() * 0.3,
      maxLife: 1,
      size: 3 + Math.random() * 3,
      color: Math.random() > 0.5 ? "#FFD700" : "#FF6B6B",
    });
  }
}

// ============ UPDATE ============

export function updateParticles(dt, camera, canvasW, canvasH) {
  // Spawn ambient daun (di sekitar area kamera, dari atas layar)
  leafTimer += dt;
  if (leafTimer > LEAF_SPAWN_INTERVAL && particles.length < MAX_PARTICLES) {
    leafTimer = 0;
    const x = camera.x + Math.random() * canvasW;
    const y = camera.y - 30;
    spawnLeaf(x, y);
  }

  // Spawn kupu-kupu (di area pandang random)
  butterflyTimer += dt;
  if (butterflyTimer > BUTTERFLY_SPAWN_INTERVAL && particles.length < MAX_PARTICLES) {
    butterflyTimer = 0;
    const x = camera.x + 100 + Math.random() * (canvasW - 200);
    const y = camera.y + 100 + Math.random() * (canvasH - 200);
    spawnButterfly(x, y);
  }

  // Update semua partikel
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.life -= dt;

    if (p.life <= 0) {
      particles.splice(i, 1);
      continue;
    }

    if (p.type === "leaf") {
      p.swayPhase += dt * 2;
      p.x += p.vx * dt + Math.sin(p.swayPhase) * p.swayAmp * dt;
      p.y += p.vy * dt;
      p.rot += p.rotSpeed * dt;
    } else if (p.type === "butterfly") {
      p.wanderTimer -= dt;
      if (p.wanderTimer <= 0) {
        p.wanderTimer = 0.5 + Math.random() * 0.8;
        p.vx = (Math.random() - 0.5) * 60;
        p.vy = (Math.random() - 0.5) * 60;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.wingPhase += dt * 18;
    } else if (p.type === "pop") {
      p.vy += 300 * dt; // gravitasi
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.96;
      p.vy *= 0.96;
    }
  }
}

// ============ DRAW ============

export function drawParticles(ctx, camera) {
  for (const p of particles) {
    const sx = p.x - camera.x;
    const sy = p.y - camera.y;

    // Fade out di akhir umur
    let alpha = 1;
    if (p.life < 1) alpha = p.life;
    if (p.life > p.maxLife - 1) alpha = p.maxLife - p.life;

    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, alpha));

    if (p.type === "leaf") {
      ctx.translate(sx, sy);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.ellipse(0, 0, p.size, p.size * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();
      // Tulang daun
      ctx.strokeStyle = "rgba(0,0,0,0.25)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-p.size, 0);
      ctx.lineTo(p.size, 0);
      ctx.stroke();
    } else if (p.type === "butterfly") {
      ctx.translate(sx, sy);
      const wingScale = Math.abs(Math.sin(p.wingPhase)) * 0.8 + 0.2;

      // Sayap kiri
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.ellipse(-p.size / 2, -1, p.size * wingScale, p.size * 0.7, 0, 0, Math.PI * 2);
      ctx.fill();
      // Sayap kanan
      ctx.beginPath();
      ctx.ellipse(p.size / 2, -1, p.size * wingScale, p.size * 0.7, 0, 0, Math.PI * 2);
      ctx.fill();

      // Badan
      ctx.fillStyle = "#2a2a2a";
      ctx.beginPath();
      ctx.ellipse(0, 0, 1.5, p.size * 0.7, 0, 0, Math.PI * 2);
      ctx.fill();

      // Antena
      ctx.strokeStyle = "#2a2a2a";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-1, -p.size * 0.6);
      ctx.lineTo(-3, -p.size);
      ctx.moveTo(1, -p.size * 0.6);
      ctx.lineTo(3, -p.size);
      ctx.stroke();
    } else if (p.type === "pop") {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(sx, sy, p.size, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}

export function clearParticles() {
  particles.length = 0;
}
