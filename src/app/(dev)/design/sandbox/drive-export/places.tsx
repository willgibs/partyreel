"use client";

import type { ReactNode } from "react";
import {
  CalendarPlus,
  Check,
  ChevronDown,
  ExternalLink,
  FolderUp,
  LayoutGrid,
  Rows3,
} from "lucide-react";

import { StorageChart } from "@/components/app/storage/storage-chart";
import {
  StorageSourceProvider,
  type StorageSource,
} from "@/components/app/storage/storage-source";
import { PageHeading } from "@/components/shared/page-heading";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Popup,
  PopupBody,
  PopupContent,
  PopupFooter,
  PopupHeader,
} from "@/components/ui/popup";
import { readStorage } from "@/components/app/storage/storage-figures";
import { formatBytesUp } from "@/lib/billing/storage-guard";
import { formatCapacity } from "@/lib/constants/tiers";
import { GLASS_MARK } from "@/lib/glass";
import { formatCount } from "@/lib/format/count";
import { cn, formatBytes } from "@/lib/utils";

import { AppBar, DriveName, Ground, Light, Page } from "./chrome";
import {
  ALBUMS,
  coverOf,
  EVENT,
  HOST,
  PICKED_ALBUMS,
  photoAt,
  STORAGE,
  TOTAL_BYTES,
  TOTAL_COUNT,
} from "./fixtures";

/**
 * THE PLACES BEYOND ONE ALBUM, QUOTED FROM PRODUCTION: the dashboard's head
 * (`home-head.tsx`: the day, the line, the storage ring, New event) and Your
 * events (`events-section.tsx`: the title, the lens, the view toggle, the
 * tiles as `event-tile.tsx` draws them, a corner mark on the product's glass);
 * What's using space (the real `Popup` in its `list` kind, its rows as
 * `size-row.tsx` draws them); Account's Plan card (`account/page.tsx`); and
 * the storage ring's popover holding the real `StorageChart` over an inert
 * source, as the Library's specimen holds it.
 */

/* ── the dashboard ────────────────────────────────────────────────────── */

const RING_R = 7;
const RING_C = 2 * Math.PI * RING_R;

/** The storage ring (`storage-meter.tsx`), quoted: its arc and its percent. */
function Ring({ pct, warning }: { pct: number; warning: boolean }) {
  return (
    <span
      className={cn(
        "flex h-8 shrink-0 items-center gap-2 rounded-full px-2.5 text-xs tabular-nums",
        warning ? "text-warning" : "text-muted-foreground",
      )}
    >
      <svg viewBox="0 0 18 18" className="size-[18px] -rotate-90" aria-hidden>
        <circle cx="9" cy="9" r={RING_R} fill="none" strokeWidth="2.5" className="stroke-foreground/12" />
        <circle
          cx="9"
          cy="9"
          r={RING_R}
          fill="none"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray={`${(pct / 100) * RING_C} ${RING_C}`}
          className={warning ? "stroke-warning" : "stroke-foreground/70"}
        />
      </svg>
      {`${pct}%`}
    </span>
  );
}

/** What she stores, for the ring: albums and Deleted against the cap. */
export type Stored = { activeBytes: number; deletedBytes: number };

export const STORED_BEFORE: Stored = {
  activeBytes: STORAGE.activeBytes,
  deletedBytes: STORAGE.deletedBytes,
};

/** The ring as production reads it (`readStorage`): its percent, and amber only when what an upload meets nears the cap. */
const ringOf = (s: Stored) =>
  readStorage({ ...s, capBytes: STORAGE.capBytes, makeRoom: true });

/** The inert source the real storage chart answers to (the Library's own shape): nothing it presses writes. */
const INERT: StorageSource = {
  read: async () => ({ ok: true as const, items: [], next: null, overview: null }),
  deleteForGood: async () => ({ ok: true as const, deleted: 0 }),
  emptyDeleted: async () => ({
    ok: true as const,
    items: 0,
    events: 0,
    freedBytes: 0,
    more: false,
  }),
  setMakeRoom: async (on) => ({ ok: true as const, on: on === true }),
  switchPlan: async () => ({
    kind: "error" as const,
    code: "already_on_plan",
    message: "The lab stops here.",
  }),
};

