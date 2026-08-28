import Image from "next/image";
import Reveal from "@/components/animations/Reveal";
import { story } from "@/data/site";

export default function OurStory() {
  return (
    <section id="story" className="relative overflow-hidden bg-cream py-24 md:py-36">
      <div className="mx-auto grid max-w-7xl items-center gap-14 px-6 md:grid-cols-2 md:gap-20 md:px-10">
        <Reveal>
          <div
            data-reveal
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
