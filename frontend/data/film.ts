import { filmCaptions } from "./site";

/**
 * Scroll-film configuration.
 * frameCount / framePath are set by the frame build pipeline (film-src → public/frames).
 * Chapter fractions are calibrated to the master film's per-chapter scroll ranges.
 * Captions live in data/site.ts — edit copy there, timing here.
 */
export const FILM = {
  frameCount: 257,
  framePath: (i: number) => `/frames/f_${String(i + 1).padStart(4, "0")}.webp`,
  /** Total pinned scroll distance, in viewport-heights. */
  scrollVh: 500,
  mobileScrollVh: 410,
};

export type FilmCaption = {
  id: string;
  title: string;
  sub: string;
  /** Scroll-progress window where this caption is visible (0..1). */
  in: number;
  out: number;
  /** Horizontal placement of the text block. */
  side: "left" | "right" | "center";
  /** Dark text for bright scenes, light text for dark scenes. */
  tone: "light" | "dark";
};

/**
 * Chapter map (farmer film, 257 frames at 12fps):
 *  descent 0–0.2374 · approach 0.2374–0.4747 · pick 0.4747–0.7121 · crates finale 0.7121–1.0
 * Captions land inside chapters, away from the joins.
 */
export const captions: FilmCaption[] = [
  { id: "land", ...filmCaptions.land, in: 0.04, out: 0.2, side: "left", tone: "light" },
  { id: "walk", ...filmCaptions.walk, in: 0.26, out: 0.36, side: "left", tone: "light" },
  { id: "one", ...filmCaptions.one, in: 0.385, out: 0.46, side: "left", tone: "light" },
  { id: "pick", ...filmCaptions.pick, in: 0.53, out: 0.68, side: "left", tone: "light" },
  { id: "world", ...filmCaptions.world, in: 0.78, out: 1.01, side: "left", tone: "light" },
];
