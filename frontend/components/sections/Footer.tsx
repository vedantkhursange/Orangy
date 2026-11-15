import Link from "next/link";
import { MapPin, Phone, Mail } from "lucide-react";
import { brand, contact, footer, social } from "@/data/site";

/** Brand glyphs (lucide dropped brand icons), 24px viewBox, currentColor. */
const ICONS: Record<string, string> = {
  Instagram:
    "M12 2.2c3.2 0 3.6 0 4.8.1 3.3.1 4.8 1.7 4.9 4.9.1 1.3.1 1.6.1 4.8s0 3.6-.1 4.8c-.1 3.2-1.7 4.8-4.9 4.9-1.3.1-1.6.1-4.8.1s-3.6 0-4.8-.1c-3.3-.1-4.8-1.7-4.9-4.9C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.8C2.4 3.9 3.9 2.4 7.2 2.3 8.4 2.2 8.8 2.2 12 2.2zm0 4.7a5.1 5.1 0 1 0 0 10.2 5.1 5.1 0 0 0 0-10.2zm0 8.4a3.3 3.3 0 1 1 0-6.6 3.3 3.3 0 0 1 0 6.6zm5.3-9.8a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4z",
  YouTube:
    "M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8zM9.6 15.6V8.4l6.3 3.6-6.3 3.6z",
  Facebook:
    "M24 12a12 12 0 1 0-13.9 11.9v-8.4H7.1V12h3V9.4c0-3 1.8-4.7 4.5-4.7 1.3 0 2.7.2 2.7.2v3h-1.5c-1.5 0-2 .9-2 1.9V12h3.4l-.5 3.5h-2.9v8.4A12 12 0 0 0 24 12z",
  WhatsApp:
    "M17.5 14.4c-.3-.1-1.8-.9-2-1-.3-.1-.5-.1-.7.1-.2.3-.8 1-.9 1.2-.2.2-.3.2-.6.1-.3-.1-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6l.4-.5.3-.5c.1-.2 0-.4 0-.5l-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.2 5.1 4.5 2.5 1 3 .8 3.6.7.6-.1 1.8-.7 2-1.5.3-.7.3-1.4.2-1.5-.1-.1-.3-.2-.6-.3zM12 21.8c-1.8 0-3.5-.5-5-1.4l-.4-.2-3.7 1 1-3.6-.2-.4A9.8 9.8 0 1 1 12 21.8zM12 0a12 12 0 0 0-10.4 18L0 24l6.2-1.6A12 12 0 1 0 12 0z",
  X: "M18.2 2.3h3.4l-7.4 8.5L23 21.7h-6.8l-5.3-7-6.1 7H1.4l7.9-9L.9 2.3h7l4.8 6.4 5.5-6.4zm-1.2 17.4h1.9L7 4.2H5z",
};

export default function Footer() {
  const live = social.filter((s) => s.href);
  return (
    <footer className="relative z-10 border-t border-white/10 bg-black/40 pb-10 pt-16 text-white/70 backdrop-blur-xl">
      <div className="mx-auto grid max-w-7xl gap-12 px-6 md:grid-cols-[2fr_1fr_1fr_1.4fr] md:px-10">
        <div>
          <Link href="/" className="display flex items-center gap-3 text-2xl font-bold tracking-[0.18em] text-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-mark.svg" alt="" width={40} height={40} className="h-10 w-10 rounded-xl" />
            {brand.name}
          </Link>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/50">{footer.blurb}</p>
          <ul className="mt-6 flex gap-3" aria-label="Follow us">
            {social.map((s) => (
              <li key={s.label}>
                {s.href ? (
                  <a href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.label} className="glass flex h-10 w-10 items-center justify-center rounded-full text-white/80 transition hover:text-orange">
                    <Glyph name={s.label} />
                  </a>
                ) : (
                  <span title={`${s.label}: coming soon`} className="glass flex h-10 w-10 items-center justify-center rounded-full text-white/35">
                    <Glyph name={s.label} />
                  </span>
                )}
              </li>
            ))}
          </ul>
          {live.length === 0 && <p className="mt-2 text-xs text-white/30">Social channels launching soon.</p>}
        </div>
        {footer.columns.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <h3 className="text-xs font-semibold uppercase tracking-[0.25em] text-white/40">{col.title}</h3>
            <ul className="mt-4 space-y-2.5">
              {col.links.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="text-sm text-white/65 transition-colors hover:text-orange">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-[0.25em] text-white/40">Reach us</h3>
          <ul className="mt-4 space-y-3 text-sm">
            <li>
              <a href={contact.mapsLink} target="_blank" rel="noopener noreferrer" className="flex gap-2.5 text-white/65 transition hover:text-orange">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-orange" />
                <span>{contact.farm}<br />{contact.address}</span>
              </a>
            </li>
            {contact.phone && (
              <li>
                <a href={`tel:${contact.phone.replace(/\s/g, "")}`} className="flex gap-2.5 text-white/65 transition hover:text-orange">
                  <Phone className="mt-0.5 h-4 w-4 shrink-0 text-orange" /> {contact.phone}
                </a>
              </li>
            )}
            {contact.email && (
              <li>
                <a href={`mailto:${contact.email}`} className="flex gap-2.5 text-white/65 transition hover:text-orange">
                  <Mail className="mt-0.5 h-4 w-4 shrink-0 text-orange" /> {contact.email}
                </a>
              </li>
            )}
          </ul>
        </div>
      </div>
      <div className="mx-auto mt-14 max-w-7xl border-t border-white/10 px-6 pt-8 text-xs text-white/35 md:px-10">
        {footer.fineprint}
      </div>
    </footer>
  );
}

export function Glyph({ name, className = "h-4 w-4" }: { name: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d={ICONS[name]} />
    </svg>
  );
}
