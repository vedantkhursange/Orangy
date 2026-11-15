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
 * data-model:  orange | tree | basket         (default orange)
 * data-x / data-y: optional desktop offsets in viewport fractions (-0.5 … 0.5)
 *
 * Scroll drives rotation and the model glides between positions, so the page
 * feels like one continuous 3D shot (Apple product-page style). When the
 * section changes model, the old one slides out sideways and the new one
 * enters: the orange from the side, the tree from far away, the basket from
 * below. The layer sits above the text (pointer-events off) so the fruit
 * reads as a real object over the page. On phones the model moves to the upper part of
 * the screen and shrinks. Reduced-motion users get a still model.
 */
type Pos = "left" | "right" | "center" | "hide";
type ModelName = "orange" | "tree" | "basket";

/**
 * Progressive loading: a light preview (shown within a second) is swapped for
 * the original, full-quality model (original geometry and 4K textures; only
 * unused UV sets removed) as soon as it has downloaded.
 */
const MODELS: Record<ModelName, { preview: string; full: string }> = {
  orange: { preview: "/models/orange-half.glb", full: "/models/full/orange-half.glb" },
  tree: { preview: "/models/orange-tree.glb", full: "/models/full/orange-tree.glb" },
  basket: { preview: "/models/orange-basket.glb", full: "/models/full/orange-basket.glb" },
};

/**
 * Per-section motion (data-anim), so each section shows something new:
 * spin · tumble · grow · orbit · float · flip · turntable
 */
type Anim = "spin" | "tumble" | "grow" | "orbit" | "float" | "flip" | "turntable";

