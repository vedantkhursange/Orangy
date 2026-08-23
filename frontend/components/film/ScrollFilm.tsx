"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { ArrowDown } from "lucide-react";
import { FILM, captions } from "@/data/film";
import { hero, brand } from "@/data/site";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/**
 * The cinematic scroll film: an AI-generated 7-chapter product film sliced
 * into WebP frames, scrubbed on a <canvas> by scroll position (pinned via
 * ScrollTrigger). Captions and the hero overlay are DOM layers driven by the
 * same scroll progress. Reduced-motion users get a static poster instead.
 */
export default function ScrollFilm() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef(0);
  const framesRef = useRef<(HTMLImageElement | null)[]>([]);
  const loadedRef = useRef<boolean[]>([]);
  const lastDrawnRef = useRef(-1);
  const [reduced, setReduced] = useState<boolean | null>(null);

  useEffect(() => {
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  /* ── frame preloading: sparse first pass, then fill ── */
  useEffect(() => {
    if (reduced !== false) return;
    const N = FILM.frameCount;
    framesRef.current = new Array(N).fill(null);
    loadedRef.current = new Array(N).fill(false);

    let cancelled = false;
    const load = (i: number) =>
      new Promise<void>((resolve) => {
        if (cancelled || loadedRef.current[i]) return resolve();
        const img = new Image();
        img.onload = () => {
          framesRef.current[i] = img;
          loadedRef.current[i] = true;
          // repaint if the newly loaded frame is at/near current position
          if (Math.abs(currentIndex() - i) < 8) drawFrame(currentIndex());
          resolve();
        };
        img.onerror = () => resolve();
        img.src = FILM.framePath(i);
      });

    const currentIndex = () =>
      Math.max(0, Math.min(N - 1, Math.round(progressRef.current * (N - 1))));

    const run = async () => {
      await load(0);
      drawFrame(0);
      // pass 1: every 6th frame so scrubbing is instantly usable
      const sparse: Promise<void>[] = [];
      for (let i = 0; i < N; i += 6) sparse.push(load(i));
      await Promise.all(sparse);
      // pass 2: everything else, in small parallel batches
      for (let i = 0; i < N; i += 24) {
        if (cancelled) return;
        const batch: Promise<void>[] = [];
        for (let j = i; j < Math.min(i + 24, N); j++) if (!loadedRef.current[j]) batch.push(load(j));
        await Promise.all(batch);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced]);

  /* ── canvas draw (cover-fit, slight focus right of center) ── */
  const drawFrame = (index: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // walk back to the nearest loaded frame
    let i = index;
    while (i > 0 && !loadedRef.current[i]) i--;
    const img = framesRef.current[i];
    if (!img) return;
    if (lastDrawnRef.current === i) return;
    lastDrawnRef.current = i;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    const { width: cw, height: ch } = canvas;
    const scale = Math.max(cw / img.width, ch / img.height);
    const w = img.width * scale;
    const h = img.height * scale;
    const x = (cw - w) * 0.55; // bias toward the right-weighted compositions
    const y = (ch - h) * 0.5;
    ctx.drawImage(img, x, y, w, h);
  };

  /* ── pin + scrub ── */
  useGSAP(
    () => {
      if (reduced !== false) return;
      const wrap = wrapRef.current;
      const canvas = canvasRef.current;
      if (!wrap || !canvas) return;

      const sizeCanvas = () => {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.round(window.innerWidth * dpr);
        canvas.height = Math.round(window.innerHeight * dpr);
        lastDrawnRef.current = -1;
        drawFrame(Math.round(progressRef.current * (FILM.frameCount - 1)));
      };
      sizeCanvas();
      window.addEventListener("resize", sizeCanvas);

      // the GPU layer is discarded while the tab is hidden — repaint on return
      const repaint = () => {
        lastDrawnRef.current = -1;
        drawFrame(Math.round(progressRef.current * (FILM.frameCount - 1)));
      };
      document.addEventListener("visibilitychange", repaint);
      window.addEventListener("focus", repaint);
      window.addEventListener("pageshow", repaint);

      const isMobile = window.innerWidth < 768;
      const scrollVh = isMobile ? FILM.mobileScrollVh : FILM.scrollVh;

      const captionEls = gsap.utils.toArray<HTMLElement>("[data-caption]", wrap);

      const st = ScrollTrigger.create({
        trigger: wrap,
        start: "top top",
        end: `+=${scrollVh}%`,
        pin: true,
        scrub: true,
        anticipatePin: 1,
        onUpdate: (self) => {
          const p = self.progress;
          progressRef.current = p;
          drawFrame(Math.round(p * (FILM.frameCount - 1)));

          // hero overlay fades out over the first 7% of scroll
          if (heroRef.current) {
            const k = gsap.utils.clamp(0, 1, p / 0.07);
            heroRef.current.style.opacity = String(1 - k);
            heroRef.current.style.transform = `translateY(${k * -40}px)`;
            heroRef.current.style.pointerEvents = k > 0.6 ? "none" : "auto";
          }

          // captions
          for (const el of captionEls) {
            const cin = parseFloat(el.dataset.in || "0");
            const cout = parseFloat(el.dataset.out || "1");
            const fade = 0.02;
            let o = 0;
            if (p > cin && p < cout) {
              o = Math.min(1, (p - cin) / fade, (cout - p) / fade);
            }
            el.style.opacity = String(o);
            el.style.transform = `translateY(${(1 - o) * 24}px)`;
          }
        },
      });

      return () => {
        window.removeEventListener("resize", sizeCanvas);
        document.removeEventListener("visibilitychange", repaint);
        window.removeEventListener("focus", repaint);
        window.removeEventListener("pageshow", repaint);
        st.kill();
      };
    },
    { scope: wrapRef, dependencies: [reduced] },
  );

  /* ── reduced motion: static poster with the story stills ── */
  if (reduced === true) {
    return (
      <section id="home" className="relative">
        <div className="relative h-[92vh] w-full overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/hero-dawn.webp" alt="Dawn over the Orangy family orchards" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
          <HeroOverlay staticMode />
        </div>
      </section>
    );
  }

  return (
    <section id="home" ref={wrapRef} className="relative h-screen w-full overflow-hidden bg-[#1a1005]">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />

      {/* cinematic vignette */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 120% 90% at 50% 45%, transparent 60%, rgba(20,10,2,0.38) 100%)",
        }}
      />

      {/* hero overlay (scene 1) */}
      <div ref={heroRef} className="absolute inset-0">
        <HeroOverlay />
      </div>

      {/* chapter captions */}
      {captions.map((c) => (
        <div
          key={c.id}
          data-caption
          data-in={c.in}
          data-out={c.out}
          className={[
            "pointer-events-none absolute max-w-md px-8 md:px-0 opacity-0 transition-none",
            c.side === "left" ? "left-8 md:left-[8vw]" : "",
            c.side === "right" ? "right-8 md:right-[8vw] text-right" : "",
            c.side === "center" ? "left-1/2 -translate-x-1/2 text-center" : "",
            "top-[58%] md:top-1/2 md:-translate-y-1/2",
          ].join(" ")}
        >
          <h2
            className={[
              "display text-3xl md:text-5xl font-semibold leading-tight",
              c.tone === "light" ? "text-white" : "text-ink",
            ].join(" ")}
            style={{
              textShadow: c.tone === "light" ? "0 2px 24px rgba(30,15,0,0.45)" : "0 2px 24px rgba(255,248,239,0.5)",
            }}
          >
            {c.title}
          </h2>
          <p
            className={[
              "mt-3 text-sm md:text-base leading-relaxed",
              c.tone === "light" ? "text-white/85" : "text-ink/75",
            ].join(" ")}
            style={{
              textShadow: c.tone === "light" ? "0 1px 12px rgba(30,15,0,0.4)" : "none",
            }}
          >
            {c.sub}
          </p>
        </div>
      ))}
    </section>
  );
}

function HeroOverlay({ staticMode = false }: { staticMode?: boolean }) {
  return (
    <div className="absolute inset-0 flex flex-col items-start justify-center px-8 md:px-[8vw]">
      <p className="mb-4 text-xs md:text-sm font-medium uppercase tracking-[0.35em] text-white/80">
        {hero.kicker}
      </p>
      <h1 className="display text-5xl md:text-7xl lg:text-8xl font-bold leading-[1.02] text-white"
        style={{ textShadow: "0 4px 40px rgba(30,15,0,0.5)" }}>
        {hero.headline[0]}
        <br />
        <span className="text-orange-glow">{hero.headline[1]}</span>
      </h1>
      <p className="mt-6 max-w-md text-base md:text-lg text-white/85"
        style={{ textShadow: "0 2px 16px rgba(30,15,0,0.45)" }}>
        {hero.sub}
      </p>
      <a
        href={staticMode ? "#products" : "#experience"}
        onClick={(e) => {
          if (staticMode) return;
          e.preventDefault();
          window.scrollTo({ top: window.innerHeight * 1.2, behavior: "smooth" });
        }}
        className="group mt-10 inline-flex items-center gap-3 rounded-full bg-orange px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-orange/30 transition hover:bg-orange-deep"
      >
        {hero.cta}
        <ArrowDown className="h-4 w-4 transition-transform group-hover:translate-y-0.5" />
      </a>

      {!staticMode && (
        <div className="absolute bottom-8 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2 text-white/70">
          <span className="text-[11px] uppercase tracking-[0.3em]">{hero.scrollHint}</span>
          <span className="block h-8 w-px animate-pulse bg-white/60" />
        </div>
      )}
      <span className="sr-only">{brand.name}</span>
    </div>
  );
}
