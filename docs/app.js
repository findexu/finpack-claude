/* IDE-simulation engine — plays the QUEST_DEMO script (data.js) inside a faux
   VS Code + Claude Code frame. Progressive enhancement: with JS off, the static
   #workflow panel stays; this script replaces it at runtime.
   ENGINE CONTRACT: every data-derived string is rendered via textContent —
   never innerHTML (data strings may contain markup-like text). */

(function () {
  "use strict";

  if (typeof QUEST_DEMO === "undefined" || !QUEST_DEMO.steps) return;

  var REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)");

  /* createElement + className + textContent helper — the only DOM factory. */
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
  }

  /* Ordered union of fileTree paths across beats[0..idx]. Recomputed on every
     render so back-stepping can never desync the explorer. */
  function treeUnion(beats, idx) {
    var seen = Object.create(null);
    var out = [];
    for (var i = 0; i <= idx; i++) {
      (beats[i].fileTree || []).forEach(function (p) {
        if (!seen[p]) { seen[p] = true; out.push(p); }
      });
    }
    return out;
  }

  function Engine(mount, beats, opts) {
    var playable = !!(opts && opts.playable);
    var title = (opts && opts.title) || "user-avatars — Claude Code";

    var idx = 0;
    var playing = false;
    var pending = 0; /* single timer handle — cleared on every transition */

    /* ---- chrome ---- */
    var root = el("div", "ide");
    root.setAttribute("role", "group");
    root.setAttribute("aria-label", (opts && opts.label) || "Interactive quest demo");

    /* The aha beat, if the script has one — drives the skip control. */
    var ahaIdx = -1;
    for (var bi = 0; bi < beats.length; bi++) {
      if (beats[bi].aha) { ahaIdx = bi; break; }
    }

    var controls = el("div", "ide__controls");
    var btnPlay = playable ? el("button", "btn btn--ghost ide__btn", "Play") : null;
    var btnBack = el("button", "btn btn--ghost ide__btn", "Back");
    var btnStep = el("button", "btn btn--ghost ide__btn", "Step");
    var btnReset = el("button", "btn btn--ghost ide__btn", "Reset");
    var btnAha = ahaIdx >= 0 ? el("button", "btn btn--ghost ide__btn", "Skip to the payoff") : null;
    if (btnPlay) controls.appendChild(btnPlay);
    controls.appendChild(btnBack);
    controls.appendChild(btnStep);
    controls.appendChild(btnReset);
    if (btnAha) controls.appendChild(btnAha);
    var progress = el("span", "ide__progress");
    /* role=status: manual Step/Back/Reset get screen-reader feedback (the chat
       log is deliberately not live outside Play mode). */
    progress.setAttribute("role", "status");
    controls.appendChild(progress);

    /* Step headline ABOVE the frame: the beat's "why" is the narrative thread —
       below the frame it was read for the wrong moment (launch-review M3). */
    var stepHead = el("div", "ide__step-head");
    var stepWhy = el("p", "ide__step-why", "");
    var stepCmd = el("p", "ide__step-cmd", "");
    stepHead.appendChild(stepWhy);
    stepHead.appendChild(stepCmd);

    var frame = el("div", "ide__frame");
    var titlebar = el("div", "ide__titlebar");
    ["ide__dot ide__dot--r", "ide__dot ide__dot--y", "ide__dot ide__dot--g"].forEach(function (c) {
      titlebar.appendChild(el("span", c, ""));
    });
    titlebar.appendChild(el("span", "ide__title", title));

    /* Scrollable panes get tabindex=0 + a label: without it Firefox/Safari
       keyboard users cannot scroll overflowing content. */
    function scrollable(node, label) {
      node.setAttribute("tabindex", "0");
      node.setAttribute("aria-label", label);
      return node;
    }

    var explorer = el("div", "ide__pane ide__explorer");
    explorer.appendChild(el("div", "ide__pane-head", "EXPLORER"));
    var tree = scrollable(el("ul", "ide__tree"), "File explorer");
    explorer.appendChild(tree);

    var editor = el("div", "ide__pane ide__editor");
    var tab = el("div", "ide__pane-head ide__tab", "");
    editor.appendChild(tab);
    var editorBody = scrollable(el("div", "ide__lines"), "Editor pane");
    editor.appendChild(editorBody);

    var chat = el("div", "ide__pane ide__chat");
    chat.appendChild(el("div", "ide__pane-head", "CLAUDE CODE"));
    var chatLog = scrollable(el("div", "ide__chatlog"), "Chat transcript"); /* aria-live toggled: Play mode only */
    chat.appendChild(chatLog);
    var prompt = el("div", "ide__prompt", "");
    chat.appendChild(prompt);

    frame.appendChild(titlebar);
    frame.appendChild(explorer);
    frame.appendChild(editor);
    frame.appendChild(chat);

    var meta = el("div", "ide__meta");
    var xpRow = el("p", "ide__xp");
    var xpMain = el("span", "ide__xp-main", "");
    var xpDetail = el("span", "ide__xp-detail", "");
    xpRow.appendChild(xpMain);
    xpRow.appendChild(xpDetail);
    meta.appendChild(xpRow);

    root.appendChild(controls);
    root.appendChild(stepHead);
    root.appendChild(frame);
    root.appendChild(meta);

    function clearPending() {
      if (pending) { clearTimeout(pending); clearInterval(pending); pending = 0; }
    }

    /* ---- pure per-beat rendering (explorer is the only accumulator) ---- */
    function renderStatic(i) {
      var beat = beats[i];

      tree.textContent = "";
      var current = {};
      (beat.fileTree || []).forEach(function (p) { current[p] = true; });
      treeUnion(beats, i).forEach(function (p) {
        /* basename + muted dir prefix as two textContent elements — full paths
           shattered mid-word at 190px (launch-review M3). Dimming is a COLOR
           token, never opacity (inscribed AA danger). */
        var li = el("li", "ide__tree-item" + (current[p] ? " ide__tree-item--new" : ""));
        var parts = p.replace(/\/$/, "").split("/");
        var base = parts.pop() + (p.charAt(p.length - 1) === "/" ? "/" : "");
        if (parts.length) li.appendChild(el("span", "ide__tree-dir", parts.join("/") + "/"));
        li.appendChild(el("span", "ide__tree-base", base));
        tree.appendChild(li);
      });

      tab.textContent = beat.scroll.file;
      editorBody.textContent = "";
      beat.scroll.diff.forEach(function (line) {
        editorBody.appendChild(el("div", "ide__line", line));
      });

      stepWhy.textContent = beat.why;
      stepCmd.textContent = beat.command;
      var xp = beat.xp;
      xpMain.textContent = "XP " + xp.total +
        (xp.delta ? " (+" + xp.delta + ")" : "") + " · Level " + xp.level;
      xpDetail.textContent = xp.detail || "";

      progress.textContent = "Step " + (i + 1) + " of " + beats.length;
      root.classList.toggle("ide--aha", !!beat.aha);

      /* aria-disabled, not .disabled: a hard-disabled element drops keyboard
         focus to <body> when it is the focused control (Step at last beat).
         The click handlers early-return on the boundary instead. */
      btnBack.setAttribute("aria-disabled", String(i === 0));
      btnBack.classList.toggle("ide__btn--off", i === 0);
      btnStep.setAttribute("aria-disabled", String(i === beats.length - 1));
      btnStep.classList.toggle("ide__btn--off", i === beats.length - 1);
    }

    /* Instant render: manual step / back / reset / reduced motion.
       The live attribute is removed BEFORE the rewrite and restored on the next
       frame — a same-tick restore can still announce the full transcript. */
    function renderInstant(i) {
      clearPending();
      chatLog.removeAttribute("aria-live");
      renderStatic(i);
      prompt.textContent = "❯ " + beats[i].command;
      chatLog.textContent = "";
      beats[i].chat.forEach(function (line) {
        chatLog.appendChild(el("div", "ide__chatline", line));
      });
      chatLog.scrollTop = chatLog.scrollHeight;
      window.requestAnimationFrame(function () {
        if (playing) chatLog.setAttribute("aria-live", "polite");
      });
    }

    /* Animated render (Play mode): type the command, then reveal whole chat
       lines. Reduced motion: no character/line animation — instant beats with a
       fixed pause between them. */
    function renderAnimated(i, done) {
      clearPending();
      if (REDUCED.matches) {
        /* Reduced-motion Play must still announce: set the live region FIRST,
           then insert content — renderInstant would insert while non-live and
           the beat would be silent for the reduced-motion + AT audience. */
        chatLog.setAttribute("aria-live", "polite");
        renderStatic(i);
        prompt.textContent = "❯ " + beats[i].command;
        chatLog.textContent = "";
        beats[i].chat.forEach(function (line) {
          chatLog.appendChild(el("div", "ide__chatline", line));
        });
        chatLog.scrollTop = chatLog.scrollHeight;
        pending = setTimeout(done, 1800);
        return;
      }
      chatLog.setAttribute("aria-live", "polite");
      renderStatic(i);
      chatLog.textContent = "";
      var cmd = "❯ " + beats[i].command;
      var pos = 0;
      prompt.textContent = "❯ ";
      pending = setInterval(function () {
        pos++;
        prompt.textContent = cmd.slice(0, pos + 2);
        if (pos + 2 >= cmd.length) {
          clearPending();
          var lineIdx = 0;
          pending = setInterval(function () {
            if (lineIdx >= beats[i].chat.length) {
              clearPending();
              pending = setTimeout(done, 1600);
              return;
            }
            chatLog.appendChild(el("div", "ide__chatline", beats[i].chat[lineIdx]));
            chatLog.scrollTop = chatLog.scrollHeight;
            lineIdx++;
          }, 240);
        }
      }, 28);
    }

    function stopPlaying() {
      playing = false;
      clearPending();
      chatLog.removeAttribute("aria-live");
      if (btnPlay) btnPlay.textContent = "Play";
    }

    function playFrom(i) {
      idx = i;
      renderAnimated(idx, function advance() {
        if (!playing) return;
        if (idx >= beats.length - 1) { stopPlaying(); renderInstant(idx); return; }
        idx++;
        renderAnimated(idx, advance);
      });
    }

    if (btnPlay) btnPlay.addEventListener("click", function () {
      if (playing) { stopPlaying(); renderInstant(idx); return; }
      playing = true;
      btnPlay.textContent = "Pause";
      playFrom(idx === beats.length - 1 ? 0 : idx);
    });
    btnStep.addEventListener("click", function () {
      if (idx >= beats.length - 1) return; /* boundary: aria-disabled, keep focus */
      stopPlaying();
      idx++;
      renderInstant(idx);
    });
    btnBack.addEventListener("click", function () {
      if (idx <= 0) return; /* boundary: aria-disabled, keep focus */
      stopPlaying();
      idx--;
      renderInstant(idx);
    });
    btnReset.addEventListener("click", function () {
      stopPlaying();
      idx = 0;
      renderInstant(idx);
    });
    if (btnAha) btnAha.addEventListener("click", function () {
      stopPlaying();
      idx = ahaIdx;
      renderInstant(idx);
    });

    renderInstant(0);
    mount.appendChild(root);

    return {
      startPlay: function () {
        if (btnPlay && !playing) btnPlay.click();
      }
    };
  }

  /* ---- mounts ----
     The #workflow caption panel STAYS — it is the demo's instructions (the
     launch review's top critical finding was removing it). One engine mount
     only. */
  var workflowEngine = null;
  var workflow = document.getElementById("workflow");
  if (workflow) {
    workflowEngine = Engine(workflow, QUEST_DEMO.steps, {
      playable: true,
      label: "Interactive quest loop demo",
      title: "user-avatars — Claude Code"
    });
  }

  /* Hero CTA: "Watch the loop" scrolls to the demo AND starts it — the anchor
     alone landed on a section where nothing played (launch-review M6). Anchor
     href stays as the no-JS fallback. */
  var ctaWatch = document.querySelector('.hero a[href="#workflow"]');
  if (ctaWatch && workflowEngine) {
    ctaWatch.addEventListener("click", function () {
      if (workflow.scrollIntoView) {
        workflow.scrollIntoView(REDUCED.matches ? { behavior: "auto" } : { behavior: "smooth" });
      }
      workflowEngine.startPlay();
    });
  }

  /* ===== Mock dashboard (character sheet) + lifecycle stepper (#payoff) =====
     data.js stays frozen: everything below derives from QUEST_DEMO.steps via a
     mapping keyed by beat id. The sheet mocks the real quest-dashboard in
     CSS only — no sprite assets. */

  var TRACKER_LABELS = ["avatar upload + crop", "avatar rendering"];
  var TITLES = { 1: "Apprentice Coder I", 2: "Apprentice Coder II" };
  var BADGES = [
    { icon: "🗡️", name: "First Blood" },
    { icon: "🚀", name: "Speed Runner" },
    { icon: "✨", name: "Clean Sweep" }
  ];
  /* phase + tracker mirror of the demo's own STRATEGY_SCROLL diffs, beat for
     beat. tracker:null = quest not yet counselled (no items exist). */
  var SHEET_STATE = {
    "new-quest":      { phase: "Planning", hue: "--p-plan",     tracker: null,       badges: 0 },
    "counsel-quest":  { phase: "Ready",    hue: "--p-ready",    tracker: [" ", " "], badges: 0 },
    "embark-1":       { phase: "Embarked", hue: "--p-embark",   tracker: [">", " "], badges: 0 },
    "work-1":         { phase: "Embarked", hue: "--p-embark",   tracker: [">", " "], badges: 0 },
    "make-camp-1":    { phase: "At Camp",  hue: "--p-camp",     tracker: ["x", " "], badges: 0 },
    "embark-2":       { phase: "Embarked", hue: "--p-embark",   tracker: ["x", ">"], badges: 0 },
    "make-camp-2":    { phase: "At Camp",  hue: "--p-camp",     tracker: ["x", "x"], badges: 0 },
    "complete-quest": { phase: "Complete", hue: "--p-complete", tracker: ["x", "x"], badges: 3 }
  };

  function threshold(n) { return 150 * n * (n - 1); }

  function Sheet(mount) {
    var root = el("div", "sheet");

    var banner = el("div", "sheet__banner");
    var phaseName = el("span", "sheet__phase", "");
    var bannerCmd = el("span", "sheet__cmd", "");
    banner.appendChild(phaseName);
    banner.appendChild(bannerCmd);

    var identity = el("p", "sheet__id", "");

    var expRow = el("div", "sheet__exp");
    var track = el("div", "sheet__exp-track");
    var fill = el("div", "sheet__exp-fill");
    track.appendChild(fill);
    var expNum = el("span", "sheet__exp-num", "");
    expRow.appendChild(track);
    expRow.appendChild(expNum);

    var trackerBox = el("div", "sheet__tracker");
    trackerBox.appendChild(el("div", "sheet__head", "EXPEDITIONS"));
    var trackerList = el("ul", "sheet__rows");
    trackerList.setAttribute("role", "list");
    trackerBox.appendChild(trackerList);

    var badgeBox = el("div", "sheet__badges");
    badgeBox.appendChild(el("div", "sheet__head", "BADGES"));
    var badgeList = el("ul", "sheet__rows");
    badgeList.setAttribute("role", "list");
    badgeBox.appendChild(badgeList);

    root.appendChild(banner);
    root.appendChild(identity);
    root.appendChild(expRow);
    root.appendChild(trackerBox);
    root.appendChild(badgeBox);
    mount.appendChild(root);

    function update(beat) {
      var st = SHEET_STATE[beat.id] || SHEET_STATE["new-quest"];
      var xp = beat.xp;

      phaseName.textContent = st.phase;
      banner.style.setProperty("--sheet-hue", "var(" + st.hue + ")");
      bannerCmd.textContent = beat.command;

      identity.textContent = "Adventurer — Level " + xp.level + " · " + (TITLES[xp.level] || "");

      var base = threshold(xp.level);
      var span = 300 * xp.level;
      var pct = Math.max(0, Math.min(100, ((xp.total - base) / span) * 100));
      fill.style.width = pct + "%";
      expNum.textContent = xp.total + " / " + threshold(xp.level + 1) + " EXP";

      trackerList.textContent = "";
      if (st.tracker === null) {
        trackerList.appendChild(el("li", "sheet__row sheet__row--empty", "no expeditions planned yet"));
      } else {
        st.tracker.forEach(function (mark, i) {
          var cls = mark === "x" ? "done" : mark === ">" ? "active" : "planned";
          var row = el("li", "sheet__row sheet__row--" + cls);
          row.appendChild(el("span", "sheet__mark", "[" + mark + "]"));
          row.appendChild(el("span", "sheet__label", TRACKER_LABELS[i]));
          trackerList.appendChild(row);
        });
      }

      badgeList.textContent = "";
      BADGES.forEach(function (b, i) {
        var unlocked = i < st.badges;
        var row = el("li", "sheet__row sheet__row--" + (unlocked ? "badge" : "locked"));
        row.appendChild(el("span", "sheet__mark", unlocked ? b.icon : "◆"));
        row.appendChild(el("span", "sheet__label", unlocked ? b.name : "locked"));
        badgeList.appendChild(row);
      });

      root.classList.toggle("sheet--aha", !!beat.aha);
      root.classList.toggle("sheet--levelup", xp.level > 1);
    }

    return { update: update };
  }

  /* Standalone stepper — Engine internals are conquered code, NOT extracted.
     Same control patterns: aria-disabled boundaries + early-return, role=status
     progress. No Play mode, no timers — every step renders instantly.
     startIdx lets the payoff sheet open at its most interesting state. */
  function Stepper(mount, beats, renderFn, startIdx) {
    var idx = typeof startIdx === "number" ? startIdx : 0;

    var controls = el("div", "ide__controls");
    var btnBack = el("button", "btn btn--ghost ide__btn", "Back");
    var btnStep = el("button", "btn btn--ghost ide__btn", "Step");
    var btnReset = el("button", "btn btn--ghost ide__btn", "Reset");
    var progress = el("span", "ide__progress");
    progress.setAttribute("role", "status");
    controls.appendChild(btnBack);
    controls.appendChild(btnStep);
    controls.appendChild(btnReset);
    controls.appendChild(progress);
    mount.appendChild(controls);

    var why = el("p", "ide__why");
    var whyLabel = el("span", "ide__why-label", "WHY");
    var whyText = el("span", "ide__why-text", "");
    why.appendChild(whyLabel);
    why.appendChild(whyText);

    function render() {
      var beat = beats[idx];
      renderFn(beat);
      whyText.textContent = beat.why;
      var st = SHEET_STATE[beat.id];
      progress.textContent = "Phase: " + (st ? st.phase : "—") +
        " — step " + (idx + 1) + " of " + beats.length;
      btnBack.setAttribute("aria-disabled", String(idx === 0));
      btnBack.classList.toggle("ide__btn--off", idx === 0);
      btnStep.setAttribute("aria-disabled", String(idx === beats.length - 1));
      btnStep.classList.toggle("ide__btn--off", idx === beats.length - 1);
    }

    btnStep.addEventListener("click", function () {
      if (idx >= beats.length - 1) return;
      idx++;
      render();
    });
    btnBack.addEventListener("click", function () {
      if (idx <= 0) return;
      idx--;
      render();
    });
    btnReset.addEventListener("click", function () {
      idx = 0;
      render();
    });

    return { mountWhy: function () { mount.appendChild(why); }, render: render };
  }

  /* The intro sentence is STATIC in index.html (constant-content oath); the
     sheet opens at the FINAL leveled-up state — opening on "no expeditions
     planned yet" buried the interesting state seven clicks deep. */
  var payoff = document.getElementById("payoff");
  if (payoff) {
    var stepperBox = el("div", "sheet-demo");
    payoff.appendChild(stepperBox);
    var sheetHolder = { sheet: null };
    var stepper = Stepper(stepperBox, QUEST_DEMO.steps, function (beat) {
      if (!sheetHolder.sheet) sheetHolder.sheet = Sheet(stepperBox);
      sheetHolder.sheet.update(beat);
    }, QUEST_DEMO.steps.length - 1);
    stepper.render();
    stepper.mountWhy();
  }
})();
