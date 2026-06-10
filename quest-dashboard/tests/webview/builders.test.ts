import assert from "node:assert/strict";
import { test } from "node:test";

import { buildCharacterSheetV2 } from "../../src/webview/buildCharacterSheetV2";
import type { SheetAssets } from "../../src/webview/buildCharacterSheetV2";
import { buildExpChart } from "../../src/webview/buildExpChart";
import { buildChartModel } from "../../src/webview/chartData";
import { LoadingState, QuestPhase } from "../../src/types";
import type { AdventurerProfile, ExpEvent, ExpFold, ExpHistoryEntry, PlannedExpedition, QuestState, SideQuest } from "../../src/types";

const PROFILE: AdventurerProfile = {
  adventurer: "Finde",
  level: 1,
  totalExp: 40,
  questsCompleted: 2,
  totalExpeditions: 2,
  totalDangersMapped: 2,
  totalOathsSworn: 4,
  totalSplits: 0,
  badges: ["First Blood"],
};

const ASSETS: SheetAssets = {
  cspSource: "vscode-resource:",
  nonce: "abc123",
  heroImgUri: null,
  heroBgUri: "vscode-resource://hero-bg",
  heroIdleUri: "vscode-resource://hero-idle",
  badgeSheetV2Uri: "vscode-resource://badge-v2",
  badgeShelfV2Uri: "vscode-resource://badge-shelf-v2",
  badgeFrameLockedV2Uri: "vscode-resource://badge-frame-locked-v2",
  badgeFrameEarnedV2Uri: "vscode-resource://badge-frame-earned-v2",
  badgeFrameProgressV2Uri: "vscode-resource://badge-frame-progress-v2",
  badgeIconsIronV2Uri: "vscode-resource://badge-icons-iron-v2",
  badgeIconsEmeraldV2Uri: "vscode-resource://badge-icons-emerald-v2",
  badgeIconsGoldV2Uri: "vscode-resource://badge-icons-gold-v2",
  phaseSheetV2Uri: "vscode-resource://phase-v2",
  phasePlanningV2Uri: "vscode-resource://phase-planning-v2",
  phaseEmbarkedV2Uri: "vscode-resource://phase-embarked-v2",
  phaseCampV2Uri: "vscode-resource://phase-camp-v2",
  phaseNoQuestV2Uri: "vscode-resource://phase-no-quest-v2",
  phaseReadyV2Uri: "vscode-resource://phase-ready-v2",
  emptySheetV2Uri: "vscode-resource://empty-v2",
};

function readyState(overrides: Partial<QuestState> = {}): QuestState {
  return {
    loadingState: LoadingState.Ready,
    phase: QuestPhase.AtCamp,
    profile: PROFILE,
    expHistory: [],
    expFold: null,
    plannedExpeditions: [],
    activeQuest: { questFolderPath: ".ai-context/quests/vs-code-QS-plugin", realm: "app" },
    scrolls: [],
    openSideQuests: [],
    schemaVersion: null,
    error: null,
    ...overrides,
  };
}

test("exp chart shows an empty message with no history", () => {
  const model = buildChartModel({ fold: null, history: [], profile: PROFILE, activeLeaf: null, plannedCount: 0 });
  assert.match(buildExpChart(model), /No history yet/);
});

test("exp chart draws a polyline when history has multiple entries", () => {
  const history: ExpHistoryEntry[] = [
    { questName: "a", date: "2026-05-01", expEarned: 100, totalExpAfter: 100, level: 1 },
    { questName: "b", date: "2026-05-10", expEarned: 200, totalExpAfter: 300, level: 2 },
  ];
  const model = buildChartModel({ fold: null, history, profile: PROFILE, activeLeaf: null, plannedCount: 0 });
  assert.match(buildExpChart(model), /<polyline/);
});

test("character sheet embeds the style nonce", () => {
  assert.match(buildCharacterSheetV2(readyState(), ASSETS), /nonce="abc123"/);
});

test("character sheet locks default-src in the CSP", () => {
  assert.match(buildCharacterSheetV2(readyState(), ASSETS), /default-src 'none'/);
});

