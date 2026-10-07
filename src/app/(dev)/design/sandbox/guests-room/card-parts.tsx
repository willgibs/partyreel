"use client";

import { type ReactElement, type ReactNode, useId, useState } from "react";
import { ArrowUpRight, ChevronRight, UserCheck, UserPlus } from "lucide-react";

import { UnverifiedMark } from "@/components/shared/unverified-mark";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Popup,
  PopupBody,
  PopupContent,
  PopupHeader,
  PopupTrigger,
} from "@/components/ui/popup";
import { DESK_QUERY, shapeFor } from "@/components/ui/popup-kinds";
import { useMediaQuery } from "@/lib/use-media-query";
import { cn } from "@/lib/utils";

import { type Guest, stillsOf } from "./fixtures";
import { Address, Count, Face } from "./people";

/**
 * WHAT BOTH CANDIDATE CARDS ARE MADE OF (`card-photos.tsx`, `card-standing.tsx`),
 * one set so the two differ only in what the `card` ask asks: whether a card
 * carries a person's standing and its act, and so opens from every name.
 *
 * ★ A CARD BESIDE THE NAME AT A DESK, OVER THE HUB, NEVER OVER THE ROOM'S ROWS:
 * the room is a 448px panel at the screen's right, and a 320px card opened
 * under a name covers the rows it belongs to while their keys stick out at its
 * edge (three Let ins on one screen). Opened to the name's left it stands over
 * the scrimmed hub, its top at the name, and a press back in the room closes
 * it; where there is no room to the left (a name in the album's own list) it
 * turns to wherever there is, as every popover does. In a hand it is the sheet
 * (`popup-kinds.ts`'s `peek` row).
 */

export type Shape = "card" | "sheet";

/** Who a card is about: its face, its name, what kind of name it is, and a detail under that. */
export type Identity = {
  name: string;
  seed: string | null;
  /** A blocked face: quieter on its own card, never hidden. */
  dim?: boolean;
  /** The row under the name: the handle, Confirmed their email, the mark, or the address. */
  kind: ReactNode;
  /** The row under that: the host's address, or what Unverified means. */
  detail?: ReactNode;
};

/**
 * The block's grid: the face's column, and the name's, which every row under
 * it hangs from. ★ A GRID, NOT A ROW OF TWO BOXES, because the sheet's head
 * is production's `PopupHeader`, whose title and line are its own children:
 * they take the second column, and the face a cell of the first. ★ `gap-0`,
 * THE FACE KEEPING ITS OWN MARGIN: the head's own `gap-1` outranks a
 * `gap-x-*` in the stylesheet (measured: 4px between the face and the name in
 * a hand), so the merge drops it for `gap-0` and the space is the face's.
 */
const IDENTITY = "grid grid-cols-[auto_minmax(0,1fr)] items-center gap-0";

/**
 * The face, its cell spanning the block's rows; the name beside it says who.
 * Its initial is the room's proportion (`Face` draws it at 0.8em), so at 56px
 * it is drawn from a 20px root.
 */
function FaceCell({ who, rows }: { who: Identity; rows: number }) {
  return (
    <span
      aria-hidden
      className="col-start-1 row-start-1 mr-3.5 self-center"
      style={{ gridRowEnd: `span ${rows}` }}
    >
      <Face
        name={who.name}
        seed={who.seed}
        className={cn("size-14 text-xl", who.dim && "opacity-70")}
      />
    </span>
  );
}

/** The block's third row: the host's address, or what Unverified means. */
function Detail({ children }: { children: ReactNode }) {
  if (!children) return null;
  return (
    <p className="col-start-2 truncate text-caption text-muted-foreground">
      {children}
    </p>
  );
}

/**
 * THE CARD: who they are as one block, and the body under it, in a card beside
 * the name at a desk and the sheet in a hand, the same parts in the same order.
 * `body` is told which shape it stands in (the pair's keys grow for a thumb).
 */
