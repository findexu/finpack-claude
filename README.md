# finpack-claude

A lean `.claude/` setup for daily development. Nine specialist agents, a stack of workflow skills, seven modular rules, and a few safety hooks. No bloat, no opinions you can't override. Agent models are tiered by reasoning need — `opus` for deep reasoning (architecture, code + security review), `sonnet` as the default, `haiku` for mechanical work (doc cross-referencing) — and every tier is overridable in the agent's frontmatter.
NOTE: This plagiarised work is hugely copied from https://github.com/poshan0126/dotclaude.git. Big clap and please go check it out for the original work.

## Get started

Two paths to the same place: a customized `.claude/` in your project. Most people should pick the marketplace path. It's faster, there's nothing to clean up afterward, and you don't have to think about where files go.

### Option 1 (recommended): install via the marketplace

Add the marketplace once on your machine, then install the all-in-one setup plugin:

```
/plugin marketplace add findexu/finpack-claude
/plugin install setup-finpack@finpack-claude
```

Open your project in Claude Code and run:

```
/setup-finpack
```

That's the whole flow. The `setup-finpack` plugin bundles the complete finpack-claude template (settings, rules, hooks, all agents and skills, `CLAUDE.md`). When you run the slash command it asks you to confirm, copies the bundled template into your project's `.claude/` and `CLAUDE.md` at the project root, then scans your codebase to detect language, framework, package manager, test runner, linter, and architecture, and tunes every config file to match. Every change is confirmed before it's applied.

After it finishes, restart Claude Code so the new agents, skills, rules, and hooks load.

If you only want one or two pieces instead of the full kit, install them individually:

```
/plugin install fp-code-reviewer@finpack-claude
/plugin install explain@finpack-claude
/plugin install quest-system@finpack-claude
```

Full plugin list (15): `fp-code-reviewer`, `fp-security-reviewer`, `fp-performance-reviewer`, `fp-doc-reviewer`, `fp-plan-reviewer`, `fp-frontend-designer`, `fp-swiftui-designer`, `fp-code-architect`, `fp-code-explorer`, `setup-finpack`, `explain`, `session-audit`, `quest-system`, `install-quest-system`, `update-quest-system`.

Curious what quest-system does before installing? The interactive tutorial runs the full quest loop in your browser: https://findexu.github.io/finpack-claude/

### Option 2: clone the repo

Pick this if you'd rather own the files in your dotfiles repo or skip the plugin layer entirely.

```bash
git clone https://github.com/findexu/finpack-claude.git /tmp/finpack-claude

cd your-project
mkdir -p .claude

cp /tmp/finpack-claude/settings.json .claude/
cp -r /tmp/finpack-claude/{rules,skills,agents,hooks} .claude/
cp /tmp/finpack-claude/CLAUDE.md ./
cp /tmp/finpack-claude/CLAUDE.local.md.example ./

chmod +x .claude/hooks/*.sh
rm -rf /tmp/finpack-claude

echo "CLAUDE.local.md" >> .gitignore
```

Reload Claude Code, then run `/setup-finpack`. It's the same skill as Option 1, just operating on files you copied yourself instead of files the plugin bundled. It also strips out anything you might have dragged in by accident: the `.claude-plugin/`, `plugins/`, and `scripts/` folders if you did a bulk `cp -r`, plus the README files in each subfolder.

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Skills or agents not showing up | Restart Claude Code. Everything loads at session start. |
| Hooks not running | Run `chmod +x .claude/hooks/*.sh` and verify `jq` is installed. |
| "jq not found" blocking everything | Install jq: `brew install jq` (macOS) or `apt install jq` (Linux). |
| format-on-save not formatting | Make sure the formatter binary is installed and its config file exists in the project root. |
| Permission denied on allowed commands | Check the glob in `settings.json`. `Bash(npm run test *)` matches arguments after `test`. |
| `/setup-finpack` asks to confirm `settings.json` edits | Expected. `protect-files.sh` prompts when editing `settings.json`. Hook scripts stay hard-blocked. |

## Make it yours

`/setup-finpack` gets you most of the way. To take it the rest of the way:

- `rules/code-quality.md`. Naming conventions to match your team's style. Comment guidelines, code marker format, import order.
- `rules/frontend.md`. Pick your design principle. Highlight the component framework your project actually uses.
- `rules/security.md`. Add paths specific to your project's sensitive areas, beyond the defaults.
- `CLAUDE.md`. Architectural decisions, domain knowledge, workflow quirks unique to your project.
- `CLAUDE.local.md`. Personal preferences (gitignored). Rename the `.example` file to start.
- `hooks/format-on-save.sh`. If detection missed your formatter, uncomment the right section manually.

