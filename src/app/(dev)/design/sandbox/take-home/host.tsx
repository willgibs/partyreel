"use client";

import type { CSSProperties, ReactNode } from "react";
import {
  Download,
  ImageDown,
  ImageUp,
  ListChecks,
  SlidersHorizontal,
} from "lucide-react";

import { Logo } from "@/components/shared/logo";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { floatingPanel } from "@/components/ui/floating-layer";
import { formatCount } from "@/lib/format/count";
import { cn, formatBytes } from "@/lib/utils";

import { AlbumRows } from "./album";
import { EVENT, HOST, photoAt } from "./fixtures";
import { ALBUM_TAKE, bytesOf, countOf, PHONE_EDGE, type Size } from "./model";
import type { ScreenId } from "./scene";

/**
 * MAYA'S HUB, AT ITS ALBUM, AND THE WAYS SHE TAKES EVERYTHING HOME.
 *
 * Production's hub (`dashboard/[eventId]/page.tsx`, a wide page): the app's
 * bar (`app-shell.tsx`: sticky, the wordmark, her account), then the album's
 * section as `event-gallery.tsx` draws it: the eyebrow and its count
 * (`FeedSectionHeader`, quoted), Add photos, Download, Select and View
 * (`Button` outline sm, the real atom), and the album's rows. The hub's head
 * above the album is `event-header` r2's question, so every frame stands at
 * the album, the page scrolled to it.
 */

/** The app bar (`app-shell.tsx`), quoted: sticky, the wordmark, the trail, her account. */
function AppBar() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
      <div className="flex h-14 items-center gap-4 px-3 sm:px-5">
        <Logo />
        <span className="hidden min-w-0 truncate text-sm text-muted-foreground sm:block">
          {`Events / ${EVENT.name}`}
        </span>
        <span className="ml-auto">
          <Avatar size="sm">
            <AvatarFallback className="text-[10px]">
              {HOST.name.slice(0, 1)}
            </AvatarFallback>
          </Avatar>
        </span>
      </div>
    </header>
  );
}

/**
 * THE ALBUM'S HEADER (`feed-section-header.tsx` and `event-gallery.tsx`):
 * the eyebrow, its count, and her four tools. Download is marked
 * `data-th-way`, the way home this question is about.
 */
function AlbumHead({ menu }: { menu?: ReactNode }) {
  return (
    <div className="flex min-h-7 flex-wrap items-center justify-between gap-3">
      <h2 className="flex items-center gap-1.5">
        <span className="text-label font-semibold text-muted-foreground uppercase">
          Album
        </span>
        <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-muted px-1 text-[10px] font-semibold text-muted-foreground tabular-nums">
          {formatCount(countOf(ALBUM_TAKE))}
        </span>
      </h2>
      <div className="flex flex-wrap items-center justify-end gap-1.5">
        <Button variant="outline" size="sm">
          <ImageUp /> Add photos
        </Button>
        {/* The menu stands under the button that asked, its right edge on the button's (`align="end"`). */}
        <span className="relative">
          <Button
            variant="outline"
            size="sm"
            data-th-way=""
            aria-expanded={menu ? "true" : undefined}
          >
            <Download /> Download
          </Button>
          {menu}
        </span>
        <Button variant="outline" size="sm">
          <ListChecks /> Select
        </Button>
        <Button variant="outline" size="sm">
          <SlidersHorizontal /> View
        </Button>
      </div>
    </div>
  );
}

/** The hub at its album: the bar, the album's head and rows, and whatever stands over it. */
export function HubAlbum({
  screen,
  menu,
  over,
}: {
  screen: ScreenId;
  /** A desk's menu, standing under Download. */
  menu?: ReactNode;
  /** Anything over the page: a hand's menu, a panel, a toast. */
  over?: ReactNode;
}) {
  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <AppBar />
      <main className="px-3 py-6 sm:px-5">
        <section aria-label="Album" className="space-y-2.5">
          <AlbumHead menu={menu} />
          <AlbumRows screen={screen} />
        </section>
      </main>
      {over}
    </div>
  );
}

/* ── keep and post: the panel of two ───────────────────────────────────────── */

/** A set's facts, in the panel's one quiet line: how many, how heavy, and in what. */
const factsOf = (size: Size) =>
  size === "phone"
    ? `${formatCount(ALBUM_TAKE.photos)} photos · ${formatBytes(bytesOf({ photos: ALBUM_TAKE.photos, clips: 0 }, "phone"))} · ${PHONE_EDGE} px`
    : `${formatCount(countOf(ALBUM_TAKE))} · ${formatBytes(bytesOf(ALBUM_TAKE, "original"))} · one zip`;

/** What a set is for, in its few words. */
const forOf = (size: Size) =>
  size === "phone"
    ? "Light enough to post tonight."
    : "Full size, to keep for good.";

