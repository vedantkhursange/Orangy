"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Search, SlidersHorizontal } from "lucide-react";
import { api } from "@/lib/api";
import type { Page, ProductSummary } from "@/lib/types";
import { Button, Card, EmptyState, Input, Pagination, Select, Skeleton } from "@/components/ui/ui";
import ProductCard from "@/components/product/ProductCard";

function ProductsInner() {
  const params = useSearchParams();
  const [page, setPage] = useState(0);
  const [category, setCategory] = useState(params.get("category") ?? "");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"relevance" | "price-asc" | "price-desc">("relevance");

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

  // Category chips come from the whole catalogue, not just the current page.
  const { data: all } = useQuery({
    queryKey: ["products", "all-categories"],
    queryFn: () => api.get<Page<ProductSummary>>("/api/products?size=100"),
    staleTime: 5 * 60_000,
  });
  const categories = useMemo(() => {
    const set = new Set<string>((all?.content ?? []).map((p) => p.category).filter(Boolean));
    if (category) set.add(category);
    return [...set].sort();
  }, [all, category]);

  // The API has no text search or sort yet; both run over the loaded page.
  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = (data?.content ?? []).filter(
      (p) => !q || p.name.toLowerCase().includes(q) || (p.description ?? "").toLowerCase().includes(q),
    );
    const price = (p: ProductSummary) => p.startingPrice ?? Number.MAX_SAFE_INTEGER;
    if (sort === "price-asc") list.sort((a, b) => price(a) - price(b));
    if (sort === "price-desc") list.sort((a, b) => price(b) - price(a));
    return list;
  }, [data, search, sort]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-8 md:py-10">
      <div>
        <p className="text-xs font-extrabold uppercase tracking-[0.25em] text-brand-deep">The Harvest</p>
        <h1 className="display mt-1 text-3xl font-extrabold text-ink md:text-4xl">Shop the groves</h1>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <label className="relative min-w-0 flex-1 basis-60">
          <span className="sr-only">Search products</span>
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <Input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search oranges, juice…"
            className="!rounded-2xl !py-3 pl-11"
          />
        </label>
        <label className="w-44">
          <span className="sr-only">Sort</span>
          <Select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} className="!rounded-2xl !py-3">
            <option value="relevance">Sort: Relevance</option>
            <option value="price-asc">Price: low to high</option>
            <option value="price-desc">Price: high to low</option>
          </Select>
        </label>
        <Button variant="outline" size="md" onClick={() => setFiltersOpen((v) => !v)} aria-expanded={filtersOpen}>
          <SlidersHorizontal className="h-4 w-4" /> Filters
        </Button>
      </div>

      {categories.length > 0 && (
        <div className="-mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-1 no-scrollbar">
          {["", ...categories].map((c) => {
            const active = category === c;
            return (
              <button
                key={c || "all"}
                onClick={() => { setCategory(c); setPage(0); }}
                aria-pressed={active}
                className={`shrink-0 rounded-full border-2 px-4 py-1.5 text-sm font-bold transition ${
                  active ? "border-brand bg-brand text-white" : "border-line bg-surface text-ink hover:border-brand/50"
                }`}
              >
                {c || "All"}
              </button>
            );
          })}
        </div>
      )}

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
      ) : !data || shown.length === 0 ? (
        <div className="mt-8">
          <EmptyState title="No produce matches" sub="Try clearing the filters — the next harvest may add more." />
        </div>
      ) : (
        <>
          <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 lg:grid-cols-4">
            {shown.map((p) => (
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
