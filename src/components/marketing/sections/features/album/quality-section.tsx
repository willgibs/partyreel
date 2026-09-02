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
 * /features/album, chapter 1's wind-down: the quiet numbers before the paper
 * cut. Every figure DERIVES from lib/media/limits.ts (the universal per-file
 * truth: one ceiling, both kinds, every plan; no duration cap) so the band can
 * never drift from enforcement. One line of copy, by the reading rule.
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

export const PHOTO_FORMATS = ACCEPTED_PHOTO_MIME.map(formatName).join(" · ");
export const VIDEO_FORMATS = ACCEPTED_VIDEO_MIME.map(formatName).join(" · ");
/** The FAQ's comma-joined forms (a middot list reads as a spec, not a sentence). */
export const PHOTO_FORMATS_PROSE = ACCEPTED_PHOTO_MIME.map(formatName).join(", ");
export const VIDEO_FORMATS_PROSE = ACCEPTED_VIDEO_MIME.map(formatName).join(", ");

export function QualitySection() {
  return (
    <SectionShell
      eyebrow="Full quality"
      heading="Nothing gets squeezed."
      subhead="Originals in, originals out. Photos on every plan, video on Pro and Event Pass."
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
        {/* The formats, as two labelled rows (a "+" between the kinds once
            parsed as "AVIF + MP4"); the block joins the header's rise on the
            slot after its three lines. */}
        <Reveal>
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
        </Reveal>
      </div>
    </SectionShell>
  );
}
