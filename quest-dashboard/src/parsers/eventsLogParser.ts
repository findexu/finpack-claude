import { expeditionExp, questCompleteExp } from "../expFormula";
import type { ExpEvent, ExpFold, Result } from "../types";

// events.log is the append-only source of truth for XP (quest-system folds it into
// profile.md). The dashboard re-folds it READ-ONLY to drive the EXP chart. Each line:
//   {date}|seed|-|total-exp=N;...                  baseline (migration), first line only
//   {date}|expedition|{quest}|dangers=N;oaths=N;split=0|1
//   {date}|quest-complete|{quest}|modules=N;expeditions=N;dangers=N;oaths=N;splits=N;clean=0|1;speed=0|1
// Whole-line atomic appends: a torn/garbled line is skipped, never thrown on. Mirrors
// quest-system fold semantics (SKILL.md -> "XP derivation").

export function parseEventsLog(content: string | null): Result<ExpFold> {
  const events: ExpEvent[] = [];
  let seedExp = 0;
  let cum = 0;
  let sawFirst = false;

  for (const raw of (content ?? "").split("\n")) {
    const line = raw.trim();
    if (line === "") {
      continue;
    }
    const parts = line.split("|");
    if (parts.length < 4) {
      continue; // torn line
    }
    const type = parts[1].trim();
    const quest = parts[2].trim();
    const fields = parsePayload(parts[3]);

    if (!sawFirst) {
      sawFirst = true;
      // A leading `seed` line sets the baseline; the running cum starts there.
      if (type === "seed") {
        const total = numberOrNull(fields.get("total-exp"));
        if (total !== null) {
          seedExp = total;
          cum = total;
        }
        continue;
      }
    } else if (type === "seed") {
      continue; // a seed that is not the first line never resets the baseline
    }

    const event = buildEvent(type, quest, parts[0].trim(), fields);
    if (event === null) {
      continue; // unknown type or non-numeric field -> skip the line
    }
    cum += event.expDelta;
    events.push({ ...event, cumExp: cum });
  }

  return { ok: true, value: { seedExp, events, totalExp: cum } };
}

// Returns the event WITHOUT cumExp (the caller assigns it after accumulating), or
// null when the type is unknown or any numeric field is present-but-not-a-number.
type PartialEvent = Omit<Extract<ExpEvent, { type: "expedition" }>, "cumExp"> | Omit<Extract<ExpEvent, { type: "quest-complete" }>, "cumExp">;

function buildEvent(type: string, quest: string, date: string, fields: Map<string, string>): PartialEvent | null {
  if (type === "expedition") {
    const dangers = numField(fields, "dangers");
    const oaths = numField(fields, "oaths");
    if (dangers === null || oaths === null) {
      return null;
    }
    return { type: "expedition", date, quest, dangers, oaths, split: flag(fields, "split"), expDelta: expeditionExp({ dangers, oaths }) };
  }
  if (type === "quest-complete") {
    const modules = numField(fields, "modules");
    const expeditions = numField(fields, "expeditions");
    const dangers = numField(fields, "dangers");
    const oaths = numField(fields, "oaths");
    const splits = numField(fields, "splits");
    if (modules === null || expeditions === null || dangers === null || oaths === null || splits === null) {
      return null;
    }
    const clean = flag(fields, "clean");
    const speed = flag(fields, "speed");
    return {
      type: "quest-complete",
      date,
      quest,
      modules,
      expeditions,
      dangers,
      oaths,
      splits,
      clean,
      speed,
      expDelta: questCompleteExp({ modules, expeditions, dangers, oaths, splits, clean, speed }),
    };
  }
  return null;
}

function parsePayload(payload: string): Map<string, string> {
  const map = new Map<string, string>();
  for (const pair of payload.split(";")) {
    const [key, value] = pair.split("=");
    if (key !== undefined && value !== undefined) {
      map.set(key.trim(), value.trim());
    }
  }
  return map;
}

// Missing key -> 0. Present-but-non-numeric -> null (signals a torn line).
function numField(fields: Map<string, string>, key: string): number | null {
  if (!fields.has(key)) {
    return 0;
  }
  return numberOrNull(fields.get(key));
}

function numberOrNull(value: string | undefined): number | null {
  if (value === undefined) {
    return null;
  }
  const n = Number(value);
  return Number.isNaN(n) ? null : n;
}

function flag(fields: Map<string, string>, key: string): boolean {
  return fields.get(key) === "1";
}
