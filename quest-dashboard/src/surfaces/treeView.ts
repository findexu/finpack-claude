import * as vscode from "vscode";

import type { QuestState, ScrollFile } from "../types";
import type { SurfaceUpdate } from "../stateManager";

type QuestNode =
  | { kind: "quest"; questName: string; realm: string }
  | { kind: "scroll"; scroll: ScrollFile };

export class QuestTreeProvider implements vscode.TreeDataProvider<QuestNode>, SurfaceUpdate {
  private readonly emitter = new vscode.EventEmitter<QuestNode | undefined>();
  readonly onDidChangeTreeData = this.emitter.event;

  private state: QuestState | null = null;

  update(state: QuestState): void {
    this.state = state;
    this.emitter.fire(undefined);
  }

  getTreeItem(node: QuestNode): vscode.TreeItem {
    if (node.kind === "quest") {
      const item = new vscode.TreeItem(node.questName, vscode.TreeItemCollapsibleState.Expanded);
      item.description = node.realm;
      item.iconPath = new vscode.ThemeIcon("milestone");
      item.contextValue = "quest";
      return item;
    }

    const label = node.scroll.filename.replace(/\.md$/, "");
    const item = new vscode.TreeItem(label, vscode.TreeItemCollapsibleState.None);
    item.iconPath = new vscode.ThemeIcon("book");
    item.contextValue = "scroll";
    item.description = node.scroll.meta?.lastUpdated ?? "";
    // No resourceUri: it triggers git SCM decorators ("U" untracked) on rows.
    item.command = {
      command: "vscode.open",
      title: "Open Scroll",
      arguments: [vscode.Uri.file(node.scroll.fsPath)],
    };
    return item;
  }

  getChildren(node?: QuestNode): QuestNode[] {
    if (this.state === null) {
      return [];
    }
    if (node === undefined) {
      const quest = this.state.activeQuest;
      if (quest === null) {
        return [];
      }
      return [{ kind: "quest", questName: questName(quest.questFolderPath), realm: quest.realm }];
    }
    if (node.kind === "quest") {
      return this.state.scrolls.map((scroll) => ({ kind: "scroll", scroll }));
    }
    return [];
  }
}

function questName(questFolderPath: string): string {
  const parts = questFolderPath.split("/").filter((p) => p !== "");
  return parts.length > 0 ? parts[parts.length - 1] : questFolderPath;
}
