"use client";

import { useRef } from "react";
import { motion, useInView, useScroll, useTransform } from "framer-motion";
import { ArrowUp, ArrowUpRight } from "lucide-react";
import { easeOutExpo } from "@/lib/animations";

/* ═══════════════════════════════════════════
   FOOTER LINK
   ═══════════════════════════════════════════ */
function FooterLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      className="font-sans text-sm text-white/60 no-underline relative inline-block self-start transition-colors duration-300 hover:text-white group"
    >
      {label}
      <span className="absolute -bottom-0.5 left-0 right-0 h-px origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300 bg-fundex-gold" />
    </a>
  );
}

/* ═══════════════════════════════════════════
   MAIN FOOTER
   ═══════════════════════════════════════════ */
export function AnimatedFooter({
  leftLinks = [
    { href: "#product", label: "Product" },
    { href: "#use-cases", label: "Use Cases" },
    { href: "#security", label: "Security" },
    { href: "#why-fundex", label: "Why Fundex" },
  ],
  rightLinks = [
    { href: "#", label: "Privacy Policy" },
    { href: "#", label: "Terms of Service" },
    { href: "#", label: "Careers" },
    { href: "#", label: "Contact" },
  ],
  copyrightText = "\u00A9 2025 Fundex. All rights reserved.",
}: {
  leftLinks?: { href: string; label: string }[];
  rightLinks?: { href: string; label: string }[];
  copyrightText?: string;
}) {
  const footerRef = useRef<HTMLElement>(null);
  const isInView = useInView(footerRef, { once: true, amount: 0.1 });

  const { scrollYProgress } = useScroll({
    target: footerRef,
    offset: ["start end", "end end"],
  });

  const wordmarkY = useTransform(scrollYProgress, [0, 0.8], [80, 0]);
  const wordmarkScale = useTransform(scrollYProgress, [0, 0.8], [0.9, 1]);

  return (
    <footer
      ref={footerRef}
      className="relative overflow-hidden text-white"
      style={{ backgroundColor: "#002d01" }}
    >
      <div className="relative z-[2] max-w-7xl mx-auto px-6 sm:px-8 lg:px-16 pt-24 lg:pt-32">
        {/* ─── Top Row: CTA + Nav ─── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-20 mb-16 lg:mb-24 items-start">
          {/* Left — Heading + CTA */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.9, ease: easeOutExpo }}
          >
            <h3 className="font-display text-3xl lg:text-5xl font-bold leading-[1.1] tracking-tight mb-6">
              Ready to modernize
              <br />
              <span className="font-sans font-normal text-fundex-gold">
                your fund?
              </span>
            </h3>

            <p className="font-sans text-sm leading-[1.7] text-white/60 mb-8 max-w-[380px]">
              Join 500+ firms already running on Fundex. Schedule a demo and
              see the difference.
            </p>

            <a
              href="#book-demo-section"
              className="inline-flex items-center gap-2.5 px-8 py-3.5 bg-white text-fundex-forest font-sans text-[15px] font-[500] no-underline  transition-all hover:bg-fundex-cream hover:-translate-y-0.5"
            >
              Book a Demo
              <ArrowUpRight className="w-4 h-4" strokeWidth={1.5} />
            </a>
          </motion.div>

          {/* Right — Link columns */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{
              duration: 0.9,
              delay: 0.15,
              ease: easeOutExpo,
            }}
            className="grid grid-cols-2 gap-6 lg:gap-12"
          >
            {/* Product */}
            <div>
              <div className="font-sans text-[10px] font-[600] tracking-[4px] uppercase text-white/40 mb-5">
                Product
              </div>
              <div className="flex flex-col gap-3.5">
                {leftLinks.map((link) => (
                  <FooterLink
                    key={link.label}
                    href={link.href}
                    label={link.label}
                  />
                ))}
              </div>
            </div>

            {/* Company */}
            <div>
              <div className="font-sans text-[10px] font-[600] tracking-[4px] uppercase text-white/40 mb-5">
                Company
              </div>
              <div className="flex flex-col gap-3.5">
                {rightLinks.map((link) => (
                  <FooterLink
                    key={link.label}
                    href={link.href}
                    label={link.label}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* ─── Divider ─── */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={isInView ? { scaleX: 1 } : {}}
          transition={{ duration: 1.5, delay: 0.3, ease: easeOutExpo }}
          className="h-px origin-left"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(255,255,255,0.15) 10%, rgba(255,255,255,0.15) 90%, transparent)",
          }}
        />

        {/* ─── Giant Wordmark — parallax ─── */}
        <motion.div
          style={{ y: wordmarkY, scale: wordmarkScale }}
          className="py-12 lg:py-16 text-center overflow-hidden"
        >
          <div
            className="font-display inline-block select-none relative"
            style={{
              fontSize: "clamp(48px, 16vw, 240px)",
              lineHeight: 0.85,
              letterSpacing: "-0.06em",
            }}
          >
            {/* Base dim stroke */}
            <span
              style={{
                color: "transparent",
                WebkitTextStroke: "1px rgba(255,255,255,0.1)",
              }}
            >
              FUNDEX
            </span>

            {/* Accent wipe overlay */}
            <motion.span
              initial={{ clipPath: "inset(0 100% 0 0)" }}
              animate={isInView ? { clipPath: "inset(0 0% 0 0)" } : {}}
              transition={{
                duration: 2,
                delay: 0.5,
                ease: easeOutExpo,
              }}
              className="absolute inset-0"
              style={{
                color: "transparent",
                WebkitTextStroke: "1px rgba(192,184,122,0.35)",
              }}
              aria-hidden
            >
              FUNDEX
            </motion.span>
          </div>
        </motion.div>

        {/* ─── Bottom Strip ─── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="border-t border-white/10 py-6 flex flex-wrap items-center justify-between gap-4"
        >
          <span className="font-sans text-[10px] font-[500] tracking-[1.5px] text-white/30">
            {copyrightText}
          </span>

          <div className="flex items-center gap-5">
            {["X", "LinkedIn", "GitHub"].map((s) => (
              <a
                key={s}
                href="#"
                className="font-sans text-[10px] font-[500] tracking-[1.5px] text-white/30 no-underline transition-colors duration-300 hover:text-fundex-gold"
              >
                {s}
              </a>
            ))}

            {/* Back to top */}
            <motion.a
              href="#hero"
              whileHover={{ y: -3 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="w-9 h-9 border border-white/10 flex items-center justify-center text-white/40 no-underline transition-all duration-300 hover:border-fundex-gold hover:text-fundex-gold"
            >
              <ArrowUp className="w-3.5 h-3.5" strokeWidth={1.5} />
            </motion.a>
          </div>
        </motion.div>
      </div>
    </footer>
  );
}
