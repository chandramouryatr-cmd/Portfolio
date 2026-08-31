// Full-screen project story.
//
// The hero pins and Project 1 slides in from the right over it. Each project
// is then a *vertically* scrollable case study living inside a fixed stage.
// Scroll to the bottom of one and keep going -> a 1.5s full-screen loader
// ("Opening next project") holds with scroll locked, then the next project
// slides in from the right. Scroll back up and the previous project returns
// instantly (no loader), positioned at its end so the motion is continuous.
// After the last project, the fixed layers drop and the page resumes (About).
//
// Driven straight off scroll position rather than GSAP ScrollTrigger pins:
// the hero starts `scroll-locked`, which made ScrollTrigger measure a
// one-viewport document and give any pin zero travel.

import gsap from "gsap";
import type Lenis from "lenis";
import type { Project } from "./data";
import { wireframeCover } from "./wireframe";

const HOLD_MS = 1500; // loader dwell — must match @keyframes work-loader-fill
const SLIDE_MS = 620; // next-panel slide-in duration

export function initWorkStage(projects: Project[], lenis: Lenis | null) {
  const stage = document.getElementById("workStage");
  const workEl = document.getElementById("work");
  const panelsEl = document.getElementById("workPanels");
  const indexEl = document.getElementById("workIndex");
  const overviewBtn = document.getElementById("workOverviewBtn");
  const overview = document.getElementById("workOverview");
  const overviewClose = document.getElementById("workOverviewClose");
  const overviewGrid = document.getElementById("workOverviewGrid");
  const loader = document.getElementById("workLoader");
  if (!stage || !workEl || !panelsEl || !overview || !overviewGrid) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const n = projects.length;

  panelsEl.innerHTML = projects.map((p, i) => caseStudyMarkup(p, i, n)).join("");

  overviewGrid.innerHTML = projects
    .map(
      (p, i) => `
      <a class="card" href="#" data-id="${p.id}" data-index="${i}" aria-label="${p.title} — case study">
        <div class="card__frame">
          <img class="card__cover" src="${wireframeCover(p.seed)}" alt="" loading="lazy" width="640" height="480" />
          <span class="card__view">View case study <span aria-hidden="true">→</span></span>
        </div>
        <div class="card__body">
          <div class="card__title-group">
            <h3 class="card__title">${p.title}</h3>
            <p class="card__desc">${p.description}</p>
            <div class="card__tags">
              ${p.tags.map((t) => `<span class="card__tag">${t}</span>`).join("")}
            </div>
          </div>
          <span class="card__year">${p.year}</span>
        </div>
      </a>`
    )
    .join("");

  const panels = gsap.utils.toArray<HTMLElement>(".work-panel", panelsEl);
  const scrollers = panels.map((pn) => pn.querySelector<HTMLElement>(".work-panel__scroll")!);

  const setIndex = (i: number) => {
    if (indexEl)
      indexEl.textContent = `${String(i + 1).padStart(2, "0")} / ${String(n).padStart(2, "0")}`;
  };

  // ---- overview open / close (used by both modes) ----
  const openOverview = () => {
    overview!.hidden = false;
    document.documentElement.classList.add("overview-open");
  };
  const closeOverview = () => {
    overview!.hidden = true;
    document.documentElement.classList.remove("overview-open");
  };
  overviewBtn?.addEventListener("click", openOverview);
  overviewClose?.addEventListener("click", closeOverview);
  overview.addEventListener("click", (e) => {
    if (e.target === overview) closeOverview();
  });
  const wireCards = (jump: (i: number) => void) =>
    overviewGrid!.querySelectorAll<HTMLAnchorElement>(".card").forEach((card) => {
      card.addEventListener("click", (e) => {
        e.preventDefault();
        closeOverview();
        jump(Number(card.dataset.index || 0));
      });
    });

  // ============================================================
  // Fallback — no scroll-jacking: projects just stack and scroll.
  // ============================================================
  if (reduceMotion || n < 2) {
    setIndex(0);
    wireCards((idx) =>
      panels[idx].scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" })
    );
    return;
  }

  // ============================================================
  // Story mode
  // ============================================================
  document.documentElement.classList.add("story-mode");

  const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v);

  let vh = window.innerHeight;
  let stageW = stage.getBoundingClientRect().width || window.innerWidth;
  let intro = vh; // scroll span for Project 1 to slide over the hero
  const bandLen: number[] = new Array(n).fill(0); // vertical scroll room per project
  const bandStart: number[] = new Array(n).fill(0); // cumulative, relative to storyStart
  let storyStart = 0; // workEl.offsetTop
  let trackLen = 0; // intro + Σ bandLen  == workEl height
  let activeIdx = 0;
  let transitioning = false;
  let curScroll = 0;

  // Horizontal placement is done in explicit px (not GSAP xPercent) so it
  // never composes with a leftover CSS transform.
  const xpx = (pct: number) => (pct / 100) * stageW;

  function measure() {
    vh = window.innerHeight;
    stageW = stage!.getBoundingClientRect().width || window.innerWidth;
    intro = vh;
    let acc = intro;
    for (let i = 0; i < n; i++) {
      // floor keeps a clear "scroll through this" feel even for short content
      bandLen[i] = Math.max(scrollers[i].scrollHeight - vh, Math.round(vh * 0.75));
      bandStart[i] = acc;
      acc += bandLen[i];
    }
    trackLen = acc;
    storyStart = workEl!.offsetTop;
    workEl!.style.height = trackLen + "px";
  }

  function setX(i: number, pct: number) {
    panels[i].classList.add("is-placed");
    gsap.set(panels[i], { x: xpx(pct) });
  }
  function place(idx: number) {
    for (let i = 0; i < n; i++) setX(i, i === idx ? 0 : i < idx ? -100 : 100);
  }
  const setInner = (i: number, y: number) => {
    scrollers[i].style.transform = `translate3d(0, ${-Math.round(y)}px, 0)`;
  };

  function bandFor(local: number) {
    for (let i = 0; i < n; i++) {
      if (local < bandStart[i] + bandLen[i]) return i;
    }
    return n - 1;
  }

  // `is-live` = stage is interactive (a panel has started entering).
  // `in-project` = a dark panel actually fills the viewport -> dark header +
  // story nav icons. In a band both are true; during the intro slide the
  // panel has to be most of the way across before the header flips.
  function setLive(live: boolean, inProject = live) {
    stage!.classList.toggle("is-live", live);
    document.documentElement.classList.toggle("in-project", inProject);
  }

  function render(scroll: number) {
    curScroll = scroll;
    if (transitioning) return;

    const local = scroll - storyStart;

    // Past the story — hand scrolling back to the page.
    if (local >= trackLen - 1) {
      document.documentElement.classList.add("story-done");
      setLive(false);
      return;
    }
    document.documentElement.classList.remove("story-done");

    // Intro: Project 1 slides in over the pinned hero.
    if (local <= intro) {
      const t = clamp(local / intro, 0, 1);
      activeIdx = 0;
      for (let i = 0; i < n; i++) setX(i, i === 0 ? (1 - t) * 100 : 100);
      setInner(0, 0);
      setLive(t > 0.02, t > 0.55);
      setIndex(0);
      return;
    }

    setLive(true);
    const target = bandFor(local);

    if (target > activeIdx) {
      // One project forward = the deliberate "keep scrolling" gate (loader).
      // A multi-project leap (scrollbar drag, End key, up from About with a
      // stale index) is treated as a jump — no loader.
      if (target === activeIdx + 1) advance(activeIdx + 1);
      else jumpTo(target);
      return;
    }
    if (target < activeIdx) {
      activeIdx = target; // backward — instant, no loader
    }
    place(activeIdx);
    setInner(activeIdx, clamp(local - bandStart[activeIdx], 0, bandLen[activeIdx]));
    setIndex(activeIdx);
  }

  function advance(nextIdx: number) {
    transitioning = true;
    const prev = activeIdx;
    const landing = storyStart + bandStart[nextIdx];

    gsap.killTweensOf(panels);
    if (lenis) {
      lenis.stop();
      lenis.scrollTo(landing, { immediate: true, force: true });
    } else {
      window.scrollTo(0, landing);
    }

    setInner(nextIdx, 0);
    setX(nextIdx, 100);
    setIndex(nextIdx);

    if (loader) {
      loader.querySelector(".work-loader__num")!.textContent = String(nextIdx + 1).padStart(2, "0");
      loader.querySelector(".work-loader__title")!.textContent = projects[nextIdx].title;
      loader.classList.add("is-open");
      loader.classList.remove("is-running");
      void loader.offsetWidth; // reflow so the bar animation restarts
      loader.classList.add("is-running");
    }

    window.setTimeout(() => {
      loader?.classList.remove("is-open");
      gsap.to(panels[nextIdx], { x: 0, duration: SLIDE_MS / 1000, ease: "power3.out" });
      gsap.to(panels[prev], {
        x: xpx(-100),
        duration: SLIDE_MS / 1000,
        ease: "power3.out",
        onComplete: () => setInner(prev, 0),
      });
      activeIdx = nextIdx;

      window.setTimeout(() => {
        transitioning = false;
        if (lenis) lenis.start();
        render(lenis ? lenis.scroll : window.scrollY);
      }, SLIDE_MS + 40);
    }, HOLD_MS);
  }

  function jumpTo(idx: number) {
    gsap.killTweensOf(panels);
    transitioning = false;
    if (lenis) lenis.start();
    measure();
    activeIdx = idx;
    place(idx);
    setInner(idx, 0);
    setIndex(idx);
    setLive(true);
    document.documentElement.classList.remove("story-done");
    const landing = storyStart + bandStart[idx] + 1;
    if (lenis) lenis.scrollTo(landing, { immediate: true, force: true });
    else window.scrollTo(0, landing);
  }

  function layout() {
    measure();
    render(curScroll || (lenis ? lenis.scroll : window.scrollY));
  }

  // scroll source
  if (lenis) {
    lenis.on("scroll", (e: { scroll: number }) => render(e.scroll));
  } else {
    window.addEventListener("scroll", () => render(window.scrollY), { passive: true });
  }

  // re-measure whenever layout can shift
  window.addEventListener("resize", layout);
  window.addEventListener("hero:revealed", () => {
    layout();
    setTimeout(layout, 280);
  });
  if (document.fonts?.ready) document.fonts.ready.then(layout);
  const ro = new ResizeObserver(() => layout());
  scrollers.forEach((sc) => ro.observe(sc));
  panelsEl.querySelectorAll("img").forEach((img) => {
    if (!(img as HTMLImageElement).complete) img.addEventListener("load", layout, { once: true });
  });

  // initial paint (still scroll-locked behind the hero curtain)
  measure();
  for (let i = 0; i < n; i++) setX(i, 100);
  setInner(0, 0);
  setIndex(0);

  wireCards(jumpTo);

  // Hero CTA + nav "Work": drop into the story instead of scrolling to y≈0.
  document.querySelectorAll<HTMLAnchorElement>('a[href="#work"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopImmediatePropagation();
      const landing = storyStart + intro;
      if (lenis) lenis.scrollTo(landing);
      else window.scrollTo({ top: landing, behavior: "smooth" });
    });
  });

  // "Previous project" control pinned inside the stage. Steps back one
  // project (no loader — same as scrolling up); from the first project it
  // returns to the hero.
  document.getElementById("workPrev")?.addEventListener("click", () => {
    gsap.killTweensOf(panels);
    transitioning = false;
    if (lenis) lenis.start();
    if (activeIdx > 0) {
      jumpTo(activeIdx - 1);
    } else if (lenis) {
      lenis.scrollTo(0);
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  });

  // "Move to About Us" — skip the rest of the story and land on the About
  // section directly (no per-project loaders).
  document.getElementById("workSkipAbout")?.addEventListener("click", () => {
    gsap.killTweensOf(panels);
    transitioning = false;
    document.documentElement.classList.add("story-done");
    setLive(false);
    const y = storyStart + trackLen;
    if (lenis) {
      lenis.start();
      lenis.scrollTo(y, { immediate: true, force: true });
    } else {
      window.scrollTo(0, y);
    }
  });
}

