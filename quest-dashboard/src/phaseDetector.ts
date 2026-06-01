import { QuestPhase } from "./types";

// Derives the quest lifecycle phase from scroll bodies. Pure: takes raw text,
// returns a phase. Rules (locked in STRATEGY_SCROLL oaths):
//   no active quest                      -> NoQuest
//   last journal entry open (no Road Ahead) -> Embarked
//   open riddles OR battle plan unlocked -> Planning
//   >=1 closed journal entry             -> AtCamp
//   plan locked, no entries              -> Ready
//
// NOTE: /embark does not write a journal entry (only /make-camp does), so the
// Embarked phase only appears if an entry is left open. Between camp and the
// next embark the phase reads AtCamp — the strongest signal the files carry.
export function detectPhase(
  strategyText: string | null,
  journalText: string | null,
  hasActiveQuest: boolean,
): QuestPhase {
  if (!hasActiveQuest) {
    return QuestPhase.NoQuest;
  }

  const entries = countExpeditions(journalText);
  if (entries > 0 && lastEntryOpen(journalText)) {
    return QuestPhase.Embarked;
  }
  if (hasOpenRiddles(strategyText) || !isPlanLocked(strategyText)) {
    return QuestPhase.Planning;
  }
  if (entries > 0) {
    return QuestPhase.AtCamp;
  }
  return QuestPhase.Ready;
}

function countExpeditions(journalText: string | null): number {
  if (journalText === null) {
    return 0;
  }
  const matches = journalText.match(/^##\s+Expedition\b/gm);
  return matches ? matches.length : 0;
}

function lastEntryOpen(journalText: string | null): boolean {
  if (journalText === null) {
    return false;
  }
  const idx = journalText.lastIndexOf("## Expedition");
  if (idx === -1) {
    return false;
  }
  const lastEntry = journalText.slice(idx);
  return !/###\s*The Road Ahead/i.test(lastEntry);
}

function hasOpenRiddles(strategyText: string | null): boolean {
  const body = sectionBody(strategyText, "Open Riddles");
  if (body === null) {
    return false;
  }
  // Strip bullets/markers; treat a "none"/parenthetical-none body as empty.
  const meaningful = body
    .split("\n")
    .map((line) => line.replace(/^[-*]\s*/, "").trim())
    .filter((line) => line !== "")
    .filter((line) => !/^\(?\s*none\b/i.test(line));
  return meaningful.length > 0;
}

function isPlanLocked(strategyText: string | null): boolean {
  if (strategyText === null) {
    return false;
  }
  // The unlocked template carries this sentinel; its absence means a real plan.
  return !/not yet defined/i.test(strategyText);
}

// Returns the text under a "## {heading}" section up to the next "## " heading.
function sectionBody(text: string | null, heading: string): string | null {
  if (text === null) {
    return null;
  }
  const re = new RegExp(`^##\\s+${escapeRegExp(heading)}[^\\n]*\\n`, "im");
  const match = re.exec(text);
  if (match === null) {
    return null;
  }
  const start = match.index + match[0].length;
  const rest = text.slice(start);
  const next = rest.search(/^##\s+/m);
  return next === -1 ? rest : rest.slice(0, next);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
