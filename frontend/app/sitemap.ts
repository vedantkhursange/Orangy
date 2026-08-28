import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://orangeexpress.in";

/** Public, indexable routes. Product detail pages are intentionally excluded —
 *  they are backend-driven and would need a fetch at build time. */
const ROUTES = ["", "/products", "/contact", "/login", "/signup"] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  return ROUTES.map((path) => ({
    url: `${SITE_URL}${path}`,
    changeFrequency: path === "" ? "weekly" : "monthly",
    priority: path === "" ? 1 : 0.7,
  }));
}
