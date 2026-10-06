"use client";

import { useEffect, useId, useState } from "react";
import { Check } from "lucide-react";
import { RadioGroup as RadioGroupPrimitive } from "radix-ui";

import {
  AddStep,
  type AddChoice,
} from "@/components/app/create-event-wizard/add-step";
import { DevelopRow } from "@/components/app/create-event-wizard/develop-row";
import { Night } from "@/components/app/create-event-wizard/night";
import {
  StylePicture,
  type StyleMoment,
} from "@/components/app/event-settings/camera-settings-style-picture";
import { RollControl } from "@/components/app/event-settings/roll-control";
import {
  ALBUM_STYLES,
  type AlbumStyle,
  styleLine,
  STYLE_NAMES,
} from "@/lib/disposable/album-style";
import { cn } from "@/lib/utils";

/**
 * THE ALBUM STYLE STEP'S THREE ANSWERS, each composed from production's own
 * atoms (the style pictures, the night, the develop row, the roll control,
 * Settings' names and lines), so what differs between them is the
 * arrangement alone:
 *
 *  - `built`: production's `AddStep` itself, untouched.
 *  - `focused`: production's `AddStep` with nothing opening under the
 *    Disposable card (the board's sheet shuts its slot), and the develop time
 *    and roll on a screen of their own after it (`DevelopScreen`), his second
 *    placement: "on a focused following screen".
 *  - `quiet`: one large picture of the style picked, Settings' three as plain
 *    rows under it, the time opening inside the Disposable row: his "less
 *    fighting for attention" taken as far as it goes.
 */

export type StylesWay = "built" | "focused" | "quiet";

/**
 * Settings' own mark, as `add-step.tsx` draws it (a filled round with its
 * tick, or an empty ring). Local there, so retyped here; the wiring of a
 * pick that keeps it imports the one.
 */
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

/** The Disposable's roll, Settings' own control under its name, as the add step lays it. */
function RollField({
  roll,
  onRoll,
  className,
}: {
  roll: number;
  onRoll: (n: number) => void;
  className?: string;
}) {
  const labelId = useId();
  return (
    <div data-roll-field="" className={cn("space-y-2.5", className)}>
      <p id={labelId} className="px-1 text-working text-muted-foreground">
        Shots each
      </p>
      <RollControl value={roll} onChange={onRoll} labelledBy={labelId} />
    </div>
  );
}

function motionWelcome(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/** The night plays once as a step opens (arriving, then the party), as production's does; reduced motion opens on the party. */
function useNight(played: boolean, onPlayed: () => void) {
  const [moment, setMoment] = useState<StyleMoment>(() =>
    played || !motionWelcome() ? "party" : "arrive",
  );
  useEffect(() => {
    if (played) return;
    const t = window.setTimeout(() => {
      onPlayed();
      setMoment((m) => (m === "arrive" ? "party" : m));
    }, 900);
    return () => window.clearTimeout(t);
  }, [played, onPlayed]);
  return [
    moment,
    (m: StyleMoment) => {
      onPlayed();
      setMoment(m);
    },
  ] as const;
}

/** The step's centre in the way asked, its state the wizard's (`useAddChoice`). */
export function StylesCentre({
  way,
  choice,
  played,
  onPlayed,
}: {
  way: StylesWay;
  choice: AddChoice;
  played: boolean;
  onPlayed: () => void;
}) {
  if (way === "quiet")
    return <QuietStyles choice={choice} played={played} onPlayed={onPlayed} />;
  return (
    <div data-cw-styles={way} className="contents">
      <AddStep choice={choice} played={played} onPlayed={onPlayed} />
    </div>
  );
}

/**
 * ONE PICTURE, THREE PLAIN ROWS: the album of the style picked, as large as
 * the room leaves, moving through the night under it; then Settings' three
 * as rows of words, each its name, its line and Settings' mark; Disposable's
 * row opens its develop time and roll in place, production's own row.
 */
function QuietStyles({
  choice,
  played,
  onPlayed,
}: {
  choice: AddChoice;
  played: boolean;
  onPlayed: () => void;
}) {
  const [moment, onMoment] = useNight(played, onPlayed);
  return (
    <div data-cw-styles="quiet" className="cw-quiet">
      <div className="cw-quiet-show">
        <span data-carry-pick="2" className="block">
          <StylePicture
            style={choice.style}
            moment={moment}
            roll={choice.roll}
            className="cw-quiet-pic"
          />
        </span>
        <Night moment={moment} onMoment={onMoment} className="mt-2" />
      </div>
      <RadioGroupPrimitive.Root
        value={choice.style}
        onValueChange={(v) => choice.pick(v as AlbumStyle)}
        aria-label="Album style"
        loop
        className="cw-quiet-rows"
      >
        {ALBUM_STYLES.map((s) => {
          const on = s === choice.style;
          const line = styleLine(s, { rollSize: choice.roll });
          return (
            <div key={s} className="cw-quiet-row" data-on={on ? "" : undefined}>
              <RadioGroupPrimitive.Item
                value={s}
                data-album-style={s}
                aria-label={`${STYLE_NAMES[s]}. ${line}`}
                className="cw-quiet-item"
              >
                <span className="block min-w-0 flex-1 text-left">
                  <span
                    className={cn(
                      "block font-heading text-card-title",
                      !on && "text-foreground/80",
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
              {s === "disposable" ? (
                <DevelopRow
                  open={on}
                  developsAt={choice.developsAt}
                  draft={choice.draft}
                  refusal={choice.refusal}
                  onDraft={choice.type}
                  onFinish={() => void choice.finish()}
                  className="cw-quiet-develop"
                  after={
                    <RollField
                      roll={choice.roll}
                      onRoll={choice.setRoll}
                      className="mt-4"
                    />
                  }
                />
              ) : null}
            </div>
          );
        })}
      </RadioGroupPrimitive.Root>
    </div>
  );
}

/** The focused screen's question and its quiet line. */
export const DEVELOP_QUESTION = "When do the photos develop?";
export const DEVELOP_SUB = "Everyone's open at once";

/**
 * THE DEVELOP TIME'S OWN SCREEN (`focused`): the Disposable's album on the
 * morning it develops, then production's develop row, open, and the roll
 * under it, alone on a screen. It is a step only while Disposable is picked.
 */
export function DevelopScreen({ choice }: { choice: AddChoice }) {
  return (
    <div data-cw-develop-screen="" className="cw-focus">
      <StylePicture
        style="disposable"
        moment="morning"
        roll={choice.roll}
        className="cw-focus-pic"
      />
      <DevelopRow
        open
        developsAt={choice.developsAt}
        draft={choice.draft}
        refusal={choice.refusal}
        onDraft={choice.type}
        onFinish={() => void choice.finish()}
        className="cw-focus-row"
        after={
          <RollField
            roll={choice.roll}
            onRoll={choice.setRoll}
            className="mt-6"
          />
        }
      />
    </div>
  );
}
