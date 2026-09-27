"use client";

import { type ReactNode, useState } from "react";
import Link from "next/link";
import {
  AtSign,
  Bell,
  CalendarPlus,
  Check,
  LayoutGrid,
  ListFilter,
  Mail,
  Rows3,
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
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { formatEventDate } from "@/lib/utils";

import { CURRENT_EVENT, PRIYA, type WaitingEvent } from "./fixtures";

/**
 * THE TWO PAGES THE REVIEW IS MET ON, HELD STEADY UNDER EVERY OPTION.
 *
 * ★ THE DASHBOARD AS IT SHIPS FOR A GUEST WHO HOSTS NOTHING (`dashboard/page.tsx`):
 * the wide page, "Dashboard" over "0 of 1 event used" and New event, the
 * storage line, the claim ticket's slot, then Your events with its lens and
 * view toggle and the Guest cards (`EventCard`'s own `guest` variant, real and
 * presentational). Round one drew an older dashboard (an uppercase label and a
 * hand-laid Guest mark); this is production's. The bell and the account menu
 * are quoted: the real ones open Radix menus that would portal out of the frame.
 *
 * ★ THE ALBUM AS A CONFIRMED GUEST SEES IT, down to the moment card
 * (`follow-moment-card.tsx`, quoted with its shipped words): the album's own
 * shape is not this board's, so nothing under the card is drawn.
 */

/* ── the dashboard ───────────────────────────────────────────────────────── */

export function DashboardGround({
  notice,
  claimed,
  overlay,
}: {
  /** The ticket's slot: the banner, or once all is written, the invitation. */
  notice: ReactNode;
  /** Events the review has written into her account, in the RPC's order. */
  claimed: readonly WaitingEvent[];
  overlay: ReactNode;
}) {
  return (
    <div data-ic-ground className="relative min-h-full">
      <AppShell
        headerActions={
          <>
            <span
              aria-hidden
              className="relative flex size-9 items-center justify-center rounded-full text-muted-foreground"
            >
              <Bell className="size-5" />
            </span>
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
      {overlay}
    </div>
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
        <li data-ic-card>
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
            data-ic-card
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
    <div
      data-ic-banner
      className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3"
    >
      <span className="flex min-w-0 items-start gap-2.5 text-sm text-foreground">
        <Mail
          className="mt-0.5 size-4 shrink-0 text-muted-foreground"
          aria-hidden
        />
        <span data-ic-banner-words className="text-pretty">
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
 * THE PAGE'S INVITATION ONCE THE REVIEW IS DONE (`identity-profile`'s
 * `prompt=claim`, settled and being built by `profile-setup`), quoted as that
 * board drew it, in the slot the banner leaves.
 */
export function PageInvite() {
  return (
    <Card data-ic-invite className="ring-1 ring-brand/40">
      <CardHeader>
        <CardTitle data-ic-invite-title>Set up your page</CardTitle>
        <CardDescription>
          Choose what shows before anyone sees it.
        </CardDescription>
      </CardHeader>
      <CardFooter>
        <Button type="button" size="sm">
          Set up your page
        </Button>
      </CardFooter>
    </Card>
  );
}

/* ── the album ───────────────────────────────────────────────────────────── */

export function AlbumGround({
  children,
  overlay,
}: {
  children: ReactNode;
  overlay?: ReactNode;
}) {
  return (
    <div
      data-ic-ground
      className="relative min-h-full bg-background text-foreground"
    >
      <header className="flex items-center justify-between gap-2 border-b border-border/60 px-5 py-3">
        <Logo />
        <Avatar size="sm" seed={PRIYA.seed}>
          <AvatarFallback className="text-[10px]">
            {PRIYA.name.slice(0, 1)}
          </AvatarFallback>
        </Avatar>
      </header>
      <div className="mx-auto max-w-[640px] px-4 py-5">
        {/* `event-experience.tsx`'s left-editorial header: the name, then one
            byline line. */}
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
        <div className="mt-6">{children}</div>
      </div>
      {overlay}
    </div>
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
 * THE MOMENT CARD, QUOTED (`follow-moment-card.tsx`, one photo this visit):
 * the green check and its two lines, the host's row with Follow, the handle
 * line. `pointer` varies only the `extra` at its foot.
 */
export function MomentCard({ extra }: { extra?: ReactNode }) {
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-success text-success-foreground">
          <Check className="size-3.5" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="font-heading text-subsection">Your photo is safe</p>
          <p className="mt-0.5 text-reading text-pretty text-muted-foreground">
            It is in your account now, and this event came with it.
          </p>
        </div>
      </div>
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
      {extra}
    </div>
  );
}

/**
 * `pointer`'s one line, in the moment card's own row shape: a count of the
 * events and ONE button that names them all, so it cannot read as a page per
 * event. `onReview` is live only where the review opens in place.
 */
export function PointerLine({
  events,
  onReview,
}: {
  events: number;
  onReview?: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-t border-border/60 pt-4">
      <p
        data-ic-pointer
        className="flex min-w-0 items-start gap-2.5 text-reading text-pretty text-muted-foreground"
      >
        <Mail
          className="mt-0.5 size-4 shrink-0 text-muted-foreground"
          aria-hidden
        />
        {`${events} more events have photos waiting under your email.`}
      </p>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="shrink-0"
        onClick={onReview}
      >
        {`Review all ${events}`}
      </Button>
    </div>
  );
}
