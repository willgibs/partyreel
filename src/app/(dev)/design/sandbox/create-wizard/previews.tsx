"use client";

import { useEffect, useRef, useState } from "react";
import { Check } from "lucide-react";
import { RadioGroup as RadioGroupPrimitive } from "radix-ui";

import {
  AddStep,
  type AddChoice,
} from "@/components/app/create-event-wizard/add-step";
import { MOMENT_WORDS } from "@/components/app/create-event-wizard/night";
import {
  ALBUM_STYLES,
  type AlbumStyle,
  styleLine,
  STYLE_NAMES,
} from "@/lib/disposable/album-style";
import { cn } from "@/lib/utils";

import {
  BoardPicture,
  type Moment,
  ONE_PACE,
  OPEN_PACE,
  pinned,
  usePlay,
} from "./pictures";

/**
 * THE ALBUM STYLE STEP'S FOUR ANSWERS (round five's `previews`), each in production's room under its question
 * ("Pick your album's style"), its state the wizard's (`useAddChoice`), Disposable's own screen after it as built:
 *
 *  - `built`: production's `AddStep`, untouched: three cards moving through three moments together, the slider under.
 *  - `one`: the same three cards resting on the moment they differ (`pictures.tsx`'s rest); only the picked card plays
 *    its story, once, its moment named on it, then rests. Will's own idea: "one can play the live visual demo of the
 *    active selection, while the others stay still until selected to preview themselves". No slider.
 *  - `open`: three rows of words; the picked row opens on its album, large, playing its story once, the moments named
 *    under it; the others stay words until picked. No slider.
 *  - `still`: the three cards on their rest, nothing playing: one look, and the words carry the when. No slider.
 *
 * ★ THE PLAY WAITS FOR A PICK TO STAND (280ms), so arrows walking the radio group play nothing on the cards they pass;
 * a press on the picked card plays it again. As the step first opens the picked card (Live, as production opens) plays
 * once, as production's night plays once (`played`).
 */

export type PreviewsWay = "built" | "one" | "open" | "still";

/** A pick stands this long before its story starts. */
const STANDS_MS = 280;

/** Settings' own mark, as `add-step.tsx` draws it (local there): a filled round with its tick, or an empty ring. */
function Mark({ on }: { on: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex size-5 shrink-0 items-center justify-center rounded-full border transition-colors duration-150",
        on
          ? "border-foreground bg-foreground text-background"
          : "border-foreground/35",
      )}
    >
      {on && <Check data-check-pop className="size-3" strokeWidth={3.25} />}
    </span>
  );
}

/** Which card's story runs, and its count: a new count plays it again from the start. */
type Run = { style: AlbumStyle; n: number } | null;

/** The count a card plays on: its own run's, or null (its rest) while another card's runs. */
const runOf = (run: Run, style: AlbumStyle): number | null =>
  run && run.style === style ? run.n : null;

/**
 * WHICH CARD PLAYS, AND HOW MANY TIMES IT HAS BEEN ASKED: the picked style's run, started when a pick has stood its
 * moment, on a second press, and once as the step opens; null while nothing should play. The run names its card, so
 * the card just picked never plays a frame of the run that was the last card's.
 */
function useRuns(
  style: AlbumStyle,
  played: boolean,
  onPlayed: () => void,
  plays: boolean,
) {
  // As the step first opens in this Create, the picked card plays once (production's night plays once).
  const [run, setRun] = useState<Run>(() =>
    plays && !played ? { style, n: 1 } : null,
  );
  const opened = useRef(false);
  const timer = useRef<number | null>(null);
  useEffect(() => {
    if (opened.current) return;
    opened.current = true;
    if (plays && !played) onPlayed();
  }, [plays, played, onPlayed]);

  // A pick that stands its moment plays; arrows passing over a card play nothing.
  const first = useRef(true);
  useEffect(() => {
    if (!plays) return;
    if (first.current) {
      first.current = false;
      return;
    }
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      timer.current = null;
      setRun((r) => ({ style, n: (r?.n ?? 0) + 1 }));
    }, STANDS_MS);
    return () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    };
  }, [style, plays]);

  return {
    run,
    again: () => setRun((r) => ({ style, n: (r?.n ?? 0) + 1 })),
  };
}

