"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { QueryClient, QueryClientProvider, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, getTokens, setTokens } from "@/lib/api";
import type { AuthResponse, Cart, UserProfile } from "@/lib/types";

/* ─────────────── theme ─────────────── */

type Theme = "light" | "dark";
const ThemeCtx = createContext<{ theme: Theme; toggle: () => void }>({
  theme: "light",
  toggle: () => {},
});
export const useTheme = () => useContext(ThemeCtx);

function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const stored = (localStorage.getItem("orangy-theme") as Theme | null) ?? "light";
    setTheme(stored);
    document.documentElement.classList.toggle("dark", stored === "dark");
  }, []);

  const toggle = useCallback(() => {
    setTheme((prev) => {
      const next = prev === "light" ? "dark" : "light";
      localStorage.setItem("orangy-theme", next);
      document.documentElement.classList.toggle("dark", next === "dark");
      return next;
    });
  }, []);

  return <ThemeCtx.Provider value={{ theme, toggle }}>{children}</ThemeCtx.Provider>;
}

/* ─────────────── toasts ─────────────── */

type Toast = { id: number; message: string; kind: "success" | "error" | "info" };
const ToastCtx = createContext<{ toast: (message: string, kind?: Toast["kind"]) => void }>({
  toast: () => {},
});
export const useToast = () => useContext(ToastCtx);

function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(0);

  const toast = useCallback((message: string, kind: Toast["kind"] = "info") => {
    const id = ++idRef.current;
    setToasts((t) => [...t, { id, message, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3800);
  }, []);

  return (
    <ToastCtx.Provider value={{ toast }}>
      {children}
      <div className="pointer-events-none fixed bottom-6 right-6 z-[100] flex w-80 flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={[
              "pointer-events-auto rounded-xl px-4 py-3 text-sm font-medium shadow-lg backdrop-blur-md",
              t.kind === "success" && "bg-leaf text-white",
              t.kind === "error" && "bg-[#b3362b] text-white",
              t.kind === "info" && "bg-ink text-cream-soft",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

/* ─────────────── auth ─────────────── */

type AuthState = {
  user: UserProfile | null;
  loading: boolean;
  completeLogin: (auth: AuthResponse) => Promise<void>;
  logout: () => void;
};
const AuthCtx = createContext<AuthState>({
  user: null,
  loading: true,
  completeLogin: async () => {},
  logout: () => {},
});
export const useAuth = () => useContext(AuthCtx);

function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const qc = useQueryClient();

  const loadProfile = useCallback(async () => {
    if (!getTokens()) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      setUser(await api.get<UserProfile>("/api/auth/me"));
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
    const onChange = () => loadProfile();
    window.addEventListener("orangy-auth-changed", onChange);
    return () => window.removeEventListener("orangy-auth-changed", onChange);
  }, [loadProfile]);

  const completeLogin = useCallback(
    async (auth: AuthResponse) => {
      setTokens({ accessToken: auth.accessToken, refreshToken: auth.refreshToken });
      await loadProfile();
      qc.invalidateQueries();
    },
    [loadProfile, qc],
  );

  const logout = useCallback(() => {
    setTokens(null);
    setUser(null);
    qc.clear();
  }, [qc]);

  const value = useMemo(
    () => ({ user, loading, completeLogin, logout }),
    [user, loading, completeLogin, logout],
  );
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

/* ─────────────── cart badge helper ─────────────── */

export function useCart(enabled = true) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["cart"],
    queryFn: () => api.get<Cart>("/api/cart"),
    enabled: enabled && !!user,
    staleTime: 10_000,
  });
}

/* ─────────────── root ─────────────── */

export default function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
      }),
  );
  return (
    <QueryClientProvider client={client}>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>{children}</AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
