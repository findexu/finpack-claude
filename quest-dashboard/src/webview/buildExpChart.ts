import type { ChartModel, ChartPoint } from "./chartData";
import { escapeHtml } from "./escape";

// Dumb SVG serializer over a ChartModel. All geometry/coordinates are computed in
// chartData (the "dumb surfaces" oath); this only emits tags. No external chart lib
// (strict webview CSP), no inline style attributes, no script. W/H/PAD are kept for
// the viewBox and for lines that span the plot horizontally (threshold) — not for any
// point math.
const W = 320;
const H = 120;
const PAD = 14;
const MARKER_R = 3.5;

export function buildExpChart(model: ChartModel): string {
  if (model.mode === "empty") {
    return svg(`<text x="${W / 2}" y="${H / 2}" class="chart-empty" text-anchor="middle">No history yet — complete a quest</text>`);
  }

  return svg([
    segments(model.points),
    markers(model.points),
    threshold(model.threshold),
    projection(model.projection),
    nowHead(model.nowHead),
  ].join(""));
}

// One polyline per maximal run of equal `inActiveSegment`, with the boundary point
// shared by adjacent runs so the line stays continuous. Robust to non-contiguous
// active runs (leaf-name collisions, interleaved logs), not just the common tail case.
function segments(points: ChartPoint[]): string {
  if (points.length < 2) {
    return ""; // a lone point is carried by its marker / now-head
  }
  const polys: string[] = [];
  let start = 0;
  for (let i = 1; i <= points.length; i++) {
    const flip = i < points.length && points[i].inActiveSegment !== points[start].inActiveSegment;
    if (i === points.length || flip) {
      const run = points.slice(start, flip ? i + 1 : i); // include the boundary point in both runs
      if (run.length >= 2) {
        const cls = points[start].inActiveSegment ? "chart-seg-active" : "chart-seg-dim";
        polys.push(`<polyline class="${cls}" fill="none" points="${run.map((p) => `${p.x},${p.y}`).join(" ")}" />`);
      }
      start = i;
    }
  }
  return polys.join("");
}

function markers(points: ChartPoint[]): string {
  return points
    .filter((p) => p.isMilestone)
    .map(
      (p) =>
        `<path class="chart-marker" d="M ${p.x} ${p.y - MARKER_R} L ${p.x + MARKER_R} ${p.y} L ${p.x} ${p.y + MARKER_R} L ${p.x - MARKER_R} ${p.y} Z"><title>${escapeHtml(p.label)}: ${round(p.exp)} EXP</title></path>`,
    )
    .join("");
}

function nowHead(head: ChartPoint | null): string {
  if (head === null) {
    return "";
  }
  return `<circle class="chart-now" cx="${head.x}" cy="${head.y}" r="${MARKER_R}"><title>now: ${round(head.exp)} EXP</title></circle>`;
}

function threshold(t: ChartModel["threshold"]): string {
  if (t === null) {
    return "";
  }
  return (
    `<line class="chart-threshold" x1="${PAD}" y1="${t.y}" x2="${W - PAD}" y2="${t.y}" />` +
    `<text class="chart-threshold-label" x="${W - PAD}" y="${round(t.y - 3)}" text-anchor="end">Lvl ${t.level}</text>`
  );
}

function projection(p: ChartModel["projection"]): string {
  if (p === null) {
    return "";
  }
  return (
    `<line class="chart-proj" x1="${p.from.x}" y1="${p.from.y}" x2="${p.to.x}" y2="${p.to.y}" />` +
    `<text class="chart-proj-label" x="${p.to.x}" y="${round(p.to.y - 3)}" text-anchor="end">~${p.expeditions} to Lvl ${p.level}</text>`
  );
}

function svg(inner: string): string {
  return `<svg class="exp-chart" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" role="img">${inner}</svg>`;
}

function round(n: number): number {
  return Math.round(n * 10) / 10;
}
