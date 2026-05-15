"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { easeOutExpo, easeOutQuart } from "@/lib/animations";

const NAV_LINKS = ["Services", "About", "Team", "Contact"] as const;

const STEPS: { num: string; label: string; active?: boolean }[] = [
  { num: "01", label: "Create Deal" },
  { num: "02", label: "Add Investors" },
  { num: "03", label: "Allocate Capital", active: true },
  { num: "04", label: "Track Returns" },
];

const ease = [0.16, 1, 0.3, 1] as const;
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } } };
const up = (d = 0) => ({ hidden: { opacity: 0, y: 28 }, visible: { opacity: 1, y: 0, transition: { duration: 0.9, delay: d, ease } } });
const inn = (d = 0) => ({ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.7, delay: d, ease: easeOutQuart } } });

export function KubricHero() {
  return (
    <section className="relative w-full h-screen min-h-[750px] overflow-hidden bg-[#060806]" aria-label="Fundex hero">
      {/* ── Background — image on right, dark fade on left ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Hero image — covers the full section */}
        <Image
          src="/hero-opt-3.jpg"
          alt=""
          fill
          priority
          className="object-cover object-center"
        />
        {/* Gradient overlay — solid dark on the left, fading to transparent on the right */}
        <div
          className="absolute inset-0"
          style={{
            background: `
              linear-gradient(90deg,
                #060806 0%,
                #060806 34%,
                rgba(6,8,6,0.93) 44%,
                rgba(6,8,6,0.78) 53%,
                rgba(6,8,6,0.55) 63%,
                rgba(6,8,6,0.3) 75%,
                rgba(6,8,6,0.12) 88%,
                rgba(6,8,6,0.03) 100%
              )
            `,
          }}
        />
        {/* Top + bottom darken for readability */}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(6,8,6,0.6) 0%, transparent 20%, transparent 80%, rgba(6,8,6,0.7) 100%)' }} />
        {/* Subtle green tint over image */}
        <div className="absolute inset-0 bg-[#060806]/20 mix-blend-multiply" />
        {/* Grain */}
        <div className="kubric-grain absolute inset-0 opacity-[0.02]" />
      </div>

      {/* ── Content ── */}
      <div className="relative z-10 w-full h-full flex flex-col">
        {/* Navbar */}
        <motion.header className="flex items-center justify-between px-6 md:px-10 lg:px-14 py-5 md:py-6" initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: easeOutQuart }}>
          <a href="#" className="no-underline" aria-label="Fundex home">
            <span className="font-display text-[20px] font-bold tracking-[2px] text-white">FUNDEX</span>
          </a>
          <nav className="hidden lg:flex items-center gap-10 px-8 py-2.5 bg-white/[0.03] backdrop-blur-md border border-white/[0.06]" aria-label="Main navigation">
            {NAV_LINKS.map((link) => (
              <a key={link} href={`#${link.toLowerCase()}`} className="kubric-nav-link relative font-sans text-[14px] text-white/55 no-underline tracking-normal transition-colors hover:text-white">{link}</a>
            ))}
          </nav>
          <div className="flex items-center gap-4">
            <a href="/sign-in" className="font-sans text-[14px] font-medium text-white/55 no-underline transition-colors hover:text-white">Log in</a>
            <a href="/auth/signup" className="font-sans text-[14px] font-semibold text-[#0a1f0a] no-underline px-5 py-2.5 bg-fundex-gold tracking-normal transition-all hover:bg-fundex-cream hover:-translate-y-px">Sign Up</a>
          </div>
        </motion.header>

        {/* Main content */}
        <div className="flex-1 flex items-center px-6 md:px-10 lg:px-14">
          <motion.div className="max-w-[560px]" variants={stagger} initial="hidden" animate="visible">
            <motion.div className="flex items-center gap-3 mb-6" variants={inn(0.05)}>
              <div className="h-px w-8 bg-fundex-gold/40" />
              <span className="font-sans text-[11px] text-fundex-gold/70 tracking-[2px] uppercase">Private Lending Infrastructure</span>
            </motion.div>

            <motion.h1 className="font-display text-[clamp(40px,5.8vw,76px)] font-bold leading-[1.05] text-white tracking-tight" variants={up(0.1)}>
              The Operating
              <br />
              system for
              <br />
              <motion.span
                className="text-fundex-gold inline-block"
                style={{ textShadow: '0 0 80px rgba(192,184,122,0.2)' }}
                variants={up(0.3)}
              >
                Private Credit
              </motion.span>
            </motion.h1>

            <motion.p className="mt-6 font-sans text-[16px] leading-[1.7] text-white/40 max-w-[420px]" variants={up(0.45)}>
              Institutional infrastructure for investor management, deal operations, capital workflows, and reporting.
            </motion.p>

            <motion.div className="flex items-center gap-4 mt-9" variants={up(0.6)}>
              <a href="#book-demo-section" className="group font-sans text-[14px] font-semibold text-[#0a1f0a] no-underline px-7 py-3.5 bg-fundex-gold tracking-normal transition-all hover:bg-fundex-cream hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(192,184,122,0.2)] flex items-center gap-2">
                Book a Demo <span className="inline-block transition-transform group-hover:translate-x-0.5">→</span>
              </a>
              <a href="#services-section" className="font-sans text-[14px] text-white/40 no-underline px-6 py-3.5 border border-white/[0.08] transition-all hover:border-white/20 hover:text-white/65">Learn More</a>
            </motion.div>

            {/* Stats strip */}
            <motion.div className="flex items-center gap-10 mt-12 pt-6 border-t border-white/[0.06]" variants={up(0.8)}>
              {[
                { val: "$42M+", label: "Capital Deployed" },
                { val: "200+", label: "Investors" },
                { val: "98%", label: "Retention" },
              ].map((s) => (
                <div key={s.label}>
                  <p className="font-display text-[22px] font-bold text-white leading-none">{s.val}</p>
                  <p className="font-sans text-[10px] text-white/25 tracking-[1.5px] uppercase mt-2">{s.label}</p>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>

        {/* Trust bar */}
        <motion.div className="w-full px-6 md:px-10 lg:px-14 py-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 1.0, ease: easeOutQuart }}>
          <div className="flex items-center justify-center gap-8 md:gap-12">
            {["SOC 2 Certified", "Bank-Grade Encryption", "Multi-Tenant Isolation", "Real-Time Reporting"].map((item, i) => (
              <motion.div key={item} className="flex items-center gap-1.5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4, delay: 1.05 + i * 0.05 }}>
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="rgba(192,184,122,0.45)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                <span className="font-sans text-[11px] text-white/25 tracking-[0.5px]">{item}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Steps */}
        <motion.div className="w-full px-6 md:px-10 lg:px-14 py-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 1.1, ease: easeOutQuart }}>
          <div className="flex items-center justify-between max-w-3xl mx-auto">
            {STEPS.map((step, i) => (
              <motion.div key={step.num} className={`flex items-center gap-2 px-3.5 py-1.5 ${step.active ? "bg-white/[0.04] border border-white/[0.06]" : ""}`} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 1.15 + i * 0.05 }}>
                <span className={`font-sans text-[11px] tracking-[1px] ${step.active ? "text-white/50" : "text-white/18"}`}>{step.num}</span>
                <span className={`font-sans text-[11px] ${step.active ? "text-white/70 font-medium" : "text-white/25"}`}>{step.label}</span>
                {step.active && <div className="w-1.5 h-1.5 bg-fundex-gold/40 ml-0.5" />}
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
