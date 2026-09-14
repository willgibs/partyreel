"use client";

// the board's own sheet; it leaves with the board when the ruling lands.
import "./board.css";

import Image from "next/image";
import { type CSSProperties, useState } from "react";
import { Bell, Check, Copy, Plus } from "lucide-react";

import {
  BoardMeta,
  type Ground,
  Stage,
  Toggle,
  type Mode,
} from "@/components/dev/board";
import { MotionTuner } from "@/components/dev/motion-tuner";
import { ROUNDING_TUNER_CONTROLS } from "@/components/dev/motion-tuner-config";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { marketingImage } from "@/lib/constants/marketing-media";
import { cn } from "@/lib/utils";

import { Variant } from "../variant-frame";

/**
 * THE ROUNDING BOARD (the rounding and tweaking GUI round, Orchestrator-run,
 * 2026-09-14). The radius system's sitting surface: every radius token at
 * candidate values on the surfaces that carry it, beside the tuner that drags
 * the real pages. Bible 8 (sharp surfaces, round actions; tokens, never
 * literals) inherits the values Will rules here.
 *
 * Four columns of one kit. Three carry a fixed candidate as inline token
 * overrides on their wrapper (the theme derives every rounded-* utility from
 * --radius with `@theme inline`, so an override on an ancestor restyles the
 * whole subtree), and the fourth is LIVE: it reads the tokens as they stand on
 * <html>, which is where the tuner writes, so dragging a knob restyles it and
 * every real page at once. On the phone canvas one column shows at a time.
 *
 * What the kit found (flagged in the meta): the Button's in-between sizes
 * (h-6, h-7, h-9) carried literal radii (0.6rem, 0.7rem, 0.9rem, the 0.4 x
 * height ratio written out) so only the default and icon sizes followed the
 * action knob; the round derived them from --radius-action so one knob moves
 * the whole action ladder (button.tsx). No value changed at the defaults.
 */

type Candidate = {
  id: "today" | "soft" | "sixteen" | "live";
  name: string;
  rationale: string;
  /** px, in the tuner's order: radius, float, tile, action, action-lg, action-sm. */
  values?: [number, number, number, number, number, number];
};

const CANDIDATES: Candidate[] = [
  {
    id: "today",
    name: "Today",
    rationale:
      "2 / 8 / 3 / 16 / 19.2 / 12.8. Sharp surfaces, round actions, as shipped.",
    values: [2, 8, 3, 16, 19.2, 12.8],
  },
  {
    id: "soft",
    name: "B, soft surfaces",
    rationale:
      "8 / 12 / 4 / 16 / 19.2 / 12.8. Surfaces come up to meet the actions; the contrast narrows but survives.",
    values: [8, 12, 4, 16, 19.2, 12.8],
  },
  {
    id: "sixteen",
    name: "C, the 16px column",
    rationale:
      "16 / 16 / 6 / 20 / 24 / 16. The corner Will picked on the glow board carried into the system; actions go rounder to keep the contrast.",
    values: [16, 16, 6, 20, 24, 16],
  },
  {
    id: "live",
    name: "Live, the tuner",
    rationale:
      "Reads the tokens as the tuner writes them; drag a knob and this column and every real page move together.",
  },
];

const TOKENS = [
  "--radius",
  "--radius-float",
  "--radius-tile",
  "--radius-action",
  "--radius-action-lg",
  "--radius-action-sm",
] as const;

function overrideStyle(c: Candidate): CSSProperties | undefined {
  if (!c.values) return undefined;
  const style: Record<string, string> = {};
  TOKENS.forEach((t, i) => {
    style[t] = `${c.values![i]}px`;
  });
  return style as CSSProperties;
}

const TILES = [
  "wedding-golden",
  "party-dj",
  "festival-lights",
  "concert-confetti",
  "wedding-toast",
  "reception-hall",
];

/** One kit: every surface that carries a radius token, at whatever the
 *  tokens resolve to on its wrapper. */
