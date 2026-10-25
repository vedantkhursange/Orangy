import Link from "next/link";
import { ChevronRight, Leaf } from "lucide-react";
import { inr } from "@/lib/api";
import { cdn, cdnSrcSet } from "@/lib/media";
import type { ProductSummary } from "@/lib/types";

/**
 * Food-app style product card: rounded photo with the price printed over a
 * dark fade (the Swiggy "offer strip"), a solid category chip, and a bold
 * name + one muted line underneath. The whole card is the link.
 */
export default function ProductCard({ product, size = "md" }: { product: ProductSummary; size?: "md" | "lg" }) {
  return (
    <Link href={`/products/${product.id}`} className="group block rounded-3xl outline-offset-4 transition active:scale-[0.98]">
      <div
        className="relative overflow-hidden rounded-3xl bg-surface-2 shadow-card transition duration-300 group-hover:-translate-y-1 group-hover:shadow-lift"
        style={{ aspectRatio: size === "lg" ? "4/5" : "1/1" }}
      >
        {product.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cdn(product.thumbnailUrl, 640)}
            srcSet={cdnSrcSet(product.thumbnailUrl, [320, 480, 640, 900])}
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 45vw, 90vw"
            alt={product.name}
            loading="lazy"
            onError={(e) => { e.currentTarget.style.display = "none"; }}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Leaf className="h-10 w-10 text-brand/40" />
          </div>
        )}
        {product.category && (
          <span className="absolute left-3 top-3 rounded-lg bg-surface/95 px-2 py-1 text-[10px] font-extrabold uppercase tracking-wider text-brand-deep shadow-sm">
            {product.category}
          </span>
        )}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent px-4 pb-3 pt-10">
          <p className="display text-lg font-extrabold uppercase leading-none tracking-tight text-white md:text-xl">
            {product.startingPrice != null ? <>From {inr(product.startingPrice)}</> : "See options"}
          </p>
        </div>
      </div>
      <div className="mt-3 px-1">
        <h3 className="flex items-center justify-between gap-2 text-base font-extrabold leading-snug text-ink">
          <span className="truncate">{product.name}</span>
          <ChevronRight className="h-4 w-4 shrink-0 text-muted transition group-hover:translate-x-0.5 group-hover:text-brand" />
        </h3>
        {product.description && <p className="mt-0.5 line-clamp-1 text-sm text-muted">{product.description}</p>}
      </div>
    </Link>
  );
}
