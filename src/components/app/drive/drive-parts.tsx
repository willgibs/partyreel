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

/**
 * THE ALBUM AS A FOLDER: three of its photographs fanned as they slide in, their feet behind the folder's front, which
 * names where they land. In a desk's 3:2, or a hand's short strip; muted tiles where the album has no pictures to give.
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
  const fan = wide
    ? [
        { turn: -8, left: "13%", top: "12%" },
        { turn: -1, left: "33%", top: "6%" },
        { turn: 7, left: "53%", top: "12%" },
      ]
    : [
        { turn: -7, left: "16%", top: "14%" },
        { turn: 0, left: "36%", top: "6%" },
        { turn: 6, left: "56%", top: "14%" },
      ];
  return (
    <span
      aria-hidden
      data-drive-folder=""
      className={cn(
        "relative block overflow-hidden rounded-[calc(var(--radius-float)-4px)] bg-muted",
        wide ? "aspect-[3/2]" : "h-16",
      )}
    >
      <span
        className={cn(
          "absolute rounded-t-md bg-foreground/15",
          wide
            ? "top-[20%] left-[8%] h-[10%] w-[30%]"
            : "top-[22%] left-[8%] h-3 w-[28%]",
        )}
      />
      <span
        className={cn(
          "absolute inset-x-[8%] bottom-0 rounded-t-lg bg-foreground/15",
          wide ? "top-[28%]" : "top-[32%]",
        )}
      />
      {fan.map(({ turn, left, top }, i) => {
        const src =
          pictures.length > 0 ? pictures[(i * 2) % pictures.length] : null;
        const shape = cn(
          "absolute rounded-[3px] shadow-lg ring-2 ring-card motion-safe:transition-transform motion-safe:duration-300",
          wide ? "h-[60%] w-[34%]" : "h-[74%] w-[30%]",
        );
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
          <DriveGlyph className={wide ? "size-3.5" : "size-3"} />
          <span className="truncate">{label}</span>
        </span>
      </span>
    </span>
  );
}
