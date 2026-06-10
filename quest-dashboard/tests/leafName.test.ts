import assert from "node:assert/strict";
import { test } from "node:test";

import { leafName } from "../src/leafName";

test("returns the last segment of a nested path", () => {
  assert.equal(leafName(".ai-context/quests/my-quest"), "my-quest");
});

test("ignores a trailing slash", () => {
  assert.equal(leafName(".ai-context/quests/my-quest/"), "my-quest");
});

test("returns a bare name unchanged", () => {
  assert.equal(leafName("my-quest"), "my-quest");
});
