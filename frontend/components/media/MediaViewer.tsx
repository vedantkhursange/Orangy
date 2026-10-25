"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, Play, X, ZoomIn, ZoomOut } from "lucide-react";
import { cdn, cdnVideo, videoPoster } from "@/lib/media";

export type ViewerItem = { type: "IMAGE" | "VIDEO"; url: string; alt: string };

const MIN = 1;
const MAX = 4;
const STEP = 2.5;

type Point = { x: number; y: number };

/**
 * Full-screen media viewer shared by the product page and the homepage
 * gallery. Images zoom with wheel, pinch, double-click/double-tap or the
 * buttons, and pan by dragging; at 1x a horizontal swipe changes item and a
 * downward swipe closes. Videos play with native controls. The browser back
 * button closes the viewer instead of leaving the page.
 */
export default function MediaViewer({
  items,
  index,
  onIndexChange,
  onClose,
}: {
  items: ViewerItem[];
  index: number;
  onIndexChange: (i: number) => void;
  onClose: () => void;
}) {
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState<Point>({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const pointers = useRef(new Map<number, Point>());
  const gesture = useRef<{
    start: Point;
    offset: Point;
    pinchDist: number;
    pinchScale: number;
    moved: boolean;
  } | null>(null);
  const lastTap = useRef(0);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  const item = items[index];
  const many = items.length > 1;

  const reset = useCallback(() => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  }, []);

  const go = useCallback(
    (delta: number) => {
      reset();
      onIndexChange((index + delta + items.length) % items.length);
    },
    [index, items.length, onIndexChange, reset],
  );

  /* Closing goes through history so the back button and the X behave the same. */
  const close = useCallback(() => history.back(), []);

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    history.pushState({ mediaViewer: true }, "");
    const onPop = () => onCloseRef.current();
    window.addEventListener("popstate", onPop);
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      window.removeEventListener("popstate", onPop);
      document.body.style.overflow = "";
      opener?.focus?.();
    };
  }, []);

  /** Keeps the zoomed image from being dragged off screen. */
  const clamp = (p: Point, s: number): Point => {
    const r = stageRef.current?.getBoundingClientRect();
    if (!r) return p;
    const mx = ((s - 1) * r.width) / 2;
    const my = ((s - 1) * r.height) / 2;
    return { x: Math.max(-mx, Math.min(mx, p.x)), y: Math.max(-my, Math.min(my, p.y)) };
  };

  /** Zoom to `next`, keeping the point under `at` (stage-centre coords) fixed. */
  const zoomTo = (next: number, at: Point = { x: 0, y: 0 }) => {
    const s = Math.max(MIN, Math.min(MAX, next));
    if (s === 1) return reset();
    const k = s / scale;
    setOffset(clamp({ x: at.x - (at.x - offset.x) * k, y: at.y - (at.y - offset.y) * k }, s));
    setScale(s);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowLeft" && many) go(-1);
      else if (e.key === "ArrowRight" && many) go(1);
      else if ((e.key === "+" || e.key === "=") && item.type === "IMAGE") zoomTo(Math.min(MAX, scale + 1));
      else if (e.key === "-" && item.type === "IMAGE") zoomTo(Math.max(MIN, scale - 1));
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  });

  const fromCentre = (clientX: number, clientY: number): Point => {
    const r = stageRef.current!.getBoundingClientRect();
    return { x: clientX - r.left - r.width / 2, y: clientY - r.top - r.height / 2 };
  };

  const onWheel = (e: React.WheelEvent) => {
    if (item.type !== "IMAGE") return;
    zoomTo(scale * (e.deltaY < 0 ? 1.15 : 1 / 1.15), fromCentre(e.clientX, e.clientY));
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (item.type !== "IMAGE") return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const pts = [...pointers.current.values()];
    gesture.current = {
      start: { x: e.clientX, y: e.clientY },
      offset,
      pinchDist: pts.length === 2 ? Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y) : 0,
      pinchScale: scale,
      moved: false,
    };
    setDragging(true);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const g = gesture.current;
    if (!g || !pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const pts = [...pointers.current.values()];
    const dx = e.clientX - g.start.x;
    const dy = e.clientY - g.start.y;
    if (Math.abs(dx) + Math.abs(dy) > 6) g.moved = true;

    if (pts.length === 2 && g.pinchDist > 0) {
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      const mid = fromCentre((pts[0].x + pts[1].x) / 2, (pts[0].y + pts[1].y) / 2);
      zoomTo(g.pinchScale * (dist / g.pinchDist), mid);
    } else if (scale > 1) {
      setOffset(clamp({ x: g.offset.x + dx, y: g.offset.y + dy }, scale));
    } else {
      // at 1x the drag previews a swipe
      setOffset({ x: many ? dx : 0, y: dy > 0 ? dy : 0 });
    }
  };

  const onPointerUp = (e: React.PointerEvent) => {
    const g = gesture.current;
    pointers.current.delete(e.pointerId);
    if (pointers.current.size > 0) return;
    gesture.current = null;
    setDragging(false);
    if (!g) return;

    if (!g.moved) {
      // tap: a quick second tap toggles zoom at that point
      const now = Date.now();
      if (now - lastTap.current < 300) {
        zoomTo(scale > 1 ? 1 : STEP, fromCentre(e.clientX, e.clientY));
        lastTap.current = 0;
      } else lastTap.current = now;
      return;
    }
    if (scale === 1) {
      const dx = e.clientX - g.start.x;
      const dy = e.clientY - g.start.y;
      if (dy > 120 && Math.abs(dy) > Math.abs(dx)) return close();
      if (many && Math.abs(dx) > 70) return go(dx < 0 ? 1 : -1);
      reset();
    }
  };

  const zoomed = scale > 1;

  // Portalled to <body> so no ancestor stacking context (sticky galleries,
  // transformed sections) can put the navbar above the viewer.
  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Media viewer"
      data-lenis-prevent
      className="fixed inset-0 z-[95] flex flex-col bg-[#0b0b0f]/95 text-white backdrop-blur-sm"
    >
      {/* top bar */}
      <div className="relative z-10 flex items-center justify-between gap-3 px-4 py-3 md:px-6">
        <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold tabular-nums">
          {index + 1} / {items.length}
        </span>
        <div className="flex items-center gap-2">
          {item.type === "IMAGE" && (
            <>
              <IconButton label="Zoom out" disabled={!zoomed} onClick={() => zoomTo(scale - 1)}>
                <ZoomOut className="h-5 w-5" />
              </IconButton>
              <IconButton label="Zoom in" disabled={scale >= MAX} onClick={() => zoomTo(scale + 1)}>
                <ZoomIn className="h-5 w-5" />
              </IconButton>
            </>
          )}
          <IconButton label="Close" onClick={close} ref={closeRef}>
            <X className="h-5 w-5" />
          </IconButton>
        </div>
      </div>

      {/* stage */}
      <div
        ref={stageRef}
        className="relative flex min-h-0 flex-1 touch-none select-none items-center justify-center overflow-hidden"
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        style={{ cursor: item.type !== "IMAGE" ? "default" : zoomed ? (dragging ? "grabbing" : "grab") : "zoom-in" }}
      >
        {item.type === "IMAGE" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={item.url}
            src={cdn(item.url, zoomed ? 2800 : 1600)}
            alt={item.alt}
            draggable={false}
            className="max-h-full max-w-full object-contain"
            style={{
              transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
              transition: dragging ? "none" : "transform 220ms cubic-bezier(.2,.8,.2,1)",
              opacity: !zoomed && offset.y > 0 ? Math.max(0.4, 1 - offset.y / 400) : 1,
            }}
          />
        ) : (
          <video
            key={item.url}
            src={cdnVideo(item.url)}
            poster={videoPoster(item.url, 1280)}
            controls
            autoPlay
            playsInline
            className="max-h-full max-w-full rounded-xl bg-black"
          />
        )}

        {many && (
          <>
            <IconButton label="Previous" onClick={() => go(-1)} className="absolute left-3 top-1/2 hidden -translate-y-1/2 md:flex">
              <ChevronLeft className="h-6 w-6" />
            </IconButton>
            <IconButton label="Next" onClick={() => go(1)} className="absolute right-3 top-1/2 hidden -translate-y-1/2 md:flex">
              <ChevronRight className="h-6 w-6" />
            </IconButton>
          </>
        )}
      </div>

      {/* thumbnails */}
      {many && (
        <div className="flex justify-center gap-2 overflow-x-auto px-4 py-3">
          {items.map((m, i) => (
            <button
              key={m.url}
              onClick={() => { reset(); onIndexChange(i); }}
              aria-label={`Show item ${i + 1}`}
              aria-current={i === index}
              className={`relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border-2 transition ${
                i === index ? "border-brand" : "border-transparent opacity-60 hover:opacity-100"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={m.type === "IMAGE" ? cdn(m.url, 160) : videoPoster(m.url, 160)}
                alt=""
                className="h-full w-full object-cover"
              />
              {m.type === "VIDEO" && (
                <Play className="absolute inset-0 m-auto h-5 w-5 fill-white text-white drop-shadow" />
              )}
            </button>
          ))}
        </div>
      )}
      <p className="sr-only" aria-live="polite">{item.alt}</p>
    </div>,
    document.body,
  );
}

function IconButton({
  label,
  onClick,
  disabled,
  className = "",
  children,
  ref,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
  ref?: React.Ref<HTMLButtonElement>;
}) {
  return (
    <button
      ref={ref}
      aria-label={label}
      disabled={disabled}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      onPointerDown={(e) => e.stopPropagation()}
      className={`flex items-center justify-center rounded-full bg-white/12 p-2.5 text-white transition hover:bg-white/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:opacity-35 ${className}`}
    >
      {children}
    </button>
  );
}
