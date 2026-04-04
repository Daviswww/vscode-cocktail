function initCanvas(name: string): HTMLCanvasElement | null {
  const canvas = document.getElementById(name) as HTMLCanvasElement;
  if (!canvas) {
    console.log("Canvas not ready");
    return null;
  }
  const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
  if (!ctx) {
    console.log("Canvas context not ready");
    return null;
  }
  // Prefer the canvas's layout size so drawing matches display size
  const rect = canvas.getBoundingClientRect();
  const container = canvas.parentElement ?? canvas;
  const width = rect.width || container.clientWidth || window.innerWidth;
  const height = rect.height || container.clientHeight || window.innerHeight;
  // If layout hasn't settled yet, try again on next frame
  if (width === 0 || height === 0) {
    requestAnimationFrame(() => initCanvas(name));
    return canvas;
  }
  canvas.style.display = "block";
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  const ratio = window.devicePixelRatio || 1;
  ctx.canvas.width = Math.max(1, Math.floor(width * ratio));
  ctx.canvas.height = Math.max(1, Math.floor(height * ratio));
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  // draw a vertical gradient background
  const grad = ctx.createLinearGradient(0, 0, 0, height);
  grad.addColorStop(0, "#0b3d91");
  grad.addColorStop(0.5, "#3b82f6");
  grad.addColorStop(1, "#00d4ff");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  return canvas;
}

let _clockInterval: number | undefined;
function pad(n: number): string {
  return n < 10 ? "0" + n : String(n);
}

export function initClock(): void {
  // clear previous interval if any
  if (_clockInterval) {
    window.clearInterval(_clockInterval);
    _clockInterval = undefined;
  }

  const t = document.getElementById("time");
  const d = document.getElementById("date");

  function update() {
    const now = new Date();
    if (t) {
      t.textContent = now.toLocaleTimeString();
    }
    if (d) {
      d.textContent = now.toLocaleDateString();
    }
  }

  _clockInterval = window.setInterval(update, 1000);
  update();
}

export function cocktailPanelApp(
  basePetUri: string,
  throwBallWithMouse: boolean,
  disableEffects: boolean,
) {
  initCanvas("backgroundEffectCanvas");
  initClock();
  window.addEventListener("resize", function () {
    initCanvas("backgroundEffectCanvas");
  });
}

function setupPanel(): void {
  initCanvas("backgroundEffectCanvas");
  initClock();
  window.addEventListener("resize", function () {
    initCanvas("backgroundEffectCanvas");
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", setupPanel);
} else {
  setupPanel();
}
