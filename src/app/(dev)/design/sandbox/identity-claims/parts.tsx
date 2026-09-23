"use client";

import { type ReactNode, useState } from "react";
import Link from "next/link";
import { AtSign, Bell, Check, Mail, UserCheck, UserPlus } from "lucide-react";

import { EventCard } from "@/components/app/event-card";
import { AppShell } from "@/components/shared/app-shell";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { floatingPanel } from "@/components/ui/floating-layer";
import type { ClaimableEventRow } from "@/lib/db/queries/claims";
import { GLASS_MARK } from "@/lib/glass";
import { cn, formatEventDate } from "@/lib/utils";

import {
  CLAIMABLE_ROWS,
  CLAIMED_COVER,
  CURRENT_EVENT,
  CURRENT_EVENT_COVER,
  HERS,
  HERS_PHOTOS,
  IMPOSTOR,
  IMPOSTOR_PHOTOS,
  PRIYA,
} from "./fixtures";
import { DialogFoot, Scrim, Thumb, ToastVisual } from "./scene";

/**
 * THE PIECES EACH DECISION DRAWS, IN PARTS, SO ONLY ONE OF THEM MOVES
 * (`guest-capture/parts.tsx`'s own discipline, carried here).
 *
 * ★ NOTHING HERE CALLS A SERVER FUNCTION OR MOUNTS A RADIX PORTAL. The shipped
 * `ClaimsCard` fires a real server action on Finish and opens a real `Dialog`;
 * `NotificationBell` opens a real `DropdownMenu`; `Sheet` and `Dialog` both
 * portal to the document that hosts them. Any of the three, mounted live
 * inside a lab frame, would either try to write to production on a click
 * nobody but a stray reviewer would make, or render on the LAB PAGE instead of
 * the phone being judged (`scene.tsx`'s own note; `host-curation` names the
 * same landmine for its lightbox). So every card, sheet, drawer, dialog and
 * toast below is QUOTED markup with LOCAL state (a Claim/Not mine press moves
 * a picture, never a row), the shipped icons, variants and copy verbatim
 * where `claims-card.tsx` and `follow-moment-card.tsx` already say them.
 */

type Decision = "claim" | "disown";

function useDecisions(initial: Partial<Record<string, Decision>> = {}) {
  const [decisions, setDecisions] =
    useState<Partial<Record<string, Decision>>>(initial);
  function decide(eventId: string, next: Decision) {
    setDecisions((prev) => {
      const copy = { ...prev };
      if (copy[eventId] === next) delete copy[eventId];
      else copy[eventId] = next;
      return copy;
    });
  }
  return [decisions, decide] as const;
}

/* ── the shipped card's own small pure functions, re-created for copy parity
      (claims-card.tsx does not export them, so this is a retyping, never an
      import: the same discipline `guest-capture/fixtures.ts` names for why
      it does not import another board's file either) ─────────────────────── */

function namesLabel(names: string[]): string | null {
  if (names.length === 0) return null;
  if (names.length === 1) return `Added as ${names[0]}`;
  return `Added as ${names.join(", ")}`;
}