export function PreviewsCentre({
  way,
  choice,
  played,
  onPlayed,
  pin,
}: {
  way: PreviewsWay;
  choice: AddChoice;
  played: boolean;
  onPlayed: () => void;
  /** A moment of the picked card's story drawn still, for a frame a reader reads at rest. */
  pin?: Moment;
}) {
  if (way === "built")
    return (
      <div data-cw-previews="built" className="contents">
        <AddStep choice={choice} played={played} onPlayed={onPlayed} />
      </div>
    );
  if (way === "open")
    return (
      <OpenRows
        choice={choice}
        played={played}
        onPlayed={onPlayed}
        pin={pin}
      />
    );
  return (
    <StillCards
      way={way}
      choice={choice}
      played={played}
      onPlayed={onPlayed}
      pin={pin}
    />
  );
}

/** One card's picture: its story while it is the one playing, else its rest (or a pinned moment). */
function CardPicture({
  style,
  playing,
  run,
  roll,
  pin,
  word,
  pace,
  className,
}: {
  style: AlbumStyle;
  playing: boolean;
  run: number | null;
  roll: number;
  pin?: Moment;
  word: boolean;
  pace: typeof ONE_PACE;
  className?: string;
}) {
  const live = usePlay(style, playing && !pin ? run : null, pace);
  const shown = playing && pin ? pinned(style, pin) : live;
  return (
    <BoardPicture
      style={style}
      shown={shown}
      roll={roll}
      word={word}
      className={className}
    />
  );
}

/**
 * `one` AND `still`: production's three cards (`cr-styles`, `cr-style-card`, the pick's light and Settings' mark), each
 * picture its rest; under `one` the picked card plays its story once, its moment named on it.
 */
function StillCards({
  way,
  choice,
  played,
  onPlayed,
  pin,
}: {
  way: "one" | "still";
  choice: AddChoice;
  played: boolean;
  onPlayed: () => void;
  pin?: Moment;
}) {
  const plays = way === "one";
  const { run, again } = useRuns(choice.style, played, onPlayed, plays);
  return (
    <div
      data-add-step=""
      data-cw-previews={way}
      className="flex w-full flex-col items-center"
    >
      <RadioGroupPrimitive.Root
        value={choice.style}
        onValueChange={(v) => choice.pick(v as AlbumStyle)}
        aria-label="Album style"
        loop
        className="cr-styles"
      >
        {ALBUM_STYLES.map((s) => {
          const on = s === choice.style;
          const line = styleLine(s, { rollSize: choice.roll });
          return (
            <RadioGroupPrimitive.Item
              key={s}
              value={s}
              data-album-style={s}
              aria-label={`${STYLE_NAMES[s]}. ${line}`}
              onClick={() => {
                // A press on the card already picked plays its story again.
                if (plays && on) again();
              }}
              className="cr-style-card"
            >
              <span
                data-carry-pick={on ? "2" : undefined}
                className="cr-style-pic-box"
              >
                <CardPicture
                  style={s}
                  playing={plays && on}
                  run={runOf(run, s)}
                  roll={choice.roll}
                  pin={pin}
                  word={plays}
                  pace={ONE_PACE}
                  className="cr-style-pic cw-pic-tall"
                />
              </span>
              <span className="cr-style-words">
                <span className="block min-w-0 flex-1">
                  <span
                    className={cn(
                      "block font-heading text-card-title",
                      !on && "text-foreground/85",
                    )}
                  >
                    {STYLE_NAMES[s]}
                  </span>
                  <span className="mt-0.5 block text-caption text-pretty text-muted-foreground">
                    {line}
                  </span>
                </span>
                <Mark on={on} />
              </span>
            </RadioGroupPrimitive.Item>
          );
        })}
      </RadioGroupPrimitive.Root>
    </div>
  );
}

