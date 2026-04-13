import { useRef, useState } from "react";
import {
  motion,
  useInView,
  AnimatePresence,
} from "framer-motion";
import { ArrowUpRight } from "lucide-react";

/* ═══════════════════════════════════════════
   DATA
   ═══════════════════════════════════════════ */
const CASES = [
  {
    num: "01",
    title: "Private Lenders",
    description: "Manage your entire loan lifecycle from origination through servicing. Automate underwriting, document collection, and investor reporting.",
    features: ["Loan origination workflows", "Automated document collection", "Portfolio analytics"],
    accent: "#005F02",
  },
  {
    num: "02",
    title: "Real Estate Syndicators",
    description: "Streamline capital raises, investor communications, and deal management. One platform for all your syndication operations.",
    features: ["Capital raise tracking", "Investor portal access", "Distribution waterfall modeling"],
    accent: "#427A43",
  },
  {
    num: "03",
    title: "Capital Allocators",
    description: "Deploy capital efficiently across multiple lending programs with real-time visibility into portfolio performance and risk metrics.",
    features: ["Multi-fund management", "Risk analytics dashboard", "Automated reporting"],
    accent: "#C0B87A",
  },
  {
    num: "04",
    title: "Investment Firms",
    description: "Institutional-grade infrastructure for managing debt investments. Comprehensive position tracking and investor-facing dashboards.",
    features: ["Position management", "LP reporting tools", "Compliance workflows"],
    accent: "#005F02",
  },
];

/* ═══════════════════════════════════════════
   SINGLE ROW — expandable on click/hover
   ═══════════════════════════════════════════ */
