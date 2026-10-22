// ============================================
// DIALOG BOX dengan TYPEWRITER EFFECT & SCROLL
// ============================================

const CHARS_PER_SECOND = 45;

let lastClueId = null;
let openTime = 0;
let completed = false;

// State scroll dialog
let dialogScrollY = 0;
let maxScrollY = 0;
let isDragging = false;
let dragStartY = 0;
let dragStartScroll = 0;
let isUserScrolled = false;
let currentDialogBox = null;

export function resetTypewriter() {
  lastClueId = null;
  openTime = 0;
  completed = false;
  dialogScrollY = 0;
  maxScrollY = 0;
  isDragging = false;
  isUserScrolled = false;
  currentDialogBox = null;
}

export function isTypingDone() {
  return completed;
}

export function skipTypewriter() {
  completed = true;
}

export function getDialogScrollY() {
  return dialogScrollY;
}

export function drawDialog(ctx, canvasW, canvasH, clue) {
  if (!clue) {
    lastClueId = null;
    completed = false;
    currentDialogBox = null;
    isDragging = false;
    return;
  }

  // Reset timer & scroll ketika clue berubah
  if (clue.id !== lastClueId) {
    lastClueId = clue.id;
    openTime = performance.now() / 1000;
    completed = false;
    dialogScrollY = 0;
    maxScrollY = 0;
    isDragging = false;
    isUserScrolled = false;
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

  // Simpan area box saat ini untuk event listener scroll/drag
  currentDialogBox = { boxX, boxY, boxW, boxH };

  // Hitung area clipping & batas scroll
  const lineY = isMobile ? boxY + 34 : boxY + 52;
  const clipY = lineY + 4;
  const clipH = boxH - (lineY - boxY) - (isMobile ? 26 : 40);
  const visibleH = clipH;
  maxScrollY = Math.max(0, totalTextHeight - visibleH + (isMobile ? 16 : 24));

  // Auto-scroll saat typewriter sedang mengetik teks panjang ke bawah (jika belum discroll manual oleh user)
  if (!isUserScrolled && !isDone && maxScrollY > 0) {
    const currentLines = getWrappedLines(ctx, displayText, maxW);
    let currentTextHeight = 0;
    for (const l of currentLines) {
      currentTextHeight += l.isBreak ? lineH * 0.45 : lineH;
    }
    if (currentTextHeight > visibleH) {
      dialogScrollY = Math.min(maxScrollY, currentTextHeight - visibleH + 10);
    }
  }

  // Pastikan dialogScrollY selalu dalam batas [0, maxScrollY]
  dialogScrollY = Math.max(0, Math.min(maxScrollY, dialogScrollY));

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
  ctx.strokeStyle = "rgba(245, 183, 0, 0.35)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(boxX + padX, lineY);
  ctx.lineTo(boxX + boxW - padX, lineY);
  ctx.stroke();

  // ====== ISI TEKS (dengan clipping pengaman & scroll offset) ======
  ctx.save();
  ctx.beginPath();
  ctx.rect(boxX + 6, clipY, boxW - 12, clipH);
  ctx.clip();

  ctx.fillStyle = "#eee";
  ctx.font = textFont;
  const textX = boxX + padX;
  const textY = lineY + (isMobile ? 8 : 16);
  wrapText(ctx, displayText, textX, textY, maxW, lineH, dialogScrollY);
  ctx.restore();

  // ====== SCROLLBAR VERTIKAL (Jika konten melebihi tinggi box) ======
  if (maxScrollY > 0) {
    const trackW = isMobile ? 5 : 7;
    const trackX = boxX + boxW - (isMobile ? 12 : 18);
    const trackY = clipY + 4;
    const trackH = clipH - 8;

    // Track background
    ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
    if (ctx.roundRect) {
      ctx.beginPath();
      ctx.roundRect(trackX, trackY, trackW, trackH, 3);
      ctx.fill();
    } else {
      ctx.fillRect(trackX, trackY, trackW, trackH);
    }

    // Thumb
    const thumbRatio = Math.max(0.18, Math.min(1, visibleH / totalTextHeight));
    const thumbH = Math.max(isMobile ? 26 : 36, trackH * thumbRatio);
    const thumbY = trackY + (dialogScrollY / maxScrollY) * (trackH - thumbH);

    ctx.fillStyle = isDragging ? "#ffe043" : "#f5b700";
    if (ctx.roundRect) {
      ctx.beginPath();
      ctx.roundRect(trackX, thumbY, trackW, thumbH, 3);
      ctx.fill();
    } else {
      ctx.fillRect(trackX, thumbY, trackW, thumbH);
    }

    // Hint indikator jika masih ada teks di bawah
    if (dialogScrollY < maxScrollY - 12) {
      const hintBlink = Math.sin(performance.now() / 250) > -0.2;
      if (hintBlink) {
        ctx.save();
        ctx.fillStyle = "#ffd700";
        ctx.font = isMobile ? "bold 11px sans-serif" : "bold 12.5px sans-serif";
        ctx.textAlign = "left";
        ctx.textBaseline = "bottom";
        ctx.fillText(isMobile ? "▼ Geser layar ke atas untuk lanjut baca" : "▼ Scroll ke bawah untuk lanjut baca", boxX + padX, boxY + boxH - (isMobile ? 7 : 14));
        ctx.restore();
      }
    }
  }

  // ====== INDIKATOR TOMBOL KELUAR / MENGETIK ======
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

function wrapText(ctx, text, x, y, maxW, lineH, scrollY = 0) {
  const paragraphs = text.split("\n");
  let curY = y - scrollY;

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

// ====== EVENT LISTENERS UNTUK SCROLL DIALOG ======
if (typeof window !== "undefined") {
  // 1. Pointer Drag (Mouse & Touch)
  window.addEventListener("pointerdown", (e) => {
    if (!lastClueId || !currentDialogBox) return;
    const { boxX, boxY, boxW, boxH } = currentDialogBox;
    if (e.clientX >= boxX && e.clientX <= boxX + boxW && e.clientY >= boxY && e.clientY <= boxY + boxH) {
      isDragging = true;
      dragStartY = e.clientY;
      dragStartScroll = dialogScrollY;
    }
  }, { passive: true });

  window.addEventListener("pointermove", (e) => {
    if (!isDragging || maxScrollY <= 0) return;
    const dy = e.clientY - dragStartY;
    dialogScrollY = Math.max(0, Math.min(maxScrollY, dragStartScroll - dy));
    isUserScrolled = true;
  }, { passive: true });

  const endDrag = () => {
    isDragging = false;
  };
  window.addEventListener("pointerup", endDrag, { passive: true });
  window.addEventListener("pointercancel", endDrag, { passive: true });

  // 2. Touch Events Fallback (Mobile)
  window.addEventListener("touchstart", (e) => {
    if (!lastClueId || !currentDialogBox || e.touches.length === 0) return;
    const t = e.touches[0];
    const { boxX, boxY, boxW, boxH } = currentDialogBox;
    if (t.clientX >= boxX && t.clientX <= boxX + boxW && t.clientY >= boxY && t.clientY <= boxY + boxH) {
      isDragging = true;
      dragStartY = t.clientY;
      dragStartScroll = dialogScrollY;
    }
  }, { passive: true });

  window.addEventListener("touchmove", (e) => {
    if (!isDragging || maxScrollY <= 0 || e.touches.length === 0) return;
    const t = e.touches[0];
    const dy = t.clientY - dragStartY;
    dialogScrollY = Math.max(0, Math.min(maxScrollY, dragStartScroll - dy));
    isUserScrolled = true;
  }, { passive: true });

  window.addEventListener("touchend", endDrag, { passive: true });

  // 3. Mouse Wheel (Desktop / Laptop)
  window.addEventListener("wheel", (e) => {
    if (!lastClueId || maxScrollY <= 0 || !currentDialogBox) return;
    const { boxX, boxY, boxW, boxH } = currentDialogBox;
    if (e.clientX >= boxX && e.clientX <= boxX + boxW && e.clientY >= boxY && e.clientY <= boxY + boxH) {
      dialogScrollY = Math.max(0, Math.min(maxScrollY, dialogScrollY + e.deltaY * 0.7));
      isUserScrolled = true;
    }
  }, { passive: true });

  // 4. Keyboard Navigation (Arrow Keys / Page Keys)
  window.addEventListener("keydown", (e) => {
    if (!lastClueId || maxScrollY <= 0) return;
    const key = e.key.toLowerCase();
    if (key === "arrowdown") {
      dialogScrollY = Math.min(maxScrollY, dialogScrollY + 38);
      isUserScrolled = true;
    } else if (key === "arrowup") {
      dialogScrollY = Math.max(0, dialogScrollY - 38);
      isUserScrolled = true;
    } else if (key === "pagedown") {
      dialogScrollY = Math.min(maxScrollY, dialogScrollY + 150);
      isUserScrolled = true;
    } else if (key === "pageup") {
      dialogScrollY = Math.max(0, dialogScrollY - 150);
      isUserScrolled = true;
    }
  });
}
