"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";

import { ExplorationBoard, Frame } from "@/components/lab";
import type { BoardState } from "@/components/lab/board-spec";
import type { PreviewsFor } from "@/components/lab/exploration";

import { AddressScreen, type AddressShape, addressOf } from "./address";
import { AllowanceScreen, type AllowanceShape } from "./allowance";
import { CollisionScreen, type CollisionShape } from "./collision";
import { GateSwitchScreen, type GateSwitchShape } from "./gate-switch";
import { UnprovenScreen, type UnprovenShape } from "./unproven";
import { ALBUM, PEOPLE, METER } from "./fixtures";
import { SCREENS, type ScreenId, screenOf } from "./page-parts";
import { GUEST_VERIFY } from "./spec";

/**
 * THE PREVIEWS, AND NOTHING ELSE: every option is the guest's screen, the
 * host's sheet or queue, or the stage the two of them run through, wearing
 * exactly one thing changed.
 *
 * ★ EVERY CAPTION READS THE LAID-OUT DOM, and that is a standing lab rule with
 * a scar behind it (docs/PROGRAM.md): a board once drew an option with its
 * formula's sign backwards, and the tile Will judged showed the opposite of the
 * words he picked. Round one of THIS board hit the milder version of the same
 * thing and wrote it down: a caption that counted deadline chips returned zero
 * on the one answer whose guest tile said "6 days left" in the same frame. So
 * nothing below describes what the code is supposed to do. `address` COUNTS the
 * unproven strings actually drawn; `allowance` READS the meter's own width;
 * `unproven` COUNTS the labelled people and the tiles in the album;
 * `gate-switch` COUNTS the rows on the sheet and the tiles a signed-out visitor
 * gets. If the words above a frame and the caption under it ever disagree, the
 * caption is the truth.
 */

/* -- the measurement ------------------------------------------------------ */

type Reader = (root: HTMLElement, win: Window) => string | null;

/**
 * Reads one fact out of the frame's own document, watched with THAT window's
 * ResizeObserver plus two late passes for photographs still decoding at layout
 * time.
 *
 * ★ `deps` RE-ARMS THE WATCH (the `guest-shape` and `profile-page` finding,
 * inherited rather than rediscovered). A ResizeObserver fires on a LAYOUT
 * change, and several knobs here change what is TRUE inside an already-mounted
 * frame without resizing anything: flipping `address` on the `collision` step
 * changes whether the answer is reachable, not the layout. The SHAPE itself is
 * a dep too, because the step swaps one option's tree for another's at the SAME
 * slot and `Screen` never remounts on its own.
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

/* -- 1. a typed address --------------------------------------------------- */

const ADDRESS_CAPTION: Record<AddressShape, string> = {
  none: "The door asks a name. No address is typed anywhere a code does not prove it.",
  private:
    "The address is kept beside the session, shown to the host as typed, never to a guest.",
  public:
    "Whatever a guest types is their public credit in the album, wearing the mark.",
};

/**
 * THE COST, COUNTED RATHER THAN CLAIMED: how many places on these three
 * surfaces show a string that nobody proved, and whether the door took one.
 */
const addressRead: Reader = (root) => {
  const door = root.querySelector<HTMLElement>("[data-gv-strings]");
  if (!door) return null;
  const typed = door.dataset.gvStrings === "1";
  const slots = root.querySelectorAll("[data-gv-claimed]").length;
  return `Measured: the door takes ${typed ? "one address" : "no address"}; ${slots} place${slots === 1 ? "" : "s"} on these surfaces show a string nobody proved.`;
};

function addressScreen(shape: AddressShape, s: BoardState) {
  const screen = screenFor(s);
  return (
    <Screen
      id={`address-${shape}`}
      screen={screen}
      read={addressRead}
      deps={[shape, screen]}
      caption={ADDRESS_CAPTION[shape]}
    >
      <AddressScreen shape={shape} screen={screen} />
    </Screen>
  );
}

/* -- 2. the allowance ----------------------------------------------------- */

