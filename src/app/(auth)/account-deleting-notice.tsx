"use client";

import Link from "next/link";
import { Hourglass } from "lucide-react";
import { useSyncExternalStore } from "react";

import { accountDeletingLine } from "@/app/(auth)/account-deleting";
import { browserZone, purgeTimeLabel } from "@/lib/lifecycle/purge-time";
import { cn } from "@/lib/utils";

/** A zone never changes under a page, so there is nothing to subscribe to. */
const steady = () => () => {};

/**
 * THE DOOR'S ANSWER TO A SIGN-IN THAT MEETS A DELETION'S BAN (`account-deleting.ts` says where
 * each door meets it and why the words are what they are): why this address is refused, when it
 * can start fresh in the reader's own zone, and one way out for an address still refused after
 * that time. Never a failure's red: nothing went wrong with what she did, she is early.
 *
 * ★ THE TIME IS THE READER'S, AND THE FIRST PAINT IS THE SERVER'S. `/login` renders this on the
 * server, which knows the zone only from the request (Vercel's IP header, `serverZone`); hydration
 * paints that same zone, and the render after it moves to the browser's own (`useSyncExternalStore`
 * keeps the two from ever disagreeing mid-hydration). `now` comes from whoever computed `endsAt`,
 * so a server render and the browser's agree on "tonight" and "tomorrow" to the second.
 */
export function AccountDeletingNotice({
  endsAt,
  now,
  email,
  serverZone = "UTC",
  className,
}: {
  /** The purge window's end (`nextPurgeWindow(now).end`), as a time value. */
  endsAt: number;
  /** The moment it was reckoned from. */
  now: number;
  /** The address GoTrue refused, when this browser asked it directly (the code screen). */
  email?: string | null;
  /** The zone a server render paints first. */
  serverZone?: string;
  className?: string;
}) {
  const zone = useSyncExternalStore(steady, browserZone, () => serverZone);
  return (
    <div
      role="alert"
      data-account-deleting=""
      className={cn(
        "flex gap-2.5 rounded-lg border bg-muted/50 px-3 py-2.5 text-left text-sm text-foreground",
        className,
      )}
    >
      <Hourglass
        aria-hidden
        className="mt-0.5 size-4 shrink-0 text-muted-foreground"
      />
      <p className="min-w-0 text-pretty break-words">
        {accountDeletingLine(purgeTimeLabel(endsAt, now, zone), email)}
        <span className="text-muted-foreground">
          {" If it’s still blocked after that, "}
          <Link
            href="/contact"
            className="text-foreground underline underline-offset-4"
          >
            contact us
          </Link>
          {"."}
        </span>
      </p>
    </div>
  );
}
