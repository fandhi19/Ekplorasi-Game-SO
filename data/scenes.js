// ============================================
// HELPER: Bikin tembok keliling dengan pintu
// ============================================
function makeWalls(worldW, worldH, wallSize, doorW) {
  const doorLeft = Math.floor(worldW / 2 - doorW / 2);
  const doorRight = Math.floor(worldW / 2 + doorW / 2);
  return [
    { x: 0, y: 0, w: worldW, h: wallSize }, // atas
    { x: 0, y: 0, w: wallSize, h: worldH }, // kiri
    { x: worldW - wallSize, y: 0, w: wallSize, h: worldH }, // kanan
    { x: 0, y: worldH - wallSize, w: doorLeft, h: wallSize }, // bawah kiri
    { x: doorRight, y: worldH - wallSize, w: worldW - doorRight, h: wallSize }, // bawah kanan
  ];
}

export const scenes = {
  // ============ OUTDOOR ============
  outdoor: {
    image: "world",
    worldW: 3000,
    worldH: 2000,
    playerStart: { x: 1462, y: 990 },
    blockers: [
      // --- RUANG KELAS A ---
      { x: 90, y: 100, w: 680, h: 5 },
      { x: 90, y: 100, w: 5, h: 840 },
      { x: 690, y: 100, w: 5, h: 840 },
      { x: 90, y: 940, w: 230, h: 5 },
      { x: 480, y: 940, w: 220, h: 5 },
      { x: 180, y: 380, w: 460, h: 320 },

      // --- RUANG KELAS B ---
      { x: 800, y: 200, w: 750, h: 5 },
      { x: 800, y: 100, w: 5, h: 840 },
      { x: 1430, y: 100, w: 5, h: 840 },
      { x: 800, y: 940, w: 270, h: 5 },
      { x: 1180, y: 940, w: 250, h: 5 },
      { x: 870, y: 350, w: 490, h: 340 },

      // --- PERPUSTAKAAN ---
      { x: 1475, y: 200, w: 720, h: 5 },
      { x: 1550, y: 40, w: 5, h: 900 },
      { x: 2190, y: 40, w: 5, h: 900 },
      { x: 1550, y: 940, w: 270, h: 5 },
      { x: 1930, y: 940, w: 260, h: 5 },
      { x: 1645, y: 350, w: 470, h: 300 },

      // --- KANTIN ---
      { x: 2145, y: 100, w: 770, h: 5 },
      { x: 2290, y: 90, w: 5, h: 640 },
      { x: 2890, y: 100, w: 5, h: 1000 },
      { x: 2290, y: 740, w: 220, h: 5 },
      { x: 2630, y: 940, w: 270, h: 5 },
      { x: 2290, y: 830, w: 245, h: 120 },
      { x: 2350, y: 290, w: 470, h: 300 },

      // --- UKS ---
      { x: 80, y: 1040, w: 570, h: 5 },
      { x: 90, y: 1040, w: 5, h: 880 },
      { x: 630, y: 1040, w: 5, h: 580 },
      { x: 630, y: 1720, w: 5, h: 180 },
      { x: 90, y: 1880, w: 570, h: 5 },
      { x: 200, y: 1200, w: 328, h: 260 },

      // --- TAMAN TENGAH ---
      { x: 730, y: 1040, w: 280, h: 5 },
      { x: 1100, y: 1040, w: 330, h: 5 },
      { x: 730, y: 1040, w: 5, h: 330 },
      { x: 730, y: 1510, w: 5, h: 370 },
      { x: 580, y: 1880, w: 820, h: 5 },
      { x: 1430, y: 1040, w: 5, h: 330 },
      { x: 1430, y: 1510, w: 5, h: 370 },

      // --- LAPANGAN UPACARA ---
      { x: 1550, y: 1050, w: 220, h: 5 },
      { x: 1970, y: 1050, w: 220, h: 5 },
      { x: 1575, y: 1880, w: 670, h: 5 },
      { x: 2180, y: 1050, w: 5, h: 880 },
      { x: 1550, y: 1050, w: 5, h: 880 },

      // --- KANTOR SEKOLAH ---
      { x: 2300, y: 1050, w: 730, h: 5 },
      { x: 2300, y: 1050, w: 5, h: 620 },
      { x: 2880, y: 1050, w: 5, h: 880 },
      { x: 2300, y: 1880, w: 700, h: 5 },
      { x: 2480, y: 1200, w: 300, h: 240 },

      // --- BATAS LUAR ---
      { x: 0, y: 0, w: 3000, h: 5 },
      { x: 0, y: 0, w: 5, h: 2000 },
      { x: 2980, y: 0, w: 5, h: 2000 },
      { x: 0, y: 1980, w: 1400, h: 5 },
      { x: 1600, y: 1980, w: 1400, h: 5 },
    ],
  },

  // ============ INTERIOR ============
  uks: {
    image: "interior_uks",
    worldW: 1920,
    worldH: 1080,
    playerStart: { x: 960, y: 900 },
    blockers: [
      // ===== TEMBOK KELILING (dengan pintu di tengah bawah) =====
      { x: 0, y: 0, w: 1920, h: 80 }, // atas
      { x: 0, y: 0, w: 80, h: 1080 }, // kiri
      { x: 1840, y: 0, w: 80, h: 1080 }, // kanan
      { x: 0, y: 1000, w: 860, h: 80 }, // bawah kiri (pintu 860-1060)
      { x: 1060, y: 1000, w: 860, h: 80 }, // bawah kanan

      // ===== 2 TEMPAT TIDUR (kiri) =====
      { x: 80, y: 340, w: 200, h: 80 }, // kasur atas
      { x: 80, y: 660, w: 200, h: 80 }, // kasur bawah

      // ===== LEMARI OBAT (atas tengah) =====
      { x: 850, y: 60, w: 300, h: 160 },

      // ===== WAStafel + lemari kecil (kanan atas) =====
      { x: 1550, y: 100, w: 240, h: 120 }, // wastafel

      // ===== MEJA + KURSI DOKTER (kanan tengah) =====
      { x: 1520, y: 430, w: 170, h: 210 },

      // ===== KURSI/TABUNG KECIL (kanan bawah) =====
      { x: 1700, y: 730, w: 120, h: 90 },

      // ===== KOTAK P3K (bawah tengah) =====
      { x: 660, y: 920, w: 140, h: 90 },
    ],
  },
  kelas_a: {
    image: "interior_kelas_a",
    worldW: 1920,
    worldH: 1080,
    playerStart: { x: 960, y: 900 },
    blockers: [
      // ===== TEMBOK KELILING (dengan pintu di tengah bawah) =====
      { x: 0, y: 0, w: 1920, h: 80 }, // atas
      { x: 90, y: 0, w: 80, h: 1080 }, // kiri
      { x: 1740, y: 0, w: 80, h: 1080 }, // kanan
      { x: 0, y: 1000, w: 860, h: 80 }, // bawah kiri (pintu 860-1060)
      { x: 1060, y: 1000, w: 860, h: 80 }, // bawah kanan

      // ===== MEJA GURU (atas tengah) =====
      { x: 837, y: 160, w: 250, h: 100 },

      // ===== MEJA KOLOM 1 =====
      { x: 390, y: 330, w: 170, h: 70 }, // kolom 1 (paling kiri)1
      { x: 390, y: 470, w: 170, h: 70 }, // kolom 1 (paling kiri)2
      { x: 390, y: 612, w: 170, h: 70 }, // kolom 1 (paling kiri)3
      { x: 390, y: 770, w: 170, h: 70 }, // kolom 1 (paling kiri)4

      // ===== MEJA KOLOM 2 =====
      { x: 693, y: 330, w: 170, h: 70 }, // kolom 1 (paling kiri)1
      { x: 693, y: 470, w: 170, h: 70 }, // kolom 1 (paling kiri)2
      { x: 693, y: 612, w: 170, h: 70 }, // kolom 1 (paling kiri)3
      { x: 693, y: 770, w: 170, h: 70 }, // kolom 1 (paling kiri)4

      // ===== MEJA KOLOM 3 =====
      { x: 1050, y: 330, w: 170, h: 70 }, // kolom 1 (paling kiri)1
      { x: 1050, y: 470, w: 170, h: 70 }, // kolom 1 (paling kiri)2
      { x: 1050, y: 612, w: 170, h: 70 }, // kolom 1 (paling kiri)3
      { x: 1050, y: 770, w: 170, h: 70 }, // kolom 1 (paling kiri)4

      // ===== MEJA KOLOM 4 =====
      { x: 1355, y: 330, w: 170, h: 70 }, // kolom 1 (paling kiri)1
      { x: 1355, y: 470, w: 170, h: 70 }, // kolom 1 (paling kiri)2
      { x: 1355, y: 612, w: 170, h: 70 }, // kolom 1 (paling kiri)3
      { x: 1355, y: 770, w: 170, h: 70 }, // kolom 1 (paling kiri)4

      // ===== LEMARI KECIL KANAN BAWAH =====
      { x: 1300, y: 960, w: 220, h: 130 },
    ],
  },

  kelas_b: {
    image: "interior_kelas_b",
    worldW: 1920,
    worldH: 1080,
    playerStart: { x: 960, y: 900 },
    blockers: [
      // ===== TEMBOK KELILING (dengan pintu di tengah bawah) =====
      { x: 0, y: 0, w: 1920, h: 80 }, // atas
      { x: 90, y: 0, w: 80, h: 1080 }, // kiri
      { x: 1740, y: 0, w: 80, h: 1080 }, // kanan
      { x: 0, y: 1000, w: 860, h: 80 }, // bawah kiri (pintu 860-1060)
      { x: 1060, y: 1000, w: 860, h: 80 }, // bawah kanan

      // ===== MEJA GURU (atas tengah) =====
      { x: 837, y: 160, w: 250, h: 100 },

      // ===== MEJA KOLOM 1 =====
      { x: 390, y: 330, w: 170, h: 70 }, // kolom 1 (paling kiri)1
      { x: 390, y: 470, w: 170, h: 70 }, // kolom 1 (paling kiri)2
      { x: 390, y: 612, w: 170, h: 70 }, // kolom 1 (paling kiri)3
      { x: 390, y: 770, w: 170, h: 70 }, // kolom 1 (paling kiri)4

      // ===== MEJA KOLOM 2 =====
      { x: 693, y: 330, w: 170, h: 70 }, // kolom 1 (paling kiri)1
      { x: 693, y: 470, w: 170, h: 70 }, // kolom 1 (paling kiri)2
      { x: 693, y: 612, w: 170, h: 70 }, // kolom 1 (paling kiri)3
      { x: 693, y: 770, w: 170, h: 70 }, // kolom 1 (paling kiri)4

      // ===== MEJA KOLOM 3 =====
      { x: 1050, y: 330, w: 170, h: 70 }, // kolom 1 (paling kiri)1
      { x: 1050, y: 470, w: 170, h: 70 }, // kolom 1 (paling kiri)2
      { x: 1050, y: 612, w: 170, h: 70 }, // kolom 1 (paling kiri)3
      { x: 1050, y: 770, w: 170, h: 70 }, // kolom 1 (paling kiri)4

      // ===== MEJA KOLOM 4 =====
      { x: 1355, y: 330, w: 170, h: 70 }, // kolom 1 (paling kiri)1
      { x: 1355, y: 470, w: 170, h: 70 }, // kolom 1 (paling kiri)2
      { x: 1355, y: 612, w: 170, h: 70 }, // kolom 1 (paling kiri)3
      { x: 1355, y: 770, w: 170, h: 70 }, // kolom 1 (paling kiri)4

      // ===== LEMARI KECIL KANAN BAWAH =====
      { x: 1300, y: 960, w: 220, h: 130 },
    ],
  },
  perpus: {
    image: "interior_perpus",
    worldW: 1920,
    worldH: 1080,
    playerStart: { x: 960, y: 900 },
    blockers: [
      // ===== TEMBOK KELILING =====
      { x: 0, y: 0, w: 1920, h: 80 }, // atas
      { x: 0, y: 0, w: 80, h: 1080 }, // kiri
      { x: 1840, y: 0, w: 80, h: 1080 }, // kanan
      { x: 0, y: 1000, w: 860, h: 80 }, // bawah kiri (pintu 860-1060)
      { x: 1060, y: 1000, w: 860, h: 80 }, // bawah kanan

      // ===== RAK BUKU ATAS (4 blok) =====
      { x: 190, y: 100, w: 560, h: 90 },
      { x: 1180, y: 100, w: 560, h: 90 },

      // ===== RAK BUKU KIRI (2 kolom vertikal) =====
      { x: 140, y: 260, w: 100, h: 590 },
      { x: 290, y: 260, w: 97, h: 590 },
      { x: 463, y: 260, w: 60, h: 590 },

      // ===== RAK BUKU KANAN (2 kolom vertikal) =====
      { x: 1470, y: 260, w: 105, h: 750 },
      { x: 1660, y: 260, w: 105, h: 750 },

      // ===== MEJA SIRKULASI ATAS =====
      { x: 820, y: 268, w: 290, h: 80 },

      // ===== MEJA TENGAH (3 meja) =====
      { x: 565, y: 510, w: 230, h: 100 },
      { x: 867, y: 510, w: 230, h: 100 },
      { x: 1153, y: 510, w: 230, h: 100 },

      // ===== RAK BUKU BAWAH =====
      { x: 170, y: 920, w: 540, h: 100 },

      // ===== MEJA RESEPSIONIS BAWAH =====
      { x: 726, y: 900, w: 620, h: 80 },
    ],
  },
  kantin: {
    image: "interior_kantin",
    worldW: 1920,
    worldH: 1080,
    playerStart: { x: 960, y: 900 },
    blockers: [
      // ===== TEMBOK KELILING =====
      { x: 0, y: 0, w: 1920, h: 80 }, // atas
      { x: 90, y: 0, w: 80, h: 1080 }, // kiri
      { x: 1760, y: 0, w: 80, h: 1080 }, // kanan
      { x: 0, y: 1000, w: 860, h: 80 }, // bawah kiri (pintu 860-1060)
      { x: 1060, y: 1000, w: 860, h: 80 }, // bawah kanan

      // ===== BAR KAYU ATAS (counter panjang) =====
      { x: 480, y: 80, w: 920, h: 70 },

      // ===== MENU SIGN (kiri atas) =====
      { x: 210, y: 60, w: 250, h: 90 },

      // ===== COUNTER KASIR + NASI GORENG =====
      { x: 240, y: 220, w: 450, h: 110 },

      // ===== COUNTER LALAPAN (tengah) =====
      { x: 740, y: 220, w: 450, h: 110 },

      // ===== COUNTER MINUMAN (kanan) =====
      { x: 1220, y: 220, w: 450, h: 110 },

      // ===== 6 MEJA MAKAN (2 baris × 3 kolom) =====
      // Baris atas
      { x: 350, y: 420, w: 180, h: 210 }, // kiri
      { x: 870, y: 420, w: 180, h: 210 }, // tengah
      { x: 1390, y: 420, w: 190, h: 210 }, // kanan

      // Baris bawah
      { x: 350, y: 700, w: 180, h: 210 }, // kiri
      { x: 870, y: 700, w: 180, h: 210 }, // tengah
      { x: 1390, y: 700, w: 190, h: 210 }, // kanan
    ],
  },
  kantor: {
    image: "interior_kantor",
    worldW: 1920,
    worldH: 1080,
    playerStart: { x: 960, y: 850 },
    blockers: [
      // ===== TEMBOK KELILING =====
      { x: 0, y: 0, w: 1920, h: 80 }, // atas
      { x: 0, y: 0, w: 80, h: 1080 }, // kiri
      { x: 1840, y: 0, w: 80, h: 1080 }, // kanan
      { x: 0, y: 1000, w: 860, h: 80 }, // bawah kiri (pintu 860-1060)
      { x: 1060, y: 1000, w: 860, h: 80 }, // bawah kanan

      // ===== LEMARI FILE (kiri atas, vertikal) =====
      { x: 120, y: 100, w: 150, h: 370 },

      // ===== MEJA KEPALA SEKOLAH (atas tengah) =====
      { x: 750, y: 130, w: 390, h: 140 },

      // ===== RAK TROFI (kanan atas) =====
      { x: 1400, y: 60, w: 400, h: 200 },

      // ===== MEJA KOPI KECIL (samping sofa) =====
      { x: 390, y: 590, w: 100, h: 200 },

      // ===== MEJA RAPAT + KURSI (kanan bawah) =====
      { x: 1250, y: 630, w: 300, h: 120 },
    ],
  },
};

