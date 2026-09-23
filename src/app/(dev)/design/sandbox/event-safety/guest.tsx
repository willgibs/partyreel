"use client";

import { type CSSProperties, type ReactNode } from "react";
import { Check, Clock, DoorClosed, Lock, QrCode } from "lucide-react";

import { MediaTile, type GridMedia } from "@/components/app/media-grid";
import { GuestBar } from "@/components/guest/guest-bar";
import { GhostRiver } from "@/components/guest/gallery-empty-state";
import { Logo } from "@/components/shared/logo";
import { GALLERY_COLUMNS } from "@/components/shared/masonry";
import { HelpLine, NotFoundScreen } from "@/components/shared/not-found-screen";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { ALBUM, EVENT, HOST } from "./fixtures";
import type { ScreenId } from "./scene";

/**
 * THE GUEST'S SIDE: every door a block or a closed album puts in front of a
 * person, and the album a refusal closes. Quoted, never mounted: the guest
 * header resolves a session on mount and the door is a vaul drawer, and
 * neither may reach the network or portal out of the frame. The shipped
 * `NotFoundScreen`, `GuestBar` and `GhostRiver` are the real components, since
 * all three are presentational.
 *
 * ★ THE WORDS ON EVERY CLOSED DOOR ARE PLACEHOLDERS (the brief: "judged for
 * size and tone, not final copy"), and none of them is one of `voice-guest`'s
 * seven lines. What IS decided here is the door's form, where it stands and
 * what it gives away; the line itself is the size a plain sentence takes.
 *
 * ★ NOTHING REAL STANDS BEHIND A CLOSED OR WAITING DOOR (the board's
 * `nothing-behind` call): the ghost river a password page draws, never the
 * teaser's nine photographs. A door that exists to keep an album closed does
 * not open a window onto it.
 */

/** Who the header says this device is. */
type Who = { kind: "stranger" } | { kind: "member"; name: string; seed: string };

/** The guest header, quoted (`guest-header.tsx`): the logo, then who this is. */
export function GuestTop({ who = { kind: "stranger" } }: { who?: Who }) {
  return (
    <header className="flex items-center justify-between gap-2 border-b border-border/60 px-5 py-3">
      <Logo />
      <div className="flex h-8 items-center">
        {who.kind === "stranger" ? (
          <Button variant="ghost" size="sm" tabIndex={-1}>
            Start for free
          </Button>
        ) : (
          <Avatar size="sm" seed={who.seed}>
            <AvatarFallback className="text-[10px]">
              {who.name.slice(0, 1)}
            </AvatarFallback>
          </Avatar>
        )}
      </div>
    </header>
  );
}

/** The event's own heading: the name, and the host's byline where it is shown. */
function EventHead({ byline = true }: { byline?: boolean }) {
  return (
    <div>
      <p className="font-heading text-page text-balance">{EVENT.name}</p>
      {byline && (
        <p className="mt-2.5 flex items-center gap-2 text-xs text-muted-foreground">
          <span className="text-faint">Hosted by</span>
          <Avatar seed={HOST.seed} size="sm">
            <AvatarFallback>{HOST.first.slice(0, 1)}</AvatarFallback>
          </Avatar>
          <span className="font-medium text-foreground">{HOST.first}</span>
          <span aria-hidden className="text-faint">
            ·
          </span>
          <span>{EVENT.date}</span>
        </p>
      )}
    </div>
  );
}

