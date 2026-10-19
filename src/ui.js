// ============================================
// DIALOG BOX dengan TYPEWRITER EFFECT
// ============================================

const CHARS_PER_SECOND = 45;

let lastClueId = null;
let openTime = 0;
let completed = false;

export function resetTypewriter() {
  lastClueId = null;
  openTime = 0;
  completed = false;
}

export function isTypingDone() {
  return completed;
}

export function skipTypewriter() {
  completed = true;
}

export function drawDialog(ctx, canvasW, canvasH, clue) {
  if (!clue) {
    lastClueId = null;
    completed = false;
    return;
  }

  // Reset timer ketika clue berubah
  if (clue.id !== lastClueId) {
    lastClueId = clue.id;
    openTime = performance.now() / 1000;
    completed = false;
  }

  // Hitung teks yang ditampilkan
  const elapsed = performance.now() / 1000 - openTime;
  const maxChars = Math.floor(elapsed * CHARS_PER_SECOND);
  const fullText = clue.text;
  const isDone = completed || maxChars >= fullText.length;
  const displayText = isDone ? fullText : fullText.slice(0, maxChars);

  // ====== UKURAN TEKS & TINGGI BOX DINAMIS ======
  const isMobile = canvasW < 768 || canvasH < 520;
  const isTablet = canvasW >= 768 && canvasW <= 1024;

  const boxW = isMobile ? Math.min(canvasW - 24, 780) : isTablet ? Math.min(canvasW - 60, 920) : Math.min(1120, canvasW - 80);
  const padX = isMobile ? 18 : 30;
  // Berikan ruang aman di sisi kanan pada mobile agar teks tidak pernah tertutup oleh Tombol E
  const padRight = isMobile ? 80 : padX;
  const maxW = boxW - padX - padRight;

  const titleFont = isMobile ? "bold 15px sans-serif" : "bold 23px sans-serif";
  const textFont = isMobile ? "13px sans-serif" : "18px sans-serif";
  const lineH = isMobile ? 19 : 27;

  // Ukur seluruh baris teks terlebih dahulu agar boxH pas sempurna
  ctx.font = textFont;
  const fullLines = getWrappedLines(ctx, fullText, maxW);
  let totalTextHeight = 0;
  for (const l of fullLines) {
    totalTextHeight += l.isBreak ? lineH * 0.45 : lineH;
  }

  const headerH = isMobile ? 38 : 62;
  const footerH = isMobile ? 28 : 46;
  const neededBoxH = headerH + totalTextHeight + footerH;
  const maxBoxH = canvasH - (isMobile ? 16 : 40);
  const boxH = Math.min(maxBoxH, Math.max(isMobile ? 120 : 180, neededBoxH));
  const boxX = (canvasW - boxW) / 2;
  const boxY = Math.max(isMobile ? 8 : 20, canvasH - boxH - (isMobile ? 10 : 25));

  ctx.save();

  // Shadow
  ctx.fillStyle = "rgba(0,0,0,0.6)";
  ctx.fillRect(boxX + 4, boxY + 4, boxW, boxH);

  // Panel
  ctx.fillStyle = "rgba(16, 16, 26, 0.97)";
  ctx.fillRect(boxX, boxY, boxW, boxH);

  // Border gold
  ctx.strokeStyle = "#f5b700";
  ctx.lineWidth = isMobile ? 2 : 3;
  ctx.strokeRect(boxX, boxY, boxW, boxH);

  // Border tipis dalam
  ctx.strokeStyle = "rgba(245, 183, 0, 0.25)";
  ctx.lineWidth = 1;
  ctx.strokeRect(boxX + 4, boxY + 4, boxW - 8, boxH - 8);

  // ====== JUDUL ======
  const titleY = isMobile ? boxY + 10 : boxY + 18;
  ctx.fillStyle = "#f5b700";
  ctx.font = titleFont;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText(clue.title, boxX + padX, titleY);

  // Garis bawah judul
  const lineY = isMobile ? boxY + 34 : boxY + 52;
  ctx.strokeStyle = "rgba(245, 183, 0, 0.35)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(boxX + padX, lineY);
  ctx.lineTo(boxX + boxW - padX, lineY);
  ctx.stroke();

  // ====== ISI TEKS (dengan clipping pengaman) ======
  ctx.save();
  ctx.beginPath();
  ctx.rect(boxX + 6, lineY + 4, boxW - 12, boxH - (lineY - boxY) - (isMobile ? 26 : 40));
  ctx.clip();

  ctx.fillStyle = "#eee";
  ctx.font = textFont;
  const textX = boxX + padX;
  const textY = lineY + (isMobile ? 8 : 16);
  wrapText(ctx, displayText, textX, textY, maxW, lineH);
  ctx.restore();

  // ====== INDIKATOR NEXT ======
  if (isDone) {
    const blink = Math.sin(performance.now() / 300) > 0;
    if (blink) {
      ctx.fillStyle = "#ffd700";
      ctx.font = isMobile ? "bold 12px sans-serif" : "bold 15px sans-serif";
      ctx.textAlign = "right";
      ctx.textBaseline = "bottom";
      ctx.fillText(isMobile ? "▶ Klik Tombol E untuk Keluar" : "▶ Tekan E untuk Keluar", boxX + boxW - (isMobile ? 85 : 20), boxY + boxH - (isMobile ? 7 : 14));
    }
  } else {
    // Indicator "..." saat sedang ngetik
    ctx.fillStyle = "rgba(255,255,255,0.45)";
    ctx.font = isMobile ? "italic 11px sans-serif" : "italic 13px sans-serif";
    ctx.textAlign = "right";
    ctx.textBaseline = "bottom";
    ctx.fillText("mengetik...", boxX + boxW - (isMobile ? 85 : 20), boxY + boxH - (isMobile ? 7 : 14));
  }

  ctx.restore();
}

function getWrappedLines(ctx, text, maxW) {
  const paragraphs = text.split("\n");
  const lines = [];

  for (const para of paragraphs) {
    if (para === "") {
      lines.push({ text: "", isBreak: true });
      continue;
    }
    const words = para.split(" ");
    let line = "";
    for (const w of words) {
      const test = line ? line + " " + w : w;
      if (ctx.measureText(test).width > maxW && line) {
        lines.push({ text: line, isBreak: false });
        line = w;
      } else {
        line = test;
      }
    }
    if (line) {
      lines.push({ text: line, isBreak: false });
    }
  }
  return lines;
}

function wrapText(ctx, text, x, y, maxW, lineH) {
  const paragraphs = text.split("\n");
  let curY = y;

  for (const para of paragraphs) {
    if (para === "") {
      curY += lineH * 0.45;
      continue;
    }
    const words = para.split(" ");
    let line = "";
    for (const w of words) {
      const test = line ? line + " " + w : w;
      if (ctx.measureText(test).width > maxW && line) {
        ctx.fillText(line, x, curY);
        line = w;
        curY += lineH;
      } else {
        line = test;
      }
    }
    if (line) {
      ctx.fillText(line, x, curY);
      curY += lineH;
    }
  }
}


