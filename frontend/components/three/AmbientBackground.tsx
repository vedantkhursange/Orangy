"use client";

import { useEffect, useRef } from "react";

/**
 * Pure black backdrop with a faint perspective grid (floor and ceiling) that
 * drifts with scroll, to give the page a sense of 3D space. One element, one
 * transform: nothing here repaints while scrolling.
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
      raf = requestAnimationFrame(() => el.style.setProperty("--grid-shift", `${(window.scrollY * 0.25) % 64}px`));
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
    </div>
  );
}
