# finpack-claude Update Plan — dashboard retirement, XP decision, transparency, quality, packaging

Status: APPROVED 2026-08-12 with modifications — user decisions:
- **Option B approved**, MINUS the statusline: no `quest-statusline.sh`, no `statusLine` wiring anywhere
  (ambiguous under parallel tasks; a graph-based tracking system is planned later). KEEP `lifecycle.log` +
  `active-quest.txt` + `hooks/quest-lifecycle-bump.sh` — the phase record is the seed data for that future
  graph system and stays readable by Cowork as a plain file. Live-activity transparency = built-ins only
  (Ctrl+T, `/tasks`, `/workflows`) + the TodoWrite wiring.
- docs/ site: replace with a plain one-page install/usage doc (keep the github.io link working).
- fp-* plugins: consolidate into one `fp-agents` plugin.
- Dashboard consumers: user only — no deprecation release; delete release workflow with the dashboard.
Every §3/§4/§5 statusline item below is superseded by the first decision; skip those steps. Baseline: Claude Code v2.1.228 conventions
(plugin.json `dependencies`/`defaultEnabled`/`userConfig`/`experimental.monitors`, skill `context: fork`,
30 hook events, `/doctor`). `/tasks`, `/workflows`, Ctrl+T, and the `settings.json` `statusLine` key are
NOT covered by that baseline — confirm exact shapes at execution (same rule as §2 Cowork, §6 dependencies).

## 1. Context & goals

- quest-dashboard (VSCode extension, 2.4 MB) is unsupported; retiring it is on the table.
- XP system may be removed entirely IF its real value is replaced. The bottleneck it solved and that must
  stay solved is TRANSPARENCY: (a) ToDo list, (b) what Claude is doing now, (c) background processes.
- Also in scope: repo code quality and plugin packaging/consumption ergonomics (15 plugins).
- Constraint: every phase leaves `hooks/tests/run-all.sh` green (42 tests today) and `plugins/` mirrors in
  sync via `scripts/sync-plugins.sh`. User uses setup-finpack and quest-system daily — no workflow breakage.

## 2. Decision: quest-dashboard & XP system

What the XP system uniquely provided, split honestly:
- **Transparency** (replaceable): `events.log`/`lifecycle.log` phase record, agent traces, per-quest history.
  Native surfaces (Ctrl+T, `/tasks`, `/workflows`, statusline, Notification/TaskCreated hooks) now cover the
  live half; a slim lifecycle log covers the persistent cross-session half.
- **Motivation/gamification** (NOT replaceable): EXP formula, levels, badges, the animated docs site.
  No Claude Code or Cowork feature substitutes for this. If removed, it is genuinely gone.
  (Note: `/set-bounty` is NOT gamification despite the name — see Phase 2.1.)
- Cowork, verified vs assumed: VERIFIED — it reads `.ai-context/` scrolls and `.claude/quest-xp/lifecycle.log`
  (plain files in the granted project folder). ASSUMED (as of 2026-08 — verify against current Cowork docs
  before relying): `~/.claude` readability, project `.claude/` config sync, live session sharing with Claude
  Code. Useful for file-based status pickup today; do not premise live-activity transparency on assumed items.

**Option A — full removal** (dashboard + all XP: logs, profile, commands, hooks, docs site).
  Cost: loses the persistent machine-readable phase record; statusline/Cowork lose their data source;
  largest diff across ~20 files. Benefit: maximum simplification.
**Option B — remove gamification + dashboard, keep lifecycle log (RECOMMENDED).**
  Delete EXP/levels/badges, `events.log`, `profile.md`, `agents.log`, `quest-history.md`, the fold, the
  dashboard + its release workflow, and the gamified docs site. Keep `/set-bounty` (autonomous delivery,
  not XP — Phase 2.1) and keep `lifecycle.log` + `active-quest.txt` as the tiny append-only phase record —
  repurposed as the data source for a statusline and for Cowork/mobile status checks.
  Cost: gamification lost (accepted per user); moderate diff. Benefit: transparency preserved with ~200
  lines of retained infra instead of 2.4 MB + workflow + 3 hooks + 3 test suites.
**Option C — keep as-is, archive dashboard unmaintained.** Cost: dead 2.4 MB + release workflow + XP tokens
  in 7 command files + SKILL.md paid every session; the "unsupported" problem is not solved. Benefit: zero risk.

