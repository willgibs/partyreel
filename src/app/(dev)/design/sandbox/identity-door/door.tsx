"use client";

import type { CSSProperties, ReactNode } from "react";
import { ChevronLeft, XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { floatingKeyboardFoot } from "@/components/ui/floating-layer";
import { cn } from "@/lib/utils";

import { KEYBOARD_H } from "./keyboard";
import { PHONE } from "./scene";

/** The visible area with the keyboard up, less the 12 px the rule keeps clear. */
const KB_SHEET_MAX = PHONE.h - KEYBOARD_H - 12;

/**
 * THE DOOR'S CHROME: the scrim behind it, the phone sheet's two postures and
 * the desk's panel, the same under every answer.
 *
 * ★ QUOTED FROM `entry-shell.tsx` AND THE RESPONSIVE SHEET, NOT MOUNTED. A
 * Radix Sheet opened inside a portalled lab frame renders on the LAB PAGE's
 * document, not the phone being judged, so the paper, its padding and its
 * keyboard posture are copied onto inert elements here.
 *
 * ★ ONE SCROLL, THE PRIMARY STICKY (production's shape, not round two's
 * split): the whole sheet scrolls, and with the keyboard up (`data-keyboard`,
 * the Sheet's own attribute) the step's primary wears `floatingKeyboardFoot`,
 * sticking to the sheet's foot while what follows it in the DOM (Log in's
 * Google and its password link) waits under the fold, exactly where
 * production leaves them. The sheet stands ON the keyboard at the visible
 * height less 12 px, sized to its content.
 *
 * ★ THE PANEL IS OPAQUE, SO THE BLUR AND THE OVERLAY BELONG TO THE SCRIM
 * (`floating-layer.ts` has no translucent panels): a backdrop filter blurs what
 * is BEHIND the element it sits on, so the scrim is its own layer between the
 * album and the sheet.
 */

export type ScrimSpec = {
  blur: number;
  /** Black, 0 to 1. */
  dim: number;
  brightness?: number;
  saturate?: number;
};

export function Scrim({ spec }: { spec: ScrimSpec }) {
  const filter = [
    `blur(${spec.blur}px)`,
    spec.brightness !== undefined ? `brightness(${spec.brightness})` : "",
    spec.saturate !== undefined ? `saturate(${spec.saturate})` : "",
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <div
      data-door-scrim
      aria-hidden
      className="fixed inset-0 z-40"
      style={
        {
          backgroundColor: `rgb(0 0 0 / ${spec.dim})`,
          backdropFilter: filter,
          WebkitBackdropFilter: filter,
        } as CSSProperties
      }
    />
  );
}

/** The paper's own material, quoted from the Sheet. */
const PAPER =
  "isolate overflow-hidden bg-popover text-sm text-popover-foreground shadow-layer";

export type SheetParts = {
  /** Inside the paper, under the content: the lamp. */
  glow?: ReactNode;
  /** The step's chevron back (every held step but the first and the last). */
  back?: boolean;
  /** A FREE sheet's own X (the change sheet, the edit door). */
  close?: boolean;
  /** `door`: the entry shell's 24 px; `sheet`: a plain Sheet, its parts padding themselves. */
  pad?: "door" | "sheet";
  children: ReactNode;
};

/** The chevron, quoted from `entry-modal.tsx`: its own size-9 hit area, top left. */
export function BackChevron() {
  return (
    <span
      data-door-control="back"
      aria-hidden
      className="absolute top-0 left-0 z-10 flex size-9 items-center justify-center rounded-full text-muted-foreground"
    >
      <ChevronLeft className="size-5" />
    </span>
  );
}

/** A free sheet's close, as `ui/sheet.tsx` draws it: a ghost icon-sm Button. */
export function CloseMark() {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      tabIndex={-1}
      aria-hidden
      data-door-control="close"
      className="absolute top-3 right-3 z-20"
    >
      <XIcon />
    </Button>
  );
}

/**
 * The primary action's wrapper: `floatingKeyboardFoot`, verbatim, so with the
 * keyboard up it sticks to the sheet's foot over a fade, as production's does.
 */
export function KbFoot({ children }: { children: ReactNode }) {
  return (
    <div data-sheet-primary className={cn("relative", floatingKeyboardFoot)}>
      {children}
    </div>
  );
}

function Content({
  back,
  pad,
  children,
}: Pick<SheetParts, "back" | "pad" | "children">) {
  if (pad === "sheet") return <>{children}</>;
  return (
    // The step container's own `relative pt-1`; the chevron sits at its top
    // left and a step with one clears it with `pt-7` (`entry-modal.tsx`).
    <div className="relative pt-1">
      {back && <BackChevron />}
      <div className={back ? "pt-7" : undefined}>{children}</div>
    </div>
  );
}

export function PhoneSheet({
  keyboard,
  glow,
  back,
  close,
  pad = "door",
  children,
}: SheetParts & { keyboard: boolean }) {
  return (
    <div
      data-door-sheet="phone"
      data-door-paper
      data-keyboard={keyboard ? "open" : undefined}
      className={cn(
        PAPER,
        "fixed inset-x-0 z-50 flex flex-col rounded-t-float border-t border-border",
      )}
      style={
        keyboard
          ? { bottom: KEYBOARD_H, maxHeight: KB_SHEET_MAX }
          : { bottom: 0, maxHeight: "85%" }
      }
    >
      {glow}
      <div
        data-door-scroll
        className={cn(
          "relative z-10 min-h-0 flex-1 overflow-y-auto overscroll-contain",
          pad === "door" && "px-6 pt-5",
          pad === "door" && !keyboard && "pb-6",
        )}
      >
        <Content back={back} pad={pad}>
          {children}
        </Content>
      </div>
      {close && <CloseMark />}
    </div>
  );
}

/** The desk's panel: the responsive Sheet's side (`w-3/4 max-w-md`), full height. */
export function DeskPanel({
  glow,
  back,
  close,
  pad = "door",
  children,
}: SheetParts) {
  return (
    <div
      data-door-sheet="desk"
      data-door-paper
      className={cn(
        PAPER,
        "fixed inset-y-0 right-0 z-50 flex w-3/4 max-w-md flex-col border-l border-border",
      )}
    >
      {glow}
      <div
        data-door-scroll
        className={cn(
          "relative z-10 min-h-0 flex-1 overflow-y-auto",
          pad === "door" && "p-6",
        )}
      >
        <Content back={back} pad={pad}>
          {children}
        </Content>
      </div>
      {close && <CloseMark />}
    </div>
  );
}
