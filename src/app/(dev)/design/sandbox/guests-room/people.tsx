"use client";

import type { ReactNode } from "react";

import type { DoorPerson } from "@/app/(app)/dashboard/[eventId]/guests/at-the-door";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatCount } from "@/lib/format/count";
import { cn } from "@/lib/utils";

import type { Guest } from "./fixtures";

/**
 * THE PIECES EVERY CANDIDATE ROOM IS MADE OF, retyped from production's
 * atoms rather than imported from a board (a board's folder is deleted the
 * day it retires): a face, a section's head and the count a section wears.
 */

/** Her name, or her address where her profile has none (`at-the-door.tsx`'s rule). */
export const doorName = (p: DoorPerson): string =>
  p.name?.trim() || p.email || "A guest";

/** A face: production's seeded Avatar at a candidate's size, its initial the name's. */
export function Face({
  name,
  seed,
  className,
  dim = false,
}: {
  name: string;
  seed: string | null | undefined;
  /** The size, as a class (`size-10`): the candidates draw faces larger than the atom's steps. */
  className?: string;
  /** A blocked face: quieter, never hidden. */
  dim?: boolean;
}) {
  return (
    <Avatar
      seed={seed ?? undefined}
      className={cn(className, dim && "opacity-45 grayscale")}
    >
      <AvatarFallback className="text-[0.8em] font-medium">
        {name.slice(0, 1).toUpperCase()}
      </AvatarFallback>
    </Avatar>
  );
}

/**
 * A COUNT THAT WAITS ON HER WEARS THE TALLY (design-system.md: `--needs-you`,
 * solid and hard-edged, the hub's badges and the code's corner), so At the
 * door's number in the room is the same light as the hub's Guests card's;
 * every other count is the room's quiet pill (`FeedSectionHeader`'s).
 */
export function Count({ n, needs = false }: { n: number; needs?: boolean }) {
  return (
    <span
      data-gr-count={needs ? "needs" : "quiet"}
      className={cn(
        "flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold tabular-nums",
        needs
          ? "bg-(--needs-you) text-(--needs-you-foreground)"
          : "bg-muted text-muted-foreground",
      )}
    >
      {formatCount(n)}
    </span>
  );
}

/** A section's head: the room's eyebrow and its count, an action at its end (≤ h-7, the band's rule). */
export function Head({
  label,
  count,
  needs = false,
  action,
}: {
  label: string;
  count: number;
  needs?: boolean;
  action?: ReactNode;
}) {
  return (
    <div className="flex min-h-7 items-center justify-between gap-3">
      <h2 className="flex items-center gap-1.5">
        <span className="text-label font-semibold text-muted-foreground uppercase">
          {label}
        </span>
        <Count n={count} needs={needs} />
      </h2>
      {action}
    </div>
  );
}

/** One quiet line under a head: what the section's acts do, said once and short. */
export function Hint({ children }: { children: ReactNode }) {
  return (
    <p className="text-xs text-pretty text-muted-foreground">{children}</p>
  );
}

/**
 * THE UNVERIFIED MARK, AS A ROW DRAWS IT INSIDE ITS OWN PRESS: production's
 * mark (`unverified-mark.tsx`, its paper tone) is a button of its own, and a
 * row that is one press for the card cannot hold a second; the card it opens
 * says what the mark means, so here it is the mark's look alone.
 */
export function MarkGlyph() {
  return (
    <span
      title="Unverified"
      className="inline-flex size-4 shrink-0 items-center justify-center rounded-full border border-border bg-muted align-middle"
    >
      <span aria-hidden className="size-1 rounded-full bg-muted-foreground" />
      <span className="sr-only">Unverified</span>
    </span>
  );
}

/** A guest's photos, as a row or a card counts them. */
export const photosWord = (n: number) =>
  n === 1 ? "1 photo" : `${formatCount(n)} photos`;

/**
 * An address shortened FROM THE MIDDLE, the domain kept (`guest-list.tsx`'s
 * own rule: the domain is what tells a host whether an address is real), to
 * at most `chars` characters, the whole address kept for a screen reader.
 */
export function shortAddress(email: string, chars = 22): string {
  if (email.length <= chars) return email;
  const at = email.lastIndexOf("@");
  if (at <= 0) return `${email.slice(0, chars - 1)}…`;
  const domain = email.slice(at);
  const room = Math.max(3, chars - domain.length - 1);
  return `${email.slice(0, room).replace(/[._+-]+$/, "")}…${domain}`;
}

/** An address drawn short for the eye, whole for a screen reader and in its title. */
export function Address({
  email,
  chars,
  className,
}: {
  email: string;
  chars?: number;
  className?: string;
}) {
  const short = shortAddress(email, chars);
  if (short === email)
    return (
      <span title={email} className={className}>
        {email}
      </span>
    );
  return (
    <>
      <span className="sr-only">{email}</span>
      <span aria-hidden title={email} className={className}>
        {short}
      </span>
    </>
  );
}

/** The guest whose confirmed address this is, where the room already holds it. */
export const guestByEmail = (guests: readonly Guest[], email: string) =>
  guests.find((g) => g.email === email) ?? null;

/** The invite list's field, drawn as production's (type or paste), saving nothing here. */
export function InviteField() {
  return (
    <div className="flex flex-wrap gap-1.5 rounded-lg border border-input bg-background p-2 transition-colors focus-within:border-ring">
      <label htmlFor="gr-invite-field" className="sr-only">
        Add or paste addresses
      </label>
      <input
        id="gr-invite-field"
        type="email"
        inputMode="email"
        autoComplete="off"
        placeholder="Add or paste addresses"
        className="h-7 min-w-40 flex-1 bg-transparent px-1 text-base outline-none placeholder:text-muted-foreground md:text-sm"
      />
    </div>
  );
}