function formatUploadTimestamp(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function metaLine(row: ClaimableEventRow): string {
  return [
    row.eventDate ? formatEventDate(row.eventDate) : null,
    namesLabel(row.names),
    `${row.uploadCount} photo${row.uploadCount === 1 ? "" : "s"}`,
    row.lastUploadAt
      ? `last added ${formatUploadTimestamp(row.lastUploadAt)}`
      : null,
  ]
    .filter((part): part is string => Boolean(part))
    .join(" · ");
}

/** Mirrors `claims-card.tsx`'s own `confirmDeleteTitle`, pluralised the same way. */
function confirmDeleteTitle(photos: number, events: number): string {
  const photoPhrase =
    photos === 1 ? "1 photo or video" : `${photos} photos and videos`;
  const eventPhrase = events === 1 ? "this event" : `these ${events} events`;
  return `Permanently delete the ${photoPhrase} added under your email at ${eventPhrase}?`;
}

/* ── a follow button that moves a picture, never a row (guest-capture's own precedent) ─ */

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

/* ── the row list every ticket shape shares ──────────────────────────────── */

function TicketRow({
  row,
  decision,
  onDecide,
}: {
  row: ClaimableEventRow;
  decision: Decision | undefined;
  onDecide: (eventId: string, next: Decision) => void;
}) {
  return (
    <div className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">
          {row.eventName}
        </p>
        <p className="text-xs text-muted-foreground">{metaLine(row)}</p>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        <Button
          type="button"
          size="sm"
          variant={decision === "claim" ? "default" : "outline"}
          aria-pressed={decision === "claim"}
          onClick={() => onDecide(row.eventId, "claim")}
        >
          Claim
        </Button>
        <Button
          type="button"
          size="sm"
          variant={decision === "disown" ? "destructive" : "ghost"}
          aria-pressed={decision === "disown"}
          onClick={() => onDecide(row.eventId, "disown")}
        >
          Not mine
        </Button>
      </div>
    </div>
  );
}

function TicketRows({
  rows,
  decisions,
  onDecide,
}: {
  rows: ClaimableEventRow[];
  decisions: Partial<Record<string, Decision>>;
  onDecide: (eventId: string, next: Decision) => void;
}) {
  return (
    <ul className="divide-y divide-border/60">
      {rows.map((row) => (
        <li key={row.eventId}>
          <TicketRow
            row={row}
            decision={decisions[row.eventId]}
            onDecide={onDecide}
          />
        </li>
      ))}
    </ul>
  );
}

const TICKET_HEADING = (
  <span className="flex items-center gap-2">
    <Mail className="size-4 text-muted-foreground" aria-hidden />
    Photos waiting for you
  </span>
);
const TICKET_DESCRIPTION =
  "Added at events with the email on this account, before it was confirmed.";

/* ── `ticket=card` and `pass=rows`: the shipped card, verbatim ───────────── */

export function ShippedTicket({
  initialDecisions = {},
}: {
  initialDecisions?: Partial<Record<string, Decision>>;
}) {
  const [decisions, decide] = useDecisions(initialDecisions);
  return (
    <Card>
      <CardHeader>
        <CardTitle>{TICKET_HEADING}</CardTitle>
        <CardDescription>{TICKET_DESCRIPTION}</CardDescription>
      </CardHeader>
      <CardContent>
        <TicketRows
          rows={CLAIMABLE_ROWS}
          decisions={decisions}
          onDecide={decide}
        />
      </CardContent>
      <CardFooter className="justify-end gap-2">
        <Button type="button" variant="outline" size="sm">
          Claim all
        </Button>
        <Button type="button" size="sm">
          Finish
        </Button>
      </CardFooter>
    </Card>
  );
}

/* ── `ticket=banner`: a slim line, and the sheet it opens ─────────────────── */

export function TicketBanner() {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3">
      <span className="flex min-w-0 items-center gap-2.5 text-sm text-foreground">
        <Mail className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        <span className="truncate">
          {HERS.uploadCount + IMPOSTOR.uploadCount} photos from{" "}
          {CLAIMABLE_ROWS.length} events are waiting for you
        </span>
      </span>
      <Button type="button" size="sm" variant="outline" className="shrink-0">
        Review
      </Button>
    </div>
  );
}

export function TicketSheetPanel() {
  const [decisions, decide] = useDecisions();
  return (
    <div
      className={cn(
        "fixed inset-y-0 right-0 z-50 flex h-full w-3/4 max-w-sm flex-col gap-4 border-l border-border bg-popover bg-clip-padding text-sm text-popover-foreground shadow-layer",
      )}
    >
      <div className="flex flex-col gap-0.5 p-4">
        <p className="font-heading text-card-title font-medium text-foreground">
          Photos waiting for you
        </p>
        <p className="text-sm text-muted-foreground">{TICKET_DESCRIPTION}</p>
      </div>
      <div className="flex-1 overflow-y-auto px-4">
        <TicketRows
          rows={CLAIMABLE_ROWS}
          decisions={decisions}
          onDecide={decide}
        />
      </div>
      <div className="mt-auto flex justify-end gap-2 p-4">
        <Button type="button" variant="outline" size="sm">
          Claim all
        </Button>
        <Button type="button" size="sm">
          Finish
        </Button>
      </div>
    </div>
  );
}

