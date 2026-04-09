export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen bg-white font-sans flex flex-col">
      {/* Warm gradient glow */}
      <div className="pointer-events-none fixed right-0 top-0 z-0 h-[700px] w-[800px]" style={{ background: 'radial-gradient(ellipse at 85% 15%, rgba(192,184,122,0.13) 0%, rgba(242,227,187,0.08) 40%, transparent 70%)' }} />

      {/* Header */}
      <div className="relative z-10 pt-10 pb-4 flex justify-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-fundex-gold text-fundex-forest text-lg font-semibold shadow-sm">
          F
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 flex items-start justify-center px-4 pb-12">
        <div className="w-full max-w-lg">
          {children}
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 pb-6 text-center">
        <p className="text-xs text-stone-400">Your information is secure and private</p>
      </div>
    </div>
  );
}
