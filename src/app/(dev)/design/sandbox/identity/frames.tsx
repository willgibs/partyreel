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
 * A frame's viewport: a laptop's canvas and a phone's. A desk's sheet ends
 * above a laptop's fold, so its frame stops there (the stage draws it larger);
 * a phone is an iPhone's whole 812.
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
  return [
    "identity",
    view,
    moment,
    w,
    ground,
    page,
    choice.set,
    choice.loading,
  ].join("-");
}

/** One frame: a set's view at a width, caught in a moment, captioned by what it read. */
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
 * AN OPTION, DRAWN: one or more views at the width the knobs hold, on each
 * ground asked for, side by side, a ground's views together (the composite is
 * two real screens a ground). A desk's sheet holds both grounds in one frame;
 * a phone's sheet of every state is two phone pages a ground (the working
 * sheet is one). A screen that is the room in both themes (Create) is drawn
 * once.
 */
export function OptionFrames({
  choice,
  views,
  moment,
  w,
  grounds,
  name,
}: {
  choice: Choice;
  /** The views, each with what it is called in words, for the frames' titles. */
  views: readonly { view: ViewId; what: string }[];
  moment: MomentId;
  w: Width;
  grounds: readonly GroundId[];
  name: string;
}) {
  const frame = (
    view: ViewId,
    g: GroundId,
    words: string,
    page: PageNo = 1,
  ) => (
    <SceneFrame
      key={`${view}-${g}-${page}`}
      choice={choice}
      view={view}
      moment={moment}
      w={w}
      ground={g}
      page={page}
      title={`${name}: ${words}`}
    />
  );
  const [first] = views;
  if (first && isSheet(first.view)) {
    const { view, what } = first;
    return (
      <Story>
        {w === 1440
          ? frame(view, "room", `${what}, on paper and in the room`)
          : view === "working"
            ? grounds.map((g) => frame(view, g, `${what}, ${GROUND_NAME[g]}`))
            : grounds.flatMap((g) =>
                ([1, 2] as const).map((p) =>
                  frame(view, g, `${what}, ${p} of 2, ${GROUND_NAME[g]}`, p),
                ),
              )}
      </Story>
    );
  }
  return (
    <Story>
      {grounds.flatMap((g) =>
        views
          // Create is a room of its own in both themes: one frame says it.
          .filter(({ view }) => view !== "create" || g === grounds[0])
          .map(({ view, what }) =>
            frame(
              view,
              view === "create" ? "room" : g,
              view === "create" ? what : `${what}, ${GROUND_NAME[g]}`,
            ),
          ),
      )}
    </Story>
  );
}
