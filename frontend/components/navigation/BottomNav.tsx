"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ShoppingBag, ShoppingCart, User } from "lucide-react";
import { useAuth, useCart } from "@/components/providers/Providers";

/**
 * Phone-only tab bar (the pattern every food/quick-commerce app uses). Hidden
 * on pages that bring their own bottom bar (product, checkout) and in admin.
 */
export default function BottomNav() {
  const pathname = usePathname() ?? "/";
  const { user } = useAuth();
  const { data: cart } = useCart();

  if (/^\/(products\/[^/]+|checkout|admin)/.test(pathname)) return null;

  const count = cart?.items?.reduce((n, i) => n + i.quantity, 0) ?? 0;
  const tabs = [
    { href: "/", label: "Home", icon: Home, active: pathname === "/" },
    { href: "/products", label: "Shop", icon: ShoppingBag, active: pathname.startsWith("/products") },
    { href: "/cart", label: "Cart", icon: ShoppingCart, active: pathname === "/cart", badge: count },
    {
      href: user ? "/account" : "/login",
      label: user ? "Account" : "Login",
      icon: User,
      active: ["/account", "/orders", "/login", "/signup"].some((p) => pathname.startsWith(p)),
    },
  ];

  return (
    <>
      <div className="h-16 md:hidden" aria-hidden />
      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
      >
        <ul className="grid grid-cols-4">
          {tabs.map(({ href, label, icon: Icon, active, badge }) => (
            <li key={label}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`relative flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-bold transition ${
                  active ? "text-brand" : "text-muted"
                }`}
              >
                {active && <span className="absolute top-0 h-1 w-8 rounded-b-full bg-brand" />}
                <span className="relative">
                  <Icon className="h-[22px] w-[22px]" strokeWidth={active ? 2.5 : 2} />
                  {!!badge && (
                    <span className="absolute -right-2.5 -top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-action px-1 text-[10px] font-extrabold text-white">
                      {badge}
                    </span>
                  )}
                </span>
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
