"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MapPin, Pencil, Plus, Trash2, User } from "lucide-react";
import { api } from "@/lib/api";
import type { Address, AddressRequest } from "@/lib/types";
import { useAuth, useToast } from "@/components/providers/Providers";
import AddressForm from "@/components/account/AddressForm";
import { Badge, Button, Card, Dialog, EmptyState, Skeleton } from "@/components/ui/ui";

export default function AccountPage() {
  const { user, loading } = useAuth();
  const [editing, setEditing] = useState<Address | null>(null);
  const [adding, setAdding] = useState(false);
  const qc = useQueryClient();
  const { toast } = useToast();
  const router = useRouter();

  const { data: addresses, isLoading } = useQuery({
    queryKey: ["addresses"],
    queryFn: () => api.get<Address[]>("/api/users/me/addresses"),
    enabled: !!user,
  });

  const create = useMutation({
    mutationFn: (a: AddressRequest) => api.post<Address>("/api/users/me/addresses", a),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["addresses"] });
      setAdding(false);
      toast("Address added.", "success");
    },
    onError: (e) => toast(e instanceof Error ? e.message : "Could not add address.", "error"),
  });

  const update = useMutation({
    mutationFn: ({ id, address }: { id: string; address: AddressRequest }) =>
      api.put<Address>(`/api/users/me/addresses/${id}`, address),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["addresses"] });
      setEditing(null);
      toast("Address updated.", "success");
    },
    onError: (e) => toast(e instanceof Error ? e.message : "Could not update address.", "error"),
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.del<void>(`/api/users/me/addresses/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["addresses"] });
      toast("Address removed.", "success");
    },
    onError: (e) => toast(e instanceof Error ? e.message : "Could not remove address.", "error"),
  });

  if (!loading && !user) {
    router.push("/login");
    return null;
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 md:px-8">
      <h1 className="display text-3xl font-bold text-ink">My account</h1>

      {/* profile */}
      <Card className="mt-8 flex items-center gap-5 p-6">
        <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-orange text-2xl font-bold text-white">
          {user?.name?.[0]?.toUpperCase() ?? <User className="h-7 w-7" />}
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="display truncate text-xl font-bold text-ink">{user?.name}</p>
            {user?.role === "ADMIN" && <Badge tone="orange">Admin</Badge>}
          </div>
          <p className="truncate text-sm text-ink/60">{user?.email}</p>
          <p className="truncate text-sm text-ink/60">☎ {user?.phone}</p>
        </div>
      </Card>

      {/* addresses */}
      <section className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="display text-xl font-bold text-ink">Saved addresses</h2>
          <Button variant="outline" size="sm" onClick={() => setAdding(true)}>
            <Plus className="h-4 w-4" /> Add address
          </Button>
        </div>

        {isLoading ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Skeleton className="h-32" /><Skeleton className="h-32" />
          </div>
        ) : (addresses ?? []).length === 0 ? (
          <div className="mt-4">
            <EmptyState title="No addresses saved" sub="Add one to speed through checkout." action={<Button onClick={() => setAdding(true)}>Add your first address</Button>} />
          </div>
        ) : (
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {(addresses ?? []).map((a) => (
              <Card key={a.id} className="p-4">
                <p className="flex items-center gap-1.5 text-sm font-semibold text-ink">
                  <MapPin className="h-4 w-4 text-orange-deep" /> {a.line1}
                </p>
                {a.line2 && <p className="mt-0.5 text-sm text-ink/60">{a.line2}</p>}
                <p className="mt-0.5 text-sm text-ink/60">{a.city}, {a.state} — {a.pincode}</p>
                {a.phone && <p className="mt-0.5 text-xs text-ink/45">☎ {a.phone}</p>}
                <div className="mt-3 flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setEditing(a)}>
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => remove.mutate(a.id)}>
                    <Trash2 className="h-3.5 w-3.5" /> Remove
                  </Button>
                </div>
              </Card>
            ))}
          </ul>
        )}
      </section>

      <Dialog open={adding} onClose={() => setAdding(false)} title="Add address">
        <AddressForm onSubmit={(a) => create.mutate(a)} submitting={create.isPending} />
      </Dialog>
      <Dialog open={!!editing} onClose={() => setEditing(null)} title="Edit address">
        {editing && (
          <AddressForm
            initial={editing}
            onSubmit={(a) => update.mutate({ id: editing.id, address: a })}
            submitting={update.isPending}
            submitLabel="Update address"
          />
        )}
      </Dialog>
    </div>
  );
}
