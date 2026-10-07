"use client";

import { SITE_THESIS } from "@/lib/constants/marketing-voice";

import type { Drawing } from "./candidates";
import { Word } from "./sheet";

/**
 * THE SOCIAL CARD, where a link to Partyreel unfurls (`src/app/opengraph-image.tsx`,
 * 1200 by 630), its layout retyped from the file value for value: the ink-dark
 * card, the wordmark at 80px tall from its one path, the thesis under it and
 * the line under that. It is the largest the wordmark is ever seen by a
 * stranger, so it draws the display cut. Production draws it through satori
 * with its own built-in face; the board sets the words in the page's, which
 * judges the mark, not the face.
 */
export function SocialCard({ mark }: { mark: Drawing }) {
  return (
    <div
      className="flex min-h-screen flex-col justify-center"
      style={{ background: "#0d0d0d", padding: 96, color: "#fafafa" }}
    >
      <div data-bm-where="the wordmark on the social card">
        <Word mark={mark} height={80} read="the wordmark on the social card" />
      </div>
      <div
        style={{
          marginTop: 56,
          fontSize: 56,
          fontWeight: 600,
          lineHeight: 1.1,
          maxWidth: 880,
          letterSpacing: "-0.02em",
        }}
      >
        {SITE_THESIS}
      </div>
      <div style={{ marginTop: 28, fontSize: 30, color: "#a1a1aa" }}>
        Guests scan one QR code and upload. No app required.
      </div>
    </div>
  );
}
