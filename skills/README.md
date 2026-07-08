# Skills

Skills are slash commands you invoke with `/name`. They run in the main conversation context, so they see all loaded rules and `CLAUDE.md`.

- `disable-model-invocation: true` means manual only. You type `/name` to trigger.
- Without that flag, Claude can also trigger the skill automatically when relevant.

## Available skills

### /setup-finpack
**Trigger**: Manual only

Bootstrap and customize finpack-claude in any project. If `.claude/` is missing, the skill copies the bundled template in (rules, hooks, settings, agents, skills, `CLAUDE.md`). Then it scans the codebase to detect language, framework, package manager, test runner, linter, and architecture, and customizes every config file to match. Confirms every change before applying. Run this once after installing the plugin or after copying finpack-claude into a new project.

### /debug-fix [issue, error, or description] [--fast]
**Trigger**: Manual only

Find and fix a bug. Default is the careful path: understand, reproduce, investigate, fix, verify, commit. Add `--fast` for emergency production mode: creates a `hotfix/` branch from production, makes the smallest correct change (no refactoring), runs only critical tests, and ships a `[HOTFIX]` PR. Warns if the fix is too complex for fast mode.

### /tdd [feature description]
**Trigger**: Manual only

Strict Test-Driven Development loop. Red: write a failing test for the smallest next behavior. Green: write the minimum code to pass. Refactor: clean up without changing behavior. Repeat. Commits after each green-plus-refactor cycle.

### /explain [file, function, or concept] [verbose | interactive]
**Trigger**: Manual only

Explains code. Default is a one-sentence summary plus a mental model. Add `verbose` for an ASCII diagram, key details, and a modification guide. Add `interactive` (or `html`) to render a self-contained interactive HTML explainer as an Artifact — step-through execution, layer toggles, and (for pure code) live inputs. Best for spatial or temporal code: state machines, algorithms, recursion, data pipelines.

### /test-writer
**Trigger**: Automatic (when new features are added)

Writes comprehensive tests covering every code path: happy path, edge cases, nulls, type boundaries, error paths, concurrency, state transitions. Covers API endpoints, UI components, database operations, and async. Verifies tests actually catch bugs by breaking the code.

## Adding your own

Create a directory with a `SKILL.md` file:

```
your-skill/
└── SKILL.md
```

```yaml
---
name: your-skill
description: What it does and when to use it
disable-model-invocation: true
---

Your instructions here. Use $ARGUMENTS for user input.
```

See [Claude Code docs](https://code.claude.com/docs/en/skills) for all frontmatter options.
