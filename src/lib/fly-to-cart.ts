// Fly-to-cart animation utility.
// Uses Web Animations API — respects prefers-reduced-motion automatically by
// shortening duration; also no layout thrash. Target = element with id="cart-icon-target".
export function flyToCart(source: HTMLElement | null) {
  if (typeof window === "undefined" || !source) return;
  const target = document.getElementById("cart-icon-target");
  if (!target) return;

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const sRect = source.getBoundingClientRect();
  const tRect = target.getBoundingClientRect();

  const sx = sRect.left + sRect.width / 2;
  const sy = sRect.top + sRect.height / 2;
  const tx = tRect.left + tRect.width / 2;
  const ty = tRect.top + tRect.height / 2;

  const ball = document.createElement("div");
  ball.setAttribute("aria-hidden", "true");
  ball.style.cssText = `
    position: fixed;
    left: ${sx - 10}px;
    top: ${sy - 10}px;
    width: 20px;
    height: 20px;
    border-radius: 9999px;
    background: var(--accent);
    box-shadow: 0 6px 20px -6px var(--accent);
    z-index: 9999;
    pointer-events: none;
    will-change: transform, opacity;
  `;
  document.body.appendChild(ball);

  const dx = tx - sx;
  const dy = ty - sy;
  const duration = reduce ? 120 : 420;

  const anim = ball.animate(
    [
      { transform: "translate(0,0) scale(1)", opacity: 1 },
      { transform: `translate(${dx * 0.6}px, ${dy - 60}px) scale(0.9)`, opacity: 0.9, offset: 0.6 },
      { transform: `translate(${dx}px, ${dy}px) scale(0.2)`, opacity: 0 },
    ],
    { duration, easing: "cubic-bezier(0.22, 0.61, 0.36, 1)", fill: "forwards" }
  );
  anim.onfinish = () => {
    ball.remove();
    // Little bump on cart icon
    target.animate(
      [{ transform: "scale(1)" }, { transform: "scale(1.2)" }, { transform: "scale(1)" }],
      { duration: reduce ? 100 : 260, easing: "ease-out" }
    );
  };
}
