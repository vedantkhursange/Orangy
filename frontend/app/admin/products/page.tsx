"use client";

import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Leaf, Pencil, Plus, Trash2 } from "lucide-react";
import { api, inr } from "@/lib/api";
import type { MediaAsset, Page, Product, ProductCreateRequest, ProductSummary, Variant, VariantCreateRequest } from "@/lib/types";
import { useToast } from "@/components/providers/Providers";
import ImageUploadField from "@/components/admin/ImageUploadField";
import MediaUploader from "@/components/admin/MediaUploader";
import { Badge, Button, Card, Dialog, EmptyState, Input, Label, Pagination, Select, Skeleton, Textarea } from "@/components/ui/ui";

/* ─────────────────────── page ─────────────────────── */

export default function AdminProductsPage() {
  const [page, setPage] = useState(0);
  const [creating, setCreating] = useState(false);
  const [managingId, setManagingId] = useState<string | null>(null);
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data, isLoading } = useQuery({
    queryKey: ["products", `admin-list-${page}`],
    queryFn: () => api.get<Page<ProductSummary>>(`/api/products?page=${page}&size=10`),
  });

  const removeProduct = useMutation({
    mutationFn: (id: string) => api.del<void>(`/api/admin/products/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      toast("Product removed from the shelf.", "success");
    },
    onError: (e) => toast(e instanceof Error ? e.message : "Delete failed.", "error"),
  });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="display text-2xl font-bold text-ink md:text-3xl">Products</h1>
        <Button onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4" /> New product
        </Button>
      </div>

      {isLoading ? (
        <div className="mt-6 space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
      ) : (data?.content ?? []).length === 0 ? (
        <div className="mt-6">
          <EmptyState title="Shelf is empty" sub="Create the first product of the harvest." action={<Button onClick={() => setCreating(true)}>Create product</Button>} />
        </div>
      ) : (
        <>
          <div className="mt-6 overflow-x-auto rounded-2xl border border-ink/8">
            <table className="w-full min-w-[620px] text-sm">
              <thead className="bg-sand/60 text-left text-xs uppercase tracking-wider text-ink/50">
                <tr>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">From</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/6 bg-cream-soft">
                {(data?.content ?? []).map((p) => (
                  <tr key={p.id}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-sand">
                          {p.thumbnailUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={p.thumbnailUrl} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <Leaf className="h-5 w-5 text-orange/40" />
                          )}
                        </span>
                        <span className="font-semibold text-ink">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3"><Badge tone="orange">{p.category}</Badge></td>
                    <td className="display px-4 py-3 font-bold text-ink">{p.startingPrice != null ? inr(p.startingPrice) : "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => setManagingId(p.id)}>
                          <Pencil className="h-3.5 w-3.5" /> Manage
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => { if (confirm(`Remove "${p.name}" from the shelf?`)) removeProduct.mutate(p.id); }}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={data?.number ?? 0} totalPages={data?.totalPages ?? 0} onPage={setPage} />
        </>
      )}

      <Dialog open={creating} onClose={() => setCreating(false)} title="New product">
        <ProductForm
          onDone={(created) => {
            setCreating(false);
            setManagingId(created.id);
          }}
        />
      </Dialog>

      <Dialog open={!!managingId} onClose={() => setManagingId(null)} title="Manage product" wide>
        {managingId && <ManageProduct id={managingId} />}
      </Dialog>
    </div>
  );
}

/* ─────────────────────── product create/edit form ─────────────────────── */

function ProductForm({ product, onDone }: { product?: Product; onDone: (p: Product) => void }) {
  const [form, setForm] = useState<ProductCreateRequest>({
    name: product?.name ?? "",
    description: product?.description ?? "",
    category: product?.category ?? "",
    organicCertified: product?.organicCertified ?? false,
    farmSource: product?.farmSource ?? "",
  });
  const qc = useQueryClient();
  const { toast } = useToast();

  const save = useMutation({
    mutationFn: () =>
      product
        ? api.put<Product>(`/api/admin/products/${product.id}`, form)
        : api.post<Product>("/api/admin/products", form),
    onSuccess: (saved) => {
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["product", saved.id] });
      toast(product ? "Product updated." : "Product created — now add a variant.", "success");
      onDone(saved);
    },
    onError: (e) => toast(e instanceof Error ? e.message : "Save failed.", "error"),
  });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    save.mutate();
  };

  return (
    <form onSubmit={submit} className="grid gap-4">
      <label>
        <Label>Name</Label>
        <Input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Nagpur Oranges" />
      </label>
      <label>
        <Label>Category</Label>
        <Input required value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} placeholder="Oranges / Juice / Gift Box" />
      </label>
      <label>
        <Label>Description</Label>
        <Textarea rows={3} value={form.description ?? ""} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
      </label>
      <label>
        <Label>Farm source</Label>
        <Input value={form.farmSource ?? ""} onChange={(e) => setForm((f) => ({ ...f, farmSource: e.target.value }))} placeholder="Warud, Maharashtra" />
      </label>
      <label className="flex items-center gap-2 text-sm text-ink/75">
        <input
          type="checkbox"
          checked={form.organicCertified}
          onChange={(e) => setForm((f) => ({ ...f, organicCertified: e.target.checked }))}
          className="h-4 w-4 accent-[--orange]"
        />
        Organic certified
      </label>
      <Button type="submit" loading={save.isPending}>{product ? "Save changes" : "Create product"}</Button>
    </form>
  );
}

/* ─────────────────────── manage: details + variants + media ─────────────────────── */

function ManageProduct({ id }: { id: string }) {
  const [tab, setTab] = useState<"details" | "variants" | "media">("variants");
  const { data: product, isLoading } = useQuery({
    queryKey: ["product", id],
    queryFn: () => api.get<Product>(`/api/products/${id}`),
  });

  if (isLoading || !product) return <Skeleton className="h-64" />;

  return (
    <div>
      <div className="mb-5 flex gap-2">
        {(["variants", "media", "details"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold capitalize ${
              tab === t ? "bg-orange text-white" : "bg-sand text-ink/70 hover:text-ink"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "details" && <ProductForm product={product} onDone={() => {}} />}
      {tab === "variants" && <VariantManager product={product} />}
      {tab === "media" && <MediaManager productId={product.id} />}
    </div>
  );
}

function VariantManager({ product }: { product: Product }) {
  const [editing, setEditing] = useState<Variant | "new" | null>(null);
  const qc = useQueryClient();
  const { toast } = useToast();

  const remove = useMutation({
    mutationFn: (variantId: string) => api.del<void>(`/api/admin/products/variants/${variantId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["product", product.id] });
      qc.invalidateQueries({ queryKey: ["products"] });
      toast("Variant deleted.", "success");
    },
    onError: (e) => toast(e instanceof Error ? e.message : "Delete failed.", "error"),
  });

  return (
    <div>
      {product.variants.length === 0 ? (
        <EmptyState title="No variants yet" sub="Customers can only buy once a variant (pack size + price) exists." />
      ) : (
        <ul className="space-y-2">
          {product.variants.map((v) => (
            <Card key={v.id} className="flex items-center justify-between gap-3 p-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-ink">{v.label}</p>
                <p className="text-xs text-ink/55">
                  {v.quantityValue} {v.unit} · <span className="display font-bold text-orange-deep">{inr(v.price)}</span> ·{" "}
                  <span className={v.stockCount <= 5 ? "text-[#b3362b]" : ""}>{v.stockCount} in stock</span>
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button variant="outline" size="sm" onClick={() => setEditing(v)}><Pencil className="h-3.5 w-3.5" /></Button>
                <Button variant="ghost" size="sm" onClick={() => { if (confirm(`Delete variant "${v.label}"?`)) remove.mutate(v.id); }}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </Card>
          ))}
        </ul>
      )}

      <Button className="mt-4" variant="outline" size="sm" onClick={() => setEditing("new")}>
        <Plus className="h-4 w-4" /> Add variant
      </Button>

      {editing && (
        <div className="mt-5 rounded-2xl border border-orange/30 bg-orange/5 p-4">
          <VariantForm
            productId={product.id}
            variant={editing === "new" ? undefined : editing}
            onDone={() => setEditing(null)}
          />
        </div>
      )}
    </div>
  );
}

