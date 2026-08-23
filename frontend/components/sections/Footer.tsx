import { brand, footer } from "@/data/site";

export default function Footer() {
  return (
    <footer className="bg-dusk py-16 text-cream/70">
      <div className="mx-auto grid max-w-7xl gap-12 px-6 md:grid-cols-[2fr_1fr_1fr_1fr] md:px-10">
        <div>
          <p className="display text-2xl font-bold tracking-[0.18em] text-orange-glow">{brand.name}</p>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-cream/50">{footer.blurb}</p>
        </div>
        {footer.columns.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <h3 className="text-xs font-semibold uppercase tracking-[0.25em] text-cream/40">{col.title}</h3>
            <ul className="mt-4 space-y-2.5">
              {col.links.map((l) => (
                <li key={l}>
                  <a href="#" className="text-sm text-cream/65 transition-colors hover:text-orange-glow">
                    {l}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="mx-auto mt-14 max-w-7xl border-t border-cream/10 px-6 pt-8 text-xs text-cream/35 md:px-10">
        {footer.fineprint}
      </div>
    </footer>
  );
}
