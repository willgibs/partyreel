"use client";

import { useMemo, useState, type ComponentProps, type ReactNode } from "react";
import { toast } from "sonner";

import { LockChip } from "@/components/app/pricing/lock-chip";
import {
  PricingDoorsProvider,
  type PricingDoors,
} from "@/components/app/pricing/pricing-doors";
import {
  PricingSheet,
  type PricingPlanFacts,
} from "@/components/app/pricing/pricing-sheet";
import type { PricingTrigger } from "@/components/app/pricing/triggers";
import { WelcomeToPro } from "@/components/app/pricing/welcome-to-pro";
import type { PlanFacts } from "@/lib/billing/plan-facts";
import { GIGABYTE, MEGABYTE, planById } from "@/lib/constants/tiers";

import { BehindThePopup, DevicePair } from "../device-frames";
import { InertStorage } from "./composition-demos";

/**
 * THE PLANS' SURFACE, PRESSED THROUGH WITH STRIPE NOWHERE IN REACH (the Library's compositions of `pricing-sheet.tsx`,
 * `lock-chip.tsx` and `welcome-to-pro.tsx`).
 *
 * The real sheet, chip and receipt over the doors the surface names (`pricing-doors.tsx`): the sheet opens on a
 * fixture's facts after the pause a real read takes, every button that would leave for Stripe's page does what the real
 * one does until it would leave (it says it is working, for the wait a route takes) and then says the Library stops
 * here, and the receipt's router verbs go nowhere. So a reviewer can press Get Pro, Buy a pass, Manage billing and
 * Switch, and meets the surface's real states, none of which localhost can reach signed in (a Pro host's three sizes,
 * a pass holder's note, the receipt in the webhook's race).
 *
 * ★ THE BUTTONS ARE THE PRODUCT'S OWN, OVER INERT VERBS. Checkout, the portal and the switch each wait a route's round
 * trip and answer an address to go to, and the way out (`leave`) is where the Library stops: so the pending words, the
 * disabled button and the order of things are the real buttons' (a stand-in redrawn by hand drifts from the button it
 * stands for), and the only thing replaced is Stripe.
 *
 * ★ THE SHEET'S SIZE LIST AND ITS REFUSAL FACE STAND OVER THE SAME INERT STORAGE the storage meter's specimens use
 * (`InertStorage`), so "See what's using space" and its deletes answer after a pause and change nothing.
 *
 * ★ EVERY FACT IS A FIXTURE THE SHEET PARSES THROUGH ITS OWN READER (`parsePlanFacts`): the stand-in read answers the
 * shape the route does, so a fixture the reader would refuse draws as the failed read it is, never a state that cannot
 * happen.
 */

/** A round trip's wait: what a route takes before it answers, long enough to be seen. */
const ROUND_TRIP_MS = 900;

/** What a press that would leave for Stripe says instead, where the host would have left. */
const STOPS_HERE =
  "The Library stops here: in the product this opens Stripe's page.";

/** The address every stand-in route answers: a reserved name (`.invalid`), so it is never one a browser could follow. */
const STAND_IN_URL = "https://stripe.invalid/the-library-stops-here";

function afterPause<T>(value: T, ms: number, signal?: AbortSignal): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => resolve(value), ms);
    signal?.addEventListener("abort", () => {
      clearTimeout(timer);
      reject(new DOMException("Aborted", "AbortError"));
    });
  });
}

/**
 * A route that would answer Stripe's page: a round trip's wait, then the address it would have made. The real button is
 * pending ("Opening billing" on Checkout's key, "Opening…" on the portal's and a plan change's) for exactly that wait,
 * as it is for the real route, and then takes the way out.
 */
function stripeAnswers() {
  return afterPause(
    { kind: "redirect" as const, url: STAND_IN_URL },
    ROUND_TRIP_MS,
  );
}

