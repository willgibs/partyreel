"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";

import { ExplorationBoard, Frame } from "@/components/lab";
import type { BoardState } from "@/components/lab/board-spec";
import type { PreviewsFor } from "@/components/lab/exploration";

import { BadgeScreen, type BadgeShape } from "./faces";
import { CollisionScreen, type CollisionShape } from "./lanes";
import { GateScreen, type GateShape, gateOf } from "./door";
import { OutageScreen, type OutageShape } from "./outage";
import {
  ExpiryScreen,
  type ExpiryShape,
  LensScreen,
  type LensShape,
} from "./queue";
import { PEOPLE, QUEUE } from "./fixtures";
import { SCREENS, type ScreenId, screenOf } from "./page-parts";
import { GUEST_VERIFY } from "./spec";

/**
 * THE PREVIEWS, AND NOTHING ELSE: every option is the guest's screen, the
 * host's queue, or the flow the two of them run through, wearing exactly one
 * thing changed.
 *
 * ★ EVERY CAPTION READS THE LAID-OUT DOM, and that is a standing lab rule with
 * a scar behind it (docs/PROGRAM.md): a board once drew an option with its
 * formula's sign backwards, and the tile Will judged showed the opposite of the
 * words he picked. So nothing below describes what the code is supposed to do.
 * `badge` COUNTS the labelled faces on a guest's screen; `host-lens` COUNTS the
 * tiles in the host's own pile; `collision` SUMS the photographs sitting in
 * boxes the real Bob's code would open. If the words above a frame and the
 * caption under it ever disagree, the caption is the truth.
 */

/* ── the measurement ─────────────────────────────────────────────────────── */

type Reader = (root: HTMLElement, win: Window) => string | null;

/**
 * Reads one fact out of the frame's own document, watched with THAT window's
 * ResizeObserver plus two late passes for photographs still decoding at layout
 * time.
 *
 * ★ `deps` RE-ARMS THE WATCH (the `guest-shape` and `profile-page` finding,
 * inherited rather than rediscovered). A ResizeObserver fires on a LAYOUT
 * change, and several knobs here change what is TRUE inside an already-mounted
 * frame without resizing anything: flipping `gate` on the `badge` step changes
 * the caption's world, not the layout. The SHAPE itself is a dep too, because
 * the step swaps one option's tree for another's at the SAME slot and `Screen`
 * never remounts on its own.
 */
