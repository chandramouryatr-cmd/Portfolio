// Black liquid intro curtain for the hero.
//
// States: covered -> collecting -> collected
// - covered: liquid fully tiles the hero, ambient mouse-repel ripple, page scroll locked.
//   The headline's second line is collapsed to zero height — nothing to reveal yet.
// - collecting: clicking the button converges every particle onto it and drains the liquid.
//   The headline text reveals immediately (line 2 unfurls open); the rest of the page
//   (sub-text, nav, "see the work") follows shortly after, once the headline has landed.
// - collected: once the last particle lands, the button retires (scales and fades out —
//   its job is done) and the underline draws in after a short pause.

interface Particle {
  x: number;
  y: number;
  ox: number;
  oy: number;
  vx: number;
  vy: number;
  s: number;
}

export interface FluidConfig {
  ambientRadius: number;
  ambientForce: number;
  ambientForceScale: number;
  ambientSpring: number;
  ambientDamping: number;
  collectAccel: number;
  collectDamping: number;
  collectSpeed: number;
  revealBandTop: number;
  revealBandBottom: number;
}

export const defaultFluidConfig: FluidConfig = {
  ambientRadius: 255,
  ambientForce: 30,
  ambientForceScale: 0.15,
  ambientSpring: 0.045,
  ambientDamping: 0.82,
  collectAccel: 0.7,
  collectDamping: 0.93,
  collectSpeed: 2,
  revealBandTop: 64,
  revealBandBottom: 22,
};

