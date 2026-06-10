import { levelProgress } from "../levelMath";
import { LoadingState, QuestPhase } from "../types";
import type { ActiveQuest, AdventurerProfile, ExpFold, PlannedExpedition, QuestPhase as QuestPhaseT, QuestState, SideQuest } from "../types";
import { ALL_BADGES } from "../types";
import type { BadgeDef, NumericStat } from "../types";
import { leafName } from "../leafName";
import { buildChartModel } from "./chartData";
import { buildExpChart } from "./buildExpChart";
import { escapeHtml } from "./escape";
import { HERO_SVG } from "./heroSprite";
import { CSS } from "./styles.generated";

// Webview URIs for every bundled sprite the sheet can use. Each is null when the
// asset is not vendored, in which case the builder falls back to an inline SVG or
// CSS stage. The character-sheet surface resolves these from disk per render.
export interface SheetAssets {
  cspSource: string;
  nonce: string;
  // Keyed character cutout (hero.png, transparent).
  heroImgUri: string | null;
  // Painted dungeon background (hero-bg.jpg). Drives the composited hero stage;
  // the CSS stage is the fallback when absent.
  heroBgUri: string | null;
  // Idle composition strip (hero-idle.png); drives the stepped idle animation.
  heroIdleUri: string | null;
  // Reference-design sprite sheets.
  badgeSheetV2Uri: string | null;
  badgeShelfV2Uri: string | null;
  badgeFrameLockedV2Uri: string | null;
  badgeFrameEarnedV2Uri: string | null;
  badgeFrameProgressV2Uri: string | null;
  badgeIconsIronV2Uri: string | null;
  badgeIconsEmeraldV2Uri: string | null;
  badgeIconsGoldV2Uri: string | null;
  phaseSheetV2Uri: string | null;
  phasePlanningV2Uri: string | null;
  phaseEmbarkedV2Uri: string | null;
  phaseCampV2Uri: string | null;
  phaseNoQuestV2Uri: string | null;
  phaseReadyV2Uri: string | null;
  emptySheetV2Uri: string | null;
}

const BADGE_CELL = 32;
const BADGE_ICON_CELL = 128;
const BADGE_ICON_COLUMNS = 4;
const BADGE_ICON_ROWS = 4;
const PHASE_CELL = 32;
const EMPTY_CELL = 64;

interface BadgeFrameUris {
  locked: string | null;
  earned: string | null;
  progress: string | null;
}

interface BadgeIconSheetUris {
  locked: string | null;
  earned: string | null;
  progress: string | null;
}

export function buildCharacterSheetV2(state: QuestState, assets: SheetAssets): string {
  switch (state.loadingState) {
    case LoadingState.NoAdventurer:
      return emptyDoc("No adventurer yet", "Start your first quest to begin your journey.", assets, 0);
    case LoadingState.UnsupportedSchema:
      return emptyDoc("Unsupported Version", state.error ?? "Please update the extension to the latest version.", assets, 1);
    case LoadingState.Error:
      return emptyDoc("Something went wrong", state.error ?? "We could not load your quest data. Try again in a moment.", assets, 2);
    case LoadingState.Ready:
      return state.profile === null
        ? emptyDoc("No adventurer yet", "Profile data is missing.", assets, 0)
        : readyDoc(state, state.profile, assets);
  }
}

