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
 * The orange spins with scroll and slides out sideways. The tree and the
 * basket never fly: they appear in place (the tree rooted to the bottom edge
 * of the screen, standing still; the basket turning slowly on the spot).
 * Nothing is rendered while no model is on screen, to keep scrolling smooth.
 */
type Pos = "left" | "right" | "center" | "hide";
type ModelName = "orange" | "tree" | "basket";

const MODELS: Record<ModelName, string> = {
  orange: "/models/orange-half.glb",
  tree: "/models/orange-tree.glb",
  basket: "/models/orange-basket.glb",
};

/** Per-section motion (data-anim). */
type Anim = "spin" | "tumble" | "rooted" | "turntable";

/** The orange slides in from the side; the tree and basket appear in place. */
const ENTER: Record<ModelName, "side" | "place"> = { orange: "side", tree: "place", basket: "place" };

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
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, window.innerWidth < 768 ? 1.25 : 1.5));
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
        const base = 2.1 / Math.max(size.x, size.y, size.z);
        return { base, height: size.y * base };
      };

      await Promise.all(
        (Object.keys(MODELS) as ModelName[]).map(async (name) => {
          try {
            const model = (await loader.loadAsync(MODELS[name])).scene;
            const holder = new THREE.Group();
            Object.assign(holder.userData, prepare(model));
            holder.add(model);
            holder.scale.setScalar(0.0001);
            holder.userData.st = { x: 0, y: 0, k: 0, on: false };
            scene.add(holder);
            holders[name] = holder;
          } catch {
            /* a missing model just leaves that slot empty */
          }
        }),
      );
      if (disposed) return;

      // where the model should be: x/y in viewport fractions, s = scale
      const target = { x: 0.25, y: 0, s: 1, model: "orange" as ModelName, show: true, anim: "spin" as Anim, p: 0, pin: 0 };
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
        target.anim = (el?.dataset.anim as Anim | undefined) ?? (target.model === "tree" ? "rooted" : target.model === "basket" ? "turntable" : "spin");
        if (el) {
          // 0 when the section enters at the bottom, 1 when it leaves at the top
          const r = el.getBoundingClientRect();
          target.p = Math.min(1, Math.max(0, (vh - r.top) / (vh + r.height)));
          // how far the section's middle is from the screen's middle (basket rides with its section)
          target.pin = 0.5 - (r.top + r.height / 2) / vh;
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
      let idle = false;
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

        let anyVisible = false;
        (Object.keys(holders) as ModelName[]).forEach((name) => {
          const h = holders[name]!;
          const st = h.userData.st as { x: number; y: number; k: number; on: boolean };
          const active = target.show && target.model === name;
          const inPlace = ENTER[name] === "place";
          const tx = target.x * ww;
          const ty = target.y * wh;

          if (active && !st.on) {
            // (re)enter: the orange starts off-stage, the others start where they stay
            st.x = inPlace ? tx : (tx >= 0 ? 1 : -1) * ww;
            st.y = ty;
            st.k = inPlace ? 0 : 1;
            st.on = true;
          }
          if (inPlace) {
            // no travel at all: just appear and disappear on the spot
            if (active) {
              st.x = tx;
              st.y = ty + (name === "basket" ? target.pin * wh : 0);
            }
            st.k += ((active ? 1 : 0) - st.k) * ease;
            if (!active && st.k < 0.02) st.on = false;
          } else {
            // exit sideways, towards the nearer edge
            const gx = active ? tx : (st.x >= 0 ? 1 : -1) * ww * 1.05;
            st.x += (gx - st.x) * ease;
            if (active) st.y += (ty - st.y) * ease;
            if (!active && Math.abs(st.x) > ww * 0.98) st.on = false;
          }

          h.visible = st.on;
          if (!h.visible) return;
          anyVisible = true;

          // per-section motion; the last one is kept while the model exits
          const anim: Anim = active ? target.anim : ((h.userData.anim as Anim) ?? "spin");
          const p = active ? target.p : ((h.userData.p as number) ?? 0.5);
          h.userData.anim = anim;
          h.userData.p = p;
          const ss = smoothScroll;
          let rot: [number, number, number];
          switch (reduced && anim !== "rooted" ? "still" : anim) {
            case "tumble": // end-over-end as you scroll through the section
              rot = [p * Math.PI * 2.2, 0.7 + t * 0.08, 0.25];
              break;
            case "rooted": // tree: stands still
              rot = [0, 0.5, 0];
              break;
            case "turntable": // basket on a slow display turntable
              rot = [0.38, t * 0.3, 0];
              break;
            case "still":
              rot = [0.25, 0.6, 0];
              break;
            default: // spin
              rot = [0.25 + Math.sin(ss * 0.0011) * 0.35, ss * 0.0022 + t * 0.12, Math.sin(ss * 0.0007) * 0.15];
          }
          if (name === "tree") {
            // sized to the screen and rooted: the trunk meets the bottom edge
            const scale = (Math.min(0.7 * wh, 0.62 * ww) / (h.userData.height as number)) * st.k;
            h.scale.setScalar(Math.max(scale * (h.userData.base as number), 1e-4));
            h.position.set(st.x, -wh / 2 + (scale * (h.userData.height as number)) / 2 - wh * 0.07, 0);
            h.rotation.set(rot[0], rot[1], rot[2]);
            return;
          }
          const bob = reduced || inPlace ? 0 : Math.sin(t * 0.8) * 0.05;
          h.scale.setScalar(Math.max(h.userData.base * fit * st.k, 1e-4));
          h.position.set(st.x, st.y + bob, 0);
          if (anim === "turntable") {
            h.rotation.set(rot[0], rot[1], rot[2]);
            return;
          }
          // blend towards the new motion along the shortest angle, so switching
          // sections never makes the model whirl
          const blend = Math.min(1, ease * 1.5);
          (["x", "y", "z"] as const).forEach((ax, i) => {
            const d = Math.atan2(Math.sin(rot[i] - h.rotation[ax]), Math.cos(rot[i] - h.rotation[ax]));
            h.rotation[ax] += d * blend;
          });
        });

        // nothing on screen: draw one empty frame, then stop paying for WebGL
        if (!anyVisible) {
          if (idle) return;
          idle = true;
        } else idle = false;
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
      className="pointer-events-none fixed inset-0 z-30 opacity-0 transition-opacity duration-1000 data-[ready='1']:opacity-100 [&>canvas]:h-full [&>canvas]:w-full"
    />
  );
}
