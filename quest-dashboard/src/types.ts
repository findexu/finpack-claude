// Shared type truth for the quest-dashboard extension.
// Data formats mirror quest-system VERSION 2026.05.0003 (see skills/quest-system).

export const SUPPORTED_VERSION = "2026.05.0003";

export type Result<T> =
  | { ok: true; value: T }
  | { ok: false; error: string };

// Loading/empty states surfaced by the extension. Modelled as a const-object
// union (not a TS enum) so the data layer stays erasable and node:test can run
// the compiled output without runtime enum emit surprises.
export const LoadingState = {
  Ready: "ready",
  NoAdventurer: "no_adventurer",
  UnsupportedSchema: "unsupported_schema",
  Error: "error",
} as const;
export type LoadingState = (typeof LoadingState)[keyof typeof LoadingState];

// Lifecycle phase of the active quest, derived from scroll bodies. Drives the
// animated phase banner in the character sheet.
export const QuestPhase = {
  NoQuest: "no_quest",
  Planning: "planning",
  Ready: "ready",
  Embarked: "embarked",
  AtCamp: "at_camp",
} as const;
export type QuestPhase = (typeof QuestPhase)[keyof typeof QuestPhase];

export interface AdventurerProfile {
  adventurer: string;
  level: number;
  totalExp: number;
  questsCompleted: number;
  totalExpeditions: number;
  totalDangersMapped: number;
  totalOathsSworn: number;
  totalSplits: number;
  badges: string[];
}

export interface ExpHistoryEntry {
  questName: string;
  date: string; // YYYY-MM-DD from the entry heading
  expEarned: number;
  totalExpAfter: number;
  level: number;
}

export interface ActiveQuest {
  questFolderPath: string; // line 1 of active-quest.txt
  realm: string; // line 2 of active-quest.txt
}

export interface ScrollMeta {
  quest: string;
  realm: string;
  scroll: string;
  lastUpdated: string;
}

// A scroll located on disk for the active quest. `meta` is null when the file
// is absent or its frontmatter failed to parse — the tree still lists it so the
// user can open the raw file.
export interface ScrollFile {
  filename: string;
  fsPath: string;
  meta: ScrollMeta | null;
}

// Single source of truth consumed by every surface. Assembled by the state
// manager (next expedition); defined here so surfaces type against one shape.
export interface QuestState {
  loadingState: LoadingState;
  phase: QuestPhase;
  profile: AdventurerProfile | null;
  expHistory: ExpHistoryEntry[];
  activeQuest: ActiveQuest | null;
  scrolls: ScrollFile[];
  schemaVersion: string | null;
  error: string | null;
}

export interface LevelTier {
  level: number;
  title: string;
  threshold: number; // total EXP needed to reach this level
}

// Numeric profile stats a badge can track progress against.
export type NumericStat =
  | "level"
  | "questsCompleted"
  | "totalExpeditions"
  | "totalDangersMapped"
  | "totalOathsSworn"
  | "totalSplits";

export interface BadgeDef {
  icon: string;
  name: string;
  hint: string;
  // Counter-style unlock (e.g. quests-completed >= 5). Absent for per-quest
  // flag badges (Speed Runner, Clean Sweep) which have no progress counter.
  progress?: { stat: NumericStat; threshold: number };
}

export const LEVEL_TABLE: readonly LevelTier[] = [
  { level: 1, title: "Apprentice Coder", threshold: 0 },
  { level: 2, title: "Journeyman Developer", threshold: 150 },
  { level: 3, title: "Skilled Developer", threshold: 450 },
  { level: 4, title: "Senior Developer", threshold: 900 },
  { level: 5, title: "Expert Architect", threshold: 1500 },
  { level: 6, title: "Master Builder", threshold: 2250 },
  { level: 7, title: "Grand Master", threshold: 3150 },
  { level: 8, title: "Legendary Coder", threshold: 4200 },
  { level: 9, title: "Mythic Developer", threshold: 5400 },
  { level: 10, title: "Transcendent Engineer", threshold: 6750 },
];

export const ALL_BADGES: readonly BadgeDef[] = [
  { icon: "🗡️", name: "First Blood", hint: "Complete your first quest", progress: { stat: "questsCompleted", threshold: 1 } },
  { icon: "📜", name: "Scroll Keeper", hint: "Complete 5 quests", progress: { stat: "questsCompleted", threshold: 5 } },
  { icon: "⚔️", name: "Veteran Adventurer", hint: "Complete 10 quests", progress: { stat: "questsCompleted", threshold: 10 } },
  { icon: "🏆", name: "Legend", hint: "Complete 25 quests", progress: { stat: "questsCompleted", threshold: 25 } },
  { icon: "🕵️", name: "Danger Mapper", hint: "Map 10 total dangers", progress: { stat: "totalDangersMapped", threshold: 10 } },
  { icon: "☠️", name: "Danger Hoarder", hint: "Map 50 total dangers", progress: { stat: "totalDangersMapped", threshold: 50 } },
  { icon: "🤝", name: "Oath Keeper", hint: "Swear 10 total oaths", progress: { stat: "totalOathsSworn", threshold: 10 } },
  { icon: "📚", name: "Lore Master", hint: "Swear 50 total oaths", progress: { stat: "totalOathsSworn", threshold: 50 } },
  { icon: "🚀", name: "Speed Runner", hint: "Complete a quest in 3 or fewer expeditions" },
  { icon: "🧘", name: "Marathoner", hint: "Log 50 total expeditions", progress: { stat: "totalExpeditions", threshold: 50 } },
  { icon: "🔥", name: "Unstoppable", hint: "Log 200 total expeditions", progress: { stat: "totalExpeditions", threshold: 200 } },
  { icon: "✨", name: "Clean Sweep", hint: "Complete a quest with zero open riddles" },
  { icon: "📂", name: "Split Master", hint: "Trigger 5 scroll splits", progress: { stat: "totalSplits", threshold: 5 } },
  { icon: "🌟", name: "Rising Star", hint: "Reach level 5", progress: { stat: "level", threshold: 5 } },
  { icon: "💎", name: "Diamond", hint: "Reach level 10", progress: { stat: "level", threshold: 10 } },
];
