# Plan: EXP Progression + Active Quest Panel rework

## Goal

Two character-sheet improvements in the quest-dashboard VS Code extension:

1. **EXP Progression chart** — show the active quest's progress (not just finished
   quests), at expedition granularity, with quest-completion milestones, a live
   "now" marker, the next-level threshold, and a forward projection toward level-up.
2. **Active Quest panel** — replace the bare name/realm plate with an expedition
   tracker that lists past, active, and planned expeditions with status.

Both share one new data source: `events.log`. Build the parser once.

## Locked decisions (from design counsel)

- **Planned expeditions = new structured convention.** A `## Planned Expeditions`
  checklist maintained by quest-system commands (`/counsel-quest`, `/embark`,
  `/make-camp`). Dashboard parses it. This touches quest-system commands + SKILL.md
  + VERSION bump (separate, decoupled workstream B).
- **Chart shows BOTH quests and expeditions (nested).** Expeditions are children of
  quests. The fine curve is per-expedition; quest completions are drawn as labelled
  milestone markers on that curve. Not an either/or.
- **Backward compatible.** `events.log` is newer than some installs. When it is
  absent, the chart degrades to today's per-quest curve (driven by
  `quest-history.md`) plus the now-dot / threshold / projection overlays. The panel
  degrades to active (from phase) + planned (if the convention exists); no per-
  expedition done rows without events.log (see A7 legacy trim).
- **Dashboard stays a read-only observer** (locked oath, DECISIONS_LOG 2026-05-29).
  Workstream A adds only pure parsers + state fields + dumb surface rendering and
  writes NOTHING. All writes live in workstream B's quest-system commands.
- **`## Planned Expeditions` stable home: the STRATEGY_SCROLL index section.** The
  scroll splits into a `strategy/` subfolder at >500 lines; the block MUST live in
  the part that survives split (the top-level `STRATEGY_SCROLL.md` index that remains
  after split, not a module subfile). `/make-camp`'s split logic must preserve it
  there. Parser reads `STRATEGY_SCROLL.md` only — never chases subfiles.

## Data model (ground truth)

Source of truth files under `.claude/quest-xp/`:

| File | Role | Parsed today? |
|---|---|---|
| `profile.md` | derived cache: `total-exp`, level, counters, badges | yes (`profileParser`) |
| `quest-history.md` | per-quest completion, `totalExpAfter` | yes (`historyParser`) → current chart |
| `lifecycle.log` | `{date}\|state\|{quest}\|phase=X` — current phase | yes (`lifecycleLogParser`) |
| `events.log` | append-only XP fold source: `seed` / `expedition` / `quest-complete` | **NO — new parser** |
| `{quest}/STRATEGY_SCROLL.md` | battle plan; will host `## Planned Expeditions` | **NO — new parser** |
| `{quest}/ADVENTURE_JOURNAL.md` | `## Expedition {date}` + `### The Road Ahead` | no |

### events.log line formats

```
2026-06-02|seed|-|total-exp=2790;expeditions=10;dangers=16;oaths=33;splits=0
2026-06-05|expedition|my-quest|dangers=2;oaths=1;split=0
2026-06-09|quest-complete|my-quest|modules=3;expeditions=4;dangers=5;oaths=2;splits=1;clean=1;speed=0
```

- Whole-line atomic appends; a torn/garbled line is **skipped** on fold (mirror
  quest-system behaviour — never throw).
- `seed` carries the baseline `total-exp` (migration). Curve starts there, not 0.

### EXP formulas (MUST mirror SKILL.md `## XP system` exactly)

Per-expedition reward:
```
exp = 5 + (dangers > 0 ? 10 : 0) + (oaths > 0 ? 10 : 0)
```
`split` on an expedition line carries NO EXP (split EXP only at quest completion);
it is informational for the panel/stats.

Per-quest-complete reward:
```
exp = 100 + 25*modules + 10*expeditions + 15*dangers + 20*oaths + 50*splits
    + (clean ? 75 : 0) + (speed ? 50 : 0)
```

Level math (already in `levelMath.ts` / `types.ts`):
```
threshold(N) = 150 * N * (N - 1)      // total EXP to reach level N
exp_to_next(L) = 300 * L
```

**Risk — formula drift.** These constants duplicate quest-system. If quest-system
changes a reward, this parser silently diverges. Mitigations:
- Centralize the constants in one module (`expFormula.ts`) with a comment pointing
  at `skills/quest-system/SKILL.md` `## XP system` as the canonical source.
