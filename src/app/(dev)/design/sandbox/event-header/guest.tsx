"use client";

import type { CSSProperties, ReactNode } from "react";
import {
  Clapperboard,
  ImageUp,
  Images,
  Play,
  QrCode,
  Users,
} from "lucide-react";

import { useLivingClock, LivingStills } from "@/components/app/living-stills";
import { Doorway } from "@/components/guest/door/doorway";
import { GhostRiver } from "@/components/guest/gallery-empty-state";
import { GuestActionDock } from "@/components/guest/guest-action-dock";
import { PosterCard } from "@/components/reel/poster-card";
import { Logo } from "@/components/shared/logo";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { formatCount, formatMediaCount } from "@/lib/format/count";
import { GLASS, GLASS_MARK, GLASS_MARK_LIT } from "@/lib/glass";
import { cn, formatEventDate } from "@/lib/utils";

import { AlbumCount, AlbumRows, EmptyAlbum } from "./album";
import {
  EVENT,
  GUEST,
  GUEST_MOMENTS,
  type GuestMoment,
  HOST,
  NEWEST,
  REEL,
} from "./fixtures";
import { AlbumLight, type Hues, litVars, useAlbumHues } from "./light";
import type { ScreenId } from "./scene";

/**
 * THE GUEST'S ALBUM, HEADED FOUR WAYS, and what stays once she scrolls.
 *
 * Production's page (`event-experience.tsx`) is two boxes: `COLUMN`, the
 * words on the left line, and `BLEED`, the album alone at the window's width
 * (12px gutter at a phone, 20px from 640). Every direction keeps that album
 * byte for byte (`album.tsx`) and redraws only what stands above it: the
 * guest's header (`guest-header.tsx`, the name she typed at the door on its
 * right), the head itself, and its actions.
 *
 * ★ TODAY IS PRODUCTION'S OWN ORDER AND WORDS: the name on the `page` step,
 * "Hosted by" with Maya's face and the date, the stats line, the note, a
 * full-width Add photos over a full-width Invite, the Highlight reel's tile
 * (production's `PosterCard`), then the album's own count and its rows.
 * Nothing in a frame is wired: it is a picture of a page.
 */

/** Production's two boxes (`event-experience.tsx`). */
export const COLUMN = "w-full max-w-2xl px-5";
export const BLEED = "px-3 sm:px-5";

export type GuestDirection = "today" | "cover" | "doorway" | "masthead";
export type StaysId = "dock" | "shutter" | "bar";

const desk = (screen: ScreenId) => screen === "1440";

/* ── the header, and the name she typed at the door ───────────────────────── */

/** Her name menu's face (`guest-name-menu.tsx`'s trigger): an unseeded disc and her name. */
function NameChip({ onMedia = false }: { onMedia?: boolean }) {
  return (
    <span className="flex items-center gap-2">
      <Avatar size="sm">
        <AvatarFallback className="text-[10px]">
          {GUEST.name.slice(0, 1)}
        </AvatarFallback>
      </Avatar>
      <span className={cn("text-sm", onMedia && "text-white")}>
        {GUEST.name}
      </span>
    </span>
  );
}

/**
 * The guest's header: the wordmark and her name. On paper it is production's
 * (`border-b`, `px-5 py-3`); over a photograph it stands on the photograph,
 * white, with no rule, so the album's own picture reaches the top edge.
 */
function GuestBar({ over = "paper" }: { over?: "paper" | "media" | "light" }) {
  return (
    <header
      className={cn(
        "flex items-center justify-between gap-2 px-5 py-3",
        over === "paper" && "border-b border-border/60",
        over === "media" && "absolute inset-x-0 top-0 z-20 text-white",
        over === "light" && "relative z-10",
      )}
    >
      <Logo className={over === "media" ? "opacity-90" : undefined} />
      <div className="flex h-8 items-center">
        <NameChip onMedia={over === "media"} />
      </div>
    </header>
  );
}

/* ── glyph facts: the counts without the words (his `door=mark` note) ─────── */

