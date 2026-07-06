import * as vscode from "vscode";

import { leafName } from "./leafName";
import { parseActiveQuest } from "./parsers/activeQuestParser";
import { parseAgentsLog } from "./parsers/agentsLogParser";
import { parseEventsLog } from "./parsers/eventsLogParser";
import { latestPhaseForQuest } from "./parsers/lifecycleLogParser";
import { parseHistory } from "./parsers/historyParser";
import { parsePlannedExpeditions } from "./parsers/plannedExpeditionsParser";
import { parseProfile } from "./parsers/profileParser";
import { parseScroll } from "./parsers/scrollParser";
import { detectPhase } from "./phaseDetector";
import { checkSchemaVersion } from "./schema";
import { LoadingState, QuestPhase } from "./types";
import type { ActiveQuest, AgentActivity, ExpFold, ExpHistoryEntry, PlannedExpedition, QuestState, ScrollFile, SideQuest } from "./types";

const PROFILE_PATH = [".claude", "quest-xp", "profile.md"];
const HISTORY_PATH = [".claude", "quest-xp", "quest-history.md"];
const EVENTS_PATH = [".claude", "quest-xp", "events.log"];
const LIFECYCLE_PATH = [".claude", "quest-xp", "lifecycle.log"];
const AGENTS_PATH = [".claude", "quest-xp", "agents.log"];
const RECENT_AGENTS_LIMIT = 20;
const ACTIVE_QUEST_PATH = [".claude", "active-quest.txt"];
const VERSION_PATH = [".claude", "commands", ".quest-system-version"];
const SIDE_QUESTS_PATH = [".ai-context", "side-quests"];

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
  ".ai-context/side-quests/**",
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
    const expFold = await this.readExpFold();
    const plannedExpeditions = await this.readPlannedExpeditions(activeQuest);
    const phase = await this.detectPhase(activeQuest);
    const openSideQuests = await this.readSideQuests();
    const recentAgents = await this.readAgents();

    const base = { phase, expHistory, expFold, plannedExpeditions, activeQuest, scrolls, openSideQuests, recentAgents, schemaVersion };

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

  // Lifecycle commands record each transition as a `state` line in lifecycle.log,
  // so that is the authoritative real-time signal (notably the only one /embark
  // emits). Scroll inference is the fallback for quests with no state line yet
  // (e.g. installs predating the state-event feature).
  private async detectPhase(activeQuest: ActiveQuest | null): Promise<QuestPhase> {
    if (activeQuest === null) {
      return detectPhase(null, null, false);
    }
    const questName = leafName(activeQuest.questFolderPath);
    const lifecycleText = await this.readText(this.uri(LIFECYCLE_PATH));
    const fromEvents = latestPhaseForQuest(lifecycleText, questName);
    if (fromEvents !== null) {
      return fromEvents;
    }
    const questDir = vscode.Uri.joinPath(this.root, ...activeQuest.questFolderPath.split("/"));
    const [strategyText, journalText] = await Promise.all([
      this.readText(vscode.Uri.joinPath(questDir, "STRATEGY_SCROLL.md")),
      this.readText(vscode.Uri.joinPath(questDir, "ADVENTURE_JOURNAL.md")),
    ]);
    return detectPhase(strategyText, journalText, true);
  }

  // Open side-quests are the directories directly under `.ai-context/side-quests/`
  // excluding the `done/` archive. Each holds one NOTE.md. Closing a side-quest
  // moves its folder into `done/`, which fires the watcher and drops it here.
  private async readSideQuests(): Promise<SideQuest[]> {
    const dir = this.uri(SIDE_QUESTS_PATH);
    let entries: [string, vscode.FileType][];
    try {
      entries = await vscode.workspace.fs.readDirectory(dir);
    } catch {
      return [];
    }
    return entries
      .filter(([name, type]) => type === vscode.FileType.Directory && name !== "done")
      .map(([name]) => ({
        slug: name,
        fsPath: vscode.Uri.joinPath(dir, name, "NOTE.md").fsPath,
      }))
      .sort((a, b) => a.slug.localeCompare(b.slug));
  }

  // Recent sub-agent launches from agents.log (written by the trace hook). The
  // log is append-only chronological; return the last N newest-first for the
  // "recent sub-agents" tree group. Absent log -> [].
  private async readAgents(): Promise<AgentActivity[]> {
    const text = await this.readText(this.uri(AGENTS_PATH));
    const all = parseAgentsLog(text);
    return all.slice(-RECENT_AGENTS_LIMIT).reverse();
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

  // null when events.log is absent (legacy install — the chart falls back to the
  // per-quest expHistory). A present-but-empty log folds to an empty (non-null)
  // ExpFold; the panel uses that distinction for its legacy done-rows trim.
  private async readExpFold(): Promise<ExpFold | null> {
    const text = await this.readText(this.uri(EVENTS_PATH));
    if (text === null) {
      return null;
    }
    const parsed = parseEventsLog(text);
    return parsed.ok ? parsed.value : null;
  }

  // Explicit read of the active quest's STRATEGY_SCROLL.md — detectPhase only reads
  // it in its fallback branch, so the common path would otherwise never load it.
  private async readPlannedExpeditions(activeQuest: ActiveQuest | null): Promise<PlannedExpedition[]> {
    if (activeQuest === null) {
      return [];
    }
    const questDir = vscode.Uri.joinPath(this.root, ...activeQuest.questFolderPath.split("/"));
    const text = await this.readText(vscode.Uri.joinPath(questDir, "STRATEGY_SCROLL.md"));
    const parsed = parsePlannedExpeditions(text);
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
      expFold: null,
      plannedExpeditions: [],
      activeQuest: null,
      scrolls: [],
      openSideQuests: [],
      schemaVersion: null,
      error: null,
    };
  }
}
