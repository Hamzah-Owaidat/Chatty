import type { Metadata } from "next";
import LandingNavbar from "@/components/landing/LandingNavbar";
import Hero from "@/components/landing/Hero";
import StatsSection from "@/components/landing/StatsSection";
import { FeaturesSection, HowItWorksSection } from "@/components/landing/FeaturesSection";
import LandingFooter, { CtaSection } from "@/components/landing/LandingFooter";

export const metadata: Metadata = {
  title: "Chatty — Real-time chat for direct messages and groups",
  description: "Chatty brings direct messages, group chats, and invite links into one fast, real-time workspace.",
};

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-gray-900 dark:bg-stone-950 dark:text-white">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:shadow dark:focus:bg-stone-900"
      >
        Skip to content
      </a>
      <LandingNavbar />
      <main id="main">
        <Hero />
        <StatsSection />
        <FeaturesSection />
        <HowItWorksSection />
        <CtaSection />
      </main>
      <LandingFooter />
    </div>
  );
}
