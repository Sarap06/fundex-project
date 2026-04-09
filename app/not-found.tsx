import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="relative min-h-screen bg-white font-sans flex items-center justify-center p-4">
      <div className="pointer-events-none fixed right-0 top-0 z-0 h-[700px] w-[800px]" style={{ background: 'radial-gradient(ellipse at 85% 15%, rgba(192,184,122,0.13) 0%, rgba(242,227,187,0.08) 40%, transparent 70%)' }} />
      <div className="relative z-10 text-center max-w-md">
        <h1 className="text-6xl font-display font-semibold text-fundex-gold mb-4">404</h1>
        <h2 className="text-xl font-display font-semibold text-stone-900 mb-2">Page not found</h2>
        <p className="text-stone-500 mb-6">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/"
          className="fdx-btn-primary inline-block"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
