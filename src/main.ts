import "./style.css";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { initVacuumIntro } from "./vacuumIntro";
import { initCursor } from "./cursor";
import { initWorkStage } from "./work";
import { projects, skills } from "./data";

gsap.registerPlugin(ScrollTrigger);

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------------------------------------------------------------- */
/* Hero entrance: "A Good Disappears" vacuum intro                   */
/* ---------------------------------------------------------------- */
initVacuumIntro();

/* ---------------------------------------------------------------- */
/* Custom cursor                                                     */
/* ---------------------------------------------------------------- */
initCursor();

/* ---------------------------------------------------------------- */
/* Smooth scroll (Lenis <-> GSAP ticker)                             */
/* ---------------------------------------------------------------- */
let lenis: Lenis | null = null;
if (!reduceMotion) {
  lenis = new Lenis({ duration: 1.1, smoothWheel: true });
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((time) => lenis!.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}

/* In-page anchor links: Lenis owns scroll position, so native anchor
   jumps get fought and reverted on the next raf tick unless routed
   through lenis.scrollTo() (or scrollIntoView when motion is reduced). */
document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach((link) => {
  link.addEventListener("click", (e) => {
    const href = link.getAttribute("href");
    if (!href || href.length < 2) return;
    const target = document.querySelector<HTMLElement>(href);
    if (!target) return;
    e.preventDefault();
    if (lenis) {
      lenis.scrollTo(target, { offset: -16 });
    } else {
      target.scrollIntoView({ behavior: "auto", block: "start" });
    }
    history.pushState(null, "", href);
  });
});

/* ---------------------------------------------------------------- */
/* Nav scroll state                                                  */
/* ---------------------------------------------------------------- */
const nav = document.querySelector(".nav");
ScrollTrigger.create({
  start: 0,
  end: 99999,
  onUpdate: (self) => {
    const y = self.scroll();
    nav?.classList.toggle("is-scrolled", y > 40);
    // Hide while scrolling down, reveal while scrolling up; always show near top.
    let hidden: boolean;
    if (y < 90) hidden = false;
    else hidden = self.direction === 1;
    nav?.classList.toggle("is-hidden", hidden);
    // Mirrored onto <html> so chrome elsewhere (e.g. the story's "previous
    // project" control) can close the gap the header leaves when it's gone,
    // and reopen it the moment the header comes back.
    document.documentElement.classList.toggle("nav-hidden", hidden);
  },
});

/* ---------------------------------------------------------------- */
/* Work: full-screen scroll-pinned project story + card overview     */
/* ---------------------------------------------------------------- */
initWorkStage(projects, lenis);

/* The hero starts `scroll-locked` (html+body clamped to 100% / overflow
   hidden), so both Lenis and ScrollTrigger cache a document that's only one
   viewport tall — Lenis ends up with `limit: 0` and nothing scrolls. Re-measure
   both once the hero unlocks, and again after web fonts settle. (work.ts also
   listens for `hero:revealed` to re-measure its own scroll ranges.) */
function remeasureScroll() {
  lenis?.resize();
  ScrollTrigger.refresh();
}
window.addEventListener("hero:revealed", () => {
  // Once now, and once more after the `.is-revealed` transition settles.
  remeasureScroll();
  setTimeout(remeasureScroll, 260);
});
document.fonts?.ready.then(remeasureScroll);

/* ---------------------------------------------------------------- */
/* Render about skills                                               */
/* ---------------------------------------------------------------- */
const skillsList = document.getElementById("aboutSkills");
if (skillsList) {
  skillsList.innerHTML = skills.map((s) => `<span class="skill-pill">${s}</span>`).join("");
}

/* ---------------------------------------------------------------- */
/* Scroll-triggered reveals                                          */
/* ---------------------------------------------------------------- */
function reveal(selector: string, opts: gsap.TweenVars = {}) {
  const els = gsap.utils.toArray<HTMLElement>(selector);
  els.forEach((el, i) => {
    gsap.to(el, {
      opacity: 1,
      y: 0,
      duration: reduceMotion ? 0.01 : 0.9,
      ease: "power3.out",
      delay: reduceMotion ? 0 : (i % 6) * 0.08,
      scrollTrigger: {
        trigger: el,
        start: "top 88%",
        once: true,
      },
      ...opts,
    });
  });
}

reveal(".about__figure");
reveal(".skill-pill");

/* Contact headline */
reveal(".contact__headline, .contact__mail, .contact__socials");
