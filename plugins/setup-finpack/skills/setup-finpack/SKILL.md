---
name: setup-finpack
description: Set up finpack-claude in any project end-to-end. Bootstrap `.claude/` from the bundled template if missing, then customize every config file to match the project's actual tech stack, conventions, and patterns.
version: 0.2.0
argument-hint: "[optional: focus area like 'frontend' or 'backend']"
disable-model-invocation: true
---

Set up finpack-claude in this project end-to-end. If `.claude/` doesn't exist yet, bootstrap it from the template bundled inside this plugin; then customize every config file to match the actual tech stack, conventions, and patterns in use. Confirm with the user before each change using AskUserQuestion.

`CLAUDE.md` must be at the project root (`./CLAUDE.md`), NOT inside `.claude/`. All other config files live inside `.claude/`.

If the project is empty or has no source code yet, bootstrap defaults but tell the user the customization passes will be skipped until they add code.

## Phase Init: Bootstrap .claude/ if missing

Check for `.claude/settings.json`:

- If it exists: `.claude/` is already populated. Use AskUserQuestion to offer either a full customization pass (continue to Phase 0) or a health check (see "Doctor mode" below).
- If it does NOT exist: use AskUserQuestion — "This project has no `.claude/` set up yet. Bootstrap it from the finpack-claude template bundled in this plugin?" (`yes`/`no`). On **no**, stop with: "setup-finpack needs finpack-claude's content to operate. Either clone https://github.com/findexu/finpack-claude and copy the files in, or re-run and choose `yes`."

