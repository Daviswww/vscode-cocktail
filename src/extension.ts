// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { listFilesFiltered, readJsonFile } from "./common/fileReader";

export class CocktailViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = "vscode-cocktail.cocktail";
  constructor(private readonly _extensionUri: vscode.Uri) {}
  private _webviewView?: vscode.WebviewView;
  private _messageDisposable?: vscode.Disposable;
  public _currentDrinkDescription?: string;
  public _currentDrinkMethod?: string;
  public _currentDrinkName?: string;

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken,
  ) {
    console.log("ClockViewProvider.resolveWebviewView called");
    this._webviewView = webviewView;
    webviewView.webview.options = {
      enableScripts: true,
    };
    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
    this._messageDisposable?.dispose();
    this._messageDisposable = webviewView.webview.onDidReceiveMessage(
      (message) => {
        if (message?.command === "ready") {
          this.postDrinkData(webviewView.webview);
          return;
        }
        if (message?.command === "current-drink") {
          this._currentDrinkName = message.name;
          this._currentDrinkDescription = message.description;
          this._currentDrinkMethod = message.method;
          return;
        }
      },
    );
  }

  public tick() {
    if (this._webviewView) {
      void this.getWebview().postMessage({ command: "tick" });
    }
  }

  public randomizeDrink() {
    if (this._webviewView) {
      void this.getWebview().postMessage({ command: "random-drink" });
    }
  }

  public showMethodMessage() {
    if (this._currentDrinkMethod) {
      const prefix = this._currentDrinkName
        ? `${this._currentDrinkName}: `
        : "";
      vscode.window.showInformationMessage(
        `${prefix}${this._currentDrinkMethod}`,
      );
    } else {
      vscode.window.showInformationMessage(
        "No cocktail selected yet. Open the Cocktail view and choose a drink first.",
      );
    }
  }

  getWebview(): vscode.Webview {
    if (this._webviewView === undefined) {
      throw new Error(
        vscode.l10n.t(
          "Panel not active, make sure the clock view is visible before running this command.",
        ),
      );
    } else {
      return this._webviewView.webview;
    }
  }

  private getLocaleUri(): vscode.Uri {
    const localeFolder = vscode.Uri.joinPath(this._extensionUri, "l10n");
    const localeFiles = listFilesFiltered(localeFolder, (name) =>
      name.toLowerCase().endsWith(".json"),
    );

    const config = vscode.workspace.getConfiguration("vscode-cocktail");
    const configuredLanguage = config.get<string>("language");
    const requested = (configuredLanguage ?? vscode.env.language)
      .toLowerCase()
      .replace(/_/g, "-");
    const normalizedFiles = new Map(
      localeFiles.map((file) => [
        file.toLowerCase().replace(/\.json$/, ""),
        file,
      ]),
    );

    if (normalizedFiles.has(requested)) {
      return vscode.Uri.joinPath(localeFolder, normalizedFiles.get(requested)!);
    }

    const primary = requested.split("-")[0];
    const primaryMatch = localeFiles.find((file) =>
      file
        .toLowerCase()
        .replace(/\.json$/, "")
        .startsWith(primary + "-"),
    );
    if (primaryMatch) {
      return vscode.Uri.joinPath(localeFolder, primaryMatch);
    }

    const englishFile = localeFiles.find((file) =>
      file.toLowerCase().startsWith("en-"),
    );
    if (englishFile) {
      return vscode.Uri.joinPath(localeFolder, englishFile);
    }

    if (localeFiles.length > 0) {
      return vscode.Uri.joinPath(localeFolder, localeFiles[0]);
    }

    throw new Error("No locale files found in l10n folder.");
  }

  public postDrinkData(webview: vscode.Webview) {
    const localeUri = this.getLocaleUri();
    const locale = readJsonFile<any>(localeUri);
    const allDrinks = locale?.drinks ?? {};

    const drinksFolder = vscode.Uri.joinPath(
      this._extensionUri,
      "media",
      "drinks",
    );
    const imageFiles = listFilesFiltered(drinksFolder, (name) =>
      name.toLowerCase().endsWith(".png"),
    );
    const availableDrinkIds = new Set(
      imageFiles.map((name) => name.replace(/\.png$/i, "")),
    );
    const drinks = Object.fromEntries(
      Object.entries(allDrinks).filter(([id]) => availableDrinkIds.has(id)),
    );

    const drinkBaseUri = webview.asWebviewUri(drinksFolder).toString();
    void webview.postMessage({ command: "init-drinks", drinks, drinkBaseUri });
  }

  private _getHtmlForWebview(webview: vscode.Webview): string {
    const scriptPathOnDisk = vscode.Uri.joinPath(
      this._extensionUri,
      "media",
      "main-bundle.js",
    );
    const scriptUri = webview.asWebviewUri(scriptPathOnDisk);
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "style.css"),
    );
    const drinkUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "drinks", "1.png"),
    );
    const backgroundUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "images", "bg.png"),
    );
    const foregroundUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "images", "fg2.png"),
    );
    const bartenderWalkUri = webview.asWebviewUri(
      vscode.Uri.joinPath(
        this._extensionUri,
        "media",
        "images",
        "bartender",
        "walk.gif",
      ),
    );
    const bartenderWaitUri = webview.asWebviewUri(
      vscode.Uri.joinPath(
        this._extensionUri,
        "media",
        "images",
        "bartender",
        "wait.gif",
      ),
    );
    const htmlLang = vscode.env.language || "en";

    return `<!doctype html>
      <html lang="${htmlLang}">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="stylesheet" href="${styleUri}" />
      </head>
      <body>
        <div id="cocktailScene">
          <div id="cocktailCanvasContainer">
            <div id="backgroundImage" style="background-image: url('${backgroundUri}');"></div>
            <img
              id="bartender"
              src="${bartenderWaitUri}"
              data-walk="${bartenderWalkUri}"
              data-wait="${bartenderWaitUri}"
              alt="Bartender"
            />
            <div id="foregroundImage" style="background-image: url('${foregroundUri}');"></div>
          </div>
          <div class="scene-content">
            <div class="drink-panel">
              <div class="drink-wrapper">
                <img class="drink" src="${drinkUri}" alt="Cocktail" />
              </div>
            </div>
            <div class="recipe-panel">
              <div class="drink-name" id="drinkName">Cocktail</div>
              <div class="recipe-text" id="drinkRecipe">Loading...</div>
            </div>
          </div>
          <div class="key-progress">
            <div class="key-progress-fill" id="keyProgressFill"></div>
          </div>
          <div class="flavor-bar">
            <div class="flavor-marquee">
              <span id="flavorText">Flavor text will appear here.</span>
            </div>
          </div>
        </div>
        <script src="${scriptUri}"></script>
      </body>
      </html>`;
  }
}

