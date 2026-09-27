"use client";

import "../door.css";

import type { CSSProperties, ReactNode } from "react";
import { Lock } from "lucide-react";

import { DoorGlyph } from "@/components/guest/door/lit";

/**
 * THE DOOR'S ONE HEADING SCALE, for every guest sheet (ROADMAP's line, carried by `door-r3-wiring`):
 * an optional eyebrow, the title on the page step, and a reason under it, read from the left. Every
 * step of the held door heads this way, and so do the sheets that open over the album (the change,
 * add and confirm sheets from her menu, the like door), which used to head with a Sheet's card title:
 * one guest, one door, one size of heading.
 *
 * ★ ITS LINES REVEAL (`beat=lit`'s note, the text reveal): each carries `data-door-line` and its
 * place in the stagger, and `door.css` decides whether they rise, which is only where nothing else
 * is moving them (the side-by-side move stands the reveal down).
 *
 * `hidden` is for a sheet that announces the same two sentences itself (the door's shell and the
 * sheets over the album name their dialog with them), so a screen reader never hears them twice.
 */
export type DoorHead = {
  eyebrow?: ReactNode;
  title: ReactNode;
  reason?: ReactNode;
};

export function DoorHeading({
  eyebrow,
  title,
  reason,
  hidden = false,
  titleAs: Title = "p",
  reasonId,
  className,
}: DoorHead & {
  /** The sheet already announces these words (its title and description), so hide them here. */
  hidden?: boolean;
  /** The title's element (the password step keeps its `h1`). */
  titleAs?: "p" | "h1" | "h2";
  /** An id on the reason, for a field it describes (the code screen's "We sent a code to…"). */
  reasonId?: string;
  className?: string;
}) {
  let line = 0;
  const next = () => ({ "--door-line-i": line++ }) as CSSProperties;
  return (
    <div
      data-door-heading
      aria-hidden={hidden || undefined}
      className={className}
    >
      {eyebrow && (
        <p
          data-door-line
          style={next()}
          className="mb-1.5 flex items-center gap-1.5 text-label font-medium text-muted-foreground uppercase"
        >
          {eyebrow}
        </p>
      )}
      <Title
        data-door-line
        style={next()}
        className="font-heading text-page text-balance"
      >
        {title}
      </Title>
      {reason && (
        <p
          id={reasonId}
          data-door-line
          style={next()}
          className="mt-2 text-base leading-relaxed text-muted-foreground"
        >
          {reason}
        </p>
      )}
    </div>
  );
}

/**
 * "Almost in" with its Lock, the eyebrow of a door that asks for proof (the password step and a
 * verification event's gate). The Lock is a glyph inside a line, so it takes the lamp's light
 * (`icons=lit`: the small glyphs take the same light as the pools).
 */
export function AlmostIn({ children }: { children: ReactNode }) {
  return (
    <>
      <DoorGlyph icon={Lock} hue={1} className="size-3" />
      {children}
    </>
  );
}
