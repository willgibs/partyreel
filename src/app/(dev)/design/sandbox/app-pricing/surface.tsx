"use client";

import type { ReactNode } from "react";
import { ArrowUpRight, Check, Lock, Minus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  EVENT_PASS_RENEWAL_PRICE_LABEL,
  MAX_EVENTS,
  MAX_REEL_SECONDS,
  annualPlanFor,
  type Plan,
} from "@/lib/constants/tiers";
import { cn, formatBytes } from "@/lib/utils";

import {
  FREE,
  PASS,
  PASS_LINES,
  PRO_SIZES,
  UNLOCKS,
  type Fixture,
  type Trigger,
  holds,
  openingPlan,
  pctOf,
} from "./fixtures";

/**
 * THE SURFACE THIS ROUND IS ABOUT: pricing that opens INSIDE the app.
 *
 * Will (2026-09-19): "an in-app pricing modal so we don't take users out of the
 * app to the marketing site by default every pricing click... The marketing
 * site can be a more comprehensive 'Learn More' second-layer resource that's a
 * click away from the more minimal in-app pricing." Modal is his word for the
 * ASK; the first decision asks what the object should be.
 *
 * ★ NOTHING HERE TOUCHES STRIPE. Every buy button is a plain `Button`: the
 * shipped `CheckoutButton` POSTs to /api/stripe/checkout on click, and a board
 * is a place to judge a surface, not to open a payment session. The surface
 * this round designs ENDS where that button begins, which is also the seam the
 * wiring lane will meet.
 *
 * ★ EVERY PRICE, NAME, CAP AND CAPACITY SENTENCE COMES FROM `tiers.ts` through
 * fixtures.ts. Read a number off this file and you are reading `PLANS`.
 *
 * ★ THE OVERLAYS ARE COMPOSED, NOT RADIX. Three options are on the step's stage
 * at once (the hidden ones keep their layout), so three real `Dialog`s would
 * fight over the focus trap and the scroll lock. The shells below are the same
 * tokens and the same corners, drawn as inert furniture, which is how the app
 * board drew its share modal.
 */

export type Shape = "dialog" | "sheet" | "panel";
export type First = "plans" | "trigger" | "yours";
export type Carry = "cards" | "fitted" | "parity";
export type Learn = "foot" | "door" | "inside";
export type PassWeight = "full" | "line" | "none";

export const shapeOf = (v: string | undefined): Shape =>
  v === "dialog" || v === "panel" ? v : "sheet";
export const firstOf = (v: string | undefined): First =>
  v === "plans" || v === "yours" ? v : "trigger";
export const carryOf = (v: string | undefined): Carry =>
  v === "cards" || v === "parity" ? v : "fitted";
export const learnOf = (v: string | undefined): Learn =>
  v === "door" || v === "inside" ? v : "foot";
export const passOf = (v: string | undefined): PassWeight =>
  v === "full" || v === "none" ? v : "line";

export type World = {
  f: Fixture;
  trigger: Trigger;
  phone: boolean;
  shape: Shape;
  first: First;
  carry: Carry;
  learn: Learn;
  pass: PassWeight;
  /** The learn-more second screen, for the option that keeps it inside. */
  second?: boolean;
  /** The receipt state, for the question about coming back from Checkout. */
  bought?: boolean;
};

/* ── The words at the top, which is what "the first view" decides ────────── */

/** What a trigger-aware surface leads with, in the host's own situation. */
function headline(w: World): { title: string; sub: string } {
  const { f, trigger } = w;
  if (w.bought)
    return {
      title: `You are on ${PRO_SIZES[0].name}`,
      sub: `${holds(PRO_SIZES[0].storageBytes)}, and the lock on this album is open.`,
    };
  if (w.first === "plans")
    return {
      title: "Plans",
      sub: "Pick the room your event needs. Cancel any time.",
    };
  if (w.first === "yours")
    return {
      title: `You are on ${f.planName}`,
      sub: `${formatBytes(f.used)} of ${formatBytes(f.cap)} used, ${pctOf(w.f)} percent. Here is what each step up adds.`,
    };
  // The trigger's own context: the one thing /pricing can never know.
  if (trigger === "feature")
    return {
      title: "Password locks are on every paid plan",
      sub: `Lock ${f.eventName} and keep the link private. Video, custom links and ${MAX_REEL_SECONDS.pro}-second reels come with it.`,
    };
  if (trigger === "cap")
    return {
      title: `You are ${pctOf(f)} percent through ${formatBytes(f.cap)}`,
      sub: `Guests are still uploading to ${f.eventName}. ${openingPlan(f, trigger).name} holds ${holds(openingPlan(f, trigger).storageBytes)}.`,
    };
  if (trigger === "pro")
    return {
      title: `You are on ${f.planName}`,
      sub: `${formatBytes(f.used)} of ${formatBytes(f.cap)} used. Change size or cadence any time.`,
    };
  return {
    title: `Your ${PASS.name} runs to ${f.passExpiry}`,
    sub: `Renew for ${EVENT_PASS_RENEWAL_PRICE_LABEL}, add a pass for another event, or move to Pro and the time left becomes credit.`,
  };
}

