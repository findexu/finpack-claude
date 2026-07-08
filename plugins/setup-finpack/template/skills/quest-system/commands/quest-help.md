---
description: Cheat-sheet of every quest-system command and its flags. One-shot reference for when the "--" options are hard to remember. Optionally pass a command name to show just that one.
argument-hint: "[command-name]"
---

# Quest Help

A reference card. This command writes nothing and resolves no quest — it just prints
the cheat-sheet. The VS Code extension hides `argument-hint` as you type and has no flag
autocomplete, so this is the discovery surface for the `--` options.

## Step 1: Optional filter

If `$ARGUMENTS` names a single command (with or without a leading `/`, e.g. `ask-sages`
or `/counsel-quest`), print ONLY that command's line plus the rows from the
"Flag glossary" that apply to it, then stop. Otherwise print the full card below.

## Step 2: Print the card

Output verbatim:

```
QUEST-SYSTEM COMMANDS

Orchestration
  /campaign <problem + goals>                        clarify -> route to a quest -> run the embark/make-camp loop to done

Lifecycle
  /new-quest <name> [realm]                          scaffold a new quest (folder + 5 scrolls)
  /start-quest <name>                                activate a quest, route to next step
  /counsel-quest [--pivot] [--expedition-focus <n>] [--critique]
                                                     plan / replan / pivot the active quest
  /embark [--counsel [N]] [--strict] [--goal]        start an expedition (scope + brief + approve)
  /make-camp                                         end an expedition, update all scrolls
  /complete-quest                                    distill to project files, archive, clear

Status
  /quest-log [--all]                                 quick status (--all = multi-quest board)
  /quest-xp                                          adventurer profile: level, EXP, badges
  /summon-witch-doctor                               diagnose scroll health, offer repair

Side-quests
  /side-quest <desc> [--standalone]                  capture a small thing (no active-quest switch)
  /close-side-quest <slug> [--promote]               close up to parent (--promote = grow to full quest)

Counsel & reference
  /ask-sages <matter> [--critique]                   3-sage council (codebase + web + reason)
  /counsel-plan <plan.md> [--critique] [opinion]     review a plan.md, paste-back verdict
  /counsel-prompt <rough prompt>                     sharpen a rough prompt into a tight one
  /quest-help [command]                              this card (or one command's flags)

Code quality
  /hunt-bugs [path] [--diff|--all] [--fix]           hunt real bugs: scout fan-out -> adversarial verify -> ranked fix plan

Switch & setup
  /change-quest <name> [realm]                       save state, switch quest/realm
  /init-xp                                           bootstrap the XP profile (no new quest)
  /install-quest-system  /update-quest-system        install / update the system
  /setup-obsidian [--force]                          opt-in: view .ai-context/ as an Obsidian vault (dashboards + graph)
  /open-obsidian [--graph]                           open this project's .ai-context/ vault in Obsidian (CLI)

Flag glossary
  --quest <name>            target a specific quest by name (multi-chat safe). Most commands.
  --realm <realm>           override the realm in scope. Most commands.
  --critique                add an opt-in cross-critique round before the synthesis.
                            Works on: /ask-sages, /counsel-quest, /counsel-plan.
  --counsel [N]             /embark — iterate plan review up to N rounds, ROTATING the
                            reviewer lens (base -> contrarian -> executor) to escape local
                            minima. Bare = N=1 (single pass). Use 3+ for the rotation benefit.
  --strict                  /embark — only BLOCKING issues drive the counsel loop.
  --goal                    /embark — after approval, generate a machine-checkable /goal
                            condition from the quest's Acceptance Criteria (Claude Code v2.1.139+).
  --pivot                   /counsel-quest — full direction change; records the fallen strategy.
  --expedition-focus <n>    /counsel-quest — scope the counsel to one focus area.
  --all                     /quest-log — multi-quest board across every quest + side-quest;
                            /hunt-bugs — sweep the whole codebase instead of just the diff.
  --diff                    /hunt-bugs — scope the hunt to changed files vs main (default).
  --fix                     /hunt-bugs — gate applying the confirmed fixes (default: report only).
  --promote                 /close-side-quest — grow the side-quest into a full 5-scroll quest.
  --standalone              /side-quest — a side-quest with no parent quest.

Tip: /quest-help <command>  shows just that command and its flags.
```
