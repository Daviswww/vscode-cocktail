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

const confettiColors = [
  "#e63946",
  "#f4a261",
  "#2a9d8f",
  "#264653",
  "#e9c46a",
  "#8d99ae",
  "#ffbe0b",
];

function ensureConfettiContainer(): HTMLDivElement | null {
  const existing = document.getElementById("confettiContainer");
  if (existing) {
    return existing as HTMLDivElement;
  }
  const parent = document.getElementById("cocktailCanvasContainer");
  if (!parent) {
    return null;
  }
  const container = document.createElement("div");
  container.id = "confettiContainer";
  parent.appendChild(container);
  return container;
}

function initializeBartender(): void {
  const img = document.getElementById("bartender") as HTMLImageElement | null;
  if (!img) {
    return;
  }

  const walkSrc = img.dataset.walk ?? img.src;
  const waitSrc = img.dataset.wait ?? img.src;
  const container = document.getElementById("cocktailCanvasContainer");
  if (!container) {
    return;
  }

  let direction = 1;
  let currentX = 0;
  const modeIntervalMs = 1500;

  const getRandomBetween = (min: number, max: number) =>
    Math.floor(Math.random() * (max - min + 1)) + min;

  const clamp = (value: number, min: number, max: number) =>
    Math.min(max, Math.max(min, value));

  const getBounds = () => {
    const containerWidth = container.clientWidth;
    const imgWidth = img.clientWidth || 120;
    const minX = 0;
    const maxX = Math.max(0, containerWidth - imgWidth - 24);
    return { minX, maxX };
  };

  const setPosition = (x: number, duration = 1200) => {
    const { minX, maxX } = getBounds();
    currentX = clamp(x, minX, maxX);
    img.style.transition = `transform ${duration}ms linear`;
    img.style.transform = `translate3d(${currentX}px, 0, 0) scaleX(${direction})`;
  };

  let modeTimer: number | undefined;
  const clearModeTimer = () => {
    if (modeTimer !== undefined) {
      window.clearTimeout(modeTimer);
      modeTimer = undefined;
    }
  };

  const scheduleNextMode = () => {
    clearModeTimer();
    modeTimer = window.setTimeout(runMode, modeIntervalMs);
  };

  const runMode = () => {
    if (!img || !container) {
      return;
    }

    const { minX, maxX } = getBounds();
    const mode = Math.random() < 0.45 ? "wait" : "walk";

    if (mode === "wait") {
      img.src = waitSrc;
      scheduleNextMode();
      return;
    }

    img.src = walkSrc;
    const step = getRandomBetween(80, 180);
    let target = currentX + direction * step;

    if (target < minX || target > maxX) {
      direction *= -1;
      img.style.transition = "none";
      img.style.transform = `translate3d(${currentX}px, 0, 0) scaleX(${direction})`;
      img.getBoundingClientRect();
      target = clamp(currentX + direction * step, minX, maxX);
    }

    setPosition(target);
    scheduleNextMode();
  };

  const startBartender = () => {
    const { minX } = getBounds();
    currentX = minX;
    img.style.transition = "none";
    img.style.transform = `translate3d(${currentX}px, 0, 0) scaleX(${direction})`;
    img.src = waitSrc;
    scheduleNextMode();
  };

  if (img.complete && img.naturalWidth > 0) {
    startBartender();
  } else {
    img.addEventListener("load", startBartender, { once: true });
  }
}

function createConfettiPiece(): HTMLDivElement {
  const piece = document.createElement("div");
  piece.className = "confetti-piece";
  const size = Math.floor(Math.random() * 12) + 8;
  const drift = Math.floor(Math.random() * 180) - 90;
  const fall = Math.floor(Math.random() * 260) + 260;
  const rotate = Math.floor(Math.random() * 360);
  const duration = Math.random() * 0.5 + 1.4;
  const delay = Math.random() * 0.6;

  piece.style.width = `${size}px`;
  piece.style.height = `${Math.max(4, Math.floor(size * 0.35))}px`;
  piece.style.left = `${Math.random() * 100}%`;
  piece.style.top = `-18px`;
  piece.style.backgroundColor =
    confettiColors[Math.floor(Math.random() * confettiColors.length)];
  piece.style.opacity = `${0.8 + Math.random() * 0.2}`;
  piece.style.transform = `rotate(${rotate}deg)`;
  piece.style.animation = `confettiFall ${duration}s ease-out ${delay}s forwards`;
  piece.style.setProperty("--confetti-dx", `${drift}px`);
  piece.style.setProperty("--confetti-dy", `${fall}px`);
  piece.style.setProperty("--confetti-rotate", `${rotate}deg`);
  return piece;
}

function triggerConfetti(total = 80): void {
  const container = ensureConfettiContainer();
  if (!container) {
    return;
  }

  const piecesPerFrame = 8;
  const durationMs = 1500;
  const start = performance.now();

  const spawnBatch = () => {
    const now = performance.now();
    if (now - start >= durationMs) {
      return;
    }

    for (let i = 0; i < piecesPerFrame; i++) {
      const piece = createConfettiPiece();
      piece.addEventListener("animationend", () => {
        piece.remove();
      });
      container.appendChild(piece);
    }

    window.setTimeout(spawnBatch, 100);
  };

  spawnBatch();
}

function setRandomDrink(enableConfetti = false): void {
  const keys = Object.keys(drinks);
  if (keys.length === 0) {
    return;
  }
  const id = keys[Math.floor(Math.random() * keys.length)];
  animateDrinkChange(id);
  if (enableConfetti) {
    triggerConfetti();
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

export function cocktailPanelApp() {
  notifyExtensionReady();
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
  notifyExtensionReady();
  initializeBartender();
  window.addEventListener("keydown", handleKeyDown);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", setupPanel);
} else {
  setupPanel();
}