function Fact({
  icon: Icon,
  n,
  label,
  className,
}: {
  icon: typeof Images;
  n: number;
  /** The tooltip's words: the glyph is the glance, these the clarification. */
  label: string;
  className?: string;
}) {
  return (
    <span
      title={label}
      className={cn("flex items-center gap-1.5 tabular-nums", className)}
    >
      <Icon className="size-3.5 shrink-0" aria-hidden />
      {formatCount(n)}
      <span className="sr-only">{label}</span>
    </span>
  );
}

/**
 * A PIECE OF A HEAD IN ITS ARRIVAL'S ORDER (`event-header.css`, `[data-eh-in]`):
 * it rises out of a blur at its place in the sequence, once per mount, so the
 * board's Replay (a remount) plays the whole arrival again.
 */
const inAt = (i: number) =>
  ({ "data-eh-in": "", style: { "--eh-in-i": i } as CSSProperties }) as const;

/* ══ TODAY: production's head, in its order and words ═══════════════════════ */

function TodayHead({ moment }: { moment: GuestMoment }) {
  const m = GUEST_MOMENTS[moment];
  const canAdd = m.photos > 0;
  return (
    <div className={COLUMN}>
      <header data-eh-head="">
        <h1 {...inAt(0)} className="font-heading text-page text-balance">
          {EVENT.name}
        </h1>
        <p
          {...inAt(1)}
          className="mt-2.5 flex items-center gap-2 text-xs text-muted-foreground"
        >
          <span className="flex items-center gap-1.5">
            <span className="text-faint">Hosted by</span>
            <Avatar seed={HOST.seed} size="sm">
              <AvatarFallback>{HOST.name.slice(0, 1)}</AvatarFallback>
            </Avatar>
            <span className="font-medium text-foreground">{HOST.name}</span>
          </span>
          <span aria-hidden className="text-faint">
            ·
          </span>
          <span>{formatEventDate(EVENT.date)}</span>
        </p>
        <p {...inAt(2)} className="mt-1 text-xs text-muted-foreground">
          {formatMediaCount(m.photos)}
          {m.guests > 0 && (
            <>
              {" "}
              from {formatCount(m.guests)} {m.guests === 1 ? "guest" : "guests"}
            </>
          )}
        </p>
        <p
          {...inAt(3)}
          className="mt-2 max-w-prose text-reading text-pretty text-muted-foreground"
        >
          {EVENT.description}
        </p>
      </header>
      <div {...inAt(4)} className="mt-4">
        {canAdd && (
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="lg"
              className="min-w-0 flex-1"
              data-eh-primary=""
            >
              <ImageUp /> Add photos
            </Button>
          </div>
        )}
        <div className="mt-2 flex items-center gap-2">
          <div className="grid min-w-0 flex-1 grid-cols-1 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 w-full"
            >
              <QrCode /> Invite
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/** The Highlight reel's tile, as production draws it over the album (`PosterCard`). */
function TodayReelTile() {
  return (
    <div className={cn(COLUMN, "mt-7 mb-4")}>
      <PosterCard
        eventName="Highlight reel"
        chip={
          <span
            className={cn(
              "flex size-6 items-center justify-center rounded-full text-white",
              GLASS_MARK,
            )}
          >
            <Clapperboard
              className={cn("size-3", GLASS_MARK_LIT)}
              aria-hidden
            />
          </span>
        }
        media={
          <div className="relative aspect-[2/1] w-full overflow-hidden bg-muted sm:aspect-[21/9]">
            {/* eslint-disable-next-line @next/next/no-img-element -- a bootstrap still, the reel's opening */}
            <img
              src={REEL[0]}
              alt=""
              className="absolute inset-0 size-full object-cover"
            />
          </div>
        }
      />
    </div>
  );
}

/* ══ THE COVER: the reel's own stills are the head ══════════════════════════ */

/** The reel's stills dissolving under the head, still under reduced motion (`useLivingClock`). */
function LivingCover() {
  const { ref, at } = useLivingClock<HTMLDivElement>(REEL.length);
  return (
    <div ref={ref} className="eh-arrive-cover absolute inset-0 -z-10">
      <LivingStills stills={REEL} at={at} />
    </div>
  );
}

/** A round control on a photograph: the glass, as media chrome wears it. */
function GlassRound({
  children,
  label,
  size = "size-11",
}: {
  children: ReactNode;
  label: string;
  size?: string;
}) {
  return (
    <span
      title={label}
      aria-label={label}
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full text-white",
        GLASS,
        size,
      )}
    >
      {children}
    </span>
  );
}

