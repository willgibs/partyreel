"use client";

import {
  type ReactNode,
  useEffect,
  useState,
  useSyncExternalStore,
} from "react";

import { CANVAS, Fit, Frame } from "@/components/lab";

import {
  type FamilyId,
  GROUPS,
  isReading,
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
 * A frame's viewport: a laptop's canvas and a phone's, except the hub, whose
 * head (the code, the rooms and tonight's checklist) ends well above a
 * laptop's fold: its frame stops there rather than drawing an empty album.
 */
function heightOf(view: ViewId, w: Width): number {
  if (w === 375) return 812;
  return view === "hub" ? 700 : CANVAS.desktop.h;
}

/** One frame: a family's view at a width, captioned by what it read. */
export function SceneFrame({
  family,
  view,
  w,
  title,
}: {
  family: FamilyId;
  view: ViewId;
  w: Width;
  title: string;
}) {
  const key = useLabKey();
  const id = `identity-${family}-${view}-${w}`;
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
        src={sceneSrc({ family, view, w, id }, key)}
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

const GROUP_NAME: Record<(typeof GROUPS)[number], string> = {
  actions: "actions",
  fields: "fields and selection",
  surfaces: "surfaces and layers",
  status: "status",
};

/** A family's specimen: one sheet at a desk, its four groups as phone pages. */
export function SpecimenFrames({
  family,
  name,
  w,
}: {
  family: FamilyId;
  name: string;
  w: Width;
}) {
  if (w === 1440)
    return (
      <Story>
        <SceneFrame
          family={family}
          view="specimen"
          w={1440}
          title={`${name}: the specimen`}
        />
      </Story>
    );
  return (
    <Story>
      {GROUPS.map((g) => (
        <SceneFrame
          key={g}
          family={family}
          view={g}
          w={375}
          title={`${name}: ${GROUP_NAME[g]}`}
        />
      ))}
    </Story>
  );
}

/** A family on the three real screens. */
export function ScreenFrames({
  family,
  name,
  w,
}: {
  family: FamilyId;
  name: string;
  w: Width;
}) {
  return (
    <Story>
      <SceneFrame
        family={family}
        view="hub"
        w={w}
        title={`${name}: the hub's head, tonight`}
      />
      <SceneFrame
        family={family}
        view="settings"
        w={w}
        title={`${name}: Settings, on the door`}
      />
      <SceneFrame
        family={family}
        view="add"
        w={w}
        title={`${name}: the guest's Add`}
      />
    </Story>
  );
}
