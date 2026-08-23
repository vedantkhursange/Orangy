"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, Package } from "lucide-react";
import { api, inr } from "@/lib/api";
import type { Order, Page } from "@/lib/types";
import { useAuth } from "@/components/providers/Providers";
import { Badge, Button, Card, EmptyState, Pagination, Skeleton, statusTone } from "@/components/ui/ui";

export default function OrdersPage() {
  const [page, setPage] = useState(0);
  const { user, loading } = useAuth();
  const router = useRouter();

  const { data, isLoading } = useQuery({
    queryKey: ["orders", page],
    queryFn: () => api.get<Page<Order>>(`/api/orders?page=${page}&size=10`),
    enabled: !!user,
  });

  if (!loading && !user) {
    router.push("/login");
    return null;
  }

  const orders = data?.content ?? [];

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 md:px-8">
      <h1 className="display text-3xl font-bold text-ink">My orders</h1>

      {isLoading || loading ? (
        <div className="mt-8 space-y-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}</div>
      ) : orders.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title="No orders yet"
            sub="When you order from the harvest, it shows up here with live status."
            action={<Link href="/products"><Button>Start shopping</Button></Link>}
          />
        </div>
      ) : (
        <>
          <ul className="mt-8 space-y-4">
            {orders.map((o) => (
              <li key={o.id}>
                <Link href={`/orders/${o.id}`}>
                  <Card className="flex items-center gap-4 p-4 transition hover:border-orange/50">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-orange/10">
                      <Package className="h-6 w-6 text-orange-deep" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs text-ink/50">#{o.id.slice(0, 8)}</span>
                        <Badge tone={statusTone(o.orderStatus)}>{o.orderStatus}</Badge>
                        <Badge tone={statusTone(o.paymentStatus)}>{o.paymentStatus}</Badge>
                      </div>
                      <p className="mt-1 truncate text-sm text-ink/60">
                        {o.items.length} item{o.items.length === 1 ? "" : "s"} ·{" "}
                        {new Date(o.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    </div>
                    <span className="display shrink-0 text-lg font-bold text-ink">{inr(o.totalAmount)}</span>
                    <ChevronRight className="h-5 w-5 shrink-0 text-ink/30" />
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
          <Pagination page={data?.number ?? 0} totalPages={data?.totalPages ?? 0} onPage={setPage} />
        </>
      )}
    </div>
  );
}
