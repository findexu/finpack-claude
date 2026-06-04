import { levelProgress } from "../levelMath";
import { LoadingState, QuestPhase } from "../types";
import type { ActiveQuest, AdventurerProfile, QuestPhase as QuestPhaseT, QuestState } from "../types";
import { buildBadgeGrid } from "./buildBadgeGrid";
import { buildExpChart } from "./buildExpChart";
import { escapeHtml } from "./escape";
import { HERO_SVG } from "./heroSprite";
import { CSS } from "./styles.generated";

export interface SheetAssets {
  cspSource: string;
  nonce: string;
  avatarUri: string | null;
  badgeSheetUri: string | null;
  // 4-frame horizontal idle sheet (square frames), if vendored. Drives a
  // steps(4) animation; falls back to the static avatar / SVG hero when null.
  heroSheetUri: string | null;
  // Keyed character cutout (hero.png, transparent). Preferred over avatar.png.
  heroImgUri: string | null;
  // Painted dungeon background (hero-bg.jpg). When present, the hero stage
  // renders the real composited scene; otherwise the CSS stage is the fallback.
  heroBgUri: string | null;
  // Idle composition strip (hero-idle.png, 27136x256, 106 256px square cells).
  // Preferred over the static hero.png; drives a steps(106) animation.
  heroIdleUri: string | null;
}

export function buildCharacterSheet(state: QuestState, assets: SheetAssets): string {
  switch (state.loadingState) {
    case LoadingState.NoAdventurer:
      return emptyDoc("No adventurer yet", "Run /new-quest or /init-xp to begin your journey.", assets);
    case LoadingState.UnsupportedSchema:
      return emptyDoc("Unsupported quest-system schema", state.error ?? "Update the Quest Dashboard extension.", assets);
    case LoadingState.Error:
      return emptyDoc("Could not read quest data", state.error ?? "Check the quest-system files.", assets);
    case LoadingState.Ready:
      return state.profile === null
        ? emptyDoc("No adventurer yet", "Profile data is missing.", assets)
        : readyDoc(state, state.profile, assets);
  }
}

function readyDoc(state: QuestState, profile: AdventurerProfile, assets: SheetAssets): string {
  const progress = levelProgress(profile.totalExp);
  const fillWidth = progress.isMax ? 100 : Math.round(progress.ratio * 100);
  const expLabel = progress.isMax
    ? "MAX LEVEL"
    : `${progress.expThisLevel} / ${progress.expToNext} EXP to level ${progress.next?.level ?? ""}`;

  const badgeCount = profile.badges.length;

  const body = `
    <div class="frame">
      <div class="frame-gold">
      ${frameCorners()}
      <div class="card">
        <div class="topgrid">
          <div class="panel panel-hero">
            ${panelCorners()}
            ${renderHeroStage(assets)}
          </div>
          <div class="topstack">
            ${renderStatus(state.phase, state.activeQuest)}
            ${renderNameplate(profile, progress, fillWidth, expLabel)}
          </div>
        </div>
        <section class="stats">
          ${stat("Quests", profile.questsCompleted)}
          ${stat("Journeys", profile.totalExpeditions)}
          ${stat("Dangers", profile.totalDangersMapped)}
          ${stat("Oaths", profile.totalOathsSworn)}
          ${stat("Splits", profile.totalSplits)}
          ${stat("EXP", profile.totalExp)}
        </section>
        <section class="panel section">
          ${panelCorners()}
          <h2><span class="section-title">Badges</span><span class="section-meta">${badgeCount}/15</span></h2>
          ${buildBadgeGrid(profile, assets.badgeSheetUri)}
        </section>
        <section class="panel section">
          ${panelCorners()}
          <h2><span class="section-title">EXP Progression</span></h2>
          <div class="chart-frame">
            <span class="chart-axis chart-axis-y" aria-hidden="true">EXP</span>
            <div class="chart-plot">${buildExpChart(state.expHistory)}</div>
            <span class="chart-axis chart-axis-x" aria-hidden="true">Quests</span>
          </div>
        </section>
      </div>
      </div>
    </div>`;

  return doc(body, assets);
}

