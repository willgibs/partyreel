"use client";

import { type CSSProperties, type ReactNode } from "react";
import {
  Ban,
  Check,
  Clapperboard,
  Download,
  Eye,
  EyeOff,
  Heart,
  Images,
  Link2,
  ListChecks,
  MoreHorizontal,
  Settings,
  Share2,
  ShieldCheck,
  Trash2,
  UserCheck,
  Users,
  X,
} from "lucide-react";

import { FeedSectionEmpty } from "@/components/app/event-feed/feed-section-empty";
import { FeedSectionHeader } from "@/components/app/event-feed/feed-section-header";
import { ReviewGrid } from "@/components/app/event-feed/review-grid";
import {
  reviewCardFace,
  ROOM_CARD_BASE,
  ROOM_CARD_QUIET,
  ROOM_CARD_VALUE,
  roomCardSize,
  roomRowLayout,
} from "@/components/app/event-feed/room-card";
import { MediaTile, type GridMedia } from "@/components/app/media-grid";
import { FooterQr } from "@/components/marketing/chrome/footer-qr";
import { LIGHTBOX_ACTION } from "@/components/shared/media-lightbox-parts/actions";
import { FaceCredit } from "@/components/shared/media-lightbox-parts/credit";
import { FILMSTRIP_REACH } from "@/components/shared/media-lightbox-parts/filmstrip";
import {
  CHROME,
  peekMetrics,
} from "@/components/shared/media-lightbox-parts/geometry";
import { GALLERY_COLUMNS } from "@/components/shared/masonry";
import { PageHeading } from "@/components/shared/page-heading";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { EVENT_ROOMS } from "@/lib/event/sections";
import { GLASS, GLASS_BEHIND } from "@/lib/glass";
import { cn } from "@/lib/utils";

import {
  ALBUM,
  BLOCKED,
  DOM_UPLOADS,
  EVENT,
  NEWCOMERS,
  type Person,
  WAITING,
} from "./fixtures";
import { HostPage, Mark, SCREENS, type ScreenId } from "./scene";

/**
 * THE HOST'S SURFACES, QUOTED: the viewer with its credit, the Guests room,
 * the Review room and the event's hub. Each is the shipped markup at the
 * app's tokens with the one thing an option adds drawn into it, and wherever
 * production's own piece is presentational it is imported, not redrawn (the
 * viewer's face-led credit, its geometry and its capsule's glyph class; the
 * hub's room cards; the Review queue's grid), so the board cannot drift from
 * the surfaces it proposes to change (the refresh, 2026-09-28).
 *
 * ★ NOTHING HERE IS WIRED. A Block, a Let in and an Unblock carry
 * `tabIndex={-1}` and no handler: this is a catalog of what a host would meet,
 * and a stray press in review does nothing rather than something invisible.
 */

const initial = (name: string) => name.slice(0, 1).toUpperCase();

/** A person's face: a confirmed account's colour, or the plain disc of a typed name. */
export function Face({
  person,
  size = "default",
}: {
  person: Pick<Person, "name" | "verified" | "seed">;
  size?: "default" | "sm" | "lg";
}) {
  return (
    <Avatar size={size} seed={person.verified ? person.seed : undefined}>
      <AvatarFallback className={size === "sm" ? "text-[10px]" : "text-xs"}>
        {initial(person.name)}
      </AvatarFallback>
    </Avatar>
  );
}

/* ── the album, as the hub and the viewer's ground draw it ───────────────── */

/** The album on the shipped column rule (`gallery-width`'s own rule, worn). */
export function AlbumGrid({
  items,
  dim,
}: {
  items: readonly GridMedia[];
  /** Ids drawn at the hidden state's 30 percent (`dimItem`). */
  dim?: ReadonlySet<string>;
}) {
  return (
    <div className={GALLERY_COLUMNS}>
      {items.map((item) => (
        <div
          key={item.id}
          style={
            {
              aspectRatio: `${item.width} / ${item.height}`,
              borderRadius: "var(--radius-tile)",
            } as CSSProperties
          }
          className={cn(
            "relative mb-[var(--gap-gallery)] w-full break-inside-avoid overflow-hidden bg-black/10",
            dim?.has(item.id) && "opacity-30",
          )}
        >
          <MediaTile item={item} playBadge="none" />
        </div>
      ))}
    </div>
  );
}