On **yes**, run this Bash to copy the bundled template (Claude Code sets `$CLAUDE_PLUGIN_ROOT` to this plugin's installation directory), without clobbering an existing `CLAUDE.md` and ensuring `CLAUDE.local.md` is gitignored:

```bash
mkdir -p .claude
cp    "$CLAUDE_PLUGIN_ROOT/template/settings.json"          .claude/
cp -r "$CLAUDE_PLUGIN_ROOT/template/rules"                  .claude/
cp -r "$CLAUDE_PLUGIN_ROOT/template/skills"                 .claude/
cp -r "$CLAUDE_PLUGIN_ROOT/template/agents"                 .claude/
cp -r "$CLAUDE_PLUGIN_ROOT/template/hooks"                  .claude/
chmod +x .claude/hooks/*.sh
[ -f ./CLAUDE.md ]               || cp "$CLAUDE_PLUGIN_ROOT/template/CLAUDE.md" ./
[ -f ./CLAUDE.local.md.example ] || cp "$CLAUDE_PLUGIN_ROOT/template/CLAUDE.local.md.example" ./
touch .gitignore
grep -qxF 'CLAUDE.local.md' .gitignore || echo 'CLAUDE.local.md' >> .gitignore
```

Tell the user what was placed and continue to Phase 0. If `$CLAUDE_PLUGIN_ROOT` is unset (skill run from a non-plugin location such as a direct clone), tell the user to re-install via the marketplace or follow the manual clone+copy flow at https://github.com/findexu/finpack-claude.

## Doctor mode (existing installs)

When `.claude/settings.json` already exists and the user chooses the health check, run only these finpack-specific checks, report findings, and confirm before fixing anything:

- **Template drift**: diff the project's `.claude/` files against the bundled `$CLAUDE_PLUGIN_ROOT/template/` versions. Report files that are added, modified, or missing relative to the template. A modified file may be intentional customization — ask before proposing to restore anything.
- **Quest-system state**: check that the quest hook is wired in `.claude/settings.json` (`quest-lifecycle-bump.sh`) and that `.ai-context/quests/` exists. If quest-system is installed, compare its installed version against the published VERSION (the curl already allow-listed in settings.json) and suggest `/update-quest-system` if stale — or `/install-quest-system` if it's absent.
- **Leftover repo files**: rerun the Phase 0 stray-file scan in report mode (list what would be removed; delete only after confirmation).

Install health, settings parseability, unused extensions, and version currency are built-in `/doctor` territory — tell the user to run `/doctor` for those instead of re-checking them here.

## Phase 0: Clean Up Non-Config Files

Before continuing, delete files and directories inside `.claude/` that come along with a clone+copy of the finpack-claude repo but don't belong in a project's `.claude/`. They waste tokens at runtime or just clutter the directory. Use Bash with `rm -rf` (or `rm -f` for files). Don't error on missing entries.

**Files** to remove from `.claude/`:
- `.claude/README.md` (repo README accidentally copied in)
- `.claude/CONTRIBUTING.md` (repo contributing guide)
- `.claude/LICENSE` (repo license)
- `.claude/CLAUDE.md` (`CLAUDE.md` belongs at the project root, not inside `.claude/`)
- `.claude/.gitignore` (for the finpack-claude repo, not the project; the project has its own root `.gitignore`)
- `.claude/settings.local.json.example` (example template, not used at runtime)
- `.claude/rules/README.md`, `.claude/agents/README.md`, `.claude/hooks/README.md`, `.claude/skills/README.md` (folder descriptions for GitHub browsing only)

**Directories** to remove from `.claude/` (only exist when a user did a bulk `cp -r finpack-claude/* .claude/`; they belong to the finpack-claude repo, not to a consuming project):
- `.claude/.claude-plugin/` (marketplace catalog, only used for plugin distribution)
- `.claude/plugins/` (per-plugin self-contained copies, only used for plugin distribution)
- `.claude/scripts/` (repo maintenance scripts like sync-plugins.sh)

After cleanup, briefly tell the user what was removed (count of files plus directories), then continue.

## Phase 1: Detect Tech Stack

Scan for package manifests, config files, and folder structure to detect: language, framework, package manager, test framework, linter/formatter, architecture pattern, and source/test directories.

Check: `package.json`, `pyproject.toml`, `Cargo.toml`, `go.mod`, `Gemfile`, `composer.json`, `build.gradle`, `pom.xml`, `Makefile`, `Dockerfile`.

Check for monorepo indicators: `workspaces` key in package.json, `pnpm-workspace.yaml`, `lerna.json`, `nx.json`, `turbo.json`, or multiple `package.json` files at depth 2+. If a monorepo is detected, ask the user which packages/apps to focus on and customize rule path patterns to include package prefixes (e.g., `packages/api/src/**` instead of `src/**`).

Detect frameworks from dependencies and config files (frontend, backend, CSS, components, ORM/DB).

Detect test framework from config files (`jest.config.*`, `vitest.config.*`, `pytest.ini`, `conftest.py`, `playwright.config.*`, etc.).

Detect linter/formatter from config files (`.eslintrc.*`, `.prettierrc.*`, `biome.json`, `ruff.toml`, `tsconfig.json`, `.editorconfig`, etc.).

Detect folder structure pattern (feature-based, layered, monorepo, MVC) and locate source, test, API, and auth directories.

Check `git log --oneline -20` for commit message style.

## Phase 2: Present Findings

Present the detected stack, package manager, test framework, linter/formatter, architecture, and source/test directories, then ask yes/no/corrections via AskUserQuestion. Incorporate any corrections before continuing.

## Phase 3: Customize Each File

For each file below, propose the specific changes and ask the user to confirm before applying.

### 3.1 CLAUDE.md (target: under 25 non-blank lines)

`CLAUDE.md` loads every turn for every developer — keep it tight.

Replace the template commands with actual commands from the detected manifest: **Build**, **Test** (plus how to run a single test file), **Lint/Format**, and **Dev** server.

Strip every `> REPLACE:` block — template guidance, not content.

Keep each remaining section only if it earns its lines, delete otherwise: **Architecture** only for a non-obvious structural decision (never a directory listing — Claude can explore); **Key Decisions** only where knowing the WHY prevents a wrong fix; **Domain Knowledge** only for terms not obvious from the code; **Workflow** only for project-specific quirks (generic lines duplicate `rules/code-quality.md`); **Don'ts** only for project-specific don'ts.

Most projects end up with Commands plus three to five extra lines — a 10-line `CLAUDE.md` is healthy. For further trimming, the built-in `/doctor` handles CLAUDE.md hygiene, dedup, and skill migration — defer to it rather than iterating here.

### 3.2 settings.json

Update permissions to match actual commands:
- Replace `npm run` with the actual package manager (`pnpm run`, `yarn`, `bun run`, `cargo`, `go`, `make`, `python -m pytest`, etc.)
- Add project-specific allow rules for detected scripts
- Keep deny rules for secrets as-is (these are universal)

Do not build an allowlist-mining pass here: the built-in `/doctor` can propose `auto` permission mode and read-only pre-approvals, and `/fewer-permission-prompts` covers transcript-based allowlist mining.

### 3.3 rules/code-quality.md

Update naming conventions ONLY if the project's existing code uses different patterns:
- Sample 5-10 source files to detect actual naming style (camelCase vs snake_case, etc.)
- If the project uses different file naming than the template, update
- If the project's import style differs, update the import order section

If everything matches the defaults, leave it unchanged.

### 3.4 rules/testing.md

Update if the detected test framework has specific idioms. Otherwise leave as-is (it's only a few lines).

### 3.5 rules/security.md

Update the `paths:` frontmatter to match actual project directories:
- Replace `src/api/**` with actual API directory paths found
- Replace `src/auth/**` with actual auth directory paths
- Replace `src/middleware/**` with actual middleware paths
- If none found, keep the defaults as reasonable guesses

### 3.5b rules/error-handling.md

Update the `paths:` frontmatter to match actual backend directories (same paths as security.md plus service/handler directories). If the project has no backend, delete this file.

### 3.6 rules/frontend.md

- **If no frontend files exist** (no .tsx, .jsx, .vue, .svelte, .css): delete this file entirely
- **If frontend exists**: update the Component Framework table to highlight which options the project actually uses (detected from dependencies)
- Update path patterns in frontmatter if the project uses non-standard directories

### 3.7 hooks/format-on-save.sh

Uncomment the section matching the detected formatter:
- Prettier found: uncomment Node.js section
- Black/isort found: uncomment Python section
- Ruff found: uncomment Ruff section
- Biome found: uncomment Biome section
- rustfmt found: uncomment Rust section
- gofmt found: uncomment Go section
- Multiple languages: uncomment all relevant sections

### 3.8 hooks/block-dangerous-commands.sh

Check the default branch name (`git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null` or `git remote show origin`). If it's not `main` or `master`, update the regex pattern.

### 3.9 rules/database.md

- Check if the project has a database (look for: migration directories, ORM config files like `prisma/schema.prisma`, `drizzle.config.*`, `alembic.ini`, `knexfile.*`, `sequelize` in dependencies, `typeorm` in dependencies, `ActiveRecord` patterns, `flyway`, `liquibase`)
- **If database/migrations detected**: keep the rule, update `paths:` frontmatter to match the actual migration directory paths found
- **If no database detected**: delete `rules/database.md` entirely

### 3.10 skills/

All skills are methodology-based and project-agnostic. Leave unchanged by default.

If the user wants a minimal setup, list the actual contents of `.claude/skills/` (run `ls -1 .claude/skills/`) and use AskUserQuestion to ask which (if any) directories they want to delete. Delete the ones they opt out of. Otherwise keep all.

### 3.11 agents/

- **fp-frontend-designer.md**: delete if no frontend files exist
- **fp-doc-reviewer.md**: delete if the project has no documentation directory (no `docs/`, `doc/`, or significant `.md` files beyond README)
- **fp-security-reviewer.md**: keep (security applies everywhere)
- **fp-code-reviewer.md**: keep (universal)
- **fp-performance-reviewer.md**: keep (universal)

## Phase 4: Review & Simplify

After all changes are applied, run a final review pass of the finpack-specific state:

- **CLAUDE.md size**: count non-blank lines with `grep -cv '^[[:space:]]*$' CLAUDE.md`. If it's 25 or more, list the longest sections and ask via AskUserQuestion which to trim; apply confirmed trims. Strip any remaining `> REPLACE:` blocks.
- Do the rules match how the code is actually written?
- Do the settings permissions cover the commands the project actually uses?
- Do the security and error-handling `paths:` match where sensitive code actually lives?
- Do all hook scripts referenced in `.claude/settings.json` exist and are they executable? (Built-in `/doctor` does not chmod-check custom project hooks.)
- Remove redundancy introduced during customization; ensure no file contradicts another.

Present the review findings to the user. If changes are needed, confirm before applying.

Generic hygiene — YAML frontmatter validity, settings parseability, verbosity trimming, unused extensions — is built-in `/doctor` territory: tell the user to run `/doctor` after setup rather than re-checking those here.

## Phase 5: Summary

After everything is finalized, present a summary:

```
Setup complete. Here's what was customized:

- Bootstrap: [copied template into .claude/ | used existing .claude/]
- CLAUDE.md: [N non-blank lines], commands customized for [stack]
- settings.json: permissions updated for [package manager]
- rules/security.md: paths updated to [actual dirs]
- rules/frontend.md: [kept/removed]
- hooks/format-on-save.sh: enabled [formatter]
- [any other changes]
- Files left as defaults: [list]
- Review pass: [issues found and fixed, or "all clean"]
```

Close by suggesting the user run the built-in `/doctor` for install health.

## Rules

- NEVER write changes without user confirmation first
- NEVER delete a file without confirming. Propose "remove" and explain why.
- If the project is empty (no source files, no manifests), bootstrap defaults and stop. Tell the user "Project appears empty. Keeping all defaults. Re-run after adding code to customize."
- If detection is uncertain, ASK the user rather than guessing
- Preserve any manual edits the user has already made to .claude/ files. Only update sections that need project-specific customization.
- Keep it minimal. If the default works, leave it alone.
