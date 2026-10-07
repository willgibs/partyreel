"use client";

import type { ReactNode } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

/**
 * THE PIECES A PERSON IS DRAWN WITH IN THE GUESTS ROOM AND THE CARD A NAME OPENS (guests-room r1): a face, an address
 * shortened as the house shortens one, and the Unverified mark's look where a row is one press already. One set, so a
 * person reads alike in their row and on their card.
 */

/**
 * A face: the seeded Avatar at the size its place asks, the photograph where there is one (never for a name nobody
 * proved: `photo` is null there), the initial over its colour where there is none. ★ HIDDEN FROM A SCREEN READER: a
 * face always stands beside its name, so its initial read aloud only prefixes the name ("P Priya Shah", the ROADMAP's
 * line on the look's sheet title).
 */
export function Face({
  name,
  seed,
  photo = null,
  dim = false,
  className,
}: {
  name: string;
  seed: string | null | undefined;
  photo?: string | null;
  /** A blocked face: quieter, never hidden. */
  dim?: boolean;
  /** The size, as a class (`size-10`): a row's and a card's faces are larger than the atom's steps. */
  className?: string;
}) {
  return (
    <Avatar
      aria-hidden
      seed={seed ?? undefined}
      className={cn("shrink-0", className, dim && "opacity-45 grayscale")}
    >
      {photo ? <AvatarImage src={photo} alt="" /> : null}
      <AvatarFallback className="text-[0.8em] font-medium">
        {(name.trim() || "?").slice(0, 1).toUpperCase()}
      </AvatarFallback>
    </Avatar>
  );
}

/**
 * An address shortened FROM THE MIDDLE, the domain kept (`guest-list.tsx`'s own rule: the domain is what tells a host
 * whether an address is real), to at most `chars` characters. A cut never ends on the address's own punctuation.
 */
export function shortAddress(email: string, chars: number): string {
  if (email.length <= chars) return email;
  const at = email.lastIndexOf("@");
  if (at <= 0) return `${email.slice(0, chars - 1).replace(/[._+-]+$/, "")}…`;
  const domain = email.slice(at);
  const room = Math.max(3, chars - domain.length - 1);
  return `${email.slice(0, room).replace(/[._+-]+$/, "")}…${domain}`;
}

/** An address drawn short for the eye, whole for a screen reader and in its title. */
export function Address({
  email,
  chars = 30,
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

/**
 * THE UNVERIFIED MARK'S LOOK, WHERE A ROW IS ONE PRESS ALREADY: production's mark (`unverified-mark.tsx`) is a button
 * of its own, and a row that is one press for the card cannot hold a second; the card it opens holds the real mark
 * and says what it means, so here it is the mark's look and its word for a screen reader.
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

/** One quiet line under a section: what its acts do, said once and short. */
export function Hint({ children }: { children: ReactNode }) {
  return (
    <p className="text-xs text-pretty text-muted-foreground">{children}</p>
  );
}

/** The name a person is drawn under at the door: her profile's, or her address where it has none. */
export function nameOrAddress(
  name: string | null | undefined,
  email: string | null | undefined,
): string {
  return name?.trim() || email?.trim() || "A guest";
}
