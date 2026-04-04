import * as assert from "assert";

suite("Panel Main Test Suite", () => {
  interface DomEnv {
    window: any;
    document: any;
    elements: Record<string, any>;
    postMessages: any[];
    windowEventTypes(): string[];
    triggerWindowEvent(type: string, event: any): void;
    triggerDocumentEvent(type: string): void;
  }

  function setupDomEnv(): DomEnv {
    const windowListeners = new Map<string, Function[]>();
    const documentListeners = new Map<string, Function[]>();
    const postMessages: any[] = [];
    const elements: Record<string, any> = {};

    function addListener(
      map: Map<string, Function[]>,
      type: string,
      callback: Function,
    ) {
      const listeners = map.get(type) ?? [];
      listeners.push(callback);
      map.set(type, listeners);
    }

    function createCanvas(id: string) {
      const canvas: any = {
        id,
        width: 0,
        height: 0,
        style: { display: "", width: "", height: "" },
        parentElement: null,
        clientWidth: 320,
        clientHeight: 240,
        getBoundingClientRect: () => ({ width: 320, height: 240 }),
        getContext: (_type: string) => ctx,
      };
      const ctx: any = {
        canvas,
        setTransform: () => {},
        createLinearGradient: () => ({ addColorStop: () => {} }),
        fillRect: () => {},
        clearRect: () => {},
        beginPath: () => {},
        arc: () => {},
        fill: () => {},
        shadowColor: "",
        shadowBlur: 0,
        globalAlpha: 1,
        fillStyle: "",
      };
      canvas.parentElement = canvas;
      return canvas;
    }

    elements.backgroundEffectCanvas = createCanvas("backgroundEffectCanvas");
    elements.foregroundEffectCanvas = createCanvas("foregroundEffectCanvas");
    elements.time = { textContent: "" };
    elements.date = { textContent: "" };
    elements.keyProgressFill = { style: { width: "" } };

    const win: any = {
      devicePixelRatio: 1,
      innerWidth: 320,
      innerHeight: 240,
      requestAnimationFrame: (_cb: any) => 1,
      cancelAnimationFrame: (_id: any) => {},
      setInterval: (_fn: any, _ms: any) => 1,
      clearInterval: (_id: any) => {},
      addEventListener: (type: string, callback: Function) =>
        addListener(windowListeners, type, callback),
      removeEventListener: (type: string, callback: Function) => {
        const listeners = windowListeners.get(type) ?? [];
        windowListeners.set(
          type,
          listeners.filter((fn) => fn !== callback),
        );
      },
      acquireVsCodeApi: () => ({
        postMessage: (message: any) => postMessages.push(message),
      }),
    };

    const doc: any = {
      readyState: "loading",
      addEventListener: (type: string, callback: Function) =>
        addListener(documentListeners, type, callback),
      removeEventListener: (type: string, callback: Function) => {
        const listeners = documentListeners.get(type) ?? [];
        documentListeners.set(
          type,
          listeners.filter((fn) => fn !== callback),
        );
      },
      getElementById: (id: string) => elements[id] ?? null,
      querySelector: (_selector: string) => null,
    };

    (global as any).window = win;
    (global as any).document = doc;

    return {
      window: win,
      document: doc,
      elements,
      postMessages,
      windowEventTypes: () => Array.from(windowListeners.keys()),
      triggerWindowEvent: (type: string, event: any) => {
        const listeners = windowListeners.get(type) ?? [];
        listeners.forEach((fn) => fn(event));
      },
      triggerDocumentEvent: (type: string) => {
        const listeners = documentListeners.get(type) ?? [];
        listeners.forEach((fn) => fn({ type }));
      },
    };
  }

  function clearModuleCache() {
    const modulePath = require.resolve("../panel/main");
    delete require.cache[modulePath];
  }

  teardown(() => {
    delete (global as any).window;
    delete (global as any).document;
  });

  test("setupPanel posts ready message and registers listeners on DOMContentLoaded", () => {
    const env = setupDomEnv();
    clearModuleCache();
    require("../panel/main");
    env.triggerDocumentEvent("DOMContentLoaded");

    assert.strictEqual(env.postMessages.length, 1);
    assert.deepStrictEqual(env.postMessages[0], { command: "ready" });
    assert.ok(env.windowEventTypes().includes("keydown"));
    assert.ok(env.windowEventTypes().includes("resize"));
    assert.ok(env.elements.time.textContent.length > 0);
    assert.ok(env.elements.date.textContent.length > 0);
    assert.ok(env.elements.backgroundEffectCanvas.width > 0);
    assert.ok(env.elements.foregroundEffectCanvas.width > 0);
  });

  test("keydown event increments key progress", () => {
    const env = setupDomEnv();
    clearModuleCache();
    require("../panel/main");
    env.triggerDocumentEvent("DOMContentLoaded");

    env.triggerWindowEvent("keydown", { repeat: false });
    assert.strictEqual(env.elements.keyProgressFill.style.width, "1%");

    env.triggerWindowEvent("keydown", { repeat: true });
    assert.strictEqual(env.elements.keyProgressFill.style.width, "1%");
  });

  test("resize event reinitializes canvas dimensions", () => {
    const env = setupDomEnv();
    clearModuleCache();
    require("../panel/main");
    env.triggerDocumentEvent("DOMContentLoaded");

    env.elements.backgroundEffectCanvas.width = 0;
    env.elements.backgroundEffectCanvas.height = 0;
    env.elements.foregroundEffectCanvas.width = 0;
    env.elements.foregroundEffectCanvas.height = 0;

    env.triggerWindowEvent("resize", {});
    assert.ok(env.elements.backgroundEffectCanvas.width > 0);
    assert.ok(env.elements.foregroundEffectCanvas.width > 0);
  });
});
