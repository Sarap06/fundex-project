export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <div className="pt-10 pb-4 flex justify-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500 text-lg font-bold text-white shadow-sm shadow-emerald-500/25">
          F
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-start justify-center px-4 pb-12">
        <div className="w-full max-w-lg">
          {children}
        </div>
      </div>

      {/* Footer */}
      <div className="pb-6 text-center">
        <p className="text-xs text-slate-400">Your information is secure and private</p>
      </div>
    </div>
  );
}
