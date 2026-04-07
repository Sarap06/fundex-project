"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { cn } from "@/lib/utils";
import {
  navbarReveal,
  heroHeadline,
  heroAccent,
  fadeUp,
  cardReveal,
  bgZoom,
  staggerContainer,
  sideNavItem,
  lineReveal,
  easeOutExpo,
  easeOutQuart,
} from "@/lib/animations";

const NAV_LINKS = ["Services", "About", "Team", "Contact"] as const;

const SIDE_NAV = [
  { label: "Home", active: true },
  { label: "Services", active: false },
  { label: "About", active: false },
  { label: "Team", active: false },
  { label: "Contact", active: false },
] as const;

export function KubricHero() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoLoaded, setVideoLoaded] = useState(false);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    if (v.readyState >= 3) {
      setVideoLoaded(true);
    }

    const handleLoaded = () => setVideoLoaded(true);
    v.addEventListener("loadeddata", handleLoaded);
    v.play().catch(() => {});

    return () => v.removeEventListener("loadeddata", handleLoaded);
  }, []);

  return (
    <section
      className="relative w-full h-screen min-h-[600px] md:min-h-[750px] overflow-hidden"
      aria-label="Fundex hero"
    >
      {/* ── Background Image ── */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="kubric-breathe absolute inset-0">
          <Image
            src="/hero-bg.jpg"
            alt=""
            fill
            priority
            className="object-cover"
          />
        </div>

        {/* <video
          ref={videoRef}
          className="w-full h-full object-cover block"
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          onLoadedData={() => setVideoLoaded(true)}
        >
          <source src="/kubric-bg.mp4" type="video/mp4" />
        </video> */}

        {/* Dark overlay */}
        <div className="kubric-overlay absolute inset-0 z-[2]" />
      </div>

      {/* ── Grain Texture ── */}
      <div className="kubric-grain absolute inset-0 z-[3] pointer-events-none opacity-[0.03]" />

      {/* ── Content ── */}
      <div className="relative z-[4] w-full h-full flex flex-col">
        {/* ─── Navbar ─── */}
        <motion.header
          className="flex items-center justify-between px-6 md:px-10 lg:px-14 py-5 md:py-7 w-full"
          variants={navbarReveal}
          initial="hidden"
          animate="visible"
        >
          {/* Logo */}
          <motion.a
            href="#"
            className="no-underline transition-opacity hover:opacity-80"
            aria-label="Fundex home"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: easeOutExpo }}
          >
            <span className="font-display text-xl font-bold tracking-[2.5px] text-white drop-shadow-md">
              FUNDEX
            </span>
          </motion.a>

          {/* Center Links — frosted glass container */}
          <motion.nav
            className="hidden lg:flex items-center gap-10 px-8 py-3 rounded-md bg-white/[0.06] backdrop-blur-[14px] border border-white/[0.1] shadow-[0_2px_20px_rgba(0,0,0,0.1)]"
            aria-label="Main navigation"
            variants={staggerContainer(0.08, 0.2)}
            initial="hidden"
            animate="visible"
          >
            {NAV_LINKS.map((link) => (
              <motion.a
                key={link}
                href={`#${link.toLowerCase()}`}
                className="kubric-nav-link relative font-sans text-[16px] text-white/80 no-underline tracking-[0.2px] transition-colors hover:text-white"
                variants={{
                  hidden: { opacity: 0, y: -10 },
                  visible: {
                    opacity: 1,
                    y: 0,
                    transition: { duration: 0.5, ease: easeOutQuart },
                  },
                }}
              >
                {link}
              </motion.a>
            ))}
          </motion.nav>

          {/* Auth buttons */}
          <motion.div
            className="flex items-center gap-3"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.5, ease: easeOutExpo }}
          >
            <a
              href="/auth/login"
              className="font-sans text-[14px] md:text-[15px] font-medium text-white/80 no-underline tracking-[0.2px] transition-colors hover:text-white"
            >
              Log in
            </a>
            <a
              href="/auth/signup"
              className="font-sans text-[14px] md:text-[15px] font-medium text-[#0a1f0a] no-underline px-5 md:px-6 py-2 md:py-2.5 bg-white rounded-[5px] tracking-[0.3px] shadow-[0_2px_12px_rgba(255,255,255,0.15)] transition-all hover:bg-fundex-cream hover:-translate-y-px"
            >
              Sign Up
            </a>
          </motion.div>
        </motion.header>

        {/* ─── Main Hero Area ─── */}
        <div className="flex-1 flex flex-col md:flex-row md:justify-between px-6 md:px-10 lg:px-14 pb-10 md:pb-14 gap-6 md:gap-12">
          {/* Left Column */}
          <div className="flex flex-col flex-1 max-w-[700px]">
            {/* Headline — positioned ~20% from top */}
            <div className="flex-1 flex items-start pt-[8vh] md:pt-[15vh]">
              <motion.h1
                className="kubric-text-shadow font-sans text-[clamp(32px,5.8vw,76px)] font-normal leading-[1.06] text-white -tracking-[0.5px] max-w-2xl"
                variants={heroHeadline}
                initial="hidden"
                animate="visible"
                transition={{ duration: 1.1, delay: 0.3, ease: easeOutExpo }}
              >
                Making your investments
                <br />
                outstanding — is a
                <br />
                <motion.span
                  className="kubric-gold-glow font-display font-bold text-fundex-gold inline-block -skew-x-[8deg]"
                  variants={heroAccent}
                  initial="hidden"
                  animate="visible"
                  transition={{ duration: 1.0, delay: 0.7, ease: easeOutExpo }}
                >
                  Discipline
                </motion.span>
              </motion.h1>
            </div>

            {/* Bottom section — pushed down */}
            <div className="mt-auto">
              {/* Divider — gold gradient */}
              <motion.div
                className="w-[50px] h-px mb-7"
                style={{ background: "linear-gradient(90deg, rgba(192,184,122,0.6), transparent)" }}
                variants={lineReveal}
                initial="hidden"
                animate="visible"
                transition={{ duration: 0.8, delay: 0.9, ease: easeOutQuart }}
              />

              {/* Section Label */}
              <motion.div
                className="mb-6 md:mb-9"
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                transition={{ duration: 0.8, delay: 0.8, ease: easeOutExpo }}
              >
                <p className="kubric-text-shadow-sm font-sans text-[16px] font-semibold text-white tracking-wide mb-4">
                  01 — Our Mission
                </p>
                <p className="kubric-text-shadow-sm font-sans text-[15px] md:text-[18px] font-normal leading-[1.8] text-white/65 max-w-[400px]">
                  We enable the world&apos;s most engaged investors and family offices to access professionally managed investment strategies.
                </p>
              </motion.div>

              {/* CTAs */}
              <motion.div
                className="flex items-center gap-4 md:gap-8"
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                transition={{ duration: 0.8, delay: 1.0, ease: easeOutExpo }}
              >
                <a
                  href="#book-demo"
                  className="group font-sans text-[14px] md:text-[16px] font-medium text-[#0a1f0a] no-underline px-6 md:px-8 py-3 md:py-3.5 bg-white rounded-[5px] tracking-[0.2px] shadow-[0_2px_16px_rgba(255,255,255,0.1)] transition-all hover:bg-fundex-cream hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(192,184,122,0.2)] flex items-center gap-1.5"
                >
                  <span>Book Demo</span>
                  <span className="inline-block transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5">↗</span>
                </a>
                <a
                  href="#scroll"
                  className="font-sans text-[16px] text-white/60 no-underline flex items-center gap-2.5 transition-colors hover:text-white/90"
                >
                  Scroll down
                  <span className="kubric-bounce flex items-center">
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                      <circle cx="9" cy="9" r="8" stroke="currentColor" strokeWidth="1.2" />
                      <path d="M9 6v6M6.5 10l2.5 2.5L11.5 10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </a>
              </motion.div>
            </div>
          </div>

          {/* Right Column */}
          <div className="hidden md:flex flex-col items-end justify-end min-w-[220px]">
            {/* Side nav */}
            <div className="mb-7 flex items-start">
              <motion.nav
                className="flex flex-col items-end gap-3"
                aria-label="Section navigation"
                variants={staggerContainer(0.08, 0.5)}
                initial="hidden"
                animate="visible"
              >
                {SIDE_NAV.map((item) => (
                  <motion.a
                    key={item.label}
                    href={`#${item.label.toLowerCase().replace(/\s/g, "-")}`}
                    className={cn(
                      "kubric-text-shadow-sm font-sans text-[16px] no-underline flex items-center gap-2.5 transition-all duration-300 tracking-[0.2px]",
                      item.active
                        ? "text-white font-normal"
                        : "text-white/85 font-medium hover:text-white"
                    )}
                    variants={sideNavItem}
                  >
                    {item.label}
                    {item.active && (
                      <span className="font-light text-white/40">—</span>
                    )}
                  </motion.a>
                ))}
              </motion.nav>
            </div>

            {/* About Card */}
            <motion.div
              className="flex bg-white rounded-[6px] overflow-hidden max-w-[420px] h-[140px] shadow-[0_12px_40px_rgba(0,0,0,0.2)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_50px_rgba(0,0,0,0.25)]"
              variants={cardReveal}
              initial="hidden"
              animate="visible"
              transition={{ duration: 0.9, delay: 0.9, ease: easeOutExpo }}
            >
              <div className="w-[140px] shrink-0 p-1">
                <div className="relative w-full h-full rounded-[4px] overflow-hidden">
                  <Image
                    src="/about-image.jpg"
                    alt="Fundex"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
              <div className="px-5 py-4 flex flex-col justify-center gap-1.5 flex-1 min-w-0">
                <h3 className="font-display text-[15px] font-bold text-[#1a1a1a] m-0 tracking-[0.2px]">
                  About Us
                </h3>
                <p className="font-sans text-[13px] font-medium leading-[1.55] text-[#555] m-0">
                  We&apos;re driven by disciplined strategies that drive
                  portfolio growth and maximize investor returns.
                </p>
                <div
                  className="w-8 h-0.5 mt-1 rounded-sm"
                  style={{ background: "linear-gradient(90deg, #1a1a1a, transparent)" }}
                />
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