**Recommendation: Option B.** A is acceptable if the user also wants the statusline to show only the quest
name (from scroll frontmatter) with no phase history.

## 3. Transparency architecture (after Option B)

| Need | What | Where it surfaces | Effort |
|---|---|---|---|
| (a) ToDo — live | Mandate TodoWrite in quest commands: `/embark` seeds todos from the scroll's `## Planned Expeditions`; `/make-camp` & `/complete-quest` reconcile back to `- [x]`/`- [>]` markers. Edit `skills/quest-system/commands/{embark,make-camp,complete-quest}.md` (one short step each). | Ctrl+T checklist in terminal; VSCode Focus view keeps latest todo list visible | S |
| (a) ToDo — persistent | `## Planned Expeditions` in quest scrolls stays the cross-session source of truth (already spec'd in SKILL.md). No change. | `.ai-context/quests/*/`; readable by Cowork (plain files) | none |
| (b) Current activity | New `hooks/quest-statusline.sh` (home is hooks/, NOT scripts/ — both install loops resolve HOOKS entries only against hooks/: local `LOCAL_HOOKS` line 18 / loop lines 136-144, remote `curl "$REPO/hooks/$hook"` line 271; same home as precedent `quest-lifecycle-bump.sh`): reads `.claude/active-quest.txt` + last `lifecycle.log` line, prints `quest • phase • last-event-age`. Consumer delivery (the transparency lives in weScanApp etc., not this repo): add `quest-statusline.sh` to `scripts/install-quest-system.sh`'s HOOKS array (line 86) so the existing mechanism lands it at `.claude/hooks/quest-statusline.sh` in both modes; install/update-quest-system and setup-finpack Phase Init OFFER (never overwrite an existing key) to set consumer `settings.json` `statusLine` to `{"type": "command", "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/quest-statusline.sh"}`; doctor mode checks it (Phase 2.3). | Terminal statusline, every session, zero tokens | M |
| (b) Current activity | Built-ins, doc-only: `/context`, Ctrl+T, `/workflows` live drill-down for council/ultracode runs. Add a "Transparency" section to `skills/quest-system/SKILL.md` (~15 lines) replacing the XP section. | Terminal | S |
| (c) Background | Built-ins, doc-only: `/tasks` (shells + subagents), `/workflows` (phases, agents, tokens, pause/stop). Same SKILL.md section. | Terminal | S |
| (c) Background | Extend `settings.json` Notification hook (already calls osascript) with `TaskCreated`/`TaskCompleted` → `hooks/notify.sh` for agent-completion pings. | macOS notifications | S |
| (c) Background | `hooks/quest-lifecycle-bump.sh` (kept): deterministic phase bump on first real edit — feeds statusline even when a step is skipped. | lifecycle.log → statusline | none |
| Optional | Extend `scripts/sync-plugins.sh` to emit `experimental.monitors` for quest-system (edit the sync, not `plugins/` — file payloads are overwritten on sync, and after Phase 1.6 ALL manifests are sync-generated; today only agent-plugin manifests are): background monitor tailing lifecycle.log. EXPERIMENTAL — defer until statusline proves insufficient. | Claude Code monitor UI | M, deferred |
| Cowork/mobile | Doc-only note in SKILL.md: scrolls + lifecycle.log are plain files → Cowork can read status; skills must be added via Customize sidebar. On session sharing, §2 lists "no live session sharing" as ASSUMED — write the doc line as "as of 2026-08, no live session sharing" only after verifying against current Cowork docs at execution. | Cowork, web/mobile status checks | S |

## 4. Phased workstreams (each phase = one commit/PR, tests green at exit)

**Phase 0 — safety net (no behavior change).**
1. Commit the current uncommitted refresh (v1.32.0 slimming + hook fixes) first; it is prerequisite work.
2. Tag `pre-xp-removal` on master.

**Phase 1 — transparency replacement (additive only).**
1. Add `hooks/quest-statusline.sh` (+ fixture test `hooks/tests/quest-statusline-test.sh`, register in
   `hooks/tests/run-all.sh`).
2. Edit `skills/quest-system/commands/{embark,make-camp,complete-quest}.md`: TodoWrite seed/reconcile steps.
3. Edit `settings.json`: add `TaskCreated`/`TaskCompleted` hooks → `hooks/notify.sh`. That file ALREADY EXISTS (verified 2026-08-12: cross-platform wrapper reading hook JSON on stdin — osascript/notify-send/powershell) — no creation step; §5 item (2) later repoints the legacy inline Notification chain in `settings.json` to this same script.
4. Add SKILL.md "Transparency" section; add statusline install step to `skills/setup-finpack/SKILL.md`.
5. Make `scripts/sync-plugins.sh` deletion-safe: `rm -rf "plugins/$name/skills/$name"` before the skills copy
   loop (~line 49) and `rm -rf plugins/quest-system/agents` before the 2.5 bundle, mirroring what it already
   does for `plugins/setup-finpack/template` (line 83). Today it only `cp`s, so files deleted from `skills/`
   linger in the committed mirror and `quest-system-smoke.sh` check 1's bidirectional `diff -r` fails — the
   trap would fire at Phase 2.1's deletions and again at §6's consolidation.
6. Close the skill-manifest gap in `scripts/sync-plugins.sh`: the skills loop (lines 46-65) copies
   SKILL.md/commands/VERSION but never writes manifests — the 6 skill plugins' `.claude-plugin/plugin.json`
   are hand-maintained and have ALREADY drifted (`plugins/quest-system` says 0.1.0 vs SKILL.md frontmatter
   1.32.0; marketplace.json entries carry no version, so plugin.json is the sole `claude plugin update`
   signal, and `hooks/tests/marketplace-parity.sh` lines 27-28 only assert a version EXISTS). Stamp each
   skill plugin's plugin.json from its SKILL.md frontmatter (name/version/description; default 0.1.0 when
   no `version:`), mirroring the agent path (lines 26-40). Repairs the live drift; makes Phase 2.6 real.