- The folded cumulative total is used only for curve SHAPE. `profile.totalExp` is
  authoritative for the "now" head and the level/threshold math. If
  `fold.totalExp !== profile.totalExp` (drift or torn lines), trust `profile` and
  scale the WHOLE series uniformly by `profile.totalExp / fold.totalExp` (see A5.5/G5
  for the exact rule, incl. the `fold.totalExp > 0` guard). Surface nothing to the
  user (graceful). Add a test asserting reconciliation.

## Workstream A — Dashboard (self-contained, shippable alone)

### A1. `src/parsers/eventsLogParser.ts` (new)

```ts
export interface ExpEvent {
  date: string;                 // YYYY-MM-DD
  type: "expedition" | "quest-complete";
  quest: string;                // quest-name (leaf); "-" for seed (seed excluded from events[])
  expDelta: number;             // computed via expFormula
  cumExp: number;               // running total incl. seed baseline
  // raw fields kept for the panel:
  dangers: number; oaths: number; split: boolean;        // expedition
  modules?: number; expeditions?: number; splits?: number; clean?: boolean; speed?: boolean; // quest-complete
}

export interface ExpFold {
  seedExp: number;              // baseline from seed line (0 if none)
  events: ExpEvent[];           // chronological, expedition + quest-complete only
  totalExp: number;             // seedExp + sum(expDelta) — for reconciliation vs profile
}

export function parseEventsLog(content: string | null): Result<ExpFold>;
```

- Split on `\n`, split each line on `|`. Require >= 3 segments; skip malformed.
- `seed` → parse `total-exp=N` into `seedExp`. (Other seed counters ignored here.)
- `expedition` / `quest-complete` → parse the `k=v;k=v` payload, compute `expDelta`
  via `expFormula.ts`, accumulate `cumExp`.
- Unknown `type` → skip (forward-compat).
- Never throw; return `{ ok: true, value }` with whatever parsed. (`Result` shape is
  retained for symmetry; effectively always ok.)

### A2. `src/expFormula.ts` (new)

Pure functions + constants for the two reward formulas above. Single home for the
numbers. Imported by the parser (and re-usable by tests). No I/O.

### A3. `src/parsers/plannedExpeditionsParser.ts` (new)

Parses the `## Planned Expeditions` block from `STRATEGY_SCROLL.md`:

```
## Planned Expeditions
- [x] auth scaffolding
- [>] activity-driven phase bump
- [ ] wire projection into chart
```

```ts
export type PlannedStatus = "done" | "active" | "planned";
export interface PlannedExpedition { label: string; status: PlannedStatus; order: number; }
// Returns Result<T> to honor the locked "parsers are pure parse(content): Result<T>"
// decision. Always ok (block-absent -> ok with []), but keeps the uniform shape.
export function parsePlannedExpeditions(strategyText: string | null): Result<PlannedExpedition[]>;
```

- `[x]`→done, `[>]`→active, `[ ]`→planned. Unknown marker → planned.
- Block absent → `{ ok: true, value: [] }` (older quest / split lost it, panel degrades).
- Stop at the next `## ` heading. Trim labels. Ignore non-list lines.
- Reads top-level `STRATEGY_SCROLL.md` index only (stable home; see locked decision).
  Never opens `strategy/` subfiles.

### A4. Types — `src/types.ts`

Add to `QuestState`:
```ts
expFold: ExpFold | null;            // null when events.log absent (legacy install)
plannedExpeditions: PlannedExpedition[];
```
Keep `expHistory` (still used for the legacy-fallback chart and quest markers).

### A5. State manager — `src/stateManager.ts`

- Add `const EVENTS_PATH = [".claude", "quest-xp", "events.log"];`
- In `buildState()`: read events.log → `parseEventsLog` → `expFold` (null if file
  absent).
- Add an EXPLICIT unconditional read of the active quest's `STRATEGY_SCROLL.md` →
  `parsePlannedExpeditions`. Do NOT assume the phase-detection read covers it:
  `detectPhase` reads the strategy scroll ONLY in its fallback branch (when
  lifecycle.log yields no phase, ~line 151), so the common path never reads it.
  Skip the read when there is no active quest.
- Thread both into the returned state objects (all `LoadingState` branches via the
  `base` spread). The state manager performs reads; parsers stay pure.

