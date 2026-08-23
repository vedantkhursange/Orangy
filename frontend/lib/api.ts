"use client";

import type { ApiEnvelope, AuthResponse } from "./types";

/**
 * API client for the Orangy Spring backend.
 * - Every call goes through the Next.js proxy at /backend (no CORS).
 * - Responses arrive wrapped in { success, data, error } and are unwrapped here.
 * - A 401 triggers one silent refresh-token attempt, then the request retries.
 */

const BASE = "/backend";
const TOKEN_KEY = "orangy_tokens";

export type Tokens = { accessToken: string; refreshToken: string };

export function getTokens(): Tokens | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(TOKEN_KEY);
    return raw ? (JSON.parse(raw) as Tokens) : null;
  } catch {
    return null;
  }
}

export function setTokens(tokens: Tokens | null) {
  if (typeof window === "undefined") return;
  if (tokens) localStorage.setItem(TOKEN_KEY, JSON.stringify(tokens));
  else localStorage.removeItem(TOKEN_KEY);
  window.dispatchEvent(new Event("orangy-auth-changed"));
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

let refreshPromise: Promise<boolean> | null = null;

async function tryRefresh(): Promise<boolean> {
  const tokens = getTokens();
  if (!tokens?.refreshToken) return false;
  refreshPromise ??= (async () => {
    try {
      const res = await fetch(`${BASE}/api/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: tokens.refreshToken }),
      });
      const body = (await res.json()) as ApiEnvelope<AuthResponse>;
      if (res.ok && body.success && body.data) {
        setTokens({ accessToken: body.data.accessToken, refreshToken: body.data.refreshToken });
        return true;
      }
      setTokens(null);
      return false;
    } catch {
      return false;
    } finally {
      refreshPromise = null;
    }
  })();
  return refreshPromise;
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  retried = false,
): Promise<T> {
  const tokens = getTokens();
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(tokens ? { Authorization: `Bearer ${tokens.accessToken}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401 && !retried && !path.startsWith("/api/auth/")) {
    if (await tryRefresh()) return request<T>(method, path, body, true);
    throw new ApiError("Session expired. Please log in again.", 401);
  }

  let envelope: ApiEnvelope<T> | null = null;
  try {
    envelope = (await res.json()) as ApiEnvelope<T>;
  } catch {
    /* non-JSON error body */
  }

  if (!res.ok || !envelope?.success) {
    throw new ApiError(envelope?.error ?? `Request failed (${res.status})`, res.status);
  }
  return envelope.data as T;
}

export const api = {
  get: <T>(path: string) => request<T>("GET", path),
  post: <T>(path: string, body?: unknown) => request<T>("POST", path, body),
  put: <T>(path: string, body?: unknown) => request<T>("PUT", path, body),
  del: <T>(path: string) => request<T>("DELETE", path),
};

/** Format a number as Indian Rupees. */
export function inr(value: number | null | undefined): string {
  if (value == null) return "—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: value % 1 === 0 ? 0 : 2,
  }).format(value);
}
