"use client";

import type { ReactNode } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Copy,
  FileArchive,
  FolderDown,
  ImageDown,
  Info,
} from "lucide-react";

import { formatCount } from "@/lib/format/count";
import { cn, formatBytes } from "@/lib/utils";

import { EVENT, photoAt } from "./fixtures";

/**
 * WHERE A SAVE LANDS, ON THE PHONE ITSELF: the share sheet that carries Save
 * Image (the web's one way into Photos on an iPhone, `share-save.ts`), the
 * Files app a zip lands in, and Photos holding what was saved.
 *
 * ★ THESE ARE THE PHONE'S OWN SURFACES, DRAWN AS DIAGRAMS, NEVER AS OURS: a
 * plain system grey, the system's own words for its rows ("Save 24 Images",
 * "Save to Files"), no app icons and no brand. They show where a photograph
 * ends up and what it is there (its size, its pixels), which is the whole of
 * what the question decides; the phone's own pixels are the phone's.
 */

/** The system's grey grounds, lighter and darker, in either theme. */
const SHEET = "bg-[oklch(0.96_0.003_286)] dark:bg-[oklch(0.22_0.004_286)]";
const GROUP =
  "rounded-[14px] bg-[oklch(1_0_0)] dark:bg-[oklch(0.28_0.004_286)]";

/** A short stack of the photographs a sheet carries: the newest on top, offset, never tilted. */
function Stack({
  picks,
  size = 44,
}: {
  picks: readonly number[];
  size?: number;
}) {
  return (
    <span
      className="relative flex shrink-0"
      style={{ width: size + 16, height: size }}
    >
      {picks.slice(0, 3).map((i, k) => (
        // eslint-disable-next-line @next/next/no-img-element -- a bootstrap still, a carried photograph
        <img
          key={k}
          src={photoAt(i).src}
          alt=""
          draggable={false}
          className="absolute top-0 rounded-[6px] object-cover ring-2 ring-[oklch(1_0_0)] dark:ring-[oklch(0.28_0.004_286)]"
          style={{ left: (2 - k) * 8, width: size, height: size, zIndex: k }}
        />
      ))}
    </span>
  );
}

/** One of the sheet's action rows, in the system's words. */
function Action({
  icon,
  children,
  act = false,
}: {
  icon: ReactNode;
  children: ReactNode;
  act?: boolean;
}) {
  return (
    <span
      data-th-act={act ? "" : undefined}
      className={cn(
        "flex h-12 items-center justify-between px-4 text-[15px]",
        act && "bg-[oklch(0.92_0.004_286)] dark:bg-[oklch(0.34_0.004_286)]",
      )}
    >
      {children}
      <span className="text-muted-foreground [&_svg]:size-5">{icon}</span>
    </span>
  );
}

/**
 * THE PHONE'S SHARE SHEET, carrying `count` files: their stack and how many,
 * what they weigh, which part of the set this sheet is, then Save N Images
 * (pressed) and Save to Files.
 */
export function ShareSheet({
  count,
  bytes,
  part,
  picks,
}: {
  count: number;
  bytes: number;
  /** "Part 1 of 6" when the set comes home in parts. */
  part?: string;
  picks: readonly number[];
}) {
  const noun = count === 1 ? "Image" : "Images";
  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/30" />
      <div
        data-th-sheet=""
        className={cn(
          "fixed inset-x-0 bottom-0 z-50 flex flex-col gap-3 rounded-t-[14px] px-3 pt-3 pb-8 text-foreground",
          SHEET,
        )}
      >
        <span className="mx-auto h-1 w-9 rounded-full bg-foreground/20" />
        <div className="flex items-center gap-3 px-1">
          <Stack picks={picks} />
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="text-[15px] font-semibold">
              {count === 1 ? "1 Photo" : `${formatCount(count)} Photos`}
            </span>
            <span data-th-read="" className="text-[13px] text-muted-foreground">
              {formatBytes(bytes)}
              {part ? ` · ${part}` : ""}
            </span>
          </span>
          <span className="flex size-7 items-center justify-center rounded-full bg-foreground/10 text-[13px] text-muted-foreground">
            ✕
          </span>
        </div>
        {/* Where the phone could send them: its people and apps, drawn as places, never as brands. */}
        <div className="flex gap-4 px-1 py-1">
          {Array.from({ length: 5 }, (_, k) => (
            <span
              key={k}
              className="size-14 shrink-0 rounded-full bg-foreground/10"
            />
          ))}
        </div>
        <div className={cn("overflow-hidden", GROUP)}>
          <Action icon={<ImageDown />} act>
            {count === 1 ? "Save Image" : `Save ${formatCount(count)} ${noun}`}
          </Action>
          <span className="mx-4 block h-px bg-foreground/10" />
          <Action icon={<FolderDown />}>Save to Files</Action>
          <span className="mx-4 block h-px bg-foreground/10" />
          <Action icon={<Copy />}>Copy</Action>
        </div>
      </div>
    </>
  );
}