The defaults are foundations. Your edits on top are what make Claude effective for *your* project.

## Skills (slash commands)

Skills are invoked with `/name` in your Claude Code session — all manual. Development habits (test-first / TDD, regression-first bug fixing, and comprehensive test coverage) now live inside quest-system as expedition habits rather than standalone skills — see the quest-system "Development habits" doctrine.

| Command | Arguments | Description |
|---------|-----------|-------------|
| `/setup-finpack` | `[focus area]` | Bootstrap and customize finpack-claude in any project. If `.claude/` is missing, the skill copies the bundled template in (rules, hooks, settings, agents, skills, `CLAUDE.md`). Then it scans your codebase to detect language, framework, package manager, test runner, linter, and architecture, and customizes every config file to match. Confirms every change before applying. |
| `/explain` | `[file, function, or concept]` | Explains code with a one-sentence summary, a mental model analogy, an ASCII diagram, key non-obvious details, and a modification guide. Focuses on the why and the landmines, not the obvious. |
| `/quest-system` | *(manual only)* | RPG-themed expedition and epic management. Tracks quests (features/epics), expeditions (work loops), and realms (app targets) across expeditions using five persistent scrolls. Maintains `.ai-context/` (committed to git) for Copilot/Gemini compatibility — paste `quest.md` at chat start for instant context. Commands: `/campaign` (orchestrate a problem end to end — clarify, route to a quest, run the embark/make-camp loop applying dev habits until done), `/new-quest`, `/counsel-quest`, `/embark`, `/make-camp`, `/quest-log`, `/change-quest`, `/summon-witch-doctor` (scroll health diagnostics and repair). Run `/install-quest-system` once per project. |
| `/install-quest-system` | *(manual only)* | Bootstrap quest-system in the current project. Copies all quest-system command files to `.claude/commands/`. Run once per project before using `/new-quest`. Safe to re-run. Restart Claude Code after running it. Want to see the workflow before installing? Interactive tutorial: https://findexu.github.io/finpack-claude/ |
| `/quest-xp` | *(manual only)* | Show your adventurer profile: level, EXP progress bar, total stats, and badge wall (unlocked and locked with counters). Profile is local and gitignored. |

### Obsidian integration (quest-system, opt-in)

View `.ai-context/` as an Obsidian vault. `/setup-obsidian` writes Bases dashboards **and**
`related:` graph links over your existing scroll frontmatter (portable — the wikilinks live
in YAML, no `[[brackets]]` in prose), and `/open-obsidian` opens it from the CLI. For live
read/write, pair it with the "Local REST API with MCP" Obsidian plugin — `/setup-obsidian`
detects and guides that setup, after which Claude keeps the graph current and can
read/search/patch scrolls directly. Fully opt-in (a `.ai-context/.obsidian-enabled` marker);
decliners' scrolls stay byte-for-byte identical. Requires Obsidian 1.9+ for Bases.

## Agents (subagents)

Agents are specialized Claude instances that run in their own isolated context. Auto-delegated based on the task, or you can invoke any of them explicitly with `@agent-name` in your prompt.

