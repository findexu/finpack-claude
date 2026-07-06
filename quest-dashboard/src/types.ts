// Shared type truth for the quest-dashboard extension.
// Data formats mirror quest-system VERSION 2026.06.0007 (see skills/quest-system).

export const SUPPORTED_VERSION = "2026.06.0007";

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

// A folded XP event from `.claude/quest-xp/events.log`. Discriminated on `type` so
// `dangers`/`oaths` never carry two meanings on one shape: expedition lines record
// "any new this expedition" flags, quest-complete lines record per-count totals.
// `seed` lines are not events — they only set the fold baseline (see ExpFold).
interface ExpEventBase {
  date: string; // YYYY-MM-DD, raw from the log (display only)
  quest: string; // quest-name leaf
  expDelta: number; // EXP this event contributed (via expFormula)
  cumExp: number; // running total incl. the seed baseline
}
export type ExpEvent =
  | (ExpEventBase & { type: "expedition"; dangers: number; oaths: number; split: boolean })
  | (ExpEventBase & {
      type: "quest-complete";
      modules: number;
      expeditions: number;
      dangers: number;
      oaths: number;
      splits: number;
      clean: boolean;
      speed: boolean;
    });

// Result of folding the whole events.log. `seedExp` is the migration baseline from a
// leading `seed` line (0 if none); `totalExp` = seedExp + sum(expDelta) and equals
// the last event's `cumExp` when `events` is non-empty.
export interface ExpFold {
  seedExp: number;
  events: ExpEvent[];
  totalExp: number;
}

// One row of the `## Planned Expeditions` checklist in STRATEGY_SCROLL.md.
export type PlannedStatus = "done" | "active" | "planned";
export interface PlannedExpedition {
  label: string;
  status: PlannedStatus;
  order: number; // 0-based position in the checklist
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

// An open side-quest discovered under `.ai-context/side-quests/`. Side-quests
// run alongside the active quest (they never switch the pointer), so they are
// surfaced as a separate indicator rather than folded into the quest phase.
export interface SideQuest {
  slug: string;
  fsPath: string; // the side-quest's NOTE.md, for click-to-open
}

// One sub-agent launch recorded in `.claude/quest-xp/agents.log` by the
// PostToolUse(Agent|Task) hook: `{date}|agent|{quest-or--}|type={t};desc={d}`.
// The hook fires at agent COMPLETION, so timing reflects finish, not start.
export interface AgentActivity {
  date: string; // YYYY-MM-DD, raw from the log (display only)
  quest: string; // quest-name leaf, or "-" when none was active
  type: string; // subagent_type (e.g. fp-code-reviewer)
  desc: string; // one-line description, sanitized by the hook
}

// Single source of truth consumed by every surface. Assembled by the state
// manager (next expedition); defined here so surfaces type against one shape.
export interface QuestState {
  loadingState: LoadingState;
  phase: QuestPhase;
  profile: AdventurerProfile | null;
  expHistory: ExpHistoryEntry[];
  // Folded events.log for the per-expedition EXP curve; null when events.log is
  // absent (legacy install) — the chart falls back to the per-quest expHistory.
  expFold: ExpFold | null;
  // Active quest's `## Planned Expeditions` checklist; [] when absent.
  plannedExpeditions: PlannedExpedition[];
  activeQuest: ActiveQuest | null;
  scrolls: ScrollFile[];
  openSideQuests: SideQuest[];
  // Recent sub-agent launches (newest first), from agents.log. Optional so
  // existing QuestState literals (initialState, tests) need no change; absent
  // is treated as [] by surfaces.
  recentAgents?: AgentActivity[];
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

// Level math mirrors quest-system /quest-xp: levels run 1..50, each costs
// `level × 300` EXP over the previous one, so threshold(N) = 150 × N × (N − 1).
// Titles are tiered every 5 levels with a I–V rank inside the tier
// (e.g. level 1 = "Apprentice Coder I", level 50 = "Transcendent Engineer V").
export const MAX_LEVEL = 50;

const TIER_TITLES = [
  "Apprentice Coder",
  "Journeyman Developer",
  "Skilled Developer",
  "Senior Developer",
  "Expert Architect",
  "Master Builder",
  "Grand Master",
  "Legendary Coder",
  "Mythic Developer",
  "Transcendent Engineer",
] as const;
const TIER_RANKS = ["I", "II", "III", "IV", "V"] as const;

export const LEVEL_TABLE: readonly LevelTier[] = Array.from({ length: MAX_LEVEL }, (_, index) => {
  const level = index + 1;
  return {
    level,
    title: `${TIER_TITLES[Math.floor(index / TIER_RANKS.length)]} ${TIER_RANKS[index % TIER_RANKS.length]}`,
    threshold: 150 * level * (level - 1),
  };
});

export const ALL_BADGES: readonly BadgeDef[] = [
  { icon: "🗡️", name: "First Blood", hint: "Complete your first quest", progress: { stat: "questsCompleted", threshold: 1 } },
  { icon: "📜", name: "Scroll Keeper", hint: "Complete 5 quests", progress: { stat: "questsCompleted", threshold: 5 } },
  { icon: "⚔️", name: "Veteran", hint: "Complete 10 quests", progress: { stat: "questsCompleted", threshold: 10 } },
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
