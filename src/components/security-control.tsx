import { useRef, useState, useEffect, useCallback } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useInView,
  useMotionValue,
  useMotionValueEvent,
  useMotionTemplate,
  AnimatePresence,
} from "framer-motion";
import { ArrowUpRight } from "lucide-react";

/* ═══════════════════════════════════════════
   DATA
   ═══════════════════════════════════════════ */
const FEATURES_LEFT = [
  { title: "Bank-Grade\nEncryption", detail: "SOC 2 Type II compliant with end-to-end 256-bit AES encryption across all data channels.", tag: "AES-256" },
  { title: "Role-Based\nAccess", detail: "Granular permissions per team member. Full control from deal pipeline to investor data.", tag: "RBAC" },
  { title: "Complete\nAudit Trail", detail: "Every action logged, timestamped, and attributable. Compliance-ready from day one.", tag: "LOGGING" },
];

const FEATURES_RIGHT = [
  { title: "Regulatory\nCompliance", detail: "Built-in workflows for 50+ state and federal lending regulations. Always current.", tag: "REG-TECH" },
  { title: "Investor\nVerification", detail: "Automated accredited investor verification, KYC/AML integrated into onboarding.", tag: "KYC/AML" },
  { title: "Real-Time\nMonitoring", detail: "Live portfolio health, risk scoring, and anomaly detection across all positions.", tag: "24/7" },
];

const HERO_STATS = [
  { value: "99.9", suffix: "%", label: "UPTIME" },
  { value: "256", suffix: "bit", label: "ENCRYPTION" },
  { value: "500", suffix: "+", label: "FIRMS" },
  { value: "0", suffix: "", label: "BREACHES" },
];

/* ═══════════════════════════════════════════
   ANIMATED SCAN LINE (vertical reveal line)
   ═══════════════════════════════════════════ */
function ScanLine({ delay = 0, height = "100%", color = "#005F02" }) {
  return (
    <motion.div
      initial={{ scaleY: 0, opacity: 0 }}
      whileInView={{ scaleY: 1, opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 1.2, delay, ease: [0.16, 1, 0.3, 1] }}
      style={{
        width: 1,
        height,
        background: `linear-gradient(180deg, transparent, ${color}40 30%, ${color}40 70%, transparent)`,
        transformOrigin: "top",
        flexShrink: 0,
      }}
    />
  );
}

/* ═══════════════════════════════════════════
   FEATURE BLOCK — raw typography, no box
   ═══════════════════════════════════════════ */
function FeatureBlock({ feature, index, side }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.4 });
  const [hovered, setHovered] = useState(false);

  const fromX = side === "left" ? -60 : 60;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: fromX }}
      animate={isInView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 1, delay: index * 0.15, ease: [0.16, 1, 0.3, 1] }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "relative",
        padding: "clamp(28px, 3vw, 44px) 0",
        cursor: "default",
        borderBottom: "1px solid #d4ddd4",
      }}
    >
      {/* Hover wipe — full-width color wash */}
      <motion.div
        animate={{ scaleX: hovered ? 1 : 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(90deg, rgba(0,95,2,0.04), rgba(0,95,2,0.02), transparent)",
          transformOrigin: side === "left" ? "left" : "right",
          pointerEvents: "none",
        }}
      />

      {/* Tag — monospace accent */}
      <motion.div
        animate={hovered ? { x: side === "left" ? 8 : -8 } : { x: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 22 }}
        style={{
          fontFamily: "var(--font-sans, 'General Sans'), system-ui, sans-serif",
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: "4px",
          color: "#005F02",
          marginBottom: 16,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <motion.span
          animate={{ width: hovered ? 24 : 12 }}
          transition={{ type: "spring", stiffness: 300, damping: 22 }}
          style={{ height: 1, background: "#005F02", display: "block" }}
        />
        {feature.tag}
      </motion.div>

      {/* Title — massive, raw */}
      <h3 style={{
        fontFamily: "var(--font-display, 'Trench Slab'), system-ui, serif",
        fontSize: "clamp(28px, 3vw, 42px)",
        fontWeight: 400,
        lineHeight: 1.05,
        letterSpacing: "-0.03em",
        color: "#1a1a1a",
        margin: "0 0 14px 0",
        whiteSpace: "pre-line",
        transition: "color 0.3s ease",
        ...(hovered ? { color: "#1a1a1a" } : {}),
      }}>
        {feature.title}
      </h3>

      {/* Description */}
      <p style={{
        fontFamily: "var(--font-sans, 'General Sans'), system-ui, sans-serif",
        fontSize: "clamp(13px, 1vw, 15px)",
        lineHeight: 1.75,
        color: "#5a6b5a",
        margin: 0,
        maxWidth: 380,
        transition: "color 0.3s ease",
        ...(hovered ? { color: "#3a4a3a" } : {}),
      }}>
        {feature.detail}
      </p>

      {/* Hover arrow reveal */}
      <motion.div
        animate={hovered ? { opacity: 1, x: 0 } : { opacity: 0, x: -16 }}
        transition={{ duration: 0.3 }}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          marginTop: 18,
          fontFamily: "var(--font-sans, 'General Sans'), system-ui, sans-serif",
          fontSize: 11,
          fontWeight: 600,
          color: "#005F02",
          letterSpacing: "1px",
        }}
      >
        EXPLORE
        <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
          <path d="M5 15L15 5M15 5H8M15 5V12" stroke="#005F02" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </motion.div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════
   HERO STAT — massive animated number
   ═══════════════════════════════════════════ */
