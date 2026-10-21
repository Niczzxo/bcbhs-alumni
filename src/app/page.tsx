import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import NoticeBoard from "@/components/NoticeBoard";
import StatsBand from "@/components/StatsBand";
import Committee from "@/components/Committee";
import MemoriesSection from "@/components/MemoriesSection";
import IdCardCta from "@/components/IdCardCta";
import Features from "@/components/Features";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <NoticeBoard />
        <StatsBand />
        <Committee />
        <MemoriesSection />
        <IdCardCta />
        <Features />
      </main>
      <Footer />
    </>
  );
}