/* ── The plan block, which is what "how much" decides ─────────────────────── */

function Tick({ children, no = false }: { children: ReactNode; no?: boolean }) {
  return (
    <li className="flex items-start gap-2 text-sm">
      {no ? (
        <Minus className="mt-0.5 size-4 shrink-0 text-faint" strokeWidth={2} />
      ) : (
        <Check
          className="mt-0.5 size-4 shrink-0 text-success"
          strokeWidth={2}
        />
      )}
      <span className="text-muted-foreground">{children}</span>
    </li>
  );
}

/** The price, in the display face with tabular digits, as /pricing sets money. */
function Price({ plan, ink }: { plan: Plan; ink?: boolean }) {
  return (
    <p
      className={cn(
        "font-heading text-subsection tabular-nums",
        ink && "text-background",
      )}
    >
      {plan.priceLabel}
    </p>
  );
}

/** One plan, as a card. Pro is the same sheet in ink, the pair's shipped read. */
function PlanCard({
  plan,
  ink = false,
  held = false,
  cta,
  children,
}: {
  plan: Plan;
  ink?: boolean;
  /** The host already holds this one: the button becomes a state. */
  held?: boolean;
  cta: string;
  children?: ReactNode;
}) {
  return (
    <div
      data-plan={plan.id}
      className={cn(
        "flex min-w-0 flex-1 flex-col gap-3 rounded-xl border p-4",
        ink ? "border-transparent bg-foreground" : "bg-card",
      )}
    >
      <div className="space-y-1">
        <p
          className={cn(
            "text-sm font-medium",
            ink ? "text-background" : "text-foreground",
          )}
        >
          {plan.name}
        </p>
        <Price plan={plan} ink={ink} />
        <p className={cn("text-xs", ink ? "text-background/70" : "text-faint")}>
          {holds(plan.storageBytes, plan.tier !== "free")}
        </p>
      </div>
      {children}
      {held ? (
        <span className="mt-auto inline-flex h-8 items-center justify-center rounded-action-sm border border-border text-[0.8rem] text-muted-foreground">
          Your plan
        </span>
      ) : (
        <Button
          size="sm"
          variant={ink ? "secondary" : "outline"}
          className="mt-auto w-full"
        >
          {cta}
        </Button>
      )}
    </div>
  );
}

/** The storage selector and the cadence toggle: the two levers "fitted" adds. */
function Levers({ opening }: { opening: Plan }) {
  const annual = annualPlanFor(opening.id);
  return (
    <div className="space-y-2">
      <div className="flex gap-1.5">
        {PRO_SIZES.map((p) => (
          <span
            key={p.id}
            className={cn(
              "flex h-7 flex-1 items-center justify-center rounded-action-sm border text-xs font-medium",
              p.id === opening.id
                ? "border-foreground bg-foreground text-background"
                : "border-border text-muted-foreground",
            )}
          >
            {formatBytes(p.storageBytes)}
          </span>
        ))}
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className="flex overflow-hidden rounded-action-sm border border-border">
          <span className="bg-foreground px-2 py-1 text-[11px] font-medium text-background">
            Monthly
          </span>
          <span className="px-2 py-1 text-[11px]">Yearly</span>
        </span>
        {annual && <span>{annual.priceLabel}, two months free</span>}
      </div>
    </div>
  );
}

/** The two or three lines the trigger made relevant, and nothing else. */
function Relevant({ trigger }: { trigger: Trigger }) {
  const lines =
    trigger === "feature"
      ? ["Password locks and custom links", UNLOCKS[0], UNLOCKS[1]]
      : trigger === "cap"
        ? [
            `Unlimited events (${FREE.name} holds ${MAX_EVENTS.free})`,
            UNLOCKS[0],
            "Your room grows with the plan you pick",
          ]
        : [UNLOCKS[0], UNLOCKS[1], UNLOCKS[2]];
  return (
    <ul className="space-y-1.5">
      {lines.map((l) => (
        <Tick key={l}>{l}</Tick>
      ))}
    </ul>
  );
}

