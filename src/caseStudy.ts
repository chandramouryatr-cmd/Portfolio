// Renders and wires the "feature showcase" layout (portfolio-layout-prompt.md)
// for any project that has rich data in caseStudyData.ts.
//
// The device + text frame is ONE persistent element — it does not scroll
// away. Only its content changes as the user scrolls: a thin, invisible
// "track" with one marker per feature lives in the normal scroll flow (so it
// takes up real scroll distance and drives the outer project pacing exactly
// like any other content), and an IntersectionObserver watches those markers
// crossing the viewport centre to decide which feature's text/device state
// is currently painted into the fixed frame.
//
// The frame itself is a sibling of `.work-panel__scroll`, not a descendant —
// that scroll container gets a JS transform to fake vertical scrolling
// (see work.ts), and anything inside it would be dragged around by that
// transform. Sitting outside it, the frame only inherits the panel's own
// left/right slide between projects, which is what we want.

import type { CaseStudy, CaseStudyFeature, FeatureDetails } from "./caseStudyData";
import { wireframeCover } from "./wireframe";

type TabKey = "problemAnalysis" | "userResearch" | "personas" | "journey" | "process" | "metrics";

const TAB_DEFS: { key: TabKey; label: string }[] = [
  { key: "problemAnalysis", label: "Problem Analysis" },
  { key: "userResearch", label: "User Research" },
  { key: "personas", label: "Personas" },
  { key: "journey", label: "Journey & Empathy Map" },
  { key: "process", label: "Design Process" },
  { key: "metrics", label: "Metrics & Results" },
];

/* ------------------------------------------------------------------ */
/* Markup                                                               */
/* ------------------------------------------------------------------ */

// Goes inside `.work-panel__scroll` — hero, then one thin marker per
// feature to reserve scroll room. No visible feature content here.
export function richCaseStudyScrollMarkup(cs: CaseStudy): string {
  return `
    <section class="cs-hero">
      <div class="cs-hero__col cs-hero__col--problem">
        <span class="cs-hero__label">The problem</span>
        <p>${cs.hero.problem}</p>
      </div>
      <div class="cs-hero__col cs-hero__col--solution">
        <span class="cs-hero__label">The solution</span>
        <p>${cs.hero.solution}</p>
        <div class="cs-hero__outcome">${cs.hero.outcome}</div>
      </div>
    </section>
    <div class="cs-feat-track" data-feature-track>
      ${cs.features.map((_, i) => `<div class="cs-feat-marker" data-feature-marker="${i}"></div>`).join("")}
    </div>
  `;
}

// The persistent frame — a sibling of the scroll container, content-agnostic
// in its own markup; wireRichCaseStudy() fills it in as the active feature
// changes. When the project has a real prototype, the small in-flow screen
// shows a live (non-interactive) preview of it instead of a generated
// placeholder — the same app, just scaled down; "Experience" is what opens
// it full-size and interactive.
export function richCaseStudyFixedMarkup(prototypeUrl?: string): string {
  const screenInner = prototypeUrl
    ? `<iframe class="cs-feat__screen-proto" data-screen-proto src="${prototypeUrl}" tabindex="-1" aria-hidden="true" title=""></iframe>`
    : `<div class="cs-feat__screen-img" data-screen-layer></div>
       <div class="cs-feat__screen-img" data-screen-layer></div>`;
  return `
    <div class="cs-feat-fixed" data-feature-fixed hidden>
      <div class="cs-feat__device">
        <div class="cs-feat__switch" role="tablist" aria-label="Preview breakpoint">
          <button type="button" class="cs-feat__switch-btn is-active" data-bp="mobile">Mobile</button>
          <button type="button" class="cs-feat__switch-btn" data-bp="tablet">Tablet</button>
          <button type="button" class="cs-feat__switch-btn" data-bp="web">Web</button>
        </div>
        <div class="cs-feat__frame" data-bp="mobile">
          <div class="cs-feat__screen" data-feature-screen>
            ${screenInner}
            <div class="cs-feat__steps" data-feature-steps></div>
          </div>
        </div>
        <button type="button" class="cs-feat__experience">
          <span>Experience</span>
          <svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M4 2.5 13 8 4 13.5Z" fill="currentColor" /></svg>
        </button>
        <span class="cs-feat__hint">Click a step, or press Experience to walk through it</span>
      </div>
      <div class="cs-feat__info">
        <div class="cs-feat__info-head">
          <span class="cs-feat__counter" data-feature-counter></span>
          <button type="button" class="cs-feat__detail-btn" data-feature-detail>
            <span>Explain in Detail</span>
            <span aria-hidden="true">→</span>
          </button>
        </div>
        <h4 class="cs-feat__title" data-feature-title></h4>
        <p class="cs-feat__statement" data-feature-statement></p>
        <div class="cs-feat__text-wrap">
          <div class="cs-feat__rail" aria-hidden="true"></div>
          <div class="cs-feat__text" data-feature-text></div>
        </div>
      </div>
    </div>`;
}

