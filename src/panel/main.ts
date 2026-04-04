function initCanvas(
  name: string,
  drawBackground = false,
): HTMLCanvasElement | null {
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
    requestAnimationFrame(() => initCanvas(name, drawBackground));
    return canvas;
  }
  canvas.style.display = "block";
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  const ratio = window.devicePixelRatio || 1;
  ctx.canvas.width = Math.max(1, Math.floor(width * ratio));
  ctx.canvas.height = Math.max(1, Math.floor(height * ratio));
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

  if (drawBackground) {
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, "#1f1f38");
    grad.addColorStop(0.4, "#4b2f3c");
    grad.addColorStop(0.7, "#8c4a27");
    grad.addColorStop(1, "#e09d3c");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
  } else {
    ctx.clearRect(0, 0, width, height);
  }

  return canvas;
}

interface Star {
  x: number;
  y: number;
  radius: number;
  baseAlpha: number;
  phase: number;
  speed: number;
}

let _clockInterval: number | undefined;
let _starAnimation: number | undefined;
let _stars: Star[] = [];
function createStars(width: number, height: number) {
  const starCount = Math.max(40, Math.floor((width * height) / 14000));
  _stars = [];
  for (let i = 0; i < starCount; i++) {
    _stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.5 + 0.5,
      baseAlpha: Math.random() * 0.5 + 0.2,
      phase: Math.random() * Math.PI * 2,
      speed: Math.random() * 0.04 + 0.01,
    });
  }
}

function drawStars(): void {
  const canvas = document.getElementById(
    "foregroundEffectCanvas",
  ) as HTMLCanvasElement;
  const ctx = canvas?.getContext("2d") as CanvasRenderingContext2D | null;
  if (!canvas || !ctx) {
    return;
  }

  const width = canvas.width;
  const height = canvas.height;
  ctx.clearRect(0, 0, width, height);
  ctx.shadowColor = "rgba(255,255,255,0.9)";
  ctx.shadowBlur = 6;

  for (const star of _stars) {
    star.phase += star.speed;
    const flicker = 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(star.phase));
    const alpha = Math.min(1, star.baseAlpha * flicker);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function animateStars(): void {
  drawStars();
  _starAnimation = window.requestAnimationFrame(animateStars);
}
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

interface DrinkItem {
  name: string;
  recipe: string;
}

type PanelMessage =
  | {
      command: "init-drinks";
      drinks: Record<string, DrinkItem>;
      drinkBaseUri: string;
    }
  | { command: "random-drink" };

let drinks: Record<string, DrinkItem> = {};
let drinkBaseUri = "";

function getElement<T extends HTMLElement>(id: string): T | null {
  return document.getElementById(id) as T | null;
}

function updateDrinkDisplay(id: string): void {
  const drink = drinks[id];
  const nameEl = getElement<HTMLDivElement>("drinkName");
  const recipeEl = getElement<HTMLDivElement>("drinkRecipe");
  const drinkImg = document.querySelector<HTMLImageElement>(".drink");

  if (!drink) {
    return;
  }

  if (drinkImg) {
    drinkImg.src = `${drinkBaseUri}/${id}.png`;
    drinkImg.alt = drink.name;
  }

  if (nameEl) {
    nameEl.textContent = drink.name;
  }

  if (recipeEl) {
    recipeEl.innerHTML = drink.recipe.replace(/\n/g, "<br />");
  }
}

function setRandomDrink(): void {
  const keys = Object.keys(drinks);
  if (keys.length === 0) {
    return;
  }
  const id = keys[Math.floor(Math.random() * keys.length)];
  updateDrinkDisplay(id);
}

function handlePanelMessage(message: PanelMessage): void {
  if (message.command === "init-drinks") {
    drinks = message.drinks;
    drinkBaseUri = message.drinkBaseUri;
    setRandomDrink();
    return;
  }

  if (message.command === "random-drink") {
    setRandomDrink();
  }
}

window.addEventListener("message", (event) => {
  handlePanelMessage(event.data as PanelMessage);
});

function initForegroundCanvas(): void {
  const canvas = initCanvas("foregroundEffectCanvas", false);
  if (!canvas) {
    return;
  }
  const width = canvas.width;
  const height = canvas.height;
  createStars(width, height);
  if (_starAnimation) {
    window.cancelAnimationFrame(_starAnimation);
  }
  animateStars();
}

export function cocktailPanelApp() {
  initCanvas("backgroundEffectCanvas", true);
  initForegroundCanvas();
  initClock();

  window.addEventListener("resize", () => {
    initCanvas("backgroundEffectCanvas", true);
    initForegroundCanvas();
  });
}

const vscode = (window as any).acquireVsCodeApi();

function notifyExtensionReady(): void {
  vscode.postMessage({ command: "ready" });
}

function setupPanel(): void {
  initCanvas("backgroundEffectCanvas", true);
  initForegroundCanvas();
  initClock();
  notifyExtensionReady();
  window.addEventListener("resize", () => {
    initCanvas("backgroundEffectCanvas", true);
    initForegroundCanvas();
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", setupPanel);
} else {
  setupPanel();
}
