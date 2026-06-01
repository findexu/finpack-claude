import { levelProgress } from "../levelMath";
import { LoadingState, QuestPhase } from "../types";
import type { ActiveQuest, AdventurerProfile, QuestPhase as QuestPhaseT, QuestState } from "../types";
import { buildBadgeGrid } from "./buildBadgeGrid";
import { buildExpChart } from "./buildExpChart";
import { escapeHtml } from "./escape";
import { HERO_SVG } from "./heroSprite";

export interface SheetAssets {
  cspSource: string;
  nonce: string;
  avatarUri: string | null;
  badgeSheetUri: string | null;
  // 4-frame horizontal idle sheet (square frames), if vendored. Drives a
  // steps(4) animation; falls back to the static avatar / SVG hero when null.
  heroSheetUri: string | null;
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
  return `<div class="hero-stage" aria-hidden="false">
    <div class="hero-arch" aria-hidden="true"></div>
    <div class="hero-sparkles" aria-hidden="true">
      <span class="spark spark-1"></span>
      <span class="spark spark-2"></span>
      <span class="spark spark-3"></span>
      <span class="spark spark-4"></span>
    </div>
    <div class="hero-figure">${renderHeroFigure(assets)}</div>
    <div class="hero-pedestal" aria-hidden="true">
      <div class="rune-ring"></div>
      <div class="pedestal-top"></div>
    </div>
  </div>`;
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
  return renderAvatar(assets.avatarUri);
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

function stat(label: string, value: number): string {
  return `<div class="stat"><span class="stat-value">${value}</span><span class="stat-label">${escapeHtml(label)}</span></div>`;
}

function frameCorners(): string {
  return `<div class="frame-corner frame-corner-tl" aria-hidden="true"></div>
    <div class="frame-corner frame-corner-tr" aria-hidden="true"></div>
    <div class="frame-corner frame-corner-bl" aria-hidden="true"></div>
    <div class="frame-corner frame-corner-br" aria-hidden="true"></div>`;
}

function panelCorners(): string {
  return `<div class="panel-corner panel-corner-tl" aria-hidden="true"></div>
    <div class="panel-corner panel-corner-tr" aria-hidden="true"></div>
    <div class="panel-corner panel-corner-bl" aria-hidden="true"></div>
    <div class="panel-corner panel-corner-br" aria-hidden="true"></div>`;
}

function emptyDoc(heading: string, message: string, assets: SheetAssets): string {
  const body = `<div class="frame frame-empty">
    ${frameCorners()}
    <div class="empty panel">
      ${panelCorners()}
      ${renderEmptyDecor()}
      <div class="empty-heading">${escapeHtml(heading)}</div>
      <div class="empty-message">${escapeHtml(message)}</div>
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
  return `
    :root {
      /* ---- Surfaces: deep dungeon navy, never pure black; layered for depth. */
      --bg: #0e0c1a;
      --bg-2: #14111f;
      --frame-fill: #161226;
      --panel: #201a30;
      --panel-2: #271f3a;
      --inset: #0b0916;
      --edge: #3a2f54;
      --edge-soft: #2a2240;
      --stone: #2b2740;
      --stone-2: #1e1b2e;

      /* ---- Ink + secondary text. */
      --ink: #f4eeff;
      --muted: #a797c6;
      --faint: #786a98;

      /* ---- RPG accents. */
      --gold: #f5c451;
      --gold-soft: #ffdd88;
      --gold-deep: #b88526;
      --teal: #4fd9c2;
      --teal-deep: #1f9486;
      --green: #5fd6a3;
      --blue: #6fc0ff;
      --purple: #c59bff;
      --line: #ff7ed0;
      --xp: var(--green);

      /* ---- Phase hues. */
      --p-none: #9c8cbb;
      --p-plan: var(--gold);
      --p-ready: var(--blue);
      --p-embark: var(--green);
      --p-camp: var(--purple);

      /* ---- Type scale. */
      --fs-hero: 22px;
      --fs-section: 14px;
      --fs-sub: 12px;
      --fs-body: 12px;
      --fs-caption: 11px;
      --fs-small: 10px;
      --fs-micro: 9px;

      /* ---- Spacing (4px base). */
      --s-1: 4px;
      --s-2: 8px;
      --s-3: 12px;
      --s-4: 16px;
      --s-5: 20px;
      --s-6: 24px;

      --radius: 8px;
      --radius-sm: 5px;
      --t-fast: 120ms ease;
      --t-med: 240ms ease;

      --z-decor: 1;
      --z-figure: 2;
      --z-corner: 3;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: var(--s-3);
      color: var(--ink);
      font-family: var(--vscode-font-family, -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, Ubuntu, sans-serif);
      font-size: var(--fs-body);
      line-height: 1.45;
      -webkit-font-smoothing: antialiased;
      background-color: var(--bg);
      background-image:
        radial-gradient(130% 90% at 50% -12%, rgba(245,196,81,0.08), transparent 55%),
        radial-gradient(80% 60% at 100% 4%, rgba(79,217,194,0.06), transparent 55%),
        radial-gradient(80% 60% at 0% 8%, rgba(197,155,255,0.05), transparent 55%),
        linear-gradient(180deg, var(--bg-2), var(--bg) 42%);
      background-attachment: fixed;
    }

    /* ---- Outer ornate double-border frame ---- */
    .frame {
      position: relative;
      max-width: 520px;
      margin: 0 auto;
      padding: var(--s-3);
      border-radius: var(--radius);
      background:
        linear-gradient(180deg, rgba(255,255,255,0.02), transparent 30%),
        var(--frame-fill);
      border: 2px solid var(--gold-deep);
      box-shadow:
        inset 0 0 0 1px rgba(245,196,81,0.35),
        inset 0 0 0 4px var(--frame-fill),
        inset 0 0 0 5px rgba(245,196,81,0.22),
        inset 0 0 28px rgba(0,0,0,0.6),
        0 8px 26px rgba(0,0,0,0.55);
    }
    .frame-corner {
      position: absolute; width: 16px; height: 16px; z-index: var(--z-corner);
      pointer-events: none;
    }
    .frame-corner::before, .frame-corner::after {
      content: ""; position: absolute; background: var(--gold);
      box-shadow: 0 0 6px rgba(245,196,81,0.5);
    }
    .frame-corner::before { width: 16px; height: 3px; }
    .frame-corner::after { width: 3px; height: 16px; }
    .frame-corner-tl { top: 5px; left: 5px; }
    .frame-corner-tr { top: 5px; right: 5px; }
    .frame-corner-tr::before { right: 0; } .frame-corner-tr::after { right: 0; }
    .frame-corner-bl { bottom: 5px; left: 5px; }
    .frame-corner-bl::before { bottom: 0; } .frame-corner-bl::after { bottom: 0; }
    .frame-corner-br { bottom: 5px; right: 5px; }
    .frame-corner-br::before { right: 0; bottom: 0; } .frame-corner-br::after { right: 0; bottom: 0; }

    .card { container-type: inline-size; display: flex; flex-direction: column; gap: var(--s-3); }

    /* ---- Top region: hero | (status + nameplate) ---- */
    .topgrid { display: flex; flex-direction: column; gap: var(--s-3); }
    .topstack { display: flex; flex-direction: column; gap: var(--s-3); min-width: 0; }

    /* ---- Framed sub-panels ---- */
    .panel {
      position: relative;
      background: linear-gradient(180deg, var(--panel-2), var(--panel));
      border: 1px solid var(--edge);
      border-radius: var(--radius-sm);
      box-shadow:
        inset 0 1px 0 rgba(255,255,255,0.05),
        inset 0 0 0 1px rgba(0,0,0,0.35),
        0 2px 0 rgba(0,0,0,0.4);
    }
    .panel-hero { padding: var(--s-3); overflow: hidden; }
    .section { padding: var(--s-3); }

    /* Decorative bracket corners on framed panels. */
    .panel-corner { position: absolute; width: 8px; height: 8px; pointer-events: none; opacity: 0.8; z-index: var(--z-corner); }
    .panel-corner-tl { top: 4px; left: 4px; border-top: 2px solid var(--gold); border-left: 2px solid var(--gold); }
    .panel-corner-tr { top: 4px; right: 4px; border-top: 2px solid var(--gold); border-right: 2px solid var(--gold); }
    .panel-corner-bl { bottom: 4px; left: 4px; border-bottom: 2px solid var(--gold); border-left: 2px solid var(--gold); }
    .panel-corner-br { bottom: 4px; right: 4px; border-bottom: 2px solid var(--gold); border-right: 2px solid var(--gold); }

    /* ---- Hero stage: pedestal + rune ring + arch backdrop + sprite ---- */
    .hero-stage {
      position: relative;
      display: flex; align-items: flex-end; justify-content: center;
      min-height: 220px;
      padding: var(--s-4) var(--s-2) var(--s-2);
      border-radius: var(--radius-sm);
      background:
        radial-gradient(70% 50% at 50% 92%, rgba(79,217,194,0.10), transparent 60%),
        radial-gradient(90% 70% at 50% 18%, rgba(0,0,0,0.0), var(--inset) 100%),
        linear-gradient(180deg, #100d20, var(--inset));
      border: 1px solid var(--edge-soft);
      box-shadow: inset 0 0 0 1px rgba(0,0,0,0.4), inset 0 0 26px rgba(0,0,0,0.6);
      overflow: hidden;
    }
    .hero-arch {
      position: absolute; top: 8%; left: 50%; transform: translateX(-50%);
      width: 70%; height: 80%; z-index: var(--z-decor);
      border: 2px solid rgba(140,120,180,0.16);
      border-bottom: none;
      border-radius: 50% 50% 0 0 / 60% 60% 0 0;
      background:
        radial-gradient(80% 60% at 50% 0%, rgba(111,192,255,0.05), transparent 70%);
    }
    .hero-arch::before {
      content: ""; position: absolute; inset: 12% 14% 0;
      border: 1px solid rgba(140,120,180,0.10);
      border-bottom: none;
      border-radius: 50% 50% 0 0 / 60% 60% 0 0;
    }
    .hero-sparkles { position: absolute; inset: 0; z-index: var(--z-decor); pointer-events: none; }
    .spark {
      position: absolute; width: 4px; height: 4px; border-radius: 50%;
      background: var(--gold-soft);
      box-shadow: 0 0 6px 1px rgba(255,221,136,0.8);
      opacity: 0.7;
    }
    .spark-1 { top: 22%; left: 24%; animation: qd-twinkle 2.6s ease-in-out infinite; }
    .spark-2 { top: 34%; right: 22%; width: 3px; height: 3px; animation: qd-twinkle 3.1s ease-in-out 0.5s infinite; }
    .spark-3 { top: 16%; right: 34%; width: 5px; height: 5px; background: var(--teal); box-shadow: 0 0 7px 1px rgba(79,217,194,0.8); animation: qd-twinkle 2.2s ease-in-out 0.9s infinite; }
    .spark-4 { top: 48%; left: 18%; width: 3px; height: 3px; background: var(--blue); box-shadow: 0 0 6px 1px rgba(111,192,255,0.8); animation: qd-twinkle 3.4s ease-in-out 0.3s infinite; }

    .hero-figure {
      position: relative; z-index: var(--z-figure);
      display: flex; align-items: flex-end; justify-content: center;
      margin-bottom: 26px;
      animation: qd-float 3.6s ease-in-out infinite;
    }
    .avatar-hero { width: 150px; height: auto; image-rendering: pixelated; display: block; filter: drop-shadow(0 6px 8px rgba(0,0,0,0.6)); }
    .avatar-img { height: 150px; width: auto; image-rendering: auto; display: block; border-radius: 3px; filter: drop-shadow(0 6px 8px rgba(0,0,0,0.6)); }
    /* 4-frame idle sheet: viewBox clips one frame; step the 256-wide image left */
    .hero-frames { width: 150px; height: 150px; display: block; image-rendering: pixelated; filter: drop-shadow(0 6px 8px rgba(0,0,0,0.6)); overflow: hidden; }
    .hero-frames-img { animation: heroFrames 0.9s steps(4) infinite; }
    @keyframes heroFrames { from { transform: translateX(0); } to { transform: translateX(-256px); } }

    /* Stone pedestal + glowing rune ring */
    .hero-pedestal {
      position: absolute; bottom: 14px; left: 50%; transform: translateX(-50%);
      z-index: var(--z-decor);
      width: 150px; height: 54px;
      display: flex; align-items: flex-end; justify-content: center;
    }
    .rune-ring {
      position: absolute; bottom: 6px; left: 50%; transform: translateX(-50%);
      width: 142px; height: 40px;
      border-radius: 50%;
      border: 2px solid rgba(79,217,194,0.55);
      box-shadow:
        0 0 14px 2px rgba(79,217,194,0.45),
        inset 0 0 12px rgba(79,217,194,0.30);
      background: radial-gradient(50% 60% at 50% 50%, rgba(79,217,194,0.18), transparent 70%);
      animation: qd-ring 2.8s ease-in-out infinite;
    }
    .rune-ring::before {
      content: ""; position: absolute; inset: 8px 18px;
      border-radius: 50%;
      border: 1px dashed rgba(111,192,255,0.45);
    }
    .pedestal-top {
      position: relative; width: 118px; height: 40px;
      border-radius: 50%;
      background:
        radial-gradient(60% 60% at 50% 30%, #46415e, var(--stone) 60%, var(--stone-2) 100%);
      border: 1px solid rgba(120,110,150,0.4);
      box-shadow:
        inset 0 2px 4px rgba(255,255,255,0.08),
        inset 0 -6px 10px rgba(0,0,0,0.6),
        0 6px 10px rgba(0,0,0,0.5);
    }

    /* ---- Status panel: phase banner + active quest ---- */
    .status-panel { padding: var(--s-3); display: flex; flex-direction: column; gap: var(--s-3); }
    .phase-banner {
      display: flex; align-items: center; gap: var(--s-2);
      color: var(--p-none);
    }
    .phase-tile {
      flex: 0 0 auto;
      width: 38px; height: 38px;
      display: flex; align-items: center; justify-content: center;
      border-radius: var(--radius-sm);
      border: 1px solid currentColor;
      background: linear-gradient(180deg, rgba(255,255,255,0.06), var(--inset));
      box-shadow: inset 0 0 8px rgba(0,0,0,0.5), 0 0 8px -2px currentColor;
    }
    .phase-icon { font-size: 18px; line-height: 1; }
    .phase-text { display: flex; flex-direction: column; min-width: 0; }
    .phase-label {
      font-size: var(--fs-section); font-weight: 800; letter-spacing: 1px;
      text-transform: uppercase; color: var(--ink); line-height: 1.1;
    }
    .phase-sub {
      font-size: var(--fs-micro); font-weight: 700; letter-spacing: 1.5px;
      text-transform: uppercase; color: currentColor; margin-top: 2px;
    }
    .phase-pulse {
      margin-left: auto; flex: 0 0 auto;
      width: 8px; height: 8px; border-radius: 50%; background: currentColor;
      box-shadow: 0 0 7px 1px currentColor;
    }
    .phase-none    { color: var(--p-none); }
    .phase-planning{ color: var(--p-plan); }
    .phase-ready   { color: var(--p-ready); }
    .phase-embarked{ color: var(--p-embark); }
    .phase-camp    { color: var(--p-camp); }

    /* Active quest line inside status panel */
    .quest {
      display: flex; align-items: flex-start; gap: var(--s-2);
      padding: var(--s-2) var(--s-3);
      background: linear-gradient(90deg, rgba(245,196,81,0.06), transparent 60%), var(--inset);
      border: 1px solid var(--edge-soft);
      border-left: 3px solid var(--gold);
      border-radius: var(--radius-sm);
    }
    .quest-empty { border-left-color: var(--faint); }
    .quest-marker { color: var(--gold); font-size: var(--fs-caption); line-height: 1.5; flex: 0 0 auto; }
    .quest-empty .quest-marker { color: var(--faint); }
    .quest-body { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
    .quest-name { font-size: var(--fs-section); font-weight: 700; color: var(--ink); word-break: break-word; line-height: 1.2; }
    .quest-none { color: var(--muted); font-weight: 600; }
    .quest-realm { color: var(--muted); font-size: var(--fs-caption); letter-spacing: 0.3px; }
    .quest-realm-key { color: var(--faint); text-transform: uppercase; font-size: var(--fs-small); letter-spacing: 1.2px; }

    /* ---- Nameplate panel ---- */
    .nameplate-panel { padding: var(--s-3); }
    .name {
      font-size: var(--fs-hero); font-weight: 800; letter-spacing: 1px; line-height: 1.05;
      text-transform: uppercase; color: var(--ink);
      text-shadow: 0 1px 0 rgba(0,0,0,0.6);
      word-break: break-word;
    }
    .title { margin: var(--s-2) 0 var(--s-3); display: flex; align-items: center; gap: var(--s-2); flex-wrap: wrap; }
    .title-level {
      font-size: var(--fs-caption); font-weight: 800; letter-spacing: 0.5px;
      color: var(--inset);
      background: linear-gradient(180deg, var(--gold-soft), var(--gold-deep));
      padding: 2px 8px; border-radius: 4px;
      box-shadow: 0 1px 0 rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.4);
    }
    .title-name { font-size: var(--fs-sub); color: var(--gold); letter-spacing: 0.4px; font-weight: 600; }

    /* ---- EXP bar ---- */
    .exp-wrap { width: 100%; }
    .exp-bar {
      display: block; width: 100%; height: 10px;
      border: 1px solid var(--edge);
      border-radius: 4px;
      background: var(--inset);
      box-shadow: inset 0 1px 2px rgba(0,0,0,0.6);
      overflow: hidden;
    }
    .exp-track { fill: var(--inset); }
    .exp-fill { fill: var(--xp); }
    .exp-label { color: var(--muted); font-size: var(--fs-caption); margin-top: var(--s-1); letter-spacing: 0.4px; }

    /* ---- Stats row ---- */
    .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--s-1); }
    .stat {
      position: relative;
      padding: var(--s-2) var(--s-1); text-align: center;
      background: linear-gradient(180deg, var(--panel-2), var(--panel));
      border: 1px solid var(--edge-soft);
      border-radius: var(--radius-sm);
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.04);
      transition: border-color var(--t-fast), transform var(--t-fast);
    }
    .stat:hover { border-color: var(--gold-deep); transform: translateY(-1px); }
    .stat-value {
      display: block; font-size: 18px; font-weight: 800; line-height: 1.1;
      color: var(--gold);
      text-shadow: 0 1px 0 rgba(0,0,0,0.5);
    }
    .stat-label {
      display: block; margin-top: 3px;
      font-size: var(--fs-micro); color: var(--muted);
      text-transform: uppercase; letter-spacing: 0.8px; font-weight: 600;
    }

