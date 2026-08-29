import { NextRequest } from "next/server";

/**
 * Replaces the old next.config.ts `rewrites()` proxy.
 *
 * That approach silently broke in this Next.js version: the standalone
 * server logs "Running next.config took 1.3ms" at every boot, but a
 * `console.log` placed next to the `BACKEND_URL` read in next.config.ts
 * never appeared in the container's runtime logs — config module evaluation
 * happens once, at build time, and the resolved rewrite destination gets
 * frozen into the build output. The `BACKEND_URL` env var injected by
 * Kubernetes at deploy time was never actually read again after that.
 *
 * Caught live: prod's frontend was silently proxying every request to the
 * BUILD-TIME fallback (dev's public NodePort) instead of its own backend —
 * dev was never wired to notice, since its own fallback happens to equal
 * its own real backend.
 *
 * A Route Handler's exported method functions are unambiguously called at
 * request time, every time — there is no equivalent caching for this code
 * path. Reading `process.env.BACKEND_URL` inside `proxy()` below is
 * guaranteed to see the actual running container's environment.
 */

export const dynamic = "force-dynamic";

const HOP_BY_HOP = new Set([
  "connection",
  "content-length",
  "host",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
]);

function backendUrl() {
  return process.env.BACKEND_URL ?? "http://130.210.4.172:30080";
}

async function proxy(request: NextRequest, path: Promise<{ path: string[] }>) {
  const { path: segments } = await path;
  const target = `${backendUrl()}/${segments.join("/")}${request.nextUrl.search}`;

  const headers = new Headers(request.headers);
  for (const h of HOP_BY_HOP) headers.delete(h);

  const hasBody = !["GET", "HEAD"].includes(request.method);

  const upstream = await fetch(target, {
    method: request.method,
    headers,
    body: hasBody ? await request.arrayBuffer() : undefined,
    redirect: "manual",
  });

  const responseHeaders = new Headers(upstream.headers);
  for (const h of HOP_BY_HOP) responseHeaders.delete(h);

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: responseHeaders,
  });
}

type Ctx = { params: Promise<{ path: string[] }> };

export async function GET(request: NextRequest, { params }: Ctx) {
  return proxy(request, params);
}
export async function POST(request: NextRequest, { params }: Ctx) {
  return proxy(request, params);
}
export async function PUT(request: NextRequest, { params }: Ctx) {
  return proxy(request, params);
}
export async function PATCH(request: NextRequest, { params }: Ctx) {
  return proxy(request, params);
}
export async function DELETE(request: NextRequest, { params }: Ctx) {
  return proxy(request, params);
}
