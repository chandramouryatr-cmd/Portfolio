// "A Good Disappears" — the site's entrance ritual, replacing the old
// liquid curtain. A deliberately bad, 90s-web scene (name/projects/resume/
// contact badges wandering the screen, bouncing off a static centre block)
// that the visitor has to physically clean up: drag a vacuum in, flip its
// switch. Everything gets sucked away — except the centre block, which
// shrinks and travels into the header instead, becoming the real nav logo.
// The joke only works if it's provable: good design is what's left once the
// bad stuff is gone.

interface Junk {
  el: HTMLElement;
  x: number;
  y: number;
  vx: number;
  vy: number;
  w: number;
  h: number;
  // A slow, periodically re-picked "wander toward" velocity — current
  // velocity eases toward it each frame, which reads as aimless drifting
  // rather than a mechanical bounce loop.
  tvx: number;
  tvy: number;
}

const SPEED = 70; // px/s baseline
const RETARGET_MS = 1700;
const VACUUM_W = 108;
const VACUUM_H = 128;

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

export function initVacuumIntro() {
  const hero = document.querySelector<HTMLElement>(".hero");
  const intro = document.getElementById("vacuumIntro");
  const junkEls = Array.from(document.querySelectorAll<HTMLElement>("[data-junk]"));
  const tagline = document.getElementById("vacuumTagline");
  const taglineOld = document.querySelector<HTMLElement>("[data-tagline-old]");
  const taglineNew = document.querySelector<HTMLElement>("[data-tagline-new]");
  const vacuum = document.getElementById("vacuum");
  const vacuumBody = document.querySelector<HTMLElement>("[data-vacuum-drag]");
  const vacuumSwitch = document.getElementById("vacuumSwitch") as HTMLButtonElement | null;
  const navLogo = document.querySelector<HTMLElement>(".nav__logo");

  if (
    !hero ||
    !intro ||
    !tagline ||
    !taglineOld ||
    !taglineNew ||
    !vacuum ||
    !vacuumBody ||
    !vacuumSwitch ||
    !navLogo ||
    junkEls.length === 0
  ) {
    return;
  }

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Reduced motion: skip the whole chase — straight to the real page, same
  // as the liquid curtain's own accessibility fallback used to.
  if (reduceMotion) {
    intro.hidden = true;
    document.documentElement.classList.remove("scroll-locked");
    hero.classList.add("is-text-revealed", "is-revealed", "is-settled");
    window.dispatchEvent(new CustomEvent("hero:revealed"));
    return;
  }

  document.documentElement.classList.add("scroll-locked", "intro-active");

  let W = window.innerWidth;
  let H = window.innerHeight;
  function measure() {
    W = window.innerWidth;
    H = window.innerHeight;
  }
  window.addEventListener("resize", measure);

  let state: "playing" | "sucking" | "done" = "playing";
  const retargetTimers: number[] = [];

  /* ---------------------------------------------------------------- */
  /* Junk: scattered start positions, gentle random-walk drift          */
  /* ---------------------------------------------------------------- */
  const junk: Junk[] = junkEls.map((el, i) => {
    const rect = el.getBoundingClientRect();
    const w = rect.width || 120;
    const h = rect.height || 40;
    const angle = (i / junkEls.length) * Math.PI * 2 + Math.random() * 0.8;
    const radius = Math.min(W, H) * 0.32;
    const x = clamp(W / 2 + Math.cos(angle) * radius - w / 2, 8, Math.max(8, W - w - 8));
    const y = clamp(H / 2 + Math.sin(angle) * radius - h / 2, 8, Math.max(8, H - h - 8));
    const a = Math.random() * Math.PI * 2;
    const vx = Math.cos(a) * SPEED;
    const vy = Math.sin(a) * SPEED;
    return { el, x, y, vx, vy, w, h, tvx: vx, tvy: vy };
  });

  function retarget(j: Junk) {
    const a = Math.random() * Math.PI * 2;
    const s = SPEED * (0.6 + Math.random() * 0.8);
    j.tvx = Math.cos(a) * s;
    j.tvy = Math.sin(a) * s;
  }
  junk.forEach((j) => {
    retargetTimers.push(window.setInterval(() => retarget(j), RETARGET_MS + Math.random() * 900));
  });

  /* ---------------------------------------------------------------- */
  /* Vacuum: a draggable prop (Pointer Events unify mouse + touch drag) */
  /* ---------------------------------------------------------------- */
  // Leaves clearance below for the hint text (~110px of height + spacing)
  // so the vacuum doesn't spawn sitting on top of it.
  let vx = W / 2 - VACUUM_W / 2;
  let vy = Math.max(H * 0.4, H - VACUUM_H - 110);
  let dragging = false;
  let dragOffX = 0;
  let dragOffY = 0;

  function setVacuumPos(x: number, y: number) {
    vx = clamp(x, 4, Math.max(4, W - VACUUM_W - 4));
    vy = clamp(y, 4, Math.max(4, H - VACUUM_H - 4));
    vacuum!.style.transform = `translate(${vx}px, ${vy}px)`;
  }
  setVacuumPos(vx, vy);

  vacuumBody.addEventListener("pointerdown", (e) => {
    if (state !== "playing") return;
    dragging = true;
    vacuumBody.setPointerCapture(e.pointerId);
    dragOffX = e.clientX - vx;
    dragOffY = e.clientY - vy;
    vacuum!.classList.add("is-dragging");
  });
  vacuumBody.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    setVacuumPos(e.clientX - dragOffX, e.clientY - dragOffY);
  });
  function endDrag() {
    dragging = false;
    vacuum!.classList.remove("is-dragging");
  }
  vacuumBody.addEventListener("pointerup", endDrag);
  vacuumBody.addEventListener("pointercancel", endDrag);

  /* ---------------------------------------------------------------- */
  /* Collision: bounce a junk box off any static/prop rectangle         */
  /* ---------------------------------------------------------------- */
  function bounceOffRect(j: Junk, rx: number, ry: number, rw: number, rh: number) {
    const jr = j.x + j.w;
    const jb = j.y + j.h;
    const rr = rx + rw;
    const rb = ry + rh;
    if (j.x >= rr || jr <= rx || j.y >= rb || jb <= ry) return; // no overlap

    const overlapX = Math.min(jr - rx, rr - j.x);
    const overlapY = Math.min(jb - ry, rb - j.y);
    const jcx = j.x + j.w / 2;
    const jcy = j.y + j.h / 2;
    const rcx = rx + rw / 2;
    const rcy = ry + rh / 2;

    if (overlapX < overlapY) {
      const dir = jcx < rcx ? -1 : 1;
      j.x += overlapX * dir;
      j.vx = Math.abs(j.vx) * dir;
      j.tvx = j.vx;
    } else {
      const dir = jcy < rcy ? -1 : 1;
      j.y += overlapY * dir;
      j.vy = Math.abs(j.vy) * dir;
      j.tvy = j.vy;
    }
  }

  /* ---------------------------------------------------------------- */
  /* Frame loop                                                        */
  /* ---------------------------------------------------------------- */
  let last = performance.now();
  function frame(now: number) {
    if (state === "done") return; // stop rescheduling once the intro is over
    requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (state !== "playing") return;

    const tRect = tagline!.getBoundingClientRect();

    for (const j of junk) {
      j.vx += (j.tvx - j.vx) * 0.02;
      j.vy += (j.tvy - j.vy) * 0.02;
      j.x += j.vx * dt;
      j.y += j.vy * dt;

      if (j.x < 0) {
        j.x = 0;
        j.vx = Math.abs(j.vx);
        j.tvx = j.vx;
      } else if (j.x + j.w > W) {
        j.x = W - j.w;
        j.vx = -Math.abs(j.vx);
        j.tvx = j.vx;
      }
      if (j.y < 0) {
        j.y = 0;
        j.vy = Math.abs(j.vy);
        j.tvy = j.vy;
      } else if (j.y + j.h > H) {
        j.y = H - j.h;
        j.vy = -Math.abs(j.vy);
        j.tvy = j.vy;
      }

      bounceOffRect(j, tRect.left, tRect.top, tRect.width, tRect.height);
      bounceOffRect(j, vx, vy, VACUUM_W, VACUUM_H);

      j.el.style.transform = `translate(${j.x}px, ${j.y}px)`;
    }
  }
  requestAnimationFrame(frame);

  /* ---------------------------------------------------------------- */
  /* Switch flip -> suck-up -> header morph -> reveal                  */
  /* ---------------------------------------------------------------- */
  function startSuckUp() {
    if (state !== "playing") return;
    state = "sucking";
    vacuumSwitch!.classList.add("is-on");
    vacuumSwitch!.disabled = true;
    retargetTimers.forEach((id) => window.clearInterval(id));

    // Roughly the vacuum's mouth: the nozzle at the bottom of the body.
    const nozzleX = vx + VACUUM_W * 0.5;
    const nozzleY = vy + VACUUM_H - 6;

    junk.forEach((j, i) => {
      const dx = nozzleX - (j.x + j.w / 2);
      const dy = nozzleY - (j.y + j.h / 2);
      j.el.style.transition = `transform 0.55s cubic-bezier(.5,0,.85,.4) ${i * 55}ms, opacity 0.4s ease ${
        i * 55 + 180
      }ms`;
      j.el.style.transform = `translate(${j.x + dx}px, ${j.y + dy}px) scale(0.12)`;
      j.el.style.opacity = "0";
    });

    window.setTimeout(morphTagline, 380 + junk.length * 55);
  }

  function morphTagline() {
    const startRect = tagline!.getBoundingClientRect();
    const targetRect = navLogo!.getBoundingClientRect();
    const scale = targetRect.height > 0 ? targetRect.height / startRect.height : 0.4;
    const dx = targetRect.left + targetRect.width / 2 - (startRect.left + startRect.width / 2);
    const dy = targetRect.top + targetRect.height / 2 - (startRect.top + startRect.height / 2);

    tagline!.style.transition = "transform 0.7s cubic-bezier(.4,0,.15,1)";
    tagline!.style.transform = `translate(${dx}px, ${dy}px) scale(${scale})`;
    window.setTimeout(() => tagline!.classList.add("is-morphed"), 260);
    window.setTimeout(finish, 760);
  }

  function finish() {
    state = "done";
    window.removeEventListener("resize", measure);
    document.documentElement.classList.remove("scroll-locked", "intro-active");
    hero!.classList.add("is-text-revealed");
    window.setTimeout(() => hero!.classList.add("is-revealed"), 220);
    window.setTimeout(() => {
      hero!.classList.add("is-settled");
      window.dispatchEvent(new CustomEvent("hero:revealed"));
      intro!.hidden = true;
    }, 650);
  }

  vacuumSwitch.addEventListener("click", startSuckUp);
}
