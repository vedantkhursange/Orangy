import type { NextConfig } from "next";

/**
 * /backend/* is proxied to the Spring backend by app/backend/[...path]/route.ts
 * (a Route Handler, not a next.config rewrite — see that file for why).
 */
const nextConfig: NextConfig = {
  // Standalone server bundle for the Docker image (node server.js)
  output: "standalone",
};

export default nextConfig;
