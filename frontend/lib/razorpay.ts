"use client";

import type { Order } from "./types";

const SCRIPT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

type RazorpayResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

type RazorpayFailureResponse = {
  error: {
    code: string;
    description: string;
    reason: string;
    metadata?: { order_id?: string; payment_id?: string };
  };
};

type RazorpayOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description?: string;
  order_id: string;
  prefill?: { name?: string; email?: string; contact?: string };
  theme?: { color?: string };
  handler: (response: RazorpayResponse) => void;
  modal?: { ondismiss?: () => void };
};

type RazorpayInstance = {
  open: () => void;
  on: (event: "payment.failed", handler: (response: RazorpayFailureResponse) => void) => void;
};

let loadPromise: Promise<void> | null = null;

function loadRazorpayScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("Not in browser"));
  if (window.Razorpay) return Promise.resolve();
  loadPromise ??= new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Failed to load Razorpay checkout script")));
      return;
    }
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Razorpay checkout script"));
    document.body.appendChild(script);
  });
  return loadPromise;
}

const BRAND_ORANGE = "#f4771f";

export async function openRazorpayCheckout(
  order: Order,
  opts: {
    prefill?: { name?: string; email?: string; contact?: string };
    onSuccess: (response: RazorpayResponse) => void;
    onFailure: (reason: string) => void;
    onDismiss: () => void;
  },
) {
  if (!order.razorpayOrderId || !order.razorpayKeyId || !order.amountInPaise) {
    opts.onFailure("Payment could not be initialized for this order.");
    return;
  }

  await loadRazorpayScript();
  if (!window.Razorpay) {
    opts.onFailure("Payment gateway failed to load. Check your connection and try again.");
    return;
  }

  const rzp = new window.Razorpay({
    key: order.razorpayKeyId,
    amount: order.amountInPaise,
    currency: "INR",
    name: "Orange Express",
    description: `Order #${order.id.slice(0, 8)}`,
    order_id: order.razorpayOrderId,
    prefill: opts.prefill,
    theme: { color: BRAND_ORANGE },
    handler: (response) => opts.onSuccess(response),
    modal: { ondismiss: () => opts.onDismiss() },
  });

  rzp.on("payment.failed", (response) => {
    opts.onFailure(response.error.description || response.error.reason || "Payment failed.");
  });

  rzp.open();
}
