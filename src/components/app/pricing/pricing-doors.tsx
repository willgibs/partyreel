"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useRouter } from "next/navigation";

import { requestChangePlan } from "@/components/app/pricing/change-plan-request";
import { requestCheckout } from "@/components/app/pricing/checkout-request";
import { leaveForStripe } from "@/components/app/pricing/leave";
import { requestPortal } from "@/components/app/pricing/portal-request";

/**
 * THE PRICING SURFACE'S DOORS: every place its presses and its one read reach outside the app, as one value a surface
 * can hand in (`StorageSource`'s sibling, `storage/storage-source.tsx`).
 *
 * WHY A CONTEXT: the plans' sheet, the lock chip and the receipt are drawn from doors that know nothing about each
 * other (a lock in Settings, the storage meter's Need more, the clip maker, Checkout's return), and what they reach is
 * not theirs to fake: Checkout, the billing portal and Stripe's confirm page leave the app, and the sheet's read asks
 * the server what the host stores. So the production answer is the default, every component here reads it without a
 * prop threaded through the sheet, and the Library's specimens wrap their own inert doors around the surface
 * (`PricingDoorsProvider`), so a reviewer there can press Get Pro, Manage billing and Switch and never reach Stripe, and
 * the sheet opens on the facts the specimen is about, not on whoever happens to be signed in to the lab.
 *
 * ★ EVERY DOOR IS A VERB, AND THE BUTTONS ARE THE APP'S OWN. Checkout, the portal and the plan switch each ask their
 * route and answer an outcome, the way out is a function, and the real buttons (`CheckoutButton`,
 * `ManageBillingButton`, `ChangePlanButton`) press whichever the nearest provider names: a specimen swaps a verb, never a
 * button, so what a reviewer sees pending, refused or leaving is the product's own, and the button a stand-in used to
 * redraw cannot drift from the one it stood for.
 *
 * ★ A SURFACE NEVER SWAPS ITS OWN DOORS. The provider is imported by the lab and by tests only
 * (`pricing-doors.test.tsx` scans for it): a product page that handed itself an inert door would sell nothing and read
 * nothing, and no gate would see it. Nothing here decides an entitlement either way (billing-caps.md): the doors are
 * where the surface's presses go, never what a plan holds.
 *
 * ★ A DOOR IS NAMED IN FULL. `PricingDoorsProvider` takes every door, never "the ones to replace": a stand-in that forgot
 * one would quietly leave the real one standing, and the one place that must be inert is the one that cannot afford a
 * default. A door added to the type fails every stand-in at compile time until it names it.
 *
 * ★ A DOORS VALUE IS ONE STABLE OBJECT (a module constant, or a memo over what it closes on): the sheet's read is keyed
 * on its `readFacts`, so one rebuilt on every render would read again on every render.
 */

/** What the surface asks of the app's router: the verbs its screens use, whichever router answers. */
export type PricingRouter = Pick<
  ReturnType<typeof useRouter>,
  "push" | "replace" | "refresh"
>;

export type PricingDoors = {
  /**
   * The plans' sheet's one read, made each time it opens: what `/api/stripe/plan-facts` answers (parsed by
   * `parsePlanFacts`), or null when it cannot be read. Rejects on an abort or a network that is down, as `fetch` does.
   */
  readFacts: (signal: AbortSignal) => Promise<unknown>;
  /** Checkout for a plan: the checkout route's one client. It never rejects; its outcomes are `CheckoutOutcome`'s. */
  startCheckout: typeof requestCheckout;
  /** Stripe's billing portal: the portal route's one client. It never rejects; its outcomes are `PortalOutcome`'s. */
  openPortal: typeof requestPortal;
  /** A Pro host's switch to one of the six prices: the change-plan route's one client. */
  changePlan: typeof requestChangePlan;
  /**
   * The way out, taken when one of the three above answers `redirect`: leave the app for that address, Stripe's page.
   * The real one leaves without a history entry of the sheet's behind it (`leave.ts`), so one Back returns to the page.
   */
  leave: (url: string) => void;
  /**
   * The router the receipt, the switch and the presses' sign-in fallback use. Absent, the app's own: there is nothing
   * to hand in where the router is the app's (every page), and a specimen that must not navigate names one.
   */
  router?: PricingRouter;
};

/** The sheet's read, as it was before the doors were named: `no-store`, aborted with the sheet, a non-200 read as none. */
function readFactsFromServer(signal: AbortSignal): Promise<unknown> {
  return fetch("/api/stripe/plan-facts", {
    cache: "no-store",
    signal,
  }).then((res) => (res.ok ? res.json() : null));
}

/** Production's doors: the real routes, the real way out and the app's own router. */
const SERVER: PricingDoors = {
  readFacts: readFactsFromServer,
  startCheckout: requestCheckout,
  openPortal: requestPortal,
  changePlan: requestChangePlan,
  leave: leaveForStripe,
};

const PricingDoorsContext = createContext<PricingDoors>(SERVER);

export function PricingDoorsProvider({
  doors,
  children,
}: {
  doors: PricingDoors;
  children: ReactNode;
}) {
  return (
    <PricingDoorsContext.Provider value={doors}>
      {children}
    </PricingDoorsContext.Provider>
  );
}

export function usePricingDoors(): PricingDoors {
  return useContext(PricingDoorsContext);
}

/**
 * The router the surface's screens use: the doors' own when a specimen names one, else the app's. `useRouter` is read
 * either way (a hook is never conditional), so a screen costs the same wherever it is drawn.
 */
export function usePricingRouter(): PricingRouter {
  const app = useRouter();
  return usePricingDoors().router ?? app;
}