const ALLOWANCE_CAPTION: Record<AllowanceShape, string> = {
  handful:
    "Ten photographs a session, then one tap. The bound scales with the guest list.",
  budget:
    "A pool the whole event shares, and a control the host has to find mid-party.",
  open: "No bound anywhere, and the host's month is what pays for a stranger.",
};

/** What the guest is told, and what the host's month actually reads. */
const allowanceRead: Reader = (root) => {
  const meter = root.querySelector<HTMLElement>("[data-gv-meter]");
  const stop = root.querySelector<HTMLElement>("[data-gv-guest-stop]");
  if (!meter || !stop) return null;
  const spent = Number(meter.dataset.gvSpent ?? "0");
  const pct = Math.round((spent / METER.freeMonthlyGb) * 100);
  const told = stop.dataset.gvGuestStop;
  return `Measured: the guest is ${told === "never" ? "never stopped" : `stopped by the ${told}`}; the host's month reads ${spent} GB of ${METER.freeMonthlyGb}, which is ${pct} percent, and none of it comes back.`;
};

function allowanceScreen(shape: AllowanceShape, s: BoardState) {
  const screen = screenFor(s);
  return (
    <Screen
      id={`allowance-${shape}`}
      screen={screen}
      read={allowanceRead}
      deps={[shape, screen]}
      caption={ALLOWANCE_CAPTION[shape]}
    >
      <AllowanceScreen shape={shape} screen={screen} />
    </Screen>
  );
}

/* -- 3. what a guest sees ------------------------------------------------- */

const UNPROVEN_CAPTION: Record<UnprovenShape, string> = {
  "shown-marked":
    "Both of his rulings drawn: in the album at once, and marked on all three surfaces.",
  "shown-plain":
    "In the album at once, and no guest-facing surface says an address went unproven.",
  held: "Nothing unproven reaches a guest. This is the one answer that changes gate=after.",
};

/**
 * HOW MANY OF THE TWENTY-THREE ARE LABELLED ON A GUEST'S SCREEN, and how many
 * unproven photographs are in the album they are standing in. Both counted off
 * the frame, because the second is exactly what makes the first mean anything:
 * a mark beside photographs nobody can see is a different object entirely.
 */
const unprovenRead: Reader = (root) => {
  const guest = root.querySelector<HTMLElement>("[data-gv-guest]");
  const album = root.querySelector<HTMLElement>("[data-gv-album]");
  if (!guest || !album) return null;
  const faces = guest.querySelectorAll("[data-media-tile], [data-gv-unproven]");
  const labelled = guest.querySelectorAll("[data-gv-unproven]").length;
  // ★ COUNTED OFF THE DRAWN ALBUM, never off the fixture. The first pass said
  // "4 of the album's 25" beside a frame holding 16, which is the caption
  // lying about the picture under it, and it is the one failure this board's
  // captions exist to prevent.
  const tiles = album.querySelectorAll("[data-media-tile]").length;
  const marks = album.querySelectorAll("[data-gv-tile-mark]").length;
  const waiting = root.querySelector<HTMLElement>("[data-gv-waiting]");
  return `Measured: ${labelled} of the ${faces.length ? Math.min(6, PEOPLE.length) : 0} faces on screen wear the mark; ${marks} of the album's ${tiles} tiles are marked${waiting ? `, and ${waiting.dataset.gvWaiting} more are waiting where no guest can see them` : ""}.`;
};

function unprovenScreen(shape: UnprovenShape, s: BoardState) {
  const screen = screenFor(s);
  return (
    <Screen
      id={`unproven-${shape}`}
      screen={screen}
      read={unprovenRead}
      deps={[shape, screen]}
      caption={UNPROVEN_CAPTION[shape]}
    >
      <UnprovenScreen shape={shape} screen={screen} />
    </Screen>
  );
}

/* -- 4. the returning guest ----------------------------------------------- */

const COLLISION_CAPTION: Record<CollisionShape, string> = {
  offer:
    "The same sentence for everybody after the first photo, so it tells a stranger nothing.",
  label:
    "Silent. The merge happens on this phone one day, or on no phone ever.",
  require:
    "The door says the account exists, which is the fact every other door withholds.",
};

