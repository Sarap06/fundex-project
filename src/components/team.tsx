"use client";

import { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { staggerContainer, staggerItem, easeOutExpo } from "@/lib/animations";

/* ═══════════════════════════════════════════
   DATA
   ═══════════════════════════════════════════ */
const TEAM = [
  {
    name: "Nigel Jaimes",
    initials: "NJ",
    role: "Co-Founder & CEO",
    description:
      "Visionary leader driving innovation in private lending infrastructure with deep expertise in fintech and capital markets.",
    num: "01",
  },
  {
    name: "Sara Pedron",
    initials: "SP",
    role: "Co-Founder",
    description:
      "Operations strategist streamlining the lending lifecycle, from origination to servicing, with precision and scale.",
    num: "02",
  },
];

/* ═══════════════════════════════════════════
   SINGLE MEMBER — editorial split layout
   ═══════════════════════════════════════════ */
function MemberBlock({
  member,
  index,
  isInView,
}: {
  member: (typeof TEAM)[number];
  index: number;
  isInView: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const isEven = index % 2 === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 60 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{
        duration: 1,
        delay: 0.2 + index * 0.2,
        ease: easeOutExpo,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={cn(
        "grid grid-cols-1 md:grid-cols-[0.4fr_0.6fr] items-center border-b border-border py-16 lg:py-20",
        !isEven && "md:grid-cols-[0.6fr_0.4fr]"
      )}
    >
      {/* ─── MONOGRAM SIDE ─── */}
      <div
        className={cn(
          "flex items-center justify-center py-8 md:py-0",
          isEven ? "md:order-1" : "md:order-2"
        )}
      >
        <motion.div
          animate={
            hovered
              ? { scale: 1.05, rotate: isEven ? -2 : 2 }
              : { scale: 1, rotate: 0 }
          }
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="relative select-none"
        >
          {/* Ghost outline */}
          <div
            className="font-display absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 translate-x-[6px] translate-y-[6px]"
            style={{
              fontSize: "clamp(72px, 16vw, 220px)",
              lineHeight: 0.85,
              letterSpacing: "-0.06em",
              color: "transparent",
              WebkitTextStroke: "1px rgba(192,184,122,0.08)",
            }}
          >
            {member.initials}
          </div>

          {/* Main monogram */}
          <div
            className="font-display relative transition-all duration-500"
            style={{
              fontSize: "clamp(72px, 16vw, 220px)",
              lineHeight: 0.85,
              letterSpacing: "-0.06em",
              color: "transparent",
              WebkitTextStroke: hovered
                ? "1.5px var(--accent)"
                : "1.5px rgba(192,184,122,0.2)",
            }}
          >
            {member.initials}
          </div>

          {/* Accent line on hover */}
          <motion.div
            animate={hovered ? { scaleX: 1 } : { scaleX: 0 }}
            transition={{ duration: 0.6, ease: easeOutExpo }}
            className="absolute bottom-[15%] left-[10%] right-[10%] h-0.5"
            style={{
              background:
                "linear-gradient(90deg, transparent, rgba(192,184,122,0.3), transparent)",
              transformOrigin: isEven ? "left" : "right",
            }}
          />
        </motion.div>
      </div>

      {/* ─── CONTENT SIDE ─── */}
      <div
        className={cn(
          "relative px-6 md:px-12",
          isEven ? "md:order-2" : "md:order-1"
        )}
      >
        {/* Number */}
        <div className="flex items-center gap-3 mb-6">
          <span
            className="w-7 h-px"
            style={{ background: "var(--accent)" }}
          />
          <span
            className="font-sans text-[10px] font-[600] tracking-[5px]"
            style={{ color: "var(--accent)" }}
          >
            {member.num}
          </span>
        </div>

        {/* Name */}
        <h3 className="font-display text-4xl lg:text-6xl font-bold leading-none tracking-tight text-foreground mb-3">
          {member.name}
        </h3>

        {/* Role */}
        <div
          className="flex items-center gap-2.5 mb-5 font-sans text-xs font-[600] tracking-[3px] uppercase"
          style={{ color: "var(--accent)" }}
        >
          <div
            className="w-1.5 h-1.5 rotate-45"
            style={{ background: "var(--accent)" }}
          />
          {member.role}
        </div>

        {/* Description */}
        <p className="font-sans text-[16px] leading-[1.75] text-muted-foreground max-w-[420px] mb-6">
          {member.description}
        </p>

        {/* Hover CTA */}
        <motion.div
          animate={hovered ? { opacity: 1, x: 0 } : { opacity: 0, x: -16 }}
          transition={{ duration: 0.3 }}
          className="inline-flex items-center gap-2.5 font-sans text-xs font-[600] tracking-[2px] uppercase"
          style={{ color: "var(--accent)" }}
        >
          Connect
          <ArrowUpRight className="w-4 h-4" strokeWidth={1.5} />
        </motion.div>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════
   MAIN EXPORT
   ═══════════════════════════════════════════ */
export function Team() {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.15 });
  const headerRef = useRef<HTMLDivElement>(null);
  const headerInView = useInView(headerRef, { once: true, amount: 0.3 });

  return (
    <section ref={sectionRef} className="relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-24 lg:py-32">
        {/* ─── Header ─── */}
        <motion.div
          ref={headerRef}
          className="mb-16 lg:mb-20"
          variants={staggerContainer(0.12, 0)}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
        >
          <motion.div
            className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 md:gap-16"
            variants={staggerItem}
          >
            <div className="flex-1">
              <p
                className="font-sans text-xs font-[500] tracking-[3px] uppercase mb-5"
                style={{ color: "var(--primary)" }}
              >
                Leadership
              </p>
              <h2 className="font-display text-[clamp(28px,4vw,44px)] font-bold leading-[1.15] tracking-tight text-foreground">
                The people behind
                <br />
                <span className="font-sans font-normal">the platform.</span>
              </h2>
            </div>

            <motion.p
              className="font-sans text-[16px] text-muted-foreground leading-[1.7] max-w-md"
              variants={staggerItem}
            >
              A founding team with decades of combined experience in fintech,
              capital markets, and real estate lending.
            </motion.p>
          </motion.div>

          {/* Divider */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={headerInView ? { scaleX: 1 } : {}}
            transition={{
              duration: 1.2,
              delay: 0.4,
              ease: easeOutExpo,
            }}
            className="h-px mt-12 lg:mt-16 origin-left"
            style={{
              background:
                "linear-gradient(90deg, var(--border), var(--accent), var(--border), transparent)",
            }}
          />
        </motion.div>

        {/* ─── Members ─── */}
        <div>
          {TEAM.map((member, i) => (
            <MemberBlock
              key={member.name}
              member={member}
              index={i}
              isInView={isInView}
            />
          ))}
        </div>

        {/* ─── Bottom CTA ─── */}
        <motion.div
          className="flex flex-wrap items-center justify-between gap-5 py-12 lg:py-16"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: easeOutExpo }}
        >
          <p className="font-display text-xl lg:text-2xl font-bold text-foreground">
            Want to join our mission?
          </p>
          <a
            href="#book-demo-section"
            className="inline-flex items-center gap-2.5 px-8 py-3.5 bg-foreground text-background font-sans text-[15px] font-[500] no-underline  transition-all hover:opacity-90 hover:-translate-y-0.5"
          >
            Get in Touch
            <ArrowUpRight className="w-4 h-4" strokeWidth={1.5} />
          </a>
        </motion.div>
      </div>
    </section>
  );
}
