"use client";

import Image from "next/image";
import type { CSSProperties, ReactNode } from "react";

import { marketingImage } from "@/lib/constants/marketing-media";
import { cn } from "@/lib/utils";

/**
 * Shared scaffolding for the two spill boards.
 *
 * ── THE GROUND PROBLEM (why this file exists) ──
 * The lab wraps every touchpoint in `.mono`, whose light card is pure white
 * (oklch(1 0 0), which the identity forbids) and whose dark background is the
 * app's 0.14 night. Production has three different grounds: the cinema room at
 * 0.11, the ink slab at 0.155, and paper at 0.99. marketing.css does not load
 * on /design at all.
 *
 * A colour ruling made on the wrong ground is a wrong ruling, so every specimen
 * here declares production's REAL tokens locally. That is the same
 * redeclaration mechanism the ink footer uses, and it carries the same trap:
 * painting a subtree dark is only half the job, because --foreground,
 * --muted-foreground and --border are not in the --gallery family and would
 * otherwise keep their light values.
 */

export type GroundName = "cinema" | "slab" | "paper";

/** Production's real token values, not the lab's mock sheet. */
export const GROUNDS: Record<
  GroundName,
  { label: string; note: string; bg: string; fg: string; muted: string }
> = {
  cinema: {
    label: "Cinema",
    note: "the room, oklch(0.11)",
    bg: "oklch(0.11 0 0)",
    fg: "oklch(0.96 0 0)",
    muted: "oklch(0.62 0 0)",
  },
  slab: {
    label: "Ink slab",
    note: "the footer, oklch(0.155)",
    bg: "oklch(0.155 0 0)",
    fg: "oklch(0.97 0 0)",
    muted: "oklch(0.62 0 0)",
  },
  paper: {
    label: "Paper",
    note: "the page, oklch(0.99)",
    bg: "oklch(0.99 0 0)",
    fg: "oklch(0.13 0 0)",
    muted: "oklch(0.45 0 0)",
  },
};

export function groundVars(name: GroundName): CSSProperties {
  const g = GROUNDS[name];
  return {
    "--background": g.bg,
    "--foreground": g.fg,
    "--muted-foreground": g.muted,
    "--border": name === "paper" ? "oklch(0.905 0 0)" : "oklch(1 0 0 / 8%)",
    "--card": name === "paper" ? "oklch(0.997 0 0)" : "oklch(0.21 0 0)",
  } as CSSProperties;
}

/** A specimen stage on one of production's real grounds. */
export function Ground({
  on = "cinema",
  className,
  style,
  children,
}: {
  on?: GroundName;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  return (
    <div
      style={{ ...groundVars(on), ...style }}
      className={cn(
        "relative isolate overflow-hidden rounded-2xl bg-background text-foreground",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function Section({
  n,
  title,
  lede,
  children,
}: {
  n: string;
  title: string;
  lede?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4 border-t border-border pt-8">
      <div>
        <p className="font-mono text-xs tracking-widest text-muted-foreground uppercase">
          {n}
        </p>
        <h2 data-dir-display className="mt-1 text-2xl tracking-tight">
          {title}
        </h2>
        {lede && (
          <div className="mt-2 max-w-3xl text-sm leading-relaxed text-pretty text-muted-foreground">
            {lede}
          </div>
        )}
      </div>
      {children}
    </section>
  );
}

/** One labelled specimen with its caption underneath. */
export function Spec({
  name,
  note,
  className,
  children,
}: {
  name: string;
  note?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <figure className={cn("flex min-w-0 flex-col gap-2", className)}>
      {children}
      <figcaption>
        <p className="text-sm font-medium">{name}</p>
        {note && (
          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
            {note}
          </p>
        )}
      </figcaption>
    </figure>
  );
}

export type VerdictKind = "ship" | "work" | "reject";

const VERDICT_STYLE: Record<VerdictKind, string> = {
  ship: "border-transparent bg-foreground text-background",
  work: "border-border text-foreground",
  reject: "border-border text-muted-foreground line-through decoration-1",
};

export function Verdict({
  kind,
  children,
}: {
  kind: VerdictKind;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-medium",
        VERDICT_STYLE[kind],
      )}
    >
      {children}
    </span>
  );
}

/** The four facts every specimen has to be able to answer. */
export function LampCard({
  lamp,
  direction,
  colour,
  law,
}: {
  lamp: string;
  direction: string;
  colour: string;
  law: string;
}) {
  const rows: [string, string][] = [
    ["Lamp", lamp],
    ["Direction", direction],
    ["Colour", colour],
    ["Admitted by", law],
  ];
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-xs">
      {rows.map(([k, v]) => (
        <div key={k} className="contents">
          <dt className="text-muted-foreground">{k}</dt>
          <dd className="text-pretty">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

/** The real curated event photos, so a lamp has something real to be light from. */
export const WALL_IDS = [
  "wedding-golden",
  "concert-confetti",
  "party-balloons",
  "reception-table",
  "festival-lights",
  "wedding-toast",
  "party-dj",
  "wedding-petals",
] as const;

export function PhotoWall({
  ids = WALL_IDS,
  cols = 4,
  className,
  priority = false,
}: {
  ids?: readonly string[];
  cols?: number;
  className?: string;
  priority?: boolean;
}) {
  return (
    <div
      className={cn("grid gap-[var(--gap-gallery)]", className)}
      style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
    >
      {ids.map((id) => {
        const img = marketingImage(id);
        return (
          <div
            key={id}
            className="relative aspect-[4/5] overflow-hidden"
            style={{ borderRadius: "var(--radius-tile)" }}
          >
            <Image
              src={img.src}
              alt=""
              fill
              sizes="200px"
              priority={priority}
              className="object-cover"
            />
          </div>
        );
      })}
    </div>
  );
}
