import type { ExpHistoryEntry } from "../types";
import { escapeHtml } from "./escape";

const WIDTH = 320;
const HEIGHT = 120;
const PAD = 14;

// Hand-rolled inline SVG line chart of cumulative EXP over completed quests.
// No external chart library (strict webview CSP). Degrades to a "no history
// yet" message until at least one quest is completed.
export function buildExpChart(history: ExpHistoryEntry[]): string {
  if (history.length === 0) {
    return svg(
      `<text x="${WIDTH / 2}" y="${HEIGHT / 2}" class="chart-empty" text-anchor="middle">No history yet — complete a quest</text>`,
    );
  }

  const values = history.map((entry) => entry.totalExpAfter);
  const max = Math.max(...values);
  const min = Math.min(...values);
  const span = max - min || 1;
  const plotW = WIDTH - PAD * 2;
  const plotH = HEIGHT - PAD * 2;

  const points = history.map((entry, index) => {
    const x = history.length === 1 ? WIDTH / 2 : PAD + (index / (history.length - 1)) * plotW;
    const ratio = (entry.totalExpAfter - min) / span;
    const y = PAD + (1 - ratio) * plotH;
    return { x: round(x), y: round(y), entry };
  });

  const polyline =
    points.length > 1
      ? `<polyline class="chart-line" fill="none" points="${points.map((p) => `${p.x},${p.y}`).join(" ")}" />`
      : "";

  const dots = points
    .map(
      (p) =>
        `<circle class="chart-dot" cx="${p.x}" cy="${p.y}" r="3"><title>${escapeHtml(p.entry.questName)}: ${p.entry.totalExpAfter} EXP</title></circle>`,
    )
    .join("");

  return svg(`${polyline}${dots}`);
}

function svg(inner: string): string {
  return `<svg class="exp-chart" viewBox="0 0 ${WIDTH} ${HEIGHT}" preserveAspectRatio="xMidYMid meet" role="img">${inner}</svg>`;
}

function round(n: number): number {
  return Math.round(n * 10) / 10;
}
