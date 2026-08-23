"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Trash2, X } from "lucide-react";
import { api } from "@/lib/api";
import type { Page, Review } from "@/lib/types";
import { useToast } from "@/components/providers/Providers";
import { Badge, Button, Card, EmptyState, Pagination, Skeleton, Stars } from "@/components/ui/ui";

export default function AdminReviewsPage() {
  const [page, setPage] = useState(0);
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-reviews", page],
    queryFn: () => api.get<Page<Review>>(`/api/admin/reviews?page=${page}&size=10`),
  });

  const moderate = useMutation({
    mutationFn: ({ reviewId, approved }: { reviewId: string; approved: boolean }) =>
      api.put<Review>(`/api/admin/reviews/${reviewId}/status?isApproved=${approved}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-reviews"] });
      toast("Review moderation saved.", "success");
    },
    onError: (e) => toast(e instanceof Error ? e.message : "Moderation failed.", "error"),
  });

  const remove = useMutation({
    mutationFn: (reviewId: string) => api.del<void>(`/api/admin/reviews/${reviewId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-reviews"] });
      toast("Review deleted.", "success");
    },
    onError: (e) => toast(e instanceof Error ? e.message : "Delete failed.", "error"),
  });

  const reviews = data?.content ?? [];

  return (
    <div>
      <h1 className="display text-2xl font-bold text-ink md:text-3xl">Review moderation</h1>

      {isLoading ? (
        <div className="mt-6 space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-24" />)}</div>
      ) : reviews.length === 0 ? (
        <div className="mt-6"><EmptyState title="No reviews to moderate" sub="Customer reviews appear here for approval before going live." /></div>
      ) : (
        <>
          <ul className="mt-6 space-y-3">
            {reviews.map((r) => (
              <Card key={r.id} className="p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <Stars value={r.rating} />
                    <span className="text-sm font-semibold text-ink">{r.userName ?? "Customer"}</span>
                    <Badge tone={r.approved ? "success" : "warning"}>{r.approved ? "Live" : "Pending"}</Badge>
                  </div>
                  <span className="text-xs text-ink/45">{new Date(r.createdAt).toLocaleDateString("en-IN")}</span>
                </div>
                {r.comment && <p className="mt-2 text-sm leading-relaxed text-ink/70">{r.comment}</p>}
                <div className="mt-3 flex gap-2">
                  {!r.approved && (
                    <Button size="sm" onClick={() => moderate.mutate({ reviewId: r.id, approved: true })}>
                      <Check className="h-3.5 w-3.5" /> Approve
                    </Button>
                  )}
                  {r.approved && (
                    <Button variant="outline" size="sm" onClick={() => moderate.mutate({ reviewId: r.id, approved: false })}>
                      <X className="h-3.5 w-3.5" /> Unpublish
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => { if (confirm("Delete this review permanently?")) remove.mutate(r.id); }}>
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </Button>
                </div>
              </Card>
            ))}
          </ul>
          <Pagination page={data?.number ?? 0} totalPages={data?.totalPages ?? 0} onPage={setPage} />
        </>
      )}
    </div>
  );
}
