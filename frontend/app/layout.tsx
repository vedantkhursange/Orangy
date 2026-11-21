import type { Metadata, Viewport } from "next";
import { Outfit, Inter } from "next/font/google";
import "./globals.css";
import { DEFAULT_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/seo";
import SmoothScroll from "@/components/animations/SmoothScroll";
import Providers from "@/components/providers/Providers";
import BottomNav from "@/components/navigation/BottomNav";
import AmbientBackground from "@/components/three/AmbientBackground";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const TITLE = "Orange Express | Fresh Oranges & Juice Direct from the Farm";

export const viewport: Viewport = { themeColor: "#050506", colorScheme: "dark" };

export const metadata: Metadata = {
  // absolute URLs for OG/canonical tags — without this, social cards and
  // canonicals resolve against localhost
  metadataBase: new URL(SITE_URL),
  title: { default: TITLE, template: "%s | Orange Express" },
  description: DEFAULT_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    "Orange Express",
    "fresh oranges online",
    "Nagpur oranges",
    "buy oranges online India",
    "farm fresh oranges",
    "orange juice",
    "cold-pressed orange juice",
    "Pandhurna oranges",
    "Khursange Farms",
  ],
  authors: [{ name: "Khursange Farms" }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  category: "food",
  // Canonicals are set per page. A canonical here would be inherited by every
  // route and tell Google they are all duplicates of the home page.
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "en_IN",
    title: TITLE,
    description: DEFAULT_DESCRIPTION,
  },
  twitter: { card: "summary_large_image", title: TITLE, description: DEFAULT_DESCRIPTION },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
  },
  formatDetection: { telephone: false },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-IN" className={`dark ${outfit.variable} ${inter.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-cream text-ink">
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-xl focus:bg-brand focus:px-4 focus:py-2 focus:font-bold focus:text-white">
          Skip to content
        </a>
        <AmbientBackground />
        <Providers>
          <SmoothScroll>{children}</SmoothScroll>
          <BottomNav />
        </Providers>
      </body>
    </html>
  );
}
