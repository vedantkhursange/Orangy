"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import Reveal from "@/components/animations/Reveal";
import { api } from "@/lib/api";
import type { ProductSummary } from "@/lib/types";
import ProductCard from "@/components/product/ProductCard";

/**
 * Admin-curated featured products. Renders nothing if no product is marked
 * featured yet, rather than showing an empty section to customers.
 */
export default function Products() {
  const { data: products, isLoading } = useQuery({
    queryKey: ["products", "featured"],
    queryFn: () => api.get<ProductSummary[]>("/api/products/featured?limit=4"),
  });

  if (!isLoading && (products?.length ?? 0) === 0) return null;

  return (
    <section id="products" className="relative overflow-hidden bg-surface py-20 md:py-28">
      <div className="pointer-events-none absolute -right-32 -top-32 h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle,rgb(252_116_25/0.14),transparent_65%)]" />
      <div className="pattern-dots absolute left-0 top-10 h-40 w-40 opacity-60" />
      <div className="relative mx-auto max-w-7xl px-5 md:px-10">
        <Reveal>
          <div className="flex items-end justify-between gap-4">
            <div>
              <p data-reveal className="text-xs font-extrabold uppercase tracking-[0.25em] text-brand-deep">
                The Harvest
              </p>
              <h2 data-reveal className="display mt-3 max-w-2xl text-3xl font-extrabold leading-tight text-ink md:text-5xl">
                From our branches, to your table.
              </h2>
            </div>
            <Link
              href="/products"
              className="group hidden shrink-0 items-center gap-1.5 rounded-xl bg-brand/10 px-4 py-2.5 text-sm font-bold text-brand-deep transition hover:bg-brand hover:text-white sm:inline-flex"
            >
              See all <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </Link>
          </div>
        </Reveal>

        <Reveal stagger={0.08} className="mt-10 md:mt-14">
          <div className="-mx-5 flex snap-x gap-4 overflow-x-auto px-5 pb-4 no-scrollbar sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-6 sm:overflow-visible sm:px-0 lg:grid-cols-4">
            {isLoading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} data-reveal className="w-[72vw] shrink-0 animate-pulse rounded-3xl bg-surface-2 sm:w-auto" style={{ aspectRatio: "4/5" }} />
                ))
              : products!.map((p) => (
                  <div key={p.id} data-reveal className="w-[72vw] shrink-0 snap-start sm:w-auto">
                    <ProductCard product={p} size="lg" />
                  </div>
                ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
