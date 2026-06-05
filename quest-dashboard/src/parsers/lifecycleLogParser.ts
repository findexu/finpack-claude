import { QuestPhase } from "../types";
import type { QuestPhase as QuestPhaseT } from "../types";

// lifecycle.log is an append-only sibling of the XP events.log. Each lifecycle
// command records its transition the moment it happens:
//   {YYYY-MM-DD}|state|{quest-name}|phase=embarked
// /embark writes no scroll, so this line is the only real-time signal that an
// expedition started. The dashboard reads the LAST state line for the active
// quest and trusts it over scroll inference (see stateManager.detectPhase).
// It is kept separate from events.log so a state append never interferes with
// the XP seed/fold (which keys off events.log existence and line count).
//
// Lines are matched by quest-name (the quest folder's leaf), so interleaved
// multi-chat appends for different quests never cross-contaminate.

const PHASE_BY_TOKEN: Record<string, QuestPhaseT> = {
  "no-quest": QuestPhase.NoQuest,
  planning: QuestPhase.Planning,
  ready: QuestPhase.Ready,
  embarked: QuestPhase.Embarked,
  "at-camp": QuestPhase.AtCamp,
};

// Returns the phase from the last well-formed `state` line whose quest-name
// matches `questName`, or null when the log carries none (fall back to scrolls).
export function latestPhaseForQuest(eventsText: string | null, questName: string): QuestPhaseT | null {
  if (eventsText === null) {
    return null;
  }
  let phase: QuestPhaseT | null = null;
  for (const line of eventsText.split("\n")) {
    const parts = line.split("|");
    if (parts.length < 4 || parts[1].trim() !== "state") {
      continue;
    }
    if (parts[2].trim() !== questName) {
      continue;
    }
    const resolved = phaseFromFields(parts[3]);
    if (resolved !== null) {
      phase = resolved; // keep scanning: last matching line wins
    }
  }
  return phase;
}

function phaseFromFields(fields: string): QuestPhaseT | null {
  for (const pair of fields.split(";")) {
    const [key, value] = pair.split("=");
    if (key !== undefined && key.trim() === "phase" && value !== undefined) {
      const token = value.trim().toLowerCase();
      return PHASE_BY_TOKEN[token] ?? null;
    }
  }
  return null;
}
