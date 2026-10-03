"use client";

import type { CSSProperties, ReactNode } from "react";
import {
  Check,
  CopyCheck,
  Download,
  ImageUp,
  ListChecks,
  Play,
  QrCode,
  SlidersHorizontal,
  X,
} from "lucide-react";

import { GuestActionDock } from "@/components/guest/guest-action-dock";
import {
  AlbumCover,
  HeadStills,
} from "@/components/guest/event-experience-head";
import { Logo } from "@/components/shared/logo";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { floatingPanel } from "@/components/ui/floating-layer";
import { Shutter } from "@/components/ui/shutter";
import { formatCount, formatMediaCount } from "@/lib/format/count";
import { GLASS_MARK } from "@/lib/glass";
import { DEFAULT_ROW_STEP, perRowFor } from "@/lib/shared/album-rows";
import { cn } from "@/lib/utils";

import {
  COVER_STILLS,
  EVENT,
  GUEST,
  GUESTS,
  HOST,
  PICKED,
  photoAt,
  TRAY,
} from "./fixtures";
import { ALBUM_TAKE, countOf } from "./model";
import { SCREENS, type ScreenId } from "./scene";

/**
 * THE GUEST'S ALBUM AS BUILT, and the pieces each way home changes in it.
 *
 * Production's page (`event-experience.tsx`): the guest's header standing on
 * the cover, the cover (`AlbumCover` over `HeadStills`, the real components),
 * then the album in `BLEED` (12px gutter at a phone, 20px from 640): its own
 * count row (`live-gallery.tsx`: the count, Download all, View), its justified
 * rows, and the shutter at the foot once the cover's row has gone
 * (`GuestActionDock`, the real component).
 *
 * ★ EVERY WAY HOME KEEPS THE ALBUM BYTE FOR BYTE: the same cover, rows and
 * shutter, so two frames differ only in the way home: the count row's word,
 * a tile's mark, the foot's act.
 *
 * ★ THE ROWS ARE QUOTED, NOT ENGINED: each row's photographs grow by their
 * own ratio from a zero basis, so a row comes out one height and fills the
 * width, the way `MasonryColumns` `layout="rows"` justifies one (without its
 * band, cap or landscape lead); a frame needs no engine, window or network.
 * The marks a tile wears in select mode are production's own (`album-tile.tsx`
 * `SelectMark`), quoted class for class.
 */

/** Production's album box (`event-experience.tsx`). */
export const BLEED = "px-3 sm:px-5";

/* ── the header on the cover ───────────────────────────────────────────────── */

/** Her name menu's face (`guest-name-menu.tsx`'s trigger): a disc and the name she typed. */
function NameChip() {
  return (
    <span className="flex items-center gap-2">
      <Avatar size="sm">
        <AvatarFallback className="text-[10px]">
          {GUEST.name.slice(0, 1)}
        </AvatarFallback>
      </Avatar>
      <span className="text-sm text-white">{GUEST.name}</span>
    </span>
  );
}

/** The guest's header on the cover (`guest-header.tsx`'s `over`): white, no rule. */
export function GuestHeader() {
  return (
    <header
      data-surface="photo"
      className="dark relative z-20 flex h-14 items-center justify-between gap-2 border-b border-transparent px-5 text-foreground"
    >
      <Logo />
      <div className="flex h-8 items-center">
        <NameChip />
      </div>
    </header>
  );
}

/* ── the cover ─────────────────────────────────────────────────────────────── */

/** The album's cover as built: its stills, its words, and Add photos, the reel and Invite on it. */
export function Cover() {
  return (
    <AlbumCover
      className="-mt-14"
      ground={<HeadStills stills={COVER_STILLS} />}
      name={EVENT.name}
      host={{ name: HOST.name, avatarUrl: null, seed: HOST.seed }}
      date={EVENT.date}
      description={EVENT.description}
      mediaCount={countOf(ALBUM_TAKE)}
      guestCount={GUESTS}
      actions={
        <>
          <Button
            type="button"
            variant="on-photo"
            size="cta"
            className="min-w-0 flex-1 md:flex-none"
          >
            <ImageUp /> Add photos
          </Button>
          <Button
            type="button"
            variant="glass"
            size="icon-cta"
            aria-label="Watch the highlight reel"
          >
            <Play className="fill-current" />
          </Button>
          <Button
            type="button"
            variant="glass"
            size="icon-cta"
            aria-label="Invite"
          >
            <QrCode />
          </Button>
        </>
      }
    />
  );
}

/* ── the album's own count row ─────────────────────────────────────────────── */