    /* ---- Section headers ---- */
    .section h2 {
      display: flex; align-items: baseline; justify-content: space-between; gap: var(--s-2);
      margin: 0 0 var(--s-3);
      font-size: var(--fs-sub); font-weight: 800;
      text-transform: uppercase; letter-spacing: 2px;
      color: var(--muted);
      padding-bottom: var(--s-2);
      border-bottom: 1px solid var(--edge-soft);
    }
    .section-title { position: relative; padding-left: var(--s-3); color: var(--gold); }
    .section-title::before {
      content: ""; position: absolute; left: 0; top: 50%; transform: translateY(-50%) rotate(45deg);
      width: 5px; height: 5px; background: var(--gold);
      box-shadow: 0 0 5px var(--gold-deep);
    }
    .section-meta { font-size: var(--fs-small); letter-spacing: 1px; color: var(--faint); }

    /* ---- Badge trophy shelves: ornate medallions ---- */
    .badge-grid { display: flex; flex-direction: column; gap: var(--s-4); }
    .shelf { position: relative; }
    .shelf-items {
      display: grid; grid-template-columns: repeat(3, 1fr);
      gap: var(--s-2); padding: 0 var(--s-1) var(--s-2); align-items: end;
    }
    .shelf::after {
      content: ""; display: block; height: 8px;
      border-radius: 2px 2px 4px 4px;
      background: linear-gradient(180deg, #7a4e2b 0%, #5a3417 55%, #38210f 100%);
      box-shadow: 0 4px 7px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,220,170,0.2);
    }
    .badge {
      position: relative;
      display: flex; flex-direction: column; align-items: center;
    }
    /* Ornate medallion: round framed icon disc */
    .badge-medal {
      position: relative;
      width: 100%; max-width: 60px; aspect-ratio: 1 / 1;
      display: flex; align-items: center; justify-content: center;
      border-radius: 50%;
      border: 2px solid var(--edge-soft);
      background: radial-gradient(60% 60% at 50% 35%, var(--panel-2), var(--inset) 80%);
      box-shadow: inset 0 0 8px rgba(0,0,0,0.6), 0 2px 4px rgba(0,0,0,0.45);
      transition: transform var(--t-fast), box-shadow var(--t-fast);
    }
    .badge-medal::before {
      content: ""; position: absolute; inset: 4px; border-radius: 50%;
      border: 1px solid rgba(255,255,255,0.06);
    }
    .badge.earned .badge-medal {
      border-color: var(--gold);
      background:
        radial-gradient(60% 60% at 50% 30%, rgba(255,221,136,0.30), rgba(245,196,81,0.06) 70%),
        radial-gradient(60% 60% at 50% 35%, var(--panel-2), var(--inset) 85%);
      box-shadow:
        inset 0 0 10px rgba(245,196,81,0.30),
        0 0 10px -1px rgba(245,196,81,0.6),
        0 2px 4px rgba(0,0,0,0.5);
    }
    .badge.earned .badge-medal::before { border-color: rgba(255,221,136,0.5); }
    .badge.earned .badge-medal::after {
      content: "★"; position: absolute; top: -4px; right: -2px;
      font-size: var(--fs-small); color: var(--gold-soft);
      text-shadow: 0 0 5px rgba(245,196,81,0.8);
    }
    .badge.ready .badge-medal {
      border-color: var(--teal);
      background:
        radial-gradient(60% 60% at 50% 30%, rgba(79,217,194,0.26), rgba(79,217,194,0.04) 70%),
        radial-gradient(60% 60% at 50% 35%, var(--panel-2), var(--inset) 85%);
      box-shadow:
        inset 0 0 10px rgba(79,217,194,0.25),
        0 0 9px -1px rgba(79,217,194,0.6),
        0 2px 4px rgba(0,0,0,0.5);
      animation: qd-glow 1.9s ease-in-out infinite;
    }
    .badge.ready .badge-medal::before { border-color: rgba(79,217,194,0.5); }
    .badge.locked .badge-medal {
      border-color: rgba(90,80,118,0.7);
      filter: grayscale(0.5);
    }
    .badge-medal:hover { transform: translateY(-2px); }

