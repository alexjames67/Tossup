import type { Metadata, Viewport } from "next";
import { Inter, Geist_Mono, Space_Grotesk, Bungee } from "next/font/google";
import "./globals.css";

// Body + UI: clean humanist sans.
const inter = Inter({
  variable: "--font-sans-custom",
  subsets: ["latin"],
});

// Numerals + code: monospace with tabular figures.
const geistMono = Geist_Mono({
  variable: "--font-mono-custom",
  subsets: ["latin"],
});

// Display headlines: modern geometric grotesque.
const spaceGrotesk = Space_Grotesk({
  variable: "--font-display-base",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

// Funky theme display font.
const bungee = Bungee({
  variable: "--font-funky",
  subsets: ["latin"],
  weight: ["400"],
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

// Set the saved theme before first paint to avoid a flash, without touching
// React state (so no hydration mismatch).
const themeScript = `(function(){try{var t=localStorage.getItem('pyramidal-buzz:theme');document.documentElement.dataset.theme=(t==='light'||t==='funky'||t==='dark')?t:'dark';}catch(e){document.documentElement.dataset.theme='dark';}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${geistMono.variable} ${spaceGrotesk.variable} ${bungee.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full flex flex-col font-sans text-fg">
        {children}
      </body>
    </html>
  );
}
