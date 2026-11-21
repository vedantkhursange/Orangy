"use client";

import { FormEvent, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { MapPin } from "lucide-react";
import { api, inr } from "@/lib/api";
import type { Order } from "@/lib/types";
import { LAST_ORDER_KEY } from "@/components/checkout/GuestCheckoutForm";
import { Badge, Button, Card, Input, Label, Spinner, statusTone } from "@/components/ui/ui";

/** Order status for guest checkouts: order ID + the mobile number used. */
export default function TrackOrder() {
  const params = useSearchParams();
  const [id, setId] = useState(() => params.get("id") ?? lastOrder().id);
  const [phone, setPhone] = useState(() => params.get("phone") ?? lastOrder().phone);
  const [query, setQuery] = useState<{ id: string; phone: string } | null>(
    params.get("id") && params.get("phone") ? { id: params.get("id")!, phone: params.get("phone")! } : null,
  );


  const { data: order, isFetching, error } = useQuery({
    queryKey: ["guest-order", query],
    queryFn: () => api.get<Order>(`/api/public/orders/${encodeURIComponent(query!.id)}?phone=${encodeURIComponent(query!.phone)}`),
    enabled: !!query,
    retry: false,
  });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setQuery({ id: id.trim(), phone: phone.trim() });
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 md:py-16">
      <h1 className="display text-3xl font-bold text-ink md:text-4xl">Track your order</h1>
      <p className="mt-2 text-ink/60">Ordered without an account? Enter your order ID and mobile number.</p>

      <Card className="mt-8 p-6">
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-[2fr_1fr_auto] sm:items-end">
          <label>
            <Label>Order ID</Label>
            <Input required value={id} onChange={(e) => setId(e.target.value)} placeholder="e.g. 3f2a…" />
          </label>
          <label>
            <Label>Mobile</Label>
            <Input required inputMode="numeric" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))} />
          </label>
          <Button type="submit" loading={isFetching}>Track</Button>
        </form>
      </Card>

      {isFetching && !order && <div className="mt-8 flex justify-center"><Spinner /></div>}
      {error && <p className="mt-6 rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger">We couldn&apos;t find that order. Check the ID and mobile number.</p>}

      {order && (
        <Card className="mt-6 p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-mono text-xs text-ink/50">{order.id}</p>
            <div className="flex gap-2">
              <Badge tone={statusTone(order.orderStatus)}>{order.orderStatus}</Badge>
              <Badge tone={statusTone(order.paymentStatus)}>{order.paymentStatus}</Badge>
            </div>
          </div>
          <ul className="mt-5 space-y-2 text-sm">
            {order.items.map((i, n) => (
              <li key={n} className="flex justify-between gap-3 text-ink/75">
                <span>{i.productName} · {i.variantLabel} × {i.quantity}</span>
                <span className="font-semibold text-ink">{inr(i.lineTotal)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex justify-between border-t border-white/10 pt-3 text-sm">
            <span className="text-ink/60">Total (incl. delivery {inr(order.deliveryFee)})</span>
            <span className="display text-lg font-bold text-ink">{inr(order.totalAmount)}</span>
          </div>
          {order.deliveryAddress && (
            <p className="mt-4 flex gap-2 text-sm text-ink/60">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-orange" />
              {[order.deliveryAddress.line1, order.deliveryAddress.line2, order.deliveryAddress.city, order.deliveryAddress.state, order.deliveryAddress.pincode].filter(Boolean).join(", ")}
            </p>
          )}
        </Card>
      )}
    </div>
  );
}

function lastOrder(): { id: string; phone: string } {
  if (typeof window === "undefined") return { id: "", phone: "" };
  try {
    const last = JSON.parse(localStorage.getItem(LAST_ORDER_KEY) ?? "null");
    return { id: last?.id ?? "", phone: last?.phone ?? "" };
  } catch {
    return { id: "", phone: "" };
  }
}
