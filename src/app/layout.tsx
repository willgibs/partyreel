import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { Providers } from "@/components/providers";
import { Toaster } from "@/components/ui/sonner";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/constants/site";

// Font CSS variables must match the names referenced in globals.css `@theme`
// (--font-sans / --font-mono). Renaming one side without the other silently
// drops the typeface back to the browser default.
const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-mono",
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <Providers>{children}</Providers>
        <Toaster />
      </body>
    </html>
  );
}