/** Where a model comes from when it enters. */
const ENTER: Record<ModelName, "side" | "far" | "below"> = { orange: "side", tree: "far", basket: "below" };
const FAR_Z = -28;

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

      const prepare = (model: Group) => {
        // leaf cards and thin peel are single planes: render both faces
        model.traverse((o) => {
          const mesh = o as import("three").Mesh;
          if (!mesh.isMesh) return;
          (Array.isArray(mesh.material) ? mesh.material : [mesh.material]).forEach((m) => {
            m.side = THREE.DoubleSide;
          });
        });
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        model.position.sub(box.getCenter(new THREE.Vector3()));
        return 2.1 / Math.max(size.x, size.y, size.z);
      };

      const dispose = (obj: Group) =>
        obj.traverse((o) => {
          const mesh = o as import("three").Mesh;
          if (!mesh.isMesh) return;
          mesh.geometry.dispose();
          (Array.isArray(mesh.material) ? mesh.material : [mesh.material]).forEach((m) => {
            Object.values(m).forEach((v) => (v as { isTexture?: boolean })?.isTexture && (v as import("three").Texture).dispose());
            m.dispose();
          });
        });

      await Promise.all(
        (Object.keys(MODELS) as ModelName[]).map(async (name) => {
          try {
            const model = (await loader.loadAsync(MODELS[name].preview)).scene;
            const holder = new THREE.Group();
            holder.userData.base = prepare(model);
            holder.add(model);
            holder.scale.setScalar(0.0001);
            holder.userData.st = { x: 0, y: 0, z: FAR_Z, vy: 0, on: false };
            scene.add(holder);
            holders[name] = holder;
          } catch {
            /* a missing model just leaves that slot empty */
          }
        }),
      );
      if (disposed) return;

      // then upgrade each to full quality, one at a time (orange first: it is on screen)
      (async () => {
        for (const name of ["orange", "tree", "basket"] as ModelName[]) {
          if (disposed) return;
          try {
            const full = (await loader.loadAsync(MODELS[name].full)).scene;
            const holder = holders[name];
            if (disposed || !holder) return;
            const preview = holder.children[0] as Group;
            holder.userData.base = prepare(full);
            holder.remove(preview);
            holder.add(full);
            dispose(preview);
          } catch {
            /* keep the preview */
          }
        }
      })();

      // where the model should be: x/y in viewport fractions, s = scale
      const target = { x: 0.25, y: 0, s: 1, model: "orange" as ModelName, show: true, anim: "spin" as Anim, p: 0 };
      const cur = { s: 1 };

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
        target.anim = (el?.dataset.anim as Anim | undefined) ?? (target.model === "tree" ? "grow" : target.model === "basket" ? "turntable" : "spin");
        if (el) {
          // 0 when the section enters at the bottom, 1 when it leaves at the top
          const r = el.getBoundingClientRect();
          target.p = Math.min(1, Math.max(0, (vh - r.top) / (vh + r.height)));
        }
        const s = Number(el?.dataset.scale ?? 1);
        if (mobile) {
          target.x = 0;
          target.y = 0.27;
          target.s = s;
        } else {
          target.x = el?.dataset.x ? Number(el.dataset.x) : pos === "left" ? -0.25 : pos === "right" ? 0.27 : 0;
          target.y = el?.dataset.y ? Number(el.dataset.y) : 0;
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

        cur.s += (target.s - cur.s) * ease;
        smoothScroll += (scrollY - smoothScroll) * ease;

        const wh = worldH();
        const ww = wh * camera.aspect;
        // never wider than ~40% of the screen (55% on phones / tablets)
        const fit = Math.min(cur.s, ((window.innerWidth < 1024 ? 0.55 : 0.4) * ww) / 2.1);
        camera.position.x = reduced ? 0 : Math.sin(smoothScroll * 0.0006) * 0.12; // slow pan
        camera.lookAt(0, 0, 0);

        (Object.keys(holders) as ModelName[]).forEach((name) => {
          const h = holders[name]!;
          const st = h.userData.st as { x: number; y: number; z: number; vy: number; on: boolean };
          const active = target.show && target.model === name;
          const tx = target.x * ww;
          const ty = target.y * wh;

          if (active && !st.on) {
            // (re)enter: start off-stage
            const kind = ENTER[name];
            st.x = kind === "side" ? (tx >= 0 ? 1 : -1) * ww : tx;
            st.y = kind === "below" ? -wh : ty;
            st.z = kind === "far" ? FAR_Z : 0;
            st.vy = 0;
            st.on = true;
          }
          let gx = tx;
          let gy = ty;
          let gz = 0;
          if (!active) {
            // exit sideways, towards the nearer edge
            gx = (st.x >= 0 ? 1 : -1) * ww * 1.05;
            gy = st.y;
            gz = st.z;
          }
          const k = name === "tree" && active ? ease * 0.7 : ease; // the tree grows in a bit slower
          st.x += (gx - st.x) * k;
          st.z += (gz - st.z) * k;
          if (name === "basket" && active && !reduced) {
            // springy drop-in from below: a little overshoot, then settles
            st.vy += (gy - st.y) * 60 * dt;
            st.vy *= Math.pow(0.02, dt);
            st.y += st.vy * dt;
          } else {
            st.y += (gy - st.y) * k;
            st.vy = 0;
          }
          if (!active && Math.abs(st.x) > ww * 0.98) st.on = false;

          h.visible = st.on;
          if (!h.visible) return;

          // per-section motion; the last one is kept while the model exits
          const anim: Anim = active ? target.anim : ((h.userData.anim as Anim) ?? "spin");
          const p = active ? target.p : ((h.userData.p as number) ?? 0.5);
          h.userData.anim = anim;
          h.userData.p = p;
          const ss = smoothScroll;
          let dx = 0;
          let dy = reduced ? 0 : Math.sin(t * 0.8) * 0.05;
          let ds = 1;
          let rot: [number, number, number];
          switch (reduced ? "still" : anim) {
            case "tumble": // end-over-end as you scroll through the section
              rot = [p * Math.PI * 2.2, 0.7 + t * 0.08, 0.25];
              break;
            case "grow": // tree: comes in from far, sways in the wind, slowly turns
              rot = [0.06, -0.6 + p * Math.PI * 0.9, Math.sin(t * 1.3) * 0.035];
              break;
            case "orbit": // tree: a full turn across the section plus a small circle
              rot = [0.1, p * Math.PI * 2, Math.sin(t * 1.1) * 0.03];
              dx = Math.sin(p * Math.PI * 2) * ww * 0.035;
              break;
            case "float": // weightless drift
              rot = [Math.sin(t * 0.7) * 0.45, t * 0.3, Math.cos(t * 0.5) * 0.3];
              dy = Math.sin(t * 1.2) * wh * 0.035;
              break;
            case "flip": // quick flips tied to scroll, with a breathing scale
              rot = [0.3, p * Math.PI * 3, Math.sin(p * Math.PI) * 0.6];
              ds = 1 + Math.sin(t * 1.6) * 0.03;
              break;
            case "turntable": // basket on a slow display turntable
              rot = [0.38 + Math.sin(t * 0.6) * 0.05, t * 0.35 + p * 1.5, 0];
              break;
            case "still":
              rot = [0.25, 0.6, 0];
              break;
            default: // spin
              rot = [0.25 + Math.sin(ss * 0.0011) * 0.35, ss * 0.0022 + t * 0.12, Math.sin(ss * 0.0007) * 0.15];
          }
          h.scale.setScalar(h.userData.base * fit * ds * (name === "tree" ? 1.25 : 1));
          h.position.set(st.x + dx, st.y + dy, st.z);
          // blend towards the new motion along the shortest angle, so switching
          // sections never makes the model whirl
          const blend = Math.min(1, ease * 1.5);
          (["x", "y", "z"] as const).forEach((ax, i) => {
            const d = Math.atan2(Math.sin(rot[i] - h.rotation[ax]), Math.cos(rot[i] - h.rotation[ax]));
            h.rotation[ax] += d * blend;
          });
        });

        // feed the background spotlight with the active model's screen position
        const lit = target.show ? holders[target.model] : undefined;
        const rootStyle = document.documentElement.style;
        if (lit?.visible) {
          const v = lit.getWorldPosition(new THREE.Vector3()).project(camera);
          v.x = Math.max(-1.1, Math.min(1.1, v.x));
          rootStyle.setProperty("--oe-gx", `${((v.x + 1) / 2) * 100}%`);
          rootStyle.setProperty("--oe-gy", `${((1 - v.y) / 2) * 100}%`);
          rootStyle.setProperty("--oe-glow", "1");
        } else rootStyle.setProperty("--oe-glow", "0");

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
        document.documentElement.style.setProperty("--oe-glow", "0");
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
      className="pointer-events-none fixed inset-0 z-30 opacity-0 transition-opacity duration-1000 data-[ready='1']:opacity-100 [&>canvas]:h-full [&>canvas]:w-full"
    />
  );
}
