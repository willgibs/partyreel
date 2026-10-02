"use client";

import { Camera, Check, ImagePlus, Play } from "lucide-react";

import { StyledQr } from "@/components/app/styled-qr";
import { PhoneShell } from "@/components/marketing/frames/phone-frame";
import { QR_PRESETS, type QrStyleKey } from "@/lib/constants/qr-presets";
import { cn } from "@/lib/utils";

import {
  ALBUM_STILLS,
  ARRIVING,
  EVENT,
  type HourId,
  hourOf,
  LEFT_AT_PARTY,
  ROLL,
  type RailStep,
  type Still,
  VIEWFINDER,
} from "./fixtures";

/**
 * THE PICTURES CREATE SHOWS: a guest's phone at an hour of the night, in the
 * album or the disposable camera, and the code on its white plate.
 *
 * ★ A PICTURE IS SIZED BY ITS BOX, NEVER BY THE VIEWPORT. Every mark inside a
 * guest's screen is in `cqw` (a hundredth of the picture's own width), so one
 * drawing reads the same in a 165 px card at a phone and a 420 px card at a
 * desk, the way a photograph scales. That is the design system's own carve-out
 * for type drawn inside a picture (design-system.md, "off the ladder on
 * purpose"), and every picture is marked `data-cw-picture` so the captions
 * count the words a host reads, not the words a picture shows.
 *
 * ★ THE CAMERA DRAWN HERE IS A STAND-IN. `disposable-mode` r3 owns the camera,
 * its waiting room and its save, and is drawing them tonight; these are plain,
 * modern placeholders in its settled numbers (24 shots, 9 am), so a pick here
 * never decides a camera. No tilt anywhere: a stack of prints is squared up.
 */

/* ── a still ────────────────────────────────────────────────────────────── */

function Img({ still, className }: { still: Still; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- a local still in a small picture of a guest's phone
    <img
      src={still.src}
      alt=""
      draggable={false}
      className={cn("block size-full object-cover", className)}
    />
  );
}

/* ── a guest's screen ───────────────────────────────────────────────────── */

export type Mode = "album" | "camera";

/** The album's head and its count, as a guest meets them (the name first: bible 7). */
function Head({ count }: { count?: string }) {
  return (
    <span className="block">
      <span className="block font-heading text-[8.5cqw] leading-[1.05]">
        {EVENT.short}
      </span>
      <span className="mt-[1.4cqw] block text-[3.6cqw] text-gallery-muted">
        {count ?? `Hosted by ${EVENT.host}`}
      </span>
    </span>
  );
}

/** The album's own Add, a white pill at the thumb. */
function AddPill({ label = "Add photos" }: { label?: string }) {
  return (
    <span className="mx-auto flex h-[11cqw] items-center gap-[1.6cqw] rounded-full bg-white px-[5cqw] text-[3.8cqw] font-medium text-black">
      <ImagePlus className="size-[4.2cqw]" strokeWidth={2.25} />
      {label}
    </span>
  );
}

/** A square tile of the rows, with the arrival's rim on the newest. */
function Tile({ still, fresh }: { still: Still; fresh?: boolean }) {
  return (
    <span
      className={cn(
        "relative block aspect-square overflow-hidden rounded-[1.4cqw]",
        fresh && "cw-arrival",
      )}
    >
      <Img still={still} />
    </span>
  );
}

function AlbumAt({ hour }: { hour: HourId }) {
  if (hour === "arrive")
    return (
      <span className="flex h-full flex-col p-[6cqw]">
        <Head />
        <span className="my-auto block">
          <span className="grid grid-cols-3 gap-[1.6cqw]">
            {Array.from({ length: 6 }, (_, i) => (
              <span
                key={i}
                className="block aspect-square rounded-[1.4cqw] border border-dashed border-white/15"
              />
            ))}
          </span>
          <span className="mt-[3.5cqw] block text-center text-[3.8cqw] text-gallery-muted">
            Be the first to add
          </span>
        </span>
        <AddPill />
      </span>
    );
  const { photos } = hourOf(hour);
  const morning = hour === "morning";
  return (
    <span className="flex h-full flex-col p-[6cqw]">
      <Head count={`${photos} photos · ${morning ? 14 : 12} guests`} />
      {morning && (
        <span className="relative mt-[4cqw] block aspect-[16/9] overflow-hidden rounded-[2cqw]">
          <Img still={ALBUM_STILLS[3]} />
          <span className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <span className="absolute bottom-[2.5cqw] left-[3cqw] flex items-center gap-[1.5cqw] text-[3.6cqw] font-medium">
            <Play className="size-[3.6cqw] fill-current" />
            Highlight reel
          </span>
        </span>
      )}
      {/* The rows take the room the box leaves and clip the rest, so the Add
          stays at the thumb in a tall card, a square or a wide one. */}
      <span className="mt-[3cqw] block min-h-0 flex-1 overflow-hidden">
        <span className="grid grid-cols-3 gap-[1.2cqw]">
          {ALBUM_STILLS.slice(morning ? 4 : 0, morning ? 13 : 12).map(
            (s, i) => (
              <Tile
                key={`${s.id}-${i}`}
                still={s}
                fresh={!morning && i === 0}
              />
            ),
          )}
        </span>
      </span>
      <span className="pt-[3cqw]">
        <AddPill />
      </span>
    </span>
  );
}

