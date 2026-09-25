"use client";

import { Button } from "@/components/ui/button";
import type { DoorPath } from "@/lib/guest/entry-steps";

/**
 * THE CHOOSER: how a guest comes in, on a name-only event.
 *
 * ★ HIS SOLUTION, IN HIS ORDER AND HIS WORDS (Will, `identity-door` r1 `nudge`: "After the welcome
 * screen, let's simply have a screen for guests to select how to proceed. For name-only events:
 * 'Continue as guest' (primary), create account, or log in. Much easier handling with intentional
 * paths."). It replaces weaving a sign-in nudge into the name step: each way in is its own
 * intentional path, and the guest who just wants the album takes the loud one.
 *
 * It asks nothing and types nothing, so nothing here can raise a keyboard: every way in hands
 * forward to the step that asks.
 */
export function DoorChooser({ onPick }: { onPick: (path: DoorPath) => void }) {
  const copy = chooserCopy();
  return (
    <div data-door-chooser className="flex flex-col gap-5">
      {/* For the eye; the shell announces the same two sentences as the sheet's name. */}
      <div aria-hidden>
        <p className="font-heading text-page text-balance">{copy.title}</p>
        <p className="mt-2 text-base leading-relaxed text-muted-foreground">
          {copy.reason}
        </p>
      </div>
      <div className="flex flex-col gap-2">
        <Button
          type="button"
          size="cta"
          className="w-full"
          onClick={() => onPick("guest")}
        >
          Continue as guest
        </Button>
        <Button
          type="button"
          variant="outline"
          size="cta"
          className="w-full"
          onClick={() => onPick("create")}
        >
          Create account
        </Button>
        <Button
          type="button"
          variant="outline"
          size="cta"
          className="w-full"
          onClick={() => onPick("login")}
        >
          Log in
        </Button>
      </div>
    </div>
  );
}

/**
 * The chooser's two sentences. The reason names what each kind of way in costs and buys, and
 * never promises "no account" (the bible's tenth): a name is all the guest path asks, and an
 * account is where the photos stay.
 */
export function chooserCopy(): { title: string; reason: string } {
  return {
    title: "How do you want to join?",
    reason:
      "A name is all it takes. With an account, every photo you add stays with you.",
  };
}
