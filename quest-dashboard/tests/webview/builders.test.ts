import assert from "node:assert/strict";
import { test } from "node:test";

import { buildCharacterSheetV2 } from "../../src/webview/buildCharacterSheetV2";
import type { SheetAssets } from "../../src/webview/buildCharacterSheetV2";
import { buildExpChart } from "../../src/webview/buildExpChart";
import { buildChartModel } from "../../src/webview/chartData";
import { LoadingState, QuestPhase } from "../../src/types";
import type { AdventurerProfile, ExpHistoryEntry, QuestState } from "../../src/types";

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

test("status panel renders the quest name and realm", () => {
  const html = buildCharacterSheetV2(readyState(), ASSETS);
  assert.match(html, /vs-code-QS-plugin/);
  assert.match(html, /Realm:<\/span> app/);
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

test("no active quest still renders the empty plate", () => {
  assert.match(buildCharacterSheetV2(readyState({ activeQuest: null }), ASSETS), /No active quest/);
});
