"use client";

import "./create-wizard.css";

import type { ReactNode } from "react";

import {
  type BoardState,
  ExplorationBoard,
  optionId,
  optionLabel,
  type PreviewsFor,
} from "@/components/lab";

import type { ArrivalWay } from "./arrival";
import type { CloseWay } from "./close";
import { CreateRun, type RunProps, type Ways } from "./create";
import { screenOf, type ScreenId } from "./knobs";
import type { Moment } from "./pictures";
import type { PreviewsWay } from "./previews";
import { readRoom, Scene, Story } from "./scene";
import { CREATE_WIZARD } from "./spec";

/**
 * THE PREVIEWS, AND NOTHING ELSE: every frame is Create itself in production's room, or her event's own page as she
 * lands in it, for Maya & Jay's wedding, at a phone or a laptop on the Screen knob, wearing on every axis but the one
 * asked the answer the board holds (his pick once he has made it; else the recommendation, or the styles as built).
 * Every frame is titled with its option's own name, read off the spec, and every caption is read off the frame.
 *
 * Each option stands at rest first (the beat made, her event as she lands, a style picked), then Try it, Create
 * running from the moment asked.
 */

/** An option's own name, off the spec, so the frame's title and the tile agree. */
const LABEL = (ask: string, option: string) => {
  const found = CREATE_WIZARD.asks
    .find((a) => a.id === ask)
    ?.options.find((o) => optionId(o) === option);
  return found ? optionLabel(found) : option;
};

function Shot({
  id,
  screen,
  title,
  children,
}: {
  id: string;
  screen: ScreenId;
  title: string;
  children: ReactNode;
}) {
  return (
    <Scene id={id} screen={screen} title={title} measure={readRoom}>
      {children}
    </Scene>
  );
}

/** The frames of one option: each a title and a run. */
function Frames({
  s,
  ask,
  option,
  frames,
}: {
  s: BoardState;
  ask: string;
  option: string;
  frames: { key: string; title: string; run: RunProps }[];
}) {
  const screen = screenOf(s.screen);
  const name = LABEL(ask, option);
  return (
    <Story screen={screen}>
      {frames.map((f) => (
        <Shot
          key={f.key}
          id={`cw-${ask}-${option}-${f.key}`}
          screen={screen}
          title={`${name}: ${f.title}`}
        >
          <CreateRun {...f.run} />
        </Shot>
      ))}
    </Story>
  );
}

const closeOf = (v: unknown): CloseWay =>
  v === "invite" || v === "photos" ? v : "enter";
const arrivalOf = (v: unknown): ArrivalWay =>
  v === "list" || v === "share" ? v : "done";
const previewsOf = (v: unknown): PreviewsWay =>
  v === "one" || v === "open" || v === "still" ? v : "built";

/** The answers a frame wears: the board's on every axis, the one asked replaced by the option drawn. */
const wearing = (s: BoardState, patch: Partial<Ways>): Ways => ({
  close: closeOf(s.close),
  arrival: arrivalOf(s.arrival),
  previews: previewsOf(s.previews),
  ...patch,
});

function closePreview(s: BoardState, way: CloseWay) {
  const ways = wearing(s, { close: way });
  const frames: { key: string; title: string; run: RunProps }[] = [
    { key: "made", title: "the beat, made", run: { ways, opens: "beat" } },
  ];
  if (way === "invite")
    frames.push({
      key: "invite",
      title: "its button: the invite screen",
      run: { ways, opens: "invite" },
    });
  if (way === "photos")
    frames.push({
      key: "going",
      title: "its button: her photos going up",
      run: { ways, opens: "beat", photos: "going" },
    });
  frames.push(
    {
      key: "lands",
      title: "her event, as she lands",
      run: {
        ways,
        opens: "hub",
        photos: way === "photos" ? "in" : undefined,
      },
    },
    {
      key: "try",
      title: "Try it from the code's look",
      run: { ways, opens: "look" },
    },
  );
  return <Frames s={s} ask="close" option={way} frames={frames} />;
}

function arrivalPreview(s: BoardState, way: ArrivalWay) {
  const ways = wearing(s, { arrival: way });
  return (
    <Frames
      s={s}
      ask="arrival"
      option={way}
      frames={[
        {
          key: "lands",
          title: "her event, as she lands",
          run: {
            ways,
            opens: "hub",
            photos: ways.close === "photos" ? "in" : undefined,
          },
        },
        {
          key: "try",
          title: "Try it from the beat",
          run: { ways, opens: "beat" },
        },
      ]}
    />
  );
}

/**
 * Where a story plays, its still is pinned where the Disposable looks least like Live (next morning, every album
 * whole, would draw it as Live's): `one` as its story starts (the camera holding the whole roll), `open` at the party
 * (dark but hers), the moment it rests on.
 */
const PINS: Partial<Record<PreviewsWay, { pin: Moment; title: string }>> = {
  one: { pin: "arrive", title: "Disposable picked, as its story starts" },
  open: { pin: "party", title: "Disposable picked, open at the party" },
};

function previewsPreview(s: BoardState, way: PreviewsWay) {
  const ways = wearing(s, { previews: way });
  const pinned = PINS[way];
  return (
    <Frames
      s={s}
      ask="previews"
      option={way}
      frames={[
        {
          key: "try",
          title: "Try it, as the step opens",
          run: { ways, opens: "add" },
        },
        {
          key: "disposable",
          title: pinned?.title ?? "Disposable picked",
          run: {
            ways,
            opens: "add",
            style: "disposable",
            pin: pinned?.pin,
          },
        },
      ]}
    />
  );
}

const PREVIEWS: PreviewsFor<typeof CREATE_WIZARD> = {
  "close.enter": (s) => closePreview(s, "enter"),
  "close.invite": (s) => closePreview(s, "invite"),
  "close.photos": (s) => closePreview(s, "photos"),
  "arrival.list": (s) => arrivalPreview(s, "list"),
  "arrival.share": (s) => arrivalPreview(s, "share"),
  "arrival.done": (s) => arrivalPreview(s, "done"),
  "previews.built": (s) => previewsPreview(s, "built"),
  "previews.one": (s) => previewsPreview(s, "one"),
  "previews.open": (s) => previewsPreview(s, "open"),
  "previews.still": (s) => previewsPreview(s, "still"),
};

export function CreateWizardBoard() {
  return <ExplorationBoard spec={CREATE_WIZARD} previews={PREVIEWS} />;
}
