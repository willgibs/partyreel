"use client";

import { Check, ChevronDown, Clock3, RotateCcw } from "lucide-react";
import { type MouseEvent, type ReactNode, useId, useState } from "react";

import {
  footButton,
  RoomFoot,
  RoomGround,
  RoomHead,
  RoomPage,
} from "@/components/app/create-event-wizard/room";
import { GUEST_GHOST_FRAMES } from "@/components/guest/gallery-empty-state";
import { Button } from "@/components/ui/button";
import {
  ALBUM_STYLES,
  type AlbumStyle,
  STYLE_NAMES,
  styleLine,
} from "@/lib/disposable/album-style";
import { cn } from "@/lib/utils";

import { RollControl, type RollWay } from "./roll-control";

/**
 * CREATE, AS WIRED, WITH THE DISPOSABLE'S TWO ANSWERS UNDER ITS PICK:
 * production's room (`RoomGround`, `RoomHead`, `RoomPage`, `RoomFoot`, its
 * light the Aurora's own field), four hairlines (the name, the add step, the
 * look, the beat), and the add step's centre drawn the way create-wizard r3
 * recommends it (Settings' three cards), because this board asks nothing
 * about how the styles read: that is create-wizard's open question. What this
 * board draws is what stands under the Disposable pick once she has it, its
 * develop time (r3's row) and its roll (the option's control), and, for the
 * `mine` ask, where a party starts from.
 *
 * ★ NOTHING HERE REACHES A SESSION OR A SERVER, and every link in the room
 * (the close) is held, so a press in a frame never leaves the board.
 */

const QUESTION = "Pick your album's style";
const SUB = "Change it any time in Settings";
const OF = 4;

/** Holds every link in the room: a frame's press never navigates the lab. */
function Held({ children }: { children: ReactNode }) {
  const hold = (e: MouseEvent) => {
    if ((e.target as Element | null)?.closest?.("a")) e.preventDefault();
  };
  return (
    <div onClickCapture={hold} className="contents">
      {children}
    </div>
  );
}

const none = () => {};

/** A style's small picture, from the guest ghost pack Settings' cards draw from (no new asset). */
function StylePic({ style }: { style: AlbumStyle }) {
  return (
    <span aria-hidden className="cz-room-pic">
      {GUEST_GHOST_FRAMES.slice(0, 6).map((frame, i) => {
        const lit =
          style === "live"
            ? true
            : style === "approval"
              ? i % 3 !== 2
              : i === 4;
        return (
          <span
            key={frame.src}
            data-lit={style === "disposable" && lit ? "" : undefined}
          >
            {lit ? (
              // eslint-disable-next-line @next/next/no-img-element -- a ghost-pack still, the style's picture
              <img src={frame.src} alt="" />
            ) : null}
          </span>
        );
      })}
    </span>
  );
}

/** Where the values above came from, said as quietly as the values: "Your usual: noon, 12 shots each". */
export function Usual({ line }: { line: string }) {
  return (
    <p className="cz-usual" data-cz-usual="">
      <Check className="size-3.5 shrink-0" aria-hidden />
      {line}
    </p>
  );
}

/**
 * Where this party starts from, said over the styles (the `mine` ask's
 * `copy` and `remember`): its source, and the way back to Partyreel's own.
 */
export function StartsFrom({ label }: { label: string }) {
  const [fresh, setFresh] = useState(false);
  return (
    <p
      data-cz-starts={fresh ? "fresh" : "from"}
      className="mb-4 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-working text-muted-foreground"
    >
      <span>{fresh ? "Starting fresh" : label}</span>
      <button
        type="button"
        onClick={() => setFresh((f) => !f)}
        className="cz-pill"
      >
        <RotateCcw className="size-3" aria-hidden />
        {fresh ? "Undo" : "Start fresh"}
      </button>
    </p>
  );
}

