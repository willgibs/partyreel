import type { MetadataRoute } from "next";

import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/constants/site";

// Web App Manifest (Phase 4): makes an event link installable to a guest's home
// screen, opening app-like (standalone, no browser chrome). Static + global -
// it intentionally leaks nothing event-specific. NO service worker: presigned
// URLs expire and the gallery is conditional-request driven, so offline caching
// is a deliberate post-launch decision (not this phase). The icons are the ink
// aperture mark; the maskable variant keeps it inside the safe zone.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_NAME,
    short_name: SITE_NAME,
    description: SITE_DESCRIPTION,
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#fcfcfc",
    theme_color: "#101010",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icons/icon-512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
