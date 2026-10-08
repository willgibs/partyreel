"use client";

import { useCallback, useState } from "react";
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
  StylePictureFrame,
} from "@/components/app/event-settings/camera-settings-style-picture";
import {
  ALBUM_STYLES,
  type AlbumStyle,
  createFieldsOf,
  patchForStyle,
  styleLine,
  STYLE_NAMES,
} from "@/lib/disposable/album-style";
import { ROLL_SHOTS } from "@/lib/disposable/roll";
import { deviceZone, hostPartyZone } from "@/lib/event/zone";
import { cn } from "@/lib/utils";

import { runOf, useStory, useStoryRuns } from "./style-story";

/**
 * THE ADD STEP: HOW THE ALBUM IS STYLED (create-wizard r3's add=styles, Will 2026-10-04: "Feels cleaner with more
 * focused views/less fighting for attention, and each option is explained clearly against each other without just
 * throwing screens at a new host ... the clear distinction across the 3. Really clear mental model"). The question is
 * the room's ("Pick your album's style"); the centre is three cards, Live, Review and Disposable, each a small album,
 * its name, its one line and a tick.
 *
 * ★ THE PICKED ONE PLAYS, THE OTHERS STILL (r5's `previews=one`, Will 2026-10-07): the three cards rest on the one
 * moment they differ (all in, all but the newest, only hers), so one look tells them apart; only the picked card plays
 * its story once (arriving, the party, next morning), its moment named on it where it has the room, then rests
 * (`style-story.ts`). No slider: nine pictures to hold in mind, three moving at once, went with it.
 *
 * ★ NOTHING OPENS UNDER THE CARDS (r4's `styles=focused`): picking Disposable adds its own screen after this one, the
 * develop time and the roll (`develop-step.tsx`), rather than a row opening under its card.
 *
 * ★ A STYLE IS THE SETTINGS' ONE, NEVER A SECOND ONE: its names, its lines, its columns (`album-style.ts`), its
 * pictures (`camera-settings-style-picture.tsx`) and its develop time's judgement are Settings' own, so what a host
 * meets here is what she meets there, and Create asks the same three columns Settings writes (`createFieldsOf`).
 * Approval never stands with a develop time (`both=never`): no style here combines the two.
 *
 * ★ THE PARTY'S ZONE IS HERS, CAPTURED AND NEVER ASKED (event-zone): the create carries her browser's own zone
 * (`fields`' `captured_zone`), the party's from birth, and the 9 am the Disposable offers is read in that same zone
 * (`patchForStyle`'s `zone`), so the default develop is one morning for every guest. Create never asks a zone: a party
 * far from home is Settings' quiet choice.
 *
 * ★ THE ROLL (customize r1's `roll=both`): 24 unless she picks, on the Disposable's own screen; her pick is kept while
 * she moves between the styles, and rides the create only with the Disposable (`createFieldsOf`). The card's line and
 * its arriving camera say her count.
 *
 * ★ THE STORY PLAYS ONCE AS THE STEP FIRST OPENS, on the picked card (Live, as Create opens), and again when a pick has
 * stood its moment or the picked card is pressed; reduced motion plays nothing, the rest complete.
 *
 * ★ THE CHOICE IS A RADIO GROUP, as the code's looks are: a screen reader hears "one of three" and the arrows move
 * between the cards, choosing as they go (Radix's roving focus).
 *
 * The state is `useAddChoice`'s, held by the wizard so a Back and a Continue never lose it, and shared with the
 * Disposable's screen; the step itself is drawn.
 */

// ★ ASKED FOR BEFORE THE STEP, as the look's photograph is (`look-step.tsx`): this module loads with the page that
// holds the wizard, long before Continue mounts the step, so the six frames every album picture draws are fetched while
// she names the event and the pictures stand whole as the step opens, never after it.
if (typeof window !== "undefined") {
  for (const src of STYLE_PICTURE_SRCS) preload(src, { as: "image" });
}

/* ── what she has chosen ──────────────────────────────────────────────── */

export type AddChoice = {
  style: AlbumStyle;
  /** The develop time that will be sent while the style is Disposable (ISO), or null before one is offered. */
  developsAt: string | null;
  /** What the develop field holds, unfinished (`YYYY-MM-DDTHH:mm`, "" half filled), or null when it holds the time. */
  draft: string | null;
  /** Shots on each guest's roll, sent with a Disposable (24 unless she picks). */
  roll: number;
  /** A box picked or the stepper moved: the roll she will create with. */
  setRoll: (n: number) => void;
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
  /** The style as the create's fields, and her own zone (the party's from birth): the one write a new event is born with. */
  fields: () => ReturnType<typeof createFieldsOf> & { captured_zone?: string };
};

