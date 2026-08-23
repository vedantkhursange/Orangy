"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import type { AuthResponse, OtpPurpose, OtpResponse } from "@/lib/types";
import { useAuth, useToast } from "@/components/providers/Providers";
import { Button, Input, Label } from "@/components/ui/ui";

/**
 * Shared OTP verification step: 6 digit boxes, expiry countdown and resend —
 * the flow the backend enforces for both signup and login.
 */
export default function OtpFlow({
  email,
  purpose,
  expirySeconds,
  onBack,
}: {
  email: string;
  purpose: OtpPurpose;
  expirySeconds: number;
  onBack: () => void;
}) {
  const [digits, setDigits] = useState<string[]>(Array(6).fill(""));
  const [seconds, setSeconds] = useState(expirySeconds);
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const { completeLogin } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const t = setInterval(() => setSeconds((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    inputs.current[0]?.focus();
  }, []);

  const setDigit = (i: number, raw: string) => {
    const v = raw.replace(/\D/g, "");
    if (v.length > 1) {
      // pasted a full code
      const chars = v.slice(0, 6).split("");
      setDigits((d) => d.map((old, idx) => chars[idx] ?? old));
      inputs.current[Math.min(chars.length, 5)]?.focus();
      return;
    }
    setDigits((d) => {
      const next = [...d];
      next[i] = v;
      return next;
    });
    if (v && i < 5) inputs.current[i + 1]?.focus();
  };

  const onKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) inputs.current[i - 1]?.focus();
  };

  const submit = async (e?: FormEvent) => {
    e?.preventDefault();
    const otp = digits.join("");
    if (otp.length !== 6) return toast("Enter the 6-digit code.", "error");
    setSubmitting(true);
    try {
      const auth = await api.post<AuthResponse>("/api/auth/verify-otp", { email, otp, purpose });
      await completeLogin(auth);
      toast(`Welcome, ${auth.name.split(" ")[0]}!`, "success");
      router.push(auth.role === "ADMIN" ? "/admin" : "/products");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Verification failed.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const resend = async () => {
    setResending(true);
    try {
      const res = await api.post<OtpResponse>("/api/auth/resend-otp", { email, purpose });
      setSeconds(res.otpExpirySeconds ?? 300);
      setDigits(Array(6).fill(""));
      inputs.current[0]?.focus();
      toast("A fresh code is on its way to your inbox.", "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Could not resend the code.", "error");
    } finally {
      setResending(false);
    }
  };

  return (
    <form onSubmit={submit}>
      <p className="text-sm leading-relaxed text-ink/65">
        We emailed a 6-digit code to <span className="font-semibold text-ink">{email}</span>. Enter it below to
        {purpose === "SIGNUP" ? " activate your account." : " continue."}
      </p>

      <div className="mt-6">
        <Label>Verification code</Label>
        <div className="flex justify-between gap-2">
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => {
                inputs.current[i] = el;
              }}
              inputMode="numeric"
              autoComplete={i === 0 ? "one-time-code" : "off"}
              value={d}
              onChange={(e) => setDigit(i, e.target.value)}
              onKeyDown={(e) => onKeyDown(i, e)}
              className="display h-13 w-12 rounded-xl border border-ink/15 bg-cream-soft text-center text-xl font-bold text-ink outline-none transition focus:border-orange focus:ring-2 focus:ring-orange/20"
            />
          ))}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-ink/55">
        {seconds > 0 ? (
          <span>
            Code expires in <span className="font-semibold text-orange-deep">{Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, "0")}</span>
          </span>
        ) : (
          <span className="text-[#b3362b]">Code expired — resend to get a new one.</span>
        )}
        <button type="button" onClick={resend} disabled={resending} className="font-semibold text-orange-deep hover:underline disabled:opacity-50">
          {resending ? "Sending…" : "Resend code"}
        </button>
      </div>

      <Button type="submit" loading={submitting} className="mt-6 w-full" size="lg">
        Verify & Continue
      </Button>
      <button type="button" onClick={onBack} className="mt-3 w-full text-center text-sm text-ink/55 hover:text-ink">
        ← Use a different email
      </button>
    </form>
  );
}