/** The roll's 24 ticks around the shutter, the shots taken lit. */
function TickRing({ left }: { left: number }) {
  const taken = ROLL.shots - left;
  return (
    <svg viewBox="0 0 100 100" className="absolute inset-0 size-full" aria-hidden>
      {Array.from({ length: ROLL.shots }, (_, i) => {
        const a = (i / ROLL.shots) * Math.PI * 2 - Math.PI / 2;
        const r1 = 44;
        const r2 = 49;
        return (
          <line
            key={i}
            x1={50 + r1 * Math.cos(a)}
            y1={50 + r1 * Math.sin(a)}
            x2={50 + r2 * Math.cos(a)}
            y2={50 + r2 * Math.sin(a)}
            stroke="white"
            strokeOpacity={i < taken ? 0.25 : 0.95}
            strokeWidth={2.4}
            strokeLinecap="round"
          />
        );
      })}
    </svg>
  );
}

function Shutter({ left }: { left: number }) {
  return (
    <span className="relative mx-auto block size-[22cqw]">
      <TickRing left={left} />
      <span className="absolute inset-[18%] rounded-full bg-white" />
    </span>
  );
}

function CameraAt({ hour }: { hour: HourId }) {
  if (hour === "arrive")
    return (
      <span className="relative flex h-full flex-col">
        <span className="absolute inset-0">
          <Img still={ARRIVING} />
          <span className="absolute inset-0 bg-gradient-to-b from-black/55 via-transparent to-black/70" />
        </span>
        <span className="relative flex items-baseline justify-between p-[5cqw]">
          <span className="font-heading text-[6cqw]">{EVENT.short}</span>
          <span className="text-[3.4cqw] text-white/75">
            Develops {ROLL.develops}
          </span>
        </span>
        <span className="relative mt-auto flex items-center justify-between px-[7cqw] pb-[6cqw]">
          <span className="w-[14cqw] text-[3.4cqw] leading-tight text-white/80">
            <span className="block font-heading text-[6.5cqw] text-white">
              {ROLL.shots}
            </span>
            left
          </span>
          <Shutter left={ROLL.shots} />
          <span className="w-[14cqw]" />
        </span>
      </span>
    );
  if (hour === "party")
    return (
      <span className="cw-waiting relative flex h-full flex-col items-center p-[6cqw] text-center">
        <span className="font-heading text-[6cqw]">{EVENT.short}</span>
        <span className="my-auto block">
          <span className="relative mx-auto block h-[34cqw] w-[30cqw]">
            {[2, 1, 0].map((k) => (
              <span
                key={k}
                className="absolute block h-[30cqw] w-[24cqw] rounded-[1.2cqw] bg-[oklch(0.93_0.012_80)] shadow-[0_1px_3px_rgb(0_0_0/0.5)]"
                style={{ left: `${3 + k * 1.6}cqw`, top: `${k * 1.6}cqw` }}
              />
            ))}
          </span>
          <span className="mt-[4cqw] block font-heading text-[13cqw] leading-none tabular-nums">
            {hourOf("party").photos}
          </span>
          <span className="mt-[1.5cqw] block text-[3.6cqw] text-gallery-muted">
            shots developing · {ROLL.develops}
          </span>
        </span>
        <span className="flex h-[11cqw] items-center gap-[1.6cqw] rounded-full bg-white px-[5cqw] text-[3.8cqw] font-medium text-black">
          <Camera className="size-[4.2cqw]" strokeWidth={2.25} />
          Take a photo · {LEFT_AT_PARTY} left
        </span>
      </span>
    );
  return (
    <span className="flex h-full flex-col p-[6cqw]">
      <Head count={`Developed · ${hourOf("morning").photos} shots`} />
      <span className="relative mt-[4cqw] block aspect-[16/9] overflow-hidden rounded-[2cqw]">
        <Img still={VIEWFINDER} />
        <span className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <span className="absolute bottom-[2.5cqw] left-[3cqw] flex items-center gap-[1.5cqw] text-[3.6cqw] font-medium">
          <Play className="size-[3.6cqw] fill-current" />
          The roll&rsquo;s premiere
        </span>
      </span>
      <span className="mt-[3cqw] block min-h-0 flex-1 overflow-hidden">
        <span className="grid grid-cols-3 gap-[1.2cqw]">
          {ALBUM_STILLS.slice(1, 10).map((s, i) => (
            <Tile key={`${s.id}-${i}`} still={s} />
          ))}
        </span>
      </span>
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

/** A guest's phone, held up: production's framed screen around her screen. */
export function GuestPhone({
  mode,
  hour,
  className,
}: {
  mode: Mode;
  hour: HourId;
  className?: string;
}) {
  return (
    <PhoneShell className={className} screenClassName="p-0 bg-gallery">
      <GuestScreen mode={mode} hour={hour} className="aspect-[9/17] w-full" />
    </PhoneShell>
  );
}

/* ── the code ───────────────────────────────────────────────────────────── */

/**
 * THE CODE ON ITS WHITE PLATE, as every screen draws it (the beat's mat, the
 * code card): dark modules on white, the style's own shapes, the name under
 * it. A sample says so in one word, in place of today's sentence (the carried
 * call `sample`).
 */
export function CodePlate({
  link,
  styleKey,
  size,
  sample = false,
  name = true,
  className,
}: {
  link: string;
  styleKey: QrStyleKey;
  /** The code's edge in px, its quiet zone included. */
  size: number;
  sample?: boolean;
  name?: boolean;
  className?: string;
}) {
  return (
    <span
      data-cw-code
      data-cw-picture="code"
      className={cn(
        "relative inline-flex flex-col items-center rounded-[calc(var(--radius)*2.5)] bg-white text-black ring-1 ring-black/5",
        className,
      )}
      style={{ padding: Math.round(size * 0.06) }}
    >
      {sample && (
        <span className="absolute top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-black/[0.06] px-2 py-0.5 text-micro font-medium tracking-[0.08em] text-black/55 uppercase">
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
          className="max-w-full truncate px-2 pb-1 font-heading leading-tight"
          style={{ fontSize: Math.max(13, Math.round(size * 0.065)) }}
        >
          {EVENT.name}
        </span>
      )}
    </span>
  );
}

/**
 * One style to pick: a window onto its own code's corner, its name under it.
 *
 * ★ A CORNER, NOT A THUMBNAIL. Four whole codes at 64 px draw modules of a
 * pixel and a half, which read as the same grey noise four times; what tells
 * the styles apart is the shape of a finder and its dots. So each swatch is a
 * window onto the top-left corner of the style's code drawn at three times
 * that size, where a rounded finder reads as rounded and a coral one as coral.
 */
export function StyleChoice({
  styleKey,
  link,
  on,
  size = 64,
}: {
  styleKey: QrStyleKey;
  link: string;
  on: boolean;
  /** The window's edge in px. */
  size?: number;
}) {
  const code = Math.round(size * 2.6);
  const inset = Math.round(code * 0.06);
  return (
    <span
      data-cw-style={styleKey}
      data-state={on ? "on" : "off"}
      className="flex flex-col items-center gap-2"
    >
      <span
        className={cn(
          "relative block overflow-hidden rounded-xl bg-white ring-1 ring-black/5 outline-2 outline-offset-[3px] transition-[outline-color]",
          on ? "outline-foreground" : "outline-transparent",
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
      <span
        className={cn(
          "text-caption",
          on ? "font-medium text-foreground" : "text-muted-foreground",
        )}
      >
        {QR_PRESETS[styleKey].label}
      </span>
    </span>
  );
}

/* ── Settings' rail, carried into the beat ──────────────────────────────── */

/** A step's mark, Settings' own: a green tick once ready, its number until then. */
function Mark({ step }: { step: RailStep }) {
  return step.done ? (
    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-success text-success-foreground">
      <Check className="size-3" strokeWidth={3} />
    </span>
  ) : (
    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-semibold text-muted-foreground tabular-nums">
      {step.n}
    </span>
  );
}

/**
 * SETTINGS' FIVE STEPS, AS THE BEAT CARRIES THEM: the same marks, titles and
 * order Get it ready opens on, so the hand-off shows where it leads. In a row
 * at a desk, joined by Settings' own line; in two columns in a card; down a
 * short column at a phone.
 */
export function Rail({
  steps,
  layout,
  head,
}: {
  steps: readonly RailStep[];
  /** A row at a desk's full width, two columns in a card, a column at a phone. */
  layout: "row" | "grid" | "column";
  head: { title: string; line: string };
}) {
  const wide = layout === "row";
  return (
    <div data-cw-rail className="w-full">
      <p className="text-sm font-medium">{head.title}</p>
      <p className="text-caption text-muted-foreground">{head.line}</p>
      <ol
        className={cn(
          "mt-3",
          layout === "row"
            ? "flex items-center gap-3"
            : layout === "grid"
              ? "grid grid-cols-2 gap-x-6 gap-y-2"
              : "flex flex-col items-start gap-1.5",
        )}
      >
        {steps.map((s, i) => (
          <li
            key={s.n}
            data-cw-step={s.n}
            data-done={s.done ? "true" : "false"}
            className="flex items-center gap-2"
          >
            <Mark step={s} />
            <span
              className={cn(
                "text-caption leading-tight whitespace-nowrap",
                s.done ? "text-muted-foreground" : "text-foreground",
              )}
            >
              {s.title}
            </span>
            {wide && i < steps.length - 1 && (
              <span
                aria-hidden
                className={cn(
                  "ml-1 h-px w-5",
                  s.done ? "bg-success/50" : "bg-border",
                )}
              />
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