function CoverHead({
  screen,
  moment,
}: {
  screen: ScreenId;
  moment: GuestMoment;
}) {
  const m = GUEST_MOMENTS[moment];
  const empty = m.photos === 0;
  const atDesk = desk(screen);
  const hues = useAlbumHues(empty);
  return (
    <section
      data-eh-head=""
      className={cn(
        "relative isolate flex flex-col justify-end overflow-hidden text-white",
        atDesk ? "h-[540px]" : "h-[540px]",
        empty && "bg-neutral-950",
      )}
    >
      {empty ? (
        <AlbumLight hues={hues} className="eh-light-room" />
      ) : (
        <>
          <LivingCover />
          <div aria-hidden className="eh-cover-scrim" />
        </>
      )}
      <GuestBar over="media" />
      <div
        className={cn(
          "relative px-5 pb-5",
          atDesk && "flex items-end justify-between gap-10 pb-8",
        )}
      >
        <div className="min-w-0">
          <h1 {...inAt(0)} className="font-heading text-title text-balance">
            {EVENT.name}
          </h1>
          <p
            {...inAt(1)}
            className="mt-3 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-sm text-white/85"
          >
            <span className="flex items-center gap-2">
              <Avatar seed={HOST.seed} size="sm">
                <AvatarFallback>{HOST.name.slice(0, 1)}</AvatarFallback>
              </Avatar>
              <span className="font-medium text-white">{HOST.name}</span>
            </span>
            <span aria-hidden className="text-white/45">
              ·
            </span>
            <span>{formatEventDate(EVENT.date)}</span>
            {/* At a desk the counts ride the byline; at a phone they wait in the
                album's own label, the first line under the cover. */}
            {!empty && atDesk && (
              <>
                <span aria-hidden className="text-white/45">
                  ·
                </span>
                <Fact icon={Images} n={m.photos} label="Photos and videos" />
                <Fact icon={Users} n={m.guests} label="Guests" />
              </>
            )}
          </p>
          <p
            {...inAt(2)}
            className={cn(
              "mt-3 max-w-xl text-working text-pretty text-white/80",
              !atDesk && "line-clamp-2",
            )}
          >
            {empty ? "The album starts with you." : EVENT.description}
          </p>
        </div>
        <div
          {...inAt(3)}
          className={cn(
            "flex shrink-0 items-center gap-2",
            atDesk ? "flex-row-reverse" : "mt-5",
          )}
        >
          <Button
            type="button"
            size="cta"
            data-eh-primary=""
            className={cn(
              "bg-white text-neutral-950 hover:bg-white/90",
              !atDesk && "min-w-0 flex-1",
            )}
          >
            <ImageUp /> {empty ? "Add the first photo" : "Add photos"}
          </Button>
          {m.reel && (
            <GlassRound label="Watch the highlight reel">
              <Play className="size-4 fill-current" aria-hidden />
            </GlassRound>
          )}
          <GlassRound label="Invite">
            <QrCode className="size-4" aria-hidden />
          </GlassRound>
        </div>
      </div>
    </section>
  );
}

/* ══ THE DOORWAY: the door she came through, left open as the album's emblem ═ */

/**
 * The emblem: production's `Doorway`, open, the album's newest previews through
 * it and its light in their hues (`doorway.tsx`), at an emblem's size. A press
 * plays the reel: the photographs through the door ARE the album's newest, so
 * stepping through it is watching them. Where the album is empty the door
 * stands open on the house light, nobody in yet.
 */
/**
 * Where the door stood before it landed: the middle of the screen at the
 * door's own size, as an offset from the emblem's place (read off the frames:
 * the emblem's centre at a phone is 62,140 of 375 by 812, at a desk 84,186 of
 * 1440 by 900).
 */
const LAND = {
  md: { "--eh-land-x": "125px", "--eh-land-y": "266px", "--eh-land-s": 1.4 },
  lg: { "--eh-land-x": "636px", "--eh-land-y": "264px", "--eh-land-s": 1.2 },
} as const;

