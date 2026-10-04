"use client";

import type { CSSProperties, ReactNode } from "react";

import { cn } from "@/lib/utils";

import { SLIDES } from "../deck/contract";
import { useSlide } from "../deck/deck";
import { Edge } from "./system";

/**
 * THE DECK'S OWN SCAFFOLDING for Contact Sheet's slides: the root (the
 * ground and the tokens), a kicker, and the film edge every slide prints
 * along its foot, so the deck itself is a roll and each slide one frame of it.
 */

export type Screen = "1440" | "375";

/** A slide's whole box, on paper (or the room), wearing the system's tokens. */
export function SlideRoot({
  screen,
  ground = "paper",
  children,
  className,
  style,
}: {
  screen: Screen;
  ground?: "paper" | "room";
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      className={cn("cs-root", className)}
      data-cs-screen={screen}
      data-cs-ground={ground === "room" ? "room" : undefined}
      style={style}
    >
      {children}
    </div>
  );
}

/** A small label in the edge's voice, over a block of a slide. */
export function Kicker({
  children,
  className,
  style,
  room = false,
}: {
  children: string;
  className?: string;
  style?: CSSProperties;
  room?: boolean;
}) {
  return (
    <Edge
      items={[children]}
      size={12}
      className={cn(room ? "cs-on-room" : "cs-muted", className)}
      style={{ letterSpacing: "0.16em", ...style }}
    />
  );
}

/**
 * THE SLIDE'S FOOT: Contact Sheet's frame number for this slide, printed the
 * way a film prints along its rebate.
 */
export function SlideFoot({
  screen,
  room = false,
}: {
  screen: Screen;
  room?: boolean;
}) {
  const { n } = useSlide();
  const title = SLIDES[n - 1]?.title ?? "";
  const desk = screen === "1440";
  return (
    <Edge
      items={[
        { text: "Contact Sheet", dim: true },
        String(n).padStart(2, "0"),
        title,
        { text: "Partyreel", dim: true },
        `${String(n).padStart(2, "0")}A`,
      ]}
      repeat={1}
      size={10}
      className={room ? "cs-on-room" : "cs-faint"}
      style={{
        position: "absolute",
        left: desk ? 64 : 16,
        right: 0,
        bottom: desk ? 18 : 14,
        opacity: room ? 0.6 : 1,
      }}
    />
  );
}

/** A line of reading copy at a given size (Inter, the reading face). */
export function Copy({
  children,
  size = 17,
  lead,
  muted = true,
  className,
  style,
}: {
  children: ReactNode;
  size?: number;
  lead?: number;
  muted?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <p
      className={cn("cs-read", muted && "cs-muted", className)}
      style={{
        fontSize: size,
        lineHeight: `${lead ?? Math.round(size * 1.5)}px`,
        margin: 0,
        ...style,
      }}
    >
      {children}
    </p>
  );
}

/**
 * The display face's tracking by size: tight where it is a headline, opening
 * as it shrinks, since Bricolage's display cut is already set close and its
 * letters touch below about 50 px at the hero's tracking.
 */
export const trackFor = (size: number) =>
  size >= 90
    ? "-0.04em"
    : size >= 48
      ? "-0.03em"
      : size >= 28
        ? "-0.02em"
        : "-0.012em";

/** A display line in the vision's loud face. */
export function Display({
  children,
  size,
  className,
  style,
  as: Tag = "h2",
}: {
  children: ReactNode;
  size: number;
  className?: string;
  style?: CSSProperties;
  as?: "h1" | "h2" | "h3" | "p";
}) {
  return (
    <Tag
      className={cn("cs-display", className)}
      style={{
        fontSize: size,
        margin: 0,
        letterSpacing: trackFor(size),
        ...style,
      }}
    >
      {children}
    </Tag>
  );
}
