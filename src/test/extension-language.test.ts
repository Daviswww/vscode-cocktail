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
});
