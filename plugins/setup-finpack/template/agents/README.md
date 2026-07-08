# Agents

Agents are specialized Claude instances that run in **isolated context**. They don't see your conversation history or loaded rules. They only have their own system prompt and tools.

Claude delegates to agents automatically based on the task description, or you can invoke them with `@agent-name`.

## Available agents

### fp-frontend-designer
Creates distinctive, production-grade web UI. Finds or creates design tokens first, picks a design principle, then builds components. Has Write and Edit tools so it actually generates files. Anti-AI-slop aesthetics built in.

### fp-swiftui-designer
Builds polished SwiftUI UI/UX for iPhone and iPad. HIG-driven, adapts across size classes (`NavigationSplitView` on iPad, not a stretched phone layout), Dynamic Type and VoiceOver ready. Has Write and Edit tools, delivers compiling views with `#Preview` blocks. Use this for native Apple apps; use `fp-frontend-designer` for web.

### fp-security-reviewer
Reviews code for OWASP-style vulnerabilities: injection, broken auth, data exposure, weak crypto, missing validation. Reports findings by severity with exact file:line locations and specific fixes.

### fp-performance-reviewer
Finds real bottlenecks, not theoretical micro-optimizations. Covers database (N+1, missing indexes), memory (leaks, unbounded caches), computation (repeated work, blocking calls), network (sequential calls, missing timeouts), frontend (re-renders, bundle size), and concurrency (lock contention, missing pooling).

### fp-code-reviewer
General code review with specific bug patterns to catch: off-by-one errors, null dereferences, inverted conditions, race conditions, swallowed errors, misleading names, excessive complexity. Includes concrete examples for each category. Skips style nitpicks.

### fp-doc-reviewer
Reviews documentation for accuracy (do docs match code?), completeness (are required params documented?), staleness (do referenced APIs still exist?), and clarity. Cross-references with actual source code using grep and file reads.

### fp-code-explorer
Read-only codebase analyst. Traces execution paths, maps architecture layers, and documents dependencies for a feature before it is built. Spawned in parallel by `/counsel-quest` during the exploration phase. Prefers Serena MCP tools (`mcp__serena__*`) for symbol navigation when connected, falling back to Grep/Glob. Reviewer/designer agents intentionally do **not** get Serena — this one and `fp-code-architect` do, because their job is whole-module navigation rather than diff-bounded review.

### fp-code-architect
Read-only architecture designer. Turns codebase findings into an implementation blueprint: specific files to create/modify, build sequence, and data flow. Spawned in parallel by `/counsel-quest` during the design phase. Like `fp-code-explorer`, it prefers Serena MCP tools for surveying existing structure and blast radius, falling back to Grep/Glob.

## Model tiers

Each agent pins a `model:` in its frontmatter, tiered by reasoning need rather than run uniformly:

| Model | Agents | Why |
|-------|--------|-----|
| `opus` | `fp-code-architect`, `fp-code-reviewer`, `fp-security-reviewer` | Reasoning-bound and cascade-heavy — a bad design or a missed bug/vuln is expensive. |
| `sonnet` | `fp-code-explorer`, `fp-performance-reviewer`, `fp-plan-reviewer`, `fp-frontend-designer`, `fp-swiftui-designer` | Default tier. Good judgment without opus cost. |
| `haiku` | `fp-doc-reviewer` | Docs-vs-code cross-referencing is mechanical; no deep reasoning needed. |

`fp-security-reviewer` carries a `FLOOR` note: never downgrade it below `sonnet`. Watch `opus` agents that run frequently or inside loops (`/pr-review`, `/counsel-quest`) — cost multiplies; `fp-code-reviewer` is the first to drop back to `sonnet` if bills spike.

## Adding your own

Create a new `.md` file in this directory:

```yaml
---
name: your-agent-name
version: 0.1.0            # bump on every change so sync-plugins.sh restamps plugin.json and `claude plugin update` detects it
description: When Claude should delegate to this agent
model: sonnet             # opus | sonnet | haiku — pick by reasoning need; omit to inherit the session model
tools:
  - Read
  - Grep
  - Glob
  - Bash
---

Your agent's system prompt here.
```

See [Claude Code docs](https://code.claude.com/docs/en/sub-agents) for all frontmatter options.
