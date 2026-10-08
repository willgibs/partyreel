"use client";

import { Copy, Play, Share2 } from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";

import { StyledQr } from "@/components/app/styled-qr";
import { DoorHeading } from "@/components/guest/door/heading";
import { EntryShell } from "@/components/guest/entry-shell";
import { UploadIntentBody } from "@/components/guest/upload/intent-sheet";
import { uploadStepReason } from "@/components/guest/upload-step";
import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import { formatCount } from "@/lib/format/count";
import { resolveQrPreset } from "@/lib/constants/qr-presets";
import { EVENT_CARD_SIZE } from "@/lib/guest/event-card";
import { cn } from "@/lib/utils";

import { useAlbum } from "./album";
import { type Moment, type OtherEvent, type Still, WEDDING } from "./fixtures";

/** The wedding's one name, as the chat's own unfurl titles it. */
const WEDDING_NAME = WEDDING.name;
import type { Ground, Screen, Side } from "./knobs";
import { albumWidth, DockCluster, type RingBeat, Rows } from "./parts";

/**
 * WHAT EVERY DESIGN COMPOSES THE SAME WAY, so its own light and layout are
 * what differ: the one moment's words and acts, the offer to close, the chat
 * a card lands in, the dashboard a tile stands among, the door's sheet over
 * the album, and the card's own box.
 *
 * ★ THE WORDS ARE ONE SET (each design draws them its own way): the moment is
 * "Maya & Jay's album is ready", its numbers and Watch the party, shown once;
 * the offer is after-party's (`over=offer`), in the hub's own words.
 */

/* ── the card ───────────────────────────────────────────────────────────── */

const CW = EVENT_CARD_SIZE.width;
const CH = EVENT_CARD_SIZE.height;

/**
 * A CARD, 1200 BY 630, drawn at a width (a chat's bubble): the true card,
 * scaled. A design draws its card inside in Satori's subset (flex boxes,
 * gradients, an `<img>`), so a wiring lane ports it to the route as it stands.
 */
export function CardAt({
  width,
  children,
}: {
  width: number;
  children: ReactNode;
}) {
  const k = width / CW;
  return (
    <div
      data-ep-card-at={width}
      style={{ width, height: CH * k, overflow: "hidden" }}
    >
      <div
        style={{
          width: CW,
          height: CH,
          transform: `scale(${k})`,
          transformOrigin: "0 0",
        }}
      >
        {children}
      </div>
    </div>
  );
}

/** The card's own wordmark, small in a corner: the house signs, the album speaks. */
export function CardMark({ className }: { className?: string }) {
  return (
    <span className={cn("dark inline-flex text-foreground", className)}>
      <Logo className="h-9" />
    </span>
  );
}

/* ── the chat ───────────────────────────────────────────────────────────── */

/** A phone's link bubble: its card's width. */
const BUBBLE = 268;

function Message({
  ground,
  from,
  words,
  unfurl,
}: {
  ground: Ground;
  from?: string;
  words: string;
  unfurl?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-start" data-ep-message={ground}>
      {from ? (
        <span className="mb-1 px-3 text-xs text-muted-foreground">{from}</span>
      ) : null}
      <div
        style={unfurl ? { width: BUBBLE } : undefined}
        className="max-w-[78%] overflow-hidden rounded-[20px] rounded-bl-md bg-secondary text-foreground"
      >
        {unfurl}
        <p className="px-3.5 py-2 text-[15px] leading-snug">{words}</p>
      </div>
    </div>
  );
}

/** A link's unfurl, as every messenger draws one: the picture, then its title, its line and its address. */
function Unfurl({
  picture,
  title,
  line,
}: {
  picture: ReactNode;
  title: string;
  line: string;
}) {
  return (
    <div data-ep-unfurl="" className="bg-black/5 dark:bg-white/5">
      {picture}
      <div className="px-3.5 pt-2 pb-1.5">
        <p className="text-[13px] leading-snug font-semibold">{title}</p>
        <p className="text-[12px] leading-snug opacity-70">{line}</p>
        <p className="mt-0.5 text-[11px] opacity-50">partyreel.com</p>
      </div>
    </div>
  );
}