### A5.5. `src/webview/chartData.ts` (new, pure — no I/O, no HTML)

Honors the locked "dumb surfaces" + parser-purity decisions: ALL chart math lives
here and is unit-tested in isolation; `buildExpChart.ts` becomes a dumb serializer
that maps the returned coordinates to SVG strings.

```ts
export interface ChartPoint { x: number; y: number; exp: number; label: string; isMilestone: boolean; inActiveSegment: boolean; }
export interface ChartModel {
  mode: "expeditions" | "quests" | "empty";
  points: ChartPoint[];
  nowHead: ChartPoint | null;
  threshold: { y: number; level: number } | null;        // null at max level
  projection: { from: ChartPoint; to: { x: number; y: number }; expeditions: number; level: number } | null;
  xAxisLabel: "Expeditions" | "Quests";
}

export function buildChartModel(input: {
  fold: ExpFold | null;
  history: ExpHistoryEntry[];
  profile: AdventurerProfile;
  activeLeaf: string | null;       // active quest leaf, passed explicitly (U1)
  plannedCount: number;            // anchors projection length
}): ChartModel;
```

Rules:
- **Series:** `fold` present & non-empty → `mode:"expeditions"`, X = event index,
  Y = cumExp. Else `history` non-empty → `mode:"quests"` (legacy, by `totalExpAfter`).
  Else `mode:"empty"`.
- **Reconciliation (G5):** authoritative now-head Y = `profile.totalExp`. If
  `fold.totalExp > 0` (guard against seed=0/no-events div-by-zero, C4) AND
  `|fold.totalExp - profile.totalExp|` exceeds a small tolerance, scale the WHOLE
  series uniformly by `profile.totalExp / fold.totalExp` (preserve shape, don't bend
  the tail). Final point then equals the now-head. If `fold.totalExp <= 0`, use the
  raw series unscaled.
- **Active segment (U1):** `inActiveSegment = (event.quest === activeLeaf)`. Leaf is
  passed in from state — never inferred from "last event" (a prior quest's
  completion can be the last event). Legacy mode: no segment.
- **Milestones:** `isMilestone = (type === "quest-complete")`. Legacy mode: every
  point is a completion.
- **Threshold (U2):** `level = levelProgress(profile.totalExp).next?.level`. Y-scale
  domain max = `max(dataMax, nextThreshold) * 1.05` so the band stays on-canvas even
  when far above current EXP. Null at max level.
- **Projection (G4):** slope = mean `expDelta` over the last K events with
  `type === "expedition"` AND `quest === activeLeaf` (K = min(5, count)),
  EXCLUDING quest-complete lumps. Expeditions-to-next = `ceil(expToNext / slope)`;
  draw-length anchored to `max(plannedCount, that)`, capped to canvas. Omit when:
  max level, slope <= 0, fewer than 2 qualifying expedition events, or the active
  quest has zero expeditions yet (just embarked — no cadence to extrapolate).

### A6. Chart serializer — `src/webview/buildExpChart.ts`

Thin renderer over `ChartModel`. New signature:
```ts
export function buildExpChart(model: ChartModel): string;
```

- Inline SVG only, strict CSP (no JS, no external lib, keep `viewBox`, no `style=""`
  — recorded danger: nonce CSP blocks inline style attributes).
- `mode:"empty"` → existing "No history yet — complete a quest" text node.
- Polyline from `points`; dim vs gold stroke split on `inActiveSegment`; ◆ markers
  where `isMilestone`; now-head dot; threshold line + `Lvl N+1` `<text>`; dashed
  projection (`stroke-dasharray` is a presentation attribute, not inline style) with
  `~{n} expeditions to Lvl {N+1}` annotation.
- **Motion gate (G6):** the now-head pulse is a CSS-only animation defined inside the
  nonce'd `<style>` AND wrapped in `@media (prefers-reduced-motion: reduce)` to
  disable it — locked decision: all webview motion is CSS-only and reduced-motion
  gated.

Update call site `buildCharacterSheetV2.ts:120`: compute the model via
`buildChartModel(...)` and pass it. X-axis caption (line 121) comes from
`model.xAxisLabel`. Derive the call args at the site:
`activeLeaf = state.activeQuest ? leafName(state.activeQuest.questFolderPath) : null`
(reuse `leafName` from stateManager — or lift it to a shared util to keep the surface
dumb); `plannedCount = state.plannedExpeditions.filter(p => p.status === "planned").length`.

