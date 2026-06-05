import assert from "node:assert/strict";
import { test } from "node:test";

import { parseProfile } from "../../src/parsers/profileParser";
import { unwrap } from "../_util";

const BASIC = `---
adventurer: Finde
level: 3
total-exp: 500
quests-completed: 2
total-expeditions: 5
total-dangers-mapped: 6
total-oaths-sworn: 17
total-splits: 0
badges:
  - First Blood
---
# Finde's Adventurer Profile
`;

test("parses the adventurer name", () => {
  assert.equal(unwrap(parseProfile(BASIC)).adventurer, "Finde");
});

test("parses the level", () => {
  assert.equal(unwrap(parseProfile(BASIC)).level, 3);
});

test("parses the badges list", () => {
  assert.deepEqual(unwrap(parseProfile(BASIC)).badges, ["First Blood"]);
});

test("canonicalizes legacy emoji-prefixed badge names to the plain name", () => {
  const legacy = `---
adventurer: Finde
level: 10
total-exp: 7895
quests-completed: 5
total-expeditions: 32
total-dangers-mapped: 102
total-oaths-sworn: 112
total-splits: 1
badges: ["🗡️ First Blood", "✨ Clean Sweep", "💎 Diamond"]
---
`;
  assert.deepEqual(unwrap(parseProfile(legacy)).badges, ["First Blood", "Clean Sweep", "Diamond"]);
});

test("leaves an unrecognized badge entry untouched", () => {
  const odd = `---
adventurer: Finde
level: 1
total-exp: 0
quests-completed: 0
total-expeditions: 0
total-dangers-mapped: 0
total-oaths-sworn: 0
total-splits: 0
badges: ["Mystery Badge"]
---
`;
  assert.deepEqual(unwrap(parseProfile(odd)).badges, ["Mystery Badge"]);
});

test("coerces quoted numeric frontmatter to a number", () => {
  const quoted = `---
adventurer: Finde
level: "4"
total-exp: "900"
quests-completed: "3"
total-expeditions: "8"
total-dangers-mapped: "10"
total-oaths-sworn: "20"
total-splits: "0"
badges: []
---
`;
  assert.equal(unwrap(parseProfile(quoted)).level, 4);
});

test("defaults badges to an empty list when absent", () => {
  const noBadges = `---
adventurer: Finde
level: 1
total-exp: 0
quests-completed: 0
total-expeditions: 0
total-dangers-mapped: 0
total-oaths-sworn: 0
total-splits: 0
---
`;
  assert.deepEqual(unwrap(parseProfile(noBadges)).badges, []);
});

test("rejects a profile missing a numeric key", () => {
  const missingLevel = `---
adventurer: Finde
total-exp: 0
quests-completed: 0
total-expeditions: 0
total-dangers-mapped: 0
total-oaths-sworn: 0
total-splits: 0
badges: []
---
`;
  assert.equal(parseProfile(missingLevel).ok, false);
});

test("rejects content with no frontmatter", () => {
  assert.equal(parseProfile("# just a heading\n").ok, false);
});
