"use client";

import { ExplorationBoard, ReplayButton, useReplay } from "@/components/lab";
import type { GridMedia } from "@/components/app/media-grid";
import { optionId, optionLabel } from "@/components/lab/board-spec";
import type { PreviewsFor } from "@/components/lab/exploration";

import {
  HELD,
  LAST_OF_PICK,
  PICK,
  PRIYA,
  strip,
  TOM,
} from "./fixtures";
import { LANDED, type Register, WAITING } from "./lines";
import {
  EmptyState,
  FailureSheetBody,
  HeldTile,
  InviteOnly,
  KeepDoor,
  OfferCard,
  PasswordStep,
  StackLastBeat,
  WelcomeStep,
} from "./parts";
import {
  AlbumGround,
  BottomSheet,
  CentredDialog,
  DoorGround,
  EventHead,
  GuestHeader,
  lineCount,
  lines,
  Pair,
  type Reader,
  ReplayCtx,
  Scene,
  useRunId,
  wordCount,
} from "./scene";
import { VOICE_GUEST } from "./spec";

/**
 * THE PREVIEWS, AND NOTHING ELSE: every candidate line set in the place it
 * ships, on a 375 phone, with the rest of that place at today's words.
 *
 * ★ EVERY FRAME IS TITLED WITH ITS OPTION'S OWN LABEL (the guidance: "the
 * specimen carries the option's name"), read off the spec rather than typed
 * twice, so the words on the stage head and the words over the phone are the
 * same words.
 *
 * ★ EVERY CAPTION IS READ OFF THE FRAME, NEVER ASSERTED (`guest-capture`'s
 * discipline): how many lines a line runs at 375, how many words stand before
 * the button, how much of a photograph a pane covers. A line that looks short
 * in a spec and wraps to three on a tile is exactly what a voice board exists
 * to catch, and the number under the frame is the truth.
 */

const LABEL = (ask: string, option: Register) => {
  const found = VOICE_GUEST.asks
    .find((a) => a.id === ask)
    ?.options.find((o) => optionId(o) === option);
  return found ? optionLabel(found) : option;
};

/** The register's short name, the words every option label opens with. */
const SHORT: Record<Register, string> = {
  today: "As shipped",
  warm: "Plain and warm",
  bright: "Bright",
  exact: "Quiet and exact",
  tender: "Soft and tender",
};

/* ── the grounds the decisions share ──────────────────────────────────────── */

/** The album behind the door and under every album scene: nine of the
 *  wedding's approved photographs, newest first. */
const ALBUM = strip(9);

/** Her last photograph as the album holds it once it has landed. */
const LAST: GridMedia = {
  id: "vg-last",
  type: "photo",
  url: LAST_OF_PICK.src,
  downloadUrl: LAST_OF_PICK.src,
  status: "approved",
  width: LAST_OF_PICK.width,
  height: LAST_OF_PICK.height,
};

const priya = <GuestHeader who={{ kind: "named", name: PRIYA.name }} />;
const tom = (
  <GuestHeader who={{ kind: "member", name: TOM.name, seed: TOM.seed }} />
);

/* ── what the frames read ──────────────────────────────────────────────────── */

const text = (el: Element | null | undefined) =>
  (el as HTMLElement | null)?.innerText ?? "";

/** The door's step (`welcome`, `ask`): how long the line runs, and how much
 *  there is to read before the step's own control. */
const measureDoor =
  (before: string): Reader =>
  (root) => {
    const line = root.querySelector("[data-entry-drawer] [data-vg-line]");
    const n = lineCount(line);
    if (!line || !n) return null;
    return `Measured: ${lines(n)} and ${wordCount(text(line))} words at 375, before ${before}.`;
  };

const measureLanded: Reader = (root, win) => {
  const line = root.querySelector<HTMLElement>(
    "[data-upload-stack] [data-vg-line]",
  );
  if (!line) {
    if (!root.querySelector("[data-landed]")) return null;
    return win.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "Measured: no words, and under reduced motion no light either: nothing marks the landing."
      : "Measured: no words; the newest tile takes one pass of light (Replay runs it again).";
  }
  const tile = root.querySelector<HTMLElement>(
    "[data-upload-stack] [data-media-tile]",
  );
  const pane = line.parentElement;
  const n = lineCount(line);
  if (!tile || !pane || !n) return null;
  const t = tile.getBoundingClientRect();
  const share = Math.round((pane.getBoundingClientRect().height / t.height) * 100);
  return `Measured: ${lines(n)} on a ${Math.round(t.width)}px tile; the pane covers ${share}% of the photograph.`;
};