test("character sheet renders the adventurer name and tiered level title", () => {
  assert.match(buildCharacterSheetV2(readyState(), ASSETS), /Finde[\s\S]*Apprentice Coder I/);
});

test("character sheet renders the no-adventurer empty state", () => {
  const state = readyState({ loadingState: LoadingState.NoAdventurer, profile: null });
  assert.match(buildCharacterSheetV2(state, ASSETS), /No adventurer yet/);
});

test("character sheet escapes HTML in the adventurer name", () => {
  const evil: AdventurerProfile = { ...PROFILE, adventurer: "a<script>b" };
  const html = buildCharacterSheetV2(readyState({ profile: evil }), ASSETS);
  assert.equal(html.includes("a<script>b"), false);
});

test("character sheet renders the v2 frame and badge grid", () => {
  const html = buildCharacterSheetV2(readyState(), ASSETS);
  assert.match(html, /class="v2-frame"/);
  assert.match(html, /v2-badge-grid/);
  assert.match(html, /vscode-resource:\/\/badge-frame-earned-v2/);
  assert.match(html, /vscode-resource:\/\/badge-frame-locked-v2/);
  assert.match(html, /vscode-resource:\/\/badge-icons-gold-v2/);
  assert.match(html, /vscode-resource:\/\/badge-icons-iron-v2/);
});

test("phase banners use their individual icon assets", () => {
  const phases = [
    [QuestPhase.NoQuest, "phase-no-quest-v2"],
    [QuestPhase.Planning, "phase-planning-v2"],
    [QuestPhase.Ready, "phase-ready-v2"],
    [QuestPhase.Embarked, "phase-embarked-v2"],
    [QuestPhase.AtCamp, "phase-camp-v2"],
  ] as const;

  for (const [phase, assetName] of phases) {
    const html = buildCharacterSheetV2(readyState({ phase }), ASSETS);
    assert.match(html, new RegExp(`vscode-resource:\\/\\/${assetName}`));
  }
});

test("badge over 75 percent progress uses the progress frame and emerald icons", () => {
  const html = buildCharacterSheetV2(
    readyState({ profile: { ...PROFILE, badges: [], totalDangersMapped: 8 } }),
    ASSETS,
  );
  assert.match(html, /v2-badge-on-progress/);
  assert.match(html, /vscode-resource:\/\/badge-frame-progress-v2/);
  assert.match(html, /vscode-resource:\/\/badge-icons-emerald-v2/);
});

