import { Hero } from "@/components/pricing/hero";
import { PricingTable } from "@/components/pricing/pricing-table";
import { FAQ } from "@/components/pricing/faq";
import { LogoWall } from "@/components/pricing/logo-wall";
import { StatsBand } from "@/components/pricing/stats-band";

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-white">
      <Hero />
      <PricingTable />
      <FAQ />
      <LogoWall />
      <StatsBand />
    </main>
  );
}
