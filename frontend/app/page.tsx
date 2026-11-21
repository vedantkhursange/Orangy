import Navbar from "@/components/navigation/Navbar";
import OrangeStage from "@/components/three/OrangeStage";
import Hero from "@/components/sections/Hero";
import Manifesto from "@/components/sections/Manifesto";
import Products from "@/components/sections/Products";
import WhyOrangy from "@/components/sections/WhyOrangy";
import OurStory from "@/components/sections/OurStory";
import Gallery from "@/components/sections/Gallery";
import FinalCta from "@/components/sections/FinalCta";
import Footer from "@/components/sections/Footer";
import { DEFAULT_DESCRIPTION, jsonLd, siteJsonLd } from "@/lib/seo";
import type { Metadata } from "next";

export const metadata: Metadata = {
  // absolute: the home page carries the full brand title, not the template
  title: { absolute: "Orange Express | Fresh Oranges & Juice Direct from the Farm" },
  description: DEFAULT_DESCRIPTION,
  alternates: { canonical: "/" },
};

export default function Home() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(siteJsonLd())} />
      <OrangeStage />
      <main id="main" className="relative">
        <Navbar />
        <Hero />
        <Manifesto />
        <Products />
        <WhyOrangy />
        <OurStory />
        <Gallery />
        <FinalCta />
      </main>
      <Footer />
    </>
  );
}
