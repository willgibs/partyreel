"use client";

import { type CSSProperties, type ReactNode } from "react";
import {
  Bell,
  ChevronLeft,
  Clapperboard,
  Eye,
  Images,
  Link2,
  ListChecks,
  Settings,
  Users,
} from "lucide-react";

import { FeedSectionHeader } from "@/components/app/event-feed/feed-section-header";
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
import { Container } from "@/components/shared/container";
import { Logo } from "@/components/shared/logo";
import { GALLERY_COLUMNS } from "@/components/shared/masonry";
import { PageHeading } from "@/components/shared/page-heading";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { EVENT_ROOMS } from "@/lib/event/sections";
import { GLASS_MARK, GLASS_MARK_LIT } from "@/lib/glass";
import { cn } from "@/lib/utils";

import { ALBUM, EVENT, HOST, type Person } from "./fixtures";
import type { ScreenId } from "./screens";

/**
 * THE HOST'S CHROME AND THE EVENT'S HUB, QUOTED (ported from event-safety's
 * `scene.tsx` and `host.tsx`): the app's bar, the hub's header with its live
 * code, the cards row on `room-card.ts`'s own shell (imported) and the album on
 * the shipped column rule. Settings stands over this at a desk, the panel
 * beside the album it governs; in a hand it is its own screen and none of this
 * shows.
 *
 * ★ NOTHING HERE IS WIRED: every control carries `tabIndex={-1}` and no
 * handler, drawn at rest.
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

/**
 * THE UNVERIFIED MARK, QUOTED (`shared/unverified-mark.tsx`'s trigger): the dot
 * in a small disc. The real one is a Popover that would portal out of the frame.
 */
export function Mark({ tone = "paper" }: { tone?: "paper" | "lit" }) {
  return (
    <span
      aria-label="Unverified"
      className={cn(
        "inline-flex size-4 shrink-0 items-center justify-center rounded-full align-middle",
        tone === "lit" ? GLASS_MARK : "border border-border bg-muted",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "size-1 rounded-full",
          tone === "lit"
            ? cn("bg-white", GLASS_MARK_LIT)
            : "bg-muted-foreground",
        )}
      />
    </span>
  );
}

/**
 * THE HOST APP'S BAR (`AppShell`), quoted: the wordmark, the crumb trail, and
 * the account's own face. At 375 the trail cuts to its parent behind a back
 * chevron (`crumbs.tsx`); at 1440 it is the whole path.
 */
export function HostBar({
  screen,
  trail,
}: {
  screen: ScreenId;
  trail: readonly string[];
}) {
  const phone = screen === "375";
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
          <Avatar size="sm" seed={HOST.seed}>
            <AvatarFallback className="text-[10px]">
              {HOST.first.slice(0, 1)}
            </AvatarFallback>
          </Avatar>
        </div>
      </Container>
    </header>
  );
}

/** A host page: the bar, then `main`'s own padding and the page's column. */
export function HostPage({
  screen,
  trail,
  children,
  overlay,
}: {
  screen: ScreenId;
  trail: readonly string[];
  children: ReactNode;
  /** A panel, a screen or a menu over the page, quoted. */
  overlay?: ReactNode;
}) {
  return (
    <div className="min-h-full bg-background text-foreground">
      <HostBar screen={screen} trail={trail} />
      <main className="py-8">
        <Container>{children}</Container>
      </main>
      {overlay}
    </div>
  );
}

/** The album on the shipped column rule (`gallery-width`'s own rule, worn). */
export function AlbumGrid({ items }: { items: readonly GridMedia[] }) {
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
          className="relative mb-[var(--gap-gallery)] w-full break-inside-avoid overflow-hidden bg-black/10"
        >
          <MediaTile item={item} playBadge="none" />
        </div>
      ))}
    </div>
  );
}

/* ── the hub ──────────────────────────────────────────────────────────────── */

export type HubCard = {
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
 * imported): a phone's 2x2 grid of two-line cards and the row of tiles from
 * `sm`. The Highlight reel is its live card, a still of the album behind its
 * words (`reel-card.tsx`'s `LiveCard`).
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
              data-set-card={card.id}
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
            data-set-card={card.id}
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
 * decision stands between the cards and the album; `paused` dims the code, the
 * way a paused event's header says so (host-app.md: "a paused event dims the
 * code").
 */
export function Hub({
  screen,
  cards = hubCards(),
  strip,
  overlay,
  paused = false,
}: {
  screen: ScreenId;
  cards?: readonly HubCard[];
  strip?: ReactNode;
  overlay?: ReactNode;
  paused?: boolean;
}) {
  return (
    <HostPage screen={screen} trail={[EVENT.name]} overlay={overlay}>
      <div className="space-y-6">
        <div className="flex items-center gap-4 sm:gap-5">
          <span
            className={cn(
              "shrink-0 rounded-lg bg-white p-2",
              paused && "opacity-40",
            )}
          >
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
                {EVENT.photos}
              </span>
              <span className="flex items-center gap-1.5">
                <Users className="size-3.5" aria-hidden />
                {EVENT.guests}
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
        <CardsRow cards={cards} />
        {strip}
        <div className="space-y-2.5">
          <FeedSectionHeader label="Album" count={EVENT.photos} />
          <AlbumGrid items={ALBUM} />
        </div>
      </div>
    </HostPage>
  );
}
