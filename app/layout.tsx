import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fundex - Private Lending Solutions | Miami, FL",
  description: "Fundex provides fast, flexible private lending solutions for real estate investors and developers. Bridge loans, fix & flip, construction financing in Miami and nationwide.",
  authors: [{ name: "Fundex" }],
  openGraph: {
    type: "website",
    title: "Fundex - Private Lending Solutions",
    description: "Fast, flexible private lending for real estate investors and developers. Bridge loans, fix & flip, construction financing.",
    images: [
      {
        url: "https://storage.googleapis.com/gpt-engineer-file-uploads/aMjanxrDoUP1QJ5krTWiqhWnSbF3/uploads/1758710472461-logo-icon-BG-circle%20copy.png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Fundex - Private Lending Solutions",
    description: "Fast, flexible private lending for real estate investors and developers. Bridge loans, fix & flip, construction financing.",
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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Bagel+Fat+One&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
