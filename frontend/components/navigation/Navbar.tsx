"use client";

import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { brand, nav } from "@/data/site";

/**
 * Fixed navbar: transparent over the film's opening orchard, then gains a
 * warm blurred backdrop once the user scrolls past the first viewport.
 */
export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > window.innerHeight * 0.6);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={[
        "fixed inset-x-0 top-0 z-50 transition-all duration-500",
        scrolled
          ? "bg-cream/80 shadow-[0_1px_0_rgba(43,32,24,0.06)] backdrop-blur-md"
          : "bg-transparent",
      ].join(" ")}
    >
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 md:h-[72px] md:px-10">
        <a
          href="#home"
          className={[
            "display text-xl font-bold tracking-[0.18em]",
            scrolled ? "text-orange-deep" : "text-white",
          ].join(" ")}
        >
          {brand.name}
        </a>

        {/* desktop links */}
        <ul className="hidden items-center gap-8 md:flex">
          {nav.links.map((l) => (
            <li key={l.label}>
              <a
                href={l.href}
                className={[
                  "text-sm font-medium transition-colors",
                  scrolled ? "text-ink/75 hover:text-orange-deep" : "text-white/85 hover:text-white",
                ].join(" ")}
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-3 md:flex">
          <button
            type="button"
            className={[
              "rounded-full px-5 py-2 text-sm font-semibold transition-colors",
              scrolled ? "text-ink/80 hover:text-orange-deep" : "text-white/90 hover:text-white",
            ].join(" ")}
          >
            Login
          </button>
          <button
            type="button"
            className="rounded-full bg-orange px-5 py-2 text-sm font-semibold text-white shadow-md shadow-orange/25 transition hover:bg-orange-deep"
          >
            Sign Up
          </button>
        </div>

        {/* mobile toggle */}
        <button
          type="button"
          aria-label="Toggle menu"
          onClick={() => setOpen((v) => !v)}
          className={[
            "md:hidden rounded-md p-2",
            scrolled || open ? "text-ink" : "text-white",
          ].join(" ")}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {/* mobile menu */}
      {open && (
        <div className="border-t border-ink/5 bg-cream/95 px-6 pb-6 pt-2 backdrop-blur-md md:hidden">
          <ul className="flex flex-col gap-1">
            {nav.links.map((l) => (
              <li key={l.label}>
                <a
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-lg px-3 py-2.5 text-base font-medium text-ink/85 hover:bg-sand"
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex gap-3">
            <button type="button" className="flex-1 rounded-full border border-ink/15 px-5 py-2.5 text-sm font-semibold text-ink">
              Login
            </button>
            <button type="button" className="flex-1 rounded-full bg-orange px-5 py-2.5 text-sm font-semibold text-white">
              Sign Up
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
