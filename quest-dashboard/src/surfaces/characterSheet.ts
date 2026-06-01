import * as vscode from "vscode";

import { buildCharacterSheet } from "../webview/buildCharacterSheet";
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
    const [avatarUri, badgeSheetUri, heroSheetUri, heroImgUri, heroBgUri, heroIdleUri] = await Promise.all([
      this.assetUri(view.webview, "avatar.png"),
      this.assetUri(view.webview, "badge-sheet.png"),
      this.assetUri(view.webview, "hero-frames.png"),
      this.assetUri(view.webview, "hero.png"),
      this.assetUri(view.webview, "hero-bg.jpg"),
      this.assetUri(view.webview, "hero-idle.png"),
    ]);
    view.webview.html = buildCharacterSheet(this.state, {
      cspSource: view.webview.cspSource,
      nonce: nonce(),
      avatarUri,
      badgeSheetUri,
      heroSheetUri,
      heroImgUri,
      heroBgUri,
      heroIdleUri,
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