/**
 * THE WAY INTO A WAY HOME, IN THE ALBUM'S OWN ROW (`live-gallery.tsx`): the
 * count on the left, and on the right today's quiet Download all, or Select
 * in its place, or nothing but View. The control is marked `data-th-way` so a
 * caption reads where it sits.
 */
export type CountWay = "download" | "select" | "none";

const QUIET =
  "flex items-center gap-1.5 rounded-md px-2 py-1 text-sm text-muted-foreground";

export function CountRow({ way, menu }: { way: CountWay; menu?: ReactNode }) {
  return (
    <div className="mb-3 flex flex-wrap items-center justify-between gap-1.5">
      <p className="px-0.5 text-working text-muted-foreground tabular-nums">
        {formatMediaCount(countOf(ALBUM_TAKE))}
      </p>
      <div className="ml-auto flex items-center gap-1.5">
        {way === "download" && (
          // A desk's menu stands under the button that asked (`ExportDialog`, `align="end"`).
          <span className="relative">
            <span data-th-way="" className={QUIET}>
              <Download className="size-4" /> Download all
            </span>
            {menu}
          </span>
        )}
        {way === "select" && (
          <span data-th-way="" className={QUIET}>
            <ListChecks className="size-4" /> Select
          </span>
        )}
        <Button type="button" variant="outline" size="sm">
          <SlidersHorizontal /> View
        </Button>
      </div>
    </div>
  );
}

/**
 * SELECT MODE'S BAR: the count row turned over to the selection and stuck to
 * the screen's top while she scrolls, so what she has and how to leave are
 * always in view. Cancel on the left (the phone's own place for it), the
 * count in the middle, and the two shortcuts on the right: Yours (every photo
 * of hers) and All.
 */
export function SelectBar({ count }: { count: number }) {
  return (
    <div
      data-th-bar=""
      className="sticky top-0 z-30 -mx-3 mb-3 flex h-12 items-center justify-between gap-2 border-b border-border/60 bg-background/90 px-3 backdrop-blur-md sm:-mx-5 sm:px-5"
    >
      <span className="rounded-md px-1 py-1 text-sm font-medium">Cancel</span>
      {/* What she has picked, as pictures before a number (bible 6): her three latest, stacked. */}
      <span className="flex items-center gap-2">
        <span aria-hidden className="flex">
          {[...PICKED].slice(-3).map((i, k) => (
            // eslint-disable-next-line @next/next/no-img-element -- a bootstrap still, one of her picks
            <img
              key={i}
              src={photoAt(i).src}
              alt=""
              draggable={false}
              className="size-6 rounded-[5px] object-cover ring-2 ring-background"
              style={{ marginLeft: k === 0 ? 0 : -8 }}
            />
          ))}
        </span>
        <span
          data-th-read=""
          className="text-sm font-semibold tabular-nums"
        >{`${formatCount(count)} selected`}</span>
      </span>
      <span className="flex items-center gap-1.5">
        <span className="rounded-full bg-muted px-2.5 py-1 text-sm font-medium">
          Yours
        </span>
        <span className="rounded-full bg-muted px-2.5 py-1 text-sm font-medium">
          All
        </span>
      </span>
    </div>
  );
}

/* ── the rows ──────────────────────────────────────────────────────────────── */

/** The marks a tile wears: none, select mode's (a check, coloured when picked), or a tray's. */
export type TileMarks = "none" | "select" | "gathered";

/** The tray's photographs, as the rows look them up. */
const TRAY_SET: ReadonlySet<number> = new Set(TRAY);

/** Production's `SelectMark` (`album-tile.tsx`), quoted: a dim and the corner check. */
function SelectMark({ picked }: { picked: boolean }) {
  return (
    <>
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-0",
          picked ? "bg-black/40" : "bg-black/0",
        )}
      />
      <span
        aria-hidden
        data-th-picked={picked ? "" : undefined}
        className={cn(
          "pointer-events-none absolute top-1.5 right-1.5 z-10 flex size-6 items-center justify-center rounded-full",
          picked
            ? "bg-success text-success-foreground ring-2 ring-white"
            : GLASS_MARK,
        )}
      >
        {picked && <Check className="size-3.5" />}
      </span>
    </>
  );
}

/**
 * A PHOTOGRAPH ALREADY IN HER TRAY: the tray's own glyph in the tile's
 * corner, in the save blue (the action's colour, design-system.md "One colour
 * per action"), on the mark's material, the way a liked tile wears its heart.
 */
