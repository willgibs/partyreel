"use client";

import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DEFAULT_QR_PRESET, QR_PRESETS } from "@/lib/constants/qr-presets";
import { cn } from "@/lib/utils";

import { EVENT, REAL_LINK, SAMPLE_LINK } from "./fixtures";
import { CodePlate, GuestPhone, type Mode } from "./pictures";
import {
  CardPage,
  Item,
  Room,
  type StepN,
  Studio,
} from "./shells";
import {
  Beat,
  type Beside,
  type Compare,
  ModeChoice,
  NameField,
  PICKED_STYLE,
  StylePick,
} from "./steps";

/**
 * ONE SCREEN OF CREATE: a step, in a shape, at a moment. The shape is the
 * first decision's; the camera step wears the compare and the beat wears what
 * stands beside the code, whatever the board holds for those two, so every
 * frame is one world (`exploration.ts`'s `Preview`).
 */

export type Shape = "card" | "screen" | "preview";

export type Moment =
  | { step: 1 }
  | { step: 2; picked: Mode; open: boolean }
  | { step: 3 }
  | { step: 4; scanned?: boolean; mode?: Mode };

const MODE_WORD: Record<Mode, string> = {
  album: "Album",
  camera: "Disposable camera",
};

/** The studio's way on, at the foot of the open step. */
function Go({ label, aside }: { label: string; aside?: string }) {
  return (
    <div className="mt-6 flex items-center gap-2">
      {aside && (
        <Button variant="ghost" size="lg" tabIndex={-1}>
          {aside}
        </Button>
      )}
      <Button data-cw-go size="lg" tabIndex={-1} className="ml-auto">
        {label}
        <ArrowRight />
      </Button>
    </div>
  );
}

/** The studio's stage: what guests scan and what it opens, as she picks. */
function Stage({
  wide,
  moment,
  mode,
  beside,
}: {
  wide: boolean;
  moment: Moment;
  mode: Mode;
  beside: Beside;
}) {
  const real = moment.step === 4;
  const styleKey = moment.step >= 3 ? PICKED_STYLE : DEFAULT_QR_PRESET;
  const plate = (
    <CodePlate
      link={real ? REAL_LINK : SAMPLE_LINK}
      styleKey={styleKey}
      size={wide ? 208 : 112}
      sample={!real}
    />
  );
  const caption = (words: string) =>
    wide ? (
      <figcaption className="text-caption text-muted-foreground">
        {words}
      </figcaption>
    ) : null;
  return (
    <div
      data-cw-hero
      className={cn("flex items-center", wide ? "gap-16" : "gap-7")}
    >
      <figure className="flex flex-col items-center gap-3">
        {real && beside === "lit" ? (
          <span className="cw-lit">{plate}</span>
        ) : (
          plate
        )}
        {caption("What guests scan")}
      </figure>
      <figure className="flex flex-col items-center gap-3">
        <GuestPhone
          mode={mode}
          hour="arrive"
          className={wide ? "w-[268px]" : "w-[112px]"}
        />
        {caption("What it opens")}
      </figure>
    </div>
  );
}

export function WizardScreen({
  shape,
  wide,
  compare,
  beside,
  moment,
}: {
  shape: Shape;
  wide: boolean;
  compare: Compare;
  beside: Beside;
  moment: Moment;
}) {
  const mode: Mode =
    moment.step === 2
      ? moment.picked
      : moment.step === 4
        ? (moment.mode ?? "album")
        : "album";

  /* ── screen: a room of its own ── */
  if (shape === "screen") {
    if (moment.step === 1)
      return (
        <Room wide={wide} at={1} actions={{ go: "Continue" }}>
          <NameField fit="room" wide={wide} />
        </Room>
      );
    if (moment.step === 2)
      return (
        <Room wide={wide} at={2} actions={{ back: true, go: "Continue" }}>
          <ModeChoice
            compare={compare}
            picked={moment.picked}
            open={moment.open}
            fit="room"
            wide={wide}
          />
        </Room>
      );
    if (moment.step === 3)
      return (
        <Room wide={wide} at={3} actions={{ back: true, go: "Create event" }}>
          <StylePick fit="room" wide={wide} />
        </Room>
      );
    return (
      <Room
        wide={wide}
        at={4}
        actions={{ aside: "Go to your event", go: "Get it ready" }}
      >
        <Beat
          beside={beside}
          scanned={moment.scanned}
          mode={mode}
          fit="room"
          wide={wide}
        />
      </Room>
    );
  }

  /* ── card: a quiet card in the app ── */
  if (shape === "card") {
    if (moment.step === 1)
      return (
        <CardPage
          wide={wide}
          at={1}
          title="Name your event"
          actions={{ go: "Continue" }}
        >
          <NameField fit="card" wide={wide} />
        </CardPage>
      );
    if (moment.step === 2)
      return (
        <CardPage
          wide={wide}
          at={2}
          title="How will guests add photos?"
          sub="Switch any time, both ways"
          actions={{ back: true, go: "Continue" }}
        >
          <ModeChoice
            compare={compare}
            picked={moment.picked}
            open={moment.open}
            fit="card"
            wide={wide}
          />
        </CardPage>
      );
    if (moment.step === 3)
      return (
        <CardPage
          wide={wide}
          at={3}
          title="Pick the code’s look"
          sub="Change it any time from Share"
          actions={{ back: true, go: "Create event" }}
        >
          <StylePick fit="card" wide={wide} />
        </CardPage>
      );
    return (
      <CardPage
        wide={wide}
        at={4}
        title={`${EVENT.name} is live`}
        actions={{ aside: "Go to your event", go: "Get it ready" }}
      >
        <Beat
          beside={beside}
          scanned={moment.scanned}
          mode={mode}
          fit="card"
          wide={wide}
        />
      </CardPage>
    );
  }

  /* ── preview: the steps beside what guests get ── */
  const at = moment.step as StepN;
  const state = (n: StepN) => (n < at ? "done" : n === at ? "now" : "next");
  const list = (
    <>
      <Item n={1} state={state(1)} answer={EVENT.name}>
        <NameField fit="column" wide={wide} />
        <Go label="Continue" />
      </Item>
      <Item n={2} state={state(2)} answer={MODE_WORD[mode]}>
        {moment.step === 2 && (
          <ModeChoice
            compare={compare}
            picked={moment.picked}
            open={moment.open}
            fit="column"
            wide={wide}
          />
        )}
        <Go label="Continue" />
      </Item>
      <Item n={3} state={state(3)} answer={QR_PRESETS[PICKED_STYLE].label}>
        <StylePick fit="column" wide={wide} plate={false} />
        <Go label="Create event" />
      </Item>
      <Item n={4} state={state(4)}>
        <Beat
          beside={beside}
          scanned={moment.step === 4 ? moment.scanned : false}
          mode={mode}
          fit="column"
          wide={wide}
          code={false}
        />
        <Go label="Get it ready" aside="Go to your event" />
      </Item>
    </>
  );
  return (
    <Studio
      wide={wide}
      list={list}
      stage={<Stage wide={wide} moment={moment} mode={mode} beside={beside} />}
    />
  );
}
