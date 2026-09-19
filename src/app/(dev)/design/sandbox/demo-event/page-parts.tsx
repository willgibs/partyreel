"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { Bookmark, ImageUp, QrCode, Sparkles } from "lucide-react";

import { GuestMasonry } from "@/components/guest/guest-masonry";
import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import { cn, formatEventDate } from "@/lib/utils";

import { ADDED, DEMO, type Party } from "./fixtures";

/**
 * THE DEMO'S PAGE, IN PARTS, SO ONE PART AT A TIME CAN MOVE.
 *
 * Every picture on this board is the shipped `/e/<token>` page running in demo
 * mode at a real screen, with exactly one axis changed. That is what makes
 * seven questions one board rather than seven boards in a coat: the framing is
 * judged on the arrival that was picked, the way out on the try that was
 * picked, and the album underneath all of them never moves.
 *
 * ★ WHAT IS THE SHIPPED COMPONENT AND WHAT IS QUOTED. The album
 * (`GuestMasonry`, and through it `MediaTile`, the shared `GALLERY_COLUMNS`
 * rule and the lightbox), the wordmark (`Logo`) and every button (`Button`)
 * are imported and wrapped, never edited. Two things are QUOTED from their
 * shipped source with their classNames copied, and each has a reason that is a
 * landmine rather than a preference:
 *
 *  1. `guest-header.tsx` resolves the visitor's Supabase session on mount, so
 *     in a lab frame it would draw whatever the author happens to be signed in
 *     as and fetch `/api/me/menu` once per frame on the stage.
 *  2. `event-experience.tsx` is the page's own shell: it wants a gallery
 *     PROMISE, four imperative handles and a router, and the thing this board
 *     asks about is the composition, not the plumbing under it.
 *
 * Nothing quoted carries a rule of its own: the tokens, the type steps, the
 * corners and the material are all read from the real sheet the frame copies.
 */

/* ── the screens ─────────────────────────────────────────────────────────── */

export const SCREENS = {
  "1440": { w: 1440, h: 900, name: "a laptop" },
  "375": { w: 375, h: 812, name: "a phone" },
} as const;
export type ScreenId = keyof typeof SCREENS;

/**
 * Board state arrives as strings. ★ THE FALLBACK IS THE LAPTOP, which is the
 * one line that makes this board the inverse of `guest-shape`: everybody who
 * opens the demo followed a link that said "try the live demo", and they are
 * at a desk.
 */
export const screenOf = (v: string | undefined): ScreenId =>
  v === "375" ? "375" : "1440";

/**
 * ★ THE WORDS KEEP THE COLUMN, THE PHOTOGRAPHS DO NOT. `gallery-wiring` landed
 * the rule on 2026-09-19 as two constants in `event-experience.tsx`: COLUMN is
 * `w-full max-w-2xl px-5`, 632px of measure pinned LEFT so its first letter
 * lands on the same 20px line as the logo above it and the album's first
 * column below it; BLEED is the gutter alone, and the window decides the rest.
 * These are those two, quoted, so no option here is secretly re-deciding a
 * width that was answered on 2026-09-18.
 */
const COLUMN = "w-full max-w-2xl px-5";
const BLEED = "px-5";

/* ── the top bar ─────────────────────────────────────────────────────────── */

/**
 * `guest-header.tsx`, quoted: the wordmark, and the one Partyreel sentence a
 * host's event carries. The CTA is held constant across every option except
 * the one decision that asks about it (`next`), so nothing here is secretly a
 * decision about the growth hook.
 */
export function TopBar({
  mark = false,
  stick = false,
}: {
  /** The `tag` framing: a Demo mark beside the wordmark. */
  mark?: boolean;
  /** The same framing's second half: the header pins to the top of the screen. */
  stick?: boolean;
}) {
  return (
    <header
      data-de-header
      className={cn(
        "flex items-center justify-between gap-2 border-b border-border/60 bg-background px-5 py-3",
        stick && "sticky top-0 z-20",
      )}
    >
      <div className="flex items-center gap-2.5">
        <Logo />
        {mark && (
          <span
            data-de-say
            data-de-mark
            className="rounded-full border border-border bg-muted px-2 py-0.5 text-[11px] font-medium tracking-wide text-muted-foreground uppercase"
          >
            Demo
          </span>
        )}
      </div>
      <div className="flex h-8 items-center">
        <Button variant="ghost" size="sm">
          Start for free
        </Button>
      </div>
    </header>
  );
}

/* ── the demo's own furniture ────────────────────────────────────────────── */

/**
 * The shipped banner, verbatim: the one thing on the page that says "demo".
 *
 * ★ `told` IS THE STAGING MADE REAL. `framing` waits on `arrival`, and the
 * only honest difference an answered arrival makes down here is the WORDS: a
 * visitor who has already been handed a role is being reminded, and one who
 * was dropped straight onto the album is being told for the first time. The
 * shipped sentence is the second case, so it is what `told: false` draws.
 */
