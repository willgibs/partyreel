"use client";

import { useEffect, useRef, useState } from "react";

import type { QrStyleKey } from "@/lib/constants/qr-presets";
import type { Readiness } from "@/lib/events/readiness";

import { AddCentre, type AddWay, type Reveal, REVEALS } from "./add";
import { BeatCentre, type BeatWay } from "./beat";
import { EVENT, type HourId, NEW_EVENT } from "./fixtures";
import { LookCentre, type LookWay } from "./look";
import { NameField } from "./name";
import type { Mode } from "./pictures";
import {
  Between,
  type Flow,
  FLOW_MID,
  type PageContent,
  reducedIn,
  Room,
  type StepN,
} from "./room";

/**
 * CREATE, COMPOSED: one step's page in whatever the board holds for every
 * decision (the flow, the add step's centre, the look's, the beat's), so each
 * frame is one world (`exploration.ts`'s `Preview`): a decision is drawn in
 * the answers he has given and, until he gives them, in the recommendations.
 *
 * ★ TRY IT IS CREATE ITSELF, RUNNING: Continue, Back and the head's way back
 * work, the name is a real field, the night drags, the looks pick, and Create
 * event plays the beat's arrival, all on local state. Get it ready starts it
 * again. Nothing leaves the frame.
 */

export type Held = { flow: Flow; add: AddWay; look: LookWay; beat: BeatWay };

/** What a page is drawn holding: the answers so far, and a live room's hands. */
export type Answers = {
  name: string;
  picked: Mode;
  hour: HourId;
  reveal: Reveal;
  style: QrStyleKey;
  r?: Readiness;
  /** The beat's arrival: a still point, a loop, or played once. */
  beatAt?: number;
  beatLoop?: boolean;
  beatPlay?: boolean;
  live?: {
    onName: (s: string) => void;
    onPick: (m: Mode) => void;
    onHour: (h: HourId) => void;
    onReveal: (r: Reveal) => void;
    onStyle: (k: QrStyleKey) => void;
    onGo: () => void;
  };
};

/** The style every still frame holds: a shape other than the default shows the feature. */
export const PICKED_STYLE: QrStyleKey = "rounded";

export const ANSWERS: Answers = {
  name: EVENT.name,
  picked: "album",
  hour: "party",
  reveal: REVEALS[0],
  style: PICKED_STYLE,
};

/** One step's page, in the held answers. */
export function stepContent(
  n: StepN,
  held: Held,
  wide: boolean,
  a: Answers,
): PageContent {
  const live = a.live;
  if (n === 1)
    return {
      question: "Name your event",
      centre: (
        <NameField
          wide={wide}
          name={a.name}
          live={Boolean(live)}
          onName={live?.onName}
        />
      ),
      go: "Continue",
      keyboard: true,
    };
  if (n === 2)
    return {
      question: "How will guests add photos?",
      sub: "Switch any time, both ways",
      centre: (
        <AddCentre
          way={held.add}
          wide={wide}
          picked={a.picked}
          hour={a.hour}
          reveal={a.reveal}
          onPick={live?.onPick}
          onHour={live?.onHour}
          onReveal={live?.onReveal}
        />
      ),
      go: "Continue",
    };
  if (n === 3)
    return {
      question: "Pick the code’s look",
      sub: "Change it any time from Share",
      centre: (
        <LookCentre
          way={held.look}
          wide={wide}
          picked={a.style}
          onPick={live?.onStyle}
        />
      ),
      go: "Create event",
    };
  return {
    question: `${a.name || EVENT.name} is live`,
    centre: (
      <BeatCentre
        way={held.beat}
        wide={wide}
        r={a.r ?? NEW_EVENT}
        look={a.style}
        name={a.name || EVENT.name}
        at={a.beatAt}
        loop={a.beatLoop}
        play={a.beatPlay}
        onGo={live?.onGo}
      />
    ),
    // `two` carries Get it ready in its sheet; the others at the room's foot.
    go: held.beat === "two" ? "" : "Get it ready",
  };
}

/** A still step, in the held answers. */
export function StillStep({
  n,
  held,
  wide,
  answers = ANSWERS,
}: {
  n: StepN;
  held: Held;
  wide: boolean;
  answers?: Answers;
}) {
  return (
    <Room
      flow={held.flow}
      wide={wide}
      at={n}
      name={answers.name}
      content={stepContent(n, held, wide, answers)}
      light={n === 4 ? "low" : "seam"}
    />
  );
}

