"use client";

import { useEffect } from "react";

/**
 * Atmosphere behind everything: slow-moving warm light, a soft spotlight that
 * follows the 3D model (position fed by <OrangeStage/> through CSS variables),
 * floating bokeh with scroll parallax, a vignette and film grain. Pure CSS,
 * so it costs almost nothing to render.
 */
const BOKEH = Array.from({ length: 22 }, (_, i) => {
  // deterministic pseudo-random so server and client markup match
  const r = (n: number) => {
    const x = Math.sin(i * 12.9898 + n * 78.233) * 43758.5453;
    return x - Math.floor(x);
  };
  return {
    left: `${(r(1) * 100).toFixed(2)}%`,
    top: `${(r(2) * 100).toFixed(2)}%`,
    size: 4 + r(3) * 22,
    depth: 0.15 + r(4) * 0.85,
    dur: 14 + r(5) * 18,
    delay: -r(6) * 20,
    warm: r(7) > 0.35,
  };
});

export default function AmbientBackground() {
  useEffect(() => {
    const root = document.documentElement;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => root.style.setProperty("--oe-scroll", String(window.scrollY)));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <div aria-hidden className="ambient pointer-events-none fixed inset-0 -z-10 overflow-hidden print:hidden">
      <div className="ambient-aurora ambient-a" />
      <div className="ambient-aurora ambient-b" />
      <div className="ambient-aurora ambient-c" />
      <div className="ambient-rays" />
      <div className="ambient-spot" />
      <div className="ambient-horizon" />
      {BOKEH.map((b, i) => (
        <span
          key={i}
          className={`ambient-bokeh ${b.warm ? "is-warm" : ""}`}
          style={
            {
              left: b.left,
              top: b.top,
              width: b.size,
              height: b.size,
              "--depth": b.depth,
              "--dur": `${b.dur}s`,
              "--delay": `${b.delay}s`,
              filter: `blur(${(1 - b.depth) * 6 + 0.5}px)`,
              opacity: 0.25 + b.depth * 0.5,
            } as React.CSSProperties
          }
        />
      ))}
      <div className="ambient-vignette" />
      <div className="ambient-grain" />
    </div>
  );
}