Model column shows the tier each agent runs at (override in the agent's frontmatter). `opus` is reserved for reasoning-bound, cascade-heavy work where a miss is costly; `haiku` for mechanical cross-referencing; `sonnet` for everything else.

| Agent | Model | When it's used | What it does |
|-------|-------|----------------|--------------|
| `@fp-code-reviewer` | `opus` | Invoke directly, or via the quest-system review habit | Reviews code for correctness and maintainability. Catches off-by-one errors, null dereferences, logic bugs, race conditions, error handling gaps, excessive complexity, and missing tests. Focuses on real issues with evidence, not style nitpicks. |
| `@fp-security-reviewer` | `opus` | Invoke directly on security-sensitive changes, or via the review habit | Senior security engineer doing static analysis. Covers injection (SQL, command, XSS, template, path traversal), auth and authorization flaws, data exposure, cryptography issues, dependency vulnerabilities, and input validation gaps. Reports severity, attack vector, and concrete fix for each finding. |
| `@fp-code-architect` | `opus` | Spawned by `/counsel-quest` during design, or invoke directly | Read-only architecture designer. Turns codebase findings into an implementation blueprint: specific files to create/modify, build sequence, and data flow. Prefers Serena MCP tools for surveying structure and blast radius. |
| `@fp-performance-reviewer` | `sonnet` | Invoke directly on perf-sensitive changes, or via the review habit | Finds real bottlenecks, not theoretical micro-optimizations. Checks for N+1 queries, missing indexes, unbounded queries, memory leaks, repeated computation, blocking I/O on hot paths, unnecessary re-renders, bundle size issues, and lock contention. Only flags issues with measurable impact. |
| `@fp-code-explorer` | `sonnet` | Spawned by `/counsel-quest` during exploration, or invoke directly | Read-only codebase analyst. Traces execution paths, maps architecture layers, and documents dependencies for a feature before it is built. Prefers Serena MCP tools for symbol navigation. |
| `@fp-plan-reviewer` | `sonnet` | Used by `/counsel-plan` and `/embark` | Judges whether a plan or expedition steps are ready to execute. Flags gaps, risk, and scope drift, and returns a `READY`/`REVISE` verdict so a planning loop can terminate. Not a code reviewer. |
| `@fp-frontend-designer` | `sonnet` | Auto-delegated when building web UI, or invoke directly | Creates distinctive, production-grade frontend UI that avoids generic AI aesthetics. Enforces design tokens, picks an appropriate design principle (glassmorphism, brutalism, editorial, and so on), ensures accessibility (WCAG), and prevents common anti-patterns like purple gradients, centered-everything layouts, and overused fonts. |
| `@fp-swiftui-designer` | `sonnet` | Auto-delegated when building SwiftUI screens, or invoke directly | Builds polished SwiftUI UI/UX for iPhone and iPad. Follows Apple HIG, adapts across size classes (`NavigationSplitView` on iPad, not a stretched-phone layout), enforces Dynamic Type and VoiceOver, uses system materials and SF Symbols, and delivers compiling views with `#Preview` blocks. |
| `@fp-doc-reviewer` | `haiku` | Invoke directly on doc changes, or via the review habit | Reviews docs for accuracy by cross-referencing actual source code. Verifies function signatures, code examples, config options, and file paths. Identifies stale references, missing prerequisites, undocumented error cases, and unclear instructions. |

### Using agents directly

You can invoke any agent in your prompt:

```
@fp-security-reviewer Review the auth middleware changes in src/middleware/auth.ts
```

```
@fp-frontend-designer Build a dashboard page for the analytics module
```

```
@fp-code-reviewer Check my staged changes before I commit
```

Agents run in isolated context. They don't see your conversation history, but they have access to the full codebase through their allowed tools.

## Customization guide

| Want to... | Do this |
|---|---|
| Add project-specific rules | Create `.claude/rules/your-rule.md` |
| Scope rules to file paths | Add `paths:` frontmatter to rule files |
| Add a team workflow | Create `.claude/skills/your-skill/SKILL.md` |
| Add a specialist reviewer | Create `.claude/agents/your-agent.md` |
| Enforce behavior deterministically | Add a hook in `settings.json` |
| Override settings locally | Copy `settings.local.json.example` to `.claude/settings.local.json` |
| Personal CLAUDE.md overrides | Rename `CLAUDE.local.md.example` to `CLAUDE.local.md` |

### Example: project-specific rule

```yaml
---
paths:
  - "src/billing/**"
---

# Billing Module

- All monetary values use cents (integers), never floating point dollars
- Tax calculations must use the tax-engine service, never inline math
- Every billing mutation must be idempotent with a unique request ID
```

## What's inside

> The repo is flat, not nested inside `.claude/`. `CLAUDE.md` belongs at your project root and everything else goes inside `.claude/`. Both setup paths above handle the separation for you.

```
finpack-claude/
├── CLAUDE.md                           # Template project instructions, copy to your project root
├── CLAUDE.local.md.example             # Personal overrides template, rename to CLAUDE.local.md
├── LICENSE                             # MIT
├── settings.json                       # Project settings, copy to .claude/
├── settings.local.json.example         # Personal settings template, copy to .claude/settings.local.json
├── .gitignore                          # Gitignore for the finpack-claude repo (not for your project's .claude/)
├── .claude-plugin/                     # Marketplace catalog (only used by the plugin install path)
│   └── marketplace.json                #   15 plugin entries pointing at ./plugins/<name>
├── rules/                              # Modular instructions, copy to .claude/rules/
│   ├── code-quality.md                 #   Principles, naming, comments, markers, file organization
│   ├── testing.md                      #   Testing conventions (always loaded)
│   ├── database.md                     #   Migration safety rules (loads near migration files)
│   ├── error-handling.md               #   Error handling patterns (loads near backend files)
│   ├── security.md                     #   Security rules (loads near API and auth files)
│   └── frontend.md                     #   Design tokens, principles, accessibility (loads near UI files)
├── skills/                             # Slash commands, copy to .claude/skills/   (also published as plugins)
│   ├── setup-finpack/SKILL.md         #   /setup-finpack. Bootstrap and customize all config files.
│   ├── explain/SKILL.md                #   /explain <file or function>.
│   ├── quest-system/                   #   /quest-system. RPG-themed session and epic management.
│   │   ├── SKILL.md                    #     Skill definition, split rules, scroll templates.
│   │   └── commands/                   #     Individual command files (installed to .claude/commands/)
│   │       ├── new-quest.md            #       /new-quest. Create quest folder and five scrolls.
│   │       ├── embark.md               #       /embark. Start expedition, split-aware scroll loading.
│   │       ├── make-camp.md            #       /make-camp. Record session, update scrolls, trigger splits.
│   │       ├── quest-log.md            #       /quest-log. Frontmatter-only status check.
│   │       ├── change-quest.md         #       /change-quest. Switch quest or realm.
│   │       └── complete-quest.md       #       /complete-quest. Distill, archive, clear active quest.
│   └── install-quest-system/SKILL.md  #   /install-quest-system. Bootstrap commands into .claude/commands/.
├── agents/                             # Specialized subagents, copy to .claude/agents/   (also published as plugins)
│   ├── fp-frontend-designer.md            #   Distinctive web UI, anti-AI-slop.
│   ├── fp-swiftui-designer.md             #   SwiftUI UI/UX for iPhone and iPad.
│   ├── fp-security-reviewer.md            #   Security-focused code review.
│   ├── fp-performance-reviewer.md         #   Real bottlenecks, not theoretical ones.
│   ├── fp-code-reviewer.md                #   General code review.
│   └── fp-doc-reviewer.md                 #   Documentation accuracy and completeness.
├── hooks/                              # Hook scripts, copy to .claude/hooks/
│   ├── protect-files.sh                #   Block edits to sensitive files and directories.
│   ├── warn-large-files.sh             #   Block writes to build artifacts and binary files.
│   ├── scan-secrets.sh                 #   Detect API keys, tokens, and credentials in file content.
│   ├── block-dangerous-commands.sh     #   Block push to main, force push, reset --hard, publish, rm -rf, DROP TABLE.
│   ├── format-on-save.sh               #   Auto-format after edits. Detects Prettier, Black, Ruff, Biome, rustfmt, gofmt.
│   └── session-start.sh                #   Inject branch, commit, stash, and PR context at session start.
├── plugins/                            # Per-plugin self-contained copies (only used by the plugin install path)
│   └── <15 plugins>/                   #   Each: .claude-plugin/plugin.json + mirrored agents/<name>.md or skills/<name>/SKILL.md
└── scripts/
    └── sync-plugins.sh                 # Mirrors agents/ + skills/ into plugins/<name>/ and bundles the template inside setup-finpack
```

## What NOT to put in .claude/

Keep `.claude/` focused on what helps your daily work, not what's nice-to-know:

- Things Claude can read from code. Don't describe your file structure. Claude can explore.
- Standard conventions Claude already knows (PEP 8, ESLint defaults, Go formatting).
- Verbose explanations. Every line in `CLAUDE.md` costs tokens. If removing it doesn't cause mistakes, cut it.
- Frequently changing info. Volatile details belong in code comments or docs, not in `CLAUDE.md`.

Token cost rule of thumb: rules with `alwaysApply: true` cost tokens every turn. Path-scoped rules only cost tokens when working near matched files. Skills and agents cost tokens only when invoked.

## Credits

Built from research across:
- [Official Claude Code documentation](https://code.claude.com/docs/en)
- [Trail of Bits claude-code-config](https://github.com/trailofbits/claude-code-config)
- [awesome-claude-code](https://github.com/hesreallyhim/awesome-claude-code)
- [awesome-claude-code-config](https://github.com/Mizoreww/awesome-claude-code-config)
- Community best practices from hundreds of Claude Code power users

## License

MIT. Use it, fork it, adapt it, share it. See [LICENSE](LICENSE).
