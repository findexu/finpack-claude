import { levelProgress } from "../levelMath";
import type { AdventurerProfile, ExpFold, ExpHistoryEntry } from "../types";

// Pure geometry + math for the EXP progression chart. Owns the canvas coordinates so
// the SVG serializer (buildExpChart) stays a dumb string-emitter — honors the locked
// "dumb surfaces" decision. No I/O, no HTML, no vscode.

const WIDTH = 320;
const HEIGHT = 120;
const PAD = 14;
const PLOT_W = WIDTH - PAD * 2;
const PLOT_H = HEIGHT - PAD * 2;
const PROJECTION_WINDOW = 5;
const THRESHOLD_HEADROOM = 1.05;

export interface ChartPoint {
  x: number;
  y: number;
  exp: number;
  label: string;
  isMilestone: boolean;
  inActiveSegment: boolean;
}

export interface ChartModel {
  mode: "expeditions" | "quests" | "empty";
  points: ChartPoint[];
  nowHead: ChartPoint | null;
  threshold: { y: number; level: number } | null;
  projection: { from: ChartPoint; to: { x: number; y: number }; expeditions: number; level: number } | null;
  xAxisLabel: "Expeditions" | "Quests";
}

interface RawPoint {
  exp: number;
  label: string;
  isMilestone: boolean;
  inActiveSegment: boolean;
}

interface ProjectionPlan {
  draw: number; // horizon length in expeditions (sizes the X domain)
  need: number; // expeditions to the next level (annotation)
  slope: number;
  level: number;
}

export function buildChartModel(input: {
  fold: ExpFold | null;
  history: ExpHistoryEntry[];
  profile: AdventurerProfile;
  activeLeaf: string | null;
  plannedCount: number;
}): ChartModel {
  const { fold, history, profile, activeLeaf, plannedCount } = input;
  const progress = levelProgress(profile.totalExp);

  const mode: ChartModel["mode"] =
    fold !== null && fold.events.length > 0 ? "expeditions" : history.length > 0 ? "quests" : "empty";

  if (mode === "empty") {
    return { mode, points: [], nowHead: null, threshold: null, projection: null, xAxisLabel: "Quests" };
  }

  const raw = mode === "expeditions" ? expeditionSeries(fold as ExpFold, profile, activeLeaf) : questSeries(history);

  // Projection is computed first: its horizon sizes the X domain so the dashed line
  // has room on the right instead of colliding with the now-head at the plot edge.
  const plan = mode === "expeditions" ? projectionPlan(fold as ExpFold, profile, activeLeaf, plannedCount, progress) : null;

  const n = raw.length;
  const domainHi = n - 1 + (plan ? plan.draw : 0);
  const single = n === 1 && plan === null;
  const xMap = (i: number): number => (single ? WIDTH / 2 : round(PAD + (i / Math.max(1, domainHi)) * PLOT_W));

  const seriesMax = Math.max(...raw.map((p) => p.exp));
  const seriesMin = Math.min(...raw.map((p) => p.exp));
  const nextThreshold = progress.isMax || progress.next === null ? 0 : progress.next.threshold;
  const domainMax = Math.max(seriesMax, nextThreshold) * THRESHOLD_HEADROOM;
  const span = domainMax - seriesMin || 1;
  const yMap = (exp: number): number => round(PAD + (1 - (exp - seriesMin) / span) * PLOT_H);

  const points: ChartPoint[] = raw.map((p, i) => ({ x: xMap(i), y: yMap(p.exp), exp: p.exp, label: p.label, isMilestone: p.isMilestone, inActiveSegment: p.inActiveSegment }));

  const last = points[n - 1];
  const headExp = mode === "expeditions" ? profile.totalExp : raw[n - 1].exp;
  const nowHead: ChartPoint = { x: last.x, y: yMap(headExp), exp: headExp, label: "now", isMilestone: false, inActiveSegment: false };

  const threshold = progress.isMax || progress.next === null ? null : { y: yMap(progress.next.threshold), level: progress.next.level };

  const projection = plan === null
    ? null
    : {
        from: nowHead,
        to: { x: xMap(n - 1 + plan.draw), y: yMap(Math.min(profile.totalExp + plan.slope * plan.draw, domainMax)) },
        expeditions: plan.need,
        level: plan.level,
      };

  return { mode, points, nowHead, threshold, projection, xAxisLabel: mode === "expeditions" ? "Expeditions" : "Quests" };
}

function expeditionSeries(fold: ExpFold, profile: AdventurerProfile, activeLeaf: string | null): RawPoint[] {
  // Reconcile the folded shape to the authoritative profile total: scale every cumExp
  // so the final point lands on profile.totalExp (drift / torn lines preserve shape).
  const scale = fold.totalExp > 0 && fold.totalExp !== profile.totalExp ? profile.totalExp / fold.totalExp : 1;
  return fold.events.map((e) => ({
    exp: e.cumExp * scale,
    label: e.type === "quest-complete" ? e.quest : `${e.quest} ${e.date}`,
    isMilestone: e.type === "quest-complete",
    inActiveSegment: activeLeaf !== null && e.quest === activeLeaf,
  }));
}

function questSeries(history: ExpHistoryEntry[]): RawPoint[] {
  return history.map((h) => ({ exp: h.totalExpAfter, label: h.questName, isMilestone: true, inActiveSegment: false }));
}

function projectionPlan(
  fold: ExpFold,
  profile: AdventurerProfile,
  activeLeaf: string | null,
  plannedCount: number,
  progress: ReturnType<typeof levelProgress>,
): ProjectionPlan | null {
  if (progress.isMax || progress.next === null || activeLeaf === null) {
    return null;
  }
  const activeExpeditions = fold.events.filter((e) => e.type === "expedition" && e.quest === activeLeaf);
  if (activeExpeditions.length < 2) {
    return null;
  }
  const window = activeExpeditions.slice(-PROJECTION_WINDOW);
  const slope = window.reduce((sum, e) => sum + e.expDelta, 0) / window.length;
  if (slope <= 0) {
    return null;
  }
  // expToNext is the level SPAN; remaining to the next level is threshold - current.
  const remaining = progress.next.threshold - profile.totalExp;
  const need = Math.max(1, Math.ceil(remaining / slope));
  return { draw: Math.max(plannedCount, need), need, slope, level: progress.next.level };
}

function round(n: number): number {
  return Math.round(n * 10) / 10;
}