const PHASE_META: Record<QuestPhaseT, { label: string; sub: string; cls: string; icon: string }> = {
  [QuestPhase.NoQuest]: { label: "No active quest", sub: "Awaiting orders", cls: "phase-none", icon: "○" },
  [QuestPhase.Planning]: { label: "Planning", sub: "Mapping the route", cls: "phase-planning", icon: "🗺" },
  [QuestPhase.Ready]: { label: "Ready to embark", sub: "Quest prepared", cls: "phase-ready", icon: "⚑" },
  [QuestPhase.Embarked]: { label: "On expedition", sub: "Active quest", cls: "phase-embarked", icon: "⚔" },
  [QuestPhase.AtCamp]: { label: "At camp", sub: "Active quest", cls: "phase-camp", icon: "⛺" },
};

function renderPhaseBanner(phase: QuestPhaseT): string {
  const meta = PHASE_META[phase];
  return `<div class="phase-banner ${meta.cls}">
    <span class="phase-tile"><span class="phase-icon">${meta.icon}</span></span>
    <span class="phase-text">
      <span class="phase-label">${escapeHtml(meta.label)}</span>
      <span class="phase-sub">${escapeHtml(meta.sub)}</span>
    </span>
    <span class="phase-pulse"></span>
  </div>`;
}

function renderEmptyDecor(): string {
  return `<div class="empty-emblem" aria-hidden="true"><div class="empty-rune"></div></div>`;
}

function renderStatus(phase: QuestPhaseT, activeQuest: ActiveQuest | null): string {
  return `<div class="panel status-panel">
    ${panelCorners()}
    ${renderPhaseBanner(phase)}
    ${renderQuest(activeQuest)}
  </div>`;
}

function renderQuest(activeQuest: ActiveQuest | null): string {
  if (activeQuest === null) {
    return `<section class="quest quest-empty"><span class="quest-marker">◇</span><div class="quest-body"><span class="quest-name quest-none">No active quest</span></div></section>`;
  }
  const parts = activeQuest.questFolderPath.split("/").filter((p) => p !== "");
  const name = parts.length > 0 ? parts[parts.length - 1] : activeQuest.questFolderPath;
  return `<section class="quest"><span class="quest-marker">◆</span><div class="quest-body"><span class="quest-name">${escapeHtml(name)}</span><span class="quest-realm"><span class="quest-realm-key">Realm:</span> ${escapeHtml(activeQuest.realm)}</span></div></section>`;
}

function renderNameplate(
  profile: AdventurerProfile,
  progress: ReturnType<typeof levelProgress>,
  fillWidth: number,
  expLabel: string,
): string {
  return `<div class="panel nameplate-panel">
    ${panelCorners()}
    <div class="name">${escapeHtml(profile.adventurer)}</div>
    <div class="title">
      <span class="title-level">Lv. ${progress.tier.level}</span>
      <span class="title-name">${escapeHtml(progress.tier.title)}</span>
    </div>
    <div class="exp-wrap">
      ${expBar(fillWidth)}
      <div class="exp-label">${escapeHtml(expLabel)}</div>
    </div>
  </div>`;
}