function DoorEmblem({
  hues,
  empty,
  size,
}: {
  hues: Hues;
  empty: boolean;
  size: "md" | "lg";
}) {
  return (
    <span
      className="eh-arrive-door relative shrink-0"
      style={LAND[size] as CSSProperties}
    >
      <Doorway
        state="open"
        hues={hues}
        photos={empty ? [] : NEWEST}
        className={size === "lg" ? "eh-door-emblem-lg" : "eh-door-emblem"}
      />
      {!empty && (
        <span
          title="Watch the highlight reel"
          className={cn(
            "absolute -right-2 -bottom-2 z-10 flex size-7 items-center justify-center rounded-full text-white ring-2 ring-background",
            GLASS_MARK,
            "bg-neutral-900/80",
          )}
        >
          <Play className="size-3 fill-current" aria-hidden />
        </span>
      )}
    </span>
  );
}

function DoorwayHead({
  screen,
  moment,
}: {
  screen: ScreenId;
  moment: GuestMoment;
}) {
  const m = GUEST_MOMENTS[moment];
  const empty = m.photos === 0;
  const atDesk = desk(screen);
  const hues = useAlbumHues(empty);
  return (
    <section data-eh-head="" className="relative isolate">
      <AlbumLight
        hues={hues}
        source={atDesk ? { x: "6%", y: "52%" } : { x: "17%", y: "40%" }}
      />
      <GuestBar over="light" />
      <div className={cn("px-5 pt-5 pb-6", atDesk && "pt-8 pb-10")}>
        <div className={cn("flex items-end gap-4", atDesk && "gap-8")}>
          <DoorEmblem hues={hues} empty={empty} size={atDesk ? "lg" : "md"} />
          <div className="min-w-0 flex-1 pb-0.5">
            <h1
              {...inAt(4)}
              className={cn(
                "font-heading text-balance",
                atDesk ? "text-title" : "text-chapter",
              )}
            >
              {EVENT.name}
            </h1>
            <p
              {...inAt(5)}
              className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-sm text-muted-foreground"
            >
              <span className="flex items-center gap-1.5">
                <Avatar seed={HOST.seed} size="sm">
                  <AvatarFallback>{HOST.name.slice(0, 1)}</AvatarFallback>
                </Avatar>
                <span className="font-medium text-foreground">{HOST.name}</span>
              </span>
              <span aria-hidden className="text-faint">
                ·
              </span>
              <span>{formatEventDate(EVENT.date)}</span>
            </p>
            {!empty && (
              <p
                {...inAt(6)}
                className="mt-1.5 flex items-center gap-3 text-sm text-muted-foreground"
              >
                <Fact icon={Images} n={m.photos} label="Photos and videos" />
                <Fact icon={Users} n={m.guests} label="Guests" />
              </p>
            )}
          </div>
          {atDesk && <DoorActions empty={empty} atDesk />}
        </div>
        <p
          {...inAt(7)}
          className={cn(
            "mt-4 max-w-prose text-reading text-pretty text-muted-foreground",
            atDesk && "mt-6",
          )}
        >
          {empty ? "The album starts with you." : EVENT.description}
        </p>
        {!atDesk && <DoorActions empty={empty} />}
      </div>
    </section>
  );
}

function DoorActions({
  empty,
  atDesk = false,
}: {
  empty: boolean;
  atDesk?: boolean;
}) {
  return (
    <div
      {...inAt(8)}
      className={cn(
        "flex items-center gap-2",
        atDesk ? "shrink-0 flex-row-reverse pb-1" : "mt-4",
      )}
    >
      <Button
        type="button"
        size="cta"
        data-eh-primary=""
        className={cn(!atDesk && "min-w-0 flex-1")}
      >
        <ImageUp /> {empty ? "Add the first photo" : "Add photos"}
      </Button>
      <Button
        type="button"
        variant="outline"
        size="icon"
        title="Invite"
        aria-label="Invite"
        className="size-11 rounded-full"
      >
        <QrCode />
      </Button>
    </div>
  );
}

/* ══ THE MASTHEAD: the name leads, filled with the party ═════════════════════ */

