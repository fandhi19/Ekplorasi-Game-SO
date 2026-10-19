const images = new Map();
const pending = [];

export function loadImage(key, src) {
  const img = new Image();
  const p = new Promise((resolve, reject) => {
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Gagal load: " + src));
  });
  images.set(key, img);
  img.src = src;
  pending.push(p);
  return p;
}

export async function loadAll() {
  await Promise.all(pending);
}

export function get(key) {
  return images.get(key);
}
