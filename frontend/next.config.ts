import type { NextConfig } from "next";

/**
 * The Spring backend has no CORS configuration, so the browser never talks to
 * it directly: every /backend/* request is proxied server-side by Next.
 * Override the target with BACKEND_URL when it moves.
 */
const BACKEND_URL = process.env.BACKEND_URL ?? "http://130.210.4.172:30080";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/backend/:path*",
        destination: `${BACKEND_URL}/:path*`,
      },
    ];
  },
};

export default nextConfig;
