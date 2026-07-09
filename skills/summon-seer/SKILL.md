---
name: summon-seer
description: Summon the seer to divine recurring friction in your recent Claude Code sessions, then propose concrete fixes — new skills, automations (hooks/settings.json), and CLAUDE.md edits. Fans out cheap sub-agents over session transcripts, clusters recurring friction, and reports evidence-linked proposals. Report-only unless --fix.
argument-hint: "[--all-projects] [--days N] [--sessions N] [--fix]"
version: 1.0.0
disable-model-invocation: true
allowed-tools:
  - Read
  - Glob
  - Grep
  - Bash
  - Edit
  - Agent
---

# Summon Seer

The seer gazes into past sessions and divines the patterns. Find the recurring friction in how you work with Claude Code, then propose fixes that
remove it. This reads your local session transcripts, fans out cheap workers to extract
friction signals, clusters what recurs, and proposes new skills / automations / CLAUDE.md
edits — each tied to evidence. It changes nothing unless you pass `--fix`.

Orchestration follows the loop doctrine: THIS skill body is the orchestrator (strong
session model); it dispatches `haiku` workers that each digest one transcript slice and
return a summary. Workers are leaves — all clustering and every write happens here.

## Step 1: Resolve the transcript directory

Session transcripts live at `~/.claude/projects/<encoded-cwd>/<session-uuid>.jsonl` —
newline-delimited JSON events. `<encoded-cwd>` is the project's absolute path with every
run of non-alphanumeric characters replaced by `-`. Do NOT reconstruct it by a naive
`/`→`-` (paths with dots or other symbols won't round-trip). Instead RESOLVE it:

```bash
# List candidate project dirs; pick the one matching $PWD under CC's encoding.
enc() { printf '%s' "$1" | sed 's/[^A-Za-z0-9]\{1,\}/-/g'; }
target="$(enc "$PWD")"
for d in ~/.claude/projects/*/; do
  [ "$(basename "$d")" = "$target" ] && echo "$d" && break
done
```

- Default: only the CURRENT project's dir.
- `--all-projects`: audit every `~/.claude/projects/*/`. WARN that this widens exposure
  to transcripts (and any secrets in them) from every project you have used.

If no dir resolves, report "No Claude Code transcripts found for this project" and stop.

## Step 2: Select in-scope transcripts

From the resolved dir(s), pick recent `*.jsonl` by mtime:
- Default: the most recent `~10` sessions OR those modified in the last `7 days`,
  whichever is smaller. `--days N` / `--sessions N` override.
List the selected files with sizes so the commander sees the scope.

## Step 3: Slice by byte budget

Transcripts can be 14MB+, and a single `tool_result` line can be multiple MB. Partition
by CUMULATIVE BYTES (~256KB per slice), not line count. Derive `{file, start-line,
end-line}` slices with awk (line bytes = `length($0)+1` for the newline):

```bash
awk 'BEGIN{s=1;b=0} {b+=length($0)+1} b>=262144 {print FILENAME"\t"s"\t"NR; s=NR+1; b=0}
     END{ if (s<=NR) print FILENAME"\t"s"\t"NR }' "$file"
```

Each output row is one slice. (Caveat: the `Read` tool truncates very long lines, so a
single multi-MB `tool_result` may lose detail — acceptable; friction lives in the
sequence of events, not one giant payload.)

## Step 4: Fan out haiku workers (one per slice)

For each slice, spawn a worker with the `Agent` tool, `subagent_type: general-purpose`,
`model: haiku`. Pass ONLY the `{file, start-line, end-line}` — the worker SELF-READS its
slice with `Read(file, offset=start, limit=end-start+1)`. NEVER embed transcript bodies
in the orchestrator context or the worker prompt.

Instruct each worker to scan its slice for FRICTION SIGNALS and return a terse structured
list, summaries not dumps:
- **error tool_results** — a tool call that failed and had to be redone.
- **repeated retries** — the same command/edit attempted 2+ times.
- **user corrections** — the human reversing course ("no", "actually", "revert", "undo",
  "that's wrong", "not what I asked").
- **permission denials** — a tool call the user declined.
- **abandoned approaches** — a direction started then dropped.

Each item: `{signal, category, session-uuid:line, one-line evidence}`. The worker does a
BEST-EFFORT mask of obvious secrets in its evidence lines, but this is not the guarantee
(Step 6 is).

## Step 5: Cluster

In this session, merge all worker items and cluster by RECURRING THEME — a friction that
shows up across multiple sessions or repeatedly within one. Rank clusters by frequency ×
impact. Drop one-off noise. For each cluster keep the 1-3 strongest evidence pointers.

## Step 6: Redact (authoritative, deterministic)

Before ANYTHING is shown or written, run a deterministic regex redaction over all
clustered text — this is the real secret boundary (worker masking in Step 4 is only
best-effort). Mask, at minimum: values after `token`/`secret`/`key`/`password`/`bearer`
(case-insensitive), `sk-`/`ghp_`/`gho_`/AWS-`AKIA` prefixes, long hex/base64 blobs, and
`KEY=VALUE` env assignments. Replace the value with `‹redacted›`.

## Step 7: Propose

Produce the report:
```
## Seer's Vision — {scope: N sessions, date range}

### Friction clusters (ranked)
1. {theme} — seen {K}× across {sessions}. Evidence: {uuid:line}, …

### Proposals
- NEW SKILL: {name} — {what it automates} — addresses cluster {n}
- AUTOMATION: {a hook or settings.json change} — addresses cluster {n}
- CLAUDE.md FIX: {specific instruction to add/change} — addresses cluster {n}
```
Every proposal must name the cluster (evidence) it removes. No evidence → don't propose it.

## Step 8: Apply (gated, `--fix` only)

Default is REPORT-ONLY — stop after Step 7. Under `--fix`, for each proposed write to
`CLAUDE.md`, `.claude/settings.json`, or a `hooks/` file: show the concrete diff and ask
for explicit confirmation BEFORE that single write. One write, one confirmation. Never
batch-apply, never write outside those three targets. Skills/automations you propose but
that need new files are listed for the commander to create — this skill does not scaffold
them silently.
