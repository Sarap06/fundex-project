import type { Metadata } from "next";
import { Toaster } from "sonner";
import { Providers } from "@/components/providers";
import "./globals.css";
import "./kubric/kubric.css";

export const metadata: Metadata = {
  title: "Fundex - Private Lending Solutions | Miami, FL",
  description:
    "Fundex provides fast, flexible private lending solutions for real estate investors and developers. Bridge loans, fix & flip, construction financing in Miami and nationwide.",
  authors: [{ name: "Fundex" }],
  openGraph: {
    type: "website",
    title: "Fundex - Private Lending Solutions",
    description:
      "Fast, flexible private lending for real estate investors and developers. Bridge loans, fix & flip, construction financing.",
    images: [
      {
        url: "https://storage.googleapis.com/gpt-engineer-file-uploads/aMjanxrDoUP1QJ5krTWiqhWnSbF3/uploads/1758710472461-logo-icon-BG-circle%20copy.png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Fundex - Private Lending Solutions",
    description:
      "Fast, flexible private lending for real estate investors and developers. Bridge loans, fix & flip, construction financing.",
  },
  icons: {
    icon: "https://storage.googleapis.com/gpt-engineer-file-uploads/aMjanxrDoUP1QJ5krTWiqhWnSbF3/uploads/1758710472461-logo-icon-BG-circle%20copy.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://api.fontshare.com" />
        <link
          href="https://api.fontshare.com/v2/css?f[]=general-sans@300,400,500,600,700&f[]=trench-slab@400,700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased">
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
