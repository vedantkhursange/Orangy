"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import type { OtpResponse } from "@/lib/types";
import { useToast } from "@/components/providers/Providers";
import OtpFlow from "@/components/auth/OtpFlow";
import { Button, Card, Input, Label } from "@/components/ui/ui";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState<OtpResponse | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      setOtp(await api.post<OtpResponse>("/api/auth/login", { email, password }));
    } catch (err) {
      toast(err instanceof Error ? err.message : "Login failed.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-16 md:py-24">
      <h1 className="display text-3xl font-bold text-ink">Welcome back</h1>
      <p className="mt-2 text-sm text-ink/60">Log in to shop the harvest and track your orders.</p>

      <Card className="mt-8 p-6">
        {otp ? (
          <OtpFlow email={otp.email} purpose="LOGIN" expirySeconds={otp.otpExpirySeconds} onBack={() => setOtp(null)} />
        ) : (
          <form onSubmit={submit} className="flex flex-col gap-4">
            <label>
              <Label>Email</Label>
              <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            </label>
            <label>
              <Label>Password</Label>
              <Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
            </label>
            <Button type="submit" loading={submitting} size="lg" className="mt-2 w-full">
              Continue
            </Button>
          </form>
        )}
      </Card>

      <p className="mt-6 text-center text-sm text-ink/60">
        New to Orangy?{" "}
        <Link href="/signup" className="font-semibold text-orange-deep hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
