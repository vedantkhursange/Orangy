"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MapPin, ShieldCheck } from "lucide-react";
import { api, inr } from "@/lib/api";
import { openRazorpayCheckout } from "@/lib/razorpay";
import type { Order } from "@/lib/types";
import { useAuth, useToast } from "@/components/providers/Providers";
import { Badge, Button, Card, EmptyState, statusTone } from "@/components/ui/ui";
import { PageLoader } from "@/components/ui/OrangeLoader";

const ORDER_FLOW: { status: string; label: string }[] = [
  { status: "PENDING", label: "Placed" },
  { status: "CONFIRMED", label: "Confirmed" },
  { status: "PROCESSING", label: "Processing" },
  { status: "SHIPPED", label: "Shipped" },
  { status: "DELIVERED", label: "Delivered" },
];

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const qc = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const { data: order, isLoading } = useQuery({
    queryKey: ["order", id],
    queryFn: () => api.get<Order>(`/api/orders/${id}`),
  });

  const verifyPayment = useMutation({
    mutationFn: (payload: { razorpayOrderId: string; razorpayPaymentId: string; razorpaySignature: string }) =>
      api.post<Order>("/api/orders/verify-payment", payload),
    onSuccess: () => {
      setPaymentError(null);
      qc.invalidateQueries({ queryKey: ["order", id] });
      qc.invalidateQueries({ queryKey: ["orders"] });
      toast("Payment confirmed!", "success");
    },
    onError: (e) => setPaymentError(e instanceof Error ? e.message : "Payment failed."),
  });

  const reportFailure = useMutation({
    mutationFn: (payload: { razorpayOrderId: string; reason?: string }) =>
      api.post<Order>("/api/orders/payment-failed", payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["order", id] }),
  });

  const retryPayment = () => {
    if (!order) return;
    setPaymentError(null);
    openRazorpayCheckout(order, {
      prefill: { name: user?.name, email: user?.email, contact: order.deliveryAddress?.phone ?? user?.phone },
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

  if (isLoading) {
    return <PageLoader />;
  }

  if (!order) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20">
        <EmptyState title="Order not found" action={<Button onClick={() => router.push("/orders")}>Back to orders</Button>} />
      </div>
    );
  }

  const statusIndex = ORDER_FLOW.findIndex((s) => s.status === order.orderStatus?.toUpperCase());
  const cancelled = order.orderStatus?.toUpperCase() === "CANCELLED";
  const unpaid = order.paymentStatus?.toUpperCase() !== "PAID" && !cancelled;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 md:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-mono text-xs text-ink/45">#{order.id}</p>
          <h1 className="display mt-1 text-2xl font-bold text-ink md:text-3xl">Order details</h1>
          <p className="mt-1 text-xs text-ink/45">
            Placed on {new Date(order.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
          </p>
        </div>
        <div className="flex gap-2">
          <Badge tone={statusTone(order.orderStatus)}>{order.orderStatus}</Badge>
          <Badge tone={statusTone(order.paymentStatus)}>{order.paymentStatus}</Badge>
        </div>
      </div>

      {/* status tracker */}
      {!cancelled && statusIndex >= 0 && (
        <Card className="mt-6 p-5">
          <ol className="flex items-center">
            {ORDER_FLOW.map((step, i) => {
              const done = i <= statusIndex;
              return (
                <li key={step.status} className="flex flex-1 items-center last:flex-none">
                  <div className="flex flex-col items-center">
                    <span
                      className={`flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold ${
                        done ? "bg-orange text-white" : "bg-ink/10 text-ink/40"
                      }`}
                    >
                      {i + 1}
                    </span>
                    <span className={`mt-1.5 text-[10px] font-semibold uppercase tracking-wide ${done ? "text-orange-deep" : "text-ink/40"}`}>
                      {step.label}
                    </span>
                  </div>
                  {i < ORDER_FLOW.length - 1 && (
                    <div className={`mx-1 mb-4 h-0.5 flex-1 rounded ${i < statusIndex ? "bg-orange" : "bg-ink/10"}`} />
                  )}
                </li>
              );
            })}
          </ol>
        </Card>
      )}

      <div className="mt-6 grid gap-6 md:grid-cols-[3fr_2fr]">
        {/* items */}
        <Card className="p-5">
          <h2 className="display text-lg font-bold text-ink">Items ({order.items.length})</h2>
          <ul className="mt-3 divide-y divide-ink/8">
            {order.items.map((item, i) => (
              <li key={i} className="flex items-center justify-between gap-3 py-3">
                <div>
                  <p className="text-sm font-semibold text-ink">{item.productName}</p>
                  <p className="text-xs text-ink/55">{item.variantLabel} · {inr(item.unitPrice)} × {item.quantity}</p>
                </div>
                <span className="display font-bold text-ink">{inr(item.lineTotal)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-3 space-y-1.5 border-t border-ink/10 pt-3 text-sm">
            <div className="flex justify-between text-ink/65"><dt>Subtotal</dt><dd>{inr(order.subtotal)}</dd></div>
            <div className="flex justify-between text-ink/65"><dt>Tax</dt><dd>{inr(order.tax)}</dd></div>
            <div className="flex justify-between text-ink/65"><dt>Delivery</dt><dd>{order.deliveryFee === 0 ? "Free" : inr(order.deliveryFee)}</dd></div>
            <div className="flex justify-between pt-1 text-base font-bold text-ink"><dt>Total</dt><dd className="display">{inr(order.totalAmount)}</dd></div>
          </dl>
        </Card>

        {/* address + payment */}
        <div className="space-y-6">
          <Card className="p-5">
            <h2 className="display flex items-center gap-2 text-lg font-bold text-ink">
              <MapPin className="h-4 w-4 text-orange-deep" /> Delivery address
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-ink/70">
              {order.deliveryAddress.line1}
              {order.deliveryAddress.line2 && <><br />{order.deliveryAddress.line2}</>}
              <br />
              {order.deliveryAddress.city}, {order.deliveryAddress.state} — {order.deliveryAddress.pincode}
              {order.deliveryAddress.phone && <><br />☎ {order.deliveryAddress.phone}</>}
            </p>
          </Card>

          {unpaid && order.razorpayOrderId && (
            <Card className="p-5">
              <h2 className="display text-lg font-bold text-ink">Payment pending</h2>
              <p className="mt-2 text-sm text-ink/60">Complete the payment to send this order to the packing shed.</p>
              {paymentError && (
                <p className="mt-3 rounded-xl bg-[#b3362b]/10 px-3 py-2 text-xs text-[#b3362b]">{paymentError}</p>
              )}
              <Button className="mt-4 w-full" loading={verifyPayment.isPending} onClick={retryPayment}>
                Pay {inr(order.totalAmount)}
              </Button>
              <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-ink/40">
                <ShieldCheck className="h-3.5 w-3.5" /> Payments are handled securely by Razorpay.
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
