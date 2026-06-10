import assert from "node:assert/strict";
import { test } from "node:test";

import { buildChartModel } from "../../src/webview/chartData";
import type { AdventurerProfile, ExpEvent, ExpFold, ExpHistoryEntry } from "../../src/types";

function profile(totalExp: number): AdventurerProfile {
  return { adventurer: "T", level: 1, totalExp, questsCompleted: 0, totalExpeditions: 0, totalDangersMapped: 0, totalOathsSworn: 0, totalSplits: 0, badges: [] };
}

function exped(quest: string, expDelta: number): Omit<Extract<ExpEvent, { type: "expedition" }>, "cumExp"> {
  return { type: "expedition", date: "2026-01-01", quest, expDelta, dangers: 0, oaths: 0, split: false };
}

function done(quest: string, expDelta: number): Omit<Extract<ExpEvent, { type: "quest-complete" }>, "cumExp"> {
  return { type: "quest-complete", date: "2026-01-01", quest, expDelta, modules: 0, expeditions: 0, dangers: 0, oaths: 0, splits: 0, clean: false, speed: false };
}

function fold(seedExp: number, specs: Array<Omit<ExpEvent, "cumExp">>): ExpFold {
  let cum = seedExp;
  const events = specs.map((s) => {
    cum += s.expDelta;
    return { ...s, cumExp: cum } as ExpEvent;
  });
  return { seedExp, events, totalExp: cum };
}

function entry(questName: string, totalExpAfter: number): ExpHistoryEntry {
  return { questName, date: "2026-01-01", expEarned: 0, totalExpAfter, level: 1 };
}

test("no fold and no history yields the empty mode", () => {
  const m = buildChartModel({ fold: null, history: [], profile: profile(0), activeLeaf: null, plannedCount: 0 });
  assert.equal(m.mode, "empty");
  assert.equal(m.nowHead, null);
  assert.equal(m.threshold, null);
  assert.equal(m.projection, null);
});

test("fold absent with history falls back to quests mode", () => {
  const m = buildChartModel({ fold: null, history: [entry("a", 100), entry("b", 300)], profile: profile(300), activeLeaf: null, plannedCount: 0 });
  assert.equal(m.mode, "quests");
  assert.equal(m.xAxisLabel, "Quests");
  assert.equal(m.points.every((p) => p.isMilestone), true);
});

test("fold with events drives expeditions mode and flags quest-complete milestones", () => {
  const f = fold(0, [exped("q", 25), done("q", 100)]);
  const m = buildChartModel({ fold: f, history: [], profile: profile(125), activeLeaf: "q", plannedCount: 0 });
  assert.equal(m.mode, "expeditions");
  assert.equal(m.points[0].isMilestone, false);
  assert.equal(m.points[1].isMilestone, true);
});

test("only active-leaf events are flagged in the active segment", () => {
  const f = fold(0, [exped("alpha", 25), exped("beta", 25)]);
  const m = buildChartModel({ fold: f, history: [], profile: profile(50), activeLeaf: "beta", plannedCount: 0 });
  assert.deepEqual(m.points.map((p) => p.inActiveSegment), [false, true]);
});

test("reconciliation scales interior points and pins the now-head to the profile total", () => {
  const f = fold(0, [exped("q", 10), exped("q", 10), exped("q", 20)]); // totalExp 40
  const m = buildChartModel({ fold: f, history: [], profile: profile(80), activeLeaf: "q", plannedCount: 0 });
  assert.equal(m.nowHead?.exp, 80);
  assert.equal(m.points[1].exp, 40); // interior point 20 scaled by 80/40
});

test("a zero fold total skips scaling without throwing", () => {
  const f: ExpFold = { seedExp: 0, events: [{ ...exped("q", 0), cumExp: 0 }], totalExp: 0 };
  const m = buildChartModel({ fold: f, history: [], profile: profile(0), activeLeaf: "q", plannedCount: 0 });
  assert.equal(m.points[0].exp, 0);
});

test("the quests-mode now-head sits at the curve end, not the profile total", () => {
  const m = buildChartModel({ fold: null, history: [entry("a", 100), entry("b", 300)], profile: profile(4650), activeLeaf: null, plannedCount: 0 });
  assert.equal(m.nowHead?.exp, 300);
});

test("a single-point series produces finite coordinates", () => {
  const f = fold(0, [exped("q", 25)]);
  const m = buildChartModel({ fold: f, history: [], profile: profile(25), activeLeaf: "q", plannedCount: 0 });
  assert.equal(Number.isFinite(m.points[0].x), true);
  assert.equal(Number.isFinite(m.points[0].y), true);
});

test("the threshold is null at max level", () => {
  const f = fold(0, [exped("q", 25), exped("q", 25)]);
  const m = buildChartModel({ fold: f, history: [], profile: profile(400000), activeLeaf: "q", plannedCount: 0 });
  assert.equal(m.threshold, null);
  assert.equal(m.projection, null);
});

test("the threshold reports the next level below max", () => {
  const f = fold(200, [exped("q", 25), exped("q", 25)]); // totalExp 250 -> level 1, next level 2
  const m = buildChartModel({ fold: f, history: [], profile: profile(250), activeLeaf: "q", plannedCount: 0 });
  assert.equal(m.threshold?.level, 2);
  assert.equal(m.threshold !== null && m.threshold.y >= 0 && m.threshold.y <= 120, true);
});

test("projection is omitted with fewer than two active-leaf expeditions", () => {
  const f = fold(200, [exped("q", 25), done("q", 25)]);
  const m = buildChartModel({ fold: f, history: [], profile: profile(250), activeLeaf: "q", plannedCount: 0 });
  assert.equal(m.projection, null);
});

test("projection reports expeditions-to-next using only expedition slope", () => {
  // totalExp 250 -> remaining to level 2 (threshold 300) is 50; slope 25 -> need 2.
  const f = fold(200, [exped("q", 25), exped("q", 25), done("q", 1000)]);
  const m = buildChartModel({ fold: f, history: [], profile: profile(250), activeLeaf: "q", plannedCount: 0 });
  // the 1000 quest-complete lump must NOT skew the slope.
  assert.equal(m.projection?.expeditions, 2);
  assert.equal(m.projection?.level, 2);
});

test("projection reserves horizontal room so the series compresses left", () => {
  const f = fold(200, [exped("q", 25), exped("q", 25)]);
  const m = buildChartModel({ fold: f, history: [], profile: profile(250), activeLeaf: "q", plannedCount: 0 });
  const lastSeries = m.points[m.points.length - 1];
  assert.equal(lastSeries.x < 306, true); // WIDTH - PAD
  assert.equal(m.projection !== null && m.projection.to.x > lastSeries.x, true);
});
