import { EyeOff, PauseCircle, Scaling, type LucideIcon } from "lucide-react";
import type { CSSProperties } from "react";

import { LearnMoreLink } from "@/components/marketing/sections/shared/learn-more-link";
import { Reveal } from "@/components/marketing/system/reveal";
import { SectionShell } from "@/components/marketing/system/section-shell";
import { UPLOAD_CAP_PRESETS } from "@/lib/media/limits";

import { ReviewSwitch } from "./review-switch";

/**
 * THE PAPER CHAPTER'S OPENER: your album, your call. A tier up on the hard
 * cut with real air, the one interactive object on the desk (the Live |
 * Review switch), and the three controls a host asks about next. The
 * strings are the settings card's own (src/components/app/event-settings/
 * uploads-section.tsx): closing uploads freezes the album, the per-upload cap
 * bounds one guest, hidden stays hidden. Turning review off never drops the
 * queue: it approves it.
 */

const CONTROLS: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: PauseCircle,
    title: "Close uploads whenever you like",
    body: "Turn off to freeze the album. Guests can still view it. Turn it back on at any time.",
  },
  {
    icon: Scaling,
    title: "Cap any single upload",
    body: `Max size per upload, from ${UPLOAD_CAP_PRESETS[UPLOAD_CAP_PRESETS.length - 1].label} to ${UPLOAD_CAP_PRESETS[1].label}, so one guest cannot fill your storage. Your own uploads are not affected.`,
  },
  {
    icon: EyeOff,
    title: "Hidden stays hidden",
    body: "Hide a photo and it leaves everyone's album at once. It stays dimmed in yours, one tap from coming back.",
  },
];

export function YourCallSection() {
  return (
    <SectionShell
      eyebrow="Your call"
      heading="Live as it happens, or held for you."
      subhead="Guests only ever see approved photos. Whether that means the moment they land, or after you say so, is one switch."
      scale="lg"
      reveal="cinema"
      className="pt-28 sm:pt-36"
    >
      <Reveal className="mt-10">
        <div data-mkt-reveal style={{ "--i": 3 } as CSSProperties}>
          <ReviewSwitch />
        </div>
      </Reveal>

      <Reveal className="mx-auto mt-14 grid max-w-4xl gap-x-8 gap-y-8 sm:grid-cols-3">
        {CONTROLS.map((control, i) => (
          <div
            key={control.title}
            data-mkt-reveal
            className="flex flex-col gap-2.5"
            style={{ "--i": i } as CSSProperties}
          >
            <span className="flex size-9 items-center justify-center rounded-lg border text-muted-foreground">
              <control.icon className="size-4.5" strokeWidth={1.5} />
            </span>
            <h3 className="font-heading text-base sm:text-lg">
              {control.title}
            </h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {control.body}
            </p>
          </div>
        ))}
        <div
          data-mkt-reveal
          className="sm:col-span-3"
          style={{ "--i": 3 } as CSSProperties}
        >
          <LearnMoreLink href="/features/curation">
            Curation, in depth
          </LearnMoreLink>
        </div>
      </Reveal>
    </SectionShell>
  );
}
