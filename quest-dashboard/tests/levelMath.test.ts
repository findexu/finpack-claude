import assert from "node:assert/strict";
import { test } from "node:test";

import { expBar, levelProgress } from "../src/levelMath";

test("zero EXP is level 1", () => {
  assert.equal(levelProgress(0).tier.level, 1);
});

test("EXP on a threshold boundary advances the level", () => {
  assert.equal(levelProgress(150).tier.level, 2);
});

test("EXP just below a threshold stays on the lower level", () => {
  assert.equal(levelProgress(149).tier.level, 1);
});

test("progress ratio is the fraction toward the next level", () => {
  // level 2 starts at 150, level 3 at 450 -> span 300; 300 in => 150/300 = 0.5
  assert.equal(levelProgress(300).ratio, 0.5);
});

test("max level reports isMax with no next tier", () => {
  assert.equal(levelProgress(7000).isMax, true);
});

test("expBar fills proportionally", () => {
  assert.equal(expBar(0.5, 20), "██████████░░░░░░░░░░");
});
