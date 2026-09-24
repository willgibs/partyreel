"use client";

import { type ReactNode, useState } from "react";
import { X } from "lucide-react";

import { Fit, Frame, Measured } from "@/components/lab";
import { Logo } from "@/components/shared/logo";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

import { EVENT } from "./fixtures";

/**
 * THE FRAMES EVERY DECISION DRAWS IN (`Fit` and `Measured` are the kit's;
 * `Scene` stays here, since a board's directory is deleted at its ruling and
 * its own props would not fit every other board's `Scene` alongside it).
 *
 * ★ 1440 FIRST, 375 ON THE KNOB. Every question here sits on a host surface
 * that ships laptop-first (the hub, the settings sheet, the dashboard), and
 * the knob is the phone a host carries at their own party.
 */
export const SCREENS = {
  "1440": { w: 1440, h: 900, name: "a laptop" },
  "375": { w: 375, h: 812, name: "a phone" },
} as const;
export type ScreenId = keyof typeof SCREENS;
export const screenOf = (v: string | undefined): ScreenId =>
  v === "375" ? "375" : "1440";

type Probe = (root: HTMLElement, win: Window) => string | null;

export function Scene({
  id,
  screen,
  title,
  caption,
  measure,
  children,
}: {
  id: string;
  screen: ScreenId;
  title: string;
  /** A static caption. Omit and pass `measure` for a number read off the frame. */
  caption?: string;
  measure?: Probe;
  children: ReactNode;
}) {
  const { w, h } = SCREENS[screen];
  const [measured, setMeasured] = useState("measuring");
  const body = measure ? (
    <Measured probe={measure} deps={[screen, id]} onMeasure={setMeasured}>
      {children}
    </Measured>
  ) : (
    children
  );
  return (
    <Fit w={w}>
      <Frame
        id={`${id}-${screen}`}
        w={w}
        h={h}
        title={`${title}, ${SCREENS[screen].name}`}
        caption={measure ? measured : caption}
      >
        {body}
      </Frame>
    </Fit>
  );
}

/**
 * THE REVIEW QUESTION'S ONE FRAME: the big screen and the host's phone, side by
 * side, because every option of that merged question is two facts at once
 * (what the host is told, and what the room is told).
 *
 * ★ ONE FRAME, NOT TWO. Two frames side by side would have been truer to the
 * pixel, and the demo that captures a step keeps only the LARGEST frame: five
 * of the seven options would have gone to the review sheet as the same resting
 * screen, the host's side cropped away. So the screen is drawn at half a 1920
 * wall in container units (`parts-screen.tsx`) and the phone at its true 375,
 * both inside one 1440 frame, each labelled, and every capture carries both.
 */
export const COMPOSITE = { w: 1440, h: 900 } as const;

export function Composite({
  id,
  title,
  measure,
  screenLabel,
  phoneLabel,
  screen,
  phone,
}: {
  id: string;
  title: string;
  measure: Probe;
  screenLabel: string;
  phoneLabel: string;
  screen: ReactNode;
  phone: ReactNode;
}) {
  const [measured, setMeasured] = useState("measuring");
  return (
    <Fit w={COMPOSITE.w}>
      <Frame
        id={`${id}-composite`}
        w={COMPOSITE.w}
        h={COMPOSITE.h}
        title={`${title}, the screen and the host's phone`}
        caption={measured}
      >
        <Measured probe={measure} deps={[id]} onMeasure={setMeasured}>
          {/* The ground follows the lab's own theme, as every other frame on
              this board does: the phone is the host app in whichever mode is
              being judged, and the screen is a cinema in both. */}
          <div
            className="flex bg-muted/60 text-foreground"
            style={{ width: COMPOSITE.w, height: COMPOSITE.h }}
          >
            <div className="flex w-[1032px] flex-col justify-center gap-3 pl-9">
              <p className="text-xs font-medium text-muted-foreground">
                {screenLabel}
              </p>
              <div className="w-[960px]">{screen}</div>
            </div>
            <div className="flex flex-col justify-center gap-3">
              <p className="text-xs font-medium text-muted-foreground">
                {phoneLabel}
              </p>
              <div
                data-rh-phone=""
                className="relative h-[812px] w-[375px] overflow-hidden rounded-[28px] bg-background ring-1 ring-foreground/15"
              >
                {phone}
              </div>
            </div>
          </div>
        </Measured>
      </Frame>
    </Fit>
  );
}

/** The dashboard's own top bar, quoted: signed in, nothing more. */
export function DashboardBar() {
  return (
    <header className="flex h-14 items-center justify-between gap-2 border-b border-border/60 px-5">
      <span className="flex items-center gap-2.5">
        <Logo />
        <span className="text-sm font-medium text-muted-foreground">
          Dashboard
        </span>
      </span>
      <Avatar size="sm" seed="reel-host-mia">
        <AvatarFallback className="text-[10px]">
          {EVENT.host.slice(0, 1)}
        </AvatarFallback>
      </Avatar>
    </header>
  );
}

/**
 * THE ONE RESPONSIVE SHEET, QUOTED (`ui/sheet.tsx`'s own classes at each
 * posture): a right panel at a desk, a bottom sheet in a hand, already open,
 * over a dimmed ground. Never the real `Sheet`: radix PORTALS its content to
 * the document the frame's `<iframe>` lives in, not the one inside it.
 *
 * ★ `fixed`, NEVER `absolute` (found live, 2026-09-22): with no normal-flow
 * content above it, an `absolute` panel anchors to a `min-h-full` ancestor that
 * has nothing to inherit its height from inside the frame's document and
 * collapses to zero. `fixed` anchors to the iframe's own viewport.
 */
export function SheetGround({
  screen,
  title,
  description,
  behind,
  children,
}: {
  screen: ScreenId;
  title: string;
  description?: string;
  /** The page the sheet opens over: the host's event page, as it really does. */
  behind?: ReactNode;
  children: ReactNode;
}) {
  const bottom = screen === "375";
  return (
    <div className="min-h-full bg-background text-foreground">
      {behind}
      {/* `ui/sheet.tsx`'s own scrim: a tenth of black and the faintest blur. */}
      <div className="fixed inset-0 bg-black/10 backdrop-blur-xs" />
      <div
        data-rh-sheet
        className={
          bottom
            ? "fixed inset-x-0 bottom-0 flex max-h-[88%] flex-col gap-4 overflow-y-auto rounded-t-xl border-t border-border bg-popover bg-clip-padding p-4 text-popover-foreground shadow-layer"
            : "fixed inset-y-0 right-0 flex h-full w-full max-w-sm flex-col gap-4 overflow-y-auto border-l border-border bg-popover bg-clip-padding p-4 text-popover-foreground shadow-layer"
        }
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate font-heading text-card-title font-medium text-foreground">
              {title}
            </p>
            {description && (
              <p className="truncate text-sm text-muted-foreground">
                {description}
              </p>
            )}
          </div>
          <span className="flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground">
            <X className="size-4" aria-hidden />
          </span>
        </div>
        {children}
      </div>
    </div>
  );
}

/** A grey placeholder card standing in for a real settings card this board
 *  has no question about: present so the sheet reads as a real sheet, never
 *  drawn in full, which would spend the reading budget on cards nobody is
 *  judging. */
export function UnrelatedCard({ title }: { title: string }) {
  return (
    <div
      data-rh-unrelated
      className="rounded-lg border border-dashed border-border/70 p-3 text-xs text-muted-foreground"
    >
      {title}
    </div>
  );
}
