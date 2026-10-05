"use client";

import {
  type ReactNode,
  useEffect,
  useState,
  useSyncExternalStore,
} from "react";

import { CANVAS, Fit, Frame } from "@/components/lab";

import {
  type Choice,
  type GroundId,
  isReading,
  isSheet,
  type MomentId,
  OPTIONS,
  type PageNo,
  sceneSrc,
  type ViewId,
  type Width,
} from "./model";

/**
 * THE BOARD'S FRAMES: each one the scene route (`scene/page.tsx`) loaded in
 * the kit's `Frame` at a real 1440 or 375 viewport, so production's popups,
 * toasts and breakpoints all answer to the frame's own window.
 *
 * ★ THE CAPTION IS READ OFF THE FRAME. The scene measures its own document
 * (`scene/reading.ts`) and posts what it read; the frame prints that, never
 * the option's words. If the two disagree, the caption is the truth.
 */

/** The lab's key, as the page was opened with it (null in an open local dev). */
function useLabKey(): string | null | undefined {
  return useSyncExternalStore(
    () => () => {},
    () => new URLSearchParams(window.location.search).get("key"),
    () => undefined,
  );
}

/**
 * A frame's viewport: a laptop's canvas and a phone's. A desk's atom sheet
 * ends above a laptop's fold, so its frame stops there (the stage draws it
 * larger); a phone is an iPhone's whole 812.
 */
const DESK_SHEET_H = 820;
const PHONE_H = 812;
function heightOf(view: ViewId, w: Width): number {
  if (w === 375) return PHONE_H;
  return isSheet(view) ? DESK_SHEET_H : CANVAS.desktop.h;
}

/** A frame's id: every fact it draws, so two frames never answer for each other. */
function frameId(
  choice: Choice,
  view: ViewId,
  moment: MomentId,
  w: Width,
  ground: GroundId,
  page: PageNo,
): string {
  const mix = (Object.keys(OPTIONS) as (keyof Choice)[]).map((k) => choice[k]);
  return ["identity", view, moment, w, ground, page, ...mix].join("-");
}

/** One frame: a mix's view at a width, caught in a moment, captioned by what it read. */
export function SceneFrame({
  choice,
  view,
  moment,
  w,
  ground,
  page = 1,
  title,
}: {
  choice: Choice;
  view: ViewId;
  moment: MomentId;
  w: Width;
  ground: GroundId;
  page?: PageNo;
  title: string;
}) {
  const key = useLabKey();
  const id = frameId(choice, view, moment, w, ground, page);
  const [caption, setCaption] = useState("reading the frame");
  useEffect(() => {
    const hear = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (isReading(event.data) && event.data.id === id)
        setCaption(event.data.text);
    };
    window.addEventListener("message", hear);
    return () => window.removeEventListener("message", hear);
  }, [id]);
  return (
    <Fit w={w}>
      <Frame
        id={id}
        src={sceneSrc({ ...choice, view, moment, w, ground, page, id }, key)}
        gated
        w={w}
        h={heightOf(view, w)}
        title={title}
        caption={caption}
        onApproach
      />
    </Fit>
  );
}

/** Frames side by side, wrapping when the room runs out. */
export function Story({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-start gap-6">{children}</div>;
}

const GROUND_NAME: Record<GroundId, string> = {
  paper: "on paper",
  room: "in the room",
};

/**
 * AN OPTION, DRAWN: one view at the width the knobs hold, on each ground
 * asked for, side by side. A desk's sheet holds both grounds in one frame; a
 * phone's sheet is two phone pages a ground. A screen that is the room in
 * both themes (Create) is drawn once. A press is drawn beside its key at rest
 * (`beside`), each ground a pair: a still shows a press only against the
 * instant before it.
 */
export function OptionFrames({
  choice,
  view,
  moment,
  what,
  w,
  grounds,
  name,
  beside,
}: {
  choice: Choice;
  view: ViewId;
  moment: MomentId;
  /** What the view is, in words, for the frame's title. */
  what: string;
  w: Width;
  grounds: readonly GroundId[];
  name: string;
  /** A moment drawn before each frame on the same ground, and what it is called. */
  beside?: { moment: MomentId; words: string; held: string };
}) {
  const frame = (
    g: GroundId,
    words: string,
    page: PageNo = 1,
    at: MomentId = moment,
  ) => (
    <SceneFrame
      key={`${view}-${g}-${page}-${at}`}
      choice={choice}
      view={view}
      moment={at}
      w={w}
      ground={g}
      page={page}
      title={`${name}: ${words}`}
    />
  );
  if (isSheet(view))
    return (
      <Story>
        {w === 1440
          ? frame("room", `${what}, on paper and in the room`)
          : grounds.flatMap((g) =>
              ([1, 2] as const).map((p) =>
                frame(g, `${what}, ${p} of 2, ${GROUND_NAME[g]}`, p),
              ),
            )}
      </Story>
    );
  // Create is a room of its own in both themes: one frame says it.
  const on: readonly GroundId[] = view === "create" ? ["room"] : grounds;
  const called = (g: GroundId) =>
    view === "create" ? what : `${what}, ${GROUND_NAME[g]}`;
  return (
    <Story>
      {on.flatMap((g) =>
        beside
          ? [
              frame(g, `${called(g)}, ${beside.words}`, 1, beside.moment),
              frame(g, `${called(g)}, ${beside.held}`),
            ]
          : [frame(g, called(g))],
      )}
    </Story>
  );
}
