"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Package,
  ShoppingCart,
  Sun,
  User,
  X,
} from "lucide-react";
import { brand } from "@/data/site";
import { useAuth, useCart, useTheme } from "@/components/providers/Providers";

const links = [
  { label: "Home", href: "/" },
  { label: "Products", href: "/products" },
  { label: "Our Story", href: "/#story" },
  { label: "Gallery", href: "/#gallery" },
  { label: "Contact", href: "/#contact" },
];

/**
 * Site-wide navbar. On the homepage it starts transparent over the film and
 * gains a blurred backdrop after the first viewport; with `solid` it is
 * always opaque (store, admin and account pages).
 */
export default function Navbar({ solid = false }: { solid?: boolean }) {
  const [scrolled, setScrolled] = useState(solid);
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const { data: cart } = useCart();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (solid) return;
    const onScroll = () => setScrolled(window.scrollY > window.innerHeight * 0.6);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [solid]);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  useEffect(() => {
    setOpen(false);
    setMenuOpen(false);
  }, [pathname]);

  const cartCount = cart?.items?.reduce((n, i) => n + i.quantity, 0) ?? 0;
  const onDark = !scrolled; // transparent over the dark film hero
  const linkColor = onDark ? "text-white/85 hover:text-white" : "text-ink/75 hover:text-orange-deep";
  const iconColor = onDark ? "text-white/90 hover:text-white" : "text-ink/70 hover:text-orange-deep";

  return (
    <header
      className={[
        "fixed inset-x-0 top-0 z-50 transition-all duration-500",
        scrolled ? "bg-cream/85 shadow-[0_1px_0_rgba(43,32,24,0.08)] backdrop-blur-md" : "bg-transparent",
      ].join(" ")}
    >
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:h-[72px] md:px-8">
        <Link href="/" className={`display text-xl font-bold tracking-[0.18em] ${onDark ? "text-white" : "text-orange-deep"}`}>
          {brand.name}
        </Link>

        <ul className="hidden items-center gap-7 lg:flex">
          {links.map((l) => (
            <li key={l.label}>
              <Link href={l.href} className={`text-sm font-medium transition-colors ${linkColor}`}>
                {l.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-1.5 md:gap-2">
          <button onClick={toggle} aria-label="Toggle theme" className={`rounded-full p-2 transition ${iconColor}`}>
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>

          <Link href="/cart" aria-label="Cart" className={`relative rounded-full p-2 transition ${iconColor}`}>
            <ShoppingCart className="h-5 w-5" />
            {cartCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4.5 min-w-[18px] items-center justify-center rounded-full bg-orange px-1 text-[10px] font-bold text-white">
                {cartCount}
              </span>
            )}
          </Link>

          {user ? (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className={`flex items-center gap-2 rounded-full py-1.5 pl-2 pr-3 text-sm font-semibold transition ${
                  onDark ? "text-white hover:bg-white/10" : "text-ink hover:bg-sand"
                }`}
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-orange text-xs font-bold text-white">
                  {user.name?.[0]?.toUpperCase() ?? "U"}
                </span>
                <span className="hidden max-w-[110px] truncate md:block">{user.name?.split(" ")[0]}</span>
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-12 w-56 overflow-hidden rounded-2xl border border-ink/10 bg-cream shadow-xl">
                  <div className="border-b border-ink/8 px-4 py-3">
                    <p className="truncate text-sm font-semibold text-ink">{user.name}</p>
                    <p className="truncate text-xs text-ink/50">{user.email}</p>
                  </div>
                  <MenuLink href="/account" icon={<User className="h-4 w-4" />}>My Account</MenuLink>
                  <MenuLink href="/orders" icon={<Package className="h-4 w-4" />}>My Orders</MenuLink>
                  {user.role === "ADMIN" && (
                    <MenuLink href="/admin" icon={<LayoutDashboard className="h-4 w-4" />}>Admin Dashboard</MenuLink>
                  )}
                  <button
                    onClick={() => {
                      logout();
                      router.push("/");
                    }}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-[#b3362b] transition hover:bg-sand"
                  >
                    <LogOut className="h-4 w-4" /> Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="hidden items-center gap-2 md:flex">
              <Link
                href="/login"
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  onDark ? "text-white/90 hover:text-white" : "text-ink/80 hover:text-orange-deep"
                }`}
              >
                Login
              </Link>
              <Link
                href="/signup"
                className="rounded-full bg-orange px-4 py-2 text-sm font-semibold text-white shadow-md shadow-orange/25 transition hover:bg-orange-deep"
              >
                Sign Up
              </Link>
            </div>
          )}

          <button
            aria-label="Toggle menu"
            onClick={() => setOpen((v) => !v)}
            className={`rounded-md p-2 lg:hidden ${open || !onDark ? "text-ink" : "text-white"}`}
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </nav>

      {open && (
        <div className="border-t border-ink/5 bg-cream/95 px-5 pb-6 pt-2 backdrop-blur-md lg:hidden">
          <ul className="flex flex-col gap-1">
            {links.map((l) => (
              <li key={l.label}>
                <Link href={l.href} className="block rounded-lg px-3 py-2.5 text-base font-medium text-ink/85 hover:bg-sand">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
          {!user && (
            <div className="mt-4 flex gap-3">
              <Link href="/login" className="flex-1 rounded-full border border-ink/15 px-5 py-2.5 text-center text-sm font-semibold text-ink">
                Login
              </Link>
              <Link href="/signup" className="flex-1 rounded-full bg-orange px-5 py-2.5 text-center text-sm font-semibold text-white">
                Sign Up
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}

function MenuLink({ href, icon, children }: { href: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <Link href={href} className="flex items-center gap-3 px-4 py-2.5 text-sm text-ink/80 transition hover:bg-sand hover:text-ink">
      {icon} {children}
    </Link>
  );
}