function Kit({ compact }: { compact: boolean }) {
  return (
    <div className="flex flex-col gap-4 p-4">
      {/* --radius: the sharp family. Card (xl 1.4x), Input (lg 1x), the plate. */}
      <Card size="sm">
        <CardHeader>
          <CardTitle>Summer wedding</CardTitle>
          <CardDescription>312 photos from 48 guests, 6 videos</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Input placeholder="Event name" defaultValue="Ana and Theo" />
          <div className="rounded-lg border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
            A plate: rounded-lg, the base at 1x.
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button>
              <Plus data-icon="inline-start" /> Add photos
            </Button>
            <Button variant="outline">Share</Button>
            <Button variant="ghost" size="icon" aria-label="Notifications">
              <Bell />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* --radius-action*: the action ladder, every size. */}
      <div className="flex flex-wrap items-end gap-2">
        <Button size="xs">h-6</Button>
        <Button size="sm">h-7</Button>
        <Button>h-8, action-sm</Button>
        <Button size="lg">h-9</Button>
        <button
          type="button"
          className="inline-flex h-10 items-center rounded-action bg-primary px-4 text-sm font-medium text-primary-foreground"
        >
          h-10, action
        </button>
        <button
          type="button"
          className="inline-flex h-12 items-center rounded-action-lg bg-primary px-5 text-sm font-medium text-primary-foreground"
        >
          h-12, action-lg
        </button>
      </div>

      {/* --radius-float: a floating layer, drawn static with the primitives'
          own classes (rounded-float + shadow-float). */}
      <div className="flex items-start gap-4">
        <div className="min-w-40 rounded-float border bg-popover p-1 text-sm shadow-float">
          {["Rename", "Duplicate", "Share link"].map((row) => (
            <div
              key={row}
              className="flex items-center justify-between rounded-md px-2 py-1.5 hover:bg-muted"
            >
              {row}
              {row === "Share link" && (
                <Copy className="size-3.5 text-muted-foreground" />
              )}
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-2">
          {/* rounded-4xl (2.6x) on the badge; rounded-md (0.8x) on a segmented thumb */}
          <Badge>
            <Check data-icon="inline-start" /> Live
          </Badge>
          <div className="inline-flex rounded-lg border bg-muted/40 p-0.5 text-xs">
            <span className="rounded-md bg-background px-2 py-1 shadow-sm">
              Live
            </span>
            <span className="px-2 py-1 text-muted-foreground">Review</span>
          </div>
        </div>
      </div>

      {/* --radius-tile with --gap-gallery pinned to it. */}
      <div
        className={cn(
          "grid gap-[var(--gap-gallery)]",
          compact ? "grid-cols-3" : "grid-cols-3",
        )}
      >
        {TILES.map((id) => {
          const img = marketingImage(id);
          return (
            <div
              key={id}
              className="relative aspect-square overflow-hidden rounded-[var(--radius-tile)] bg-muted"
            >
              <Image
                src={img.src}
                alt=""
                fill
                sizes="120px"
                className="object-cover"
              />
            </div>
          );
        })}
      </div>

      {/* The derived scale, so the 2xl trap is visible: 1.8x of a 16px base is 28.8px. */}
      <div className="flex items-end gap-2">
        {(
          [
            ["sm", "rounded-sm", "0.6x"],
            ["md", "rounded-md", "0.8x"],
            ["lg", "rounded-lg", "1x"],
            ["xl", "rounded-xl", "1.4x"],
            ["2xl", "rounded-2xl", "1.8x"],
            ["3xl", "rounded-3xl", "2.2x"],
            ["4xl", "rounded-4xl", "2.6x"],
          ] as const
        ).map(([name, cls, ratio]) => (
          <div key={name} className="flex flex-col items-center gap-1">
            <div className={cn("size-9 border bg-muted/60", cls)} />
            <span className="text-[9px] text-muted-foreground">
              {name} {ratio}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

const QUESTION =
  "The radius system at candidate values for every token on the surfaces that carry it, beside the tuner that drags the real pages: does the sharp-surface / round-action contrast survive, and at what values?";

export function RoundingBoard() {
  const [mode, setMode] = useState<Mode>("desktop");
  const [ground, setGround] = useState<Ground>("app-light");
  const [column, setColumn] = useState<Candidate["id"]>("live");
  const columns =
    mode === "phone" ? CANDIDATES.filter((c) => c.id === column) : CANDIDATES;

  return (
    <div className="flex flex-col gap-6 py-4">
      <p className="max-w-2xl text-xs leading-relaxed text-muted-foreground">
        {QUESTION} Three fixed candidates and one live column: the tuner in the
        corner writes the tokens on the page, and the live column and every real
        page (the home arc, the dashboard, /design/components) follow. Values
        survive Replay, navigation and a reload until Reset; Copy CSS gives the
        block to bake.
      </p>

      <div className="flex flex-wrap items-center gap-3">
        <Toggle
          ariaLabel="Viewport"
          options={[
            { id: "desktop" as Mode, label: "Desktop" },
            { id: "phone" as Mode, label: "Phone 375" },
          ]}
          value={mode}
          onChange={setMode}
        />
        <Toggle
          ariaLabel="Ground"
          options={[
            { id: "app-light" as Ground, label: "App, light" },
            { id: "app-dark" as Ground, label: "App, dark" },
            { id: "cinema" as Ground, label: "Cinema" },
          ]}
          value={ground}
          onChange={setGround}
        />
        {mode === "phone" && (
          <Toggle
            ariaLabel="Column"
            options={CANDIDATES.map((c) => ({ id: c.id, label: c.name }))}
            value={column}
            onChange={setColumn}
          />
        )}
      </div>

      <Variant
        n={1}
        name="The kit, four ways"
        rationale="One kit of every radius-bearing surface: a card with an input and its actions, the action ladder at every height, a floating layer, a badge and a segmented thumb, a tight-gap tile grid, and the derived scale."
        framed={false}
      >
        <Stage
          mode={mode}
          ground={ground}
          height={mode === "phone" ? 980 : 760}
        >
          <div
            className={cn(
              "grid h-full",
              mode === "phone"
                ? "grid-cols-1"
                : "grid-cols-4 divide-x divide-border",
            )}
          >
            {columns.map((c) => (
              <div key={c.id} style={overrideStyle(c)} className="min-w-0">
                <div className="border-b border-border px-4 py-3">
                  <p className="text-sm font-medium">{c.name}</p>
                  <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
                    {c.rationale}
                  </p>
                </div>
                <Kit compact={mode === "phone"} />
              </div>
            ))}
          </div>
        </Stage>
      </Variant>

      <BoardMeta
        question={QUESTION}
        candidates={CANDIDATES.filter((c) => c.values).map((c) => ({
          name: c.name,
          rationale: c.rationale,
        }))}
        asks={[
          "--radius, --radius-float, --radius-tile: the values (today 2 / 8 / 3)",
          "--radius-action, -lg, -sm: the values (today 16 / 19.2 / 12.8), and whether they move with the surfaces",
          "Whether float and tile move with the surfaces or stay put",
          "Whether the derived scale (sm 0.6x to 4xl 2.6x) survives a rounder base, or the steps get retuned",
        ]}
        departures={[
          "The Button's in-between sizes (h-6, h-7, h-9) carried literal radii, so the action knob moved only two of six sizes; the round derived them from --radius-action (button.tsx), no value changed at the defaults.",
        ]}
      />

      <MotionTuner controls={ROUNDING_TUNER_CONTROLS} />
    </div>
  );
}