/**
 * THE NAME, FILLED WITH THE PARTY: the event's name set as large as the
 * column takes, its letters windows onto the reel's own stills, which dissolve
 * one into the next on the living clock (`useLivingClock`, still under
 * reduced motion). The real heading is the plain text for a reader of the
 * page; the photographs are a picture laid in its letters.
 *
 * ★ A NEW ATOM, NAMED (the board's brief: a page board names any atom an
 * option needs): photo-filled type (`.eh-photo-type`), a darkening wash under
 * every still so a white dress never takes a letter's edge with it, and the
 * foreground ink wherever colours are forced.
 */
export function PhotoName({ className }: { className?: string }) {
  const { ref, at } = useLivingClock<HTMLHeadingElement>(REEL.length);
  const current = at % REEL.length;
  return (
    <h1
      ref={ref}
      className={cn(
        "eh-arrive-name relative font-heading text-balance",
        className,
      )}
    >
      <span className="sr-only">{EVENT.name}</span>
      {REEL.map((src, i) => (
        <span
          key={src}
          aria-hidden
          className={cn(
            "eh-photo-type block transition-opacity duration-[1400ms] ease-emphasis motion-reduce:transition-none",
            i === 0 ? "relative" : "absolute inset-0",
            i === current ? "opacity-100" : "opacity-0",
          )}
          style={{ "--eh-photo": `url(${src})` } as CSSProperties}
        >
          {EVENT.name}
        </span>
      ))}
    </h1>
  );
}

function Numeral({
  n,
  label,
  lit,
}: {
  n: ReactNode;
  label: string;
  lit?: boolean;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1 py-3 pr-4">
      <span
        className={cn(
          "font-heading text-page tabular-nums",
          lit && "flex items-center gap-2",
        )}
      >
        {n}
      </span>
      <span className="text-label text-muted-foreground uppercase">
        {label}
      </span>
    </div>
  );
}

/** The reel among the numerals: its stills living in a small round frame. */
function ReelDot() {
  const { ref, at } = useLivingClock<HTMLSpanElement>(REEL.length);
  return (
    <span
      ref={ref}
      className="relative inline-flex size-8 shrink-0 overflow-hidden rounded-full ring-1 ring-border"
    >
      <LivingStills stills={REEL} at={at} />
      <span className="absolute inset-0 flex items-center justify-center bg-black/25 text-white">
        <Play className="size-3 fill-current" aria-hidden />
      </span>
    </span>
  );
}

function MastheadHead({
  screen,
  moment,
}: {
  screen: ScreenId;
  moment: GuestMoment;
}) {
  const m = GUEST_MOMENTS[moment];
  const empty = m.photos === 0;
  const atDesk = desk(screen);
  const credits = (
    <div
      {...inAt(2)}
      className="mt-4 flex items-center justify-between gap-4 border-t border-foreground/80 pt-3 text-label text-muted-foreground uppercase"
    >
      <span>{formatEventDate(EVENT.date)}</span>
      <span>Hosted by {HOST.name}</span>
    </div>
  );
  const numerals = empty ? (
    <p {...inAt(3)} className="font-heading text-subsection">
      The album starts with you
    </p>
  ) : (
    <div
      {...inAt(3)}
      className="grid grid-cols-3 divide-x divide-border [&>*+*]:pl-4"
    >
      <Numeral n={formatCount(m.photos)} label="Photos" />
      <Numeral n={formatCount(m.guests)} label="Guests" />
      <Numeral
        n={
          <>
            <ReelDot />
            <span className="sr-only">Watch</span>
          </>
        }
        label="The reel"
        lit
      />
    </div>
  );
  const actions = (
    <div {...inAt(5)} className="mt-5 flex items-center gap-2">
      <Button
        type="button"
        size="cta"
        data-eh-primary=""
        className="min-w-0 flex-1"
      >
        <ImageUp /> {empty ? "Add the first photo" : "Add photos"}
      </Button>
      <Button type="button" variant="outline" size="cta" className="shrink-0">
        <QrCode /> Invite
      </Button>
    </div>
  );
  return (
    <>
      <GuestBar />
      <section
        data-eh-head=""
        className={cn(
          "px-5 pt-8 pb-6",
          atDesk && "grid grid-cols-12 items-end gap-x-12 pt-12 pb-10",
        )}
      >
        <div className={cn(atDesk && "col-span-7")}>
          {empty ? (
            <h1 className="eh-arrive-name font-heading text-display text-balance">
              {EVENT.name}
            </h1>
          ) : (
            <PhotoName className="text-display" />
          )}
          {credits}
        </div>
        <div className={cn(atDesk ? "col-span-5" : "mt-5")}>
          {numerals}
          {!empty && (
            <p
              {...inAt(4)}
              className="mt-3 max-w-prose text-reading text-pretty text-muted-foreground"
            >
              {EVENT.description}
            </p>
          )}
          {actions}
        </div>
      </section>
    </>
  );
}

