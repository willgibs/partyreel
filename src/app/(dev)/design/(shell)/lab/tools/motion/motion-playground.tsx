"use client";

import { type CSSProperties, useState } from "react";
import { Check, RotateCcw } from "lucide-react";

import { MotionTuner } from "@/components/dev/motion-tuner";
import {
  EVENT_PAGE_TUNER_CONTROLS,
  ROUNDING_TUNER_CONTROLS,
} from "@/components/dev/motion-tuner-config";
import { Button } from "@/components/ui/button";
import { readCssMs as readMs } from "@/lib/shared/read-css-ms";

// readMs (read-css-ms.ts) reads a --tune-* var as ms the same way the review triage's run() does
// (use-review-triage.ts), so the JS-timed replays (the exit reset + the beat hold) match the tuner
// (and survive the build minifier rewriting `2500ms` → `2.5s`).

// Hoisted, never rebuilt per render: the tuner's apply effect keys on this
// array's identity (a per-render literal was what made a Replay wipe every
// tuned value before the store existed; the store fixed the root, this keeps
// the effect quiet).
const PLAYGROUND_CONTROLS = [
  ...EVENT_PAGE_TUNER_CONTROLS,
  ...ROUNDING_TUNER_CONTROLS,
];

const CASCADE = Array.from({ length: 12 }, (_, i) => i);
const EXIT = Array.from({ length: 6 }, (_, i) => i);

function DummyTile({ i }: { i: number }) {
  return (
    <div
      data-review-tile
      style={{ "--tile-i": i } as CSSProperties}
      className="aspect-square rounded-[var(--radius-tile)] bg-gradient-to-br from-muted to-muted-foreground/20"
    />
  );
}

function Section({
  title,
  hint,
  onReplay,
  children,
}: {
  title: string;
  hint: string;
  onReplay: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-medium">{title}</h2>
          <p className="text-xs text-muted-foreground">{hint}</p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={onReplay}>
          <RotateCcw /> Replay
        </Button>
      </div>
      {children}
    </section>
  );
}

/**
 * The motion playground: replayable DUMMY animations wired to the exact globals.css
 * hooks, driven by the S4·0 MotionTuner. Each "Replay" remounts the animated element
 * (a changing `key`) so the @starting-style entrance re-fires; the removal exit + the
 * all-caught-up beat are JS-timed and read the same `--tune-*` vars the tuner writes.
 */
export function MotionPlayground() {
  const [routeKey, setRouteKey] = useState(0);
  const [cascadeKey, setCascadeKey] = useState(0);
  const [exitGen, setExitGen] = useState(0);
  const [exiting, setExiting] = useState(false);
  const [beatKey, setBeatKey] = useState(0);
  const [beatOn, setBeatOn] = useState(false);

  function playExit() {
    if (exiting) return;
    setExiting(true);
    // After the (tunable) exit duration, drop data-exiting + remount so the tiles
    // cascade back in, ready to replay.
    window.setTimeout(
      () => {
        setExiting(false);
        setExitGen((g) => g + 1);
      },
      readMs("--tune-review-exit-ms", 150) + 250,
    );
  }

  function playBeat() {
    setBeatKey((k) => k + 1);
    setBeatOn(true);
    window.setTimeout(
      () => setBeatOn(false),
      readMs("--tune-review-beat-ms", 2500),
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-10 px-6 py-10">
      <header>
        <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
          The lab
        </p>
        <h1 data-dir-display className="mt-1 text-3xl tracking-tight">
          Motion tuner
        </h1>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">
          Tune the timings with the panel, hit Replay to feel each animation,
          then Copy CSS and bake the value as the globals.css default. These are
          dummies wired to the real motion hooks, so what you tune here is what
          ships. Every knob on the panel has a specimen here or on the rounding
          board; the tuned values survive Replay, navigation and a reload until
          you Reset.
        </p>
      </header>

      <Section
        title="Route crossfade"
        hint="The whole-page beat between the event page and /settings."
        onReplay={() => setRouteKey((k) => k + 1)}
      >
        <div
          key={routeKey}
          data-route-fade
          className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground"
        >
          A route arrived.
        </div>
      </Section>

      <Section
        title="Review tile cascade"
        hint="The pending grid settling in when the review takeover opens."
        onReplay={() => setCascadeKey((k) => k + 1)}
      >
        <div key={cascadeKey} className="grid grid-cols-6 gap-2">
          {CASCADE.map((i) => (
            <DummyTile key={i} i={i} />
          ))}
        </div>
      </Section>

      <Section
        title="Removal exit"
        hint="Acted tiles fading + scaling out before the list reflows."
        onReplay={playExit}
      >
        <div className="grid grid-cols-6 gap-2">
          {EXIT.map((i) => (
            <div
              key={`${exitGen}-${i}`}
              data-review-tile
              data-exiting={exiting ? "" : undefined}
              style={{ "--tile-i": i } as CSSProperties}
              className="aspect-square rounded-[var(--radius-tile)] bg-gradient-to-br from-muted to-muted-foreground/20"
            />
          ))}
        </div>
      </Section>

      <Section
        title="All caught up beat"
        hint="The success beat when the last pending clears (its hold is the beat var)."
        onReplay={playBeat}
      >
        <div className="flex h-44 items-center justify-center rounded-lg border border-border bg-card">
          {beatOn ? (
            <div
              key={beatKey}
              data-unlock-success
              className="flex flex-col items-center gap-3 text-center"
            >
              <span className="flex size-16 items-center justify-center rounded-full bg-success text-success-foreground">
                <Check className="size-8" />
              </span>
              <p className="font-heading text-xl">All caught up</p>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              Replay to play the beat.
            </p>
          )}
        </div>
      </Section>

      {/* The rounding knobs ride along (the radius round's sitting, 2026-09-11):
          the values land on <html>, so /design/lab/rounding, /design/library/components and
          /design/compositions show the app's own surfaces at the dragged radii
          after a soft navigation, and the store carries them across a reload. */}
      <MotionTuner controls={PLAYGROUND_CONTROLS} />
    </div>
  );
}