// ============================================
// PINTU MASUK/KELUAR
// ============================================
export const entrances = [
  // Pintu masuk dari outdoor
  { from: "outdoor", x: 379, y: 710, radius: 80, to: "kelas_a", spawnX: 935, spawnY: 730, label: "Masuk Kelas A" },
  { from: "outdoor", x: 1095, y: 710, radius: 80, to: "kelas_b", spawnX: 935, spawnY: 730, label: "Masuk Kelas B" },
  { from: "outdoor", x: 1838, y: 670, radius: 80, to: "perpus", spawnX: 923, spawnY: 201, label: "Masuk Perpustakaan" },
  { from: "outdoor", x: 2548, y: 600, radius: 80, to: "kantin", spawnX: 667, spawnY: 858, label: "Masuk Kantin" },
  { from: "outdoor", x: 2592, y: 1460, radius: 80, to: "kantor", spawnX: 935, spawnY: 730, label: "Masuk Kantor" },
  { from: "outdoor", x: 340, y: 1460, radius: 80, to: "uks", spawnX: 938, spawnY: 730, label: "Masuk UKS" },

  // Pintu keluar dari interior
  { from: "kelas_a", x: 960, y: 980, radius: 80, to: "outdoor", spawnX: 379, spawnY: 780, label: "Keluar" },
  { from: "kelas_b", x: 960, y: 980, radius: 80, to: "outdoor", spawnX: 1095, spawnY: 780, label: "Keluar" },
  { from: "perpus", x: 960, y: 180, radius: 80, to: "outdoor", spawnX: 1838, spawnY: 740, label: "Keluar" },
  { from: "kantin", x: 960, y: 980, radius: 80, to: "outdoor", spawnX: 2548, spawnY: 670, label: "Keluar" },
  { from: "kantor", x: 960, y: 980, radius: 80, to: "outdoor", spawnX: 2592, spawnY: 1530, label: "Keluar" },
  { from: "uks", x: 960, y: 980, radius: 80, to: "outdoor", spawnX: 340, spawnY: 1530, label: "Keluar" },
];