/** The add step at rest in the wired room, the Disposable picked. */
export function AddStep({
  name,
  way,
  roll,
  develop,
  usual,
  startsFrom,
}: {
  /** The party's name, titling the room. */
  name: string;
  /** The roll's control, or none (a frame about something else). */
  way: RollWay | null;
  roll: number;
  /** The develop time as Create says it: "9 am tomorrow". */
  develop: string;
  /** The develop time and the roll came from her usual: the line that says so. */
  usual?: string;
  /** Where the party starts from, said over the styles. */
  startsFrom?: string;
}) {
  const questionId = useId();
  const [value, setValue] = useState(roll);
  const picked: AlbumStyle = "disposable";
  return (
    <Held>
      <RoomGround screen="add">
        <RoomHead
          step={{ at: 2, of: OF }}
          name={name}
          onBack={none}
          onStep={none}
          onName={none}
          close={{ href: "/dashboard", label: "Close" }}
        />
        <div
          data-room-body=""
          className="relative flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain"
        >
          <RoomPage question={QUESTION} questionId={questionId} sub={SUB}>
            {startsFrom ? <StartsFrom label={startsFrom} /> : null}
            <div
              role="radiogroup"
              aria-label="Album style"
              className="cz-room-cards"
            >
              {ALBUM_STYLES.map((s) => {
                const on = s === picked;
                return (
                  <div
                    key={s}
                    role="radio"
                    aria-checked={on}
                    data-cz-style={s}
                    data-state={on ? "on" : "off"}
                    className="cz-room-card"
                  >
                    <StylePic style={s} />
                    <span className="flex min-w-0 flex-1 items-center gap-3">
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
                          {styleLine(s, { rollSize: value })}
                        </span>
                      </span>
                      <span
                        aria-hidden
                        className={cn(
                          "flex size-5 shrink-0 items-center justify-center rounded-full border",
                          on
                            ? "border-foreground bg-foreground text-background"
                            : "border-foreground/35",
                        )}
                      >
                        {on ? (
                          <Check className="size-3" strokeWidth={3.25} />
                        ) : null}
                      </span>
                    </span>
                  </div>
                );
              })}
            </div>
            <div data-cz-under="" className="cz-room-under">
              <div className="cz-room-row" data-cz-develop={develop}>
                <Clock3
                  aria-hidden
                  className="size-4 shrink-0 text-muted-foreground"
                />
                <span className="cz-room-row-label text-working text-muted-foreground">
                  Develops
                </span>
                <span className="text-working font-medium">{develop}</span>
                <ChevronDown
                  aria-hidden
                  className="size-4 shrink-0 text-muted-foreground"
                />
              </div>
              {way ? (
                <>
                  <span aria-hidden className="cz-room-rule" />
                  <div className="space-y-2.5">
                    <p className="text-working text-muted-foreground">
                      Shots each
                    </p>
                    <RollControl way={way} value={value} onChange={setValue} />
                  </div>
                </>
              ) : null}
              {usual ? (
                <>
                  <span aria-hidden className="cz-room-rule" />
                  <Usual line={usual} />
                </>
              ) : null}
            </div>
          </RoomPage>
        </div>
        <RoomFoot>
          <Button
            type="button"
            size="cta"
            tabIndex={-1}
            className={footButton}
          >
            Continue
          </Button>
        </RoomFoot>
      </RoomGround>
    </Held>
  );
}

/**
 * CREATE'S FIRST SCREEN, ASKING WHERE A PARTY STARTS FROM (the `mine` ask's
 * `copy`): production's name at its size on its rule (`name-step.tsx`'s
 * look, quoted, since its field takes the keyboard's focus as it mounts),
 * and under it the two places a party can start: Partyreel's own, or like a
 * past party of hers.
 */
export function NameStepFrom({
  name,
  past,
  pastLine,
}: {
  name: string;
  past: string;
  pastLine: string;
}) {
  const questionId = useId();
  const [from, setFrom] = useState<"fresh" | "past">("past");
  const type = "font-heading text-chapter md:text-title";
  return (
    <Held>
      <RoomGround screen="name">
        <RoomHead
          step={{ at: 1, of: OF }}
          close={{ href: "/dashboard", label: "Close" }}
        />
        <div
          data-room-body=""
          className="relative flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain"
        >
          <RoomPage question="Name your event" questionId={questionId}>
            <div className="w-full max-w-[760px]">
              <div className="cr-name relative">
                <p
                  aria-labelledby={questionId}
                  className={cn(
                    "cr-name-field text-center whitespace-pre",
                    type,
                  )}
                >
                  {name}
                </p>
              </div>
              <span
                aria-hidden
                className="cr-name-rule mt-4 block h-0.5 w-full rounded-full md:mt-5"
              />
            </div>
            <div
              role="radiogroup"
              aria-label="Start from"
              className="cz-start"
              data-cz-start={from}
            >
              <p className="text-center text-working text-muted-foreground">
                Start from
              </p>
              {(
                [
                  {
                    id: "past",
                    label: `Like ${past}`,
                    line: pastLine,
                  },
                  {
                    id: "fresh",
                    label: "Fresh",
                    line: "Partyreel's own: Live, open to anyone with the link.",
                  },
                ] as const
              ).map((o) => {
                const on = from === o.id;
                return (
                  <button
                    key={o.id}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    data-state={on ? "on" : "off"}
                    onClick={() => setFrom(o.id)}
                    className="cz-start-card"
                  >
                    <span className="block min-w-0 flex-1">
                      <span className="block font-heading text-card-title">
                        {o.label}
                      </span>
                      <span className="mt-0.5 block text-caption text-pretty text-muted-foreground">
                        {o.line}
                      </span>
                    </span>
                    <span
                      aria-hidden
                      className={cn(
                        "flex size-5 shrink-0 items-center justify-center rounded-full border",
                        on
                          ? "border-foreground bg-foreground text-background"
                          : "border-foreground/35",
                      )}
                    >
                      {on ? <Check className="size-3" strokeWidth={3.25} /> : null}
                    </span>
                  </button>
                );
              })}
            </div>
          </RoomPage>
        </div>
        <RoomFoot>
          <Button
            type="button"
            size="cta"
            tabIndex={-1}
            className={footButton}
          >
            Continue
          </Button>
        </RoomFoot>
      </RoomGround>
    </Held>
  );
}
