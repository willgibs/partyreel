"use client";

import { type ReactNode } from "react";

import { GuestMasonry } from "@/components/guest/guest-masonry";
import { GuestList } from "@/components/social/guest-list";
import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { floatingPanel } from "@/components/ui/floating-layer";

import { ALBUM, type Chip, EVENT } from "./fixtures";

/**
 * THE ALBUM'S OWN PIECES: round one's bases, kept because every round-two
 * decision still opens from the same wedding album.
 *
 * ★ ROUND ONE'S THREE DECISIONS DRAWN HERE (`named`, `claim`, `list`) ARE
 * RULED AND GONE (2026-09-19): `NamedShowcase`, `ClaimShowcase`, `ListShowcase`
 * and the membership/claim helpers left with them, because nothing on this
 * board varies who is named or when a handle is offered any more. What
 * survives is the CLOSED representation his `list=faces` picked (now
 * `FacesRow`, split out of the old `Guests` so a click's four behaviours can
 * live in `reach.tsx` instead of one component's if-chain) and the one
 * expansion he already drew (`NamesSheet`, unchanged): both are the bases
 * `view-all` recuts.
 *
 * ★ `GuestList` IS THE REAL COMPONENT, imported and handed real-shaped items:
 * it is presentational (its only interactive part is a `Link` to `/u/<slug>`)
 * and it calls nothing. Every new shape this round draws sits beside it
 * rather than through it, because a lab board may not edit a shipped
 * component.
 */

export const HEADING =
  "text-[11px] font-semibold tracking-wide text-muted-foreground uppercase";

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
          <Avatar key={g.id} size="sm">
            <AvatarImage src={g.avatarUrl ?? undefined} alt="" />
            <AvatarFallback className="text-[10px]">
              {(g.displayName ?? "?").slice(0, 1).toUpperCase()}
            </AvatarFallback>
          </Avatar>
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
 * The names in a sheet: "the centred modal round one drew", unchanged, and one
 * of `view-all`'s four options rather than the row's only expansion now.
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
          <GuestList items={items} />
        </div>
      </div>
    </div>
  );
}
