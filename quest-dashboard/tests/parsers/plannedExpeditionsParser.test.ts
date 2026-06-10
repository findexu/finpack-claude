import assert from "node:assert/strict";
import { test } from "node:test";

import { parsePlannedExpeditions } from "../../src/parsers/plannedExpeditionsParser";
import { unwrap } from "../_util";

const BLOCK = `# Strategy Scroll

## Planned Expeditions
- [x] auth scaffolding
- [>] activity-driven phase bump
- [ ] wire projection into chart

## Next Section
- [ ] not part of planned expeditions
`;

test("null content yields an empty list", () => {
  assert.deepEqual(unwrap(parsePlannedExpeditions(null)), []);
});

test("text without the heading yields an empty list", () => {
  assert.deepEqual(unwrap(parsePlannedExpeditions("# Strategy\n## Scope\n- [ ] nope")), []);
});

test("each marker maps to its status with ordered indices", () => {
  const items = unwrap(parsePlannedExpeditions(BLOCK));
  assert.deepEqual(
    items,
    [
      { label: "auth scaffolding", status: "done", order: 0 },
      { label: "activity-driven phase bump", status: "active", order: 1 },
      { label: "wire projection into chart", status: "planned", order: 2 },
    ],
  );
});

test("parsing stops at the next section heading", () => {
  const labels = unwrap(parsePlannedExpeditions(BLOCK)).map((i) => i.label);
  assert.equal(labels.includes("not part of planned expeditions"), false);
});

test("an unknown marker falls back to planned", () => {
  const items = unwrap(parsePlannedExpeditions("## Planned Expeditions\n- [~] mystery"));
  assert.equal(items[0].status, "planned");
});

test("prose and blank lines inside the block are ignored", () => {
  const items = unwrap(parsePlannedExpeditions("## Planned Expeditions\nsome note\n\n- [ ] real item\n"));
  assert.equal(items.length, 1);
  assert.equal(items[0].label, "real item");
});

test("the heading match is case-insensitive", () => {
  const items = unwrap(parsePlannedExpeditions("## planned expeditions\n- [x] done"));
  assert.equal(items.length, 1);
});
