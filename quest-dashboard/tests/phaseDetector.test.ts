import assert from "node:assert/strict";
import { test } from "node:test";

import { detectPhase } from "../src/phaseDetector";
import { QuestPhase } from "../src/types";

const PLAN_LOCKED = "## The Battle Plan\n1. Do the thing.\n";
const PLAN_UNLOCKED = "## The Battle Plan\n(not yet defined — run /counsel-quest)\n";
const NO_RIDDLES = "## Open Riddles\n(none — all resolved)\n";
const RIDDLES = "## Open Riddles\n- Should we cache the parse?\n";

const CLOSED_ENTRY = "## Expedition 2026-05-01\n### Conquered\n- x\n### The Road Ahead\n- next\n";
const OPEN_ENTRY = "## Expedition 2026-05-02\n### Conquered\n- y\n";

test("no active quest is NoQuest", () => {
  assert.equal(detectPhase(PLAN_LOCKED + NO_RIDDLES, CLOSED_ENTRY, false), QuestPhase.NoQuest);
});

test("an open last journal entry is Embarked", () => {
  assert.equal(detectPhase(PLAN_LOCKED + NO_RIDDLES, CLOSED_ENTRY + OPEN_ENTRY, true), QuestPhase.Embarked);
});

test("open riddles is Planning", () => {
  assert.equal(detectPhase(PLAN_LOCKED + RIDDLES, CLOSED_ENTRY, true), QuestPhase.Planning);
});

test("an unlocked battle plan is Planning", () => {
  assert.equal(detectPhase(PLAN_UNLOCKED + NO_RIDDLES, "", true), QuestPhase.Planning);
});

test("a closed entry with locked plan and no riddles is AtCamp", () => {
  assert.equal(detectPhase(PLAN_LOCKED + NO_RIDDLES, CLOSED_ENTRY, true), QuestPhase.AtCamp);
});

test("locked plan, no riddles, no journal entries is Ready", () => {
  assert.equal(detectPhase(PLAN_LOCKED + NO_RIDDLES, "# Adventure Journal\n", true), QuestPhase.Ready);
});
