"use client";

import type { CSSProperties, ReactNode } from "react";
import {
  Bell,
  CalendarPlus,
  Check,
  ChevronLeft,
  Clapperboard,
  Download,
  EyeOff,
  Flag,
  Heart,
  ImageUp,
  ListChecks,
  Mail,
  MoreHorizontal,
  QrCode,
  Settings,
  Share2,
  SlidersHorizontal,
  Trash2,
  Users,
  X,
} from "lucide-react";

import { MediaTile } from "@/components/app/media-grid";
import { FooterQr } from "@/components/marketing/chrome/footer-qr";
import { Container } from "@/components/shared/container";
import { Logo } from "@/components/shared/logo";
import { GALLERY_COLUMNS } from "@/components/shared/masonry";
import { PageHeading } from "@/components/shared/page-heading";
import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { ALBUM, type Chip, EVENT, GUESTS, HOST, PRIYA, THEO } from "./fixtures";
import type { Size } from "./surfaces";

/**
 * THE SCREENS A POPUP OPENS OVER, drawn the way production draws them and never
 * redesigned here: the guest's album (its top, and its foot where the Guests
 * section and Report live), the host's event and dashboard, the account page
 * and a person's page. Each carries `data-pop-ground`, which is how a caption
 * knows the frame has painted.
 *
 * ★ QUOTED WHERE PRODUCTION READS A SESSION OR POSTS (`GuestHeader`, the hub's
 * cards, the bulk bar's tooltips): their markup is copied with the reads taken
 * out. `MediaTile`, `GALLERY_COLUMNS`, `FooterQr`, `Avatar` and `Button` are
 * the real, session-free pieces, imported as they are.
 *
 * ★ A POPUP THAT OPENS IN PLACE OR BESIDE ITS BUTTON NEEDS THE GROUND'S OWN
 * SPOT, so each ground takes the node an option puts there (`at`, `replace`,
 * `below`) rather than every option redrawing the page around one change.
 */

export const initial = (name: string) => name.slice(0, 1).toUpperCase();

/** A person's face: a confirmed account's colour, or a typed name's plain disc. */
export function Face({
  name,
  seed,
  avatar,
  size = "sm",
}: {
  name: string;
  seed?: string;
  avatar?: string;
  size?: "sm" | "default" | "lg" | "xl";
}) {
  return (
    <Avatar size={size} seed={seed}>
      {avatar && <AvatarImage src={avatar} alt="" className="object-cover" />}
      <AvatarFallback className={size === "sm" ? "text-[10px]" : undefined}>
        {initial(name)}
      </AvatarFallback>
    </Avatar>
  );
}

/** The Unverified mark on a chip: `unverified-mark.tsx`'s `paper` tone, quoted
 *  without the Popover the product opens from it. */
