import type { CSSProperties } from "react";

import { Reveal } from "@/components/marketing/system/reveal";
import { SectionShell } from "@/components/marketing/system/section-shell";
import { StatBand } from "@/components/marketing/system/stat-band";
import { GIGABYTE } from "@/lib/constants/tiers";
import { ACCEPTED_MIME, MAX_UPLOAD_BYTES } from "@/lib/media/limits";

import { PHOTO_FORMATS, VIDEO_FORMATS } from "./album-formats";

/**
 * /features/album, chapter 1's wind-down: the quiet numbers before the paper
 * cut. Every figure DERIVES from lib/media/limits.ts (the universal per-file
 * truth: one ceiling, both kinds, every plan; no duration cap) so the band can
 * never drift from enforcement. The StatBand carries the stat register (the
 * display face with tabular figures); the formats beneath are words, so they
 * stay on the body face.
 */
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
        {/* The formats, as two labelled rows, joining the header's rise on
            the slot after its three lines. */}
        <Reveal>
          <dl
            data-mkt-reveal
            className="mx-auto mt-10 grid w-fit grid-cols-[auto_1fr] items-baseline gap-x-5 gap-y-2"
            style={{ "--i": 3 } as CSSProperties}
          >
            <dt className="text-[11px] font-medium tracking-[0.14em] text-muted-foreground/70 uppercase">
              Photos
            </dt>
            <dd className="text-sm text-muted-foreground">
              {PHOTO_FORMATS.join(" · ")}
            </dd>
            <dt className="text-[11px] font-medium tracking-[0.14em] text-muted-foreground/70 uppercase">
              Video
            </dt>
            <dd className="text-sm text-muted-foreground">
              {VIDEO_FORMATS.join(" · ")}
            </dd>
          </dl>
        </Reveal>
      </div>
    </SectionShell>
  );
}