export function DemoBanner({ told = false }: { told?: boolean }) {
  return (
    <div
      data-de-say
      className="mb-6 rounded-lg border border-border bg-muted/40 px-3 py-2 text-center text-[13px] text-muted-foreground"
    >
      {told
        ? "A live demo. Nothing you add here is saved."
        : "You’re trying a live demo. Photos you add here aren’t saved."}
    </div>
  );
}

/** The `rail` framing: a strip pinned to the foot, at every scroll position. */
export function DemoRail({ told = false }: { told?: boolean }) {
  return (
    <div
      data-de-say
      data-de-rail
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border/60 bg-background/90 px-5 py-2.5 backdrop-blur-sm"
    >
      <div className="mx-auto flex max-w-2xl items-center justify-between gap-4">
        <p className="text-[13px] text-muted-foreground">
          {told
            ? "A live demo. Nothing here is saved."
            : "A live demo of a real album. Nothing you add here is saved."}
        </p>
        <Button size="sm">Start your own</Button>
      </div>
    </div>
  );
}

/**
 * The `turn`: the sentence the simulated upload currently ends without. It
 * sits directly above the album's first tile, which IS the photograph they
 * just added (the album is newest first), rather than at the foot of the page
 * where nobody who has not scrolled the whole album will meet it.
 */
export function TurnCard() {
  return (
    <div
      data-de-turn
      className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex items-start gap-3">
        <Sparkles className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        <div>
          <p className="text-[15px] font-medium">
            That is what your guests would see.
          </p>
          <p className="mt-0.5 text-[13px] text-muted-foreground">
            On your own event it would be in the album for good.
          </p>
        </div>
      </div>
      <Button className="shrink-0">Start your own</Button>
    </div>
  );
}

/**
 * The `foot`: the closing card, in the slot a real event gives the reel card
 * and the demo currently gives nothing (the report footer is hidden for the
 * demo, so today the album simply stops).
 */
export function ClosingCard({ party }: { party: Party }) {
  return (
    <div
      data-de-close
      className="mt-8 flex flex-col items-center gap-3 rounded-xl border border-border bg-card px-6 py-8 text-center"
    >
      <p className="font-heading text-subsection text-balance">
        Yours would look like this
      </p>
      <p className="max-w-sm text-[15px] text-pretty text-muted-foreground">
        One code, {party.guests} guests, and every photo in one place. Free to
        start, nothing to install.
      </p>
      <Button size="lg" className="mt-1">
        Start your own
      </Button>
    </div>
  );
}

/* ── the event block ─────────────────────────────────────────────────────── */

/** The left-editorial header: the name, the byline, the count, the description. */
export function EventBlock({
  party,
  added = false,
  className,
}: {
  party: Party;
  /** One more photograph, because the visitor just added one. */
  added?: boolean;
  className?: string;
}) {
  const count = party.items.length + (added ? 1 : 0);
  return (
    <header className={className}>
      <h1 className="font-heading text-page text-balance">{party.name}</h1>
      <p className="mt-2.5 flex items-center gap-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="text-faint">Hosted by</span>
          <span className="font-medium text-foreground">{party.host}</span>
        </span>
        <span aria-hidden className="text-faint">
          ·
        </span>
        <span>{formatEventDate(party.date)}</span>
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        {count} photos &amp; videos from {party.guests} guests
      </p>
      <p className="mt-2 max-w-prose text-[15px] text-pretty text-muted-foreground">
        {party.description}
      </p>
    </header>
  );
}

/* ── the actions ─────────────────────────────────────────────────────────── */

/**
 * The shipped action block, and the hole in it.
 *
 * ★ THE EMPTY SPAN IS REAL, NOT A SIMPLIFICATION. `event-experience.tsx`
 * renders `<span aria-hidden />` in the demo where a guest gets Save, because
 * saving an event you cannot keep is a lie. So the demo draws a full-width Add
 * over half a two-column row, and the other half is nothing at all. `slot` is
 * the decision to put something in it.
 */
export function ActionBlock({
  slot = "empty",
  upload = true,
}: {
  slot?: "empty" | "own";
  /** `look` takes the upload away entirely. */
  upload?: boolean;
}) {
  return (
    <div data-de-actions className="mt-4">
      {upload && (
        <Button type="button" size="lg" className="w-full">
          <ImageUp /> Add photos
        </Button>
      )}
      <div className={cn("grid grid-cols-2 gap-2", upload && "mt-2")}>
        {slot === "own" ? (
          <Button type="button" data-de-slot className="h-9 w-full">
            Start your own
          </Button>
        ) : (
          <span aria-hidden data-de-slot />
        )}
        <Button type="button" variant="outline" className="h-9 w-full">
          <QrCode /> Invite
        </Button>
      </div>
      {!upload && (
        <p className="mt-3 text-[13px] text-muted-foreground">
          On a real event, your guests fill this from their phones. Here, it is
          already full.
        </p>
      )}
    </div>
  );
}

