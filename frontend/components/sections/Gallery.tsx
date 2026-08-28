import Image from "next/image";
import Reveal from "@/components/animations/Reveal";
import { gallery } from "@/data/site";

/** Editorial masonry gallery (CSS columns), captions on hover. */
export default function Gallery() {
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
          <div className="columns-1 gap-6 sm:columns-2 lg:columns-3 [&>figure]:mb-6">
            {gallery.map((g) => (
              <figure
                key={g.id}
                data-reveal
                className="group relative break-inside-avoid overflow-hidden rounded-3xl"
                style={{ aspectRatio: g.ratio }}
              >
                <Image
                  src={g.src}
                  alt={g.caption}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-[1.05]"
                  style={{ objectPosition: g.focus }}
                />
                <figcaption className="absolute inset-x-0 bottom-0 translate-y-2 bg-gradient-to-t from-black/60 to-transparent p-5 pt-12 text-sm font-medium text-white opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
                  {g.caption}
                </figcaption>
              </figure>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