/** The storage ring's popover, open, holding the real chart (the storage visibly freed). */
function RingOpen({ stored }: { stored: Stored }) {
  const reading = ringOf(stored);
  return (
    <StorageSourceProvider source={INERT}>
      <Popover open>
        <PopoverTrigger asChild>
          <button type="button" aria-label="Storage" className="rounded-full">
            <Ring pct={reading.ringPct} warning={reading.warning || reading.over} />
          </button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-80 space-y-3">
          <div data-dx-read="the storage chart">
            <StorageChart
              activeBytes={stored.activeBytes}
              deletedBytes={stored.deletedBytes}
              capBytes={STORAGE.capBytes}
              makeRoom
            />
          </div>
        </PopoverContent>
      </Popover>
    </StorageSourceProvider>
  );
}

/** The dashboard's head (`home-head.tsx`): the day, the line, the ring, New event. */
function HomeHead({ ring, count }: { ring: ReactNode; count: number }) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 sm:gap-x-4">
      <PageHeading className="order-1 min-w-0 flex-auto truncate text-subsection sm:flex-none sm:text-page">
        Sunday, September 13
      </PageHeading>
      <p className="order-3 text-sm text-muted-foreground sm:order-2">
        {`${count} events · ${HOST.plan}`}
      </p>
      <div className="order-4 -ml-2 sm:order-3 sm:ml-auto">{ring}</div>
      <Button className="order-2 sm:order-4">
        <CalendarPlus /> New event
      </Button>
    </div>
  );
}

/** A corner mark on a tile's photograph (`marks.tsx`'s `Mark` on the product's glass), with a state's dot. */
function TileMark({ dot, children }: { dot: string; children: ReactNode }) {
  return (
    <span
      className={cn(
        "flex h-6 items-center gap-1.5 rounded-full pr-2.5 pl-2 text-[11px] leading-none font-medium whitespace-nowrap text-white",
        GLASS_MARK,
      )}
    >
      <span aria-hidden className={cn("inline-block size-1.5 shrink-0 rounded-full", dot)} />
      {children}
    </span>
  );
}

/**
 * YOUR EVENTS (`events-section.tsx`): its title, the lens, its own door when
 * one is drawn, the view toggle, then the tiles. Picking puts a check on every
 * tile and the selection's bar at the foot; `mark` puts a light on the album
 * being sent.
 */
