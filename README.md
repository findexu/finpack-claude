# finpack-claude

A lean `.claude/` kit for daily Claude Code work: 9 model-tiered agents, a few workflow skills, 7 modular rules, and safety hooks. Opinionated defaults — all overridable.

> Heavily adapted from [poshan0126/dotclaude](https://github.com/poshan0126/dotclaude.git). Go check out the original.

## Install

Recommended — marketplace:

```
/plugin marketplace add findexu/finpack-claude
/plugin install setup-finpack@finpack-claude
/setup-finpack          # run inside your project
```

`/setup-finpack` copies the kit into your `.claude/` + `CLAUDE.md`, then tunes every file to your stack (language, framework, test runner, linter). It confirms each change. Restart Claude Code after.

Want just one piece? `/plugin install <name>@finpack-claude`.

**Plugins (7):** `fp-agents` (all nine `fp-*` agents in one plugin — installed agent names become `fp-agents:fp-<name>`) `setup-finpack` `explain` `summon-seer` `quest-system` `install-quest-system` `update-quest-system`

<details><summary>Alternative — clone instead of the marketplace</summary>

```bash
git clone https://github.com/findexu/finpack-claude.git /tmp/finpack-claude
cd your-project && mkdir -p .claude
cp /tmp/finpack-claude/settings.json .claude/
cp -r /tmp/finpack-claude/{rules,skills,agents,hooks} .claude/
cp /tmp/finpack-claude/CLAUDE.md ./
chmod +x .claude/hooks/*.sh
rm -rf /tmp/finpack-claude
```
Then reload Claude Code and run `/setup-finpack`.
</details>

## Use

**Agents** — auto-delegated, or invoke with `@name`. Model tier in ( ); override it in the agent's frontmatter.

| Agent | Does |
|---|---|
| `@fp-code-reviewer` (opus) | correctness + logic-bug review |
| `@fp-security-reviewer` (opus) | OWASP-style vulnerability review |
| `@fp-code-architect` (opus) | turn codebase findings into an implementation blueprint |
| `@fp-code-explorer` (sonnet) | trace + map a feature before building |
| `@fp-performance-reviewer` (sonnet) | real bottlenecks, not micro-opts |
| `@fp-plan-reviewer` (sonnet) | judge a plan, return READY / REVISE |
| `@fp-frontend-designer` (sonnet) | distinctive web UI, anti-AI-slop |
| `@fp-swiftui-designer` (sonnet) | SwiftUI UI/UX for iPhone + iPad |
| `@fp-doc-reviewer` (haiku) | docs-vs-code accuracy |

**Skills** — type `/name`:

| Command | Does |
|---|---|
| `/setup-finpack` | bootstrap + tune the kit to your stack |
| `/explain <target> [verbose\|interactive]` | explain code — ASCII, or a self-contained interactive HTML page |
| `/summon-seer` | divine friction in recent sessions, propose fixes |
| `/quest-system` | RPG-themed epic + expedition workflow (below) |

**quest-system** (opt-in) — persistent project memory across sessions. Run `/install-quest-system` once per project, then either:
- `/set-bounty "<goal>"` — autonomous: you set the goal, a party explores -> plans -> builds -> self-tests -> reviews -> presents a near-done solution for sign-off.
- Manual loop: `/new-quest` -> `/counsel-quest` -> `/embark` -> `/make-camp` -> `/complete-quest`.

One-page docs (install, plugin list, quickstart): https://findexu.github.io/finpack-claude/

## Update

Marketplace plugins (version bumps ship automatically):
```
/plugin marketplace update finpack-claude
/plugin update <name>@finpack-claude
```

quest-system inside a project (idempotent — re-syncs commands, agents, and the hook):
```
/update-quest-system
```

## Uninstall

```
/plugin uninstall <name>@finpack-claude
/plugin marketplace remove finpack-claude
```

quest-system project files: `rm -rf .claude/commands` (the quest commands). Your `.ai-context/` quest data is left alone — delete it too if you want a clean slate.

Clone install: remove the files you copied into `.claude/` and the `CLAUDE.md` at your project root.

## Customize

- `CLAUDE.md` — project facts, decisions, quirks. `CLAUDE.local.md` — personal, gitignored (`cp CLAUDE.local.md.example CLAUDE.local.md`).
- `rules/*.md` — add `paths:` frontmatter to scope a rule to matching files (free until you touch them).
- Agent model tiers live in each `agents/*.md` `model:` key (`opus` | `sonnet` | `haiku`).

## Troubleshooting

| Problem | Fix |
|---|---|
| Skills/agents missing | Restart Claude Code — everything loads at session start. |
| Hooks not running / "jq not found" | `chmod +x .claude/hooks/*.sh`; install `jq` (`brew install jq` / `apt install jq`). |

## Credits & License

Adapted from [poshan0126/dotclaude](https://github.com/poshan0126/dotclaude.git), the [Claude Code docs](https://code.claude.com/docs/en), and community configs. MIT — see [LICENSE](LICENSE).
