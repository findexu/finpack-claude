import * as vscode from "vscode";

import { buildCharacterSheetV2 } from "../webview/buildCharacterSheetV2";
import { LoadingState, QuestPhase } from "../types";
import type { QuestState } from "../types";
import type { SurfaceUpdate } from "../stateManager";

const ASSET_DIR = ["assets", "sprites"];

// Embedded sidebar character sheet. A WebviewView (not an editor-tab panel):
// it lives in the Quest Dashboard view container, above the scrolls tree, and
// re-renders whenever the shared QuestState changes.
export class CharacterSheetView implements vscode.WebviewViewProvider, SurfaceUpdate {
  static readonly viewType = "questDashboard.characterSheet";

  private view: vscode.WebviewView | undefined;
  private state: QuestState = CharacterSheetView.initialState();

  constructor(private readonly extensionUri: vscode.Uri) {}

  resolveWebviewView(view: vscode.WebviewView): void {
    this.view = view;
    view.webview.options = {
      enableScripts: false,
      localResourceRoots: [vscode.Uri.joinPath(this.extensionUri, ...ASSET_DIR)],
    };
    view.onDidDispose(() => {
      this.view = undefined;
    });
    void this.render();
  }

  update(state: QuestState): void {
    this.state = state;
    if (this.view !== undefined) {
      void this.render();
    }
  }

  private async render(): Promise<void> {
    const view = this.view;
    if (view === undefined) {
      return;
    }
    const [
      heroImgUri,
      heroBgUri,
      heroIdleUri,
      badgeSheetV2Uri,
      badgeShelfV2Uri,
      badgeFrameLockedV2Uri,
      badgeFrameEarnedV2Uri,
      badgeFrameProgressV2Uri,
      badgeIconsIronV2Uri,
      badgeIconsEmeraldV2Uri,
      badgeIconsGoldV2Uri,
      phaseSheetV2Uri,
      phasePlanningV2Uri,
      phaseEmbarkedV2Uri,
      phaseCampV2Uri,
      phaseNoQuestV2Uri,
      phaseReadyV2Uri,
      emptySheetV2Uri,
    ] = await Promise.all([
      this.assetUri(view.webview, "hero.png"),
      this.assetUri(view.webview, "hero-bg.jpg"),
      this.assetUri(view.webview, "hero-idle.png"),
      this.assetUri(view.webview, "badge-sheet-v2.png"),
      this.assetUri(view.webview, "badge-shelf-v2.png"),
      this.assetUri(view.webview, "badge-frame-locked-v2.png"),
      this.assetUri(view.webview, "badge-frame-earned-v2.png"),
      this.assetUri(view.webview, "badge-frame-progress-v2.png"),
      this.assetUri(view.webview, "badge-icons-iron-v2.png"),
      this.assetUri(view.webview, "badge-icons-emerald-v2.png"),
      this.assetUri(view.webview, "badge-icons-gold-v2.png"),
      this.assetUri(view.webview, "phase-icons-v2.png"),
      this.assetUri(view.webview, "phase-planning-v2.png"),
      this.assetUri(view.webview, "phase-embarked-v2.png"),
      this.assetUri(view.webview, "phase-camp-v2.png"),
      this.assetUri(view.webview, "phase-no-quest-v2.png"),
      this.assetUri(view.webview, "phase-ready-v2.png"),
      this.assetUri(view.webview, "empty-states-v2.png"),
    ]);
    view.webview.html = buildCharacterSheetV2(this.state, {
      cspSource: view.webview.cspSource,
      nonce: nonce(),
      heroImgUri,
      heroBgUri,
      heroIdleUri,
      badgeSheetV2Uri,
      badgeShelfV2Uri,
      badgeFrameLockedV2Uri,
      badgeFrameEarnedV2Uri,
      badgeFrameProgressV2Uri,
      badgeIconsIronV2Uri,
      badgeIconsEmeraldV2Uri,
      badgeIconsGoldV2Uri,
      phaseSheetV2Uri,
      phasePlanningV2Uri,
      phaseEmbarkedV2Uri,
      phaseCampV2Uri,
      phaseNoQuestV2Uri,
      phaseReadyV2Uri,
      emptySheetV2Uri,
    });
  }

  // Webview URI for a bundled sprite, or null if not vendored yet (the builder
  // then falls back to its inline placeholder).
  private async assetUri(webview: vscode.Webview, filename: string): Promise<string | null> {
    const uri = vscode.Uri.joinPath(this.extensionUri, ...ASSET_DIR, filename);
    try {
      await vscode.workspace.fs.stat(uri);
      return webview.asWebviewUri(uri).toString();
    } catch {
      return null;
    }
  }

  private static initialState(): QuestState {
    return {
      loadingState: LoadingState.NoAdventurer,
      phase: QuestPhase.NoQuest,
      profile: null,
      expHistory: [],
      expFold: null,
      plannedExpeditions: [],
      activeQuest: null,
      scrolls: [],
      schemaVersion: null,
      error: null,
    };
  }
}

function nonce(): string {
  return crypto.randomUUID().replace(/-/g, "");
}
