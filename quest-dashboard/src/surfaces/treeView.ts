import * as vscode from "vscode";

import { deriveBattlePlan } from "../battlePlan";
import type { BattlePlanRow } from "../battlePlan";
import { leafName } from "../leafName";
import type { QuestState, ScrollFile, SideQuest } from "../types";
import type { SurfaceUpdate } from "../stateManager";

type GroupKind = "battle-plan" | "side-quests" | "scrolls";

type QuestNode =
  | { kind: "quest"; questName: string; realm: string }
  | { kind: "group"; group: GroupKind; label: string; description: string }
  | { kind: "expedition"; row: BattlePlanRow }
  | { kind: "side-quest"; sideQuest: SideQuest }
  | { kind: "scroll"; scroll: ScrollFile };

const GROUP_ICON: Record<GroupKind, string> = {
  "battle-plan": "tasklist",
  "side-quests": "git-branch",
  scrolls: "library",
};

const EXPEDITION_ICON: Record<BattlePlanRow["status"], vscode.ThemeIcon> = {
  active: new vscode.ThemeIcon("play-circle", new vscode.ThemeColor("charts.yellow")),
  planned: new vscode.ThemeIcon("circle-large-outline"),
  done: new vscode.ThemeIcon("pass-filled", new vscode.ThemeColor("charts.green")),
};

export class QuestTreeProvider implements vscode.TreeDataProvider<QuestNode>, SurfaceUpdate {
  private readonly emitter = new vscode.EventEmitter<QuestNode | undefined>();
  readonly onDidChangeTreeData = this.emitter.event;

  private state: QuestState | null = null;

  update(state: QuestState): void {
    this.state = state;
    this.emitter.fire(undefined);
  }

  getTreeItem(node: QuestNode): vscode.TreeItem {
    switch (node.kind) {
      case "quest": {
        const item = new vscode.TreeItem(node.questName, vscode.TreeItemCollapsibleState.Expanded);
        item.description = node.realm;
        item.iconPath = new vscode.ThemeIcon("milestone");
        item.contextValue = "quest";
        return item;
      }
      case "group": {
        const collapsed =
          node.group === "scrolls" ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.Expanded;
        const item = new vscode.TreeItem(node.label, collapsed);
        item.description = node.description;
        item.iconPath = new vscode.ThemeIcon(GROUP_ICON[node.group]);
        item.contextValue = node.group;
        return item;
      }
      case "expedition": {
        const item = new vscode.TreeItem(node.row.label, vscode.TreeItemCollapsibleState.None);
        item.description = node.row.detail ?? "";
        item.iconPath = EXPEDITION_ICON[node.row.status];
        item.contextValue = `expedition-${node.row.status}`;
        return item;
      }
      case "side-quest": {
        const item = new vscode.TreeItem(node.sideQuest.slug, vscode.TreeItemCollapsibleState.None);
        item.iconPath = new vscode.ThemeIcon("note");
        item.contextValue = "sideQuest";
        item.command = {
          command: "vscode.open",
          title: "Open Side-Quest",
          arguments: [vscode.Uri.file(node.sideQuest.fsPath)],
        };
        return item;
      }
      case "scroll": {
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
    }
  }

  getChildren(node?: QuestNode): QuestNode[] {
    const state = this.state;
    if (state === null) {
      return [];
    }
    if (node === undefined) {
      const quest = state.activeQuest;
      if (quest === null) {
        return [];
      }
      return [{ kind: "quest", questName: leafName(quest.questFolderPath), realm: quest.realm }];
    }
    if (node.kind === "quest") {
      return this.questGroups(state);
    }
    if (node.kind === "group") {
      return this.groupChildren(state, node.group);
    }
    return [];
  }

  private questGroups(state: QuestState): QuestNode[] {
    const groups: QuestNode[] = [];
    const plan = this.battlePlan(state);
    if (plan !== null && plan.rows.length > 0) {
      const c = plan.counts;
      groups.push({
        kind: "group",
        group: "battle-plan",
        label: "Battle Plan",
        description: `${c.done} done · ${c.active} active · ${c.planned} plan`,
      });
    }
    if (state.openSideQuests.length > 0) {
      groups.push({
        kind: "group",
        group: "side-quests",
        label: "Side-Quests",
        description: `${state.openSideQuests.length}`,
      });
    }
    if (state.scrolls.length > 0) {
      groups.push({ kind: "group", group: "scrolls", label: "Scrolls", description: `${state.scrolls.length}` });
    }
    return groups;
  }

  private groupChildren(state: QuestState, group: GroupKind): QuestNode[] {
    switch (group) {
      case "battle-plan":
        return (this.battlePlan(state)?.rows ?? []).map((row) => ({ kind: "expedition", row }));
      case "side-quests":
        return state.openSideQuests.map((sideQuest) => ({ kind: "side-quest", sideQuest }));
      case "scrolls":
        return state.scrolls.map((scroll) => ({ kind: "scroll", scroll }));
    }
  }

  private battlePlan(state: QuestState) {
    if (state.activeQuest === null) {
      return null;
    }
    return deriveBattlePlan({
      phase: state.phase,
      planned: state.plannedExpeditions,
      expFold: state.expFold,
      activeLeaf: leafName(state.activeQuest.questFolderPath),
    });
  }
}
