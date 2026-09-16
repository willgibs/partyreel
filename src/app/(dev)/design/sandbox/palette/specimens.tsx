"use client";

import Image from "next/image";
import {
  Bell,
  Check,
  Download,
  Eye,
  Globe,
  Images,
  Plus,
  QrCode,
  Share2,
  Sparkles,
  Users,
} from "lucide-react";

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
import { PageHeading } from "@/components/shared/page-heading";
import { marketingImage } from "@/lib/constants/marketing-media";
import { cn } from "@/lib/utils";
import type { Mode } from "@/components/lab";

import { TEXT_STEPS } from "./registers";

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

/* ── One card over a photograph ─────────────────────────────────────────── */

/**
 * THE ONE SEE-THROUGH SURFACE, ON ONE CARD (round eight, 2026-09-16).
 *
 * ★ ROUND SEVEN DREW BOTH ANSWERS AT ONCE, side by side, because the board
 * could only hold one state: the palette's own card beside a hard-coded
 * `oklch(0.21 0 0 / 0.62)`. The stepped review draws every option as a tile, so
 * the specimen is now ONE card and the comparison is between the tiles. The
 * hard-coded second card is gone with it, which also means nothing here can
 * disagree with the paste any more: what this paints is `--card` as
 * `resolvePair` resolved it.
 *
 * `value` is that resolved string, printed under the card, and it is doing real
 * work: for a cool palette "solid as declared" and "solid, ruled" ARE the same
 * pixels (the palette's own value is already opaque), so two of the three tiles
 * match and the value is what says why. On Today they differ: its own `--card`
 * IS the 62 percent, so "declared" and "see-through" are the pair that match.
 */
export function PhotoCard({ value }: { value: string }) {
  return (
    <div className="relative isolate overflow-hidden rounded-xl">
      <Image
        src={photo(5)}
        alt=""
        width={800}
        height={520}
        sizes="720px"
        className="absolute inset-0 -z-10 size-full object-cover"
      />
      <div className="flex flex-col gap-3 p-6">
        <Card>
          <CardHeader>
            <CardTitle>Eight photos are waiting for review</CardTitle>
            <CardDescription>
              Approve them and they appear in the album for every guest.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center gap-2 text-sm text-muted-foreground">
            <Sparkles className="size-4 text-brand" />
            Ninety-one guests uploaded before the cake.
          </CardContent>
          <CardFooter className="gap-2">
            <Button size="sm">Review</Button>
            <Button size="sm" variant="ghost">
              Later
            </Button>
          </CardFooter>
        </Card>
        {/* On the photograph rather than under it: the caption has to sit in
            the same frame as the card, or a tile grid clips it away. And it is
            what makes two identical tiles read as an answer rather than a bug. */}
        <p className="self-start rounded-md bg-black/55 px-2 py-1 text-[11px] text-white">
          --card is {value}
        </p>
      </div>
    </div>
  );
}

/* ── The third text step ────────────────────────────────────────────────── */

/**
 * THE SAME THREE LINES ON THE THREE GROUNDS TYPE LANDS ON: the page, a card,
 * and the panel inside the card. One block, because the whole argument for a
 * third token is a comparison ACROSS grounds: one colour is one grey on all
 * three, and an alpha is three different greys.
 *
 * `faint` is not a renderer flag, it is a set edit (registers.ts `dropFaint`):
 * "out" deletes `--faint` from the pair, so the `var()` below falls back to the
 * alpha the 37 sites composite by hand and the difference paints itself. Do NOT
 * hard-code one answer here.
 *
 * ★ THE BANDS STACK RATHER THAN SITTING IN THREE COLUMNS (round eight). Three
 * columns need about 700 pixels to hold this copy, and a tile is three hundred
 * wide; stacked, the three grounds are also directly above one another, which
 * is the comparison being made.
 */
export function TextBlock({ faint }: { faint: boolean }) {
  const band = (where: string, className: string) => (
    <div key={where} className={cn("space-y-1 p-4", className)}>
      <p className="text-[10px] font-medium tracking-[0.12em] text-muted-foreground uppercase">
        {where}
      </p>
      {TEXT_STEPS.map((s) => (
        <p
          key={s.token}
          className="text-sm"
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
      ))}
    </div>
  );
  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-xl border border-border">
        {band("on the page", "bg-background")}
        {band(
          "on a card",
          "border-t border-border bg-card text-card-foreground",
        )}
        {band("on the panel", "border-t border-border bg-muted")}
      </div>
      <p className="text-[11px] text-muted-foreground">
        The third line is{" "}
        {faint
          ? "one token, so it is the same grey on all three."
          : "70 percent of the second, composited against whatever is behind it."}
      </p>
    </div>
  );
}
