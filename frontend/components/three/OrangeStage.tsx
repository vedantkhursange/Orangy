"use client";

import { useEffect, useRef } from "react";
import type { Group } from "three";

/**
 * A fixed, full-screen WebGL layer behind the homepage. One renderer, two
 * models (a halved orange and a basket of oranges). Each section says where the
 * model should sit while it is on screen:
 *
 *   <section data-orange="right" data-model="orange" data-scale="1.1">
 *
 * data-orange: left | right | center | hide   (default hide)
 * data-model:  orange | basket                (default orange)
 *
 * Scroll drives rotation and the model glides between positions, so the page
 * feels like one continuous 3D shot (Apple product-page style). Content sits
 * above it on glass panels. On phones the model moves to the upper part of
 * the screen and shrinks. Reduced-motion users get a still model.
 */
type Pos = "left" | "right" | "center" | "hide";
type ModelName = "orange" | "basket";

const MODELS: Record<ModelName, string> = {
  orange: "/models/orange-half.glb",
  basket: "/models/orange-basket.glb",
};

export default function OrangeStage() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let disposed = false;
    let cleanup = () => {};

    (async () => {
      const THREE = await import("three");
      const { GLTFLoader } = await import("three/examples/jsm/loaders/GLTFLoader.js");
      const { MeshoptDecoder } = await import("three/examples/jsm/libs/meshopt_decoder.module.js");
      const { RoomEnvironment } = await import("three/examples/jsm/environments/RoomEnvironment.js");
      if (disposed) return;

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, window.innerWidth < 768 ? 1.5 : 1.75));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.05;
      mount.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      const pmrem = new THREE.PMREMGenerator(renderer);
      scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

      const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
      camera.position.set(0, 0, 6);

      // warm rim light from behind-right, cool fill from the left
      const rim = new THREE.DirectionalLight(0xff8a2a, 3.2);
      rim.position.set(3, 2, -3);
      const key = new THREE.DirectionalLight(0xffffff, 1.4);
      key.position.set(-2, 3, 4);
      scene.add(rim, key, new THREE.AmbientLight(0xffffff, 0.25));

      const loader = new GLTFLoader();
      loader.setMeshoptDecoder(MeshoptDecoder);

      const holders: Partial<Record<ModelName, Group>> = {};
      await Promise.all(
        (Object.keys(MODELS) as ModelName[]).map(async (name) => {
          try {
            const gltf = await loader.loadAsync(MODELS[name]);
            const model = gltf.scene;
            const box = new THREE.Box3().setFromObject(model);
            const size = box.getSize(new THREE.Vector3());
            const center = box.getCenter(new THREE.Vector3());
            model.position.sub(center);
            const holder = new THREE.Group();
            holder.add(model);
            holder.scale.setScalar(0.0001);
            holder.userData.base = 2.1 / Math.max(size.x, size.y, size.z);
            holder.userData.k = 0; // 0 hidden … 1 shown
            scene.add(holder);
            holders[name] = holder;
          } catch {
            /* a missing model just leaves that slot empty */
          }
        }),
      );
      if (disposed) return;

      // where the model should be: x/y in viewport fractions, s = scale
      const target = { x: 0.25, y: 0, s: 1, model: "orange" as ModelName, show: true };
      const cur = { x: 0.25, y: 0, s: 1 };

      const readSections = () => {
        const vh = window.innerHeight;
        const mobile = window.innerWidth < 1024;
        // every top-level section counts; one without data-orange hides the model
        const nodes = document.querySelectorAll<HTMLElement>("main > section, main section[data-orange], body footer");
        let best: HTMLElement | null = null;
        let bestDist = Infinity;
        nodes.forEach((n) => {
          const r = n.getBoundingClientRect();
          if (r.bottom < vh * 0.15 || r.top > vh * 0.85) return;
          const mid = Math.min(Math.max(vh / 2, r.top), r.bottom);
          const d = Math.abs(mid - vh / 2);
          if (d < bestDist) {
            bestDist = d;
            best = n;
          }
        });
        const el = best as HTMLElement | null;
        let pos = (el?.dataset.orange as Pos | undefined) ?? "hide";
        // narrow screens: text spans the full width, so the model only appears
        // in sections laid out for it (hero, closing basket)
        if (mobile && !el?.dataset.mobile) pos = "hide";
        target.model = (el?.dataset.model as ModelName | undefined) ?? "orange";
        target.show = pos !== "hide";
        const s = Number(el?.dataset.scale ?? 1);
        if (mobile) {
          target.x = 0;
          target.y = 0.27;
          target.s = s;
        } else {
          target.x = pos === "left" ? -0.25 : pos === "right" ? 0.27 : 0;
          target.y = 0;
          target.s = s;
        }
      };

      const resize = () => {
        const w = window.innerWidth;
        const h = window.innerHeight;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        readSections();
      };
      resize();
      // start where the first section wants it, no glide on load
      cur.x = target.x;
      cur.y = target.y;
      cur.s = target.s;
      window.addEventListener("resize", resize);

      let scrollY = window.scrollY;
      let smoothScroll = scrollY;
      const onScroll = () => {
        scrollY = window.scrollY;
        readSections();
      };
      window.addEventListener("scroll", onScroll, { passive: true });

      const clock = new THREE.Clock();
      let raf = 0;
      const worldH = () => 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z;

      const tick = () => {
        raf = requestAnimationFrame(tick);
        const dt = Math.min(clock.getDelta(), 0.05);
        const t = clock.elapsedTime;
        const ease = 1 - Math.pow(0.0025, dt); // frame-rate independent lerp

        cur.x += (target.x - cur.x) * ease;
        cur.y += (target.y - cur.y) * ease;
        cur.s += (target.s - cur.s) * ease;
        smoothScroll += (scrollY - smoothScroll) * ease;

        const wh = worldH();
        const ww = wh * camera.aspect;

        (Object.keys(holders) as ModelName[]).forEach((name) => {
          const h = holders[name]!;
          const want = target.show && target.model === name ? 1 : 0;
          h.userData.k += (want - h.userData.k) * ease;
          const k = h.userData.k as number;
          h.visible = k > 0.002;
          if (!h.visible) return;
          const pop = k * k * (3 - 2 * k); // smoothstep
          // never wider than ~40% of the screen (60% on phones / tablets)
          const fit = Math.min(cur.s, ((window.innerWidth < 1024 ? 0.55 : 0.4) * ww) / 2.1);
          h.scale.setScalar(Math.max(0.0001, h.userData.base * fit * pop));
          h.position.set(cur.x * ww, cur.y * wh + (reduced ? 0 : Math.sin(t * 0.8) * 0.05), 0);
          const spin = reduced ? 0.6 : smoothScroll * 0.0022 + t * 0.12;
          h.rotation.set(
            name === "basket" ? 0.35 : 0.25 + Math.sin(smoothScroll * 0.0011) * 0.35,
            spin + (1 - pop) * 1.5,
            name === "basket" ? 0 : Math.sin(smoothScroll * 0.0007) * 0.15,
          );
        });

        renderer.render(scene, camera);
      };
      tick();
      mount.dataset.ready = "1";

      cleanup = () => {
        cancelAnimationFrame(raf);
        window.removeEventListener("resize", resize);
        window.removeEventListener("scroll", onScroll);
        pmrem.dispose();
        renderer.dispose();
        renderer.domElement.remove();
      };
    })();

    return () => {
      disposed = true;
      cleanup();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 opacity-0 transition-opacity duration-1000 data-[ready='1']:opacity-100 [&>canvas]:h-full [&>canvas]:w-full"
    />
  );
}
