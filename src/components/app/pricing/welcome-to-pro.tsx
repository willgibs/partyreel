"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, PartyPopper } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatCapacity } from "@/lib/constants/tiers";

/**
 * THE DOOR OUT OF CHECKOUT (`back=finish` and his note, Will 2026-09-20: "I
 * think a modal could be a more delightful confirmation than the box up top.
 * They should be excited to join Pro. If they did not upgrade from being
 * blocked by a locked action (so they can't be returned to finish the job),
 * this could return them to the dashboard with the upgrade delight 'welcome to
 * pro' modal.")
 *
 * It replaces `dashboard/upgraded-toast.tsx`, which said the same true things
 * in a corner for four seconds. Nothing about the CARE in that component is
 * lost, and two pieces of it are load-bearing:
 *
 * ★ THE WEBHOOK RACE, WHICH IS REAL AND NOT RARE. The Stripe webhook is the
 * SOLE writer of `profiles.tier` (billing-caps.md) and Stripe redirects the
 * buyer the INSTANT payment succeeds, which routinely beats the webhook by a
 * second or two. So the SERVER decides which of two true things this says:
 * `applied` means the tier already moved off Free, and otherwise we claim the
 * payment and never the plan. Do not "simplify" the two branches into one
 * congratulation.
 *
 * ★ AND THE MODAL HEALS ITSELF RATHER THAN LYING QUIETLY. When the tier has not
 * landed yet it re-reads the server a few times, a couple of seconds apart, and
 * flips to the real receipt the moment the webhook writes: the toast used to
 * say "it shows here in a moment" and then leave. The poll is BOUNDED (four
 * tries, then it stops) because an unbounded refresh loop against a webhook
 * that never arrives is a worse failure than a modest sentence.
 *
 * ★ ONCE PER ARRIVAL. The marker is stripped from the URL on CLOSE rather than
 * on mount: the page is a server component, `router.replace` re-runs its RSC,
 * and stripping on mount would unmount the modal mid-celebration. Closing it is
 * the acknowledgement, and after that a reload cannot re-congratulate.
 */
export function WelcomeToPro({
  /** Server-read: the tier has actually moved off Free. Never a URL claim. */
  applied,
  /** From `TIER_NAMES` over the server's tier. */
  planName,
  /** The effective cap, server-derived, for the one receipt fact worth saying. */
  capBytes,
  /** This same URL with the marker gone (the server builds it, not the client). */
  nextUrl,
  /** The one primary door: its words, and a href only when it really leaves. */
  door,
}: {
  applied: boolean;
  planName: string;
  capBytes: number | null;
  nextUrl: string;
  door: { label: string; href?: string };
}) {
  const router = useRouter();
  const [open, setOpen] = useState(true);
  // StrictMode mounts effects twice in dev, and a refresh re-renders this
  // component: one poll per arrival, never one per render.
  const polls = useRef(0);

  useEffect(() => {
    if (applied) return;
    if (polls.current >= 4) return;
    const id = setTimeout(() => {
      polls.current += 1;
      router.refresh();
    }, 2000);
    return () => clearTimeout(id);
  }, [applied, router]);

  function close() {
    setOpen(false);
    // The soft navigation also re-runs the page's RSC, which is the last chance
    // to pick up a webhook that landed while the modal was open.
    router.replace(nextUrl, { scroll: false });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) close();
      }}
    >
      <DialogContent data-welcome-to-pro={applied ? "applied" : "pending"}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PartyPopper className="size-5 text-success" aria-hidden />
            {applied ? `Welcome to ${planName}` : "Payment received"}
          </DialogTitle>
          <DialogDescription className="text-pretty">
            {applied
              ? "Everything paid unlocks is on, right now, on every event you host."
              : `Your ${planName} plan is being applied. This updates by itself in a moment.`}
          </DialogDescription>
        </DialogHeader>

        {applied && (
          <ul className="space-y-2">
            {[
              capBytes
                ? `Room for about ${formatCapacity(capBytes, { video: true })}`
                : "More room, on every event",
              "Video from you and every guest",
              "Password locks, custom links and clean reels",
            ].map((line) => (
              <li key={line} className="flex items-start gap-2 text-sm">
                <Check
                  className="mt-0.5 size-4 shrink-0 text-success"
                  strokeWidth={2}
                  aria-hidden
                />
                <span className="text-muted-foreground">{line}</span>
              </li>
            ))}
          </ul>
        )}

        <DialogFooter>
          {door.href ? (
            <Button asChild className="w-full sm:w-auto">
              <a href={door.href}>{door.label}</a>
            </Button>
          ) : (
            <Button onClick={close} className="w-full sm:w-auto">
              {door.label}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
