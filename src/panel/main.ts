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
let _confettiEndTime = 0;
let _confettiFadeStart = 0;
let _stars: Star[] = [];

interface ConfettiParticle {
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  size: number;
  rotation: number;
  rotationSpeed: number;
  color: string;
  opacity: number;
}

let _confetti: ConfettiParticle[] = [];

function createConfetti(width: number, count = 28) {
  _confetti = [];
  const colors = ["#e63946", "#f4a261", "#2a9d8f", "#264653", "#e9c46a"];
  for (let i = 0; i < count; i++) {
    _confetti.push({
      x: Math.random() * width,
      y: -Math.random() * 80,
      velocityX: Math.random() * 1.4 - 0.7,
      velocityY: Math.random() * 2 + 2.4,
      size: Math.random() * 8 + 4,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: Math.random() * 0.14 + 0.04,
      color: colors[Math.floor(Math.random() * colors.length)],
      opacity: 0.85 + Math.random() * 0.15,
    });
  }
  const now = performance.now();
  _confettiEndTime = now + 2000;
  _confettiFadeStart = _confettiEndTime - 500;
}

function createStars(width: number, height: number) {
  const starCount = Math.max(40, Math.floor((width * height) / 14000));
  _stars = [];
  for (let i = 0; i < starCount; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    _stars.push({
      x,
      y,
      radius: Math.random() * 1.5 + 0.5,
      baseAlpha: Math.random() * 0.4 + 0.3,
      phase: Math.random() * Math.PI * 2,
      speed: Math.random() * 0.01 + 0.003,
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
  const now = performance.now();

  ctx.clearRect(0, 0, width, height);
  ctx.shadowColor = "rgba(255,255,255,0.9)";
  ctx.shadowBlur = 6;
  ctx.globalCompositeOperation = "lighter";

  for (const star of _stars) {
    star.phase += star.speed;
    const flicker =
      0.35 + 0.65 * (0.5 + 0.5 * Math.sin(star.phase + now * 0.001));
    const alpha = Math.min(1, star.baseAlpha * flicker);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
    ctx.fill();
  }

  if (_confetti.length > 0) {
    const now = performance.now();
    const fadeFactor =
      now >= _confettiFadeStart
        ? Math.max(0, 1 - (now - _confettiFadeStart) / 500)
        : 1;

    ctx.globalCompositeOperation = "source-over";
    for (const confetto of _confetti) {
      confetto.x += confetto.velocityX;
      confetto.y += confetto.velocityY;
      confetto.rotation += confetto.rotationSpeed;
      if (confetto.y > height + confetto.size) {
        confetto.y = -confetto.size;
        confetto.x = Math.random() * width;
      }

      ctx.save();
      ctx.translate(confetto.x, confetto.y);
      ctx.rotate(confetto.rotation);
      ctx.globalAlpha = confetto.opacity * fadeFactor;
      ctx.fillStyle = confetto.color;
      ctx.fillRect(
        -confetto.size / 2,
        -confetto.size / 2,
        confetto.size,
        confetto.size * 0.35,
      );
      ctx.restore();
    }
    ctx.globalAlpha = 1;

    if (now >= _confettiEndTime + 500) {
      _confetti = [];
    }
  }

  ctx.globalCompositeOperation = "source-over";
}

function animateStars(): void {
  drawStars();
  _starAnimation = window.requestAnimationFrame(animateStars);
}
interface DrinkItem {
  name: string;
  recipe: string;
  description: string;
  method: string;
}

type PanelMessage =
  | {
      command: "init-drinks";
      drinks: Record<string, DrinkItem>;
      drinkBaseUri: string;
    }
  | { command: "random-drink" }
  | { command: "key-press" };

let drinks: Record<string, DrinkItem> = {};
let drinkBaseUri = "";
let _currentDrinkId: string | null = null;

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

  _currentDrinkId = id;
  postCurrentDrinkDescription(drink);

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

let _drinkAnimating = false;
function animateDrinkChange(id: string): void {
  const drinkImg = document.querySelector<HTMLImageElement>(".drink");
  const recipePanel = document.querySelector<HTMLDivElement>(".recipe-panel");
  const nameEl = getElement<HTMLDivElement>("drinkName");
  const recipeEl = getElement<HTMLDivElement>("drinkRecipe");
  const drink = drinks[id];

  if (!drink || !drinkImg || !recipePanel) {
    updateDrinkDisplay(id);
    return;
  }

  _currentDrinkId = id;
  postCurrentDrinkDescription(drink);

  if (_drinkAnimating) {
    return;
  }

  _drinkAnimating = true;
  drinkImg.classList.add("drink-change-out");
  recipePanel.classList.add("recipe-panel-change-out");

  const finishOut = () => {
    drinkImg.removeEventListener("transitionend", finishOut);

    drinkImg.classList.remove("drink-change-out");
    recipePanel.classList.remove("recipe-panel-change-out");

    drinkImg.src = `${drinkBaseUri}/${id}.png`;
    drinkImg.alt = drink.name;
    if (nameEl) {
      nameEl.textContent = drink.name;
    }
    if (recipeEl) {
      recipeEl.innerHTML = drink.recipe.replace(/\n/g, "<br />");
    }

    drinkImg.classList.add("drink-change-in");
    recipePanel.classList.add("recipe-panel-change-in");

    const finishIn = () => {
      drinkImg.removeEventListener("transitionend", finishIn);
      drinkImg.classList.remove("drink-change-in");
      recipePanel.classList.remove("recipe-panel-change-in");
      _drinkAnimating = false;
    };

    requestAnimationFrame(() => {
      drinkImg.addEventListener("transitionend", finishIn, { once: true });
      recipePanel.addEventListener("transitionend", finishIn, { once: true });
    });
  };

  drinkImg.addEventListener("transitionend", finishOut, { once: true });
}

function setRandomDrink(triggerConfetti = false): void {
  const keys = Object.keys(drinks);
  if (keys.length === 0) {
    return;
  }
  const id = keys[Math.floor(Math.random() * keys.length)];
  animateDrinkChange(id);
  if (triggerConfetti) {
    const canvas = document.getElementById(
      "foregroundEffectCanvas",
    ) as HTMLCanvasElement;
    if (canvas) {
      createConfetti(canvas.width, 28);
    }
  }
}

function handlePanelMessage(message: PanelMessage): void {
  if (message.command === "init-drinks") {
    drinks = message.drinks;
    drinkBaseUri = message.drinkBaseUri;
    setRandomDrink(false);
    return;
  }

  if (message.command === "random-drink") {
    setRandomDrink(true);
    return;
  }

  if (message.command === "key-press") {
    incrementKeyPress();
    return;
  }
}

function postCurrentDrinkDescription(drink: DrinkItem): void {
  if (!vscode || typeof vscode.postMessage !== "function") {
    return;
  }

  vscode.postMessage({
    command: "current-drink",
    name: drink.name,
    description: drink.description,
    method: drink.method,
  });
}

function incrementKeyPress(): void {
  _keyPressCount = Math.min(KEY_PRESS_TARGET, _keyPressCount + 1);
  updateKeyProgress();

  if (_keyPressCount >= KEY_PRESS_TARGET) {
    setRandomDrink();
    _keyPressCount = 0;
    updateKeyProgress();
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

  window.addEventListener("resize", () => {
    initCanvas("backgroundEffectCanvas", true);
    initForegroundCanvas();
  });
}

const vscode = (window as any).acquireVsCodeApi();

let _keyPressCount = 0;
const KEY_PRESS_TARGET = 100;

function updateKeyProgress(): void {
  const fill = document.getElementById(
    "keyProgressFill",
  ) as HTMLDivElement | null;
  if (!fill) {
    return;
  }
  const percent = Math.min(100, (_keyPressCount / KEY_PRESS_TARGET) * 100);
  fill.style.width = `${percent}%`;
}

function handleKeyDown(event: KeyboardEvent): void {
  if (event.repeat) {
    return;
  }
  incrementKeyPress();
}

function notifyExtensionReady(): void {
  vscode.postMessage({ command: "ready" });
}

function setupPanel(): void {
  initCanvas("backgroundEffectCanvas", true);
  initForegroundCanvas();
  notifyExtensionReady();
  window.addEventListener("keydown", handleKeyDown);
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
