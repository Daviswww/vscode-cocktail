// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { listFilesFiltered, readJsonFile } from "./common/fileReader";

class ClockViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = "vscode-cocktail.cocktail";
  constructor(private readonly _extensionUri: vscode.Uri) {}
  private _webviewView?: vscode.WebviewView;
  private _messageDisposable?: vscode.Disposable;

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

  private postDrinkData(webview: vscode.Webview) {
    const localeUri = vscode.Uri.joinPath(this._extensionUri, "en-US.json");
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

    return `<!doctype html>
      <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="stylesheet" href="${styleUri}" />
      </head>
      <body>
        <div id="cocktailScene">
          <div id="cocktailCanvasContainer">
            <canvas id="backgroundEffectCanvas"></canvas>
            <canvas id="foregroundEffectCanvas"></canvas>
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
        </div>
        <script src="${scriptUri}"></script>
      </body>
      </html>`;
  }
}

// <div class="clock" id="time">--:--:--</div>
// <div class="date" id="date"></div>
export function activate(context: vscode.ExtensionContext) {
  console.log(
    'Congratulations, your extension "vscode-cocktail" is now active!',
  );

  // Register the clock view provider in Explorer
  const clockProvider = new ClockViewProvider(context.extensionUri);
  const registration = vscode.window.registerWebviewViewProvider(
    ClockViewProvider.viewType,
    clockProvider,
  );
  context.subscriptions.push(registration);
  console.log("ClockViewProvider registered:", ClockViewProvider.viewType);

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