/**
 * `open`: the three as rows of words, production's card material; the picked row opens on its album, large, playing
 * its story once, the three moments under it its stops (a press stands the open album on that moment, as the slider's
 * words do for production's three, here for the one album open); the others stay words until picked. One row is open
 * at a time, so the group's height holds while the rows between its edges slide (`cw-open-*` in the sheet).
 *
 * ★ THE CARD IS A WRAPPER, THE RADIO ITS WORDS: the stops are buttons of their own, which a radio (itself a button) may
 * never hold, so each row is the card's ground with its radio (the words) and its panel inside it, the pick's state
 * mirrored onto the card for production's edge and light.
 */
function OpenRows({
  choice,
  played,
  onPlayed,
  pin,
}: {
  choice: AddChoice;
  played: boolean;
  onPlayed: () => void;
  pin?: Moment;
}) {
  const { run, again } = useRuns(choice.style, played, onPlayed, true);
  return (
    <div data-add-step="" data-cw-previews="open" className="cw-open">
      <RadioGroupPrimitive.Root
        value={choice.style}
        onValueChange={(v) => choice.pick(v as AlbumStyle)}
        aria-label="Album style"
        loop
        className="cr-styles cw-open-group"
      >
        {ALBUM_STYLES.map((s) => {
          const on = s === choice.style;
          const line = styleLine(s, { rollSize: choice.roll });
          return (
            <div
              key={s}
              data-state={on ? "checked" : "unchecked"}
              className="cr-style-card cw-open-card"
            >
              <RadioGroupPrimitive.Item
                value={s}
                data-album-style={s}
                aria-label={`${STYLE_NAMES[s]}. ${line}`}
                onClick={() => {
                  if (on) again();
                }}
                className="cw-open-words"
              >
                <span className="block min-w-0 flex-1 text-left">
                  <span
                    className={cn(
                      "block font-heading text-card-title",
                      !on && "text-foreground/85",
                    )}
                  >
                    {STYLE_NAMES[s]}
                  </span>
                  <span className="mt-0.5 block text-caption text-pretty text-muted-foreground">
                    {line}
                  </span>
                </span>
                <Mark on={on} />
              </RadioGroupPrimitive.Item>
              <div
                data-open={on ? "" : undefined}
                inert={!on}
                className="cw-open-panel"
              >
                <div className="cw-open-inner">
                  <OpenPicture
                    style={s}
                    on={on}
                    run={runOf(run, s)}
                    roll={choice.roll}
                    pin={pin}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </RadioGroupPrimitive.Root>
    </div>
  );
}

const MOMENTS: readonly Moment[] = ["arrive", "party", "morning"];

/**
 * The open row's album and its three stops under it, the one it stands in lit. A stop pressed stands the album there
 * until the story plays again (a pick, a press of the row).
 */
function OpenPicture({
  style,
  on,
  run,
  roll,
  pin,
}: {
  style: AlbumStyle;
  on: boolean;
  run: number | null;
  roll: number;
  pin?: Moment;
}) {
  // A stop belongs to the run it was pressed in: the next run (a pick, a replay) plays the story again.
  const [stop, setStop] = useState<{ run: number | null; at: Moment } | null>(
    null,
  );
  const held = on ? (pin ?? (stop && stop.run === run ? stop.at : null)) : null;
  const live = usePlay(style, on && !held ? run : null, OPEN_PACE);
  const shown = held ? pinned(style, held) : live;
  // At rest the album stands on the party, the moment it is drawn on.
  const at = shown.moment ?? "party";
  return (
    <>
      <span data-carry-pick={on ? "2" : undefined} className="block">
        <BoardPicture
          style={style}
          shown={shown}
          roll={roll}
          className="cw-open-pic"
        />
      </span>
      <span
        role="group"
        aria-label="Its moments"
        className="cw-open-moments mt-1 grid grid-cols-3 text-caption"
      >
        {MOMENTS.map((m, k) => (
          <button
            key={m}
            type="button"
            aria-pressed={m === at}
            data-on={m === at ? "" : undefined}
            onClick={() => setStop({ run, at: m })}
            className={cn(
              "cw-open-moment min-h-9 cursor-pointer rounded-md px-0.5 outline-none focus-halo",
              k === 0 ? "text-left" : k === 1 ? "text-center" : "text-right",
            )}
          >
            {MOMENT_WORDS[m]}
          </button>
        ))}
      </span>
    </>
  );
}