const measureFailed: Reader = (root) => {
  const words = root.querySelector("[data-vg-sheet] [data-vg-line]");
  const retry = root.querySelector("[data-vg-retry]");
  const n = lineCount(words);
  if (!words || !retry || !n) return null;
  return `Measured: the heading and its line run ${lines(n)}; ${wordCount(text(words)) + wordCount(text(retry))} words to the tap that retries.`;
};

const measureEmpty: Reader = (root) => {
  const button = root.querySelector<HTMLElement>("[data-vg-button]");
  if (!button) return null;
  const w = Math.round(button.getBoundingClientRect().width);
  if (!w) return null;
  return `Measured: one line, a ${w}px button, ${wordCount(text(button))} words under the heading.`;
};

const measureWaiting: Reader = (root) => {
  const tile = root.querySelector<HTMLElement>("[data-waiting-tile]");
  const line = tile?.querySelector("[data-vg-line]") ?? null;
  const n = lineCount(line);
  if (!tile || !n) return null;
  return `Measured: ${lines(n)} on a ${Math.round(tile.getBoundingClientRect().width)}px tile.`;
};

const measureCard: Reader = (root) => {
  const card = root.querySelector<HTMLElement>("[data-vg-card]");
  const words = card?.querySelector("[data-vg-line]");
  if (!card || !words) return null;
  const h = Math.round(card.getBoundingClientRect().height);
  if (!h) return null;
  return `Measured: the card stands ${h}px tall, ${wordCount(text(words))} words before its button.`;
};

const measureKeepDoor: Reader = (root) => {
  const words = root.querySelector("[data-vg-dialog] [data-vg-line]");
  const n = lineCount(words);
  if (!words || !n) return null;
  return `Measured: ${wordCount(text(words))} words over ${lines(n)} before the email field.`;
};

/* ── 1. the welcome ────────────────────────────────────────────────────────── */

function WelcomeScene({ register }: { register: Register }) {
  return (
    <Scene
      id={`vg-welcome-${register}`}
      title={LABEL("welcome", register)}
      measure={measureDoor("Continue")}
    >
      <DoorGround locked={false} behind={ALBUM}>
        <WelcomeStep register={register} />
      </DoorGround>
    </Scene>
  );
}

/* ── 2. the password's ask ─────────────────────────────────────────────────── */

function AskScene({ register }: { register: Register }) {
  return (
    <Scene
      id={`vg-ask-${register}`}
      title={LABEL("ask", register)}
      measure={measureDoor("the field")}
    >
      <DoorGround locked>
        <PasswordStep register={register} />
      </DoorGround>
    </Scene>
  );
}

/* ── 3. the landing ────────────────────────────────────────────────────────── */

/** What stands at the album's head as the last of the six lands: today the
 *  stack has already gone and the photograph is the album's newest tile,
 *  taking its light; a candidate holds the stack a beat with its line. */
function LandedAlbum({
  register,
  member,
}: {
  register: Register;
  member: boolean;
}) {
  const runId = useRunId();
  const words = LANDED[register];
  const line = words ? (member ? words.member(PICK) : words.guest(PICK)) : null;
  return (
    <AlbumGround
      header={member ? tom : priya}
      // A typed name's first photographs raise the capture card in the words
      // column (held at today's words: `keep` asks them); a signed-in member
      // has nothing to be offered.
      slot={member ? undefined : <OfferCard register="today" />}
      prefix={
        line ? (
          <StackLastBeat key={runId} still={LAST_OF_PICK} line={line} />
        ) : undefined
      }
      items={line ? ALBUM : [LAST, ...ALBUM]}
      landedId={line ? undefined : LAST.id}
    />
  );
}

/** The landing's own Replay: the light and the stack's arrival play once on
 *  mount, and a step mounts every option at once, so this remounts them. It
 *  sits with the evidence rather than in the dock because no other decision
 *  on the board moves. */
function LandedPreview({ register }: { register: Register }) {
  const { runId, replay } = useReplay();
  return (
    <div className="flex min-w-0 flex-col gap-3">
      <div>
        <ReplayButton runId={runId} onReplay={replay} />
      </div>
      <ReplayCtx.Provider value={runId}>
        <Pair>
          <Scene
            id={`vg-landed-${register}-guest`}
            title={`${SHORT[register]}: Priya, a typed name`}
            measure={measureLanded}
          >
            <LandedAlbum register={register} member={false} />
          </Scene>
          <Scene
            id={`vg-landed-${register}-member`}
            title={`${SHORT[register]}: Tom, signed in`}
            measure={measureLanded}
          >
            <LandedAlbum register={register} member />
          </Scene>
        </Pair>
      </ReplayCtx.Provider>
    </div>
  );
}

/* ── 4. a failed upload ────────────────────────────────────────────────────── */

