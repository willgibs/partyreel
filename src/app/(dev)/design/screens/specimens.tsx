"use client";

import { useState } from "react";
import { Check, RotateCcw } from "lucide-react";

import type { Direction } from "../directions";

/**
 * The LIVE motion specimens: press, enter, stagger, modal, and (Celebration
 * only) the one celebratory moment. Replays work by remounting keyed subtrees,
 * so every entrance is the same @starting-style transition the real product
 * would use: interruptible, transform+opacity only, reduced-motion aware.
 */
export function MotionSpecimens({ direction }: { direction: Direction }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <PressSpec />
      <EnterSpec />
      <StaggerSpec />
      <ModalSpec />
      {direction.hasAccent && <CelebrateSpec />}
      <ToastSpec />
    </div>
  );
}

function Stage({
  label,
  onReplay,
  children,
}: {
  label: string;
  onReplay?: () => void;
  children: React.ReactNode;
}) {
  return (
    <div data-dir-card className="flex h-44 flex-col p-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
        {onReplay && (
          <button
            onClick={onReplay}
            aria-label={`Replay ${label}`}
            className="flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted"
          >
            <RotateCcw className="size-3.5" />
          </button>
        )}
      </div>
      <div className="relative flex flex-1 items-center justify-center overflow-hidden rounded-[calc(var(--radius)*0.7)] bg-muted/40">
        {children}
      </div>
    </div>
  );
}

function PressSpec() {
  return (
    <Stage label="Press feedback · 140ms">
      <button
        data-dir-press
        className="h-10 rounded-[calc(var(--radius)*0.8)] bg-primary px-5 text-sm font-medium text-primary-foreground"
      >
        Hold me down
      </button>
    </Stage>
  );
}

function EnterSpec() {
  const [run, setRun] = useState(0);
  return (
    <Stage label="Entrance" onReplay={() => setRun((n) => n + 1)}>
      <div
        key={run}
        data-dir-enter
        data-dir-card
        className="w-3/4 p-3 text-center"
      >
        <p className="text-sm font-medium">A new card settles in</p>
        <p className="mt-0.5 text-[11px] text-muted-foreground">
          scale 0.98 + rise, never from zero
        </p>
      </div>
    </Stage>
  );
}

function StaggerSpec() {
  const [run, setRun] = useState(0);
  return (
    <Stage label="Gallery stagger · 45ms steps" onReplay={() => setRun((n) => n + 1)}>
      <div key={run} data-dir-stagger className="grid w-3/4 grid-cols-3 gap-1.5">
        {Array.from({ length: 6 }, (_, i) => (
          <div
            key={i}
            style={{ "--i": i } as React.CSSProperties}
            className="aspect-square rounded-[calc(var(--radius)*0.5)] bg-foreground/15"
          />
        ))}
      </div>
    </Stage>
  );
}

function ModalSpec() {
  const [open, setOpen] = useState(false);
  return (
    <Stage label="Modal enter">
      <button
        data-dir-press
        onClick={() => setOpen(true)}
        className="h-9 rounded-[calc(var(--radius)*0.8)] border border-border bg-card px-4 text-sm font-medium"
      >
        Open
      </button>
      {open && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 p-3">
          <div data-dir-enter data-dir-card className="w-full max-w-[200px] p-3 text-center">
            <p className="text-sm font-medium">Centered, calm</p>
            <button
              data-dir-press
              onClick={() => setOpen(false)}
              className="mt-2.5 h-8 w-full rounded-[calc(var(--radius)*0.7)] bg-primary text-xs font-medium text-primary-foreground"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </Stage>
  );
}

/** Celebration only: the ONE delight moment, reserved for upload success. */
function CelebrateSpec() {
  const [run, setRun] = useState(0);
  return (
    <Stage label="Upload success · the one celebration" onReplay={() => setRun((n) => n + 1)}>
      <div key={run} className="relative flex items-center justify-center">
        <span data-dir-celebrate-ring className="absolute size-14 rounded-full border-2 border-brand" />
        <span
          data-dir-enter
          className="flex size-11 items-center justify-center rounded-full bg-brand text-brand-foreground"
        >
          <Check className="size-5" />
        </span>
      </div>
    </Stage>
  );
}

function ToastSpec() {
  return (
    <Stage label="Toast (static)">
      <div data-dir-card className="flex w-11/12 items-center gap-2.5 p-3">
        <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-foreground text-background">
          <Check className="size-3" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-xs font-medium">Added to the gallery</p>
          <p className="text-[10px] text-muted-foreground">Just now</p>
        </div>
      </div>
    </Stage>
  );
}
