import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Orange Express",
    short_name: "Orange Express",
    description: "Farmer-owned oranges, from our family groves to your table.",
    start_url: "/",
    display: "standalone",
    background_color: "#050506",
    theme_color: "#050506",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/logo-mark.svg", sizes: "any", type: "image/svg+xml" },
    ],
  };
}
