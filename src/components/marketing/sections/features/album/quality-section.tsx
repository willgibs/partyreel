import { MonoCaption } from "@/components/marketing/system/mono-caption";
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
        {/* shrink-0 patch (T1): the column window stretches the strip, whose
            cells then flex-shrink from 1.15em to their 40px line box and the
            roll lands 1.4px-per-cell off its digits. System files are closed
            to this track, so the fix rides a wrapper-variant here; the
            one-line upstream fix (shrink-0 on the cell span in
            system/stat-band.tsx, /reel is affected too) is proposed in the
            track report. */}
        <StatBand
          className="[&_[data-mkt-count-strip]>span]:shrink-0"
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
        <MonoCaption className="mt-10 text-center">
          {PHOTO_FORMATS} + {VIDEO_FORMATS}
        </MonoCaption>
        <p className="mx-auto mt-3 max-w-xl text-center text-sm text-pretty text-muted-foreground">
          Photos on every plan, straight off the phone (HEIC included). Video
          uploads come with the paid plans, up to the same ceiling.
        </p>
      </div>
    </SectionShell>
  );
}
