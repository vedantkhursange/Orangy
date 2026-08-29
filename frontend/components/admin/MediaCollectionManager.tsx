"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import type { MediaAsset } from "@/lib/types";
import { useToast } from "@/components/providers/Providers";
import MediaUploader from "@/components/admin/MediaUploader";
import { EmptyState, Skeleton } from "@/components/ui/ui";

/**
 * Shared admin CRUD for an ordered, ref-type-scoped media collection —
 * backs both the Gallery and Our Story admin panels. Upload, delete, and
 * reorder (which drives display order on the public homepage) all funnel
 * through the existing /api/admin/media endpoints, keyed on refType with
 * no refId (that's reserved for per-product media).
 */
export default function MediaCollectionManager({
  refType,
  emptyTitle,
  emptySub,
  helpText,
}: {
  refType: "FARM_GALLERY" | "STORY";
  emptyTitle: string;
  emptySub: string;
  helpText: string;
}) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const queryKey = ["admin-media", refType];

  const { data: items, isLoading } = useQuery({
    queryKey,
    queryFn: () => api.get<MediaAsset[]>(`/api/admin/media?refType=${refType}`),
  });

  const add = useMutation({
    mutationFn: (upload: { url: string; type: "IMAGE" | "VIDEO" }) =>
      api.post<MediaAsset>("/api/admin/media", {
        refType,
        type: upload.type,
        url: upload.url,
        sortOrder: (items?.length ?? 0) + 1,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey });
      toast("Added.", "success");
    },
    onError: (e) => toast(e instanceof Error ? e.message : "Could not add media.", "error"),
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.del<void>(`/api/admin/media/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey });
      toast("Removed.", "success");
    },
    onError: (e) => toast(e instanceof Error ? e.message : "Delete failed.", "error"),
  });

  // swaps sortOrder with the neighbouring item — two PUTs, both against the
  // full update payload the backend expects (a partial patch isn't offered)
  const move = useMutation({
    mutationFn: async ({ a, b }: { a: MediaAsset; b: MediaAsset }) => {
      await Promise.all([
        api.put<MediaAsset>(`/api/admin/media/${a.id}`, { ...a, sortOrder: b.sortOrder }),
        api.put<MediaAsset>(`/api/admin/media/${b.id}`, { ...b, sortOrder: a.sortOrder }),
      ]);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey }),
    onError: (e) => toast(e instanceof Error ? e.message : "Reorder failed.", "error"),
  });

  const sorted = [...(items ?? [])].sort((x, y) => x.sortOrder - y.sortOrder);

  return (
    <div>
      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="aspect-square" />)}
        </div>
      ) : sorted.length === 0 ? (
        <EmptyState title={emptyTitle} sub={emptySub} />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {sorted.map((m, i) => (
            <div key={m.id} className="group relative aspect-square overflow-hidden rounded-xl bg-sand">
              {m.type === "IMAGE" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={m.url} alt={m.altText ?? ""} className="h-full w-full object-cover" />
              ) : (
                <video src={m.url} className="h-full w-full object-cover" muted playsInline />
              )}
              <div className="absolute inset-0 flex flex-col justify-between bg-gradient-to-b from-black/50 via-transparent to-black/50 p-1.5 opacity-0 transition group-hover:opacity-100">
                <div className="flex justify-end">
                  <button
                    onClick={() => { if (confirm("Remove this item?")) remove.mutate(m.id); }}
                    className="rounded-lg bg-black/60 p-1.5 text-white"
                    aria-label="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <button
                    disabled={i === 0}
                    onClick={() => move.mutate({ a: m, b: sorted[i - 1] })}
                    className="rounded-lg bg-black/60 p-1.5 text-white disabled:opacity-30"
                    aria-label="Move earlier"
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </button>
                  <span className="rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-semibold text-white">{i + 1}</span>
                  <button
                    disabled={i === sorted.length - 1}
                    onClick={() => move.mutate({ a: m, b: sorted[i + 1] })}
                    className="rounded-lg bg-black/60 p-1.5 text-white disabled:opacity-30"
                    aria-label="Move later"
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="mt-5 text-xs text-ink/50">{helpText}</p>
      <div className="mt-2">
        <MediaUploader
          onUploaded={(result) =>
            add.mutate({ url: result.url, type: result.resourceType === "video" ? "VIDEO" : "IMAGE" })
          }
        />
      </div>
    </div>
  );
}
