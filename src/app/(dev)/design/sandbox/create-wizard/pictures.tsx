"use client";

import type { CSSProperties } from "react";
import {
  ArrowBigUp,
  Camera,
  Delete,
  ImagePlus,
  Mic,
  Play,
  Smile,
  SwitchCamera,
} from "lucide-react";

import { StyledQr } from "@/components/app/styled-qr";
import { QR_PRESETS, type QrStyleKey } from "@/lib/constants/qr-presets";
import { cn } from "@/lib/utils";

import {
  ALBUM_STILLS,
  ARRIVING,
  EVENT,
  HERS,
  type HourId,
  hourOf,
  PARTY,
  PREMIERE,
  ROLL,
  type Still,
} from "./fixtures";

/**
 * THE PICTURES CREATE SHOWS: a guest's phone at an hour of the night, in the
 * album or the disposable camera; the code on its white plate; a window onto
 * a look's corner; and the phone's own keyboard under the name.
 *
 * ★ A PICTURE IS SIZED BY ITS BOX, NEVER BY THE VIEWPORT. Every mark inside a
 * guest's screen is in `cqw` (a hundredth of the picture's own width), so one
 * drawing reads the same in a 150 px phone at a phone and a 230 px one at a
 * desk, the way a photograph scales. That is the design system's own carve-out
 * for type drawn inside a picture (design-system.md, "off the ladder on
 * purpose"), and every picture is marked `data-cw-picture` so the captions
 * count the words a host reads, not the words a picture shows.
 *
 * ★ THE CAMERA IS DRAWN IN ITS ROUND-THREE PICKS (`disposable-mode`): the
 * picture held in a frame of its own with the roll as a timeline under it
 * (`camera=timeline`), and the album while it develops as the party's contact
 * sheet (`waiting=sheet`), her own shots the only pictures on it. They are
 * this board's own small redrawings in that board's settled numbers (24 shots,
 * 9 am), so a pick here never decides a camera. Nothing is tilted.
 */

/* ── a still ────────────────────────────────────────────────────────────── */

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

export type Mode = "album" | "camera";

/* ── the album, at an hour ──────────────────────────────────────────────── */

/** The album's head, as a guest meets it: the name first (bible 7), then its count. */
function Head({ count }: { count?: string }) {
  return (
    <span className="block">
      <span className="block font-heading text-[8.6cqw] leading-[1.05]">
        {EVENT.short}
      </span>
      <span className="mt-[1.4cqw] block text-[3.7cqw] text-gallery-muted">
        {count ?? `Hosted by ${EVENT.host}`}
      </span>
    </span>
  );
}

/** The album's own Add, a white pill at the thumb. */
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

/** A square tile of the rows, with the arrival's rim on the newest. */
function Tile({ still, fresh }: { still: Still; fresh?: boolean }) {
  return (
    <span
      className={cn(
        "relative block aspect-square overflow-hidden rounded-[1.5cqw]",
        fresh && "cw-arrival",
      )}
    >
      <Img still={still} />
    </span>
  );
}

function Rows({
  from,
  to,
  fresh,
}: {
  from: number;
  to: number;
  fresh?: boolean;
}) {
  return (
    // The rows take the room the box leaves and clip the rest, so the Add
    // stays at the thumb in a tall phone, a square or a wide one.
    <span className="mt-[3.5cqw] block min-h-0 flex-1 overflow-hidden">
      <span className="grid grid-cols-3 gap-[1.3cqw]">
        {[...ALBUM_STILLS, ...ALBUM_STILLS].slice(from, to).map((s, i) => (
          <Tile key={`${s.id}-${i}`} still={s} fresh={fresh && i === 0} />
        ))}
      </span>
    </span>
  );
}