/* ------------------------------------------------------------------ */
/* Prototype overlay (single instance) — a real, self-contained          */
/* interactive prototype opened full-size in an iframe, not shrunk into   */
/* the small in-flow device frame.                                       */
/* ------------------------------------------------------------------ */

let protoWired = false;

function openPrototype(url: string) {
  const overlay = document.getElementById("csProto");
  const frame = document.getElementById("csProtoFrame") as HTMLIFrameElement | null;
  if (!overlay || !frame) return;
  if (!protoWired) {
    protoWired = true;
    document.getElementById("csProtoClose")?.addEventListener("click", closePrototype);
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) closePrototype();
    });
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !overlay.hidden) closePrototype();
    });
  }
  frame.src = url;
  overlay.hidden = false;
  document.documentElement.classList.add("cs-proto-open");
}

function closePrototype() {
  const overlay = document.getElementById("csProto");
  const frame = document.getElementById("csProtoFrame") as HTMLIFrameElement | null;
  if (!overlay) return;
  overlay.hidden = true;
  document.documentElement.classList.remove("cs-proto-open");
  if (frame) frame.src = "about:blank"; // stop the prototype's JS/audio/timers once closed
}

/* ------------------------------------------------------------------ */
/* Details modal (single instance, shared across every feature)        */
/* ------------------------------------------------------------------ */

let modalWired = false;

function ensureModal() {
  const modal = document.getElementById("csModal");
  const title = document.getElementById("csModalTitle");
  const tabs = document.getElementById("csModalTabs");
  const body = document.getElementById("csModalBody");
  const downloadTab = document.getElementById("csModalDownloadTab");
  const downloadFeature = document.getElementById("csModalDownloadFeature");
  const downloadReport = document.getElementById("csModalDownloadReport");
  if (!modal || !title || !tabs || !body) return null;
  if (!modalWired) {
    modalWired = true;
    document.getElementById("csModalClose")?.addEventListener("click", () => closeModal(modal));
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeModal(modal);
    });
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !modal.hidden) closeModal(modal);
    });
  }
  return { modal, title, tabs, body, downloadTab, downloadFeature, downloadReport };
}

// Prints arbitrary markup by swapping it into the modal body, invoking the
// browser's print dialog (no PDF library in the project — this is the
// "Save as PDF" path), then restoring whatever was showing before.
function printMarkup(body: HTMLElement, markup: string) {
  const restore = body.innerHTML;
  body.innerHTML = markup;
  window.print();
  body.innerHTML = restore;
}

function featurePrintMarkup(feature: CaseStudyFeature): string {
  return `<h2 class="cs-print__feature-title">${feature.title}</h2>${TAB_DEFS.map(
    (t) => `<section class="cs-print__block"><h3>${t.label}</h3>${renderTabBody(t.key, feature.details)}</section>`
  ).join("")}`;
}

function reportPrintMarkup(cs: CaseStudy): string {
  return cs.features.map((f) => `<article class="cs-print__report-feature">${featurePrintMarkup(f)}</article>`).join("");
}

function closeModal(modal: HTMLElement) {
  modal.hidden = true;
  document.documentElement.classList.remove("cs-modal-open");
}

