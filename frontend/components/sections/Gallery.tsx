"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import Reveal from "@/components/animations/Reveal";
import type { MediaAsset } from "@/lib/types";

/** Admin-managed gallery grid — images and videos, same cell size. A video
 *  plays inline, muted, only while its tile is scrolled into view. */
export default function Gallery() {
  const { data } = useQuery({
    queryKey: ["media", "gallery"],
    queryFn: () => api.get<MediaAsset[]>("/api/media/gallery"),
  });
  const items = [...(data ?? [])].sort((a, b) => a.sortOrder - b.sortOrder);

  if (items.length === 0) return null;

  return (
    <section id="gallery" className="bg-dusk-2 py-24 md:py-36 grain relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-6 md:px-10">
        <Reveal>
          <p data-reveal className="text-xs font-semibold uppercase tracking-[0.35em] text-orange-glow">
            The Orchard, Up Close
          </p>
          <h2 data-reveal className="display mt-4 max-w-2xl text-4xl font-bold leading-tight text-cream-fixed-soft md:text-5xl">
            A day in golden light.
          </h2>
        </Reveal>

        <Reveal stagger={0.08} className="mt-14">
          <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3">
            {items.map((item) =>
              item.type === "IMAGE" ? (
                <GalleryImageTile key={item.id} item={item} />
              ) : (
                <GalleryVideoTile key={item.id} item={item} />
              ),
            )}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function GalleryImageTile({ item }: { item: MediaAsset }) {
  return (
    <figure data-reveal className="group relative overflow-hidden rounded-3xl" style={{ aspectRatio: "4/5" }}>
      <Image
        src={item.url}
        alt={item.altText ?? ""}
        fill
        sizes="(max-width: 640px) 50vw, 33vw"
        className="object-cover transition-transform duration-700 group-hover:scale-[1.05]"
      />
    </figure>
  );
}

/** Plays muted + inline once >=50% visible, pauses the instant it isn't —
 *  the "small grid tile that comes alive on scroll" behaviour that was asked
 *  for. Not the browser's native Picture-in-Picture (which pops the video
 *  into its own floating window) — that would fight the grid layout rather
 *  than sit inside it. */
function GalleryVideoTile({ item }: { item: MediaAsset }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
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
    <figure className="group relative overflow-hidden rounded-3xl bg-black" style={{ aspectRatio: "4/5" }}>
      <video
        ref={videoRef}
        src={item.url}
        className="h-full w-full object-cover"
        muted
        loop
        playsInline
        preload="metadata"
      />
      <span className="pointer-events-none absolute right-3 top-3 rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white">
        Video
      </span>
    </figure>
  );
}
