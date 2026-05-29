import assert from "node:assert/strict";
import { test } from "node:test";

import { parseActiveQuest } from "../../src/parsers/activeQuestParser";
import { unwrap } from "../_util";

const BASIC = `.ai-context/quests/vs-code-QS-plugin
app
`;

test("parses the quest folder path", () => {
  assert.equal(unwrap(parseActiveQuest(BASIC)).questFolderPath, ".ai-context/quests/vs-code-QS-plugin");
});

test("parses the realm", () => {
  assert.equal(unwrap(parseActiveQuest(BASIC)).realm, "app");
});

test("rejects a file with only one line", () => {
  assert.equal(parseActiveQuest(".ai-context/quests/solo\n").ok, false);
});
