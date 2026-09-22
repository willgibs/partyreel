"use client";

import type { ReactNode } from "react";

import { ExplorationBoard } from "@/components/lab";
import type { BoardState } from "@/components/lab/board-spec";
import type { PreviewsFor } from "@/components/lab/exploration";
import { cn } from "@/lib/utils";

import { frameAt, type HoldId, perMinute, wallProps } from "./fixtures";
import {
  CornerChip,
  CornerCode,
  CornerName,
  HubLinkDoor,
  HubRowDoor,
  IdleCode,
  IdleInvite,
  IdleStills,
  Interstitial,
  LowerThird,
  ReviewHost,
  ReviewRoom,
  Scrim,
  SheetDoor,
  SideCode,
  StartCountdown,
  StartFrame,
  StartPlain,
  TitleBar,
  WallRoot,
} from "./parts";
import { REEL_SCREEN } from "./spec";
import { WallStill } from "./stills";
import {
  Desk,
  LiveWall,
  type ScreenId,
  screenOf,
  Wall,
} from "./wall";

/**
 * THE PREVIEWS, AND NOTHING ELSE.
 *
 * ★ EVERY WALL IS THE SAME WALL. A decision about the caption is drawn wearing
 * the code and the name he has already picked (`Preview` as a function of the
 * board's state), so nothing on this board is ever judged against a wall that
 * could not exist. Only the one thing each ask is about moves.
 *
 * ★ EVERY CAPTION IS READ OFF THE FRAME, NEVER ASSERTED. How wide the code is
 * as a share of the wall, how much of the picture the furniture covers, how
 * many words the plate says, how many photographs a pace gets through in a
 * minute: measured in the frame's own document, or read off the engine's own
 * plan. When the words above a frame and the number under it disagree, the
 * number is the truth.
 */

type Reader = (root: HTMLElement) => string | null;
const screen = (s: BoardState): ScreenId => screenOf(s.screen as string);

const pct = (part: number, whole: number) =>
  whole > 0 ? `${Math.round((part / whole) * 100)}%` : "0%";

/** The wall's own box, inside the frame, for every share this board reports. */
const wallBox = (root: HTMLElement): DOMRect | null =>
  root.querySelector<HTMLElement>("[data-rsc-wall]")?.getBoundingClientRect() ??
  null;

const wordsIn = (el: HTMLElement | null): number =>
  el ? ((el.innerText || "").trim().match(/\S+/g)?.length ?? 0) : 0;

/* ── the dressing every wall wears ───────────────────────────────────────── */

type QrId = "corner" | "panel" | "interstitial";
type NameId = "wordmark" | "bar" | "none";

const qrOf = (s: BoardState): QrId => (s.qr as QrId) ?? "corner";
const nameOf = (s: BoardState): NameId => (s.name as NameId) ?? "wordmark";

/**
 * ★ A PANEL TAKES ITS QUARTER OUT OF THE PICTURE, NOT OUT OF NOTHING. When the
 * code owns a column the reel is inset to the rest of the wall, which is the
 * real cost of that option and the thing the other two do not pay.
 *
 * ★ AND THE INTERSTITIAL IS ABSENT MOST OF THE TIME. On a decision that is not
 * about the code, `interstitial` draws the wall with NO code on it, because
 * that is what the wall looks like for all but a few seconds of every minute.
 */
function Picture({ qr, children }: { qr: QrId; children: ReactNode }) {
  return (
    <div className={cn("absolute inset-0", qr === "panel" && "right-[26%]")}>
      {children}
    </div>
  );
}

