import { useRef, useState, useEffect } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useInView,
  useMotionValueEvent,
  useMotionTemplate,
} from "framer-motion";
import { ArrowUpRight } from "lucide-react";

/* ═══════════════════════════════════════════
   DATA
   ═══════════════════════════════════════════ */
const REASONS = [
  {
    num: "01",
    title: "Speed to Close",
    headline: "Days,\nnot months.",
    detail: "Our infrastructure eliminates every bottleneck in the origination pipeline. Go from application to funded faster than any competitor.",
    metric: "10x",
    metricLabel: "FASTER CLOSING",
    accent: "#C0B87A",
  },
  {
    num: "02",
    title: "Scale Without Limits",
    headline: "10 loans or\n10,000.",
    detail: "The platform scales horizontally with your firm. No performance degradation, no feature gates, no ceiling on your growth.",
    metric: "\u221E",
    metricLabel: "SCALABILITY",
    accent: "#427A43",
  },
  {
    num: "03",
    title: "Miami-Native",
    headline: "Built for\nSouth Florida.",
    detail: "Designed by and for the unique dynamics of South Florida\u2019s real estate lending ecosystem. We understand your market intimately.",
    metric: "50+",
    metricLabel: "STATES COVERED",
    accent: "#005F02",
  },
  {
    num: "04",
    title: "Full-Stack OS",
    headline: "Not a tool.\nAn OS.",
    detail: "A complete operating system for your lending business \u2014 origination, servicing, investor management, compliance \u2014 unified in one platform.",
    metric: "1",
    metricLabel: "PLATFORM",
    accent: "#C0B87A",
  },
];

/* ═══════════════════════════════════════════
   REASON PANEL (scroll-driven scene)
   ═══════════════════════════════════════════ */
function ReasonPanel({ reason, index, progress }) {
  const segSize = 1 / REASONS.length;
  const myStart = index * segSize;
  const myEnd = myStart + segSize;

  const local = useTransform(progress, [myStart, myEnd], [0, 1]);

  const y = useTransform(local, [0, 0.15, 0.8, 1], ["80vh", "0vh", "0vh", "-20vh"]);
  const opacity = useTransform(local, [0, 0.08, 0.15, 0.8, 0.9, 1], [0, 0.2, 1, 1, 0.3, 0]);
  const scale = useTransform(local, [0, 0.15, 0.8, 1], [0.92, 1, 1, 0.95]);
  const blur = useTransform(local, [0, 0.12, 0.15, 0.8, 0.9, 1], [10, 3, 0, 0, 3, 10]);
  const blurFilter = useMotionTemplate`blur(${blur}px)`;

  const metricScale = useTransform(local, [0.2, 0.4], [0.5, 1]);
  const metricOpacity = useTransform(local, [0.2, 0.35], [0, 1]);
  const wipeScale = useTransform(local, [0.15, 0.75], [0, 1]);

  return (
    <motion.div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        y, opacity, scale,
        filter: blurFilter,
        zIndex: index + 1,
        pointerEvents: "none",
      }}
    >
      {/* Glow */}
      <motion.div style={{
        position: "absolute",
        width: "50vw",
        height: "50vh",
        borderRadius: "50%",
        background: `radial-gradient(circle, ${reason.accent}10, transparent 60%)`,
        filter: "blur(60px)",
        opacity: useTransform(local, [0.1, 0.3, 0.7, 0.9], [0, 0.8, 0.8, 0]),
        pointerEvents: "none",
      }} />

      <div style={{
        width: "100%",
        maxWidth: 700,
        padding: "0 clamp(20px, 4vw, 56px)",
        pointerEvents: "auto",
      }}>
        {/* Tag */}
        <motion.div style={{
          opacity: useTransform(local, [0.12, 0.25], [0, 1]),
          x: useTransform(local, [0.12, 0.25], [-20, 0]),
        }}>
          <div style={{
            fontFamily: "var(--font-sans, 'General Sans'), system-ui, sans-serif",
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "5px",
            color: reason.accent,
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 20,
          }}>
            <span style={{ width: 32, height: 1, background: reason.accent }} />
            {reason.num} \u2014 {reason.title.toUpperCase()}
          </div>
        </motion.div>

        {/* Headline */}
        <h3 style={{
          fontFamily: "var(--font-display, 'Trench Slab'), system-ui, serif",
          fontSize: "clamp(40px, 5.5vw, 72px)",
          fontWeight: 400,
          lineHeight: 1,
          letterSpacing: "-0.04em",
          color: "#1a1a1a",
          margin: "0 0 24px 0",
          whiteSpace: "pre-line",
        }}>
          {reason.headline}
        </h3>

        {/* Detail */}
        <p style={{
          fontFamily: "var(--font-sans, 'General Sans'), system-ui, sans-serif",
          fontSize: "clamp(14px, 1.05vw, 16px)",
          lineHeight: 1.75,
          color: "#5a6b5a",
          margin: "0 0 32px 0",
          maxWidth: 460,
        }}>
          {reason.detail}
        </p>

        {/* Metric */}
        <motion.div style={{
          scale: metricScale,
          opacity: metricOpacity,
          display: "flex",
          alignItems: "flex-end",
          gap: 16,
          marginBottom: 32,
        }}>
          <span style={{
            fontFamily: "var(--font-display, 'Trench Slab'), system-ui, serif",
            fontSize: "clamp(56px, 7vw, 96px)",
            fontWeight: 400,
            lineHeight: 0.85,
            color: reason.accent,
            letterSpacing: "-0.05em",
          }}>
            {reason.metric}
          </span>
          <span style={{
            fontFamily: "var(--font-sans, 'General Sans'), system-ui, sans-serif",
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: "3px",
            color: "#5a6b5a",
            paddingBottom: "clamp(8px, 1vw, 14px)",
          }}>
            {reason.metricLabel}
          </span>
        </motion.div>

        {/* Progress wipe */}
        <div style={{ height: 2, background: "#d4ddd4", position: "relative" }}>
          <motion.div style={{
            height: "100%",
            background: reason.accent,
            transformOrigin: "left",
            scaleX: wipeScale,
          }} />
        </div>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════
   LEFT STICKY PANEL
   ═══════════════════════════════════════════ */
