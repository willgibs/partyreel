"use client";

import {
  useId,
  useRef,
  useState,
  useSyncExternalStore,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
} from "react";
import Link from "next/link";
import { ArrowUpRight, UserCheck, UserPlus } from "lucide-react";

import {
  LookPanel,
  LookStrip,
  LookViewer,
  useLookSource,
} from "@/app/(app)/dashboard/[eventId]/guests/look-photos";
import { Address, Face } from "@/app/(app)/dashboard/[eventId]/guests/people";
import {
  BlockLookAction,
  LazyBlockConfirm,
} from "@/components/app/event-blocks/block-look-action";
import type { GridMedia } from "@/components/app/media-grid";
import type { ViewerOrigin } from "@/components/shared/media-lightbox";
import { UnverifiedMark } from "@/components/shared/unverified-mark";
import { useRelation } from "@/components/social/relation-toggle";
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
import type { BlockTarget } from "@/lib/events/event-blocks";
import { useMediaQuery } from "@/lib/use-media-query";
import { cn } from "@/lib/utils";

import type { GuestListItem } from "./guest-list";

/**
 * A PERSON'S CARD, FROM EVERY NAME (guests-room r1, `card=standing`, Will 2026-10-07; the look of `popups` r1,
 * `peek=card`, built whole): who they are, four of their photographs and See all, Follow and their page kept quiet,
 * and for the host alone how they stand tonight with its act, and the quiet Block last. The one card a name opens in
 * the Guests room, in the album's guest list, at a photograph's credit and in Account's Connections.
 *
 * ★ A CARD BESIDE THE NAME AT A DESK, THE SHEET IN A HAND (`popup-kinds.ts`, the `peek` row). At a desk it opens
 * next to the name, and the next name pressed moves it, so ten names can be looked at without a list being covered.
 * ★ IN THE GUESTS ROOM IT STANDS BESIDE THE ROOM'S PANEL, OVER THE HUB, ITS TOP AT THE NAME (the board's carried
 * `card-beside`): the room is a narrow panel at the screen's edge, and a card under a name there covered the rows it
 * belongs to while their keys stuck out at its edge. So a press inside a room's panel measures how far in from the
 * panel's edge the name is and stands the card that far out again, clear of the panel whichever name opened it;
 * anywhere else (the album's list) it opens under the name, as it always has, and turns wherever there is room.
 *
 * ★ WHO THEY ARE IS ONE BLOCK, THE FACE A CELL OF ITS GRID AND HIDDEN FROM A SCREEN READER (the ROADMAP's "the look
 * puts the face in the sheet title"): the sheet's title is the name alone, so a screen reader hears "Priya Shah", never
 * "P Priya Shah", and in a hand the line and the address hang beside the face, not under it.
 *
 * ★ THE LOOK SHOWS NOTHING THE ALBUM DID NOT (profile-page's own rule, and the privacy doctrine in profiles-social.md):
 * the face, the name, the mark where it is Unverified or the handle where there is a page, and, for the host alone,
 * the address the Guests room already shows. Their photographs are the album's own, approved and visible
 * (`look-photos.tsx` says where each card reads them, `guest-look.ts` what), so a guest's card holds only what her
 * album already shows her.
 *
 * ★ FOR THE HOST ALONE, THEIR STANDING TONIGHT AND ITS ACT (`standing`, the room's): in since their first photograph,
 * at the door with Decline and Let in (the door's Decline lives here now, so each row keeps one act: Will's "Don't
 * want to overcrowd the row actions"), declined or blocked with the way back. And the quiet Block last (`block`, a
 * host's surface only), which closes the card and opens the one block screen. A guest's side of the card has no host
 * lines at all.
 *
 * ★ A FOLLOW FROM THE CARD STAYS ITS ANSWER WHEN THE CARD OPENS AGAIN (the ROADMAP's crumbs-87 line: "a look's Follow
 * reads Follow again on its next open"): the card's content goes when it closes, and its own Follow came back from
 * "Follow" every time. The answer a Follow lands is kept for the page's life, one per person, for every card of theirs
 * (`kept`); a surface that keeps the relation itself (Connections) hands its own Follow through `follow`, as before.
 */