7. Run `scripts/sync-plugins.sh`; run tests (now 43+).

**Phase 2 — XP removal from quest-system sources (gated on §7 approval).**
1. Delete `skills/quest-system/commands/{quest-xp.md,init-xp.md}` — 2 commands, NOT `set-bounty.md`.
   `/set-bounty` is the autonomous-delivery orchestrator (post a goal, a party explores/plans/builds/
   reviews), actively invested in (commits 69f6ab6, 479cf81); `counsel-prompt.md` routes to it in 4 places
   (lines 71, 88, 90, 92) and SKILL.md v1.32.0 lists it as a trigger. KEEP it; only strip its single XP
   mention (line ~99: `/complete-quest` "distill + archive + XP" → "distill + archive"). Mirrors are
   generated but COMMITTED: in the same commit, `git rm` the two copies under
   `plugins/quest-system/skills/quest-system/commands/{quest-xp.md,init-xp.md}` (the Phase 1.5
   deletion-safe sync drops them on re-run; `git add -A plugins/` stages the removal).
2. Delete `scripts/quest-xp-fold.sh`; strip XP steps ("Step 9 XP block", `events.log` appends, EXP/level/
   badge text, profile refresh) from `skills/quest-system/SKILL.md` ("XP derivation (the fold)" section)
   and the 7 command files that reference them (verified grep: complete-quest, counsel-quest, embark,
   make-camp, new-quest, quest-help, summon-witch-doctor — 9 XP-touching commands total counting the 2
   deleted in 2.1). In quest-help.md, strip the stale `/quest-xp` row (line 39) and `/init-xp` row
   (line 53). Keep every `lifecycle.log` printf line byte-identical; delete every `events.log` printf line.
3. Delete `hooks/quest-agent-trace.sh` (dashboard-only feeder, writes `.claude/quest-xp/agents.log`) +
   `hooks/tests/quest-agent-trace-test.sh`; deregister from `settings.json`. KEEP
   `hooks/quest-lifecycle-bump.sh` + its test (statusline feeder); reword its "dashboard" header comments.
   Also edit `skills/setup-finpack/SKILL.md` doctor mode (line 45, "Quest-system state"): it checks that
   `quest-agent-trace.sh` is wired in consumer settings.json — drop that check (keep quest-lifecycle-bump.sh,
   add quest-statusline.sh) or the user's daily doctor flags every healthy install as broken after this phase.
