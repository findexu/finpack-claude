import assert from "node:assert/strict";
import { test } from "node:test";

import { deriveBattlePlan } from "../src/battlePlan";
import { QuestPhase } from "../src/types";
import type { ExpEvent, ExpFold, PlannedExpedition } from "../src/types";

function exped(date: string, expDelta: number, dangers = 0, oaths = 0): ExpEvent {
  return { type: "expedition", date, quest: "q", expDelta, cumExp: expDelta, dangers, oaths, split: false };
}

function fold(events: ExpEvent[]): ExpFold {
  return { seedExp: 0, events, totalExp: events.reduce((sum, e) => sum + e.expDelta, 0) };
}

function plan(label: string, status: PlannedExpedition["status"], order = 0): PlannedExpedition {
  return { label, status, order };
}

function derive(overrides: Partial<Parameters<typeof deriveBattlePlan>[0]> = {}) {
  return deriveBattlePlan({ phase: QuestPhase.AtCamp, planned: [], expFold: fold([]), activeLeaf: "q", ...overrides });
}

test("a done row per active-leaf expedition, newest first, with its EXP", () => {
  const result = derive({ expFold: fold([exped("2026-06-01", 5), exped("2026-06-02", 15)]) });
  assert.deepEqual(
    result.rows.map((r) => [r.status, r.label, r.detail]),
    [
      ["done", "2026-06-02", "+15 XP"],
      ["done", "2026-06-01", "+5 XP"],
    ],
  );
});

test("done detail includes dangers and oaths flags", () => {
  const result = derive({ expFold: fold([exped("2026-06-01", 5, 2, 1)]) });
  assert.equal(result.rows[0].detail, "+5 XP · 2d · 1o");
});

test("expeditions of other quests are excluded", () => {
  const other: ExpEvent = { ...exped("2026-06-01", 5), quest: "other" };
  const result = derive({ expFold: fold([other]) });
  assert.equal(result.rows.length, 0);
});

test("an active row leads when on expedition", () => {
  const result = derive({ phase: QuestPhase.Embarked });
  assert.deepEqual(result.rows[0], { status: "active", label: "current expedition", detail: null });
});

test("planned expeditions from the checklist are listed", () => {
  const result = derive({ planned: [plan("wire projection", "planned")] });
  assert.deepEqual(result.rows, [{ status: "planned", label: "wire projection", detail: null }]);
});

test("a planned label equal to the active label is not duplicated", () => {
  const result = derive({
    phase: QuestPhase.Embarked,
    planned: [plan("same", "active"), plan("same", "planned", 1)],
  });
  assert.deepEqual(
    result.rows.map((r) => r.status),
    ["active"],
  );
});

test("counts reflect the full done total", () => {
  const events = Array.from({ length: 8 }, (_, i) => exped(`2026-06-0${i + 1}`, 5));
  const result = derive({ expFold: fold(events) });
  assert.deepEqual(result.counts, { done: 8, active: 0, planned: 0 });
});

test("a just-embarked quest with no expeditions counts zero done and one active", () => {
  const result = derive({ phase: QuestPhase.Embarked });
  assert.deepEqual(result.counts, { done: 0, active: 1, planned: 0 });
});

test("a legacy install with no events.log yields no done rows", () => {
  const result = derive({ expFold: null });
  assert.equal(result.rows.filter((r) => r.status === "done").length, 0);
});
