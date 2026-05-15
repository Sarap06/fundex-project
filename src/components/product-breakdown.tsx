import { useRef, useState } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useMotionValue,
  useMotionValueEvent,
  useMotionTemplate,
} from "framer-motion";

/* ═══════════════════════════════════════════
   DATA
   ═══════════════════════════════════════════ */
const LAYERS = [
  {
    id: "platform",
    label: "Platform Layer",
    sublabel: "FUNDEX CORE",
    num: "01",
    color: "#C0B87A",
    features: [
      { title: "Auth &\nPermissions", desc: "SSO, role-based access, and team management across your organization." },
      { title: "Analytics\nEngine", desc: "Real-time data pipelines powering dashboards, reports, and alerts." },
      { title: "Cloud\nInfrastructure", desc: "99.9% uptime, automatic scaling, and enterprise-grade security." },
    ],
  },
  {
    id: "firm",
    label: "Firm Layer",
    sublabel: "INTERNAL WORKSPACE",
    num: "02",
    color: "#427A43",
    features: [
      { title: "Deals &\nContracts", desc: "End-to-end deal pipeline, term sheets, and contract lifecycle." },
      { title: "Team\nCollaboration", desc: "Shared workspaces, task assignments, and internal comms." },
      { title: "Loan\nServicing", desc: "Payment processing, escrow management, and borrower comms." },
    ],
  },
  {
    id: "investor",
    label: "Investor Layer",
    sublabel: "INVESTOR-FACING",
    num: "03",
    color: "#F2E3BB",
    features: [
      { title: "Investor\nDashboards", desc: "White-labeled portals with real-time visibility into positions." },
      { title: "Portfolio &\nPositions", desc: "NAV calculations, position tracking, and distribution waterfalls." },
      { title: "Reporting &\nStatements", desc: "Automated K-1s, monthly statements, and custom LP reporting." },
    ],
  },
];

const TOTAL = LAYERS.length;

/* ═══════════════════════════════════════════
   LAYER SCENE — full viewport takeover
   Features as horizontal text columns
   with a progress line drawing across
   ═══════════════════════════════════════════ */
