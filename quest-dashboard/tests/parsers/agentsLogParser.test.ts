import assert from "node:assert/strict";
import { test } from "node:test";

import { parseAgentsLog } from "../../src/parsers/agentsLogParser";

test("null log yields no activity", () => {
  assert.deepEqual(parseAgentsLog(null), []);
});

test("parses a well-formed agent line", () => {
  const log = "2026-07-03|agent|dragon-hunt|type=fp-code-reviewer;desc=Review the diff\n";
  assert.deepEqual(parseAgentsLog(log), [
    { date: "2026-07-03", quest: "dragon-hunt", type: "fp-code-reviewer", desc: "Review the diff" },
  ]);
});

test("keys a quest-less launch to -", () => {
  const log = "2026-07-03|agent|-|type=fp-code-explorer;desc=scout\n";
  assert.equal(parseAgentsLog(log)[0].quest, "-");
});

test("desc keeps ; and = (read as rest of line)", () => {
  const log = "2026-07-03|agent|q|type=t;desc=fix x=1; then retry\n";
  assert.equal(parseAgentsLog(log)[0].desc, "fix x=1; then retry");
});

test("skips lines that are not agent events or lack a type", () => {
  const log = [
    "2026-07-03|state|q|phase=embarked", // not an agent line
    "2026-07-03|agent|q|desc=missing type", // no type= field
    "garbage",
    "2026-07-03|agent|q|type=fp-plan-reviewer;desc=ok", // the only valid one
  ].join("\n");
  const out = parseAgentsLog(log);
  assert.equal(out.length, 1);
  assert.equal(out[0].type, "fp-plan-reviewer");
});

test("preserves file order (oldest first)", () => {
  const log = [
    "2026-07-01|agent|q|type=a;desc=1",
    "2026-07-02|agent|q|type=b;desc=2",
  ].join("\n");
  assert.deepEqual(
    parseAgentsLog(log).map((a) => a.type),
    ["a", "b"],
  );
});
