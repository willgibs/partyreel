"use client";

import { useId } from "react";

import { DoorHeading } from "@/components/guest/door/heading";
import { Button } from "@/components/ui/button";
import type { DoorPath } from "@/lib/guest/entry-steps";
import { cn } from "@/lib/utils";

/**
 * THE CHOOSER: how a guest comes in, on a name-only event.
 *
 * ★ HIS SOLUTION, IN HIS ORDER AND HIS WORDS (Will, `identity-door` r1 `nudge`: "After the welcome
 * screen, let's simply have a screen for guests to select how to proceed. For name-only events:
 * 'Continue as guest' (primary), create account, or log in. Much easier handling with intentional
 * paths."). It replaces weaving a sign-in nudge into the name step: each way in is its own
 * intentional path, and the guest who just wants the album takes the loud one.
 *
 * ★ EACH WAY IN SAYS WHAT IT GIVES (`identity-door` r3, Will's `chooser=told`): the sentence that
 * explained the three is gone, and each button carries its own small line from it, so the choice
 * explains itself at the place she chooses: what a name costs sits on the button she presses, and
 * an account's reason reaches the guest deciding rather than a paragraph she skips. The lines are
 * promises the door already makes (the chooser's old sentence, Log in's), so no way in is sold
 * with a word the door does not already say.
 *
 * It asks nothing and types nothing, so nothing here can raise a keyboard: every way in hands
 * forward to the step that asks.
 */
export function DoorChooser({ onPick }: { onPick: (path: DoorPath) => void }) {
  const copy = chooserCopy();
  return (
    <div data-door-chooser className="flex flex-col gap-5">
      {/* For the eye; the shell announces the title and the old sentence as the sheet's name. */}
      <DoorHeading title={copy.title} hidden />
      <div className="flex flex-col gap-2">
        <Way primary line={copy.ways.guest} onClick={() => onPick("guest")}>
          Continue as guest
        </Way>
        <Way line={copy.ways.create} onClick={() => onPick("create")}>
          Create account
        </Way>
        <Way line={copy.ways.login} onClick={() => onPick("login")}>
          Log in
        </Way>
      </div>
    </div>
  );
}

/**
 * One way in: the button's word, and under it the small line saying what it gives. The line
 * DESCRIBES the button rather than naming it, so a screen reader and a voice command both meet the
 * button by its word ("Continue as guest") and hear what it gives after.
 */
function Way({
  primary = false,
  line,
  onClick,
  children,
}: {
  primary?: boolean;
  line: string;
  onClick: () => void;
  children: string;
}) {
  const lineId = useId();
  return (
    <Button
      type="button"
      variant={primary ? "default" : "outline"}
      size="cta"
      aria-label={children}
      aria-describedby={lineId}
      data-door-way
      className="h-auto w-full flex-col gap-0.5 py-2.5"
      onClick={onClick}
    >
      <span className="leading-tight">{children}</span>
      <span
        id={lineId}
        data-door-way-line
        className={cn(
          "text-xs leading-tight font-normal",
          primary ? "text-primary-foreground/70" : "text-muted-foreground",
        )}
      >
        {line}
      </span>
    </Button>
  );
}

/**
 * The chooser's words. The title asks; `reason` is no longer drawn (the ways carry it now) but
 * stays the sheet's accessible description, the one sentence a screen reader hears before the three
 * buttons. It names what each kind of way in costs and buys, and never promises "no account" (the
 * bible's tenth): a name is all the guest path asks, and an account is where the photos stay.
 */
export function chooserCopy(): {
  title: string;
  reason: string;
  ways: Record<DoorPath, string>;
} {
  return {
    title: "How do you want to join?",
    reason:
      "A name is all it takes. With an account, every photo you add stays with you.",
    ways: {
      guest: "Just your name",
      create: "Every photo you add stays with you",
      login: "The photos you add join your account",
    },
  };
}