/** The Save button a real guest gets, for the one picture that shows it. */
export function SaveButton() {
  return (
    <Button type="button" variant="outline" className="h-9 w-full">
      <Bookmark /> Save
    </Button>
  );
}

/* ── the album ───────────────────────────────────────────────────────────── */

/**
 * The album at whatever the party holds. The width rule is the SHIPPED
 * component's own (`GALLERY_COLUMNS`: two columns at a phone, a 220px column
 * floor from 640 up), and a frame is a real viewport, so it resolves at the
 * screen being judged.
 *
 * `added` prepends the photograph the visitor just put in, which is the one
 * thing the demo's simulated upload really does: an optimistic local tile at
 * the top of the album, with the green check, that nothing ever persists.
 */
export function Album({
  party,
  added = false,
  landing = false,
}: {
  party: Party;
  added?: boolean;
  /** The phone's photograph arriving on the laptop, a second behind. */
  landing?: boolean;
}) {
  const items = added ? [ADDED, ...party.items] : party.items;
  return (
    <div data-de-landing={landing ? "" : undefined}>
      <GuestMasonry items={items} />
    </div>
  );
}

/* ── the whole page ──────────────────────────────────────────────────────── */

/**
 * THE PAGE. It takes no screen: the frame IS the viewport, so the album's
 * shipped column rule, the reading measure and every breakpoint resolve at the
 * width being judged rather than at a prop somebody could set wrong.
 *
 * ★ IT IS A REAL SCROLL CONTAINER, NOT A PAGE PUSHED UP BY A MARGIN. Two
 * decisions are only askable below the fold (`framing` is about what survives
 * the first flick; `try` is about a beat after the album has moved), and a
 * page slid up by a negative margin would draw a `sticky` header in the one
 * place it never is. So the frame's whole height is an overflow-y-auto box and
 * `scrollTo` drives its real scrollTop: the sticky header sticks, the fixed
 * rail pins to the frame's viewport, and the measurement reads true.
 */
export function DemoPage({
  party = DEMO,
  say = "banner",
  slot = "empty",
  upload = true,
  added = false,
  landing = false,
  told = false,
  scrollTo = 0,
  aboveAlbum,
  underAlbum,
  overlay,
  dim = false,
}: {
  party?: Party;
  /** How the page admits it is a demo. */
  say?: "banner" | "tag" | "rail";
  slot?: "empty" | "own";
  upload?: boolean;
  added?: boolean;
  landing?: boolean;
  /** An arrival already explained the demo, so the page reminds rather than tells. */
  told?: boolean;
  /** Where the page is scrolled to when it is judged. */
  scrollTo?: number;
  /** A strip the album carries above its photographs, where the newest one is. */
  aboveAlbum?: ReactNode;
  /** The foot of the page, where a real event puts the report footer. */
  underAlbum?: ReactNode;
  /** A surface standing over the page: an arrival. */
  overlay?: ReactNode;
  dim?: boolean;
}) {
  const box = useRef<HTMLDivElement | null>(null);
  // The scroll is applied after layout AND once more after the photographs
  // decode, because a column of images that has not resolved its heights is
  // shorter than the page it will be and clamps the scroll.
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    el.scrollTop = scrollTo;
    const win = el.ownerDocument.defaultView;
    const late = win?.setTimeout(() => {
      el.scrollTop = scrollTo;
    }, 1200);
    return () => {
      if (late !== undefined) win?.clearTimeout(late);
    };
  }, [scrollTo]);

  return (
    <div className="relative h-screen bg-background text-foreground">
      <div data-de-scroll ref={box} className="h-full overflow-y-auto">
        <TopBar mark={say === "tag"} stick={say === "tag"} />
        <div className={cn("py-8", say === "rail" && "pb-20")}>
          <div className={COLUMN}>
            {say === "banner" && <DemoBanner told={told} />}
            <EventBlock party={party} added={added} />
            <ActionBlock slot={slot} upload={upload} />
          </div>
          <div className="mt-7">
            {/* A card the album carries directly above its first tile. The
                photograph a visitor just added is that tile (the album is
                newest first), so anything said here is said beside it; the
                album itself is one CSS multi-column box and nothing can be
                put in the middle of one. It keeps the ALBUM's box, not the
                words' column, so it lines up with the photographs under it. */}
            {aboveAlbum && <div className={cn(BLEED, "mb-4")}>{aboveAlbum}</div>}
            <div className={BLEED}>
              <Album party={party} added={added} landing={landing} />
            </div>
          </div>
          {underAlbum && <div className={COLUMN}>{underAlbum}</div>}
        </div>
      </div>
      {say === "rail" && <DemoRail told={told} />}
      {dim && <div className="de-scrim" />}
      {overlay}
    </div>
  );
}
