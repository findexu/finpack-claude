/* Motion layer — anime.js v4 (vendored). Pure enhancement on top of the static
   page: every initial "hidden" state is set HERE at runtime, never in CSS, so
   no-JS and reduced-motion users always get the full, unanimated page.
   Choreography is themed, not generic scroll-fade: ink settles (hero), stamps
   slam (verdicts), cards are dealt (ledgers), XP pops (demo engine). */

import { animate, stagger, eases } from "./vendor/anime.esm.min.js";

const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)");
if (!REDUCED.matches) {
  init();
}

function init() {
  /* ---- one-shot reveal machinery ------------------------------------ */
  /* Each entry hides its targets now and plays when its trigger section
     enters the viewport. A late safety net un-hides anything still pending
     (IO failure, tab restored odd states) so content can never stay lost. */
  const pending = new Set();

  function onEnter(trigger, targets, play) {
    if (!targets.length) return;
    targets.forEach((t) => {
      t.style.opacity = "0";
      pending.add(t);
    });
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        io.disconnect();
        targets.forEach((t) => pending.delete(t));
        play(targets);
      },
      { rootMargin: "0px 0px -12% 0px" }
    );
    io.observe(trigger);
  }

  setTimeout(() => {
    pending.forEach((t) => {
      t.style.opacity = "";
    });
    pending.clear();
  }, 8000);

  /* ---- hero: the headline's ink settles ----------------------------- */
  /* Words wrapped as spans (aria-label preserves the sentence for AT),
     then blur-to-sharp with a soft rise — reads as ink drying on the page.
     The amber line gets its brushstroke underline once the words landed. */
  const title = document.getElementById("hero-h");
  if (title) {
    title.setAttribute("aria-label", title.textContent.replace(/\s+/g, " ").trim());
    wrapWords(title);
    const words = title.querySelectorAll(".m-word");
    words.forEach((w) => {
      w.setAttribute("aria-hidden", "true");
      w.style.opacity = "0";
    });
    animate(words, {
      opacity: [0, 1],
      translateY: [14, 0],
      filter: ["blur(7px)", "blur(0px)"],
      duration: 650,
      delay: stagger(46, { start: 120 }),
      ease: "outCubic",
      onComplete() {
        const accent = title.querySelector(".hero__accent");
        if (accent) accent.classList.add("is-inked");
        words.forEach((w) => { w.style.willChange = "auto"; });
      }
    });

    const sub = document.querySelector(".hero__sub");
    const rest = [sub, document.querySelector(".term--hero"), document.querySelector(".hero .ctas")]
      .filter(Boolean);
    rest.forEach((n) => { n.style.opacity = "0"; });
    animate(rest, {
      opacity: [0, 1],
      translateY: [10, 0],
      duration: 600,
      delay: stagger(140, { start: 620 }),
      ease: "outQuad"
    });
  }

  /* Emblem: torch breathing — a slow glow/float idle, not an entrance. */
  const emblem = document.querySelector(".hero__emblem");
  if (emblem) {
    animate(emblem, {
      translateY: [0, -7],
      filter: [
        "drop-shadow(0 12px 38px rgba(227,168,87,.3))",
        "drop-shadow(0 18px 48px rgba(227,168,87,.5))"
      ],
      duration: 3400,
      alternate: true,
      loop: true,
      ease: "inOutSine"
    });
  }

  /* ---- the problem: story beats, then the stamps slam ---------------- */
  const problem = document.querySelector(".problem");
  if (problem) {
    const beats = problem.querySelectorAll(".thread__node, .thread__link");
    const stamps = problem.querySelectorAll(".track__stamp, .track__verdict");
    onEnter(problem, [...beats, ...stamps], () => {
      animate(beats, {
        opacity: [0, 1],
        translateY: [12, 0],
        duration: 480,
        delay: stagger(110),
        ease: "outQuad"
      });
      /* rubber-stamp: drops in big and slams to rest (CSS `rotate` keeps the
         resting tilt; the transform animates on top of it) */
      animate(stamps, {
        opacity: [0, 1],
        scale: [2.2, 1],
        duration: 420,
        delay: stagger(170, { start: 500 }),
        ease: eases.outBack(1.6)
      });
    });
  }

  /* ---- ledgers, tiles, armory: cards dealt onto the table ------------ */
  [".pair > .log", ".grid > .tile", ".armory > .arm"].forEach((sel) => {
    const cards = document.querySelectorAll(sel);
    if (!cards.length) return;
    onEnter(cards[0].parentElement, [...cards], () => {
      animate(cards, {
        opacity: [0, 1],
        translateY: [22, 0],
        rotate: (el, i) => [i % 2 ? 1.4 : -1.4, 0],
        duration: 640,
        delay: stagger(105),
        ease: "outCubic"
      });
    });
  });

  /* ---- demo engine: XP pops when the number changes ------------------ */
  /* app.js owns the demo DOM; observe it instead of coupling to it. */
  const xp = document.querySelector(".ide__xp-main");
  if (xp && "MutationObserver" in window) {
    let last = xp.textContent;
    new MutationObserver(() => {
      if (xp.textContent === last) return;
      last = xp.textContent;
      animate(xp, {
        scale: [1, 1.16, 1],
        duration: 460,
        ease: "outQuad"
      });
    }).observe(xp, { childList: true, characterData: true, subtree: true });
  }
}

/* Wrap each word of a heading in an inline-block span; keeps <br> and nested
   spans (recursed) intact. AT reads the aria-label set on the heading. */
function wrapWords(node) {
  [...node.childNodes].forEach((child) => {
    if (child.nodeType === Node.ELEMENT_NODE) {
      wrapWords(child);
      return;
    }
    if (child.nodeType !== Node.TEXT_NODE || !child.textContent.trim()) return;
    const frag = document.createDocumentFragment();
    child.textContent.split(/(\s+)/).forEach((piece) => {
      if (!piece) return;
      if (/^\s+$/.test(piece)) {
        frag.appendChild(document.createTextNode(piece));
      } else {
        const w = document.createElement("span");
        w.className = "m-word";
        w.textContent = piece;
        frag.appendChild(w);
      }
    });
    child.replaceWith(frag);
  });
}
