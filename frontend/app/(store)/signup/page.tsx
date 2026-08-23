"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import type { OtpResponse } from "@/lib/types";
import { useToast } from "@/components/providers/Providers";
import OtpFlow from "@/components/auth/OtpFlow";
import { Button, Card, Input, Label } from "@/components/ui/ui";

export default function SignupPage() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [otp, setOtp] = useState<OtpResponse | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (form.password.length < 8) return toast("Password must be at least 8 characters.", "error");
    setSubmitting(true);
    try {
      setOtp(await api.post<OtpResponse>("/api/auth/signup", form));
    } catch (err) {
      toast(err instanceof Error ? err.message : "Signup failed.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-16 md:py-24">
      <h1 className="display text-3xl font-bold text-ink">Join Orangy</h1>
      <p className="mt-2 text-sm text-ink/60">Fresh oranges from our family groves, delivered to your door.</p>

      <Card className="mt-8 p-6">
        {otp ? (
          <OtpFlow email={otp.email} purpose="SIGNUP" expirySeconds={otp.otpExpirySeconds} onBack={() => setOtp(null)} />
        ) : (
          <form onSubmit={submit} className="flex flex-col gap-4">
            <label>
              <Label>Full name</Label>
              <Input required value={form.name} onChange={set("name")} placeholder="Your name" />
            </label>
            <label>
              <Label>Email</Label>
              <Input type="email" required value={form.email} onChange={set("email")} placeholder="you@example.com" />
            </label>
            <label>
              <Label>Phone</Label>
              <Input type="tel" required value={form.phone} onChange={set("phone")} placeholder="+91 98765 43210" />
            </label>
            <label>
              <Label>Password</Label>
              <Input type="password" required minLength={8} value={form.password} onChange={set("password")} placeholder="At least 8 characters" />
            </label>
            <Button type="submit" loading={submitting} size="lg" className="mt-2 w-full">
              Create Account
            </Button>
          </form>
        )}
      </Card>

      <p className="mt-6 text-center text-sm text-ink/60">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-orange-deep hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