function HeroStat({ value, suffix, label, delay, isInView }) {
  const [display, setDisplay] = useState("0");
  const isDecimal = value.includes(".");

  useEffect(() => {
    if (!isInView) return;
    const target = parseFloat(value);
    const duration = 1600;
    const start = Date.now();
    const startDelay = delay;
    const timeout = setTimeout(() => {
      const tick = () => {
        const elapsed = Date.now() - start - startDelay;
        if (elapsed < 0) { requestAnimationFrame(tick); return; }
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 4);
        const current = target * eased;
        setDisplay(isDecimal ? current.toFixed(1) : Math.floor(current).toString());
        if (progress < 1) requestAnimationFrame(tick);
      };
      tick();
    }, startDelay);
    return () => clearTimeout(timeout);
  }, [isInView, value, delay, isDecimal]);

  return (
    <div style={{ textAlign: "center", position: "relative" }}>
      <div style={{
        fontFamily: "var(--font-display, 'Trench Slab'), system-ui, serif",
        fontSize: "clamp(48px, 6vw, 80px)",
        fontWeight: 400,
        lineHeight: 1,
        letterSpacing: "-0.04em",
        color: "#1a1a1a",
      }}>
        {display}
        <span style={{
          fontFamily: "var(--font-sans, 'General Sans'), system-ui, sans-serif",
          fontSize: "0.35em",
          fontWeight: 400,
          color: "#005F02",
          verticalAlign: "super",
          marginLeft: 2,
        }}>
          {suffix}
        </span>
      </div>
      <div style={{
        fontFamily: "var(--font-sans, 'General Sans'), system-ui, sans-serif",
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: "4px",
        color: "#5a6b5a",
        marginTop: 10,
      }}>
        {label}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   PARTICLE FIELD BACKGROUND
   ═══════════════════════════════════════════ */
function ParticleField() {
  const particles = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: 1 + Math.random() * 2,
    dur: 10 + Math.random() * 20,
    delay: Math.random() * 10,
    opacity: 0.1 + Math.random() * 0.2,
  }));

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
      {particles.map((p) => (
        <motion.div
          key={p.id}
          animate={{
            y: [0, -40 - Math.random() * 40, 0],
            x: [0, (Math.random() - 0.5) * 30, 0],
            opacity: [p.opacity * 0.5, p.opacity, p.opacity * 0.5],
          }}
          transition={{ duration: p.dur, repeat: Infinity, delay: p.delay, ease: "easeInOut" }}
          style={{
            position: "absolute",
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            borderRadius: "50%",
            background: "#005F02",
          }}
        />
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════
   HORIZONTAL SCAN ANIMATION (top border)
   ═══════════════════════════════════════════ */
function HorizontalScan({ isInView }) {
  return (
    <motion.div
      initial={{ scaleX: 0 }}
      animate={isInView ? { scaleX: 1 } : {}}
      transition={{ duration: 2, ease: [0.16, 1, 0.3, 1] }}
      style={{
        height: 1,
        background: "linear-gradient(90deg, transparent, #005F0230 20%, #005F0250 50%, #005F0230 80%, transparent)",
        transformOrigin: "left",
        marginBottom: "clamp(48px, 6vw, 80px)",
      }}
    >
      {/* Scanning dot */}
      <motion.div
        initial={{ left: "0%" }}
        animate={isInView ? { left: "100%" } : {}}
        transition={{ duration: 2, ease: [0.16, 1, 0.3, 1] }}
        style={{
          position: "relative",
          top: -3,
          width: 7,
          height: 7,
          borderRadius: "50%",
          background: "#005F02",
          boxShadow: "0 0 12px #005F0288",
        }}
      />
    </motion.div>
  );
}

/* ═══════════════════════════════════════════
   MAIN EXPORT
   ═══════════════════════════════════════════ */
export function SecurityControl() {
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.08 });
  const headerRef = useRef(null);
  const headerInView = useInView(headerRef, { once: true, amount: 0.3 });
  const statsRef = useRef(null);
  const statsInView = useInView(statsRef, { once: true, amount: 0.4 });

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const bgShift = useTransform(scrollYProgress, [0, 1], [0, -60]);

  return (
    <>
      <section
        ref={sectionRef}
        style={{
          position: "relative",
          background: "#faf8f3",
          overflow: "hidden",
          fontFamily: "var(--font-sans, 'General Sans'), system-ui, sans-serif",
        }}
      >
        <ParticleField />

        {/* Background radial gradients */}
        <motion.div style={{
          position: "absolute",
          top: "10%",
          left: "30%",
          width: "50vw",
          height: "50vw",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(0,95,2,0.03) 0%, transparent 60%)",
          filter: "blur(60px)",
          y: bgShift,
          pointerEvents: "none",
        }} />

        {/* ═══ HEADER SECTION ═══ */}
        <div style={{
          position: "relative",
          zIndex: 2,
          maxWidth: 1400,
          margin: "0 auto",
          padding: "clamp(100px, 14vw, 200px) clamp(24px, 5vw, 80px) 0",
        }}>
          <div ref={headerRef}>
            {/* Eyebrow */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={headerInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              style={{
                fontFamily: "var(--font-sans, 'General Sans'), system-ui, sans-serif",
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "6px",
                textTransform: "uppercase",
                color: "#005F02",
                marginBottom: "clamp(24px, 3vw, 40px)",
                display: "flex",
                alignItems: "center",
                gap: 16,
              }}
            >
              <span style={{ width: 40, height: 1, background: "#005F02" }} />
              Security & Control
            </motion.div>

            {/* Giant headline */}
            <motion.h2
              initial={{ opacity: 0, y: 50 }}
              animate={headerInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 1.1, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              style={{
                fontFamily: "var(--font-display, 'Trench Slab'), system-ui, serif",
                fontSize: "clamp(44px, 7vw, 100px)",
                fontWeight: 400,
                lineHeight: 0.95,
                letterSpacing: "-0.04em",
                color: "#1a1a1a",
                margin: "0 0 clamp(20px, 2.5vw, 32px) 0",
                maxWidth: 900,
              }}
            >
              Your data is{" "}
              <span style={{
                fontStyle: "italic",
                position: "relative",
                display: "inline-block",
              }}>
                <span style={{
                  background: "linear-gradient(135deg, #005F02, #427A43, #005F02)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}>
                  sacred.
                </span>
                {/* Underline accent */}
                <motion.span
                  initial={{ scaleX: 0 }}
                  animate={headerInView ? { scaleX: 1 } : {}}
                  transition={{ duration: 0.8, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  style={{
                    position: "absolute",
                    bottom: "-4px",
                    left: 0,
                    right: 0,
                    height: 2,
                    background: "linear-gradient(90deg, #005F02, transparent)",
                    transformOrigin: "left",
                  }}
                />
              </span>
              <br />
              We treat it that way.
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={headerInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.3 }}
              style={{
                fontSize: "clamp(15px, 1.1vw, 18px)",
                lineHeight: 1.7,
                color: "#5a6b5a",
                maxWidth: 500,
                margin: 0,
              }}
            >
              Enterprise-grade infrastructure protecting every transaction,
              every investor, every byte — around the clock.
            </motion.p>
          </div>

          {/* Scan line separator */}
          <div style={{ marginTop: "clamp(48px, 6vw, 80px)" }}>
            <HorizontalScan isInView={headerInView} />
          </div>

          {/* ═══ STATS CLUSTER ═══ */}
          <div
            ref={statsRef}
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 0,
              marginBottom: "clamp(64px, 8vw, 100px)",
            }}
            className="stats-cluster"
          >
            {HERO_STATS.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 30 }}
                animate={statsInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.8, delay: 0.1 + i * 0.12, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  padding: "clamp(20px, 3vw, 40px) 0",
                  borderLeft: i > 0 ? "1px solid #d4ddd4" : "none",
                  paddingLeft: i > 0 ? "clamp(16px, 2vw, 32px)" : 0,
                }}
                className="stat-item"
              >
                <HeroStat
                  value={stat.value}
                  suffix={stat.suffix}
                  label={stat.label}
                  delay={200 + i * 150}
                  isInView={statsInView}
                />
              </motion.div>
            ))}
          </div>

          {/* ═══ FEATURES — TWO COLUMNS WITH CENTRAL SCAN LINE ═══ */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr auto 1fr",
            gap: "0 clamp(24px, 4vw, 64px)",
            marginBottom: "clamp(80px, 10vw, 140px)",
          }} className="features-grid">
            {/* Left column */}
            <div>
              {FEATURES_LEFT.map((f, i) => (
                <FeatureBlock key={f.tag} feature={f} index={i} side="left" />
              ))}
            </div>

            {/* Central vertical scan line */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 20 }} className="central-line">
              <ScanLine delay={0.3} />
              {/* Midpoint pulse */}
              <motion.div
                animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.8, 0.3] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                style={{
                  position: "absolute",
                  top: "50%",
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: "#005F02",
                  boxShadow: "0 0 20px #005F0244",
                }}
              />
            </div>

            {/* Right column */}
            <div>
              {FEATURES_RIGHT.map((f, i) => (
                <FeatureBlock key={f.tag} feature={f} index={i} side="right" />
              ))}
            </div>
          </div>

          {/* ═══ BOTTOM TRUST STRIP ═══ */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
            style={{
              borderTop: "1px solid #d4ddd4",
              borderBottom: "1px solid #d4ddd4",
              padding: "clamp(32px, 4vw, 56px) 0",
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "24px 40px",
              marginBottom: "clamp(80px, 10vw, 140px)",
            }}
          >
            {/* Trust badges as raw text — no boxes */}
            {["SOC 2 Type II", "GDPR Compliant", "256-bit AES", "KYC/AML Ready", "99.9% SLA"].map((badge, i) => (
              <motion.div
                key={badge}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.08 }}
                style={{
                  fontFamily: "var(--font-display, 'Trench Slab'), system-ui, serif",
                  fontSize: 15,
                  fontWeight: 700,
                  letterSpacing: "1px",
                  textTransform: "uppercase",
                  color: "#5a6b5a",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <div style={{
                  width: 6,
                  height: 6,
                  background: "#005F02",
                  transform: "rotate(45deg)",
                }} />
                {badge}
              </motion.div>
            ))}
          </motion.div>

          {/* ═══ CTA ═══ */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            style={{
              textAlign: "center",
              paddingBottom: "clamp(80px, 10vw, 140px)",
            }}
          >
            <p style={{
              fontFamily: "var(--font-display, 'Trench Slab'), system-ui, serif",
              fontSize: "clamp(24px, 3vw, 40px)",
              fontWeight: 400,
              fontStyle: "italic",
              color: "#5a6b5a",
              margin: "0 0 28px 0",
              letterSpacing: "-0.02em",
            }}>
              Ready to protect your fund?
            </p>
            <a
              href="#book-demo-section"
              className="inline-flex items-center gap-2.5 px-8 py-3.5 bg-foreground text-background font-sans text-[15px] font-[500] no-underline rounded-full transition-all hover:opacity-90 hover:-translate-y-0.5"
            >
              Book a Demo
              <ArrowUpRight className="w-4 h-4" strokeWidth={1.5} />
            </a>
          </motion.div>
        </div>
      </section>

      <style>{`
        @media (max-width: 768px) {
          .stats-cluster {
            grid-template-columns: repeat(2, 1fr) !important;
          }
          .stat-item {
            border-left: none !important;
            padding-left: 0 !important;
            border-bottom: 1px solid #d4ddd4;
          }
          .features-grid {
            grid-template-columns: 1fr !important;
          }
          .central-line {
            display: none !important;
          }
        }
        @media (max-width: 480px) {
          .stats-cluster {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </>
  );
}