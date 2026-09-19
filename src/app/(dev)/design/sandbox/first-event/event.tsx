"use client";

import { type ReactNode } from "react";
import {
  Check,
  Copy,
  Eye,
  Globe,
  ImageOff,
  Images,
  Mail,
  QrCode,
  Users,
} from "lucide-react";

import { FeedSectionEmpty } from "@/components/app/event-feed/feed-section-empty";
import { MediaTile } from "@/components/app/media-grid";
import { PageHeading } from "@/components/shared/page-heading";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { Code, type Size } from "./frame";
import { EVENT, FIRST, FIRST_BY, HOST, JOIN_URL } from "./fixtures";

/**
 * WATCHING IT FILL: the event's page in the days before the first photograph,
 * and the moment one lands.
 *
 * ★ THE PAGE IS DRAWN IN app-shape's RECOMMENDED SHAPE, AND NEVER RE-ASKED.
 * That round is on the desk with `event=album` ("one line of identity, then the
 * photographs to the window") and `share=front` ("the code and the link sit in
 * the event's own header"), so this board wears both: the header carries the
 * code, and the album owns the rest of the page. The two decisions here are
 * about what fills that album's room before any photograph exists and what
 * happens when one arrives, which is a question app-shape never asked. If Will
 * rules the event page differently, these options redraw inside whatever he
 * picked; none of them depends on the album being the page.
 *
 * The shipped bar stands above all of it because navigation is app-shape's
 * question too, and drawing a candidate for it here would be this board
 * answering one it was told not to ask.
 */

/* ── The axes ────────────────────────────────────────────────────────────── */

/** What the event's page says before any photograph. */
export type Empty = "none" | "list" | "code";
export const emptyOf = (v: string | undefined): Empty =>
  v === "none" || v === "code" ? v : "list";

/** What marks a guest's first photograph for the host. */
export type First = "reload" | "live" | "tell";
export const firstOf = (v: string | undefined): First =>
  v === "reload" || v === "tell" ? v : "live";

/* ── The event's own header, with the code in it ─────────────────────────── */

/**
 * The identity line and the code, as app-shape's `share=front` puts them: the
 * thing a host came to get, on the page they are already on, at 232 px on a
 * laptop and at the column's width in a hand.
 */
export function EventHeader({
  size,
  counts = { items: 0, guests: 0, views: 0 },
  code = true,
}: {
  size: Size;
  counts?: { items: number; guests: number; views: number };
  /**
   * ★ THE HEADER'S CODE RETIRES WHEN SOMETHING ELSE ON THE PAGE IS THE CODE.
   * Reading the first captures caught the page drawing it twice under the
   * full-bleed empty state: 232 px in the header and 420 px in the album's
   * room, one above the other, which makes the option look like a mistake
   * rather than an argument. One code per page, at the size that page needs.
   */
  code?: boolean;
}) {
  const phone = size === "phone";
  return (
    <div
      className={cn(
        "flex gap-6",
        phone ? "flex-col" : "items-start justify-between",
      )}
    >
      <div className="min-w-0 space-y-2">
        <PageHeading>{EVENT.name}</PageHeading>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
          <span>{EVENT.dateLabel}</span>
          <span className="flex items-center gap-1.5">
            <Images className="size-3.5" />
            {counts.items}
          </span>
          <span className="flex items-center gap-1.5">
            <Users className="size-3.5" />
            {counts.guests}
          </span>
          <span className="flex items-center gap-1.5">
            <Eye className="size-3.5" />
            {counts.views}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="flex items-center gap-1.5 rounded-full border border-border px-2 py-1 text-muted-foreground">
            <Globe className="size-3" /> Public
          </span>
          <span className="flex items-center gap-1.5 rounded-full border border-border px-2 py-1 text-muted-foreground">
            Open for uploads
          </span>
        </div>
      </div>
      <div
        className={cn(
          "flex shrink-0 gap-4",
          phone ? "items-center" : "flex-col items-end",
        )}
      >
        {code && <Code size={phone ? 132 : 232} value={JOIN_URL} pad="p-3" />}
        <div className={cn("space-y-2", phone ? "min-w-0" : "w-56")}>
          <LinkRow />
          <Button variant="outline" size="sm" className="w-full">
            <QrCode /> Print and share
          </Button>
        </div>
      </div>
    </div>
  );
}

/** The shipped copy-link row's shape, inert: pressing the real one writes the
 *  reviewer's own clipboard, and a board is not worth a stray paste. */
function LinkRow() {
  return (
    <div className="flex items-center gap-1.5 rounded-md border border-border px-2 py-1.5">
      <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
        {JOIN_URL.replace("https://", "")}
      </span>
      <Copy className="size-3.5 shrink-0 text-muted-foreground" />
    </div>
  );
}

/* ── The album's room, before anything is in it ──────────────────────────── */

