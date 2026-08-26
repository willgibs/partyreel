import { Radio, ShieldCheck, type LucideIcon } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";

import { MonoCaption } from "@/components/marketing/system/mono-caption";
import { Reveal } from "@/components/marketing/system/reveal";
import { SectionShell } from "@/components/marketing/system/section-shell";

/**
 * Curation page section 3: the two-mode choice (live vs review) as calm paper
 * cards, plus the REAL settings surface quoted twice: the review toggle row
 * (event-settings/uploads-section.tsx wording, verbatim) and the turn-off
 * confirm dialog (nothing pending is ever dropped; the honesty beat). Defaults
 * advice comes from help/moderate-and-curate-your-album.
 */

const MODES: {
  icon: LucideIcon;
  tint: string;
  title: string;
  body: string;
  note: string;
}[] = [
  {
    icon: Radio,
    tint: "text-success",
    title: "Live",
    body: "Uploads appear the moment guests take them. The album fills in real time while the party is still going.",
    note: "The default. Great for parties and trips.",
  },
  {
    icon: ShieldCheck,
    tint: "text-warning",
    title: "Review",
    body: "Every upload waits for your approval before anyone else sees it. Skim the queue and clear it in one scroll.",
    note: "Great for weddings and conferences.",
  },
];

/** Non-interactive stand-ins for app controls inside the aria-hidden mocks. */
function ButtonLook({
  variant,
  children,
}: {
  variant: "outline" | "primary";
  children: ReactNode;
}) {
  return (
    <span
      className={
        variant === "primary"
          ? "inline-flex h-8 items-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground"
          : "inline-flex h-8 items-center rounded-lg border bg-background px-3 text-sm font-medium"
      }
    >
      {children}
    </span>
  );
}

/** A static "on" switch in the shipped Switch's proportions. */
function SwitchLook() {
  return (
    <span className="inline-flex h-[18.4px] w-8 shrink-0 items-center rounded-full bg-primary">
      <span className="mr-[2px] ml-auto size-4 rounded-full bg-background" />
    </span>
  );
}

export function ReviewModes() {
  return (
    <SectionShell
      eyebrow="Two ways to run it"
      heading="Live as it happens, or held for review."
      subhead="Casual events usually run live, so the room can watch the album grow. For weddings and conferences, flip on review and nothing unexpected reaches the big screen."
    >
      <div className="mx-auto mt-12 max-w-4xl">
        <Reveal className="grid gap-5 sm:grid-cols-2">
          {MODES.map((mode, i) => (
            <div
              key={mode.title}
              data-mkt-reveal
              className="flex flex-col gap-3 rounded-2xl border bg-card p-6 ring-1 ring-foreground/5"
              style={{ "--i": i } as CSSProperties}
            >
              <span
                className={`flex size-10 items-center justify-center rounded-lg border ${mode.tint}`}
              >
                <mode.icon className="size-5" strokeWidth={1.5} />
              </span>
              <h3 className="font-heading text-lg sm:text-xl">{mode.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {mode.body}
              </p>
              <MonoCaption className="mt-auto pt-1">{mode.note}</MonoCaption>
            </div>
          ))}
        </Reveal>

        <Reveal className="mt-5 grid gap-5 lg:grid-cols-2">
          {/* The switch itself, quoted from event settings. */}
          <div
            data-mkt-reveal
            className="flex flex-col rounded-2xl border bg-card p-5 ring-1 ring-foreground/5"
            style={{ "--i": 0 } as CSSProperties}
          >
            <MonoCaption className="mb-4">event settings</MonoCaption>
            <div
              aria-hidden
              className="flex items-start justify-between gap-4 rounded-xl border p-4"
            >
              <div className="space-y-1">
                <p className="text-sm font-medium">
                  Review uploads before they appear
                </p>
                <p className="text-sm text-muted-foreground">
                  Hold new photos for your approval instead of showing them
                  live.
                </p>
              </div>
              <SwitchLook />
            </div>
            <p className="mt-4 text-sm text-pretty text-muted-foreground">
              One switch in your event settings. Flip it on before the day, or
              mid-event when the dance floor gets brave.
            </p>
          </div>

          {/* Turning it off: whatever was waiting is approved, never dropped. */}
          <div
            data-mkt-reveal
            className="flex flex-col rounded-2xl border bg-card p-5 ring-1 ring-foreground/5"
            style={{ "--i": 1 } as CSSProperties}
          >
            <MonoCaption className="mb-4">turning it off</MonoCaption>
            <div aria-hidden className="rounded-xl border p-4">
              <p className="text-sm font-semibold">Stop reviewing uploads?</p>
              <p className="mt-1.5 text-sm text-muted-foreground">
                3 photos are under review. Turning this off approves them and
                shows them to everyone right away. New uploads will then appear
                live without your review. You can turn this back on anytime.
              </p>
              <div className="mt-4 flex flex-wrap justify-end gap-2">
                <ButtonLook variant="outline">Keep reviewing</ButtonLook>
                <ButtonLook variant="primary">Approve all and stop</ButtonLook>
              </div>
            </div>
            <p className="mt-4 text-sm text-pretty text-muted-foreground">
              Nothing slips through the switch: anything still waiting is
              approved on the way out, never dropped.
            </p>
          </div>
        </Reveal>
      </div>
    </SectionShell>
  );
}
