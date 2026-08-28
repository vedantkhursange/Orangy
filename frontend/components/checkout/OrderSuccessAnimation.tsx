"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { inr } from "@/lib/api";

gsap.registerPlugin(useGSAP);

const CONFETTI = Array.from({ length: 14 }, (_, i) => i);

/**
 * Full-screen "order placed" celebration — plays once, then calls onDone.
 * Also offers a manual skip so the user isn't stuck waiting on the animation.
 */
export default function OrderSuccessAnimation({
  orderId,
  totalAmount,
  onDone,
}: {
  orderId: string;
  totalAmount: number;
  onDone: () => void;
}) {
  const scope = useRef<HTMLDivElement>(null);
  const circleRef = useRef<SVGCircleElement>(null);
  const checkRef = useRef<SVGPolylineElement>(null);

  useGSAP(
    () => {
      const circle = circleRef.current;
      const check = checkRef.current;
      if (!circle || !check) return;

      const circleLen = circle.getTotalLength();
      const checkLen = check.getTotalLength();
      gsap.set(circle, { strokeDasharray: circleLen, strokeDashoffset: circleLen });
      gsap.set(check, { strokeDasharray: checkLen, strokeDashoffset: checkLen });
      gsap.set(".oc-badge", { scale: 0 });
      gsap.set(".oc-confetti", { autoAlpha: 0, scale: 0 });
      gsap.set(".oc-text", { autoAlpha: 0, y: 12 });

      const tl = gsap.timeline({
        onComplete: () => {
          gsap.delayedCall(0.9, onDone);
        },
      });

      tl.to(".oc-badge", { scale: 1, duration: 0.45, ease: "back.out(2.2)" })
        .to(circle, { strokeDashoffset: 0, duration: 0.5, ease: "power2.out" }, "-=0.15")
        .to(check, { strokeDashoffset: 0, duration: 0.35, ease: "power1.out" }, "-=0.1")
        .to(
          ".oc-confetti",
          {
            autoAlpha: 1,
            scale: 1,
            x: () => gsap.utils.random(-120, 120),
            y: () => gsap.utils.random(-140, -20),
            rotation: () => gsap.utils.random(-180, 180),
            duration: 0.7,
            ease: "power2.out",
            stagger: 0.015,
          },
          "-=0.3",
        )
        .to(".oc-confetti", { autoAlpha: 0, duration: 0.4 }, "-=0.15")
        .to(".oc-text", { autoAlpha: 1, y: 0, duration: 0.45, ease: "power2.out" }, "-=0.5");
    },
    { scope },
  );

  return (
    <div
      ref={scope}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden bg-cream"
    >
      <div className="relative flex h-40 w-40 items-center justify-center">
        {CONFETTI.map((i) => (
          <span
            key={i}
            className="oc-confetti absolute h-2.5 w-2.5 rounded-full"
            style={{ background: i % 2 === 0 ? "#f4771f" : "#3e6b3a" }}
          />
        ))}
        <div className="oc-badge">
          <svg width="112" height="112" viewBox="0 0 112 112" fill="none">
            <circle
              ref={circleRef}
              cx="56"
              cy="56"
              r="50"
              stroke="#3e6b3a"
              strokeWidth="6"
              strokeLinecap="round"
              fill="none"
            />
            <polyline
              ref={checkRef}
              points="36,58 50,72 78,42"
              stroke="#3e6b3a"
              strokeWidth="7"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </svg>
        </div>
      </div>

      <div className="oc-text mt-2 text-center">
        <h1 className="display text-3xl font-bold text-ink">Order placed!</h1>
        <p className="mt-2 text-sm text-ink/60">Payment received — we&apos;re picking your oranges.</p>
        <p className="mt-4 font-mono text-xs text-ink/45">#{orderId}</p>
        <p className="display mt-1 text-xl font-bold text-orange-deep">{inr(totalAmount)}</p>
      </div>
    </div>
  );
}
