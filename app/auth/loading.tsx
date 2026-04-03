export default function AuthLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-fundex-cream to-fundex-cream flex items-center justify-center p-4">
      <div className="bg-background rounded-lg shadow-2xl p-8 max-w-md w-full text-center">
        <div className="flex items-center justify-center gap-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-foreground">Loading...</p>
        </div>
      </div>
    </div>
  );
}
