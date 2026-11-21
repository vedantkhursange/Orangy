import type { Metadata } from "next";
import QRCode from "qrcode";
import { brand, contact } from "@/data/site";
import PrintButton from "./PrintButton";

export const metadata: Metadata = {
  title: "Gift card",
  robots: { index: false, follow: false },
};

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://orangeexpress.in";
const REVIEW_URL = `${SITE}/review`;

// Pandhurna, Madhya Pradesh
const FARM = { lat: 21.6, lon: 78.52 };

/**
 * Printable A6 (148 × 105 mm) card that goes into each gift box of oranges.
 * Front: brand, the 3D orange and a QR code to the no-login review page.
 * Back: contact details and a small globe pinned on the farm.
 * Open /gift-card and print (or "Save as PDF"): one page per side.
 */
export default async function GiftCardPage() {
  const qr = await QRCode.toString(REVIEW_URL, {
    type: "svg",
    errorCorrectionLevel: "Q",
    margin: 0,
    color: { dark: "#0a0a0c", light: "#ffffff" },
  });

  return (
    <div className="gift-sheet mx-auto flex max-w-[1100px] flex-col items-center gap-10 px-4 py-10">
      <div className="print:hidden text-center">
        <h1 className="display text-3xl font-bold text-white">Gift card</h1>
        <p className="mt-2 text-sm text-white/60">
          A6 size, 148 × 105 mm. Print double-sided (flip on long edge), or save as PDF and send to a print shop.
        </p>
        <p className="mt-1 text-xs text-white/40">QR code opens {REVIEW_URL}</p>
        <PrintButton />
      </div>

      {/* ── FRONT ── */}
      <section className="gift-card relative overflow-hidden bg-black text-white" aria-label="Card front">
        <CardGrid />
        <div className="gift-frame" />

        <div className="relative grid h-full grid-cols-[1.35fr_1fr]">
          <div className="relative flex flex-col justify-between p-[9mm]">
            <div className="flex items-center gap-[2mm]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo-mark.svg" alt="" className="h-[5.5mm] w-[5.5mm] rounded-[1.2mm]" />
              <span className="display text-[3.1mm] font-semibold tracking-[0.32em]">{brand.name.toUpperCase()}</span>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/orange-3d.png" alt="Fresh oranges" className="absolute left-[11mm] top-[21mm] w-[58mm]" />
            <div className="relative">
              <p className="display text-[6.4mm] font-bold leading-[1.05] tracking-[-0.01em]">
                Born under the sun.
                <br />
                <span className="text-orange">Picked for you.</span>
              </p>
              <p className="mt-[2.2mm] text-[2.1mm] uppercase tracking-[0.42em] text-white/45">Ambia bahar · 2026 harvest</p>
            </div>
          </div>

          <div className="relative flex flex-col items-center justify-center gap-[4.5mm] p-[9mm]">
            <span className="absolute bottom-[14mm] left-0 top-[14mm] w-px bg-white/12" />
            <p className="whitespace-nowrap text-center text-[2.1mm] uppercase tracking-[0.3em] text-white/45">Tell us how they taste</p>
            <div className="rounded-[2.5mm] bg-white p-[2.6mm]">
              <div className="h-[33mm] w-[33mm] [&>svg]:h-full [&>svg]:w-full" dangerouslySetInnerHTML={{ __html: qr }} />
            </div>
            <div className="text-center">
              <p className="display text-[3.5mm] font-semibold">Scan to leave a review</p>
              <p className="mt-[1mm] text-[2.3mm] text-white/50">Stars, a photo, two lines. No sign-up.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── BACK ── */}
      <section className="gift-card relative overflow-hidden bg-black text-white" aria-label="Card back">
        <CardGrid />
        <div className="gift-frame" />

        <div className="relative grid h-full grid-cols-[1.35fr_1fr] p-[9mm]">
          <div className="flex flex-col justify-between pr-[6mm]">
            <div>
              <p className="text-[2.1mm] uppercase tracking-[0.42em] text-orange">A gift from our grove</p>
              <p className="display mt-[3mm] text-[5.4mm] font-bold leading-[1.14] tracking-[-0.01em]">
                Grown, picked and packed by our family, for yours.
              </p>
            </div>
            <ul className="space-y-[2mm] border-t border-white/12 pt-[4mm] text-[2.7mm] text-white/70">
              <Row icon="pin">
                <span className="font-semibold text-white">{contact.farm}</span>
                <br />
                {contact.address}
              </Row>
              <Row icon="phone">{contact.phone || "+91 ····· ·····"}</Row>
              {contact.email && <Row icon="mail">{contact.email}</Row>}
              <Row icon="globe">
                <span className="font-semibold text-white">{contact.website}</span>
              </Row>
            </ul>
          </div>

          <div className="relative flex flex-col items-center justify-center">
            <span className="absolute bottom-[5mm] left-0 top-[5mm] w-px bg-white/12" />
            <Globe />
            <p className="mt-[3mm] text-center text-[2.1mm] uppercase tracking-[0.36em] text-white/80">Pandhurna · India</p>
            <p className="mt-[1mm] text-center text-[2mm] tracking-[0.12em] text-white/40">
              {FARM.lat.toFixed(2)}° N &nbsp; {FARM.lon.toFixed(2)}° E
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

/** The site's perspective grid, as a quiet floor along the bottom of the card. */
function CardGrid() {
  return (
    <div className="gift-grid" aria-hidden>
      <div />
    </div>
  );
}

function Row({ icon, children }: { icon: "pin" | "phone" | "mail" | "globe"; children: React.ReactNode }) {
  const d = {
    pin: "M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12zm0-9a3 3 0 1 1 0-6 3 3 0 0 1 0 6z",
    phone: "M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z",
    mail: "M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm16 2-8 6-8-6",
    globe: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM2 12h20M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20",
  }[icon];
  return (
    <li className="flex gap-[2mm]">
      <svg viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mt-[0.4mm] h-[3mm] w-[3mm] shrink-0">
        <path d={d} />
      </svg>
      <span>{children}</span>
    </li>
  );
}

/** Orthographic globe (graticule only) centred near India, pin on the farm. */
function Globe() {
  const R = 40;
  const lat0 = (18 * Math.PI) / 180;
  const lon0 = (70 * Math.PI) / 180;
  const project = (latDeg: number, lonDeg: number) => {
    const lat = (latDeg * Math.PI) / 180;
    const lon = (lonDeg * Math.PI) / 180;
    const cosc = Math.sin(lat0) * Math.sin(lat) + Math.cos(lat0) * Math.cos(lat) * Math.cos(lon - lon0);
    const x = R * Math.cos(lat) * Math.sin(lon - lon0);
    const y = R * (Math.cos(lat0) * Math.sin(lat) - Math.sin(lat0) * Math.cos(lat) * Math.cos(lon - lon0));
    return { x: 50 + x, y: 50 - y, visible: cosc > 0 };
  };
  const line = (pts: { x: number; y: number; visible: boolean }[]) => {
    let d = "";
    let pen = false;
    for (const p of pts) {
      if (!p.visible) {
        pen = false;
        continue;
      }
      d += `${pen ? "L" : "M"}${p.x.toFixed(2)} ${p.y.toFixed(2)}`;
      pen = true;
    }
    return d;
  };
  const paths: string[] = [];
  for (let lat = -75; lat <= 75; lat += 15) paths.push(line(Array.from({ length: 73 }, (_, i) => project(lat, -180 + i * 5))));
  for (let lon = -180; lon < 180; lon += 15) paths.push(line(Array.from({ length: 37 }, (_, i) => project(-90 + i * 5, lon))));
  const pin = project(FARM.lat, FARM.lon);

  return (
    <svg viewBox="0 0 100 100" className="h-[36mm] w-[36mm]" aria-label="Globe with a pin on Pandhurna, India">
      <circle cx="50" cy="50" r={R} fill="#050505" stroke="rgba(255,255,255,0.3)" strokeWidth="0.35" />
      {paths.map((d, i) => (
        <path key={i} d={d} fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth="0.25" />
      ))}
      <circle cx={pin.x} cy={pin.y} r="5" fill="none" stroke="rgba(255,122,26,0.55)" strokeWidth="0.35" />
      <circle cx={pin.x} cy={pin.y} r="1.6" fill="#ff7a1a" />
    </svg>
  );
}