function renderTabBody(key: TabKey, details: FeatureDetails): string {
  switch (key) {
    case "problemAnalysis":
      return `<div class="cs-tab cs-tab--prose">${details.problemAnalysis
        .map((p) => `<p>${p}</p>`)
        .join("")}</div>`;
    case "userResearch":
      return `<div class="cs-tab cs-tab--quotes">${details.userResearch
        .map((q) => `<blockquote class="cs-quote"><p>"${q.text}"</p><cite>${q.person}</cite></blockquote>`)
        .join("")}${
        details.researchStats && details.researchStats.length
          ? `<ul class="cs-stat-list">${details.researchStats.map((s) => `<li>${s}</li>`).join("")}</ul>`
          : ""
      }</div>`;
    case "personas":
      return `<div class="cs-tab cs-tab--personas">${details.personas
        .map(
          (p) => `
        <div class="cs-persona">
          <div class="cs-persona__head"><b>${p.name}</b><span>${p.role}</span></div>
          <p><b>Goal</b>${p.goal}</p>
          <p><b>Pain point</b>${p.painPoint}</p>
        </div>`
        )
        .join("")}</div>`;
    case "journey": {
      const map = details.empathyMap;
      return `<div class="cs-tab cs-tab--journey">${details.journey
        .map(
          (j) => `
        <div class="cs-journey-step cs-journey-step--${j.feeling}">
          <span class="cs-journey-step__stage">${j.stage}</span>
          <span class="cs-journey-step__feeling">${j.feeling}</span>
          <p>${j.note}</p>
        </div>`
        )
        .join("")}${
        map
          ? `<div class="cs-empathy">
              <span class="cs-empathy__title">Empathy map</span>
              <div class="cs-empathy__grid">
                <div><b>Says</b><p>${map.says}</p></div>
                <div><b>Thinks</b><p>${map.thinks}</p></div>
                <div><b>Feels</b><p>${map.feels}</p></div>
                <div><b>Does</b><p>${map.does}</p></div>
              </div>
            </div>`
          : ""
      }</div>`;
    }
    case "process":
      return `<div class="cs-tab cs-tab--process">${details.process
        .map(
          (s, i) => `
        <div class="cs-process-step">
          <span class="cs-process-step__num">${String(i + 1).padStart(2, "0")}</span>
          <div><b>${s.stage}</b><p>${s.note}</p></div>
        </div>`
        )
        .join("")}</div>`;
    case "metrics":
      return `<div class="cs-tab cs-tab--metrics">${details.metrics
        .map((m) => `<div class="cs-metric"><b>${m.value}</b><span>${m.label}</span></div>`)
        .join("")}</div>`;
  }
}

function openDetail(cs: CaseStudy, feature: CaseStudyFeature) {
  const refs = ensureModal();
  if (!refs) return;
  const { modal, title, tabs, body, downloadTab, downloadFeature, downloadReport } = refs;
  title.textContent = feature.title;

  let activeKey: TabKey = "problemAnalysis";

  function paint() {
    tabs.innerHTML = TAB_DEFS.map(
      (t) =>
        `<button type="button" class="cs-modal__tab${
          t.key === activeKey ? " is-active" : ""
        }" data-tab="${t.key}">${t.label}</button>`
    ).join("");
    body.innerHTML = renderTabBody(activeKey, feature.details);
    tabs.querySelectorAll<HTMLButtonElement>("[data-tab]").forEach((btn) => {
      btn.addEventListener("click", () => {
        activeKey = btn.dataset.tab as TabKey;
        paint();
      });
    });
  }
  paint();

  modal.hidden = false;
  document.documentElement.classList.add("cs-modal-open");

  // Three download tiers — no PDF library in the project, so all three hand
  // off to the browser's own Print → Save as PDF; a print stylesheet
  // isolates the modal, and each button swaps in the right scope of content
  // just for the print, then restores the on-screen tab view.
  if (downloadTab) downloadTab.onclick = () => window.print();
  if (downloadFeature) downloadFeature.onclick = () => printMarkup(body, featurePrintMarkup(feature));
  if (downloadReport) downloadReport.onclick = () => printMarkup(body, reportPrintMarkup(cs));
}

/* ------------------------------------------------------------------ */
/* Wiring: marker-driven feature switching in the persistent frame      */
/* ------------------------------------------------------------------ */

