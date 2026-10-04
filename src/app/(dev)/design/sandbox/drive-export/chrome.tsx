"use client";

import type { CSSProperties, ReactNode } from "react";
import {
  Download,
  FolderUp,
  ImageUp,
  ListChecks,
  SlidersHorizontal,
} from "lucide-react";

import { Logo } from "@/components/shared/logo";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { formatCount } from "@/lib/format/count";
import { DEFAULT_ROW_STEP, perRowFor } from "@/lib/shared/album-rows";
import { cn } from "@/lib/utils";

import { EVENT, HOST, photoAt, TOTAL_COUNT } from "./fixtures";
import { SCREENS, type ScreenId } from "./knobs";

/**
 * PRODUCTION'S CHROME, QUOTED WHERE ITS OWN COMPONENT NEEDS A SESSION.
 *
 * The app's bar (`shared/app-shell.tsx`: sticky, the wordmark, the trail, her
 * account), the page's `Container` padding, and the hub's album section as
 * `event-gallery.tsx` draws it (the eyebrow and its count, Add photos,
 * Download, Select and View, then the album's justified rows, quoted as
 * take-home's board quotes them: each photograph grows by its own ratio, so a
 * row is one height and fills the width). The atoms are the real ones
 * (`Button`, `Badge`, `Progress`, `Avatar`, `Logo`).
 */

