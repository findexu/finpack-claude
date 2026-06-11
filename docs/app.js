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

    var controls = el("div", "ide__controls");
    var btnPlay = playable ? el("button", "btn btn--ghost ide__btn", "Play") : null;
    var btnBack = el("button", "btn btn--ghost ide__btn", "Back");
    var btnStep = el("button", "btn btn--ghost ide__btn", "Step");
    var btnReset = el("button", "btn btn--ghost ide__btn", "Reset");
    if (btnPlay) controls.appendChild(btnPlay);
    controls.appendChild(btnBack);
    controls.appendChild(btnStep);
    controls.appendChild(btnReset);
    var progress = el("span", "ide__progress");
    /* role=status: manual Step/Back/Reset get screen-reader feedback (the chat
       log is deliberately not live outside Play mode). */
    progress.setAttribute("role", "status");
    controls.appendChild(progress);

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
    var whyRow = el("p", "ide__why");
    var whyLabel = el("span", "ide__why-label", "WHY");
    var whyText = el("span", "ide__why-text", "");
    whyRow.appendChild(whyLabel);
    whyRow.appendChild(whyText);
    var xpRow = el("p", "ide__xp");
    var xpMain = el("span", "ide__xp-main", "");
    var xpDetail = el("span", "ide__xp-detail", "");
    xpRow.appendChild(xpMain);
    xpRow.appendChild(xpDetail);
    meta.appendChild(whyRow);
    meta.appendChild(xpRow);

    root.appendChild(controls);
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
        tree.appendChild(el("li", "ide__tree-item" + (current[p] ? " ide__tree-item--new" : ""), p));
      });

      tab.textContent = beat.scroll.file;
      editorBody.textContent = "";
      beat.scroll.diff.forEach(function (line) {
        editorBody.appendChild(el("div", "ide__line", line));
      });

      whyText.textContent = beat.why;
      var xp = beat.xp;
      xpMain.textContent = "XP " + xp.total +
        (xp.delta ? " (+" + xp.delta + ")" : "") + " · Level " + xp.level;
      xpDetail.textContent = xp.detail || "";

      progress.textContent = "Beat " + (i + 1) + " / " + beats.length + " — " + beat.command;
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

    renderInstant(0);
    mount.appendChild(root);
  }

  /* ---- mounts (zero index.html edits: runtime replacement/insertion) ---- */
  var workflow = document.getElementById("workflow");
  if (workflow) {
    var panel = workflow.querySelector(".ph__panel");
    if (panel) panel.remove();
    Engine(workflow, QUEST_DEMO.steps, {
      playable: true,
      label: "Interactive quest loop demo",
      title: "user-avatars — Claude Code"
    });
  }

  var side = document.getElementById("side-quests");
  if (side && QUEST_DEMO.sideQuest && QUEST_DEMO.sideQuest.beats) {
    side.appendChild(el("p", "section-note", QUEST_DEMO.sideQuest.intro));
    Engine(side, QUEST_DEMO.sideQuest.beats, {
      playable: false,
      label: "Side-quest demo",
      title: "side-quest — Claude Code"
    });
  }
})();