function Dressing({
  qr,
  name,
  top = false,
  bottom = false,
}: {
  qr: QrId;
  name: NameId;
  /** Something of this ask's own sits at the head, so the head needs its ground. */
  top?: boolean;
  /** The same at the foot. */
  bottom?: boolean;
}) {
  return (
    <>
      {/* ★ A SCRIM IS DRAWN FOR WHAT IS ACTUALLY THERE. An edge with nothing on
          it keeps the photograph at full strength, which is the only reason a
          wall is worth looking at. */}
      {name !== "none" || top ? <Scrim side="top" /> : null}
      {qr === "corner" || bottom ? <Scrim side="bottom" /> : null}
      {name === "wordmark" ? <CornerName /> : null}
      {name === "bar" ? <TitleBar /> : null}
      {qr === "corner" ? <CornerCode /> : null}
      {qr === "panel" ? <SideCode /> : null}
    </>
  );
}

/* ── qr: how much of the wall the invitation is worth ────────────────────── */

const measureQr: Reader = (root) => {
  const box = wallBox(root);
  const code = root.querySelector<HTMLElement>("[data-rsc-code]");
  if (!box || !code) return null;
  const c = code.getBoundingClientRect();
  const taken =
    root.querySelector<HTMLElement>('[data-rsc-qr="panel"]') ??
    root.querySelector<HTMLElement>('[data-rsc-qr="interstitial"]');
  const cost = taken
    ? pct(taken.getBoundingClientRect().width * taken.getBoundingClientRect().height, box.width * box.height)
    : "0%";
  return `Measured: the code is ${pct(c.width, box.width)} of the wall's width, and the invitation covers ${cost} of the picture.`;
};

function qrScene(id: QrId, s: BoardState) {
  const name = nameOf(s);
  return (
    <Wall id={`qr-${id}`} screen={screen(s)} title="The code" measure={measureQr}>
      <WallRoot>
        <Picture qr={id}>
          <WallStill id="now" label="The reel, on the wall" />
        </Picture>
        <Dressing qr={id} name={name} />
        {id === "interstitial" ? <Interstitial /> : null}
      </WallRoot>
    </Wall>
  );
}

/* ── name: what the chrome costs the picture ─────────────────────────────── */

const measureName: Reader = (root) => {
  const box = wallBox(root);
  if (!box) return null;
  const mark = root.querySelector<HTMLElement>("[data-rsc-name]");
  if (!mark) return "Measured: no words on the wall but the ones beside the code.";
  const m = mark.getBoundingClientRect();
  const title = mark.querySelector<HTMLElement>("p");
  const size = title ? Math.round(parseFloat(getComputedStyle(title).fontSize)) : 0;
  return `Measured: the name is set at ${size}px and its block covers ${pct(m.height, box.height)} of the wall's height.`;
};

function nameScene(id: NameId, s: BoardState) {
  const qr = qrOf(s);
  return (
    <Wall
      id={`name-${id}`}
      screen={screen(s)}
      title="The event's name"
      measure={measureName}
    >
      <WallRoot>
        <Picture qr={qr}>
          <WallStill id="now" label="The reel, on the wall" />
        </Picture>
        <Dressing qr={qr} name={id} />
      </WallRoot>
    </Wall>
  );
}

/* ── caption: the credit, and what it costs the photograph ───────────────── */

const measureCaption: Reader = (root) => {
  const box = wallBox(root);
  if (!box) return null;
  const beat = root.querySelector<HTMLElement>("[data-rsc-caption]");
  if (!beat)
    return "Measured: nothing is said. The photograph arrives in the loop and the wall carries on.";
  const b = beat.getBoundingClientRect();
  const words = (beat.innerText || "").trim().replace(/\s+/g, " ");
  return `Measured: "${words}", covering ${pct(b.width * b.height, box.width * box.height)} of the picture for one hold.`;
};

