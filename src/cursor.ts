export function initCursor() {
  const dot = document.getElementById("cursorDot");
  if (!dot) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion || window.matchMedia("(hover: none)").matches) return;

  document.documentElement.classList.add("custom-cursor");

  let raf = 0;

  window.addEventListener("pointermove", (e) => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      dot.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
    });
  });

  const interactiveSelector = "a, button, .card";
  document.addEventListener("mouseover", (e) => {
    const target = e.target as HTMLElement;
    if (target.closest(interactiveSelector)) {
      dot.classList.add("is-active");
    }
  });
  document.addEventListener("mouseout", (e) => {
    const target = e.target as HTMLElement;
    if (target.closest(interactiveSelector)) {
      dot.classList.remove("is-active");
    }
  });
}
