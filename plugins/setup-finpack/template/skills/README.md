# Skills

Skills are slash commands you invoke with `/name`. They run in the main conversation context, so they see all loaded rules and `CLAUDE.md`.

- `disable-model-invocation: true` means manual only. You type `/name` to trigger.
- Without that flag, Claude can also trigger the skill automatically when relevant.

## Available skills

### /setup-finpack
**Trigger**: Manual only

Bootstrap and customize finpack-claude in any project. If `.claude/` is missing, the skill copies the bundled template in (rules, hooks, settings, agents, skills, `CLAUDE.md`). Then it scans the codebase to detect language, framework, package manager, test runner, linter, and architecture, and customizes every config file to match. Confirms every change before applying. Run this once after installing the plugin or after copying finpack-claude into a new project.

### /explain [file, function, or concept] [verbose | interactive]
**Trigger**: Manual only

Explains code. Default is a one-sentence summary plus a mental model. Add `verbose` for an ASCII diagram, key details, and a modification guide. Add `interactive` (or `html`) to render a self-contained interactive HTML explainer as an Artifact — step-through execution, layer toggles, and (for pure code) live inputs. Best for spatial or temporal code: state machines, algorithms, recursion, data pipelines.

> Test-first (TDD), regression-first bug fixing, and comprehensive test coverage are no longer
> standalone skills — they now live inside quest-system as expedition **development habits**
> (see the quest-system SKILL "Development habits" section), applied during `/embark` and
> honored at `/make-camp`.

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
