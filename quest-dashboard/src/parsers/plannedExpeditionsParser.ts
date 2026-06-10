import type { PlannedExpedition, PlannedStatus, Result } from "../types";

// Parses the `## Planned Expeditions` checklist from a quest's STRATEGY_SCROLL.md:
//   ## Planned Expeditions
//   - [x] done item
//   - [>] active item
//   - [ ] planned item
// The block lives in the top-level scroll index (the part that survives a `strategy/`
// split), so this reads STRATEGY_SCROLL.md only — it never chases split subfiles.
// Block absent (older quest, or split lost it) -> empty list; the panel degrades.

const HEADING_RE = /^##\s+Planned Expeditions\s*$/i;
const ANY_HEADING_RE = /^#{1,6}\s/;
const ITEM_RE = /^\s*-\s*\[(.)\]\s*(.+?)\s*$/;

export function parsePlannedExpeditions(strategyText: string | null): Result<PlannedExpedition[]> {
  if (strategyText === null) {
    return { ok: true, value: [] };
  }

  const lines = strategyText.split("\n");
  const start = lines.findIndex((line) => HEADING_RE.test(line.trim()));
  if (start === -1) {
    return { ok: true, value: [] };
  }

  const items: PlannedExpedition[] = [];
  for (let i = start + 1; i < lines.length; i++) {
    if (ANY_HEADING_RE.test(lines[i])) {
      break; // next section
    }
    const match = ITEM_RE.exec(lines[i]);
    if (match === null) {
      continue; // prose, blank line, or malformed checkbox
    }
    const label = match[2].trim();
    if (label === "") {
      continue;
    }
    items.push({ label, status: statusFromMarker(match[1]), order: items.length });
  }

  return { ok: true, value: items };
}

function statusFromMarker(marker: string): PlannedStatus {
  if (marker === "x" || marker === "X") {
    return "done";
  }
  if (marker === ">") {
    return "active";
  }
  return "planned"; // " " and any unknown marker
}
