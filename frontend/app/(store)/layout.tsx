import { ReactNode } from "react";
import Navbar from "@/components/navigation/Navbar";
import Footer from "@/components/sections/Footer";

export default function StoreLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Navbar solid />
      <main className="min-h-[70vh] pt-16 md:pt-[72px]">{children}</main>
      <Footer />
    </>
  );
}
