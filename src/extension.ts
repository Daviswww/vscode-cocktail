// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as fs from "fs";
import * as vscode from "vscode";

class ClockViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = "vscode-cocktail.clockView";
  constructor(private readonly _extensionUri: vscode.Uri) {}
  private _webviewView?: vscode.WebviewView;

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
  }

  public tick() {
    if (this._webviewView) {
      void this.getWebview().postMessage({ command: "tick" });
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
    const localeUri = vscode.Uri.joinPath(this._extensionUri, "en-US.json");
    const localeRaw = fs.readFileSync(localeUri.fsPath, "utf8");
    const locale = JSON.parse(localeRaw) as any;
    const drink = locale?.drinks?.["1"] ?? {};
    const drinkName = drink.name ?? "Cocktail";
    const drinkRecipe = (drink.recipe ?? "").replace(/\n/g, "<br />");
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
          </div>
          <div class="bar-counter"></div>
          <div class="scene-content">
            <div class="drink-panel">
              <div class="drink-wrapper">
                <div class="drink-glow"></div>
                <img class="drink" src="${drinkUri}" alt="${drinkName}" />
              </div>
              <div class="drink-name">${drinkName}</div>
            </div>
            <div class="recipe-panel">
              <div class="recipe-header">Recipe</div>
              <div class="recipe-text">${drinkRecipe}</div>
            </div>
          </div>
          <div class="clock" id="time">--:--:--</div>
          <div class="date" id="date"></div>
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
  const clockProvider = new ClockViewProvider(context.extensionUri);
  const registration = vscode.window.registerWebviewViewProvider(
    ClockViewProvider.viewType,
    clockProvider,
  );
  context.subscriptions.push(registration);
  console.log("ClockViewProvider registered:", ClockViewProvider.viewType);

  // Commands to help testing and revealing the view
  context.subscriptions.push(
    vscode.commands.registerCommand("vscode-cocktail.revealClock", async () => {
      // Ensure Explorer is visible then instruct user to expand the view
      await vscode.commands.executeCommand("workbench.view.explorer");
      vscode.window.showInformationMessage(
        'Explorer shown — expand "Cocktail Clock" view to activate it.',
      );
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("vscode-cocktail.tickClock", () => {
      try {
        clockProvider.tick();
        vscode.window.showInformationMessage(
          "Tick sent to clock view (if visible).",
        );
      } catch (err) {
        vscode.window.showErrorMessage(String(err));
      }
    }),
  );
}
// This method is called when your extension is deactivated
export function deactivate() {}
