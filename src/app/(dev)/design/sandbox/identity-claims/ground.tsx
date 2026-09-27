"use client";

import { type ReactNode, useState } from "react";
import Link from "next/link";
import {
  AtSign,
  Bell,
  CalendarPlus,
  Check,
  ChevronRight,
  ImageUp,
  LayoutDashboard,
  LayoutGrid,
  ListFilter,
  Lock,
  LogOut,
  Mail,
  Monitor,
  Rows3,
  Settings,
  Share2,
  UserCheck,
  UserPlus,
} from "lucide-react";

import { EVENT_CARD_GRID } from "@/components/app/dashboard/event-card-grid";
import { EventCard } from "@/components/app/event-card";
import { AppShell } from "@/components/shared/app-shell";
import { Logo } from "@/components/shared/logo";
import { PageHeading } from "@/components/shared/page-heading";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { floatingPanel, floatingRow } from "@/components/ui/floating-layer";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { formatCount, formatMediaCount } from "@/lib/format/count";
import { cn, formatEventDate } from "@/lib/utils";

import { photosIn, pointerWords, reviewAll } from "./batch";
import { CURRENT_EVENT, PRIYA, type WaitingEvent } from "./fixtures";
import { Thumb } from "./scene";
import type { Size } from "./screens";

/**
 * THE TWO PAGES THE REVIEW IS MET ON, HELD STEADY UNDER EVERY OPTION.
 *
 * ★ THE ALBUM AS A JUST-CONFIRMED GUEST SEES IT (`event-experience.tsx`): the
 * header with her avatar where the stranger's CTA was, the words' column pinned
 * to the left line (`COLUMN`, 632 px of measure), the name, its byline and the
 * stats line, Add photos over Invite, then the upload area's slot holding the
 * moment card (`follow-moment-card.tsx`, quoted with its shipped words and its
 * told name), and under it the album's first row running the window's width
 * (`BLEED`, two a row in a hand and five at a desk, the default step).
 *
 * ★ THE DASHBOARD AS IT SHIPS FOR A GUEST WHO HOSTS NOTHING (`dashboard/page.tsx`):
 * the wide page, "Dashboard" over "0 of 1 event used" and New event, the
 * storage line, the ticket's slot (the banner, settled), then Your events with
 * its lens and view toggle and the Guest cards (`EventCard`'s own `guest`
 * variant, real and presentational). The bell and the account menus are quoted:
 * the real ones open Radix menus that would portal out of the frame.
 *
 * ★ `pointer`'S OPTIONS VARY ONLY WHAT THEY SAY: a row in the moment card
 * (`PointerLine`, `NamedPointer`), or a count on her avatar and the bell
 * (`count`). Everything else is the same page under all five.
 */

/* ── the counting badge, the bell's own ──────────────────────────────────── */

/** `notification-bell.tsx`'s badge, quoted: the brand's dot with the count. */
function CountBadge({ n, hook }: { n: number; hook: "avatar" | "bell" }) {
  return (
    <span
      {...{ [`data-ic-${hook}-count`]: "" }}
      className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-semibold text-brand-foreground"
    >
      {n > 9 ? "9+" : n}
    </span>
  );
}

/* ── a quoted menu ───────────────────────────────────────────────────────── */

/**
 * `DropdownMenuContent`'s panel, quoted and pinned under the control that
 * opened it (`fixed`, the frame is the viewport; `sideOffset` 4).
 */
function MenuPanel({
  width,
  top,
  right,
  children,
}: {
  width: number;
  top: number;
  right: number;
  children: ReactNode;
}) {
  return (
    <div
      role="menu"
      className={cn("fixed z-50 overflow-hidden p-1", floatingPanel)}
      style={{ width, top, right }}
    >
      {children}
    </div>
  );
}

