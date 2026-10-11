import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import StatsBand from "@/components/StatsBand";
import Features from "@/components/Features";
import Committee from "@/components/Committee";
import IdCardCta from "@/components/IdCardCta";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <StatsBand />
        <Features />
        <Committee />
        <IdCardCta />
      </main>
      <Footer />
    </>
  );
}
