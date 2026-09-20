"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AtSign,
  KeyRound,
  Keyboard,
  LifeBuoy,
  Mail,
  RotateCcw,
  Timer,
} from "lucide-react";

import { GoogleIcon } from "@/components/auth/google-icon";
import { Button } from "@/components/ui/button";
import type { DoorAction, DoorActionId, DoorFailure } from "@/lib/auth/door-failure";
import { cn } from "@/lib/utils";

/**
 * THE FAILURE, AND THE WAYS OUT AS CONTROLS (Will, 2026-09-20, `app-door` r1
 * `failure=paths`: "keeping the failure on the screen and offering helpful
 * actions"; the visual redesign was his to the lane).
 *
 * The line and the three actions come from `lib/auth/door-failure.ts` — one
 * table for the /login page's `?error=`, the code screen's wrong code, and a
 * refused password — so the wording cannot drift between them. This file owns
 * only what an action id LOOKS like and which handler it reaches.
 *
 * ★ AN ACTION WITH NO HANDLER IS NOT DRAWN AS A DEAD BUTTON. `contact` is a
 * real link so it always works; every other id renders only when the surface
 * passed a handler for it, and the row keeps its remaining controls rather than
 * showing a host a button that does nothing. That is the one place the table's
 * "always three" bends, and only where a surface genuinely has no such door (a
 * guest dialog has no password to reset).
 *
 * ★ AND A RECOVERY ALREADY ON SCREEN IS NOT PROMOTED TWICE (`suppress`). This
 * is the board's own finding, measured in a capture: drawing the three
 * recoveries over a form that already carries two of them showed each of them
 * TWICE, forty pixels apart, and read as a bug rather than as an option. So the
 * password door, whose recoveries are genuinely elsewhere, promotes all three;
 * the code-led door, whose field and Google button ARE two of them, suppresses
 * those and keeps the line over the controls it already has. Either way the
 * failure stays on screen with real controls under it, which is the ruling.
 */

const ICONS: Record<DoorActionId, React.ComponentType<{ className?: string }>> =
  {
    send_code: Mail,
    type_code: Keyboard,
    try_again: RotateCcw,
    resend: Mail,
    different_email: AtSign,
    google: GoogleIcon,
    retry_google: GoogleIcon,
    forgot: KeyRound,
    contact: LifeBuoy,
    wait: Timer,
  };

export type DoorActionHandlers = Partial<
  Record<Exclude<DoorActionId, "contact">, () => void>
>;

export function FailurePaths({
  failure,
  handlers,
  suppress,
  className,
}: {
  failure: DoorFailure;
  handlers: DoorActionHandlers;
  /** Ids the surface is ALREADY showing as controls; see the header. */
  suppress?: readonly DoorActionId[];
  className?: string;
}) {
  // The block ENTERS. A refusal that appears instantly reads as though it was
  // always there and the press did nothing; 180ms on the emphasis curve is the
  // smallest amount of movement that says "this is the answer to what you just
  // did". Reduced motion gets the same block, placed.
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const drawn = failure.actions.filter((a) => {
    if (suppress?.includes(a.id)) return false;
    if (a.id === "contact" || a.waiting) return true;
    return Boolean(handlers[a.id as keyof DoorActionHandlers]);
  });

  return (
    <div
      data-door-failure={failure.kind}
      role="alert"
      className={cn(
        "flex flex-col gap-3 transition duration-180 ease-emphasis motion-reduce:transition-none",
        shown ? "translate-y-0 opacity-100" : "-translate-y-1 opacity-0",
        className,
      )}
    >
      <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
        {failure.line}
      </p>
      {drawn.length > 0 && (
        <div className="flex flex-col gap-2">
          {drawn.map((action) => (
            <PathButton key={action.id} action={action} handlers={handlers} />
          ))}
        </div>
      )}
    </div>
  );
}

function PathButton({
  action,
  handlers,
}: {
  action: DoorAction;
  handlers: DoorActionHandlers;
}) {
  const Icon = ICONS[action.id];
  const press = "active:scale-[0.99] motion-reduce:active:scale-100";

  if (action.id === "contact") {
    return (
      <Button asChild variant="outline" size="lg" className={cn("w-full", press)}>
        <Link href="/contact">
          <Icon /> {action.label}
        </Link>
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="lg"
      // A countdown is the recovery, so it stays on screen and stays unpressable
      // until the limiter clears. aria-disabled over `disabled` keeps it in the
      // tab order, so a screen reader still reads the seconds.
      aria-disabled={action.waiting || undefined}
      onClick={
        action.waiting
          ? undefined
          : handlers[action.id as keyof DoorActionHandlers]
      }
      className={cn(
        "w-full",
        press,
        action.waiting && "pointer-events-none opacity-60",
      )}
    >
      <Icon /> {action.label}
    </Button>
  );
}
