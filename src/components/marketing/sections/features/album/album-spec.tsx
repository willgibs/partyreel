import type { CSSProperties, ReactNode } from "react";

import { PaperChapter } from "@/components/marketing/system/paper-chapter";
import { Reveal } from "@/components/marketing/system/reveal";
import { SectionShell } from "@/components/marketing/system/section-shell";
import { MAX_UPLOAD_BYTES, UPLOAD_CAP_PRESETS } from "@/lib/media/limits";
import { formatBytes } from "@/lib/utils";

/**
 * /features/album paper chapter: the reading half. Two sections composed by the
 * page inside ONE PaperChapter (the chapter doctrine): the spec sheet of what
 * lands in the album, then the keeping story. Facts derive from
 * lib/media/limits.ts (ceiling + host cap presets) and mirror
 * content/help/how-guests-join-and-upload.mdx / how-long-media-is-kept.mdx.
 */

/** The page's one paper chapter: both reading sections inside a single cut. */
export function AlbumSpecChapter() {
  return (
    <PaperChapter>
      <WhatLandsSection />
      <KeepingSection />
    </PaperChapter>
  );
}

function SpecRow({ term, children }: { term: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2 px-5 py-5 sm:flex-row sm:gap-8 sm:px-6">
      <dt className="w-40 shrink-0 font-mono text-xs tracking-wide text-muted-foreground uppercase sm:pt-0.5">
        {term}
      </dt>
      <dd className="text-sm leading-relaxed text-pretty">{children}</dd>
    </div>
  );
}

export function WhatLandsSection() {
  return (
    <SectionShell
      eyebrow="The spec sheet"
      heading="What lands in your album."
      subhead="The fine print, without the squinting: who gets credited, what fits, and what your guests never have to do."
    >
      <Reveal
        data-mkt-reveal
        className="mx-auto mt-10 max-w-3xl"
        style={{ "--i": 0 } as CSSProperties}
      >
        <dl className="divide-y rounded-2xl border bg-card">
          <SpecRow term="Attribution">
            Signed-in guests pick a display name once, and it travels with every
            shot they add. Where you allow anonymous uploads, those show as
            &ldquo;Anonymous&rdquo; in the album.
          </SpecRow>
          <SpecRow term="Per-file ceiling">
            Up to {formatBytes(MAX_UPLOAD_BYTES)} per photo or video, on every
            plan. Size is the only gate; there is no duration cap on video.
          </SpecRow>
          <SpecRow term="Your own cap">
            Prefer a tighter rein for one event? Set a per-upload limit from
            presets that run all the way down from {UPLOAD_CAP_PRESETS[0].label}
            :
            <span className="mt-2.5 flex flex-wrap gap-1.5">
              {/* The REAL preset ladder the host settings offer (limits.ts). */}
              {UPLOAD_CAP_PRESETS.map((preset) => (
                <span
                  key={preset.label}
                  className="rounded-full border px-2.5 py-0.5 font-mono text-[11px] text-muted-foreground"
                >
                  {preset.label}
                </span>
              ))}
            </span>
          </SpecRow>
          <SpecRow term="Nothing to chase">
            No app to install and no passwords to invent. Guests verify an email
            with a one-time code only when you require accounts (on by default
            for new events); otherwise they just upload.
          </SpecRow>
        </dl>
      </Reveal>
    </SectionShell>
  );
}

export function KeepingSection() {
  return (
    <SectionShell
      width="narrow"
      eyebrow="Keeping it"
      heading="Albums do not expire."
      subhead="An event stays up until you decide otherwise, so the album keeps working long after the last dance."
    >
      <Reveal className="mx-auto mt-10 grid max-w-2xl gap-4 sm:grid-cols-2">
        <div
          data-mkt-reveal
          className="flex flex-col gap-1.5 rounded-xl border bg-card p-5"
          style={{ "--i": 0 } as CSSProperties}
        >
          <h3 className="font-heading text-lg sm:text-xl">No expiry date</h3>
          <p className="text-sm leading-relaxed text-muted-foreground">
            The album never quietly disappears. It stays live until you delete
            the event, and deleting is always your call, not a countdown.
          </p>
        </div>
        <div
          data-mkt-reveal
          className="flex flex-col gap-1.5 rounded-xl border bg-card p-5"
          style={{ "--i": 1 } as CSSProperties}
        >
          <h3 className="font-heading text-lg sm:text-xl">
            A 30-day safety net
          </h3>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Deleted photos and videos wait 30 days in the recovery bin before
            they are gone for good, so a slip of the thumb is not a disaster.
          </p>
        </div>
      </Reveal>
    </SectionShell>
  );
}
