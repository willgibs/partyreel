"use client";

/**
 * THE PIECES EVERY PLACE A SEND SHOWS SHARES (the board's chrome, wired): Google Drive named, a send's light and word
 * (status=lights: `Badge`), the meter (production's twelve frames: `Progress`), and the album as a folder, its
 * photographs sliding in (the Drive card's picture: bible 6, the media is the colour).
 *
 * ★ GOOGLE'S OWN DRIVE MARK IS AN ASSET, NEVER REDRAWN HERE: a folder glyph stands in until the mark arrives by Google's
 * brand rules (the Handoff's asset ask), swapped in `DriveGlyph` alone.
 */
import type { ReactNode } from "react";
import { FolderUp } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { DriveTone } from "@/lib/drive/moments";
import { cn } from "@/lib/utils";

import { NOT_SET_UP } from "./not-set-up";

/** The stand-in for Google's Drive mark (one place to swap it). */
export function DriveGlyph({ className }: { className?: string }) {
  return <FolderUp className={cn("size-4 shrink-0", className)} aria-hidden />;
}

/** "Google Drive", with its mark. */
export function DriveName({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <DriveGlyph />
      Google Drive
    </span>
  );
}

const TONE_VARIANT: Record<
  DriveTone,
  "info" | "warning" | "success" | "destructive"
> = {
  sending: "info",
  paused: "warning",
  done: "success",
  stopped: "destructive",
};

/** A send's state as a light and its word. */
export function DriveLight({
  tone,
  children,
}: {
  tone: DriveTone;
  children: ReactNode;
}) {
  return (
    <Badge
      variant={tone === "stopped" ? "secondary" : TONE_VARIANT[tone]}
      data-drive-light={tone}
    >
      {children}
    </Badge>
  );
}

/** The meter: production's twelve frames, filling as the album goes. */
export function DriveMeter({
  value,
  label = "Sent",
  className,
}: {
  value: number;
  label?: string;
  className?: string;
}) {
  return (
    <Progress
      value={value}
      aria-label={label}
      className={cn("h-1.5", className)}
    />
  );
}

/** The fan: three photographs sliding in, their feet behind the folder's front. */
const FAN = [
  { turn: -8, left: "13%", top: "12%" },
  { turn: -1, left: "33%", top: "6%" },
  { turn: 7, left: "53%", top: "12%" },
] as const;

/**
 * THE ALBUM AS A FOLDER: three of its photographs fanned as they slide in, their feet behind the folder's front, which
 * names where they land. ★ Three DIFFERENT photographs, the album's first: one with fewer leaves the rest as muted
 * tiles rather than showing one twice (the walk saw a photo repeated). A desk's 3:2, a hand's 16:9: the same fan, so at
 * a phone's width each photograph is as tall as it is wide and reads as a photograph, never a strip cropped thin.
 */
export function FolderPicture({
  pictures,
  wide,
  label,
}: {
  pictures: readonly string[];
  wide: boolean;
  label: string;
}) {
  const picks = [...new Set(pictures)].slice(0, FAN.length);
  return (
    <span
      aria-hidden
      data-drive-folder=""
      className={cn(
        "relative block overflow-hidden rounded-[calc(var(--radius-float)-4px)] bg-muted",
        wide ? "aspect-[3/2]" : "aspect-[16/9]",
      )}
    >
      <span className="absolute top-[20%] left-[8%] h-[10%] w-[30%] rounded-t-md bg-foreground/15" />
      <span className="absolute inset-x-[8%] top-[28%] bottom-0 rounded-t-lg bg-foreground/15" />
      {FAN.map(({ turn, left, top }, i) => {
        const src = picks[i] ?? null;
        const shape =
          "absolute h-[60%] w-[34%] rounded-[3px] shadow-lg ring-2 ring-card motion-safe:transition-transform motion-safe:duration-300";
        return src ? (
          // eslint-disable-next-line @next/next/no-img-element -- a presigned tile, never next/image (media-cost-policy)
          <img
            key={i}
            src={src}
            alt=""
            draggable={false}
            className={cn(shape, "object-cover")}
            style={{ left, top, transform: `rotate(${turn}deg)` }}
          />
        ) : (
          <span
            key={i}
            className={cn(shape, "bg-foreground/10")}
            style={{ left, top, transform: `rotate(${turn}deg)` }}
          />
        );
      })}
      <span className="absolute inset-x-[6%] bottom-0 flex h-[34%] items-end rounded-t-lg bg-card px-3 pb-2.5 shadow-[0_-12px_24px_-16px_rgb(0_0_0/0.7)] ring-1 ring-foreground/10">
        <span className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
          <DriveGlyph className="size-3.5" />
          <span className="truncate">{label}</span>
        </span>
      </span>
    </span>
  );
}

/** A refusal or a return's words, in place, with what to do. */
export function Notice({
  title,
  detail,
  children,
}: {
  title: string;
  detail?: string;
  children?: ReactNode;
}) {
  return (
    <div
      role="status"
      data-drive-notice=""
      className="flex flex-col gap-1.5 rounded-float bg-warning/10 px-3 py-2.5 text-sm ring-1 ring-warning/40"
    >
      <span className="font-medium text-pretty">{title}</span>
      {detail ? (
        <span className="text-xs text-pretty text-muted-foreground">
          {detail}
        </span>
      ) : null}
      {children ? (
        <span className="mt-1 flex flex-wrap gap-1.5">{children}</span>
      ) : null}
    </div>
  );
}

/** Drive is not set up on this deployment (`NOT_SET_UP`), said where a press would otherwise go on to a choice. */
export function NotSetUpNotice() {
  return <Notice title={NOT_SET_UP.title} detail={NOT_SET_UP.detail} />;
}