/* ------------------------------------------------------------------ */
/* Placeholder case-study content                                      */
/* ------------------------------------------------------------------ */

function lowerFirst(s: string) {
  return s.charAt(0).toLowerCase() + s.slice(1);
}

function fauxStats(seed: number): [string, string][] {
  const a = 20 + ((seed * 7) % 30);
  const b = (12 + ((seed * 5) % 20)) / 10;
  const c = 15 + ((seed * 11) % 25);
  return [
    [`${a}%`, "faster task completion"],
    [`${b.toFixed(1)}×`, "increase in weekly active use"],
    [`−${c}%`, "support tickets about navigation"],
  ];
}

function caseStudyMarkup(p: Project, i: number, total: number): string {
  const cover = wireframeCover(p.seed);
  const shotA = wireframeCover(p.seed + 11);
  const shotB = wireframeCover(p.seed + 23);
  const domain = (p.tags[0] ?? "product").toLowerCase();
  const stats = fauxStats(p.seed);

  return `
  <article class="work-panel" data-index="${i}">
    <div class="work-panel__scroll">
      <div class="cs">
        <header class="cs__cover">
          <span class="cs__eyebrow">Case ${String(i + 1).padStart(2, "0")} · ${p.year}</span>
          <h3 class="cs__title">${p.title}</h3>
          <p class="cs__lede">${p.description}</p>
          <div class="cs__meta">${p.tags.map((t) => `<span class="cs__chip">${t}</span>`).join("")}</div>
          <span class="cs__scrollhint">Scroll</span>
        </header>

        <section class="cs__section">
          <span class="cs__kicker">Overview</span>
          <div class="cs__body">
            <h4 class="cs__h">What this was</h4>
            <p>${p.title} was a focused engagement to ${lowerFirst(p.description).replace(/\.$/, "")}. The existing ${domain} experience had grown by accretion — every team had added the one thing they needed, and it asked too much of the people using it.</p>
            <p>All copy here is placeholder; the layout is the point for now.</p>
          </div>
        </section>

        <section class="cs__section">
          <span class="cs__kicker">Approach</span>
          <div class="cs__body">
            <h4 class="cs__h">How we worked</h4>
            <p>Design happened in the open: low-fidelity flows reviewed daily, a shared prototype on the same cadence, and every change earning its place against one measure — how many decisions a person has to make to get where they're going.</p>
            <figure class="cs__figure"><img src="${shotA}" alt="" loading="lazy" /></figure>
            <figcaption class="cs__figcap">Mid-fidelity exploration — placeholder wireframe.</figcaption>
          </div>
        </section>

        <section class="cs__section">
          <span class="cs__kicker">Outcome</span>
          <div class="cs__body">
            <h4 class="cs__h">Where it landed</h4>
            <p>The work shipped in stages. Adoption held, the rough edges got quieter, and the team had something they could extend without a designer in the room.</p>
            <div class="cs__stats">
              ${stats.map((s) => `<div class="cs__stat"><b>${s[0]}</b><span>${s[1]}</span></div>`).join("")}
            </div>
            <div class="cs__gallery-grid">
              <img src="${shotB}" alt="" loading="lazy" />
              <img src="${cover}" alt="" loading="lazy" />
            </div>
          </div>
        </section>

        <p class="cs__end">${
          i < total - 1 ? "Keep scrolling — opening the next project" : "Keep scrolling to leave the work"
        }</p>
      </div>
    </div>
  </article>`;
}
