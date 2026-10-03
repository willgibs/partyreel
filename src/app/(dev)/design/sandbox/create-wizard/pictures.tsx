"use client";

import type { CSSProperties } from "react";
import { Camera, Clock, ImagePlus, Play, SwitchCamera } from "lucide-react";

import { GUEST_GHOST_FRAMES } from "@/components/guest/gallery-empty-state";
import { cn } from "@/lib/utils";

import {
  ALBUM_STILLS,
  ARRIVING,
  EVENT,
  HERS,
  type MomentId,
  NIGHT,
  PREMIERE,
  REEL,
  ROLL,
  type Still,
  type StyleId,
} from "./fixtures";

/**
 * THE PICTURES THE ADD STEP SHOWS: a guest's screen in each album style at
 * each moment of the night, the phone it stands in, and each style's own
 * small album (Settings' picture, moving through the night).
 *
 * ★ A PICTURE IS SIZED BY ITS BOX, NEVER BY THE VIEWPORT. Every mark inside a
 * guest's screen is in `cqw` (a hundredth of the picture's own width), so one
 * drawing reads the same in a 100 px strip, a 150 px phone at a phone and a
 * 200 px one at a desk, the way a photograph scales: design-system.md's
 * carve-out for type drawn inside a picture. Every picture is marked
 * `data-cw-picture`, so a caption counts the words a host reads, never the
 * words a picture shows.
 *
 * ★ THE GUEST'S WORDS ARE THE-WAIT'S (`model=time`, wired by `wait-wiring`):
 * every wait is Developing, its clock says which ("As Maya lets them in", "All
 * at once at 9 am"), and the preset is Disposable on the cover. The camera is
 * drawn in `disposable-mode`'s picks (the roll a timeline, the album while it
 * develops the party's contact sheet, her own shots its only pictures). These
 * are this board's small redrawings in those boards' settled words; a pick
 * here decides none of them. Nothing is tilted.
 */

function Img({
  still,
  className,
  style,
}: {
  still: Still;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- a local still in a small picture of a guest's phone
    <img
      src={still.src}
      alt=""
      draggable={false}
      className={cn("block size-full object-cover", className)}
      style={style}
    />
  );
}

/* ── the album's parts ──────────────────────────────────────────────────── */

/** The album's head as a guest meets it: the preset's word over the name, then its count. */
function Head({ eyebrow, count }: { eyebrow?: string; count: string }) {
  return (
    <span className="block">
      {eyebrow && (
        <span className="mb-[1.6cqw] block text-[3.3cqw] font-medium tracking-[0.04em] text-white/70">
          {eyebrow}
        </span>
      )}
      <span className="block font-heading text-[8.6cqw] leading-[1.05]">
        {EVENT.short}
      </span>
      <span className="mt-[1.4cqw] block text-[3.7cqw] text-gallery-muted">
        {count}
      </span>
    </span>
  );
}

/** The album's own Add, a white pill at the thumb (the camera's says Take photos). */
function Pill({
  icon = "add",
  children,
}: {
  icon?: "add" | "camera";
  children: string;
}) {
  const Icon = icon === "camera" ? Camera : ImagePlus;
  return (
    <span className="mx-auto flex h-[11.5cqw] items-center gap-[1.8cqw] rounded-full bg-white px-[5.5cqw] text-[3.9cqw] font-medium whitespace-nowrap text-black">
      <Icon className="size-[4.3cqw]" strokeWidth={2.25} />
      {children}
    </span>
  );
}

/** The album's rows, clipped to the room the screen leaves them. */
function Rows({
  from,
  count,
  fresh,
}: {
  from: number;
  count: number;
  fresh?: boolean;
}) {
  const all = [...ALBUM_STILLS, ...ALBUM_STILLS, ...ALBUM_STILLS];
  return (
    <span className="mt-[3.5cqw] block min-h-0 flex-1 overflow-hidden">
      <span className="grid grid-cols-3 gap-[1.3cqw]">
        {all.slice(from, from + count).map((s, i) => (
          <span
            key={`${s.id}-${i}`}
            className={cn(
              "relative block aspect-square overflow-hidden rounded-[1.5cqw]",
              fresh && i === 0 && "cw-arrival",
            )}
          >
            <Img still={s} />
          </span>
        ))}
      </span>
    </span>
  );
}

/** The album's reel (or the roll's premiere) the morning after, a banner over the rows. */
function Banner({ still, children }: { still: Still; children: string }) {
  return (
    <span className="relative mt-[4cqw] block aspect-[16/10] shrink-0 overflow-hidden rounded-[2.4cqw]">
      <Img still={still} />
      <span className="absolute inset-0 bg-gradient-to-t from-black/65 to-transparent" />
      <span className="absolute bottom-[2.6cqw] left-[3cqw] flex items-center gap-[1.5cqw] text-[3.7cqw] font-medium">
        <Play className="size-[3.7cqw] fill-current" />
        {children}
      </span>
    </span>
  );
}