/**
 * ★ A STYLE IS ONE CHOICE OF THREE COLUMNS (`patchForStyle`), held beside the unfinished draft of its develop time
 * (Settings' rule: a time she types is a draft the field shows and nothing sends, judged once when she has finished it).
 * A Create has no album yet, so the judgement is `judgeDevelopTime`'s with nothing waiting: a time not ahead is "has
 * passed", never Develop now.
 */
export function useAddChoice(
  /**
   * The style Create opens on: Live, as most hosts want, or an album's own (Create's like-entry, `?like=`), its roll
   * with it. A Disposable is offered its own 9 am tomorrow, never the album's develop time: the time is hers.
   */
  initial: { style: AlbumStyle; roll?: number | null } = { style: "live" },
): AddChoice {
  const [style, setStyle] = useState<AlbumStyle>(initial.style);
  const [developsAt, setDevelopsAt] = useState<string | null>(() =>
    initial.style === "disposable"
      ? patchForStyle(
          "disposable",
          { capture: "upload", review: false, developsAt: null },
          { eventDate: null, zone: hostPartyZone(null) },
        ).developsAt
      : null,
  );
  const [draft, setDraft] = useState<string | null>(null);
  const [refusal, setRefusal] = useState<string | null>(null);
  const [roll, setRoll] = useState(initial.roll ?? ROLL_SHOTS);

  const pick = useCallback((to: AlbumStyle) => {
    setStyle(to);
    // The field and its words go with the card that owns them.
    setDraft(null);
    setRefusal(null);
    if (to === "disposable") {
      // A time still ahead is kept, else 9 am tomorrow in the zone the create will carry (`hostPartyZone`).
      setDevelopsAt(
        (at) =>
          patchForStyle(
            "disposable",
            { capture: "upload", review: false, developsAt: at },
            { eventDate: null, zone: hostPartyZone(null) },
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

  const fields = () => {
    const zone = deviceZone();
    return {
      ...createFieldsOf(
        patchForStyle(
          style,
          { capture: "upload", review: false, developsAt },
          { eventDate: null, zone },
        ),
        roll,
      ),
      // Her own zone, whatever the style: a develop chosen later in Settings is read in it too.
      ...(zone ? { captured_zone: zone } : {}),
    };
  };

  return {
    style,
    developsAt,
    draft,
    roll,
    setRoll,
    refusal,
    pick,
    type,
    finish,
    confirm,
    fields,
  };
}

/* ── the step ─────────────────────────────────────────────────────────── */

/** Settings' own mark: a filled round with its tick (the house's check micro-pop), or an empty ring. */
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

export function AddStep({
  choice,
  played,
  onPlayed,
}: {
  choice: AddChoice;
  /** Whether the picked card's story has played in this Create: it plays once, as the step first opens. */
  played: boolean;
  /** The story has been asked for as the step opened. */
  onPlayed: () => void;
}) {
  const { run, again } = useStoryRuns(choice.style, played, onPlayed);
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
          const line = styleLine(s, { rollSize: choice.roll });
          return (
            <RadioGroupPrimitive.Item
              key={s}
              value={s}
              data-album-style={s}
              aria-label={`${STYLE_NAMES[s]}. ${line}`}
              onClick={() => {
                // A press on the card already picked plays its story again.
                if (on) again();
              }}
              className="cr-style-card"
            >
              <span
                // The pick drops into the add step's hairline as the next screen arrives (`carry.ts`).
                data-carry-pick={on ? "2" : undefined}
                className="cr-style-pic-box"
              >
                <CardPicture
                  style={s}
                  // Only the picked card plays: one just left stands at its rest at once.
                  run={on ? runOf(run, s) : null}
                  roll={choice.roll}
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

/** One card's picture: its story while its run plays, else its rest. */
function CardPicture({
  style,
  run,
  roll,
}: {
  style: AlbumStyle;
  run: number | null;
  roll: number;
}) {
  const shown = useStory(style, run);
  return (
    <StylePictureFrame
      style={style}
      shown={shown}
      roll={roll}
      word
      className="cr-style-pic"
    />
  );
}
