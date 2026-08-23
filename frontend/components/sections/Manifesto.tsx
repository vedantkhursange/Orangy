"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { manifesto } from "@/data/site";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/** Scene 8 — the brand experience. Big type, line-by-line scroll reveal. */
export default function Manifesto() {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const lines = gsap.utils.toArray<HTMLElement>("[data-line]", ref.current!);
      gsap.fromTo(
        lines,
        { autoAlpha: 0.12, y: 28 },
        {
          autoAlpha: 1,
          y: 0,
          ease: "power2.out",
          stagger: 0.18,
          scrollTrigger: {
            trigger: ref.current,
            start: "top 70%",
            end: "center 45%",
            scrub: true,
          },
        },
      );
    },
    { scope: ref },
  );

  return (
    <section id="experience" ref={ref} className="relative overflow-hidden bg-dusk py-28 md:py-40 grain">
      {/* warm radial glow */}
      <div
        className="pointer-events-none absolute -right-40 -top-40 h-[560px] w-[560px] rounded-full opacity-25"
        style={{ background: "radial-gradient(circle, #f4771f 0%, transparent 65%)" }}
      />
      <div className="mx-auto max-w-6xl px-6 md:px-10">
        <p className="mb-8 text-xs font-semibold uppercase tracking-[0.35em] text-orange-glow">
          {manifesto.kicker}
        </p>
        <h2 className="display max-w-4xl text-4xl font-bold leading-[1.12] text-cream-soft md:text-6xl lg:text-7xl">
          {manifesto.lines.map((l, i) => (
            <span key={i} data-line className="block">
              {l}
            </span>
          ))}
        </h2>
        <p className="mt-10 max-w-xl text-base leading-relaxed text-cream/60 md:text-lg" data-line>
          {manifesto.body}
        </p>
      </div>
    </section>
  );
}
