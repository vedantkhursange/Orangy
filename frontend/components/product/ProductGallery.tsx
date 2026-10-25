"use client";

import { useRef, useState } from "react";
import { Leaf, Maximize2, Play } from "lucide-react";
import { cdn, cdnSrcSet, videoPoster } from "@/lib/media";
import MediaViewer, { type ViewerItem } from "@/components/media/MediaViewer";

const ZOOM = 2.5;

/**
 * Product media, Flipkart-style: thumbnail rail + main image on desktop with
 * a hover lens that magnifies into a pane over the info column; a swipeable
 * carousel with dots on phones. Any click/tap opens the full-screen viewer.
 */
export default function ProductGallery({ items }: { items: ViewerItem[] }) {
  const [active, setActive] = useState(0);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [lens, setLens] = useState<{ x: number; y: number; side: number } | null>(null);
  const [aspect, setAspect] = useState(1); // natural width / height of the shown image
  const mainRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLDivElement>(null);

  if (items.length === 0) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-[28px] bg-surface-2">
        <Leaf className="h-16 w-16 text-brand/30" />
      </div>
    );
  }

  const current = items[Math.min(active, items.length - 1)];

  const onMove = (e: React.MouseEvent) => {
    if (current.type !== "IMAGE") return;
    const r = mainRef.current!.getBoundingClientRect();
    setLens({
      x: Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)),
      y: Math.max(0, Math.min(1, (e.clientY - r.top) / r.height)),
      side: r.width,
    });
  };

  /* phone carousel: track which slide is centred */
  const onRailScroll = () => {
    const el = railRef.current;
    if (!el) return;
    const i = Math.round(el.scrollLeft / el.clientWidth);
    if (i !== active) setActive(i);
  };

  return (
    <div className="relative md:sticky md:top-24 md:z-20">
      {/* ── desktop ── */}
      <div className="hidden gap-3 md:flex">
        {items.length > 1 && (
          <div className="flex max-h-[560px] w-[72px] shrink-0 flex-col gap-2 overflow-y-auto pr-1">
            {items.map((m, i) => (
              <button
                key={m.url}
                onMouseEnter={() => setActive(i)}
                onClick={() => setActive(i)}
                aria-label={`Show image ${i + 1}`}
                aria-current={i === active}
                className={`relative aspect-square shrink-0 overflow-hidden rounded-2xl border-2 bg-surface-2 transition ${
                  i === active ? "border-brand" : "border-transparent opacity-70 hover:opacity-100"
                }`}
              >
                <Thumb item={m} />
              </button>
            ))}
          </div>
        )}

        <div className="relative flex-1">
          <div
            ref={mainRef}
            onMouseMove={onMove}
            onMouseLeave={() => setLens(null)}
            onClick={() => setViewerOpen(true)}
            className="group relative aspect-square cursor-zoom-in overflow-hidden rounded-[28px] bg-surface-2 shadow-card"
          >
            <Slide item={current} priority onAspect={setAspect} />
            {lens && (
              <span
                aria-hidden
                className="pointer-events-none absolute rounded-xl border-2 border-white/90 bg-white/25 shadow-lg"
                style={{
                  width: `${100 / ZOOM}%`,
                  height: `${100 / ZOOM}%`,
                  left: `${Math.min(100 - 100 / ZOOM, Math.max(0, lens.x * 100 - 50 / ZOOM))}%`,
                  top: `${Math.min(100 - 100 / ZOOM, Math.max(0, lens.y * 100 - 50 / ZOOM))}%`,
                }}
              />
            )}
            <span className="pointer-events-none absolute bottom-4 right-4 flex items-center gap-1.5 rounded-full bg-black/55 px-3 py-1.5 text-xs font-semibold text-white opacity-0 backdrop-blur transition group-hover:opacity-100">
              <Maximize2 className="h-3.5 w-3.5" /> Click to expand
            </span>
          </div>

          {/* magnified pane, laid over the info column */}
          {lens && current.type === "IMAGE" && (
            <div
              aria-hidden
              className="pointer-events-none absolute left-[calc(100%+24px)] top-0 z-30 hidden aspect-square w-full overflow-hidden rounded-[28px] border border-line bg-surface shadow-2xl lg:block"
              style={paneStyle(current.url, lens, aspect, lens.side)}
            />
          )}
        </div>
      </div>

      {/* ── phone ── */}
      <div className="md:hidden">
        <div
          ref={railRef}
          onScroll={onRailScroll}
          className="-mx-4 flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {items.map((m, i) => (
            <button
              key={m.url}
              onClick={() => { setActive(i); setViewerOpen(true); }}
              aria-label={`Open image ${i + 1} full screen`}
              className="relative aspect-square w-full shrink-0 snap-center overflow-hidden bg-surface-2"
            >
              <Slide item={m} priority={i === 0} />
            </button>
          ))}
        </div>
        {items.length > 1 && (
          <div className="mt-3 flex justify-center gap-1.5">
            {items.map((m, i) => (
              <span
                key={m.url}
                className={`h-1.5 rounded-full transition-all ${i === active ? "w-5 bg-brand" : "w-1.5 bg-ink/20"}`}
              />
            ))}
          </div>
        )}
      </div>

      {viewerOpen && (
        <MediaViewer
          items={items}
          index={Math.min(active, items.length - 1)}
          onIndexChange={setActive}
          onClose={() => setViewerOpen(false)}
        />
      )}
    </div>
  );
}

