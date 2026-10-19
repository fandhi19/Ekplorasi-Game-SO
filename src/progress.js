// ============================================
// PROGRESS — IN-MEMORY ONLY
// ============================================
// Progress HILANG saat refresh / tutup tab.
// Tidak ada localStorage. Setiap murid mulai fresh.

const readSet = new Set();
const keysSet = new Set();
const openedChestsSet = new Set(); // ← TAMBAHAN: state peti yang sudah dibuka

// ====== READ (clue yang sudah dibaca) ======
export function markRead(id) {
  readSet.add(id);
}

export function isRead(id) {
  return readSet.has(id);
}

export function getProgress(clues) {
  const total = clues.length;
  const done = clues.filter((c) => readSet.has(c.id)).length;
  return { done, total };
}

// ====== KEYS (kunci yang sudah diambil) ======
export function addKey(keyId) {
  keysSet.add(keyId);
}

export function hasKey(keyId) {
  return keysSet.has(keyId);
}

export function getAllKeys() {
  return [...keysSet];
}

// ====== CHESTS (peti yang sudah dibuka) ======
// State permanen: sekali dibuka, tetap terbuka
export function markChestOpened(chestId) {
  openedChestsSet.add(chestId);
}

export function isChestOpened(chestId) {
  return openedChestsSet.has(chestId);
}

// ====== RESET ======
export function resetProgress() {
  readSet.clear();
  keysSet.clear();
  openedChestsSet.clear();
}