/**
 * TODAY: the shipped `FeedSectionEmpty` under a section header, word for word.
 * It states a fact the host already knows and names a button ("the button
 * above") that the event page's Add strip owns.
 */
function EmptyNone() {
  return (
    <Section title="Gallery" count="0 items">
      <FeedSectionEmpty
        icon={ImageOff}
        title="No uploads yet"
        desc="Add photos with the button above, or share the QR code with guests."
      />
    </Section>
  );
}

/**
 * A LAUNCH LIST. The empty event is the one screen where the host still has
 * work and the app knows exactly what it is: the code is downloaded or it is
 * not, the link has been opened by somebody or it has not, one photograph has
 * landed or it has not. Three facts the app already holds, turned into the
 * three things that stand between here and a full album.
 */
function EmptyList({ size }: { size: Size }) {
  return (
    <Section title="Before the first photo" count="1 of 3 done">
      <ol className="mx-auto max-w-xl space-y-2 py-2">
        <Task done title="Your code is ready" note="Classic, downloaded twice." />
        <Task
          title="Put it where guests are"
          note="Nine table cards, a welcome sign or a poster."
          action="Print the cards"
        />
        <Task
          title="Wait for the first photo"
          note="Nobody has opened the link yet. Test it yourself if you like."
          action="Open as a guest"
        />
      </ol>
      {size === "laptop" && (
        <p className="pb-2 text-center text-sm text-muted-foreground">
          The album takes this room back the moment a photograph lands.
        </p>
      )}
    </Section>
  );
}

function Task({
  done = false,
  title,
  note,
  action,
}: {
  done?: boolean;
  title: string;
  note: string;
  action?: string;
}) {
  return (
    <li className="flex items-start gap-3 rounded-xl border border-border p-4">
      <span
        className={cn(
          "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full",
          done
            ? "bg-foreground text-background"
            : "border border-border text-transparent",
        )}
      >
        <Check className="size-3" />
      </span>
      <span className="min-w-0 flex-1 space-y-0.5">
        <span
          className={cn(
            "block text-sm font-medium",
            done && "text-muted-foreground line-through",
          )}
        >
          {title}
        </span>
        <span className="block text-sm text-muted-foreground">{note}</span>
      </span>
      {action && (
        <Button variant="outline" size="sm" className="shrink-0">
          {action}
        </Button>
      )}
    </li>
  );
}

/**
 * THE CODE TAKES THE ROOM. The album's space belongs to the album, and until
 * there is one it belongs to the only thing that makes one: the code, at the
 * biggest a screen can carry it, ready to be held out to a phone. It shrinks
 * back into the header the instant a photograph lands.
 */
function EmptyCode({ size }: { size: Size }) {
  const edge = size === "phone" ? 300 : 420;
  return (
    <Section title="Gallery" count="0 items">
      <div className="flex flex-col items-center gap-5 py-8">
        <Code size={edge} value={JOIN_URL} pad="p-6" radius="rounded-2xl" />
        <div className="space-y-1 text-center">
          <p className="text-sm font-medium">
            Hold this up, or put it on the tables.
          </p>
          <p className="max-w-sm text-sm text-muted-foreground">
            The first photo takes this space back. Nothing here needs you until
            then.
          </p>
        </div>
      </div>
    </Section>
  );
}

/* ── The first photograph ────────────────────────────────────────────────── */

/**
 * TODAY: nothing. The guest album has a doorbell that polls and moves the
 * gallery under a guest's thumb; the host's page has none, so Marta's
 * photograph exists on the server and not on this screen until Rosa reloads.
 */
function FirstReload({ empty, size }: { empty: Empty; size: Size }) {
  return <EmptyRoom empty={empty} size={size} />;
}

/** IT LANDS WHILE SHE IS LOOKING: the empty room gives way to one tile. */
function FirstLive({ size }: { size: Size }) {
  return (
    <Section
      title="Gallery"
      count="1 item"
      pip={
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="size-1.5 rounded-full bg-success" />
          Live
        </span>
      }
    >
      {/* ★ ONE TILE. The first draft put four faint ones behind it, meaning
          "the next four minutes", and reading the capture caught what that
          actually shows: an album with five photographs in it on the step
          asking about the FIRST. The moment is one photograph landing in a
          room that was empty a second ago, so the room stays empty around
          it. */}
      <div className="space-y-3 py-2">
        <p className="text-sm text-muted-foreground">
          {FIRST_BY} added the first photo, just now.
        </p>
        <span
          className={cn(
            "relative block aspect-[3/4] overflow-hidden rounded-lg ring-2 ring-brand",
            size === "phone" ? "w-40" : "w-56",
          )}
        >
          <MediaTile item={FIRST} />
        </span>
      </div>
    </Section>
  );
}