/** The room a screen's content stands in: the phone's own margins. */
const SCREEN = "flex h-full flex-col px-[6cqw] pt-[13cqw] pb-[7cqw]";

/* ── a live album, and a reviewed one ───────────────────────────────────── */

function Empty() {
  return (
    <span className={SCREEN}>
      <Head count={`Hosted by ${EVENT.host}`} />
      <span className="my-auto block">
        <span className="grid grid-cols-3 gap-[1.8cqw]">
          {Array.from({ length: 6 }, (_, i) => (
            <span
              key={i}
              className="block aspect-square rounded-[1.5cqw] border border-dashed border-white/15"
            />
          ))}
        </span>
        <span className="mt-[4cqw] block text-center text-[3.9cqw] text-gallery-muted">
          Be the first to add
        </span>
      </span>
      <Pill>Add photos</Pill>
    </span>
  );
}

function LiveAt({ moment }: { moment: MomentId }) {
  if (moment === "arrive") return <Empty />;
  if (moment === "party")
    return (
      <span className={SCREEN}>
        <Head count={`${NIGHT.party} photos · ${NIGHT.guests} guests`} />
        <Rows from={0} count={18} fresh />
        <span className="pt-[3.5cqw]">
          <Pill>Add photos</Pill>
        </span>
      </span>
    );
  return (
    <span className={SCREEN}>
      <Head count={`${NIGHT.morning} photos · 14 guests`} />
      <Banner still={REEL}>Highlight reel</Banner>
      <Rows from={4} count={12} />
    </span>
  );
}

/**
 * A REVIEWED ALBUM AT THE PARTY, in the-wait's one word: what Maya has let in
 * stands as the album, and what still waits for her is Developing, a short
 * sheet over the rows (everyone's dark, hers lit), its clock "As Maya lets
 * them in".
 */
function ReviewedAt({ moment }: { moment: MomentId }) {
  if (moment === "arrive") return <Empty />;
  if (moment === "morning") return <LiveAt moment="morning" />;
  return (
    <span className={SCREEN}>
      <Head count={`${NIGHT.letIn} photos · ${NIGHT.guests} guests`} />
      <span className="mt-[3.5cqw] block rounded-[2.4cqw] bg-white/[0.07] p-[2.6cqw]">
        <span className="flex items-baseline justify-between text-[3.4cqw]">
          <span className="font-medium">{`Developing · ${NIGHT.waiting}`}</span>
          <span className="text-white/55">{`As ${EVENT.host} lets them in`}</span>
        </span>
        <span className="mt-[2cqw] grid grid-cols-10 gap-[0.9cqw]">
          {Array.from({ length: 20 }, (_, n) =>
            n === 6 || n === 15 ? (
              <span
                key={n}
                className="block aspect-square overflow-hidden rounded-[0.6cqw] ring-[0.35cqw] ring-white/80"
              >
                <Img still={HERS[n === 6 ? 0 : 1]!} />
              </span>
            ) : (
              <span
                key={n}
                className={cn(
                  "block aspect-square rounded-[0.6cqw]",
                  n > 16 ? "cw-sheet-warm" : "bg-white/[0.12]",
                )}
              />
            ),
          )}
        </span>
      </span>
      <Rows from={2} count={12} />
      <span className="pt-[3.5cqw]">
        <Pill>Add photos</Pill>
      </span>
    </span>
  );
}

/* ── a disposable ───────────────────────────────────────────────────────── */

/**
 * THE ROLL AS A TIMELINE (`disposable-mode` r3's `camera=timeline`): the
 * picture held in a frame of its own, and under it the roll as rounded frames
 * on black, the one she is on holding the live picture in miniature.
 */
function Timeline() {
  return (
    <span className="relative mx-auto mt-[3.4cqw] block h-[11cqw] w-full overflow-hidden">
      {Array.from({ length: 9 }, (_, i) => {
        const at = i - 4;
        const now = at === 0;
        return (
          <span
            key={i}
            className={cn(
              "absolute top-0 block h-full w-[8.2cqw] overflow-hidden rounded-[1.6cqw]",
              now ? "ring-[0.5cqw] ring-white" : "ring-[0.3cqw] ring-white/18",
            )}
            style={{ left: `calc(50% - 4.1cqw + ${at * 10.2}cqw)` }}
          >
            {now && <Img still={ARRIVING} />}
          </span>
        );
      })}
    </span>
  );
}

