import type { NextConfig } from "next";

/**
 * /backend/* is proxied to the Spring backend by app/backend/[...path]/route.ts
 * (a Route Handler, not a next.config rewrite — see that file for why).
 */
const nextConfig: NextConfig = {
  // Standalone server bundle for the Docker image (node server.js)
  output: "standalone",
  // 3D models are large: let browsers and Cloudflare cache them for a week
  async headers() {
    return [
      {
        source: "/models/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=604800, stale-while-revalidate=86400" }],
      },
    ];
  },
};

export default nextConfig;