function Plans({ w }: { w: World }) {
  const opening = openingPlan(w.f, w.trigger);
  const held = w.f.tier === "pro";

  if (w.carry === "cards")
    return (
      <div className="flex gap-3">
        <PlanCard plan={FREE} cta="Your plan" held={w.f.tier === "free"} />
        <PlanCard plan={opening} ink held={held} cta={`Get ${opening.name}`} />
      </div>
    );

  if (w.carry === "fitted")
    return (
      <div className="space-y-3">
        <Levers opening={opening} />
        <div className="rounded-xl border border-transparent bg-foreground p-4">
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-sm font-medium text-background">
              {opening.name}
            </p>
            <Price plan={opening} ink />
          </div>
          <p className="mt-1 text-xs text-background/70">
            {holds(opening.storageBytes)}
          </p>
          <Button size="sm" variant="secondary" className="mt-3 w-full">
            {held ? "Change plan" : `Get ${opening.name}`}
          </Button>
        </div>
        <Relevant trigger={w.trigger} />
      </div>
    );

  // PARITY: everything /pricing carries, drawn so the height is the argument.
  return (
    <div className="space-y-4">
      <Levers opening={opening} />
      <div className="flex gap-3">
        <PlanCard plan={FREE} cta="Your plan" held={w.f.tier === "free"} />
        <PlanCard plan={opening} ink held={held} cta={`Get ${opening.name}`} />
      </div>
      <div className="space-y-1.5">
        <p className="text-xs font-medium text-muted-foreground">
          Where Free ends
        </p>
        <ul className="space-y-1.5">
          {UNLOCKS.map((u) => (
            <Tick key={u}>{u}</Tick>
          ))}
          <Tick
            no
          >{`${FREE.name} reels run ${MAX_REEL_SECONDS.free} seconds with a small mark`}</Tick>
        </ul>
      </div>
      <Calculator />
      <Table />
      <Faq />
    </div>
  );
}

/** The marketing calculator, carried inside: a slider, video, once or again. */
function Calculator() {
  return (
    <div className="space-y-2 rounded-xl border bg-card/40 p-4">
      <p className="text-xs font-medium text-muted-foreground">
        How much room do you need?
      </p>
      <span className="block h-1 rounded-full bg-muted">
        <span className="block h-1 w-1/3 rounded-full bg-foreground/70" />
      </span>
      <div className="flex gap-1.5 text-[11px] text-muted-foreground">
        <span className="rounded-action-sm border px-2 py-1">With video</span>
        <span className="rounded-action-sm border px-2 py-1">
          Hosting again
        </span>
      </div>
      <p className="text-xs text-faint">
        {`${PRO_SIZES[0].name} fits: ${holds(PRO_SIZES[0].storageBytes)}.`}
      </p>
    </div>
  );
}

/** The five-group comparison, as the table's first group reads. */
function Table() {
  const rows: [string, string, string][] = [
    [
      "Storage",
      formatBytes(FREE.storageBytes),
      formatBytes(PRO_SIZES[0].storageBytes),
    ],
    ["Events", String(MAX_EVENTS.free), "Unlimited"],
    ["Video", "No", "Yes"],
    [
      "Reel",
      `${MAX_REEL_SECONDS.free}s, marked`,
      `${MAX_REEL_SECONDS.pro}s, clean`,
    ],
  ];
  return (
    <div className="overflow-hidden rounded-xl border">
      {rows.map(([label, free, pro], i) => (
        <div
          key={label}
          className={cn(
            "grid grid-cols-3 gap-2 px-3 py-2 text-xs",
            i > 0 && "border-t",
          )}
        >
          <span className="text-muted-foreground">{label}</span>
          <span className="text-faint">{free}</span>
          <span className="font-medium">{pro}</span>
        </div>
      ))}
    </div>
  );
}

/** The FAQ that settles the pass-to-Pro question, the stacking and the cap. */
function Faq() {
  return (
    <div className="space-y-2">
      {[
        "What happens when I run out of room?",
        "Can I switch from a pass to Pro?",
        "Do passes stack?",
        "What happens if I cancel?",
      ].map((q) => (
        <p
          key={q}
          className="border-b pb-2 text-xs text-muted-foreground last:border-b-0"
        >
          {q}
        </p>
      ))}
    </div>
  );
}

/* ── The Event Pass, at three weights ─────────────────────────────────────── */

