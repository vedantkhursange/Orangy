"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Expand, Play } from "lucide-react";
import { api } from "@/lib/api";
import { cdn, cdnVideo, videoPoster } from "@/lib/media";
import Reveal from "@/components/animations/Reveal";
import MediaViewer, { type ViewerItem } from "@/components/media/MediaViewer";
import type { MediaAsset } from "@/lib/types";

/** Bento layout: every sixth tile is a 2×2 feature, every sixth+3 is tall. */
function span(i: number) {
  if (i % 6 === 0) return "col-span-2 row-span-2";
  if (i % 6 === 3) return "row-span-2";
  return "";
}

/**
 * Admin-managed gallery — images and videos in a bento grid. Every tile opens
 * the shared full-screen viewer: images zoom, videos play with sound and
 * controls. Videos also preview silently in the tile while scrolled into view.
 */
export default function Gallery() {
  const [open, setOpen] = useState<number | null>(null);
  const { data } = useQuery({
    queryKey: ["media", "gallery"],
    queryFn: () => api.get<MediaAsset[]>("/api/media/gallery"),
  });
  const items = [...(data ?? [])].sort((a, b) => a.sortOrder - b.sortOrder);

  if (items.length === 0) return null;

  const viewerItems: ViewerItem[] = items.map((m, i) => ({
    type: m.type,
    url: m.url,
    alt: m.altText || `Orchard ${m.type === "VIDEO" ? "video" : "photo"} ${i + 1}`,
  }));

  return (
    <section id="gallery" className="grain relative overflow-hidden bg-dusk-2 py-20 md:py-32">
      <div className="pattern-dots-light absolute inset-0 opacity-60" />
      <div className="pointer-events-none absolute -left-40 top-0 h-[480px] w-[480px] rounded-full bg-[radial-gradient(circle,rgb(252_116_25/0.22),transparent_65%)]" />
      <div className="relative mx-auto max-w-7xl px-5 md:px-10">
        <Reveal>
          <p data-reveal className="text-xs font-extrabold uppercase tracking-[0.25em] text-orange-glow">
            The Orchard, Up Close
          </p>
          <h2 data-reveal className="display mt-3 max-w-2xl text-3xl font-extrabold leading-tight text-cream-fixed md:text-5xl">
            A day in golden light.
          </h2>
          <p data-reveal className="mt-3 text-sm text-white/60">Tap any photo or video to open it.</p>
        </Reveal>

        <Reveal stagger={0.06} className="mt-10 md:mt-14">
          <div className="grid grid-flow-dense auto-rows-[150px] grid-cols-2 gap-3 sm:auto-rows-[190px] md:grid-cols-4 md:gap-5 lg:auto-rows-[220px]">
            {items.map((item, i) => (
              <button
                key={item.id}
                data-reveal
                onClick={() => setOpen(i)}
                aria-label={`Open ${viewerItems[i].alt}`}
                className={`group relative overflow-hidden rounded-3xl bg-black/40 text-left ring-white/0 transition hover:ring-4 hover:ring-white/15 focus-visible:ring-4 focus-visible:ring-brand ${span(i)}`}
              >
                {item.type === "IMAGE" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={cdn(item.url, span(i).includes("col-span-2") ? 1100 : 600)}
                    alt={viewerItems[i].alt}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.06]"
                  />
                ) : (
                  <GalleryVideo url={item.url} />
                )}
                <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />
                {item.type === "VIDEO" ? (
                  <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 shadow-xl transition group-hover:scale-110">
                      <Play className="ml-0.5 h-6 w-6 fill-brand text-brand" />
                    </span>
                  </span>
                ) : (
                  <span className="pointer-events-none absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-ink opacity-0 shadow-lg transition group-hover:opacity-100">
                    <Expand className="h-4 w-4" />
                  </span>
                )}
              </button>
            ))}
          </div>
        </Reveal>
      </div>

      {open !== null && (
        <MediaViewer items={viewerItems} index={open} onIndexChange={setOpen} onClose={() => setOpen(null)} />
      )}
    </section>
  );
}

/** Silent preview that plays only while ≥50% visible; poster frame until then. */
function GalleryVideo({ url }: { url: string }) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) video.play().catch(() => {});
        else video.pause();
      },
      { threshold: 0.5 },
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  return (
    <video
      ref={ref}
      src={cdnVideo(url, 720)}
      poster={videoPoster(url, 720)}
      className="h-full w-full object-cover"
      muted
      loop
      playsInline
      preload="none"
      tabIndex={-1}
    />
  );
}
