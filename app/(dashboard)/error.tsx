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
        <h2 className="text-xl font-display font-bold text-foreground mb-2">Something went wrong</h2>
        <p className="text-muted-foreground mb-4">
          {error.message || 'An unexpected error occurred.'}
        </p>
        <button
          onClick={reset}
          className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition font-medium"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
