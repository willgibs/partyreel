"use client";

import Image from "next/image";
import {
  Aperture,
  Calendar,
  Check,
  Images,
  QrCode,
  Sparkles,
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
import { Logo } from "@/components/shared/logo";
import { PageHeading } from "@/components/shared/page-heading";
import { marketingImage } from "@/lib/constants/marketing-media";
import { cn } from "@/lib/utils";
import type { Mode } from "@/components/dev/board";

/**
 * THE REAL SECTIONS the ramps are judged on. A palette board that shows
 * swatches proves nothing: a ramp is right or wrong at the moment a card sits
 * on a ground with a photograph beside it, so every specimen here is built from
 * the production components (Card, Button, Badge, EventCard, FeedSection,
 * Logo) and the licensed marketing images.
 *
 * ★ Breakpoints do NOT work inside a Stage: the stage is a 1440 or 375 wide box
 * inside a wide viewport, so `sm:` fires at 375. Every section takes `mode` and
 * branches on it, which is the house pattern (home-hero/gathering.tsx:247).
 * `sizes` on next/image is canvas-relative for the same reason (the stage is
 * zoom-fitted, so `vw` lies).
 */

const IMAGES = [
  "wedding-golden",
  "party-balloons",
  "concert-confetti",
  "reception-table",
] as const;

/* ── A marketing chapter with cards ─────────────────────────────────────── */

export function MarketingChapter({ mode }: { mode: Mode }) {
  const desktop = mode === "desktop";
  const cover = marketingImage(IMAGES[0]);
  return (
    <div
      className={cn(
        "flex h-full flex-col justify-center",
        desktop ? "gap-10 px-20 py-16" : "gap-6 px-5 py-10",
      )}
    >
      <header className={cn("flex flex-col", desktop ? "gap-4" : "gap-3")}>
        <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
          Every guest, one album
        </p>
        <h2
          className={cn(
            "font-heading text-balance",
            desktop ? "max-w-2xl text-5xl" : "text-3xl",
          )}
        >
          The photos everyone took, in one place by the time you get home.
        </h2>
        <p
          className={cn(
            "text-muted-foreground",
            desktop ? "max-w-xl text-lg" : "text-sm",
          )}
        >
          Guests scan the code, upload from the camera roll, and the album fills
          itself. No app, no account, nothing to chase the next morning.
        </p>
      </header>

      <div
        className={cn("grid gap-4", desktop ? "grid-cols-3" : "grid-cols-1")}
      >
        <Card className="overflow-hidden py-0">
          <div className="relative aspect-[16/10]">
            <Image
              src={cover.src}
              alt=""
              fill
              sizes={desktop ? "380px" : "340px"}
              className="object-cover"
            />
          </div>
          <CardHeader className="pt-4">
            <CardTitle>With the pictures in</CardTitle>
            <CardDescription>
              The media carries the colour, and the chrome gets out of the way.
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-4">
            <Badge variant="secondary">142 photos</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>With no pictures at all</CardTitle>
            <CardDescription>
              The case rule 1 was rewritten for: a section with no photograph is
              still meant to be beautiful, never bare.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-brand" />
              The accent and the panel are all the colour this one gets.
            </div>
          </CardContent>
          <CardFooter className="text-xs text-muted-foreground">
            The card foot is the panel at half strength.
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>The quiet one</CardTitle>
            <CardDescription>
              Body text sits on the second step, the hint on the third, and the
              hairline holds the edge.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>Ninety-one guests uploaded before the cake.</p>
            <p className="text-muted-foreground">
              Second text, the step everything reaches for.
            </p>
            <p style={{ color: "var(--faint, var(--muted-foreground))" }}>
              Faint text, today an alpha of the step above.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button size={desktop ? "lg" : "default"}>Create an event</Button>
        <Button variant="outline" size={desktop ? "lg" : "default"}>
          See a live album
        </Button>
        <Button variant="secondary" size={desktop ? "lg" : "default"}>
          Pricing
        </Button>
        <Button variant="ghost" size={desktop ? "lg" : "default"}>
          How it works
        </Button>
      </div>
    </div>
  );
}

/* ── The app's dashboard ────────────────────────────────────────────────── */

const EVENTS = [
  {
    name: "Mia and Theo",
    cover: marketingImage(IMAGES[0]).src,
    date: "Sat 14 Jun",
    items: "312 items",
    status: "Open",
    pending: 8,
  },
  {
    name: "Ollie turns 30",
    cover: marketingImage(IMAGES[1]).src,
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
          <Button variant="outline" size="sm">
            <QrCode className="size-4" />
            {desktop ? "Share a code" : null}
          </Button>
          <Button size="sm">New event</Button>
        </div>
      </div>

      {/* The storage row, copied from dashboard/storage-meter.tsx's trigger so
          the muted track and the foreground/70 fill are the real ones. */}
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

      <div className="flex flex-wrap items-center gap-1.5">
        {["All", "Events", "Uploads", "Likes", "Deleted"].map((chip, i) => (
          <span
            key={chip}
            className={cn(
              "flex h-8 items-center rounded-full px-3.5 text-sm font-medium",
              i === 0
                ? "bg-foreground text-background"
                : "border border-border text-muted-foreground",
            )}
          >
            {chip}
          </span>
        ))}
      </div>

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

      {desktop ? (
        <FeedSection heading="Needs you">
          <Card size="sm">
            <CardHeader>
              <CardTitle>Eight photos are waiting for review</CardTitle>
              <CardDescription>
                Approve them and they appear in the album for every guest.
              </CardDescription>
            </CardHeader>
            <CardFooter className="gap-2">
              <Button size="sm">Review</Button>
              <Button size="sm" variant="ghost">
                Later
              </Button>
            </CardFooter>
          </Card>
        </FeedSection>
      ) : null}
    </div>
  );
}

/* ── The stack: ground, card, panel, input, menu ────────────────────────── */

/**
 * The surface ladder in one frame, which is where today's dark ramp fails: the
 * ground, a card on it, a panel inside the card, an input, and a menu over the
 * lot. The menu is hand-placed rather than a real DropdownMenu ON PURPOSE:
 * radix portals to document.body, which would escape the stage's zoom AND its
 * token overrides. The skin is copied verbatim from dropdown-menu.tsx.
 */
export function SurfaceStack({ mode }: { mode: Mode }) {
  const desktop = mode === "desktop";
  return (
    <div
      className={cn(
        "relative flex h-full flex-col justify-center",
        desktop ? "px-20 py-12" : "px-5 py-8",
      )}
    >
      <p className="mb-4 text-xs text-muted-foreground">
        Ground, card, panel, input, menu. Five surfaces, one frame.
      </p>
      <Card className={desktop ? "max-w-xl" : undefined}>
        <CardHeader>
          <CardTitle>Event settings</CardTitle>
          <CardDescription>
            Who can upload, and what happens to it when they do.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm">
            <p className="font-medium">Guests need an email</p>
            <p className="text-muted-foreground">
              The panel, today at 40 percent of a token that also does hover.
            </p>
          </div>
          <div className="flex h-9 items-center rounded-lg border border-input px-3 text-sm text-muted-foreground">
            partyreel.com/e/your-event
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="secondary">
              Copy link
            </Button>
            <Button size="sm" variant="outline">
              Download the code
            </Button>
          </div>
        </CardContent>
        <CardFooter className="justify-between text-xs text-muted-foreground">
          <span>Last change 4 minutes ago</span>
          <span className="tabular-nums">312 items</span>
        </CardFooter>
      </Card>

      <div
        className={cn(
          "absolute w-56 rounded-float bg-popover p-1 text-popover-foreground shadow-float ring-1 ring-foreground/10",
          desktop ? "top-24 right-24" : "top-20 right-5",
        )}
      >
        {["Share the album", "Download everything", "Close uploads"].map(
          (item, i) => (
            <div
              key={item}
              className={cn(
                "relative flex cursor-default items-center gap-1.5 rounded-md px-1.5 py-1 text-sm",
                i === 1 && "bg-accent text-accent-foreground",
              )}
            >
              {i === 1 ? <Check className="size-4" /> : null}
              {item}
            </div>
          ),
        )}
        <div className="my-1 h-px bg-border" />
        <div className="relative flex cursor-default items-center gap-1.5 rounded-md px-1.5 py-1 text-sm text-destructive">
          Delete the event
        </div>
      </div>
    </div>
  );
}

/* ── The panel, on its real sites ───────────────────────────────────────── */

/**
 * The set-apart block from bible 16, on the sites it ships on (the help facts
 * band, the contact panel, a careers block). `single` swaps every alpha for one
 * token at full strength, which is the ask.
 */
export function PanelBand({ mode, single }: { mode: Mode; single: boolean }) {
  const desktop = mode === "desktop";
  const panel = single ? "bg-muted" : "bg-muted/40";
  const panelSoft = single ? "bg-muted" : "bg-muted/30";
  const panelStrong = single ? "bg-muted" : "bg-muted/50";
  return (
    <div className="flex h-full flex-col">
      <div className={cn(desktop ? "px-20 pt-12 pb-8" : "px-5 pt-8 pb-6")}>
        <h2 className={cn("font-heading", desktop ? "text-4xl" : "text-2xl")}>
          Everything a host asks in the first hour.
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Body copy on the page, so the panel below has something to be set
          apart from.
        </p>
      </div>

      <div className={cn("border-y border-border", panel)}>
        <div
          className={cn(
            "grid",
            desktop ? "grid-cols-3 gap-8 px-20 py-10" : "gap-5 px-5 py-8",
          )}
        >
          {[
            ["No app", "Guests scan and upload from the browser they have."],
            ["No account", "An email only when the host asks for one."],
            ["Full quality", "Originals, not the version chat apps send."],
          ].map(([title, body]) => (
            <div key={title}>
              <p className="font-medium">{title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
      </div>

      <div
        className={cn(
          "grid flex-1",
          desktop ? "grid-cols-2 gap-6 px-20 py-10" : "gap-4 px-5 py-8",
        )}
      >
        <div
          className={cn(
            "rounded-2xl border border-border p-6 ring-1 ring-foreground/5",
            panelStrong,
          )}
        >
          <p className="font-medium">Ask us anything</p>
          <p className="mt-1 text-sm text-muted-foreground">
            The contact panel, today at 50 percent.
          </p>
          <div className="mt-4 flex h-9 items-center rounded-lg border border-input bg-background px-3 text-sm text-muted-foreground">
            you@example.com
          </div>
        </div>
        <div className={cn("rounded-2xl border border-border p-6", panelSoft)}>
          <p className="font-medium">Still stuck?</p>
          <p className="mt-1 text-sm text-muted-foreground">
            The help closer, today at 30 percent. Three alphas, one intention.
          </p>
          <Button size="sm" className="mt-4">
            Talk to us
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ── The ink leaf ───────────────────────────────────────────────────────── */

/**
 * `.surface-ink` as it ships: no --card, --popover, --secondary, --accent or
 * --input, so a Card or a menu placed on the footer's slab renders with the
 * PAPER values it inherits from the page around it. Every candidate completes
 * the set; today's block is left incomplete on purpose so the gap is visible.
 */
export function InkLeaf({ mode }: { mode: Mode }) {
  const desktop = mode === "desktop";
  return (
    <div
      className={cn(
        "flex h-full flex-col justify-between",
        desktop ? "gap-8 px-20 py-12" : "gap-6 px-5 py-8",
      )}
    >
      <div className="flex items-start justify-between gap-6">
        <div className="space-y-3">
          <Logo />
          <p
            className={cn(
              "font-heading text-balance",
              desktop ? "max-w-md text-3xl" : "text-xl",
            )}
          >
            The album everyone was already making.
          </p>
        </div>
        <Button variant="outline" size={desktop ? "default" : "sm"}>
          Explore a demo event
        </Button>
      </div>

      <div
        className={cn("grid gap-6", desktop ? "grid-cols-4" : "grid-cols-2")}
      >
        {[
          ["Product", ["How it works", "Pricing", "The reel"]],
          ["Hosts", ["Weddings", "Birthdays", "Corporate"]],
          ["Company", ["About", "Careers", "Blog"]],
          ["Legal", ["Privacy", "Terms", "Contact"]],
        ].map(([heading, links]) => (
          <div key={heading as string}>
            <p className="text-xs font-medium tracking-[0.12em] uppercase">
              {heading as string}
            </p>
            <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
              {(links as string[]).map((l) => (
                <li key={l}>{l}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <Card size="sm" className={desktop ? "w-72" : "w-full"}>
          <CardHeader>
            <CardTitle>A card on the ink leaf</CardTitle>
            <CardDescription>
              Today this is near white, because `.surface-ink` has no --card.
            </CardDescription>
          </CardHeader>
        </Card>
        <div className="w-52 rounded-float bg-popover p-1 text-popover-foreground shadow-float ring-1 ring-foreground/10">
          {["A menu on ink", "Also near white"].map((item, i) => (
            <div
              key={item}
              className={cn(
                "rounded-md px-1.5 py-1 text-sm",
                i === 0 && "bg-accent text-accent-foreground",
              )}
            >
              {item}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Aperture className="size-4 text-brand" />
          <span className="tabular-nums">2026</span>
          <Calendar className="size-3.5" />
          <Images className="size-3.5" />
        </div>
      </div>
    </div>
  );
}