/** `DropdownMenuItem`, quoted: the icon rail, the row's corner. */
function MenuRow({
  icon,
  meta,
  chevron = false,
  onPress,
  children,
}: {
  icon: ReactNode;
  meta?: ReactNode;
  chevron?: boolean;
  onPress?: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onPress}
      className={cn(
        "relative flex w-full cursor-default items-center gap-2 px-2 py-1.5 text-left text-sm outline-hidden select-none hover:bg-accent hover:text-accent-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 [&>svg:first-child]:text-muted-foreground",
        floatingRow,
      )}
    >
      {icon}
      {children}
      {meta !== undefined && (
        <span className="ml-auto text-xs text-muted-foreground tabular-nums">
          {meta}
        </span>
      )}
      {chevron && <ChevronRight className="ml-auto" />}
    </button>
  );
}

function MenuSeparator() {
  return <div aria-hidden className="-mx-1 my-1 h-px bg-border" />;
}

/* ── the album ───────────────────────────────────────────────────────────── */

export function AlbumGround({
  size,
  count,
  menu,
  onMenu,
  onWaiting,
  children,
  overlay,
}: {
  size: Size;
  /** `pointer=bell`: the events her avatar counts (0 draws no badge). */
  count: number;
  /** Her account menu is open under the avatar. */
  menu: boolean;
  onMenu: () => void;
  /** The menu's waiting row, where it has one. */
  onWaiting: () => void;
  children: ReactNode;
  overlay?: ReactNode;
}) {
  return (
    <div
      data-ic-ground="album"
      className="relative min-h-full bg-background pb-8 text-foreground"
    >
      {/* `guest-header.tsx`, signed in: the wordmark, and her avatar where a
          stranger's "Start for free" stands, in the fixed h-8 slot. */}
      <header className="flex items-center justify-between gap-2 border-b border-border/60 px-5 py-3">
        <Logo />
        <div className="flex h-8 items-center">
          <button
            type="button"
            aria-label={
              count ? `Account menu, ${count} waiting` : "Account menu"
            }
            aria-expanded={menu}
            onClick={onMenu}
            className="relative rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <Avatar seed={PRIYA.seed}>
              <AvatarFallback>{PRIYA.name.slice(0, 1)}</AvatarFallback>
            </Avatar>
            {count > 0 && <CountBadge n={count} hook="avatar" />}
          </button>
        </div>
      </header>
      {menu && <AccountMenu count={count} onWaiting={onWaiting} />}

      {/* THE WORDS: `COLUMN`, pinned to the left line at every width. */}
      <div className="w-full max-w-2xl px-5 pt-8">
        <h1 className="font-heading text-page text-balance">
          {CURRENT_EVENT.name}
        </h1>
        <p className="mt-2.5 flex items-center gap-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="text-faint">Hosted by</span>
            <Avatar seed={CURRENT_EVENT.seed} size="sm">
              <AvatarFallback>{CURRENT_EVENT.host.slice(0, 1)}</AvatarFallback>
            </Avatar>
            <span className="font-medium text-foreground">
              {CURRENT_EVENT.host}
            </span>
          </span>
          <span aria-hidden className="text-faint">
            ·
          </span>
          <span>{formatEventDate(CURRENT_EVENT.date)}</span>
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {`${formatMediaCount(CURRENT_EVENT.photos)} from ${formatCount(CURRENT_EVENT.guests)} guests`}
        </p>
        {/* The action block: Add over Invite (her tracker draws nothing: none
            of hers is held at this event). */}
        <div className="mt-4">
          <Button type="button" size="lg" className="w-full" tabIndex={-1}>
            <ImageUp /> Add photos
          </Button>
          <div className="mt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 w-full"
              tabIndex={-1}
            >
              <Share2 /> Invite
            </Button>
          </div>
        </div>
        {/* The upload area's post-upload slot, one card at a time. */}
        <div className="mt-7">{children}</div>
      </div>

      <AlbumRows size={size} />
      {overlay}
    </div>
  );
}

/**
 * THE ALBUM'S FIRST ROWS, `BLEED`: justified by flex-grow on each photo's own
 * ratio, so every photograph in a row shares one height and the row fills the
 * width, two a row in a hand and five at a desk (`ROW_CLASSES`' default step).
 */
