import Navbar     from "@/components/landing/Navbar";
import Hero       from "@/components/landing/Hero";
import HowItWorks from "@/components/landing/HowItWorks";
import Features   from "@/components/landing/Features";
import Stats      from "@/components/landing/Stats";
import CTA        from "@/components/landing/CTA";
import Footer     from "@/components/landing/Footer";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-stone-50 text-gray-900 antialiased">
      <Navbar />
      <Hero />
      <div className="max-w-6xl mx-auto px-8">
        <hr className="border-t border-gray-100" />
      </div>
      <HowItWorks />
      <Features />
      <Stats />
      <CTA />
      <Footer />
    </div>
  );
}
