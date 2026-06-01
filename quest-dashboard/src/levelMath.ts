import { LEVEL_TABLE } from "./types";
import type { LevelTier } from "./types";

export interface LevelProgress {
  tier: LevelTier;
  next: LevelTier | null;
  expThisLevel: number;
  expToNext: number; // 0 at max level
  ratio: number; // 0..1 (1 at max level)
  isMax: boolean;
}

// Derives the level tier and progress from total EXP, mirroring the math in
// quest-system's /quest-xp. The level is computed from totalExp (source of
// truth), not read from the profile, so it stays correct if the two disagree.
export function levelProgress(totalExp: number): LevelProgress {
  let tier: LevelTier = LEVEL_TABLE[0];
  for (const candidate of LEVEL_TABLE) {
    if (totalExp >= candidate.threshold) {
      tier = candidate;
    }
  }

  const next = LEVEL_TABLE.find((t) => t.level === tier.level + 1) ?? null;
  if (next === null) {
    return { tier, next: null, expThisLevel: totalExp - tier.threshold, expToNext: 0, ratio: 1, isMax: true };
  }

  const expThisLevel = totalExp - tier.threshold;
  const expToNext = next.threshold - tier.threshold;
  return {
    tier,
    next,
    expThisLevel,
    expToNext,
    ratio: expToNext > 0 ? expThisLevel / expToNext : 1,
    isMax: false,
  };
}

// ASCII progress bar (filled/empty blocks), matching the /quest-xp style.
export function expBar(ratio: number, width: number): string {
  const clamped = Math.max(0, Math.min(1, ratio));
  const filled = Math.min(width, Math.floor(clamped * width));
  return "█".repeat(filled) + "░".repeat(width - filled);
}