/** What the door gave away, and how much of his stage is already settled. */
const collisionRead: Reader = (root) => {
  const door = root.querySelector<HTMLElement>("[data-gv-door]");
  if (!door) return null;
  const kind = door.dataset.gvDoor;
  const settled = root.querySelectorAll("[data-gv-case]").length;
  const oracle = kind === "require";
  return `Measured: the door tells a stranger ${oracle ? "that this address has an account here" : "nothing about who exists"}; ${settled} cases are drawn beside it as fact, and none of them is a question on this board.`;
};

function collisionScreen(shape: CollisionShape, s: BoardState) {
  const screen = screenFor(s);
  const address = addressOf(s.address);
  const world =
    address === "none" && shape !== "offer"
      ? "Under the address answer on the dock, this one cannot be built at all."
      : address === "none"
        ? "Under the address answer on the dock, this is the only shape the question can take."
        : "A typed address exists on the dock, so all three can be built.";
  return (
    <Screen
      id={`collision-${shape}`}
      screen={screen}
      read={collisionRead}
      deps={[shape, screen, address]}
      caption={`${COLLISION_CAPTION[shape]} ${world}`}
    >
      <CollisionScreen shape={shape} screen={screen} address={address} />
    </Screen>
  );
}

/* -- 5. the host's switch ------------------------------------------------- */

const GATE_SWITCH_CAPTION: Record<GateSwitchShape, string> = {
  two: "Both jobs named apart, and a host can block an upload on a mail again.",
  one: "The job it was really doing. Adding is open under the allowance.",
  none: "No identity gate anywhere, and every album already gated this way opens.",
};

/** The rows on the sheet, and what a signed-out visitor actually gets. */
const gateSwitchRead: Reader = (root) => {
  const said = root.querySelector<HTMLElement>("[data-gv-rows]");
  if (!said) return null;
  const rows = said.dataset.gvRows;
  const gated = Boolean(root.querySelector("[data-gv-teaser]"));
  const tiles = root.querySelectorAll("[data-media-tile]").length;
  return `Measured: ${rows} row${rows === "1" ? "" : "s"} on the sheet; a signed-out visitor gets ${gated ? `a teaser of ${tiles}` : `all ${tiles} on screen`} of the album's ${ALBUM.length}.`;
};

function gateSwitchScreen(shape: GateSwitchShape, s: BoardState) {
  const screen = screenFor(s);
  return (
    <Screen
      id={`gate-switch-${shape}`}
      screen={screen}
      read={gateSwitchRead}
      deps={[shape, screen]}
      caption={GATE_SWITCH_CAPTION[shape]}
    >
      <GateSwitchScreen shape={shape} screen={screen} />
    </Screen>
  );
}

/* -- the map the step draws from ------------------------------------------ */

const PREVIEWS: PreviewsFor<typeof GUEST_VERIFY> = {
  "address.none": (s) => addressScreen("none", s),
  "address.private": (s) => addressScreen("private", s),
  "address.public": (s) => addressScreen("public", s),

  "allowance.handful": (s) => allowanceScreen("handful", s),
  "allowance.budget": (s) => allowanceScreen("budget", s),
  "allowance.open": (s) => allowanceScreen("open", s),

  "unproven.shown-marked": (s) => unprovenScreen("shown-marked", s),
  "unproven.shown-plain": (s) => unprovenScreen("shown-plain", s),
  "unproven.held": (s) => unprovenScreen("held", s),

  "collision.offer": (s) => collisionScreen("offer", s),
  "collision.label": (s) => collisionScreen("label", s),
  "collision.require": (s) => collisionScreen("require", s),

  "gate-switch.two": (s) => gateSwitchScreen("two", s),
  "gate-switch.one": (s) => gateSwitchScreen("one", s),
  "gate-switch.none": (s) => gateSwitchScreen("none", s),
};

export function GuestVerifyBoard() {
  return <ExplorationBoard spec={GUEST_VERIFY} previews={PREVIEWS} />;
}
