"use client";

import "./the-wait.css";

import type { ReactNode } from "react";

import {
  type BoardState,
  ExplorationBoard,
  optionId,
  optionLabel,
  type PreviewsFor,
} from "@/components/lab";

import { ArrivalFrame, type ArrivalId } from "./arrival";
import { WaitPage } from "./guest";
import { HostFrame, type HostCoverId } from "./host";
import { screenOf } from "./knobs";
import { type ModelId, modelOf } from "./model";
import { all, type Reader, Scene, Story, textOf } from "./scene";
import { ModelSettings } from "./settings";
import { THE_WAIT } from "./spec";
import { type WaitId } from "./wait";
import { BothFrame, type BothId, NameFrame, type NameId } from "./words";

/**
 * THE PREVIEWS, AND NOTHING ELSE: every option drawn whole on the surface it
 * ships on, production's album (and Maya's Settings and hub), a phone first
 * and a laptop on the Screen knob. Every frame is titled with its option's own
 * name, read off the spec, and every caption is read off the frame.
 *
 * ★ A STAGED DECISION IS DRAWN IN THE WORLD IT WAITS ON (`exploration.ts`'s
 * `Preview`): her wait in the model he picked, the arrival in that model and
 * that wait, and so on. Until he answers, each wears its parent's
 * recommendation, the kit's own rule.
 */

/* ── reading the board's state ────────────────────────────────────────── */

const recommended = (ask: string) =>
  THE_WAIT.asks.find((a) => a.id === ask)?.recommended ?? "";

const pick = <T extends string>(all: readonly T[], v: unknown, d: T): T =>
  all.includes(v as T) ? (v as T) : d;

const modelIn = (s: BoardState): ModelId =>
  modelOf(s.model, recommended("model") as ModelId);

const waitIn = (s: BoardState): WaitId =>
  pick<WaitId>(
    ["sheet", "stack", "reel", "cover"],
    s.wait,
    recommended("wait") as WaitId,
  );

const arrivalIn = (s: BoardState): ArrivalId =>
  pick<ArrivalId>(
    ["place", "develops", "premiere"],
    s.arrival,
    recommended("arrival") as ArrivalId,
  );

/** An option's own name, off the spec, so a frame's title and its tab agree. */
const LABEL = (ask: string, option: string) => {
  const found = THE_WAIT.asks
    .find((a) => a.id === ask)
    ?.options.find((o) => optionId(o) === option);
  return found ? optionLabel(found) : option;
};

/* ── what the frames read ─────────────────────────────────────────────── */

/** Settings, read off the page: its title, the questions it asks, and the answers it offers. */
const settingsSays: Reader = (root) => {
  const title = textOf(root.querySelector("[data-tw-settings-title]"));
  if (!title) return null;
  const groups = [...root.querySelectorAll<HTMLElement>("[role=radiogroup]")];
  const asks = groups.map((g) => {
    const named = g.getAttribute("aria-labelledby");
    const label = named
      ? textOf(root.ownerDocument.getElementById(named))
      : (g.getAttribute("aria-label") ?? "one question");
    const choices = g.querySelectorAll(
      "[data-choice], .tw-track-stop, [data-state]",
    ).length;
    return `${label} (${choices} answers)`;
  });
  const switches = root.querySelectorAll("[role=switch]").length;
  return `"${title}": ${asks.length ? asks.join(", ") : "no choice group"}; ${switches} switches`;
};

/** The wait, read off the page: what it is, its count and words, and how many of hers are lit. */
const waitSays: Reader = (root, win) => {
  const wait = root.querySelector<HTMLElement>("[data-tw-wait]");
  if (!wait) return null;
  const parts: string[] = [];
  const brow = textOf(root.querySelector("[data-tw-eyebrow]"));
  if (brow) parts.push(`the cover says "${brow}"`);
  const count =
    root.querySelector<HTMLElement>("[data-tw-count]")?.dataset.twCount;
  const title = textOf(root.querySelector("[data-tw-title]"));
  const clock = textOf(root.querySelector("[data-tw-clock]"));
  parts.push(
    count
      ? `${count} waiting, "${title}", "${clock}"`
      : `no count; "${title}", "${clock}"`,
  );
  const lit =
    root.querySelectorAll("[data-mine]").length ||
    root.querySelectorAll("[data-tw-hers]").length;
  parts.push(`${lit} of hers lit`);
  if (root.querySelector("[data-landing], [data-mine][data-new]"))
    parts.push("her newest landing");
  const dock = root.querySelector<HTMLElement>("[data-guest-dock]");
  if (dock && !dock.hasAttribute("data-hidden")) parts.push("the shutter up");
  if (root.querySelector("[data-tw-remove]")) parts.push("Remove open");
  const first = root.querySelector("[data-tw-wait]");
  if (first) {
    const r = first.getBoundingClientRect();
    parts.push(`the wait starts ${Math.round(r.top)} px down`);
  }
  void win;
  return parts.join("; ");
};

/* ── 1. the model ─────────────────────────────────────────────────────── */

