import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Clapperboard,
  ListChecks,
  PauseCircle,
  Printer,
  HardDrive,
} from "lucide-react";

import { trackAttrs } from "@/lib/analytics/events";
import type { NextStep, NextStepKind } from "@/lib/dashboard/next-step";
import { cn } from "@/lib/utils";

/**
 * THE PULSE'S FIRST BAND: what needs you, one step per event.
 *
 * ★ THIS BAND IS NEVER EMPTY, AND THAT IS THE WHOLE POINT. Will approved the
 * front page but warned that the inbox existed so the app would not "feel...
 * limited and empty... until more things start to happen (which creates a very
 * boring and bland initial host experience sometimes)". A band wired straight
 * to the review queue would be blank for every host who is on top of their
 * events, which is most hosts most of the time, and blank on day one for all
 * of them. So the steps come from a rule over real state
 * (`lib/dashboard/next-step.ts`), and when that rule finds nothing the band
 * says so calmly and keeps the create door where a host can reach it.
 *
 * Presentational and server-renderable: the steps are resolved on the server
 * where the state is, and this only draws them.
 */

const ICONS: Record<NextStepKind, typeof ListChecks> = {
  review: ListChecks,
  paused: PauseCircle,
  reel: Clapperboard,
  print: Printer,
  storage: HardDrive,
};

// Amber only where it MATTERS (a queue that is waiting, a shelf that is nearly
// full), the same restraint StorageMeter uses; everything else is quiet
// neutral, so a host can find the one urgent thing by colour alone.
const TONES = {
  waiting: "border-transparent bg-warning/15 text-warning hover:bg-warning/20",
  warning: "border-warning/40 text-warning hover:bg-warning/10",
  quiet:
    "border-border text-muted-foreground hover:text-foreground hover:bg-muted/40",
} as const;

export function NextStepBand({ steps }: { steps: NextStep[] }) {
  if (steps.length === 0) {
    return (
      <section aria-label="What needs you">
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <CheckCircle2 className="size-4 shrink-0" aria-hidden />
          Nothing needs you right now. Your events are open and your guests can
          add to them.
        </p>
      </section>
    );
  }

  return (
    <section aria-label="What needs you">
      <ul className="flex flex-wrap items-center gap-2">
        {steps.map((step) => {
          const Icon = ICONS[step.kind];
          return (
            <li key={`${step.kind}-${step.eventId ?? "account"}`}>
              <Link
                href={step.href}
                // The doors the chrome carries. They are inert on (app): only
                // the marketing layout mounts the delegated listener, which
                // analytics/events.ts states outright. Carried anyway because
                // the round's ownership rules ask every new door to, and
                // flagged in the lane's Deferred rather than silently skipped.
                {...trackAttrs("cta_click", {
                  cta: `pulse-${step.kind}`,
                  location: "dashboard",
                })}
                className={cn(
                  "group flex h-9 items-center gap-2 rounded-full border px-3.5 text-sm font-medium outline-none transition-[background-color,transform] duration-150 ease-emphasis active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-ring/50 motion-reduce:active:scale-100",
                  TONES[step.tone],
                )}
              >
                <Icon className="size-4 shrink-0" aria-hidden />
                {step.label}
                {/* The arrow only leans on hover: a row of six static arrows
                    reads as decoration, one that moves reads as a door. */}
                <ArrowRight
                  className="size-3.5 shrink-0 opacity-0 transition-[opacity,translate] duration-150 ease-emphasis group-hover:translate-x-0.5 group-hover:opacity-70 group-focus-visible:opacity-70 motion-reduce:transition-none"
                  aria-hidden
                />
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
