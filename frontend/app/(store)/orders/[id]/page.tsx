"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MapPin } from "lucide-react";
import { api, inr } from "@/lib/api";
import type { Order } from "@/lib/types";
import { useToast } from "@/components/providers/Providers";
import { Badge, Button, Card, EmptyState, Skeleton, statusTone } from "@/components/ui/ui";

const ORDER_FLOW = ["CREATED", "PAID", "PROCESSING", "SHIPPED", "DELIVERED"];

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: order, isLoading } = useQuery({
    queryKey: ["order", id],
    queryFn: () => api.get<Order>(`/api/orders/${id}`),
  });

  const verifyPayment = useMutation({
    mutationFn: () =>
      api.post<Order>("/api/orders/verify-payment", {
        razorpayOrderId: order!.razorpayOrderId,
        razorpayPaymentId: `pay_mock_${Date.now()}`,
        razorpaySignature: "mock_signature",
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["order", id] });
      qc.invalidateQueries({ queryKey: ["orders"] });
      toast("Payment confirmed!", "success");
    },
    onError: (e) => toast(e instanceof Error ? e.message : "Payment failed.", "error"),
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl space-y-4 px-4 py-10">
        <Skeleton className="h-24" /><Skeleton className="h-64" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20">
        <EmptyState title="Order not found" action={<Button onClick={() => router.push("/orders")}>Back to orders</Button>} />
      </div>
    );
  }

  const statusIndex = ORDER_FLOW.indexOf(order.orderStatus?.toUpperCase());
  const cancelled = order.orderStatus?.toUpperCase() === "CANCELLED";
  const unpaid = order.paymentStatus?.toUpperCase() !== "PAID" && !cancelled;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 md:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-mono text-xs text-ink/45">#{order.id}</p>
          <h1 className="display mt-1 text-2xl font-bold text-ink md:text-3xl">Order details</h1>
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
                <li key={step} className="flex flex-1 items-center last:flex-none">
                  <div className="flex flex-col items-center">
                    <span
                      className={`flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold ${
                        done ? "bg-orange text-white" : "bg-ink/10 text-ink/40"
                      }`}
                    >
                      {i + 1}
                    </span>
                    <span className={`mt-1.5 text-[10px] font-semibold uppercase tracking-wide ${done ? "text-orange-deep" : "text-ink/40"}`}>
                      {step}
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
          <h2 className="display text-lg font-bold text-ink">Items</h2>
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
            <div className="flex justify-between text-ink/65"><dt>Delivery</dt><dd>{inr(order.deliveryFee)}</dd></div>
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
              <Button className="mt-4 w-full" loading={verifyPayment.isPending} onClick={() => verifyPayment.mutate()}>
                Pay {inr(order.totalAmount)}
              </Button>
            </Card>
          )}

          <p className="text-xs text-ink/40">
            Placed on {new Date(order.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
          </p>
        </div>
      </div>
    </div>
  );
}
