# Contributing to VS Code Cocktail

Thank you for contributing to `vscode-cocktail`! This document explains how to get started, test locally, and submit changes.

## 1. Before you begin

1. Fork the repository on GitHub.
2. Clone your fork locally:
   ```bash
   git clone https://github.com/<your-username>/vscode-cocktail.git
   cd vscode-cocktail
   ```
3. Install dependencies:
   ```bash
   npm ci
   ```

## 2. Development and local testing

### 2.1 Rebuild the project

```bash
npm run compile
```

### 2.2 Run tests

```bash
npm test
```

### 2.3 Run in Extension Development Host

1. Open the project folder in VS Code.
2. Press `F5` to launch the Extension Development Host.
3. Open the `Cocktail` view in the sidebar and verify the extension behavior.

### 2.4 Packaging

To create a VSIX package for testing or distribution, run:

```bash
vsce package
```

## 3. Pre-PR checklist

Before opening a pull request, please ensure:

- `npm run compile` finishes successfully
- `npm test` passes
- Your changes do not break existing functionality

To verify packaging, run:

```bash
npm run package
```

## 4. Reporting issues and suggesting features

If you find a bug or want to request a feature:

1. Check existing issues for duplicates.
2. If none exist, open a new issue and include:
   - Steps to reproduce
   - Expected behavior
   - Actual behavior
   - Error messages (if any)

## 5. Project-specific contributions

### Adding a new drink

- To add a new cocktail, update the relevant data under `media/drinks/` and ensure any UI or data-loading logic is updated accordingly.

### Adding a new locale

To add a new locale:

1. Add a new JSON file under `l10n/`, such as `xx-XX.json`.
2. Add the new locale to the `vscode-cocktail.language` enum in `package.json`.
3. Confirm the new locale is documented in the UI and README.

## 6. Pull request guidelines

- Create one PR per feature or fix.
- Provide a clear description and test steps.
- Explain why the change is needed, especially for behavior or UI updates.
- Make sure unrelated files are not included in the diff.

---

Thanks for contributing! If you have questions, feel free to open an issue or leave a comment.