function FailedScene({ register }: { register: Register }) {
  return (
    <Scene
      id={`vg-failed-${register}`}
      title={LABEL("failed", register)}
      measure={measureFailed}
    >
      <AlbumGround
        header={priya}
        slot={<OfferCard register="today" />}
        items={ALBUM}
        overlay={
          <BottomSheet>
            <FailureSheetBody register={register} />
          </BottomSheet>
        }
      />
    </Scene>
  );
}

/* ── 5. the empty album ────────────────────────────────────────────────────── */

function EmptyScene({ register }: { register: Register }) {
  return (
    <Scene
      id={`vg-empty-${register}`}
      title={LABEL("empty", register)}
      measure={measureEmpty}
    >
      <div className="min-h-full bg-background text-foreground">
        {priya}
        <div className="px-5 pt-6 pb-10">
          <EventHead count={0} contributors={0} />
          <InviteOnly />
          <div className="mt-7">
            <EmptyState register={register} />
          </div>
        </div>
      </div>
    </Scene>
  );
}

/* ── 6. a held photo ───────────────────────────────────────────────────────── */

function WaitingScene({ register }: { register: Register }) {
  return (
    <Scene
      id={`vg-waiting-${register}`}
      title={LABEL("waiting", register)}
      measure={measureWaiting}
    >
      <AlbumGround
        header={priya}
        prefix={HELD.map((still) => (
          <HeldTile key={still.src} still={still} line={WAITING[register]} />
        ))}
        items={ALBUM}
      />
    </Scene>
  );
}

/* ── 7. keeping it ─────────────────────────────────────────────────────────── */

function KeepPreview({ register }: { register: Register }) {
  const ground = (overlay?: React.ReactNode) => (
    <AlbumGround
      header={priya}
      slot={<OfferCard register={register} />}
      items={ALBUM}
      overlay={overlay}
    />
  );
  return (
    <Pair>
      <Scene
        id={`vg-keep-${register}-card`}
        title={`${SHORT[register]}: the card, once her photos land`}
        measure={measureCard}
      >
        {ground()}
      </Scene>
      <Scene
        id={`vg-keep-${register}-door`}
        title={`${SHORT[register]}: the door its button opens`}
        measure={measureKeepDoor}
      >
        {ground(
          <CentredDialog>
            <KeepDoor register={register} />
          </CentredDialog>,
        )}
      </Scene>
    </Pair>
  );
}

/* ── the map the step draws from ─────────────────────────────────────────── */

const PREVIEWS: PreviewsFor<typeof VOICE_GUEST> = {
  "welcome.today": <WelcomeScene register="today" />,
  "welcome.warm": <WelcomeScene register="warm" />,
  "welcome.bright": <WelcomeScene register="bright" />,
  "welcome.exact": <WelcomeScene register="exact" />,
  "welcome.tender": <WelcomeScene register="tender" />,

  "ask.today": <AskScene register="today" />,
  "ask.warm": <AskScene register="warm" />,
  "ask.bright": <AskScene register="bright" />,
  "ask.exact": <AskScene register="exact" />,
  "ask.tender": <AskScene register="tender" />,

  "landed.today": <LandedPreview register="today" />,
  "landed.warm": <LandedPreview register="warm" />,
  "landed.bright": <LandedPreview register="bright" />,
  "landed.exact": <LandedPreview register="exact" />,
  "landed.tender": <LandedPreview register="tender" />,

  "failed.today": <FailedScene register="today" />,
  "failed.warm": <FailedScene register="warm" />,
  "failed.bright": <FailedScene register="bright" />,
  "failed.exact": <FailedScene register="exact" />,
  "failed.tender": <FailedScene register="tender" />,

  "empty.today": <EmptyScene register="today" />,
  "empty.warm": <EmptyScene register="warm" />,
  "empty.bright": <EmptyScene register="bright" />,
  "empty.exact": <EmptyScene register="exact" />,
  "empty.tender": <EmptyScene register="tender" />,

  "waiting.today": <WaitingScene register="today" />,
  "waiting.warm": <WaitingScene register="warm" />,
  "waiting.bright": <WaitingScene register="bright" />,
  "waiting.exact": <WaitingScene register="exact" />,
  "waiting.tender": <WaitingScene register="tender" />,

  "keep.today": <KeepPreview register="today" />,
  "keep.warm": <KeepPreview register="warm" />,
  "keep.bright": <KeepPreview register="bright" />,
  "keep.exact": <KeepPreview register="exact" />,
  "keep.tender": <KeepPreview register="tender" />,
};

export function VoiceGuestBoard() {
  return <ExplorationBoard spec={VOICE_GUEST} previews={PREVIEWS} />;
}
