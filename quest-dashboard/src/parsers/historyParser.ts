import type { ExpHistoryEntry, Result } from "../types";

// Entry format appended by /complete-quest (quest-system VERSION 2026.05.0003):
//   ## {quest-name} — {date}
//   EXP earned: {exp}
//     ...breakdown lines...
//   Total EXP after: {total}  |  Level: {level}
const HEADING_RE = /^##\s+(.+?)\s+[—-]\s+(\d{4}-\d{2}-\d{2})\s*$/;
const EXP_EARNED_RE = /^EXP earned:\s*(\d+)/;
const TOTAL_RE = /^Total EXP after:\s*(\d+)\s*\|\s*Level:\s*(\d+)/;

interface PartialEntry {
  questName: string;
  date: string;
  expEarned: number | null;
  totalExpAfter: number | null;
  level: number | null;
}

export function parseHistory(content: string): Result<ExpHistoryEntry[]> {
  const entries: ExpHistoryEntry[] = [];
  let current: PartialEntry | null = null;

  const flush = (): void => {
    if (current && current.expEarned !== null && current.totalExpAfter !== null && current.level !== null) {
      entries.push({
        questName: current.questName,
        date: current.date,
        expEarned: current.expEarned,
        totalExpAfter: current.totalExpAfter,
        level: current.level,
      });
    }
  };

  for (const line of content.split("\n")) {
    const heading = HEADING_RE.exec(line);
    if (heading) {
      flush();
      current = { questName: heading[1], date: heading[2], expEarned: null, totalExpAfter: null, level: null };
      continue;
    }
    if (!current) {
      continue;
    }
    const earned = EXP_EARNED_RE.exec(line);
    if (earned) {
      current.expEarned = Number(earned[1]);
      continue;
    }
    const total = TOTAL_RE.exec(line);
    if (total) {
      current.totalExpAfter = Number(total[1]);
      current.level = Number(total[2]);
    }
  }
  flush();

  return { ok: true, value: entries };
}
