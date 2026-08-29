"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Images, LayoutDashboard, Package, ShoppingBag, Sprout, Star } from "lucide-react";
import Navbar from "@/components/navigation/Navbar";
import { useAuth } from "@/components/providers/Providers";
import { Button, EmptyState, Spinner } from "@/components/ui/ui";

const nav = [
  { label: "Overview", href: "/admin", icon: LayoutDashboard },
  { label: "Products", href: "/admin/products", icon: Package },
  { label: "Orders", href: "/admin/orders", icon: ShoppingBag },
  { label: "Reviews", href: "/admin/reviews", icon: Star },
  { label: "Gallery", href: "/admin/gallery", icon: Images },
  { label: "Our Story", href: "/admin/story", icon: Sprout },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  return (
    <>
      <Navbar solid />
      <div className="mx-auto flex max-w-7xl gap-6 px-4 pb-16 pt-20 md:px-6 md:pt-24">
        <aside className="hidden w-52 shrink-0 md:block">
          <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-[0.25em] text-ink/40">Grove Admin</p>
          <nav className="flex flex-col gap-1">
            {nav.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                    active ? "bg-orange text-white shadow-md shadow-orange/25" : "text-ink/70 hover:bg-sand hover:text-ink"
                  }`}
                >
                  <item.icon className="h-4 w-4" /> {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="min-w-0 flex-1">
          {/* mobile tabs */}
          <div className="mb-4 flex gap-2 overflow-x-auto md:hidden">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold ${
                  pathname === item.href ? "bg-orange text-white" : "bg-sand text-ink/70"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {loading ? (
            <div className="flex justify-center py-24"><Spinner /></div>
          ) : !user ? (
            <EmptyState title="Admin access required" sub="Log in with a grove admin account." action={<Button onClick={() => router.push("/login")}>Log in</Button>} />
          ) : user.role !== "ADMIN" ? (
            <EmptyState title="Not authorized" sub="This area is reserved for the growers running the co-op." action={<Button onClick={() => router.push("/")}>Back home</Button>} />
          ) : (
            children
          )}
        </main>
      </div>
    </>
  );
}