export function Mark() {
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

/** One guest, as `guest-list.tsx`'s chip draws them. */
export function GuestChip({ chip, tapped }: { chip: Chip; tapped?: boolean }) {
  return (
    <span
      data-pop-row=""
      data-pop-tapped={tapped ? "" : undefined}
      className={cn(
        CHIP,
        chip.confirmed && chip.slug
          ? "text-foreground"
          : "text-muted-foreground",
        tapped &&
          "border-ring/50 bg-muted/60 text-foreground ring-2 ring-ring/30",
      )}
    >
      <Face name={chip.name} seed={chip.seed} avatar={chip.avatar} />
      <span className="max-w-40 truncate">{chip.name}</span>
      {!chip.confirmed && <Mark />}
    </span>
  );
}

/** The names, as many as fit the drawing: `data-pop-total` keeps the count
 *  honest when a surface only ever shows the head of 240. */
export function GuestNames({
  count = 60,
  tapped,
  className,
  at,
}: {
  count?: number;
  tapped?: string;
  className?: string;
  /** Beside the tapped chip: a card an option opens at the name. */
  at?: ReactNode;
}) {
  return (
    <ul
      data-pop-rows=""
      data-pop-total={GUESTS.length}
      data-pop-noun="names"
      className={cn("flex flex-wrap items-center gap-1.5", className)}
    >
      {GUESTS.slice(0, count).map((chip) => (
        <li key={chip.id} className={cn(chip.id === tapped && "relative")}>
          <GuestChip chip={chip} tapped={chip.id === tapped} />
          {chip.id === tapped && at}
        </li>
      ))}
    </ul>
  );
}

/** The closed row his `list=faces` picked: the whole row is the button. */
export function FacesRow() {
  const faces = GUESTS.slice(0, 6);
  return (
    <span className="flex items-center gap-3 rounded-full">
      <AvatarGroup>
        {faces.map((g) => (
          <Face key={g.id} name={g.name} seed={g.seed} avatar={g.avatar} />
        ))}
        <AvatarGroupCount className="size-6 text-[10px]">
          +{GUESTS.length - faces.length}
        </AvatarGroupCount>
      </AvatarGroup>
      <span className="text-sm text-muted-foreground">
        {GUESTS.length} guests added photos
      </span>
    </span>
  );
}

/* ── the guest's album ───────────────────────────────────────────────────── */

/** `guest-header.tsx`'s two states, markup copied, session read removed. */
function GuestHeader({ named }: { named: boolean }) {
  return (
    <header className="flex items-center justify-between gap-2 border-b border-border/60 px-5 py-3">
      <Logo />
      <div className="flex h-8 items-center">
        {named ? (
          <span className="flex items-center gap-2 rounded-full">
            <Avatar size="sm" seed={PRIYA.seed}>
              <AvatarFallback className="text-[10px]">P</AvatarFallback>
            </Avatar>
            <span className="max-w-28 truncate text-sm">{PRIYA.name}</span>
          </span>
        ) : (
          <Button variant="ghost" size="sm" tabIndex={-1}>
            Start for free
          </Button>
        )}
      </div>
    </header>
  );
}

function HostByline() {
  return (
    <span className="flex items-center gap-1.5">
      <span className="text-faint">Hosted by</span>
      <Avatar seed={HOST.seed} size="sm">
        <AvatarImage src={HOST.avatar} alt="" className="object-cover" />
        <AvatarFallback>{initial(HOST.name)}</AvatarFallback>
      </Avatar>
      <span className="font-medium text-foreground">{HOST.name}</span>
    </span>
  );
}

function Tile({ index }: { index: number }) {
  const item = ALBUM[index % ALBUM.length];
  return (
    <div
      style={
        {
          aspectRatio: `${item.width} / ${item.height}`,
          borderRadius: "var(--radius-tile)",
        } as CSSProperties
      }
      className="relative mb-[var(--gap-gallery)] w-full break-inside-avoid overflow-hidden bg-black/10"
    >
      <MediaTile item={item} playBadge="none" />
    </div>
  );
}

/** The album on the shipped column rule in the shipped tile. */
export function AlbumTiles({
  from = 0,
  count = 12,
}: {
  from?: number;
  count?: number;
}) {
  return (
    <div className={GALLERY_COLUMNS}>
      {Array.from({ length: count }, (_, i) => (
        <Tile key={i} index={from + i} />
      ))}
    </div>
  );
}

/** A spot on a ground an option can use: a node beside the control (`at`),
 *  instead of it (`replace`), or under it (`below`). */
export type Spot = { at?: ReactNode; replace?: ReactNode; below?: ReactNode };

/**
 * THE GUEST'S ALBUM, drawn at `top` (the words, the actions, the head of the
 * album) or at `foot` (the album's end, the Guests section and the Report
 * footer): the two places on the page a guest's popups open from.
 */
export function GuestAlbum({
  size,
  view,
  named = true,
  add,
  invite,
  download,
  guests,
  report,
  overlay,
}: {
  size: Size;
  view: "top" | "foot";
  named?: boolean;
  add?: Spot;
  invite?: Spot;
  download?: Spot;
  /** What the Guests section holds: the closed row by default. */
  guests?: ReactNode;
  report?: Spot;
  overlay?: ReactNode;
}) {
  const desk = size === "desk";
  return (
    <div
      data-pop-ground=""
      className="relative flex min-h-screen flex-col bg-background text-foreground"
    >
      <GuestHeader named={named} />
      {view === "top" ? (
        <div className="w-full flex-1 pt-8 pb-24">
          <div className="w-full max-w-2xl px-5">
            <h1 className="font-heading text-page text-balance">
              {EVENT.name}
            </h1>
            <p className="mt-2.5 flex items-center gap-2 text-xs text-muted-foreground">
              <HostByline />
              <span aria-hidden className="text-faint">
                ·
              </span>
              <span>{EVENT.date}</span>
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {`${EVENT.photos} photos & videos from ${EVENT.guests} guests`}
            </p>
            <div className="mt-4">
              {add?.replace ?? (
                <span className="relative block">
                  <Button
                    type="button"
                    size="lg"
                    className="w-full"
                    tabIndex={-1}
                  >
                    <ImageUp /> Add photos
                  </Button>
                  {add?.at}
                </span>
              )}
              {add?.below}
              <div className="relative mt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9 w-full"
                  tabIndex={-1}
                >
                  <Share2 /> Invite
                </Button>
                {invite?.at}
              </div>
            </div>
          </div>
          <div className={cn("mt-7", desk ? "px-5" : "px-3")}>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-1.5">
              <p className="px-0.5 text-working text-muted-foreground tabular-nums">
                {`${EVENT.photos} photos & videos`}
              </p>
              <div className="ml-auto flex items-center gap-1.5">
                <span className="relative">
                  <span className="flex items-center gap-1.5 rounded-md px-2 py-1 text-sm text-muted-foreground">
                    <Download className="size-4" /> Download all
                  </span>
                  {download?.at}
                </span>
                <Button type="button" variant="outline" size="sm" tabIndex={-1}>
                  <SlidersHorizontal /> View
                </Button>
              </div>
            </div>
            {download?.below}
            <AlbumTiles count={desk ? 18 : 8} />
          </div>
        </div>
      ) : (
        <div className="w-full flex-1 pb-10">
          <div className={cn("pt-3", desk ? "px-5" : "px-3")}>
            <AlbumTiles from={3} count={desk ? 6 : 4} />
          </div>
          <div className="w-full max-w-2xl px-5">
            <section aria-label="Guests" className="mt-10 space-y-3">
              <h2 className="text-label font-semibold text-muted-foreground uppercase">
                Guests
              </h2>
              {guests ?? <FacesRow />}
            </section>
          </div>
          <footer className="mx-3 mt-8 flex flex-col items-center border-t border-border/60 pt-5 sm:mx-5">
            {report?.replace ?? (
              <span className="relative">
                <span className="flex h-7 items-center gap-1 rounded-md px-2.5 text-xs text-muted-foreground">
                  <Flag className="size-3.5" /> Report
                </span>
                {report?.at}
              </span>
            )}
            {report?.below}
          </footer>
        </div>
      )}
      {overlay}
    </div>
  );
}

/* ── the host's app ──────────────────────────────────────────────────────── */

/** `AppShell`'s bar, quoted: the wordmark, the trail, the account's face. */
export function HostBar({
  size,
  trail,
  who = "maya",
}: {
  size: Size;
  trail: readonly string[];
  /** Whose account is signed in: Maya hosts; Priya confirmed as a guest. */
  who?: Who;
}) {
  const phone = size === "phone";
  const parent = trail.length > 1 ? trail[trail.length - 2] : "Partyreel";
  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
      <Container className="flex h-14 items-center gap-4">
        <span className="shrink-0">
          <Logo />
        </span>
        <nav
          aria-label="Breadcrumb"
          className="flex min-w-0 items-center gap-1.5 text-sm text-muted-foreground"
        >
          {phone ? (
            <span className="flex min-w-0 items-center gap-1">
              <ChevronLeft className="size-4 shrink-0" aria-hidden />
              <span className="truncate">{parent}</span>
            </span>
          ) : (
            ["Partyreel", ...trail].map((step, i, all) => (
              <span key={step} className="flex items-center gap-1.5">
                <span
                  className={cn(
                    "truncate",
                    i === all.length - 1 && "font-medium text-foreground",
                  )}
                >
                  {step}
                </span>
                {i < all.length - 1 && (
                  <span aria-hidden className="text-faint">
                    /
                  </span>
                )}
              </span>
            ))
          )}
        </nav>
        <div className="ml-auto flex shrink-0 items-center gap-2">
          <Button
            variant="ghost"
            size="icon-sm"
            tabIndex={-1}
            aria-label="Notifications"
          >
            <Bell />
          </Button>
          {who === "maya" ? (
            <Avatar size="sm" seed={HOST.seed}>
              <AvatarImage src={HOST.avatar} alt="" className="object-cover" />
              <AvatarFallback className="text-[10px]">M</AvatarFallback>
            </Avatar>
          ) : (
            <Avatar size="sm" seed={PRIYA.seed}>
              <AvatarFallback className="text-[10px]">P</AvatarFallback>
            </Avatar>
          )}
        </div>
      </Container>
    </header>
  );
}

