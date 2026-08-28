import Link from "next/link";
import { Leaf } from "lucide-react";
import { inr } from "@/lib/api";
import type { ProductSummary } from "@/lib/types";
import { Badge } from "@/components/ui/ui";

export default function ProductCard({ product }: { product: ProductSummary }) {
  return (
    <Link href={`/products/${product.id}`} className="group">
      <div className="relative aspect-square overflow-hidden rounded-2xl border border-ink/8 bg-sand">
        {product.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.thumbnailUrl}
            alt={product.name}
            onError={(e) => { e.currentTarget.style.display = "none"; }}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Leaf className="h-10 w-10 text-orange/40" />
          </div>
        )}
        {product.category && (
          <span className="absolute left-3 top-3">
            <Badge tone="orange">{product.category}</Badge>
          </span>
        )}
      </div>
      <div className="mt-3 px-0.5">
        <h3 className="truncate text-sm font-semibold text-ink group-hover:text-orange-deep">{product.name}</h3>
        <p className="mt-0.5 text-sm text-ink/60">
          {product.startingPrice != null ? (
            <>From <span className="display text-base font-bold text-orange-deep">{inr(product.startingPrice)}</span></>
          ) : (
            "See options"
          )}
        </p>
      </div>
    </Link>
  );
}