function readyDoc(state: QuestState, profile: AdventurerProfile, assets: SheetAssets): string {
  const progress = levelProgress(profile.totalExp);
  const fillWidth = progress.isMax ? 100 : Math.round(progress.ratio * 100);
  const expLabel = progress.isMax
    ? "MAX LEVEL"
    : `${progress.expThisLevel} / ${progress.expToNext} EXP to level ${progress.next?.level ?? ""}`;

  const activeLeaf = state.activeQuest ? leafName(state.activeQuest.questFolderPath) : null;
  const plannedCount = state.plannedExpeditions.filter((p) => p.status === "planned").length;
  const chartModel = buildChartModel({ fold: state.expFold, history: state.expHistory, profile, activeLeaf, plannedCount });

  const body = `<div class="v2-frame">
    <div class="v2-frame-gold">
      ${frameCorners()}
      <main class="v2-card">
        <div class="v2-topgrid">
          <section class="v2-hero-panel" aria-label="Adventurer">
            ${renderHeroStage(assets)}
          </section>
          <div class="v2-topstack">
            ${renderStatus(state.phase, state.activeQuest, state.expFold, state.plannedExpeditions, state.openSideQuests, assets)}
            ${renderNameplate(profile, progress.tier.title, fillWidth, expLabel)}
          </div>
        </div>
        <section class="v2-panel v2-stats" aria-label="Quest statistics">
          ${stat("Quests", profile.questsCompleted)}
          ${stat("Journeys", profile.totalExpeditions)}
          ${stat("Dangers", profile.totalDangersMapped)}
          ${stat("Oaths", profile.totalOathsSworn)}
          ${stat("Splits", profile.totalSplits)}
          ${stat("EXP", profile.totalExp)}
        </section>
        <section class="v2-panel v2-section">
          <h2 class="v2-section-head"><span>Badges</span><span>${profile.badges.length}/${ALL_BADGES.length}</span></h2>
          ${renderBadgeVault(profile, assets.badgeSheetV2Uri ?? null, assets.badgeShelfV2Uri ?? null, {
            locked: assets.badgeFrameLockedV2Uri ?? null,
            earned: assets.badgeFrameEarnedV2Uri ?? null,
            progress: assets.badgeFrameProgressV2Uri ?? null,
          }, {
            locked: assets.badgeIconsIronV2Uri ?? null,
            earned: assets.badgeIconsGoldV2Uri ?? null,
            progress: assets.badgeIconsEmeraldV2Uri ?? null,
          })}
        </section>
        <section class="v2-panel v2-section">
          <h2 class="v2-section-head"><span>EXP Progression</span></h2>
          <div class="v2-chart-frame">
            <span class="v2-chart-axis v2-chart-y" aria-hidden="true">EXP</span>
            <div class="v2-chart-plot">${buildExpChart(chartModel)}</div>
            <span class="v2-chart-axis v2-chart-x" aria-hidden="true">${escapeHtml(chartModel.xAxisLabel)}</span>
          </div>
        </section>
      </main>
    </div>
  </div>`;

  return doc(body, assets);
}

const PHASE_META: Record<QuestPhaseT, { label: string; sub: string; cls: string; iconIndex: number }> = {
  [QuestPhase.NoQuest]: { label: "No active quest", sub: "Awaiting orders", cls: "v2-phase-none", iconIndex: 4 },
  [QuestPhase.Planning]: { label: "Planning", sub: "Mapping the route", cls: "v2-phase-planning", iconIndex: 3 },
  [QuestPhase.Ready]: { label: "Ready to embark", sub: "Quest prepared", cls: "v2-phase-ready", iconIndex: 2 },
  [QuestPhase.Embarked]: { label: "On expedition", sub: "Active quest", cls: "v2-phase-embarked", iconIndex: 1 },
  [QuestPhase.AtCamp]: { label: "At camp", sub: "Active quest", cls: "v2-phase-camp", iconIndex: 0 },
};

function renderStatus(
  phase: QuestPhaseT,
  activeQuest: ActiveQuest | null,
  expFold: ExpFold | null,
  planned: PlannedExpedition[],
  openSideQuests: SideQuest[],
  assets: SheetAssets,
): string {
  const meta = PHASE_META[phase];
  return `<section class="v2-panel v2-status-panel ${meta.cls}">
    <div class="v2-phase-banner">
      <span class="v2-phase-tile">${phaseIcon(phase, meta.iconIndex, assets)}</span>
      <span class="v2-phase-copy">
        <span class="v2-phase-label">${escapeHtml(meta.label)}</span>
        <span class="v2-phase-sub">${escapeHtml(meta.sub)}</span>
      </span>
    </div>
    ${renderExpeditionTracker(activeQuest, phase, expFold, planned)}
    ${renderSideQuests(openSideQuests)}
  </section>`;
}