export type Who = "maya" | "priya";

/** A host page: the bar, then `main`'s padding and the page's column. */
export function HostPage({
  size,
  trail,
  who,
  children,
  overlay,
}: {
  size: Size;
  trail: readonly string[];
  who?: Who;
  children: ReactNode;
  overlay?: ReactNode;
}) {
  return (
    <div
      data-pop-ground=""
      className="relative min-h-screen bg-background text-foreground"
    >
      <HostBar size={size} trail={trail} who={who} />
      <main className="py-8">
        <Container>{children}</Container>
      </main>
      {overlay}
    </div>
  );
}

const CARDS = [
  { id: "review", label: "Review", value: "Nothing waiting", Icon: ListChecks },
  { id: "reel", label: "Reel", value: "24 moments", Icon: Clapperboard },
  {
    id: "guests",
    label: "Guests",
    value: `${EVENT.guests} guests`,
    Icon: Users,
  },
  { id: "settings", label: "Settings", value: "Public", Icon: Settings },
] as const;

/** The cards row, quoted at rest (`event-cards-row.tsx`), and the Share pill
 *  that takes the header code's place once it scrolls away. */
function CardsRow({ share }: { share?: Spot }) {
  return (
    <div className="flex items-center gap-2 overflow-visible py-0.5">
      {CARDS.map(({ id, label, value, Icon }) => (
        <span
          key={id}
          className="flex h-24 w-36 shrink-0 flex-col justify-between gap-1 rounded-xl border p-3"
        >
          <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          <span className="font-heading text-card-title font-medium">
            {label}
          </span>
          <span className="truncate text-xs text-muted-foreground tabular-nums">
            {value}
          </span>
        </span>
      ))}
      {share && (
        <span className="relative ml-auto shrink-0">
          <Button type="button" size="sm" variant="outline" tabIndex={-1}>
            <QrCode /> Share
          </Button>
          {share.at}
        </span>
      )}
    </div>
  );
}

