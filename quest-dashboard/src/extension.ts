import * as vscode from "vscode";

import { StateManager } from "./stateManager";
import { CharacterSheetView } from "./surfaces/characterSheet";
import { StatusBar } from "./surfaces/statusBar";
import { QuestTreeProvider } from "./surfaces/treeView";

export function activate(context: vscode.ExtensionContext): void {
  const root = vscode.workspace.workspaceFolders?.[0]?.uri;
  if (root === undefined) {
    return;
  }

  const statusBar = new StatusBar();
  const tree = new QuestTreeProvider();
  const characterSheet = new CharacterSheetView(context.extensionUri);
  const manager = new StateManager(root, [statusBar, tree, characterSheet]);

  context.subscriptions.push(
    statusBar,
    manager,
    vscode.window.createTreeView("questDashboard.questTree", { treeDataProvider: tree }),
    vscode.window.registerWebviewViewProvider(CharacterSheetView.viewType, characterSheet),
    vscode.commands.registerCommand("questDashboard.refresh", () => void manager.refresh()),
  );

  manager.activate();
}

export function deactivate(): void {
  // Resources are released via context.subscriptions.
}