function phaseIcon(phase: QuestPhaseT, fallbackIndex: number, assets: SheetAssets): string {
  const uri = phaseIconUri(phase, assets);
  if (uri !== null) {
    return `<img class="v2-phase-sprite" src="${escapeHtml(uri)}" alt="" aria-hidden="true" />`;
  }
  return sprite(assets.phaseSheetV2Uri ?? null, fallbackIndex, PHASE_CELL, 5, "v2-phase-sprite", "phase");
}

function phaseIconUri(phase: QuestPhaseT, assets: SheetAssets): string | null {
  switch (phase) {
    case QuestPhase.NoQuest:
      return assets.phaseNoQuestV2Uri ?? null;
    case QuestPhase.Planning:
      return assets.phasePlanningV2Uri ?? null;
    case QuestPhase.Ready:
      return assets.phaseReadyV2Uri ?? null;
    case QuestPhase.Embarked:
      return assets.phaseEmbarkedV2Uri ?? null;
    case QuestPhase.AtCamp:
      return assets.phaseCampV2Uri ?? null;
  }
}

function renderSideQuests(openSideQuests: SideQuest[]): string {
  if (openSideQuests.length === 0) {
    return "";
  }
  const items = openSideQuests
    .map((sq) => `<li class="v2-side-quest">${escapeHtml(sq.slug)}</li>`)
    .join("");
  return `<div class="v2-side-quests">
    <span class="v2-side-quests-head">Side-Quests (${openSideQuests.length})</span>
    <ul class="v2-side-quests-list">${items}</ul>
  </div>`;
}

const MAX_DONE_ROWS = 3;

// Active-quest panel: an expedition tracker (active -> planned -> done). The chart
// owns full history, so done is a short tail; the panel's job is "now + what's next".
function renderExpeditionTracker(
  activeQuest: ActiveQuest | null,
  phase: QuestPhaseT,
  expFold: ExpFold | null,
  planned: PlannedExpedition[],
): string {
  if (activeQuest === null) {
    return `<div class="v2-quest v2-quest-empty"><span class="v2-quest-name">No active quest</span></div>`;
  }
  const leaf = leafName(activeQuest.questFolderPath);

  const isActive = phase === QuestPhase.Embarked;
  const activeLabel = planned.find((p) => p.status === "active")?.label ?? "current expedition";
  const plannedRows = planned.filter((p) => p.status === "planned" && !(isActive && p.label === activeLabel));

  const doneEvents = (expFold?.events ?? []).filter((e) => e.type === "expedition" && e.quest === leaf);
  const doneTotal = doneEvents.length;
  const doneShown = doneEvents.slice().reverse().slice(0, MAX_DONE_ROWS);
  const overflow = doneTotal - doneShown.length;

  const rows: string[] = [];
  if (isActive) {
    rows.push(row("active", "●", escapeHtml(activeLabel)));
  }
  for (const p of plannedRows) {
    rows.push(row("planned", "○", escapeHtml(p.label)));
  }
  for (const e of doneShown) {
    if (e.type !== "expedition") {
      continue; // narrow the union; filter already guarantees this
    }
    const flags = [e.dangers > 0 ? `${e.dangers}d` : "", e.oaths > 0 ? `${e.oaths}o` : ""].filter(Boolean).join(" · ");
    const meta = `+${e.expDelta} XP${flags ? ` · ${flags}` : ""}`;
    rows.push(row("done", "✓", `${escapeHtml(e.date)} <span class="v2-exped-meta">${meta}</span>`));
  }
  if (overflow > 0) {
    rows.push(`<li class="v2-exped-row v2-exped-more">+${overflow} earlier</li>`);
  }

  const counts = `${doneTotal} done · ${isActive ? 1 : 0} active · ${plannedRows.length} plan`;
  return `<div class="v2-quest">
    <div class="v2-exped-head">
      <span class="v2-quest-name">${escapeHtml(leaf)}</span>
      <span class="v2-exped-counts">${escapeHtml(counts)}</span>
    </div>
    <span class="v2-quest-realm"><span>Realm:</span> ${escapeHtml(activeQuest.realm)}</span>
    ${rows.length > 0 ? `<ul class="v2-exped-list">${rows.join("")}</ul>` : ""}
  </div>`;
}

