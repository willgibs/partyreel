"use client";

import type { ReactNode } from "react";
import {
  CircleCheck,
  ExternalLink,
  FolderUp,
  Loader2,
  RotateCw,
  TriangleAlert,
  X,
} from "lucide-react";

import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import { formatCount } from "@/lib/format/count";
import { cn, formatBytes } from "@/lib/utils";

import { Light, Meter } from "./chrome";
import { BIG, EVENT, MID, TOTAL_BYTES, TOTAL_COUNT } from "./fixtures";

/**
 * A SEND, AT EVERY MOMENT, AND THE PLACES IT SHOWS.
 *
 * One table of moments (`MOMENTS`): each its light and word (status=lights:
 * `Badge`, a light and its word in the camera's capitals), its title in plain
 * sentence case, where it lands, the meter (production's twelve frames), its
 * facts, its line and its acts, so the strip, the toast, the panel's card and
 * the email can never say two things about one moment.
 *
 * ★ THE NUMBERS AGREE EVERYWHERE: 412 of 1,284 is 2.4 of 7.4 GB nine minutes
 * in, about 16 left (`fixtures.ts`).
 */

export type MomentId =
  | "sending"
  | "full"
  | "daily"
  | "disconnected"
  | "partly"
  | "done"
  | "done-first"
  | "done-plain";

type Act = { label: string; lead?: boolean; icon?: ReactNode };

export type Moment = {
  tone: "sending" | "paused" | "done" | "stopped";
  word: string;
  title: string;
  where: string;
  /** Percent sent, for the meter; none where nothing measures. */
  meter?: number;
  facts: string;
  line?: string;
  acts: Act[];
  /** A quieter line under it all: the way out, after a send. */
  quiet?: string;
};

const FOLDER = `My Drive › Partyreel › ${EVENT.folder}`;
const pct = (a: number, b: number) => Math.round((a / b) * 100);

export const MOMENTS: Record<MomentId, Moment> = {
  sending: {
    tone: "sending",
    word: "Sending",
    title: "Sending to Google Drive",
    where: FOLDER,
    meter: pct(MID.sent, TOTAL_COUNT),
    facts: `${formatCount(MID.sent)} of ${formatCount(TOTAL_COUNT)} · ${formatBytes(MID.sentBytes)} of ${formatBytes(TOTAL_BYTES)} · about ${MID.minutesLeft} minutes left`,
    line: "You can close this page: we'll email you when it's done.",
    acts: [{ label: "Cancel" }],
  },
  full: {
    tone: "paused",
    word: "Paused",
    title: "Your Google Drive is full",
    where: FOLDER,
    meter: pct(806, TOTAL_COUNT),
    facts: `806 of ${formatCount(TOTAL_COUNT)} sent · 2.8 GB still to send`,
    line: "Make room in your Drive, or get more from Google, then check again. Nothing is lost.",
    acts: [
      { label: "Check again", lead: true, icon: <RotateCw /> },
      { label: "Get more space", icon: <ExternalLink /> },
    ],
  },
  daily: {
    tone: "paused",
    word: "Paused until tomorrow",
    title: "Google takes 750 GB a day per account",
    where: `My Drive › Partyreel › ${BIG.folder}`,
    meter: pct(BIG.sentBytes, BIG.bytes),
    facts: `${formatBytes(BIG.sentBytes)} of ${formatBytes(BIG.bytes)} sent · the rest goes at ${BIG.resumesAt}`,
    line: "Nothing to do: it carries on by itself, and we'll email you when it's done.",
    acts: [{ label: "Cancel" }],
  },
  disconnected: {
    tone: "paused",
    word: "Paused",
    title: "Partyreel lost access to your Google Drive",
    where: FOLDER,
    meter: pct(MID.sent, TOTAL_COUNT),
    facts: `${formatCount(MID.sent)} of ${formatCount(TOTAL_COUNT)} sent`,
    line: "Connect again and it carries on where it stopped.",
    acts: [{ label: "Reconnect", lead: true, icon: <FolderUp /> }, { label: "Cancel" }],
  },
  partly: {
    tone: "paused",
    word: "Partly done",
    title: `${formatCount(TOTAL_COUNT - 2)} of ${formatCount(TOTAL_COUNT)} are in your Drive`,
    where: FOLDER,
    meter: 99,
    facts: "2 couldn't be sent: two clips from Theo, after 5 tries each",
    line: "Retry them now, or open the album to see which.",
    acts: [
      { label: "Retry the 2", lead: true, icon: <RotateCw /> },
      { label: "Open in Drive", icon: <ExternalLink /> },
    ],
  },
  done: {
    tone: "done",
    word: "In your Drive",
    title: `${EVENT.name} is in your Google Drive`,
    where: FOLDER,
    facts: `${formatCount(TOTAL_COUNT)} of ${formatCount(TOTAL_COUNT)} · ${formatBytes(TOTAL_BYTES)} · every one checked`,
    acts: [{ label: "Open in Drive", lead: true, icon: <ExternalLink /> }],
    quiet: `Free ${formatBytes(TOTAL_BYTES)} from Partyreel`,
  },
  "done-first": {
    tone: "done",
    word: "In your Drive",
    title: `Everything's in your Drive. Free ${formatBytes(TOTAL_BYTES)} from Partyreel?`,
    where: FOLDER,
    facts: `${formatCount(TOTAL_COUNT)} of ${formatCount(TOTAL_COUNT)} · every one checked`,
    acts: [
      { label: `Free ${formatBytes(TOTAL_BYTES)}`, lead: true },
      { label: "Keep it here" },
      { label: "Open in Drive", icon: <ExternalLink /> },
    ],
  },
  "done-plain": {
    tone: "done",
    word: "In your Drive",
    title: `${EVENT.name} is in your Google Drive`,
    where: FOLDER,
    facts: `${formatCount(TOTAL_COUNT)} of ${formatCount(TOTAL_COUNT)} · ${formatBytes(TOTAL_BYTES)} · every one checked`,
    acts: [{ label: "Open in Drive", icon: <ExternalLink /> }],
  },
};

