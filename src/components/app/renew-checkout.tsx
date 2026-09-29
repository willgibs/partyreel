"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CircleAlert, Loader2, TicketX } from "lucide-react";

import { NotFoundScreen } from "@/components/shared/not-found-screen";
import { Button } from "@/components/ui/button";

/**
 * THE RENEWAL NUDGE'S BUTTON, FINISHED (`emails` r1: "Renew Event Pass goes where it says"). A mail
 * link can only open a page and the pass's renewal Checkout is a POST, so this page makes the same
 * POST the Plan card's Renew button makes (the checkout route, untouched, decides everything: the
 * cheaper renewal price, whether a pass is still running to renew, Pro) and hands the holder to
 * Stripe. Paying lands on /account (`next`), exactly as the Plan card's button does.
 *
 * ★ ONE SESSION PER VISIT. The start is guarded by a ref, because a development render runs every
 * effect twice and a second POST would open a second Checkout session; and the page replaces itself
 * in history on the way out, so Back from Stripe returns to the mail rather than to a page that
 * would start yet another.
 *
 * A refusal is the route's own sentence under the page's one heading, with a way on: a pass that
 * has already ended ("start a new Event Pass from the pricing page"), an account on Pro. Nothing
 * here is a dead end, and nothing is charged until Stripe's own page.
 */

/** What the page does with the checkout route's answer. Pure, so the test reads every branch. */
export type RenewOutcome =
  | { kind: "redirect"; url: string }
  | { kind: "signin" }
  /** `code` is the route's own (`not_eligible`: the pass has ended; `already_subscribed`: Pro). */
  | { kind: "refused"; message: string; code: string | null }
  | { kind: "failed" };

export function renewOutcome(status: number, body: unknown): RenewOutcome {
  if (status === 401) return { kind: "signin" };
  const data = (body ?? {}) as {
    url?: unknown;
    message?: unknown;
    code?: unknown;
  };
  if (status >= 200 && status < 300 && typeof data.url === "string") {
    return { kind: "redirect", url: data.url };
  }
  // A 4xx carries a sentence written for the holder (checkout's `refuse`); anything else is ours.
  if (
    status >= 400 &&
    status < 500 &&
    typeof data.message === "string" &&
    data.message.length > 0
  ) {
    return {
      kind: "refused",
      message: data.message,
      code: typeof data.code === "string" ? data.code : null,
    };
  }
  return { kind: "failed" };
}

/** The same body the Plan card's Renew button posts (account/page.tsx). */
const RENEWAL = { planId: "event_pass", renewal: true, next: "/account" };

async function startRenewal(): Promise<RenewOutcome> {
  try {
    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(RENEWAL),
    });
    const body = await res.json().catch(() => null);
    return renewOutcome(res.status, body);
  } catch {
    return { kind: "failed" };
  }
}

type View =
  | { kind: "starting" }
  | Exclude<RenewOutcome, { kind: "redirect" | "signin" }>;

export function RenewCheckout() {
  const [view, setView] = useState<View>({ kind: "starting" });
  const started = useRef(false);

  async function run() {
    const outcome = await startRenewal();
    if (outcome.kind === "redirect") {
      window.location.replace(outcome.url);
      return;
    }
    if (outcome.kind === "signin") {
      window.location.replace("/login");
      return;
    }
    setView(outcome);
  }

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void run();
  }, []);

  function retry() {
    setView({ kind: "starting" });
    void run();
  }

  /** The page's two ways on, the first one filled: the button that does what the sentence says. */
  function waysOn(first: "plan" | "pricing") {
    const plan = (
      <Button
        key="plan"
        asChild
        size="cta"
        variant={first === "plan" ? "default" : "outline"}
      >
        <Link href="/account#plan">Open your plan</Link>
      </Button>
    );
    const pricing = (
      <Button
        key="pricing"
        asChild
        size="cta"
        variant={first === "pricing" ? "default" : "outline"}
      >
        <Link href="/pricing">See plans</Link>
      </Button>
    );
    return first === "plan" ? [plan, pricing] : [pricing, plan];
  }

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center">
      {view.kind === "starting" ? (
        <div
          role="status"
          className="flex flex-col items-center gap-3 text-center"
        >
          <Loader2
            className="size-5 animate-spin text-muted-foreground motion-reduce:animate-none"
            aria-hidden
          />
          <p className="text-sm text-muted-foreground">
            Opening checkout for your Event Pass renewal.
          </p>
        </div>
      ) : view.kind === "refused" ? (
        <NotFoundScreen
          icon={TicketX}
          title="Renew Event Pass"
          description={view.message}
          // An ended pass is bought fresh, and its sentence says so ("from the pricing page"); any
          // other refusal (Pro) is read on the plan it names.
          actions={waysOn(view.code === "not_eligible" ? "pricing" : "plan")}
        />
      ) : (
        <NotFoundScreen
          icon={CircleAlert}
          title="Checkout didn't open"
          description="Nothing was charged. Try again, or renew from your plan."
          actions={
            <>
              <Button size="cta" onClick={retry}>
                Try again
              </Button>
              <Button asChild size="cta" variant="outline">
                <Link href="/account#plan">Open your plan</Link>
              </Button>
            </>
          }
        />
      )}
    </div>
  );
}