function CaseRow({ data, index, isOpen, onToggle, isInView }) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8, delay: 0.15 + index * 0.1, ease: [0.16, 1, 0.3, 1] }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onToggle}
      style={{
        borderBottom: "1px solid #d4ddd4",
        cursor: "pointer",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Hover background wash */}
      <motion.div
        animate={{ opacity: hovered || isOpen ? 1 : 0 }}
        transition={{ duration: 0.4 }}
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(90deg, ${data.accent}04, transparent 60%)`,
          pointerEvents: "none",
        }}
      />

      {/* ─── Main row ─── */}
      <div style={{
        position: "relative",
        display: "grid",
        gridTemplateColumns: "auto 1fr auto",
        alignItems: "center",
        gap: "clamp(20px, 3vw, 40px)",
        padding: "clamp(24px, 3vw, 40px) 0",
      }} className="case-row-grid">
        {/* Number */}
        <motion.div
          animate={{ color: hovered || isOpen ? data.accent : "#d4ddd4" }}
          transition={{ duration: 0.4 }}
          style={{
            fontFamily: "var(--font-display, 'Trench Slab'), system-ui, serif",
            fontSize: "clamp(36px, 4vw, 56px)",
            fontWeight: 400,
            lineHeight: 1,
            letterSpacing: "-0.04em",
            width: "clamp(48px, 5vw, 72px)",
            userSelect: "none",
          }}
        >
          {data.num}
        </motion.div>

        {/* Title */}
        <motion.h3
          animate={{ color: hovered || isOpen ? "#1a1a1a" : "#5a6b5a" }}
          transition={{ duration: 0.4 }}
          style={{
            fontFamily: "var(--font-display, 'Trench Slab'), system-ui, serif",
            fontSize: "clamp(24px, 2.8vw, 40px)",
            fontWeight: 400,
            lineHeight: 1.1,
            letterSpacing: "-0.03em",
            margin: 0,
          }}
        >
          {data.title}
        </motion.h3>

        {/* Toggle indicator */}
        <motion.div
          animate={{ rotate: isOpen ? 45 : 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          style={{
            width: 36,
            height: 36,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M8 3V13M3 8H13"
              stroke={isOpen ? data.accent : "#d4ddd4"}
              strokeWidth="1.2"
              strokeLinecap="round"
              style={{ transition: "stroke 0.4s" }}
            />
          </svg>
        </motion.div>
      </div>

      {/* ─── Expanded content ─── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            style={{ overflow: "hidden" }}
          >
            <div style={{
              display: "grid",
              gridTemplateColumns: "auto 1fr",
              gap: "clamp(20px, 3vw, 40px)",
              paddingBottom: "clamp(28px, 3.5vw, 48px)",
            }} className="case-expand-grid">
              {/* Spacer to align with title column */}
              <div style={{ width: "clamp(48px, 5vw, 72px)" }} />

              <div style={{
                display: "grid",
                gridTemplateColumns: "1.2fr 1fr",
                gap: "clamp(24px, 3vw, 48px)",
                alignItems: "start",
              }} className="case-expand-inner">
                {/* Description */}
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  style={{
                    fontFamily: "var(--font-sans, 'General Sans'), system-ui, sans-serif",
                    fontSize: "clamp(14px, 1.05vw, 16px)",
                    lineHeight: 1.75,
                    color: "#5a6b5a",
                    margin: 0,
                    maxWidth: 480,
                  }}
                >
                  {data.description}
                </motion.p>

                {/* Features */}
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {data.features.map((f, fi) => (
                    <motion.div
                      key={f}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, delay: 0.15 + fi * 0.08 }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        fontFamily: "var(--font-sans, 'General Sans'), system-ui, sans-serif",
                        fontSize: 13,
                        color: "#5a6b5a",
                      }}
                    >
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: 16 }}
                        transition={{ duration: 0.4, delay: 0.2 + fi * 0.08 }}
                        style={{ height: 1, background: data.accent, flexShrink: 0 }}
                      />
                      {f}
                    </motion.div>
                  ))}

                  {/* CTA */}
                  <motion.a
                    href="#book-demo-section"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.4, delay: 0.4 }}
                    whileHover={{ x: 4 }}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      marginTop: 8,
                      fontFamily: "var(--font-sans, 'General Sans'), system-ui, sans-serif",
                      fontSize: 10,
                      fontWeight: 600,
                      letterSpacing: "2.5px",
                      textTransform: "uppercase",
                      color: data.accent,
                      textDecoration: "none",
                    }}
                  >
                    Learn more
                    <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
                      <path d="M5 15L15 5M15 5H8M15 5V12" stroke={data.accent} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </motion.a>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════
   MARQUEE
   ═══════════════════════════════════════════ */
function Marquee() {
  const items = ["Private Credit", "Fund Management", "Investor Relations", "Deal Tracking", "Capital Deployment", "Portfolio Analytics"];
  const repeated = [...items, ...items, ...items];
  return (
    <div style={{ overflow: "hidden", borderTop: "1px solid #d4ddd4", padding: "16px 0" }}>
      <motion.div
        animate={{ x: ["0%", "-33.333%"] }}
        transition={{ duration: 28, ease: "linear", repeat: Infinity }}
        style={{ display: "flex", gap: 24, whiteSpace: "nowrap", width: "fit-content" }}
      >
        {repeated.map((item, i) => (
          <span key={i} style={{
            fontFamily: "var(--font-display, 'Trench Slab'), system-ui, serif",
            fontSize: "clamp(13px, 1.1vw, 17px)",
            fontStyle: "italic",
            color: "#d4ddd4",
            display: "flex", alignItems: "center", gap: 18,
          }}>
            {item}
            <span style={{ width: 3, height: 3, borderRadius: "50%", background: "#d4ddd4", flexShrink: 0 }} />
          </span>
        ))}
      </motion.div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   MAIN EXPORT
   ═══════════════════════════════════════════ */
export function UseCases() {
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.08 });
  const headerRef = useRef(null);
  const headerInView = useInView(headerRef, { once: true, amount: 0.3 });
  const [openIndex, setOpenIndex] = useState(0);

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
        {/* Grain */}
        <div style={{
          position: "absolute", inset: 0, opacity: 0.35, pointerEvents: "none",
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`,
          backgroundSize: "200px",
        }} />

        <div style={{
          position: "relative", zIndex: 2,
          maxWidth: 1200, margin: "0 auto",
          padding: "clamp(80px, 12vw, 160px) clamp(24px, 5vw, 64px) 0",
        }}>
          {/* ═══ HEADER ═══ */}
          <div ref={headerRef} style={{ marginBottom: "clamp(48px, 6vw, 80px)" }}>
            <div style={{
              display: "grid",
              gridTemplateColumns: "1.4fr 1fr",
              gap: "clamp(24px, 4vw, 64px)",
              alignItems: "end",
            }} className="header-grid">
              {/* Left */}
              <div className="header-left">
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={headerInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                  style={{
                    fontFamily: "var(--font-sans, 'General Sans'), system-ui, sans-serif",
                    fontSize: 10, fontWeight: 600,
                    letterSpacing: "5px", textTransform: "uppercase",
                    color: "#5a6b5a",
                    display: "flex", alignItems: "center", gap: 12,
                    marginBottom: "clamp(20px, 2.5vw, 32px)",
                  }}
                >
                  <span style={{ width: 28, height: 1, background: "#005F02" }} />
                  Who it's for
                </motion.div>

                <motion.h2
                  initial={{ opacity: 0, y: 40 }}
                  animate={headerInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 1, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                  style={{
                    fontFamily: "var(--font-display, 'Trench Slab'), system-ui, serif",
                    fontSize: "clamp(40px, 6vw, 76px)",
                    fontWeight: 400, lineHeight: 1,
                    letterSpacing: "-0.04em",
                    color: "#1a1a1a", margin: 0,
                  }}
                >
                  Built for{" "}
                  <span style={{
                    fontStyle: "italic",
                    background: "linear-gradient(135deg, #005F02, #427A43)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}>
                    every
                  </span>
                  <br />
                  player.
                </motion.h2>
              </div>

              {/* Right */}
              <div className="header-right">
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={headerInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.8, delay: 0.3 }}
                  style={{
                    fontSize: "clamp(14px, 1vw, 16px)",
                    lineHeight: 1.75, color: "#5a6b5a",
                    margin: 0,
                  }}
                >
                  From fund origination to investor distributions,
                  Fundex adapts to your unique workflow — so you can
                  focus on deploying capital, not managing spreadsheets.
                </motion.p>
              </div>
            </div>

            {/* Divider */}
            <motion.div
              initial={{ scaleX: 0 }}
              animate={headerInView ? { scaleX: 1 } : {}}
              transition={{ duration: 1.4, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
              style={{
                height: 1,
                background: "linear-gradient(90deg, #d4ddd4, #005F0233, #d4ddd4, transparent)",
                transformOrigin: "left",
                marginTop: "clamp(40px, 5vw, 60px)",
              }}
            />
          </div>

          {/* ═══ USE CASE ROWS ═══ */}
          <div style={{ borderTop: "1px solid #d4ddd4" }}>
            {CASES.map((c, i) => (
              <CaseRow
                key={c.num}
                data={c}
                index={i}
                isOpen={openIndex === i}
                onToggle={() => setOpenIndex(openIndex === i ? -1 : i)}
                isInView={isInView}
              />
            ))}
          </div>

          {/* ═══ BOTTOM CTA ═══ */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            style={{
              display: "flex", flexWrap: "wrap",
              alignItems: "center", justifyContent: "space-between",
              gap: "16px 32px",
              padding: "clamp(40px, 5vw, 64px) 0",
            }}
          >
            <p className="font-sans text-xl lg:text-2xl font-[500] text-foreground m-0">
              Don&apos;t see your use case?
            </p>
            <a
              href="#book-demo-section"
              className="inline-flex items-center gap-2.5 px-8 py-3.5 bg-foreground text-background font-sans text-[15px] font-[500] no-underline  transition-all hover:opacity-90 hover:-translate-y-0.5"
            >
              Book a Demo
              <ArrowUpRight className="w-4 h-4" strokeWidth={1.5} />
            </a>
          </motion.div>
        </div>

        {/* Marquee */}
        <Marquee />
      </section>

      <style>{`
        @media (max-width: 768px) {
          .header-grid {
            grid-template-columns: 1fr !important;
          }
          .case-row-grid {
            grid-template-columns: auto 1fr auto !important;
          }
          .case-expand-grid {
            grid-template-columns: 1fr !important;
          }
          .case-expand-inner {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </>
  );
}