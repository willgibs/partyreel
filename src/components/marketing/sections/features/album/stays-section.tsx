import Image from "next/image";
import type { CSSProperties } from "react";

import { LearnMoreLink } from "@/components/marketing/sections/shared/learn-more-link";
import { Reveal } from "@/components/marketing/system/reveal";
import { SectionShell } from "@/components/marketing/system/section-shell";
import { marketingImage } from "@/lib/constants/marketing-media";
import { binCountdownLabel } from "@/lib/lifecycle/recently-deleted";

import { STAYS } from "./album-copy";

/**
 * IT STAYS: the album's whole life as one device, two rows on one hairline
 * grid. Row one is the life (four steps, Inter ordinals, the app's own
 * countdown chip on the Deleted tile under "You delete"); row two the three
 * honest notes on the same grid. The desk CLOSES on a drawn rule
 * ([data-mkt-rule], the masthead hairline), since its opener carried the cut:
 * two devices at one cut would be noise, so they sit at opposite ends.
 * Every number derives (recently-deleted, inactivity, over-capacity).
 */

const TICK = "absolute -top-px left-0 h-px w-8 bg-foreground";
const ORDINAL = "text-xs font-medium text-faint tabular-nums";

export function StaysSection() {
  return (
    <SectionShell
      eyebrow="Keeping it"
      heading="It stays."
      subhead={STAYS.subhead}
    >
      <Reveal
        className="mx-auto mt-12 max-w-5xl"
        style={{ "--mkt-stagger-ms": "70ms" } as CSSProperties}
      >
        {/* The drawn rule the desk closes on. */}
        <div
          aria-hidden
          data-mkt-rule
          className="h-px w-full bg-foreground/25"
        />

        <ol className="grid gap-8 pt-6 sm:grid-cols-4 sm:gap-6">
          {STAYS.steps.map((step, i) => (
            <li
              key={step.title}
              data-mkt-reveal
              className="relative flex flex-col gap-2"
              style={{ "--i": 3 + i } as CSSProperties}
            >
              <span className={ORDINAL}>0{i + 1}</span>
              <h3 className="font-heading text-subsection">{step.title}</h3>
              <p className="text-sm leading-relaxed text-pretty text-muted-foreground">
                {step.body}
              </p>
              {i === 2 && (
                <span
                  aria-hidden
                  className="relative mt-1 block aspect-[4/3] w-32 overflow-hidden rounded-tile bg-muted"
                >
                  <Image
                    src={marketingImage("wedding-petals").src}
                    alt=""
                    fill
                    sizes="96px"
                    className="object-cover opacity-80"
                  />
                  <span className="absolute bottom-1 left-1 rounded-full bg-background/90 px-1.5 py-0.5 text-[10px] font-medium whitespace-nowrap tabular-nums">
                    {binCountdownLabel(29)}
                  </span>
                </span>
              )}
            </li>
          ))}
        </ol>

        <div className="mt-14 grid gap-8 sm:grid-cols-3 sm:gap-6">
          {STAYS.notes.map((note, i) => (
            <div
              key={note.title}
              data-mkt-reveal
              className="relative flex flex-col gap-2 border-t pt-4"
              style={{ "--i": 7 + i } as CSSProperties}
            >
              <span className={TICK} />
              <h3 className="font-heading text-card-title">{note.title}</h3>
              <p className="text-sm leading-relaxed text-pretty text-muted-foreground">
                {note.body}
              </p>
            </div>
          ))}
        </div>

        <div
          data-mkt-reveal
          className="mt-10 flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between"
          style={{ "--i": 10 } as CSSProperties}
        >
          <p className="text-xs text-muted-foreground">{STAYS.backup}</p>
          <LearnMoreLink href="/help/how-long-media-is-kept">
            How long media is kept
          </LearnMoreLink>
        </div>
      </Reveal>
    </SectionShell>
  );
}
