/* QUEST_DEMO — scripted lifecycle data for the interactive tutorial.
   Consumed by the IDE-simulation engine (app.js, expedition 3).
   ENGINE CONTRACT: render every chat/diff string via textContent (or equivalent
   escaping), NEVER innerHTML — strings are prose and may contain markup-like text.
   Content sourced from skills/quest-system/SKILL.md + commands/*.md (canonical).
   XP numbers are computed with the real fold formula, never invented:
     expedition     = 5 + (dangers>0 ? 10 : 0) + (oaths>0 ? 10 : 0)
     quest-complete = 100 + modules*25 + expeditions*10 + dangers*15
                      + oaths*20 + splits*50 + (clean ? 75 : 0) + (speed ? 50 : 0)
   Demo fiction: quest "user-avatars" -> exp1 (+25), exp2 (+15),
   complete (modules=2, expeditions=2, dangers=1, oaths=2, clean=1, speed=1 -> +350).
   The single danger (HEIC trap) is mapped in expedition 1 and counts at completion.
   Running total 0 -> 25 -> 40 -> 390 (level 2 at threshold 300). */

const QUEST_DEMO = {
  meta: {
    quest: "user-avatars",
    realm: "app",
    // Pinned baseline: fresh install. Every step's xp.total derives from this.
    baseline: { totalExp: 0, level: 1, title: "Apprentice Coder I" },
    final: { totalExp: 390, level: 2, title: "Apprentice Coder II" }
  },

  steps: [
    {
      id: "new-quest",
      command: "/new-quest user-avatars app",
      why: "One command turns a feature idea into persistent memory: five scrolls that outlive every chat.",
      chat: [
        "Quest inscribed: user-avatars",
        "Realm: app",
        "",
        "Scrolls created in .ai-context/quests/user-avatars/:",
        "  ✓ STRATEGY_SCROLL.md",
        "  ✓ TOME_OF_DANGERS.md",
        "  ✓ ADVENTURE_JOURNAL.md",
        "  ✓ WORLD_MAP.md",
        "  ✓ ADVENTURERS_HANDBOOK.md",
        "",
        "  ✓ Adventurer profile created. Run /quest-xp to view.",
        "",
        "Next steps:",
        "  /start-quest user-avatars  — activate and get guided to next step",
        "  /counsel-quest             — plan the quest (recommended before first expedition)"
      ],
      fileTree: [
        ".ai-context/quests/user-avatars/STRATEGY_SCROLL.md",
        ".ai-context/quests/user-avatars/TOME_OF_DANGERS.md",
        ".ai-context/quests/user-avatars/ADVENTURE_JOURNAL.md",
        ".ai-context/quests/user-avatars/WORLD_MAP.md",
        ".ai-context/quests/user-avatars/ADVENTURERS_HANDBOOK.md",
        ".claude/quest-xp/profile.md"
      ],
      scroll: {
        file: "STRATEGY_SCROLL.md",
        diff: [
          "# Strategy Scroll — user-avatars",
          "## Quest Overview",
          "(run /counsel-quest to define — what this quest is and why it exists)",
          "## Battle Status",
          "| Module | Status |",
          "|---|---|",
          "## The Battle Plan (Implementation Sequence)",
          "(not yet defined — run /counsel-quest to lock the plan before embarking)"
        ]
      },
      xp: { delta: 0, total: 0, level: 1, detail: "Scaffolding earns nothing — XP comes from finished work." }
    },

    {
      id: "counsel-quest",
      command: "/counsel-quest",
      why: "Plan before you leap: scout agents explore the codebase, the plan is locked as oaths before any code.",
      chat: [
        "Counsel — user-avatars  |  Realm: app",
        "Mode: Pre-expedition",
        "",
        "Scouting the codebase before we plan...",
        "  ✓ fp-code-explorer: similar features traced (ProfileCard, ImagePicker)",
        "  ✓ fp-code-explorer: architecture mapped (upload service, render pipeline)",
        "",
        "Battle plan locked:",
        "  1. Avatar upload + crop  (client-side resize, square crop)",
        "  2. Avatar rendering      (chat list, profile header, fallback initials)",
        "",
        "## Planned Expeditions",
        "- [ ] avatar upload + crop",
        "- [ ] avatar rendering",
        "",
        "Open riddles: none — plan is locked. Run /embark to begin."
      ],
      fileTree: [],
      scroll: {
        file: "STRATEGY_SCROLL.md",
        diff: [
          "## The Battle Plan (Implementation Sequence)",
          "1. Avatar upload + crop — client-side resize, square crop",
          "2. Avatar rendering — chat list, profile header, fallback initials",
          "",
          "## Planned Expeditions",
          "- [ ] avatar upload + crop",
          "- [ ] avatar rendering"
        ]
      },
      xp: { delta: 0, total: 0, level: 1, detail: "Planning earns nothing either — loot comes from finished work." }
    },

    {
      id: "embark-1",
      command: "/embark",
      why: "Every work session starts with a briefing built from the scrolls — never from a blank context.",
      chat: [
        "Expedition begins.",
        "Quest: user-avatars  |  Realm: app",
        "Focus: avatar upload + crop",
        "",
        "Briefing:",
        "  Battle status: 2 modules pending — this is module 1.",
        "  Quest dangers: none yet (fresh quest).",
        "  Open riddles: none blocking today's work.",
        "",
        "## Expedition Plan",
        "1. Upload component with drag-and-drop",
        "2. Client-side square crop",
        "3. Wire to the avatar service",
        "",
        "Does this plan look right? → approved. Let's go."
      ],
      fileTree: [],
      scroll: {
        file: "STRATEGY_SCROLL.md",
        diff: [
          "## Planned Expeditions",
          "- [>] avatar upload + crop",
          "- [ ] avatar rendering"
        ]
      },
      xp: { delta: 0, total: 0, level: 1, detail: "Expedition underway." }
    },

    {
      id: "work-1",
      command: "(implementation work)",
      why: "Mid-work discoveries are inscribed the moment they happen — a danger found once is never fought twice.",
      chat: [
        "Building the upload component...",
        "  + src/avatar/upload.ts",
        "  + src/avatar/crop.ts",
        "",
        "! Found one: HEIC photos decode as 1×1 on Safari's canvas.",
        "  Inscribing to TOME_OF_DANGERS now (sacred law: the moment it's found).",
        "  Decision: resize client-side to 512px JPEG before upload — sworn as an oath."
      ],
      fileTree: [
        "src/avatar/upload.ts",
        "src/avatar/crop.ts"
      ],
      scroll: {
        file: "TOME_OF_DANGERS.md",
        diff: [
          "## Known Dangers",
          "| Danger | Impact | Remedy |",
          "|---|---|---|",
          "| HEIC decodes as 1×1 on Safari canvas | Cropped avatar silently blank | Resize client-side to 512px JPEG before upload |"
        ]
      },
      xp: { delta: 0, total: 0, level: 1, detail: "XP lands at camp, not mid-work." }
    },

    {
      id: "make-camp-1",
      command: "/make-camp",
      why: "Camp ends the session by writing everything back to the scrolls — the next chat starts where this one stopped.",
      chat: [
        "Camp made. Expedition 2026-05-04 recorded.",
        "Files updated: ADVENTURE_JOURNAL, STRATEGY_SCROLL, TOME_OF_DANGERS, context.md",
        "",
        "+25 XP  (base 5, +10 dangers mapped, +10 oaths sworn)",
        "Total EXP: 25  |  Level 1 — Apprentice Coder I"
      ],
      fileTree: [],
      scroll: {
        file: "ADVENTURE_JOURNAL.md",
        diff: [
          "## Expedition 2026-05-04",
          "### Conquered",
          "- Avatar upload + client-side square crop",
          "### Oaths Sworn",
          "- Resize client-side to 512px JPEG before upload",
          "### Cursed / Uncertain",
          "none",
          "### The Road Ahead",
          "Avatar rendering: chat list, profile header, fallback initials"
        ]
      },
      // Fold: 5 + (dangers=1 > 0 ? 10) + (oaths=1 > 0 ? 10) = 25
      xp: { delta: 25, total: 25, level: 1, detail: "base 5 + dangers 10 + oaths 10." }
    },

    {
      id: "embark-2",
      command: "/embark",
      why: "The payoff: a brand-new chat, zero shared history — and the briefing already knows last week's danger and the decision that dodged it.",
      aha: true,
      chat: [
        "Expedition begins.",
        "Quest: user-avatars  |  Realm: app",
        "Focus: avatar rendering",
        "",
        "Briefing:",
        "  Battle status: module 1 conquered — this is module 2.",
        "  Recent history: Expedition 2026-05-04 — upload + crop conquered.",
        "  Quest dangers:",
        "    ! HEIC decodes as 1×1 on Safari canvas → resize client-side to 512px JPEG",
        "  Oaths sworn (recent journal):",
        "    • Resize client-side to 512px JPEG before upload",
        "",
        "This chat never saw expedition 1. The scrolls did."
      ],
      fileTree: [],
      scroll: {
        file: "STRATEGY_SCROLL.md",
        diff: [
          "## Planned Expeditions",
          "- [x] avatar upload + crop",
          "- [>] avatar rendering"
        ]
      },
      xp: { delta: 0, total: 25, level: 1, detail: "Lessons carried forward — for free." }
    },

    {
      id: "make-camp-2",
      command: "/make-camp",
      why: "Second loop closed the same way: journal entry, checklist flip, XP event. The rhythm is the feature.",
      chat: [
        "Camp made. Expedition 2026-05-05 recorded.",
        "Files updated: ADVENTURE_JOURNAL, STRATEGY_SCROLL, context.md",
        "",
        "+15 XP  (base 5, +10 oaths sworn)",
        "Total EXP: 40  |  Level 1 — Apprentice Coder I"
      ],
      fileTree: [
        "src/avatar/AvatarBadge.tsx"
      ],
      scroll: {
        file: "ADVENTURE_JOURNAL.md",
        diff: [
          "## Expedition 2026-05-05",
          "### Conquered",
          "- Avatar rendering: chat list, profile header, fallback initials",
          "### Oaths Sworn",
          "- Fallback initials use the same 512px pipeline (no second code path)",
          "### Cursed / Uncertain",
          "none",
          "### The Road Ahead",
          "All modules conquered — run /complete-quest"
        ]
      },
      // Fold: 5 + (dangers=0 -> +0) + (oaths=1 > 0 ? 10) = 15
      xp: { delta: 15, total: 40, level: 1, detail: "base 5 + oaths 10 (no new dangers this time)." }
    },

    {
      id: "complete-quest",
      command: "/complete-quest",
      why: "Completion distills the quest's lessons into PROJECT-level memory — every future quest's briefing starts smarter.",
      chat: [
        "Quest complete: user-avatars",
        "Dangers distilled: 1 → .ai-context/DANGER_REGISTRY.md",
        "Decisions distilled: 2 → .ai-context/DECISIONS_LOG.md",
        "Archived: .ai-context/archived/user-avatars/",
        "",
        "*** LEVEL UP  —  Level 1 → Level 2  (Apprentice Coder II) ***",
        "",
        "+350 XP  (base 100, modules 50, expeditions 20,",
        "          dangers 15, oaths 40, clean sweep 75, speed run 50)",
        "Total EXP: 390  |  Level 2 — Apprentice Coder II",
        "",
        "Badge unlocked: First Blood",
        "Badge unlocked: Speed Runner",
        "Badge unlocked: Clean Sweep"
      ],
      fileTree: [
        ".ai-context/DANGER_REGISTRY.md",
        ".ai-context/DECISIONS_LOG.md",
        ".ai-context/archived/user-avatars/"
      ],
      scroll: {
        file: "DANGER_REGISTRY.md",
        diff: [
          "# Project Danger Registry",
          "## Rendering Dangers",
          "| Danger | Impact | Remedy | Quest |",
          "|---|---|---|---|",
          "| HEIC decodes as 1×1 on Safari canvas | Cropped avatar silently blank | Resize client-side to 512px JPEG | user-avatars |"
        ]
      },
      // Fold: 100 + modules(2)*25 + expeditions(2)*10 + dangers(1)*15 + oaths(2)*20
      //       + splits(0)*50 + clean(1)*75 + speed(2<=3 -> 1)*50 = 350. Total 40+350=390.
      // dangers=1: the HEIC trap mapped in exp 1.
      // Level: threshold(2) = 150*2*1 = 300 <= 390 -> level 2.
      xp: {
        delta: 350, total: 390, level: 2,
        detail: "base 100 + modules 2×25 + expeditions 2×10 + dangers 1×15 + oaths 2×20 + clean sweep 75 + speed run 50."
      }
    }
  ]
};