4. Delete `hooks/tests/quest-xp-fold-test.sh`; update `hooks/tests/run-all.sh` roster. The
   `quest-system-smoke.sh` parity check is one-directional (file → registry), so also manually remove
   stale rows for the 2 commands from the four registries it actually checks (its header + lines 33-45):
   REMOTE_COMMANDS in `scripts/install-quest-system.sh`, the `skills/install-quest-system/SKILL.md` list,
   required_commands in `hooks/quest-system-verify.sh`, and the SKILL.md commands table. In
   install-quest-system SKILL.md remove ALL `/quest-xp`/`/init-xp` mentions — frontmatter description
   (lines 6-7, context-resident every session as the skill's trigger text) and help-table rows (lines
   141/143), not just the file list at lines 71/74; the smoke's registry grep (quest-system-smoke.sh
   line 42) matches only filenames, so those extra mentions are otherwise unchecked. (The update skill
   is "intentionally excluded" as a registry per the smoke header; quest-help.md is not parity-checked —
   its stale rows are 2.2's job.) Also drop `quest-xp.md|init-xp.md` from the smoke's spec-lint exemption
   case list (line 54). In the SAME commit as the source deletions, append `quest-xp.md` and `init-xp.md`
   to RETIRED_COMMANDS in `scripts/install-quest-system.sh` (line 64) per its header convention ("Add a
   name here whenever a command file is removed") — `/update-quest-system` re-runs this script, so the next
   update auto-prunes both stale commands from every EXISTING consumer's `.claude/commands/`. Nothing else
   catches this: the smoke's parity check is file→registry only (RETIRED_COMMANDS never checked) and Phase
   3's grep matches neither filename — skip it and consumers keep both dead commands indefinitely.
5. Update `scripts/install-quest-system.sh` and `hooks/quest-system-verify.sh` (both reference XP files):
   remove `quest-agent-trace.sh` from the HOOKS copy list (line 90) and delete BOTH TRACE_CMD
   PostToolUse(Agent|Task) registration blocks — local-install path (~lines 230-247) AND remote/curl-install
   path (~lines 365-380); deleting only the first leaves fresh remote installs registering a hook whose
   file is no longer copied (every Agent call → nonexistent script). Reword surviving dashboard comments
   (~lines 207/227/342/362). Fixes FUTURE installs in both modes; existing consumers: stale commands are
   pruned via 2.4's RETIRED_COMMANDS entries, data files + hook are Phase 2.7's job.
6. Bump quest-system to 2.0.0 (breaking: commands removed): edit `skills/quest-system/SKILL.md`
   frontmatter `version:` (+ `skills/quest-system/VERSION` for the update-skill curl check), then run
   `scripts/sync-plugins.sh` — the Phase 1.6 extension stamps it into
   `plugins/quest-system/.claude-plugin/plugin.json`, the sole signal `claude plugin update` reads
   (without 1.6 this step silently no-ops on the manifest and tests stay green). Tests green.
7. Migration note in SKILL.md changelog: `.claude/quest-xp/` is NOT inert under Option B —
   `hooks/quest-lifecycle-bump.sh` line 31 hardcodes `.claude/quest-xp/lifecycle.log`, which the statusline
   reads, so the dir and that file stay live. `/update-quest-system` offers cleanup scoped to the dead files
   ONLY (`events.log`, `profile.md`, `agents.log`, `quest-history.md` — a pure EXP log; its writers all die
   in 2.2: complete-quest.md:195, new-quest.md:127, init-xp.md:51, SKILL.md:423/:598) — never the dir,
   never lifecycle.log, never auto-deleted.
   Existing consumer repos also still carry the LIVE writer: `.claude/hooks/quest-agent-trace.sh`,
   registered on PostToolUse(Agent|Task) (shipped by install-quest-system.sh lines ~88/~230), recreates
   `agents.log` on the next agent call, undoing the cleanup. So the same opt-in cleanup ALSO offers to
   delete `.claude/hooks/quest-agent-trace.sh` and strip its registration from consumer
   `.claude/settings.json` (same never-auto rule) — and offers the statusline wiring from §3.
   `skills/update-quest-system/SKILL.md` handles no hooks today; add this hook-migration step to it.
8. Also strip the dashboard mentions embedded in XP-adjacent text: `skills/quest-system/SKILL.md` lines
   ~33/41/44/537/552/573/576 (incl. line 576 "which the dashboard watches directly" → statusline).

**Phase 3 — dashboard retirement (gated on §7 approval).**
Deletion inventory: `quest-dashboard/` (entire dir, 2.4 MB), `.github/workflows/quest-dashboard-release.yml`,
`docs/` gamified site (356 KB — or replace with a plain README-level page; see §8 Q3).
Reference purge (verified by grep 2026-08-12 — `README.md`, `CONTRIBUTING.md`, setup-finpack and
install/update-quest-system SKILL.md files have ZERO "dashboard" references; the real set, if not already
handled by Phase 2.3/2.5/2.8, is): `skills/quest-system/commands/{counsel-quest.md:227,complete-quest.md:196,
make-camp.md:151+221}` — plus `README.md:66`, which advertises the docs site ("Try it first in the browser:
https://findexu.github.io/finpack-claude/") without the word "dashboard": update or remove it per the §8 Q3
answer. Re-run `grep -rniE 'dashboard|github\.io/finpack|quest-agent-trace|agents\.log|quest-xp|init-xp|events\.log|profile\.md' README.md
CONTRIBUTING.md skills/ hooks/ scripts/ .github/` at execution time (excluding Obsidian/frontend false
positives, Phase 2.7's deliberate migration-note mentions, the live `.claude/quest-xp/lifecycle.log` path
in the kept lifecycle-bump/statusline hooks, and 2.4's RETIRED_COMMANDS rows) and purge whatever remains.
If docs/ is deleted, also disable or repoint the GitHub Pages setting — it is repo config, not a workflow,
so deleting the files alone leaves the published site serving stale gamified content (or 404s).
`.github/workflows/hook-tests.yml` stays. Run sync + tests.

**Phase 4 — plugin packaging (§6). Phase 5 — code quality (§5).** Independent of 2-3; land anytime after Phase 0.

## 5. Code-quality improvements

- **Source/mirror duplication**: keep committed `plugins/` mirrors (marketplace installs need real files in
  the repo; sync-drift test already guards parity). Rejected alternative — gitignoring `plugins/` and
  generating in CI — breaks direct-from-git installs. Instead: add a `.github/workflows/hook-tests.yml` step
  that runs `scripts/sync-plugins.sh && git diff --exit-code plugins/` so a forgotten sync fails CI.
- **Refresh-flagged, skipped items, now scheduled**: (1) remove Cursor-style `alwaysApply` frontmatter from
  `rules/{code-quality,serena,testing}.md` (ignored by Claude Code); (2) repoint the inline Notification
  osascript chain in `settings.json` (line 131) to the existing `hooks/notify.sh` (see Phase 1.3); (3) reconcile the deliberately-preserved
  STRATEGY_SCROLL template drift between `skills/quest-system/commands/new-quest.md` and SKILL.md — pick one
  canonical copy.
- **Versioning discipline**: one rule — any change under `skills/X` or `agents/X` bumps the `version:`
  frontmatter in that source file, and sync stamps plugin.json (true for agent plugins today, for skill
  plugins only after Phase 1.6 — until then skill manifests are hand-maintained and the rule is
  unenforceable). Add `hooks/tests/version-bump-check.sh` diffing changed source paths vs frontmatter
  bumps, gated on the Phase 1.6 uniform mechanism, replacing reviewer memory.
- **Test coverage**: add `shellcheck -S error` over `hooks/*.sh scripts/*.sh` to `run-all.sh` (auto-covers
  the new statusline hook), guarded by `command -v shellcheck` — print a visible `SKIP shellcheck (not
  installed)` line when absent, so machines and the `.github/workflows/hook-tests.yml` runner fail only on
  lint findings, never on tool absence. Fixture test for `hooks/quest-statusline.sh` (Phase 1):
  missing-file + stale-log paths.
- **Hygiene**: `quest-dashboard/package-lock.json` and `docs/vendor/` disappear with Phase 3 — largest non-source blobs.

## 6. Plugin-usage improvements

Field audit (verified by grep): `keywords`, `displayName`, `dependencies`, `userConfig` are absent from
all manifests; `homepage` is NOT absent — `scripts/sync-plugins.sh` already emits it (with
repository/license/author) in all 15 `plugins/*/.claude-plugin/plugin.json`.

- **Consolidate the 9 single-agent fp-* plugins** into one `fp-agents` plugin (agents/ dir with 9 files).
  Benefit: 1 install instead of 9, one version, marketplace noise gone. Cost: @-mention names become
  `fp-agents:fp-code-reviewer` and `/plugin` toggling is all-or-nothing. Middle path if that stings: keep 9
  plugins, set `"defaultEnabled": false` on the 4 rarely-invoked ones (fp-doc-reviewer, fp-plan-reviewer,
  fp-performance-reviewer, fp-code-explorer) — they still install with the marketplace but stay out of
  context until enabled. Recommend consolidation; needs `scripts/sync-plugins.sh` rework + marketplace.json
  entry swap + `hooks/tests/marketplace-parity.sh` update. Prereqs: Phase 1.5's deletion-safe sync, AND
  note that sync never deletes whole plugin dirs — `git rm -r` the 9 `plugins/fp-*` dirs explicitly.
- **Dependencies**: `sync-plugins.sh` section 2.5 (lines 67-78) ALREADY bundles every `agents/fp-*.md`
  into `plugins/quest-system/agents/` because "plugins must be self-contained" — counsel-quest's agents
  ship inside the quest-system plugin today, and `quest-system-smoke.sh`'s SYNC GUARD asserts the bundled
  fp-plan-reviewer copy. So do NOT also declare quest-system → fp-* dependencies: the same 9 agents would
  install twice (as `quest-system:fp-*` and `fp-*:fp-*`), doubling @-mention noise. Keep the 2.5 bundle as
  the single agent-delivery mechanism (it copies from source `agents/`, so it survives the fp-agents
  consolidation unchanged). Declare dependencies only where no bundling exists:
  `plugins/{install,update}-quest-system/.claude-plugin/plugin.json` → `quest-system`. Entry shape
  (objects `[{"name": ...}]` vs strings) is unverified against the current schema — confirm with
  `claude plugin validate` before committing, same verify-at-execution rule as §2's assumed Cowork items.
- **userConfig**: quest-system gains `userConfig` keys `quests_dir` (type: directory, default
  `.ai-context/quests`) and `notify` (boolean) — substituted as `${user_config.quests_dir}` in commands and
  exported to hooks as `CLAUDE_PLUGIN_OPTION_QUESTS_DIR`; removes hardcoded paths from 6 command files.
  Both the substitution syntax and the env-var name are verify-at-execution against current plugin docs.
- **Marketplace metadata**: add `keywords` and `displayName` to all plugin.json manifests — extend BOTH
  manifest writers in `sync-plugins.sh` once: the agent path (lines 30-40) and the Phase 1.6 skill path
  (prerequisite; without it the 6 skill manifests are not sync-generated). `homepage` already emitted.
- **Install/update flow**: `skills/update-quest-system` compares against the allow-listed VERSION curl
  today; after consolidation, document the native path (`claude plugin` update from marketplace, version
  bump = update signal) and keep the skill only for template-file migration in consumer repos.

## 7. Rollback & safety

- **Approval gate**: Phases 2 and 3 start only after the user replies to §8 and explicitly approves the
  deletion inventory. Phases 0/1/4/5 are additive/refactoring and reversible by `git revert`.
- Every phase is a single commit on a branch, reviewed via `git diff` before merge; nothing force-pushed.
- Tag `pre-xp-removal` preserves dashboard + XP code forever; restoring = `git checkout pre-xp-removal -- quest-dashboard docs`.
- Consumer repos: quest-system 2.0.0 never deletes `.claude/quest-xp/` data; opt-in cleanup via
  `/update-quest-system` touches dead files only (Phase 2.7 — lifecycle.log stays live). Old plugin
  versions remain installable from git history.
- Statusline lands before XP removal (Phase 1 < Phase 2), so transparency never has a gap.

## 8. Open questions for the user

1. Do levels/badges actually motivate you day-to-day? Option B deletes them irreversibly (code
   stays in the tag, but nothing regenerates the data). If yes → keep `quest-xp.md` as a read-only novelty?
2. Approve Option B's deletion inventory (Phase 2/3: `quest-xp` + `init-xp` deleted, `/set-bounty` KEPT) —
   or full-removal Option A (also drops lifecycle.log + statusline phase history)? Removing `/set-bounty`
   would remove the autonomous-delivery workflow (not XP) and break `counsel-prompt` routing — say so explicitly.
3. `docs/` site: delete outright, or replace with a plain one-page install/usage doc?
4. Consolidate the 9 fp-* plugins into `fp-agents` (agent names become `fp-agents:fp-*`), or keep 9 with
   `defaultEnabled: false` on the rarely-used four?
5. Is anything other than your own VSCode consuming quest-dashboard releases (other machines, teammates)?
   If yes, the release workflow needs a deprecation release before deletion.
