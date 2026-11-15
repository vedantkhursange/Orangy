"use client";

import { useEffect, useRef } from "react";

/**
 * Black backdrop with depth: a faint perspective grid (floor and ceiling), a
 * soft neutral light in the middle of the room, and fine dust at two depths.
 * Everything moves by transform only, so nothing repaints while scrolling.
 */
export default function AmbientBackground() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      // the grid repeats every 64px, so wrapping the offset is seamless
      raf = requestAnimationFrame(() => {
        el.style.setProperty("--grid-shift", `${(window.scrollY * 0.25) % 64}px`);
        // each dust layer wraps on its own tile height, so the loop is seamless
        el.style.setProperty("--dust-far", `${(window.scrollY * 0.06) % 260}px`);
        el.style.setProperty("--dust-near", `${(window.scrollY * 0.14) % 400}px`);
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <div ref={ref} aria-hidden className="ambient pointer-events-none fixed inset-0 -z-10 overflow-hidden print:hidden">
      <div className="ambient-plane ambient-floor">
        <div className="ambient-grid" />
      </div>
      <div className="ambient-plane ambient-ceiling">
        <div className="ambient-grid" />
      </div>
      <div className="ambient-fade" />
      <div className="ambient-dust is-far" />
      <div className="ambient-dust is-near" />
    </div>
  );
}
