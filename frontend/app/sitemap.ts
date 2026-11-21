import type { MetadataRoute } from "next";
import { SITE_URL, getAllProducts } from "@/lib/seo";

// Rebuilt at most hourly so new products show up without a redeploy.
export const revalidate = 3600;

/** Public, indexable routes. Account, cart and checkout pages are noindex. */
const ROUTES = [
  { path: "", priority: 1, changeFrequency: "weekly" },
  { path: "/products", priority: 0.9, changeFrequency: "daily" },
  { path: "/contact", priority: 0.6, changeFrequency: "monthly" },
  { path: "/review", priority: 0.4, changeFrequency: "monthly" },
] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = (await getAllProducts())?.content ?? [];
  return [
    ...ROUTES.map((r) => ({ url: `${SITE_URL}${r.path}`, changeFrequency: r.changeFrequency, priority: r.priority })),
    ...products.map((p) => ({
      url: `${SITE_URL}/products/${p.id}`,
      changeFrequency: "weekly" as const,
      priority: 0.8,
      ...(p.thumbnailUrl ? { images: [p.thumbnailUrl] } : {}),
    })),
  ];
}
