"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Leaf } from "lucide-react";
import Reveal from "@/components/animations/Reveal";
import { api, inr } from "@/lib/api";
import type { ProductSummary } from "@/lib/types";

/**
 * Admin-curated featured products — a uniform card grid, not the old
 * alternating left/right editorial rows. Renders nothing if no product is
 * marked featured yet, rather than showing an empty section to customers.
 */
export default function Products() {
  const { data: products, isLoading } = useQuery({
    queryKey: ["products", "featured"],
    queryFn: () => api.get<ProductSummary[]>("/api/products/featured?limit=4"),
  });

  if (!isLoading && (products?.length ?? 0) === 0) return null;

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

        <Reveal stagger={0.08} className="mt-14">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {isLoading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} data-reveal className="animate-pulse overflow-hidden rounded-[24px] bg-sand" style={{ aspectRatio: "3/4" }} />
                ))
              : products!.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function ProductCard({ product }: { product: ProductSummary }) {
  return (
    <article data-reveal className="group flex flex-col">
      <Link
        href={`/products/${product.id}`}
        className="relative block overflow-hidden rounded-[24px] shadow-lg shadow-earth/10"
        style={{ aspectRatio: "4/5" }}
      >
        {product.thumbnailUrl ? (
          // Cloudinary URL — next/image needs the host allow-listed via
          // images.remotePatterns, which isn't configured; matches the
          // plain <img> convention already used elsewhere for this.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.thumbnailUrl}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.05]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-sand">
            <Leaf className="h-10 w-10 text-orange/30" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
        {product.category && (
          <span className="absolute left-4 top-4 rounded-full bg-cream/90 px-3.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-orange-deep backdrop-blur-sm">
            {product.category}
          </span>
        )}
      </Link>

      <div className="mt-4">
        <h3 className="display text-xl font-bold text-ink">{product.name}</h3>
        {product.description && (
          <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-ink/60">{product.description}</p>
        )}
        <div className="mt-3 flex items-center justify-between">
          <span className="display text-lg font-bold text-orange-deep">
            {product.startingPrice != null ? inr(product.startingPrice) : "—"}
          </span>
          <Link
            href={`/products/${product.id}`}
            className="group/link inline-flex items-center gap-1 text-sm font-semibold text-ink transition hover:text-orange-deep"
          >
            Shop
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover/link:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </article>
  );
}