export function initLiquidCurtain(config: FluidConfig = defaultFluidConfig) {
  const canvas = document.getElementById("bg-canvas") as HTMLCanvasElement | null;
  const shine = document.getElementById("liquid-shine") as HTMLElement | null;
  const grid = document.getElementById("hero-grid") as HTMLElement | null;
  const cta = document.getElementById("heroCta") as HTMLButtonElement | null;
  const hero = document.querySelector<HTMLElement>(".hero");
  if (!canvas || !cta || !hero) return;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  let W = 0;
  let H = 0;
  let particles: Particle[] = [];
  let state: "covered" | "collecting" | "collected" = "covered";
  const mouse = { x: -9999, y: -9999 };
  // Measure the text wrapper, not the underline itself — its own rect collapses
  // to zero width while scaleX(0) is applied, which would make hit-testing stick at 0.
  const underlineWrap = hero.querySelector<HTMLElement>(".hl-line2-text");
  let underlineReveal = 0;
  let shineX = 32;
  let shineY = 22;
  let gridX = 0;
  let gridY = 0;

  function updateGridParallax() {
    if (!grid || W === 0 || H === 0) return;
    let targetX = 0;
    let targetY = 0;
    if (mouse.x > -9000) {
      targetX = (mouse.x / W - 0.5) * -22;
      targetY = (mouse.y / H - 0.5) * -22;
    }
    gridX += (targetX - gridX) * 0.05;
    gridY += (targetY - gridY) * 0.05;
    grid.style.setProperty("--grid-x", `${gridX.toFixed(2)}px`);
    grid.style.setProperty("--grid-y", `${gridY.toFixed(2)}px`);
  }

  function updateShine() {
    if (!shine || W === 0 || H === 0) return;
    const idleX = 32;
    const idleY = 22;
    let targetX = idleX;
    let targetY = idleY;
    if (mouse.x > -9000) {
      targetX = Math.min(78, Math.max(10, (mouse.x / W) * 100));
      targetY = Math.min(70, Math.max(8, (mouse.y / H) * 100));
    }
    shineX += (targetX - shineX) * 0.08;
    shineY += (targetY - shineY) * 0.08;
    shine.style.setProperty("--shine-x", `${shineX}%`);
    shine.style.setProperty("--shine-y", `${shineY}%`);
  }

  document.documentElement.classList.add("scroll-locked");

  let spacing = 12;

  function baseSize() {
    return spacing * 1.6;
  }

  function build() {
    particles = [];
    const area = W * H;
    const targetCount = 7000;
    spacing = Math.max(9, Math.sqrt(area / targetCount));
    const size = baseSize();
    for (let y = spacing / 2; y < H; y += spacing) {
      for (let x = spacing / 2; x < W; x += spacing) {
        particles.push({ x, y, ox: x, oy: y, vx: 0, vy: 0, s: size });
      }
    }
  }

  function resize() {
    const rect = hero!.getBoundingClientRect();
    W = rect.width;
    H = rect.height;
    canvas!.width = W * dpr;
    canvas!.height = H * dpr;
    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (state === "covered") build();
  }

  function targetPoint() {
    const r = cta!.getBoundingClientRect();
    const h = hero!.getBoundingClientRect();
    return { x: r.left - h.left + r.width / 2, y: r.top - h.top + r.height / 2 };
  }

  function onPointerMove(e: PointerEvent) {
    const r = hero!.getBoundingClientRect();
    mouse.x = e.clientX - r.left;
    mouse.y = e.clientY - r.top;
  }
  function onPointerLeave() {
    mouse.x = -9999;
    mouse.y = -9999;
  }

  function paintUnderline(mx: number, my: number) {
    if (!underlineWrap) return;
    const ur = underlineWrap.getBoundingClientRect();
    const hr = hero!.getBoundingClientRect();
    const left = ur.left - hr.left;
    const width = ur.width;
    if (width <= 0) return;
    const top = ur.top - hr.top - config.revealBandTop;
    const bottom = ur.bottom - hr.top + config.revealBandBottom;
    if (my < top || my > bottom) return;
    const p = Math.max(0, Math.min(1, (mx - left) / width));
    if (p > underlineReveal) {
      underlineReveal = p;
      underlineWrap.style.setProperty("--underline-reveal", String(underlineReveal));
    }
  }

  function revealUnderlineFully() {
    if (!underlineWrap) return;
    underlineReveal = 1;
    underlineWrap.style.setProperty("--underline-reveal", "1");
  }

  function revealText() {
    hero!.classList.add("is-text-revealed");
  }

  function revealRest() {
    hero!.classList.add("is-revealed");
    document.documentElement.classList.remove("scroll-locked");
    // The rest of the page (Work section pin, scroll reveals) was laid out
    // against the scroll-locked viewport. Tell listeners to recompute now
    // that the real document height is available.
    window.dispatchEvent(new CustomEvent("hero:revealed"));
  }

  // Visually retires the button (crossfades out as the text crossfades in) —
  // kept in the layout (not hidden) so the still-draining particles have a
  // valid target to converge on until the liquid actually finishes.
  function retireButtonVisually() {
    cta!.classList.add("is-retiring");
  }

  // Only safe to remove from the layout once collection is truly done.
  function finalizeButtonRemoval() {
    cta!.hidden = true;
    hero!.classList.add("is-settled");
  }

  function startCollecting() {
    if (state !== "covered") return;
    state = "collecting";
    hero!.classList.add("is-draining");
    // Foreground reveal runs on its own fast timeline — text, then underline,
    // then the rest of the page — independent of how long the liquid takes
    // to finish draining in the background.
    revealText();
    retireButtonVisually();
    if (reduceMotion) {
      particles = [];
      state = "collected";
      finalizeButtonRemoval();
      revealUnderlineFully();
      revealRest();
    } else {
      window.setTimeout(revealUnderlineFully, 550);
      window.setTimeout(revealRest, 1100);
    }
  }

  cta.addEventListener("click", () => {
    if (state === "covered") startCollecting();
  });

  // Pointer Events unify mouse and touch: on a touch device this only fires
  // while a finger is actually down and dragging (there's no hover), which
  // is exactly the trigger we want there — drag to push the liquid instead
  // of hovering to push it.
  if (!reduceMotion) {
    window.addEventListener("pointermove", onPointerMove);
    hero.addEventListener("pointerleave", onPointerLeave);
    hero.addEventListener("pointerup", onPointerLeave);
    hero.addEventListener("pointercancel", onPointerLeave);
  }
  window.addEventListener("resize", resize);

  function frame() {
    requestAnimationFrame(frame);
    if (W === 0 || H === 0) return;
    ctx!.clearRect(0, 0, W, H);
    ctx!.fillStyle = "#0a0a0a";
    updateShine();
    if (!reduceMotion) updateGridParallax();

    if (state === "collecting") {
      // Sub-steps per frame control drain speed (2 ~= drains in half the time).
      const steps = Math.max(1, Math.round(config.collectSpeed));
      for (let step = 0; step < steps; step++) {
        const t = targetPoint();
        for (let i = particles.length - 1; i >= 0; i--) {
          const p = particles[i];
          const dx = t.x - p.x;
          const dy = t.y - p.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 10) {
            particles.splice(i, 1);
            continue;
          }
          p.vx += (dx / d) * config.collectAccel;
          p.vy += (dy / d) * config.collectAccel;
          p.vx *= config.collectDamping;
          p.vy *= config.collectDamping;
          p.x += p.vx;
          p.y += p.vy;
          p.s = Math.max(1.5, baseSize() * Math.min(1, d / 130));
        }
      }
      if (particles.length === 0) {
        state = "collected";
        // The button already retired visually when clicked — now that the
        // liquid has actually finished draining, it's safe to drop it from
        // the layout for good.
        finalizeButtonRemoval();
      }
    } else if (state === "collected" && !reduceMotion) {
      if (mouse.x > -9000) {
        paintUnderline(mouse.x, mouse.y);
      }
    } else if (state === "covered" && !reduceMotion) {
      for (const p of particles) {
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        const radius = config.ambientRadius;
        if (d < radius && d > 0.01) {
          const f = (1 - d / radius) * config.ambientForce;
          p.vx += (dx / d) * f * config.ambientForceScale;
          p.vy += (dy / d) * f * config.ambientForceScale;
        }
        p.vx += (p.ox - p.x) * config.ambientSpring;
        p.vy += (p.oy - p.y) * config.ambientSpring;
        p.vx *= config.ambientDamping;
        p.vy *= config.ambientDamping;
        p.x += p.vx;
        p.y += p.vy;
      }
    }

    for (const p of particles) {
      ctx!.beginPath();
      ctx!.arc(p.x, p.y, p.s / 2, 0, Math.PI * 2);
      ctx!.fill();
    }
  }

  resize();
  frame();
}