function renderHeroStage(assets: SheetAssets): string {
  // Real composited scene: painted background + keyed character on its pedestal.
  // The stage is locked to the background's native aspect ratio so object-fit
  // cover never shifts the painted pedestal — the character anchor stays exact
  // in both the narrow and wide layouts.
  if (assets.heroBgUri !== null) {
    return `<div class="hero-stage hero-stage-img">
      <img class="hero-bg" src="${escapeHtml(assets.heroBgUri)}" alt="" aria-hidden="true" />
      <div class="hero-sparkles" aria-hidden="true">
        <span class="spark spark-1"></span>
        <span class="spark spark-2"></span>
        <span class="spark spark-3"></span>
        <span class="spark spark-4"></span>
        <span class="spark spark-5"></span>
        <span class="spark spark-6"></span>
        <span class="spark spark-7"></span>
        <span class="spark spark-8"></span>
      </div>
      ${renderHeroChar(assets)}
    </div>`;
  }
  return `<div class="hero-stage" aria-hidden="false">
    <div class="hero-arch" aria-hidden="true"></div>
    <div class="hero-sparkles" aria-hidden="true">
      <span class="spark spark-1"></span>
      <span class="spark spark-2"></span>
      <span class="spark spark-3"></span>
      <span class="spark spark-4"></span>
      <span class="spark spark-5"></span>
      <span class="spark spark-6"></span>
      <span class="spark spark-7"></span>
      <span class="spark spark-8"></span>
    </div>
    <div class="hero-figure">${renderHeroFigure(assets)}</div>
    <div class="hero-pedestal" aria-hidden="true">
      <div class="rune-ring"></div>
      <div class="pedestal-top"></div>
    </div>
  </div>`;
}

// Character anchored bottom-center onto the painted pedestal. Priority:
// animated idle-composition strip > static cutout > inline SVG hero.
function renderHeroChar(assets: SheetAssets): string {
  if (assets.heroIdleUri !== null) {
    // viewBox clips one 256px cell; the 27136-wide (106x256) strip is stepped left
    // one frame per step. Presentation attrs only (CSP-safe).
    return `<svg class="hero-char hero-idle" viewBox="0 0 256 256" role="img" aria-label="adventurer">
      <image class="hero-idle-img" href="${escapeHtml(assets.heroIdleUri)}" x="0" y="0" width="27136" height="256" />
    </svg>`;
  }
  const src = assets.heroImgUri ?? assets.avatarUri;
  if (src === null) {
    return `<div class="hero-char hero-char-svg">${HERO_SVG}</div>`;
  }
  return `<img class="hero-char" src="${escapeHtml(src)}" alt="adventurer" />`;
}

// Priority: animated 4-frame sheet > static avatar PNG > inline SVG hero.
function renderHeroFigure(assets: SheetAssets): string {
  if (assets.heroSheetUri !== null) {
    // viewBox shows one 64-unit square; the 256-wide image is stepped left one
    // frame per step (CSS class .hero-frames-img). Presentation attrs only.
    return `<svg class="hero-frames" viewBox="0 0 64 64" role="img" aria-label="adventurer">
      <image class="hero-frames-img" href="${escapeHtml(assets.heroSheetUri)}" x="0" y="0" width="256" height="64" />
    </svg>`;
  }
  return renderAvatar(assets.heroImgUri ?? assets.avatarUri);
}

function renderAvatar(avatarUri: string | null): string {
  if (avatarUri !== null) {
    // High-res source: aspect-preserving, smooth downscale (CSS), not pixelated.
    return `<img class="avatar-img" src="${escapeHtml(avatarUri)}" alt="adventurer avatar" />`;
  }
  // Animated HD pixel-art hero (SVG rect grid). Swap for avatar.png when supplied.
  return HERO_SVG;
}

function expBar(fillWidth: number): string {
  // SVG rects (presentation attributes) instead of a styled div, so we never
  // rely on inline style attributes that a strict style-src CSP would block.
  return `<svg class="exp-bar" viewBox="0 0 100 8" width="100%" height="8" preserveAspectRatio="none" role="img">
    <rect class="exp-track" x="0" y="0" width="100" height="8" />
    <rect class="exp-fill" x="0" y="0" width="${fillWidth}" height="8" />
  </svg>`;
}