/**
 * A SET'S PICTURE: the album itself (bible 6, the media is the colour), a
 * mosaic of its photographs in rows of one height: two rows of three in a
 * desk's card, one row of four across a hand's.
 */
function Mosaic({ from, wide }: { from: number; wide: boolean }) {
  const n = wide ? 6 : 4;
  return (
    <span
      aria-hidden
      className={cn(
        "grid gap-0.5 overflow-hidden rounded-[calc(var(--radius-float)-4px)]",
        wide ? "aspect-[3/2] grid-cols-3 grid-rows-2" : "h-16 grid-cols-4",
      )}
    >
      {Array.from({ length: n }, (_, k) => (
        // eslint-disable-next-line @next/next/no-img-element -- a bootstrap still, the set's picture
        <img
          key={k}
          src={photoAt(from + k * 2).src}
          alt=""
          draggable={false}
          className="size-full min-h-0 object-cover"
        />
      ))}
    </span>
  );
}

/**
 * ONE OF THE TWO SETS: its picture, its name, what it is for, its facts and
 * its one act. The set a screen leads with wears the primary and is the
 * frame's act; the other stands beside it in outline.
 */
function SetCard({
  size,
  act,
  lead,
  wide,
}: {
  size: Size;
  /** The act's words: Download, or Save (into Photos) for phone size in a hand. */
  act: string;
  lead: boolean;
  wide: boolean;
}) {
  const phone = size === "phone";
  const button = (
    <Button
      variant={lead ? "default" : "outline"}
      size="sm"
      data-th-act={lead ? "" : undefined}
      className={wide ? "mt-3 self-start" : "shrink-0"}
    >
      {phone && act === "Save" ? <ImageDown /> : <Download />} {act}
    </Button>
  );
  return (
    <div className="flex flex-col gap-2.5 rounded-float bg-card p-2 ring-1 ring-foreground/10">
      <Mosaic from={phone ? 1 : 0} wide={wide} />
      <span
        className={cn(
          "flex gap-3 px-1.5 pb-1",
          wide ? "flex-col gap-0.5" : "items-center",
        )}
      >
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="font-heading text-lg">
            {phone ? "Phone size" : "Originals"}
          </span>
          <span className="text-sm text-pretty text-muted-foreground">
            {forOf(size)}
          </span>
          <span
            data-th-read={lead ? "" : undefined}
            className="text-xs text-muted-foreground tabular-nums"
          >
            {factsOf(size)}
          </span>
        </span>
        {button}
      </span>
    </div>
  );
}

/**
 * KEEP AND POST: the Download opens a panel of the two sets, each named for
 * what it is for, pictured by the album itself, with its facts and its one
 * act. At a desk the archive leads (a drive is where a desk keeps it), in a
 * hand phone size leads (the phone is where she posts from); the clips line
 * says what phone size leaves alone.
 */
export function TakeHomePanel({ screen }: { screen: ScreenId }) {
  const desk = screen === "1440";
  const clips = `Clips come as they were taken: ${formatCount(ALBUM_TAKE.clips)} · ${formatBytes(bytesOf({ photos: 0, clips: ALBUM_TAKE.clips }, "original"))}.`;
  const cards = desk ? (
    <div className="grid grid-cols-2 gap-3">
      <SetCard size="original" act="Download" lead wide />
      <SetCard size="phone" act="Download" lead={false} wide />
    </div>
  ) : (
    <div className="flex flex-col gap-2">
      <SetCard size="phone" act="Save" lead wide={false} />
      <SetCard size="original" act="Download" lead={false} wide={false} />
    </div>
  );
  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/10 supports-backdrop-filter:backdrop-blur-xs" />
      <div
        role="dialog"
        className={cn(
          "fixed z-50 flex flex-col gap-3 p-4",
          floatingPanel,
          desk
            ? "top-1/2 left-1/2 w-[38rem] -translate-x-1/2 -translate-y-1/2"
            : "inset-x-0 bottom-0 pb-8",
        )}
        // A hand's sheet meets the screen's foot square: its top corners alone keep the panel's
        // corner. Inline, because the panel's own `rounded-float` sits in production's layer and
        // would beat a lab utility on the same element (the kit's `lab-utility-loses-to-production`).
        style={
          desk
            ? undefined
            : ({
                borderBottomLeftRadius: 0,
                borderBottomRightRadius: 0,
              } as CSSProperties)
        }
      >
        {!desk && (
          <span className="mx-auto h-1 w-9 rounded-full bg-foreground/15" />
        )}
        <span className="flex items-baseline justify-between gap-3">
          <span className="font-heading text-xl">Take it home</span>
          <span className="text-xs text-muted-foreground tabular-nums">
            {`${formatCount(countOf(ALBUM_TAKE))} photos & videos`}
          </span>
        </span>
        {cards}
        <p className="text-xs text-pretty text-muted-foreground">{clips}</p>
      </div>
    </>
  );
}
