import type { Metadata, Viewport } from "next";
import { Inter, Geist_Mono, Fraunces } from "next/font/google";
import "./globals.css";

// Humanist sans for body + UI (the spec's named fallback for Styrene A).
const inter = Inter({
  variable: "--font-sans-custom",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-mono-custom",
  subsets: ["latin"],
});

// Literary serif for display headlines.
const fraunces = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Pyramidal Buzz — the daily quizbowl tossup",
  description:
    "A daily pyramid of clues about one answer. Buzz early for more points, or wait for an easier clue. One puzzle a day for everyone.",
  applicationName: "Pyramidal Buzz",
};

export const viewport: Viewport = {
  themeColor: "#111317",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${geistMono.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans text-fg">
        {children}
      </body>
    </html>
  );
}