function modelPreview(s: BoardState, model: ModelId): ReactNode {
  const screen = screenOf(s.screen);
  const wide = screen === "1440";
  const name = LABEL("model", model);
  const wait = waitIn(s);
  return (
    <Story screen={screen}>
      <Scene
        id={`tw-model-${model}-settings`}
        screen={screen}
        title={`${name}: Maya's Settings`}
        measure={settingsSays}
      >
        <ModelSettings model={model} wide={wide} />
      </Scene>
      <Scene
        id={`tw-model-${model}-held-${wait}`}
        screen={screen}
        title={`${name}: held for approval, 10:40 pm`}
        measure={waitSays}
      >
        <WaitPage
          model={model}
          wait={wait}
          album="held"
          wide={wide}
          moment="landing"
        />
      </Scene>
      <Scene
        id={`tw-model-${model}-dev-${wait}`}
        screen={screen}
        title={`${name}: developing, 10:40 pm`}
        measure={waitSays}
      >
        <WaitPage
          model={model}
          wait={wait}
          album="developing"
          wide={wide}
          moment="landing"
        />
      </Scene>
      <Scene
        id={`tw-model-${model}-trickle-${wait}`}
        screen={screen}
        title={`${name}: 11:20 pm, Maya lets 24 in`}
        measure={arrivalSays}
      >
        <ArrivalFrame
          model={model}
          wait={wait}
          arrival={arrivalIn(s)}
          beat="trickle"
          wide={wide}
        />
      </Scene>
    </Story>
  );
}

/* ── 2. her wait ──────────────────────────────────────────────────────── */

function waitPreview(s: BoardState, wait: WaitId): ReactNode {
  const screen = screenOf(s.screen);
  const wide = screen === "1440";
  const name = LABEL("wait", wait);
  const model = modelIn(s);
  return (
    <Story screen={screen}>
      <Scene
        id={`tw-wait-${wait}-held-${model}`}
        screen={screen}
        title={`${name}: held, her photo lands`}
        measure={waitSays}
      >
        <WaitPage
          model={model}
          wait={wait}
          album="held"
          wide={wide}
          moment="landing"
        />
      </Scene>
      <Scene
        id={`tw-wait-${wait}-dev-${model}`}
        screen={screen}
        title={`${name}: developing, scrolled`}
        measure={waitSays}
      >
        <WaitPage
          model={model}
          wait={wait}
          album="developing"
          wide={wide}
          moment="scrolled"
        />
      </Scene>
      <Scene
        id={`tw-wait-${wait}-loupe-${model}`}
        screen={screen}
        title={`${name}: taking one back`}
        measure={waitSays}
      >
        <WaitPage
          model={model}
          wait={wait}
          album="developing"
          wide={wide}
          moment="loupe"
        />
      </Scene>
    </Story>
  );
}

/* ── 3. the arrival ───────────────────────────────────────────────────── */

/** The arrival, read off the page: what arrived, what still waits, and what plays. */
const arrivalSays: Reader = (root) => {
  const beat = root.querySelector<HTMLElement>("[data-tw-arrival]");
  if (!beat) return null;
  const parts = [`${beat.dataset.twArrival}`];
  const news = textOf(root.querySelector("[data-tw-news]"));
  if (news) parts.push(`"${news}"`);
  const arrived = root.querySelectorAll(
    "[data-arrived], [data-developed]",
  ).length;
  if (arrived) parts.push(`${arrived} lit as arrivals`);
  const left =
    root.querySelector<HTMLElement>("[data-tw-count]")?.dataset.twCount;
  if (left) parts.push(`${left} still waiting`);
  if (root.querySelector("[data-tw-premiere]")) parts.push("the reel playing");
  return parts.join("; ");
};

function arrivalPreview(s: BoardState, arrival: ArrivalId): ReactNode {
  const screen = screenOf(s.screen);
  const wide = screen === "1440";
  const name = LABEL("arrival", arrival);
  const model = modelIn(s);
  const wait = waitIn(s);
  const at = `${model}-${wait}`;
  return (
    <Story screen={screen}>
      <Scene
        id={`tw-arrival-${arrival}-trickle-${at}`}
        screen={screen}
        title={`${name}: 11:20 pm, Maya lets 24 in`}
        measure={arrivalSays}
      >
        <ArrivalFrame
          model={model}
          wait={wait}
          arrival={arrival}
          beat="trickle"
          wide={wide}
        />
      </Scene>
      <Scene
        id={`tw-arrival-${arrival}-develop-${at}`}
        screen={screen}
        title={`${name}: 9 am, the roll develops`}
        measure={arrivalSays}
      >
        <ArrivalFrame
          model={model}
          wait={wait}
          arrival={arrival}
          beat="develop"
          wide={wide}
        />
      </Scene>
    </Story>
  );
}

/* ── 4. the host's cover ──────────────────────────────────────────────── */

const hostSays: Reader = (root) => {
  const area = root.querySelector<HTMLElement>("[data-tw-host]");
  if (!area) return null;
  const words = textOf(area.querySelector("[data-tw-host-say]"));
  const acts = [...area.querySelectorAll("[data-tw-act]")].map(textOf);
  return `${area.dataset.twHost}: "${words}"${acts.length ? `; ${acts.join(", ")}` : ""}`;
};