    .badge-icon { display: flex; align-items: center; justify-content: center; }
    .badge-glyph { font-size: 22px; line-height: 1; }
    .badge.locked .badge-glyph { opacity: 0.5; }
    .badge-sprite { width: 26px; height: 26px; image-rendering: pixelated; }
    .badge-lock { width: 20px; height: 20px; display: block; opacity: 0.6; }
    .badge-lock-shape { fill: none; stroke: var(--faint); stroke-width: 1.6; }

    /* Nameplate plaque below medallion */
    .badge-plate {
      margin-top: 6px; width: 100%;
      padding: 4px 2px; text-align: center;
      background: linear-gradient(180deg, rgba(0,0,0,0.3), rgba(0,0,0,0.45));
      border: 1px solid var(--edge-soft);
      border-radius: 3px;
    }
    .badge.earned .badge-plate { border-color: rgba(245,196,81,0.4); }
    .badge.ready .badge-plate { border-color: rgba(79,217,194,0.4); }
    .badge-name { display: block; font-size: var(--fs-micro); color: var(--muted); letter-spacing: 0.2px; line-height: 1.2; }
    .badge.earned .badge-name { color: var(--ink); }
    .badge-progress { display: block; font-size: var(--fs-micro); margin-top: 2px; font-weight: 700; color: var(--faint); }
    .badge.ready .badge-progress { color: var(--teal); }
    .badge.earned .badge-progress { color: var(--gold); }