/* ══ WHAT STAYS once she scrolls: the dock, the shutter, or the head as a bar ═ */

/** Invite as the dock carries it today: production's own trigger, quoted. */
function DockInvite() {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="h-9 flex-1 active:scale-[0.98] sm:flex-none"
    >
      <QrCode /> Invite
    </Button>
  );
}

/** TODAY: production's `GuestActionDock`, the real component, shown. */
function DockStays({ uploading }: { uploading: number }) {
  return (
    <div data-eh-stays="the dock at the foot" className="eh-arrive-edge">
      <GuestActionDock
        hidden={false}
        uploadingCount={uploading}
        onAdd={() => {}}
        invite={<DockInvite />}
      />
    </div>
  );
}

/**
 * THE SHUTTER: one round Add at the foot's centre, ringed in the album's light,
 * Invite a small round beside it, and no bar: the album runs to the bottom
 * edge under them. While photographs are on their way the ring is their
 * progress and the count rides the button.
 */
function ShutterStays({
  uploading,
  hues,
  atDesk,
}: {
  uploading: number;
  hues: Hues;
  atDesk: boolean;
}) {
  const sending = uploading > 0;
  return (
    <div
      data-eh-stays="one shutter at the foot"
      className={cn(
        "pointer-events-none fixed inset-x-0 bottom-0 z-40 flex items-center gap-3 pb-[calc(1.25rem+env(safe-area-inset-bottom))]",
        atDesk ? "justify-end pr-8 pb-8" : "justify-center",
      )}
    >
      <span
        title="Invite"
        className="pointer-events-auto flex size-11 items-center justify-center rounded-full bg-background text-foreground shadow-layer ring-1 ring-border"
      >
        <QrCode className="size-4" aria-hidden />
      </span>
      <span
        className="eh-shutter eh-arrive-shutter pointer-events-auto"
        style={litVars(hues)}
      >
        <span aria-hidden className="eh-shutter-glow" />
        {!sending && <span aria-hidden className="eh-shutter-ring" />}
        {sending && <ProgressRing of={0.62} />}
        <span
          title="Add photos"
          className="relative flex size-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-layer"
        >
          <ImageUp className="size-6" aria-hidden />
          <span className="sr-only">Add photos</span>
        </span>
        {sending && (
          <span className="absolute -top-1 -right-1 z-10 flex h-5 min-w-5 items-center justify-center rounded-full bg-foreground px-1 text-micro font-semibold text-background tabular-nums ring-2 ring-background">
            {uploading}
          </span>
        )}
      </span>
      {/* The pair stays centred: a box the Invite's width on the far side. */}
      {!atDesk && <span aria-hidden className="size-11" />}
    </div>
  );
}

/** A thin ring of progress around the shutter, in the foreground (the light is the glow under it). */
function ProgressRing({ of }: { of: number }) {
  const r = 34;
  const c = 2 * Math.PI * r;
  return (
    <svg
      viewBox="0 0 72 72"
      aria-hidden
      className="absolute -inset-1 z-10 size-[72px] -rotate-90"
    >
      <circle
        cx="36"
        cy="36"
        r={r}
        fill="none"
        strokeWidth="3"
        className="stroke-white/35"
      />
      <circle
        cx="36"
        cy="36"
        r={r}
        fill="none"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray={`${c * of} ${c}`}
        className="stroke-white drop-shadow-[0_0_2px_rgb(0_0_0/0.5)]"
      />
    </svg>
  );
}

/**
 * THE HEAD AS A BAR: the head folds into a slim bar at the top as she scrolls,
 * the album's emblem (its cover, its door or its initials), its name, Invite
 * and Add, and nothing stands at the foot.
 */
