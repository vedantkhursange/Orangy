import Link from "next/link";
import Reveal from "@/components/animations/Reveal";
import { finalCta } from "@/data/site";

/** Closing statement. The 3D basket from <OrangeStage/> sits on the right. */
export default function FinalCta() {
  return (
    <section id="contact" data-orange="right" data-model="basket" data-scale="1.5" data-mobile="1" className="relative flex min-h-[90svh] items-center overflow-hidden">
      <Reveal className="relative mx-auto w-full max-w-7xl px-6 pb-16 pt-[46svh] md:px-10 lg:py-28">
        <div className="glass max-w-xl rounded-[32px] p-8 md:p-12">
          <h2 data-reveal className="display text-4xl font-bold leading-[1.05] text-white md:text-6xl">
            <span className="text-gradient">{finalCta.title}</span>
          </h2>
          <p data-reveal className="mt-5 max-w-md text-base leading-relaxed text-white/70 md:text-lg">
            {finalCta.sub}
          </p>
          <div data-reveal className="mt-8 flex flex-wrap gap-3">
            <Link href="/products" className="orange-ring rounded-full bg-orange px-7 py-3.5 text-sm font-bold text-white transition hover:brightness-110">
              {finalCta.primary}
            </Link>
            <Link href="/review" className="rounded-full border border-white/20 bg-white/5 px-7 py-3.5 text-sm font-bold text-white backdrop-blur-md transition hover:border-white/40">
              Leave a review
            </Link>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
