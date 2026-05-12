import { useState, useRef, useEffect } from "react";
import { motion, useMotionValue, useSpring, useTransform, useInView } from "framer-motion";

/* ─────────────────────────────────────────────
   CONFIG
   ───────────────────────────────────────────── */

const SERVICES = [
  {
    title: "Centralized Investor Operations",
    description:
      "Track investors, commitments, allocations, documents, and communications through one structured platform.",
    icon: "grid",
    metric: "Investor Management",
    metricLabel: "Visibility",
  },
  {
    title: "Deal & Allocation Tracking",    description:
      "Monitor capital deployment, investor participation, distributions, and portfolio activity with full operational visibility",
    icon: "layers",
    metric: "Deal & Capital Management",
    metricLabel: "Faster Ops",
  },
  {
    title: "Structured Payment Workflows",    description:
      "Manage payment schedules, distributions, reporting, and transaction records through centralized operational workflows.",
    icon: "flow",
    accent: true,
    metric: "Payment & Distribution",
    metricLabel: "Errors",
  },
];

/* ─────────────────────────────────────────────
   ICONS (inline SVGs for zero deps)
   ───────────────────────────────────────────── */
const Icons = {
  grid: (color: string) => (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <rect x="3" y="3" width="9" height="9" rx="2" stroke={color} strokeWidth="1.5" />
      <rect x="16" y="3" width="9" height="9" rx="2" stroke={color} strokeWidth="1.5" />
      <rect x="3" y="16" width="9" height="9" rx="2" stroke={color} strokeWidth="1.5" />
      <rect x="16" y="16" width="9" height="9" rx="2" stroke={color} strokeWidth="1.5" opacity="0.4" />
    </svg>
  ),
  layers: (color: string) => (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <path d="M14 3L25 9L14 15L3 9L14 3Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M3 14L14 20L25 14" stroke={color} strokeWidth="1.5" strokeLinejoin="round" opacity="0.6" />
      <path d="M3 19L14 25L25 19" stroke={color} strokeWidth="1.5" strokeLinejoin="round" opacity="0.3" />
    </svg>
  ),
  flow: (color: string) => (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <circle cx="7" cy="7" r="3.5" stroke={color} strokeWidth="1.5" />
      <circle cx="21" cy="14" r="3.5" stroke={color} strokeWidth="1.5" />
      <circle cx="7" cy="21" r="3.5" stroke={color} strokeWidth="1.5" />
      <path d="M10.5 7H15C17.5 7 17.5 14 17.5 14" stroke={color} strokeWidth="1.5" opacity="0.5" />
      <path d="M10.5 21H15C17.5 21 17.5 14 17.5 14" stroke={color} strokeWidth="1.5" opacity="0.5" />
    </svg>
  ),
};

const ArrowIcon = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
    <path d="M6 16L16 6M16 6H8M16 6V14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/* ─────────────────────────────────────────────
   MAGNETIC HOVER CARD
   ───────────────────────────────────────────── */
function MagneticCard({ children, className, style, isAccent }: { children: (hovered: boolean) => React.ReactNode; className?: string; style?: React.CSSProperties; isAccent?: boolean; index?: number }) {
  const ref = useRef(null);
  const [hovered, setHovered] = useState(false);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 25, stiffness: 200 };
  const x = useSpring(mouseX, springConfig);
  const y = useSpring(mouseY, springConfig);

  const rotateX = useTransform(y, [-0.5, 0.5], [4, -4]);
  const rotateY = useTransform(x, [-0.5, 0.5], [-4, 4]);

  const handleMouse = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    mouseX.set((e.clientX - rect.left) / rect.width - 0.5);
    mouseY.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  const handleLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
    setHovered(false);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouse}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={handleLeave}
      style={{
        ...style,
        rotateX,
        rotateY,
        transformPerspective: 1200,
      }}
      className={className}
      initial="rest"
      animate={hovered ? "hover" : "rest"}
    >
      {/* Glare overlay on hover */}
      <motion.div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "inherit",
          pointerEvents: "none",
          zIndex: 2,
          background: useTransform(
            [x, y],
            ([xv, yv]: number[]) =>
              `radial-gradient(600px circle at ${(xv + 0.5) * 100}% ${(yv + 0.5) * 100}%, ${isAccent ? "rgba(200,170,110,0.08)" : "rgba(255,255,255,0.06)"}, transparent 50%)`
          ),
          opacity: hovered ? 1 : 0,
          transition: "opacity 0.4s ease",
        }}
      />
      {children(hovered)}
    </motion.div>
  );
}