function coverPreview(s: BoardState, cover: HostCoverId): ReactNode {
  const screen = screenOf(s.screen);
  const wide = screen === "1440";
  const name = LABEL("cover", cover);
  const model = modelIn(s);
  const wait = waitIn(s);
  const at = `${model}-${wait}`;
  return (
    <Story screen={screen}>
      <Scene
        id={`tw-cover-${cover}-covered-${at}`}
        screen={screen}
        title={`${name}: Maya's hub, 10:40 pm`}
        measure={hostSays}
      >
        <HostFrame
          cover={cover}
          model={model}
          wait={wait}
          beat="covered"
          wide={wide}
        />
      </Scene>
      <Scene
        id={`tw-cover-${cover}-lifted-${at}`}
        screen={screen}
        title={`${name}: lifted for a look`}
        measure={hostSays}
      >
        <HostFrame
          cover={cover}
          model={model}
          wait={wait}
          beat="lifted"
          wide={wide}
        />
      </Scene>
      <Scene
        id={`tw-cover-${cover}-held-${at}`}
        screen={screen}
        title={`${name}: the held album's hub`}
        measure={hostSays}
      >
        <HostFrame
          cover={cover}
          model={model}
          wait={wait}
          beat="held"
          wide={wide}
        />
      </Scene>
    </Story>
  );
}

/* ── 5 and 6. the words ───────────────────────────────────────────────── */

const wordsSays: Reader = (root) => {
  const say = [...root.querySelectorAll("[data-tw-word]")].map(textOf);
  return say.length ? `It reads: ${say.map((w) => `"${w}"`).join(", ")}` : null;
};

function namePreview(s: BoardState, id: NameId): ReactNode {
  const screen = screenOf(s.screen);
  const wide = screen === "1440";
  const label = LABEL("name", id);
  const model = modelIn(s);
  const beats = ["create", "cover", "morning"] as const;
  const titles = {
    create: "Create's card",
    cover: "the cover, 10:40 pm",
    morning: "the morning after",
  } as const;
  return (
    <Story screen={screen}>
      {beats.map((beat) => (
        <Scene
          key={beat}
          id={`tw-name-${id}-${beat}-${model}`}
          screen={screen}
          title={`${label}: ${titles[beat]}`}
          measure={all(wordsSays)}
        >
          <NameFrame name={id} model={model} beat={beat} wide={wide} />
        </Scene>
      ))}
    </Story>
  );
}

function bothPreview(s: BoardState, id: BothId): ReactNode {
  const screen = screenOf(s.screen);
  const wide = screen === "1440";
  const label = LABEL("both", id);
  const model = modelIn(s);
  const wait = waitIn(s);
  const beats = ["settings", "guest", "host"] as const;
  const titles = {
    settings: "Maya's Settings",
    guest: "Priya's album, 10:40 pm",
    host: "Maya's hub",
  } as const;
  return (
    <Story screen={screen}>
      {beats.map((beat) => (
        <Scene
          key={beat}
          id={`tw-both-${id}-${beat}-${model}-${wait}`}
          screen={screen}
          title={`${label}: ${titles[beat]}`}
          measure={
            beat === "settings"
              ? all(settingsSays, wordsSays)
              : beat === "guest"
                ? waitSays
                : hostSays
          }
        >
          <BothFrame
            both={id}
            model={model}
            wait={wait}
            beat={beat}
            wide={wide}
          />
        </Scene>
      ))}
    </Story>
  );
}

/* ── the map ──────────────────────────────────────────────────────────── */

const PREVIEWS: PreviewsFor<typeof THE_WAIT> = {
  "model.questions": (s) => modelPreview(s, "questions"),
  "model.styles": (s) => modelPreview(s, "styles"),
  "model.time": (s) => modelPreview(s, "time"),
  "model.apart": (s) => modelPreview(s, "apart"),

  "wait.sheet": (s) => waitPreview(s, "sheet"),
  "wait.stack": (s) => waitPreview(s, "stack"),
  "wait.reel": (s) => waitPreview(s, "reel"),
  "wait.cover": (s) => waitPreview(s, "cover"),

  "arrival.place": (s) => arrivalPreview(s, "place"),
  "arrival.develops": (s) => arrivalPreview(s, "develops"),
  "arrival.premiere": (s) => arrivalPreview(s, "premiere"),

  "cover.card": (s) => coverPreview(s, "card"),
  "cover.guests": (s) => coverPreview(s, "guests"),
  "cover.frost": (s) => coverPreview(s, "frost"),

  "name.disposable": (s) => namePreview(s, "disposable"),
  "name.film": (s) => namePreview(s, "film"),
  "name.darkroom": (s) => namePreview(s, "darkroom"),

  "both.never": (s) => bothPreview(s, "never"),
  "both.under": (s) => bothPreview(s, "under"),
  "both.own": (s) => bothPreview(s, "own"),
};

export function TheWaitBoard() {
  return <ExplorationBoard spec={THE_WAIT} previews={PREVIEWS} />;
}
