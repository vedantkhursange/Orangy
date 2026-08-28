"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Page, ProductSummary } from "@/lib/types";
import ProductCard from "@/components/product/ProductCard";

export default function SimilarProducts({ category, excludeId }: { category: string; excludeId: string }) {
  const { data } = useQuery({
    queryKey: ["similar-products", category],
    queryFn: () => api.get<Page<ProductSummary>>(`/api/products?category=${encodeURIComponent(category)}&size=8`),
    enabled: !!category,
  });

  const items = (data?.content ?? []).filter((p) => p.id !== excludeId);
  if (items.length === 0) return null;

  return (
    <section className="mt-16 border-t border-ink/10 pt-10">
      <h2 className="display text-2xl font-bold text-ink">You might also like</h2>
      <div className="mt-6 flex gap-4 overflow-x-auto pb-2 md:grid md:grid-cols-4 md:overflow-visible">
        {items.slice(0, 8).map((p) => (
          <div key={p.id} className="w-40 shrink-0 md:w-auto">
            <ProductCard product={p} />
          </div>
        ))}
      </div>
    </section>
  );
}
