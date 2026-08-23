"use client";

import { FormEvent, useState } from "react";
import type { Address, AddressRequest } from "@/lib/types";
import { Button, Input, Label } from "@/components/ui/ui";

export default function AddressForm({
  initial,
  onSubmit,
  submitting,
  submitLabel = "Save address",
}: {
  initial?: Address | null;
  onSubmit: (address: AddressRequest) => void;
  submitting?: boolean;
  submitLabel?: string;
}) {
  const [form, setForm] = useState<AddressRequest>({
    line1: initial?.line1 ?? "",
    line2: initial?.line2 ?? "",
    city: initial?.city ?? "",
    state: initial?.state ?? "",
    pincode: initial?.pincode ?? "",
    phone: initial?.phone ?? "",
    isDefault: initial?.isDefault ?? false,
  });

  const set = (k: keyof AddressRequest) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
      <label className="sm:col-span-2">
        <Label>Address line 1</Label>
        <Input required value={form.line1} onChange={set("line1")} placeholder="House / street" />
      </label>
      <label className="sm:col-span-2">
        <Label>Address line 2 (optional)</Label>
        <Input value={form.line2 ?? ""} onChange={set("line2")} placeholder="Area, landmark" />
      </label>
      <label>
        <Label>City</Label>
        <Input required value={form.city} onChange={set("city")} />
      </label>
      <label>
        <Label>State</Label>
        <Input required value={form.state} onChange={set("state")} />
      </label>
      <label>
        <Label>PIN code</Label>
        <Input required pattern="[0-9]{6}" title="6-digit PIN code" value={form.pincode} onChange={set("pincode")} />
      </label>
      <label>
        <Label>Phone</Label>
        <Input type="tel" value={form.phone ?? ""} onChange={set("phone")} />
      </label>
      <div className="sm:col-span-2">
        <Button type="submit" loading={submitting} className="w-full sm:w-auto">
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
