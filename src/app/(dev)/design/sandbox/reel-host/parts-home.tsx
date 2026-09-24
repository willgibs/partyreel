"use client";

import { type ReactNode, useState } from "react";
import {
  ChevronRight,
  Maximize,
  MonitorPlay,
  Palette,
  Play,
  Timer,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { GLASS } from "@/lib/glass";
import { cn } from "@/lib/utils";

import { DEFAULT_HOLD, DEFAULT_MOOD_ID, EVENT, MOODS } from "./fixtures";
import { AppBar } from "./parts-hub";
import type { Device } from "./parts-view";
import { EngineStill, useStills } from "./stills";

/**
 * THE REEL'S OWN PLACE FOR ITS HOST, FOR THE `home` ASK: a room or a sheet.
 *
 * ★ BOTH ARE THE PRODUCT'S EXISTING SHAPES, NEVER A NEW ONE. Review, Reel and
 * Guests are rooms (a route with a crumb) and Settings and Share are sheets over
 * the album (`host-app.md`), so the two alternatives to the view are exactly
 * those two shapes, filled with what a host does with a reel: watch it, put it
 * on a screen, set where guests start, and switch it off.
 *
 * ★ THE PLAYER IS THE REAL ENGINE'S FRAME AT REST, with the view's own slim bar
 * over it, because a room or a sheet shows the reel playing, never a poster of
 * it; Watch then opens the same full-screen view the guests have.
 *
 * ★ ONE CONTROLS CARD FOR BOTH, SO THE TWO ARE JUDGED ON THEIR SHAPE ALONE: the
 * mood and the hold as two quiet rows (the full swatch wall is the `style`
 * question's, not this one's), then Show the reel with its consequence.
 */

/** The view's slim bar, at rest over a frame: the one sign that it plays. */
function RestBar({ small }: { small?: boolean }) {
  return (
    <div
      aria-hidden
      className={cn(
        "absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full px-2.5 text-white/85",
        small ? "h-6 w-28" : "h-7 w-40",
        GLASS,
      )}
    >
      <Play className="size-3 fill-white/85" />
      <span className="h-0.5 flex-1 overflow-hidden rounded-full bg-white/25">
        <span className="block h-full w-2/5 rounded-full bg-white/80" />
      </span>
    </div>
  );
}

function Player({ small }: { small?: boolean }) {
  return (
    <div
      data-rh-home-player=""
      className="dark relative aspect-video overflow-hidden rounded-xl bg-black"
    >
      <EngineStill id="landscape" label="The reel, playing" />
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-20 bg-linear-to-t from-black/45 to-transparent"
      />
      <RestBar small={small} />
    </div>
  );
}

function PlayerVerbs() {
  return (
    <div className="flex flex-wrap gap-2">
      <Button size="sm" tabIndex={-1}>
        <Maximize /> Watch full screen
      </Button>
      <Button variant="outline" size="sm" tabIndex={-1}>
        <MonitorPlay /> Play on a screen
      </Button>
    </div>
  );
}

/** A quiet row: a label, what is set, and the chevron that opens its picker. */
function ValueRow({
  icon,
  label,
  value,
  swatch,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  swatch?: string;
}) {
  return (
    <div className="flex items-center gap-3 py-2.5">
      <span className="text-muted-foreground">{icon}</span>
      <span data-rh-home-row="" className="min-w-0 flex-1 text-sm font-medium">
        {label}
      </span>
      {swatch ? (
        // eslint-disable-next-line @next/next/no-img-element -- a data url the engine drew
        <img
          src={swatch}
          alt=""
          className="h-6 w-10 rounded-[var(--radius-tile)] object-cover"
        />
      ) : null}
      <span className="text-sm text-muted-foreground tabular-nums">
        {value}
      </span>
      <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
    </div>
  );
}

export function ReelControlsCard() {
  const stills = useStills();
  const [on, setOn] = useState(true);
  const mood = MOODS.find((m) => m.id === DEFAULT_MOOD_ID);
  return (
    <Card data-rh-home-controls="">
      <CardContent className="space-y-1">
        <p className="text-xs font-medium text-muted-foreground">
          Where every guest starts
        </p>
        <div className="divide-y divide-border/60">
          <ValueRow
            icon={<Palette className="size-4" aria-hidden />}
            label="Mood"
            value={mood?.label ?? "Cinematic"}
            swatch={stills[`mood-${DEFAULT_MOOD_ID}`]}
          />
          <ValueRow
            icon={<Timer className="size-4" aria-hidden />}
            label="Hold"
            value={`${DEFAULT_HOLD} s`}
          />
          <div className="flex items-start justify-between gap-4 pt-3">
            <Label
              htmlFor="rh-home-show-reel"
              className="min-w-0 flex-1 cursor-pointer flex-col items-start gap-1 font-normal"
            >
              <span
                data-rh-home-row=""
                className="text-sm font-medium text-foreground"
              >
                Show the reel
              </span>
              <span className="text-xs leading-relaxed text-muted-foreground">
                Off hides it everywhere: the album, the view and any screen.
              </span>
            </Label>
            <Switch
              id="rh-home-show-reel"
              checked={on}
              onCheckedChange={setOn}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/** `home=room`: the Reel room, a route with a crumb like Review and Guests. */
export function ReelRoom({ device }: { device: Device }) {
  const phone = device === "phone";
  return (
    <div data-rh-room="" className="min-h-full bg-background text-foreground">
      <AppBar device={device} trail={["Partyreel", EVENT.name, "Reel"]} />
      <div
        className={cn(phone ? "space-y-4 px-4 py-5" : "space-y-5 px-6 py-6")}
      >
        <h1 className="font-heading text-page">Reel</h1>
        <div
          className={cn(
            phone
              ? "space-y-4"
              : "grid grid-cols-[minmax(0,1fr)_360px] items-start gap-6",
          )}
        >
          <div className="space-y-3">
            <Player />
            <PlayerVerbs />
          </div>
          <ReelControlsCard />
        </div>
      </div>
    </div>
  );
}

/** `home=sheet`: the Reel sheet's body, over the album like Settings and Share. */
export function ReelSheetBody() {
  return (
    <div data-rh-reel-sheet="" className="flex flex-col gap-4">
      <div className="space-y-3">
        <Player small />
        <PlayerVerbs />
      </div>
      <ReelControlsCard />
    </div>
  );
}