function VariantForm({ productId, variant, onDone }: { productId: string; variant?: Variant; onDone: () => void }) {
  const [form, setForm] = useState<VariantCreateRequest>({
    label: variant?.label ?? "",
    price: variant?.price ?? 0,
    unit: variant?.unit ?? "KG",
    quantityValue: variant?.quantityValue ?? 1,
    stockCount: variant?.stockCount ?? 0,
    thumbnailImageUrl: variant?.thumbnailImageUrl ?? "",
  });
  const qc = useQueryClient();
  const { toast } = useToast();

  const save = useMutation({
    mutationFn: () => {
      const body = { ...form, thumbnailImageUrl: form.thumbnailImageUrl || undefined };
      return variant
        ? api.put<Variant>(`/api/admin/products/variants/${variant.id}`, body)
        : api.post<Variant>(`/api/admin/products/${productId}/variants`, body);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["product", productId] });
      qc.invalidateQueries({ queryKey: ["products"] });
      toast(variant ? "Variant updated." : "Variant added.", "success");
      onDone();
    },
    onError: (e) => toast(e instanceof Error ? e.message : "Save failed.", "error"),
  });

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); save.mutate(); }}
      className="grid gap-3 sm:grid-cols-2"
    >
      <label className="sm:col-span-2">
        <Label>Label</Label>
        <Input required value={form.label} onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))} placeholder="1 kg pack" />
      </label>
      <label>
        <Label>Price (₹)</Label>
        <Input type="number" required min={0} step="0.01" value={form.price || ""} onChange={(e) => setForm((f) => ({ ...f, price: Number(e.target.value) }))} />
      </label>
      <label>
        <Label>Unit</Label>
        <Select value={form.unit} onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}>
          {["KG", "GRAM", "PIECE", "DOZEN", "LITRE", "ML", "BOX"].map((u) => <option key={u} value={u}>{u}</option>)}
        </Select>
      </label>
      <label>
        <Label>Quantity value</Label>
        <Input type="number" required min={1} value={form.quantityValue || ""} onChange={(e) => setForm((f) => ({ ...f, quantityValue: Number(e.target.value) }))} />
      </label>
      <label>
        <Label>Stock count</Label>
        <Input type="number" required min={0} value={form.stockCount ?? ""} onChange={(e) => setForm((f) => ({ ...f, stockCount: Number(e.target.value) }))} />
      </label>
      <div className="sm:col-span-2">
        <ImageUploadField
          label="Thumbnail image"
          value={form.thumbnailImageUrl ?? ""}
          onChange={(url) => setForm((f) => ({ ...f, thumbnailImageUrl: url }))}
        />
      </div>
      <div className="flex gap-2 sm:col-span-2">
        <Button type="submit" loading={save.isPending}>{variant ? "Update variant" : "Add variant"}</Button>
        <Button type="button" variant="ghost" onClick={onDone}>Cancel</Button>
      </div>
    </form>
  );
}

