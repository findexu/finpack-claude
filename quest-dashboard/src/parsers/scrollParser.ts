import matter from "gray-matter";

import type { Result, ScrollMeta } from "../types";

// Each scroll carries YAML frontmatter: quest, realm, scroll, last-updated
// (quest-system SKILL.md). We read only the frontmatter; the body is opened
// directly in the editor, never parsed here.
export function parseScroll(content: string): Result<ScrollMeta> {
  const data = matter(content).data as Record<string, unknown>;
  if (Object.keys(data).length === 0) {
    return { ok: false, error: "scroll has no YAML frontmatter" };
  }

  const quest = requireString(data, "quest");
  const realm = requireString(data, "realm");
  const scroll = requireString(data, "scroll");
  const lastUpdated = requireString(data, "last-updated");

  const missing = [
    ["quest", quest],
    ["realm", realm],
    ["scroll", scroll],
    ["last-updated", lastUpdated],
  ].find(([, value]) => value === null);

  if (missing) {
    return { ok: false, error: `missing key: ${missing[0]}` };
  }

  return {
    ok: true,
    value: {
      quest: quest as string,
      realm: realm as string,
      scroll: scroll as string,
      lastUpdated: lastUpdated as string,
    },
  };
}

function requireString(data: Record<string, unknown>, key: string): string | null {
  const value = data[key];
  // YAML auto-parses unquoted ISO dates (e.g. last-updated: 2026-05-29) into a
  // Date; normalise those back to a YYYY-MM-DD string.
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  return typeof value === "string" && value.trim() !== "" ? value : null;
}
