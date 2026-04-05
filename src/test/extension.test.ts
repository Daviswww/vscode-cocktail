import * as assert from "assert";

suite("Panel Main setRandomDrink Test Suite", () => {
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
        save: () => {},
        restore: () => {},
        translate: () => {},
        rotate: () => {},
        fillStyle: "",
        shadowColor: "",
        shadowBlur: 0,
        globalCompositeOperation: "source-over",
        globalAlpha: 1,
      };
      canvas.parentElement = canvas;
      return canvas;
    }

    elements.backgroundEffectCanvas = createCanvas("backgroundEffectCanvas");
    elements.foregroundEffectCanvas = createCanvas("foregroundEffectCanvas");
    elements.drinkName = { textContent: "" };
    elements.drinkRecipe = { innerHTML: "" };
    elements.keyProgressFill = { style: { width: "" } };

    const win: any = {
      devicePixelRatio: 1,
      innerWidth: 320,
      innerHeight: 240,
      requestAnimationFrame: (_cb: any) => 1,
      cancelAnimationFrame: (_id: any) => {},
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

  test("random-drink with no drinks does not post current-drink", () => {
    const env = setupDomEnv();
    clearModuleCache();
    require("../panel/main");
    env.triggerDocumentEvent("DOMContentLoaded");
    env.postMessages.length = 0;

    env.triggerWindowEvent("message", { data: { command: "random-drink" } });

    assert.strictEqual(env.postMessages.length, 0);
  });

  test("init-drinks displays a drink and posts current-drink", () => {
    const env = setupDomEnv();
    clearModuleCache();
    require("../panel/main");
    env.triggerDocumentEvent("DOMContentLoaded");
    env.postMessages.length = 0;

    const drinks = {
      mojito: {
        name: "Mojito",
        recipe: "Rum\nMint\nLime",
        description: "A refreshing mint cocktail",
        method: "Stir and serve over ice",
      },
    };

    env.triggerWindowEvent("message", {
      data: {
        command: "init-drinks",
        drinks,
        drinkBaseUri: "/images",
      },
    });

    assert.strictEqual(env.postMessages.length, 1);
    assert.deepStrictEqual(env.postMessages[0], {
      command: "current-drink",
      name: "Mojito",
      description: "A refreshing mint cocktail",
      method: "Stir and serve over ice",
    });
    assert.strictEqual(env.elements.drinkName.textContent, "Mojito");
    assert.strictEqual(
      env.elements.drinkRecipe.innerHTML,
      "Rum<br />Mint<br />Lime",
    );
  });

  test("random-drink posts current-drink again after init-drinks", () => {
    const env = setupDomEnv();
    clearModuleCache();
    require("../panel/main");
    env.triggerDocumentEvent("DOMContentLoaded");

    const drinks = {
      margarita: {
        name: "Margarita",
        recipe: "Tequila\nTriple sec\nLime juice",
        description: "A tart and citrusy classic",
        method: "Shake with ice and strain",
      },
    };

    env.triggerWindowEvent("message", {
      data: {
        command: "init-drinks",
        drinks,
        drinkBaseUri: "/images",
      },
    });

    env.postMessages.length = 0;
    env.triggerWindowEvent("message", { data: { command: "random-drink" } });

    assert.strictEqual(env.postMessages.length, 1);
    assert.strictEqual(env.postMessages[0].command, "current-drink");
    assert.strictEqual(env.postMessages[0].name, "Margarita");
  });
});
