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
  useSyncExternalStore,
} from "react";
import { QueryClient, QueryClientProvider, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, getTokens, setTokens } from "@/lib/api";
import type { AuthResponse, Cart, CartItem, UserProfile } from "@/lib/types";

/* ─────────────── theme ─────────────── */

type Theme = "light" | "dark";
const ThemeCtx = createContext<{ theme: Theme; toggle: () => void }>({
  theme: "light",
  toggle: () => {},
});
export const useTheme = () => useContext(ThemeCtx);

function ThemeProvider({ children }: { children: ReactNode }) {
  // Black & orange is the brand: the site always renders the dark palette.
  const theme: Theme = "dark";
  const toggle = useCallback(() => {}, []);

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

/* ─────────────── cart ───────────────
 * One basket API for everyone. Signed-in shoppers use the server cart (Redis);
 * guests keep their basket in localStorage and check out without an account.
 * When a guest logs in, their local basket is merged into the server cart.
 */

const GUEST_CART_KEY = "orangy_guest_cart";

/** What the product page knows about a line before it is in the basket. */
export type CartLineInput = Omit<CartItem, "quantity" | "lineTotal"> & { maxQty?: number };
type GuestLine = CartLineInput & { quantity: number };

type CartCtxValue = {
  cart: Cart | undefined;
  isLoading: boolean;
  isGuest: boolean;
  add: (line: CartLineInput, quantity?: number) => Promise<void>;
  setQty: (variantId: string, quantity: number) => Promise<void>;
  remove: (variantId: string) => Promise<void>;
  clear: () => Promise<void>;
};
const CartCtx = createContext<CartCtxValue | null>(null);

const GUEST_EVENT = "orangy-guest-cart";
function subscribeGuest(onChange: () => void) {
  const onStorage = (e: StorageEvent) => e.key === GUEST_CART_KEY && onChange();
  window.addEventListener("storage", onStorage);
  window.addEventListener(GUEST_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(GUEST_EVENT, onChange);
  };
}

function readGuest(): GuestLine[] {
  try {
    const raw = localStorage.getItem(GUEST_CART_KEY);
    return raw ? (JSON.parse(raw) as GuestLine[]) : [];
  } catch {
    return [];
  }
}

function toCart(lines: GuestLine[]): Cart {
  const items: CartItem[] = lines.map((l) => ({
    variantId: l.variantId,
    productId: l.productId,
    productName: l.productName,
    variantLabel: l.variantLabel,
    unitPrice: l.unitPrice,
    thumbnailUrl: l.thumbnailUrl,
    quantity: l.quantity,
    lineTotal: l.unitPrice * l.quantity,
  }));
  return {
    items,
    subtotal: items.reduce((s, i) => s + i.lineTotal, 0),
    totalItems: items.reduce((n, i) => n + i.quantity, 0),
  };
}

function CartProvider({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const qc = useQueryClient();
  const guestRaw = useSyncExternalStore(subscribeGuest, () => localStorage.getItem(GUEST_CART_KEY) ?? "", () => "");
  const guest = useMemo<GuestLine[]>(() => {
    try {
      return guestRaw ? (JSON.parse(guestRaw) as GuestLine[]) : [];
    } catch {
      return [];
    }
  }, [guestRaw]);

  const saveGuest = useCallback((lines: GuestLine[]) => {
    if (lines.length) localStorage.setItem(GUEST_CART_KEY, JSON.stringify(lines));
    else localStorage.removeItem(GUEST_CART_KEY);
    window.dispatchEvent(new Event(GUEST_EVENT));
  }, []);

  const server = useQuery({
    queryKey: ["cart"],
    queryFn: () => api.get<Cart>("/api/cart"),
    enabled: !!user,
    staleTime: 10_000,
  });

  // guest → signed in: move the local basket into the account's basket
  const merging = useRef(false);
  useEffect(() => {
    if (!user || merging.current) return;
    const lines = readGuest();
    if (!lines.length) return;
    merging.current = true;
    (async () => {
      for (const l of lines) {
        try {
          await api.post<Cart>("/api/cart/items", { variantId: l.variantId, quantity: l.quantity });
        } catch {
          /* out of stock or removed — skip */
        }
      }
      saveGuest([]);
      merging.current = false;
      qc.invalidateQueries({ queryKey: ["cart"] });
    })();
  }, [user, qc, saveGuest]);

  const refresh = useCallback(() => qc.invalidateQueries({ queryKey: ["cart"] }), [qc]);

  const value = useMemo<CartCtxValue>(() => {
    if (user) {
      return {
        cart: server.data,
        isLoading: server.isLoading,
        isGuest: false,
        add: async (line, quantity = 1) => {
          await api.post<Cart>("/api/cart/items", { variantId: line.variantId, quantity });
          await refresh();
        },
        setQty: async (variantId, quantity) => {
          if (quantity <= 0) await api.del<Cart>(`/api/cart/items/${variantId}`);
          else await api.put<Cart>(`/api/cart/items/${variantId}`, { quantity });
          await refresh();
        },
        remove: async (variantId) => {
          await api.del<Cart>(`/api/cart/items/${variantId}`);
          await refresh();
        },
        clear: async () => {
          await api.del<void>("/api/cart");
          await refresh();
        },
      };
    }
    const cap = (l: GuestLine, q: number) => {
      if (l.maxQty != null && q > l.maxQty) throw new Error(`Only ${l.maxQty} left in stock.`);
      return q;
    };
    return {
      cart: toCart(guest),
      isLoading: loading,
      isGuest: true,
      add: async (line, quantity = 1) => {
        const cur = readGuest();
        const hit = cur.find((l) => l.variantId === line.variantId);
        if (hit) hit.quantity = cap(hit, hit.quantity + quantity);
        else cur.push({ ...line, quantity: cap({ ...line, quantity: 0 }, quantity) });
        saveGuest(cur);
      },
      setQty: async (variantId, quantity) => {
        const cur = readGuest();
        saveGuest(
          quantity <= 0
            ? cur.filter((l) => l.variantId !== variantId)
            : cur.map((l) => (l.variantId === variantId ? { ...l, quantity: cap(l, quantity) } : l)),
        );
      },
      remove: async (variantId) => saveGuest(readGuest().filter((l) => l.variantId !== variantId)),
      clear: async () => saveGuest([]),
    };
  }, [user, loading, server.data, server.isLoading, guest, refresh, saveGuest]);

  return <CartCtx.Provider value={value}>{children}</CartCtx.Provider>;
}

/** Basket contents for guests and signed-in shoppers alike. */
export function useCart() {
  const c = useContext(CartCtx);
  return { data: c?.cart, isLoading: c?.isLoading ?? true };
}

export function useCartActions() {
  const c = useContext(CartCtx);
  if (!c) throw new Error("useCartActions must be used inside <Providers>");
  return c;
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
          <AuthProvider>
            <CartProvider>{children}</CartProvider>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
