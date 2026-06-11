import { QuestPhase } from "./types";
import type { ExpFold, PlannedExpedition, QuestPhase as QuestPhaseT } from "./types";

// One row of the battle plan shown in the quest tree: the active expedition
// first, then the remaining checklist, then completed expeditions newest-first.
export interface BattlePlanRow {
  status: "active" | "planned" | "done";
  label: string;
  // EXP/dangers/oaths summary for done rows; null for active and planned rows.
  detail: string | null;
}

export interface BattlePlan {
  rows: BattlePlanRow[];
  counts: { done: number; active: number; planned: number };
}

export function deriveBattlePlan(input: {
  phase: QuestPhaseT;
  planned: PlannedExpedition[];
  expFold: ExpFold | null;
  activeLeaf: string;
}): BattlePlan {
  const { phase, planned, expFold, activeLeaf } = input;

  const isActive = phase === QuestPhase.Embarked;
  const activeLabel = planned.find((p) => p.status === "active")?.label ?? "current expedition";
  const plannedRows = planned.filter((p) => p.status === "planned" && !(isActive && p.label === activeLabel));

  const doneEvents = (expFold?.events ?? []).filter((e) => e.type === "expedition" && e.quest === activeLeaf);

  const rows: BattlePlanRow[] = [];
  if (isActive) {
    rows.push({ status: "active", label: activeLabel, detail: null });
  }
  for (const p of plannedRows) {
    rows.push({ status: "planned", label: p.label, detail: null });
  }
  for (const e of doneEvents.slice().reverse()) {
    if (e.type !== "expedition") {
      continue; // narrow the union; filter already guarantees this
    }
    const flags = [e.dangers > 0 ? `${e.dangers}d` : "", e.oaths > 0 ? `${e.oaths}o` : ""].filter(Boolean).join(" · ");
    rows.push({ status: "done", label: e.date, detail: `+${e.expDelta} XP${flags ? ` · ${flags}` : ""}` });
  }

  return {
    rows,
    counts: { done: doneEvents.length, active: isActive ? 1 : 0, planned: plannedRows.length },
  };
}
