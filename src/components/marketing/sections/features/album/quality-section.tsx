import type { CSSProperties } from "react";

import { Reveal } from "@/components/marketing/system/reveal";
import { SectionShell } from "@/components/marketing/system/section-shell";
import { StatBand } from "@/components/marketing/system/stat-band";
import { GIGABYTE } from "@/lib/constants/tiers";
import {
  ACCEPTED_MIME,
  ACCEPTED_PHOTO_MIME,
  ACCEPTED_VIDEO_MIME,
  MAX_UPLOAD_BYTES,
  MIME_TO_EXT,
} from "@/lib/media/limits";

/**
 * /features/album section 2: the FactBand. Every number DERIVES from
 * lib/media/limits.ts (the universal per-file truth: 10 GB is the only gate,
 * both kinds, every plan; no duration cap) so the band can never drift from
 * enforcement. The formats line renders human names for the accepted MIMEs.
 */

/** Human names for the accepted MIME types (photos read as JPEG, not JPG).
 *  Anything without a friendly override falls back to the canonical extension
 *  from MIME_TO_EXT uppercased, so a NEW type in limits.ts shows up here
 *  automatically instead of silently missing. */
const FRIENDLY_FORMAT: Record<string, string> = {
  "image/jpeg": "JPEG",
  "image/webp": "WebP",
  "video/webm": "WebM",
};

function formatName(mime: string): string {
  return FRIENDLY_FORMAT[mime] ?? (MIME_TO_EXT[mime] ?? mime).toUpperCase();
}

const PHOTO_FORMATS = ACCEPTED_PHOTO_MIME.map(formatName).join(" · ");
const VIDEO_FORMATS = ACCEPTED_VIDEO_MIME.map(formatName).join(" · ");

export function QualitySection() {
  return (
    <SectionShell
      eyebrow="Full quality"
      heading="Full quality in, full quality out."
      subhead="No messaging-app squeeze, no surprise downscale. The album keeps exactly what the camera made."
    >
      <div className="mt-12">
        <StatBand
          stats={[
            {
              // 10, derived from the enforced ceiling (limits.ts), never typed.
              value: MAX_UPLOAD_BYTES / GIGABYTE,
              suffix: " GB",
              label: "per upload, every plan",
            },
            { value: 0, label: "re-compression, ever" },
            { value: ACCEPTED_MIME.length, label: "file formats accepted" },
          ]}
        />
        {/* R4 body choreography: the formats block used to pop in statically
            under an animated header, so it joins the header's rise with --i
            continuing after the eyebrow/heading/subhead slots (0-2). The
            StatBand above owns its own in-view counter and stays out of it. */}
        <Reveal>
          {/* R4 / review B29: one run of dot-separated names with a "+" in the
              middle parsed as "AVIF + MP4". The two kinds get their own labeled
              rows, so the divider is structural rather than punctuation. */}
          <dl
            data-mkt-reveal
            className="mx-auto mt-10 grid w-fit grid-cols-[auto_1fr] items-baseline gap-x-4 gap-y-2 font-mono text-xs tracking-wide"
            style={{ "--i": 3 } as CSSProperties}
          >
            <dt className="text-muted-foreground/60 uppercase">Photos</dt>
            <dd className="text-muted-foreground">{PHOTO_FORMATS}</dd>
            <dt className="text-muted-foreground/60 uppercase">Video</dt>
            <dd className="text-muted-foreground">{VIDEO_FORMATS}</dd>
          </dl>
          <p
            data-mkt-reveal
            className="mx-auto mt-4 max-w-xl text-center text-sm text-pretty text-muted-foreground"
            style={{ "--i": 4 } as CSSProperties}
          >
            Photos on every plan, straight off the phone (HEIC included). Video
            uploads come with Pro and Event Pass, up to the same ceiling.
          </p>
        </Reveal>
      </div>
    </SectionShell>
  );
}