/**
 * THE CARD'S SECOND SEAT (create-wizard-wiring-2's `BeatLink`, merged): in
 * Create's close, under her code, her link as guests will receive it, the
 * album's own card at a chat's compact size (68 px wide), its title and the
 * link beside it, one press copying. Drawn as Create draws it, on Create's
 * dark room, never inside the chat: the card must read here too, and the
 * title beside it already says the name, so at 68 px a card reads by its
 * light and one mark.
 */
export function CreateLink({ card }: { card: ReactNode }) {
  const album = useAlbum();
  return (
    <div data-ep-create-link="" className="flex items-center gap-2.5">
      <div className="shrink-0 overflow-hidden rounded-[calc(var(--radius)*1.1)]">
        <CardAt width={68}>{card}</CardAt>
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="line-clamp-2 text-caption leading-tight font-medium text-pretty">
          Add photos to {album.name}
        </span>
        <span className="truncate text-micro text-muted-foreground">
          {album.permanent.replace(/^https?:\/\//, "").slice(0, 32)}
        </span>
      </div>
      <Copy className="size-4 shrink-0 text-muted-foreground" aria-hidden />
    </div>
  );
}

/**
 * CREATE'S CLOSE, A CROP: her code on its white mat under "Share it, and
 * they're in", then the link as guests receive it (`CreateLink`), on Create's
 * dark room; under it, the same seat for a long name (34 characters), the
 * case a card has to survive.
 */
export function CreateClose({
  card,
  long,
}: {
  card: ReactNode;
  /** The same card for a long-named album, drawn as a second row. */
  long?: ReactNode;
}) {
  return (
    <div
      data-ep-create=""
      className="dark flex min-h-screen flex-col items-center bg-[#0b0b0c] px-6 pt-7 text-foreground"
    >
      <p className="text-label text-muted-foreground uppercase">
        Create, its close
      </p>
      {/* Her code on its white plate, production's own drawing of it (`StyledQr`, the classic preset). */}
      <div className="mt-4 rounded-2xl bg-white p-2.5">
        <StyledQr
          value={WEDDING.permanent}
          size={92}
          style={resolveQrPreset("classic")}
        />
      </div>
      <div className="mt-5 w-[17.75rem] max-w-full space-y-3">
        {card}
        {long ? (
          <>
            <p className="pt-2 text-micro tracking-[0.08em] text-muted-foreground uppercase">
              A long name, at the same size
            </p>
            {long}
          </>
        ) : null}
      </div>
    </div>
  );
}

/**
 * TWO CARDS IN A CHAT: Maya's album the morning after (an open album: its
 * light may be read from its photographs), and a friend's Private party (no
 * photograph and no read of one ever leaves it: its seed). The chat is nobody's
 * app: the house's own greys and type.
 */
export function Chat({
  ground,
  open,
  closed,
}: {
  ground: Ground;
  /** The open album's card. */
  open: ReactNode;
  /** A private album's card. */
  closed: ReactNode;
}) {
  return (
    <div
      data-ep-chat={ground}
      className="flex min-h-screen flex-col bg-background text-foreground"
    >
      <div className="flex h-14 shrink-0 items-center justify-center border-b border-border text-[15px] font-semibold">
        The Lins
      </div>
      <div className="flex flex-1 flex-col justify-end gap-3 px-3 pt-4 pb-3">
        <p className="py-1 text-center text-xs text-muted-foreground">
          Sunday 9:12 AM
        </p>
        <Message
          ground={ground}
          from="Maya"
          words="Thank you all for yesterday! Everyone's photos so far"
          unfurl={
            <Unfurl
              picture={<CardAt width={BUBBLE}>{open}</CardAt>}
              title={`Add photos to ${WEDDING_NAME}`}
              line="Photos and videos from the day. Add yours."
            />
          }
        />
        <Message
          ground={ground}
          from="Ines"
          words="Mine's next month, bring your camera"
          unfurl={
            <Unfurl
              picture={<CardAt width={BUBBLE}>{closed}</CardAt>}
              title="A Partyreel album"
              line="See the photos and videos."
            />
          }
        />
      </div>
      <div className="flex shrink-0 items-center border-t border-border px-3 py-2.5">
        <div className="flex h-9 flex-1 items-center rounded-full border border-border px-4 text-[15px] text-muted-foreground">
          Message
        </div>
      </div>
    </div>
  );
}

/* ── the dashboard ──────────────────────────────────────────────────────── */

/** A tile's words under its picture: its name and its day, as the dashboard sets them. */
export function TileWords({ event }: { event: OtherEvent }) {
  const day = event.date
    ? new Date(`${event.date}T12:00:00`).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "No date";
  return (
    <div className="mt-2.5 px-0.5">
      <p className="truncate font-heading text-card-title">{event.name}</p>
      {/* A party to come shows its day on its face, so the line under it never says it twice. */}
      {event.cover ? (
        <p className="text-caption text-muted-foreground">{day}</p>
      ) : (
        <p className="text-caption text-muted-foreground">No photos yet</p>
      )}
    </div>
  );
}

/**
 * MAYA'S DASHBOARD, A CROP: her events as tiles, the wedding live with its
 * photographs, a birthday to come and a weekend with no date (no photograph
 * yet: a design's own light for a party before its first), and a summer party
 * kept.
 */
export function Dashboard({
  events,
  tile,
}: {
  events: readonly OtherEvent[];
  tile: (e: OtherEvent) => ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background px-5 pt-6 text-foreground">
      <div className="mb-5 flex items-baseline justify-between">
        <h2 className="font-heading text-page">Your events</h2>
        <span className="text-sm text-muted-foreground">
          {formatCount(events.length)} events
        </span>
      </div>
      <div className="grid grid-cols-4 gap-5">
        {events.map((e) => (
          <div key={e.seed} data-ep-tile-of={e.cover ? "photo" : "none"}>
            {tile(e)}
            <TileWords event={e} />
          </div>
        ))}
      </div>
    </div>
  );
}

/** A tile's box: the dashboard's corner and shape, its picture or its light inside. */
export function TileBox({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative aspect-[4/3] overflow-hidden rounded-2xl bg-muted",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** A photograph covering its box. */
export function Cover({
  still,
  className,
}: {
  still: Still;
  className?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- a stand-in photograph
    <img
      src={still.src}
      alt=""
      draggable={false}
      className={cn("absolute inset-0 size-full object-cover", className)}
      style={{ objectPosition: still.focus }}
    />
  );
}

/** A party to come's day, set like the date on an invitation (the tile's own face). */
export function DayFace({ event }: { event: OtherEvent }) {
  const d = event.date ? new Date(`${event.date}T12:00:00`) : null;
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center pb-2 text-foreground">
      {d ? (
        <>
          <span className="text-label text-muted-foreground uppercase">
            {d.toLocaleDateString("en-US", { weekday: "short" })} ·{" "}
            {d.toLocaleDateString("en-US", { month: "short" })}
          </span>
          <span className="mt-1 font-heading text-section tabular-nums">
            {d.getDate()}
          </span>
        </>
      ) : (
        <span className="text-label text-muted-foreground uppercase">
          No date
        </span>
      )}
    </div>
  );
}

/* ── the door ───────────────────────────────────────────────────────────── */

function PhotoBody() {
  return (
    <div data-upload-step="pick" className="flex flex-col gap-4 pt-1">
      <DoorHeading
        title="Add your photos"
        reason={uploadStepReason({
          isDemo: false,
          requireUpload: false,
          albumEmpty: false,
          camera: false,
        })}
      />
      <UploadIntentBody
        picks={[]}
        onPicks={() => {}}
        onSend={() => {}}
        footer={
          <Button
            type="button"
            variant="ghost"
            tabIndex={-1}
            className="w-full text-muted-foreground"
          >
            Skip for now
          </Button>
        }
      />
    </div>
  );
}

/** Production's own stand-down of today's lamp, in the frame's document alone. */
const NO_LAMP = "[data-door-lamp] { display: none !important; }";

/** The sheet's box in the frame, read once it has risen (the panel portals a commit after it mounts, then slides in). */
function useSheetBox(root: HTMLElement | null) {
  const [box, setBox] = useState<DOMRect | null>(null);
  useEffect(() => {
    const doc = root?.ownerDocument;
    const win = doc?.defaultView;
    if (!doc || !win) return;
    // ★ THE SHEET KEEPS RISING PAST ANY ONE READ (featured's measure: a light placed at 542px while the sheet's edge
    // stood at 512): it portals a commit late, waits out the arrival's beat, slides in by a transform (which no
    // ResizeObserver sees) and its body settles after. So the box is read once a frame for the whole arrival window,
    // whatever it did a frame before, and on every change of the sheet's own size after it.
    let sheet: HTMLElement | null = null;
    let ro: ResizeObserver | null = null;
    let raf = 0;
    let last = "";
    const read = () => {
      sheet ??= doc.querySelector<HTMLElement>("[data-entry-sheet]");
      if (!sheet) return;
      if (!ro) {
        ro = new win.ResizeObserver(read);
        ro.observe(sheet);
      }
      const r = sheet.getBoundingClientRect();
      const key = `${Math.round(r.left)} ${Math.round(r.top)} ${Math.round(r.width)} ${Math.round(r.height)}`;
      if (key !== last) {
        last = key;
        setBox(r);
      }
    };
    const t0 = win.performance.now();
    const tick = (now: number) => {
      read();
      if (now - t0 < 5000) raf = win.requestAnimationFrame(tick);
    };
    raf = win.requestAnimationFrame(tick);
    return () => {
      win.cancelAnimationFrame(raf);
      ro?.disconnect();
    };
  }, [root]);
  return box;
}

/**
 * THE DOOR'S SHEET OVER THE ALBUM: production's own held sheet (`EntryShell`)
 * at her last step, her first photo, over a design's page; the design's one
 * light placed at the sheet's free edge (`light`, handed the sheet's box), or
 * production's lamps where a design keeps them (`lamps`).
 */
export function DoorOver({
  page,
  light,
  lamps = false,
}: {
  page: ReactNode;
  light?: (box: DOMRect) => ReactNode;
  lamps?: boolean;
}) {
  const [root, setRoot] = useState<HTMLDivElement | null>(null);
  const box = useSheetBox(root);
  return (
    <div ref={setRoot} data-ep-door={lamps ? "lamps" : "light"}>
      {lamps ? null : <style>{NO_LAMP}</style>}
      {page}
      <EntryShell
        open
        dismissMode="held"
        onDismiss={() => {}}
        title="Add your photos"
        description="Add one now, or look around first."
      >
        <PhotoBody />
      </EntryShell>
      {light && box ? light(box) : null}
    </div>
  );
}

/* ── the one moment ─────────────────────────────────────────────────────── */

/**
 * THE MOMENT'S WORDS, ONE SET (after-party r1's `recap`: "an 'everything is
 * ready!' type of delight"), the reward first and the closure in the small
 * line (the creative director's pass: a moment that opened on "Adding is
 * closed" led with a no): the album's name, "Everything's in", what it holds,
 * then that adding is closed and everything else works as before.
 */
export function PremiereWords({
  side,
  moment,
  align = "center",
  tone = "room",
  className,
}: {
  side: Side;
  moment: Moment;
  align?: "center" | "start";
  /** On the room's own dark, or standing on a photograph (its quiet lines in the cover's white). */
  tone?: "room" | "photo";
  className?: string;
}) {
  const album = useAlbum();
  const quiet = tone === "photo" ? "text-white/80" : "text-muted-foreground";
  return (
    <div
      data-ep-premiere-words=""
      className={cn(
        "flex flex-col gap-3",
        align === "center" ? "items-center text-center" : "items-start",
        className,
      )}
    >
      <p className={cn("text-label uppercase", quiet)}>{album.name}</p>
      <h2 className="font-heading text-chapter text-balance text-foreground">
        Everything&apos;s in
      </h2>
      <p className={cn("text-reading text-pretty", quiet)}>
        {formatCount(moment.photos)} photos and {formatCount(moment.videos)}{" "}
        videos from {formatCount(moment.guests)} guests, the whole party in one
        place.
      </p>
      <p className={cn("text-caption text-pretty", quiet)}>
        {side === "host"
          ? "You closed adding. Everything else works as before."
          : `${album.host.name} closed adding. Everything else works as before.`}
      </p>
    </div>
  );
}

/** The moment's acts: Watch the party first; hers adds Share the album; then the page as before. */
export function PremiereActs({
  side,
  on = "room",
  align = "center",
}: {
  side: Side;
  on?: "room" | "page";
  align?: "center" | "start";
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3",
        align === "center" ? "items-center" : "items-start",
      )}
    >
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button
          type="button"
          variant={on === "room" ? "on-photo" : "default"}
          size="cta"
          tabIndex={-1}
        >
          <Play className="fill-current" /> Watch the party
        </Button>
        {side === "host" ? (
          <Button
            type="button"
            variant={on === "room" ? "glass" : "outline"}
            size="cta"
            tabIndex={-1}
          >
            <Share2 /> Share the album
          </Button>
        ) : null}
      </div>
      <button
        type="button"
        tabIndex={-1}
        className="text-sm text-muted-foreground underline-offset-4 hover:underline"
      >
        {side === "host" ? "Back to your album" : "Go to the album"}
      </button>
    </div>
  );
}

/** The reel's poster: its opening photograph, in a frame of the design's own. */
export function Poster({
  still,
  className,
  children,
}: {
  still: Still;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div
      data-ep-poster=""
      className={cn("relative overflow-hidden rounded-2xl bg-black", className)}
    >
      <Cover still={still} />
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="flex size-16 items-center justify-center rounded-full bg-white/90 text-black shadow-layer">
          <Play className="ml-1 size-7 fill-current" />
        </span>
      </div>
      {children}
    </div>
  );
}

/* ── the offer ──────────────────────────────────────────────────────────── */

/**
 * CLOSE ADDING, OFFERED (after-party r1's `over=offer`): two days after the
 * last photo, dated or not, one line on her page, never done for her.
 */
export function Offer({
  on = "room",
  className,
}: {
  on?: "room" | "page";
  className?: string;
}) {
  return (
    <div
      data-ep-offer=""
      className={cn(
        "flex flex-wrap items-center gap-x-3 gap-y-2 text-sm",
        className,
      )}
    >
      <p className="text-foreground">
        <span className="font-medium">No new photos since Monday.</span>{" "}
        <span className="text-muted-foreground">
          Close adding? Guests can still see and save all 214.
        </span>
      </p>
      <span className="flex items-center gap-2">
        <Button
          type="button"
          variant={on === "room" ? "on-photo" : "default"}
          size="sm"
          tabIndex={-1}
        >
          Close adding
        </Button>
        <Button
          type="button"
          variant={on === "room" ? "glass" : "outline"}
          size="sm"
          tabIndex={-1}
        >
          Keep it open
        </Button>
      </span>
    </div>
  );
}

/** The width class a screen's content keeps (a frame's own). */
export const screenIs = (screen: Screen) => screen === "1440";

/* ── the Add, at rest and answering ─────────────────────────────────────── */

/**
 * THE ADD, TWICE: the album's foot with the dock at rest, and the same foot
 * the instant her photo lands (the envelope at its height), one over the
 * other in one phone frame, so the two beats are read side by side. Each half
 * is the album scrolled in, the dock's gradient and its three, the design's
 * own Add in the middle (`atom`).
 */
export function AddPair({ atom }: { atom: (beat: RingBeat) => ReactNode }) {
  const beats: { beat: RingBeat; words: string }[] = [
    { beat: "rest", words: "At rest" },
    { beat: "lands", words: "Her photo lands" },
  ];
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {beats.map(({ beat, words }) => (
        <div
          key={beat}
          data-ep-add-beat={beat}
          className="relative h-[406px] overflow-hidden border-b border-border/60 last:border-b-0"
        >
          <div className="absolute inset-x-3 -top-24">
            <Rows width={albumWidth(375)} />
          </div>
          <span className="absolute top-3 left-3 z-10 rounded-full bg-black/55 px-2.5 py-1 text-xs text-white">
            {words}
          </span>
          <div className="absolute inset-x-0 bottom-0">
            <div
              aria-hidden
              className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-background via-background/70 to-transparent"
            />
            {/* Closer: the dock at one and a half times its size, so the Ring's lift reads at the board's scale. */}
            <div
              style={{ transform: "scale(1.5)", transformOrigin: "50% 100%" }}
            >
              <DockCluster add={atom(beat)} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
