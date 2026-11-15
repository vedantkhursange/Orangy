import Link from "next/link";
import { ArrowDown, ShoppingBag } from "lucide-react";
import { hero } from "@/data/site";

/**
 * Apple-style opener: oversized type on black, the 3D orange (rendered by
 * <OrangeStage/>) floating on the right on desktop and above the copy on phones.
 */
export default function Hero() {
  return (
    <section
      id="home"
      data-orange="right"
      data-scale="1.05"
      data-mobile="1"
      className="relative flex min-h-[100svh] items-end overflow-hidden pb-20 pt-[46svh] lg:items-center lg:pb-0 lg:pt-28"
    >
      <div className="relative mx-auto w-full max-w-7xl px-6 md:px-10">
        <div className="max-w-xl lg:max-w-[46%]">
          <p className="glass inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.25em] text-orange-glow">
            <span className="h-1.5 w-1.5 rounded-full bg-orange shadow-[0_0_12px_2px] shadow-orange" />
            {hero.kicker}
          </p>
          <h1 className="display mt-6 text-[clamp(2.5rem,8vw,6.5rem)] font-bold leading-[0.95] tracking-tight">
            <span className="block text-white">{hero.headline[0]}</span>
            <span className="text-gradient block">{hero.headline[1]}</span>
          </h1>
          <p className="mt-6 max-w-md text-base leading-relaxed text-white/65 md:text-lg">{hero.sub}</p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link
              href="/products"
              className="orange-ring inline-flex items-center gap-2 rounded-full bg-orange px-7 py-3.5 text-sm font-bold text-white transition hover:brightness-110"
            >
              <ShoppingBag className="h-4 w-4" /> Shop the harvest
            </Link>
            <Link
              href="#story"
              className="glass inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-bold text-white transition hover:border-white/30"
            >
              Our story
            </Link>
          </div>
        </div>
      </div>
      <a href="#experience" aria-label="Scroll down" className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 text-white/40 transition hover:text-white md:block">
        <ArrowDown className="h-5 w-5 animate-bounce" />
      </a>
    </section>
  );
}
