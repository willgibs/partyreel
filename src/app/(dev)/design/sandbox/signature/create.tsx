"use client";

import { type CSSProperties, type ReactNode, useId } from "react";

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
import { orbFor } from "@/lib/avatar/gradient";
import { DEFAULT_QR_PRESET } from "@/lib/constants/qr-presets";

import { ALBUM, WEDDING } from "./fixtures";
import { albumLight, conicOf } from "./light";
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
 * bloom. Every other option stands the field and the lamps' pool down
 * (`light="none"`); `chosen` lights the chosen card instead, a Bloom behind
 * it in its own photographs' light.
 *
 * ★ THE CODE'S LIGHT IS THE EVENT'S SEED in both new options: a new event has
 * no photograph yet, and its seed is the light before the first one (the
 * sourcing order), lit once behind the plate and resting. ★ SOFT, NEVER A NEON
 * EDGE (the creative director's pass): the seed's hue made lighter and less
 * saturated, an ellipse a little wider than the plate and a little above it,
 * spent before the code's two rounds under it.
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

/** The chosen card's own light: its pictures' (the style's night, the album's stills), behind it (`chosen`). */
const PICK_CONIC = conicOf(albumLight(ALBUM.slice(0, 6).map((s) => s.id)));

/** The seed's light, softened: its hue, lighter and four tenths less saturated. */
const SEED = `oklch(0.8 0.085 ${Math.round(orbFor(EVENT_SEED).hue)})`;

/** Today's pick pool and the code's own bloom stood down for the new options' lights. */
const NO_PICK = ".cr-style-card::before { display: none !important; }";
const NO_BEAT_LIGHT = "[data-beat-light] { display: none !important; }";

/** The seed's light behind the code's plate, lit once as the code turns real. */
function SeedLight({ children }: { children: ReactNode }) {
  return (
    <span
      data-sg-bloom="seed"
      className="sg-seed-holder"
      style={{ "--sg-seed": SEED } as CSSProperties}
    >
      <span aria-hidden className="sg-seed-light" />
      {children}
    </span>
  );
}

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
          {way === "field" ? code : <SeedLight>{code}</SeedLight>}
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
    <div
      ref={root}
      data-sg-create={way}
      data-sg-create-step={step}
      style={{ "--sg-pick-conic": PICK_CONIC } as CSSProperties}
    >
      {way !== "field" ? <style>{NO_PICK}</style> : null}
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