    /* ---- EXP chart ---- */
    .chart-frame {
      position: relative;
      padding: var(--s-2) var(--s-2) var(--s-4) var(--s-5);
      background: var(--inset);
      border: 1px solid var(--edge-soft);
      border-radius: var(--radius-sm);
      box-shadow: inset 0 1px 4px rgba(0,0,0,0.5);
    }
    .chart-plot { position: relative; }
    .chart-axis {
      position: absolute; color: var(--faint);
      font-size: var(--fs-micro); text-transform: uppercase; letter-spacing: 1.5px; font-weight: 700;
    }
    .chart-axis-y { left: 5px; top: 50%; transform: translateY(-50%) rotate(-90deg); transform-origin: left center; }
    .chart-axis-x { right: var(--s-2); bottom: 3px; }
    .exp-chart { width: 100%; height: auto; display: block; background: transparent; }
    .chart-line { stroke: var(--line); stroke-width: 2; stroke-linejoin: round; stroke-linecap: round; }
    .chart-dot { fill: var(--gold); stroke: var(--inset); stroke-width: 1; }
    .chart-empty { fill: var(--faint); font-size: var(--fs-caption); letter-spacing: 0.5px; }

    /* ---- Empty states ---- */
    .frame-empty { max-width: 380px; margin: 36px auto; }
    .empty {
      padding: var(--s-6) var(--s-5); text-align: center;
    }
    .empty-emblem {
      width: 60px; height: 60px; margin: 0 auto var(--s-5);
      display: flex; align-items: center; justify-content: center;
      border: 1px solid var(--edge);
      border-radius: 50%;
      background: radial-gradient(60% 60% at 50% 40%, rgba(245,196,81,0.16), var(--inset) 70%);
      box-shadow: inset 0 0 12px rgba(0,0,0,0.5);
    }
    .empty-rune {
      width: 20px; height: 20px;
      border: 2px solid var(--gold);
      transform: rotate(45deg);
      box-shadow: 0 0 8px rgba(245,196,81,0.4);
      animation: qd-rune 3.2s ease-in-out infinite;
    }
    .empty-heading {
      font-size: var(--fs-section); font-weight: 800; letter-spacing: 0.5px;
      color: var(--gold); margin-bottom: var(--s-2);
      text-shadow: 0 1px 0 rgba(0,0,0,0.5);
      text-transform: uppercase;
    }
    .empty-message { color: var(--muted); font-size: var(--fs-body); line-height: 1.5; }

