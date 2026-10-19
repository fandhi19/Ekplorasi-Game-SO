// ============================================
// SISTEM KUIS / TANTANGAN TEBAK-TEBAKAN PETI
// ============================================
import { playLocked, playVictory, playBeep } from "./audio.js";
import { spawnPop } from "./particles.js";

let activeQuizClue = null;
let onCorrectAction = null;
let quizAnswered = false;
let lockCountdownTimer = null;
let remainingSeconds = 0;

export function isQuizOpen() {
  const modal = document.getElementById("quizModal");
  return modal && modal.style.display !== "none";
}

export function openQuiz(clue, onCorrect) {
  if (!clue.quiz) return;
  activeQuizClue = clue;
  onCorrectAction = onCorrect;
  quizAnswered = false;

  // Bersihkan timer tunggu sebelumnya jika ada
  if (lockCountdownTimer) {
    clearInterval(lockCountdownTimer);
    lockCountdownTimer = null;
  }
  remainingSeconds = 0;

  const modal = document.getElementById("quizModal");
  const title = document.getElementById("quizTitle");
  const question = document.getElementById("quizQuestion");
  const optionsContainer = document.getElementById("quizOptions");
  const feedback = document.getElementById("quizFeedback");

  if (!modal || !question || !optionsContainer) return;

  title.textContent = clue.title || "Tantangan Buka Peti";
  question.textContent = clue.quiz.question;
  optionsContainer.innerHTML = "";

  if (feedback) {
    feedback.style.display = "none";
    feedback.className = "quiz-feedback";
    feedback.textContent = "";
  }

  const optionLetters = ["A", "B", "C", "D"];
  clue.quiz.options.forEach((optText, index) => {
    const btn = document.createElement("button");
    btn.className = "quiz-opt-btn";
    btn.setAttribute("data-index", index);

    const prefix = document.createElement("span");
    prefix.className = "opt-badge";
    prefix.textContent = optionLetters[index];

    const label = document.createElement("span");
    label.className = "opt-text";
    label.textContent = optText;

    btn.appendChild(prefix);
    btn.appendChild(label);

    btn.addEventListener("click", () => handleSelectOption(index, btn));
    optionsContainer.appendChild(btn);
  });

  modal.style.display = "flex";
  playBeep();
}

export function closeQuiz() {
  const modal = document.getElementById("quizModal");
  if (modal) {
    modal.style.display = "none";
  }

  if (lockCountdownTimer) {
    clearInterval(lockCountdownTimer);
    lockCountdownTimer = null;
  }
  remainingSeconds = 0;

  activeQuizClue = null;
  onCorrectAction = null;
  quizAnswered = false;
}

function handleSelectOption(selectedIndex, btnElement) {
  // Jika kuis sudah selesai, sedang cooldown 5 detik, atau clue kosong: abaikan
  if (quizAnswered || !activeQuizClue || remainingSeconds > 0) return;

  const quiz = activeQuizClue.quiz;
  const feedback = document.getElementById("quizFeedback");
  const allButtons = document.querySelectorAll(".quiz-opt-btn");

  // ===== JAWABAN BENAR =====
  if (selectedIndex === quiz.correctIndex) {
    quizAnswered = true;
    playVictory();
    btnElement.classList.add("correct");

    if (feedback) {
      feedback.innerHTML = "🎉 <strong>BENAR SEKALI!</strong> Peti berhasil dibuka!";
      feedback.className = "quiz-feedback success";
      feedback.style.display = "block";
    }

    // Spawn partikel letupan kembang api
    spawnPop(activeQuizClue.x + activeQuizClue.w / 2, activeQuizClue.y + activeQuizClue.h / 2);

    // Kunci seluruh tombol
    allButtons.forEach((b) => (b.disabled = true));

    // SIMPAN callback & clue SEBELUM closeQuiz() mengosongkannya
    const clueUnlocked = activeQuizClue;
    const callback = onCorrectAction;

    // Tutup kuis dan buka dialog informasi dari peti
    setTimeout(() => {
      closeQuiz();
      if (typeof callback === "function") {
        callback(clueUnlocked);
      }
    }, 700);
    return;
  }

  // ===== JAWABAN SALAH =====
  // 1. Suara salah & efek goyang merah pada tombol yang diklik
  playLocked();
  btnElement.classList.add("wrong");

  // 2. Kunci seluruh tombol pilihan
  allButtons.forEach((b) => (b.disabled = true));

  // 3. Murid harus menunggu selama 5 detik, jawaban yang benar TIDAK diberitahu
  remainingSeconds = 5;

  const updateCountdownDisplay = () => {
    if (feedback) {
      feedback.innerHTML = `❌ <strong>Jawaban belum tepat!</strong><br>⏳ Tunggu <strong>${remainingSeconds}</strong> detik untuk bisa mencoba lagi...`;
      feedback.className = "quiz-feedback error";
      feedback.style.display = "block";
    }
  };

  updateCountdownDisplay();

  if (lockCountdownTimer) clearInterval(lockCountdownTimer);
  lockCountdownTimer = setInterval(() => {
    remainingSeconds--;
    if (remainingSeconds > 0) {
      updateCountdownDisplay();
    } else {
      clearInterval(lockCountdownTimer);
      lockCountdownTimer = null;

      // Buka kembali tombol agar murid bisa mencoba lagi
      allButtons.forEach((b) => {
        b.disabled = false;
        b.classList.remove("wrong");
      });

      if (feedback) {
        feedback.innerHTML = "💡 <strong>Waktu tunggu selesai!</strong> Silakan pikirkan dan pilih jawabanmu lagi.";
        feedback.className = "quiz-feedback";
        feedback.style.display = "block";
      }
    }
  }, 1000);
}

// Inisialisasi listener tombol cancel & keyboard
export function initQuizListeners() {
  const cancelBtn = document.getElementById("quizCancelBtn");
  if (cancelBtn) {
    cancelBtn.addEventListener("click", () => {
      playBeep();
      closeQuiz();
    });
  }

  window.addEventListener("keydown", (e) => {
    if (!isQuizOpen()) return;

    if (e.key === "Escape") {
      closeQuiz();
      return;
    }

    // Jika sedang cooldown 5 detik atau kuis sudah terjawab, jangan proses tombol keyboard
    if (remainingSeconds > 0 || quizAnswered) return;

    const key = e.key.toLowerCase();
    const map = { a: 0, 1: 0, b: 1, 2: 1, c: 2, 3: 2, d: 3, 4: 3 };
    if (key in map) {
      const idx = map[key];
      const buttons = document.querySelectorAll(".quiz-opt-btn");
      if (buttons[idx] && !buttons[idx].disabled) {
        buttons[idx].click();
      }
    }
  });
}