/** The doors for a host the fixture describes: its facts after a read's pause, and every other door inert. */
function doorsFor(facts: PlanFacts | null, readMs: number): PricingDoors {
  return {
    readFacts: (signal) =>
      afterPause(facts ? { ok: true, facts } : null, readMs, signal),
    startCheckout: stripeAnswers,
    openPortal: stripeAnswers,
    changePlan: stripeAnswers,
    // Where the product would have left, the Library says so: the note is the way out, so it follows the wait.
    leave: () => {
      toast(STOPS_HERE);
    },
    router: { push: () => {}, replace: () => {}, refresh: () => {} },
  };
}

/** The inert doors and the inert storage around whatever draws the surface. */
function InertPricing({
  facts,
  readMs = 1100,
  children,
}: {
  facts: PlanFacts | null;
  /** How long the sheet's read takes to answer. */
  readMs?: number;
  children: ReactNode;
}) {
  const doors = useMemo(() => doorsFor(facts, readMs), [facts, readMs]);
  return (
    <PricingDoorsProvider doors={doors}>
      <InertStorage>{children}</InertStorage>
    </PricingDoorsProvider>
  );
}

/* ── The hosts the sheet is drawn for ─────────────────────────────────────── */

const gb = (n: number) => Math.round(n * GIGABYTE);

function host(over: Partial<PlanFacts>): PlanFacts {
  return {
    tier: "free",
    hasBilling: false,
    passExpiry: null,
    storedBytes: 0,
    deletedBytes: 0,
    capBytes: planById("free").storageBytes,
    monthUploadedBytes: 0,
    currentPlanId: null,
    changeBlocked: null,
    ...over,
  };
}

export type PricingState = "locked" | "room" | "pass" | "pro";

type Hosts = Record<
  PricingState,
  { plan: PricingPlanFacts; facts: PlanFacts; trigger: PricingTrigger }
>;

const HOSTS: Hosts = {
  // A Free host with a few photographs in, who pressed the video lock.
  locked: {
    plan: { tier: "free", hasBilling: false },
    facts: host({ storedBytes: 84 * MEGABYTE }),
    trigger: { kind: "locked", feature: "video" },
  },
  // A pass holder with three passes stacked whose albums outgrew the smallest Pro size, opened from a door that knows
  // nothing about bytes (Create's): it opens on the next size up and says which it skipped.
  room: {
    plan: { tier: "event_pass", hasBilling: true, passExpiry: "Nov 14, 2026" },
    facts: host({
      tier: "event_pass",
      hasBilling: true,
      passExpiry: "Nov 14, 2026",
      storedBytes: gb(61.5),
      capBytes: planById("event_pass").storageBytes * 3,
    }),
    trigger: { kind: "room" },
  },
  // A pass holder who only came to look at what they pay.
  pass: {
    plan: { tier: "event_pass", hasBilling: true, passExpiry: "Nov 14, 2026" },
    facts: host({
      tier: "event_pass",
      hasBilling: true,
      passExpiry: "Nov 14, 2026",
      storedBytes: gb(3.2),
      capBytes: planById("event_pass").storageBytes,
    }),
    trigger: { kind: "plan" },
  },
  // Pro 200 GB, monthly, with a videographer's year in: the 50 GB size is too small, the 1 TB is a switch.
  pro: {
    plan: { tier: "pro", hasBilling: true },
    facts: host({
      tier: "pro",
      hasBilling: true,
      storedBytes: gb(110.8),
      deletedBytes: gb(3.2),
      capBytes: planById("pro_200").storageBytes,
      currentPlanId: "pro_200",
      monthUploadedBytes: gb(36),
    }),
    trigger: { kind: "plan" },
  },
};

/** Every host's facts, for the test that holds them to the parser. */
export const PRICING_FIXTURES: Record<PricingState, PlanFacts> = {
  locked: HOSTS.locked.facts,
  room: HOSTS.room.facts,
  pass: HOSTS.pass.facts,
  pro: HOSTS.pro.facts,
};