function LayerScene({ layer, index, progress }) {
  // Scene lifecycle
  const y = useTransform(progress, [0, 0.12, 0.82, 1], ["100vh", "0vh", "0vh", "-15vh"]);
  const opacity = useTransform(progress, [0, 0.06, 0.12, 0.82, 0.92, 1], [0, 0.15, 1, 1, 0.2, 0]);
  const sceneScale = useTransform(progress, [0, 0.12, 0.82, 1], [0.94, 1, 1, 0.96]);
  const blur = useTransform(progress, [0, 0.09, 0.12, 0.82, 0.92, 1], [8, 2, 0, 0, 3, 8]);
  const blurFilter = useMotionTemplate`blur(${blur}px)`;

  // Progress line that draws left→right as you scroll through this layer
  const lineProgress = useTransform(progress, [0.2, 0.75], [0, 1]);

  // Feature stagger
  const f1Opacity = useTransform(progress, [0.15, 0.28], [0, 1]);
  const f1X = useTransform(progress, [0.15, 0.28], [40, 0]);
  const f2Opacity = useTransform(progress, [0.22, 0.36], [0, 1]);
  const f2X = useTransform(progress, [0.22, 0.36], [40, 0]);
  const f3Opacity = useTransform(progress, [0.29, 0.44], [0, 1]);
  const f3X = useTransform(progress, [0.29, 0.44], [40, 0]);

  const featureAnims = [
    { opacity: f1Opacity, x: f1X },
    { opacity: f2Opacity, x: f2X },
    { opacity: f3Opacity, x: f3X },
  ];

  // Number reveal
  const numOpacity = useTransform(progress, [0.08, 0.2], [0, 1]);
  const numX = useTransform(progress, [0.08, 0.2], [-24, 0]);

  // Sublabel
  const subOpacity = useTransform(progress, [0.1, 0.22], [0, 1]);

  return (
    <motion.div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        y, opacity,
        scale: sceneScale,
        filter: blurFilter,
        zIndex: index + 1,
        pointerEvents: "none",
        padding: "0 clamp(32px, 6vw, 80px)",
      }}
    >
      <div style={{
        maxWidth: 1200,
        width: "100%",
        margin: "0 auto",
        pointerEvents: "auto",
      }}>
        {/* ─── Layer identity ─── */}
        <div style={{
          display: "flex",
          alignItems: "flex-end",
          gap: "clamp(16px, 3vw, 32px)",
          marginBottom: "clamp(16px, 2vw, 24px)",
        }}>
          {/* Giant number */}
          <motion.div style={{
            fontFamily: "var(--font-display, 'Trench Slab'), system-ui, serif",
            fontSize: "clamp(40px, 6vw, 80px)",
            fontWeight: 400,
            lineHeight: 0.78,
            letterSpacing: "-0.06em",
            color: "transparent",
            WebkitTextStroke: `1px ${layer.color}22`,
            userSelect: "none",
            opacity: numOpacity,
            x: numX,
          }}>
            {layer.num}
          </motion.div>

          <div style={{ paddingBottom: "clamp(6px, 1vw, 14px)" }}>
            <motion.div style={{ opacity: subOpacity }}>
              <div style={{
                fontFamily: "var(--font-sans, 'General Sans'), system-ui, sans-serif",
                fontSize: 9,
                fontWeight: 600,
                letterSpacing: "4px",
                color: layer.color,
                opacity: 0.8,
                marginBottom: 6,
              }}>
                {layer.sublabel}
              </div>
              <h3 style={{
                fontFamily: "var(--font-display, 'Trench Slab'), system-ui, serif",
                fontSize: "clamp(28px, 3.5vw, 48px)",
                fontWeight: 400,
                lineHeight: 1.05,
                letterSpacing: "-0.03em",
                color: "#ffffff",
                margin: 0,
              }}>
                {layer.label}
              </h3>
            </motion.div>
          </div>
        </div>

        {/* ─── Horizontal progress line ─── */}
        <div style={{
          position: "relative",
          height: 1,
          background: "rgba(255,255,255,0.08)",
          marginBottom: "clamp(40px, 5vw, 64px)",
        }}>
          <motion.div style={{
            position: "absolute",
            top: 0,
            left: 0,
            height: "100%",
            width: "100%",
            background: layer.color,
            transformOrigin: "left",
            scaleX: lineProgress,
            opacity: 0.4,
          }} />
          {/* Glowing dot at the leading edge */}
          <motion.div style={{
            position: "absolute",
            top: -3,
            left: useTransform(lineProgress, (v) => `${v * 100}%`),
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: layer.color,
            boxShadow: `0 0 12px ${layer.color}66`,
            opacity: useTransform(progress, [0.18, 0.25, 0.7, 0.8], [0, 0.8, 0.8, 0]),
          }} />
        </div>

        {/* ─── Features as text columns ─── */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 0,
        }} className="features-row">
          {layer.features.map((feature, fi) => (
            <motion.div
              key={feature.title}
              style={{
                opacity: featureAnims[fi].opacity,
                x: featureAnims[fi].x,
                borderLeft: fi > 0 ? "1px solid rgba(255,255,255,0.06)" : "none",
                padding: `0 clamp(16px, 2.5vw, 36px)`,
                paddingLeft: fi === 0 ? 0 : undefined,
              }}
              className="feature-col"
            >
              <FeatureColumn feature={feature} layer={layer} index={fi} />
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════
   FEATURE COLUMN — raw text, no box
   ═══════════════════════════════════════════ */
function FeatureColumn({ feature, layer, index }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ cursor: "default", paddingBottom: 8 }}
    >
      {/* Title */}
      <motion.h4
        animate={{ color: hovered ? "#ffffff" : "rgba(255,255,255,0.7)" }}
        transition={{ duration: 0.4 }}
        style={{
          fontFamily: "var(--font-display, 'Trench Slab'), system-ui, serif",
          fontSize: "clamp(22px, 2.2vw, 32px)",
          fontWeight: 400,
          lineHeight: 1.1,
          letterSpacing: "-0.02em",
          margin: "0 0 16px 0",
          whiteSpace: "pre-line",
        }}
      >
        {feature.title}
      </motion.h4>

      {/* Description */}
      <motion.p
        animate={{ color: hovered ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.4)" }}
        transition={{ duration: 0.5 }}
        style={{
          fontFamily: "var(--font-sans, 'General Sans'), system-ui, sans-serif",
          fontSize: "clamp(12px, 0.85vw, 14px)",
          lineHeight: 1.75,
          fontWeight: 400,
          margin: "0 0 20px 0",
          maxWidth: 300,
        }}
      >
        {feature.desc}
      </motion.p>

      {/* Hover reveal arrow */}
      <motion.div
        animate={hovered ? { opacity: 0.5, x: 0 } : { opacity: 0, x: -10 }}
        transition={{ duration: 0.35 }}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <motion.div
          animate={{ width: hovered ? 20 : 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          style={{
            height: 1,
            background: layer.color,
          }}
        />
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
          <path d="M4 8h8m0 0L9 5m3 3-3 3" stroke={layer.color} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </motion.div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   PROGRESS + NAV
   ═══════════════════════════════════════════ */
function ProgressBar({ progress }: { progress: import("framer-motion").MotionValue<number> }) {
  const scaleX = useTransform(progress, [0, 1], [0, 1]);
  const [idx, setIdx] = useState(0);
  useMotionValueEvent(progress, "change", (v: number) => setIdx(Math.min(Math.floor(v * TOTAL), TOTAL - 1)));

  return (
    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 1, background: "rgba(255,255,255,0.015)", zIndex: 20 }}>
      <motion.div style={{
        height: "100%",
        background: LAYERS[idx]?.color || "#C0B87A",
        transformOrigin: "left",
        scaleX,
        transition: "background 0.6s",
        opacity: 0.3,
      }} />
    </div>
  );
}

function LayerNav({ progress }: { progress: import("framer-motion").MotionValue<number> }) {
  const [idx, setIdx] = useState(0);
  useMotionValueEvent(progress, "change", (v: number) => setIdx(Math.min(Math.floor(v * TOTAL), TOTAL - 1)));

  return (
    <div style={{
      position: "absolute",
      right: "clamp(20px, 3vw, 40px)",
      top: "50%",
      transform: "translateY(-50%)",
      display: "flex",
      flexDirection: "column",
      gap: 16,
      zIndex: 20,
    }} className="layer-nav">
      {LAYERS.map((l, i) => (
        <div key={l.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <motion.div
            animate={{ width: i === idx ? 28 : 8, background: i === idx ? l.color : "rgba(255,255,255,0.08)" }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            style={{ height: 1.5, borderRadius: 1, opacity: i === idx ? 0.8 : 0.3 }}
          />
          <motion.span
            animate={{ opacity: i === idx ? 0.7 : 0, x: i === idx ? 0 : -6 }}
            transition={{ duration: 0.4 }}
            style={{
              fontFamily: "var(--font-sans, 'General Sans'), system-ui, sans-serif",
              fontSize: 9,
              fontWeight: 500,
              letterSpacing: "2.5px",
              textTransform: "uppercase",
              color: l.color,
              whiteSpace: "nowrap",
            }}
          >
            {l.sublabel}
          </motion.span>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════
   HEADER
   ═══════════════════════════════════════════ */
function Header({ progress }) {
  const opacity = useTransform(progress, [0, 0.06], [1, 0]);
  const y = useTransform(progress, [0, 0.06], [0, -30]);

  return (
    <motion.div style={{
      position: "absolute", inset: 0,
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      textAlign: "center",
      opacity, y,
      zIndex: 10, padding: "0 24px",
      pointerEvents: "none",
    }}>
      <div style={{
        fontFamily: "var(--font-sans, 'General Sans'), system-ui, sans-serif",
        fontSize: 9, fontWeight: 500,
        letterSpacing: "4px", textTransform: "uppercase",
        color: "#C0B87A", opacity: 0.8,
        marginBottom: 28,
        display: "flex", alignItems: "center", gap: 12,
      }}>
        <span style={{ width: 20, height: 1, background: "#C0B87A", opacity: 0.6 }} />
        The OS Layers
        <span style={{ width: 20, height: 1, background: "#C0B87A", opacity: 0.6 }} />
      </div>

      <h2 style={{
        fontFamily: "var(--font-display, 'Trench Slab'), system-ui, serif",
        fontSize: "clamp(28px, 3.5vw, 42px)",
        fontWeight: 400, lineHeight: 1.05,
        letterSpacing: "-0.04em",
        color: "#ffffff",
        margin: "0 0 18px 0",
      }}>
        Three layers.
        <br />
        <span style={{
          fontStyle: "italic",
          background: "linear-gradient(135deg, #C0B87A, #427A43, #F2E3BB)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}>
          One complete
        </span>{" "}platform.
      </h2>

      <p style={{
        fontFamily: "var(--font-sans, 'General Sans'), system-ui, sans-serif",
        fontSize: "clamp(13px, 0.95vw, 15px)",
        lineHeight: 1.75, fontWeight: 400,
        color: "rgba(255,255,255,0.5)",
        maxWidth: 400,
        margin: "0 0 44px 0",
      }}>
        Scroll to explore each layer of the operating system
        that powers modern private lending.
      </p>

      <motion.div
        animate={{ y: [0, 6, 0] }}
        transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
        style={{ opacity: 0.2 }}
      >
        <svg width="20" height="32" viewBox="0 0 28 44" fill="none">
          <rect x="1.5" y="1.5" width="25" height="41" rx="12.5" stroke="rgba(255,255,255,0.3)" strokeWidth="0.8"/>
          <motion.circle
            animate={{ cy: [14, 24, 14] }}
            transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
            cx="14" r="2" fill="#C0B87A" opacity="0.4"
          />
        </svg>
      </motion.div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════
   MAIN EXPORT
   ═══════════════════════════════════════════ */
export function ProductBreakdown() {
  const containerRef = useRef(null);
  const scrollPages = TOTAL + 0.6;

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const smoothProgress = useSpring(scrollYProgress, { damping: 50, stiffness: 200 });

  return (
    <>
      <div
        ref={containerRef}
        style={{
          position: "relative",
          height: `${scrollPages * 100}vh`,
          background: "#0a120b",
        }}
      >
        <div style={{
          position: "sticky",
          top: 0, left: 0,
          width: "100%", height: "100vh",
          overflow: "hidden",
        }}>
          {/* Grid */}
          <div style={{
            position: "absolute", inset: 0,
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.01) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.01) 1px, transparent 1px)
            `,
            backgroundSize: "80px 80px",
            pointerEvents: "none",
          }} />

          <Header progress={smoothProgress} />

          {LAYERS.map((layer, i) => {
            const seg = 1 / TOTAL;
            return (
              <LayerSceneWrapper
                key={layer.id}
                layer={layer}
                index={i}
                parentProgress={smoothProgress}
                rangeStart={i * seg}
                rangeEnd={(i + 1) * seg}
              />
            );
          })}

          <LayerNav progress={smoothProgress} />
          <ProgressBar progress={smoothProgress} />
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .layer-nav { display: none !important; }
          .features-row {
            grid-template-columns: 1fr !important;
            gap: 28px !important;
          }
          .feature-col {
            border-left: none !important;
            padding-left: 0 !important;
            border-bottom: 1px solid rgba(255,255,255,0.06);
            padding-bottom: 24px !important;
          }
        }
      `}</style>
    </>
  );
}

function LayerSceneWrapper({ layer, index, parentProgress, rangeStart, rangeEnd }) {
  const localProgress = useTransform(parentProgress, [rangeStart, rangeEnd], [0, 1]);
  return <LayerScene layer={layer} index={index} progress={localProgress} />;
}