export function wireRichCaseStudy(panelRoot: HTMLElement, cs: CaseStudy, projectSeed: number) {
  const track = panelRoot.querySelector<HTMLElement>("[data-feature-track]");
  const fixedFrame = panelRoot.querySelector<HTMLElement>("[data-feature-fixed]");
  if (!track || !fixedFrame) return;

  const markers = Array.from(track.querySelectorAll<HTMLElement>("[data-feature-marker]"));
  const screen = fixedFrame.querySelector<HTMLElement>("[data-feature-screen]")!;
  const stepsEl = fixedFrame.querySelector<HTMLElement>("[data-feature-steps]")!;
  const counterEl = fixedFrame.querySelector<HTMLElement>("[data-feature-counter]")!;
  const titleEl = fixedFrame.querySelector<HTMLElement>("[data-feature-title]")!;
  const statementEl = fixedFrame.querySelector<HTMLElement>("[data-feature-statement]")!;
  const textEl = fixedFrame.querySelector<HTMLElement>("[data-feature-text]")!;
  const frame = fixedFrame.querySelector<HTMLElement>(".cs-feat__frame")!;
  const expBtn = fixedFrame.querySelector<HTMLButtonElement>(".cs-feat__experience")!;
  const detailBtn = fixedFrame.querySelector<HTMLButtonElement>("[data-feature-detail]")!;
  const switchBtns = Array.from(fixedFrame.querySelectorAll<HTMLButtonElement>(".cs-feat__switch-btn"));
  const protoIframe = screen.querySelector<HTMLIFrameElement>("[data-screen-proto]");
  const [layerA, layerB] = Array.from(screen.querySelectorAll<HTMLElement>("[data-screen-layer]"));

  const n = cs.features.length;
  let activeIndex = -1;
  let paintToken = 0;

  // The live preview iframe is authored at a fixed "native" phone size and
  // scaled down to whatever the device frame currently renders at, so it
  // stays crisp instead of being squeezed by width/height alone.
  const PROTO_W = 390;
  const PROTO_H = 844;
  function scaleProto() {
    if (!protoIframe) return;
    const box = screen.getBoundingClientRect();
    const scale = Math.max(box.width / PROTO_W, box.height / PROTO_H);
    protoIframe.style.transform = `scale(${scale})`;
  }
  if (protoIframe) {
    scaleProto();
    window.addEventListener("resize", scaleProto);
  }

  function setBreakpoint(bp: string) {
    switchBtns.forEach((b) => b.classList.toggle("is-active", b.dataset.bp === bp));
    frame.setAttribute("data-bp", bp);
    if (protoIframe) requestAnimationFrame(scaleProto); // frame size just changed
  }

  // Each step in a feature's walkthrough gets its own generated screen — the
  // device visibly moves through the app rather than just narrating text
  // over one static image, and any step is click-through-able on its own.
  // (Skipped entirely for a project with a real prototype — see protoIframe
  // above — where the same live preview sits behind every step instead.)
  let stepImages: string[] = [];
  let frontLayer: HTMLElement | undefined = layerA;
  let backLayer: HTMLElement | undefined = layerB;

  function setScreen(url: string, animate: boolean) {
    if (!frontLayer || !backLayer) return;
    if (!animate) {
      frontLayer.style.backgroundImage = `url('${url}')`;
      frontLayer.style.opacity = "1";
      backLayer.style.opacity = "0";
      return;
    }
    backLayer.style.backgroundImage = `url('${url}')`;
    backLayer.style.opacity = "1";
    frontLayer.style.opacity = "0";
    const swap = frontLayer;
    frontLayer = backLayer;
    backLayer = swap;
  }

  function setStepState(activeStep: number) {
    const steps = Array.from(stepsEl.querySelectorAll<HTMLElement>(".cs-feat__step"));
    steps.forEach((s, si) => {
      s.classList.toggle("is-active", si === activeStep);
      s.classList.toggle("is-done", si < activeStep);
    });
  }

  function fillContent(i: number) {
    const f = cs.features[i];
    counterEl.textContent = `${String(i + 1).padStart(2, "0")} / ${String(n).padStart(2, "0")}`;
    titleEl.textContent = f.title;
    statementEl.textContent = f.designStatement;
    textEl.innerHTML = f.explanation.map((p) => `<p>${p}</p>`).join("");
    if (!protoIframe) {
      stepImages = f.experienceSteps.map((_, si) => wireframeCover(projectSeed + i * 41 + si * 13 + 7));
      setScreen(stepImages[0], false);
    }
    stepsEl.innerHTML = f.experienceSteps
      .map(
        (s, si) =>
          `<div class="cs-feat__step" data-step="${si}"><span class="cs-feat__step-dot" aria-hidden="true"></span>${s}</div>`
      )
      .join("");
    setStepState(0);
    expBtn.classList.remove("is-running");
    setBreakpoint("mobile");
  }

  // Dim the text/steps briefly, swap the content underneath, fade back in —
  // so a feature change reads as a deliberate beat, not an abrupt jump cut.
  function paint(i: number, immediate = false) {
    if (i === activeIndex) return;
    activeIndex = i;
    const token = ++paintToken;
    if (immediate) {
      fillContent(i);
      return;
    }
    fixedFrame!.classList.add("is-changing");
    window.setTimeout(() => {
      if (token !== paintToken) return; // a newer paint() superseded this one
      fillContent(i);
      fixedFrame!.classList.remove("is-changing");
    }, 220);
  }

  // ---- controls (wired once — they always act on the active feature) ----
  switchBtns.forEach((btn) => {
    btn.addEventListener("click", () => setBreakpoint(btn.dataset.bp || "mobile"));
  });

  // "Experience" auto-plays through every step, the screen genuinely
  // changing at each one — a walkthrough of the app, not a caption reel.
  // (Skipped for projects with a real prototype — see cs.prototypeUrl below,
  // where "Experience" opens that instead.)
  if (!cs.prototypeUrl) {
    expBtn.addEventListener("click", () => {
      if (expBtn.classList.contains("is-running")) return;
      expBtn.classList.add("is-running");
      let i = 0;
      const step = () => {
        if (!expBtn.classList.contains("is-running")) return; // interrupted (e.g. a manual step click)
        if (i >= stepImages.length) {
          expBtn.classList.remove("is-running");
          return;
        }
        setStepState(i);
        setScreen(stepImages[i], true);
        i++;
        window.setTimeout(step, 900);
      };
      step();
    });
  }

  // Click-through: tap any step to jump the screen straight to it, like
  // scrubbing a prototype by hand instead of only watching it auto-play.
  stepsEl.addEventListener("click", (e) => {
    const stepEl = (e.target as HTMLElement).closest<HTMLElement>(".cs-feat__step");
    if (!stepEl) return;
    expBtn.classList.remove("is-running");
    const si = Number(stepEl.dataset.step || 0);
    setStepState(si);
    setScreen(stepImages[si], true);
  });

  detailBtn.addEventListener("click", () => {
    if (activeIndex >= 0) openDetail(cs, cs.features[activeIndex]);
  });

  // A project with a real prototype experiences it in full, not through the
  // simulated step screens — "Experience" opens it life-size instead.
  if (cs.prototypeUrl) {
    const url = cs.prototypeUrl;
    expBtn.addEventListener("click", () => openPrototype(url));
  }

  // ---- reduced motion: no scroll-jacking, static frame + manual step ----
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion || !("IntersectionObserver" in window)) {
    fixedFrame.hidden = false;
    fixedFrame.classList.add("cs-feat-fixed--static");
    paint(0, true);
    const nextBtn = document.createElement("button");
    nextBtn.type = "button";
    nextBtn.className = "cs-feat__next";
    nextBtn.textContent = "Next feature →";
    nextBtn.addEventListener("click", () => paint((activeIndex + 1) % n, true));
    fixedFrame.querySelector(".cs-feat__info")?.appendChild(nextBtn);
    return;
  }

  // ---- scroll-driven: which marker is nearest the viewport centre ----
  const markerIO = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const idx = Number((entry.target as HTMLElement).dataset.featureMarker || 0);
          paint(idx);
        }
      });
    },
    { threshold: 0, rootMargin: "-49% 0px -49% 0px" }
  );
  markers.forEach((m) => markerIO.observe(m));

  // ---- show/hide the whole frame as the track enters/exits view ----
  const trackIO = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        fixedFrame.hidden = !entry.isIntersecting;
      });
    },
    { threshold: 0 }
  );
  trackIO.observe(track);

  paint(0, true);
}
