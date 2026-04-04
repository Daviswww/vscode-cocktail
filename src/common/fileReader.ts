import * as fs from "fs";
import * as vscode from "vscode";

export function readFileText(uri: vscode.Uri): string {
  return fs.readFileSync(uri.fsPath, "utf8");
}

export function readJsonFile<T>(uri: vscode.Uri): T {
  const raw = readFileText(uri);
  return JSON.parse(raw) as T;
}

export function listFiles(uri: vscode.Uri): string[] {
  return fs
    .readdirSync(uri.fsPath, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name);
}

export function listFilesFiltered(
  uri: vscode.Uri,
  predicate: (name: string) => boolean,
): string[] {
  return listFiles(uri).filter(predicate);
}
