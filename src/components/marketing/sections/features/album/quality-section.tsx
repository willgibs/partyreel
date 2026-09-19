import type { CSSProperties } from "react";

import { Reveal } from "@/components/marketing/system/reveal";
import { SectionLight } from "@/components/marketing/system/section-light";
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
 *
 * ★ THE PAGE'S SECOND LIGHT IS A FLOOR HERE (Will, `second=floor`, 2026-09-19).
 * The hero's halo is the page's first light and it is a long way above; this is
 * the last dark section before the chapter turns, so it takes the Aurora at its
 * BOTTOM edge only, rising from the line it shares with what comes next, and
 * the top stays dark so the numbers land in quiet. `both` would put a second
 * bright line under the section above and the chapter would read as lit end to
 * end. The home page's closer takes the same composition for the same reason
 * (`cinema-close.tsx`); no two sections on a page share one (section-light.tsx:
 * compose it for the place).
 *
 * ★ AND THE PHOTOGRAPH BELOW IS WHY IT READS AT ALL. His note on the pick: "the
 * paper chapter directly beneath and the brightness from his white overwhelms
 * the aurora here and makes it less noticeable. Would work much better with a
 * full image background section beneath so it feels like it's glowing from
 * that, with a less harsh contrast at the transition." So this floor is half of
 * a pair: `page.tsx` stands a `PhotoSection` under it, and the Aurora rises into
 * a photograph instead of into paper.
 */
export function QualitySection() {
  return (
    <SectionLight placement="bottom" reach="58%">
      <QualityBody />
    </SectionLight>
  );
}

function QualityBody() {
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
            <dt className="text-[11px] font-medium tracking-[0.14em] text-faint uppercase">
              Photos
            </dt>
            <dd className="text-sm text-muted-foreground">
              {PHOTO_FORMATS.join(" · ")}
            </dd>
            <dt className="text-[11px] font-medium tracking-[0.14em] text-faint uppercase">
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
