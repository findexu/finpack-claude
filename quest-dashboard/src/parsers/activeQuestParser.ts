import type { ActiveQuest, Result } from "../types";

// active-quest.txt format (quest-system SKILL.md):
//   line 1 = quest folder path
//   line 2 = realm
export function parseActiveQuest(content: string): Result<ActiveQuest> {
  const lines = content
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line !== "");

  if (lines.length < 2) {
    return { ok: false, error: "active-quest.txt must have a quest path and a realm" };
  }

  return { ok: true, value: { questFolderPath: lines[0], realm: lines[1] } };
}
