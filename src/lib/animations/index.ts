/**
 * Fundex — Shared Framer Motion animation variants
 *
 * Usage:
 *   import { fadeUp, staggerContainer, heroReveal } from '@/lib/animations'
 *   <motion.div variants={fadeUp} initial="hidden" animate="visible" />
 */
/* ─── Easing Curves ────────────────────────── */
export const easeOutExpo = [0.16, 1, 0.3, 1] as const;
export const easeOutQuart = [0.22, 1, 0.36, 1] as const;
export const easeInOutCubic = [0.65, 0, 0.35, 1] as const;

/* ─── Fade + Directional Slides ────────────── */
export const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.9, ease: easeOutExpo },
  },
};

export const fadeDown = {
  hidden: { opacity: 0, y: -30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: easeOutQuart },
  },
};

export const fadeLeft = {
  hidden: { opacity: 0, x: -40 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.9, ease: easeOutExpo },
  },
};

export const fadeRight = {
  hidden: { opacity: 0, x: 40 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.8, ease: easeOutExpo },
  },
};

export const fadeIn = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 1, ease: easeOutQuart },
  },
};

/* ─── Scale Reveals ────────────────────────── */
export const scaleUp = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.8, ease: easeOutExpo },
  },
};

/* ─── Headline / Text Reveal ──────────────── */
export const heroHeadline = {
  hidden: { opacity: 0, y: 60 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 1.1, ease: easeOutExpo },
  },
};

export const heroAccent = {
  hidden: { opacity: 0, y: 30, clipPath: "inset(0 100% 0 0)" },
  visible: {
    opacity: 1,
    y: 0,
    clipPath: "inset(0 0% 0 0)",
    transition: { duration: 1.0, delay: 0.15, ease: easeOutExpo },
  },
};

export const lineReveal = {
  hidden: { scaleX: 0, originX: 0 },
  visible: {
    scaleX: 1,
    transition: { duration: 0.8, ease: easeInOutCubic },
  },
};

/* ─── Stagger Containers ──────────────────── */
export const staggerContainer = (
  staggerDelay = 0.1,
  delayChildren = 0
) => ({
  hidden: {},
  visible: {
    transition: {
      staggerChildren: staggerDelay,
      delayChildren,
    },
  },
});

export const staggerItem = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: easeOutQuart },
  },
};

/* ─── Navbar ──────────────────────────────── */
export const navbarReveal = {
  hidden: { opacity: 0, y: -20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: easeOutQuart },
  },
};

/* ─── Side Navigation (staggered items) ──── */
export const sideNavContainer = staggerContainer(0.08, 0.5);

export const sideNavItem = {
  hidden: { opacity: 0, x: 30 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.6, ease: easeOutQuart },
  },
};

/* ─── Card Entrance ──────────────────────── */
export const cardReveal = {
  hidden: { opacity: 0, y: 50, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.9, ease: easeOutExpo },
  },
};

/* ─── Video / Background ─────────────────── */
export const bgZoom = {
  hidden: { scale: 1.1, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: { duration: 2.0, ease: easeOutExpo },
  },
};

/* ─── Overlay Fade ───────────────────────── */
export const overlayFade = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 1.5, ease: easeOutQuart },
  },
};
