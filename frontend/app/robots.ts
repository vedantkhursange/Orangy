import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://orangeexpress.in";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // account pages and the admin console have nothing to index
        disallow: ["/admin", "/account", "/cart", "/checkout", "/orders"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
