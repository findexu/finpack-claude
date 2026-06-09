# Expedition 1 — Parser layer

Quest: dashboard-exp-progression-expedition-panel | Realm: app
Focus: `expFormula.ts` + `eventsLogParser.ts` + `plannedExpeditionsParser.ts` (+ tests + types).
Battle-plan steps 1-3 (and the type additions from step 4). Pure code only — no
stateManager wiring, no surfaces. Source of truth: `quest-dashboard/plan.md`.

## Conventions (recon, locked)

- Tests: `node:test` + `node:assert/strict`. Fixtures are template-string constants.
  `unwrap<T>(Result<T>)` from `tests/_util.ts`. Parser tests live in `tests/parsers/`.
- Run: `npm test` → `pretest` compiles `tsconfig.test.json` to `out-tests/`, then
  `node --test "out-tests/tests/**/*.test.js"`. (Note: `pretest` also runs
  `build:css`; harmless here.)
- Parser contract (locked oath): pure `parse(content: string | null): Result<T>`,
  no I/O, no fs. Mirrors `historyParser`/`profileParser`.
- `Result<T>` = `{ ok: true; value: T } | { ok: false; error: string }` (types.ts:6).
- Types live in `src/types.ts`; const-object unions over enums (erasable).

## Step 0: Recon (read-only, no writes)

Read for exact style before writing:
- `src/parsers/historyParser.ts` (fold/flush pattern, regex style, Result return).
- `src/parsers/lifecycleLogParser.ts` (pipe-split parsing — closest analog to events.log).
- `tests/parsers/historyParser.test.ts` (already seen) + `tests/_util.ts`.
- `src/types.ts` head (Result, existing interfaces) — confirm insertion points.

## Step 1: `src/expFormula.ts` (new, pure)

Single home for EXP reward numbers. Header comment: "Mirrors quest-system
`skills/quest-system/SKILL.md` `## XP system` — keep in sync; drift is caught by the
chartData reconciliation test."

```ts
export const EXP = {
  expeditionBase: 5,
  expeditionDanger: 10,   // applied once if dangers > 0
  expeditionOath: 10,     // applied once if oaths > 0
  questBase: 100,
  questPerModule: 25,
  questPerExpedition: 10,
  questPerDanger: 15,
  questPerOath: 20,
  questPerSplit: 50,
  questCleanBonus: 75,
  questSpeedBonus: 50,
} as const;

export function expeditionExp(input: { dangers: number; oaths: number }): number;
export function questCompleteExp(input: {
  modules: number; expeditions: number; dangers: number; oaths: number;
  splits: number; clean: boolean; speed: boolean;
}): number;
```

- `expeditionExp` = base + (dangers > 0 ? danger : 0) + (oaths > 0 ? oath : 0).
  NOTE the threshold semantics: the +10s are flat flags on >0, NOT per-count
  (matches SKILL.md "New danger discovered this expedition: +10").
- `questCompleteExp` = base + per-count terms + bonuses. Bonuses are flat.
- No clamping, no I/O. Negative/NaN inputs are caller's problem (parser guards them).

## Step 2: `tests/expFormula.test.ts` (new)

Place at `tests/` root, mirroring `tests/levelMath.test.ts` (expFormula is a `src/`
root pure helper, not a parser). Import `../src/expFormula`.
Table-driven, one behavior per test, AAA:
- expeditionExp: {0,0}→5; {2,0}→15; {0,1}→15; {3,4}→25. (Confirms flat-flag, not per-count.)
- questCompleteExp: zero-everything→100; the STRATEGY_SCROLL example
  `modules=3;expeditions=4;dangers=5;oaths=2;splits=1;clean=1;speed=0`
  → 100+75+40+75+40+50+75 = 455 (compute and pin exact in test).
- clean+speed both on adds 125; both off adds 0.

## Step 3: `src/parsers/eventsLogParser.ts` (new, pure)

Discriminated union on `type` (honors "type safety first" oath — no ambiguous
optionals; `dangers`/`oaths` never mean two different things on one struct):

```ts
interface ExpEventBase { date: string; quest: string; expDelta: number; cumExp: number; }
export type ExpEvent =
  | (ExpEventBase & { type: "expedition"; dangers: number; oaths: number; split: boolean })
  | (ExpEventBase & { type: "quest-complete"; modules: number; expeditions: number;
        dangers: number; oaths: number; splits: number; clean: boolean; speed: boolean });
export interface ExpFold {
  seedExp: number;               // from the FIRST seed line's total-exp (0 if none)
  events: ExpEvent[];            // chronological; seed excluded
  totalExp: number;              // seedExp + sum(expDelta) == last event cumExp
}
export function parseEventsLog(content: string | null): Result<ExpFold>;
```
`date` = raw seg[0], not validated beyond non-empty (downstream only displays it; the
chart X-axis uses event index). Interfaces live in `types.ts` (see Step 7); the parser
imports them.

Parsing rules:
- `content` null/empty/whitespace → `ok { seedExp: 0, events: [], totalExp: 0 }`.
- Per line: trim; skip blank. Split on `|`. Every valid line has exactly 4
  pipe-fields (`date|type|quest|payload`); the payload itself contains no `|`. < 4
  fields → skip (torn line).
- **Seed (single rule, G1):** seedExp = the payload `total-exp=N` of the FIRST
  parseable line IFF its type is `seed`; otherwise seedExp = 0. Any `seed` line that
  is not the first parseable line is SKIPPED (never resets the baseline). Seed is
  never pushed to `events`. The running cum is initialized to seedExp.