/** The album's camera as guests arrive: a roll of 24 each, nothing shot yet. */
function CameraArriving() {
  return (
    <span className="flex h-full flex-col pt-[11cqw]">
      <span className="flex items-baseline justify-between px-[5.5cqw]">
        <span className="font-heading text-[6.4cqw]">{EVENT.short}</span>
        <span className="text-[3.4cqw] text-white/60">
          {`Develops ${ROLL.develops}`}
        </span>
      </span>
      <span className="relative mx-[3cqw] mt-[3cqw] block aspect-[3/4] shrink-0 overflow-hidden rounded-[6cqw]">
        <Img still={ARRIVING} style={{ objectPosition: "50% 45%" }} />
      </span>
      <Timeline />
      <span className="mt-[2cqw] block text-center text-[3cqw] text-white/50 tabular-nums">
        {`Frame 1 of ${ROLL.shots}`}
      </span>
      <span className="mt-auto grid grid-cols-3 items-center px-[8cqw] pb-[8cqw]">
        <span className="justify-self-start leading-none">
          <span className="block font-heading text-[7.4cqw] tabular-nums">
            {ROLL.shots}
          </span>
          <span className="mt-[1cqw] block text-[3cqw] text-white/60">
            left
          </span>
        </span>
        <span className="block size-[17cqw] justify-self-center rounded-full border-[0.9cqw] border-white p-[1.3cqw]">
          <span className="block size-full rounded-full bg-white" />
        </span>
        <span className="flex size-[10cqw] items-center justify-center justify-self-end rounded-full bg-white/12">
          <SwitchCamera className="size-[4.8cqw]" />
        </span>
      </span>
    </span>
  );
}

/**
 * THE PARTY'S CONTACT SHEET (the-wait's `wait=sheet`, in its one word): every
 * shot a sealed square in the order taken, the newest still warm, hers the only
 * pictures, the count over it and the clock under it.
 */
function ContactSheet() {
  const hers = new Map(
    [9, 31, 58, 77, 104, 131].map((n, i) => [n, HERS[i]!] as const),
  );
  return (
    <span className="cw-sheet-room flex h-full flex-col items-center px-[6cqw] pt-[12cqw] pb-[7cqw] text-center">
      <span className="text-[3.3cqw] font-medium tracking-[0.04em] text-white/70">
        {`Disposable · develops ${ROLL.develops}`}
      </span>
      <span className="mt-[1.2cqw] font-heading text-[6.4cqw]">
        {EVENT.short}
      </span>
      <span className="my-auto block w-full">
        <span className="block text-[3.6cqw] text-white/60">Developing</span>
        <span className="mt-[0.6cqw] block font-heading text-[15cqw] leading-none tabular-nums">
          {NIGHT.party}
        </span>
        <span className="mt-[1.6cqw] block text-[3.5cqw] text-gallery-muted">
          {`shots from ${NIGHT.guests} guests`}
        </span>
        <span className="mt-[4.5cqw] grid grid-cols-12 gap-[0.9cqw]">
          {Array.from({ length: 144 }, (_, n) => {
            if (n >= NIGHT.party)
              return <span key={n} className="block aspect-square" />;
            const mine = hers.get(n);
            if (mine)
              return (
                <span
                  key={n}
                  className="block aspect-square overflow-hidden rounded-[0.6cqw] ring-[0.35cqw] ring-white/80"
                >
                  <Img still={mine} />
                </span>
              );
            return (
              <span
                key={n}
                className={cn(
                  "block aspect-square rounded-[0.6cqw]",
                  NIGHT.party - n < 12 ? "cw-sheet-warm" : "bg-white/[0.11]",
                )}
              />
            );
          })}
        </span>
        <span className="mt-[4cqw] inline-flex items-center gap-[1.5cqw] rounded-full bg-white/10 px-[3.4cqw] py-[1.5cqw] text-[3.3cqw]">
          {`All at once at ${ROLL.develops}`}
        </span>
      </span>
      <Pill icon="camera">{`Take a photo · ${ROLL.shots - NIGHT.hers} left`}</Pill>
    </span>
  );
}

function DisposableAt({ moment }: { moment: MomentId }) {
  if (moment === "arrive") return <CameraArriving />;
  if (moment === "party") return <ContactSheet />;
  return (
    <span className={SCREEN}>
      <Head
        eyebrow={`Disposable · developed at ${ROLL.develops}`}
        count={`${NIGHT.morning} shots · 14 guests`}
      />
      <Banner still={PREMIERE}>The roll&rsquo;s premiere</Banner>
      <Rows from={1} count={12} />
    </span>
  );
}

/* ── a guest's screen, and her phone ────────────────────────────────────── */

