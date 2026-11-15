"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { cdn } from "@/lib/media";
import type { Page, ProductSummary } from "@/lib/types";
import GuestReviewForm from "@/components/review/GuestReviewForm";
import { Card, Skeleton } from "@/components/ui/ui";

/**
 * The page the gift-card QR code opens. No login: pick the product (skipped
 * when there is only one, or when ?product= is in the link) and leave stars,
 * name, city, a note and a photo.
 */
export default function ReviewLanding() {
  const params = useSearchParams();
  const [picked, setPicked] = useState<string | null>(params.get("product"));

  const { data, isLoading } = useQuery({
    queryKey: ["products", "review-picker"],
    queryFn: () => api.get<Page<ProductSummary>>("/api/products?size=50"),
  });
  const products = useMemo(() => data?.content ?? [], [data]);
  const productId = picked ?? (products.length === 1 ? products[0].id : null);
  const product = products.find((p) => p.id === productId);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 md:py-16">
      <p className="text-center text-xs font-semibold uppercase tracking-[0.3em] text-orange">Ambia bahar harvest</p>
      <h1 className="display mt-3 text-center text-4xl font-bold text-ink md:text-5xl">
        How were your <span className="text-gradient">oranges?</span>
      </h1>
      <p className="mx-auto mt-3 max-w-md text-center text-ink/60">
        Thank you for trying Orange Express. A rating and a photo from you helps a small family farm more than you know.
      </p>

      {isLoading ? (
        <Skeleton className="mt-10 h-80 w-full rounded-3xl" />
      ) : (
        <Card className="mt-10 p-6 md:p-8">
          {products.length > 1 && (
            <div className="mb-6">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink/55">Which one did you get?</p>
              <div className="flex flex-wrap gap-2">
                {products.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPicked(p.id)}
                    className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold transition ${
                      p.id === productId ? "border-orange bg-orange/15 text-white" : "border-white/15 text-white/70 hover:border-white/35"
                    }`}
                  >
                    {p.thumbnailUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={cdn(p.thumbnailUrl, 80)} alt="" className="h-6 w-6 rounded-full object-cover" />
                    )}
                    {p.name}
                  </button>
                ))}
              </div>
            </div>
          )}
          {product && products.length === 1 && (
            <div className="mb-6 flex items-center gap-3">
              {product.thumbnailUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={cdn(product.thumbnailUrl, 120)} alt="" className="h-12 w-12 rounded-xl object-cover" />
              )}
              <p className="display text-lg font-bold text-ink">{product.name}</p>
            </div>
          )}
          {productId ? (
            <GuestReviewForm key={productId} productId={productId} />
          ) : (
            <p className="py-6 text-center text-sm text-ink/55">
              {products.length ? "Pick the product above to leave your review." : "Reviews open as soon as the harvest is listed."}
            </p>
          )}
        </Card>
      )}
    </div>
  );
}
