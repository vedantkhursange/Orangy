import type { Metadata } from "next";
import type { MediaAsset, Page, Product, ProductSummary, Review } from "./types";
import { contact, social } from "@/data/site";

/**
 * Server-side SEO helpers: canonical site URL, backend reads for metadata,
 * sitemap and JSON-LD. Client code keeps using lib/api.ts through /backend.
 */

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://orangeexpress.in").replace(/\/$/, "");
export const SITE_NAME = "Orange Express";
export const DEFAULT_DESCRIPTION =
  "Buy fresh Nagpur oranges and cold-pressed orange juice direct from a farmer-owned family orchard in Pandhurna, Madhya Pradesh. Hand-picked, no middlemen, delivered to your door.";

function backendUrl() {
  return process.env.BACKEND_URL ?? "http://130.210.4.172:30080";
}

/** GET a backend endpoint and unwrap its { success, data } envelope. Never throws. */
async function backendGet<T>(path: string, revalidate = 600): Promise<T | null> {
  try {
    const res = await fetch(`${backendUrl()}${path}`, {
      next: { revalidate },
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return null;
    const body = (await res.json()) as { success?: boolean; data?: T };
    return body?.data ?? null;
  } catch {
    return null;
  }
}

export const getProduct = (id: string) => backendGet<Product>(`/api/products/${encodeURIComponent(id)}`);
export const getProductMedia = (id: string) => backendGet<MediaAsset[]>(`/api/media/product/${encodeURIComponent(id)}`);
export const getProductReviews = (id: string) =>
  backendGet<Page<Review>>(`/api/reviews/product/${encodeURIComponent(id)}?page=0&size=100`);
export const getAllProducts = () => backendGet<Page<ProductSummary>>("/api/products?size=200", 3600);

/** Plain-text, single-line excerpt for meta descriptions (Google shows ~155 chars). */
export function excerpt(text: string | null | undefined, max = 155) {
  const clean = (text ?? "").replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return clean.slice(0, max - 1).replace(/\s+\S*$/, "") + "…";
}

/** Resized Cloudinary image for social cards; other URLs pass through. */
export function ogImage(url: string) {
  return url.includes("res.cloudinary.com") && url.includes("/upload/")
    ? url.replace("/upload/", "/upload/f_jpg,q_auto,c_fill,w_1200,h_630/")
    : url;
}

const sameAs = () => social.map((s) => s.href).filter(Boolean);

/** Organization + LocalBusiness + WebSite graph for the home page. */
export function siteJsonLd() {
  const org = {
    "@type": ["Organization", "LocalBusiness"],
    "@id": `${SITE_URL}/#org`,
    name: SITE_NAME,
    legalName: contact.farm,
    url: SITE_URL,
    logo: `${SITE_URL}/icon-512.png`,
    image: `${SITE_URL}/opengraph-image`,
    description: DEFAULT_DESCRIPTION,
    address: {
      "@type": "PostalAddress",
      addressLocality: "Pandhurna",
      addressRegion: "Madhya Pradesh",
      postalCode: "480334",
      addressCountry: "IN",
    },
    hasMap: contact.mapsLink,
    areaServed: "IN",
    priceRange: "₹₹",
    ...(contact.phone ? { telephone: contact.phone } : {}),
    ...(contact.email ? { email: contact.email } : {}),
    ...(sameAs().length ? { sameAs: sameAs() } : {}),
  };
  const website = {
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    url: SITE_URL,
    name: SITE_NAME,
    inLanguage: "en-IN",
    publisher: { "@id": `${SITE_URL}/#org` },
  };
  return { "@context": "https://schema.org", "@graph": [org, website] };
}

export function productJsonLd(product: Product, images: string[], reviews: Review[], totalReviews: number) {
  const url = `${SITE_URL}/products/${product.id}`;
  const prices = product.variants.map((v) => v.price).filter((p) => p > 0);
  const inStock = product.variants.some((v) => v.stockCount > 0);
  const offers =
    prices.length === 0
      ? undefined
      : {
          "@type": "AggregateOffer",
          priceCurrency: "INR",
          lowPrice: Math.min(...prices),
          highPrice: Math.max(...prices),
          offerCount: prices.length,
          availability: inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
          url,
          seller: { "@id": `${SITE_URL}/#org` },
        };
  const rated = reviews.filter((r) => r.rating > 0);
  const aggregateRating =
    rated.length > 0
      ? {
          "@type": "AggregateRating",
          ratingValue: Number((rated.reduce((s, r) => s + r.rating, 0) / rated.length).toFixed(1)),
          reviewCount: Math.max(totalReviews, rated.length),
          bestRating: 5,
          worstRating: 1,
        }
      : undefined;
  const product_ = {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${url}#product`,
    name: product.name,
    description: excerpt(product.description, 5000) || DEFAULT_DESCRIPTION,
    url,
    image: images.length ? images : undefined,
    category: product.category,
    brand: { "@type": "Brand", name: SITE_NAME },
    ...(offers ? { offers } : {}),
    ...(aggregateRating ? { aggregateRating } : {}),
    review: rated.slice(0, 5).map((r) => ({
      "@type": "Review",
      reviewRating: { "@type": "Rating", ratingValue: r.rating, bestRating: 5 },
      author: { "@type": "Person", name: r.userName || "Verified buyer" },
      datePublished: r.createdAt?.slice(0, 10),
      ...(r.comment ? { reviewBody: r.comment } : {}),
    })),
  };
  const breadcrumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Products", item: `${SITE_URL}/products` },
      { "@type": "ListItem", position: 3, name: product.name, item: url },
    ],
  };
  return [product_, breadcrumbs];
}

/** Serialise JSON-LD safely for an inline <script> (no `</script>` breakout). */
export function jsonLd(data: unknown) {
  return { __html: JSON.stringify(data).replace(/</g, "\\u003c") };
}

/**
 * Metadata for an indexable page. Next.js replaces (not merges) a parent's
 * `openGraph`/`twitter` objects, so each page sends the full set.
 */
export function pageMeta({
  title,
  description,
  path,
  images,
}: {
  title: string;
  description: string;
  path: string;
  images?: { url: string; alt?: string }[];
}): Metadata {
  const fullTitle = `${title} | ${SITE_NAME}`;
  // Fall back to the generated brand card (app/opengraph-image.tsx); a page
  // that sets openGraph without images would otherwise share with no picture.
  images = images?.length ? images : [{ url: "/opengraph-image", alt: SITE_NAME }];
  return {
    // absolute: a plain-string title in a parent layout stops the root
    // template from reaching deeper routes, so spell the suffix out here
    title: { absolute: fullTitle },
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      locale: "en_IN",
      url: path,
      title: fullTitle,
      description,
      images,
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: images.map((i) => i.url),
    },
  };
}