/**
 * The main image is object-cover in a square of side `side`, so the pane has
 * to magnify that same cover crop: work in displayed pixels, scale by ZOOM,
 * and centre the pane on the point under the lens.
 */
function paneStyle(url: string, lens: { x: number; y: number }, aspect: number, side: number): React.CSSProperties {
  const w = aspect >= 1 ? side * aspect : side;
  const h = aspect >= 1 ? side : side / aspect;
  const ix = lens.x * side + (w - side) / 2;
  const iy = lens.y * side + (h - side) / 2;
  const clamp = (v: number, max: number) => Math.min(0, Math.max(-max, v));
  return {
    backgroundImage: `url(${cdn(url, 2000)})`,
    backgroundSize: `${w * ZOOM}px ${h * ZOOM}px`,
    backgroundPosition: `${clamp(side / 2 - ix * ZOOM, w * ZOOM - side)}px ${clamp(side / 2 - iy * ZOOM, h * ZOOM - side)}px`,
    backgroundRepeat: "no-repeat",
  };
}

function Slide({ item, priority, onAspect }: { item: ViewerItem; priority?: boolean; onAspect?: (a: number) => void }) {
  if (item.type === "VIDEO") {
    return (
      <>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={videoPoster(item.url, 1000)} alt={item.alt} className="h-full w-full object-cover" />
        <PlayBadge />
      </>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={cdn(item.url, 960)}
      srcSet={cdnSrcSet(item.url, [480, 720, 960, 1280])}
      sizes="(min-width: 768px) 45vw, 100vw"
      alt={item.alt}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
      draggable={false}
      onLoad={(e) => onAspect?.(e.currentTarget.naturalWidth / e.currentTarget.naturalHeight || 1)}
      className="h-full w-full object-cover"
    />
  );
}

function Thumb({ item }: { item: ViewerItem }) {
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={item.type === "IMAGE" ? cdn(item.url, 160) : videoPoster(item.url, 160)}
        alt=""
        loading="lazy"
        className="h-full w-full object-cover"
      />
      {item.type === "VIDEO" && <Play className="absolute inset-0 m-auto h-5 w-5 fill-white text-white drop-shadow" />}
    </>
  );
}

export function PlayBadge() {
  return (
    <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 shadow-xl">
        <Play className="ml-0.5 h-6 w-6 fill-brand text-brand" />
      </span>
    </span>
  );
}
