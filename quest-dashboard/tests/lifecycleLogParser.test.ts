import assert from "node:assert/strict";
import { test } from "node:test";

import { latestPhaseForQuest } from "../src/parsers/lifecycleLogParser";
import { QuestPhase } from "../src/types";

test("null log yields no phase", () => {
  assert.equal(latestPhaseForQuest(null, "scan-align"), null);
});

test("a log without a matching quest yields no phase", () => {
  const log = "2026-06-04|state|other-quest|phase=embarked\n";
  assert.equal(latestPhaseForQuest(log, "scan-align"), null);
});

test("the last state line for the quest wins", () => {
  const log = [
    "2026-06-04|state|scan-align|phase=planning",
    "2026-06-04|state|scan-align|phase=embarked",
    "2026-06-04|state|scan-align|phase=at-camp",
  ].join("\n");
  assert.equal(latestPhaseForQuest(log, "scan-align"), QuestPhase.AtCamp);
});

test("interleaved quests do not cross-contaminate", () => {
  const log = [
    "2026-06-04|state|scan-align|phase=embarked",
    "2026-06-04|state|dashboard|phase=planning",
  ].join("\n");
  assert.equal(latestPhaseForQuest(log, "scan-align"), QuestPhase.Embarked);
});

test("XP event lines are ignored", () => {
  const log = [
    "2026-06-04|state|scan-align|phase=embarked",
    "2026-06-04|expedition|scan-align|dangers=1;oaths=0;split=0",
  ].join("\n");
  assert.equal(latestPhaseForQuest(log, "scan-align"), QuestPhase.Embarked);
});

test("an unknown phase token is skipped, keeping the prior valid phase", () => {
  const log = [
    "2026-06-04|state|scan-align|phase=embarked",
    "2026-06-04|state|scan-align|phase=teleporting",
  ].join("\n");
  assert.equal(latestPhaseForQuest(log, "scan-align"), QuestPhase.Embarked);
});

test("no-quest token resolves to NoQuest", () => {
  const log = "2026-06-04|state|scan-align|phase=no-quest\n";
  assert.equal(latestPhaseForQuest(log, "scan-align"), QuestPhase.NoQuest);
});