    /* ---- WIDE layout (sidebar container >= 460px) ---- */
    @container (min-width: 460px) {
      .topgrid { flex-direction: row; align-items: stretch; }
      .panel-hero { flex: 1 1 46%; min-width: 0; }
      .topstack { flex: 1 1 54%; }
      .hero-stage { min-height: 100%; }
      .stats { grid-template-columns: repeat(6, 1fr); }
      .shelf-items { grid-template-columns: repeat(5, 1fr); }
      .badge-medal { max-width: 56px; }
      .badge-name { font-size: var(--fs-small); }
    }

    /* ---- CSS-only animations (gated by reduced-motion below) ---- */
    @keyframes qd-pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.45; transform: scale(1.5); } }
    @keyframes qd-shimmer { 0%, 100% { opacity: 0.78; } 50% { opacity: 1; } }
    @keyframes qd-glow {
      0%, 100% { box-shadow: inset 0 0 8px rgba(79,217,194,0.18), 0 0 5px -2px rgba(79,217,194,0.4), 0 2px 4px rgba(0,0,0,0.5); }
      50% { box-shadow: inset 0 0 12px rgba(79,217,194,0.32), 0 0 12px 0 rgba(79,217,194,0.7), 0 2px 4px rgba(0,0,0,0.5); }
    }
    @keyframes qd-rune { 0%, 100% { transform: rotate(45deg) scale(1); opacity: 0.85; } 50% { transform: rotate(45deg) scale(1.12); opacity: 1; } }
    @keyframes qd-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-7px); } }
    @keyframes qd-ring {
      0%, 100% { opacity: 0.7; box-shadow: 0 0 12px 1px rgba(79,217,194,0.4), inset 0 0 10px rgba(79,217,194,0.25); }
      50% { opacity: 1; box-shadow: 0 0 18px 3px rgba(79,217,194,0.6), inset 0 0 14px rgba(79,217,194,0.4); }
    }
    @keyframes qd-twinkle { 0%, 100% { opacity: 0.2; transform: scale(0.7); } 50% { opacity: 0.95; transform: scale(1.15); } }
    .phase-pulse { animation: qd-pulse 1.6s ease-in-out infinite; }
    .exp-fill { animation: qd-shimmer 2s ease-in-out infinite; }

    /* ---- Hero sprite sub-animation (class hooks live on the inline SVG) ---- */
    @keyframes heroBob { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-12px); } }
    @keyframes heroOrbPulse { 0%, 100% { opacity: 0.7; transform: scale(1); } 50% { opacity: 1; transform: scale(1.08); } }
    @keyframes heroBlink { 0%, 92%, 100% { transform: scaleY(1); } 96% { transform: scaleY(0.1); } }
    .hero-body { animation: heroBob 2.6s ease-in-out infinite; }
    .hero-orb { transform-box: fill-box; transform-origin: center; animation: heroOrbPulse 1.8s ease-in-out infinite; }
    .hero-eyes { transform-box: fill-box; transform-origin: center; animation: heroBlink 4.5s ease-in-out infinite; }

    /* ---- Accessibility: honor reduced-motion ---- */
    @media (prefers-reduced-motion: reduce) {
      .phase-pulse, .exp-fill, .empty-rune,
      .hero-figure, .rune-ring, .spark,
      .badge.ready .badge-medal,
      .hero-frames-img,
      .hero-body, .hero-orb, .hero-eyes { animation: none; }
      .stat, .badge-medal { transition: none; }
    }
  `;
}