function YourEvents({
  albums,
  door,
  picking,
  mark,
}: {
  albums: readonly (typeof ALBUMS)[number][];
  door: boolean;
  picking: boolean;
  mark?: { label: string; tone: "sending" | "paused" | "done" };
}) {
  return (
    <section aria-label="Your events" className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-3">
          <h2 className="font-heading text-subsection">Your events</h2>
          <span className="flex rounded-full bg-muted p-0.5">
            {["All", "Hosting", "Guest"].map((l, i) => (
              <span
                key={l}
                className={cn(
                  "flex h-7 items-center gap-1.5 rounded-full px-3 text-xs",
                  i === 0
                    ? "bg-background text-foreground shadow-lift"
                    : "text-muted-foreground",
                )}
              >
                {l}
                {i === 0 ? (
                  <span className="text-muted-foreground tabular-nums">{albums.length}</span>
                ) : null}
              </span>
            ))}
          </span>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          {door ? (
            <Button
              variant={picking ? "secondary" : "outline"}
              size="sm"
              data-dx-read="Your events' door"
            >
              <FolderUp /> {picking ? "Pick albums to send" : "Send to Drive"}
            </Button>
          ) : null}
          <span className="flex rounded-md border">
            <span className="flex size-8 items-center justify-center bg-muted">
              <LayoutGrid className="size-4" />
            </span>
            <span className="flex size-8 items-center justify-center text-muted-foreground">
              <Rows3 className="size-4" />
            </span>
          </span>
        </div>
      </div>
      <ul className="grid grid-cols-[repeat(auto-fill,minmax(min(calc(50%_-_6px),240px),1fr))] gap-3">
        {albums.map((a) => {
          const picked = picking && PICKED_ALBUMS.has(a.id);
          return (
            <li
              key={a.id}
              data-dx-read={a.id === "maya-jay" ? "the album's tile" : undefined}
              className="@container/tile relative"
            >
              <div
                className={cn(
                  "relative block aspect-[3/2] overflow-hidden rounded-xl",
                  picked && "ring-3 ring-success ring-offset-2 ring-offset-background",
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- a bootstrap still, the tile's cover */}
                <img src={coverOf(a.cover)} alt="" className="absolute inset-0 size-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-3 text-white">
                  <h3 className="truncate font-heading text-card-title">{a.name}</h3>
                  <p className="mt-0.5 truncate text-xs text-white/75 tabular-nums">
                    {`${a.day ?? "No date"} · ${formatBytes(a.bytes)}`}
                  </p>
                </div>
              </div>
              {picking ? (
                <span
                  aria-hidden
                  className={cn(
                    "absolute top-2 left-2 flex size-6 items-center justify-center rounded-full border-2",
                    picked
                      ? "border-transparent bg-success text-success-foreground"
                      : "border-white/80 bg-black/25",
                  )}
                >
                  {picked ? <Check className="size-3.5" strokeWidth={3} /> : null}
                </span>
              ) : null}
              {mark && a.id === "maya-jay" ? (
                <span className="pointer-events-none absolute top-2 right-2">
                  <TileMark
                    dot={
                      mark.tone === "paused"
                        ? "bg-warning"
                        : mark.tone === "done"
                          ? "bg-success"
                          : "bg-info"
                    }
                  >
                    {mark.label}
                  </TileMark>
                </span>
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** The selection's bar, at the foot: the quick layer's display, what is picked, its act. */
function PickBar() {
  const picked = ALBUMS.filter((a) => PICKED_ALBUMS.has(a.id));
  const bytes = picked.reduce((s, a) => s + a.bytes, 0);
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-40 flex justify-center px-4">
      <div
        data-dx-read="the pick's bar"
        className="surface-display pointer-events-auto flex items-center gap-3 rounded-float bg-popover py-2 pr-2 pl-4 text-popover-foreground shadow-layer ring-1 ring-border"
      >
        <span className="text-sm whitespace-nowrap tabular-nums">
          {`${picked.length} albums · ${formatBytes(bytes)}`}
        </span>
        <Button variant="ghost" size="sm">
          Cancel
        </Button>
        <Button size="sm">
          <FolderUp /> Send to Drive
        </Button>
      </div>
    </div>
  );
}

/**
 * HER DASHBOARD, THE MORNING AFTER: the head with its ring (or the ring's
 * popover open), Your events, and whatever stands over the page.
 */
export function Dashboard({
  door = false,
  picking = false,
  mark,
  stored = STORED_BEFORE,
  ringOpen = false,
  without,
  over,
}: {
  door?: boolean;
  picking?: boolean;
  mark?: { label: string; tone: "sending" | "paused" | "done" };
  stored?: Stored;
  ringOpen?: boolean;
  /** An album gone to Deleted: off Your events and out of the head's count. */
  without?: string;
  over?: ReactNode;
}) {
  const albums = ALBUMS.filter((a) => a.id !== without);
  const reading = ringOf(stored);
  const ring = ringOpen ? (
    <RingOpen stored={stored} />
  ) : (
    <Ring pct={reading.ringPct} warning={reading.warning || reading.over} />
  );
  return (
    <Ground
      over={
        <>
          {picking ? <PickBar /> : null}
          {over}
        </>
      }
    >
      <AppBar />
      <Page>
        <div className="space-y-8">
          <HomeHead ring={ring} count={albums.length} />
          <YourEvents albums={albums} door={door} picking={picking} mark={mark} />
        </div>
      </Page>
    </Ground>
  );
}

/* ── what's using space ───────────────────────────────────────────────── */

const SIZES = [61.4, 48.2, 41.7, 37.9, 22.6, 9.8, 6.1, 5.4];
const WHO = ["Theo", "Sam", "Theo", "Jo", "You", "Priya", "Ade", "Priya"];

/** One row as `size-row.tsx` draws it: the check, the thumbnail, the size, who added it and when. */
function SizeRow({ i }: { i: number }) {
  const clip = i < 5;
  return (
    <li className="relative flex items-center gap-3 rounded-lg px-2 py-2">
      <span className="relative flex size-5 shrink-0 items-center justify-center rounded-full border border-border bg-background" />
      <span className="relative size-11 shrink-0 overflow-hidden rounded-md bg-muted">
        {/* eslint-disable-next-line @next/next/no-img-element -- a bootstrap still, the row's thumbnail */}
        <img src={photoAt(i + 2).src} alt="" className="absolute inset-0 size-full object-cover" />
        {clip ? (
          <span className="absolute right-0.5 bottom-0.5 rounded bg-black/60 px-1 text-micro font-medium text-white tabular-nums">
            {`0:${String(20 + i * 7).padStart(2, "0")}`}
          </span>
        ) : null}
      </span>
      <span className="relative min-w-0 flex-1">
        <span className="flex items-baseline justify-between gap-2">
          <span className="font-medium text-foreground tabular-nums">{`${SIZES[i]} MB`}</span>
          <span className="shrink-0 text-xs text-muted-foreground tabular-nums">Sep 12</span>
        </span>
        <span className="mt-0.5 flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
          <span className="truncate">{EVENT.name}</span>
          <span aria-hidden>·</span>
          <span className="truncate">{WHO[i]}</span>
        </span>
      </span>
    </li>
  );
}

/**
 * WHAT'S USING SPACE, FILTERED TO ONE ALBUM (the real `Popup`, `list` kind: a
 * panel from the right at a desk, its own screen in a hand), with the Drive
 * door at its head when one is drawn: send this album, then free it.
 */
export function WhatsUsingSpace({ door }: { door: boolean }) {
  return (
    <Popup open onOpenChange={() => {}}>
      <PopupContent kind="list">
        <PopupHeader
          title="What’s using space"
          back="Dashboard"
          description="Largest first, across every event. Select what to remove."
        />
        <PopupBody className="flex flex-col gap-3 pt-2">
          <span className="flex items-center gap-2">
            <span className="flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs">
              {`${EVENT.name} · ${formatBytes(TOTAL_BYTES)}`}
              <ChevronDown className="size-3.5 text-muted-foreground" />
            </span>
            <span className="text-xs text-muted-foreground tabular-nums">
              {`${formatCount(TOTAL_COUNT)} items`}
            </span>
          </span>
          {door ? (
            <div
              data-dx-read="the storage door"
              className="flex flex-col gap-2 rounded-float bg-card p-3 ring-1 ring-foreground/10"
            >
              <DriveName className="text-sm font-medium" />
              <span className="text-sm text-pretty text-muted-foreground">
                {`Keep every original of ${EVENT.name} in your own Drive, then free its ${formatBytes(TOTAL_BYTES)} here.`}
              </span>
              <span className="flex flex-wrap gap-1.5">
                <Button size="sm">
                  <FolderUp /> Send to Drive, then free it
                </Button>
              </span>
            </div>
          ) : null}
          <ul className="flex flex-col">
            {SIZES.map((_, i) => (
              <SizeRow key={i} i={i} />
            ))}
          </ul>
        </PopupBody>
      </PopupContent>
    </Popup>
  );
}

/* ── account ──────────────────────────────────────────────────────────── */

export type AccountWay = "card" | "in-plan" | "apps";

/** Account's Plan card, quoted (`account/page.tsx`): the plan and what it holds, its acts. */
function PlanCard({ line }: { line?: ReactNode }) {
  const stored = STORAGE.activeBytes + STORAGE.deletedBytes;
  return (
    <Card id="plan">
      <CardHeader>
        <CardTitle>Plan</CardTitle>
        <CardDescription>
          {`${HOST.plan} · ${formatBytesUp(stored)} of ${formatBytes(STORAGE.capBytes)} used`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <dl className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <dt className="text-xs font-medium text-muted-foreground">Events</dt>
            <dd className="text-sm">{`${ALBUMS.length} of Unlimited used`}</dd>
          </div>
          <div className="space-y-1">
            <dt className="text-xs font-medium text-muted-foreground">Storage</dt>
            <dd className="text-sm">{`About ${formatCapacity(STORAGE.capBytes)}`}</dd>
          </div>
        </dl>
        <div className="flex flex-wrap gap-2">
          <Button size="sm">Change plan</Button>
          <Button size="sm" variant="outline">
            Manage billing
          </Button>
        </div>
        {line}
      </CardContent>
    </Card>
  );
}

/** The connection as one row: whose Drive, what it can see, the way to end it. */
function ConnectionRow({ detail }: { detail: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted">
        <FolderUp className="size-4" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-sm font-medium">Google Drive</span>
        <span className="truncate text-xs text-muted-foreground">{detail}</span>
      </span>
      <Button variant="outline" size="sm">
        Disconnect
      </Button>
    </div>
  );
}

/**
 * ACCOUNT, AT ITS TOP: the heading, the Plan card, and the connection the way
 * the option keeps it (its own card, a line in Plan, or a Connected apps card).
 */
export function Account({ way, over }: { way: AccountWay; over?: ReactNode }) {
  const inPlan =
    way === "in-plan" ? (
      <div
        data-dx-read="the connection"
        className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-border/60 pt-4 text-xs text-muted-foreground"
      >
        <DriveName className="font-medium text-foreground" />
        <span className="min-w-0 truncate">{`Connected as ${HOST.email}`}</span>
        <button type="button" className="font-medium text-foreground underline underline-offset-4">
          Disconnect
        </button>
      </div>
    ) : null;
  return (
    <Ground over={over}>
      <AppBar trail="Account" />
      <Page>
        <div className="mx-auto max-w-2xl space-y-6">
          <div>
            <PageHeading>Account</PageHeading>
            <p className="text-sm text-muted-foreground">
              Manage your profile and how you sign in.
            </p>
          </div>
          <PlanCard line={inPlan} />
          {way === "card" ? (
            <Card data-dx-read="the connection">
              <CardHeader>
                <CardTitle>
                  <DriveName className="gap-2" />
                </CardTitle>
                <CardDescription>
                  Where Send to Drive puts your albums. Partyreel sees only
                  what it puts there.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Avatar size="sm">
                    <AvatarFallback className="text-[10px]">M</AvatarFallback>
                  </Avatar>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-sm font-medium">{HOST.email}</span>
                    <span className="text-xs text-muted-foreground">Connected 13 Sep</span>
                  </span>
                  <Light tone="done">Connected</Light>
                </div>
                <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
                  <dt className="text-muted-foreground">Folder</dt>
                  <dd className="flex min-w-0 items-center gap-1.5">
                    <span className="truncate">My Drive › Partyreel</span>
                    <ExternalLink className="size-3.5 shrink-0 text-muted-foreground" />
                  </dd>
                  <dt className="text-muted-foreground">Sent</dt>
                  <dd className="tabular-nums">2 albums · 11.5 GB · the last on 13 Sep</dd>
                </dl>
                <Button variant="outline" size="sm">
                  Disconnect
                </Button>
              </CardContent>
            </Card>
          ) : null}
          {way === "apps" ? (
            <Card data-dx-read="the connection">
              <CardHeader>
                <CardTitle>Connected apps</CardTitle>
                <CardDescription>
                  Services that can add your albums to your own storage, and
                  what each can see.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ConnectionRow
                  detail={`${HOST.email} · sees only what Partyreel puts there`}
                />
              </CardContent>
            </Card>
          ) : null}
        </div>
      </Page>
    </Ground>
  );
}

/** Disconnect's confirm (the real `Popup`, `confirm` kind): what stops, what stays. */
export function DisconnectConfirm() {
  return (
    <Popup open onOpenChange={() => {}}>
      <PopupContent kind="confirm">
        <PopupHeader
          title="Disconnect Google Drive?"
          description={`Partyreel stops sending to ${HOST.email} and deletes its key to it. Everything already sent stays in your Drive.`}
        />
        <PopupFooter>
          <Button variant="outline">Cancel</Button>
          <Button variant="destructive">Disconnect</Button>
        </PopupFooter>
      </PopupContent>
    </Popup>
  );
}

/* ── freeing an album's room ──────────────────────────────────────────── */

export type ExitWay = "to-deleted" | "for-good" | "choose";

/**
 * FREE 7.4 GB'S CONFIRM (the real `Popup`, `confirm` kind, wide enough to list
 * what leaves): the fresh check of her Drive, what leaves, what stays, and the
 * one act (or, when she chooses, the two).
 */
export function ExitConfirm({ way }: { way: ExitWay }) {
  const size = formatBytes(TOTAL_BYTES);
  const where =
    way === "to-deleted"
      ? `It moves to Deleted. With Make room from Deleted on, its ${size} makes room for your next uploads, and it leaves for good on 13 Oct.`
      : way === "for-good"
        ? `It's deleted for good: ${size} free at once. Partyreel can't bring it back; your Drive keeps every file.`
        : "Move it to Deleted, where its room goes to your next uploads for 30 days, or delete it for good to free it now.";
  return (
    <Popup open onOpenChange={() => {}}>
      <PopupContent kind="confirm" size="md">
        <PopupHeader title={`Free ${size} from Partyreel?`} description={where} />
        <PopupBody className="flex flex-col gap-3">
          <div
            data-dx-read="the app's check"
            className="flex flex-col gap-1 rounded-float bg-card px-3 py-2.5 ring-1 ring-foreground/10"
          >
            <span className="flex flex-wrap items-center gap-2 text-sm">
              <Light tone="done">Checked</Light>
              <span className="tabular-nums">
                {`${formatCount(TOTAL_COUNT)} of ${formatCount(TOTAL_COUNT)} in your Drive, just now`}
              </span>
            </span>
            <span className="text-xs text-pretty text-muted-foreground">
              Every item the album holds, hidden, waiting and developing ones
              too, matched to ours by size and fingerprint.
            </span>
          </div>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
            <dt className="text-muted-foreground">Leaves</dt>
            <dd>{`${EVENT.name}'s album, its link and its reel`}</dd>
            <dt className="text-muted-foreground">Stays</dt>
            <dd className="min-w-0">{`Every original, in My Drive › Partyreel › ${EVENT.folder}`}</dd>
          </dl>
        </PopupBody>
        <PopupFooter>
          <Button variant="outline">Keep it</Button>
          {way === "choose" ? (
            <>
              <Button variant="outline">Move to Deleted</Button>
              <Button variant="destructive">Delete for good</Button>
            </>
          ) : (
            <Button variant="destructive">
              {way === "to-deleted" ? "Move to Deleted" : "Delete for good"}
            </Button>
          )}
        </PopupFooter>
      </PopupContent>
    </Popup>
  );
}

/**
 * WHEN THE APP'S CHECK FINDS A GAP: nothing is deleted, the gap is named with
 * its one act (here the four hidden photos the send left out, Include hidden
 * items being off when she sent it).
 */
export function ExitRefused() {
  return (
    <Popup open onOpenChange={() => {}}>
      <PopupContent kind="confirm" size="md">
        <PopupHeader
          title="Not yet: 4 aren’t in your Drive"
          description={`${EVENT.name} holds 4 hidden photos the send left out. Nothing was deleted.`}
        />
        <PopupBody className="flex flex-col gap-3">
          <div
            data-dx-read="the app's check"
            className="flex flex-col gap-1 rounded-float bg-card px-3 py-2.5 ring-1 ring-foreground/10"
          >
            <span className="flex flex-wrap items-center gap-2 text-sm">
              <Light tone="paused">4 missing</Light>
              <span className="tabular-nums">
                {`${formatCount(TOTAL_COUNT - 4)} of ${formatCount(TOTAL_COUNT)} in your Drive, just now`}
              </span>
            </span>
            <span className="text-xs text-pretty text-muted-foreground">
              Send them too, and Free its room is one press again.
            </span>
          </div>
        </PopupBody>
        <PopupFooter>
          <Button variant="outline">Keep it</Button>
          <Button>
            <FolderUp /> Send the 4 too
          </Button>
        </PopupFooter>
      </PopupContent>
    </Popup>
  );
}

/** Her storage after the exit, as the ring's chart reads it: the album's bytes moved or gone. */
export function storedAfter(way: ExitWay): Stored {
  const active = STORAGE.activeBytes - TOTAL_BYTES;
  return way === "for-good"
    ? { activeBytes: active, deletedBytes: STORAGE.deletedBytes }
    : { activeBytes: active, deletedBytes: STORAGE.deletedBytes + TOTAL_BYTES };
}
