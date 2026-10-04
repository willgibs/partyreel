"use client";

import { Fragment, useCallback, useEffect, useState } from "react";
import { preload } from "react-dom";
import { Check } from "lucide-react";
import { RadioGroup as RadioGroupPrimitive } from "radix-ui";

import {
  DEVELOPS_NOW_WITHIN_MS,
  judgeDevelopTime,
  TIME_HAS_PASSED,
  toLocalInput,
} from "@/components/app/event-settings/camera-settings-develop-time";
import {
  STYLE_PICTURE_SRCS,
  StylePicture,
  type StyleMoment,
} from "@/components/app/event-settings/camera-settings-style-picture";
import {
  ALBUM_STYLES,
  type AlbumStyle,
  createFieldsOf,
  patchForStyle,
  styleLine,
  STYLE_NAMES,
} from "@/lib/disposable/album-style";
import { cn } from "@/lib/utils";

import { DevelopRow } from "./develop-row";
import { Night } from "./night";

/**
 * THE ADD STEP: HOW THE ALBUM IS STYLED (create-wizard r3's add=styles, Will 2026-10-04: "Feels cleaner with more
 * focused views/less fighting for attention, and each option is explained clearly against each other without just
 * throwing screens at a new host ... the clear distinction across the 3. Really clear mental model"). The question is
 * the room's ("Pick your album's style"); the centre is three cards, Live, Review and Disposable, each a small album
 * moving through the night, its name, its one line and a tick, a soft light under the one picked; under the
 * Disposable card, once it is picked, its develop time; under them all the night, a slider that moves every picture
 * from guests arriving to the morning after.
 *
 * ★ A STYLE IS THE SETTINGS' ONE, NEVER A SECOND ONE: its names, its lines, its columns (`album-style.ts`), its
 * pictures (`camera-settings-style-picture.tsx`) and its develop time's judgement are Settings' own, so what a host
 * meets here is what she meets there, and Create asks the same three columns Settings writes (`createFieldsOf`).
 *
 * ★ THE DEVELOP TIME STANDS DIRECTLY UNDER ITS CARD, never under the night (his own placement): once Disposable is
 * picked a row of it opens in place under that card, so it is where the host's eye already is. Approval never stands
 * with it (`both=never`): no style here combines the two.
 *
 * ★ THE NIGHT PLAYS ONCE, as the step first opens (every album empty, then the party), and then rests on the party for
 * her hand; reduced motion opens on the party. Her own move of the slider stops it.
 *
 * ★ THE CHOICE IS A RADIO GROUP, as the code's looks are: a screen reader hears "one of three" and the arrows move
 * between the cards, choosing as they go (Radix's roving focus).
 *
 * The state is `useAddChoice`'s, held by the wizard so a Back and a Continue never lose it; the step itself is drawn.
 */

// ★ ASKED FOR BEFORE THE STEP, as the look's photograph is (`look-step.tsx`): this module loads with the page that
// holds the wizard, long before Continue mounts the step, so the six frames every album picture draws are fetched while
// she names the event and the pictures fill with the night, never after it.
if (typeof window !== "undefined") {
  for (const src of STYLE_PICTURE_SRCS) preload(src, { as: "image" });
}

/** How long the arriving album stands empty before the party fills it, when the night plays. */
const NIGHT_PLAYS_MS = 900;

/* ── what she has chosen ──────────────────────────────────────────────── */

export type AddChoice = {
  style: AlbumStyle;
  /** The develop time that will be sent while the style is Disposable (ISO), or null before one is offered. */
  developsAt: string | null;
  /** What the develop field holds, unfinished (`YYYY-MM-DDTHH:mm`, "" half filled), or null when it holds the time. */
  draft: string | null;
  /** Why what she finished is not a time. */
  refusal: string | null;
  /** A card is pressed: a Disposable keeps a time still ahead, else offers 9 am tomorrow (Create knows no date yet). */
  pick: (style: AlbumStyle) => void;
  /** The develop field changes: a draft, judged only when she has finished it. */
  type: (value: string) => void;
  /** She has left the field or pressed Return: the draft is judged. Whether it stands as a time. */
  finish: () => boolean;
  /** Before the step lets her on, and again at Create: whether what she chose can be made (a time may have passed). */
  confirm: () => boolean;
  /** The style as the create's fields: the one write a new event is born with. */
  fields: () => ReturnType<typeof createFieldsOf>;
};

/**
 * ★ A STYLE IS ONE CHOICE OF THREE COLUMNS (`patchForStyle`), held beside the unfinished draft of its develop time
 * (Settings' rule: a time she types is a draft the field shows and nothing sends, judged once when she has finished it).
 * A Create has no album yet, so the judgement is `judgeDevelopTime`'s with nothing waiting: a time not ahead is "has
 * passed", never Develop now.
 */
