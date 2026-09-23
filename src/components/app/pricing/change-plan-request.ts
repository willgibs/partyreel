import {
  parseStorageRefusal,
  type StorageRefusal,
} from "@/lib/billing/storage-guard";
import type { ProPlanId } from "@/lib/validation/checkout";

/**
 * ONE CLIENT FOR `/api/stripe/change-plan`, shared by the sheet's price list and by
 * the CheckoutButton's `already_subscribed` hop, so both read a refusal the same way
 * and neither can drift into opening the general portal (whose switcher is the door
 * the storage guard routes around).
 */
export type ChangePlanOutcome =
  /** Go: Stripe's confirm page for exactly this one price. */
  | { kind: "redirect"; url: string }
  /** The host stores more than the plan holds: show the numbers, never a bare toast. */
  | { kind: "refused"; refusal: StorageRefusal }
  /** Any other refusal or failure, with the server's own sentence and code. */
  | { kind: "error"; message: string; code: string | null }
  /** The session lapsed: sign in again. */
  | { kind: "signin" };

export async function requestChangePlan(
  planId: ProPlanId,
  next?: string,
): Promise<ChangePlanOutcome> {
  try {
    const res = await fetch("/api/stripe/change-plan", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ planId, next }),
    });
    if (res.status === 401) return { kind: "signin" };
    const data: unknown = await res.json().catch(() => null);
    const refusal = parseStorageRefusal(data);
    if (refusal) return { kind: "refused", refusal };
    const body = (data ?? {}) as {
      ok?: unknown;
      url?: unknown;
      message?: unknown;
      code?: unknown;
    };
    if (res.ok && body.ok === true && typeof body.url === "string") {
      return { kind: "redirect", url: body.url };
    }
    return {
      kind: "error",
      message:
        typeof body.message === "string" ? body.message : "Please try again.",
      code: typeof body.code === "string" ? body.code : null,
    };
  } catch {
    return { kind: "error", message: "Please try again.", code: null };
  }
}

/**
 * The toast for a change that did not open. Choosing the plan you are on is not a
 * failure, so it reads as a plain note; everything else is an error with the
 * server's sentence.
 */
export function announceChangePlanError(
  outcome: Extract<ChangePlanOutcome, { kind: "error" }>,
  toaster: {
    (message: string): unknown;
    error: (message: string, options?: { description?: string }) => unknown;
  },
) {
  if (outcome.code === "already_on_plan") {
    toaster(outcome.message);
    return;
  }
  toaster.error("Couldn't change your plan.", {
    description: outcome.message,
  });
}
