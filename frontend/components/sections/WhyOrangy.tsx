import Reveal from "@/components/animations/Reveal";
import { whyOrangy } from "@/data/site";

/** Sticky visual on the left, numbered story-points scrolling on the right. */
export default function WhyOrangy() {
  return (
    <section data-orange="left" data-model="tree" data-anim="orbit" data-x="-0.22" data-y="-0.14" data-scale="1.35" className="relative py-24 md:py-36">
      <div className="mx-auto grid max-w-7xl gap-14 px-6 md:grid-cols-[5fr_6fr] md:gap-20 md:px-10">
        <div className="md:sticky md:top-28 md:self-start">
          <Reveal>
            <p data-reveal className="text-xs font-semibold uppercase tracking-[0.35em] text-orange-deep">
              {whyOrangy.kicker}
            </p>
            <h2 data-reveal className="display mt-4 text-4xl font-bold leading-tight text-ink md:text-5xl">
              {whyOrangy.title}
            </h2>
            {/* the 3D orange from <OrangeStage/> floats in this space on desktop */}
            <div className="mt-10 hidden md:block" style={{ aspectRatio: "4/3" }} aria-hidden />
          </Reveal>
        </div>

        <Reveal stagger={0.1}>
          <ol className="flex flex-col">
            {whyOrangy.points.map((pt) => (
              <li key={pt.n} data-reveal className="glass group mb-4 rounded-3xl p-6 md:p-8">
                <div className="flex items-start gap-6">
                  <span className="display text-sm font-bold text-orange-deep/60 transition-colors group-hover:text-orange-deep md:text-base">
                    {pt.n}
                  </span>
                  <div>
                    <h3 className="display text-2xl font-semibold text-ink md:text-3xl">{pt.title}</h3>
                    <p className="mt-2 max-w-md leading-relaxed text-ink/60">{pt.body}</p>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </Reveal>
      </div>
    </section>
  );
}
