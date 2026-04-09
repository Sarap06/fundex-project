import { InvestorSidebar } from "@/components/investor-sidebar";

export default function InvestorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen bg-white font-sans">
      {/* Warm radial gradient glow */}
      <div
        className="fdx-page-glow-tr"
        style={{ background: 'radial-gradient(ellipse at 85% 15%, rgba(192,184,122,0.13) 0%, rgba(242,227,187,0.08) 40%, transparent 70%)' }}
      />
      <div
        className="fdx-page-glow-bl"
        style={{ background: 'radial-gradient(ellipse at 15% 80%, rgba(192,184,122,0.06) 0%, transparent 60%)' }}
      />

      <InvestorSidebar />
      <main className="relative z-10 min-h-screen overflow-y-auto px-5 py-7 md:ml-72 md:px-8 md:py-9">
        {children}
      </main>
    </div>
  );
}
