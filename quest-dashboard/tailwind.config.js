/** @type {import('tailwindcss').Config} */
// Utilities are purged against the TS templates that emit markup. Tokens mirror
// the CSS custom properties in tailwind.css so utilities (text-gold, bg-panel,
// rounded-frame ...) match the hand-authored component classes.
module.exports = {
  content: ["./src/**/*.ts"],
  // Corner-ornament classes are emitted via `*-orn-${p}`, so the scanner
  // never sees the literal names and would purge these @layer rules.
  safelist: [
    "frame-orn-tl",
    "frame-orn-tr",
    "frame-orn-br",
    "frame-orn-bl",
    "v2-frame-orn-tl",
    "v2-frame-orn-tr",
    "v2-frame-orn-br",
    "v2-frame-orn-bl",
    "v2-badge-shelf-1",
    "v2-badge-shelf-2",
    "v2-badge-shelf-3",
    "v2-badge-shelf-4",
    "v2-badge-shelf-5",
  ],
  // Webview owns its whole document; no global resets needed beyond ours.
  corePlugins: { preflight: false },
  theme: {
    extend: {
      colors: {
        bg: "#0e0c1a",
        panel: "#201a30",
        "panel-2": "#271f3a",
        inset: "#0b0916",
        edge: "#3a2f54",
        ink: "#f4eeff",
        muted: "#a797c6",
        faint: "#786a98",
        gold: "#f5c451",
        "gold-soft": "#ffdd88",
        "gold-deep": "#b88526",
        teal: "#4fd9c2",
        green: "#5fd6a3",
        blue: "#6fc0ff",
        purple: "#c59bff",
      },
      borderRadius: { frame: "18px", panel: "5px" },
    },
  },
  plugins: [],
};