function Probe({
  read,
  deps,
  onRead,
  children,
}: {
  read: Reader;
  deps: readonly unknown[];
  onRead: (s: string) => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const latest = useRef({ read, onRead });
  useEffect(() => {
    latest.current = { read, onRead };
  });

  useEffect(() => {
    const el = ref.current;
    const win = el?.ownerDocument.defaultView as
      | (Window & typeof globalThis)
      | null
      | undefined;
    if (!el || !win) return;
    const run = () => {
      const said = latest.current.read(el, win);
      if (said) latest.current.onRead(said);
    };
    run();
    const ro = new win.ResizeObserver(run);
    ro.observe(el);
    const mid = win.setTimeout(run, 1300);
    const late = win.setTimeout(run, 1900);
    return () => {
      ro.disconnect();
      win.clearTimeout(mid);
      win.clearTimeout(late);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return <div ref={ref}>{children}</div>;
}

function Screen({
  id,
  screen,
  caption,
  read,
  deps,
  children,
}: {
  id: string;
  screen: ScreenId;
  caption: string;
  read: Reader;
  /** Everything besides `screen` (already in `id`) that can change the answer. */
  deps: readonly unknown[];
  children: ReactNode;
}) {
  const [said, setSaid] = useState<string | null>(null);
  const { w, h, name } = SCREENS[screen];
  return (
    <Frame
      id={`gv-${id}-${screen}`}
      w={w}
      h={h}
      title={`${w} x ${h}, ${name}`}
      caption={said ? `${caption} ${said}` : caption}
    >
      <Probe read={read} deps={deps} onRead={setSaid}>
        {children}
      </Probe>
    </Frame>
  );
}

const screenFor = (s: BoardState): ScreenId => screenOf(s.screen);

const inFrame = (el: HTMLElement, win: Window): boolean => {
  const r = el.getBoundingClientRect();
  return (
    r.bottom > 0 &&
    r.top < win.innerHeight &&
    r.right > 0 &&
    r.left < win.innerWidth
  );
};

/* ── 1. the gate ─────────────────────────────────────────────────────────── */

const GATE_CAPTION: Record<GateShape, string> = {
  before:
    "Today. The door stands in front of the album and nothing has been uploaded.",
  after: "The photograph is in the album, live, wearing an unconfirmed mark.",
  held: "The photograph is in and safe, and nobody sees it until the code lands.",
};

/** His own criterion, measured: is the upload blocked, and can the guest see
 *  what they just added? */
const gateRead: Reader = (root, win) => {
  const blocked = root.querySelector<HTMLElement>("[data-gv-blocked]");
  const mine = root.querySelector<HTMLElement>("[data-gv-mine]");
  const tiles = [...root.querySelectorAll<HTMLElement>("[data-media-tile]")];
  const onScreen = tiles.filter((t) => inFrame(t, win)).length;
  if (blocked)
    return `Measured: nothing uploaded, ${onScreen} photographs behind the door.`;
  if (!mine) return null;
  const held = mine.hasAttribute("data-gv-held");
  return `Measured: yours is in, ${held ? "held" : "visible to everyone"}, among ${onScreen} on screen.`;
};

function gateScreen(shape: GateShape, s: BoardState) {
  const screen = screenFor(s);
  return (
    <Screen
      id={`gate-${shape}`}
      screen={screen}
      read={gateRead}
      deps={[shape, screen]}
      caption={GATE_CAPTION[shape]}
    >
      <GateScreen shape={shape} screen={screen} />
    </Screen>
  );
}

/* ── 2. the badge ────────────────────────────────────────────────────────── */

const BADGE_CAPTION: Record<BadgeShape, string> = {
  mark: "An amber mark on the five unconfirmed faces, where every guest reads it.",
  ring: "The same five, at the mark's quietest: a dashed rim and nothing else.",
  host: "The guest's album says nothing; the host's own list names it in words.",
  none: "Nothing anywhere. Confirmation stays a gate and never becomes a label.",
};

/**
 * THE COST, COUNTED RATHER THAN CLAIMED: how many of the twenty-three are
 * labelled on a GUEST's screen, and whether an unproven photograph is even in
 * this album under the gate currently on the dock.
 */
const badgeRead: Reader = (root) => {
  const guest = root.querySelector<HTMLElement>("[data-gv-guest]") ?? root;
  // The faces row draws six of the same people the chips below draw, so the
  // count is of PEOPLE, taken from the chip list (the row would double it).
  const labelled = guest.querySelectorAll("[data-gv-unproven]").length;
  const people = PEOPLE.length;
  const half = Math.round(labelled / 2);
  return `Measured: ${half} of ${people} guests labelled on a guest's screen.`;
};

function badgeScreen(shape: BadgeShape, s: BoardState) {
  const screen = screenFor(s);
  const gate = gateOf(s.gate);
  const world =
    gate === "before"
      ? "Under the gate as shipped, an unconfirmed guest cannot be here at all."
      : gate === "held"
        ? "Under a held gate, their photographs are not in this album yet."
        : "Under an after gate, their photographs are in this album, live.";
  return (
    <Screen
      id={`badge-${shape}`}
      screen={screen}
      read={badgeRead}
      deps={[shape, screen, gate]}
      caption={`${BADGE_CAPTION[shape]} ${world}`}
    >
      <BadgeScreen shape={shape} screen={screen} />
    </Screen>
  );
}

/* ── 3. the collision ────────────────────────────────────────────────────── */

const COLLISION_CAPTION: Record<CollisionShape, string> = {
  session: "Two guest rows, two sessions. The address never opened anything.",
  email:
    "One account, and the code the real Bob types is the key to all of it.",
  refuse: "The door stops the second person, and says why, to a stranger.",
};

/** The whole question, summed off the drawn diagram: how many of the five
 *  photographs sit in a box the real Bob's confirmed code opens. */
const collisionRead: Reader = (root, win) => {
  const vaults = [...root.querySelectorAll<HTMLElement>("[data-gv-vault]")];
  if (vaults.length === 0) return null;
  const photos = (v: HTMLElement) => Number(v.dataset.gvPhotos ?? "0");
  const total = vaults.reduce((n, v) => n + photos(v), 0);
  const bobs = vaults
    .filter((v) => v.dataset.gvBob === "yes")
    .reduce((n, v) => n + photos(v), 0);
  const tall = Math.round(
    vaults[vaults.length - 1].getBoundingClientRect().bottom,
  );
  return `Measured: Bob's code opens ${bobs} of the ${total} photographs; the flow ends ${tall} px down an ${win.innerHeight} px screen.`;
};

function collisionScreen(shape: CollisionShape, s: BoardState) {
  const screen = screenFor(s);
  return (
    <Screen
      id={`collision-${shape}`}
      screen={screen}
      read={collisionRead}
      deps={[shape, screen]}
      caption={COLLISION_CAPTION[shape]}
    >
      <CollisionScreen shape={shape} screen={screen} />
    </Screen>
  );
}

/* ── 4. the outage ───────────────────────────────────────────────────────── */

const OUTAGE_CAPTION: Record<OutageShape, string> = {
  bypass: "The shipped switch, turned off before the party and left off.",
  window: "A door the host opens mid-party, which closes itself again.",
  channel: "A second delivery path, paid for per message and per phone number.",
};

/** Who is still stuck, and for how long the remedy lasts. */
const outageRead: Reader = (root) => {
  const note = root.querySelector<HTMLElement>("[data-gv-remedy]");
  const asked = Boolean(root.querySelector("[data-gv-code-field]"));
  if (!note) return null;
  return `Measured: the guest is ${asked ? "still asked for a code" : "not asked for a code"}; the remedy lasts ${note.dataset.gvRemedy}.`;
};

function outageScreen(shape: OutageShape, s: BoardState) {
  const screen = screenFor(s);
  return (
    <Screen
      id={`outage-${shape}`}
      screen={screen}
      read={outageRead}
      deps={[shape, screen]}
      caption={OUTAGE_CAPTION[shape]}
    >
      <OutageScreen shape={shape} screen={screen} />
    </Screen>
  );
}

/* ── 5. the host's lens ──────────────────────────────────────────────────── */

const LENS_CAPTION: Record<LensShape, string> = {
  today: "One queue. Nothing says which of the nine are actually the host's.",
  badge:
    "One queue, and every tile says who sent it and whether they proved it.",
  split: "Two piles: the host's own work, and the pile that empties itself.",
};

/** How much of the queue reads as the host's own work. */
const lensRead: Reader = (root) => {
  const all = root.querySelectorAll("[data-gv-tile]").length;
  if (all === 0) return null;
  const mine =
    root
      .querySelector<HTMLElement>('[data-gv-pile="mine"]')
      ?.querySelectorAll("[data-gv-tile]").length ?? all;
  const real = QUEUE.filter((q) => q.proven).length;
  return `Measured: the host's own pile reads as ${mine} of ${all}; ${real} of ${all} are really theirs.`;
};

function lensScreen(shape: LensShape, s: BoardState) {
  const screen = screenFor(s);
  return (
    <Screen
      id={`lens-${shape}`}
      screen={screen}
      read={lensRead}
      deps={[shape, screen]}
      caption={LENS_CAPTION[shape]}
    >
      <LensScreen shape={shape} screen={screen} />
    </Screen>
  );
}

/* ── 6. the expiry ───────────────────────────────────────────────────────── */

const EXPIRY_CAPTION: Record<ExpiryShape, string> = {
  seven:
    "A deadline the guest is told, and four photographs gone on day seven.",
  keep: "No deadline, nothing destroyed, and the bytes on the host's cap for ever.",
  host: "The address drops and the host's own switch decides, as it already did.",
};

/**
 * What the guest was promised, what day seven destroys, and what it costs the
 * host's cap.
 *
 * ★ THE FIRST VERSION OF THIS COUNTED DEADLINE CHIPS AND LIED. `host` draws no
 * tiles on its day-seven half at all (it draws the host's two branches), so the
 * count came back zero on the one answer whose guest tile says "6 days left" in
 * the same frame. A caption that contradicts the picture beside it is worse
 * than no caption: the facts are now read from the two halves themselves.
 */
const expiryRead: Reader = (root) => {
  const told =
    root.querySelector<HTMLElement>("[data-gv-told]")?.dataset.gvTold;
  const doom =
    root.querySelector<HTMLElement>("[data-gv-doom]")?.dataset.gvDoom;
  const cap = root.querySelector<HTMLElement>("[data-gv-cap]")?.dataset.gvCap;
  if (!told || !doom || !cap) return null;
  return `Measured: the guest is told ${told}; day seven removes ${doom}; the host's cap reads ${cap} percent.`;
};

function expiryScreen(shape: ExpiryShape, s: BoardState) {
  const screen = screenFor(s);
  return (
    <Screen
      id={`expiry-${shape}`}
      screen={screen}
      read={expiryRead}
      deps={[shape, screen]}
      caption={EXPIRY_CAPTION[shape]}
    >
      <ExpiryScreen shape={shape} screen={screen} />
    </Screen>
  );
}

/* ── the map the step draws from ─────────────────────────────────────────── */

const PREVIEWS: PreviewsFor<typeof GUEST_VERIFY> = {
  "gate.before": (s) => gateScreen("before", s),
  "gate.after": (s) => gateScreen("after", s),
  "gate.held": (s) => gateScreen("held", s),

  "badge.mark": (s) => badgeScreen("mark", s),
  "badge.ring": (s) => badgeScreen("ring", s),
  "badge.host": (s) => badgeScreen("host", s),
  "badge.none": (s) => badgeScreen("none", s),

  "collision.session": (s) => collisionScreen("session", s),
  "collision.email": (s) => collisionScreen("email", s),
  "collision.refuse": (s) => collisionScreen("refuse", s),

  "outage.bypass": (s) => outageScreen("bypass", s),
  "outage.window": (s) => outageScreen("window", s),
  "outage.channel": (s) => outageScreen("channel", s),

  "host-lens.today": (s) => lensScreen("today", s),
  "host-lens.badge": (s) => lensScreen("badge", s),
  "host-lens.split": (s) => lensScreen("split", s),

  "expiry.seven": (s) => expiryScreen("seven", s),
  "expiry.keep": (s) => expiryScreen("keep", s),
  "expiry.host": (s) => expiryScreen("host", s),
};

export function GuestVerifyBoard() {
  return <ExplorationBoard spec={GUEST_VERIFY} previews={PREVIEWS} />;
}
