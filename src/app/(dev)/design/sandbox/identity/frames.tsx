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
 * larger); a phone's sheet is two phone pages, each a whole screen.
 */
const DESK_SHEET_H = 820;
/** A phone's whole screen (an iPhone's 812, as every phone frame on the board). */
const PHONE_H = 812;
function heightOf(view: ViewId, w: Width): number {
  if (w === 375) return PHONE_H;
  return isSheet(view) ? DESK_SHEET_H : CANVAS.desktop.h;
}

/** One frame: an identity's view at a width, captioned by what it read. */
export function SceneFrame({
  choice,
  view,
  w,
  ground,
  page = 1,
  title,
}: {
  choice: Choice;
  view: ViewId;
  w: Width;
  ground: GroundId;
  page?: PageNo;
  title: string;
}) {
  const key = useLabKey();
  const id = [
    "identity",
    view,
    w,
    ground,
    page,
    choice.system,
    choice.room,
    choice.edge,
  ].join("-");
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
        src={sceneSrc({ ...choice, view, w, ground, page, id }, key)}
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
 * AN OPTION, DRAWN: one view at the width and on the ground the knobs hold.
 * A sheet is paper and the room in one desk's frame, or two phone pages on
 * one ground; a screen is one frame.
 */
export function OptionFrames({
  choice,
  view,
  what,
  w,
  ground,
  name,
}: {
  choice: Choice;
  view: ViewId;
  /** What the view is, in words, for the frame's title. */
  what: string;
  w: Width;
  ground: GroundId;
  name: string;
}) {
  const frame = (g: GroundId, words: string, page: PageNo = 1) => (
    <SceneFrame
      key={`${view}-${g}-${page}`}
      choice={choice}
      view={view}
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
          ? frame(ground, `${what}, on paper and in the room`)
          : ([1, 2] as const).map((p) =>
              frame(ground, `${what}, ${p} of 2, ${GROUND_NAME[ground]}`, p),
            )}
      </Story>
    );
  return <Story>{frame(ground, `${what}, ${GROUND_NAME[ground]}`)}</Story>;
}
