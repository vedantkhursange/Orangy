"use client";

import { Input, Label } from "@/components/ui/ui";

export type GuestDetails = {
  name: string;
  phone: string;
  email: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  pincode: string;
};

export const EMPTY_GUEST: GuestDetails = { name: "", phone: "", email: "", line1: "", line2: "", city: "", state: "Maharashtra", pincode: "" };
export const LAST_ORDER_KEY = "orangy_last_order";

const PHONE = /^[6-9]\d{9}$/;
const PIN = /^\d{6}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const guestReady = (g: GuestDetails) =>
  g.name.trim() !== "" &&
  PHONE.test(g.phone) &&
  (g.email === "" || EMAIL.test(g.email)) &&
  g.line1.trim() !== "" &&
  g.city.trim() !== "" &&
  g.state.trim() !== "" &&
  PIN.test(g.pincode);

/** Contact + delivery details for checkout without an account. */
export default function GuestCheckoutForm({ value, onChange }: { value: GuestDetails; onChange: (v: GuestDetails) => void }) {
  const set = (k: keyof GuestDetails, clean?: (v: string) => string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    onChange({ ...value, [k]: clean ? clean(e.target.value) : e.target.value });
  const digits = (n: number) => (v: string) => v.replace(/\D/g, "").slice(0, n);

  return (
    <section className="flex flex-col gap-8">
      <div>
        <h2 className="display text-xl font-bold text-ink">Your details</h2>
        <p className="mt-1 text-sm text-ink/55">We only use these to deliver your order and send updates.</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="sm:col-span-2">
            <Label>Full name</Label>
            <Input required autoComplete="name" value={value.name} onChange={set("name")} />
          </label>
          <label>
            <Label>Mobile number</Label>
            <Input required type="tel" inputMode="numeric" autoComplete="tel-national" placeholder="10-digit mobile" value={value.phone} onChange={set("phone", digits(10))} />
          </label>
          <label>
            <Label>Email (optional)</Label>
            <Input type="email" autoComplete="email" value={value.email} onChange={set("email")} />
          </label>
        </div>
      </div>
      <div>
        <h2 className="display text-xl font-bold text-ink">Delivery address</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="sm:col-span-2">
            <Label>House / street</Label>
            <Input required autoComplete="address-line1" value={value.line1} onChange={set("line1")} />
          </label>
          <label className="sm:col-span-2">
            <Label>Area, landmark (optional)</Label>
            <Input autoComplete="address-line2" value={value.line2} onChange={set("line2")} />
          </label>
          <label>
            <Label>City</Label>
            <Input required autoComplete="address-level2" value={value.city} onChange={set("city")} />
          </label>
          <label>
            <Label>State</Label>
            <Input required autoComplete="address-level1" value={value.state} onChange={set("state")} />
          </label>
          <label>
            <Label>PIN code</Label>
            <Input required inputMode="numeric" autoComplete="postal-code" value={value.pincode} onChange={set("pincode", digits(6))} />
          </label>
        </div>
      </div>
    </section>
  );
}
