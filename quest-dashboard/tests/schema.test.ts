import assert from "node:assert/strict";
import { test } from "node:test";

import { checkSchemaVersion } from "../src/schema";

test("accepts the exact supported version", () => {
  assert.equal(checkSchemaVersion("2026.05.0003").ok, true);
});

test("accepts a different patch within the supported year-month", () => {
  assert.equal(checkSchemaVersion("2026.05.0099").ok, true);
});

test("rejects a different year-month", () => {
  assert.equal(checkSchemaVersion("2026.06.0001").ok, false);
});

test("rejects a null version as missing", () => {
  const status = checkSchemaVersion(null);
  assert.equal(status.ok === false && status.reason === "missing", true);
});
