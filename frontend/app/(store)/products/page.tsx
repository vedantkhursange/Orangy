"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { SlidersHorizontal } from "lucide-react";
import { api } from "@/lib/api";
import type { Page, ProductSummary } from "@/lib/types";
import { Button, Card, EmptyState, Input, Pagination, Skeleton } from "@/components/ui/ui";
import ProductCard from "@/components/product/ProductCard";

function ProductsInner() {
  const params = useSearchParams();
  const [page, setPage] = useState(0);
  const [category, setCategory] = useState(params.get("category") ?? "");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const query = useMemo(() => {
    const q = new URLSearchParams({ page: String(page), size: "12" });
    if (category) q.set("category", category);
    if (minPrice) q.set("minPrice", minPrice);
    if (maxPrice) q.set("maxPrice", maxPrice);
    return q.toString();
  }, [page, category, minPrice, maxPrice]);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["products", query],
    queryFn: () => api.get<Page<ProductSummary>>(`/api/products?${query}`),
  });

  const categories = useMemo(() => {
    const set = new Set<string>((data?.content ?? []).map((p) => p.category).filter(Boolean));
    if (category) set.add(category);
    return [...set];
  }, [data, category]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-orange-deep">The Harvest</p>
          <h1 className="display mt-1 text-3xl font-bold text-ink md:text-4xl">Shop the groves</h1>
        </div>
        <Button variant="outline" size="sm" onClick={() => setFiltersOpen((v) => !v)}>
          <SlidersHorizontal className="h-4 w-4" /> Filters
        </Button>
      </div>

      {filtersOpen && (
        <Card className="mt-5 flex flex-wrap items-end gap-4 p-4">
          <label className="w-44">
            <span className="mb-1 block text-xs font-semibold text-ink/55">Category</span>
            <Input value={category} onChange={(e) => { setCategory(e.target.value); setPage(0); }} placeholder="e.g. Oranges" list="orangy-categories" />
            <datalist id="orangy-categories">
              {categories.map((c) => <option key={c} value={c} />)}
            </datalist>
          </label>
          <label className="w-32">
            <span className="mb-1 block text-xs font-semibold text-ink/55">Min price</span>
            <Input type="number" min={0} value={minPrice} onChange={(e) => { setMinPrice(e.target.value); setPage(0); }} placeholder="₹" />
          </label>
          <label className="w-32">
            <span className="mb-1 block text-xs font-semibold text-ink/55">Max price</span>
            <Input type="number" min={0} value={maxPrice} onChange={(e) => { setMaxPrice(e.target.value); setPage(0); }} placeholder="₹" />
          </label>
          <Button variant="ghost" size="sm" onClick={() => { setCategory(""); setMinPrice(""); setMaxPrice(""); setPage(0); }}>
            Clear all
          </Button>
        </Card>
      )}

      {isLoading ? (
        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i}>
              <Skeleton className="aspect-square" />
              <Skeleton className="mt-3 h-4 w-3/4" />
              <Skeleton className="mt-2 h-4 w-1/3" />
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="mt-8">
          <EmptyState
            title="Couldn't reach the grove"
            sub="The backend didn't answer. It may be waking up — try again."
            action={<Button onClick={() => refetch()}>Retry</Button>}
          />
        </div>
      ) : !data || data.content.length === 0 ? (
        <div className="mt-8">
          <EmptyState title="No produce matches" sub="Try clearing the filters — the next harvest may add more." />
        </div>
      ) : (
        <>
          <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 lg:grid-cols-4">
            {data.content.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
          <Pagination page={data.number} totalPages={data.totalPages} onPage={setPage} />
        </>
      )}
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense>
      <ProductsInner />
    </Suspense>
  );
}
