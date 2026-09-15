"use client";

import Image from "next/image";
import {
  Bell,
  Check,
  Download,
  Eye,
  Globe,
  Heart,
  Images,
  Plus,
  QrCode,
  Share2,
  Sparkles,
  Users,
  X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EventCard } from "@/components/app/event-card";
import { FeedSection } from "@/components/app/dashboard/feed-section";
import { FilterChips } from "@/components/app/dashboard/filter-chips";
import { Logo } from "@/components/shared/logo";
import { PageHeading } from "@/components/shared/page-heading";
import { marketingImage } from "@/lib/constants/marketing-media";
import { cn } from "@/lib/utils";
import type { Mode } from "@/components/dev/board";

import {
  GROUND_JOBS,
  RING_USES,
  STATE_HUES,
  TEXT_STEPS,
  type Ramp,
} from "./ramps";

/**
 * ROUND TWO'S SPECIMENS: the surfaces round one did not put on the board, and
 * the ones that broke when it did.
 *
 * The rule every piece here follows: a grey is judged where it fails, and it
 * fails in a composition, never in a swatch. So each specimen is a real screen
 * of the product rebuilt from the production components (EventCard,
 * FilterChips, FeedSection, Card, Button, Badge, Logo, PageHeading) plus the
 * licensed marketing images, at the same density the page ships at.
 *
 * ★ Breakpoints do NOT work inside a Stage (a 375 wide canvas inside a 1440
 * viewport still matches `sm:`), so every component takes `mode` and branches
 * on it, and `sizes` on next/image is canvas-relative because the stage is
 * zoom-fitted and `vw` would lie.
 *
 * ★ Radix panels (DropdownMenu, Popover, Dialog) portal to document.body,
 * which escapes both the stage's zoom and the candidate's inline tokens, so
 * every menu, popover and overlay here is hand-placed with the skin copied
 * verbatim from its primitive. The file names each source beside the copy.
 */

const PHOTOS = [
  "wedding-golden",
  "party-balloons",
  "concert-confetti",
  "reception-table",
  "wedding-toast",
  "festival-lights",
  "wedding-arch",
  "party-dj",
  "wedding-petals",
  "reception-hall",
  "festival-crowd",
  "wedding-rings",
] as const;

const photo = (i: number) => marketingImage(PHOTOS[i % PHOTOS.length]).src;

/* ── The state row ──────────────────────────────────────────────────────── */

/**
 * The six state hues on whatever ground they are dropped on, at the size they
 * ship at. Under every ramp in both modes, because a ramp is not finished until
 * the colours it must never be confused with still read on it: C's warm ground
 * is the case that could go wrong, and a dark room a step lighter changes what
 * `--warning` at 0.84 does to the eye.
 */
export function StateRow({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
      {STATE_HUES.map((s) => (
        <span
          key={s.token}
          className={cn(
            "inline-flex items-center gap-1 rounded-full border border-border",
            compact ? "px-1.5 py-0.5" : "px-2 py-1",
          )}
        >
          <span
            className="size-2.5 rounded-full"
            style={{ background: `var(${s.token})` }}
          />
          <span className="text-[10px] text-muted-foreground">{s.name}</span>
        </span>
      ))}
    </div>
  );
}

/* ── The five grounds: what one token is actually doing ─────────────────── */

/**
 * The finding, rendered rather than argued. Three surfaces that all read as
 * "the dark one" and want different things: the lightbox backdrop (a literal
 * black, not a token at all), the media well, and the ink slab. On a PAPER
 * stage, because the slab's whole job is to sit on a light page.
 */
