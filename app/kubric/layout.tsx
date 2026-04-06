import type { Metadata } from "next";
import "./kubric.css";

export const metadata: Metadata = {
  title: "FUNDEX — Private Lending Solutions",
  description:
    "We enable the world's most engaged investors and family offices to access professionally managed investment strategies.",
};

export default function KubricLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
