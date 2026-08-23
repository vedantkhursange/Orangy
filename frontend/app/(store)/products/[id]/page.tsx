"use client";

import { use, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BadgeCheck, Leaf, MapPin, ShoppingCart } from "lucide-react";
import { api, inr } from "@/lib/api";
import type { Cart, MediaAsset, Page as SpringPage, Product, Review } from "@/lib/types";
import { useAuth, useToast } from "@/components/providers/Providers";
import { Badge, Button, Card, EmptyState, Pagination, QtyStepper, Skeleton, Stars, Textarea } from "@/components/ui/ui";

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [variantId, setVariantId] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const router = useRouter();

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", id],
    queryFn: () => api.get<Product>(`/api/products/${id}`),
  });

  const { data: media } = useQuery({
    queryKey: ["media", id],
    queryFn: () => api.get<MediaAsset[]>(`/api/media/product/${id}`),
  });

  const variant = useMemo(() => {
    if (!product?.variants?.length) return null;
    return product.variants.find((v) => v.id === variantId) ?? product.variants[0];
  }, [product, variantId]);

  const images = useMemo(() => {
    const urls: { url: string; alt: string }[] = [];
    for (const m of media ?? []) if (m.type === "IMAGE") urls.push({ url: m.url, alt: m.altText ?? product?.name ?? "" });
    for (const v of product?.variants ?? []) if (v.thumbnailImageUrl) urls.push({ url: v.thumbnailImageUrl, alt: v.label });
    const seen = new Set<string>();
    return urls.filter((u) => !seen.has(u.url) && seen.add(u.url));
  }, [media, product]);

  const addToCart = useMutation({
    mutationFn: () => api.post<Cart>("/api/cart/items", { variantId: variant!.id, quantity: qty }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cart"] });
      toast("Added to your basket.", "success");
    },
    onError: (e) => toast(e instanceof Error ? e.message : "Could not add to cart.", "error"),
  });

  if (isLoading) {
    return (
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-10 md:grid-cols-2 md:px-8">
        <Skeleton className="aspect-square" />
        <div className="space-y-4">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-5 w-1/3" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-12 w-1/2" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20">
        <EmptyState title="Product not found" sub="It may have been removed from the harvest." action={<Button onClick={() => router.push("/products")}>Back to products</Button>} />
      </div>
    );
  }

  const outOfStock = (variant?.stockCount ?? 0) <= 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-8">
      <div className="grid gap-10 md:grid-cols-2">
        {/* gallery */}
        <div>
          <div className="relative aspect-square overflow-hidden rounded-3xl border border-ink/8 bg-sand">
            {images.length > 0 ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={images[Math.min(activeImage, images.length - 1)].url} alt={images[0].alt} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center"><Leaf className="h-16 w-16 text-orange/30" /></div>
            )}
          </div>
          {images.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              {images.map((img, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={img.url}
                  src={img.url}
                  alt={img.alt}
                  onClick={() => setActiveImage(i)}
                  className={`h-18 w-18 shrink-0 cursor-pointer rounded-xl border-2 object-cover ${i === activeImage ? "border-orange" : "border-transparent opacity-70 hover:opacity-100"}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* info */}
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="orange">{product.category}</Badge>
            {product.organicCertified && (
              <Badge tone="success"><BadgeCheck className="mr-1 h-3 w-3" /> Organic certified</Badge>
            )}
          </div>
          <h1 className="display mt-3 text-3xl font-bold text-ink md:text-4xl">{product.name}</h1>
          {product.farmSource && (
            <p className="mt-2 flex items-center gap-1.5 text-sm text-ink/60">
              <MapPin className="h-4 w-4 text-orange-deep" /> Grown at {product.farmSource}
            </p>
          )}
          {product.description && <p className="mt-4 max-w-lg leading-relaxed text-ink/70">{product.description}</p>}

          {/* variant selector */}
          <div className="mt-7">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink/55">Choose a pack</p>
            <div className="flex flex-wrap gap-2.5">
              {product.variants.map((v) => {
                const active = variant?.id === v.id;
                const empty = v.stockCount <= 0;
                return (
                  <button
                    key={v.id}
                    onClick={() => { setVariantId(v.id); setQty(1); }}
                    disabled={empty}
                    className={[
                      "rounded-xl border px-4 py-2.5 text-left transition",
                      active ? "border-orange bg-orange/8 ring-2 ring-orange/25" : "border-ink/15 hover:border-orange/60",
                      empty && "opacity-45",
                    ].filter(Boolean).join(" ")}
                  >
                    <span className="block text-sm font-semibold text-ink">{v.label}</span>
                    <span className="display block text-base font-bold text-orange-deep">{inr(v.price)}</span>
                    <span className={`block text-[11px] ${empty ? "text-[#b3362b]" : v.stockCount <= 5 ? "text-orange-deep" : "text-ink/45"}`}>
                      {empty ? "Out of stock" : v.stockCount <= 5 ? `Only ${v.stockCount} left` : "In stock"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* buy row */}
          <div className="mt-7 flex flex-wrap items-center gap-4">
            <QtyStepper value={qty} onChange={setQty} max={Math.max(1, variant?.stockCount ?? 1)} />
            <Button
              size="lg"
              disabled={!variant || outOfStock}
              loading={addToCart.isPending}
              onClick={() => {
                if (!user) { toast("Log in to start your basket.", "info"); router.push("/login"); return; }
                addToCart.mutate();
              }}
            >
              <ShoppingCart className="h-4 w-4" /> {outOfStock ? "Out of stock" : "Add to Basket"}
            </Button>
            {variant && !outOfStock && (
              <span className="text-sm text-ink/55">
                Total <span className="display font-bold text-ink">{inr(variant.price * qty)}</span>
              </span>
            )}
          </div>
        </div>
      </div>

      <ReviewsSection productId={id} />
    </div>
  );
}

/* ─────────────── reviews ─────────────── */

function ReviewsSection({ productId }: { productId: string }) {
  const [page, setPage] = useState(0);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data } = useQuery({
    queryKey: ["reviews", productId, page],
    queryFn: () => api.get<SpringPage<Review>>(`/api/reviews/product/${productId}?page=${page}&size=6`),
  });

  const submit = useMutation({
    mutationFn: () => api.post<Review>("/api/reviews", { productId, rating, comment }),
    onSuccess: () => {
      setComment("");
      qc.invalidateQueries({ queryKey: ["reviews", productId] });
      toast("Review submitted — it appears after a quick approval.", "success");
    },
    onError: (e) => toast(e instanceof Error ? e.message : "Could not submit review.", "error"),
  });

  const reviews = data?.content ?? [];
  const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : null;

  return (
    <section className="mt-16 border-t border-ink/10 pt-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="display text-2xl font-bold text-ink">Reviews</h2>
        {avg != null && (
          <span className="flex items-center gap-2 text-sm text-ink/60">
            <Stars value={Math.round(avg)} /> {avg.toFixed(1)} · {data?.totalElements} review{(data?.totalElements ?? 0) === 1 ? "" : "s"}
          </span>
        )}
      </div>

      <div className="mt-6 grid gap-8 lg:grid-cols-[3fr_2fr]">
        <div>
          {reviews.length === 0 ? (
            <EmptyState title="No reviews yet" sub="Be the first to review this harvest." />
          ) : (
            <ul className="space-y-4">
              {reviews.map((r) => (
                <Card key={r.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-ink">{r.userName ?? "Verified buyer"}</span>
                    <Stars value={r.rating} />
                  </div>
                  {r.comment && <p className="mt-2 text-sm leading-relaxed text-ink/70">{r.comment}</p>}
                  <p className="mt-2 text-xs text-ink/40">{new Date(r.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                </Card>
              ))}
            </ul>
          )}
          <Pagination page={data?.number ?? 0} totalPages={data?.totalPages ?? 0} onPage={setPage} />
        </div>

        <Card className="h-fit p-5">
          <h3 className="display text-lg font-bold text-ink">Write a review</h3>
          {user ? (
            <div className="mt-4 flex flex-col gap-4">
              <div>
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-ink/55">Your rating</p>
                <Stars value={rating} onChange={setRating} size="h-6 w-6" />
              </div>
              <Textarea rows={4} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="How was the fruit?" />
              <Button loading={submit.isPending} disabled={!comment.trim()} onClick={() => submit.mutate()}>
                Submit review
              </Button>
            </div>
          ) : (
            <p className="mt-3 text-sm text-ink/60">Log in to share your experience with this harvest.</p>
          )}
        </Card>
      </div>
    </section>
  );
}