/** A guest's screen in a style at a moment: a picture, filling its box. */
export function GuestScreen({
  style,
  moment,
  className,
}: {
  style: StyleId;
  moment: MomentId;
  className?: string;
}) {
  return (
    <span
      data-cw-picture={`${style}-${moment}`}
      className={cn(
        "@container relative block overflow-hidden bg-gallery text-gallery-foreground",
        className,
      )}
    >
      {/* Keyed by its moment, so a slide of the night comes up like a print
          (create-wizard.css: `cw-screen-in`, only where motion is welcome). */}
      <span
        key={`${style}-${moment}`}
        className="cw-screen-in absolute inset-0"
      >
        {style === "live" ? (
          <LiveAt moment={moment} />
        ) : style === "approval" ? (
          <ReviewedAt moment={moment} />
        ) : (
          <DisposableAt moment={moment} />
        )}
      </span>
    </span>
  );
}

/**
 * A GUEST'S PHONE, DRAWN AS THE WIRED ROOM DRAWS ONE (`create-room.css`'s
 * `cr-phone`, the look step's own device): a black body with a hairline of
 * light on its rim and the island at its head, its screen the guest's at that
 * moment. Sized by its width; the body holds a phone's ratio.
 */
export function Phone({
  style,
  moment,
  lit,
  className,
}: {
  style: StyleId;
  moment: MomentId;
  /** The pick: its rim catches the room's light. */
  lit?: boolean;
  className?: string;
}) {
  // ★ THE CONTAINER IS THE WRAPPER, NEVER THE BODY: a `cqw` on an element
  // reads its nearest ANCESTOR container, so a body that was its own container
  // took its bezel and corners from the frame's width (a capsule at a desk).
  return (
    <span data-cw-phone={style} className={cn("@container block", className)}>
      <span className={cn("cr-phone block", lit && "cw-phone-lit")}>
        <span className="cr-phone-glass block">
          <GuestScreen style={style} moment={moment} className="size-full" />
          <span aria-hidden className="cr-phone-island" />
        </span>
      </span>
    </span>
  );
}

/* ── a style's own small album ──────────────────────────────────────────── */

/**
 * A STYLE'S PICTURE, SETTINGS' OWN, MOVING THROUGH THE NIGHT. At the party it
 * is exactly the card's picture in Settings (`StylePicture` on `wait-wiring`):
 * Live all lit; Reviewed lit but for one held under a clock and one fading in;
 * a Disposable dark but for one, hers. As guests arrive every album is empty
 * (the disposable's camera holds its roll), and the next morning every one is
 * whole, the reel's mark on it.
 */
export function StylePicture({
  style,
  moment,
  className,
}: {
  style: StyleId;
  moment: MomentId;
  className?: string;
}) {
  const frames = GUEST_GHOST_FRAMES.slice(0, 6);
  const empty = moment === "arrive";
  const whole = moment === "morning";
  return (
    <span
      data-cw-picture={`style-${style}-${moment}`}
      data-cw-style-picture={style}
      className={cn(
        "@container relative grid shrink-0 grid-cols-3 gap-[2px] overflow-hidden rounded-[10px] bg-gallery p-[3px]",
        className,
      )}
    >
      {frames.map((frame, i) => {
        const lit = whole
          ? true
          : empty
            ? false
            : style === "live"
              ? true
              : style === "approval"
                ? i % 3 !== 2
                : i === 4;
        const held = !whole && !empty && style === "approval" && i % 3 === 2;
        return (
          <span
            key={frame.src}
            className={cn(
              "cw-style-cell relative overflow-hidden rounded-[2px]",
              empty && style !== "disposable"
                ? "border border-dashed border-white/15"
                : "bg-white/10",
              style === "disposable" &&
                lit &&
                !whole &&
                "shadow-[0_0_0_1px_#fff]",
            )}
          >
            {lit && (
              // eslint-disable-next-line @next/next/no-img-element -- a ghost-pack still, the style's picture
              <img
                src={frame.src}
                alt=""
                draggable={false}
                className={cn(
                  "absolute inset-0 size-full object-cover",
                  !whole && style === "approval" && i % 3 === 1 && "opacity-40",
                )}
              />
            )}
            {held && (
              <Clock
                className="absolute inset-0 m-auto size-[9cqw] text-white/60"
                aria-hidden
              />
            )}
          </span>
        );
      })}
      {empty && style === "disposable" && (
        <span className="absolute inset-0 flex items-center justify-center gap-[3cqw] text-[11cqw] font-medium text-white/80 tabular-nums">
          <Camera className="size-[12cqw]" strokeWidth={2} aria-hidden />
          {ROLL.shots}
        </span>
      )}
      {whole && (
        <span className="absolute bottom-[6cqw] left-[6cqw] flex size-[17cqw] items-center justify-center rounded-full bg-black/55">
          <Play className="size-[8cqw] fill-current text-white" aria-hidden />
        </span>
      )}
    </span>
  );
}