function captionScene(id: "lower-third" | "chip" | "none", s: BoardState) {
  const qr = qrOf(s);
  const name = nameOf(s);
  return (
    <Wall
      id={`caption-${id}`}
      screen={screen(s)}
      title="The just-added beat"
      measure={measureCaption}
    >
      <WallRoot>
        <Picture qr={qr}>
          <WallStill id="fresh" label="The photograph that just landed" />
        </Picture>
        <Dressing
          qr={qr}
          name={name}
          top={id === "chip"}
          bottom={id === "lower-third"}
        />
        {id === "lower-third" ? <LowerThird /> : null}
        {id === "chip" ? <CornerChip underBar={name === "bar"} /> : null}
      </WallRoot>
    </Wall>
  );
}

/* ── pacing: three real takes, running ───────────────────────────────────── */

/**
 * ★ THE ONE DECISION THAT RUNS. A hold is not a picture, it is a duration, so
 * these three are the engine on a rAF clock at three paces (`wall.tsx`). Under
 * reduced motion each one scrub-locks to the frame its pace is ACTUALLY ON at
 * the same wall-clock second, so the three stay three different photographs
 * rather than three copies of frame zero.
 */
function pacingScene(id: HoldId, s: BoardState) {
  const qr = qrOf(s);
  const name = nameOf(s);
  const props = wallProps({ hold: id });
  const holdAt = frameAt(26, id) / 24;
  const per = perMinute(id);
  return (
    <Wall
      id={`pacing-${id}`}
      screen={screen(s)}
      title="The wall's pace"
      caption={`Read off the engine's own plan: ${per} photographs a minute, ${props.clips.length} in the loop. Reduced motion holds the frame this pace is on at 26 seconds.`}
    >
      <WallRoot>
        <Picture qr={qr}>
          <LiveWall reelProps={props} holdAt={holdAt} />
        </Picture>
        <Dressing qr={qr} name={name} />
      </WallRoot>
    </Wall>
  );
}

/* ── idle: the wall before the reel ──────────────────────────────────────── */

const measureIdle: Reader = (root) => {
  const box = wallBox(root);
  const code = root.querySelector<HTMLElement>("[data-rsc-code]");
  if (!box || !code) return null;
  const c = code.getBoundingClientRect();
  const line = root.querySelector<HTMLElement>("[data-rsc-idle-line]");
  const said = (line?.innerText || "").trim().replace(/\s+/g, " ");
  return `Measured: the code is ${pct(c.width, box.width)} of the wall's width, and the wall reads "${said}".`;
};

function idleScene(id: "invite" | "code" | "stills", s: BoardState) {
  const body =
    id === "invite" ? <IdleInvite /> : id === "code" ? <IdleCode /> : <IdleStills />;
  return (
    <Wall
      id={`idle-${id}`}
      screen={screen(s)}
      title="Before it begins"
      measure={measureIdle}
    >
      <WallRoot>{body}</WallRoot>
    </Wall>
  );
}

/* ── start: the gesture the browser insists on ───────────────────────────── */

const measureStart: Reader = (root) => {
  const plate = root.querySelector<HTMLElement>("[data-rsc-start]");
  if (!plate) return null;
  const words = wordsIn(plate);
  const behind = plate.querySelector("[data-rsc-still] img") ? "the reel behind it" : "nothing behind it";
  const press = root.querySelector<HTMLElement>("[data-rsc-start-button]");
  const p = press?.getBoundingClientRect();
  const size = p ? `${Math.round(p.width)} by ${Math.round(p.height)}px` : "no press target";
  return `Measured: ${words} words on the plate, ${behind}, and a press target of ${size}.`;
};

function startScene(id: "button" | "frame" | "countdown", s: BoardState) {
  const body =
    id === "button" ? (
      <StartPlain />
    ) : id === "frame" ? (
      <StartFrame />
    ) : (
      <StartCountdown />
    );
  return (
    <Wall
      id={`start-${id}`}
      screen={screen(s)}
      title="The Start plate"
      measure={measureStart}
    >
      <WallRoot>{body}</WallRoot>
    </Wall>
  );
}

/* ── review: who a queue is said to ──────────────────────────────────────── */