test("statistics render raw five-digit values without per-stat icons", () => {
  const html = buildCharacterSheetV2(readyState({ profile: { ...PROFILE, totalExp: 54321 } }), ASSETS);
  assert.equal(html.includes("v2-stat-icon"), false);
  assert.match(html, /v2-stat-value">54321/);
});

test("open side-quests render in the status panel", () => {
  const sideQuests: SideQuest[] = [
    { slug: "badge-label-font", fsPath: "/x/.ai-context/side-quests/badge-label-font/NOTE.md" },
    { slug: "tidy-logs", fsPath: "/x/.ai-context/side-quests/tidy-logs/NOTE.md" },
  ];
  const html = buildCharacterSheetV2(readyState({ openSideQuests: sideQuests }), ASSETS);
  assert.match(html, /Side-Quests \(2\)/);
  assert.match(html, /badge-label-font/);
  assert.match(html, /tidy-logs/);
});

test("empty side-quest list renders no side-quest section", () => {
  const html = buildCharacterSheetV2(readyState({ openSideQuests: [] }), ASSETS);
  assert.equal(html.includes("v2-side-quests"), false);
});

test("unsupported-schema state renders its message", () => {
  const state = readyState({ loadingState: LoadingState.UnsupportedSchema, profile: null, error: "bad version" });
  assert.match(buildCharacterSheetV2(state, ASSETS), /Unsupported Version/);
});

test("empty state uses the v2 empty-state sprite sheet", () => {
  const state = readyState({ loadingState: LoadingState.NoAdventurer, profile: null });
  const html = buildCharacterSheetV2(state, ASSETS);
  assert.match(html, /v2-empty/);
  assert.match(html, /vscode-resource:\/\/empty-v2/);
});

const QUEST = { questFolderPath: ".ai-context/quests/q", realm: "app" };

function exped(date: string, expDelta: number, dangers = 0, oaths = 0): ExpEvent {
  return { type: "expedition", date, quest: "q", expDelta, cumExp: expDelta, dangers, oaths, split: false };
}

function fold(events: ExpEvent[]): ExpFold {
  return { seedExp: 0, events, totalExp: events.reduce((sum, e) => sum + e.expDelta, 0) };
}

function plan(label: string, status: PlannedExpedition["status"], order = 0): PlannedExpedition {
  return { label, status, order };
}

function countMatches(html: string, cls: string): number {
  return html.split(cls).length - 1;
}

test("the tracker renders a done row per active-leaf expedition with its EXP", () => {
  const state = readyState({ activeQuest: QUEST, expFold: fold([exped("2026-06-01", 5), exped("2026-06-02", 15)]) });
  const html = buildCharacterSheetV2(state, ASSETS);
  assert.equal(countMatches(html, "v2-exped-row v2-exped-done"), 2);
  assert.match(html, /\+15 XP/);
});

test("the tracker shows an active row when on expedition", () => {
  const state = readyState({ activeQuest: QUEST, phase: QuestPhase.Embarked, expFold: fold([]) });
  assert.match(buildCharacterSheetV2(state, ASSETS), /v2-exped-row v2-exped-active/);
});

test("the tracker lists planned expeditions from the checklist", () => {
  const state = readyState({ activeQuest: QUEST, expFold: fold([]), plannedExpeditions: [plan("wire projection", "planned")] });
  const html = buildCharacterSheetV2(state, ASSETS);
  assert.match(html, /v2-exped-row v2-exped-planned/);
  assert.match(html, /wire projection/);
});

test("the counts header reflects the full done total, not the capped rows", () => {
  const events = Array.from({ length: 8 }, (_, i) => exped(`2026-06-0${i + 1}`, 5));
  const html = buildCharacterSheetV2(readyState({ activeQuest: QUEST, expFold: fold(events) }), ASSETS);
  assert.match(html, /8 done/);
});

test("a planned label equal to the active label is not duplicated", () => {
  const state = readyState({
    activeQuest: QUEST,
    phase: QuestPhase.Embarked,
    expFold: fold([]),
    plannedExpeditions: [plan("same", "active"), plan("same", "planned", 1)],
  });
  const html = buildCharacterSheetV2(state, ASSETS);
  assert.match(html, /v2-exped-row v2-exped-active/);
  assert.equal(countMatches(html, "v2-exped-row v2-exped-planned"), 0);
});

test("done rows cap at three with an overflow line", () => {
  const events = Array.from({ length: 8 }, (_, i) => exped(`2026-06-0${i + 1}`, 5));
  const html = buildCharacterSheetV2(readyState({ activeQuest: QUEST, expFold: fold(events) }), ASSETS);
  assert.equal(countMatches(html, "v2-exped-row v2-exped-done"), 3);
  assert.match(html, /\+5 earlier/);
});

test("a just-embarked quest with no expeditions shows zero done and an active row", () => {
  const state = readyState({ activeQuest: QUEST, phase: QuestPhase.Embarked, expFold: fold([]) });
  const html = buildCharacterSheetV2(state, ASSETS);
  assert.match(html, /0 done · 1 active/);
  assert.equal(countMatches(html, "v2-exped-row v2-exped-done"), 0);
});

test("a legacy install with no events.log shows no done rows", () => {
  const state = readyState({ activeQuest: QUEST, expFold: null });
  assert.equal(countMatches(buildCharacterSheetV2(state, ASSETS), "v2-exped-row v2-exped-done"), 0);
});

test("no active quest still renders the empty plate", () => {
  assert.match(buildCharacterSheetV2(readyState({ activeQuest: null }), ASSETS), /No active quest/);
});
