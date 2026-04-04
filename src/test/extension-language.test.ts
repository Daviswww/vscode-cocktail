import * as assert from "assert";
import * as path from "path";
import * as vscode from "vscode";
import { listFilesFiltered } from "../common/fileReader";

const extensionModule = require("../extension") as {
  ClockViewProvider: typeof vscode.Disposable;
};
const ClockViewProvider = extensionModule.ClockViewProvider as any;

type ClockViewProviderType = {
  toggleLanguage(): void;
  _languageOverride?: string;
  getLocaleUri(): vscode.Uri;
};

suite("Extension Language Toggle", () => {
  test("toggleLanguage updates locale override and changes locale selection", () => {
    const extensionRoot = path.join(__dirname, "..", "..");
    const extensionUri = vscode.Uri.file(extensionRoot);
    const provider = new ClockViewProvider(
      extensionUri,
    ) as ClockViewProviderType;

    const l10nFolder = vscode.Uri.file(path.join(extensionRoot, "l10n"));
    const localeFiles = listFilesFiltered(l10nFolder, (name) =>
      name.toLowerCase().endsWith(".json"),
    );
    assert.ok(
      localeFiles.length >= 2,
      "Expected at least two locale files for toggle test",
    );

    assert.ok(
      localeFiles.length >= 2,
      "Expected at least two locale files for toggle test",
    );

    const firstLocaleId = localeFiles[0].toLowerCase().replace(/\.json$/, "");
    provider._languageOverride = firstLocaleId;

    provider.toggleLanguage();
    const overrideLocale = provider._languageOverride;

    assert.ok(
      typeof overrideLocale === "string",
      "Language override should be set after toggle",
    );
    assert.notStrictEqual(
      overrideLocale,
      firstLocaleId,
      "Toggle should move to a different locale file",
    );

    const nextLocaleUri = provider.getLocaleUri();
    const nextLocaleId = path
      .basename(nextLocaleUri.fsPath, ".json")
      .toLowerCase();
    assert.strictEqual(nextLocaleId, overrideLocale);
  });
});