/** The select mode's bar (`bulk-bar.tsx`), quoted: All, the count, the verbs. */
function BulkBar({ count, del }: { count: number; del?: Spot }) {
  const glyph =
    "flex size-7 items-center justify-center rounded-[calc(var(--radius-action)*0.7)]";
  return (
    <div className="flex items-center gap-1 sm:gap-1.5">
      <Button type="button" variant="ghost" size="sm" tabIndex={-1}>
        All
      </Button>
      <span className="px-0.5 text-xs text-muted-foreground tabular-nums">
        {count}
      </span>
      <span className={cn(glyph, "text-like")}>
        <Heart className="size-4" aria-hidden />
      </span>
      <span className={cn(glyph, "text-warning")}>
        <EyeOff className="size-4" aria-hidden />
      </span>
      <span className={glyph}>
        <Download className="size-4" aria-hidden />
      </span>
      <span className="relative">
        {del?.replace ?? (
          <span className={cn(glyph, "bg-muted text-destructive")}>
            <Trash2 className="size-4" aria-hidden />
          </span>
        )}
        {del?.at}
      </span>
      <span className={glyph}>
        <X className="size-4" aria-hidden />
      </span>
    </div>
  );
}

/**
 * THE EVENT'S HUB (`/dashboard/[eventId]`), quoted: the live code beside the
 * title, the cards row, then the album. In select mode the album's head is
 * the bulk bar, and `selected` tiles wear the selection ring.
 */
