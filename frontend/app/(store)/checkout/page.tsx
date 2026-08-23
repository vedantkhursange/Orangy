"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, MapPin, Plus } from "lucide-react";
import { api, inr } from "@/lib/api";
import type { Address, AddressRequest, Order } from "@/lib/types";
import { useAuth, useCart, useToast } from "@/components/providers/Providers";
import AddressForm from "@/components/account/AddressForm";
import { Badge, Button, Card, Dialog, EmptyState, Skeleton } from "@/components/ui/ui";

/**
 * Checkout: pick/add a delivery address → place the order → pay.
 * The backend creates a Razorpay order id (mock fallback in dev): mock ids get
 * a "simulate payment" flow that calls verify-payment with dummy credentials.
 */
export default function CheckoutPage() {
  const { user, loading } = useAuth();
  const { data: cart, isLoading: cartLoading } = useCart();
  const [selected, setSelected] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null);
  const qc = useQueryClient();
  const { toast } = useToast();
  const router = useRouter();

  const { data: addresses, isLoading: addrLoading } = useQuery({
    queryKey: ["addresses"],
    queryFn: () => api.get<Address[]>("/api/users/me/addresses"),
    enabled: !!user,
  });

  const createAddress = useMutation({
    mutationFn: (address: AddressRequest) => api.post<Address>("/api/users/me/addresses", address),
    onSuccess: (created) => {
      qc.invalidateQueries({ queryKey: ["addresses"] });
      setSelected(created.id);
      setAdding(false);
      toast("Address saved.", "success");
    },
    onError: (e) => toast(e instanceof Error ? e.message : "Could not save address.", "error"),
  });

  const placeOrder = useMutation({
    mutationFn: () => {
      const address = (addresses ?? []).find((a) => a.id === selected)!;
      const { id: _id, ...deliveryAddress } = address;
      return api.post<Order>("/api/orders", { deliveryAddress });
    },
    onSuccess: (order) => {
      qc.invalidateQueries({ queryKey: ["cart"] });
      qc.invalidateQueries({ queryKey: ["orders"] });
      setPlacedOrder(order);
    },
    onError: (e) => toast(e instanceof Error ? e.message : "Could not place the order.", "error"),
  });

  const verifyPayment = useMutation({
    mutationFn: () =>
      api.post<Order>("/api/orders/verify-payment", {
        razorpayOrderId: placedOrder!.razorpayOrderId,
        razorpayPaymentId: `pay_mock_${Date.now()}`,
        razorpaySignature: "mock_signature",
      }),
    onSuccess: (order) => {
      setPlacedOrder(order);
      qc.invalidateQueries({ queryKey: ["orders"] });
      toast("Payment confirmed — the grove is packing your order!", "success");
    },
    onError: (e) => toast(e instanceof Error ? e.message : "Payment verification failed.", "error"),
  });

  if (!loading && !user) {
    router.push("/login");
    return null;
  }

  if (loading || cartLoading || addrLoading) {
    return (
      <div className="mx-auto max-w-5xl space-y-4 px-4 py-10">
        <Skeleton className="h-32" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  /* ── success screen ── */
  if (placedOrder) {
    const paid = placedOrder.paymentStatus?.toUpperCase() === "PAID";
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <CheckCircle2 className={`mx-auto h-16 w-16 ${paid ? "text-leaf" : "text-orange"}`} />
        <h1 className="display mt-4 text-3xl font-bold text-ink">
          {paid ? "Order confirmed!" : "Order placed — one last step"}
        </h1>
        <p className="mx-auto mt-2 max-w-md text-ink/60">
          {paid
            ? "Payment received. We're picking your oranges — you'll find live status in My Orders."
            : "Your order is reserved. Complete the payment to send it to the packing shed."}
        </p>

        <Card className="mx-auto mt-8 max-w-md p-5 text-left">
          <div className="flex justify-between text-sm"><span className="text-ink/60">Order ID</span><span className="font-mono text-xs text-ink">{placedOrder.id}</span></div>
          <div className="mt-2 flex justify-between text-sm"><span className="text-ink/60">Total</span><span className="display font-bold text-ink">{inr(placedOrder.totalAmount)}</span></div>
          <div className="mt-2 flex justify-between text-sm">
            <span className="text-ink/60">Payment</span>
            <Badge tone={paid ? "success" : "warning"}>{placedOrder.paymentStatus}</Badge>
          </div>
        </Card>

        <div className="mt-8 flex justify-center gap-3">
          {!paid && (
            <Button size="lg" loading={verifyPayment.isPending} onClick={() => verifyPayment.mutate()}>
              Pay {inr(placedOrder.totalAmount)}
            </Button>
          )}
          <Button variant="outline" size="lg" onClick={() => router.push(`/orders/${placedOrder.id}`)}>
            View order
          </Button>
        </div>
      </div>
    );
  }

  const items = cart?.items ?? [];
  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20">
        <EmptyState title="Your basket is empty" sub="Add something from the harvest before checking out." action={<Button onClick={() => router.push("/products")}>Browse products</Button>} />
      </div>
    );
  }

  const subtotal = cart?.subtotal ?? items.reduce((s, i) => s + i.lineTotal, 0);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:px-8">
      <h1 className="display text-3xl font-bold text-ink">Checkout</h1>

      <div className="mt-8 grid gap-8 lg:grid-cols-[5fr_2fr]">
        {/* address selection */}
        <section>
          <div className="flex items-center justify-between">
            <h2 className="display text-xl font-bold text-ink">Delivery address</h2>
            <Button variant="outline" size="sm" onClick={() => setAdding(true)}>
              <Plus className="h-4 w-4" /> Add new
            </Button>
          </div>

          {(addresses ?? []).length === 0 ? (
            <div className="mt-4">
              <EmptyState title="No saved addresses" sub="Add a delivery address to continue." action={<Button onClick={() => setAdding(true)}>Add address</Button>} />
            </div>
          ) : (
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {(addresses ?? []).map((a) => {
                const active = selected === a.id;
                return (
                  <li key={a.id}>
                    <button
                      onClick={() => setSelected(a.id)}
                      className={`w-full rounded-2xl border p-4 text-left transition ${
                        active ? "border-orange bg-orange/8 ring-2 ring-orange/25" : "border-ink/12 hover:border-orange/50"
                      }`}
                    >
                      <p className="flex items-center gap-1.5 text-sm font-semibold text-ink">
                        <MapPin className="h-4 w-4 text-orange-deep" /> {a.line1}
                      </p>
                      {a.line2 && <p className="mt-0.5 text-sm text-ink/60">{a.line2}</p>}
                      <p className="mt-0.5 text-sm text-ink/60">{a.city}, {a.state} — {a.pincode}</p>
                      {a.phone && <p className="mt-0.5 text-xs text-ink/45">☎ {a.phone}</p>}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* summary */}
        <Card className="h-fit p-5">
          <h2 className="display text-lg font-bold text-ink">Order summary</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {items.map((i) => (
              <li key={i.variantId} className="flex justify-between gap-3 text-ink/70">
                <span className="truncate">{i.productName} · {i.variantLabel} × {i.quantity}</span>
                <span className="shrink-0 font-semibold text-ink">{inr(i.lineTotal)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 border-t border-ink/10 pt-3">
            <div className="flex justify-between text-sm text-ink/70">
              <span>Subtotal</span><span className="font-semibold text-ink">{inr(subtotal)}</span>
            </div>
            <p className="mt-1 text-xs text-ink/45">Taxes and delivery are calculated by the grove when the order is placed.</p>
          </div>
          <Button
            size="lg"
            className="mt-5 w-full"
            disabled={!selected}
            loading={placeOrder.isPending}
            onClick={() => placeOrder.mutate()}
          >
            Place Order
          </Button>
          {!selected && <p className="mt-2 text-center text-xs text-ink/45">Select a delivery address first.</p>}
        </Card>
      </div>

      <Dialog open={adding} onClose={() => setAdding(false)} title="New delivery address">
        <AddressForm onSubmit={(a) => createAddress.mutate(a)} submitting={createAddress.isPending} />
      </Dialog>
    </div>
  );
}
