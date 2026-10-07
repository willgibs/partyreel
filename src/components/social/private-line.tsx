import { Lock } from "lucide-react";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

/**
 * THE PRIVATE LINE (`account-moments` r2, the board's term: "a lock and a few muted words, the way her own page says
 * 'Only you can see this page.'"): the one object every place that tells her something is only hers wears, so her own
 * page (`/me`), a first follow (`first-follow-line.tsx`) and Connections (`page-connections.tsx`) say it in one look.
 * Muted, small, with the lock beside the first line of words however many follow; never a banner, a card or a colour
 * (a state is a light, and this is a fact).
 */
export function PrivateLine({
  className,
  children,
  ...rest
}: ComponentProps<"p">) {
  return (
    <p
      className={cn(
        "flex max-w-prose items-start gap-2 text-sm text-pretty text-muted-foreground",
        className,
      )}
      {...rest}
    >
      <Lock className="mt-0.5 size-4 shrink-0" aria-hidden />
      <span>{children}</span>
    </p>
  );
}

/**
 * The first word of a name, the way a friend says it ("Maya just sees one more follower"). A title ("Dr.") or a lone
 * initial ("J.") is no name on its own, so the whole name stands then; a handle ("@maya") is one word already.
 */
export function firstNameOf(name: string | null | undefined): string | null {
  const whole = name?.trim().replace(/\s+/g, " ") ?? "";
  if (!whole) return null;
  const [first = whole] = whole.split(" ");
  return first.endsWith(".") || first.length < 2 ? whole : first;
}

/**
 * WHAT A FIRST FOLLOW SAYS, ONCE (`follow=once`). The reassurance is the privacy and its limit: nobody sees who she
 * follows, and the one she followed sees a number go up (the follower count Account shows its owner, never a name; there
 * is no follow email, `notification_prefs`). ★ If a follow ever tells its person who followed, this sentence is false
 * and goes with the feature. A seat that knows the person's name says it ("Maya just sees…"); the guest list's and the
 * moment card's Follow know none, so they say "They just see…".
 */
export function followWords(name?: string | null): string {
  const first = firstNameOf(name);
  return first
    ? `Only you see who you follow. ${first} just sees one more follower.`
    : "Only you see who you follow. They just see one more follower.";
}

/** The same fact standing on the list it is about (Connections): there are many of them, so each is "each of them". */
export const FOLLOWING_WORDS =
  "Only you see who you follow. Each of them just sees one more follower.";