export function HostHub({
  size,
  select,
  share,
  gone = 0,
  overlay,
}: {
  size: Size;
  /** Select mode: how many tiles are chosen, and what the Delete spot holds. */
  select?: { count: number; del?: Spot };
  share?: Spot;
  /** Tiles already gone (an act done at once): the album starts after them. */
  gone?: number;
  overlay?: ReactNode;
}) {
  const phone = size === "phone";
  const photos = EVENT.photos - gone;
  return (
    <HostPage size={size} trail={[EVENT.name]} overlay={overlay}>
      <div className="space-y-6">
        <div className="flex items-start gap-4">
          <span className="shrink-0 rounded-lg bg-white p-1.5 ring-1 ring-border">
            <FooterQr value={`https://${EVENT.url}`} size={phone ? 64 : 96} />
          </span>
          <div className="min-w-0 space-y-1.5">
            <PageHeading>{EVENT.name}</PageHeading>
            <p className="text-xs text-muted-foreground">
              {`${EVENT.date} · ${photos} photos & videos · ${EVENT.guests} guests`}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {EVENT.url}
            </p>
          </div>
        </div>
        <CardsRow share={share} />
        <div className="space-y-2.5">
          <div className="flex min-h-8 items-center justify-between gap-2">
            <p className="text-sm font-medium">
              Album{" "}
              <span className="text-muted-foreground tabular-nums">
                {photos}
              </span>
            </p>
            {select ? (
              <BulkBar count={select.count} del={select.del} />
            ) : (
              <Button type="button" variant="outline" size="sm" tabIndex={-1}>
                <SlidersHorizontal /> View
              </Button>
            )}
          </div>
          <div className={GALLERY_COLUMNS}>
            {Array.from({ length: phone ? 8 : 18 }, (_, i) => {
              const item = ALBUM[(i + gone) % ALBUM.length];
              const chosen = select && i < select.count;
              return (
                <div
                  key={i}
                  style={
                    {
                      aspectRatio: `${item.width} / ${item.height}`,
                      borderRadius: "var(--radius-tile)",
                    } as CSSProperties
                  }
                  className={cn(
                    "relative mb-[var(--gap-gallery)] w-full break-inside-avoid overflow-hidden bg-black/10",
                    chosen &&
                      "ring-3 ring-ring ring-offset-2 ring-offset-background",
                  )}
                >
                  <MediaTile item={item} playBadge="none" />
                  {chosen && (
                    <span className="absolute top-2 left-2 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <Check className="size-3" aria-hidden />
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </HostPage>
  );
}

/**
 * THE DASHBOARD (`/dashboard`), quoted: its heading and the events it counts,
 * a banner when there is one (over the storage limit, or photos waiting to be
 * claimed), and the event's card with its QR shortcut. Priya's is a guest's
 * dashboard: no event of her own, only what waits for her.
 */
export function Dashboard({
  size,
  who = "maya",
  banner,
  share,
  overlay,
}: {
  size: Size;
  who?: Who;
  banner?: ReactNode;
  share?: Spot;
  overlay?: ReactNode;
}) {
  const events = who === "maya" ? 1 : 0;
  return (
    <HostPage size={size} trail={["Dashboard"]} who={who} overlay={overlay}>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <PageHeading>Dashboard</PageHeading>
            <p className="text-sm text-muted-foreground">{`${events} of 1 event used`}</p>
          </div>
          <Button type="button" tabIndex={-1}>
            <CalendarPlus /> New event
          </Button>
        </div>
        {banner}
        {events > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="overflow-hidden rounded-xl border bg-card">
              <div className="relative aspect-[16/10] bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element -- a fixture still standing in for the event's cover */}
                <img
                  src={ALBUM[5].url}
                  alt=""
                  className="absolute inset-0 size-full object-cover"
                />
                <span className="absolute top-2 right-2">
                  <span className="flex size-8 items-center justify-center rounded-full bg-background/90 shadow-layer">
                    <QrCode className="size-4" aria-hidden />
                  </span>
                  {share?.at}
                </span>
              </div>
              <div className="space-y-0.5 p-3">
                <p className="font-heading text-card-title font-medium">
                  {EVENT.name}
                </p>
                <p className="text-xs text-muted-foreground">{`14 Jun 2026 · ${EVENT.photos} photos & videos`}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </HostPage>
  );
}

/** Production's over-limit banner, its "See plans" the pricing sheet's door. */
export function OverLimit({ spot }: { spot?: Spot }) {
  return (
    <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm">
      <p className="font-medium text-foreground">
        You’re over your storage limit
      </p>
      <p className="mt-1 text-muted-foreground">
        Upgrade or remove media by{" "}
        <strong className="text-foreground">21 October</strong>. After that
        we’ll automatically reduce your storage (largest files first).{" "}
        <span className="relative">
          <span className="font-medium text-foreground underline underline-offset-4">
            See plans
          </span>
          {spot?.at}
        </span>
        .
      </p>
    </div>
  );
}

/** The storage meter's row on the dashboard, quoted. */
export function StorageMeter({
  used,
  cap,
  pct,
}: {
  used: string;
  cap: string;
  pct: number;
}) {
  return (
    <div className="space-y-1.5 rounded-xl border p-3">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium">Storage</span>
        <span className="text-muted-foreground tabular-nums">{`${used} of ${cap}`}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full rounded-full",
            pct >= 100 ? "bg-destructive" : "bg-foreground",
          )}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
    </div>
  );
}

/** A banner row on the dashboard: a line, and the act that opens a popup. */
export function DashBanner({
  icon,
  children,
  act,
  spot,
}: {
  icon: ReactNode;
  children: ReactNode;
  act: string;
  spot?: Spot;
}) {
  return (
    <div className="relative">
      {spot?.replace ?? (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3">
          <span className="flex min-w-0 items-center gap-2.5 text-sm text-foreground [&>svg]:size-4 [&>svg]:shrink-0 [&>svg]:text-muted-foreground">
            {icon}
            <span className="min-w-0 text-pretty">{children}</span>
          </span>
          <span className="relative shrink-0">
            <Button type="button" size="sm" variant="outline" tabIndex={-1}>
              {act}
            </Button>
            {spot?.at}
          </span>
        </div>
      )}
      {spot?.below}
    </div>
  );
}

/** The claims banner his `ticket=banner` picked, quoted from identity-claims. */
export function ClaimsBanner({ spot }: { spot?: Spot }) {
  return (
    <DashBanner icon={<Mail />} act="Review" spot={spot}>
      16 photos from 4 events are waiting for you
    </DashBanner>
  );
}

/* ── the account page ────────────────────────────────────────────────────── */

/** `/account`, quoted: its cards in a column; `danger` is the last card's spot. */
export function AccountPage({
  size,
  plan,
  danger,
  overlay,
}: {
  size: Size;
  plan: "free" | "pro";
  danger?: Spot;
  overlay?: ReactNode;
}) {
  const card = "space-y-3 rounded-xl border bg-card p-4";
  return (
    <HostPage size={size} trail={["Account"]} overlay={overlay}>
      <div className="mx-auto max-w-2xl space-y-4">
        <PageHeading>Account</PageHeading>
        <div className={card}>
          <p className="font-heading text-card-title font-medium">Plan</p>
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              {plan === "pro"
                ? "Pro 100 GB, $9/mo. Renews 14 Oct."
                : "Free. About 512 photos."}
            </p>
            <Button type="button" size="sm" variant="outline" tabIndex={-1}>
              {plan === "pro" ? "Change plan" : "Upgrade"}
            </Button>
          </div>
        </div>
        <div className={card}>
          <p className="font-heading text-card-title font-medium">Profile</p>
          <div className="flex items-center gap-3">
            <Face
              name={HOST.name}
              seed={HOST.seed}
              avatar={HOST.avatar}
              size="lg"
            />
            <div className="min-w-0">
              <p className="text-sm font-medium">{HOST.full}</p>
              <p className="truncate text-xs text-muted-foreground">
                {HOST.email}
              </p>
            </div>
          </div>
        </div>
        <div className={card}>
          <p className="font-heading text-card-title font-medium">
            Email preferences
          </p>
          <p className="text-sm text-muted-foreground">
            Product news, at most once a month.
          </p>
        </div>
        <div className={card}>
          {danger?.replace ?? (
            <>
              <p className="font-heading text-card-title font-medium text-destructive">
                Delete account
              </p>
              <p className="text-sm text-muted-foreground">
                Closing your account is immediate and permanent. Download
                anything you want to keep first.
              </p>
              <span className="relative inline-block">
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  tabIndex={-1}
                >
                  Delete account
                </Button>
                {danger?.at}
              </span>
            </>
          )}
          {danger?.below}
        </div>
      </div>
    </HostPage>
  );
}

/* ── a person's page (`/u/<handle>`) ─────────────────────────────────────── */

export type PagePerson = {
  name: string;
  seed?: string;
  avatar?: string;
  handle: string;
  line: string;
  events: readonly { name: string; cover: string }[];
};

/** Theo, whose page `forms` reports from. */
export const THEO_PAGE: PagePerson = {
  ...THEO,
  events: [
    { name: "Maya & Jay", cover: ALBUM[1].url },
    { name: "Ana's 30th", cover: ALBUM[6].url },
    { name: "Beach Bonfire", cover: ALBUM[9].url },
  ],
};

/** A person's page as a signed-in visitor meets it: the head, the More menu,
 *  the events its owner chose to show. `more` is the menu's spot. */
export function PersonPage({
  size,
  person = THEO_PAGE,
  more,
  below,
  overlay,
  surface = false,
}: {
  size: Size;
  person?: PagePerson;
  more?: ReactNode;
  below?: ReactNode;
  overlay?: ReactNode;
  /** The page itself is what a tap opened (a quick look straight to it). */
  surface?: boolean;
}) {
  return (
    <div
      data-pop-ground=""
      className="relative min-h-screen bg-background text-foreground"
    >
      <header className="flex items-center justify-between gap-2 border-b border-border/60 px-5 py-3">
        <Logo />
        <Avatar size="sm" seed={PRIYA.seed}>
          <AvatarFallback className="text-[10px]">P</AvatarFallback>
        </Avatar>
      </header>
      <main
        data-pop-surface={surface ? "page" : undefined}
        className={cn(
          "mx-auto w-full max-w-3xl px-5",
          size === "desk" ? "py-12" : "py-8",
        )}
      >
        <section className="flex items-center gap-5">
          <Face
            name={person.name}
            seed={person.seed}
            avatar={person.avatar}
            size="xl"
          />
          <div className="min-w-0 flex-1">
            <p className="font-heading text-page text-balance">{person.name}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {person.handle} · {person.line}
            </p>
          </div>
          <span className="relative self-start">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              tabIndex={-1}
              aria-label="More options"
            >
              <MoreHorizontal />
            </Button>
            {more}
          </span>
        </section>
        {below}
        <p className="mt-10 mb-3 text-label font-semibold text-muted-foreground uppercase">
          Events
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {person.events.map((e) => (
            <div
              key={e.name}
              className="overflow-hidden rounded-xl border bg-card"
            >
              <div className="relative aspect-[4/3] bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element -- a fixture still standing in for an event cover */}
                <img
                  src={e.cover}
                  alt=""
                  className="absolute inset-0 size-full object-cover"
                />
              </div>
              <p className="truncate p-2.5 text-sm font-medium">{e.name}</p>
            </div>
          ))}
        </div>
      </main>
      {overlay}
    </div>
  );
}
