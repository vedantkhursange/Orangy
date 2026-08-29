"use client";

import { ReactNode, useEffect } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * Lenis smooth scrolling wired into GSAP's ticker so ScrollTrigger
 * and Lenis share a single clock. Disabled for reduced-motion users.
 */
export default function SmoothScroll({ children }: { children: ReactNode }) {
  useEffect(() => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;

    const lenis = new Lenis({
      // Touch already felt native/responsive — that's because Lenis's own
      // `syncTouch` defaults to false, so touch input was never smoothed at
      // all; the browser's native momentum handles it. `smoothWheel`
      // defaults to true, though, which is what made desktop (trackpad/mouse
      // wheel) feel laggy — every wheel tick was replaced with a Lenis-
      // animated glide. Disabling it makes wheel behave the same way touch
      // already does: instant, native, no animation layered on top.
      smoothWheel: false,
      // Still used for whatever Lenis DOES animate itself — e.g. a
      // programmatic .scrollTo() call — so those aren't a single jump-cut.
      lerp: 0.35,
      touchMultiplier: 1.6,
    });

    lenis.on("scroll", ScrollTrigger.update);

    const tick = (time: number) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
    };
  }, []);

  return <>{children}</>;
}