const measureReview: Reader = (root) => {
  const said = root.querySelector<HTMLElement>("[data-rsc-review]");
  if (!said)
    return "Measured: the wall says nothing about the queue. Review stays on the host's phone.";
  const who = said.dataset.rscReview === "host" ? "the host alone" : "the whole room";
  const words = (said.innerText || "").trim().replace(/\s+/g, " ");
  return `Measured: "${words}", placed for ${who}.`;
};

function reviewScene(id: "host" | "room" | "none", s: BoardState) {
  const qr = qrOf(s);
  const name = nameOf(s);
  return (
    <Wall
      id={`review-${id}`}
      screen={screen(s)}
      title="Review on the wall"
      measure={measureReview}
    >
      <WallRoot>
        <Picture qr={qr}>
          <WallStill id="now" label="The reel, on the wall" />
        </Picture>
        <Dressing qr={qr} name={name} bottom={id !== "none"} />
        {id === "host" ? <ReviewHost /> : null}
        {id === "room" ? <ReviewRoom /> : null}
      </WallRoot>
    </Wall>
  );
}

/* ── open: the host's own laptop, which is not a wall ────────────────────── */

const measureOpen: Reader = (root) => {
  const door = root.querySelector<HTMLElement>("[data-rsc-door]");
  const later = root.querySelector<HTMLElement>("[data-rsc-door-later]");
  const line = root.querySelector<HTMLElement>("[data-rsc-door-line]");
  const said = (line?.innerText || "").trim().replace(/\s+/g, " ");
  const cut = said.length > 78 ? `${said.slice(0, 78)}...` : said;
  const where =
    door?.dataset.rscDoor === "sheet"
      ? "inside the settings sheet, past one more tap"
      : "on the hub itself, in reach at once";
  return `Measured: the door sits ${where}${later ? ", with a second way drawn as later work" : ""}, under "${cut}"`;
};

function openScene(id: "hub" | "link" | "sheet", s: BoardState) {
  const body =
    id === "hub" ? <HubRowDoor /> : id === "link" ? <HubLinkDoor /> : <SheetDoor />;
  return (
    <Desk
      id={`open-${id}`}
      screen={screen(s)}
      title="The way in"
      measure={measureOpen}
    >
      {body}
    </Desk>
  );
}

/* ── the map the step draws from ─────────────────────────────────────────── */

const PREVIEWS: PreviewsFor<typeof REEL_SCREEN> = {
  "qr.corner": (s) => qrScene("corner", s),
  "qr.panel": (s) => qrScene("panel", s),
  "qr.interstitial": (s) => qrScene("interstitial", s),

  "name.wordmark": (s) => nameScene("wordmark", s),
  "name.bar": (s) => nameScene("bar", s),
  "name.none": (s) => nameScene("none", s),

  "caption.lower-third": (s) => captionScene("lower-third", s),
  "caption.chip": (s) => captionScene("chip", s),
  "caption.none": (s) => captionScene("none", s),

  "pacing.brisk": (s) => pacingScene("brisk", s),
  "pacing.wall": (s) => pacingScene("wall", s),
  "pacing.slow": (s) => pacingScene("slow", s),

  "idle.invite": (s) => idleScene("invite", s),
  "idle.code": (s) => idleScene("code", s),
  "idle.stills": (s) => idleScene("stills", s),

  "start.button": (s) => startScene("button", s),
  "start.frame": (s) => startScene("frame", s),
  "start.countdown": (s) => startScene("countdown", s),

  "review.host": (s) => reviewScene("host", s),
  "review.room": (s) => reviewScene("room", s),
  "review.none": (s) => reviewScene("none", s),

  "open.hub": (s) => openScene("hub", s),
  "open.link": (s) => openScene("link", s),
  "open.sheet": (s) => openScene("sheet", s),
};

export function ReelScreenBoard() {
  return <ExplorationBoard spec={REEL_SCREEN} previews={PREVIEWS} />;
}
