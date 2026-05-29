import assert from "node:assert/strict";
import { test } from "node:test";

import { parseHistory } from "../../src/parsers/historyParser";
import { unwrap } from "../_util";

const EMPTY = `# Quest History

Append-only EXP log. One entry per completed quest.
`;

const MULTI = `# Quest History

## vs-code-QS-plugin — 2026-05-29
EXP earned: 250
  Base reward:   100
Total EXP after: 250  |  Level: 2

## another-quest — 2026-06-01
EXP earned: 300
  Base reward:   100
Total EXP after: 550  |  Level: 3
`;

const INCOMPLETE = `# Quest History

## good-quest — 2026-05-29
EXP earned: 250
Total EXP after: 250  |  Level: 2

## truncated-quest — 2026-06-01
EXP earned: 300
`;

test("returns an empty list when there are no entries", () => {
  assert.equal(unwrap(parseHistory(EMPTY)).length, 0);
});

test("parses every complete entry", () => {
  assert.equal(unwrap(parseHistory(MULTI)).length, 2);
});

test("parses the cumulative total of the last entry", () => {
  const entries = unwrap(parseHistory(MULTI));
  assert.equal(entries[1].totalExpAfter, 550);
});

test("parses the quest name from the heading", () => {
  assert.equal(unwrap(parseHistory(MULTI))[0].questName, "vs-code-QS-plugin");
});

test("skips an entry missing its total line", () => {
  assert.equal(unwrap(parseHistory(INCOMPLETE)).length, 1);
});
