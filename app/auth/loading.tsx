export default function AuthLoading() {
  return (
    <div className="relative min-h-screen bg-white font-sans flex items-center justify-center p-4">
      <div className="pointer-events-none fixed right-0 top-0 z-0 h-[700px] w-[800px]" style={{ background: 'radial-gradient(ellipse at 85% 15%, rgba(192,184,122,0.13) 0%, rgba(242,227,187,0.08) 40%, transparent 70%)' }} />
      <div className="relative z-10  border border-stone-100 bg-white shadow-sm p-8 max-w-md w-full text-center">
        <div className="flex items-center justify-center gap-3">
          <div className="h-5 w-5 animate-spin  border-2 border-fundex-gold border-t-transparent" />
          <p className="text-stone-500">Loading...</p>
        </div>
      </div>
    </div>
  );
}