export function activate(context: vscode.ExtensionContext) {
  console.log(
    'Congratulations, your extension "vscode-cocktail" is now active!',
  );

  // Register the clock view provider in Explorer
  const clockProvider = new CocktailViewProvider(context.extensionUri);
  const registration = vscode.window.registerWebviewViewProvider(
    CocktailViewProvider.viewType,
    clockProvider,
  );
  context.subscriptions.push(registration);
  console.log(
    "CocktailViewProvider registered:",
    CocktailViewProvider.viewType,
  );
  context.subscriptions.push(
    vscode.commands.registerCommand("vscode-cocktail.showMethodMessage", () => {
      try {
        clockProvider.showMethodMessage();
      } catch (err) {
        vscode.window.showErrorMessage(String(err));
      }
    }),
  );

  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration("vscode-cocktail.language")) {
        try {
          if (clockProvider) {
            void clockProvider.postDrinkData(clockProvider.getWebview());
          }
        } catch {
          // view may not be active
        }
      }
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("vscode-cocktail.randomDrink", () => {
      try {
        clockProvider.randomizeDrink();
      } catch (err) {
        vscode.window.showErrorMessage(String(err));
      }
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("vscode-cocktail.showFlavorMessage", () => {
      if (clockProvider._currentDrinkDescription) {
        const prefix = clockProvider._currentDrinkName
          ? `${clockProvider._currentDrinkName}: `
          : "";
        vscode.window.showInformationMessage(
          `${prefix}${clockProvider._currentDrinkDescription}`,
        );
      } else {
        vscode.window.showInformationMessage(
          "No cocktail selected yet. Open the Cocktail view and choose a drink first.",
        );
      }
    }),
  );

  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument((event) => {
      if (event.contentChanges.length === 0) {
        return;
      }
      if (clockProvider) {
        try {
          void clockProvider.getWebview().postMessage({ command: "key-press" });
        } catch {
          // ignore if view is not active
        }
      }
    }),
  );
}
// This method is called when your extension is deactivated
export function deactivate() {}
