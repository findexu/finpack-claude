---
name: explain
description: Explain code. Default is a one-sentence summary plus a mental model. Add --verbose for an ASCII diagram, key details, and a modification guide. Add --interactive (alias --html, --visual) for a self-contained interactive HTML explainer. Plain words like "detailed" or "visualised" work too.
argument-hint: "[target] [--verbose | --interactive]?"
disable-model-invocation: true
---

Explain `$ARGUMENTS` clearly. Pick ONE output mode. Flags win; if no flag, scan the whole argument text for intent words. Strip flags and mode words when interpreting what to explain.

## Modes

- **interactive**: flag `--interactive` (aliases `--html`, `--visual`), or intent words like `interactive`, `visualise(d)`, `visualize(d)`, `animated`, "show me", "step through" (e.g. `/explain reducer --interactive`, `/explain the retry loop, visualised`). Render a self-contained interactive HTML explainer as an Artifact (see "Interactive mode"). Best when the code is spatial or temporal — state machines, algorithms, recursion, data pipelines, event flows — where stepping through beats prose.
- **verbose**: flag `--verbose`, or intent words like `verbose`, `detail(ed)`, `deep`, "in depth" (e.g. `/explain my-function --verbose`, `/explain the sync script in detail`). All five ASCII sections below.
- **default** (no flag, no mode words): sections 1 and 2 only, then stop. Day-to-day that's usually all you need.

If both interactive and verbose signals appear, interactive wins.

## Sections (ASCII modes)

### 1. One-sentence summary
What does it do, and why does it exist? One sentence.

### 2. Mental model
An analogy or metaphor that captures the core idea. Relate it to something the developer already knows. One short paragraph.

### 3. Visual diagram (verbose only)

Draw an ASCII diagram showing the data and control flow. Keep it readable:

```
Input -> [Step A] -> [Step B] -> Output
              |
              v
        [Side Effect]
```

### 4. Key details (verbose only)

Walk through the important parts. Skip the obvious. Focus on:

- Non-obvious decisions (why this approach?)
- Edge cases and gotchas
- Dependencies and side effects

### 5. How to modify it (verbose only)

What would someone need to know to safely change this code? Where are the landmines?

## Interactive mode

Produce a single interactive HTML page and render it with the **Artifact** tool. Still lead with sections 1 and 2 as a one-line intro in your chat reply so the terminal user gets the gist without opening the page.

Build order:

1. **Load the `artifact-design` skill first** — the Artifact tool requires it before writing the page. It also calibrates how much design effort this explainer warrants.
2. Read the target code so the steps are faithful to the real control/data flow — never invent behavior.
3. Write the page to a file, then call Artifact with its path, a one-line `description`, and a `favicon` emoji.

Content the page must offer (borrow the structure of an algorithmic-art viewer — a persistent sidebar over a main canvas — but for code, not art):

- **Step-through execution.** An ordered list of execution steps with Prev / Next / Reset controls. The active step highlights the corresponding line or block in a rendered code panel and shows, in plain language, what changed (variables, state, output) at that step.
- **Layer toggles.** Independent switches for control flow, data flow, and side effects, so the reader can isolate one concern at a time.
- **Live inputs (only when the code is pure and small enough to trace honestly).** Editable input values that re-drive the simulated trace. If the code has real I/O, network, or nondeterminism, skip this and keep the trace to one representative example — do not fake a runtime.

Hard constraints (Artifact CSP + rendering):

- **Fully self-contained.** Inline all CSS and JS. No external hosts — no CDN scripts, fonts, stylesheets, or remote images; the CSP blocks them. Pull in p5.js or any library ONLY by inlining its source, and only when a genuinely spatial visualization needs it — a code explainer almost never does; vanilla JS + SVG is enough.
- **Theme-aware and responsive** per the artifact-design guidance: style both light and dark, and let wide content (code panels, diagrams) scroll inside its own container so the page body never scrolls horizontally.
- Keep the trace honest to the source. An interactive explainer that diverges from the real code is worse than a one-sentence summary.
