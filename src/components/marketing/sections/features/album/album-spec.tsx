import type { CSSProperties, ReactNode } from "react";

import { PaperChapter } from "@/components/marketing/system/paper-chapter";
import { Reveal } from "@/components/marketing/system/reveal";
import { SectionShell } from "@/components/marketing/system/section-shell";
import { RECENTLY_DELETED_WINDOW_DAYS } from "@/lib/lifecycle/recently-deleted";
import { MAX_UPLOAD_BYTES, UPLOAD_CAP_PRESETS } from "@/lib/media/limits";
import { formatBytes } from "@/lib/utils";

/**
 * /features/album's paper chapter: ONE document, "the morning after". The
 * spec sheet and the old keeping section folded into six one-sentence rows,
 * because a reader at the desk wants terms to scan down, not two sections to
 * read. It opens a tier up on the hard cut with real air (the chapter's
 * opener), and since the chapter IS this document it needs no ramp after it.
 * Facts derive from lib/media/limits.ts and lib/lifecycle/recently-deleted.ts
 * and mirror content/help/how-guests-join-and-upload.mdx,
 * storage-plans-and-limits.mdx and how-long-media-is-kept.mdx.
 */
export function AlbumSpecChapter() {
  return (
    <PaperChapter>
      <SectionShell
        eyebrow="The fine print"
        heading="What lands, and what stays."
        subhead="Who gets credited, what fits, and how long it stays. No squinting."
        scale="lg"
        reveal="cinema"
        className="pt-28 sm:pt-36"
      >
        <Reveal
          data-mkt-reveal
          className="mx-auto mt-10 max-w-3xl"
          style={{ "--i": 3 } as CSSProperties}
        >
          <dl className="divide-y rounded-2xl border bg-card">
            <SpecRow term="Attribution">
              Signed-in guests pick a display name once and it rides on every
              shot; where you allow anonymous uploads, those show as Anonymous.
            </SpecRow>
            <SpecRow term="Per-file ceiling">
              Up to {formatBytes(MAX_UPLOAD_BYTES)} per photo or video, with no
              duration cap. Video uploads come with Pro and Event Pass.
            </SpecRow>
            <SpecRow term="Your own cap">
              Want a tighter rein for one event? Set a lower per-upload limit
              from the presets:
              <span className="mt-2.5 flex flex-wrap gap-1.5">
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
              No app and no passwords to invent. When you require accounts, on
              by default, guests confirm an email with a one-time code.
            </SpecRow>
            <SpecRow term="No expiry date">
              The album stays up until you delete the event. Deleting is your
              call, never a countdown.
            </SpecRow>
            <SpecRow term="The recovery bin">
              Deleted photos and videos wait {RECENTLY_DELETED_WINDOW_DAYS} days
              in the bin and restore exactly as they were.
            </SpecRow>
          </dl>
        </Reveal>
      </SectionShell>
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