function BarStays({
  uploading,
  direction,
  hues,
}: {
  uploading: number;
  direction: GuestDirection;
  hues: Hues;
}) {
  return (
    <div
      data-eh-stays="the head as a bar at the top"
      className="eh-arrive-bar fixed inset-x-0 top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur"
    >
      <div className="flex h-14 items-center gap-3 px-3 sm:px-5">
        <BarEmblem direction={direction} hues={hues} />
        <span className="min-w-0 flex-1 truncate font-heading text-card-title">
          {EVENT.name}
        </span>
        <span
          title="Invite"
          className="flex size-9 items-center justify-center rounded-full text-muted-foreground ring-1 ring-border"
        >
          <QrCode className="size-4" aria-hidden />
        </span>
        <Button type="button" size="lg" className="rounded-full px-4">
          <ImageUp />
          {uploading > 0 ? (
            <span className="tabular-nums">{uploading} on the way</span>
          ) : (
            "Add photos"
          )}
        </Button>
      </div>
    </div>
  );
}

function BarEmblem({
  direction,
  hues,
}: {
  direction: GuestDirection;
  hues: Hues;
}) {
  if (direction === "doorway")
    return (
      <Doorway
        state="open"
        hues={hues}
        photos={NEWEST}
        className="eh-door-emblem-sm"
      />
    );
  if (direction === "cover")
    return (
      // eslint-disable-next-line @next/next/no-img-element -- a bootstrap still, the cover's own
      <img
        src={REEL[0]}
        alt=""
        className="size-9 shrink-0 rounded-lg object-cover"
      />
    );
  return (
    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted font-heading text-card-title">
      {EVENT.name.slice(0, 1)}
    </span>
  );
}

/* ══ THE PAGE: a head, the album under it, and what stays ════════════════════ */

export function GuestPage({
  direction,
  screen,
  moment,
  scrolled = false,
  stays = "dock",
  uploading = 0,
}: {
  direction: GuestDirection;
  screen: ScreenId;
  moment: GuestMoment;
  /** The page moved on into the album, where what stays is shown. */
  scrolled?: boolean;
  stays?: StaysId;
  uploading?: number;
}) {
  const m = GUEST_MOMENTS[moment];
  const empty = m.photos === 0;
  const hues = useAlbumHues(empty);
  const atDesk = desk(screen);
  const album = empty ? (
    direction === "today" ? (
      <EmptyAlbum className={cn(COLUMN, "mt-7")} />
    ) : (
      <div data-eh-empty="" className={cn(COLUMN, "mt-2")}>
        <GhostRiver />
      </div>
    )
  ) : (
    <div className={cn(BLEED, direction === "today" ? "" : "mt-4")}>
      <AlbumCount count={m.photos} />
      <AlbumRows screen={screen} />
    </div>
  );
  return (
    <div
      data-guest-page=""
      className={cn(
        "relative flex min-h-screen flex-col bg-background text-foreground",
        // The page owes what stays at its foot its room, as production's root does.
        stays === "bar"
          ? "pb-8"
          : "pb-[calc(6rem+env(safe-area-inset-bottom))]",
      )}
    >
      {direction === "today" && (
        <>
          <GuestBar />
          <div className="pt-8">
            <TodayHead moment={moment} />
            {m.reel && <TodayReelTile />}
            {album}
          </div>
        </>
      )}
      {direction === "cover" && (
        <>
          <CoverHead screen={screen} moment={moment} />
          {album}
        </>
      )}
      {direction === "doorway" && (
        <>
          <DoorwayHead screen={screen} moment={moment} />
          {album}
        </>
      )}
      {direction === "masthead" && (
        <>
          <MastheadHead screen={screen} moment={moment} />
          {album}
        </>
      )}
      {scrolled && !empty && stays === "dock" && (
        <DockStays uploading={uploading} />
      )}
      {scrolled && !empty && stays === "shutter" && (
        <ShutterStays uploading={uploading} hues={hues} atDesk={atDesk} />
      )}
      {scrolled && !empty && stays === "bar" && (
        <BarStays uploading={uploading} direction={direction} hues={hues} />
      )}
    </div>
  );
}
