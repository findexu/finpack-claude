import assert from "node:assert/strict";
import { test } from "node:test";

import { parseEventsLog } from "../../src/parsers/eventsLogParser";
import { unwrap } from "../_util";

const SEED = "2026-06-02|seed|-|total-exp=2790;expeditions=10;dangers=16;oaths=33;splits=0";

test("null content yields an empty fold", () => {
  const fold = unwrap(parseEventsLog(null));
  assert.deepEqual(fold, { seedExp: 0, events: [], totalExp: 0 });
});

test("whitespace-only content yields an empty fold", () => {
  const fold = unwrap(parseEventsLog("  \n\n  "));
  assert.equal(fold.totalExp, 0);
});

test("a leading seed line sets the baseline with no events", () => {
  const fold = unwrap(parseEventsLog(SEED));
  assert.equal(fold.seedExp, 2790);
  assert.equal(fold.events.length, 0);
  assert.equal(fold.totalExp, 2790);
});

test("a single expedition with no seed folds from zero", () => {
  const fold = unwrap(parseEventsLog("2026-06-05|expedition|q|dangers=0;oaths=0;split=0"));
  assert.equal(fold.totalExp, 5);
  assert.equal(fold.events[0].cumExp, 5);
});

test("expedition exp follows the danger/oath flag matrix", () => {
  const log = [
    "2026-06-05|expedition|q|dangers=0;oaths=0;split=0",
    "2026-06-05|expedition|q|dangers=2;oaths=0;split=0",
    "2026-06-05|expedition|q|dangers=0;oaths=1;split=0",
    "2026-06-05|expedition|q|dangers=3;oaths=4;split=1",
  ].join("\n");
  const deltas = unwrap(parseEventsLog(log)).events.map((e) => e.expDelta);
  assert.deepEqual(deltas, [5, 15, 15, 25]);
});

test("quest-complete exp matches the reward formula", () => {
  const fold = unwrap(parseEventsLog("2026-06-09|quest-complete|q|modules=3;expeditions=4;dangers=5;oaths=2;splits=1;clean=1;speed=0"));
  assert.equal(fold.events[0].expDelta, 455);
});

test("cumExp is monotonic and totalExp equals the last cumExp over a mixed log", () => {
  const log = [SEED, "2026-06-05|expedition|q|dangers=1;oaths=0;split=0", "2026-06-09|quest-complete|q|modules=1;expeditions=1;dangers=0;oaths=0;splits=0;clean=0;speed=0"].join("\n");
  const fold = unwrap(parseEventsLog(log));
  const cums = fold.events.map((e) => e.cumExp);
  assert.deepEqual(cums, [2805, 2940]); // 2790+15, +150
  assert.equal(fold.totalExp, 2940);
});

test("a torn line is skipped while surrounding events still fold", () => {
  const log = ["2026-06-05|expedition|q|dangers=1;oaths=0;split=0", "2026-06-05|expedition|q|dangers=x;oaths=0;split=0", "2026-06-06|expedition|q|dangers=0;oaths=1;split=0"].join("\n");
  const fold = unwrap(parseEventsLog(log));
  assert.equal(fold.events.length, 2);
  assert.equal(fold.totalExp, 30);
});

test("an unknown event type is skipped", () => {
  const fold = unwrap(parseEventsLog("2026-06-05|side-quest|q|foo=1"));
  assert.equal(fold.events.length, 0);
});

test("a seed line that is not first is ignored", () => {
  const log = ["2026-06-05|expedition|q|dangers=0;oaths=0;split=0", SEED].join("\n");
  const fold = unwrap(parseEventsLog(log));
  assert.equal(fold.seedExp, 0);
  assert.equal(fold.totalExp, 5);
});

test("events keep their own quest leaf across a multi-quest log", () => {
  const log = ["2026-06-05|expedition|alpha|dangers=0;oaths=0;split=0", "2026-06-06|expedition|beta|dangers=0;oaths=0;split=0"].join("\n");
  const quests = unwrap(parseEventsLog(log)).events.map((e) => e.quest);
  assert.deepEqual(quests, ["alpha", "beta"]);
});

test("the discriminated union exposes type-specific fields", () => {
  const log = ["2026-06-05|expedition|q|dangers=0;oaths=0;split=1", "2026-06-09|quest-complete|q|modules=2;expeditions=1;dangers=0;oaths=0;splits=3;clean=1;speed=0"].join("\n");
  const fold = unwrap(parseEventsLog(log));
  const exped = fold.events[0];
  const complete = fold.events[1];
  assert.equal(exped.type === "expedition" && exped.split, true);
  assert.equal(complete.type === "quest-complete" && complete.splits, 3);
});
