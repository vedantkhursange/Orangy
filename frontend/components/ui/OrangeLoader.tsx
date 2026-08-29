"use client";

import { useEffect, useRef, useState } from "react";

/**
 * The big/page-level loader — a real orange, rendered once offline from a 3D
 * model into a 24-frame transparent sprite strip, played back as a plain
 * background-position flipbook. Deliberately not a live 3D render: this
 * loader needs to appear instantly wherever a page is loading, and a WebGL
 * scene per instance would be the opposite of that. Not for small inline
 * spots (buttons, per-image loading) — those keep the plain spinner.
 *
 * Motion: spins two full rotations, holds for ~1.4s, repeats. Driven by a
 * small interval rather than CSS keyframes — "spin N times then pause" needs
 * per-segment timing-function overrides in pure CSS that are fiddly to get
 * right and hard to eyeball-verify; a frame counter is plain and obviously
 * correct.
 */

const FRAME_COUNT = 24;
const FRAME_SIZE = 128; // px, matches the sprite sheet
const FRAME_MS = 45; // time per frame while spinning
const SPINS_PER_CYCLE = 2;
const PAUSE_MS = 1400;

export default function OrangeLoader({
  size = 64,
  className = "",
  label = "Loading",
}: {
  /** Rendered size in px — the sprite is 128px/frame, so this can scale up cleanly to 2x. */
  size?: number;
  className?: string;
  label?: string;
}) {
  const [frame, setFrame] = useState(0);
  const stepRef = useRef(0); // 0..(FRAME_COUNT*SPINS_PER_CYCLE - 1) while spinning

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    const tick = () => {
      const totalSteps = FRAME_COUNT * SPINS_PER_CYCLE;
      stepRef.current += 1;
      setFrame(stepRef.current % FRAME_COUNT);

      if (stepRef.current >= totalSteps) {
        stepRef.current = 0;
        setFrame(0);
        timer = setTimeout(tick, PAUSE_MS); // hold here between cycles
      } else {
        timer = setTimeout(tick, FRAME_MS);
      }
    };

    timer = setTimeout(tick, FRAME_MS);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      role="status"
      aria-label={label}
      className={className}
      style={{
        width: size,
        height: size,
        backgroundImage: "url(/loader/orange-loader.webp)",
        backgroundPosition: `${-frame * FRAME_SIZE}px 0`,
        backgroundSize: `${FRAME_COUNT * FRAME_SIZE}px ${FRAME_SIZE}px`,
        backgroundRepeat: "no-repeat",
        imageRendering: "auto",
      }}
    >
      <span className="sr-only">{label}…</span>
    </div>
  );
}

/** Centered full-area wrapper — the standard "this whole page/section has
 *  nothing to show yet" state. Not for list/table refetches (pagination,
 *  filters) — those keep their existing Skeleton so the page doesn't flash
 *  a big loader on every click; this is for a genuinely empty first load. */
export function PageLoader({ className = "flex justify-center py-24" }: { className?: string }) {
  return (
    <div className={className}>
      <OrangeLoader size={72} />
    </div>
  );
}
