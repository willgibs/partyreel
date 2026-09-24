"use client";

import { type CSSProperties, type ReactNode } from "react";
import {
  Ban,
  Check,
  Clapperboard,
  Download,
  EyeOff,
  Heart,
  Images,
  ListChecks,
  MoreHorizontal,
  Settings,
  Share2,
  Trash2,
  UserCheck,
  Users,
  X,
} from "lucide-react";

import { FeedSectionEmpty } from "@/components/app/event-feed/feed-section-empty";
import { FeedSectionHeader } from "@/components/app/event-feed/feed-section-header";
import { MediaTile, type GridMedia } from "@/components/app/media-grid";
import { FooterQr } from "@/components/marketing/chrome/footer-qr";
import { GALLERY_COLUMNS } from "@/components/shared/masonry";
import { PageHeading } from "@/components/shared/page-heading";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { floatingPanel, floatingRow } from "@/components/ui/floating-layer";
import { Switch } from "@/components/ui/switch";
import { GLASS, GLASS_BEHIND, GLASS_MARK_LIT } from "@/lib/glass";
import { cn } from "@/lib/utils";

import {
  ALBUM,
  BLOCKED,
  EVENT,
  NEWCOMERS,
  type Person,
  WAITING,
} from "./fixtures";
import { HostPage, Mark, type ScreenId } from "./scene";