export function useAddChoice(): AddChoice {
  const [style, setStyle] = useState<AlbumStyle>("live");
  const [developsAt, setDevelopsAt] = useState<string | null>(null);
  const [draft, setDraft] = useState<string | null>(null);
  const [refusal, setRefusal] = useState<string | null>(null);

  const pick = useCallback((to: AlbumStyle) => {
    setStyle(to);
    // The field and its words go with the card that owns them.
    setDraft(null);
    setRefusal(null);
    if (to === "disposable") {
      setDevelopsAt(
        (at) =>
          patchForStyle(
            "disposable",
            { capture: "upload", review: false, developsAt: at },
            { eventDate: null },
          ).developsAt,
      );
    }
  }, []);

  const type = useCallback((value: string) => {
    // A new time is a new question: the old words go.
    setRefusal(null);
    setDraft(value);
  }, []);

  const finish = (): boolean => {
    if (draft === null) return true;
    const verdict = judgeDevelopTime({
      typed: draft,
      shown: developsAt ? toLocalInput(developsAt) : "",
      developsAt: null,
      nowMs: Date.now(),
    });
    if (verdict.kind === "refuse" || verdict.kind === "ask") {
      // The draft stays in the field, marked, until she types again.
      setRefusal(verdict.kind === "refuse" ? verdict.words : TIME_HAS_PASSED);
      return false;
    }
    setRefusal(null);
    setDraft(null);
    if (verdict.kind === "save") setDevelopsAt(verdict.iso);
    return true;
  };

  const confirm = (): boolean => {
    if (style !== "disposable") return true;
    if (draft !== null) return finish();
    // A time she picked and left may have passed while she stood on a later screen: an album born with a develop time
    // not ahead is stored as developed (the database's own now), which nobody asked for.
    if (
      !developsAt ||
      Date.parse(developsAt) < Date.now() + DEVELOPS_NOW_WITHIN_MS
    ) {
      setRefusal(TIME_HAS_PASSED);
      return false;
    }
    return true;
  };

  const fields = () =>
    createFieldsOf(
      patchForStyle(
        style,
        { capture: "upload", review: false, developsAt },
        { eventDate: null },
      ),
    );

  return {
    style,
    developsAt,
    draft,
    refusal,
    pick,
    type,
    finish,
    confirm,
    fields,
  };
}

/* ── the step ─────────────────────────────────────────────────────────── */

/** Settings' own mark: a filled round with its tick, or an empty ring. */
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
      {on && <Check className="size-3" strokeWidth={3.25} />}
    </span>
  );
}

function motionWelcome(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export function AddStep({
  choice,
  played,
  onPlayed,
}: {
  choice: AddChoice;
  /** Whether the night has played in this Create: it plays once, as the step first opens. */
  played: boolean;
  /** The night has played, or her hand has taken it. */
  onPlayed: () => void;
}) {
  const [moment, setMoment] = useState<StyleMoment>(() =>
    played || !motionWelcome() ? "party" : "arrive",
  );

  useEffect(() => {
    if (played) return;
    const t = window.setTimeout(() => {
      onPlayed();
      setMoment((m) => (m === "arrive" ? "party" : m));
    }, NIGHT_PLAYS_MS);
    // Her hand on the slider (it marks the night played) takes the timer with it.
    return () => window.clearTimeout(t);
  }, [played, onPlayed]);

  const onMoment = (m: StyleMoment) => {
    // Her hand is the night's now: nothing plays over it.
    onPlayed();
    setMoment(m);
  };

  return (
    <div data-add-step="" className="flex w-full flex-col items-center">
      <RadioGroupPrimitive.Root
        value={choice.style}
        onValueChange={(v) => choice.pick(v as AlbumStyle)}
        aria-label="Album style"
        loop
        className="cr-styles"
      >
        {ALBUM_STYLES.map((s) => {
          const on = s === choice.style;
          const line = styleLine(s, { rollSize: null });
          return (
            <Fragment key={s}>
              <RadioGroupPrimitive.Item
                value={s}
                data-album-style={s}
                aria-label={`${STYLE_NAMES[s]}. ${line}`}
                className="cr-style-card"
              >
                <span
                  // The pick drops into the add step's hairline as the look arrives (`carry.ts`).
                  data-carry-pick={on ? "2" : undefined}
                  className="cr-style-pic-box"
                >
                  <StylePicture
                    style={s}
                    moment={moment}
                    className="cr-style-pic"
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
              {s === "disposable" ? (
                // Directly under its card, wherever the cards stand.
                <DevelopRow
                  open={on}
                  developsAt={choice.developsAt}
                  draft={choice.draft}
                  refusal={choice.refusal}
                  onDraft={choice.type}
                  onFinish={() => void choice.finish()}
                />
              ) : null}
            </Fragment>
          );
        })}
      </RadioGroupPrimitive.Root>
      <Night moment={moment} onMoment={onMoment} className="cr-under" />
    </div>
  );
}
