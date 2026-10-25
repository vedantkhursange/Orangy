"use client";

import { use, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BadgeCheck, MapPin, ShieldCheck, ShoppingCart, Truck, Zap } from "lucide-react";
import { api, inr } from "@/lib/api";
import type { Cart, MediaAsset, Page as SpringPage, Product, Review } from "@/lib/types";
import { useAuth, useCart, useToast } from "@/components/providers/Providers";
import ProductGallery from "@/components/product/ProductGallery";
import type { ViewerItem } from "@/components/media/MediaViewer";
import OffersPanel from "@/components/product/OffersPanel";
import SimilarProducts from "@/components/product/SimilarProducts";
import { Badge, Button, Card, EmptyState, Pagination, QtyStepper, Skeleton, Stars, Textarea } from "@/components/ui/ui";

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [variantId, setVariantId] = useState<string | null>(null);
  const [variantError, setVariantError] = useState(false);
  const [buyingNow, setBuyingNow] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: cart } = useCart();
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

  // Default to the cheapest in-stock pack (Swiggy/Zepto pattern) so a single
  // tap can add to basket; the shopper can still switch packs.
  const defaultVariantId = useMemo(() => {
    const all = product?.variants ?? [];
    const inStock = all.filter((v) => v.stockCount > 0);
    return [...(inStock.length ? inStock : all)].sort((a, b) => a.price - b.price)[0]?.id ?? null;
  }, [product]);
  const variant = useMemo(
    () => product?.variants?.find((v) => v.id === (variantId ?? defaultVariantId)) ?? null,
    [product, variantId, defaultVariantId],
  );

  const mediaItems = useMemo(() => {
    const out: ViewerItem[] = [];
    const sorted = [...(media ?? [])].sort((a, b) => a.sortOrder - b.sortOrder);
    sorted.forEach((m, i) =>
      out.push({ type: m.type, url: m.url, alt: m.altText || `${product?.name ?? "Product"} photo ${i + 1}` }),
    );
    for (const v of product?.variants ?? [])
      if (v.thumbnailImageUrl) out.push({ type: "IMAGE", url: v.thumbnailImageUrl, alt: `${product?.name ?? ""} ${v.label}`.trim() });
    const seen = new Set<string>();
    return out.filter((u) => !seen.has(u.url) && seen.add(u.url));
  }, [media, product]);

  // Quantity of the selected variant already sitting in the server cart —
  // drives the Add-to-Basket → +/- stepper morph (Blinkit/Instamart pattern).
  const cartQty = useMemo(
    () => cart?.items.find((i) => i.variantId === variant?.id)?.quantity ?? 0,
    [cart, variant],
  );

  const addToCart = useMutation({
    mutationFn: (quantity: number) => api.post<Cart>("/api/cart/items", { variantId: variant!.id, quantity }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cart"] }),
    onError: (e) => toast(e instanceof Error ? e.message : "Could not add to cart.", "error"),
  });

  const updateCartQty = useMutation({
    mutationFn: (quantity: number) => api.put<Cart>(`/api/cart/items/${variant!.id}`, { quantity }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cart"] }),
    onError: (e) => toast(e instanceof Error ? e.message : "Could not update quantity.", "error"),
  });

  const removeFromCart = useMutation({
    mutationFn: () => api.del<Cart>(`/api/cart/items/${variant!.id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cart"] }),
    onError: (e) => toast(e instanceof Error ? e.message : "Could not remove item.", "error"),
  });

  const requireVariant = () => {
    if (variant) {
      setVariantError(false);
      return true;
    }
    setVariantError(true);
    return false;
  };

  const handleAddToBasket = () => {
    if (!user) { toast("Log in to start your basket.", "info"); router.push("/login"); return; }
    if (!requireVariant()) return;
    addToCart.mutate(1);
    toast("Added to your basket.", "success");
  };

  const handleBuyNow = async () => {
    if (!user) { toast("Log in to continue.", "info"); router.push("/login"); return; }
    if (!requireVariant()) return;
    setBuyingNow(true);
    try {
      if (cartQty === 0) await addToCart.mutateAsync(1);
      router.push("/checkout"); // skip the cart review page, like Buy Now on Amazon/Flipkart
    } finally {
      setBuyingNow(false);
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-10 md:grid-cols-2 md:px-8">
        <Skeleton className="aspect-square w-full rounded-[28px]" />
        <div className="space-y-4">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-16 w-2/3" />
          <Skeleton className="h-12 w-1/2 rounded-full" />
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

  const outOfStock = variant ? variant.stockCount <= 0 : false;

  const basketControl = (size: "md" | "lg") =>
    cartQty > 0 && variant && !outOfStock ? (
      <div className="flex items-center rounded-2xl border border-action/30 bg-action/8 px-2 py-1">
        <QtyStepper
          value={cartQty}
          max={variant.stockCount}
          min={0}
          onChange={(next) => {
            if (next <= 0) removeFromCart.mutate();
            else updateCartQty.mutate(next);
          }}
        />
      </div>
    ) : (
      <Button size={size} variant="action" disabled={outOfStock} loading={addToCart.isPending} onClick={handleAddToBasket}>
        <ShoppingCart className="h-4 w-4" /> {outOfStock ? "Out of stock" : "Add to Basket"}
      </Button>
    );

  return (
    <div className="mx-auto max-w-7xl px-4 pb-28 pt-4 md:px-8 md:pb-12 md:pt-10">
      <div className="grid gap-8 md:grid-cols-2 md:gap-12">
        {/* gallery */}
        <ProductGallery items={mediaItems} />

        {/* info */}
        <div>
          <div className="flex flex-wrap items-center gap-2">
            {product.category && <Badge tone="orange">{product.category}</Badge>}
            {product.organicCertified && (
              <Badge tone="success"><BadgeCheck className="mr-1 h-3 w-3" /> Organic certified</Badge>
            )}
          </div>
          <h1 className="display mt-3 text-3xl font-extrabold leading-tight text-ink md:text-[42px]">{product.name}</h1>
          {product.farmSource && (
            <p className="mt-2 flex items-center gap-1.5 text-sm text-muted">
              <MapPin className="h-4 w-4 text-brand" /> Grown at {product.farmSource}
            </p>
          )}

          {variant && (
            <p className="mt-5 flex items-baseline gap-2">
              <span className="display text-3xl font-extrabold text-ink">{inr(variant.price)}</span>
              <span className="text-sm font-medium text-muted">/ {variant.label}</span>
            </p>
          )}

          {product.description && <p className="mt-4 max-w-lg leading-relaxed text-ink/75">{product.description}</p>}

          {/* variant selector */}
          <div className="mt-7">
            <p className="mb-2.5 text-xs font-bold uppercase tracking-wider text-muted">Choose a pack</p>
            <div
              className={[
                "grid grid-cols-2 gap-2.5 rounded-2xl transition sm:grid-cols-3",
                variantError && "-m-2 border-2 border-danger p-2",
              ].filter(Boolean).join(" ")}
            >
              {product.variants.map((v) => {
                const active = variant?.id === v.id;
                const empty = v.stockCount <= 0;
                return (
                  <button
                    key={v.id}
                    onClick={() => { setVariantId(v.id); setVariantError(false); }}
                    disabled={empty}
                    aria-pressed={active}
                    className={[
                      "relative rounded-2xl border-2 bg-surface px-4 py-3 text-left transition",
                      active ? "border-brand bg-brand/6 shadow-card" : "border-line hover:border-brand/50",
                      empty && "opacity-45",
                    ].filter(Boolean).join(" ")}
                  >
                    {active && (
                      <span className="absolute right-2.5 top-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-brand text-white">
                        <BadgeCheck className="h-3.5 w-3.5" />
                      </span>
                    )}
                    <span className="block text-sm font-bold text-ink">{v.label}</span>
                    <span className="display mt-0.5 block text-lg font-extrabold text-ink">{inr(v.price)}</span>
                    <span className={`mt-0.5 block text-[11px] font-semibold ${empty ? "text-danger" : v.stockCount <= 5 ? "text-brand" : "text-action"}`}>
                      {empty ? "Out of stock" : v.stockCount <= 5 ? `Only ${v.stockCount} left` : "In stock"}
                    </span>
                  </button>
                );
              })}
            </div>
            {variantError && (
              <p className="mt-2 text-sm font-medium text-danger">Please select a pack to continue.</p>
            )}
          </div>

          {/* buy row (desktop; phones get the sticky bar) */}
          <div className="mt-7 hidden flex-wrap items-center gap-3 md:flex">
            {basketControl("lg")}
            <Button size="lg" disabled={outOfStock} loading={buyingNow} onClick={handleBuyNow}>
              <Zap className="h-4 w-4" /> Buy Now
            </Button>
          </div>

          <ul className="mt-7 grid grid-cols-3 gap-2 text-center text-[11px] font-semibold text-muted">
            <li className="rounded-2xl bg-surface-2 px-2 py-3"><Truck className="mx-auto mb-1 h-5 w-5 text-brand" />Picked to order</li>
            <li className="rounded-2xl bg-surface-2 px-2 py-3"><BadgeCheck className="mx-auto mb-1 h-5 w-5 text-action" />Farmer-owned</li>
            <li className="rounded-2xl bg-surface-2 px-2 py-3"><ShieldCheck className="mx-auto mb-1 h-5 w-5 text-ink/60" />Secure payment</li>
          </ul>

          <OffersPanel />
        </div>
      </div>

      {product.category && <SimilarProducts category={product.category} excludeId={id} />}

      <ReviewsSection productId={id} />

      {/* sticky buy bar on phones */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 px-4 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-3 shadow-[0_-8px_24px_rgba(0,0,0,0.06)] backdrop-blur md:hidden">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            {variant ? (
              <>
                <p className="display text-lg font-extrabold leading-none text-ink">{inr(variant.price)}</p>
                <p className="mt-1 truncate text-xs text-muted">{variant.label}</p>
              </>
            ) : (
              <p className="text-sm font-semibold text-muted">Choose a pack</p>
            )}
          </div>
          {basketControl("md")}
          <Button size="md" disabled={outOfStock} loading={buyingNow} onClick={handleBuyNow}>
            Buy
          </Button>
        </div>
      </div>
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