/**
 * THE HOST'S SURFACES, QUOTED: the viewer with its credit, the Guests room,
 * the Review room and the event's hub. Each is the shipped markup at the
 * app's tokens with the one thing an option adds drawn into it; the menus
 * are the shipped `DropdownMenu` anatomy (a header naming the subject, the
 * rows, and the destructive act on its own footer rail) held open.
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

/** The cards row, quoted at rest (`event-cards-row.tsx`): four doors, Settings last. */
function CardsRow({ cards }: { cards: readonly HubCard[] }) {
  return (
    <div className="flex gap-2 overflow-hidden py-0.5">
      {cards.map((card) => {
        const Icon = CARD_ICON[card.id];
        return (
          <span
            key={card.id}
            data-es-card={card.id}
            className={cn(
              "flex h-24 w-36 shrink-0 flex-col justify-between gap-1 rounded-xl border p-3",
              card.amber
                ? "border-warning/40 bg-warning/5"
                : "border-border",
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

/** Today's four cards, with whatever a decision changes on them. */
export function hubCards(
  over: Partial<Record<HubCard["id"], Partial<HubCard>>> = {},
): HubCard[] {
  const base: HubCard[] = [
    { id: "review", label: "Review", value: "Nothing waiting" },
    { id: "reel", label: "Reel", value: "24 moments" },
    { id: "guests", label: "Guests", value: `${EVENT.guests} guests` },
    { id: "settings", label: "Settings", value: "Public" },
  ];
  return base.map((c) => ({ ...c, ...over[c.id] }));
}

/**
 * THE EVENT'S HUB, quoted (`/dashboard/[eventId]`): the live code beside the
 * title and its metadata, the cards row, then the album. `strip` is what a
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
  const phone = screen === "375";
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
        <div className="flex items-start gap-4">
          <span className="shrink-0 rounded-lg bg-white p-1.5 ring-1 ring-border">
            <FooterQr value={`https://partyreel.com/e/${EVENT.token}`} size={phone ? 64 : 96} />
          </span>
          <div className="min-w-0 space-y-1.5">
            <PageHeading>{EVENT.name}</PageHeading>
            <p className="text-xs text-muted-foreground">
              {`${EVENT.date} · ${photos} photos & videos · ${guests} guests`}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              partyreel.com/e/{EVENT.token}
            </p>
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

const PILL_ICON = `text-white/80 ${GLASS_MARK_LIT}`;

/**
 * THE HOST'S VIEWER, QUOTED (`shared/media-lightbox.tsx`): the hub behind it
 * blurred at half brightness (`behind=album`, on its own element), the close
 * circle, the photograph in its slot, and the pill stack at the foot, the
 * host's full set over today's credit capsule. `credit` is that capsule with
 * whatever an option does to it; `menu` floats above it.
 */
export function HostViewer({
  screen,
  item,
  position,
  credit,
  menu,
  overlay,
}: {
  screen: ScreenId;
  item: GridMedia;
  position: string;
  credit?: ReactNode;
  menu?: ReactNode;
  overlay?: ReactNode;
}) {
  return (
    <div className="relative min-h-full">
      <Hub screen={screen} />
      <div className={cn("fixed inset-0 z-40", GLASS_BEHIND)} />
      <div className="fixed inset-0 z-40 flex flex-col">
        <span
          className={cn(
            "absolute top-2.5 right-2.5 z-20 flex size-8 items-center justify-center rounded-full text-white",
            GLASS,
          )}
        >
          <X className={cn("size-4", GLASS_MARK_LIT)} aria-hidden />
        </span>
        <div className="relative min-h-0 flex-1 overflow-hidden">
          <div className="relative flex h-full items-center justify-center px-2 pb-6">
            {/* eslint-disable-next-line @next/next/no-img-element -- a local still standing in for a presigned photograph */}
            <img
              src={item.url}
              alt=""
              className="max-h-full max-w-full rounded-md object-contain select-none"
            />
          </div>
          <div className="pointer-events-none absolute inset-x-0 bottom-4 z-10 flex flex-col items-center gap-1.5">
            <div
              className={cn(
                "pointer-events-auto flex items-center gap-4 rounded-full px-5 py-2.5",
                GLASS,
              )}
            >
              <Heart className={cn("size-5", PILL_ICON)} aria-hidden />
              <Download className={cn("size-5", PILL_ICON)} aria-hidden />
              <Share2 className={cn("size-5", PILL_ICON)} aria-hidden />
              <span aria-hidden className="h-5 w-px shrink-0 bg-white/20" />
              <Clapperboard className={cn("size-5", PILL_ICON)} aria-hidden />
              <EyeOff className={cn("size-5", PILL_ICON)} aria-hidden />
              <Trash2 className={cn("size-5", PILL_ICON)} aria-hidden />
            </div>
            {credit ?? <Credit item={item} position={position} />}
          </div>
        </div>
        {menu}
      </div>
      {overlay}
    </div>
  );
}

/**
 * TODAY'S CREDIT CAPSULE (`AttributionPill`), the one `media-viewer.who` asks
 * the shape of: the name, the counter, and for the host alone the confirmed
 * address under it. `pressed` is the capsule the day it becomes a door, which
 * its own comment already anticipates ("it changes behaviour and not
 * appearance"): the press state and nothing else.
 */
export function Credit({
  item,
  position,
  pressed = false,
}: {
  item: GridMedia;
  position: string;
  pressed?: boolean;
}) {
  return (
    <div
      data-es-credit
      className={cn(
        "pointer-events-auto flex max-w-[88vw] flex-col items-center gap-1 rounded-full px-3 py-1 text-center",
        GLASS,
        pressed && "scale-[0.98] ring-2 ring-white/70",
      )}
    >
      <span
        className={cn(
          "inline-flex items-center gap-1.5 text-caption font-medium text-white/90",
          GLASS_MARK_LIT,
        )}
      >
        <span>{item.uploaderName}</span>
        {item.isVerified === false && <Mark tone="lit" />}
        <span className="text-white/40">·</span>
        <span className="text-white/70 tabular-nums">{position}</span>
      </span>
      {item.uploaderEmail && (
        <span className="text-[10px] text-white/55">{item.uploaderEmail}</span>
      )}
    </div>
  );
}

/* ── the menu, held open ──────────────────────────────────────────────────── */

const MENU_ROW = cn(
  "flex items-center gap-2 px-2 py-1.5 text-sm [&_svg]:size-4 [&_svg]:shrink-0",
  floatingRow,
);

/**
 * A PERSON'S MENU, the shipped `DropdownMenu` anatomy held open: the header
 * names who it is about (and, for the host, the address they proved), a row
 * that narrows to their uploads, and the act that cannot be undone on its
 * own footer rail. `foot` replaces the rail when an option asks a second time
 * right there.
 */
export function PersonMenu({
  person,
  foot,
  className,
  style,
}: {
  person: Person;
  foot?: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  const him = person.name.split(" ")[0];
  return (
    <div
      data-es-menu
      className={cn("es-menu overflow-hidden", floatingPanel, className)}
      style={style}
    >
      <div className="-mx-1 -mt-1 mb-1 flex items-baseline justify-between gap-3 border-b border-border px-3 py-2">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-sm leading-tight font-semibold tracking-tight">
            <span className="truncate">{person.name}</span>
            {!person.verified && <Mark />}
          </p>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {person.email ?? "Typed a name, no email"}
          </p>
        </div>
        <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
          {`${person.uploads} uploads`}
        </span>
      </div>
      <div className="flex flex-col gap-0.5">
        <span className={MENU_ROW}>
          <Images className="text-muted-foreground" aria-hidden />
          {`See ${him}'s uploads`}
        </span>
      </div>
      <div className="-mx-1 -mb-1 mt-1 flex flex-col gap-0.5 border-t border-border bg-muted/40 p-1">
        {foot ?? (
          <span data-es-reach className={cn(MENU_ROW, "text-destructive")}>
            <Ban aria-hidden />
            Block from this event
          </span>
        )}
      </div>
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
 */
export function GuestRow({
  person,
  screen,
  menu,
  trailing,
  muted = false,
}: {
  person: Person;
  screen: ScreenId;
  /** The row's menu, drawn open under its trigger. */
  menu?: ReactNode;
  /** Replaces the count and the menu trigger (a Let in, an Unblock). */
  trailing?: ReactNode;
  muted?: boolean;
}) {
  return (
    <li
      data-es-row={person.id}
      className={cn("relative flex items-center gap-3 px-4 py-3", menu && "z-10")}
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
          <Button
            variant="ghost"
            size="icon-sm"
            tabIndex={-1}
            aria-label={`More for ${person.name}`}
            className={cn(menu && "bg-muted")}
          >
            <MoreHorizontal />
          </Button>
        </>
      )}
      {menu && (
        <div className="absolute top-full right-3 z-20 -mt-1">{menu}</div>
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
  menuFor,
  menu,
  line,
  top,
  foot,
  heading,
  list,
  overlay,
}: {
  screen: ScreenId;
  people: readonly Person[];
  /** The id of the row whose menu is drawn open. */
  menuFor?: string;
  menu?: ReactNode;
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
                menu={p.id === menuFor ? menu : undefined}
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

/**
 * THE REVIEW ROOM, QUOTED (`review-section.tsx` pending): the amber header
 * with its count and its two actions, then the uniform 4:5 grid
 * (`UNIFORM_TILE_ASPECT`). `hidden` leaves the grid, which is what a Hide does
 * to a waiting upload; `notice` stands between the header and the grid.
 */
export function ReviewRoom({
  screen,
  items = WAITING,
  gone,
  notice,
  above,
  overlay,
}: {
  screen: ScreenId;
  items?: readonly GridMedia[];
  /** Ids a Hide has just taken off the queue. */
  gone?: ReadonlySet<string>;
  notice?: ReactNode;
  /** A group above the uploads (people waiting to join). */
  above?: ReactNode;
  overlay?: ReactNode;
}) {
  const left = items.filter((m) => !gone?.has(m.id));
  const phone = screen === "375";
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
        <div
          className="grid gap-[var(--gap-gallery)]"
          style={{
            gridTemplateColumns: phone
              ? "repeat(3, minmax(0, 1fr))"
              : "repeat(auto-fill, minmax(var(--album-column, 220px), 1fr))",
          }}
        >
          {left.map((item) => (
            <div
              key={item.id}
              className="relative aspect-[4/5] overflow-hidden bg-black/10"
              style={{ borderRadius: "var(--radius-tile)" }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- a local still standing in for a presigned photograph */}
              <img src={item.url} alt="" className="size-full object-cover" />
            </div>
          ))}
        </div>
      </section>
      </div>
    </HostPage>
  );
}

/**
 * THE LINE A DECLINE LEAVES in Review's own header band (never the toast,
 * which is `host-curation.undo`'s question): who sent what the host just hid,
 * and the block one tap away.
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
            {" sent all 3 you just hid."}
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

/** A switch row as a form lays it out (`FormItem` over `Switch`), still. */
export function SwitchRow({
  label,
  description,
  checked,
  locked,
}: {
  label: string;
  description?: ReactNode;
  checked: boolean;
  /** Held on by another choice: drawn disabled with its reason. */
  locked?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="space-y-0.5">
        <p className="text-sm leading-none font-medium">{label}</p>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
        {locked && <p className="text-xs text-muted-foreground">{locked}</p>}
      </div>
      <Switch checked={checked} disabled={Boolean(locked)} tabIndex={-1} />
    </div>
  );
}
