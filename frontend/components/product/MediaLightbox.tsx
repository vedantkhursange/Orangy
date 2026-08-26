"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut } from "lucide-react";

type LightboxImage = { url: string; alt: string };

/**
 * Full-screen zoomable image viewer — click to zoom in/out, drag to pan while
 * zoomed, arrow keys or on-screen chevrons to move between images.
 */
export default function MediaLightbox({
  images,
  index,
  onIndexChange,
  onClose,
}: {
  images: LightboxImage[];
  index: number;
  onIndexChange: (i: number) => void;
  onClose: () => void;
}) {
  const [zoomed, setZoomed] = useState(false);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{ startX: number; startY: number; panX: number; panY: number } | null>(null);

  const image = images[index];

  const resetZoom = () => {
    setZoomed(false);
    setPan({ x: 0, y: 0 });
  };

  const go = (delta: number) => {
    resetZoom();
    onIndexChange((index + delta + images.length) % images.length);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft" && images.length > 1) go(-1);
      else if (e.key === "ArrowRight" && images.length > 1) go(1);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, images.length]);

  const onImageClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (zoomed) resetZoom();
    else setZoomed(true);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (!zoomed) return;
    dragRef.current = { startX: e.clientX, startY: e.clientY, panX: pan.x, panY: pan.y };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const d = dragRef.current;
    setPan({ x: d.panX + (e.clientX - d.startX), y: d.panY + (e.clientY - d.startY) });
  };
  const onPointerUp = () => {
    dragRef.current = null;
  };

  return (
    <div
      className="fixed inset-0 z-[95] flex items-center justify-center bg-black/92 backdrop-blur-sm"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        aria-label="Close"
        className="absolute right-4 top-4 z-10 rounded-full bg-white/10 p-2.5 text-white transition hover:bg-white/20"
      >
        <X className="h-5 w-5" />
      </button>

      <button
        onClick={(e) => { e.stopPropagation(); onImageClick(e); }}
        aria-label={zoomed ? "Zoom out" : "Zoom in"}
        className="absolute left-4 top-4 z-10 flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-2.5 text-xs font-semibold text-white transition hover:bg-white/20"
      >
        {zoomed ? <ZoomOut className="h-4 w-4" /> : <ZoomIn className="h-4 w-4" />}
        {zoomed ? "Zoom out" : "Zoom in"}
      </button>

      {images.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); go(-1); }}
            aria-label="Previous image"
            className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 p-2.5 text-white transition hover:bg-white/20 md:left-6"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); go(1); }}
            aria-label="Next image"
            className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 p-2.5 text-white transition hover:bg-white/20 md:right-6"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </>
      )}

      <div
        className="relative flex h-full w-full items-center justify-center overflow-hidden px-6 py-16"
        onClick={(e) => e.stopPropagation()}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image.url}
          alt={image.alt}
          onClick={onImageClick}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
          draggable={false}
          className="max-h-full max-w-full select-none rounded-lg object-contain transition-transform duration-200"
          style={{
            transform: `scale(${zoomed ? 2.4 : 1}) translate(${pan.x / (zoomed ? 2.4 : 1)}px, ${pan.y / (zoomed ? 2.4 : 1)}px)`,
            cursor: zoomed ? "grab" : "zoom-in",
          }}
        />
      </div>

      {images.length > 1 && (
        <div className="absolute bottom-5 left-1/2 z-10 -translate-x-1/2 rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-white">
          {index + 1} / {images.length}
        </div>
      )}
    </div>
  );
}
