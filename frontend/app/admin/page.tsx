"use client";

import { useQuery } from "@tanstack/react-query";
import { IndianRupee, Package, ShoppingBag, Star } from "lucide-react";
import Link from "next/link";
import { api, inr } from "@/lib/api";
import type { Order, Page, ProductSummary, Review } from "@/lib/types";
import { Badge, Card, Skeleton, statusTone } from "@/components/ui/ui";

export default function AdminOverview() {
  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ["admin-orders", 0],
    queryFn: () => api.get<Page<Order>>("/api/admin/orders?page=0&size=10"),
  });
  const { data: products } = useQuery({
    queryKey: ["products", "page=0&size=1"],
    queryFn: () => api.get<Page<ProductSummary>>("/api/products?page=0&size=1"),
  });
  const { data: reviews } = useQuery({
    queryKey: ["admin-reviews", 0],
    queryFn: () => api.get<Page<Review>>("/api/admin/reviews?page=0&size=1"),
  });

  const recent = orders?.content ?? [];
  const pageRevenue = recent
    .filter((o) => o.paymentStatus?.toUpperCase() === "PAID")
    .reduce((s, o) => s + o.totalAmount, 0);

  const stats = [
    { label: "Total orders", value: orders?.totalElements ?? "—", icon: ShoppingBag },
    { label: "Recent paid revenue", value: inr(pageRevenue), icon: IndianRupee },
    { label: "Products live", value: products?.totalElements ?? "—", icon: Package },
    { label: "Reviews", value: reviews?.totalElements ?? "—", icon: Star },
  ];

  return (
    <div>
      <h1 className="display text-2xl font-bold text-ink md:text-3xl">Grove overview</h1>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="p-4">
            <s.icon className="h-5 w-5 text-orange-deep" />
            <p className="display mt-2 truncate text-2xl font-bold text-ink">{s.value}</p>
            <p className="text-xs text-ink/55">{s.label}</p>
          </Card>
        ))}
      </div>

      <div className="mt-8 flex items-center justify-between">
        <h2 className="display text-xl font-bold text-ink">Latest orders</h2>
        <Link href="/admin/orders" className="text-sm font-semibold text-orange-deep hover:underline">
          Manage all →
        </Link>
      </div>

      {ordersLoading ? (
        <div className="mt-4 space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-2xl border border-ink/8">
          <table className="w-full min-w-[560px] text-sm">
            <thead className="bg-sand/60 text-left text-xs uppercase tracking-wider text-ink/50">
              <tr>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Payment</th>
                <th className="px-4 py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/6 bg-cream-soft">
              {recent.map((o) => (
                <tr key={o.id}>
                  <td className="px-4 py-3 font-mono text-xs text-ink/70">#{o.id.slice(0, 8)}</td>
                  <td className="px-4 py-3 text-ink/60">{new Date(o.createdAt).toLocaleDateString("en-IN")}</td>
                  <td className="px-4 py-3"><Badge tone={statusTone(o.orderStatus)}>{o.orderStatus}</Badge></td>
                  <td className="px-4 py-3"><Badge tone={statusTone(o.paymentStatus)}>{o.paymentStatus}</Badge></td>
                  <td className="display px-4 py-3 text-right font-bold text-ink">{inr(o.totalAmount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
