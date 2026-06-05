const fs = require("fs");
const path = require("path");

const { CSS } = require("../out/webview/styles.generated.js");

const phases = [
  {
    className: "v2-phase-camp",
    icon: "phase-camp-v2.png",
    label: "At camp",
    sub: "Active Quest",
  },
  {
    className: "v2-phase-embarked",
    icon: "phase-embarked-v2.png",
    label: "On expedition",
    sub: "Active Quest",
  },
  {
    className: "v2-phase-ready",
    icon: "phase-ready-v2.png",
    label: "Ready to embark",
    sub: "Quest prepared",
  },
  {
    className: "v2-phase-planning",
    icon: "phase-planning-v2.png",
    label: "Planning",
    sub: "Mapping the route",
  },
  {
    className: "v2-phase-none",
    icon: "phase-no-quest-v2.png",
    label: "No active quest",
    sub: "Awaiting orders",
  },
];

function renderPhase(phase) {
  return `<section class="v2-panel v2-status-panel ${phase.className}">
    <div class="v2-phase-banner">
      <span class="v2-phase-tile">
        <img class="v2-phase-sprite" src="${phase.icon}" alt="" />
      </span>
      <span class="v2-phase-copy">
        <span class="v2-phase-label">${phase.label}</span>
        <span class="v2-phase-sub">${phase.sub}</span>
      </span>
    </div>
    <div class="v2-quest">
      <span class="v2-quest-name">${phase.className === "v2-phase-none" ? "No active quest" : "vs-code-cs-plugin"}</span>
      ${phase.className === "v2-phase-none" ? "" : '<span class="v2-quest-realm"><span>Realm:</span> devforge</span>'}
    </div>
  </section>`;
}

const exportCss = `
  body {
    min-height: 100vh;
    padding: 32px;
    background:
      radial-gradient(70% 70% at 50% 0%, rgba(70, 93, 126, 0.16), transparent 62%),
      #050a12;
  }
  .phase-export {
    width: min(920px, 100%);
    margin: 0 auto;
    display: grid;
    grid-template-columns: repeat(2, minmax(260px, 1fr));
    gap: 24px;
  }
  .phase-export .v2-status-panel {
    min-height: 122px;
  }
  .phase-export .v2-status-panel:last-child {
    grid-column: 1 / -1;
    width: calc(50% - 12px);
    justify-self: center;
  }
  @media (max-width: 620px) {
    body { padding: 18px; }
    .phase-export { grid-template-columns: 1fr; }
    .phase-export .v2-status-panel:last-child {
      grid-column: auto;
      width: 100%;
    }
  }
`;

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Phase Banner Variants</title>
  <style>${CSS}${exportCss}</style>
</head>
<body>
  <main class="phase-export">
    ${phases.map(renderPhase).join("")}
  </main>
</body>
</html>`;

const output = path.join(__dirname, "..", "assets", "sprites", "_phase-banner-variants.html");
fs.writeFileSync(output, html);
console.log("wrote", output);