/** How someone stands at this party tonight, as the host's card says it (`standing`). */
export type CardStanding = {
  /**
   * The light: someone in is the ink's point (the plain state spends no colour); at the door the tally, the same
   * signal as the door's count, since a person there waits on her; blocked an unlit ring.
   */
  tone: "in" | "door" | "blocked";
  /** How they stand, in the ground's ink: "In since 6:03 PM", "At the door for 2 min", "Declined at 9:12 PM". */
  line: string;
  /** What follows from it, muted, after a point: "still asking", "4 uploads in Deleted". */
  aside?: string;
  /**
   * Its act, under the line, handed the card's own close (a press that answers closes the card first) and the size a
   * key takes in this shape (the desk's small step, a thumb's step in a hand).
   */
  act?: (close: () => void, size: "sm" | "lg") => ReactNode;
};

/* ── one answer per person for the page's life (the kept Follow) ──────────────────────────────── */

const kept = new Map<string, boolean>();
const keptListeners = new Set<() => void>();
function keep(profileId: string, on: boolean) {
  kept.set(profileId, on);
  for (const listener of keptListeners) listener();
}
function subscribeKept(listener: () => void) {
  keptListeners.add(listener);
  return () => {
    keptListeners.delete(listener);
  };
}

/**
 * THE CARD'S OWN FOLLOW, a quiet key (`card=standing`: "Follow and their page kept quiet"), on the one relation
 * contract (`useRelation`: the flip at once, a refusal sprung back with the server's words), starting from the answer
 * a Follow landed on any card of theirs this page's life, where there is one.
 */
function CardFollow({
  profileId,
  size,
}: {
  profileId: string;
  size: "sm" | "lg";
}) {
  const landed = useSyncExternalStore(
    subscribeKept,
    () => kept.get(profileId),
    () => undefined,
  );
  const state = useRelation({
    relation: "follow",
    profileId,
    on: landed ?? false,
    onSettle: (on) => keep(profileId, on),
  });
  return (
    <Button
      type="button"
      variant="secondary"
      size={size}
      aria-pressed={state.on}
      aria-busy={state.pending || undefined}
      data-relation="follow"
      data-on={state.on}
      onClick={state.press}
    >
      {state.on ? (
        <UserCheck
          key="on"
          data-icon="inline-start"
          className="duration-200 ease-emphasis motion-safe:animate-in motion-safe:fade-in-0 motion-safe:zoom-in-50"
        />
      ) : (
        <UserPlus key="off" data-icon="inline-start" />
      )}
      {state.on ? "Following" : "Follow"}
    </Button>
  );
}

/** A key a card offers: the desk's small step, a thumb's step in a hand. */
const keySize = (shape: Shape): "sm" | "lg" =>
  shape === "sheet" ? "lg" : "sm";

type Shape = "card" | "sheet";

/**
 * FOLLOW AND THEIR PAGE, A QUIET PAIR (two tone keys of one width; the photographs above are louder than either), only
 * where there is a page to open and follow; their page alone where Follow is not offered, the width the pair's.
 */
function Pair({
  item,
  canFollow,
  follow,
  shape,
}: {
  item: GuestListItem;
  canFollow: boolean;
  follow?: ReactNode;
  shape: Shape;
}) {
  if ("kind" in item || !item.slug) return null;
  const followFace = canFollow
    ? (follow ?? <CardFollow profileId={item.id} size={keySize(shape)} />)
    : null;
  return (
    <div
      className={cn("grid gap-2", followFace ? "grid-cols-2" : "grid-cols-1")}
    >
      {followFace}
      <Button asChild variant="secondary" size={keySize(shape)}>
        <Link href={`/u/${item.slug}`}>
          Their page
          {/* ★ An arrow leans the way it goes under the pointer: out, two pixels on the key's own clock. */}
          <ArrowUpRight
            data-icon="inline-end"
            className="transition-transform duration-150 ease-emphasis motion-safe:group-hover/button:translate-x-0.5 motion-safe:group-hover/button:-translate-y-0.5"
          />
        </Link>
      </Button>
    </div>
  );
}

/**
 * The comma read where the eye sees a standing line's point: a screen reader hears "Declined at 9:12 PM, still asking".
 * ★ A PIXEL WIDE AND CLEAR, NEVER `sr-only`: its absolute box is a block of its own to whatever reads text.
 */
