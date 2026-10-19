export const keys = {};

window.addEventListener("keydown", (e) => {
  keys[e.key.toLowerCase()] = true;
});
window.addEventListener("keyup", (e) => {
  keys[e.key.toLowerCase()] = false;
});

export function isDown(...names) {
  return names.some((n) => keys[n]);
}

export function setKey(name, isPressed) {
  keys[name.toLowerCase()] = isPressed;
}

// Inisialisasi kontrol sentuh virtual untuk Mobile & Tablet
export function setupVirtualControls() {
  const dpad = document.getElementById("dpad-container");
  const actionBtn = document.getElementById("actionBtn");

  if (!dpad || !actionBtn) return;

  const dpadButtons = dpad.querySelectorAll(".dpad-btn");

  function getButtonAtPoint(clientX, clientY) {
    const el = document.elementFromPoint(clientX, clientY);
    return el ? el.closest(".dpad-btn") : null;
  }

  function clearDpad() {
    dpadButtons.forEach((btn) => {
      const k = btn.dataset.key;
      if (k) setKey(k, false);
      btn.classList.remove("active");
    });
  }

  function handleTouchDpad(e) {
    e.preventDefault();
    if (!e.targetTouches || e.targetTouches.length === 0) return;
    const touch = e.targetTouches[0];
    const btn = getButtonAtPoint(touch.clientX, touch.clientY);

    dpadButtons.forEach((b) => {
      const k = b.dataset.key;
      if (b === btn) {
        setKey(k, true);
        b.classList.add("active");
      } else {
        setKey(k, false);
        b.classList.remove("active");
      }
    });
  }

  dpad.addEventListener("touchstart", handleTouchDpad, { passive: false });
  dpad.addEventListener("touchmove", handleTouchDpad, { passive: false });
  dpad.addEventListener("touchend", (e) => {
    e.preventDefault();
    clearDpad();
  }, { passive: false });
  dpad.addEventListener("touchcancel", (e) => {
    e.preventDefault();
    clearDpad();
  }, { passive: false });

  // Action Button Touch
  function handleActionStart(e) {
    e.preventDefault();
    setKey("e", true);
    actionBtn.classList.add("active");
  }

  function handleActionEnd(e) {
    e.preventDefault();
    setKey("e", false);
    actionBtn.classList.remove("active");
  }

  actionBtn.addEventListener("touchstart", handleActionStart, { passive: false });
  actionBtn.addEventListener("touchend", handleActionEnd, { passive: false });
  actionBtn.addEventListener("touchcancel", handleActionEnd, { passive: false });

  // Mouse fallback untuk pengetesan di browser
  actionBtn.addEventListener("mousedown", handleActionStart);
  window.addEventListener("mouseup", () => {
    setKey("e", false);
    actionBtn.classList.remove("active");
    clearDpad();
  });
  dpadButtons.forEach((b) => {
    b.addEventListener("mousedown", (e) => {
      e.preventDefault();
      setKey(b.dataset.key, true);
      b.classList.add("active");
    });
  });
}

