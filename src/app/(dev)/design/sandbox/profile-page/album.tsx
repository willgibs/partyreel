"use client";

import { type ReactNode } from "react";
import Link from "next/link";

import { GuestMasonry } from "@/components/guest/guest-masonry";
import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { floatingPanel } from "@/components/ui/floating-layer";
import { cn } from "@/lib/utils";

import { ALBUM, type Chip, EVENT, isUnverified } from "./fixtures";

/**
 * THE ALBUM'S OWN PIECES: round one's bases, kept because every round-two
 * decision still opens from the same wedding album.
 *
 * ★ ROUND ONE'S THREE DECISIONS DRAWN HERE (`named`, `claim`, `list`) ARE
 * RULED AND GONE (2026-09-19): `NamedShowcase`, `ClaimShowcase`, `ListShowcase`
 * and the membership/claim helpers left with them, because nothing on this
 * board varies who is named or when a handle is offered any more. What
 * survives is the CLOSED representation his `list=faces` picked (`FacesRow`)
 * and the one expansion he already drew (`NamesSheet`): both are the bases
 * `view-all` recuts.
 *
 * ★ THE CHIPS ARE QUOTED, NOT THE SHIPPED `GuestList`. The shipped list
 * condenses above twelve names into the faces row and expands only on a tap,
 * so handing it 24 or 240 names drew that closed row inside every `view-all`
 * option, which is not what any of them is about; and its Unverified entries
 * mount the real mark, a Popover that would open on the lab page rather than
 * in the frame. So `NameList` is `guest-list.tsx`'s own chip markup, copied:
 * the confirmed first in their own colour (a link only where there is a
 * handle), then every typed name on the plain disc wearing the mark.
 */

export const HEADING =
  "text-[11px] font-semibold tracking-wide text-muted-foreground uppercase";

/** The shipped list's own threshold: above this it is a row of faces, and
 *  both callers drop the count from their heading because the row says it. */
export const FACES_THRESHOLD = 12;

/** The album's own head, as the guest page draws it above the gallery.
 *  `photoCount` overrides the wedding's own 214 for the 240-guest edge case,
 *  where 214 photographs from 240 uploaders undercounts the room a real party
 *  that size would fill; every other caller keeps the number the event holds. */
export function AlbumHead({ photoCount = EVENT.count }: { photoCount?: number }) {
  return (
    <div className="space-y-1 px-5 pt-6">
      <h1 className="font-heading text-page text-balance">{EVENT.name}</h1>
      <p className="text-sm text-muted-foreground">
        Hosted by {EVENT.host} · {EVENT.dateLabel} · {photoCount} photos
      </p>
    </div>
  );
}

/** The album under everything, at the real masonry's real columns. Pointer
 *  events are off: a tile opens the shipped lightbox and its like control posts
 *  to a Server Function. */
export function Album({ count = 8 }: { count?: number }) {
  return (
    <div className="pointer-events-none px-5">
      <GuestMasonry items={ALBUM.slice(0, count)} />
    </div>
  );
}

export function Section({
  label,
  count,
  children,
}: {
  label: string;
  count?: number;
  children: ReactNode;
}) {
  return (
    <section aria-label={label} className="mt-8 space-y-3 px-5">
      <h2 className="flex items-center gap-1.5">
        <span className={HEADING}>{label}</span>
        {count !== undefined && (
          <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-muted px-1 text-[10px] font-semibold text-muted-foreground tabular-nums">
            {count}
          </span>
        )}
      </h2>
      {children}
    </section>
  );
}

/** The heading count the shipped album shows: only at or under the
 *  threshold, since above it the faces row says the number itself. */
export const headingCount = (items: Chip[]) =>
  items.length <= FACES_THRESHOLD ? items.length : undefined;

/* ── One face, one chip, one list: the shipped markup, quoted ────────────── */

/** A confirmed account wears its own colour and photograph; a typed name wears
 *  the plain disc (a colour is an identity everywhere else, and this one has
 *  not been proven). */
