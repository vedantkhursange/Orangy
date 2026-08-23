import Navbar from "@/components/navigation/Navbar";
import ScrollFilm from "@/components/film/ScrollFilm";
import Manifesto from "@/components/sections/Manifesto";
import Products from "@/components/sections/Products";
import WhyOrangy from "@/components/sections/WhyOrangy";
import OurStory from "@/components/sections/OurStory";
import Gallery from "@/components/sections/Gallery";
import FinalCta from "@/components/sections/FinalCta";
import Footer from "@/components/sections/Footer";

export default function Home() {
  return (
    <main>
      <Navbar />
      <ScrollFilm />
      <Manifesto />
      <Products />
      <WhyOrangy />
      <OurStory />
      <Gallery />
      <FinalCta />
      <Footer />
    </main>
  );
}