/** A step change between the name and how guests add, played or held. */
export function StillChange({
  held,
  wide,
  loop,
}: {
  held: Held;
  wide: boolean;
  loop?: boolean;
}) {
  return (
    <Between
      flow={held.flow}
      wide={wide}
      from={1}
      to={2}
      fromContent={stepContent(1, held, wide, ANSWERS)}
      toContent={stepContent(2, held, wide, ANSWERS)}
      name={ANSWERS.name}
      at={FLOW_MID[held.flow]}
      loop={loop}
    />
  );
}

/**
 * THE ADD STEP AS IT OPENS, live: the night plays once from 8 pm to the
 * party (where motion is welcome; reduced motion opens on the party), then
 * the phones pick and the night drags.
 */
export function LiveAdd({ held, wide }: { held: Held; wide: boolean }) {
  const [picked, setPicked] = useState<Mode>("album");
  const [hour, setHour] = useState<HourId>("party");
  const [reveal, setReveal] = useState<Reveal>(REVEALS[0]);
  const box = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = box.current;
    const win = el?.ownerDocument.defaultView;
    if (!el || !win || reducedIn(el)) return;
    // The night plays once as the step opens, then rests on the party.
    setHour("arrive");
    const t = win.setTimeout(() => setHour("party"), 900);
    return () => win.clearTimeout(t);
  }, []);

  const answers: Answers = {
    ...ANSWERS,
    picked,
    hour,
    reveal,
    live: {
      onName: () => {},
      onPick: setPicked,
      onHour: setHour,
      onReveal: setReveal,
      onStyle: () => {},
      onGo: () => {},
    },
  };
  return (
    <div ref={box} className="contents">
      <Room
        flow={held.flow}
        wide={wide}
        at={2}
        name={ANSWERS.name}
        content={stepContent(2, held, wide, answers)}
      />
    </div>
  );
}

/** THE LOOK STEP AS IT OPENS, live: it opens on today's default, Classic. */
export function LiveLook({ held, wide }: { held: Held; wide: boolean }) {
  const [style, setStyle] = useState<QrStyleKey>("classic");
  const answers: Answers = {
    ...ANSWERS,
    style,
    live: {
      onName: () => {},
      onPick: () => {},
      onHour: () => {},
      onReveal: () => {},
      onStyle: setStyle,
      onGo: () => {},
    },
  };
  return (
    <Room
      flow={held.flow}
      wide={wide}
      at={3}
      name={ANSWERS.name}
      content={stepContent(3, held, wide, answers)}
    />
  );
}

/** CREATE, RUNNING (the flow's Try it). */
export function TryIt({ held, wide }: { held: Held; wide: boolean }) {
  const [step, setStep] = useState<StepN>(1);
  const [moving, setMoving] = useState<{ from: StepN; to: StepN } | null>(
    null,
  );
  const [name, setName] = useState<string>(EVENT.name);
  const [picked, setPicked] = useState<Mode>("album");
  const [hour, setHour] = useState<HourId>("party");
  const [reveal, setReveal] = useState<Reveal>(REVEALS[0]);
  const [style, setStyle] = useState<QrStyleKey>(PICKED_STYLE);
  const [run, setRun] = useState(0);

  const again = () => {
    setStep(1);
    setName(EVENT.name);
    setPicked("album");
    setHour("party");
    setStyle(PICKED_STYLE);
    setRun((n) => n + 1);
  };
  const go = () => {
    if (step === 4) return again();
    // Create event: the beat's own arrival is the change into it.
    if (step === 3) return setStep(4);
    if (step === 1 && !name.trim()) return;
    setMoving({ from: step, to: (step + 1) as StepN });
  };
  const back = (to?: StepN) => {
    if (step <= 1 || step >= 4) return;
    setMoving({ from: step, to: to ?? ((step - 1) as StepN) });
  };

  const answers = (live: boolean): Answers => ({
    name,
    picked,
    hour,
    reveal,
    style,
    beatPlay: true,
    live: live
      ? {
          onName: setName,
          onPick: setPicked,
          onHour: setHour,
          onReveal: setReveal,
          onStyle: setStyle,
          onGo: go,
        }
      : undefined,
  });

  if (moving)
    return (
      <Between
        key={`${run}-${moving.from}-${moving.to}`}
        flow={held.flow}
        wide={wide}
        from={moving.from}
        to={moving.to}
        fromContent={stepContent(moving.from, held, wide, answers(false))}
        toContent={stepContent(moving.to, held, wide, answers(false))}
        name={name}
        play
        onDone={() => {
          setStep(moving.to);
          setMoving(null);
        }}
      />
    );
  return (
    <Room
      key={`${run}-${step}`}
      flow={held.flow}
      wide={wide}
      at={step}
      name={name}
      content={stepContent(step, held, wide, answers(true))}
      onGo={go}
      onBack={() => back()}
      onStep={(n) => back(n)}
      light={step === 4 ? "low" : "seam"}
    />
  );
}
