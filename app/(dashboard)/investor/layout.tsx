import { InvestorSidebar } from "@/components/investor-sidebar";

export default function InvestorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-100">
      <InvestorSidebar />
      <main className="min-h-screen overflow-y-auto px-5 py-7 md:ml-72 md:px-8 md:py-9">
        {children}
      </main>
    </div>
  );
}
