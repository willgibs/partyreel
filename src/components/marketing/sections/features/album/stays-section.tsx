import type { CSSProperties } from "react";

import { LearnMoreLink } from "@/components/marketing/sections/shared/learn-more-link";
import { MonoCaption } from "@/components/marketing/system/mono-caption";
import { Reveal } from "@/components/marketing/system/reveal";
import { SectionShell } from "@/components/marketing/system/section-shell";
import { planById } from "@/lib/constants/tiers";
import { INACTIVE_DAYS, WARN_BEFORE_DAYS } from "@/lib/lifecycle/inactivity";
import { OVER_CAP_GRACE_DAYS } from "@/lib/lifecycle/over-capacity";
import { RECENTLY_DELETED_WINDOW_DAYS } from "@/lib/lifecycle/recently-deleted";
import { formatBytes } from "@/lib/utils";

/**
 * IT STAYS: the album's whole life on one line, then the three honest notes
 * a host deserves before signing up. Every number derives from the lifecycle
 * constants (the recovery window, the free-tier inactivity rule, the over-cap
 * grace) so the page cannot drift from the crons that enforce them. The bin
 * covers what YOU delete: a guest's own deletion is theirs and never appears
 * in your Trash.
 */

const WINDOW = RECENTLY_DELETED_WINDOW_DAYS;
const MONTHS_IDLE = Math.round(INACTIVE_DAYS / 30);
const WEEKS_WARNING = Math.round(WARN_BEFORE_DAYS / 7);

const STEPS = [
  { title: "Created", body: "The album exists the moment you name the event." },
  {
    title: "Stays",
    body: "There is no end date. It is up until you decide otherwise.",
  },
  {
    title: "You delete",
    body: `What you remove waits up to ${WINDOW} days in Trash, and restores exactly as it was.`,
  },
  { title: "Gone", body: "After that, the files are deleted for good." },
];

export function StaysSection() {
  const free = planById("free");
  const pass = planById("event_pass");
  const NOTES = [
    {
      title: "Stop paying, keep everything",
      body: `End a Pro plan and the album stays. If you are then over the ${formatBytes(free.storageBytes)} Free cap, you get ${OVER_CAP_GRACE_DAYS} days to trim before the largest files move to Trash.`,
    },
    {
      title: "An Event Pass covers its year",
      body: `Each pass keeps its event for ${pass.termDays} days. Renew it, move to Pro, or let it lapse into the same ${OVER_CAP_GRACE_DAYS}-day window.`,
    },
    {
      title: "Free albums need a visit now and then",
      body: `A free event untouched for about ${MONTHS_IDLE} months gets an email ${WEEKS_WARNING} weeks ahead, then moves to Trash with the same ${WINDOW} days to restore. Opening it is enough to keep it.`,
    },
  ];

  return (
    <SectionShell
      eyebrow="Keeping it"
      heading="It stays."
      subhead="An album is for after, not just for the day. Here is exactly how long, and what happens when you are done."
    >
      {/* The life of an album, as one ruled line. */}
      <Reveal className="mx-auto mt-12 max-w-5xl">
        <ol className="grid gap-6 sm:grid-cols-4 sm:gap-4">
          {STEPS.map((step, i) => (
            <li
              key={step.title}
              data-mkt-reveal
              className="relative flex flex-col gap-2 border-t pt-4"
              style={{ "--i": 3 + i } as CSSProperties}
            >
              <span className="absolute -top-px left-0 h-px w-8 bg-foreground" />
              <MonoCaption>0{i + 1}</MonoCaption>
              <h3 className="font-heading text-lg">{step.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {step.body}
              </p>
            </li>
          ))}
        </ol>
      </Reveal>

      <Reveal className="mx-auto mt-14 grid max-w-5xl gap-x-8 gap-y-8 sm:grid-cols-3">
        {NOTES.map((note, i) => (
          <div
            key={note.title}
            data-mkt-reveal
            className="flex flex-col gap-2 rounded-2xl border bg-card p-5"
            style={{ "--i": i } as CSSProperties}
          >
            <h3 className="font-heading text-base">{note.title}</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {note.body}
            </p>
          </div>
        ))}
        <div
          data-mkt-reveal
          className="flex flex-col items-start gap-2 sm:col-span-3"
          style={{ "--i": 3 } as CSSProperties}
        >
          <MonoCaption>
            every file is copied to a second region within seconds, and that
            copy cannot be overwritten for 35 days
          </MonoCaption>
          <LearnMoreLink href="/help/how-long-media-is-kept">
            How long media is kept
          </LearnMoreLink>
        </div>
      </Reveal>
    </SectionShell>
  );
}