/** The quiet version a loud-elsewhere treatment leaves on the send: its light, its title, no act. */
export function quietOf(m: Moment, note: string): Moment {
  return { ...m, acts: [], line: note, quiet: undefined };
}

function Acts({ acts, small = true }: { acts: Act[]; small?: boolean }) {
  return (
    <>
      {acts.map((a) => (
        <Button
          key={a.label}
          variant={a.lead ? "default" : a.label === "Cancel" ? "ghost" : "outline"}
          size={small ? "sm" : "default"}
        >
          {a.icon}
          {a.label}
        </Button>
      ))}
    </>
  );
}

/**
 * THE STRIP AT THE ALBUM'S HEAD: the send's light and title, where it lands,
 * the meter, the facts and its acts; the way out in a quieter line once done.
 */
export function SendStrip({ moment }: { moment: Moment }) {
  return (
    <div
      data-dx-read="the send's strip"
      className="flex flex-col gap-2 rounded-float bg-card p-3 ring-1 ring-foreground/10"
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <Light tone={moment.tone}>{moment.word}</Light>
        <span className="min-w-0 text-sm font-medium text-pretty">
          {moment.title}
        </span>
        <span className="hidden min-w-0 truncate text-xs text-muted-foreground sm:inline">
          {moment.where}
        </span>
        {moment.acts.length ? (
          <span className="flex flex-wrap items-center gap-1.5 sm:ml-auto">
            <Acts acts={moment.acts} />
          </span>
        ) : null}
      </div>
      {moment.meter !== undefined ? (
        <Meter value={moment.meter} className="h-1.5" />
      ) : null}
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 text-xs text-muted-foreground tabular-nums">
        <span>{moment.facts}</span>
        {moment.line ? <span className="text-pretty">{moment.line}</span> : null}
      </div>
      {moment.quiet ? (
        <button
          type="button"
          className="self-start text-xs font-medium text-foreground underline underline-offset-4"
        >
          {moment.quiet}
        </button>
      ) : null}
    </div>
  );
}

const TOAST_ICON: Record<Moment["tone"], ReactNode> = {
  sending: <Loader2 className="size-4 animate-spin motion-reduce:animate-none" />,
  paused: <TriangleAlert className="size-4 text-warning" />,
  done: <CircleCheck className="size-4 text-success" />,
  stopped: <TriangleAlert className="size-4 text-destructive" />,
};

/**
 * THE TOAST, ON THE PRODUCT'S TOASTER (`ui/sonner.tsx`: top centre, 5rem
 * down, the display's near-black, the float's corner), quoted: its icon, its
 * title, the meter and facts in its description, its acts, and the x on the
 * right that `export-toast.tsx` gives every download.
 */
export function SendToast({ moment }: { moment: Moment }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 top-20 z-50 flex justify-center px-4">
      <div
        data-dx-read="the toast"
        data-dx-w=""
        className="surface-display pointer-events-auto flex w-full max-w-[356px] gap-3 rounded-float bg-popover p-4 text-popover-foreground shadow-layer ring-1 ring-border"
      >
        <span className="mt-0.5 shrink-0">{TOAST_ICON[moment.tone]}</span>
        <span className="flex min-w-0 flex-1 flex-col gap-1.5">
          <span className="text-sm font-medium text-pretty">{moment.title}</span>
          {moment.meter !== undefined ? (
            <Meter value={moment.meter} className="h-1.5" />
          ) : null}
          <span className="text-xs text-muted-foreground tabular-nums">
            {moment.facts}
          </span>
          {moment.line ? (
            <span className="text-xs text-pretty text-muted-foreground">
              {moment.line}
            </span>
          ) : null}
          {moment.acts.some((a) => a.label !== "Cancel") || moment.quiet ? (
            <span className="mt-1 flex flex-wrap gap-1.5">
              <Acts acts={moment.acts.filter((a) => a.label !== "Cancel")} />
              {moment.quiet ? (
                <Button variant="ghost" size="sm">
                  {moment.quiet}
                </Button>
              ) : null}
            </span>
          ) : null}
        </span>
        <span
          aria-label={moment.acts.some((a) => a.label === "Cancel") ? "Cancel" : "Close"}
          className="-mt-1 -mr-1.5 flex size-8 shrink-0 items-center justify-center rounded-md opacity-55"
        >
          <X className="size-3.5" />
        </span>
      </div>
    </div>
  );
}

