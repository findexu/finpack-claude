import assert from "node:assert/strict";
import { test } from "node:test";

import { expeditionExp, questCompleteExp } from "../src/expFormula";

test("expedition with no dangers or oaths earns the base reward", () => {
  assert.equal(expeditionExp({ dangers: 0, oaths: 0 }), 5);
});

test("expedition with dangers only adds the flat danger bonus", () => {
  assert.equal(expeditionExp({ dangers: 2, oaths: 0 }), 15);
});

test("expedition with oaths only adds the flat oath bonus", () => {
  assert.equal(expeditionExp({ dangers: 0, oaths: 1 }), 15);
});

test("expedition danger and oath bonuses are flat flags, not per-count", () => {
  assert.equal(expeditionExp({ dangers: 3, oaths: 4 }), 25);
});

test("quest-complete with zero everything earns the base reward", () => {
  assert.equal(
    questCompleteExp({ modules: 0, expeditions: 0, dangers: 0, oaths: 0, splits: 0, clean: false, speed: false }),
    100,
  );
});

test("quest-complete sums per-count terms and clean bonus", () => {
  // 100 + 25*3 + 10*4 + 15*5 + 20*2 + 50*1 + 75(clean) = 455
  assert.equal(
    questCompleteExp({ modules: 3, expeditions: 4, dangers: 5, oaths: 2, splits: 1, clean: true, speed: false }),
    455,
  );
});

test("quest-complete adds both clean and speed bonuses when set", () => {
  const base = questCompleteExp({ modules: 0, expeditions: 0, dangers: 0, oaths: 0, splits: 0, clean: false, speed: false });
  const both = questCompleteExp({ modules: 0, expeditions: 0, dangers: 0, oaths: 0, splits: 0, clean: true, speed: true });
  assert.equal(both - base, 125);
});
