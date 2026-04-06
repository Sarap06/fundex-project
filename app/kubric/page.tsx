import type { Metadata } from "next";
import { KubricHero } from "@/components/kubric-hero";

export const metadata: Metadata = {
  title: "FUNDEX — Making your investments outstanding is a Discipline",
  description:
    "We enable the world's most engaged investors and family offices to access professionally managed investment strategies.",
};

export default function KubricPage() {
  return (
    <div className="kubric-page">
      <KubricHero />
    </div>
  );
}
