export default function DashboardLoading() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="flex items-center gap-3">
        <div className="h-5 w-5 animate-spin  border-2 border-fundex-gold border-t-transparent" />
        <p className="text-stone-400">Loading...</p>
      </div>
    </div>
  );
}
