/**
 * ONE CLIENT FOR `/api/stripe/portal`, the surface's billing-portal verb (`pricing-doors.tsx`), read as outcomes the way
 * `checkout-request.ts` reads Checkout's: the card on file, the invoices and cancelling are Stripe's page, and the button
 * that opens it never touches `fetch`.
 *
 * It never rejects: a network that is down or an answer that is not JSON reads as an `error`.
 */
export type PortalOutcome =
  /** Go: Stripe's billing portal (`leave`, `pricing-doors.tsx`, takes it from here). */
  | { kind: "redirect"; url: string }
  /** The session lapsed: sign in again. */
  | { kind: "signin" }
  /** Any refusal or failure, with the route's own sentence (`no_customer`: nobody has been through checkout yet). */
  | { kind: "error"; message: string };

export async function requestPortal(): Promise<PortalOutcome> {
  try {
    const res = await fetch("/api/stripe/portal", { method: "POST" });
    if (res.status === 401) return { kind: "signin" };
    const data: unknown = await res.json().catch(() => null);
    const body = (data ?? {}) as { url?: unknown; message?: unknown };
    if (res.ok && typeof body.url === "string" && body.url) {
      return { kind: "redirect", url: body.url };
    }
    return {
      kind: "error",
      message:
        typeof body.message === "string" ? body.message : "Please try again.",
    };
  } catch {
    return { kind: "error", message: "Please try again." };
  }
}
