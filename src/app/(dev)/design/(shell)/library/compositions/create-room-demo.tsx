"use client";

import {
  type ComponentProps,
  type MouseEvent,
  useEffect,
  useState,
} from "react";
import { RotateCcw } from "lucide-react";

import { CreateEventWizard } from "@/components/app/create-event-wizard";
import { forgetJustMade } from "@/components/app/create-event-wizard/just-made";
import { Button } from "@/components/ui/button";
import { Frame } from "@/components/lab";
import { DEFAULT_QR_PRESET } from "@/lib/constants/qr-presets";

import { FitToWell } from "../device-frames";

/**
 * CREATE'S WHOLE ROOM, PRESSED THROUGH WITH NO SESSION (the Library's composition of `create-event-wizard.tsx`).
 *
 * The real wizard, handed the stand-in its `create` prop was made for: every screen is the room production draws (the
 * name, the album's style with its night, the code's look, the beat and the door at the plan's limit), and Create event
 * answers after a round trip's wait with an event that was never written. So a reviewer can type a name, watch it rise
 * into the head, pick a style, press Create event and watch the code develop, which localhost cannot reach signed in.
 *
 * ★ IT STANDS IN A FRAME OF ITS OWN (`Frame`, the lab's real viewport), NEVER IN A DIV. Create is the whole screen: it is
 * `fixed`, its type ladder is a `vw` clamp, its layout is a breakpoint, and the carry flies her words in viewport
 * coordinates. A div would draw the browser's width, and a transformed one (the way `WhatStaysDemo` holds a fixed foot)
 * would shift every flight by the frame's own offset. A same-origin frame at a device's size reads its own width and
 * height, so the room is what a host meets at 375 and at 1440, and the frame swallows every link, so the close and Print
 * go nowhere.
 *
 * ★ TWO PRESSES THAT LEAVE THROUGH THE ROUTER ARE HELD HERE (`HELD`): Go to your event pushes into her event through
 * the router (the room opening into it) and See Pro opens the plans' sheet, whose Checkout is a real door. Both are
 * marked for the analytics' listener (`data-track-cta`), so the hold names them by what they are and a press does
 * nothing; nothing else in the room is held.
 *
 * ★ THE ROOM NEVER TAKES THE PAGE'S FOCUS WHEN IT OPENS. The name's field is `autoFocus`: the moment a frame mounts, as
 * the reader scrolls toward it, it would take the Library's keyboard focus (and raise a phone's keyboard, and scroll the
 * page to it in the browsers that follow focus out of a frame). So the first mount of a scene stands `inert` for its
 * first commit; a press of Start again, which the reader just made beside the frame, takes the field as production does.
 *
 * ★ IT LEAVES NOTHING IN THE TAB. Create flags the event it made for the dashboard's lamp (`rememberJustMade`, in
 * `sessionStorage`); the scene takes the flag back when it goes, so a Library visit never names an event a stage would
 * wait to light.
 */

/** A real viewport per screen: the phone and the laptop the room is judged at (the create-wizard board's own two). */
export const CREATE_SCREENS = {
  phone: { w: 375, h: 812 },
  desk: { w: 1440, h: 900 },
} as const;

export type CreateScreen = keyof typeof CREATE_SCREENS;

/** A round trip's wait before the stand-in event answers, long enough for the sample to be seen developing. */
export const CREATE_MS = 1100;

/** The stand-in event's id and link token (32 hex, as the database writes one). The event they name does not exist. */
const EVENT_ID = "library-create-room";
const TOKEN = "7f3a9c2e5b8d4f1a9e6c3b7d2a5f8e1c";

type Create = NonNullable<ComponentProps<typeof CreateEventWizard>["create"]>;

/**
 * The wizard's `create`, answering as the Server Action does with nothing behind it: the event Create would have made,
 * wearing her name and her look, after a round trip. Nothing is written, fetched or posted.
 */
export const standInCreate: Create = (input) =>
  new Promise((resolve) => {
    setTimeout(
      () =>
        resolve({
          ok: true,
          event: {
            id: EVENT_ID,
            name: input.name,
            qr_token: TOKEN,
            qr_style: input.qr_style ?? DEFAULT_QR_PRESET,
          },
        }),
      CREATE_MS,
    );
  });

/** The events holding a Free host's one slot, as the door names them. */
const CAPPED = [{ id: "library-maya-jay", name: "Maya & Jay's Wedding" }];

/** What would leave the room for the app: Go to your event (into the hub) and See Pro (the plans' sheet). */
const HELD = '[data-track-cta="go-to-event"], [data-track-cta="upgrade"]';

function hold(event: MouseEvent) {
  if ((event.target as Element | null)?.closest?.(HELD)) {
    event.preventDefault();
    event.stopPropagation();
  }
}

/** The room itself, in whatever document it is drawn: the real wizard over the stand-in, its two leaving presses held. */
export function CreateRoomScene({
  atCap = false,
  takesFocus = true,
}: {
  /** The Free host's door: the refusal before the work. */
  atCap?: boolean;
  /** Whether the room may take focus as it opens (the name's field is `autoFocus`). */
  takesFocus?: boolean;
}) {
  const [held, setHeld] = useState(!takesFocus);
  useEffect(() => {
    // After the commit that mounted the field, where `autoFocus` has already come to nothing.
    const timer = window.setTimeout(() => setHeld(false), 0);
    return () => window.clearTimeout(timer);
  }, []);
  // Create flags the event it made for a dashboard's lamp; none will ever draw this one.
  useEffect(() => () => forgetJustMade(EVENT_ID), []);
  return (
    <div onClickCapture={hold} inert={held} className="contents">
      <CreateEventWizard
        siteUrl="https://partyreel.com"
        planName="Free"
        tier="free"
        atCap={atCap}
        maxEvents={1}
        cappedEvents={atCap ? CAPPED : []}
        // Under the threshold where the beat says room is running short: that line's way on is the plans' sheet.
        storagePct={12}
        create={standInCreate}
      />
    </div>
  );
}

/**
 * Create's room at a device's size, with a way to play it again from its name (the room has no way back from its beat,
 * and a held press leaves nowhere to go).
 */
export function CreateRoomDemo({
  screen = "phone",
  atCap = false,
}: {
  screen?: CreateScreen;
  atCap?: boolean;
}) {
  const { w, h } = CREATE_SCREENS[screen];
  // A press of Start again remounts the room: the scene's key is the run.
  const [run, setRun] = useState(0);
  return (
    <div data-library-demo="create-room" className="space-y-3">
      <FitToWell w={w}>
        <Frame
          id={`create-room-${screen}${atCap ? "-door" : ""}`}
          w={w}
          h={h}
          title={`${w} by ${h}`}
          caption="A real viewport: the room is the whole screen, as it is at /dashboard/new."
          onApproach
        >
          <CreateRoomScene key={run} atCap={atCap} takesFocus={run > 0} />
        </Frame>
      </FitToWell>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setRun((n) => n + 1)}
        >
          <RotateCcw /> Start again
        </Button>
        <p className="text-caption text-muted-foreground">
          {atCap
            ? "See Pro and the close are held: they go nowhere here."
            : "Go to your event and the close are held: they go nowhere here."}
        </p>
      </div>
    </div>
  );
}
