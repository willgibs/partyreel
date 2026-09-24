"use client";

import { type ReactNode } from "react";

import { Fit, Frame } from "@/components/lab";
import type { Control } from "@/components/lab/board-spec";
import { floatingPanel } from "@/components/ui/floating-layer";
import { Logo } from "@/components/shared/logo";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { PRIYA } from "./fixtures";

/**
 * THE ONE FRAME EVERY DECISION DRAWS IN (`guest-capture/scene.tsx`'s own
 * pattern, hand-rolled again here rather than shared: the measuring and the
 * ground differ per board, and a board's directory is deleted whole at its
 * ruling).
 *
 * ★ PHONE FIRST, 1440 ON THE KNOB. All five decisions default to a phone: the
 * claim ticket is read on whatever Priya is holding when she opens the
 * dashboard, most often the same phone she just confirmed on.
 *
 * ★ NOTHING HERE MAY MOUNT A RADIX PORTAL OR REACH A SESSION (the same
 * landmine `guest-capture/scene.tsx` and `host-curation` both name). `AppShell`
 * and `EventCard` are real, presentational, session-free imports; a Dialog,
 * Sheet or DropdownMenu would portal to the LAB PAGE's own document from
 * inside a frame, so every dialog, sheet, drawer and toast below is QUOTED
 * markup on `fixed` positioning (never `absolute`: the frame IS the viewport,
 * and an ancestor whose height never resolves would put an `absolute` foot
 * off the bottom of the picture).
 */

export const SCREENS = {
  "375": { w: 375, h: 812, name: "a phone" },
  "1440": { w: 1440, h: 900, name: "a laptop" },
} as const;
export type ScreenId = keyof typeof SCREENS;
export const screenOf = (v: string | undefined): ScreenId =>
  v === "1440" ? "1440" : "375";

export const SCREEN: Control = {
  id: "screen",
  label: "Screen",
  options: [
    { id: "375", label: "375, a phone" },
    { id: "1440", label: "1440, a laptop" },
  ],
  default: "375",
};

export function Scene({
  id,
  screen,
  title,
  caption,
  children,
}: {
  id: string;
  screen: ScreenId;
  title: string;
  /** A plain sentence stating the fixed fact this option draws (a count, a
   *  position, a word), read off the same fixtures the picture is built
   *  from rather than asserted loosely. */
  caption: string;
  children: ReactNode;
}) {
  const { w, h } = SCREENS[screen];
  return (
    <Fit w={w}>
      <Frame
        id={`${id}-${screen}`}
        w={w}
        h={h}
        title={`${title}, ${SCREENS[screen].name}`}
        caption={caption}
      >
        {children}
      </Frame>
    </Fit>
  );
}

/* ── the guest album's header, quoted (the confirmed state only: this board
      never meets Priya before she has an account) ──────────────────────── */

export function AlbumHeader() {
  return (
    <header className="flex items-center justify-between gap-2 border-b border-border/60 px-5 py-3">
      <span className="flex items-center gap-2.5">
        <Logo />
      </span>
      <Avatar size="sm" seed={PRIYA.seed}>
        <AvatarFallback className="text-[10px]">
          {PRIYA.name.slice(0, 1).toUpperCase()}
        </AvatarFallback>
      </Avatar>
    </header>
  );
}

/** The guest album's own ground for the `pointer` ask: the confirmed header,
 *  then whatever the decision draws where the moment card lives. No gallery
 *  strip beneath it: the album's own shape is `guest-shape` and
 *  `album-columns`' own question, drawn here as production has it rather
 *  than redrawn. */
export function AlbumGround({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-full bg-background text-foreground">
      <AlbumHeader />
      <div className="mx-auto max-w-[640px] px-4 py-5">{children}</div>
    </div>
  );
}

/* ── the small pieces every ticket variant shares ────────────────────────── */

/** A tiny rounded still, never a real presigned URL: `pass` and `confirm`'s
 *  own thumbnail strips, at the size a row can afford under it. */
export function Thumb({ url, size = 40 }: { url: string; size?: number }) {
  return (
    <div
      className="shrink-0 overflow-hidden bg-black/10"
      style={{
        width: size,
        height: size,
        borderRadius: "var(--radius-tile)",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- a stand-in still, not a presigned URL */}
      <img src={url} alt="" className="size-full object-cover" />
    </div>
  );
}

/**
 * A TOAST, QUOTED (the shipped Toaster sits at the top under the bar).
 * `fixed`, never `absolute`, for the reason every quoted floating surface
 * here is: the frame is the viewport regardless of what an ancestor's height
 * resolves to.
 */
export function ToastVisual({ lines }: { lines: ReactNode[] }) {
  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-16 z-50 flex justify-center px-4"
    >
      {/* top-16: under the header bar (h-14 in AppShell, the same rough
          height in the quoted AlbumHeader), never on top of it. */}
      <div
        className={cn(
          "pointer-events-auto flex w-full max-w-sm flex-col gap-1 px-4 py-3 text-sm",
          floatingPanel,
        )}
      >
        {lines.map((line, i) => (
          <p
            key={i}
            className={
              i === 0 ? "font-medium text-foreground" : "text-muted-foreground"
            }
          >
            {line}
          </p>
        ))}
      </div>
    </div>
  );
}

/** A scrim behind a centred dialog or an open sheet: dims the page it sits over. */
export function Scrim() {
  return <div className="fixed inset-0 z-40 bg-black/10" aria-hidden />;
}

export function DialogFoot({
  onCancelLabel = "Go back",
  actionLabel,
}: {
  onCancelLabel?: string;
  actionLabel: string;
}) {
  return (
    <div className="mt-2 flex justify-end gap-2">
      <Button type="button" variant="outline" tabIndex={-1}>
        {onCancelLabel}
      </Button>
      <Button type="button" variant="destructive" tabIndex={-1}>
        {actionLabel}
      </Button>
    </div>
  );
}
