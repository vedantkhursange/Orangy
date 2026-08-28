"use client";

import { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes, useEffect } from "react";
import { Loader2, Minus, Plus, Star, X } from "lucide-react";

/* ── Button ── */
type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
};
export function Button({
  variant = "primary",
  size = "md",
  loading,
  className = "",
  children,
  disabled,
  ...rest
}: ButtonProps) {
  const variants = {
    primary: "bg-orange text-white hover:bg-orange-deep shadow-md shadow-orange/20",
    outline: "border border-ink/20 text-ink hover:border-orange hover:text-orange-deep",
    ghost: "text-ink/75 hover:bg-sand hover:text-ink",
    danger: "bg-[#b3362b] text-white hover:bg-[#992e24]",
  };
  const sizes = {
    sm: "px-3.5 py-1.5 text-xs",
    md: "px-5 py-2.5 text-sm",
    lg: "px-7 py-3.5 text-base",
  };
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-full font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      {...rest}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}

/* ── Field wrappers ── */
export function Label({ children }: { children: ReactNode }) {
  return <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-ink/55">{children}</span>;
}

export function Input({ className = "", ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full rounded-xl border border-ink/15 bg-cream-soft px-4 py-2.5 text-sm text-ink outline-none transition placeholder:text-ink/35 focus:border-orange focus:ring-2 focus:ring-orange/20 ${className}`}
      {...rest}
    />
  );
}

export function Textarea({ className = "", ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={`w-full rounded-xl border border-ink/15 bg-cream-soft px-4 py-2.5 text-sm text-ink outline-none transition placeholder:text-ink/35 focus:border-orange focus:ring-2 focus:ring-orange/20 ${className}`}
      {...rest}
    />
  );
}

export function Select({ className = "", children, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={`w-full rounded-xl border border-ink/15 bg-cream-soft px-4 py-2.5 text-sm text-ink outline-none transition focus:border-orange focus:ring-2 focus:ring-orange/20 ${className}`}
      {...rest}
    >
      {children}
    </select>
  );
}

/* ── Card / Badge ── */
export function Card({ className = "", children }: { className?: string; children: ReactNode }) {
  return (
    <div className={`rounded-2xl border border-ink/8 bg-cream-soft shadow-sm shadow-earth/5 ${className}`}>
      {children}
    </div>
  );
}

export function Badge({
  tone = "neutral",
  children,
}: {
  tone?: "neutral" | "success" | "warning" | "danger" | "orange";
  children: ReactNode;
}) {
  const tones = {
    neutral: "bg-ink/8 text-ink/70",
    success: "bg-leaf/15 text-leaf",
    warning: "bg-orange-glow/25 text-orange-deep",
    danger: "bg-[#b3362b]/12 text-[#b3362b]",
    orange: "bg-orange/12 text-orange-deep",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${tones[tone]}`}>
      {children}
    </span>
  );
}

export function statusTone(status: string): "neutral" | "success" | "warning" | "danger" | "orange" {
  const s = status?.toUpperCase() ?? "";
  if (["PAID", "DELIVERED", "APPROVED", "COMPLETED", "CONFIRMED"].includes(s)) return "success";
  if (["PENDING", "CREATED", "PROCESSING", "PACKED"].includes(s)) return "warning";
  if (["CANCELLED", "FAILED", "REJECTED"].includes(s)) return "danger";
  if (["SHIPPED", "OUT_FOR_DELIVERY"].includes(s)) return "orange";
  return "neutral";
}

/* ── Skeleton / Spinner / Empty ── */
export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-ink/8 ${className}`} />;
}

export function Spinner({ className = "h-6 w-6" }: { className?: string }) {
  return <Loader2 className={`${className} animate-spin text-orange`} />;
}

export function EmptyState({ title, sub, action }: { title: string; sub?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-ink/15 px-8 py-16 text-center">
      <p className="display text-xl font-semibold text-ink/80">{title}</p>
      {sub && <p className="max-w-sm text-sm text-ink/55">{sub}</p>}
      {action}
    </div>
  );
}

/* ── Dialog ── */
export function Dialog({
  open,
  onClose,
  title,
  children,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div
        className={`relative max-h-[88vh] w-full ${wide ? "max-w-3xl" : "max-w-lg"} overflow-y-auto rounded-2xl border border-ink/10 bg-cream p-6 shadow-2xl`}
      >
        <div className="mb-5 flex items-center justify-between">
          <h3 className="display text-xl font-bold text-ink">{title}</h3>
          <button onClick={onClose} className="rounded-lg p-1.5 text-ink/50 hover:bg-sand hover:text-ink" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ── Quantity stepper ── */
export function QtyStepper({
  value,
  onChange,
  min = 1,
  max = 99,
  small,
}: {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  small?: boolean;
}) {
  const btn = `flex items-center justify-center rounded-lg border border-ink/15 text-ink/70 transition hover:border-orange hover:text-orange-deep disabled:opacity-40 ${small ? "h-7 w-7" : "h-9 w-9"}`;
  return (
    <div className="inline-flex items-center gap-2">
      <button className={btn} disabled={value <= min} onClick={() => onChange(value - 1)} aria-label="Decrease">
        <Minus className="h-3.5 w-3.5" />
      </button>
      <span className={`display text-center font-bold text-ink ${small ? "w-6 text-sm" : "w-8"}`}>{value}</span>
      <button className={btn} disabled={value >= max} onClick={() => onChange(value + 1)} aria-label="Increase">
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

/* ── Stars ── */
export function Stars({ value, onChange, size = "h-4 w-4" }: { value: number; onChange?: (v: number) => void; size?: string }) {
  return (
    <div className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={!onChange}
          onClick={() => onChange?.(n)}
          className={onChange ? "cursor-pointer" : "cursor-default"}
          aria-label={`${n} star`}
        >
          <Star className={`${size} ${n <= value ? "fill-orange text-orange" : "text-ink/25"}`} />
        </button>
      ))}
    </div>
  );
}

/* ── Pagination ── */
export function Pagination({
  page,
  totalPages,
  onPage,
}: {
  page: number;
  totalPages: number;
  onPage: (p: number) => void;
}) {
  if (totalPages <= 1) return null;
  return (
    <div className="mt-8 flex items-center justify-center gap-2">
      <Button variant="outline" size="sm" disabled={page === 0} onClick={() => onPage(page - 1)}>
        Previous
      </Button>
      <span className="px-3 text-sm text-ink/60">
        Page {page + 1} of {totalPages}
      </span>
      <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => onPage(page + 1)}>
        Next
      </Button>
    </div>
  );
}
