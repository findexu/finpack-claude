import assert from "node:assert/strict";
import { test } from "node:test";

import { buildExpChart } from "../../src/webview/buildExpChart";
import type { ChartModel, ChartPoint } from "../../src/webview/chartData";

function pt(x: number, opts: Partial<ChartPoint> = {}): ChartPoint {
  return { x, y: 60, exp: 100, label: "e", isMilestone: false, inActiveSegment: false, ...opts };
}

function model(over: Partial<ChartModel> = {}): ChartModel {
  return { mode: "expeditions", points: [], nowHead: null, threshold: null, projection: null, xAxisLabel: "Expeditions", ...over };
}

function count(haystack: string, needle: string): number {
  return haystack.split(needle).length - 1;
}

test("empty mode renders the no-history message", () => {
  assert.match(buildExpChart(model({ mode: "empty" })), /No history yet/);
});

test("a flag flip yields both an active and a dim segment", () => {
  const points = [pt(0), pt(10), pt(20, { inActiveSegment: true }), pt(30, { inActiveSegment: true })];
  const svg = buildExpChart(model({ points }));
  assert.match(svg, /chart-seg-dim/);
  assert.match(svg, /chart-seg-active/);
});

test("a non-contiguous active flag produces more than one active polyline", () => {
  const points = [pt(0, { inActiveSegment: true }), pt(10), pt(20, { inActiveSegment: true }), pt(30, { inActiveSegment: true })];
  assert.equal(count(buildExpChart(model({ points })), "chart-seg-active") >= 2, true);
});

test("a milestone point renders a marker", () => {
  const svg = buildExpChart(model({ points: [pt(0), pt(10, { isMilestone: true })] }));
  assert.match(svg, /chart-marker/);
});

test("the now-head renders when present", () => {
  const svg = buildExpChart(model({ points: [pt(0), pt(10)], nowHead: pt(10, { label: "now" }) }));
  assert.match(svg, /chart-now/);
});

test("a threshold renders a line and a level label", () => {
  const svg = buildExpChart(model({ points: [pt(0), pt(10)], threshold: { y: 20, level: 7 } }));
  assert.match(svg, /chart-threshold/);
  assert.match(svg, /Lvl 7/);
});

test("no threshold renders neither line nor label", () => {
  const svg = buildExpChart(model({ points: [pt(0), pt(10)] }));
  assert.equal(svg.includes("chart-threshold"), false);
});

test("a projection renders a dashed line and a to-level label", () => {
  const svg = buildExpChart(model({ points: [pt(0), pt(10)], nowHead: pt(10), projection: { from: pt(10), to: { x: 40, y: 20 }, expeditions: 3, level: 7 } }));
  assert.match(svg, /chart-proj/);
  assert.match(svg, /~3 to Lvl 7/);
});

test("the rendered chart contains no inline style or script", () => {
  const svg = buildExpChart(model({ points: [pt(0), pt(10, { isMilestone: true })], nowHead: pt(10), threshold: { y: 20, level: 7 } }));
  assert.equal(svg.includes('style="'), false);
  assert.equal(svg.includes("<script"), false);
});