function PassBlock({ w }: { w: World }) {
  if (w.pass === "none") return null;
  if (w.pass === "line")
    return (
      <div className="flex items-center justify-between gap-3 rounded-xl border border-dashed p-3">
        <p className="min-w-0 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{PASS.name}</span>{" "}
          {`one event, paid once: ${PASS.priceLabel.replace(" one-time", "")} for ${formatBytes(PASS.storageBytes)}.`}
        </p>
        <Button size="sm" variant="outline" className="shrink-0">
          {w.f.tier === "event_pass" ? "Add a pass" : "Buy a pass"}
        </Button>
      </div>
    );
  return (
    <div className="space-y-3 rounded-xl border border-dashed p-4">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm font-medium">{PASS.name}</p>
        <p className="font-heading text-subsection tabular-nums">
          {PASS.priceLabel.replace(" one-time", "")}
        </p>
      </div>
      <ul className="space-y-1.5">
        {PASS_LINES.map((l) => (
          <Tick key={l}>{l}</Tick>
        ))}
      </ul>
      <Button size="sm" variant="outline" className="w-full">
        {w.f.tier === "event_pass" ? "Add a pass" : "Buy a pass"}
      </Button>
    </div>
  );
}

/* ── The way to the second layer ──────────────────────────────────────────── */

function LearnMore({ w }: { w: World }) {
  if (w.learn === "door")
    return (
      <div className="flex gap-2 border-t pt-3">
        <Button size="sm" className="flex-1">
          Continue
        </Button>
        <Button size="sm" variant="outline" className="flex-1">
          Compare all plans <ArrowUpRight />
        </Button>
      </div>
    );
  if (w.learn === "inside")
    return (
      <button
        type="button"
        className="w-full border-t pt-3 text-left text-xs font-medium text-foreground underline underline-offset-4"
      >
        Compare every plan, side by side
      </button>
    );
  return (
    <p className="border-t pt-3 text-xs text-muted-foreground">
      Want the full comparison?{" "}
      <span className="font-medium text-foreground underline underline-offset-4">
        See every plan
      </span>{" "}
      <ArrowUpRight className="inline size-3" aria-hidden /> opens partyreel.com
      in a new tab.
    </p>
  );
}

/* ── The body, and the three shells around it ─────────────────────────────── */

/** The comparison as a SECOND SCREEN of the same surface (the inside option). */
function SecondScreen() {
  return (
    <div className="space-y-3">
      <p className="text-sm font-medium">Every plan, side by side</p>
      <Table />
      <Faq />
      <p className="text-xs text-muted-foreground">
        Nothing left the app to read this.
      </p>
    </div>
  );
}

export function SurfaceBody({ w }: { w: World }) {
  const head = headline(w);
  if (w.second) return <SecondScreen />;
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <p className="font-heading text-card-title text-pretty">{head.title}</p>
        <p className="text-sm text-pretty text-muted-foreground">{head.sub}</p>
      </div>
      {w.bought ? (
        <Button size="sm" className="w-full">
          Set the password
        </Button>
      ) : (
        <>
          <Plans w={w} />
          <PassBlock w={w} />
          <LearnMore w={w} />
        </>
      )}
    </div>
  );
}

/**
 * The surface in the shape the first decision is about. `panel` returns the
 * body with no shell at all: it is drawn by the DOOR, in the door's own place,
 * which is the whole of its argument and the whole of its cost.
 */
export function Surface({ w }: { w: World }) {
  if (w.shape === "panel") return null;
  const sheet = w.shape === "sheet" && w.phone;
  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 z-50 flex bg-black/50",
        sheet ? "items-end" : "items-center justify-center p-6",
      )}
    >
      <div
        data-surface
        className={cn(
          "max-h-full overflow-y-auto border border-border bg-background shadow-layer",
          sheet
            ? "w-full rounded-t-2xl p-5 pb-7"
            : w.phone
              ? "w-full rounded-2xl p-5"
              : "w-[560px] rounded-2xl p-6",
        )}
      >
        {sheet && (
          <span
            aria-hidden
            className="mx-auto mb-4 block h-1 w-9 rounded-full bg-border"
          />
        )}
        <SurfaceBody w={w} />
      </div>
    </div>
  );
}

/** The panel option: the surface unfolded where the door was, no overlay. */
export function PanelSurface({ w }: { w: World }) {
  return (
    <div
      data-surface
      className="rounded-xl border border-border bg-card p-4 shadow-lift"
    >
      <SurfaceBody w={w} />
    </div>
  );
}

/** The one-word lock the third wording option leaves behind at a gated control. */
export function LockChip({ label }: { label: string }) {
  return (
    <span className="inline-flex h-7 items-center gap-1.5 rounded-action-sm border border-border px-2.5 text-xs font-medium text-muted-foreground">
      <Lock className="size-3" aria-hidden /> {label}
    </span>
  );
}
