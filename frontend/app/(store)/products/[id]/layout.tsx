import type { Metadata } from "next";
import { cdn } from "@/lib/media";
import {
  DEFAULT_DESCRIPTION,
  excerpt,
  getProduct,
  getProductMedia,
  getProductReviews,
  jsonLd,
  ogImage,
  pageMeta,
  productJsonLd,
} from "@/lib/seo";

/**
 * The product page itself is a client component, so its title, description,
 * social card and Product/Breadcrumb structured data are rendered here on the
 * server, where crawlers see them without running JavaScript.
 */

type Props = { params: Promise<{ id: string }>; children: React.ReactNode };

async function load(id: string) {
  const [product, media, reviews] = await Promise.all([getProduct(id), getProductMedia(id), getProductReviews(id)]);
  const images = [
    ...[...(media ?? [])].filter((m) => m.type === "IMAGE").sort((a, b) => a.sortOrder - b.sortOrder).map((m) => m.url),
    ...(product?.variants ?? []).map((v) => v.thumbnailImageUrl).filter((u): u is string => !!u),
  ];
  return { product, images: [...new Set(images)], reviews };
}

export async function generateMetadata({ params }: Omit<Props, "children">): Promise<Metadata> {
  const { id } = await params;
  const { product, images } = await load(id);
  if (!product) return { title: "Product", robots: { index: false, follow: true } };

  const prices = product.variants.map((v) => v.price).filter((p) => p > 0);
  const from = prices.length ? ` From ₹${Math.min(...prices)}.` : "";
  const lead = product.description?.trim() || `${product.name}, hand-picked at Khursange Farms.`;
  const description = excerpt(`${lead}${from}`) || DEFAULT_DESCRIPTION;

  return {
    ...pageMeta({
      title: `Buy ${product.name} Online`,
      description,
      path: `/products/${product.id}`,
      images: images.slice(0, 1).map((u) => ({ url: ogImage(u), alt: product.name })),
    }),
    ...(product.active === false ? { robots: { index: false, follow: true } } : {}),
  };
}

export default async function ProductLayout({ params, children }: Props) {
  const { id } = await params;
  const { product, images, reviews } = await load(id);
  return (
    <>
      {product && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={jsonLd(
            productJsonLd(product, images.slice(0, 6).map((u) => cdn(u, 1200)), reviews?.content ?? [], reviews?.totalElements ?? 0),
          )}
        />
      )}
      {children}
    </>
  );
}