export function GroundsRow({ mode, ramp }: { mode: Mode; ramp: Ramp }) {
  const desktop = mode === "desktop";
  const gallery = ramp.gallery["--gallery"];
  const slab =
    ramp.ink["--background"] === "var(--gallery)"
      ? gallery
      : ramp.ink["--background"];
  return (
    <div
      className={cn(
        "flex h-full flex-col",
        desktop ? "gap-6 px-16 py-10" : "gap-5 px-5 py-8",
      )}
    >
      <div>
        <h3 className={cn("font-heading", desktop ? "text-3xl" : "text-2xl")}>
          Three dark surfaces, one token and a literal.
        </h3>
        <p className="mt-1.5 max-w-xl text-sm text-muted-foreground">
          Bible 16 counts four grounds. These are the three the count leaves
          out, on the light page where they actually appear.
        </p>
      </div>

      <div
        className={cn("grid gap-5", desktop ? "grid-cols-3" : "grid-cols-1")}
      >
        {/* 1. The lightbox backdrop: a literal, which is the finding. */}
        <div className="flex flex-col gap-2">
          <div className="relative aspect-[4/3] overflow-hidden rounded-lg">
            <Image
              src={photo(0)}
              alt=""
              fill
              sizes={desktop ? "300px" : "340px"}
              className="object-cover"
            />
            {/* media-lightbox.tsx:617, verbatim: the deepest surface in the
                product does not read --gallery at all. */}
            <div className="absolute inset-0 bg-black/90" />
            <div className="absolute inset-0 flex items-center justify-center p-5">
              <div className="relative h-4/5 w-4/5 overflow-hidden rounded-md">
                <Image
                  src={photo(1)}
                  alt=""
                  fill
                  sizes={desktop ? "240px" : "280px"}
                  className="object-cover"
                />
              </div>
            </div>
            <span className="absolute top-2 right-2 flex size-7 items-center justify-center rounded-full bg-black/45 text-white">
              <X className="size-3.5" />
            </span>
          </div>
          <Job
            name={GROUND_JOBS[0].name}
            value="oklch(0 0 0 / 0.9)"
            where={GROUND_JOBS[0].where}
            wants={GROUND_JOBS[0].wants}
          />
        </div>

        {/* 2. The media well: --gallery under a tile and behind a cover. */}
        <div className="flex flex-col gap-2">
          <div
            className="grid aspect-[4/3] grid-cols-2 overflow-hidden rounded-lg"
            style={{ gap: "var(--gap-gallery)" }}
          >
            <div className="relative bg-gallery">
              <Image
                src={photo(2)}
                alt=""
                fill
                sizes={desktop ? "150px" : "170px"}
                className="object-cover"
              />
            </div>
            <div className="flex items-center justify-center bg-gallery text-gallery-muted">
              <Images className="size-6" />
            </div>
            <div className="flex items-center justify-center bg-gallery text-gallery-muted">
              <span className="text-[10px]">no cover yet</span>
            </div>
            <div className="relative bg-gallery">
              <Image
                src={photo(3)}
                alt=""
                fill
                sizes={desktop ? "150px" : "170px"}
                className="object-cover"
              />
            </div>
          </div>
          <Job
            name={GROUND_JOBS[1].name}
            value={gallery}
            where={GROUND_JOBS[1].where}
            wants={GROUND_JOBS[1].wants}
          />
        </div>

        {/* 3. The ink slab: type and a card on a leaf inside a paper page.
            The CLASS stays (a leaf is a class in production) but the candidate's
            own ink block rides inline on the same element, because a class rule
            would otherwise serve the SHIPPED values while the caption below
            names the candidate's, and a board must never label one thing and
            render another. */}
        <div className="flex flex-col gap-2">
          <div
            className="surface-ink flex aspect-[4/3] flex-col justify-between gap-3 overflow-hidden rounded-lg bg-background p-4 text-foreground"
            style={{ ...ramp.gallery, ...ramp.ink } as React.CSSProperties}
          >
            <div className="flex items-start justify-between gap-3">
              <Logo />
              <span className="text-[10px] text-muted-foreground">2026</span>
            </div>
            <p className="text-sm">The album everyone was already making.</p>
            <div className="rounded-md border border-border bg-card p-2 text-card-foreground">
              <p className="text-[11px] font-medium">A card on the leaf</p>
              <p className="text-[10px] text-muted-foreground">
                Today it has no --card of its own.
              </p>
            </div>
          </div>
          <Job
            name={GROUND_JOBS[2].name}
            value={slab}
            where={GROUND_JOBS[2].where}
            wants={GROUND_JOBS[2].wants}
          />
        </div>
      </div>
    </div>
  );
}

function Job({
  name,
  value,
  where,
  wants,
}: {
  name: string;
  value: string;
  where: string;
  wants: string;
}) {
  return (
    <div className="space-y-0.5">
      <p className="text-xs font-medium">
        {name}
        <span className="ml-1.5 text-muted-foreground tabular-nums">
          {value}
        </span>
      </p>
      <p className="text-[11px] text-muted-foreground">{where}</p>
      <p className="text-[11px] text-muted-foreground">It wants: {wants}</p>
    </div>
  );
}

