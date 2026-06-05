// Dev-only: render the real character sheet with mock data so border/badge/stat
// CSS can be eyeballed in a browser without launching the VSCode extension.
const { buildCharacterSheetV2 } = require("../out/webview/buildCharacterSheetV2.js");
const { LoadingState, QuestPhase } = require("../out/types.js");
const fs = require("fs");
const path = require("path");

const profile = {
  adventurer: "Einde", level: 10, totalExp: 54321,
  questsCompleted: 12345, totalExpeditions: 23456, totalDangersMapped: 34567,
  totalOathsSworn: 45678, totalSplits: 56789,
  badges: [
    "First Blood",
    "Scroll Keeper",
    "Veteran",
    "Legend",
    "Danger Mapper",
    "Danger Hoarder",
    "Oath Keeper",
    "Lore Master",
    "Speed Runner",
    "Marathoner",
    "Unstoppable",
    "Clean Sweep",
    "Split Master",
    "Rising Star",
    "Diamond",
  ],
};
const state = {
  loadingState: LoadingState.Ready, phase: QuestPhase.AtCamp, profile,
  expHistory: [],
  activeQuest: { questFolderPath: ".ai-context/quests/vs-code-cs-plugin", realm: "devforge" },
  openSideQuests: [],
  scrolls: [], schemaVersion: null, error: null,
};
const assets = {
  cspSource: "* data: vscode-resource:", nonce: "abc123",
  heroImgUri: null,
  heroBgUri: "hero-bg.jpg", heroIdleUri: "hero-idle.png",
  badgeSheetV2Uri: "badge-sheet-v2.png",
  badgeShelfV2Uri: "badge-shelf-v2.png",
  badgeFrameLockedV2Uri: "badge-frame-locked-v2.png",
  badgeFrameEarnedV2Uri: "badge-frame-earned-v2.png",
  badgeFrameProgressV2Uri: "badge-frame-progress-v2.png",
  badgeIconsIronV2Uri: "badge-icons-iron-v2.png",
  badgeIconsEmeraldV2Uri: "badge-icons-emerald-v2.png",
  badgeIconsGoldV2Uri: "badge-icons-gold-v2.png",
  phaseSheetV2Uri: "phase-icons-v2.png",
  phasePlanningV2Uri: "phase-planning-v2.png",
  phaseEmbarkedV2Uri: "phase-embarked-v2.png",
  phaseCampV2Uri: "phase-camp-v2.png",
  phaseNoQuestV2Uri: "phase-no-quest-v2.png",
  phaseReadyV2Uri: "phase-ready-v2.png",
  emptySheetV2Uri: "empty-states-v2.png",
};
const out = path.join(__dirname, "..", "assets", "sprites", "_sheet-preview.html");
// Strip the CSP meta for the browser preview only: default-src 'none' has no
// script-src, which would block browser-sync's injected live-reload script.
// The real extension webview keeps its CSP (set in buildCharacterSheetV2's doc()).
const html = buildCharacterSheetV2(state, assets).replace(
  /\s*<meta http-equiv="Content-Security-Policy"[^>]*>/,
  "",
);
fs.writeFileSync(out, html);
console.log("wrote", out);
