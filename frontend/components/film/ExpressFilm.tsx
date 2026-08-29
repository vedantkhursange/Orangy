"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type * as THREE_ from "three";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { ArrowDown } from "lucide-react";
import { EXPRESS, shots } from "@/data/express";
import { hero, brand } from "@/data/site";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

const subscribeReducedMotion = (onChange: () => void) => {
  const mq = window.matchMedia(REDUCED_MOTION);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
};

/** `null` until hydrated, so the scene is never built during SSR. */
const useReducedMotion = () =>
  useSyncExternalStore<boolean | null>(
    subscribeReducedMotion,
    () => window.matchMedia(REDUCED_MOTION).matches,
    () => null,
  );

/**
 * The homepage hero: a 3D diorama with a scroll-choreographed camera.
 *
 * Scroll decides only *which* beat is current (see EXPRESS.thresholds). Every
 * change fires a GSAP flight that runs to completion on its own clock, so the
 * camera never stalls mid-move when the user stops scrolling — a small flick
 * commits the whole shot. There is no orbit/drag control by design.
 *
 * three.js is imported inside the effect so it stays out of SSR and the
 * initial bundle. Reduced-motion users get a single static shot.
 */
export default function ExpressFilm() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const mountRef = useRef<HTMLDivElement>(null);

  /** Imperative handle into the three.js scene, populated once loaded. */
  const sceneRef = useRef<{
    flyTo: (index: number) => void;
    setActive: (on: boolean) => void;
  } | null>(null);
  const pendingBeatRef = useRef(0);

  const reduced = useReducedMotion();
  const [ready, setReady] = useState(false);
  const [beat, setBeat] = useState(0);

  /* ── three.js scene ── */
  useEffect(() => {
    if (reduced === null) return;
    const mount = mountRef.current;
    if (!mount) return;

    let disposed = false;
    let cleanup = () => {};

    (async () => {
      const THREE = await import("three");
      const { GLTFLoader } = await import("three/examples/jsm/loaders/GLTFLoader.js");
      if (disposed) return;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(42, 1, 0.01, 1000);

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      // the asset is hand-painted with lighting already baked into the albedo,
      // so it is rendered unlit — tone mapping would only wash it out
      renderer.toneMapping = THREE.NoToneMapping;
      mount.appendChild(renderer.domElement);
      renderer.domElement.style.cssText = "width:100%;height:100%;display:block";

      const resize = () => {
        const w = mount.clientWidth || window.innerWidth;
        const h = mount.clientHeight || window.innerHeight;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      };
      resize();
      window.addEventListener("resize", resize);

      // claim teardown before the long download, so unmounting mid-load
      // cannot strand the canvas or the resize listener
      cleanup = () => {
        window.removeEventListener("resize", resize);
        renderer.dispose();
        renderer.domElement.remove();
      };

      const gltf = await new GLTFLoader().loadAsync(EXPRESS.modelPath);
      if (disposed) return;
      const root = gltf.scene;

      // swap the baked emissive materials for genuinely unlit ones, so the
      // diorama reads identically regardless of scene lighting
      const retired: THREE_.Material[] = [];
      root.traverse((obj) => {
        const mesh = obj as THREE_.Mesh;
        if (!mesh.isMesh) return;
        const src = mesh.material as THREE_.MeshStandardMaterial;
        const map = src.emissiveMap ?? src.map ?? null;
        if (map) map.colorSpace = THREE.SRGBColorSpace;
        // the source exports its glass (jug, train windows) as OPAQUE — the
        // transparency only lived in Sketchfab's viewer settings. Without this
        // the juice inside the dispenser is hidden by its own container.
        const isGlass = /glass/i.test(src.name) || /glass/i.test(mesh.name);
        mesh.material = new THREE.MeshBasicMaterial({
          map,
          side: src.side ?? THREE.DoubleSide,
          transparent: isGlass,
          opacity: isGlass ? 0.38 : 1,
          depthWrite: !isGlass,
        });
        if (isGlass) mesh.renderOrder = 1;
        retired.push(src);
      });
      scene.add(root);

      const box = new THREE.Box3().setFromObject(root);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3()).length();
      camera.near = size / 500;
      camera.far = size * 8;

      type Pose = { target: readonly [number, number, number]; dir: readonly [number, number, number]; dist: number; fov: number };
      const place = (s: Pose) => {
        const d = new THREE.Vector3(...s.dir).normalize().multiplyScalar(s.dist * size);
        const t = new THREE.Vector3(...s.target).multiplyScalar(size).add(center);
        return {
          px: t.x + d.x,
          py: t.y + d.y,
          pz: t.z + d.z,
          tx: t.x,
          ty: t.y,
          tz: t.z,
          fov: s.fov,
        };
      };

      const landing = shots[pendingBeatRef.current] ?? shots[0];
      // the page-load reveal starts wide and swung right, then pushes in
      const revealing = pendingBeatRef.current === 0 && reduced !== true;
      const cam = place(revealing ? EXPRESS.intro : landing);
      const apply = () => {
        camera.position.set(cam.px, cam.py, cam.pz);
        camera.fov = cam.fov;
        camera.updateProjectionMatrix();
        camera.lookAt(cam.tx, cam.ty, cam.tz);
      };
      apply();

      let active = true;
      let raf = 0;
      const tick = () => {
        raf = requestAnimationFrame(tick);
        // `active` is driven by ScrollTrigger, so the loop idles once the hero
        // scrolls away. Background tabs are already handled by the browser
        // pausing rAF — checking document.hidden on top of that only risks
        // leaving the canvas blank in embedded/hidden-but-composited views.
        if (!active) return;
        renderer.render(scene, camera);
      };
      tick();

      sceneRef.current = {
        flyTo: (index) => {
          const shot = shots[index];
          if (!shot) return;
          gsap.to(cam, {
            ...place(shot),
            duration: shot.duration,
            ease: EXPRESS.ease,
            overwrite: true, // a fast scroll re-targets rather than queueing
            onUpdate: apply,
          });
        },
        setActive: (on) => {
          active = on;
        },
      };
      setReady(true);
      if (pendingBeatRef.current > 0) {
        // the user already scrolled past beat 0 while the model downloaded —
        // skip the reveal and go straight to where they are
        sceneRef.current.flyTo(pendingBeatRef.current);
      } else if (revealing) {
        gsap.to(cam, {
          ...place(landing),
          duration: EXPRESS.introDuration,
          ease: "power3.out",
          overwrite: true,
          onUpdate: apply,
        });
      }

      cleanup = () => {
        cancelAnimationFrame(raf);
        window.removeEventListener("resize", resize);
        gsap.killTweensOf(cam);
        scene.remove(root);
        root.traverse((obj) => {
          const mesh = obj as THREE_.Mesh;
          if (!mesh.isMesh) return;
          mesh.geometry.dispose();
          const m = mesh.material as THREE_.MeshBasicMaterial;
          m.map?.dispose();
          m.dispose();
        });
        for (const m of retired) m.dispose();
        renderer.dispose();
        renderer.domElement.remove();
      };
    })();

    return () => {
      disposed = true;
      sceneRef.current = null;
      cleanup();
    };
  }, [reduced]);

  /* ── scroll → beat index (never a direct scrub) ── */
  useGSAP(
    () => {
      if (reduced !== false) return;
      const wrap = wrapRef.current;
      if (!wrap) return;

      const isMobile = window.innerWidth < 768;
      const scrollVh = isMobile ? EXPRESS.mobileScrollVh : EXPRESS.scrollVh;

      const beatFor = (p: number) => {
        let i = 0;
        for (let k = 0; k < EXPRESS.thresholds.length; k++) {
          if (p >= EXPRESS.thresholds[k]) i = k;
        }
        return i;
      };

      let current = 0;
      const applyProgress = (p: number) => {
        const target = beatFor(p);
        if (target === current) return;
        // Step at most one beat per update, regardless of how far `target`
        // is. onUpdate fires once per animation frame — a fast fling can
        // easily cross several zones within one frame, and without this the
        // camera would jump straight to the last one, skipping every beat
        // in between rather than flying through each in turn.
        current += target > current ? 1 : -1;
        pendingBeatRef.current = current;
        setBeat(current);
        sceneRef.current?.flyTo(current);
      };

      const st = ScrollTrigger.create({
        trigger: wrap,
        start: "top top",
        end: `+=${scrollVh}%`,
        pin: true,
        anticipatePin: 1,
        onToggle: (self) => sceneRef.current?.setActive(self.isActive),
        onUpdate: (self) => applyProgress(self.progress),
      });


      // TEMP verification hook
      (window as unknown as Record<string, unknown>).__applyProgress = applyProgress;

      return () => st.kill();
    },
    { scope: wrapRef, dependencies: [reduced] },
  );

  return (
    <section
      id="home"
      ref={wrapRef}
      className="relative h-screen w-full overflow-hidden bg-[#150d1f]"
    >
      <div
        ref={mountRef}
        className="absolute inset-0 transition-opacity duration-700"
        style={{ opacity: ready ? 1 : 0 }}
      />

      {/* cinematic vignette */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 120% 90% at 50% 45%, transparent 55%, rgba(12,6,20,0.55) 100%)",
        }}
      />

      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs uppercase tracking-[0.3em] text-white/50">
            Loading…
          </span>
        </div>
      )}

      {/* beat captions */}
      {shots.map((s, i) => {
        if (!s.title) return null;
        const on = i === beat;
        return (
          <div
            key={s.id}
            aria-hidden={!on}
            className="pointer-events-none absolute left-8 top-[58%] max-w-md px-0 transition-all duration-500 md:left-[8vw] md:top-1/2 md:-translate-y-1/2"
            style={{
              opacity: on ? 1 : 0,
              transform: `translateY(${on ? 0 : 24}px)`,
            }}
          >
            <h2
              className="display text-3xl font-semibold leading-tight text-white md:text-5xl"
              style={{ textShadow: "0 2px 24px rgba(12,6,20,0.6)" }}
            >
              {s.title}
            </h2>
            <p
              className="mt-3 text-sm leading-relaxed text-white/85 md:text-base"
              style={{ textShadow: "0 1px 12px rgba(12,6,20,0.5)" }}
            >
              {s.sub}
            </p>
          </div>
        );
      })}

      {/* beat progress dots */}
      {reduced === false && (
        <div className="pointer-events-none absolute right-8 top-1/2 flex -translate-y-1/2 flex-col gap-3 md:right-[6vw]">
          {shots.map((s, i) => (
            <span
              key={s.id}
              className="block h-1.5 w-1.5 rounded-full transition-all duration-500"
              style={{
                background: i === beat ? "rgb(var(--orange-rgb, 249 115 22))" : "rgba(255,255,255,0.3)",
                transform: i === beat ? "scale(1.6)" : "scale(1)",
              }}
            />
          ))}
        </div>
      )}

      {/* hero overlay (beat 0). Driven by React + a CSS transition rather than
          a GSAP tween: this bundle's gsap has no CSSPlugin, so tweening DOM
          properties silently no-ops (the old ScrollFilm set styles directly
          for the same reason). */}
      <div
        className="absolute inset-0 transition-all duration-500 ease-out"
        style={{
          opacity: reduced === true || beat === 0 ? 1 : 0,
          transform: reduced === true || beat === 0 ? "none" : "translateY(-40px)",
          pointerEvents: reduced === true || beat === 0 ? "auto" : "none",
        }}
      >
        <HeroOverlay staticMode={reduced === true} />
      </div>
    </section>
  );
}

function HeroOverlay({ staticMode = false }: { staticMode?: boolean }) {
  return (
    <div className="absolute inset-0 flex flex-col items-start justify-center px-8 md:px-[8vw]">
      <p className="mb-4 text-xs font-medium uppercase tracking-[0.35em] text-white/80 md:text-sm">
        {hero.kicker}
      </p>
      <h1
        className="display text-5xl font-bold leading-[1.02] text-white md:text-7xl lg:text-8xl"
        style={{ textShadow: "0 4px 40px rgba(12,6,20,0.6)" }}
      >
        {hero.headline[0]}
        <br />
        <span className="text-orange-glow">{hero.headline[1]}</span>
      </h1>
      <p
        className="mt-6 max-w-md text-base text-white/85 md:text-lg"
        style={{ textShadow: "0 2px 16px rgba(12,6,20,0.5)" }}
      >
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