function row(status: string, symbol: string, body: string): string {
  return `<li class="v2-exped-row v2-exped-${status}"><span class="v2-exped-status">${symbol}</span> ${body}</li>`;
}

function renderNameplate(profile: AdventurerProfile, title: string, fillWidth: number, expLabel: string): string {
  return `<section class="v2-panel v2-nameplate">
    <h1 class="v2-name">${escapeHtml(profile.adventurer)}</h1>
    <div class="v2-title-row">
      <span class="v2-level">Lv. ${profile.level}</span>
      <span class="v2-title">${escapeHtml(title)}</span>
    </div>
    <div class="v2-exp-wrap">
      ${expBar(fillWidth)}
      <span class="v2-exp-label">${escapeHtml(expLabel)}</span>
    </div>
  </section>`;
}

function renderHeroStage(assets: SheetAssets): string {
  if (assets.heroBgUri !== null) {
    return `<div class="v2-hero-stage v2-hero-stage-img">
      <img class="v2-hero-bg" src="${escapeHtml(assets.heroBgUri)}" alt="" aria-hidden="true" />
      <div class="v2-hero-sparkles" aria-hidden="true">
        <span class="v2-spark v2-spark-1"></span>
        <span class="v2-spark v2-spark-2"></span>
        <span class="v2-spark v2-spark-3"></span>
        <span class="v2-spark v2-spark-4"></span>
        <span class="v2-spark v2-spark-5"></span>
        <span class="v2-spark v2-spark-6"></span>
        <span class="v2-spark v2-spark-7"></span>
        <span class="v2-spark v2-spark-8"></span>
      </div>
      ${renderHeroChar(assets)}
    </div>`;
  }
  return `<div class="v2-hero-stage v2-hero-stage-fallback">
    <div class="v2-hero-figure">${HERO_SVG}</div>
  </div>`;
}

function renderHeroChar(assets: SheetAssets): string {
  if (assets.heroIdleUri !== null) {
    return `<svg class="v2-hero-char v2-hero-idle" viewBox="0 0 256 256" role="img" aria-label="adventurer">
      <image class="v2-hero-idle-img" href="${escapeHtml(assets.heroIdleUri)}" x="0" y="0" width="27136" height="256" />
    </svg>`;
  }
  if (assets.heroImgUri !== null) {
    return `<img class="v2-hero-char" src="${escapeHtml(assets.heroImgUri)}" alt="adventurer" />`;
  }
  return `<div class="v2-hero-char v2-hero-svg">${HERO_SVG}</div>`;
}

function renderBadgeVault(
  profile: AdventurerProfile,
  sheetUri: string | null,
  shelfUri: string | null,
  frameUris: BadgeFrameUris,
  iconSheetUris: BadgeIconSheetUris,
): string {
  const shelves = shelfUri === null
    ? ""
    : Array.from({ length: Math.ceil(ALL_BADGES.length / 3) }, (_, index) =>
      `<img class="v2-badge-shelf v2-badge-shelf-${index + 1}" src="${escapeHtml(shelfUri)}" alt="" aria-hidden="true" />`,
    ).join("");
  return `<div class="v2-badge-grid">
    ${shelves}
    ${ALL_BADGES.map((badge, index) => renderBadge(profile, badge, index, sheetUri, frameUris, iconSheetUris)).join("")}
  </div>`;
}

