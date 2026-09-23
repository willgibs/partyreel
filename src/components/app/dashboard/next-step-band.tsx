"use client";

import { useId, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Clapperboard,
  ListChecks,
  PauseCircle,
  Printer,
  HardDrive,
} from "lucide-react";

import {
  PricingSheet,
  type PricingPlanFacts,
} from "@/components/app/pricing/pricing-sheet";
import { trackAttrs } from "@/lib/analytics/events";
import {
  foldNextSteps,
  type NextStep,
  type NextStepKind,
} from "@/lib/dashboard/next-step";
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
 * ★ THE FOLD (`busy=collapsed`, app-shape round two, 2026-09-20). A genuinely
 * busy host — several queues, a full shelf, a few quiet suggestions — hits six
 * steps by Thursday, and six chips wrapping three lines deep stops answering
 * "what needs you" at a glance. So past three steps (`foldNextSteps`, the pure
 * rule this only draws), the rest fold behind one "+N more" chip that expands
 * in place, `aria-expanded` on the control for assistive tech. A CLIENT
 * component for that and for the storage step's plan sheet, which opens in
 * place; the steps themselves are still resolved on the server, where the
 * state is.
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

/**
 * What the storage step's door needs to open the plan sheet where the host
 * stands: the server-derived plan facts (the sheet's lead reads them, never
 * an entitlement) and the bytes in use, so it opens on the smallest plan that
 * clears them, exactly as the storage meter's own "Need more?" door does.
 */
export type NextStepPlans = {
  plan: PricingPlanFacts;
  /** Active bytes in use: the `room` trigger's `needed`. */
  needed?: number;
};

const CHIP =
  "group flex h-9 items-center gap-2 rounded-full border px-3.5 text-sm font-medium outline-none transition-[background-color,transform] duration-150 ease-emphasis active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-ring/50 motion-reduce:active:scale-100";

/** One step's chip. `reveal` rides `data-settings-reveal` (globals.css), the
 *  product's own "a control eases in when it appears" idiom (the visibility
 *  and uploads settings panels, the gallery's Filter panel): opacity + a small
 *  rise on mount, a plain instant swap under reduced motion — never a bespoke
 *  animation for one band. */
function StepChip({
  step,
  reveal,
  plans,
}: {
  step: NextStep;
  reveal: boolean;
  plans?: NextStepPlans;
}) {
  const Icon = ICONS[step.kind];
  const body = (
    <>
      <Icon className="size-4 shrink-0" aria-hidden />
      {step.label}
      {/* The arrow only leans on hover: a row of six static arrows
          reads as decoration, one that moves reads as a door. */}
      <ArrowRight
        className="size-3.5 shrink-0 opacity-0 transition-[opacity,translate] duration-150 ease-emphasis group-hover:translate-x-0.5 group-hover:opacity-70 group-focus-visible:opacity-70 motion-reduce:transition-none"
        aria-hidden
      />
    </>
  );
  const shared = {
    "data-settings-reveal": reveal ? "" : undefined,
    // The doors the chrome carries. They are inert on (app): only the
    // marketing layout mounts the delegated listener, which
    // analytics/events.ts states outright. Carried anyway because the round's
    // ownership rules ask every new door to, and flagged in the lane's
    // Deferred rather than silently skipped.
    ...trackAttrs("cta_click", {
      cta: `pulse-${step.kind}`,
      location: "dashboard",
    }),
  };

  if (step.href !== null) {
    return (
      <Link href={step.href} {...shared} className={cn(CHIP, TONES[step.tone])}>
        {body}
      </Link>
    );
  }

  // Without the plan facts there is no door to open, so the step is said
  // rather than offered: a chip that does nothing when pressed is worse than
  // a line. The dashboard always passes them.
  if (!plans) {
    return (
      <span className={cn(CHIP, TONES[step.tone], "pointer-events-none")}>
        <Icon className="size-4 shrink-0" aria-hidden />
        {step.label}
      </span>
    );
  }

  // ★ A STEP WITH NO ROUTE OPENS THE PLAN SHEET WHERE THE HOST STANDS (the
  // storage step). It used to leave the app for the static, tier-blind
  // marketing page while every other pricing door in the app opens this
  // sheet, which already knows how full the host is; the sheet's own quiet
  // foot is the one way out to the full comparison. The chip keeps its
  // neighbours' shape, so the band stays one row of doors.
  return (
    <PricingSheet
      trigger={{ kind: "room", needed: plans.needed }}
      plan={plans.plan}
      returnTo="/dashboard"
    >
      <button
        type="button"
        {...shared}
        className={cn(CHIP, "cursor-pointer", TONES[step.tone])}
      >
        {body}
      </button>
    </PricingSheet>
  );
}

export function NextStepBand({
  steps,
  plans,
}: {
  steps: NextStep[];
  /** The storage step's door (see `NextStepPlans`). */
  plans?: NextStepPlans;
}) {
  const [expanded, setExpanded] = useState(false);
  const restId = useId();

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

  const { head, rest } = foldNextSteps(steps);
  const visible = expanded ? [...head, ...rest] : head;

  return (
    <section aria-label="What needs you">
      <ul id={restId} className="flex flex-wrap items-center gap-2">
        {visible.map((step, i) => (
          <li key={`${step.kind}-${step.eventId ?? "account"}`}>
            <StepChip
              step={step}
              reveal={expanded && i >= head.length}
              plans={plans}
            />
          </li>
        ))}
        {rest.length > 0 && (
          <li>
            <button
              type="button"
              aria-expanded={expanded}
              aria-controls={restId}
              onClick={() => setExpanded((e) => !e)}
              className="flex h-9 items-center gap-1.5 rounded-full border border-dashed border-border px-3.5 text-sm font-medium text-muted-foreground outline-none transition-colors duration-150 ease-emphasis hover:border-foreground/30 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              {expanded ? "Show fewer" : `+${rest.length} more`}
              <ChevronDown
                className={cn(
                  "size-3.5 shrink-0 transition-transform duration-150 ease-emphasis motion-reduce:transition-none",
                  expanded && "rotate-180",
                )}
                aria-hidden
              />
            </button>
          </li>
        )}
      </ul>
    </section>
  );
}