- `seg[1]` (type) for non-seed lines:
  - `expedition` → parse `dangers=N;oaths=N;split=0|1`; expDelta via `expeditionExp`;
    `split = (value === "1")`.
  - `quest-complete` → parse `modules;expeditions;dangers;oaths;splits;clean;speed`;
    expDelta via `questCompleteExp`; `clean`/`speed` = `(value === "1")`.
  - anything else (incl. unknown future types) → skip.
- Payload parse helper: split on `;`, each on `=`, build a map. Missing key → 0/false.
  A key PRESENT but non-numeric (`Number(v)` is NaN) → treat the LINE as torn → skip
  (do not push a partial). Note `Number("")` is 0, so `dangers=` parses to 0 (not
  torn) — acceptable.
- Accumulate `cumExp` across pushed events; `totalExp = seedExp + sum(expDelta)` and
  equals the last event's `cumExp`.
- Never throw. Always returns `ok`. (Result shape kept for parser uniformity.)

## Step 4: `tests/parsers/eventsLogParser.test.ts` (new)

- null → empty fold (seedExp 0, [] , total 0).
- empty string / whitespace → empty fold.
- seed only → seedExp = N, events [], totalExp = N.
- single expedition, no seed → cumExp = expDelta, totalExp = expDelta.
- expedition dangers/oaths matrix (0/0, >0/0, 0/>0, >0/>0) → expDelta 5/15/15/25.
- quest-complete → expDelta matches questCompleteExp; fields parsed onto the event.
- seed + expeditions + quest-complete → cumExp monotonic increasing; final cumExp
  == totalExp == seedExp + sum.
- torn line (e.g. `2026-06-05|expedition|q|dangers=x;...` non-numeric, or a 2-field
  line) → skipped, surrounding events still folded.
- unknown type (`2026-06-05|side-quest|q|...`) → skipped.
- a `seed` line that is NOT first (events precede it) → ignored; seedExp stays 0.
- a first-line seed sets the baseline; a second seed later → ignored.
- multi-quest log → each event keeps its own `quest`; cum spans all.
- discriminated union: a `quest-complete` event exposes `modules`/`splits`/`clean`,
  an `expedition` event exposes `split` — assert via `type` narrowing.

## Step 5: `src/parsers/plannedExpeditionsParser.ts` (new, pure)

```ts
export type PlannedStatus = "done" | "active" | "planned";
export interface PlannedExpedition { label: string; status: PlannedStatus; order: number; }
export function parsePlannedExpeditions(strategyText: string | null): Result<PlannedExpedition[]>;
```

- null/empty → `ok []`.
- Scan for a heading line matching `^##\s+Planned Expeditions\s*$` (case-insensitive,
  trim). Not found → `ok []`.
- Collect subsequent lines until the next heading of ANY level (`^#{1,6}\s`) or EOF
  (defensive — a stray sub-heading inside the block stops scanning rather than
  bleeding into the next section).
- Each line matching `^\s*-\s*\[(.)\]\s*(.+?)\s*$`:
  - marker `x`/`X` → done; `>` → active; ` ` (space) → planned; anything else → planned.
  - label = trimmed capture; skip if label empty.
  - `order` = 0-based index among matched items.
- Non-list lines inside the block → ignored.
- Returns `ok` always.

## Step 6: `tests/parsers/plannedExpeditionsParser.test.ts` (new)

- null → ok [].
- block absent (strategy text without the heading) → ok [].
- the three markers → done/active/planned with correct order indices.
- unknown marker `[~]` → planned.
- stray prose / blank lines inside block → ignored, list still parsed.
- a `## Next Heading` after the block → parsing stops (item under it excluded).
- case-insensitive heading match (`## planned expeditions`).
- Result shape (ok true) on every case.

## Step 7: Types — `src/types.ts`

Define `ExpEvent` (discriminated union), `ExpFold`, `PlannedExpedition`,
`PlannedStatus` in `types.ts`; the parser modules import them. This follows the
existing pattern — data shapes live in `types.ts` (`ExpHistoryEntry`, `ScrollMeta`),
parsers import them ("shared type truth" header comment).

Add ONLY the interfaces this expedition. Do NOT add the `expFold` /
`plannedExpeditions` fields to `QuestState` yet — that wiring is expedition 2 (adding
fields now would force every `QuestState` literal to populate them, breaking the
build before the state manager is ready). Unused exported interfaces compile cleanly
(no consumer required).

## Step 8: Verify

- `npm test` → all green (new + existing untouched).
- `npx tsc -p tsconfig.json --noEmit` (or `npm run compile`) → no type errors in
  the production build (CSS regen side-effect is harmless).
- Confirm no `src` file imports fs/vscode in the new parsers (purity).

## Dangers to watch (from TOME_OF_DANGERS)

- Formula drift → every number lives in `expFormula.ts`; tests pin exact values.
- `split` (expedition bool) vs `splits` (quest-complete count) — distinct fields.
- Torn-line robustness → never throw; skip the bad line, keep folding.
- Parser purity oath → no fs/vscode imports; `parse(content): Result<T>` only.

## Out of scope (this expedition)

- `QuestState` field additions + stateManager reads (expedition 2).
- `chartData.ts`, chart serializer, panel, CSS (expeditions 2-3).
- Reconciliation/scaling logic (chartData, expedition 2) — parser only emits
  `totalExp` for that later consumer.
- `tests/webview/` builder tests — untouched; they arrive with the serializer in
  expedition 3.

## Rollback

All-new files (`expFormula.ts`, two parsers, three test files) plus additive,
type-only edits to `types.ts`. Rollback = delete the new files and revert the
`types.ts` interface additions. Nothing else imports them yet, so no downstream
breakage; the dashboard build is unaffected either way (read-only observer).

## Open riddles blocking today

None.