/**
 * THE DRIVE CARD AS THE PROGRESS (Inside Take it home): the same card, its
 * words replaced by the send's light, meter, facts and acts.
 */
export function CardProgress({ moment }: { moment: Moment }) {
  return (
    <div data-dx-read="the Drive card" className="flex min-w-0 flex-col gap-2">
      <span className="flex flex-wrap items-center gap-2">
        <Light tone={moment.tone}>{moment.word}</Light>
      </span>
      <span className="text-sm font-medium text-pretty">{moment.title}</span>
      {moment.meter !== undefined ? (
        <Meter value={moment.meter} className="h-1.5" />
      ) : null}
      <span className="text-xs text-muted-foreground tabular-nums">
        {moment.facts}
      </span>
      {moment.line ? (
        <span className="text-xs text-pretty text-muted-foreground">
          {moment.line}
        </span>
      ) : null}
      <span className="mt-1 flex flex-wrap gap-1.5">
        <Acts acts={moment.acts} />
      </span>
      {moment.quiet ? (
        <button
          type="button"
          className="self-start text-xs font-medium text-foreground underline underline-offset-4"
        >
          {moment.quiet}
        </button>
      ) : null}
    </div>
  );
}

/** The count the album's Download button wears while a send runs (Inside Take it home). */
export function DownloadCount({ moment }: { moment: Moment }) {
  return (
    <span
      data-dx-read="Download's count"
      className={cn(
        "pointer-events-none absolute -top-2 -right-2 flex h-5 items-center rounded-full px-1.5 text-[10px] font-semibold tabular-nums ring-2 ring-background",
        moment.tone === "paused"
          ? "bg-warning text-warning-foreground"
          : moment.tone === "done"
            ? "bg-success text-success-foreground"
            : "bg-info text-info-foreground",
      )}
    >
      {moment.tone === "done"
        ? "Sent"
        : moment.meter !== undefined
          ? `${moment.meter}%`
          : "!"}
    </span>
  );
}

/**
 * THE BANNER ACROSS THE APP (A banner across the app): under the bar on every
 * page until it's resolved, as the over-cap grace banner speaks (its border
 * and its wash in the state's colour, the words, the act).
 */
export function SendBanner({ moment }: { moment: Moment }) {
  return (
    <div className="px-4 pt-4 sm:px-6 lg:px-8">
      <div
        data-dx-read="the banner"
        className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-warning/50 bg-warning/10 px-4 py-3 text-sm"
      >
        <TriangleAlert className="size-4 shrink-0 text-warning" />
        <span className="flex min-w-[12rem] flex-1 flex-col">
          <span className="font-medium text-foreground">{moment.title}</span>
          <span className="text-muted-foreground">{moment.line}</span>
        </span>
        <span className="flex flex-wrap gap-1.5">
          <Acts acts={moment.acts} />
        </span>
      </div>
    </div>
  );
}

/**
 * THE EMAIL, AS `email/templates.ts` LAYS EVERY MAIL: the mat, the white card
 * and its hairline, the wordmark, a 20px heading, the body at 15px, one ink
 * button, the muted foot. Fixed colours, as a mail client draws them.
 */
export function SendEmail({
  heading,
  lines,
  cta,
  link,
}: {
  heading: string;
  lines: string[];
  cta: string;
  link?: string;
}) {
  return (
    <div
      className="min-h-screen px-4 py-8"
      style={{ background: "#f2f2f7", color: "#16161a" }}
    >
      <div
        data-dx-read="the email"
        className="mx-auto flex max-w-[560px] flex-col gap-4 rounded-lg p-8"
        style={{ background: "#ffffff", border: "1px solid #dadadf" }}
      >
        <Logo className="h-[22px]" />
        <h1 className="text-[20px] leading-7 font-bold tracking-[-0.01em]">
          {heading}
        </h1>
        {lines.map((l) => (
          <p key={l} className="text-[15px] leading-6">
            {l}
          </p>
        ))}
        <span
          className="self-start rounded-2xl px-5 py-2 text-[15px] font-semibold"
          style={{ background: "#16161a", color: "#ffffff" }}
        >
          {cta}
        </span>
        {link ? (
          <span className="text-[15px] leading-6 underline underline-offset-4">
            {link}
          </span>
        ) : null}
        <p
          className="mt-3 border-t pt-4 text-[13px] leading-5"
          style={{ borderColor: "#dadadf", color: "#57575d" }}
        >
          {"You’re getting this because you sent an album to Google Drive."}
        </p>
      </div>
    </div>
  );
}
