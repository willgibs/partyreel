import type { BoardState } from "@/components/lab/board-spec";
import {
  isNavGroup,
  PRIMARY_NAV,
  type NavGroup,
  type NavItem,
  type NavLink,
} from "@/lib/constants/marketing-nav";

/**
 * THE BOARD'S STATE, AND THE NAV EACH ANSWER MAKES.
 *
 * ★ THE SHIPPED CONSTANT IS READ, NEVER COPIED. Every label, href and panel
 * description below comes out of `marketing-nav.ts`, which is the one source
 * the header, the mobile sheet and the footer all read. A reshaped candidate
 * (three groups instead of four, a flat bar instead of panels) is built by
 * SELECTING from that list, so an option is always drawn with the site's real
 * words and a copy edit upstream reaches this board for free.
 *
 * ★ AND IT DIVERGES FROM THE MIRROR PINS BY CONSTRUCTION, which is expected
 * and stated in the track's goal: `marketing-nav.test.ts` pins the shipped
 * PRIMARY_NAV against the page registries and pins the header's Resources
 * panel equal to the footer's Resources column. A candidate that folds
 * Resources into the footer breaks that mirror on purpose. Nothing here
 * touches the constant, so the pins stay green on what they actually guard.
 */

/* ── The answers, as types ───────────────────────────────────────────────── */

export type Shape = "panels" | "flat" | "door";
export type Holds = "four" | "three" | "two";
export type Returning = "both" | "dashboard" | "avatar";
export type PhoneMenu = "sheet" | "flat" | "bar";
export type OnScroll = "stay" | "shrink" | "hide";
export type FootJob = "three" | "sitemap" | "close";
export type FootDoor = "vanish" | "always" | "demo";
export type TwoDoors = "unlabelled" | "one" | "named";

/** The option id off the board's state, or the recommendation when it is unset. */
function pick<T extends string>(
  value: unknown,
  all: readonly T[],
  fallback: T,
): T {
  return all.includes(value as T) ? (value as T) : fallback;
}

export const shapeOf = (s: BoardState): Shape =>
  pick(s.shape, ["panels", "flat", "door"], "flat");
export const holdsOf = (s: BoardState): Holds =>
  pick(s.holds, ["four", "three", "two"], "three");
export const twoDoorsOf = (s: BoardState): TwoDoors =>
  pick(s["two-doors"], ["unlabelled", "one", "named"], "one");
export const footJobOf = (s: BoardState): FootJob =>
  pick(s["foot-job"], ["three", "sitemap", "close"], "close");

/**
 * ROUND TWO'S ANSWERS (2026-09-19): round one's eight types above stay for
 * `chrome.tsx` and `menu.tsx`, which still draw the header and phone sheet this
 * round does not touch (registry.test.ts's own "free of React" check is on
 * spec.ts alone, so the retired asks' evidence is free to stand as precedent).
 * The three below are this round's whole state.
 */
export type FootAfter = "today" | "quiet" | "merged" | "tucked";
export type FootAlone = "full" | "same";
export type FootPhone = "hidden" | "small" | "none";

export const footAfterOf = (s: BoardState): FootAfter =>
  pick(s["foot-after"], ["today", "quiet", "merged", "tucked"], "quiet");
export const footAloneOf = (s: BoardState): FootAlone =>
  pick(s["foot-alone"], ["full", "same"], "full");

/* ── The groups, taken out of the shipped nav ────────────────────────────── */

function group(label: string): NavGroup {
  const found = PRIMARY_NAV.find(
    (item) => item.label === label && isNavGroup(item),
  );
  if (!found)
    throw new Error(`site-chrome: no "${label}" group in PRIMARY_NAV`);
  return found as NavGroup;
}

export const FEATURES = group("Features");
export const EVENTS = group("Events");
export const RESOURCES = group("Resources");

export const PRICING: NavLink = { label: "Pricing", href: "/pricing" };
/** Today this door is a panel footnote, never a bar entry (see `two-doors`). */
export const HOW_IT_WORKS: NavLink = {
  label: "How it works",
  href: "/how-it-works",
};

/** What the bar names, per `holds`. Groups first, flat links last: the order is
 *  load-bearing for the panel cross-slide (marketing-nav.ts says why). */
export function navFor(holds: Holds): NavItem[] {
  if (holds === "four") return [FEATURES, EVENTS, RESOURCES, PRICING];
  if (holds === "three") return [FEATURES, EVENTS, PRICING];
  return [HOW_IT_WORKS, PRICING];
}

/**
 * The same bar with no panels: every entry is a flat link to its own hub.
 * Resources has no hub route (marketing-nav.ts: there is no /resources), so in
 * a flat bar it can only be its busiest child, the help center.
 */
export function flatFor(holds: Holds): NavLink[] {
  return navFor(holds).map((item) =>
    isNavGroup(item)
      ? { label: item.label, href: item.href ?? "/help" }
      : (item as NavLink),
  );
}

/* ── The page under the chrome ───────────────────────────────────────────── */

/** The photographs the fixture page stands on, from the licensed manifest. */
export const HERO_WALL = [
  "wedding-toast",
  "party-balloons",
  "reception-table",
  "festival-lights",
  "wedding-arch",
  "concert-confetti",
] as const;

export const FIXTURE_PAGE = {
  eyebrow: "Weddings",
  heading: "The whole wedding, in one album.",
  subhead:
    "Every guest's camera roll, in one place, the moment it is taken. One code on the table and the day collects itself.",
  chapter: "What the day looks like afterwards",
  body: "Guests scan the code, add what they shot, and the album fills while the party is still going. You keep every original.",
} as const;

/** The signed-in host the returning-host options draw. Fixture, never a row. */
export const HOST = { name: "Will", initial: "W" } as const;
