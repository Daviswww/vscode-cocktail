import * as assert from "assert";
import * as path from "path";
import * as vscode from "vscode";

const extensionModule = require("../extension") as {
  CocktailViewProvider: typeof vscode.Disposable;
};
const CocktailViewProvider = extensionModule.CocktailViewProvider as any;

type CocktailViewProviderType = {
  toggleLanguage(): void;
  getLocaleUri(): vscode.Uri;
};

suite("Extension Language Configuration", () => {
  test("getLocaleUri respects vscode-cocktail.language setting", async () => {
    const extensionRoot = path.join(__dirname, "..", "..");
    const extensionUri = vscode.Uri.file(extensionRoot);
    const provider = new CocktailViewProvider(
      extensionUri,
    ) as CocktailViewProviderType;

    const config = vscode.workspace.getConfiguration("vscode-cocktail");
    const original = config.get<string>("language");

    try {
      await config.update(
        "language",
        "ja-JP",
        vscode.ConfigurationTarget.Global,
      );
      const localeUri = provider.getLocaleUri();
      assert.strictEqual(path.basename(localeUri.fsPath, ".json"), "ja-JP");

      await config.update(
        "language",
        "zh-TW",
        vscode.ConfigurationTarget.Global,
      );
      const localeUri2 = provider.getLocaleUri();
      assert.strictEqual(path.basename(localeUri2.fsPath, ".json"), "zh-TW");
    } finally {
      await config.update(
        "language",
        original,
        vscode.ConfigurationTarget.Global,
      );
    }
  });

  test("showFlavorMessage displays drink flavor with prefix", async () => {
    const extensionRoot = path.join(__dirname, "..", "..");
    const extensionUri = vscode.Uri.file(extensionRoot);
    const provider = new CocktailViewProvider(extensionUri) as any;

    provider._currentDrinkName = "Negroni";
    provider._currentDrinkDescription = "A bittersweet Italian classic.";

    const original = (vscode.window as any).showInformationMessage;
    let messageShown = "";
    (vscode.window as any).showInformationMessage = (message: string) => {
      messageShown = message;
      return Promise.resolve(undefined);
    };

    try {
      provider.showFlavorMessage();
      assert.strictEqual(
        messageShown,
        "Negroni: A bittersweet Italian classic.",
      );
    } finally {
      (vscode.window as any).showInformationMessage = original;
    }
  });

  test("showMethodMessage displays drink method with prefix", async () => {
    const extensionRoot = path.join(__dirname, "..", "..");
    const extensionUri = vscode.Uri.file(extensionRoot);
    const provider = new CocktailViewProvider(extensionUri) as any;

    provider._currentDrinkName = "Old Fashioned";
    provider._currentDrinkMethod = "Stir with ice and strain.";

    const original = (vscode.window as any).showInformationMessage;
    let messageShown = "";
    (vscode.window as any).showInformationMessage = (message: string) => {
      messageShown = message;
      return Promise.resolve(undefined);
    };

    try {
      provider.showMethodMessage();
      assert.strictEqual(
        messageShown,
        "Old Fashioned: Stir with ice and strain.",
      );
    } finally {
      (vscode.window as any).showInformationMessage = original;
    }
  });
});
