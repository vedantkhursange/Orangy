import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Reveal from "@/components/animations/Reveal";
import { products } from "@/data/site";

/** Editorial product presentation — alternating image/text rows, not a card grid. */
export default function Products() {
  return (
    <section id="products" className="bg-cream py-24 md:py-36">
      <div className="mx-auto max-w-7xl px-6 md:px-10">
        <Reveal>
          <p data-reveal className="text-xs font-semibold uppercase tracking-[0.35em] text-orange-deep">
            The Harvest
          </p>
          <h2 data-reveal className="display mt-4 max-w-2xl text-4xl font-bold leading-tight text-ink md:text-5xl">
            From our branches, to your table.
          </h2>
        </Reveal>

        <div className="mt-16 flex flex-col gap-20 md:gap-28">
          {products.map((p, i) => (
            <Reveal key={p.id}>
              <article
                className={[
                  "grid items-center gap-8 md:grid-cols-2 md:gap-16",
                ].join(" ")}
              >
                <div
                  data-reveal
                  className={[
                    "group relative overflow-hidden rounded-[28px] shadow-xl shadow-earth/10",
                    i % 2 === 1 ? "md:order-2" : "",
                  ].join(" ")}
                  style={{ aspectRatio: i % 2 === 0 ? "4/3" : "16/10" }}
                >
                  <Image
                    src={p.image}
                    alt={p.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                    style={{ objectPosition: p.focus }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                  <span className="absolute left-5 top-5 rounded-full bg-cream/85 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-orange-deep backdrop-blur-sm">
                    {p.tag}
                  </span>
                </div>

                <div data-reveal className={i % 2 === 1 ? "md:order-1" : ""}>
                  <h3 className="display text-3xl font-bold text-ink md:text-4xl">{p.name}</h3>
                  <p className="mt-4 max-w-md text-base leading-relaxed text-ink/65">{p.description}</p>
                  <div className="mt-6 flex items-baseline gap-2">
                    <span className="display text-3xl font-bold text-orange-deep">{p.price}</span>
                    <span className="text-sm text-ink/50">{p.unit}</span>
                  </div>
                  <Link
                    href="/products"
                    className="group mt-7 inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-semibold text-cream-soft transition hover:bg-orange-deep"
                  >
                    Shop the Harvest
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
