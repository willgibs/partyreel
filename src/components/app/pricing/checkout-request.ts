import {
  parseStorageRefusal,
  type StorageRefusal,
} from "@/lib/billing/storage-guard";
import type { PlanId } from "@/lib/constants/tiers";

/**
 * ONE CLIENT FOR `/api/stripe/checkout`, the surface's Checkout verb (`pricing-doors.tsx`) and the sibling of
 * `change-plan-request.ts`: the route's answers read once, as outcomes, so the button that presses it never touches
 * `fetch`, and a specimen that must not reach Stripe hands in a verb of its own instead of a button of its own.
 *
 * It never rejects: a network that is down or an answer that is not JSON reads as an `error` with the sentence a host
 * can act on, so the one place that presses it needs no try/catch of its own.
 */
export type CheckoutOutcome =
  /** Go: Stripe's Checkout page for this plan (`leave`, `pricing-doors.tsx`, takes it from here). */
  | { kind: "redirect"; url: string }
  /** The host stores more than this Pro size holds: show the numbers, never a bare toast. */
  | { kind: "refused"; refusal: StorageRefusal }
  /**
   * She is on Pro already (`already_subscribed`). A Pro size pressed on the tier-blind pricing page is a CHANGE, so the
   * button posts the same plan to change-plan (never the general portal, whose switcher cannot know what a host
   * stores); a pass keeps the route's own sentence, since Pro already includes what a pass adds (billing-caps.md).
   */
  | { kind: "subscribed"; message: string }
  /** Any other refusal or failure, with the route's own sentence and code. */
  | { kind: "error"; message: string; code: string | null }
  /** The session lapsed: sign in again. */
  | { kind: "signin" };

export type CheckoutOptions = {
  /** Event Pass only: the cheaper renewal price (gated server-side). */
  renewal?: boolean;
  /**
   * Where Checkout should land the buyer (`back=finish`): the app path they were refused at. A PREFERENCE, never a
   * redirect: the route re-validates it against the exact-shape allow-list in `pricing/return-path.ts` and falls back
   * to the dashboard, so nothing a browser can put here leaves the app.
   */
  next?: string;
};

export async function requestCheckout(
  planId: PlanId,
  { renewal, next }: CheckoutOptions = {},
): Promise<CheckoutOutcome> {
  try {
    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ planId, renewal, next }),
    });
    if (res.status === 401) return { kind: "signin" };
    const data: unknown = await res.json().catch(() => null);

    // THE STORAGE GUARD (billing-caps.md): a Pro plan smaller than what the host stores is refused with the numbers,
    // and they are what a host reads.
    const refusal = parseStorageRefusal(data);
    if (refusal) return { kind: "refused", refusal };

    const body = (data ?? {}) as {
      url?: unknown;
      message?: unknown;
      code?: unknown;
    };
    const message =
      typeof body.message === "string" ? body.message : "Please try again.";
    if (res.status === 409 && body.code === "already_subscribed") {
      return { kind: "subscribed", message };
    }
    if (res.ok && typeof body.url === "string" && body.url) {
      return { kind: "redirect", url: body.url };
    }
    return {
      kind: "error",
      message,
      code: typeof body.code === "string" ? body.code : null,
    };
  } catch {
    return { kind: "error", message: "Please try again.", code: null };
  }
}