export function CardShell({
  who,
  body,
  children,
}: {
  who: Identity;
  body: (shape: Shape) => ReactNode;
  /** The name that opens it: one button. */
  children: ReactElement;
}) {
  const desk = useMediaQuery(DESK_QUERY);
  const [open, setOpen] = useState(false);
  const [offset, setOffset] = useState(16);
  const nameId = useId();
  const rows = who.detail ? 3 : 2;
  if (shapeFor("peek", desk) === "anchored") {
    return (
      <Popover open={open} onOpenChange={setOpen}>
        {/* ★ THE CARD CLEARS THE PANEL, NOT ONLY ITS NAME: a name stands anywhere across the room (a face in
            the sheet's third column, a row's words), so the press measures how far in from the panel's edge
            it is and the card stands that far out again, 12px clear of the panel whichever name opened it. A
            capture on a wrapper drawing no box of its own, so a keyboard's press and a script's are measured
            alike, before the trigger opens the card. */}
        <span
          className="contents"
          onClickCapture={(e) => {
            const target = e.target as HTMLElement;
            const name =
              target.closest<HTMLElement>("[data-gr-name]") ?? target;
            const panel = name.closest("[data-room-panel]");
            if (!panel) return;
            const inset =
              name.getBoundingClientRect().left -
              panel.getBoundingClientRect().left;
            setOffset(Math.max(16, Math.round(inset) + 12));
          }}
        >
          <PopoverTrigger asChild>{children}</PopoverTrigger>
        </span>
        <PopoverContent
          side="left"
          align="start"
          sideOffset={offset}
          aria-labelledby={nameId}
          data-slot="guest-peek"
          data-gr-read="the card"
          className="w-80 p-4"
        >
          <div className={IDENTITY}>
            <FaceCell who={who} rows={rows} />
            <h2
              id={nameId}
              className={cn(
                "col-start-2 truncate font-heading text-card-title",
                who.dim && "text-muted-foreground",
              )}
            >
              {who.name}
            </h2>
            <div className="col-start-2 text-sm text-muted-foreground">
              {who.kind}
            </div>
            <Detail>{who.detail}</Detail>
          </div>
          <div className="mt-4">{body("card")}</div>
        </PopoverContent>
      </Popover>
    );
  }
  return (
    <Popup open={open} onOpenChange={setOpen}>
      <PopupTrigger asChild>{children}</PopupTrigger>
      <PopupContent kind="peek" data-slot="guest-peek" data-gr-read="the card">
        {/* The sheet's own head (its title names the sheet, its line the
            description), laid out as the desk's block: the face is a cell
            of the head's grid beside the title, its line and the detail. */}
        <PopupHeader
          className={cn(IDENTITY, "pb-0")}
          titleClassName={cn(
            "col-start-2 truncate",
            who.dim && "text-muted-foreground",
          )}
          title={who.name}
          description={who.kind}
        >
          <FaceCell who={who} rows={rows} />
          <Detail>{who.detail}</Detail>
        </PopupHeader>
        {/* The last line clears a phone's home indicator, as the house's other sheets' feet do. */}
        <PopupBody className="pt-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
          {body("sheet")}
        </PopupBody>
      </PopupContent>
    </Popup>
  );
}

/**
 * A guest's block, whatever the kind of name: the handle, Confirmed their
 * email, or the Unverified mark and its word; under it the host's confirmed
 * address, or what Unverified means. The Unverified line is production's
 * words split at its own colon: whole, it needs 261px beside the mark and the
 * desk's card has 228, so it broke as "...type a" over "name".
 */
export function guestIdentity(guest: Guest, host: boolean): Identity {
  const address = host && guest.email ? guest.email : null;
  return {
    name: guest.name,
    seed: guest.seed,
    kind: guest.unverified ? (
      <span className="flex items-center gap-1.5">
        <UnverifiedMark name={guest.name} viewerIsHost={host} />
        Unverified
      </span>
    ) : guest.slug ? (
      `@${guest.slug}`
    ) : (
      "Confirmed their email"
    ),
    detail: guest.unverified ? (
      "Anyone can type a name"
    ) : address ? (
      // Shortened from its middle, the domain kept (the room's own rule), to
      // what the desk's 218px column holds at the caption step.
      <Address email={address} chars={32} />
    ) : null,
  };
}

/**
 * ★ AN ARROW LEANS THE WAY IT GOES under the pointer (Button's own
 * `group/button`): See all's chevron in, their page's arrow out. Two pixels,
 * on the key's own clock, and only where motion is welcome.
 */
const LEANS_IN =
  "transition-transform duration-150 ease-emphasis motion-safe:group-hover/button:translate-x-0.5";
const LEANS_OUT =
  "transition-transform duration-150 ease-emphasis motion-safe:group-hover/button:translate-x-0.5 motion-safe:group-hover/button:-translate-y-0.5";

/**
 * Their photographs here: the count as the room's own section head (its
 * eyebrow and its quiet pill), See all at its end where four are not all of
 * them, and up to four tiles at one size (one photograph keeps a tile's
 * width, never a wider one), each one press from the album's viewer.
 * ★ THE STRIP IS A READ THE LIST DOES NOT CARRY (ROADMAP's look strip): their
 * approved uploads by account or guest row, presigned and gated like the
 * album; See all wants the album filtered to one guest, which it has no
 * view for yet. The stills here stand in for theirs.
 */