function Pause() {
  return (
    <span className="inline-block w-px overflow-hidden align-top text-transparent">
      ,
    </span>
  );
}

/**
 * Each clause of the standing line, after its point. ★ A POINT NEVER STARTS A LINE: every clause carries its own, and
 * the clauses stand a point's width to the left inside a box that clips there, so the first clause's point, and the
 * point of any clause that wraps to a line of its own, fall outside it.
 */
const CLAUSE =
  "min-w-0 before:inline-block before:w-3 before:text-center before:text-muted-foreground before:content-['·'_/_'']";

/** How they stand tonight, as a light and its words, and that standing's act under it: one sentence, read as one. */
function Standing({
  standing,
  close,
  shape,
}: {
  standing: CardStanding;
  close: () => void;
  shape: Shape;
}) {
  return (
    <div data-card-standing={standing.tone} className="flex flex-col gap-3">
      <div className="flex gap-2 text-sm">
        {/* ★ THE LIGHT HANGS ON THE FIRST LINE (a box the line's own height), so a line that wraps keeps it where the
            eye starts it. The house's LED (`badge.tsx`'s 7px point). */}
        <span className="flex h-5 shrink-0 items-center" aria-hidden>
          <span
            className={cn(
              "size-[7px] shrink-0 rounded-full",
              standing.tone === "in" && "bg-foreground",
              standing.tone === "door" && "bg-(--needs-you)",
              standing.tone === "blocked" &&
                "ring-[1.5px] ring-foreground/45 ring-inset",
            )}
          />
        </span>
        <p className="min-w-0 flex-1 overflow-hidden">
          <span className="-ml-3 flex flex-wrap">
            <span className={cn(CLAUSE, "text-foreground")}>
              {standing.line}
              {standing.aside ? <Pause /> : null}
            </span>
            {standing.aside ? (
              <span className={cn(CLAUSE, "text-muted-foreground")}>
                {standing.aside}
              </span>
            ) : null}
          </span>
        </p>
      </div>
      {standing.act ? standing.act(close, keySize(shape)) : null}
    </div>
  );
}

/** The kind of name this is, under it, and the detail under that: the handle, Confirmed their email, or Unverified. */
function identityOf(
  item: GuestListItem,
  email: string | null | undefined,
  host: boolean,
): { kind: ReactNode; detail: ReactNode } {
  if ("kind" in item) {
    // Production's words split at their colon: whole, they need more than the desk's card holds beside the mark.
    return {
      kind: (
        <span className="flex items-center gap-1.5">
          <UnverifiedMark name={item.displayName} viewerIsHost={host} />
          Unverified
        </span>
      ),
      detail: "Anyone can type a name",
    };
  }
  // A person whose profile has no name is drawn under the address she confirmed: it is who she is here, said once.
  const addressIsName = !!email && email === item.displayName;
  return {
    kind: item.slug
      ? `@${item.slug}`
      : addressIsName
        ? "Confirmed this address"
        : "Confirmed their email",
    detail:
      email && !addressIsName ? <Address email={email} chars={32} /> : null,
  };
}

/**
 * The block's grid: the face's column, and the name's, which every line under it hangs from. ★ A GRID, NOT A ROW OF
 * TWO BOXES, because the sheet's head is `PopupHeader`, whose title and line are its own children: they take the
 * second column, and the face a cell of the first. ★ `gap-0`, THE FACE KEEPING ITS OWN MARGIN: the head's own `gap-1`
 * would otherwise stand 4px between the face and the name in a hand.
 */
const IDENTITY = "grid grid-cols-[auto_minmax(0,1fr)] items-center gap-0";

/** Where a card opens at a desk: under its name, or beside the room's panel, measured as the name is pressed. */
type Place = { side: "bottom" | "left"; offset: number };
const UNDER: Place = { side: "bottom", offset: 6 };