/* ── `ticket=bell`: the bell's badge, and the drawer it opens ─────────────── */

export function BellButton({ badge }: { badge: number }) {
  return (
    <span
      aria-label={`Notifications, ${badge} new`}
      className="relative flex size-9 items-center justify-center rounded-full text-muted-foreground"
    >
      <Bell className="size-5" />
      {badge > 0 && (
        <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-semibold text-brand-foreground">
          {badge}
        </span>
      )}
    </span>
  );
}

export function TicketBellDrawer() {
  const [decisions, decide] = useDecisions();
  return (
    <div className="fixed inset-y-0 right-0 z-50 flex h-full w-3/4 max-w-sm flex-col border-l border-border bg-popover bg-clip-padding text-popover-foreground shadow-layer">
      <div className="border-b border-border/60 px-4 py-3">
        <p className="text-sm font-semibold">Notifications</p>
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
        <div>
          <p className="text-xs font-medium text-foreground">
            Photos waiting for you
          </p>
          <p className="text-xs text-muted-foreground">{TICKET_DESCRIPTION}</p>
        </div>
        <TicketRows
          rows={CLAIMABLE_ROWS}
          decisions={decisions}
          onDecide={decide}
        />
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="outline" size="sm">
            Claim all
          </Button>
          <Button type="button" size="sm">
            Finish
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ── `pointer`: the moment card, held steady, with the one thing varied ──── */

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
          <AtSign className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          Claim a handle and your name becomes a page.
        </p>
        <Button size="sm" variant="outline" className="shrink-0">
          Claim
        </Button>
      </div>
      {extra}
    </div>
  );
}

export function PointerLine() {
  return (
    <div className="flex items-center justify-between gap-3 border-t border-border/60 pt-4">
      <p className="flex min-w-0 items-start gap-2.5 text-reading text-pretty text-muted-foreground">
        <Mail className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        {HERS.uploadCount + IMPOSTOR.uploadCount} photos from{" "}
        {CLAIMABLE_ROWS.length} other events are waiting for you.
      </p>
      <Button size="sm" variant="outline" className="shrink-0">
        Review
      </Button>
    </div>
  );
}

/* ── `pass`: one event at a time, and the checklist ───────────────────────── */

export function OneAtATimeCard() {
  return (
    <div className="relative pb-2">
      <div
        aria-hidden
        className="absolute inset-x-3 bottom-0 h-[calc(100%-8px)] rounded-xl border border-border bg-card opacity-60"
      />
      <div className="relative flex flex-col gap-4 rounded-xl border border-border bg-card p-5">
        <p className="text-xs font-medium text-muted-foreground">1 of 2</p>
        <div>
          <p className="font-heading text-subsection">{HERS.eventName}</p>
          <p className="text-xs text-muted-foreground">{metaLine(HERS)}</p>
        </div>
        <div className="flex gap-1.5">
          {HERS_PHOTOS.map((url, i) => (
            <Thumb key={i} url={url} size={56} />
          ))}
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" size="sm">
            Not mine
          </Button>
          <Button type="button" size="sm">
            Claim
          </Button>
        </div>
      </div>
    </div>
  );
}

