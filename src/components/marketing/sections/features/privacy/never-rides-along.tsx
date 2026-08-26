import {
  ListChecks,
  MailCheck,
  MapPinOff,
  SearchX,
  type LucideIcon,
} from "lucide-react";
import type { CSSProperties } from "react";

import { Reveal } from "@/components/marketing/system/reveal";
import { SectionShell } from "@/components/marketing/system/section-shell";

/**
 * The quiet-protections section: what an upload does NOT carry with it. Four
 * named claims (specifics over adjectives, the home-privacy register) beside a
 * settings-card mock quoting the real Guest uploads card
 * (components/app/event-settings/uploads-section.tsx): same row labels, same
 * helper copy, switches resting in their default-on state. Static on purpose;
 * the access switch above is this page's one moving part.
 */

const CLAIMS: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: MapPinOff,
    // The RATIFIED metadata wording, verbatim (never extended).
    title: "Location data stays on the phone",
    body: "EXIF and GPS metadata are stripped in the browser before a photo ever uploads.",
  },
  {
    icon: SearchX,
    title: "Share links stay out of search engines",
    body: "Public means people with your link, not the open internet. An album is never something a stranger finds by searching.",
  },
  {
    icon: ListChecks,
    title: "Nothing has to go public unreviewed",
    body: "Turn on review and every upload waits for your approval before anyone else sees it.",
  },
  {
    icon: MailCheck,
    title: "A verified email to upload",
    body: "New events ask every uploader to confirm their email with a one-time code first. Free on every plan, on by default.",
  },
];

export function NeverRidesAlong() {
  return (
    <SectionShell
      eyebrow="Quiet protections"
      heading="What never rides along."
      subhead="Most of the privacy work happens before a photo is ever visible, in defaults you never have to think about."
    >
      <Reveal className="mx-auto mt-12 grid max-w-4xl items-center gap-x-12 gap-y-10 lg:grid-cols-[1fr_minmax(0,21rem)]">
        <div className="grid gap-x-10 gap-y-8 sm:grid-cols-2">
          {CLAIMS.map((claim, i) => (
            <div
              key={claim.title}
              data-mkt-reveal
              className="flex items-start gap-4"
              style={{ "--i": i } as CSSProperties}
            >
              <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg border text-muted-foreground">
                <claim.icon className="size-4.5" strokeWidth={1.5} />
              </span>
              <div className="flex flex-col gap-1">
                <h3 className="font-heading text-base sm:text-lg">
                  {claim.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {claim.body}
                </p>
              </div>
            </div>
          ))}
        </div>
        <div data-mkt-reveal style={{ "--i": 4 } as CSSProperties}>
          <SettingsMock />
        </div>
      </Reveal>
    </SectionShell>
  );
}

/** The Guest uploads settings card, quoted (labels + helpers + default-on). */
function SettingsMock() {
  return (
    <div
      aria-hidden
      className="rounded-2xl border bg-card p-5 ring-1 ring-foreground/5 select-none"
    >
      <p className="text-sm font-medium">Guest uploads</p>
      <p className="mt-0.5 text-xs text-muted-foreground">
        Control whether and how guests contribute.
      </p>
      <div className="mt-4 flex flex-col gap-4">
        <MockSwitchRow
          label="Review uploads before they appear"
          helper="Hold new photos for your approval instead of showing them live."
        />
        <MockSwitchRow
          label="Require accounts to upload"
          helper="On (recommended): guests verify a free account to see the full gallery and add photos (a few previews show first), so every upload is tied to an email."
        />
      </div>
    </div>
  );
}

/** A resting-on switch row (static shape; the primary-filled pill + thumb). */
function MockSwitchRow({ label, helper }: { label: string; helper: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="space-y-0.5">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs leading-relaxed text-muted-foreground">
          {helper}
        </p>
      </div>
      <span className="mt-0.5 inline-flex h-[18px] w-8 shrink-0 items-center rounded-full bg-primary">
        <span className="mr-0.5 ml-auto size-4 rounded-full bg-background" />
      </span>
    </div>
  );
}