function renderBadge(
  profile: AdventurerProfile,
  badge: BadgeDef,
  index: number,
  sheetUri: string | null,
  frameUris: BadgeFrameUris,
  iconSheetUris: BadgeIconSheetUris,
): string {
  const earned = profile.badges.includes(badge.name);
  const progressRatio = badgeProgressRatio(profile, badge);
  const onProgress = !earned && progressRatio >= 0.75;
  const stateClass = earned ? "v2-badge-earned" : onProgress ? "v2-badge-on-progress" : "v2-badge-locked";
  const frameUri = earned ? frameUris.earned : onProgress ? frameUris.progress : frameUris.locked;
  const frame = frameUri === null
    ? ""
    : `<img class="v2-badge-bg" src="${escapeHtml(frameUri)}" alt="" aria-hidden="true" />`;
  const icon = badgeIcon(earned, onProgress, index, badge.name, sheetUri, iconSheetUris);
  const counter = badge.progress === undefined ? "" : `<span class="v2-badge-progress">${progressText(profile, badge)}</span>`;
  return `<article class="v2-badge ${stateClass}" title="${escapeHtml(badge.hint)}">
    ${frame}
    <div class="v2-badge-medal">${icon}</div>
    <div class="v2-badge-plate">
      <span class="v2-badge-name">${escapeHtml(badge.name)}</span>
      ${counter}
    </div>
  </article>`;
}

function badgeIcon(
  earned: boolean,
  onProgress: boolean,
  badgeIndex: number,
  badgeName: string,
  fallbackSheetUri: string | null,
  iconSheetUris: BadgeIconSheetUris,
): string {
  if (earned) {
    return gridSprite(iconSheetUris.earned, badgeIndex + 1, "v2-badge-sprite", badgeName)
      ?? sprite(fallbackSheetUri, badgeIndex, BADGE_CELL, ALL_BADGES.length, "v2-badge-sprite", badgeName);
  }
  if (onProgress) {
    return gridSprite(iconSheetUris.progress, badgeIndex + 1, "v2-badge-sprite", badgeName)
      ?? sprite(fallbackSheetUri, badgeIndex, BADGE_CELL, ALL_BADGES.length, "v2-badge-sprite", badgeName);
  }
  return gridSprite(iconSheetUris.locked, 0, "v2-badge-sprite", "locked") ?? lockedMedallionSvg();
}

function badgeProgressRatio(profile: AdventurerProfile, badge: BadgeDef): number {
  const progress = badge.progress;
  if (progress === undefined) {
    return 0;
  }
  return statValue(profile, progress.stat) / progress.threshold;
}

function progressText(profile: AdventurerProfile, badge: BadgeDef): string {
  const progress = badge.progress;
  if (progress === undefined) {
    return "";
  }
  return `${Math.min(statValue(profile, progress.stat), progress.threshold)}/${progress.threshold}`;
}

function statValue(profile: AdventurerProfile, statName: NumericStat): number {
  if (statName === "level") {
    return levelProgress(profile.totalExp).tier.level;
  }
  return profile[statName];
}

function sprite(
  uri: string | null,
  index: number,
  cell: number,
  totalCells: number,
  className: string,
  label: string,
): string {
  if (uri === null) {
    return `<span class="${className} v2-sprite-fallback" aria-label="${escapeHtml(label)}"></span>`;
  }
  const offset = index * cell;
  return `<svg class="${className}" viewBox="0 0 ${cell} ${cell}" role="img" aria-label="${escapeHtml(label)}">
    <image href="${escapeHtml(uri)}" x="-${offset}" y="0" width="${cell * totalCells}" height="${cell}" />
  </svg>`;
}

function gridSprite(uri: string | null, index: number, className: string, label: string): string | null {
  if (uri === null) {
    return null;
  }
  const maxIndex = (BADGE_ICON_COLUMNS * BADGE_ICON_ROWS) - 1;
  const safeIndex = Math.max(0, Math.min(index, maxIndex));
  const column = safeIndex % BADGE_ICON_COLUMNS;
  const row = Math.floor(safeIndex / BADGE_ICON_COLUMNS);
  return `<svg class="${className}" viewBox="0 0 ${BADGE_ICON_CELL} ${BADGE_ICON_CELL}" role="img" aria-label="${escapeHtml(label)}">
    <image href="${escapeHtml(uri)}" x="-${column * BADGE_ICON_CELL}" y="-${row * BADGE_ICON_CELL}" width="${BADGE_ICON_CELL * BADGE_ICON_COLUMNS}" height="${BADGE_ICON_CELL * BADGE_ICON_ROWS}" />
  </svg>`;
}

