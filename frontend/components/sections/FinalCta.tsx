import Image from "next/image";
import Reveal from "@/components/animations/Reveal";
import { finalCta } from "@/data/site";

/** Closing statement over the final glass shot. */
export default function FinalCta() {
  return (
    <section id="contact" className="relative flex min-h-[88vh] items-center overflow-hidden">
      <Image
        src="/images/glass.webp"
        alt="A glass of fresh Orangy juice in golden light"
        fill
        sizes="100vw"
        className="object-cover"
        style={{ objectPosition: "62% 45%" }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-[#1c1208]/80 via-[#1c1208]/40 to-transparent" />

      <Reveal className="relative mx-auto w-full max-w-7xl px-6 py-28 md:px-10">
        <h2 data-reveal className="display max-w-xl text-5xl font-bold leading-[1.05] text-cream-soft md:text-7xl">
          {finalCta.title}
        </h2>
        <p data-reveal className="mt-6 max-w-md text-base leading-relaxed text-cream/80 md:text-lg">
          {finalCta.sub}
        </p>
        <div data-reveal className="mt-10 flex flex-wrap gap-4">
          <button
            type="button"
            className="rounded-full bg-orange px-8 py-4 text-sm font-semibold text-white shadow-lg shadow-orange/30 transition hover:bg-orange-deep"
          >
            {finalCta.primary}
          </button>
          <a
            href="#home"
            className="rounded-full border border-cream/40 px-8 py-4 text-sm font-semibold text-cream-soft backdrop-blur-sm transition hover:border-cream/80 hover:bg-cream/10"
          >
            {finalCta.secondary}
          </a>
        </div>
      </Reveal>
    </section>
  );
}