export function ChecklistTicket() {
  const [decisions, decide] = useDecisions();
  return (
    <Card>
      <CardHeader>
        <CardTitle>{TICKET_HEADING}</CardTitle>
        <CardDescription>{TICKET_DESCRIPTION}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {CLAIMABLE_ROWS.map((row) => {
          const photos = row.eventId === HERS.eventId ? HERS_PHOTOS : IMPOSTOR_PHOTOS;
          return (
            <div
              key={row.eventId}
              className="space-y-2 border-b border-border/60 pb-4 last:border-0 last:pb-0"
            >
              <TicketRow
                row={row}
                decision={decisions[row.eventId]}
                onDecide={decide}
              />
              <div className="flex gap-1.5">
                {photos.map((url, i) => (
                  <Thumb key={i} url={url} size={40} />
                ))}
              </div>
            </div>
          );
        })}
      </CardContent>
      <CardFooter className="justify-end gap-2">
        <Button type="button" variant="outline" size="sm">
          Claim all
        </Button>
        <Button type="button" size="sm">
          Finish
        </Button>
      </CardFooter>
    </Card>
  );
}

/* ── `confirm`: the dialog, the inline turn, the second screen ───────────── */

export function ConfirmDialog() {
  return (
    <>
      <Scrim />
      <div
        className={cn(
          "fixed top-1/2 left-1/2 z-50 grid w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 gap-4 p-4 text-sm sm:max-w-sm",
          floatingPanel,
        )}
      >
        <div className="flex flex-col gap-2">
          <p className="font-heading text-card-title font-medium text-foreground">
            {confirmDeleteTitle(IMPOSTOR.uploadCount, 1)}
          </p>
          <p className="text-sm text-muted-foreground">{IMPOSTOR.eventName}</p>
        </div>
        <DialogFoot actionLabel="Delete and finish" />
      </div>
    </>
  );
}

export function ConfirmInlineTicket() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{TICKET_HEADING}</CardTitle>
        <CardDescription>{TICKET_DESCRIPTION}</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          <li className="flex flex-col gap-2 py-1 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">
                {HERS.eventName}
              </p>
              <p className="text-xs text-muted-foreground">{metaLine(HERS)}</p>
            </div>
            <Button type="button" size="sm">
              Claim
            </Button>
          </li>
          <li className="flex flex-col gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-destructive">
                {IMPOSTOR.eventName}
              </p>
              <p className="text-xs text-destructive/80">
                {IMPOSTOR.uploadCount} photos and videos will be removed
              </p>
            </div>
            <Button type="button" variant="destructive" size="sm">
              Delete and finish
            </Button>
          </li>
        </ul>
      </CardContent>
      <CardFooter className="justify-end gap-2">
        <Button type="button" variant="outline" size="sm">
          Claim all
        </Button>
        <Button type="button" size="sm">
          Finish
        </Button>
      </CardFooter>
    </Card>
  );
}

export function ConfirmSecondScreen() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{IMPOSTOR.eventName}</CardTitle>
        {/* One expression, not JSX text split across lines: a multi-line JSX
            text child right after {`{`}IMPOSTOR.uploadCount{`}`} was
            compiling away the space between the number and the next word. */}
        <CardDescription>
          {`${IMPOSTOR.uploadCount} photos and videos will be removed. Tom’s Leaving Do is already yours.`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2">
          {IMPOSTOR_PHOTOS.map((url, i) => (
            <Thumb key={i} url={url} size={72} />
          ))}
        </div>
      </CardContent>
      <CardFooter className="justify-end gap-2">
        <Button type="button" variant="outline" size="sm">
          Go back
        </Button>
        <Button type="button" variant="destructive" size="sm">
          Delete and finish
        </Button>
      </CardFooter>
    </Card>
  );
}

/* ── the dashboard ground `ticket`, `pass`, `confirm` and `after` all share ─ */

/**
 * ★ THE GUEST MARK, IN PLACE OF THE RETIRED SAVE BOOKMARK. Tonight's ruling:
 * a person is a guest of an event only through an upload, never a save, so no
 * board draws `EventCard`'s `saved` variant again (`guest-by-upload` is
 * retiring it from production the same night). This is `EventCard`'s own
 * `hosted` variant, which carries no QR chip and no pending chip (nothing
 * that claims Priya runs the event), with a small local marker laid over its
 * top-left corner instead of the bookmark that used to sit there.
 */
