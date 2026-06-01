import * as vscode from "vscode";

import { parseActiveQuest } from "./parsers/activeQuestParser";
import { parseHistory } from "./parsers/historyParser";
import { parseProfile } from "./parsers/profileParser";
import { parseScroll } from "./parsers/scrollParser";
import { detectPhase } from "./phaseDetector";
import { checkSchemaVersion } from "./schema";
import { LoadingState, QuestPhase } from "./types";
import type { ActiveQuest, ExpHistoryEntry, QuestState, ScrollFile } from "./types";

const PROFILE_PATH = [".claude", "quest-xp", "profile.md"];
const HISTORY_PATH = [".claude", "quest-xp", "quest-history.md"];
const ACTIVE_QUEST_PATH = [".claude", "active-quest.txt"];
const VERSION_PATH = [".claude", "commands", ".quest-system-version"];

const SCROLL_FILENAMES = [
  "STRATEGY_SCROLL.md",
  "TOME_OF_DANGERS.md",
  "ADVENTURE_JOURNAL.md",
  "WORLD_MAP.md",
  "ADVENTURERS_HANDBOOK.md",
];

const WATCH_PATTERNS = [
  ".claude/quest-xp/**",
  ".ai-context/quests/**",
  ".claude/active-quest.txt",
];

export interface SurfaceUpdate {
  update(state: QuestState): void;
}

export class StateManager implements vscode.Disposable {
  private readonly decoder = new TextDecoder("utf-8");
  private readonly watchers: vscode.FileSystemWatcher[] = [];
  private state: QuestState = StateManager.initialState();
  private refreshing = false;
  private queued = false;

  constructor(
    private readonly root: vscode.Uri,
    private readonly surfaces: SurfaceUpdate[],
  ) {}

  getState(): QuestState {
    return this.state;
  }

  activate(): void {
    for (const pattern of WATCH_PATTERNS) {
      const watcher = vscode.workspace.createFileSystemWatcher(new vscode.RelativePattern(this.root, pattern));
      const trigger = (): void => void this.refresh();
      watcher.onDidChange(trigger);
      watcher.onDidCreate(trigger);
      watcher.onDidDelete(trigger);
      this.watchers.push(watcher);
    }
    void this.refresh();
  }

  // Re-read every source and notify surfaces. Serialised: overlapping watcher
  // events coalesce into a single trailing refresh rather than racing.
  async refresh(): Promise<void> {
    if (this.refreshing) {
      this.queued = true;
      return;
    }
    this.refreshing = true;
    try {
      this.state = await this.buildState();
      for (const surface of this.surfaces) {
        surface.update(this.state);
      }
    } finally {
      this.refreshing = false;
      if (this.queued) {
        this.queued = false;
        void this.refresh();
      }
    }
  }

  dispose(): void {
    for (const watcher of this.watchers) {
      watcher.dispose();
    }
    this.watchers.length = 0;
  }

  private async buildState(): Promise<QuestState> {
    const versionText = await this.readText(this.uri(VERSION_PATH));
    const schemaVersion = versionText === null ? null : versionText.trim();

    const profileText = await this.readText(this.uri(PROFILE_PATH));
    const activeQuest = await this.readActiveQuest();
    const scrolls = activeQuest ? await this.readScrolls(activeQuest) : [];
    const expHistory = await this.readHistory();
    const phase = await this.detectPhase(activeQuest);

    const base = { phase, expHistory, activeQuest, scrolls, schemaVersion };

    if (profileText === null) {
      return { loadingState: LoadingState.NoAdventurer, profile: null, error: null, ...base };
    }

    const parsed = parseProfile(profileText);
    if (!parsed.ok) {
      return { loadingState: LoadingState.UnsupportedSchema, profile: null, error: parsed.error, ...base };
    }

    // Version gate only fires when the installed version file exists AND its
    // year-month drifted; absent file means "unknown" — trust the parse.
    if (schemaVersion !== null) {
      const status = checkSchemaVersion(schemaVersion);
      if (!status.ok && status.reason === "unsupported_version") {
        return {
          loadingState: LoadingState.UnsupportedSchema,
          profile: parsed.value,
          error: `quest-system schema ${schemaVersion} is not supported by this extension`,
          ...base,
        };
      }
    }

    return { loadingState: LoadingState.Ready, profile: parsed.value, error: null, ...base };
  }

  private async detectPhase(activeQuest: ActiveQuest | null): Promise<QuestPhase> {
    if (activeQuest === null) {
      return detectPhase(null, null, false);
    }
    const questDir = vscode.Uri.joinPath(this.root, ...activeQuest.questFolderPath.split("/"));
    const [strategyText, journalText] = await Promise.all([
      this.readText(vscode.Uri.joinPath(questDir, "STRATEGY_SCROLL.md")),
      this.readText(vscode.Uri.joinPath(questDir, "ADVENTURE_JOURNAL.md")),
    ]);
    return detectPhase(strategyText, journalText, true);
  }

  private async readActiveQuest(): Promise<ActiveQuest | null> {
    const text = await this.readText(this.uri(ACTIVE_QUEST_PATH));
    if (text === null) {
      return null;
    }
    const parsed = parseActiveQuest(text);
    return parsed.ok ? parsed.value : null;
  }

  private async readHistory(): Promise<ExpHistoryEntry[]> {
    const text = await this.readText(this.uri(HISTORY_PATH));
    if (text === null) {
      return [];
    }
    const parsed = parseHistory(text);
    return parsed.ok ? parsed.value : [];
  }

  private async readScrolls(activeQuest: ActiveQuest): Promise<ScrollFile[]> {
    const questDir = vscode.Uri.joinPath(this.root, ...activeQuest.questFolderPath.split("/"));
    const scrolls: ScrollFile[] = [];
    for (const filename of SCROLL_FILENAMES) {
      const fileUri = vscode.Uri.joinPath(questDir, filename);
      const text = await this.readText(fileUri);
      const parsed = text === null ? null : parseScroll(text);
      scrolls.push({
        filename,
        fsPath: fileUri.fsPath,
        meta: parsed && parsed.ok ? parsed.value : null,
      });
    }
    return scrolls;
  }

  private uri(segments: string[]): vscode.Uri {
    return vscode.Uri.joinPath(this.root, ...segments);
  }

  private async readText(uri: vscode.Uri): Promise<string | null> {
    try {
      const bytes = await vscode.workspace.fs.readFile(uri);
      return this.decoder.decode(bytes);
    } catch {
      // Missing file is an expected empty state, not an error.
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