function StickyContext({ progress }: { progress: import("framer-motion").MotionValue<number> }) {
  const [activeIdx, setActiveIdx] = useState(0);
  useMotionValueEvent(progress, "change", (v: number) => {
    setActiveIdx(Math.min(Math.floor(v * REASONS.length), REASONS.length - 1));
  });

  return (
    <div style={{
      position: "sticky",
      top: 0,
      height: "100vh",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      padding: "0 clamp(24px, 5vw, 80px)",
    }} className="sticky-context">
      {/* Label */}
      <div style={{
        fontFamily: "var(--font-sans, 'General Sans'), system-ui, sans-serif",
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: "6px",
        textTransform: "uppercase",
        color: "#005F02",
        marginBottom: 32,
        display: "flex",
        alignItems: "center",
        gap: 14,
      }}>
        <span style={{ width: 40, height: 1, background: "#005F02" }} />
        Why Fundex
      </div>

      {/* Headline */}
      <h2 style={{
        fontFamily: "var(--font-display, 'Trench Slab'), system-ui, serif",
        fontSize: "clamp(36px, 5vw, 64px)",
        fontWeight: 400,
        lineHeight: 1.05,
        letterSpacing: "-0.04em",
        color: "#1a1a1a",
        margin: "0 0 40px 0",
        maxWidth: 400,
      }}>
        The modern{" "}
        <span style={{
          fontStyle: "italic",
          background: "linear-gradient(135deg, #005F02, #427A43)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}>
          OS
        </span>{" "}
        for private lending.
      </h2>

      {/* Step indicators */}
      <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        {REASONS.map((r, i) => (
          <div key={r.num} style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            padding: "14px 0",
            borderBottom: "1px solid #d4ddd4",
          }}>
            <motion.div
              animate={{
                width: i === activeIdx ? 28 : 0,
                background: i === activeIdx ? r.accent : "transparent",
              }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              style={{ height: 2, borderRadius: 1, flexShrink: 0 }}
            />
            <span style={{
              fontFamily: "var(--font-sans, 'General Sans'), system-ui, sans-serif",
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "2px",
              color: i === activeIdx ? r.accent : "#a0b0a0",
              transition: "color 0.4s",
              width: 24,
              flexShrink: 0,
            }}>
              {r.num}
            </span>
            <motion.span
              animate={{ opacity: i === activeIdx ? 1 : 0.25, x: i === activeIdx ? 0 : -4 }}
              transition={{ duration: 0.35 }}
              style={{
                fontFamily: "var(--font-sans, 'General Sans'), system-ui, sans-serif",
                fontSize: 14,
                fontWeight: i === activeIdx ? 600 : 400,
                color: i === activeIdx ? "#1a1a1a" : "#5a6b5a",
                letterSpacing: "-0.01em",
              }}
            >
              {r.title}
            </motion.span>
          </div>
        ))}
      </div>

      {/* CTA */}
      <a
        href="#book-demo-section"
        className="inline-flex items-center gap-2.5 mt-10 px-8 py-3.5 bg-foreground text-background font-sans text-[15px] font-[500] no-underline rounded-full transition-all hover:opacity-90 hover:-translate-y-0.5 self-start"
      >
        Book a Demo
        <ArrowUpRight className="w-4 h-4" strokeWidth={1.5} />
      </a>
    </div>
  );
}

/* ═══════════════════════════════════════════
   PARTICLES
   ═══════════════════════════════════════════ */
function Particles() {
  const pts = Array.from({ length: 20 }, (_, i) => ({
    id: i, x: Math.random() * 100, y: Math.random() * 100,
    s: 1 + Math.random() * 1.5, d: 12 + Math.random() * 18,
    dl: Math.random() * 8, o: 0.08 + Math.random() * 0.12,
  }));
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
      {pts.map((p) => (
        <motion.div key={p.id}
          animate={{ y: [0, -30, 0], opacity: [p.o * 0.5, p.o, p.o * 0.5] }}
          transition={{ duration: p.d, repeat: Infinity, delay: p.dl, ease: "easeInOut" }}
          style={{
            position: "absolute", left: `${p.x}%`, top: `${p.y}%`,
            width: p.s, height: p.s, borderRadius: "50%", background: "#005F02",
          }}
        />
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════
   VERTICAL PROGRESS BAR
   ═══════════════════════════════════════════ */
function VerticalProgress({ progress }: { progress: import("framer-motion").MotionValue<number> }) {
  const scaleY = useTransform(progress, [0, 1], [0, 1]);
  const [idx, setIdx] = useState(0);
  useMotionValueEvent(progress, "change", (v: number) => {
    setIdx(Math.min(Math.floor(v * REASONS.length), REASONS.length - 1));
  });
  return (
    <div style={{
      position: "absolute", right: 0, top: "20%", bottom: "20%",
      width: 3, background: "#d4ddd4", zIndex: 10,
    }}>
      <motion.div style={{
        width: "100%",
        background: REASONS[idx]?.accent || "#005F02",
        transformOrigin: "top",
        scaleY, height: "100%",
        transition: "background 0.4s",
      }} />
    </div>
  );
}

/* ═══════════════════════════════════════════
   PROCESS STRIP
   ═══════════════════════════════════════════ */
function ProcessStrip() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.3 });
  const steps = [
    { num: "01", label: "Originate", desc: "Submit and process applications in minutes." },
    { num: "02", label: "Analyze", desc: "Real-time portfolio performance and risk." },
    { num: "03", label: "Manage", desc: "Track every deal from application to funding." },
    { num: "04", label: "Scale", desc: "Automate servicing, distributions, compliance." },
  ];

  return (
    <div ref={ref} style={{ borderTop: "1px solid #d4ddd4", padding: "clamp(48px, 6vw, 80px) 0" }}>
      <motion.div
        initial={{ scaleX: 0 }}
        animate={inView ? { scaleX: 1 } : {}}
        transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
        style={{
          height: 1,
          background: "linear-gradient(90deg, transparent, #005F0230, #005F0250, #005F0230, transparent)",
          transformOrigin: "left",
          marginBottom: "clamp(32px, 4vw, 56px)",
          position: "relative",
        }}
      >
        <motion.div
          initial={{ left: "0%" }}
          animate={inView ? { left: "100%" } : {}}
          transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
          style={{
            position: "absolute", top: -3, width: 7, height: 7,
            borderRadius: "50%", background: "#005F02",
            boxShadow: "0 0 12px #005F0266",
          }}
        />
      </motion.div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 0 }} className="process-grid">
        {steps.map((step, i) => (
          <motion.div key={step.num}
            initial={{ opacity: 0, y: 24 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.3 + i * 0.12, ease: [0.16, 1, 0.3, 1] }}
            style={{
              padding: "0 clamp(12px, 2vw, 28px)",
              borderLeft: i > 0 ? "1px solid #d4ddd4" : "none",
            }}
            className="process-item"
          >
            <div style={{
              fontFamily: "var(--font-sans, 'General Sans'), system-ui, sans-serif", fontSize: 10,
              fontWeight: 700, letterSpacing: "4px", color: "#005F02",
              opacity: 0.5, marginBottom: 12,
            }}>{step.num}</div>
            <h4 style={{
              fontFamily: "var(--font-display, 'Trench Slab'), system-ui, serif",
              fontSize: "clamp(22px, 2.2vw, 30px)", fontWeight: 400,
              color: "#1a1a1a", letterSpacing: "-0.03em", margin: "0 0 10px 0",
            }}>{step.label}</h4>
            <p style={{
              fontFamily: "var(--font-sans, 'General Sans'), system-ui, sans-serif", fontSize: 13,
              lineHeight: 1.7, color: "#5a6b5a", margin: 0,
            }}>{step.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   MAIN EXPORT
   ═══════════════════════════════════════════ */
export function WhyFundex() {
  const containerRef = useRef(null);
  const scrollPages = REASONS.length + 0.8;

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const smoothProgress = useSpring(scrollYProgress, { damping: 55, stiffness: 200 });

  return (
    <>
      <section ref={containerRef} style={{
        position: "relative", background: "#faf8f3",
        height: `${scrollPages * 100}vh`,
      }}>
        <Particles />

        <div style={{
          position: "sticky", top: 0, height: "100vh",
          display: "grid", gridTemplateColumns: "0.45fr 0.55fr", zIndex: 2,
        }} className="split-layout">
          {/* LEFT */}
          <div style={{
            position: "relative", borderRight: "1px solid #d4ddd4", overflow: "hidden",
          }}>
            <div style={{
              position: "absolute", inset: 0,
              backgroundImage: "linear-gradient(90deg, rgba(0,95,2,0.03) 1px, transparent 1px)",
              backgroundSize: "60px 100%", pointerEvents: "none",
            }} />
            <StickyContext progress={smoothProgress} />
          </div>

          {/* RIGHT */}
          <div style={{ position: "relative", overflow: "hidden" }}>
            <div style={{
              position: "absolute", inset: 0,
              backgroundImage: `
                linear-gradient(rgba(0,95,2,0.03) 1px, transparent 1px),
                linear-gradient(90deg, rgba(0,95,2,0.03) 1px, transparent 1px)
              `,
              backgroundSize: "60px 60px", pointerEvents: "none",
            }} />
            {REASONS.map((reason, i) => (
              <ReasonPanel key={reason.num} reason={reason} index={i} progress={smoothProgress} />
            ))}
            <VerticalProgress progress={smoothProgress} />
          </div>
        </div>
      </section>

      <div style={{
        background: "#faf8f3",
        padding: "0 clamp(24px, 5vw, 80px)",
        fontFamily: "var(--font-sans, 'General Sans'), system-ui, sans-serif",
      }}>
        <div style={{ maxWidth: 1400, margin: "0 auto" }}>
          <ProcessStrip />
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .split-layout {
            grid-template-columns: 1fr !important;
          }
          .sticky-context {
            display: none !important;
          }
          .process-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 24px 0 !important;
          }
          .process-item {
            border-left: none !important;
            border-bottom: 1px solid #d4ddd4;
            padding-bottom: 20px !important;
          }
        }
        @media (max-width: 500px) {
          .process-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </>
  );
}