### A7. Panel rewrite — `src/webview/buildCharacterSheetV2.ts`

Replace `renderQuest` (lines 195–205) with an expedition tracker. Keep the phase
banner (`renderStatus`) and side-quests as-is.

```
┌ On expedition · my-quest ──────────────────────────┐
│ Realm: dashboard          4 done · 1 active · 2 plan│
├────────────────────────────────────────────────────┤
│ ● active   activity-driven phase bump              │
│ ✓ done     2026-06-07   +20 XP   2 dangers · 1 oath │
│ ✓ done     2026-06-05   +5 XP                       │
│ ○ planned  wire projection into chart               │
└────────────────────────────────────────────────────┘
```

Row sourcing + status merge (precedence):
- **done** rows: `fold.events` filtered to `type === "expedition"` AND `quest ===`
  active leaf — gives date, EXP, dangers/oaths.
- **active** row: when `phase === Embarked`. Label from the matching `[>]` planned
  item if present, else "current expedition".
- **planned** rows: `plannedExpeditions` with status `planned` (and `active` →
  reconciled against phase). De-dupe a planned label that also appears as the active
  row.
- Header counts: `{done} done · {active? 1 : 0} active · {planned} plan`.
- Empty/no active quest → keep the existing "No active quest" empty plate.
- **Side-quests** have one NOTE.md and no STRATEGY_SCROLL (locked: capture-only,
  one scroll). So `plannedExpeditions` is empty for a side-quest-only state — render
  planned rows only for full quests; no planned section otherwise.
- **Legacy (events.log absent) — scope trim (round-1):** do NOT build a journal-
  heading-derived done-rows path yet. SUPPORTED_VERSION (2026.06.0007) already ships
  events.log, so an events.log-absent-but-profile-present install is unconfirmed.
  In that case show active + planned only (done section omitted) and revisit if a
  real legacy install surfaces. Keeps parser surface minimal.

New CSS classes appended to the Tailwind source (`src/webview/tailwind.css`) then
regenerated to `styles.generated.ts` via the project's build (confirm the generate
command; do not hand-edit `styles.generated.ts`). Classes: `.v2-exped-list`,
`.v2-exped-row`, `.v2-exped-status-{done,active,planned}`, chart classes
`.chart-now`, `.chart-threshold`, `.chart-proj`, `.chart-marker`, `.chart-seg-active`,
`.chart-seg-dim`.

### A8. Tests — `tests/`

Match existing node:test style. One behaviour per test, AAA, real parsers (no mocks).
- `eventsLogParser`: seed baseline; expedition EXP (0/1/2 of dangers&oaths);
  quest-complete EXP; torn line skipped; unknown type skipped; empty/null → empty
  fold; cumExp monotonic; reconciliation total.
- `expFormula`: each reward formula at representative inputs (table-driven values
  cross-checked against SKILL.md).
- `plannedExpeditionsParser`: each marker → status; block absent → `ok []`; stops at
  next `##`; ignores stray lines; returns `Result` shape.
- `chartData` (pure, the bulk of chart logic): fold present → expeditions mode with
  markers + active-segment flags keyed off `activeLeaf`; fold absent + history → quests
  mode; both empty → empty mode; max level → null threshold + null projection;
  projection slope excludes quest-complete lumps; just-embarked (0 expeditions) →
  null projection; **drift fixture → series scaled so final point == profile.totalExp**
  (R3 — catches formula drift without CI).
- `buildExpChart`: given a ChartModel, emits expected SVG nodes (polyline, markers,
  now-head, threshold text, dashed projection); empty mode → empty-state text. No
  `style=""` attribute appears in output (CSP guard).
- `buildCharacterSheetV2`: tracker rows by status; counts header; legacy (no fold)
  → active + planned only, done section omitted (matches A7 trim); no active quest →
  empty plate.

## Workstream B — quest-system convention (decoupled, versioned)

Independent of A. The panel/chart degrade gracefully until this ships, so A can land
first.

### B1. Commands

- `/counsel-quest` (PRE mode): when locking the plan, seed a `## Planned Expeditions`
  checklist into `STRATEGY_SCROLL.md` from the battle-plan phases (`- [ ]` each).
