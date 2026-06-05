import assert from "node:assert/strict";
import { test } from "node:test";

import { expBar, levelProgress } from "../src/levelMath";

test("zero EXP is level 1", () => {
  assert.equal(levelProgress(0).tier.level, 1);
});

test("level 1 carries the tiered title with its rank", () => {
  assert.equal(levelProgress(0).tier.title, "Apprentice Coder I");
});

test("EXP on a threshold boundary advances the level", () => {
  // threshold(2) = 150 * 2 * 1 = 300
  assert.equal(levelProgress(300).tier.level, 2);
});

test("EXP just below a threshold stays on the lower level", () => {
  assert.equal(levelProgress(299).tier.level, 1);
});

test("progress ratio is the fraction toward the next level", () => {
  // level 2 starts at 300, level 3 at 900 -> span 600; 300 in => 300/600 = 0.5
  assert.equal(levelProgress(600).ratio, 0.5);
});

test("max level reports isMax with no next tier", () => {
  // threshold(50) = 150 * 50 * 49 = 367500
  assert.equal(levelProgress(400000).isMax, true);
});

test("expBar fills proportionally", () => {
  assert.equal(expBar(0.5, 20), "██████████░░░░░░░░░░");
});
