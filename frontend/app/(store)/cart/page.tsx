"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Leaf, Trash2 } from "lucide-react";
import { api, inr } from "@/lib/api";
import type { Cart } from "@/lib/types";
import { useAuth, useCart, useToast } from "@/components/providers/Providers";
import { Button, Card, EmptyState, QtyStepper, Skeleton } from "@/components/ui/ui";

export default function CartPage() {
  const { user, loading } = useAuth();
  const { data: cart, isLoading } = useCart();
  const qc = useQueryClient();
  const { toast } = useToast();
  const router = useRouter();

  const update = useMutation({
    mutationFn: ({ variantId, quantity }: { variantId: string; quantity: number }) =>
      api.put<Cart>(`/api/cart/items/${variantId}`, { quantity }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cart"] }),
    onError: (e) => toast(e instanceof Error ? e.message : "Could not update quantity.", "error"),
  });

  const remove = useMutation({
    mutationFn: (variantId: string) => api.del<Cart>(`/api/cart/items/${variantId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cart"] }),
    onError: (e) => toast(e instanceof Error ? e.message : "Could not remove item.", "error"),
  });

  const clear = useMutation({
    mutationFn: () => api.del<void>("/api/cart"),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cart"] }),
  });

  if (!loading && !user) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20">
        <EmptyState
          title="Your basket is waiting"
          sub="Log in to see your basket and check out."
          action={<Button onClick={() => router.push("/login")}>Log in</Button>}
        />
      </div>
    );
  }

  if (isLoading || loading) {
    return (
      <div className="mx-auto max-w-5xl space-y-4 px-4 py-10">
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
      </div>
    );
  }

  const items = cart?.items ?? [];
  const subtotal = cart?.subtotal ?? items.reduce((s, i) => s + i.lineTotal, 0);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:px-8">
      <div className="flex items-center justify-between">
        <h1 className="display text-3xl font-bold text-ink">Your basket</h1>
        {items.length > 0 && (
          <Button variant="ghost" size="sm" onClick={() => clear.mutate()} loading={clear.isPending}>
            Clear basket
          </Button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title="Nothing here yet"
            sub="The harvest is waiting — add some oranges to get started."
            action={<Link href="/products"><Button>Browse products</Button></Link>}
          />
        </div>
      ) : (
        <div className="mt-8 grid gap-8 lg:grid-cols-[5fr_2fr]">
          <ul className="space-y-4">
            {items.map((item) => (
              <Card key={item.variantId} className="flex items-center gap-4 p-4">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-sand">
                  {item.thumbnailUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.thumbnailUrl} alt={item.productName} className="h-full w-full object-cover" />
                  ) : (
                    <Leaf className="h-8 w-8 text-orange/40" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-ink">{item.productName}</p>
                  <p className="text-sm text-ink/55">{item.variantLabel} · {inr(item.unitPrice)} each</p>
                  <div className="mt-2 flex items-center gap-4">
                    <QtyStepper
                      small
                      value={item.quantity}
                      onChange={(q) => update.mutate({ variantId: item.variantId, quantity: q })}
                    />
                    <button
                      onClick={() => remove.mutate(item.variantId)}
                      className="flex items-center gap-1 text-xs font-medium text-[#b3362b] hover:underline"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Remove
                    </button>
                  </div>
                </div>
                <span className="display shrink-0 text-lg font-bold text-ink">{inr(item.lineTotal)}</span>
              </Card>
            ))}
          </ul>

          <Card className="h-fit p-5">
            <h2 className="display text-lg font-bold text-ink">Summary</h2>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between text-ink/70">
                <dt>Subtotal ({items.reduce((n, i) => n + i.quantity, 0)} items)</dt>
                <dd className="font-semibold text-ink">{inr(subtotal)}</dd>
              </div>
              <div className="flex justify-between text-ink/50">
                <dt>Taxes & delivery</dt>
                <dd>Calculated at checkout</dd>
              </div>
            </dl>
            <Button size="lg" className="mt-5 w-full" onClick={() => router.push("/checkout")}>
              Proceed to Checkout
            </Button>
            <Link href="/products" className="mt-3 block text-center text-sm text-orange-deep hover:underline">
              Continue shopping
            </Link>
          </Card>
        </div>
      )}
    </div>
  );
}