function MediaManager({ productId }: { productId: string }) {
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: media, isLoading } = useQuery({
    queryKey: ["media", productId],
    queryFn: () => api.get<MediaAsset[]>(`/api/media/product/${productId}`),
  });

  const add = useMutation({
    mutationFn: (upload: { url: string; type: "IMAGE" | "VIDEO" }) =>
      api.post<MediaAsset>("/api/admin/media", {
        refType: "PRODUCT",
        type: upload.type,
        url: upload.url,
        refId: productId,
        sortOrder: (media?.length ?? 0) + 1,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["media", productId] });
      toast("Added to the gallery.", "success");
    },
    onError: (e) => toast(e instanceof Error ? e.message : "Could not add media.", "error"),
  });

  const remove = useMutation({
    mutationFn: (mediaId: string) => api.del<void>(`/api/admin/media/${mediaId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["media", productId] });
      toast("Media removed.", "success");
    },
    onError: (e) => toast(e instanceof Error ? e.message : "Delete failed.", "error"),
  });

  return (
    <div>
      {isLoading ? (
        <Skeleton className="h-32" />
      ) : (media ?? []).length === 0 ? (
        <EmptyState title="No gallery media" sub="Upload a photo or video below — it appears on the product page instantly." />
      ) : (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {(media ?? []).map((m) => (
            <div key={m.id} className="group relative aspect-square overflow-hidden rounded-xl bg-sand">
              {m.type === "IMAGE" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={m.url} alt={m.altText ?? ""} className="h-full w-full object-cover" />
              ) : (
                <video src={m.url} className="h-full w-full object-cover" muted />
              )}
              <button
                onClick={() => remove.mutate(m.id)}
                className="absolute right-1.5 top-1.5 rounded-lg bg-black/60 p-1.5 text-white opacity-0 transition group-hover:opacity-100"
                aria-label="Delete media"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="mt-5">
        <MediaUploader
          onUploaded={(result) =>
            add.mutate({ url: result.url, type: result.resourceType === "video" ? "VIDEO" : "IMAGE" })
          }
        />
      </div>
    </div>
  );
}
