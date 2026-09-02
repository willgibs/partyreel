import { ChevronDown, EyeOff } from "lucide-react";
import Image from "next/image";
import type { CSSProperties, ReactNode } from "react";

import { LearnMoreLink } from "@/components/marketing/sections/shared/learn-more-link";
import { Reveal } from "@/components/marketing/system/reveal";
import { SectionShell } from "@/components/marketing/system/section-shell";
import { marketingImage } from "@/lib/constants/marketing-media";
import { UPLOAD_CAP_PRESETS } from "@/lib/media/limits";

import { YOUR_CALL } from "./album-copy";
import { ReviewSwitch } from "./review-switch";

/**
 * THE PAPER CHAPTER'S OPENER: your album, your call. A tier up on the hard
 * cut with real air, the one interactive object on the desk (the Live |
 * Review switch), then the other three controls as what they are: SETTINGS,
 * drawn as one ruled settings document with the real control shapes beside
 * their labels (the settings card in src/components/app/event-settings/
 * uploads-section.tsx, whose strings are pinned by mock-parity), not as three
 * marketing bullets with icon squares.
 */

/** A resting "on" switch in the shipped Switch's proportions. */
function SwitchLook() {
  return (
    <span className="inline-flex h-[18px] w-8 shrink-0 items-center rounded-full bg-primary">
      <span className="mr-0.5 ml-auto size-4 rounded-full bg-background" />
    </span>
  );
}

/** A resting select in the shipped trigger's proportions. */
function SelectLook({ value }: { value: string }) {
  return (
    <span className="inline-flex h-8 items-center gap-2 rounded-lg border bg-background px-2.5 text-sm tabular-nums">
      {value}
      <ChevronDown className="size-3.5 text-muted-foreground" />
    </span>
  );
}

/** Three album tiles, one hidden: dimmed under the amber eye, as the host sees it. */
function HiddenStrip() {
  return (
    <span className="grid w-[6.75rem] grid-cols-3 gap-1">
      {["wedding-golden", "party-dj", "party-balloons"].map((id, i) => (
        <span
          key={id}
          className="relative block aspect-square overflow-hidden rounded-[3px] bg-muted"
        >
          <Image
            src={marketingImage(id).src}
            alt=""
            fill
            sizes="40px"
            className={i === 1 ? "object-cover opacity-30" : "object-cover"}
          />
          {i === 1 && (
            <span className="absolute inset-0 flex items-center justify-center text-warning">
              <EyeOff className="size-3.5" />
            </span>
          )}
        </span>
      ))}
    </span>
  );
}

const CONTROLS: ReactNode[] = [
  <SwitchLook key="switch" />,
  <SelectLook key="select" value={UPLOAD_CAP_PRESETS[1].label} />,
  <HiddenStrip key="hidden" />,
];

export function YourCallSection() {
  return (
    <SectionShell
      eyebrow="Your call"
      heading="Live as it happens, or held for you."
      subhead={YOUR_CALL.subhead}
      scale="lg"
      reveal="cinema"
      className="pt-28 sm:pt-36"
    >
      <Reveal className="mt-10">
        <div data-mkt-reveal style={{ "--i": 3 } as CSSProperties}>
          <ReviewSwitch />
        </div>
      </Reveal>

      {/* The settings document: calm, so it lands as ONE block (a settings
          card is read, not performed), on the slot after the switch. */}
      <Reveal className="mx-auto mt-14 max-w-2xl">
        <div
          data-mkt-reveal
          aria-hidden
          className="divide-y rounded-xl border bg-card/40"
          style={{ "--i": 4 } as CSSProperties}
        >
          {YOUR_CALL.settings.map((row, i) => (
            <div
              key={row.title}
              className="flex flex-col items-start gap-3 px-5 py-4 transition-colors duration-150 hover:bg-muted/40 sm:flex-row sm:items-center sm:justify-between sm:gap-6"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium">{row.title}</p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {row.body}
                </p>
              </div>
              <div className="shrink-0">{CONTROLS[i]}</div>
            </div>
          ))}
        </div>
        <div
          data-mkt-reveal
          className="mt-6 flex justify-center"
          style={{ "--i": 5 } as CSSProperties}
        >
          <LearnMoreLink href="/features/curation">
            Curation, in depth
          </LearnMoreLink>
        </div>
      </Reveal>
    </SectionShell>
  );
}
