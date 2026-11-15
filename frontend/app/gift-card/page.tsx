import type { Metadata } from "next";
import QRCode from "qrcode";
import { brand, contact } from "@/data/site";
import PrintButton from "./PrintButton";

export const metadata: Metadata = {
  title: "Gift card — Orange Express",
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
      <section className="gift-card relative overflow-hidden text-white" aria-label="Card front">
        <div className="absolute inset-0 bg-[#060607]" />
        <div className="absolute -left-[20%] top-[-30%] h-[130%] w-[75%] rounded-full bg-[radial-gradient(circle,rgba(255,122,26,0.42),transparent_62%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(115deg,transparent_55%,rgba(255,255,255,0.05)_56%,transparent_75%)]" />

        <div className="relative grid h-full grid-cols-[1.25fr_1fr]">
          <div className="relative flex flex-col justify-between p-[6mm]">
            <div className="flex items-center gap-[2mm]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo-mark.svg" alt="" className="h-[7mm] w-[7mm] rounded-[1.6mm]" />
              <span className="display text-[4.2mm] font-bold tracking-[0.16em]">{brand.name}</span>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/orange-3d.png" alt="Fresh oranges" className="absolute left-[2mm] top-[17mm] w-[78mm] drop-shadow-[0_6mm_8mm_rgba(255,122,26,0.35)]" />
            <div className="relative">
              <p className="display text-[5.6mm] font-bold leading-[1.05]">
                Born under the sun.
                <br />
                <span className="text-gradient">Picked for you.</span>
              </p>
              <p className="mt-[1.5mm] text-[2.5mm] uppercase tracking-[0.3em] text-white/55">Ambia bahar · 2026 harvest</p>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center gap-[3mm] border-l border-white/10 bg-white/[0.04] p-[6mm]">
            <div className="rounded-[3mm] bg-white p-[3mm] shadow-[0_0_0_0.5mm_rgba(255,122,26,0.6),0_4mm_10mm_rgba(255,122,26,0.25)]">
              <div className="h-[34mm] w-[34mm] [&>svg]:h-full [&>svg]:w-full" dangerouslySetInnerHTML={{ __html: qr }} />
            </div>
            <div className="text-center">
              <p className="display text-[3.6mm] font-bold">Scan &amp; rate your oranges</p>
              <p className="mt-[0.8mm] text-[2.4mm] text-white/60">Stars, a photo, two lines. No sign-up.</p>
            </div>
            <p className="text-[2.6mm] font-semibold tracking-[0.12em] text-orange">{contact.website}</p>
          </div>
        </div>
      </section>

      {/* ── BACK ── */}
      <section className="gift-card relative overflow-hidden text-white" aria-label="Card back">
        <div className="absolute inset-0 bg-[#060607]" />
        <div className="absolute -right-[15%] bottom-[-40%] h-[120%] w-[70%] rounded-full bg-[radial-gradient(circle,rgba(255,122,26,0.3),transparent_62%)]" />

        <div className="relative grid h-full grid-cols-[1.2fr_1fr] gap-[4mm] p-[7mm]">
          <div className="flex flex-col justify-between">
            <div>
              <p className="text-[2.4mm] uppercase tracking-[0.3em] text-orange">A gift from our grove</p>
              <p className="display mt-[2mm] text-[5mm] font-bold leading-[1.15]">
                Grown, picked and packed by our family, for yours.
              </p>
            </div>
            <ul className="space-y-[1.8mm] text-[2.9mm] text-white/80">
              <Row icon="pin">
                <span className="font-semibold text-white">{contact.farm}</span>
                <br />
                {contact.address}
              </Row>
              <Row icon="phone">{contact.phone || "+91 ····· ·····"}</Row>
              {contact.email && <Row icon="mail">{contact.email}</Row>}
              <Row icon="globe">{contact.website}</Row>
            </ul>
            <div className="flex items-center gap-[2mm]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo-mark.svg" alt="" className="h-[6mm] w-[6mm] rounded-[1.3mm]" />
              <span className="display text-[3.2mm] font-bold tracking-[0.16em]">{brand.name}</span>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center rounded-[4mm] border border-white/12 bg-white/[0.05] p-[3mm]">
            <Globe />
            <p className="mt-[2mm] text-center text-[2.6mm] font-semibold">Pandhurna, Madhya Pradesh</p>
            <p className="text-center text-[2.2mm] text-white/55">
              {FARM.lat.toFixed(2)}° N · {FARM.lon.toFixed(2)}° E
            </p>
            <p className="mt-[0.5mm] text-center text-[2mm] text-white/40">Plus Code {contact.plusCode.split(" ")[0]}</p>
          </div>
        </div>
      </section>
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
      <svg viewBox="0 0 24 24" fill="none" stroke="#ff7a1a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-[0.3mm] h-[3.4mm] w-[3.4mm] shrink-0">
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
    <svg viewBox="0 0 100 100" className="h-[38mm] w-[38mm]" aria-label="Globe with a pin on Pandhurna, India">
      <defs>
        <radialGradient id="gl" cx="38%" cy="32%" r="75%">
          <stop offset="0" stopColor="#2a1a10" />
          <stop offset="1" stopColor="#0b0b0d" />
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r={R + 3} fill="rgba(255,122,26,0.12)" />
      <circle cx="50" cy="50" r={R} fill="url(#gl)" stroke="rgba(255,255,255,0.25)" strokeWidth="0.4" />
      {paths.map((d, i) => (
        <path key={i} d={d} fill="none" stroke="rgba(255,255,255,0.16)" strokeWidth="0.3" />
      ))}
      <circle cx={pin.x} cy={pin.y} r="7" fill="rgba(255,122,26,0.18)" />
      <circle cx={pin.x} cy={pin.y} r="4" fill="rgba(255,122,26,0.35)" />
      <circle cx={pin.x} cy={pin.y} r="1.8" fill="#ff7a1a" stroke="#fff" strokeWidth="0.5" />
    </svg>
  );
}
