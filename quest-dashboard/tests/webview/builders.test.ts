import assert from "node:assert/strict";
import { test } from "node:test";

import { buildBadgeGrid } from "../../src/webview/buildBadgeGrid";
import { buildCharacterSheet } from "../../src/webview/buildCharacterSheet";
import { buildExpChart } from "../../src/webview/buildExpChart";
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

const ASSETS = { cspSource: "vscode-resource:", nonce: "abc123", avatarUri: null, badgeSheetUri: null, heroSheetUri: null };

function readyState(overrides: Partial<QuestState> = {}): QuestState {
  return {
    loadingState: LoadingState.Ready,
    phase: QuestPhase.AtCamp,
    profile: PROFILE,
    expHistory: [],
    activeQuest: { questFolderPath: ".ai-context/quests/vs-code-QS-plugin", realm: "app" },
    scrolls: [],
    schemaVersion: null,
    error: null,
    ...overrides,
  };
}

test("badge grid marks an earned badge", () => {
  assert.match(buildBadgeGrid(PROFILE, null), /badge earned[^>]*>.*First Blood/s);
});

test("badge grid shows a progress counter on a locked badge", () => {
  assert.match(buildBadgeGrid(PROFILE, null), /2\/5/);
});

test("badge grid marks a threshold-met but unawarded badge as ready", () => {
  // Oath Keeper unlocks at 10 oaths; profile has 12 but it is not yet awarded.
  const ahead: AdventurerProfile = { ...PROFILE, totalOathsSworn: 12, badges: [] };
  assert.match(buildBadgeGrid(ahead, null), /badge ready[^>]*>[\s\S]*Oath Keeper/);
});

test("exp chart shows an empty message with no history", () => {
  assert.match(buildExpChart([]), /No history yet/);
});

test("exp chart draws a polyline when history has multiple entries", () => {
  const history: ExpHistoryEntry[] = [
    { questName: "a", date: "2026-05-01", expEarned: 100, totalExpAfter: 100, level: 1 },
    { questName: "b", date: "2026-05-10", expEarned: 200, totalExpAfter: 300, level: 2 },
  ];
  assert.match(buildExpChart(history), /<polyline/);
});

test("character sheet embeds the style nonce", () => {
  assert.match(buildCharacterSheet(readyState(), ASSETS), /nonce="abc123"/);
});

test("character sheet locks default-src in the CSP", () => {
  assert.match(buildCharacterSheet(readyState(), ASSETS), /default-src 'none'/);
});

test("character sheet renders the adventurer name and level title", () => {
  assert.match(buildCharacterSheet(readyState(), ASSETS), /Finde[\s\S]*Apprentice Coder/);
});

test("character sheet renders the no-adventurer empty state", () => {
  const state = readyState({ loadingState: LoadingState.NoAdventurer, profile: null });
  assert.match(buildCharacterSheet(state, ASSETS), /No adventurer yet/);
});

test("character sheet escapes HTML in the adventurer name", () => {
  const evil: AdventurerProfile = { ...PROFILE, adventurer: "a<script>b" };
  const html = buildCharacterSheet(readyState({ profile: evil }), ASSETS);
  assert.equal(html.includes("a<script>b"), false);
});

test("character sheet renders the phase banner for the current phase", () => {
  const html = buildCharacterSheet(readyState({ phase: QuestPhase.Embarked }), ASSETS);
  assert.match(html, /phase-embarked[\s\S]*On expedition/);
});

test("character sheet disables animation under prefers-reduced-motion", () => {
  assert.match(buildCharacterSheet(readyState(), ASSETS), /prefers-reduced-motion: reduce/);
});

test("character sheet includes a width-responsive layout rule", () => {
  assert.match(buildCharacterSheet(readyState(), ASSETS), /@container \(min-width: 460px\)/);
});

test("character sheet renders the animated hero when no avatar PNG is present", () => {
  const html = buildCharacterSheet(readyState(), ASSETS);
  assert.match(html, /class="avatar-hero"[\s\S]*hero-body/);
});

test("locked badge shows a padlock instead of the glyph", () => {
  // Scroll Keeper is locked for PROFILE (1 badge earned, 2 quests, threshold 5).
  assert.match(buildBadgeGrid(PROFILE, null), /badge locked[\s\S]*badge-lock/);
});

test("character sheet uses the 4-frame hero sheet when vendored", () => {
  const html = buildCharacterSheet(readyState(), { ...ASSETS, heroSheetUri: "vscode-resource://hero" });
  assert.match(html, /hero-frames-img[\s\S]*vscode-resource:\/\/hero/);
});

test("unsupported-schema state renders its message", () => {
  const state = readyState({ loadingState: LoadingState.UnsupportedSchema, profile: null, error: "bad version" });
  assert.match(buildCharacterSheet(state, ASSETS), /Unsupported quest-system schema/);
});
