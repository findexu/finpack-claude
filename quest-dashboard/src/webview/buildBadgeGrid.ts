import { levelProgress } from "../levelMath";
import { ALL_BADGES } from "../types";
import type { AdventurerProfile, BadgeDef, NumericStat } from "../types";
import { escapeHtml } from "./escape";

const PER_SHELF = 5;

// Renders all 15 badges as a trophy "bookshelf": rows of badges resting on
// wooden shelves. Earned ones lit, locked ones dimmed with a progress counter
// where the catalog defines one. `badgeSheetUri`, when provided, swaps the
// emoji placeholder for a 16px sprite cell (background-position by index).
export function buildBadgeGrid(profile: AdventurerProfile, badgeSheetUri: string | null): string {
  const cells = ALL_BADGES.map((badge, index) => renderCell(badge, index, profile, badgeSheetUri));
  const shelves: string[] = [];
  for (let i = 0; i < cells.length; i += PER_SHELF) {
    shelves.push(`<div class="shelf"><div class="shelf-items">${cells.slice(i, i + PER_SHELF).join("")}</div></div>`);
  }
  return `<div class="badge-grid">${shelves.join("")}</div>`;
}

function renderCell(badge: BadgeDef, index: number, profile: AdventurerProfile, badgeSheetUri: string | null): string {
  const earned = profile.badges.includes(badge.name);
  // "ready": counter threshold met but not yet awarded (badges land at /complete-quest).
  const ready =
    !earned && badge.progress !== undefined && statValue(profile, badge.progress.stat) >= badge.progress.threshold;
  // Locked medallions show a padlock instead of the badge glyph.
  const glyph = !earned && !ready ? LOCK_SVG : renderGlyph(badge, index, badgeSheetUri);
  const counter = !earned && badge.progress ? renderCounter(badge, profile) : "";
  const stateClass = earned ? "earned" : ready ? "ready" : "locked";
  const hint = ready ? `${badge.name} — ready to unlock on quest completion` : `${badge.name} — ${badge.hint}`;
  const title = escapeHtml(hint);

  return `<div class="badge ${stateClass}" title="${title}"><div class="badge-medal"><div class="badge-icon">${glyph}</div></div><div class="badge-plate"><span class="badge-name">${escapeHtml(badge.name)}</span>${counter}</div></div>`;
}

// Inline padlock for locked medallions. No inline styles (CSP-safe); fill/stroke
// come from .badge-lock-shape in the nonce'd stylesheet.
const LOCK_SVG = `<svg class="badge-lock" viewBox="0 0 24 24" role="img" aria-label="locked"><rect class="badge-lock-shape" x="5" y="10.5" width="14" height="10" rx="2" /><path class="badge-lock-shape" d="M8 10.5V8a4 4 0 0 1 8 0v2.5" /></svg>`;

function renderGlyph(badge: BadgeDef, index: number, badgeSheetUri: string | null): string {
  if (badgeSheetUri !== null) {
    // SVG <image> shifted by index keeps us off inline style attributes, which
    // a strict style-src nonce CSP would block. viewBox clips to one 16px cell.
    const offset = index * 16;
    return `<svg class="badge-sprite" viewBox="0 0 16 16" width="16" height="16" role="img"><image href="${escapeHtml(badgeSheetUri)}" x="-${offset}" y="0" width="240" height="16" /></svg>`;
  }
  return `<span class="badge-glyph">${badge.icon}</span>`;
}

function renderCounter(badge: BadgeDef, profile: AdventurerProfile): string {
  const progress = badge.progress;
  if (progress === undefined) {
    return "";
  }
  const value = Math.min(statValue(profile, progress.stat), progress.threshold);
  return `<span class="badge-progress">${value}/${progress.threshold}</span>`;
}

function statValue(profile: AdventurerProfile, stat: NumericStat): number {
  if (stat === "level") {
    return levelProgress(profile.totalExp).tier.level;
  }
  return profile[stat];
}