function GuestMark() {
  return (
    <span
      className={cn(
        "pointer-events-none absolute top-2.5 left-2.5 z-10 flex h-5 items-center rounded-full px-2 text-[10px] font-medium text-white",
        GLASS_MARK,
      )}
    >
      Guest
    </span>
  );
}

function LocalGuestCard({
  href,
  name,
  coverUrl,
  dateLabel,
  byline,
}: {
  href: string;
  name: string;
  coverUrl: string;
  dateLabel: string;
  byline: string;
}) {
  return (
    <div className="relative">
      <EventCard
        href={href}
        name={name}
        coverUrl={coverUrl}
        dateLabel={dateLabel}
        variant="hosted"
        byline={byline}
      />
      <GuestMark />
    </div>
  );
}

/** Maya and Jay's wedding: the guest event already on Priya's dashboard
 *  before this ticket, counted the moment her confirmed upload landed. */
export function GuestEventCard() {
  return (
    <LocalGuestCard
      href={`/e/${CURRENT_EVENT.hostSlug}-jay`}
      name={CURRENT_EVENT.name}
      coverUrl={CURRENT_EVENT_COVER}
      dateLabel={CURRENT_EVENT.date}
      byline={`Hosted by ${CURRENT_EVENT.host}`}
    />
  );
}

/** Tom's leaving do, the instant Finish settles it into Your events like any
 *  other guest card: `after`'s own baseline now (tonight's ruling), since a
 *  claimed event no longer leaves the dashboard unchanged. */
export function ClaimedEventCard() {
  return (
    <LocalGuestCard
      href={`/e/${HERS.eventId}`}
      name={HERS.eventName}
      coverUrl={CLAIMED_COVER}
      dateLabel={formatEventDate(HERS.eventDate!)}
      byline={`${HERS.uploadCount} photos`}
    />
  );
}

export function DashboardScene({
  ticket,
  overlay,
  dim = false,
  headerExtra,
  extraCard,
}: {
  ticket?: ReactNode;
  overlay?: ReactNode;
  dim?: boolean;
  headerExtra?: ReactNode;
  /** A second card in Your events, once Finish has settled a claim there
   *  (the `after` ask's own baseline: a claimed event joins Your events as an
   *  ordinary Guest card, tonight's ruling, not a dashboard left unchanged). */
  extraCard?: ReactNode;
}) {
  return (
    <div className="relative min-h-full">
      <AppShell
        headerActions={
          <span className="flex items-center gap-1">
            {headerExtra}
            <Avatar size="sm" seed={PRIYA.seed}>
              <AvatarFallback className="text-[10px]">
                {PRIYA.name.slice(0, 1).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </span>
        }
      >
        <div className={cn("space-y-6", dim && "pointer-events-none opacity-40")}>
          {ticket}
          <div className="space-y-3">
            <h2 className="text-xs font-semibold tracking-[0.08em] text-muted-foreground uppercase">
              Your events
            </h2>
            <ul className="grid gap-4 sm:grid-cols-2">
              <li>
                <GuestEventCard />
              </li>
              {extraCard && <li>{extraCard}</li>}
            </ul>
          </div>
        </div>
      </AppShell>
      {overlay}
    </div>
  );
}

/* ── `after`: the toast, its second line, and the claimed strip ──────────── */

export function AfterToastLines({ withProfile }: { withProfile: boolean }) {
  const claimed = HERS.uploadCount;
  return (
    <ToastVisual
      lines={[
        `Added ${claimed} photo${claimed === 1 ? "" : "s"} to your account.`,
        ...(withProfile
          ? [
              <span
                key="profile"
                className="text-foreground underline underline-offset-4"
              >
                Choose what shows on your page
              </span>,
            ]
          : []),
      ]}
    />
  );
}

export function ClaimedStrip() {
  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold tracking-[0.08em] text-muted-foreground uppercase">
        Just claimed
      </p>
      <ul className="grid gap-4 sm:grid-cols-2">
        <li>
          <ClaimedEventCard />
        </li>
      </ul>
    </div>
  );
}
