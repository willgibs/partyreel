"use client";

import "./face.css";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { background, blendMode, css, orbFor } from "@/lib/avatar/gradient";
import { cn } from "@/lib/utils";

import { alpha, lampColor } from "./light";

/** How a face with no photograph is coloured (the `colour` decision): production's wheel, one warm arc, or lit. */
export type Palette = "wheel" | "warm" | "lit";

/**
 * ONE FACE: production's `Avatar` on its seed (the wheel, as built), or the
 * same person drawn from one warm arc (the generator's own `warm` palette),
 * or LIT: a disc of the room with her own hue as light inside it, from where
 * her orb's light sits, and her initial in that light (a face as a lamp,
 * Aperture's piece of the room, the same on every ground).
 */
export function Face({
  seed,
  name,
  palette,
  size,
  className,
  initial,
}: {
  seed: string;
  name: string;
  palette: Palette;
  size: "sm" | "default" | "lg" | "xl";
  className?: string;
  initial?: string;
}) {
  if (palette === "wheel")
    return (
      <Avatar size={size} seed={seed} className={className}>
        <AvatarFallback className={initial}>{name.slice(0, 1)}</AvatarFallback>
      </Avatar>
    );
  if (palette === "warm") {
    const o = orbFor(seed, "warm");
    return (
      <Avatar
        size={size}
        className={className}
        style={{
          backgroundImage: background(o, "mesh"),
          backgroundBlendMode: blendMode("mesh"),
        }}
      >
        <AvatarFallback
          className={cn("bg-transparent", initial)}
          style={{ color: css(o.ink) }}
        >
          {name.slice(0, 1)}
        </AvatarFallback>
      </Avatar>
    );
  }
  const o = orbFor(seed);
  const lit = lampColor({ h: o.hue, w: 1, dl: 0.06 });
  const body = lampColor({ h: o.hue, w: 1 });
  return (
    <Avatar
      size={size}
      className={className}
      data-pr-lit=""
      style={{
        background: [
          `radial-gradient(120% 120% at ${o.light.x.toFixed(0)}% ${o.light.y.toFixed(0)}%, ${alpha(lit, 62)} 0%, ${alpha(body, 26)} 42%, transparent 72%)`,
          "#141416",
        ].join(", "),
        boxShadow: `inset 0 0 0 1px ${alpha(body, 40)}`,
      }}
    >
      <AvatarFallback
        className={cn("bg-transparent font-medium", initial)}
        style={{ color: lit }}
      >
        {name.slice(0, 1)}
      </AvatarFallback>
    </Avatar>
  );
}