/** The app's bar: the wordmark, the trail, her account. */
export function AppBar({ trail }: { trail?: string }) {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 w-full items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Logo />
        {trail ? (
          <span className="hidden min-w-0 truncate text-sm text-muted-foreground sm:block">
            {trail}
          </span>
        ) : null}
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

/** The page under the bar: production's `main` and its `Container`. */
export function Page({ children }: { children: ReactNode }) {
  return (
    <main className="flex-1 py-8">
      <div className="mx-auto w-full px-4 sm:px-6 lg:px-8">{children}</div>
    </main>
  );
}

/** A frame's whole ground: the app's background, the frame's own height. */
export function Ground({
  children,
  over,
}: {
  children: ReactNode;
  /** Anything standing over the page (a toast, a banner): fixed in the frame's own screen. */
  over?: ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen flex-col bg-background text-foreground">
      {children}
      {over}
    </div>
  );
}

/**
 * THE ALBUM'S HEAD (`feed-section-header.tsx`, `event-gallery.tsx`): the
 * eyebrow, its count and her four tools. `download` draws over the Download
 * button (a count it wears while a send runs, in one option).
 */
export function AlbumHead({
  download,
  count = TOTAL_COUNT,
}: {
  download?: ReactNode;
  count?: number;
}) {
  return (
    <div className="flex min-h-7 flex-wrap items-center justify-between gap-3">
      <h2 className="flex items-center gap-1.5">
        <span className="text-label font-semibold text-muted-foreground uppercase">
          Album
        </span>
        <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-muted px-1 text-[10px] font-semibold text-muted-foreground tabular-nums">
          {formatCount(count)}
        </span>
      </h2>
      <div className="flex flex-wrap items-center justify-end gap-1.5">
        <Button variant="outline" size="sm">
          <ImageUp /> Add photos
        </Button>
        <span className="relative">
          <Button variant="outline" size="sm" data-dx-download="">
            <Download /> Download
          </Button>
          {download}
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

/** The album's justified rows, newest first, at the frame's own row count. */
export function AlbumRows({
  screen,
  count = 24,
}: {
  screen: ScreenId;
  count?: number;
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
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
}

/**
 * MAYA'S HUB, AT ITS ALBUM: the bar, then the album's section, with whatever a
 * send stands at its head (`strip`) and whatever opens over it (`over`).
 */
export function Hub({
  screen,
  name = EVENT.name,
  count,
  banner,
  strip,
  download,
  over,
}: {
  screen: ScreenId;
  /** The album's name in the trail (the daily limit's frame is another album). */
  name?: string;
  /** Its count, where it is not Maya & Jay's. */
  count?: number;
  /** A banner under the bar, across the page (one way a stop is said). */
  banner?: ReactNode;
  strip?: ReactNode;
  download?: ReactNode;
  over?: ReactNode;
}) {
  return (
    <Ground over={over}>
      <AppBar trail={`Events / ${name}`} />
      {banner}
      <Page>
        <section aria-label="Album" className="space-y-2.5">
          <AlbumHead download={download} count={count} />
          {strip}
          <AlbumRows screen={screen} />
        </section>
      </Page>
    </Ground>
  );
}

/* ── the pieces every moment of a send shares ─────────────────────────── */

/**
 * GOOGLE DRIVE, NAMED: a lucide folder standing in for Google's own Drive
 * mark, which the wiring places by Google's brand rules (never redrawn here).
 */
export function DriveName({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <FolderUp className="size-4 shrink-0" aria-hidden />
      Google Drive
    </span>
  );
}

/**
 * THE ALBUM AS A FOLDER: its photographs sliding into a folder, the Drive
 * card's picture (bible 6, the media is the colour), in a desk's 3:2 or a
 * hand's short strip. The folder's front names where they land.
 */
export function FolderPicture({
  wide,
  label = `Partyreel / ${EVENT.name}`,
}: {
  wide: boolean;
  label?: string;
}) {
  // Three photographs fanned as they slide in: their feet go behind the folder's front.
  const fan = wide
    ? [
        { i: 1, turn: -8, left: "13%", top: "12%" },
        { i: 5, turn: -1, left: "33%", top: "6%" },
        { i: 0, turn: 7, left: "53%", top: "12%" },
      ]
    : [
        { i: 1, turn: -7, left: "16%", top: "14%" },
        { i: 5, turn: 0, left: "36%", top: "6%" },
        { i: 0, turn: 6, left: "56%", top: "14%" },
      ];
  return (
    <span
      aria-hidden
      className={cn(
        "relative block overflow-hidden rounded-[calc(var(--radius-float)-4px)] bg-muted",
        wide ? "aspect-[3/2]" : "h-16",
      )}
    >
      {/* The folder's back and its tab, behind the photographs. */}
      <span
        className={cn(
          "absolute rounded-t-md bg-foreground/15",
          wide ? "top-[20%] left-[8%] h-[10%] w-[30%]" : "top-[22%] left-[8%] h-3 w-[28%]",
        )}
      />
      <span
        className={cn(
          "absolute inset-x-[8%] bottom-0 rounded-t-lg bg-foreground/15",
          wide ? "top-[28%]" : "top-[32%]",
        )}
      />
      {fan.map(({ i, turn, left, top }) => {
        const p = photoAt(i);
        return (
          // eslint-disable-next-line @next/next/no-img-element -- a bootstrap still, the folder's photographs
          <img
            key={i}
            src={p.src}
            alt=""
            draggable={false}
            className={cn(
              "absolute rounded-[3px] object-cover shadow-lg ring-2 ring-card",
              wide ? "h-[60%] w-[34%]" : "h-[74%] w-[30%]",
            )}
            style={{ left, top, transform: `rotate(${turn}deg)` }}
          />
        );
      })}
      {/* The folder's front, over their feet, naming where they land. */}
      <span
        className={cn(
          "absolute inset-x-[6%] bottom-0 flex items-end rounded-t-lg bg-card shadow-[0_-12px_24px_-16px_rgb(0_0_0/0.7)] ring-1 ring-foreground/10",
          wide ? "h-[34%] px-3 pb-2.5" : "h-[40%] px-2 pb-1",
        )}
      >
        <span
          className={cn(
            "flex min-w-0 items-center gap-1.5 text-muted-foreground",
            wide ? "text-xs" : "text-[11px]",
          )}
        >
          <FolderUp className={cn("shrink-0", wide ? "size-3.5" : "size-3")} />
          <span className="truncate">{label}</span>
        </span>
      </span>
    </span>
  );
}

/** A state, as a light and its word (identity's status=lights: `Badge`). */
export function Light({
  tone,
  children,
}: {
  tone: "sending" | "paused" | "done" | "stopped" | "quiet";
  children: ReactNode;
}) {
  const variant =
    tone === "sending"
      ? "info"
      : tone === "paused"
        ? "warning"
        : tone === "done"
          ? "success"
          : tone === "stopped"
            ? "destructive"
            : "secondary";
  return <Badge variant={variant}>{children}</Badge>;
}

/** The meter: production's twelve frames filling as a roll fills. */
export function Meter({
  value,
  failed = false,
  className,
}: {
  value: number;
  failed?: boolean;
  className?: string;
}) {
  return (
    <Progress
      value={value}
      aria-invalid={failed || undefined}
      aria-label="Sent"
      className={className}
    />
  );
}
