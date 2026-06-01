import assert from "node:assert/strict";
import { test } from "node:test";

import { parseScroll } from "../../src/parsers/scrollParser";
import { unwrap } from "../_util";

const FULL = `---
quest: vs-code-QS-plugin
realm: app
scroll: STRATEGY_SCROLL
last-updated: 2026-05-29
---
# Strategy Scroll
`;

test("parses the scroll name", () => {
  assert.equal(unwrap(parseScroll(FULL)).scroll, "STRATEGY_SCROLL");
});

test("normalises a YAML-parsed date to a YYYY-MM-DD string", () => {
  assert.equal(unwrap(parseScroll(FULL)).lastUpdated, "2026-05-29");
});

test("rejects a scroll with no frontmatter", () => {
  assert.equal(parseScroll("# just a body\n").ok, false);
});

test("rejects a scroll missing a required key", () => {
  const missing = `---
quest: vs-code-QS-plugin
realm: app
scroll: STRATEGY_SCROLL
---
`;
  assert.equal(parseScroll(missing).ok, false);
});