/* ── The host event page ────────────────────────────────────────────────── */

/**
 * The dark app composition round one never showed: the event page's header, its
 * stat band and config chips (dashboard/[eventId]/page.tsx:190 to 244, rebuilt
 * line for line), the command strip, the review queue and the media grid. This
 * is the densest chrome in the product and the place where four crushed dark
 * surfaces are visible at once: the page, the card, the panel inside the card,
 * and the grid's wells between the photographs.
 */
export function AppEvent({ mode }: { mode: Mode }) {
  const desktop = mode === "desktop";
  return (
    <div
      className={cn(
        "flex h-full flex-col overflow-hidden",
        desktop ? "gap-6 px-10 py-8" : "gap-4 px-4 py-6",
      )}
    >
      <div className="space-y-2">
        <span className="text-sm text-muted-foreground">Back to events</span>
        <PageHeading className={desktop ? "text-3xl" : "text-2xl"}>
          Mia and Theo
        </PageHeading>
        {/* The stat line, verbatim in structure: date, items, contributors,
            views, all at text-sm on --muted-foreground. */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
          <span>Sat 14 Jun</span>
          <span className="flex items-center gap-1.5">
            <Images className="size-3.5" />
            <span className="tabular-nums">312</span>
          </span>
          <span className="flex items-center gap-1.5">
            <Users className="size-3.5" />
            <span className="tabular-nums">41</span>
          </span>
          <span className="flex items-center gap-1.5">
            <Eye className="size-3.5" />
            <span className="tabular-nums">1204</span>
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-muted-foreground">
            <Globe className="size-3" />
            Public
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-muted-foreground">
            <span className="size-1.5 rounded-full bg-success" />
            Accepting uploads
          </span>
        </div>
      </div>

      {/* The command strip: Share primary, the rest secondary on the panel. */}
      <div className="flex flex-wrap items-center gap-2 rounded-lg bg-muted/40 p-2">
        <Button size="sm">
          <Share2 className="size-4" />
          Share
        </Button>
        <Button size="sm" variant="secondary">
          <Plus className="size-4" />
          Add photos
        </Button>
        <Button size="sm" variant="outline">
          <QrCode className="size-4" />
          The code
        </Button>
        <Button size="sm" variant="ghost">
          <Download className="size-4" />
          Download all
        </Button>
      </div>

      <FeedSection heading="Review">
        <Card size="sm">
          <CardHeader>
            <CardTitle>Eight photos are waiting for you</CardTitle>
            <CardDescription>
              Approve them and every guest sees them in the album.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              className={cn("grid", desktop ? "grid-cols-6" : "grid-cols-3")}
              style={{ gap: "var(--gap-gallery)" }}
            >
              {[4, 5, 6, 7, 8, 9].slice(0, desktop ? 6 : 3).map((i) => (
                <div
                  key={i}
                  className="relative aspect-square overflow-hidden bg-gallery"
                  style={{ borderRadius: "var(--radius-tile)" }}
                >
                  <Image
                    src={photo(i)}
                    alt=""
                    fill
                    sizes={desktop ? "110px" : "100px"}
                    className="object-cover"
                  />
                  <span className="absolute top-1 right-1 flex size-4 items-center justify-center rounded-full bg-black/45 text-white">
                    <Check className="size-2.5" />
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter className="gap-2">
            <Button size="sm">Approve all</Button>
            <Button size="sm" variant="ghost">
              Review one by one
            </Button>
          </CardFooter>
        </Card>
      </FeedSection>

      <FeedSection heading="Gallery">
        <div
          className={cn("grid", desktop ? "grid-cols-8" : "grid-cols-4")}
          style={{ gap: "var(--gap-gallery)" }}
        >
          {Array.from({ length: desktop ? 16 : 8 }, (_, i) => (
            <div
              key={i}
              className="relative aspect-square overflow-hidden bg-gallery"
              style={{ borderRadius: "var(--radius-tile)" }}
            >
              <Image
                src={photo(i)}
                alt=""
                fill
                sizes={desktop ? "90px" : "80px"}
                className="object-cover"
              />
            </div>
          ))}
        </div>
      </FeedSection>
    </div>
  );
}

/* ── The dashboard ──────────────────────────────────────────────────────── */

const EVENTS = [
  {
    name: "Mia and Theo",
    cover: photo(0),
    date: "Sat 14 Jun",
    items: "312 items",
    status: "Open",
    pending: 8,
  },
  {
    name: "Ollie turns 30",
    cover: photo(1),
    date: "Fri 2 May",
    items: "97 items",
    status: "Open",
    pending: 0,
  },
  {
    name: "Studio launch",
    cover: null,
    date: "Thu 9 Apr",
    items: "0 items",
    status: "Closed",
    pending: 0,
  },
];

export function AppDashboard({ mode }: { mode: Mode }) {
  const desktop = mode === "desktop";
  return (
    <div
      className={cn(
        "flex h-full flex-col overflow-hidden",
        desktop ? "gap-6 px-10 py-8" : "gap-4 px-4 py-6",
      )}
    >
      <div className="flex items-center justify-between gap-4">
        <PageHeading className={desktop ? undefined : "text-xl"}>
          Your events
        </PageHeading>
        <div className="flex items-center gap-2">
          <span className="relative inline-flex items-center">
            <Bell className="size-5" />
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-semibold text-brand-foreground tabular-nums">
              3
            </span>
          </span>
          <Button size="sm">New event</Button>
        </div>
      </div>

      {/* The storage row, copied from dashboard/storage-meter.tsx's trigger so
          the muted track and the foreground/70 fill are the real ones (the real
          component is a Popover trigger, and radix portals out of the stage). */}
      <div className="flex w-full items-center gap-3 rounded-lg px-1.5 py-1">
        <span className="shrink-0 text-xs font-medium text-muted-foreground">
          Storage
        </span>
        <span className="h-1 flex-1 overflow-hidden rounded-full bg-muted">
          <span
            className="block h-full rounded-full bg-foreground/70"
            style={{ width: "38%" }}
          />
        </span>
        <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
          3.8 GB / 10 GB
        </span>
      </div>

      {/* The real chip bar, controlled and inert: the active chip is the
          foreground swap and the rest are hairline on the ground, which is one
          of the places the light ramp has nothing between border and text. */}
      <FilterChips active="all" onChange={() => {}} trashCount={2} />

      <FeedSection heading="Hosting">
        <ul
          className={cn("grid gap-4", desktop ? "grid-cols-3" : "grid-cols-1")}
        >
          {(desktop ? EVENTS : EVENTS.slice(0, 2)).map((e) => (
            <li key={e.name}>
              <EventCard
                href={null}
                name={e.name}
                coverUrl={e.cover}
                dateLabel={e.date}
                itemsLabel={e.items}
                statusLabel={e.status}
                pendingCount={e.pending}
                qrSlot={
                  <span className="flex items-center justify-center rounded-[var(--radius-tile)] bg-white p-1.5 text-black shadow-[0_4px_12px_rgba(0,0,0,0.3)]">
                    <QrCode className="size-5" aria-hidden />
                  </span>
                }
              />
            </li>
          ))}
        </ul>
      </FeedSection>

      <FeedSection heading="Needs you">
        <Card size="sm">
          <CardHeader>
            <CardTitle>Eight photos are waiting for review</CardTitle>
            <CardDescription>
              Approve them and they appear in the album for every guest.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm">
              <p className="font-medium">Moderation is on</p>
              <p className="text-muted-foreground">
                The panel inside a card, which is the surface with the least
                room to work in either mode.
              </p>
            </div>
          </CardContent>
          <CardFooter className="gap-2">
            <Button size="sm">Review</Button>
            <Button size="sm" variant="ghost">
              Later
            </Button>
          </CardFooter>
        </Card>
      </FeedSection>
    </div>
  );
}

/* ── The guest album, on the canvas ─────────────────────────────────────── */

/** The masonry's natural ratios, hand-set because every stand-in in the kit is
 *  landscape and a column flow with one ratio is not the grid that ships. The
 *  real kit (the asset ask) brings the mix back. */
const TILE_RATIOS = [
  "3 / 4",
  "4 / 3",
  "1 / 1",
  "3 / 4",
  "4 / 3",
  "2 / 3",
  "4 / 3",
  "1 / 1",
  "3 / 4",
  "4 / 3",
  "3 / 4",
  "1 / 1",
];

/**
 * The guest album: the surface every guest sees and the one the canvas token is
 * for. CSS columns at natural ratios, 3px gaps and 3px tile radius (the
 * ratified masonry, guest-masonry.tsx), the header chrome over it, one tile
 * still uploading and one well with nothing in it yet.
 *
 * The real GuestMasonry needs presigned items, the like provider and a lightbox
 * that portals out of the stage, so the grid is rebuilt here from the same
 * tokens rather than imported. What is being judged is the ground under it.
 */
export function GuestAlbum({ mode }: { mode: Mode }) {
  const desktop = mode === "desktop";
  return (
    <div className="flex h-full flex-col">
      <header
        className={cn(
          "flex items-center justify-between gap-3 border-b border-border",
          desktop ? "px-10 py-4" : "px-4 py-3",
        )}
      >
        <div className="flex items-center gap-2.5">
          <Logo markOnly />
          <div>
            <p className="text-sm font-medium">Mia and Theo</p>
            <p className="text-xs text-muted-foreground">
              312 photos from 41 guests
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline">
            <Heart className="size-4" />
            {desktop ? "Saved" : null}
          </Button>
          <Button size="sm">
            <Plus className="size-4" />
            Add yours
          </Button>
        </div>
      </header>

      <div className={cn("flex-1 overflow-hidden", desktop ? "p-3" : "p-2")}>
        <div
          style={{
            columnCount: desktop ? 5 : 2,
            columnGap: "var(--gap-gallery)",
          }}
        >
          {/* break-inside-avoid is load-bearing here and NOT in production's
              masonry: the shipped tile's height comes from an in-flow image,
              while a stand-in tile is an aspect-ratio box with a FILL image in
              it, and a column will happily split one of those across two
              columns. It did: half this album rendered as black fragments. */}
          {TILE_RATIOS.slice(0, desktop ? 12 : 8).map((ratio, i) => (
            <div
              key={i}
              className="relative mb-[var(--gap-gallery)] block w-full break-inside-avoid overflow-hidden bg-gallery"
              style={{ aspectRatio: ratio, borderRadius: "var(--radius-tile)" }}
            >
              {i === 3 ? (
                // The well with nothing in it yet: a tile before its image
                // decodes is --gallery and nothing else, which is the canvas
                // token's real job.
                <span className="absolute inset-0 flex items-center justify-center text-gallery-muted">
                  <Images className="size-5" />
                </span>
              ) : (
                // IN-FLOW, not `fill`. An absolutely positioned child inside a
                // CSS-column item is positioned against the first column
                // fragment in Chrome, so every tile past column two painted its
                // photograph on top of column one and read as black. The shipped
                // masonry never hits this because its image is in flow too.
                <Image
                  src={photo(i)}
                  alt=""
                  width={marketingImage(PHOTOS[i % PHOTOS.length]).width}
                  height={marketingImage(PHOTOS[i % PHOTOS.length]).height}
                  sizes={desktop ? "260px" : "180px"}
                  className="h-full w-full object-cover"
                />
              )}
              {i === 0 ? (
                <span className="absolute inset-x-0 bottom-0 h-1 bg-black/40">
                  <span className="block h-full w-2/3 bg-white/90" />
                </span>
              ) : null}
              {i === 1 ? (
                <span className="absolute top-1.5 right-1.5 flex size-5 items-center justify-center rounded-full bg-black/45 text-white">
                  <Heart className="size-3" />
                </span>
              ) : null}
            </div>
          ))}
        </div>
      </div>

      {/* The sticky upload bar, on the page ground over the canvas tiles. */}
      <div
        className={cn(
          "flex items-center justify-between gap-3 border-t border-border bg-card text-card-foreground",
          desktop ? "px-10 py-3" : "px-4 py-3",
        )}
      >
        <p className="text-xs text-muted-foreground">
          Two uploads finishing. Nothing to install, nothing to sign up for.
        </p>
        <Badge variant="secondary">2 uploading</Badge>
      </div>
    </div>
  );
}

/* ── Depth with the ramp ────────────────────────────────────────────────── */

/**
 * The light exploration's proposal (docs/specs/light.md) rendered ON each
 * candidate, because the ramp and the depth cue fail together: a shadow has to
 * be darker than what it falls on, so the same alpha reads differently on a
 * 0.105 room and a 0.185 leaf, and a card that is only 0.007 above the page
 * needs an edge that a card a real step above it does not.
 *
 * lift  two objects of the same lightness overlapping (two photographs).
 * float a layer over content that keeps living behind it (a menu).
 * ring   the fourth technique, RING_USES.faint uses in the app and in no
 *        document. Round three re-counted it: the number was 77 and is 37.
 * flat   neither, which is most of the product.
 *
 * The cue values are the light board's, in board.css under this board's prefix;
 * they are NOT part of this board's paste (depth is that track's lane).
 */
export function DepthRow({ mode }: { mode: Mode }) {
  const desktop = mode === "desktop";
  return (
    <div
      data-pal-cues
      className={cn(
        "flex h-full flex-col",
        desktop ? "gap-6 px-16 py-10" : "gap-5 px-5 py-8",
      )}
    >
      <div
        className={cn("grid gap-6", desktop ? "grid-cols-2" : "grid-cols-1")}
      >
        {/* lift: two photographs on top of each other. */}
        <div className="space-y-2">
          <div className="relative h-44">
            <div
              data-pal-cue="lift"
              className="absolute top-0 left-0 h-32 w-48 overflow-hidden rounded-lg"
            >
              <Image
                src={photo(0)}
                alt=""
                fill
                sizes="200px"
                className="object-cover"
              />
            </div>
            <div
              data-pal-cue="lift"
              className="absolute top-8 left-24 h-32 w-48 overflow-hidden rounded-lg"
            >
              <Image
                src={photo(2)}
                alt=""
                fill
                sizes="200px"
                className="object-cover"
              />
            </div>
          </div>
          <p className="text-xs font-medium">Lift, on two photographs</p>
          <p className="text-[11px] text-muted-foreground">
            Same lightness, overlapping. The only cue that can separate them is
            a shadow, which the elevation contract forbids in dark today.
          </p>
        </div>

        {/* float: a menu over a card. */}
        <div className="space-y-2">
          <div className="relative h-44">
            <Card size="sm" className="absolute inset-x-0 top-0">
              <CardHeader>
                <CardTitle>Event settings</CardTitle>
                <CardDescription>
                  Who can upload, and what happens to it.
                </CardDescription>
              </CardHeader>
            </Card>
            {/* dropdown-menu.tsx's skin, hand-placed (radix portals out). */}
            <div
              data-pal-cue="float"
              className="absolute top-14 right-2 w-52 rounded-float bg-popover p-1 text-popover-foreground ring-1 ring-foreground/10"
            >
              {["Share the album", "Download everything", "Close uploads"].map(
                (item, i) => (
                  <div
                    key={item}
                    className={cn(
                      "flex items-center gap-1.5 rounded-md px-1.5 py-1 text-sm",
                      i === 1 && "bg-accent text-accent-foreground",
                    )}
                  >
                    {i === 1 ? <Check className="size-4" /> : null}
                    {item}
                  </div>
                ),
              )}
            </div>
          </div>
          <p className="text-xs font-medium">Float, on a menu over a card</p>
          <p className="text-[11px] text-muted-foreground">
            Content keeps living behind it. Today the menu is 0.02 above the
            card it covers and the shadow is zeroed.
          </p>
        </div>
      </div>

      <div
        className={cn("grid gap-6", desktop ? "grid-cols-2" : "grid-cols-1")}
      >
        <div className="space-y-2">
          <div className="rounded-xl border border-border bg-card p-4 text-card-foreground ring-1 ring-foreground/5">
            <p className="text-sm font-medium">Ring, no shadow</p>
            <p className="mt-1 text-xs text-muted-foreground">
              An edge without a height. The step under it has to do the rest,
              which is the whole light ramp argument in one card.
            </p>
          </div>
          <p className="text-[11px] text-muted-foreground">
            {`ring-1 ring-foreground/5, ${RING_USES.faint} uses and in no document`}
          </p>
        </div>
        <div className="space-y-2">
          <div className="rounded-xl border border-border bg-card p-4 text-card-foreground">
            <p className="text-sm font-medium">Flat, neither</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Nothing behind it and nothing over it. Most of the product is this
              card, and it is the one the ramp has to carry alone.
            </p>
          </div>
          <p className="text-[11px] text-muted-foreground">
            the step and the hairline, nothing else
          </p>
        </div>
      </div>
    </div>
  );
}

/* ── The card over a photograph ─────────────────────────────────────────── */

/**
 * The one translucent surface in the system, on the only specimen where the
 * question is a look: a card lying over a photograph. Today's `.dark --card` is
 * `oklch(0.21 0 0 / 0.62)`; every candidate quietly retires it, which round
 * one's departure list got backwards. Here both answers are rendered at the
 * candidate's own lightness, so the ruling is a look and not a footnote.
 */
export function PhotoCards({ mode }: { mode: Mode }) {
  const desktop = mode === "desktop";
  return (
    <div className="relative h-full w-full overflow-hidden">
      <Image
        src={photo(5)}
        alt=""
        fill
        sizes={desktop ? "1440px" : "375px"}
        className="object-cover"
        priority={false}
      />
      <div
        className={cn(
          "relative flex h-full w-full items-center",
          desktop
            ? "justify-center gap-8 px-16"
            : "flex-col justify-center gap-5 px-6",
        )}
      >
        <Card className={desktop ? "w-80" : "w-full"}>
          <CardHeader>
            <CardTitle>The card as the ramp declares it</CardTitle>
            <CardDescription>
              Whatever the selected candidate writes for --card in dark.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-brand" />
              Ninety-one guests uploaded before the cake.
            </div>
          </CardContent>
        </Card>
        <div
          className={cn(
            "rounded-xl border border-border p-6 text-card-foreground",
            desktop ? "w-80" : "w-full",
          )}
          style={{
            background: "oklch(0.21 0 0 / 0.62)",
            backdropFilter: "none",
          }}
        >
          <p className="font-semibold">Today, at 62 percent</p>
          <p className="mt-1.5 text-sm text-muted-foreground">
            The system has exactly one translucent surface and no document says
            so. Over a photograph it is the difference between a card and a pane
            of glass.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ── The text steps, in real copy ───────────────────────────────────────── */

/**
 * Every text step with real product copy at it, on the three grounds a line of
 * type actually lands on: the page, a card, and the panel. The hole in the
 * light ramp is only a hole once you try to write the third line.
 *
 * `faint` is ask 6, and it is the reason the third step paints from a `var()`
 * with a fallback rather than from a value. A ruling of "out" deletes --faint
 * from the ramp itself (`withoutFaint` in ramps.ts), so the fallback takes
 * over and the third line becomes what ships today: 70 percent of the second
 * step, composited against whatever ground it happens to sit on. That is why
 * this specimen renders all three grounds side by side. One token is one grey
 * on all three; an alpha is three different greys, and the caption under the
 * row says which of the two you are looking at.
 */
export function TextSteps({ mode, faint }: { mode: Mode; faint: boolean }) {
  const desktop = mode === "desktop";
  const stack = (where: string) => (
    <div className="space-y-2">
      <p className="text-[11px] font-medium tracking-[0.12em] text-muted-foreground uppercase">
        {where}
      </p>
      {TEXT_STEPS.map((s) => {
        const isFaint = s.token === "--faint";
        return (
          <div key={s.token}>
            <p
              className={cn(desktop ? "text-base" : "text-sm")}
              style={
                s.token === "--foreground"
                  ? undefined
                  : s.token === "--muted-foreground"
                    ? { color: "var(--muted-foreground)" }
                    : {
                        color:
                          "var(--faint, color-mix(in oklab, var(--muted-foreground) 70%, transparent))",
                      }
              }
            >
              {s.copy}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {isFaint && !faint ? "text-muted-foreground/70" : s.token}{" "}
              <span>
                {isFaint
                  ? faint
                    ? "one token, the same grey on all three grounds"
                    : s.today
                  : s.today}
              </span>
            </p>
          </div>
        );
      })}
    </div>
  );
  return (
    <div
      className={cn(
        "flex h-full flex-col",
        desktop ? "gap-6 px-16 py-10" : "gap-5 px-5 py-8",
      )}
    >
      <div
        className={cn("grid gap-6", desktop ? "grid-cols-3" : "grid-cols-1")}
      >
        <div className="rounded-xl p-4">{stack("on the page")}</div>
        <div className="rounded-xl border border-border bg-card p-4 text-card-foreground">
          {stack("on a card")}
        </div>
        <div className="rounded-xl border border-border bg-muted p-4">
          {stack("on the panel")}
        </div>
      </div>
      <div className="space-y-2">
        <p className="text-[11px] text-muted-foreground">
          The state hues, at the size they ship at, on this ramp.
        </p>
        <StateRow />
      </div>
    </div>
  );
}