function AlbumRows({ size }: { size: Size }) {
  const per = size === "phone" ? 2 : 5;
  const stills = CURRENT_EVENT.album;
  const rows: (typeof stills)[number][][] = [];
  for (let i = 0; i < stills.length; i += per)
    rows.push(stills.slice(i, i + per));
  return (
    <div
      aria-hidden
      className={cn("mt-8 flex flex-col", size === "phone" ? "px-3" : "px-5")}
      style={{ gap: "var(--gap-gallery)" }}
    >
      {rows
        .filter((r) => r.length === per)
        .map((row, i) => (
          <div key={i} className="flex" style={{ gap: "var(--gap-gallery)" }}>
            {row.map((p) => (
              <div
                key={p.src}
                className="min-w-0 overflow-hidden bg-black/10"
                style={{
                  flexGrow: p.ratio,
                  flexBasis: 0,
                  aspectRatio: p.ratio,
                  borderRadius: "var(--radius-tile)",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- a stand-in still, not a presigned URL */}
                <img src={p.src} alt="" className="size-full object-cover" />
              </div>
            ))}
          </div>
        ))}
    </div>
  );
}

/**
 * HER ACCOUNT MENU ON THE ALBUM (`guest-account-menu.tsx`, quoted): who she
 * is, then Dashboard and Account, the theme, Sign out. Under `pointer=bell` it
 * gains ONE row at its head, the waiting events the badge counts, and the row
 * takes her to the review on her dashboard.
 */
function AccountMenu({
  count,
  onWaiting,
}: {
  count: number;
  onWaiting: () => void;
}) {
  return (
    <MenuPanel width={224} top={61} right={20}>
      <div className="flex flex-col gap-0.5 px-2 pt-0.5 pb-1 text-xs text-foreground opacity-70">
        <span className="truncate leading-tight font-medium">{PRIYA.name}</span>
        <span className="truncate text-xs leading-tight font-normal text-muted-foreground">
          {PRIYA.email}
        </span>
      </div>
      <MenuSeparator />
      {count > 0 && (
        <MenuRow icon={<Mail />} meta={count} onPress={onWaiting}>
          <span data-ic-menu-row="">Photos waiting for you</span>
        </MenuRow>
      )}
      <MenuRow icon={<LayoutDashboard />}>Dashboard</MenuRow>
      <MenuRow icon={<Settings />}>Account</MenuRow>
      <MenuSeparator />
      <MenuRow icon={<Monitor />} chevron>
        Theme
      </MenuRow>
      <MenuSeparator />
      <MenuRow icon={<LogOut />}>Sign out</MenuRow>
    </MenuPanel>
  );
}

/** A follow that moves a picture, never a row (`guest-capture`'s precedent). */
function LocalFollowButton() {
  const [following, setFollowing] = useState(false);
  return (
    <Button
      type="button"
      variant={following ? "outline" : "default"}
      size="sm"
      onClick={() => setFollowing((v) => !v)}
      aria-pressed={following}
    >
      {following ? <UserCheck /> : <UserPlus />}
      {following ? "Following" : "Follow"}
    </Button>
  );
}

/**
 * THE MOMENT CARD, QUOTED (`follow-moment-card.tsx`, one photo this visit, a
 * name typed here): the green check and its two lines, the told name with its
 * Change, the host's row with Follow, the handle line. `pointer` is the one
 * row an option adds, right under what she keeps (the carried call
 * `line-place`): her photographs lead the card and Follow follows, the order
 * his guest-capture note gave it.
 */
export function MomentCard({ pointer }: { pointer?: ReactNode }) {
  return (
    <div
      data-ic-moment=""
      className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5"
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-success text-success-foreground">
          <Check className="size-3.5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-heading text-subsection">Your photo is safe</p>
          <p className="mt-0.5 text-reading text-pretty text-muted-foreground">
            It is in your account now, and this event came with it.
          </p>
          <p className="mt-2 text-reading text-pretty text-muted-foreground">
            {`You're on as ${PRIYA.name}.`}{" "}
            <button
              type="button"
              className="font-medium text-foreground underline underline-offset-4 outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              Change
            </button>
          </p>
        </div>
      </div>
      {pointer}
      <div className="flex items-center justify-between gap-3 border-t border-border/60 pt-4">
        <Link
          href={`/u/${CURRENT_EVENT.hostSlug}`}
          onClick={(e) => e.preventDefault()}
          className="flex min-w-0 items-center gap-2.5 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          <Avatar seed={CURRENT_EVENT.seed} size="sm">
            <AvatarFallback>{CURRENT_EVENT.host.slice(0, 1)}</AvatarFallback>
          </Avatar>
          <span className="min-w-0">
            <span className="block truncate text-reading font-medium">
              {CURRENT_EVENT.host}
            </span>
            <span className="block text-working text-muted-foreground">
              Your host
            </span>
          </span>
        </Link>
        <LocalFollowButton />
      </div>
      <div className="flex items-center justify-between gap-3 border-t border-border/60 pt-4">
        <p className="flex min-w-0 items-start gap-2.5 text-reading text-pretty text-muted-foreground">
          <AtSign
            className="mt-0.5 size-4 shrink-0 text-muted-foreground"
            aria-hidden
          />
          Claim a handle and your name becomes a page.
        </p>
        <Button type="button" size="sm" variant="outline" className="shrink-0">
          Claim
        </Button>
      </div>
    </div>
  );
}

/**
 * `pointer=line` and `pointer=here`: ONE row in the moment card's own row
 * shape, counting the events and ONE button that names them all, so it cannot
 * read as a page per event. The two options differ in what the button opens
 * (`onReview`), and `line`'s words say so: its button leaves the album.
 */
export function PointerLine({
  waiting,
  onDashboard,
  onReview,
}: {
  waiting: readonly WaitingEvent[];
  /** The button opens her dashboard rather than the review over the album. */
  onDashboard: boolean;
  onReview: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-t border-border/60 pt-4">
      <p
        data-ic-pointer=""
        className="flex min-w-0 items-start gap-2.5 text-reading text-pretty text-muted-foreground"
      >
        <Mail
          className="mt-0.5 size-4 shrink-0 text-muted-foreground"
          aria-hidden
        />
        {pointerWords(waiting.length, onDashboard)}
      </p>
      <Button
        data-ic-pointer-act=""
        type="button"
        size="sm"
        variant="outline"
        className="shrink-0"
        onClick={onReview}
      >
        {reviewAll(waiting.length)}
      </Button>
    </div>
  );
}

/**
 * `pointer=named`: the same sentence with the events under it by name, each
 * with its first photograph (a lock for a password event, QA #40: its pictures
 * stay behind the host's door) and its count, then ONE button for the whole
 * review. The names are words, not buttons: tapping Tom's opens the review, not
 * a page of Tom's.
 */
export function NamedPointer({
  waiting,
  onReview,
}: {
  waiting: readonly WaitingEvent[];
  onReview: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 border-t border-border/60 pt-4">
      <p
        data-ic-pointer=""
        className="flex min-w-0 items-start gap-2.5 text-reading text-pretty text-muted-foreground"
      >
        <Mail
          className="mt-0.5 size-4 shrink-0 text-muted-foreground"
          aria-hidden
        />
        {pointerWords(waiting.length)}
      </p>
      <ul className="flex flex-col gap-2 pl-6.5">
        {waiting.map((e) => (
          <li
            key={e.eventId}
            data-ic-named={e.eventName}
            className="flex items-center gap-2.5"
          >
            {e.gated || !e.photos[0] ? (
              <span
                className="flex size-7 shrink-0 items-center justify-center bg-muted text-muted-foreground"
                style={{ borderRadius: "var(--radius-tile)" }}
              >
                <Lock className="size-3" aria-hidden />
              </span>
            ) : (
              <Thumb url={e.photos[0]} size={28} />
            )}
            <span className="min-w-0 flex-1 truncate text-sm text-foreground">
              {e.eventName}
            </span>
            <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
              {`${formatCount(e.uploadCount)} photo${e.uploadCount === 1 ? "" : "s"}`}
            </span>
          </li>
        ))}
      </ul>
      <Button
        data-ic-pointer-act=""
        type="button"
        size="sm"
        variant="outline"
        className="w-full"
        onClick={onReview}
      >
        {reviewAll(waiting.length)}
      </Button>
    </div>
  );
}

/* ── the dashboard ───────────────────────────────────────────────────────── */

export function DashboardGround({
  size,
  count,
  bell,
  onBell,
  waiting,
  onReview,
  notice,
  claimed,
  overlay,
}: {
  size: Size;
  /** `pointer=bell`: the events the bell counts (0 draws no badge). */
  count: number;
  /** The bell's panel is open. */
  bell: boolean;
  onBell: () => void;
  /** What the bell's one row speaks for (`pointer=bell`), else nothing. */
  waiting: readonly WaitingEvent[];
  onReview: () => void;
  /** The ticket's slot: the banner, or once all is decided, the invitation. */
  notice: ReactNode;
  /** Events the review has written into her account, in the RPC's order. */
  claimed: readonly WaitingEvent[];
  overlay: ReactNode;
}) {
  return (
    <div data-ic-ground="dashboard" className="relative min-h-full">
      <AppShell
        headerActions={
          <>
            <button
              type="button"
              aria-label={
                count > 0 ? `Notifications, ${count} new` : "Notifications"
              }
              aria-expanded={bell}
              onClick={onBell}
              className="relative flex size-9 items-center justify-center rounded-full text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <Bell className="size-5" />
              {count > 0 && <CountBadge n={count} hook="bell" />}
            </button>
            <Avatar seed={PRIYA.seed}>
              <AvatarFallback>{PRIYA.name.slice(0, 1)}</AvatarFallback>
            </Avatar>
          </>
        }
      >
        <div data-app-wide className="space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <PageHeading>Dashboard</PageHeading>
              <p className="text-sm text-muted-foreground">0 of 1 event used</p>
            </div>
            <Button type="button" tabIndex={-1}>
              <CalendarPlus /> New event
            </Button>
          </div>
          <StorageLine />
          {notice}
          <YourEvents claimed={claimed} />
        </div>
      </AppShell>
      {bell && (
        // Under the bell: the header is h-14 and the bell sits left of her
        // 32 px avatar, 8 px apart, inside the wide page's own gutter.
        <MenuPanel
          width={320}
          top={60}
          right={(size === "phone" ? 12 : 20) + 40}
        >
          <BellPanel waiting={waiting} count={count} onReview={onReview} />
        </MenuPanel>
      )}
      {overlay}
    </div>
  );
}

/**
 * THE BELL'S PANEL (`notification-bell.tsx`, quoted): the title row with its
 * count, then one row per alert. Under `pointer=bell` the waiting events are
 * ONE row (never one per event, which would read as a page each), an alert that
 * is state: it stays until the last of them is sorted, as every alert of the
 * bell's does (notifications-analytics-growth.md, "Alerts are state").
 */
function BellPanel({
  waiting,
  count,
  onReview,
}: {
  waiting: readonly WaitingEvent[];
  count: number;
  onReview: () => void;
}) {
  const photos = photosIn(waiting);
  return (
    <>
      <div className="-mx-1 -mt-1 mb-1 flex items-baseline justify-between gap-3 border-b border-border px-3 py-2">
        <div className="min-w-0 text-sm leading-tight font-semibold tracking-tight">
          Notifications
        </div>
        {count > 0 && (
          <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
            {`${count} new`}
          </span>
        )}
      </div>
      {waiting.length === 0 ? (
        <p className="px-2 py-6 text-center text-sm text-muted-foreground">
          You&rsquo;re all caught up.
        </p>
      ) : (
        <button
          type="button"
          onClick={onReview}
          className={cn("block w-full text-left hover:bg-muted", floatingRow)}
        >
          <div className="flex gap-2 px-2 py-2">
            <span
              className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand"
              aria-hidden
            />
            <div className="min-w-0 flex-1 space-y-0.5">
              <p
                data-ic-bell-row=""
                className="text-sm leading-tight font-medium"
              >
                Photos waiting for you
              </p>
              <p className="text-xs text-muted-foreground">
                {`${formatCount(photos)} photos from ${waiting.length} events, added under your email before it was confirmed.`}
              </p>
            </div>
            <ChevronRight
              className="mt-0.5 size-4 shrink-0 text-muted-foreground"
              aria-hidden
            />
          </div>
        </button>
      )}
    </>
  );
}

/** `storage-meter.tsx`'s resting face, quoted: its Popover would portal. */
function StorageLine() {
  return (
    <div className="flex w-full items-center gap-3 rounded-lg px-1.5 py-1 text-left">
      <span className="shrink-0 text-xs font-medium text-muted-foreground">
        Storage
      </span>
      <span className="h-1 flex-1 overflow-hidden rounded-full bg-muted" />
      <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
        0 B / 2 GB
      </span>
    </div>
  );
}

function YourEvents({ claimed }: { claimed: readonly WaitingEvent[] }) {
  // A card a press settles here arrives; the ones a frame opens with stand still.
  const [opened] = useState(() => new Set(claimed.map((e) => e.eventId)));
  return (
    <section aria-label="Your events" className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <h2 className="font-heading text-subsection">Your events</h2>
        <div className="flex items-center gap-1.5">
          <Button type="button" variant="ghost" size="sm" tabIndex={-1}>
            <ListFilter />
            All events
          </Button>
          <ToggleGroup
            type="single"
            value="cards"
            variant="outline"
            size="sm"
            aria-label="How your events are shown"
          >
            <ToggleGroupItem value="cards" aria-label="Cover cards">
              <LayoutGrid />
            </ToggleGroupItem>
            <ToggleGroupItem value="rows" aria-label="Rows">
              <Rows3 />
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>
      {/* The cards are real Links: a click inside a frame would navigate the
          frame away from the picture being judged, so this list swallows it. */}
      <ul
        className={EVENT_CARD_GRID}
        onClickCapture={(e) => e.preventDefault()}
      >
        <li data-ic-card="">
          <EventCard
            variant="guest"
            href={`/e/${CURRENT_EVENT.id}`}
            name={CURRENT_EVENT.name}
            coverUrl={CURRENT_EVENT.cover}
            dateLabel={formatEventDate(CURRENT_EVENT.date)}
            byline={`Hosted by ${CURRENT_EVENT.host}`}
          />
        </li>
        {claimed.map((e) => (
          <li
            key={e.eventId}
            data-ic-card=""
            className={opened.has(e.eventId) ? undefined : "ic-enter"}
          >
            <EventCard
              variant="guest"
              href={`/e/${e.eventId}`}
              name={e.eventName}
              coverUrl={e.cover}
              dateLabel={formatEventDate(e.cardDate)}
              byline={`Hosted by ${e.host.name}`}
              statusLabel={e.gated ? "Password" : null}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}

/** The ticket's banner (`ticket=banner`, settled): one line and one button. */
export function Banner({
  words,
  action,
  onAction,
}: {
  words: string;
  action: string;
  onAction: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3">
      <span className="flex min-w-0 items-start gap-2.5 text-sm text-foreground">
        <Mail
          className="mt-0.5 size-4 shrink-0 text-muted-foreground"
          aria-hidden
        />
        <span data-ic-banner-words="" className="text-pretty">
          {words}
        </span>
      </span>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="shrink-0"
        onClick={onAction}
      >
        {action}
      </Button>
    </div>
  );
}

/**
 * THE PAGE'S INVITATION ONCE THE REVIEW IS DONE (`page-invite-card.tsx`, as it
 * ships since `profile-setup` merged), quoted in the slot the banner leaves.
 */
export function PageInvite() {
  return (
    <Card className="ring-brand/40">
      <CardHeader>
        <CardTitle>Set up your page</CardTitle>
        <CardDescription>
          Choose what shows before anyone sees it.
        </CardDescription>
      </CardHeader>
      <CardFooter className="flex-wrap gap-2">
        <Button type="button" size="sm">
          Set up your page
        </Button>
        <Button type="button" size="sm" variant="ghost">
          Not now
        </Button>
      </CardFooter>
    </Card>
  );
}