export function Face({ chip }: { chip: Chip }) {
  const unverified = isUnverified(chip);
  return (
    <Avatar size="sm" seed={unverified ? undefined : (chip.seed ?? undefined)}>
      {!unverified && <AvatarImage src={chip.avatarUrl ?? undefined} alt="" />}
      <AvatarFallback className="text-[10px]">
        {(chip.displayName ?? "?").slice(0, 1).toUpperCase()}
      </AvatarFallback>
    </Avatar>
  );
}

/** The Unverified mark on a chip: `unverified-mark.tsx`'s `paper` tone (a dot
 *  in a small disc), without the Popover the product opens from it. */
export function QuotedMark() {
  return (
    <span
      role="img"
      aria-label="Unverified"
      className="inline-flex size-4 shrink-0 items-center justify-center rounded-full border border-border bg-muted"
    >
      <span aria-hidden className="size-1 rounded-full bg-muted-foreground" />
    </span>
  );
}

export const CHIP =
  "flex h-8 items-center gap-2 rounded-full border border-border py-1 pr-3 pl-1 text-sm";

/** The list itself, every name at once: the shape each `view-all` container
 *  holds. No Follow on any chip, as for a signed-out reader. */
export function NameList({ items }: { items: Chip[] }) {
  return (
    <ul className="flex flex-wrap items-center gap-1.5">
      {items.map((chip) => (
        <li key={chip.id}>
          {isUnverified(chip) ? (
            <span className={cn(CHIP, "text-muted-foreground")}>
              <Face chip={chip} />
              <span className="max-w-40 truncate">
                {chip.displayName ?? "A guest"}
              </span>
              <QuotedMark />
            </span>
          ) : chip.slug ? (
            <Link
              href={`/u/${chip.slug}`}
              className={cn(CHIP, "text-foreground hover:bg-muted/60")}
            >
              <Face chip={chip} />
              <span className="max-w-40 truncate">
                {chip.displayName ?? "Guest"}
              </span>
            </Link>
          ) : (
            <span className={cn(CHIP, "text-muted-foreground")}>
              <Face chip={chip} />
              <span className="max-w-40 truncate">
                {chip.displayName ?? "Guest"}
              </span>
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}

/* ── The closed state: round one's ruled `list=faces` ────────────────────── */

/**
 * Overlapping avatars and a count, ruled whole in round one. Not a click
 * handler of its own any more: `view-all`'s four options each decide what a
 * tap on it does (`reach.tsx`), so the row itself only ever renders closed.
 */
export function FacesRow({
  items,
  onOpen,
}: {
  items: Chip[];
  onOpen: () => void;
}) {
  const shown = items.slice(0, 6);
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex items-center gap-3 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
    >
      <AvatarGroup>
        {shown.map((g) => (
          <Face key={g.id} chip={g} />
        ))}
        <AvatarGroupCount className="size-6 text-[10px]">
          +{items.length - shown.length}
        </AvatarGroupCount>
      </AvatarGroup>
      <span className="text-sm text-muted-foreground">
        {items.length} guests added photos
      </span>
    </button>
  );
}

/**
 * The names in a sheet: "the centred modal round one drew", and one of
 * `view-all`'s four options rather than the row's only expansion now.
 *
 * ★ QUOTED, NOT A `Dialog`. radix portals to the OWNING document's body, which
 * for a portalled frame is the lab page, so a real one would open over the
 * board rather than inside the picture. `fixed` here IS the frame's viewport.
 *
 * ★ `data-pp-list` MOVED ONTO THE PANEL ITSELF (round two): the measurement
 * `view-all`'s options share reads whatever this attribute wraps, and this
 * modal's panel is the one surface that is already capped and scrollable, so
 * the number it reports is directly comparable to the sheet's.
 */
export function NamesSheet({
  items,
  open,
  onClose,
}: {
  items: Chip[];
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div
        data-pp-list
        className={`max-h-[80vh] w-full max-w-lg overflow-y-auto p-6 ${floatingPanel}`}
      >
        <div className="flex items-start justify-between gap-4">
          <p className="font-heading text-lg">Guests ({items.length})</p>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
        <div className="mt-4">
          <NameList items={items} />
        </div>
      </div>
    </div>
  );
}
