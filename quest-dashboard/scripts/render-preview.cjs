// Dev-only: render the real character sheet with mock data so border/badge/stat
// CSS can be eyeballed in a browser without launching the VSCode extension.
const { buildCharacterSheet } = require("../out/webview/buildCharacterSheet.js");
const { LoadingState, QuestPhase } = require("../out/types.js");
const fs = require("fs");
const path = require("path");

const profile = {
  adventurer: "Einde", level: 1, totalExp: 90,
  questsCompleted: 0, totalExpeditions: 4, totalDangersMapped: 6,
  totalOathsSworn: 12, totalSplits: 0,
  badges: ["First Blood", "Bug Slayer", "Pathfinder"],
};
const state = {
  loadingState: LoadingState.Ready, phase: QuestPhase.AtCamp, profile,
  expHistory: [],
  activeQuest: { questFolderPath: ".ai-context/quests/vs-code-cs-plugin", realm: "devforge" },
  scrolls: [], schemaVersion: null, error: null,
};
const assets = {
  cspSource: "* data: vscode-resource:", nonce: "abc123",
  avatarUri: null, badgeSheetUri: null, heroSheetUri: null, heroImgUri: null,
  heroBgUri: "hero-bg.jpg", heroIdleUri: "hero-idle.png",
};
const out = path.join(__dirname, "..", "assets", "sprites", "_sheet-preview.html");
// Strip the CSP meta for the browser preview only: default-src 'none' has no
// script-src, which would block browser-sync's injected live-reload script.
// The real extension webview keeps its CSP (set in buildCharacterSheet's doc()).
const html = buildCharacterSheet(state, assets).replace(
  /\s*<meta http-equiv="Content-Security-Policy"[^>]*>/,
  "",
);
fs.writeFileSync(out, html);
console.log("wrote", out);
