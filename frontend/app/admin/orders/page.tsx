"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, inr } from "@/lib/api";
import type { Order, Page } from "@/lib/types";
import { useToast } from "@/components/providers/Providers";
import { Badge, EmptyState, Pagination, Select, Skeleton, statusTone } from "@/components/ui/ui";

const STATUSES = ["CREATED", "PAID", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"];

export default function AdminOrdersPage() {
  const [page, setPage] = useState(0);
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-orders", page],
    queryFn: () => api.get<Page<Order>>(`/api/admin/orders?page=${page}&size=12`),
  });

  const setStatus = useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: string }) =>
      api.put<Order>(`/api/admin/orders/${orderId}/status?status=${status}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-orders"] });
      toast("Order status updated.", "success");
    },
    onError: (e) => toast(e instanceof Error ? e.message : "Status update failed.", "error"),
  });

  const orders = data?.content ?? [];

  return (
    <div>
      <h1 className="display text-2xl font-bold text-ink md:text-3xl">Orders</h1>

      {isLoading ? (
        <div className="mt-6 space-y-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
      ) : orders.length === 0 ? (
        <div className="mt-6"><EmptyState title="No orders yet" sub="They'll land here the moment customers start checking out." /></div>
      ) : (
        <>
          <div className="mt-6 overflow-x-auto rounded-2xl border border-ink/8">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="bg-sand/60 text-left text-xs uppercase tracking-wider text-ink/50">
                <tr>
                  <th className="px-4 py-3">Order</th>
                  <th className="px-4 py-3">Placed</th>
                  <th className="px-4 py-3">Items</th>
                  <th className="px-4 py-3">Payment</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/6 bg-cream-soft">
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td className="px-4 py-3">
                      <p className="font-mono text-xs text-ink/70">#{o.id.slice(0, 8)}</p>
                      <p className="mt-0.5 max-w-[180px] truncate text-xs text-ink/45">
                        {o.deliveryAddress?.city}, {o.deliveryAddress?.state}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-ink/60">
                      {new Date(o.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </td>
                    <td className="px-4 py-3 text-ink/70">{o.items.length}</td>
                    <td className="px-4 py-3"><Badge tone={statusTone(o.paymentStatus)}>{o.paymentStatus}</Badge></td>
                    <td className="display px-4 py-3 font-bold text-ink">{inr(o.totalAmount)}</td>
                    <td className="px-4 py-3">
                      <Select
                        className="w-40 !py-1.5 text-xs"
                        value={o.orderStatus}
                        onChange={(e) => setStatus.mutate({ orderId: o.id, status: e.target.value })}
                      >
                        {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </Select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={data?.number ?? 0} totalPages={data?.totalPages ?? 0} onPage={setPage} />
        </>
      )}
    </div>
  );
}
