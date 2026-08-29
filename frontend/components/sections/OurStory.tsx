"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import Reveal from "@/components/animations/Reveal";
import { story } from "@/data/site";
import type { MediaAsset } from "@/lib/types";

const SLIDE_MS = 4500;

export default function OurStory() {
  const { data: slides } = useQuery({
    queryKey: ["media", "story"],
    queryFn: () => api.get<MediaAsset[]>("/api/media/story"),
  });
  const ordered = [...(slides ?? [])].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <section id="story" className="relative overflow-hidden bg-cream py-24 md:py-36">
      <div className="mx-auto grid max-w-7xl items-center gap-14 px-6 md:grid-cols-2 md:gap-20 md:px-10">
        <Reveal>
          <div data-reveal>
            {ordered.length > 0 ? (
              <StorySlideshow slides={ordered} />
            ) : (
              <div
                className="relative overflow-hidden rounded-[28px] shadow-2xl shadow-earth/15"
                style={{ aspectRatio: "4/5" }}
              >
                <Image
                  src="/images/orchard-mist.webp"
                  alt="Morning mist over the Orange Express family orchard"
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover"
                  style={{ objectPosition: "70% 50%" }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-earth/30 via-transparent to-transparent" />
              </div>
            )}
          </div>
        </Reveal>

        <Reveal stagger={0.14}>
          <p data-reveal className="text-xs font-semibold uppercase tracking-[0.35em] text-orange-deep">
            {story.kicker}
          </p>
          <h2 data-reveal className="display mt-4 text-4xl font-bold leading-tight text-ink md:text-5xl">
            {story.title}
          </h2>
          {story.paragraphs.map((p, i) => (
            <p key={i} data-reveal className="mt-6 max-w-xl leading-relaxed text-ink/65">
              {p}
            </p>
          ))}
          <dl data-reveal className="mt-10 grid grid-cols-3 gap-6 border-t border-ink/10 pt-8">
            {story.stats.map((s) => (
              <div key={s.label}>
                <dt className="sr-only">{s.label}</dt>
                <dd className="display text-3xl font-bold text-orange-deep md:text-4xl">{s.value}</dd>
                <dd className="mt-1 text-xs uppercase tracking-wider text-ink/50">{s.label}</dd>
              </div>
            ))}
          </dl>
        </Reveal>
      </div>
    </section>
  );
}

/** Auto-advancing image/video slideshow — same rotate-and-fade pattern as OffersPanel. */
function StorySlideshow({ slides }: { slides: MediaAsset[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (slides.length < 2) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % slides.length), SLIDE_MS);
    return () => clearInterval(timer);
  }, [slides.length]);

  return (
    <div
      className="relative overflow-hidden rounded-[28px] shadow-2xl shadow-earth/15"
      style={{ aspectRatio: "4/5" }}
    >
      {slides.map((slide, i) => {
        const active = i === index;
        return (
          <div
            key={slide.id}
            aria-hidden={!active}
            className={`absolute inset-0 transition-opacity duration-700 ease-out ${active ? "opacity-100" : "opacity-0"}`}
          >
            {slide.type === "IMAGE" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={slide.url} alt={slide.altText ?? ""} className="h-full w-full object-cover" />
            ) : (
              <video
                src={slide.url}
                className="h-full w-full object-cover"
                autoPlay={active}
                muted
                loop
                playsInline
              />
            )}
          </div>
        );
      })}
      <div className="absolute inset-0 bg-gradient-to-t from-earth/30 via-transparent to-transparent" />

      {slides.length > 1 && (
        <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 gap-1.5">
          {slides.map((s, i) => (
            <button
              key={s.id}
              aria-label={`Show slide ${i + 1}`}
              onClick={() => setIndex(i)}
              className={`h-1.5 rounded-full transition-all ${i === index ? "w-5 bg-white" : "w-1.5 bg-white/50"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
