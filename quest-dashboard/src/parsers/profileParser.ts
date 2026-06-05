import matter from "gray-matter";

import { ALL_BADGES } from "../types";
import type { AdventurerProfile, Result } from "../types";

const BADGE_NAMES = new Set(ALL_BADGES.map((badge) => badge.name));

// Legacy profiles stored badges with an emoji prefix ("🗡️ First Blood"); current
// quest-system writes the plain name ("First Blood"). Canonicalise to the plain
// name so the earned check (which compares against badge.name) matches either form.
function canonicalBadgeName(entry: string): string {
  const trimmed = entry.trim();
  if (BADGE_NAMES.has(trimmed)) {
    return trimmed;
  }
  const stripped = trimmed.replace(/^[^A-Za-z]+/, "").trim();
  return BADGE_NAMES.has(stripped) ? stripped : trimmed;
}

interface NumericField {
  key: string; // kebab-case frontmatter key
  assign: (profile: AdventurerProfile, value: number) => void;
}

const NUMERIC_FIELDS: readonly NumericField[] = [
  { key: "level", assign: (p, v) => (p.level = v) },
  { key: "total-exp", assign: (p, v) => (p.totalExp = v) },
  { key: "quests-completed", assign: (p, v) => (p.questsCompleted = v) },
  { key: "total-expeditions", assign: (p, v) => (p.totalExpeditions = v) },
  { key: "total-dangers-mapped", assign: (p, v) => (p.totalDangersMapped = v) },
  { key: "total-oaths-sworn", assign: (p, v) => (p.totalOathsSworn = v) },
  { key: "total-splits", assign: (p, v) => (p.totalSplits = v) },
];

export function parseProfile(content: string): Result<AdventurerProfile> {
  const data = readFrontmatter(content);
  if (data === null) {
    return { ok: false, error: "profile.md has no YAML frontmatter" };
  }

  const adventurer = data["adventurer"];
  if (typeof adventurer !== "string" || adventurer.trim() === "") {
    return { ok: false, error: "missing key: adventurer" };
  }

  const profile: AdventurerProfile = {
    adventurer,
    level: 0,
    totalExp: 0,
    questsCompleted: 0,
    totalExpeditions: 0,
    totalDangersMapped: 0,
    totalOathsSworn: 0,
    totalSplits: 0,
    badges: [],
  };

  for (const field of NUMERIC_FIELDS) {
    const coerced = coerceNumber(data[field.key]);
    if (coerced === null) {
      return { ok: false, error: `missing key: ${field.key}` };
    }
    field.assign(profile, coerced);
  }

  const badges = data["badges"];
  if (badges !== undefined && !Array.isArray(badges)) {
    return { ok: false, error: "badges must be a list" };
  }
  profile.badges = Array.isArray(badges)
    ? badges.filter((b): b is string => typeof b === "string").map(canonicalBadgeName)
    : [];

  return { ok: true, value: profile };
}

function readFrontmatter(content: string): Record<string, unknown> | null {
  const parsed = matter(content);
  // gray-matter returns {} for data when no frontmatter block is present.
  return Object.keys(parsed.data).length > 0 ? (parsed.data as Record<string, unknown>) : null;
}

// YAML may surface a number directly or, if quoted, a numeric string.
function coerceNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}