/** The album on the ruled column rule, as a guest holds it. */
function Album({ items }: { items: readonly GridMedia[] }) {
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

/** The album page a guest already inside holds: the header, the heading, the album. */
export function GuestAlbum({
  who,
  overlay,
}: {
  who: Who;
  overlay?: ReactNode;
}) {
  return (
    <div className="min-h-full bg-background text-foreground">
      <GuestTop who={who} />
      <div className="space-y-5 px-5 pt-6 pb-10">
        <EventHead />
        <Album items={ALBUM} />
      </div>
      {overlay}
    </div>
  );
}

/* ── the three forms a closed door can take ───────────────────────────────── */

/** The words a closed door says: a title and one plain line, measured as one. */
export type DoorWords = { title: string; line: string };

/** The blocked door's placeholder words, shared by every form that says them. */
export const CLOSED: DoorWords = {
  title: "This album is closed",
  line: "It isn't open to visitors right now.",
};

/**
 * THE PRIVATE ALBUM'S LOCKED SCREEN (`e/[token]/page.tsx`'s private branch): the
 * not-found family wearing a lock, under the real header, one link home.
 * `below` is what an option adds under the actions (the way back in for
 * someone already a guest).
 */
export function LockedScreen({
  words,
  below,
  notice,
}: {
  words: DoorWords;
  below?: ReactNode;
  /** A line above the lock, for the moment a visit ends here. */
  notice?: ReactNode;
}) {
  return (
    <div className="flex min-h-svh flex-col bg-background text-foreground">
      <GuestTop />
      <main className="flex flex-1 flex-col items-center justify-center gap-6 px-5 py-20">
        {notice}
        <NotFoundScreen
          icon={Lock}
          title={words.title}
          description={<span data-es-line>{words.line}</span>}
          actions={
            <Button size="cta" variant="outline" tabIndex={-1}>
              What is Partyreel?
            </Button>
          }
          footnote={below}
        />
      </main>
    </div>
  );
}

/**
 * THE DEAD LINK (`e/[token]/not-found.tsx`), word for word: the page a
 * mistyped QR meets. Its own words are the ones a blocked person would read,
 * which is this option's whole cost: it tells them the host may have deleted
 * the album and to ask the host to resend it.
 */
export function DeadLink({ notice }: { notice?: ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col bg-background text-foreground">
      <GuestBar />
      <main className="flex flex-1 flex-col items-center justify-center gap-6 px-5 py-20">
        {notice}
        <NotFoundScreen
          icon={QrCode}
          eyebrow="Event link"
          title="This event link didn't work"
          description={
            <span data-es-line>
              The link may be mistyped, or the host may have deleted the event.
              Double-check the QR code or link, or ask the host to resend it.
            </span>
          }
          actions={
            <Button size="cta" tabIndex={-1}>
              What is Partyreel?
            </Button>
          }
          help={<HelpLine href="/help">Visit the help center</HelpLine>}
        />
      </main>
    </div>
  );
}

/**
 * THE DOOR ITSELF, HELD (`entry-shell.tsx`'s two postures): a bottom drawer in
 * a hand, a full-height side panel at a desk, no handle and no close, over
 * the page with the ghost river behind (or, mid-visit, the album the door has
 * just closed over, blurred by the overlay).
 */
export function HeldDoor({
  screen,
  behind = "river",
  who,
  children,
}: {
  screen: ScreenId;
  behind?: "river" | "album";
  who?: Who;
  children: ReactNode;
}) {
  const phone = screen === "375";
  return (
    <div className="min-h-full bg-background text-foreground">
      <GuestTop who={who} />
      {behind === "album" ? (
        <div className="space-y-5 px-5 pt-6 pb-10">
          <EventHead />
          <Album items={ALBUM} />
        </div>
      ) : (
        <div className="px-5 pt-6">
          <EventHead byline={false} />
          <div className="mt-8">
            <GhostRiver />
          </div>
        </div>
      )}
      <div className="fixed inset-0">
        <div className="absolute inset-0 bg-black/10 supports-backdrop-filter:backdrop-blur-xs" />
        <div
          data-es-door={phone ? "phone" : "desk"}
          className={
            phone
              ? "fixed inset-x-0 bottom-0 flex max-h-[85svh] flex-col overflow-y-auto rounded-t-float bg-popover px-6 pt-3 pb-6 text-sm text-popover-foreground shadow-layer ring-1 ring-foreground/10"
              : "fixed inset-y-0 right-0 flex h-full w-3/4 max-w-md flex-col overflow-y-auto border-l border-border bg-popover p-6 text-sm text-popover-foreground shadow-layer"
          }
        >
          <div className="relative pt-1">{children}</div>
        </div>
      </div>
    </div>
  );
}

/** A door step's own furniture: the eyebrow, the title on the page step, the line. */
export function DoorStep({
  Icon = DoorClosed,
  eyebrow,
  words,
  children,
}: {
  Icon?: typeof DoorClosed;
  eyebrow: string;
  words: DoorWords;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-5 py-4 text-center">
      <div>
        <p className="flex items-center justify-center gap-1.5 text-label font-medium text-muted-foreground uppercase">
          <Icon className="size-3" aria-hidden />
          {eyebrow}
        </p>
        <p className="mt-1.5 font-heading text-page text-balance">{words.title}</p>
        <p
          data-es-line
          className="mx-auto mt-2 max-w-xs text-base leading-relaxed text-muted-foreground"
        >
          {words.line}
        </p>
      </div>
      {children}
    </div>
  );
}

/** The door's success hold (`SuccessStep`), for someone the list lets straight in. */
export function InStep({ line }: { line: string }) {
  return (
    <div className="flex flex-col items-center gap-4 py-8 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-success text-success-foreground">
        <Check className="size-7" aria-hidden />
      </div>
      <div>
        <p className="font-heading text-page">You&rsquo;re in</p>
        <p className="mt-1 text-base text-muted-foreground">{line}</p>
      </div>
    </div>
  );
}

/** A quiet line and its link, under a door's actions. */
export function QuietWay({ lead, link }: { lead: string; link: string }) {
  return (
    <p className="text-sm text-muted-foreground">
      {lead}{" "}
      <span className="font-medium text-foreground underline underline-offset-4">
        {link}
      </span>
    </p>
  );
}

/** The waiting door's live mark: still, so reduced motion has nothing to stop. */
export function WaitingMark({ label }: { label: string }) {
  return (
    <span className="mx-auto flex items-center gap-2 rounded-full border border-border bg-muted/50 px-3 py-1.5 text-xs text-muted-foreground">
      <Clock className="size-3.5" aria-hidden />
      {label}
    </span>
  );
}

/**
 * THE FAILURE SHEET, QUOTED (`upload/failure-sheet.tsx`) for the one refusal a
 * block causes mid-visit. Its heading is today's; the reason is the server's
 * own sentence, as the sheet always prints it; there is nothing to retry, so
 * the one button is Close. Its words are `voice-guest.failed`'s to settle.
 */
export function RefusedSheet({
  screen,
  reason,
}: {
  screen: ScreenId;
  reason: string;
}) {
  return (
    <>
      <div className="es-scrim" />
      <div className="es-sheet" data-screen={screen} data-es-sheet>
        <div className="flex flex-col gap-0.5 p-4">
          <p className="font-heading text-card-title font-medium text-foreground">
            1 file did not go
          </p>
        </div>
        <div className="flex items-center gap-3 px-4">
          <span
            className="size-11 shrink-0 overflow-hidden bg-black/10"
            style={{ borderRadius: "var(--radius-tile)" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- a local still standing in for the guest's own pick */}
            <img src={ALBUM[3].url} alt="" className="size-full object-cover" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-reading font-medium">IMG_2231.jpg</span>
            <span data-es-line className="block text-reading text-pretty text-muted-foreground">
              {reason}
            </span>
          </span>
        </div>
        <div className="mt-auto flex flex-col gap-2 p-4">
          <Button size="lg" variant="outline" className="w-full" tabIndex={-1} data-es-reach>
            Close
          </Button>
        </div>
      </div>
    </>
  );
}

/** A line over the lock for the moment a visit ends at it. */
export function EndedNotice({ text }: { text: string }) {
  return (
    <p
      className={cn(
        "rounded-full border border-border bg-muted/50 px-3 py-1.5 text-xs text-muted-foreground",
      )}
    >
      {text}
    </p>
  );
}