export function GuestPeek({
  item,
  email,
  canFollow,
  follow,
  block,
  standing,
  added,
  dim = false,
  children,
}: {
  item: GuestListItem;
  /** HOST-ONLY: the confirmed address the Guests room already shows. */
  email?: string | null;
  /**
   * A signed-in viewer who is somebody else, may follow them, does not follow them yet and has no block with them
   * either way (a Follow across one writes nothing: `followUser` is block-silent). A surface that keeps the answer
   * live (Connections) says so for as long as it is true.
   */
  canFollow: boolean;
  /** The Follow the look offers while `canFollow`, where the surface keeps the relation itself; the look's own otherwise. */
  follow?: ReactNode;
  /** HOST-ONLY: who Block would put out of this event, as this surface knows them (and whose photographs she reads). */
  block?: { target: BlockTarget };
  /** HOST-ONLY: how they stand tonight, and its act (the Guests room's). */
  standing?: CardStanding;
  /**
   * What they added, where the surface counted it (the room's read): the strip says it before its photographs land,
   * and a person with nothing in the album reads nothing at all.
   */
  added?: { photos: number; videos: number };
  /** A blocked face: quieter on its own card, never hidden. */
  dim?: boolean;
  /** The name that opens it: one button. */
  children: ReactElement;
}) {
  const desk = useMediaQuery(DESK_QUERY);
  const nameId = useId();
  // A typed name is never null (the entry's own note), and a card invents no stand-in for one that got past a cast.
  const name =
    "kind" in item ? (item.displayName ?? "") : (item.displayName ?? "Guest");
  const host = block !== undefined || standing !== undefined;
  const [open, setOpen] = useState(false);
  const [place, setPlace] = useState<Place>(UNDER);
  // The block screen mounts on the first press and stays, so it closes with its own exit.
  const [confirmMounted, setConfirmMounted] = useState(false);
  const [blocking, setBlocking] = useState(false);
  // See all's panel, and the viewer a photograph opens in: both outlive the card, which closes as they open. ★ EACH
  // MOUNTS ON ITS FIRST USE AND STAYS (the lightbox's own latch), so a list of two hundred names holds two hundred
  // cards that have asked for nothing, and a closing panel or viewer runs its own exit.
  const [panelOpen, setPanelOpen] = useState(false);
  const [used, setUsed] = useState({ panel: false, viewer: false });
  const [viewing, setViewing] = useState<{
    items: GridMedia[];
    index: number;
    origin?: ViewerOrigin;
  } | null>(null);
  const source = useLookSource(item, block);
  const close = () => setOpen(false);
  // The name that opened the card: where the keyboard goes back to once a photograph or See all, opened from the card
  // as it closed, goes.
  const triggerRef = useRef<HTMLElement | null>(null);
  const noteTrigger = (e: MouseEvent) => {
    triggerRef.current = e.currentTarget
      .firstElementChild as HTMLElement | null;
  };
  const showStrip =
    source !== null && (added === undefined || added.photos + added.videos > 0);

  // ★ A PHOTOGRAPH FROM THE CARD GOES BACK TO THE NAME IT CAME FROM: the card closes as the viewer opens (it grows out
  // of its tile), so at its close the photograph drops into the name that opened the card, and the keyboard with it.
  function openPhoto(items: GridMedia[], index: number, tile: HTMLElement) {
    setOpen(false);
    setUsed((u) => ({ ...u, viewer: true }));
    setViewing({
      items,
      index,
      origin: {
        kind: "tile",
        rect: tile.getBoundingClientRect(),
        returnTo: () => triggerRef.current,
      },
    });
  }

  const { kind, detail } = identityOf(item, email, host);
  const photo = "kind" in item ? null : (item.avatarUrl ?? null);
  const rows = detail ? 3 : 2;

  const body = (shape: Shape) => (
    <div className="flex flex-col gap-4">
      {standing ? (
        <Standing standing={standing} close={close} shape={shape} />
      ) : null}
      {showStrip && source ? (
        <LookStrip
          source={source}
          name={name}
          added={added}
          onOpenPhoto={openPhoto}
          onSeeAll={() => {
            setOpen(false);
            setUsed((u) => ({ ...u, panel: true }));
            setPanelOpen(true);
          }}
        />
      ) : null}
      <Pair item={item} canFollow={canFollow} follow={follow} shape={shape} />
      {block ? (
        <BlockLookAction
          className="-mt-1"
          onPress={() => {
            setOpen(false);
            setConfirmMounted(true);
            setBlocking(true);
          }}
        />
      ) : null}
    </div>
  );

  // The face, its cell spanning the block's lines; the name beside it says who.
  const faceCell = (
    <span
      aria-hidden
      className="col-start-1 row-start-1 mr-3.5 self-center"
      style={{ gridRowEnd: `span ${rows}` }}
    >
      <Face
        name={name}
        seed={item.seed}
        photo={photo}
        className={cn("size-14 text-xl", dim && "opacity-70")}
      />
    </span>
  );
  const detailLine = detail ? (
    <p className="col-start-2 truncate text-caption text-muted-foreground">
      {detail}
    </p>
  ) : null;

  const outside = (
    <>
      {block && confirmMounted ? (
        <LazyBlockConfirm
          open={blocking}
          onOpenChange={setBlocking}
          target={block.target}
          name={item.displayName ?? null}
        />
      ) : null}
      {source && used.panel ? (
        <LookPanel
          source={source}
          name={name}
          open={panelOpen}
          onOpenChange={setPanelOpen}
          returnFocus={() => triggerRef.current}
          onOpenPhoto={(items, index, tile) => {
            setUsed((u) => ({ ...u, viewer: true }));
            setViewing({
              items,
              index,
              // From the panel, a photograph drops back into its own tile there (the one showing at close).
              origin: {
                kind: "tile",
                rect: tile.getBoundingClientRect(),
                returnTo: (shown) =>
                  document.querySelector<HTMLElement>(
                    `[data-look-panel] [data-look-photo="${CSS.escape(shown.id)}"]`,
                  ),
              },
            });
          }}
        />
      ) : null}
      {source && used.viewer ? (
        <LookViewer
          viewing={viewing}
          viewerIsHost={host}
          onClose={() => setViewing(null)}
        />
      ) : null}
    </>
  );

  if (shapeFor("peek", desk) === "anchored") {
    // ★ THE CARD CLEARS THE ROOM'S PANEL, NOT ONLY ITS NAME: a capture on a wrapper drawing no box of its own, so a
    // keyboard's press and a pointer's are measured alike, before the trigger opens the card.
    const measure = (e: MouseEvent) => {
      noteTrigger(e);
      const named = e.currentTarget.firstElementChild as HTMLElement | null;
      const panel = named?.closest("[data-room-panel]");
      if (!named || !panel) {
        setPlace(UNDER);
        return;
      }
      const inset =
        named.getBoundingClientRect().left - panel.getBoundingClientRect().left;
      setPlace({ side: "left", offset: Math.max(16, Math.round(inset) + 12) });
    };
    return (
      <>
        <Popover open={open} onOpenChange={setOpen}>
          <span className="contents" onClickCapture={measure}>
            <PopoverTrigger asChild>{children}</PopoverTrigger>
          </span>
          <PopoverContent
            side={place.side}
            align="start"
            sideOffset={place.offset}
            aria-labelledby={nameId}
            data-slot="guest-peek"
            className="w-80 p-4"
          >
            <div className={IDENTITY}>
              {faceCell}
              <h2
                id={nameId}
                className={cn(
                  "col-start-2 truncate font-heading text-card-title",
                  dim && "text-muted-foreground",
                )}
              >
                {name}
              </h2>
              <div className="col-start-2 text-sm text-muted-foreground">
                {kind}
              </div>
              {detailLine}
            </div>
            <div className="mt-4">{body("card")}</div>
          </PopoverContent>
        </Popover>
        {outside}
      </>
    );
  }

  return (
    <>
      <Popup open={open} onOpenChange={setOpen}>
        <span className="contents" onClickCapture={noteTrigger}>
          <PopupTrigger asChild>{children}</PopupTrigger>
        </span>
        <PopupContent kind="peek" data-slot="guest-peek">
          {/* The sheet's own head (its title names the sheet, its line the description), laid out as the desk's block:
              the face is a cell of the head's grid beside the title, its line and the detail. */}
          <PopupHeader
            className={cn(IDENTITY, "pb-0")}
            titleClassName={cn(
              "col-start-2 truncate",
              dim && "text-muted-foreground",
            )}
            title={name}
            description={kind}
          >
            {faceCell}
            {detailLine}
          </PopupHeader>
          {/* The last line clears a phone's home indicator, as the house's other sheets' feet do. */}
          <PopupBody className="pt-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
            {body("sheet")}
          </PopupBody>
        </PopupContent>
      </Popup>
      {outside}
    </>
  );
}