// Gold line icons per stat (presentation-only paths; CSP-safe). Keyed by label.
const STAT_ICONS: Record<string, string> = {
  Quests: `<path d="M5 3h11l3 3v15H5z"/><path d="M9 8h6M9 12h6M9 16h4"/>`, // scroll
  Journeys: `<circle cx="12" cy="12" r="9"/><path d="M12 12 8 8m4 4 4 8m-4-8 4-4"/>`, // compass
  Dangers: `<path d="M12 3a7 7 0 0 0-7 7v3l-1 3h16l-1-3v-3a7 7 0 0 0-7-7z"/><circle cx="9" cy="11" r="1.4"/><circle cx="15" cy="11" r="1.4"/>`, // skull
  Oaths: `<circle cx="12" cy="9" r="5"/><path d="M9 13l-2 8 5-3 5 3-2-8"/>`, // medal
  Splits: `<path d="M7 4v6a4 4 0 0 0 4 4h6"/><circle cx="7" cy="4" r="2"/><circle cx="17" cy="14" r="2"/><path d="M7 10v8"/><circle cx="7" cy="20" r="2"/>`, // branch
  EXP: `<path d="M12 3l2.6 5.7 6.2.7-4.6 4.2 1.3 6.1L12 17l-5.5 2.7 1.3-6.1L3.2 9.4l6.2-.7z"/>`, // star
};

function stat(label: string, value: number): string {
  const icon = STAT_ICONS[label] ?? "";
  const ico = icon
    ? `<svg class="stat-ico" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">${icon}</svg>`
    : "";
  return `<div class="stat">${ico}<span class="stat-value">${value}</span><span class="stat-label">${escapeHtml(label)}</span></div>`;
}

function frameCorners(): string {
  // Gold bracket corner ornament authored for the top-left and rotated per
  // corner via CSS. The art carries its own SVG gradient + drop-shadow filters
  // (CSP-safe; no inline style attrs). IDs are suffixed per corner so the four
  // copies don't collide on a shared id in one document.
  return ["tl", "tr", "br", "bl"].map(cornerOrnament).join("");
}

function cornerOrnament(p: string): string {
  // The highlight bar (second path) carries its own drop-shadow so it reads as
  // woven OVER the spiral where the two lines cross — the knot effect. Offset is
  // in viewBox units (~4/83 of 30px) so it survives the small render. ids are
  // namespaced per corner because url(#id) resolves to the first doc match.
  return `<svg class="frame-orn frame-orn-${p}" viewBox="0 0 83 81" width="30" height="30" fill="none" aria-hidden="true">
    <path d="M7 72.5V41H25.5V7H18.5H7V18.5V25H40.5V7H70.5" stroke="url(#fcg_${p})" stroke-width="6" shape-rendering="crispEdges" />
    <path d="M13 25H40.5V7H70.5" stroke="#D49947" stroke-width="6" filter="url(#fcs_${p})" />
    <defs>
      <filter id="fcs_${p}" x="-50%" y="-50%" width="200%" height="200%" color-interpolation-filters="sRGB">
        <feDropShadow dx="7" dy="7" stdDeviation="2" flood-color="#000" flood-opacity="0.95" />
      </filter>
      <linearGradient id="fcg_${p}" x1="38.75" y1="7" x2="38.75" y2="72.5" gradientUnits="userSpaceOnUse">
        <stop stop-color="#DC9E30" />
        <stop offset="1" stop-color="#CB9A4F" />
      </linearGradient>
    </defs>
  </svg>`;
}

function panelCorners(): string {
  return ``;
}

function emptyDoc(heading: string, message: string, assets: SheetAssets): string {
  const body = `<div class="frame frame-empty">
    <div class="frame-gold">
    ${frameCorners()}
    <div class="empty panel">
      ${panelCorners()}
      ${renderEmptyDecor()}
      <div class="empty-heading">${escapeHtml(heading)}</div>
      <div class="empty-message">${escapeHtml(message)}</div>
    </div>
    </div>
  </div>`;
  return doc(body, assets);
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
  <style nonce="${assets.nonce}">${styles()}</style>
  <title>Quest Dashboard</title>
</head>
<body>${body}</body>
</html>`;
}

function styles(): string {
  return CSS;
}
