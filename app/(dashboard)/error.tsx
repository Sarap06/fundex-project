'use client';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="text-center max-w-md">
        <h2 className="text-xl font-display font-semibold text-stone-900 mb-2">Something went wrong</h2>
        <p className="text-stone-500 mb-4">
          {error.message || 'An unexpected error occurred.'}
        </p>
        <button
          onClick={reset}
          className="fdx-btn-primary"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