function GatheredMark() {
  return (
    <span
      aria-hidden
      data-th-picked=""
      className={cn(
        "pointer-events-none absolute right-1.5 bottom-1.5 z-10 inline-flex size-6 items-center justify-center rounded-full text-save",
        GLASS_MARK,
      )}
    >
      <CopyCheck className="size-3.5" />
    </span>
  );
}

/**
 * THE ROWS, quoted: production's per-row count at this width and the default
 * step (`perRowFor`: two at a phone, five at a desk), each row's photographs
 * grown by their own ratio so the row comes out one height.
 */
export function AlbumRows({
  screen,
  count = 36,
  marks = "none",
  picked = PICKED,
}: {
  screen: ScreenId;
  count?: number;
  marks?: TileMarks;
  picked?: ReadonlySet<number>;
}) {
  const n = perRowFor(SCREENS[screen].w, DEFAULT_ROW_STEP);
  const rows = Array.from({ length: Math.ceil(count / n) }, (_, r) =>
    Array.from({ length: Math.min(n, count - r * n) }, (_, i) => r * n + i),
  );
  return (
    <div className="flex flex-col gap-[var(--gap-gallery,4px)]">
      {rows.map((row, r) => (
        <div key={r} className="flex gap-[var(--gap-gallery,4px)]">
          {row.map((i) => {
            const p = photoAt(i);
            return (
              <span
                key={i}
                data-th-tile=""
                className="relative min-w-0 overflow-hidden rounded-[var(--radius-tile)] bg-muted"
                style={
                  {
                    flex: `${p.w / p.h} 1 0`,
                    aspectRatio: `${p.w} / ${p.h}`,
                  } as CSSProperties
                }
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- a bootstrap still, drawn as the album's tile */}
                <img
                  src={p.src}
                  alt=""
                  draggable={false}
                  className="absolute inset-0 size-full object-cover"
                />
                {marks === "select" && <SelectMark picked={picked.has(i)} />}
                {marks === "gathered" && picked.has(i) && <GatheredMark />}
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
}

/* ── what stands at the foot ───────────────────────────────────────────────── */

/** The shutter's flanks as production draws them (`event-experience.tsx`): Invite, and the reel's round. */
function Flank({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Button
      type="button"
      variant="outline"
      size="icon-cta"
      aria-label={label}
      className="bg-background shadow-layer"
    >
      {children}
    </Button>
  );
}

/** THE SHUTTER AS BUILT (`GuestActionDock`, the real component): Invite, Add, the reel. */
export function ShutterDock({ twin }: { twin?: ReactNode }) {
  return (
    <GuestActionDock
      hidden={false}
      uploadingCount={0}
      onAdd={() => {}}
      invite={
        <Flank label="Invite">
          <QrCode />
        </Flank>
      }
      twin={
        twin ?? (
          <Flank label="Watch the highlight reel">
            <Play className="fill-current" />
          </Flank>
        )
      }
    />
  );
}

/** The dock's own frame (`guest-action-dock.tsx`), quoted for a foot it does not draw. */
function Foot({ children }: { children: ReactNode }) {
  return (
    <div
      data-th-foot=""
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40"
    >
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-background via-background/70 to-transparent"
      />
      <div className="relative flex items-center justify-center gap-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] [&_button]:pointer-events-auto">
        {children}
      </div>
    </div>
  );
}

/**
 * THE SHUTTER, TURNED TO SAVE (select mode): the album's one round act at
 * the foot's centre, its face the download glyph, its shoulder the count she
 * has picked, its ring the album's light. Pressed, the same ring fills as her
 * photographs arrive (the atom's own `sending`, `--progress`), the way it
 * fills as hers go up: one control, one light, both directions.
 */
export function SaveDock({
  count,
  progress,
}: {
  count: number;
  /** 0 to 1 while her photographs arrive; absent at rest. */
  progress?: number;
}) {
  const going = progress !== undefined;
  return (
    <Foot>
      <span className="relative">
        <Shutter
          data-th-act=""
          state={going ? "sending" : "idle"}
          progress={progress ?? 0}
          count={count}
          aria-label={
            going
              ? `Saving ${formatCount(count)} photos. Tap to stop.`
              : `Save ${formatCount(count)} photos`
          }
        >
          {going ? (
            <span className="size-4 rounded-[3px] bg-current" />
          ) : (
            <Download className="size-6" />
          )}
        </Shutter>
        {/* At rest the atom wears no shoulder (its count is a run's): the selection's, quoted from
            the atom's own badge, so the round says how many it will save. */}
        {!going && (
          <span
            aria-hidden
            className="absolute -top-1 -right-1 z-10 flex h-5 min-w-5 items-center justify-center rounded-full bg-foreground px-1 text-micro font-semibold text-background tabular-nums ring-2 ring-background"
          >
            {formatCount(count)}
          </span>
        )}
      </span>
    </Foot>
  );
}

/**
 * THE TRAY AT THE FOOT: the shutter as built, with the tray standing as its
 * right flank while it holds anything (the reel keeps its round on the
 * cover): her newest pick's picture in the round, her count on its shoulder.
 */
export function TrayDock({
  count,
  act = true,
}: {
  count: number;
  /** The round is the frame's act (false where something stands over it, the viewer). */
  act?: boolean;
}) {
  const newest = photoAt(TRAY.at(-1) ?? 0);
  return (
    <ShutterDock
      twin={
        <span className="relative">
          <span
            data-th-act={act ? "" : undefined}
            aria-label={`Your tray, ${formatCount(count)} photos`}
            className="relative flex size-11 overflow-hidden rounded-full bg-background shadow-layer ring-2 ring-background"
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- a bootstrap still, her newest pick */}
            <img
              src={newest.src}
              alt=""
              draggable={false}
              className="size-full object-cover"
            />
          </span>
          <span
            aria-hidden
            className="absolute -top-1 -right-1 z-10 flex h-5 min-w-5 items-center justify-center rounded-full bg-save px-1 text-micro font-semibold text-save-foreground tabular-nums ring-2 ring-background"
          >
            {formatCount(count)}
          </span>
        </span>
      }
    />
  );
}

/**
 * THE TRAY, OPEN: a card rising from its round over the album (the album and
 * the shutter stay in view under it), her gathered photographs in a grid, a
 * small x to let one go, and one Save that takes them all. Its count is the
 * header's one number; its act is the card's one button.
 */
export function TrayCard({
  screen,
  picks,
}: {
  screen: ScreenId;
  picks: readonly number[];
}) {
  const desk = screen === "1440";
  return (
    <div
      data-th-tray=""
      className={cn(
        "fixed z-50 flex flex-col gap-3 p-3",
        floatingPanel,
        // It rises from the foot's rounds: centred over them at a desk, the screen's width in a hand.
        desk
          ? "bottom-28 left-1/2 w-96 -translate-x-1/2"
          : "inset-x-3 bottom-28",
      )}
    >
      <span className="flex items-baseline justify-between gap-3 px-1">
        <span className="font-heading text-lg">Your tray</span>
        <span className="text-sm text-muted-foreground">Clear</span>
      </span>
      <span className="grid grid-cols-3 gap-1">
        {picks.map((i) => (
          <span
            key={i}
            data-th-picked=""
            className="relative aspect-square overflow-hidden rounded-[calc(var(--radius-float)-8px)]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- a bootstrap still, a gathered photograph */}
            <img
              src={photoAt(i).src}
              alt=""
              draggable={false}
              className="size-full object-cover"
            />
            <span
              aria-hidden
              className={cn(
                "absolute top-1 right-1 flex size-5 items-center justify-center rounded-full text-white",
                GLASS_MARK,
              )}
            >
              <X className="size-3" />
            </span>
          </span>
        ))}
      </span>
      <Button data-th-act="" size="cta" className="w-full">
        <Download /> {`Save ${formatCount(picks.length)}`}
      </Button>
    </div>
  );
}

/* ── the page ──────────────────────────────────────────────────────────────── */

/**
 * THE GUEST'S PAGE: the header on the cover, the cover, the album with its
 * count row (or select mode's bar), its rows, and whatever stands at the foot.
 * `over` is anything drawn above the page (a menu, a sheet, the viewer).
 */
export function GuestPage({
  screen,
  way,
  selecting,
  marks = "none",
  menu,
  foot,
  over,
}: {
  screen: ScreenId;
  way: CountWay;
  /** Select mode: the bar takes the count row's place, carrying this count. */
  selecting?: number;
  marks?: TileMarks;
  /** A desk's menu, standing under Download all. */
  menu?: ReactNode;
  foot?: ReactNode;
  over?: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <GuestHeader />
      <Cover />
      <div className={BLEED}>
        <section className="mt-3">
          {selecting !== undefined ? (
            <SelectBar count={selecting} />
          ) : (
            <CountRow way={way} menu={menu} />
          )}
          <AlbumRows
            screen={screen}
            marks={marks}
            picked={marks === "gathered" ? TRAY_SET : PICKED}
          />
        </section>
      </div>
      {foot}
      {over}
    </div>
  );
}

/** How far a frame that has moved into the album is scrolled: the cover gone, the rows filling the screen. */
export const INTO: Record<ScreenId, number> = { "375": 548, "1440": 548 };