/** The sheet, drawn open over a stand-in album and closed by its X; Replay opens it again. */
export function PricingSheetScene({ state }: { state: PricingState }) {
  const [open, setOpen] = useState(true);
  const { plan, facts, trigger } = HOSTS[state];
  return (
    <InertPricing facts={facts}>
      <BehindThePopup />
      <PricingSheet
        open={open}
        onOpenChange={setOpen}
        trigger={trigger}
        plan={plan}
        returnTo="/dashboard"
      />
    </InertPricing>
  );
}

const NOTES: Record<PricingState, string> = {
  locked:
    "The Pro card and the pass line are Checkout's doors: press either, and it works for a wait, then says the Library stops there.",
  room: "The read lands a beat after it opens and moves the card up a size; the line under the cards says which it skipped.",
  pass: "A pass holder is offered the Pro card and a second pass, never Free.",
  pro: "Her plan is read first (a quiet list), then her three sizes: press Too small for the numbers, See what's using space for the list, a Switch for the note.",
};

/**
 * THE PLANS' SHEET AT BOTH SCREENS, over one of the four hosts it is drawn for: a wide dialog at a laptop, the whole screen
 * under a close in a hand (`plans=wide`).
 */
export function PricingSheetDemo({ state }: { state: PricingState }) {
  return (
    <DevicePair
      id={`pricing-sheet-${state}`}
      scene={() => <PricingSheetScene state={state} />}
      note={NOTES[state]}
    />
  );
}

/* ── The lock chip ────────────────────────────────────────────────────────── */

/**
 * THE LOCK CHIP IN THE PAGE, OVER A FREE HOST: its three controls' chips, each a button that opens the sheet led by its
 * own feature. The sheet opens in the Library's own window (a laptop's wide dialog, a phone's whole screen), over the
 * inert doors.
 */
export function LockChipDemo() {
  return (
    <InertPricing facts={HOSTS.locked.facts}>
      <div className="flex flex-wrap items-center gap-3">
        <LockChip feature="video" returnTo="/dashboard" />
        <LockChip feature="password" returnTo="/dashboard" />
        <LockChip feature="custom_slug" returnTo="/dashboard" />
      </div>
    </InertPricing>
  );
}

/* ── The receipt ──────────────────────────────────────────────────────────── */

export type ReceiptState = "applied" | "race";

type Welcome = ComponentProps<typeof WelcomeToPro>;

/**
 * The receipt over a router that answers as the page does: a re-read (`refresh`) is the server's page drawn again, and
 * here the server has moved the plan by then. `race` starts as Stripe's redirect does, seconds before the webhook, so the
 * receipt says only the payment, re-reads after two seconds as it does and heals into the plan.
 */
function WelcomeScene({ state }: { state: ReceiptState }) {
  const [applied, setApplied] = useState(state === "applied");
  const doors = useMemo<PricingDoors>(
    () => ({
      ...doorsFor(null, 0),
      router: {
        push: () => {},
        replace: () => {},
        // The page is re-rendered by the server, which has the plan now.
        refresh: () => setApplied(true),
      },
    }),
    [],
  );
  const props: Welcome = {
    applied,
    planName: "Pro",
    capBytes: planById("pro_200").storageBytes,
    nextUrl: "/dashboard",
    door: { label: "Go to your dashboard" },
  };
  return (
    <PricingDoorsProvider doors={doors}>
      <BehindThePopup />
      <WelcomeToPro {...props} />
    </PricingDoorsProvider>
  );
}

/**
 * THE RECEIPT AT BOTH SCREENS: the real `WelcomeToPro` over a stand-in page. `applied` is the plan already on; `race` is
 * the webhook's lag, which the receipt heals through the router's re-read.
 */
export function WelcomeToProDemo({ state }: { state: ReceiptState }) {
  return (
    <DevicePair
      id={`welcome-to-pro-${state}`}
      scene={() => <WelcomeScene state={state} />}
      note={
        state === "race"
          ? "Payment received first, then, after its two-second re-read, Welcome to Pro: the receipt never claims the plan before the server has it. Replay plays the race again."
          : "The plan is on: the receipt's three facts and the way on. Closing strips the marker from the URL; here the router goes nowhere."
      }
    />
  );
}
