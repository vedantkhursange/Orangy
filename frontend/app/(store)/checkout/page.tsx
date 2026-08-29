"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MapPin, Plus, ShieldCheck } from "lucide-react";
import { api, inr } from "@/lib/api";
import { openRazorpayCheckout } from "@/lib/razorpay";
import type { Address, AddressRequest, Order } from "@/lib/types";
import { useAuth, useCart, useToast } from "@/components/providers/Providers";
import AddressForm from "@/components/account/AddressForm";
import OrderSuccessAnimation from "@/components/checkout/OrderSuccessAnimation";
import { Badge, Button, Card, Dialog, EmptyState, Spinner } from "@/components/ui/ui";

/**
 * Checkout: pick/add a delivery address → place the order → pay via Razorpay
 * (UPI, cards, wallets, QR — all handled by the Razorpay Checkout popup).
 * Once the payment signature is verified server-side we play a short
 * "order placed" animation, then hand off to the full order details page.
 */
export default function CheckoutPage() {
  const { user, loading } = useAuth();
  const { data: cart, isLoading: cartLoading } = useCart();
  const [selected, setSelected] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [celebrate, setCelebrate] = useState(false);
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

  const verifyPayment = useMutation({
    mutationFn: (payload: { razorpayOrderId: string; razorpayPaymentId: string; razorpaySignature: string }) =>
      api.post<Order>("/api/orders/verify-payment", payload),
    onSuccess: (order) => {
      setPlacedOrder(order);
      setPaymentError(null);
      qc.invalidateQueries({ queryKey: ["orders"] });
      setCelebrate(true);
    },
    onError: (e) => setPaymentError(e instanceof Error ? e.message : "Payment verification failed."),
  });

  const reportFailure = useMutation({
    mutationFn: (payload: { razorpayOrderId: string; reason?: string }) =>
      api.post<Order>("/api/orders/payment-failed", payload),
  });

  const launchPayment = (order: Order) => {
    setPaymentError(null);
    const selectedAddress = (addresses ?? []).find((a) => a.id === selected);
    openRazorpayCheckout(order, {
      prefill: { name: user?.name, email: user?.email, contact: selectedAddress?.phone ?? user?.phone },
      onSuccess: (response) =>
        verifyPayment.mutate({
          razorpayOrderId: response.razorpay_order_id,
          razorpayPaymentId: response.razorpay_payment_id,
          razorpaySignature: response.razorpay_signature,
        }),
      onFailure: (reason) => {
        setPaymentError(reason);
        if (order.razorpayOrderId) reportFailure.mutate({ razorpayOrderId: order.razorpayOrderId, reason });
      },
      onDismiss: () => setPaymentError("Payment window closed before completing. You can try again."),
    });
  };

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
      launchPayment(order);
    },
    onError: (e) => toast(e instanceof Error ? e.message : "Could not place the order.", "error"),
  });

  if (!loading && !user) {
    router.push("/login");
    return null;
  }

  if (loading || cartLoading || addrLoading) {
    return <div className="flex justify-center py-24"><Spinner /></div>;
  }

  if (celebrate && placedOrder) {
    return (
      <OrderSuccessAnimation
        orderId={placedOrder.id}
        totalAmount={placedOrder.totalAmount}
        onDone={() => router.push(`/orders/${placedOrder.id}`)}
      />
    );
  }

  /* ── awaiting / retrying payment ── */
  if (placedOrder) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="display mt-4 text-3xl font-bold text-ink">Complete your payment</h1>
        <p className="mx-auto mt-2 max-w-md text-ink/60">
          Your order is reserved. Pay securely with UPI, card, wallet or QR to send it to the packing shed.
        </p>

        <Card className="mx-auto mt-8 max-w-md p-5 text-left">
          <div className="flex justify-between text-sm"><span className="text-ink/60">Order ID</span><span className="font-mono text-xs text-ink">{placedOrder.id}</span></div>
          <div className="mt-2 flex justify-between text-sm"><span className="text-ink/60">Total</span><span className="display font-bold text-ink">{inr(placedOrder.totalAmount)}</span></div>
          <div className="mt-2 flex justify-between text-sm">
            <span className="text-ink/60">Payment</span>
            <Badge tone="warning">{placedOrder.paymentStatus}</Badge>
          </div>
        </Card>

        {paymentError && (
          <p className="mx-auto mt-4 max-w-md rounded-xl bg-[#b3362b]/10 px-4 py-2.5 text-sm text-[#b3362b]">
            {paymentError}
          </p>
        )}

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button size="lg" loading={verifyPayment.isPending} onClick={() => launchPayment(placedOrder)}>
            Pay {inr(placedOrder.totalAmount)}
          </Button>
          <Button variant="outline" size="lg" onClick={() => router.push(`/orders/${placedOrder.id}`)}>
            View order
          </Button>
        </div>
        <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-ink/40">
          <ShieldCheck className="h-3.5 w-3.5" /> Payments are handled securely by Razorpay.
        </p>
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
          <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-ink/40">
            <ShieldCheck className="h-3.5 w-3.5" /> UPI, cards &amp; wallets via Razorpay
          </p>
        </Card>
      </div>

      <Dialog open={adding} onClose={() => setAdding(false)} title="New delivery address">
        <AddressForm onSubmit={(a) => createAddress.mutate(a)} submitting={createAddress.isPending} />
      </Dialog>
    </div>
  );
}
