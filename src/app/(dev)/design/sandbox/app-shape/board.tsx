"use client";

import { ExplorationBoard } from "@/components/lab";
import type { BoardState } from "@/components/lab/board-spec";
import type { PreviewsFor } from "@/components/lab/exploration";

import { Chrome, Screen, sizeOf } from "./chrome";
import { EMPTY_HOST, FIRST_HOST, HOST } from "./fixtures";
import {
  BusyState,
  type BusyOption,
  EmptyState,
  type EmptyOption,
  FirstState,
  type FirstOption,
} from "./home";
import { APP_SHAPE } from "./spec";

/**
 * THE THREE PICTURES, EACH A REAL HOST AT A REAL WINDOW.
 *
 * Round one compared eight different SHAPES of the app; round two compares
 * three drawings of the ONE shipped page (`/dashboard`) under three real host
 * states. Every preview is the same `Chrome` + `Screen` harness (the real
 * `AppShell`, a real viewport) around `home.tsx`'s state components, switched
 * only by which option and which window (1440 or 375, the SIZE control every
 * ask shares) the step asks for.
 */

/**
 * A stand-in seed per fixture host (see `chrome.tsx`'s `HeaderFace`): any
 * stable string, never the real `seedFor` (server-only), and never a real
 * account id.
 */
const SEEDS = {
  empty: "app-shape-round-two-alex-rivera",
  first: "app-shape-round-two-jordan-kim",
  busy: "app-shape-round-two-maya-chen",
} as const;

const EMPTY_TITLES: Record<EmptyOption, string> = {
  wizard: "The wizard's door alone",
  ghosts: "The pulse's bands as ghosts",
  guided: "A guided first screen",
};

const EMPTY_CAPTIONS: Record<EmptyOption, string> = {
  wizard:
    "Nothing but the create door and the storage line: exactly what zero events renders today.",
  ghosts:
    "The next-step band and Just arrived both hold their shape, faint, before either has anything real to show.",
  guided:
    "The pulse never renders. One hero, the host's first three steps, the same create door at the end.",
};

function EmptyScreen({ s, option }: { s: BoardState; option: EmptyOption }) {
  return (
    <Screen
      id={`empty-${option}`}
      size={sizeOf(s.size)}
      title={EMPTY_TITLES[option]}
      caption={EMPTY_CAPTIONS[option]}
    >
      <Chrome hostInitial={EMPTY_HOST.initial} hostSeed={SEEDS.empty}>
        <EmptyState option={option} />
      </Chrome>
    </Screen>
  );
}

const FIRST_TITLES: Record<FirstOption, string> = {
  share: "The code and the share door first",
  promise: "The empty album's promise",
  pulse: "The pulse with one event",
};

const FIRST_CAPTIONS: Record<FirstOption, string> = {
  share:
    "The code and the link lead the page; the calm band and the empty strip follow beneath it.",
  promise:
    "One hero for the one event that exists, in the guest album's own voice, rather than four bands built for many.",
  pulse:
    "Today's exact composition: the calm line, no arrivals, one cover card, unmodified.",
};

function FirstScreen({ s, option }: { s: BoardState; option: FirstOption }) {
  return (
    <Screen
      id={`first-${option}`}
      size={sizeOf(s.size)}
      title={FIRST_TITLES[option]}
      caption={FIRST_CAPTIONS[option]}
    >
      <Chrome hostInitial={FIRST_HOST.initial} hostSeed={SEEDS.first}>
        <FirstState option={option} />
      </Chrome>
    </Screen>
  );
}

const BUSY_TITLES: Record<BusyOption, string> = {
  ruled: "As ruled, unmodified",
  collapsed: "The queues collapsed",
  "events-first": "The events first",
};

const BUSY_CAPTIONS: Record<BusyOption, string> = {
  ruled:
    "Six chips, wrapping across lines: every step the real precedence produces, uncapped.",
  collapsed:
    "The top three by tone, then one chip for the rest, expanded here to show what it holds.",
  "events-first":
    "Your five events lead the page; what needs you and what just arrived follow beneath them.",
};

function BusyScreen({ s, option }: { s: BoardState; option: BusyOption }) {
  return (
    <Screen
      id={`busy-${option}`}
      size={sizeOf(s.size)}
      title={BUSY_TITLES[option]}
      caption={BUSY_CAPTIONS[option]}
    >
      <Chrome hostInitial={HOST.initial} hostSeed={SEEDS.busy}>
        <BusyState option={option} />
      </Chrome>
    </Screen>
  );
}

const PREVIEWS: PreviewsFor<typeof APP_SHAPE> = {
  "empty.wizard": (s) => <EmptyScreen s={s} option="wizard" />,
  "empty.ghosts": (s) => <EmptyScreen s={s} option="ghosts" />,
  "empty.guided": (s) => <EmptyScreen s={s} option="guided" />,

  "first.share": (s) => <FirstScreen s={s} option="share" />,
  "first.promise": (s) => <FirstScreen s={s} option="promise" />,
  "first.pulse": (s) => <FirstScreen s={s} option="pulse" />,

  "busy.ruled": (s) => <BusyScreen s={s} option="ruled" />,
  "busy.collapsed": (s) => <BusyScreen s={s} option="collapsed" />,
  "busy.events-first": (s) => <BusyScreen s={s} option="events-first" />,
};

export function AppShapeBoard() {
  return <ExplorationBoard spec={APP_SHAPE} previews={PREVIEWS} />;
}
