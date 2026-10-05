"use client";

import type { CSSProperties, ReactNode } from "react";

import { cn } from "@/lib/utils";

import { HEAD } from "../../deck/deck";
import { Photo, type PhotoId } from "../../deck/media";
import type { ScreenId } from "../../knobs";
import { ON, type Tone } from "../system";

/**
 * THE SLIDES' OWN KIT: a slide's ground, its small words and a photograph at
 * viewfinder's corner. Slide furniture only; the brand's parts are in
 * `../system` and `../marks`.
 */

export const isDesk = (s: ScreenId) => s === "1440";

/** A slide's whole box, on one ground, with the deck's head band kept clear. */
export function SlideGround({
  tone,
  screen,
  children,
  className,
  style,
  pad = true,
}: {
  tone: Tone;
  screen: ScreenId;
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
  /** Keep words out of the head band (false: a picture may run under it). */
  pad?: boolean;
}) {
  return (
    <div
      className={cn("ev-root", className)}
      style={{
        backgroundColor: ON[tone].ground,
        color: ON[tone].ink,
        paddingTop: pad ? HEAD[screen] : 0,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/** A slide's kicker: the camera's readout voice, small. */
export function Kicker({
  children,
  tone,
  className,
  style,
}: {
  children: ReactNode;
  tone: Tone;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <p
      className={cn("ev-label", className)}
      style={{ color: ON[tone].muted, ...style }}
    >
      {children}
    </p>
  );
}

/** A photograph at the album's corner (2 px), cover-cropped to its box. */
export function Pic({
  id,
  focus,
  className,
  style,
  lit = false,
  children,
}: {
  id: PhotoId;
  focus?: string;
  className?: string;
  style?: CSSProperties;
  lit?: boolean;
  children?: ReactNode;
}) {
  return (
    <div
      className={cn("ev-photo", lit && "ev-photo-lit", className)}
      style={style}
    >
      <Photo id={id} focus={focus} />
      {children}
    </div>
  );
}