- `/embark`: flip the next `[ ]` whose focus matches `{expedition-focus}` to `[>]`
  (or append a new `[>]` item if none matches). NOTE — this CHANGES embark's I/O
  contract: today embark writes no scroll (recorded danger keys off that). The write
  MUST target the STRATEGY_SCROLL body via the normal scroll-edit path, and MUST NOT
  touch events.log or lifecycle.log — a non-XP append to events.log suppresses the
  seed guard and WIPES a migrated profile (recorded Concurrency danger). Single-
  writer-per-quest already covers the scroll write.
- `/make-camp`: flip the active `[>]` to `[x]`; append a new `[ ]` from "The Road
  Ahead" if present. Scroll-body write only (never events.log/lifecycle.log). When
  make-camp SPLITS the strategy scroll, the split logic must keep the
  `## Planned Expeditions` block in the surviving top-level index (stable-home
  decision), not push it into a `strategy/` subfile.

### B2. Docs + version

- Document the `## Planned Expeditions` convention in `skills/quest-system/SKILL.md`.
- Bump `skills/quest-system/VERSION` (calver `YYYY.MM.NNNN`) and the `SKILL.md`
  frontmatter semver.
- Bump `quest-dashboard` `SUPPORTED_VERSION` (`types.ts:4`) only if the dashboard
  needs to gate on the new convention — it does NOT (it degrades), so leave the
  schema gate unless the data format of an existing file changes. Decision: **do not**
  bump `SUPPORTED_VERSION`; planned-expeditions is additive and optional.

### B3. Sync

Run `bash scripts/sync-plugins.sh` after editing any `skills/**` source; commit the
regenerated `plugins/**`. (Per project CLAUDE.md: stale plugin copies are the #1
drift bug.)

## Build sequence

1. A2 `expFormula.ts` + tests.
2. A1 `eventsLogParser.ts` + tests.
3. A3 `plannedExpeditionsParser.ts` (`Result<T>`) + tests.
4. A4 + A5 types + stateManager wiring (explicit STRATEGY_SCROLL read).
5. A5.5 `chartData.ts` + tests (the chart logic; reconciliation/drift fixture here).
6. A6 `buildExpChart.ts` serializer + tests.
7. A7 panel rewrite + CSS regen + tests.
8. Manual verify in Extension Development Host: real `events.log`, legacy (no
   events.log), max-level, no-active-quest, side-quest-only.
9. Workstream B (B1→B2→B3), then re-verify panel shows planned rows end-to-end.

Steps 1–8 ship the dashboard independently (realm `app`). Step 9 (realm
`quest-system`) lights up planned rows. Two realms → track as two expeditions so
make-camp scoping stays clean (R2).

## Rollback

- **Workstream A** is pure read-only code (locked observer oath). Rollback = `git
  revert`; no on-disk state to undo, the dashboard never wrote anything.
- **Workstream B** edits scroll bodies (STRATEGY_SCROLL) — all git-tracked, revertible
  per commit. No events.log/lifecycle.log mutation, so no XP-fold state to repair.

## Edge cases / open risks

- **Reconciliation drift** (A2/A5.5 mitigation) — primary correctness risk. Covered by
  the chartData drift fixture test (R3): a fold whose total diverges from
  profile.totalExp must still render with the final point pinned to profile, and the
  test fails loudly if the formula constants drift from SKILL.md.
- **events.log spans multiple quests** — `quest-complete` of a prior quest sits mid-
  series; active-quest segment must key off the active leaf, not "last N events".
- **Quest renamed / leaf collision** — quest matching is by leaf name; two quests
  with the same leaf would merge in the panel. Acceptable (same limitation as
  lifecycle phase detection today).
- **Empty events.log but profile present** — treat as legacy fallback (fold null/empty
  → history path).
- **Projection beyond canvas** — cap length; never draw off-viewBox.
- **CSP** — no inline JS; pulsing now-dot via CSS animation only, defined in the
  nonce'd `<style>` and gated behind `@media (prefers-reduced-motion: reduce)` (G6).
  Confirm `style-src 'nonce-...'` already covers `<style>` (it does; line 444).
- **styles.generated.ts** is generated — confirm the regen command before adding CSS;
  do not hand-edit.

## Out of scope

- Clicking an expedition row to open the journal entry (nice-to-have, later).
- Per-expedition tooltips beyond name/EXP.
- Re-flowing the legacy per-quest chart's visuals; only overlays are added there.