function AlbumAt({ hour }: { hour: HourId }) {
  if (hour === "arrive")
    return (
      <span className="flex h-full flex-col px-[6cqw] pt-[13cqw] pb-[7cqw]">
        <Head />
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
  const morning = hour === "morning";
  const { photos } = hourOf(hour);
  return (
    <span className="flex h-full flex-col px-[6cqw] pt-[13cqw] pb-[7cqw]">
      <Head
        count={`${photos} photos · ${morning ? 14 : PARTY.guests} guests`}
      />
      {morning && (
        <span className="relative mt-[4cqw] block aspect-[16/10] shrink-0 overflow-hidden rounded-[2.4cqw]">
          <Img still={ALBUM_STILLS[3]} />
          <span className="absolute inset-0 bg-gradient-to-t from-black/65 to-transparent" />
          <span className="absolute bottom-[2.6cqw] left-[3cqw] flex items-center gap-[1.5cqw] text-[3.7cqw] font-medium">
            <Play className="size-[3.7cqw] fill-current" />
            Highlight reel
          </span>
        </span>
      )}
      <Rows from={morning ? 4 : 0} to={morning ? 13 : 18} fresh={!morning} />
      <span className="pt-[3.5cqw]">
        <Pill>Add photos</Pill>
      </span>
    </span>
  );
}

/* ── the camera, at an hour ─────────────────────────────────────────────── */

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

function CameraAt({ hour }: { hour: HourId }) {
  if (hour === "arrive")
    return (
      <span className="flex h-full flex-col pt-[11cqw]">
        <span className="flex items-baseline justify-between px-[5.5cqw]">
          <span className="font-heading text-[6.4cqw]">{EVENT.short}</span>
          <span className="text-[3.4cqw] text-white/60">
            Develops {ROLL.develops}
          </span>
        </span>
        <span className="relative mx-[3cqw] mt-[3cqw] block aspect-[3/4] shrink-0 overflow-hidden rounded-[6cqw]">
          <Img still={ARRIVING} style={{ objectPosition: "50% 45%" }} />
        </span>
        <Timeline />
        <span className="mt-[2cqw] block text-center text-[3cqw] text-white/50 tabular-nums">
          Frame 1 of {ROLL.shots}
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
  if (hour === "party") return <ContactSheet />;
  return (
    <span className="flex h-full flex-col px-[6cqw] pt-[13cqw] pb-[7cqw]">
      <Head count={`Developed · ${hourOf("morning").photos} shots`} />
      <span className="relative mt-[4cqw] block aspect-[16/10] shrink-0 overflow-hidden rounded-[2.4cqw]">
        <Img still={PREMIERE} />
        <span className="absolute inset-0 bg-gradient-to-t from-black/65 to-transparent" />
        <span className="absolute bottom-[2.6cqw] left-[3cqw] flex items-center gap-[1.5cqw] text-[3.7cqw] font-medium">
          <Play className="size-[3.7cqw] fill-current" />
          The roll&rsquo;s premiere
        </span>
      </span>
      <Rows from={1} to={13} />
    </span>
  );
}

/**
 * THE PARTY'S CONTACT SHEET (`disposable-mode` r3's `waiting=sheet`): every
 * shot a sealed square in the order it was taken, the newest still warm, hers
 * the only pictures, the count over it and the develop time under it.
 */
function ContactSheet() {
  const shots = hourOf("party").photos;
  // Her six, spread through the night the way she shot them.
  const hers = new Map(
    [9, 31, 58, 77, 104, 131].map((n, i) => [n, HERS[i]] as const),
  );
  return (
    <span className="cw-sheet-room flex h-full flex-col items-center px-[6cqw] pt-[13cqw] pb-[7cqw] text-center">
      <span className="font-heading text-[6.4cqw]">{EVENT.short}</span>
      <span className="mt-[0.6cqw] text-[3.3cqw] text-white/55">
        Developing
      </span>
      <span className="my-auto block w-full">
        <span className="block font-heading text-[15cqw] leading-none tabular-nums">
          {shots}
        </span>
        <span className="mt-[1.6cqw] block text-[3.5cqw] text-gallery-muted">
          shots from {PARTY.guests} guests
        </span>
        <span className="mt-[4.5cqw] grid grid-cols-12 gap-[0.9cqw]">
          {Array.from({ length: 144 }, (_, n) => {
            if (n >= shots)
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
            const warm = shots - n < 12;
            return (
              <span
                key={n}
                className={cn(
                  "block aspect-square rounded-[0.6cqw]",
                  warm ? "cw-sheet-warm" : "bg-white/[0.11]",
                )}
              />
            );
          })}
        </span>
        <span className="mt-[4cqw] inline-flex items-center gap-[1.5cqw] rounded-full bg-white/10 px-[3.4cqw] py-[1.5cqw] text-[3.3cqw]">
          Develops at {ROLL.develops}
        </span>
      </span>
      <Pill icon="camera">{`Take a photo · ${ROLL.shots - PARTY.hers} left`}</Pill>
    </span>
  );
}

/** A guest's screen in a mode at an hour: a picture, filling its box. */
export function GuestScreen({
  mode,
  hour,
  className,
}: {
  mode: Mode;
  hour: HourId;
  className?: string;
}) {
  return (
    <span
      data-cw-picture={`${mode}-${hour}`}
      className={cn(
        "@container relative block overflow-hidden bg-gallery text-gallery-foreground",
        className,
      )}
    >
      <span className="absolute inset-0">
        {mode === "album" ? <AlbumAt hour={hour} /> : <CameraAt hour={hour} />}
      </span>
    </span>
  );
}

/**
 * A GUEST'S PHONE, DRAWN AS A DEVICE RATHER THAN A CARD: a black body with a
 * hairline of light on its edge and the island at its head, its screen the
 * guest's at that hour. Sized by its width; the body holds a phone's ratio.
 */
export function Phone({
  mode,
  hour,
  dim,
  lit,
  className,
  style,
}: {
  mode: Mode;
  hour: HourId;
  /** Standing behind the pick: the room's dark laid over its screen. */
  dim?: boolean;
  /** The pick: its rim catches the room's light. */
  lit?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  // ★ THE CONTAINER IS THE WRAPPER, NEVER THE BODY: a `cqw` on an element
  // reads its nearest ANCESTOR container, so a body that was its own container
  // took its bezel and corners from the frame's width (a capsule at a desk).
  return (
    <span
      data-cw-phone={mode}
      className={cn("@container block", className)}
      style={style}
    >
      <span className={cn("cw-phone block", lit && "cw-phone-lit")}>
        <span className="cw-phone-glass block">
          <GuestScreen mode={mode} hour={hour} className="size-full" />
          <span aria-hidden className="cw-phone-island" />
          {dim && <span aria-hidden className="absolute inset-0 bg-black/55" />}
        </span>
      </span>
    </span>
  );
}

/* ── the code ───────────────────────────────────────────────────────────── */

/**
 * THE CODE ON ITS WHITE PLATE, as every screen draws it (the beat's mat, the
 * code card): dark modules on white, the style's own shapes, the name under
 * it. A sample says so in one word, in place of today's sentence (round one's
 * carried call `sample`).
 */
export function CodePlate({
  link,
  styleKey,
  size,
  sample = false,
  name = EVENT.name,
  pad = 0.065,
  className,
  style,
}: {
  link: string;
  styleKey: QrStyleKey;
  /** The code's edge in px, its quiet zone included. */
  size: number;
  sample?: boolean;
  /** The plate's margin round the code, as a share of the code's edge. */
  pad?: number;
  /** The name under the code; null draws the code alone. */
  name?: string | null;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <span
      data-cw-code={styleKey}
      data-cw-picture="code"
      className={cn(
        "relative inline-flex flex-col items-center overflow-hidden rounded-[calc(var(--radius)*2.6)] bg-white text-black",
        className,
      )}
      style={{ padding: Math.round(size * pad), ...style }}
    >
      {sample && (
        <span
          data-cw-sample
          className="cw-sample absolute top-[3px] left-1/2 -translate-x-1/2 rounded-full bg-black/[0.06] px-2 py-px text-micro font-medium tracking-[0.1em] text-black/55 uppercase"
        >
          Sample
        </span>
      )}
      <StyledQr
        value={link}
        size={size}
        style={QR_PRESETS[styleKey].options}
        className="[&>svg]:block"
      />
      {name && (
        <span
          className="max-w-full truncate px-2 pt-0.5 font-heading leading-tight"
          style={{ fontSize: Math.max(12, Math.round(size * 0.068)) }}
        >
          {name}
        </span>
      )}
    </span>
  );
}

/**
 * A LOOK'S CORNER: a window onto the top-left of the look's own code drawn
 * at nearly three times the window, where a rounded finder reads as rounded
 * and a coral one as coral (four whole codes at 56 px read as the same grey
 * noise four times).
 */
export function Corner({
  styleKey,
  link,
  size,
  className,
}: {
  styleKey: QrStyleKey;
  link: string;
  /** The window's edge in px. */
  size: number;
  className?: string;
}) {
  const code = Math.round(size * 2.7);
  const inset = Math.round(code * 0.055);
  return (
    <span
      data-cw-picture="corner"
      className={cn(
        "relative block overflow-hidden rounded-[22%] bg-white",
        className,
      )}
      style={{ width: size, height: size }}
    >
      <span className="absolute" style={{ left: -inset, top: -inset }}>
        <StyledQr
          value={link}
          size={code}
          style={QR_PRESETS[styleKey].options}
          className="[&>svg]:block"
        />
      </span>
    </span>
  );
}

/* ── the phone's own keyboard ───────────────────────────────────────────── */

const KEY_ROWS = ["qwertyuiop", "asdfghjkl", "zxcvbnm"] as const;

/**
 * THE KEYBOARD A PHONE RAISES UNDER THE NAME (the field is focused the moment
 * the step opens), drawn so the name's screen is judged as a phone shows it:
 * the lower third is the keyboard's, and Continue rides on top of it. A
 * picture of the system's own keys, its letters never counted as words.
 */
export function Keyboard() {
  const key =
    "flex h-[42px] items-center justify-center rounded-[5px] bg-[oklch(0.42_0_0)] text-[22px] leading-none text-white shadow-[0_1px_0_rgb(0_0_0/0.45)]";
  const dim =
    "flex h-[42px] items-center justify-center rounded-[5px] bg-[oklch(0.3_0_0)] text-white shadow-[0_1px_0_rgb(0_0_0/0.45)]";
  return (
    <span
      data-cw-picture="keyboard"
      data-cw-keyboard
      aria-hidden
      className="relative z-10 block w-full bg-[oklch(0.2_0_0)] px-[3px] pt-2 pb-[34px] select-none"
    >
      <span className="flex h-9 items-center justify-around px-6 text-[15px] text-white/70">
        <span>&ldquo;Wedding&rdquo;</span>
        <span className="h-5 w-px bg-white/15" />
        <span>Weddings</span>
        <span className="h-5 w-px bg-white/15" />
        <span>Wedding&rsquo;s</span>
      </span>
      <span className="mt-1 grid gap-[11px]">
        <span className="grid grid-cols-10 gap-[6px] px-[3px]">
          {[...KEY_ROWS[0]].map((c) => (
            <span key={c} className={key}>
              {c}
            </span>
          ))}
        </span>
        <span className="grid grid-cols-9 gap-[6px] px-[21px]">
          {[...KEY_ROWS[1]].map((c) => (
            <span key={c} className={key}>
              {c}
            </span>
          ))}
        </span>
        <span className="flex gap-[6px] px-[3px]">
          <span className={cn(dim, "w-[42px] shrink-0")}>
            <ArrowBigUp className="size-5" />
          </span>
          <span className="ml-[8px] grid flex-1 grid-cols-7 gap-[6px]">
            {[...KEY_ROWS[2]].map((c) => (
              <span key={c} className={key}>
                {c}
              </span>
            ))}
          </span>
          <span className={cn(dim, "ml-[8px] w-[42px] shrink-0")}>
            <Delete className="size-5" />
          </span>
        </span>
        <span className="flex gap-[6px] px-[3px]">
          <span className={cn(dim, "w-[88px] shrink-0 text-[16px]")}>123</span>
          <span className={cn(key, "flex-1 text-[16px]")}>space</span>
          <span className={cn(dim, "w-[88px] shrink-0 text-[16px]")}>next</span>
        </span>
      </span>
      <span className="mt-2 flex justify-between px-5 text-white/80">
        <Smile className="size-6" />
        <Mic className="size-6" />
      </span>
    </span>
  );
}
