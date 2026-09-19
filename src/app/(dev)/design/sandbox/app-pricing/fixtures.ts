import {
  EVENT_PASS_RENEWAL_PRICE_LABEL,
  MAX_REEL_SECONDS,
  formatCapacity,
  planById,
  plansForTier,
  type Plan,
  type Tier,
} from "@/lib/constants/tiers";
import { smallestProFor } from "@/components/marketing/sections/pricing/recommend";

/**
 * FOUR HOSTS, FOUR PRICING CLICKS: the fixtures every option on this board is
 * drawn on.
 *
 * ★ EVERY NUMBER AND EVERY PLAN NAME IS READ FROM `tiers.ts`, NEVER TYPED. The
 * board reads `PLANS` through `planById` / `plansForTier` and the capacity
 * sentences through `formatCapacity`, which is the same formatter /pricing
 * uses, so the surface and the marketing page can never describe one cap two
 * ways. A literal price anywhere in this directory would be the drift the
 * parity test exists to prevent.
 *
 * ★ ONE FREE HOST IN TWO MOMENTS, NOT TWO FREE HOSTS. Rosa is refused at a
 * locked control and, later the same week, refused for space. Judging both
 * moments against one person is what makes "the reason they clicked" a real
 * question rather than a demo of four different screens.
 *
 * ★ THE PASS HOST EXISTS BECAUSE THE PASS IS THE HARD CASE. Dev bought one
 * pass; a second would stack, and going Pro converts what is left of this one
 * to credit. Nothing else in the app has to explain two billing models at once.
 */

export const FREE = planById("free");
export const PRO_SIZES: Plan[] = plansForTier("pro");
export const PASS = planById("event_pass");

/** The Pro size the surface opens on when nothing says otherwise. */
export const PRO_DEFAULT = PRO_SIZES[0];

/** What opened the surface. The knob every decision shares. */
export type Trigger = "feature" | "cap" | "pro" | "pass";

export type Fixture = {
  /** The host, as the app's own chrome draws them. */
  initial: string;
  email: string;
  tier: Tier;
  /** The plan they hold, by name, from tiers.ts. */
  planName: string;
  /** Their effective storage cap in bytes, and what they are using of it. */
  cap: number;
  used: number;
  /** Events that exist (the free wall is one). */
  events: number;
  /** Only a pass has one. */
  passExpiry: string | null;
  /** A Stripe customer on record: the portal button only exists for these. */
  hasBilling: boolean;
  /** The event they are inside when they click. */
  eventName: string;
  /** What the surface can know here that a static /pricing never can. */
  knows: string;
};

export const FIXTURES: Record<Trigger, Fixture> = {
  // The commonest refusal in the product: a Free host setting a password on the
  // album before she sends the link out.
  feature: {
    initial: "R",
    email: "rosa@alvarez.co",
    tier: "free",
    planName: FREE.name,
    cap: FREE.storageBytes,
    used: Math.round(FREE.storageBytes * 0.41),
    events: 1,
    passExpiry: null,
    hasBilling: false,
    eventName: "Rosa and Dev's Engagement",
    knows: "She wants a password on this album.",
  },
  // The same host, the night of the party, out of room.
  cap: {
    initial: "R",
    email: "rosa@alvarez.co",
    tier: "free",
    planName: FREE.name,
    cap: FREE.storageBytes,
    used: Math.round(FREE.storageBytes * 0.97),
    events: 1,
    passExpiry: null,
    hasBilling: false,
    eventName: "Rosa and Dev's Engagement",
    knows: "She is at 97 percent of her room, with guests still uploading.",
  },
  // A paying host: the case /pricing gets wrong today, because it is static and
  // cannot tell her she already subscribes.
  pro: {
    initial: "M",
    email: "maya@chen.co",
    tier: "pro",
    planName: `Pro ${PRO_SIZES[1].name.replace("Pro ", "")}`,
    cap: PRO_SIZES[1].storageBytes,
    used: Math.round(PRO_SIZES[1].storageBytes * 0.26),
    events: 3,
    passExpiry: null,
    hasBilling: true,
    eventName: "Maya and Jay's Wedding",
    knows: "She already pays for this, monthly.",
  },
  // A pass holder, eight months in: the one host for whom "upgrade" is a
  // conversion with credit rather than a purchase.
  pass: {
    initial: "D",
    email: "dev@okonkwo.me",
    tier: "event_pass",
    planName: PASS.name,
    cap: PASS.storageBytes,
    used: Math.round(PASS.storageBytes * 0.81),
    events: 1,
    passExpiry: "12 March",
    hasBilling: true,
    eventName: "Dev's 40th",
    knows:
      "His pass has four months left, and its unused time is worth credit.",
  },
};

export const triggerOf = (v: string | undefined): Trigger =>
  v === "cap" || v === "pro" || v === "pass" ? v : "feature";

/** What the meter reads, rounded the way the shipped meter rounds it. */
export const pctOf = (f: Fixture): number => Math.round((f.used / f.cap) * 100);

/**
 * The plan a trigger-aware surface opens on.
 *
 * A cap gate resolves through the SAME `smallestProFor` the marketing
 * calculator uses, so the surface can never upsell past fit; a Free host at
 * 2 GB always lands on the smallest Pro, and a host arriving with more bytes
 * would land higher by the same rule. A subscriber opens on what she holds.
 */
export function openingPlan(f: Fixture, trigger: Trigger): Plan {
  if (trigger === "cap") return smallestProFor(f.used);
  if (trigger === "pro") return PRO_SIZES[1];
  return PRO_DEFAULT;
}

/** "about 25,600 photos or 10 hours of video", the shared formatter's sentence. */
export const holds = (bytes: number, video = true): string =>
  `about ${formatCapacity(bytes, { video })}`;

/** The four lines the marketing page's unlock grid calls the paid wall. */
export const UNLOCKS = [
  "Video uploads, for you and every guest",
  `${MAX_REEL_SECONDS.pro}-second reels with no mark`,
  "Password locks and custom links",
  "Your own host page",
] as const;

/** The pass's own promises, from billing-caps.md, as the pass card says them. */
export const PASS_LINES = [
  `One event, ${holds(PASS.storageBytes)}`,
  "Passes stack: each adds an event",
  `Renews at ${EVENT_PASS_RENEWAL_PRICE_LABEL} a year`,
  "Go Pro later and unused time becomes credit",
] as const;