/**
 * THE APP GOES AND FINDS HER. Drawn as the MESSAGE itself, because that is the
 * whole of the option: a host at the top table is not looking at a browser, and
 * the only design decision is what the sentence on her lock screen says.
 *
 * ★ A PUSH OR AN EMAIL IS A PRODUCT-DEFINING CAPABILITY, not a look: web push
 * needs a permission prompt, a service worker and a subscription store; an
 * unrequested email needs a preference and an unsubscribe. Drawn here so Will
 * can judge the moment; flagged in the manifest's Questions so the capability
 * is his call and not a design board's.
 */
function FirstTell({ size }: { size: Size }) {
  return (
    <div
      className={cn(
        "flex gap-6 py-4",
        size === "phone" ? "flex-col" : "items-start",
      )}
    >
      <LockScreen />
      <div className="min-w-0 flex-1 space-y-3">
        <p className="text-sm text-muted-foreground">
          And the same moment as an email, for a host who turned the push down
          or never saw it.
        </p>
        <div className="max-w-lg overflow-hidden rounded-xl border border-border">
          <div className="flex items-center gap-3 border-b border-border px-4 py-3">
            <span className="flex size-8 items-center justify-center rounded-full bg-muted">
              <Mail className="size-4 text-muted-foreground" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">
                The first photo is in
              </p>
              <p className="truncate text-xs text-muted-foreground">
                Partyreel · to {HOST.name.split(" ")[0].toLowerCase()}
                @delgado.co
              </p>
            </div>
          </div>
          <div className="flex gap-3 p-4">
            <span className="block h-24 w-20 shrink-0 overflow-hidden rounded-md">
              <MediaTile item={FIRST} />
            </span>
            <div className="space-y-2">
              <p className="text-sm">
                {FIRST_BY} just added the first photo to {EVENT.name}.
              </p>
              <Button size="sm" variant="outline">
                See the album
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** The sentence on a phone that is face down on a table. */
function LockScreen() {
  return (
    <div className="w-[17rem] shrink-0 overflow-hidden rounded-[2rem] bg-neutral-900 p-3 pt-10 pb-8 text-white shadow-lift">
      <p className="text-center text-5xl font-light tabular-nums">9:41</p>
      <p className="mt-1 text-center text-xs text-white/60">
        Saturday, 11 October
      </p>
      <div className="mt-6 rounded-2xl bg-white/15 p-3 backdrop-blur">
        <p className="text-[11px] tracking-wide text-white/70">PARTYREEL</p>
        <p className="mt-1 text-sm font-medium">The first photo is in</p>
        <p className="text-sm text-white/80">
          {FIRST_BY} added one to {EVENT.name}.
        </p>
      </div>
    </div>
  );
}

/* ── The compositions the board presses ──────────────────────────────────── */

/** The album's room, whichever empty option is worn. */
function EmptyRoom({ empty, size }: { empty: Empty; size: Size }) {
  if (empty === "none") return <EmptyNone />;
  if (empty === "code") return <EmptyCode size={size} />;
  return <EmptyList size={size} />;
}

/** The whole page: the header with the code, then the album's room. */
export function EventPage({
  empty,
  first,
  size,
  filled = false,
}: {
  empty: Empty;
  first: First;
  size: Size;
  /** Draw the first-photograph world rather than the waiting one. */
  filled?: boolean;
}) {
  const counts =
    filled && first !== "reload"
      ? { items: 1, guests: 1, views: 9 }
      : { items: 0, guests: 0, views: 8 };
  // ★ THE MESSAGE OPTION HAS NO PAGE, because its whole argument is that she is
  // not looking at one. Reading the first captures caught the lock screen and
  // the email sitting under the event's own header, which quietly said she was
  // at her laptop the whole time.
  if (filled && first === "tell")
    return (
      <div className="space-y-6">
        <p className="text-sm text-muted-foreground">
          She is at the top table with her phone face down. Nothing on any
          screen she owns is open. This is what reaches her.
        </p>
        <FirstTell size={size} />
      </div>
    );
  return (
    <div className="space-y-8">
      <EventHeader
        size={size}
        counts={counts}
        code={!(!filled && empty === "code")}
      />
      {!filled && <EmptyRoom empty={empty} size={size} />}
      {filled && first === "reload" && <FirstReload empty={empty} size={size} />}
      {filled && first === "live" && <FirstLive size={size} />}
    </div>
  );
}

/** The shipped feed's section header shape: a name, a count, an optional pip. */
function Section({
  title,
  count,
  pip,
  children,
}: {
  title: string;
  count: string;
  pip?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-3 border-b border-border pb-2">
        <h2 className="font-heading text-subsection">{title}</h2>
        <span className="text-sm text-muted-foreground">{count}</span>
        {pip && <span className="ml-auto">{pip}</span>}
      </div>
      {children}
    </section>
  );
}