/* ─────────────────────────────────────────────
   ANIMATED COUNTER
   ───────────────────────────────────────────── */
function AnimatedMetric({ value, isInView }: { value: string; isInView: boolean }) {
  const [display, setDisplay] = useState("0");

  useEffect(() => {
    if (!isInView) return;
    const isNumeric = /^\d+$/.test(value);

    if (isNumeric) {
      const target = parseInt(value);
      const duration = 1200;
      const start = Date.now();
      const tick = () => {
        const elapsed = Date.now() - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 4);
        setDisplay(Math.round(target * eased).toString());
        if (progress < 1) requestAnimationFrame(tick);
      };
      tick();
    } else {
      // For values like "3x", "100%", just reveal after a short delay
      const timeout = setTimeout(() => setDisplay(value), 300);
      return () => clearTimeout(timeout);
    }
  }, [isInView, value]);

  return <span>{display}</span>;
}

/* ─────────────────────────────────────────────
   FLOATING PARTICLES (background decoration)
   ───────────────────────────────────────────── */
function FloatingParticles() {
  const particles = Array.from({ length: 6 }, (_, i) => ({
    id: i,
    x: 10 + Math.random() * 80,
    y: 10 + Math.random() * 80,
    size: 3 + Math.random() * 4,
    duration: 8 + Math.random() * 12,
    delay: Math.random() * 5,
  }));

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
      {particles.map((p) => (
        <motion.div
          key={p.id}
          style={{
            position: "absolute",
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            borderRadius: "50%",
            background: "rgba(190,165,120,0.15)",
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0.2, 0.5, 0.2],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────
   MAIN COMPONENT
   ───────────────────────────────────────────── */
const Services = () => {
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.15 });
  const [_activeCard, _setActiveCard] = useState<number | null>(null);

  const palette = {
    bg: "#000f01",
    surface: "#001a01",
    surfaceHover: "#002505",
    accent: "#C0B87A",
    accentMuted: "rgba(192,184,122,0.12)",
    text: "#ffffff",
    textMuted: "rgba(255,255,255,0.5)",
    border: "rgba(255,255,255,0.08)",
    borderHover: "rgba(255,255,255,0.15)",
  };

  return (
    <div
      ref={sectionRef}
      style={{
        position: "relative",
        background: palette.bg,
        padding: "clamp(60px, 10vw, 140px) 0",
        overflow: "hidden",
        fontFamily: "var(--font-sans, 'General Sans'), system-ui, sans-serif",
      }}
    >
      {/* Background gradient orbs */}
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
        <div
          style={{
            position: "absolute",
            top: "-20%",
            right: "-10%",
            width: "60vw",
            height: "60vw",
            borderRadius: "50%",
            background: `radial-gradient(circle, ${palette.accentMuted} 0%, transparent 70%)`,
            filter: "blur(80px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-30%",
            left: "-15%",
            width: "50vw",
            height: "50vw",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(60,60,80,0.15) 0%, transparent 70%)",
            filter: "blur(80px)",
          }}
        />
      </div>

      <FloatingParticles />

      <div style={{ position: "relative", zIndex: 1, maxWidth: 1280, margin: "0 auto", padding: "0 clamp(20px, 5vw, 48px)" }}>
        {/* ─── HEADER ─── */}
        <div style={{ marginBottom: "clamp(48px, 6vw, 80px)" }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 24,
                padding: "6px 14px",
                borderRadius: 0,
                background: palette.accentMuted,
                border: `1px solid rgba(200,168,110,0.15)`,
              }}
            >
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: palette.accent }} />
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  letterSpacing: "2.5px",
                  textTransform: "uppercase",
                  color: palette.accent,
                }}
              >
                Our Values
              </span>
            </div>
          </motion.div>

          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between", gap: "16px clamp(16px, 5vw, 60px)" }}>
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.9, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              style={{
                fontSize: "clamp(32px, 5vw, 56px)",
                fontWeight: 700,
                lineHeight: 1.1,
                color: palette.text,
                letterSpacing: "-0.03em",
                margin: 0,
                maxWidth: 600,
              }}
            >
              Built for disciplined
              <br />
              <span
                style={{
                  fontWeight: 300,
                  fontStyle: "italic",
                  background: `linear-gradient(135deg, ${palette.text} 0%, ${palette.accent} 100%)`,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                fund operations
              </span>
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
              style={{
                fontSize: "clamp(15px, 1.1vw, 17px)",
                lineHeight: 1.75,
                color: palette.textMuted,
                maxWidth: 380,
                margin: 0,
              }}
            >
              Fundex centralizes investor management, deal operations, reporting, allocations, and capital workflows into one institutional platform.
            </motion.p>
          </div>

          {/* Animated line separator */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={isInView ? { scaleX: 1 } : {}}
            transition={{ duration: 1.2, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
            style={{
              height: 1,
              background: `linear-gradient(90deg, transparent 0%, ${palette.border} 20%, rgba(200,168,110,0.2) 50%, ${palette.border} 80%, transparent 100%)`,
              marginTop: "clamp(32px, 4vw, 48px)",
              transformOrigin: "left",
            }}
          />
        </div>

        {/* ─── CARDS GRID ─── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 300px), 1fr))",
            gap: "clamp(16px, 2vw, 24px)",
          }}
        >
          {SERVICES.map((service, i) => {
            const isAccent = !!service.accent;

            return (
              <motion.div
                key={service.title}
                initial={{ opacity: 0, y: 50 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{
                  duration: 0.9,
                  delay: 0.3 + i * 0.15,
                  ease: [0.16, 1, 0.3, 1],
                }}
                style={{ perspective: 1200 }}
              >
                <MagneticCard
                  index={i}
                  isAccent={isAccent}
                  className=""
                  style={{
                    position: "relative",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    minHeight: "clamp(340px, 40vw, 520px)",
                    padding: "clamp(28px, 3vw, 40px)",
                    borderRadius: 0,
                    background: isAccent
                      ? `linear-gradient(165deg, #001a01 0%, #001505 50%, #000f01 100%)`
                      : palette.surface,
                    border: `1px solid ${isAccent ? "rgba(200,168,110,0.15)" : palette.border}`,
                    cursor: "pointer",
                    overflow: "hidden",
                    transition: "border-color 0.4s ease",
                  }}
                >
                  {(hovered: boolean) => (
                    <>
                      {/* Accent shimmer border on accent card */}
                      {isAccent && (
                        <motion.div
                          style={{
                            position: "absolute",
                            inset: -1,
                            borderRadius: "inherit",
                            padding: 1,
                            background: hovered
                              ? `conic-gradient(from 180deg, transparent, ${palette.accent}33, transparent, ${palette.accent}22, transparent)`
                              : "transparent",
                            WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                            WebkitMaskComposite: "xor",
                            maskComposite: "exclude",
                            pointerEvents: "none",
                            zIndex: 1,
                            transition: "background 0.6s ease",
                          }}
                        />
                      )}

                      {/* Top section */}
                      <div style={{ position: "relative", zIndex: 3 }}>
                        {/* Number + Icon row */}
                        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 32 }}>
                          <motion.div
                            animate={hovered ? { scale: 1.08, rotate: 3 } : { scale: 1, rotate: 0 }}
                            transition={{ type: "spring", stiffness: 300, damping: 20 }}
                            style={{
                              width: 56,
                              height: 56,
                              borderRadius: 0,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              background: isAccent ? palette.accentMuted : "rgba(255,255,255,0.04)",
                              border: `1px solid ${isAccent ? "rgba(200,168,110,0.2)" : palette.border}`,
                            }}
                          >
                            {Icons[service.icon](isAccent ? palette.accent : palette.textMuted)}
                          </motion.div>

                          <span
                            style={{
                              fontSize: 13,
                              fontWeight: 500,
                              color: isAccent ? palette.accent : palette.textMuted,
                              opacity: 0.5,
                              fontVariantNumeric: "tabular-nums",
                            }}
                          >
                            0{i + 1}
                          </span>
                        </div>

                        {/* Metric */}
                        <div style={{ marginBottom: 24 }}>
                          <div
                            style={{
                              fontSize: "clamp(42px, 4vw, 56px)",
                              fontWeight: 800,
                              lineHeight: 1,
                              letterSpacing: "-0.04em",
                              color: isAccent ? palette.accent : palette.text,
                            }}
                          >
                            <AnimatedMetric value={service.metric} isInView={isInView} />
                          </div>
                          <div
                            style={{
                              fontSize: 13,
                              fontWeight: 500,
                              letterSpacing: "1px",
                              textTransform: "uppercase",
                              color: palette.textMuted,
                              marginTop: 6,
                            }}
                          >
                            {service.metricLabel}
                          </div>
                        </div>
                      </div>

                      {/* Bottom section */}
                      <div style={{ position: "relative", zIndex: 3 }}>
                        {/* Subtitle pill */}
                        <div
                          style={{
                            display: "inline-block",
                            fontSize: 11,
                            fontWeight: 600,
                            letterSpacing: "1.5px",
                            textTransform: "uppercase",
                            color: isAccent ? palette.accent : palette.textMuted,
                            marginBottom: 12,
                            padding: "4px 10px",
                            borderRadius: 0,
                            background: isAccent ? "rgba(200,168,110,0.08)" : "rgba(255,255,255,0.03)",
                          }}
                        >
                          {service?.subtitle}
                        </div>

                        <h3
                          style={{
                            fontSize: "clamp(22px, 2vw, 26px)",
                            fontWeight: 600,
                            color: palette.text,
                            letterSpacing: "-0.02em",
                            margin: "0 0 10px 0",
                          }}
                        >
                          {service.title}
                        </h3>

                        <p
                          style={{
                            fontSize: 15,
                            lineHeight: 1.7,
                            color: palette.textMuted,
                            margin: "0 0 24px 0",
                          }}
                        >
                          {service.description}
                        </p>

                        {/* CTA Arrow */}
                        <motion.div
                          animate={hovered ? { x: 4, y: -4 } : { x: 0, y: 0 }}
                          transition={{ type: "spring", stiffness: 300, damping: 20 }}
                          style={{
                            width: 48,
                            height: 48,
                            borderRadius: 0,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: isAccent ? "#000f01" : palette.text,
                            background: isAccent
                              ? hovered
                                ? palette.accent
                                : `linear-gradient(135deg, ${palette.accent}, #427A43)`
                              : hovered
                              ? "rgba(255,255,255,0.1)"
                              : "rgba(255,255,255,0.04)",
                            border: isAccent ? "none" : `1px solid ${hovered ? palette.borderHover : palette.border}`,
                            transition: "background 0.35s ease, border-color 0.35s ease",
                          }}
                        >
                          <ArrowIcon />
                        </motion.div>
                      </div>
                    </>
                  )}
                </MagneticCard>
              </motion.div>
            );
          })}
        </div>

        {/* ─── BOTTOM BAR ─── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.9, ease: [0.16, 1, 0.3, 1] }}
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            marginTop: "clamp(32px, 4vw, 48px)",
            padding: "20px 28px",
            borderRadius: 0,
            background: "rgba(255,255,255,0.02)",
            border: `1px solid ${palette.border}`,
          }}
        >
          <p style={{ fontSize: 14, color: palette.textMuted, margin: 0 }}>
            Trusted by <span style={{ color: palette.text, fontWeight: 600 }}> fund managers worldwide</span>
          </p>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            style={{
              padding: "10px 24px",
              borderRadius: 0,
              background: `linear-gradient(135deg, ${palette.accent}, #427A43)`,
              color: "#000f01",
              fontSize: 14,
              fontWeight: 600,
              border: "none",
              cursor: "pointer",
              letterSpacing: "-0.01em",
            }}
          >
            Book a Demo →
          </motion.button>
        </motion.div>
      </div>

    </div>
  );
}

export {Services}