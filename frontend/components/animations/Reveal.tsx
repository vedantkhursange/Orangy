"use client";

import { ReactNode, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

type RevealProps = {
  children: ReactNode;
  className?: string;
  /** Seconds of stagger between direct children marked [data-reveal] */
  stagger?: number;
  y?: number;
  delay?: number;
};

/**
 * Scroll-into-view reveal. Animates the wrapper, or — if any descendants
 * carry [data-reveal] — staggers those instead.
 */
export default function Reveal({ children, className, stagger = 0.12, y = 48, delay = 0 }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const items = el.querySelectorAll("[data-reveal]");
      const targets = items.length ? items : el;

      gsap.fromTo(
        targets,
        { autoAlpha: 0, y },
        {
          autoAlpha: 1,
          y: 0,
          duration: 1,
          delay,
          ease: "power3.out",
          stagger,
          scrollTrigger: {
            trigger: el,
            start: "top 82%",
            once: true,
          },
        },
      );
    },
    { scope: ref },
  );

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
