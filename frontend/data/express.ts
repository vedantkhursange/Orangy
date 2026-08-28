/**
 * Orange Express scroll-film configuration.
 *
 * The homepage hero is a 3D diorama flown through by a scroll-driven camera.
 * Unlike the old WebP frame scrub, the camera is NOT bound to scroll position:
 * scroll only decides *which* beat is current, and every change fires a tween
 * that runs to completion on its own clock. Stopping mid-scroll never freezes
 * the camera mid-flight — a small flick commits the whole shot.
 *
 * Each shot is authored as a look-at point plus the direction and distance the
 * camera sits from it. Both are multiples of the model's bounding-sphere size
 * and offsets from its centre, so they hold regardless of the asset's units.
 * `dir` is normalised at runtime — only its ratios matter.
 */

export type ExpressShot = {
  id: string;
  /** Caption shown while this beat is active. Empty title = hero overlay only. */
  title: string;
  sub: string;
  /** Look-at point, as an offset from the model centre (× model size). */
  target: [number, number, number];
  /** Direction from the target out to the camera (normalised at runtime). */
  dir: [number, number, number];
  /** Camera distance from the target (× model size). */
  dist: number;
  fov: number;
  /** Seconds for the flight *into* this beat. */
  duration: number;
};

export const EXPRESS = {
  modelPath: "/models/orange-express.glb",
  /** Total pinned scroll distance, in viewport-heights. */
  scrollVh: 200,
  mobileScrollVh: 190,
  /**
   * Scroll progress (0..1) at which each beat takes over. The first boundary
   * is deliberately tiny — Lenis eases over ~1.15s, so anything larger needs
   * several wheel notches before the opening flight commits. The rest are
   * spaced to give each shot room to land before the next can fire.
   */
  thresholds: [0, 0.012, 0.3, 0.6],
  ease: "power2.inOut",
  /**
   * Where the camera sits before the page-load reveal: further out and swung
   * to the right, so the opening second is a short push-in to the hero shot
   * rather than a static frame.
   */
  intro: {
    target: [-0.3, 0.02, 0] as [number, number, number],
    dir: [-0.6, 0.4, 0.7] as [number, number, number],
    dist: 1.6,
    fov: 40,
  },
  introDuration: 1.1,
};

export const shots: ExpressShot[] = [
  {
    id: "wide",
    title: "",
    sub: "",
    target: [-0.12, 0, 0],
    dir: [-0.45, 0.34, 0.82],
    dist: 1.02,
    fov: 38,
    duration: 1.4,
  },
  {
    id: "express",
    title: "Orange Express",
    sub: "Every orange starts its journey the same way — picked, sorted, and put on the line.",
    target: [-0.02, 0.1, 0],
    dir: [-0.38, 0.3, 0.87],
    dist: 0.52,
    fov: 34,
    duration: 1.7,
  },
  {
    id: "vitamin",
    title: "Vitamin C, all the way down",
    sub: "Nothing added on the way. What leaves the grove is what reaches your glass.",
    target: [-0.02, -0.02, 0],
    dir: [-0.4, 0.26, 0.88],
    dist: 0.5,
    fov: 34,
    duration: 1.6,
  },
  {
    id: "juice",
    title: "Poured fresh",
    sub: "Pressed the same day it comes off the tree — nothing sitting in a warehouse.",
    target: [-0.24, -0.08, 0],
    dir: [-0.15, 0.26, 0.95],
    dist: 0.58,
    fov: 38,
    duration: 1.8,
  },
];
