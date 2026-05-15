"use client";

import { KubricHero } from "@/components/kubric-hero";
import { Services } from "@/components/services";
import { UseCases } from "@/components/use-cases";
import { SecurityControl } from "@/components/security-control";
import { ProductBreakdown } from "@/components/product-breakdown";
import { WhyFundex } from "@/components/why-fundex";
import { Team } from "@/components/team";
import { BookDemo } from "@/components/book-demo";
import { AnimatedFooter } from "@/components/ui/animated-footer";

export default function Home() {
  const footerLeftLinks = [
    { href: "#services-section", label: "Services" },
    { href: "#use-cases-section", label: "Who It's For" },
    { href: "#product-section", label: "OS Layers" },
    { href: "#security-section", label: "Security" },
    { href: "#why-fundex-section", label: "Why Fundex" },
  ];

  const footerRightLinks = [
    { href: "#team-section", label: "Team" },
    { href: "#book-demo-section", label: "Book a Demo" },
    { href: "mailto:info@fundex.com", label: "info@fundex.com" },
    { href: "tel:+13055550199", label: "(305) 555-0199" },
  ];

  return (
    <div
      className="min-h-screen bg-background text-foreground"
      style={{ overflow: "visible" }}
    >
      <main className="relative" role="main" style={{ overflow: "visible" }}>
        <section id="hero" aria-label="Hero section">
          <KubricHero />
        </section>
        <section id="services-section" aria-label="Services section" className="bg-background">
          <Services />
        </section>
        <section id="use-cases-section" aria-label="Use Cases section" className="bg-[#fafaf8]">
          <UseCases />
        </section>
        <section id="product-section" aria-label="Product Breakdown section" className="bg-background">
          <ProductBreakdown />
        </section>
        <section id="security-section" aria-label="Security section" className="bg-[#fafaf8]">
          <SecurityControl />
        </section>
        <section id="why-fundex-section" aria-label="Why Fundex section" className="bg-background">
          <WhyFundex />
        </section>
        <section id="team-section" aria-label="Team section" className="bg-[#fafaf8]">
          <Team />
        </section>
        <section id="book-demo-section" aria-label="Book demo section" className="bg-background">
          <BookDemo />
        </section>
      </main>
      <AnimatedFooter
        leftLinks={footerLeftLinks}
        rightLinks={footerRightLinks}
        copyrightText="© 2025 Fundex Capital. All rights reserved."
      />
    </div>
  );
}
