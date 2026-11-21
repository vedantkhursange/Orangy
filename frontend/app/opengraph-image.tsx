import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

// Default social card (WhatsApp, LinkedIn, X, Facebook) for every page that
// does not set its own image. Rendered once at build time.
export const alt = "Orange Express: fresh oranges and juice, direct from our family farm";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const orange = await readFile(join(process.cwd(), "public/images/orange-3d.png"));
  const src = `data:image/png;base64,${orange.toString("base64")}`;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          background: "#050506",
          color: "white",
          padding: "0 72px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", width: 640 }}>
          <div style={{ fontSize: 30, letterSpacing: 6, color: "#ff8a1f", fontWeight: 700 }}>ORANGE EXPRESS</div>
          <div style={{ fontSize: 76, fontWeight: 800, lineHeight: 1.05, marginTop: 24 }}>Born under the sun.</div>
          <div style={{ fontSize: 76, fontWeight: 800, lineHeight: 1.05, color: "#ff8a1f" }}>Made for you.</div>
          <div style={{ fontSize: 30, marginTop: 32, color: "rgba(255,255,255,0.7)" }}>
            Farm-fresh oranges &amp; juice, straight from our family groves.
          </div>
          <div style={{ fontSize: 26, marginTop: 36, color: "rgba(255,255,255,0.5)" }}>orangeexpress.in</div>
        </div>
        <img src={src} alt="" width={460} height={361} style={{ marginLeft: 20 }} />
      </div>
    ),
    size,
  );
}
