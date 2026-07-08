import * as vscode from "vscode";

import { expBar, levelProgress } from "../levelMath";
import { LoadingState, QuestPhase } from "../types";
import type { ActiveQuest, QuestPhase as QuestPhaseT, QuestState } from "../types";
import type { SurfaceUpdate } from "../stateManager";

const PHASE_ICON: Record<QuestPhaseT, string> = {
  [QuestPhase.NoQuest]: "$(circle-slash)",
  [QuestPhase.Planning]: "$(compass)",
  [QuestPhase.Ready]: "$(flame)",
  [QuestPhase.Embarked]: "$(rocket)",
  [QuestPhase.AtCamp]: "$(home)",
};

// VS Code auto-registers a `<viewId>.focus` command for contributed views.
const OPEN_SHEET_COMMAND = "questDashboard.characterSheet.focus";
const BAR_WIDTH = 8;

export class StatusBar implements SurfaceUpdate, vscode.Disposable {
  private readonly item: vscode.StatusBarItem;

  constructor() {
    this.item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    this.item.command = OPEN_SHEET_COMMAND;
    this.item.show();
  }

  update(state: QuestState): void {
    switch (state.loadingState) {
      case LoadingState.NoAdventurer:
        this.item.text = "$(shield) No adventurer";
        this.item.tooltip = "No quest-system profile found. Run /new-quest or /init-xp.";
        return;
      case LoadingState.UnsupportedSchema:
        this.item.text = "$(warning) Quest schema";
        this.item.tooltip = state.error ?? "quest-system schema is not supported by this extension.";
        return;
      case LoadingState.Error:
        this.item.text = "$(error) Quest data";
        this.item.tooltip = state.error ?? "Failed to read quest-system data.";
        return;
      case LoadingState.Ready:
        this.renderReady(state);
        return;
    }
  }

  dispose(): void {
    this.item.dispose();
  }

  private renderReady(state: QuestState): void {
    if (state.profile === null) {
      return;
    }
    const progress = levelProgress(state.profile.totalExp);
    const quest = questName(state.activeQuest);
    const questLabel = quest ? ` ${quest}` : "";
    const bar = progress.isMax ? "MAX" : expBar(progress.ratio, BAR_WIDTH);
    const icon = PHASE_ICON[state.phase];

    this.item.text = `${icon} Lv.${progress.tier.level}${questLabel} ${bar}`;
    this.item.tooltip = this.buildTooltip(state, progress.tier.level, progress.tier.title, progress.isMax, progress.expThisLevel, progress.expToNext);
  }

  private buildTooltip(
    state: QuestState,
    level: number,
    title: string,
    isMax: boolean,
    expThisLevel: number,
    expToNext: number,
  ): vscode.MarkdownString {
    const profile = state.profile;
    const lines = [
      `**${profile?.adventurer ?? "Adventurer"}** — Level ${level} (${title})`,
      isMax ? "Max level" : `EXP ${expThisLevel} / ${expToNext} to next level`,
    ];
    const quest = questName(state.activeQuest);
    if (quest) {
      lines.push(`Active quest: \`${quest}\` (${state.activeQuest?.realm ?? "?"})`);
    }
    lines.push("Click to open the character sheet.");
    return new vscode.MarkdownString(lines.join("\n\n"));
  }
}

function questName(activeQuest: ActiveQuest | null): string | null {
  if (activeQuest === null) {
    return null;
  }
  const parts = activeQuest.questFolderPath.split("/").filter((p) => p !== "");
  return parts.length > 0 ? parts[parts.length - 1] : null;
}