function lockedMedallionSvg(): string {
  return `<svg class="v2-badge-lock" viewBox="0 0 32 32" role="img" aria-label="locked">
    <path class="v2-lock-ring-dark" d="M16 2 23 5 28 12 28 20 23 27 16 30 9 27 4 20 4 12 9 5z" />
    <path class="v2-lock-ring" d="M16 5 21.5 7.5 25 13 25 19 21.5 24.5 16 27 10.5 24.5 7 19 7 13 10.5 7.5z" />
    <path class="v2-lock-core" d="M16 8 20 10 22 14 22 18 20 22 16 24 12 22 10 18 10 14 12 10z" />
    <path class="v2-lock-metal" d="M11 15h10v8H11z" />
    <path class="v2-lock-metal" d="M13 15v-2.5a3 3 0 0 1 6 0V15" />
    <path class="v2-lock-hole" d="M16 18v3" />
  </svg>`;
}

function stat(label: string, value: number): string {
  return `<div class="v2-stat">
    <span class="v2-stat-value">${value}</span>
    <span class="v2-stat-label">${escapeHtml(label)}</span>
  </div>`;
}

function expBar(fillWidth: number): string {
  return `<svg class="v2-exp-bar" viewBox="0 0 100 8" width="100%" height="8" preserveAspectRatio="none" role="img">
    <rect class="v2-exp-track" x="0" y="0" width="100" height="8" />
    <rect class="v2-exp-fill" x="0" y="0" width="${fillWidth}" height="8" />
  </svg>`;
}

function emptyDoc(heading: string, message: string, assets: SheetAssets, iconIndex: number): string {
  const icon = sprite(assets.emptySheetV2Uri ?? null, iconIndex, EMPTY_CELL, 3, "v2-empty-sprite", heading);
  const body = `<div class="v2-frame v2-frame-empty">
    <div class="v2-frame-gold">
      ${frameCorners()}
      <section class="v2-panel v2-empty">
        ${icon}
        <h1 class="v2-empty-heading">${escapeHtml(heading)}</h1>
        <p class="v2-empty-message">${escapeHtml(message)}</p>
      </section>
    </div>
  </div>`;
  return doc(body, assets);
}

function frameCorners(): string {
  return ["tl", "tr", "br", "bl"].map(cornerOrnament).join("");
}

function cornerOrnament(p: string): string {
  return `<svg class="v2-frame-orn v2-frame-orn-${p}" viewBox="0 0 83 81" width="30" height="30" fill="none" aria-hidden="true">
    <path d="M7 72.5V41H25.5V7H18.5H7V18.5V25H40.5V7H70.5" stroke="url(#v2fcg_${p})" stroke-width="6" shape-rendering="crispEdges" />
    <path d="M13 25H40.5V7H70.5" stroke="#D49947" stroke-width="6" shape-rendering="crispEdges" />
    <defs>
      <linearGradient id="v2fcg_${p}" x1="38.75" y1="7" x2="38.75" y2="72.5" gradientUnits="userSpaceOnUse">
        <stop stop-color="#F5C451" />
        <stop offset="1" stop-color="#9B651D" />
      </linearGradient>
    </defs>
  </svg>`;
}

function doc(body: string, assets: SheetAssets): string {
  const csp = [
    "default-src 'none'",
    `img-src ${assets.cspSource} data:`,
    `style-src 'nonce-${assets.nonce}'`,
    `font-src ${assets.cspSource}`,
  ].join("; ");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="Content-Security-Policy" content="${csp}" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style nonce="${assets.nonce}">${CSS}</style>
  <title>Quest Dashboard</title>
</head>
<body>${body}</body>
</html>`;
}
