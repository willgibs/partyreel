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

import type { CloseWay } from "./close";
import {
  CreateRun,
  type FailWay,
  type RunProps,
  TODAY,
  type WaitWay,
  type Ways,
} from "./create";
import { SLOW_MS } from "./fixtures";
import { screenOf, type ScreenId } from "./knobs";
import { readRoom, Scene, Story } from "./scene";
import { CREATE_WIZARD } from "./spec";
import type { StylesWay } from "./styles";

/**
 * THE PREVIEWS, AND NOTHING ELSE: every frame is Create itself, in
 * production's room, for Maya & Jay's wedding, at a phone or a laptop on the
 * Screen knob, wearing production as built on every axis but the one asked
 * (`TODAY`), and the wait he picked where the failure waits on it. Every
 * frame is titled with its option's own name, read off the spec, and every
 * caption is read off the frame.
 *
 * Each option opens on Try it (Create running from the moment asked), then
 * the frame a reviewer reads still: the Disposable picked (and the focused
 * screen after it, where there is one), the beat made, the wait held, the
 * failure at rest.
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

const wearing = (patch: Partial<Ways>): Ways => ({ ...TODAY, ...patch });

function stylesPreview(s: BoardState, way: StylesWay) {
  const ways = wearing({ styles: way });
  const frames = [
    {
      key: "try",
      title: "Try it, as the step opens",
      run: { ways, opens: "add", outcome: "made" } as RunProps,
    },
    {
      key: "disposable",
      title: "Disposable picked",
      run: { ways, opens: "add", outcome: "made", style: "disposable" } as RunProps,
    },
  ];
  if (way === "focused")
    frames.push({
      key: "develop",
      title: "then the develop time's own screen",
      run: {
        ways,
        opens: "develop",
        outcome: "made",
        style: "disposable",
      } as RunProps,
    });
  return <Frames s={s} ask="styles" option={way} frames={frames} />;
}

function closePreview(s: BoardState, way: CloseWay) {
  const ways = wearing({ close: way });
  return (
    <Frames
      s={s}
      ask="close"
      option={way}
      frames={[
        {
          key: "made",
          title: "the beat, made",
          run: { ways, opens: "look", outcome: "made", pressed: true },
        },
        {
          key: "try",
          title: "Try it from the look",
          run: { ways, opens: "look", outcome: "made" },
        },
      ]}
    />
  );
}

function waitPreview(s: BoardState, way: WaitWay) {
  const ways = wearing({ wait: way });
  return (
    <Frames
      s={s}
      ask="wait"
      option={way}
      frames={[
        {
          key: "held",
          title: "the wait, held",
          run: { ways, opens: "look", outcome: "hangs", pressed: true },
        },
        {
          key: "try",
          title: "Try it from the look, a slow line",
          run: { ways, opens: "look", outcome: "made", ms: SLOW_MS },
        },
      ]}
    />
  );
}

/** The wait the failure is drawn in: his pick once he has made it, production's until then. */
const waitOf = (s: BoardState): WaitWay =>
  s.wait === "tray" || s.wait === "inplace" ? s.wait : "breath";

function failedPreview(s: BoardState, way: FailWay) {
  const ways = wearing({ failed: way, wait: waitOf(s) });
  return (
    <Frames
      s={s}
      ask="failed"
      option={way}
      frames={[
        {
          key: "rest",
          title: "the failure, at rest",
          run: { ways, opens: "look", outcome: "fails", pressed: true },
        },
        {
          key: "try",
          title: "Try it: fails, then makes it",
          run: { ways, opens: "look", outcome: "fails-once", ms: SLOW_MS },
        },
      ]}
    />
  );
}

const PREVIEWS: PreviewsFor<typeof CREATE_WIZARD> = {
  "styles.built": (s) => stylesPreview(s, "built"),
  "styles.focused": (s) => stylesPreview(s, "focused"),
  "styles.quiet": (s) => stylesPreview(s, "quiet"),
  "close.marks": (s) => closePreview(s, "marks"),
  "close.next": (s) => closePreview(s, "next"),
  "close.named": (s) => closePreview(s, "named"),
  "close.none": (s) => closePreview(s, "none"),
  "wait.breath": (s) => waitPreview(s, "breath"),
  "wait.tray": (s) => waitPreview(s, "tray"),
  "wait.inplace": (s) => waitPreview(s, "inplace"),
  "failed.back": (s) => failedPreview(s, "back"),
  "failed.held": (s) => failedPreview(s, "held"),
  "failed.line": (s) => failedPreview(s, "line"),
};

export function CreateWizardBoard() {
  return <ExplorationBoard spec={CREATE_WIZARD} previews={PREVIEWS} />;
}