export function Strip({ guest }: { guest: Guest }) {
  const headId = useId();
  const stills = stillsOf(guest).slice(0, Math.min(4, guest.photos));
  const more = guest.photos > stills.length;
  return (
    <section aria-labelledby={headId} data-gr-strip="" className="space-y-1.5">
      {/* The band is the room's section head's (`FeedSectionHeader`): 28px,
          an action at its end no taller, so a head with See all and one
          without stand the strip at the same place. */}
      <div className="flex min-h-7 items-center justify-between gap-3">
        <h3 id={headId} className="flex items-center gap-1.5">
          <span className="text-label font-semibold text-muted-foreground uppercase">
            Photos
          </span>
          <Count n={guest.photos} />
        </h3>
        {more ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-label={`See all ${guest.photos} in the album`}
            className="-mr-1.5 text-muted-foreground hover:text-foreground"
          >
            See all
            <ChevronRight data-icon="inline-end" className={LEANS_IN} />
          </Button>
        ) : null}
      </div>
      <ul className="grid grid-cols-4 gap-[var(--gap-gallery)]">
        {stills.map((still, i) => (
          <Tile
            key={still.id}
            src={still.src}
            label={`View photo ${i + 1} of ${guest.photos}`}
          />
        ))}
      </ul>
    </section>
  );
}

/**
 * One photograph of theirs, one press from the album's viewer. ★ THE ALBUM
 * TILE'S OWN BOX (`album-tile.tsx`): the element that owns the corner clips
 * the photograph and wears the bright edge, and the press is a button filling
 * it, giving a little under the finger.
 *
 * ★ ITS HALO STANDS OVER THE PHOTOGRAPH, ON A LAYER THAT HOLDS NO FOCUS: an
 * inset halo on the button itself is painted under its own image (measured:
 * computed, and not one pixel of it seen), so a layer above the photograph
 * wears it, pinned with `data-halo` while the button holds the keyboard's
 * focus (the house's way for an element standing for a focus it does not
 * hold, the code field's caret slot's).
 */
function Tile({ src, label }: { src: string; label: string }) {
  const [keyboard, setKeyboard] = useState(false);
  return (
    <li
      data-lit=""
      className="aspect-square overflow-hidden rounded-tile bg-muted"
    >
      <button
        type="button"
        aria-label={label}
        onFocus={(e) => setKeyboard(e.currentTarget.matches(":focus-visible"))}
        // A focus a press gave turns the keyboard's at its first key.
        onKeyUp={(e) => setKeyboard(e.currentTarget.matches(":focus-visible"))}
        onBlur={() => setKeyboard(false)}
        className="group/tile relative block size-full press-shrink cursor-pointer transition-[scale] duration-150 ease-emphasis outline-none [--press-scale:0.97]"
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- a marketing still standing in for a presigned photograph */}
        <img
          src={src}
          alt=""
          className="size-full object-cover transition-[filter] duration-200 ease-emphasis group-hover/tile:brightness-110"
        />
        <span
          aria-hidden
          data-halo={keyboard ? "" : undefined}
          className="pointer-events-none absolute inset-0 focus-halo rounded-tile halo-inset"
        />
      </button>
    </li>
  );
}

/**
 * Follow and their page, a quiet pair: two tone keys of one width, the strip
 * above them louder than either, at the desk's small step and a thumb's step
 * in a hand. Follow turns to Following on a press, writing nothing here, its
 * check settling in as it lands. Only where there is a page to open and follow.
 */
export function Pair({ shape }: { shape: Shape }) {
  const [following, setFollowing] = useState(false);
  const size = shape === "sheet" ? "lg" : "sm";
  return (
    <div className="grid grid-cols-2 gap-2">
      <Button
        type="button"
        variant="secondary"
        size={size}
        aria-pressed={following}
        onClick={() => setFollowing((on) => !on)}
      >
        {following ? (
          <UserCheck
            key="on"
            data-icon="inline-start"
            className="duration-200 ease-emphasis motion-safe:animate-in motion-safe:fade-in-0 motion-safe:zoom-in-50"
          />
        ) : (
          <UserPlus key="off" data-icon="inline-start" />
        )}
        {following ? "Following" : "Follow"}
      </Button>
      <Button type="button" variant="secondary" size={size}>
        Their page
        <ArrowUpRight data-icon="inline-end" className={LEANS_OUT} />
      </Button>
    </div>
  );
}
