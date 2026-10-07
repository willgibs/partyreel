"use client";

import { useId } from "react";

import {
  AddStep,
  useAddChoice,
} from "@/components/app/create-event-wizard/add-step";
import { BeatActs, BeatCode } from "@/components/app/create-event-wizard/beat";
import { NameStep } from "@/components/app/create-event-wizard/name-step";
import {
  footButton,
  RoomFoot,
  RoomGround,
  RoomHead,
  RoomPage,
} from "@/components/app/create-event-wizard/room";
import { Button } from "@/components/ui/button";
import { DEFAULT_QR_PRESET } from "@/lib/constants/qr-presets";

import { ALBUM, WEDDING } from "./fixtures";
import { albumLight, Bloom, lampColor, seedLight } from "./light";
import { useNoFocus } from "./live";

/**
 * CREATE, IN PRODUCTION'S OWN ROOM (`create-event-wizard/room.tsx`, dark in
 * both themes): its head and hairlines, the question, the answer's space and
 * the foot, with production's own steps in it, the name (`NameStep`), the
 * album's style (`AddStep`, Live picked, the night at its party) and the close
 * (`BeatCode` with her code made, `BeatActs`, Get it ready).
 *
 * ★ TODAY'S TWO LIGHTS ARE PRODUCTION'S: the aurora's field at the floor
 * (`RoomGround`'s `light`) and the pick's pool of the lamps under the chosen
 * card (`create-room.css`); at the close the floor dims for the code's own
 * bloom. Every other option stands the field down (`light="none"`); `dark`
 * stands the pick's pool down too, and `chosen` lights it from the card's own
 * photographs instead of the lamps.
 *
 * ★ THE CODE'S LIGHT IS THE EVENT'S SEED in both new options: a new event has
 * no photograph yet, and its seed is the light before the first one (the
 * sourcing order), drawn as a Bloom behind the plate, lit once.
 *
 * ★ STAND-INS, SAID ONCE: every press is inert, the code encodes a stand-in
 * link, and the steps are drawn at rest (the night played, the beat arrived).
 */

export type CreateWay = "field" | "dark" | "chosen";
export type CreateStep = "name" | "style" | "close";

/** The wizard's four screens (`create-event-wizard.tsx`'s `STEPS`). */
const OF = 4;
const SITE = "https://partyreel.com";
const REAL = `${SITE}/e/maya-and-jay`;
const SAMPLE = `${SITE}/e/sample`;

/** The event's seed, the light before its first photograph (`orbFor`'s hue: a sea green). */
export const EVENT_SEED = "maya-and-jay";

/** The chosen card's own light: its pictures' (the style's night, the album's stills). */
const PICK_LIGHT = albumLight(ALBUM.slice(0, 6).map((s) => s.id));

/**
 * Production's pick pool, recoloured from the card's own photographs (`chosen`): on the group that declares
 * the two tones (`.cr-styles`), so the frame's own sheet outranks the room's.
 */
const PICK_LIT = `[data-sg-create="chosen"] .cr-styles {
  --cr-pick-glow-a: color-mix(in oklch, ${lampColor(PICK_LIGHT[0]!, "room")} 62%, transparent);
  --cr-pick-glow-b: color-mix(in oklch, ${lampColor(PICK_LIGHT[PICK_LIGHT.length - 1]!, "room")} 48%, transparent);
}`;

/** Today's pick pool stood down (`dark`), and the code's own bloom stood down for the seed's (both new options). */
const NO_PICK = ".cr-style-card::before { display: none !important; }";
const NO_BEAT_LIGHT = "[data-beat-light] { display: none !important; }";

function StyleBody() {
  const choice = useAddChoice();
  return <AddStep choice={choice} played onPlayed={() => {}} />;
}

export function CreateScreen({
  way,
  step,
}: {
  way: CreateWay;
  step: CreateStep;
}) {
  const questionId = useId();
  const formId = useId();
  const errorId = useId();
  const root = useNoFocus();
  const close = step === "close";
  const light = way === "field" ? (close ? "low" : "floor") : ("none" as const);
  let page;
  let foot;
  if (step === "name") {
    page = (
      <RoomPage question="Name your event" questionId={questionId}>
        <NameStep
          formId={formId}
          questionId={questionId}
          errorId={errorId}
          name={WEDDING.name}
          error={null}
          onName={() => {}}
          onSubmit={() => {}}
        />
      </RoomPage>
    );
    foot = (
      <Button type="button" size="cta" tabIndex={-1} className={footButton}>
        Continue
      </Button>
    );
  } else if (step === "style") {
    page = (
      <RoomPage
        question="Pick your album's style"
        questionId={questionId}
        sub="Change it any time in Settings"
      >
        <StyleBody />
      </RoomPage>
    );
    foot = (
      <Button type="button" size="cta" tabIndex={-1} className={footButton}>
        Continue
      </Button>
    );
  } else {
    const code = (
      <BeatCode
        look={DEFAULT_QR_PRESET}
        name={WEDDING.name}
        sampleUrl={SAMPLE}
        realUrl={REAL}
      />
    );
    page = (
      <RoomPage question={`${WEDDING.name} is live`} questionId={questionId}>
        <div data-beat="arrived" className="flex w-full flex-col items-center">
          {way === "field" ? (
            code
          ) : (
            <Bloom
              light={seedLight(EVENT_SEED)}
              spread={10}
              blur={42}
              radius={36}
              strength={0.78}
              ignite
            >
              {code}
            </Bloom>
          )}
          <div className="cr-beat-below mt-9 flex w-full flex-col items-center gap-7 md:mt-11 md:gap-9">
            <BeatActs eventId="" eventName={WEDDING.name} joinUrl={REAL} />
          </div>
        </div>
      </RoomPage>
    );
    foot = (
      <Button
        type="button"
        size="cta"
        tabIndex={-1}
        className={`${footButton} cr-beat-go`}
      >
        Get it ready
      </Button>
    );
  }
  return (
    <div ref={root} data-sg-create={way} data-sg-create-step={step}>
      {way === "dark" ? <style>{NO_PICK}</style> : null}
      {way === "chosen" ? <style>{PICK_LIT}</style> : null}
      {way !== "field" && close ? <style>{NO_BEAT_LIGHT}</style> : null}
      <RoomGround screen={step} light={light}>
        <RoomHead
          step={{ at: step === "name" ? 1 : step === "style" ? 2 : OF, of: OF }}
          name={step === "style" ? WEDDING.name : undefined}
          close={
            close
              ? { href: "/dashboard", label: "Go to your event" }
              : { href: "/dashboard", label: "Close" }
          }
        />
        <div
          data-room-body=""
          className="relative flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain"
        >
          {page}
        </div>
        <RoomFoot>{foot}</RoomFoot>
      </RoomGround>
    </div>
  );
}
