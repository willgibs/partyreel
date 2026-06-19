import type { Metadata, Viewport } from "next";
import { Geist_Mono, Inter, Urbanist } from "next/font/google";
import "./globals.css";

import { Providers } from "@/components/providers";
import { Toaster } from "@/components/ui/sonner";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/constants/site";

// Font CSS variables must match the names referenced in globals.css
// (--font-sans / --font-mono in @theme; --font-display consumed by the
// font-heading utility's five-knob display layer). Renaming one side without
// the other silently drops the typeface back to the browser default.
const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

// THE IDENTITY FACE: Urbanist (replaced Instrument Serif 2026-06-19, Will's
// call - the serif read too thin). Loaded as the VARIABLE font (full weight
// axis) so the font-heading utility's bold (700) applies everywhere through the
// one swappable token. next/font self-hosts it (build-time download, our domain).
const urbanist = Urbanist({
  variable: "--font-display",
  subsets: ["latin"],
});

// metadataBase makes the file-based opengraph-image + relative metadata URLs
// resolve to absolute (Next errors on relative OG URLs without it). Falls back to
// the prod origin so the build is correct even when NEXT_PUBLIC_SITE_URL is unset.
// openGraph/twitter omit title/description on purpose — Next inherits the resolved
// `title` (incl. the "%s · Partyreel" template) and `description` per route, so a
// child page's title flows into its share card automatically.
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
  },
};

// The browser UI tint per scheme (Phase 4 PWA): ink in dark, paper in light,
// matching the mono system so the standalone status bar / address bar blends in.
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fcfcfc" },
    { media: "(prefers-color-scheme: dark)", color: "#101010" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // <html> carries suppressHydrationWarning because next-themes sets the theme
  // class (+ color-scheme) on it in a pre-paint script, so the server-rendered
  // and hydrated class attribute differ by design. Scoped to this element only.
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${geistMono.variable} ${urbanist.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <Providers>{children}</Providers>
        <Toaster />
      </body>
    </html>
  );
}