/* ── the hub ──────────────────────────────────────────────────────────────── */

type HubCard = {
  id: "review" | "reel" | "guests" | "settings";
  label: string;
  value: string;
  amber?: boolean;
};

const CARD_ICON = {
  review: ListChecks,
  reel: Clapperboard,
  guests: Users,
  settings: Settings,
} as const;

/**
 * THE CARDS ROW, AT REST (`event-cards-row.tsx` on `room-card.ts`'s one shell,
 * imported): a phone's 2x2 grid of two-line cards, every door whole, and the
 * row of tiles from `sm`. The Highlight reel is its live card, a still of the
 * album behind its words (`reel-card.tsx`'s `LiveCard`), since a wedding with
 * 48 photographs is well past the reel's minimum.
 */
function CardsRow({ cards }: { cards: readonly HubCard[] }) {
  return (
    <div role="group" aria-label="This event" className={roomRowLayout(false)}>
      {cards.map((card) => {
        const Icon = CARD_ICON[card.id];
        if (card.id === "reel") {
          return (
            <span
              key={card.id}
              data-es-card={card.id}
              className={cn(
                ROOM_CARD_BASE,
                roomCardSize(false),
                "relative overflow-hidden border-transparent text-white",
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- a local still standing in for the reel's living stills */}
              <img
                src={ALBUM[5].url}
                alt=""
                className="absolute inset-0 size-full object-cover"
              />
              <span
                aria-hidden
                className="absolute inset-0 bg-linear-to-t from-black/80 via-black/50 to-black/30"
              />
              <Icon
                className="relative size-4 shrink-0 text-white/85"
                aria-hidden
              />
              <span className="relative font-heading text-card-title font-medium">
                {card.label}
              </span>
              <span
                className={cn(
                  "relative truncate text-xs text-white/85",
                  ROOM_CARD_VALUE,
                )}
              >
                {card.value}
              </span>
            </span>
          );
        }
        return (
          <span
            key={card.id}
            data-es-card={card.id}
            className={cn(
              ROOM_CARD_BASE,
              roomCardSize(false),
              card.amber ? "border-warning/40 bg-warning/5" : ROOM_CARD_QUIET,
            )}
          >
            <Icon
              className={cn(
                "size-4 shrink-0",
                card.amber ? "text-warning" : "text-muted-foreground",
              )}
              aria-hidden
            />
            <span className="font-heading text-card-title font-medium">
              {card.label}
            </span>
            <span
              className={cn(
                "truncate text-xs tabular-nums",
                ROOM_CARD_VALUE,
                card.amber
                  ? "font-medium text-warning"
                  : "text-muted-foreground",
              )}
            >
              {card.value}
            </span>
          </span>
        );
      })}
    </div>
  );
}

/**
 * Today's four cards in the row's own order and words (`EVENT_ROOMS`, and the
 * Review card's face from `reviewCardFace`: review is off at this wedding),
 * with whatever a decision changes on them.
 */
export function hubCards(
  over: Partial<Record<HubCard["id"], Partial<HubCard>>> = {},
): HubCard[] {
  const value: Record<HubCard["id"], string> = {
    review: reviewCardFace(false, 0).value,
    reel: "Live for guests",
    guests: `${EVENT.guests} guests`,
    settings: "Public",
  };
  return EVENT_ROOMS.map((room) => ({
    id: room.id,
    label: room.label,
    value: value[room.id],
    ...over[room.id],
  }));
}

/**
 * THE EVENT'S HUB, quoted (`/dashboard/[eventId]`): the live code beside the
 * title and its metadata row, the cards row, then the album. `strip` is what a
 * decision stands between the cards and the album.
 */
export function Hub({
  screen,
  cards = hubCards(),
  strip,
  overlay,
  items = ALBUM,
  photos = EVENT.photos,
  guests = EVENT.guests,
}: {
  screen: ScreenId;
  cards?: readonly HubCard[];
  strip?: ReactNode;
  overlay?: ReactNode;
  items?: readonly GridMedia[];
  /** The album's size and the one count, after whatever an option did. */
  photos?: number;
  guests?: number;
}) {
  // The Guests card says the one count, so a block that took someone off the
  // list takes them off the card too (unless an option wrote the card itself).
  const shown = cards.map((c) =>
    c.id === "guests" && c.value === `${EVENT.guests} guests`
      ? { ...c, value: `${guests} guests` }
      : c,
  );
  return (
    <HostPage screen={screen} trail={[EVENT.name]} overlay={overlay}>
      <div className="space-y-6">
        {/* The header as one object (`page.tsx`): the code's height is the
            title, the metadata row and the link, at 112 px at every width. */}
        <div className="flex items-center gap-4 sm:gap-5">
          <span className="shrink-0 rounded-lg bg-white p-2">
            <FooterQr
              value={`https://partyreel.com/e/${EVENT.token}`}
              size={112}
            />
          </span>
          <div className="min-w-0 flex-1 space-y-1">
            <PageHeading className="truncate">{EVENT.name}</PageHeading>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
              <span>{EVENT.date}</span>
              <span className="flex items-center gap-1.5">
                <Images className="size-3.5" aria-hidden />
                {photos}
              </span>
              <span className="flex items-center gap-1.5">
                <Users className="size-3.5" aria-hidden />
                {guests}
              </span>
              <span className="flex items-center gap-1.5">
                <Eye className="size-3.5" aria-hidden />
                {EVENT.views}
              </span>
            </div>
            <div className="flex min-w-0 items-center gap-1.5">
              <Link2
                className="size-3.5 shrink-0 text-muted-foreground"
                aria-hidden
              />
              <span className="min-w-0 truncate text-xs text-muted-foreground">
                partyreel.com/e/{EVENT.token}
              </span>
            </div>
          </div>
        </div>
        <CardsRow cards={shown} />
        {strip}
        <div className="space-y-2.5">
          <FeedSectionHeader label="Album" count={photos} />
          <AlbumGrid items={items} />
        </div>
      </div>
    </HostPage>
  );
}

/* ── the viewer ───────────────────────────────────────────────────────────── */

/** A still of the photograph beside the open one, for the neighbours' slivers. */
function Sliver({
  item,
  side,
  width,
  top,
  bottom,
}: {
  item: GridMedia;
  side: "left" | "right";
  width: number;
  top: number;
  bottom: number;
}) {
  return (
    <div
      aria-hidden
      className="absolute overflow-hidden"
      style={{
        [side]: 0,
        width,
        top,
        bottom,
        borderRadius: "var(--radius-tile)",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- a local still standing in for a presigned photograph */}
      <img
        src={item.url}
        alt=""
        className="size-full object-cover"
        style={{ objectPosition: side === "left" ? "right" : "left" }}
      />
    </div>
  );
}

/**
 * THE DESK'S FILMSTRIP, QUOTED (`media-lightbox-parts/filmstrip.tsx`): the
 * frames either side of the open photograph within its reach, the current one
 * lifted and ringed. The real one wraps each frame in a tooltip, which would
 * portal out of the frame, so it is drawn still from its own classes.
 */
function FilmstripQuote({ at }: { at: number }) {
  const frames = FILMSTRIP_REACH * 2 + 1;
  const stills = [...ALBUM, ...DOM_UPLOADS];
  return (
    <div aria-hidden className="relative h-11" style={{ width: frames * 30 }}>
      {Array.from({ length: frames }, (_, i) => {
        const k = i - FILMSTRIP_REACH;
        const current = k === 0;
        return (
          <span
            key={k}
            className={cn(
              "absolute bottom-0 left-1/2 -ml-3 h-9 w-6 overflow-hidden rounded-[3px] bg-white/10",
              current ? "opacity-100 ring-2 ring-white" : "opacity-45",
            )}
            style={{
              transform: `translateX(${k * 30}px) scale(${current ? 1.12 : 1})`,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- a local still standing in for a presigned photograph */}
            <img
              src={stills[(at + k + stills.length) % stills.length].url}
              alt=""
              className="size-full object-cover"
            />
          </span>
        );
      })}
    </div>
  );
}

/**
 * THE HOST'S VIEWER, AS IT SHIPS (`shared/media-lightbox.tsx`, media-viewer
 * `7eb190de`): the hub behind it blurred at half brightness (`behind=album`, on
 * its own element); the face-led credit at the top left (the real `FaceCredit`,
 * with the address only the host reads) opposite the close circle; the
 * photograph at fit in the box the chrome leaves (`CHROME`), a sliver of each
 * neighbour at the edges (`peekMetrics`); the action capsule at the foot, the
 * host's curate group after its rule; and at a desk the filmstrip under it.
 *
 * `pressed` rings the credit as a door the moment it is tapped, and `look` is
 * what that door opens: at a desk its card stands under the credit, in a hand
 * it arrives as its own Sheet and is drawn by the caller.
 */
export function HostViewer({
  screen,
  item,
  neighbours,
  at,
  pressed = false,
  look,
  overlay,
}: {
  screen: ScreenId;
  item: GridMedia;
  neighbours: readonly [GridMedia, GridMedia];
  /** Where the open photograph sits in the album, for the filmstrip. */
  at: number;
  pressed?: boolean;
  /** The card the credit opens at a desk, anchored under it. */
  look?: ReactNode;
  overlay?: ReactNode;
}) {
  const { w } = SCREENS[screen];
  const desk = screen === "1440";
  const { peek, gap } = peekMetrics(w);
  // A fine pointer at 1024 and up shows the filmstrip, which lifts the capsule.
  const strip = desk;
  const foot = CHROME.bottom + (strip ? CHROME.filmstrip : 0);
  return (
    <div className="relative min-h-full">
      <Hub screen={screen} />
      <div className={cn("fixed inset-0 z-40", GLASS_BEHIND)} />
      <div className="fixed inset-0 z-40 overflow-hidden">
        <Sliver
          item={neighbours[0]}
          side="left"
          width={peek}
          top={CHROME.top}
          bottom={foot}
        />
        <div
          className="absolute flex items-center justify-center"
          style={{
            left: peek + gap,
            right: peek + gap,
            top: CHROME.top,
            bottom: foot,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- a local still standing in for a presigned photograph */}
          <img
            src={item.url}
            alt=""
            className="max-h-full max-w-full object-contain select-none"
            style={{ borderRadius: "var(--radius-tile)" }}
          />
        </div>
        <Sliver
          item={neighbours[1]}
          side="right"
          width={peek}
          top={CHROME.top}
          bottom={foot}
        />

        <div
          className="absolute left-2.5 z-20 flex max-w-[calc(100%-4rem)]"
          style={{ top: "0.625rem" }}
        >
          <span
            data-es-credit
            className={cn(
              "relative flex min-w-0 rounded-full",
              pressed && "ring-2 ring-white/70",
            )}
          >
            <FaceCredit item={item} viewerIsHost isOwn={false} />
            {look}
          </span>
        </div>
        <span
          className={cn(
            "absolute right-2.5 z-20 flex size-8 items-center justify-center rounded-full text-white",
            GLASS,
          )}
          style={{ top: "0.625rem" }}
        >
          <X className="size-4" aria-hidden />
        </span>

        <div
          className="absolute inset-x-0 z-10 flex flex-col items-center gap-2"
          style={{ bottom: CHROME.capsuleGap + (strip ? CHROME.filmstrip : 0) }}
        >
          <div
            className={cn(
              "flex max-w-[calc(100vw-1.5rem)] items-center gap-3 rounded-full px-4 py-2.5 sm:gap-4 sm:px-5",
              GLASS,
            )}
          >
            {[Heart, Download, Share2, Link2].map((Icon, i) => (
              <span key={i} className={LIGHTBOX_ACTION}>
                <Icon className="size-5" aria-hidden />
              </span>
            ))}
            <span aria-hidden className="h-5 w-px shrink-0 bg-white/20" />
            {[EyeOff, Trash2].map((Icon, i) => (
              <span key={i} className={LIGHTBOX_ACTION}>
                <Icon className="size-5" aria-hidden />
              </span>
            ))}
          </div>
        </div>
        {strip && (
          <div
            className="absolute inset-x-0 flex justify-center"
            style={{ bottom: "0.75rem" }}
          >
            <FilmstripQuote at={at} />
          </div>
        )}
      </div>
      {overlay}
    </div>
  );
}

/* ── the Guests room ──────────────────────────────────────────────────────── */

/**
 * ONE GUEST, AS THE HOST'S OWN ROOM READS THEM: the face, the name (and the
 * mark on a typed one), the confirmed address under it (the host alone ever
 * sees it; a typed address never shows), how many photographs, and the row's
 * menu. Rows rather than the album's chips: a row has room for an address, a
 * count and a menu (the board's `room-rows` call).
 *
 * `looks` is the room where every name opens its look (`guest-peek.tsx`, as
 * production's chips already do), so the row keeps its count and loses the
 * menu it no longer needs; `open` is the name just tapped, its look standing
 * under it at a desk (`look`).
 */
export function GuestRow({
  person,
  screen,
  looks = false,
  open = false,
  look,
  trailing,
  muted = false,
}: {
  person: Person;
  screen: ScreenId;
  /** Every name opens its look, so there is no menu to draw. */
  looks?: boolean;
  /** This name was just tapped. */
  open?: boolean;
  /** Its look at a desk, anchored under the name. */
  look?: ReactNode;
  /** Replaces the count and the menu trigger (a Let in, an Unblock). */
  trailing?: ReactNode;
  muted?: boolean;
}) {
  return (
    <li
      data-es-row={person.id}
      className={cn(
        "relative flex items-center gap-3 px-4 py-3",
        open && "z-10 bg-muted/60",
      )}
    >
      <Face person={person} />
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "flex items-center gap-1.5 text-sm font-medium",
            muted && "text-muted-foreground",
          )}
        >
          <span className="truncate">{person.name}</span>
          {!person.verified && <Mark />}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          {person.email ?? "Typed a name"}
        </p>
      </div>
      {trailing ?? (
        <>
          <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
            {screen === "375" ? person.uploads : `${person.uploads} photos`}
          </span>
          {!looks && (
            <Button
              variant="ghost"
              size="icon-sm"
              tabIndex={-1}
              aria-label={`More for ${person.name}`}
            >
              <MoreHorizontal />
            </Button>
          )}
        </>
      )}
      {look && (
        <div className="absolute top-full left-3 z-20 mt-1.5">{look}</div>
      )}
    </li>
  );
}

/** A labelled group of rows in the room, on the room's own card. */
export function RoomSection({
  label,
  count,
  note,
  tone,
  children,
}: {
  label: string;
  count?: number;
  note?: ReactNode;
  tone?: "amber" | "quiet";
  children: ReactNode;
}) {
  return (
    <section className="space-y-2">
      <FeedSectionHeader label={label} count={count} amber={tone === "amber"} />
      {note && <p className="text-xs text-muted-foreground">{note}</p>}
      <ul
        className={cn(
          "divide-y divide-border rounded-lg border",
          tone === "amber" && "border-warning/40",
          tone === "quiet" && "bg-muted/30",
        )}
      >
        {children}
      </ul>
    </section>
  );
}

/**
 * THE GUESTS ROOM (`/dashboard/[eventId]/guests`), as the host's own full
 * list: the heading and the one count, whatever an option says under the
 * heading, a section above the guests (the door's queue), the guests, and a
 * section under them (the blocked, the people with no photos yet).
 */
export function GuestsRoom({
  screen,
  people,
  looks = false,
  lookFor,
  look,
  line,
  top,
  foot,
  heading,
  list,
  overlay,
}: {
  screen: ScreenId;
  people: readonly Person[];
  /** Every name opens its look (`GuestRow`'s `looks`). */
  looks?: boolean;
  /** The id of the row whose name was just tapped. */
  lookFor?: string;
  /** Its look at a desk, anchored under the name. */
  look?: ReactNode;
  /** A line or a control under the heading. */
  line?: ReactNode;
  top?: ReactNode;
  foot?: ReactNode;
  /** Replaces the heading row (a tab switch). */
  heading?: ReactNode;
  /** Replaces the guests' own list (a tab showing something else). */
  list?: ReactNode;
  overlay?: ReactNode;
}) {
  const count = people.length;
  return (
    <HostPage screen={screen} trail={[EVENT.name, "Guests"]} overlay={overlay}>
      <div className="space-y-5">
        {heading ?? (
          <div className="flex items-baseline gap-2.5">
            <PageHeading>Guests</PageHeading>
            <span className="text-sm text-muted-foreground tabular-nums">
              {count}
            </span>
          </div>
        )}
        {line}
        {top}
        {list ?? (
          <ul className="divide-y divide-border rounded-lg border">
            {people.map((p) => (
              <GuestRow
                key={p.id}
                person={p}
                screen={screen}
                looks={looks}
                open={p.id === lookFor}
                look={p.id === lookFor ? look : undefined}
              />
            ))}
          </ul>
        )}
        {foot}
      </div>
    </HostPage>
  );
}

/** The room's quiet "today" face: the invitation, and nothing listed. */
export function GuestsRoomToday({ screen }: { screen: ScreenId }) {
  return (
    <HostPage screen={screen} trail={[EVENT.name, "Guests"]}>
      <div className="space-y-6">
        <PageHeading>Guests</PageHeading>
        <FeedSectionEmpty
          icon={Users}
          title="Introduce your guests"
          desc="Turn on the guest list to name everyone who added photos, right on the album. Unverified names wear a small mark."
          action={
            <Button variant="outline" size="sm" tabIndex={-1}>
              Guest list settings
            </Button>
          }
        />
      </div>
    </HostPage>
  );
}

/* ── the door's queue, as rows ────────────────────────────────────────────── */

/** A newcomer who confirmed an address and waits: Let in, or Decline (a block). */
export function NewcomerRow({
  n,
  screen,
  reachable = false,
}: {
  n: (typeof NEWCOMERS)[number];
  screen: ScreenId;
  reachable?: boolean;
}) {
  const phone = screen === "375";
  return (
    <li className="flex items-center gap-3 px-4 py-3">
      <Face person={{ name: n.name, verified: true, seed: n.seed }} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{n.name}</p>
        <p className="truncate text-xs text-muted-foreground">
          {phone ? n.email : `${n.email} · ${n.when}`}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        <Button
          variant="ghost"
          size="sm"
          tabIndex={-1}
          className="text-muted-foreground"
        >
          Decline
        </Button>
        <Button
          size="sm"
          tabIndex={-1}
          data-es-reach={reachable ? "" : undefined}
        >
          <UserCheck /> Let in
        </Button>
      </div>
    </li>
  );
}

/** The queue as a room section: the newcomers, and what declining does. */
export function DoorQueue({ screen }: { screen: ScreenId }) {
  return (
    <RoomSection
      label="At the door"
      count={NEWCOMERS.length}
      tone="amber"
      note="Declining someone blocks them. You can let them back from Blocked."
    >
      {NEWCOMERS.map((n, i) => (
        <NewcomerRow key={n.id} n={n} screen={screen} reachable={i === 0} />
      ))}
    </RoomSection>
  );
}

/** One blocked person: when, what the block left behind, and the way back. */
export function BlockedRow({
  b,
  screen,
  reachable = false,
}: {
  b: (typeof BLOCKED)[number];
  screen: ScreenId;
  reachable?: boolean;
}) {
  return (
    <li className="flex items-center gap-3 px-4 py-3">
      <Face person={b} />
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
          <span className="truncate">{b.name}</span>
          {!b.verified && <Mark />}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          {screen === "375"
            ? (b.email ?? b.note)
            : `${b.email ?? "Typed a name"} · ${b.when} · ${b.note}`}
        </p>
      </div>
      <Button
        variant="outline"
        size="sm"
        tabIndex={-1}
        data-es-reach={reachable ? "" : undefined}
        className="shrink-0"
      >
        Let back in
      </Button>
    </li>
  );
}

/** The blocked list as a room section. */
export function BlockedSection({ screen }: { screen: ScreenId }) {
  return (
    <RoomSection
      label="Blocked"
      count={BLOCKED.length}
      tone="quiet"
      note="Only you see this. Blocked people meet a closed album."
    >
      {BLOCKED.map((b, i) => (
        <BlockedRow key={b.id} b={b} screen={screen} reachable={i === 0} />
      ))}
    </RoomSection>
  );
}

/* ── the Review room ──────────────────────────────────────────────────────── */

/** Nothing selected and nothing leaving: the queue at rest. */
const NONE: ReadonlySet<string> = new Set();

/**
 * THE REVIEW ROOM (`review/page.tsx` over `review-section.tsx` pending): the
 * page's heading, then the amber header with its count and its browse pair,
 * then the queue on the real `ReviewGrid`, the uniform 4:5 grid Will kept
 * (host-curation `queue=uniform`), imported whole. `gone` leaves the grid,
 * which is what a Reject does to a waiting upload (his `verb=reject`); `notice`
 * and `above` stand between the header and the grid, and `prompt` stands
 * directly on the grid it folds into (his `arrivals=prompt`). `keys` rings the
 * photograph the arrows stand on (his `keys=arrows`, with no hint row: arrows
 * move, Enter approves, Backspace rejects).
 */
export function ReviewRoom({
  screen,
  items = WAITING,
  gone,
  notice,
  above,
  prompt,
  keys = false,
  overlay,
}: {
  screen: ScreenId;
  items?: readonly GridMedia[];
  /** Ids a Reject has just taken off the queue. */
  gone?: ReadonlySet<string>;
  notice?: ReactNode;
  /** A group above the uploads (people waiting to join). */
  above?: ReactNode;
  /** The line that folds new arrivals in, on the grid. */
  prompt?: ReactNode;
  /** The keyboard's place, on the first photograph. */
  keys?: boolean;
  overlay?: ReactNode;
}) {
  const left = items.filter((m) => !gone?.has(m.id));
  return (
    <HostPage screen={screen} trail={[EVENT.name, "Review"]} overlay={overlay}>
      <div className="space-y-6">
        <PageHeading>Review</PageHeading>
        <section aria-label="Review" className="space-y-2.5">
          <FeedSectionHeader
            label="Review"
            count={left.length}
            amber
            action={
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" tabIndex={-1}>
                  <ListChecks /> Select
                </Button>
                <Button size="sm" tabIndex={-1}>
                  <Check /> Approve all
                </Button>
              </div>
            }
          />
          {notice}
          {above}
          {prompt}
          <div data-es-keys={keys ? "" : undefined}>
            <ReviewGrid
              items={[...left]}
              selectMode={false}
              selected={NONE as Set<string>}
              exiting={NONE as Set<string>}
              onToggle={() => {}}
            />
          </div>
        </section>
      </div>
    </HostPage>
  );
}

/**
 * THE LINE A REJECT LEAVES in Review's own header band (the bulk act's toast,
 * with its Undo, is host-curation's answered `undo`): who sent what the host
 * just rejected, and the block one tap away.
 */
export function HiddenNotice({
  screen,
  person,
  sent,
  actions,
}: {
  screen: ScreenId;
  /** Who sent what the host just hid. */
  person: Person;
  sent: readonly GridMedia[];
  /** Replaces the two buttons (an option that asks a second time in place). */
  actions?: ReactNode;
}) {
  const phone = screen === "375";
  const first = person.name.split(" ")[0];
  return (
    <div
      data-es-notice
      className={cn(
        "flex gap-3 rounded-lg border border-border bg-muted/40 p-3",
        phone ? "flex-col" : "items-center",
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <span className="flex -space-x-2">
          {sent.slice(0, 3).map((m) => (
            <span
              key={m.id}
              className="size-8 overflow-hidden rounded-[var(--radius-tile)] ring-2 ring-background"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- a local still standing in for a presigned photograph */}
              <img src={m.url} alt="" className="size-full object-cover" />
            </span>
          ))}
        </span>
        <p className="min-w-0 text-sm">
          <span className="font-medium">{person.name}</span>
          {!person.verified && (
            <span className="ml-1 inline-flex align-middle">
              <Mark />
            </span>
          )}
          <span className="text-muted-foreground">
            {` sent all ${sent.length} you just rejected.`}
            {!phone && person.email && ` ${person.email}`}
          </span>
        </p>
      </div>
      {actions ?? (
        <div className="flex shrink-0 items-center gap-2">
          <Button variant="ghost" size="sm" tabIndex={-1}>
            Not now
          </Button>
          <Button
            variant="outline"
            size="sm"
            tabIndex={-1}
            data-es-reach
            className="border-destructive/40 text-destructive"
          >
            <Ban /> {`Block ${first}`}
          </Button>
        </div>
      )}
    </div>
  );
}

/* ── small furniture the rooms share ─────────────────────────────────────── */

/**
 * A switch row as a form lays it out (`FormItem` over `Switch`), still.
 * `guarded` is `ConfirmSwitch`'s row, which asks before its consequential
 * direction and says so with the small shield after its label.
 */
export function SwitchRow({
  label,
  description,
  checked,
  locked,
  guarded = false,
}: {
  label: string;
  description?: ReactNode;
  checked: boolean;
  /** Held on by another choice: drawn disabled with its reason. */
  locked?: string;
  guarded?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="space-y-0.5">
        <p className="text-sm leading-none font-medium">
          {label}
          {guarded && (
            <ShieldCheck
              aria-hidden
              className="ml-2 inline size-3.5 align-[-2px] text-muted-foreground"
            />
          )}
        </p>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
        {locked && <p className="text-xs text-muted-foreground">{locked}</p>}
      </div>
      <Switch checked={checked} disabled={Boolean(locked)} tabIndex={-1} />
    </div>
  );
}