/** THE FILES APP, showing the zip a download left in Downloads. */
export function FilesLanding({ bytes }: { bytes: number }) {
  return (
    <div
      className={cn("fixed inset-0 z-50 flex flex-col text-foreground", SHEET)}
    >
      <div className="flex h-14 items-center gap-1 px-2 pt-2 text-[15px] text-muted-foreground">
        <ChevronLeft className="size-5" /> Browse
      </div>
      <div className="px-4 pb-3 text-[28px] leading-tight font-bold">
        Downloads
      </div>
      <div className={cn("mx-3 overflow-hidden", GROUP)}>
        <span data-th-act="" className="flex items-center gap-3 px-3 py-3">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-[10px] bg-foreground/10 text-muted-foreground">
            <FileArchive className="size-6" />
          </span>
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-[15px] font-medium">{`${EVENT.slug}.zip`}</span>
            <span data-th-read="" className="text-[13px] text-muted-foreground">
              {`${formatBytes(bytes)} · Today`}
            </span>
          </span>
          <ChevronRight className="size-4 text-muted-foreground" />
        </span>
      </div>
      <p className="mx-6 mt-3 text-[13px] leading-snug text-muted-foreground">
        One file. Open it to unzip a folder of photos; they stay in Files.
      </p>
    </div>
  );
}

/**
 * PHOTOS, HOLDING WHAT WAS SAVED: the library's newest rows (the saved ones
 * last, as Photos files them), and one of them open with its info, so the size
 * a Save gave is read off the photograph itself: its pixels and its bytes.
 */
export function PhotosLanding({
  picks,
  pixels,
  bytes,
}: {
  picks: readonly number[];
  pixels: { w: number; h: number };
  bytes: number;
}) {
  const before = Array.from({ length: 9 }, (_, k) => k + 30);
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background text-foreground">
      <div className="px-4 pt-12 pb-2 text-[28px] leading-tight font-bold">
        Library
      </div>
      <div className="grid grid-cols-3 gap-0.5">
        {[...before, ...picks].slice(-15).map((i, k) => (
          // eslint-disable-next-line @next/next/no-img-element -- a bootstrap still, a photograph in her library
          <img
            key={k}
            src={photoAt(i).src}
            alt=""
            draggable={false}
            className="aspect-square w-full object-cover"
          />
        ))}
      </div>
      <div
        className={cn(
          "fixed inset-x-0 bottom-0 z-10 flex flex-col gap-2 rounded-t-[14px] px-4 pt-3 pb-8",
          SHEET,
        )}
      >
        <span className="mx-auto h-1 w-9 rounded-full bg-foreground/20" />
        <span className="flex items-center gap-2 text-[15px] font-semibold">
          <Info className="size-4 text-muted-foreground" /> Today, just now
        </span>
        <div className={cn("flex flex-col gap-1 px-3 py-2.5", GROUP)}>
          <span className="truncate text-[13px] text-muted-foreground">
            {`${EVENT.slug}-3f9a1c.jpg`}
          </span>
          <span
            data-th-read=""
            className="text-[15px] font-medium tabular-nums"
          >
            {`${formatCount(pixels.w)} × ${formatCount(pixels.h)} · ${formatBytes(bytes)}`}
          </span>
        </div>
      </div>
    </div>
  );
}
