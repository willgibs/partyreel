"use client";

import { useEffect } from "react";

import { exportToasts } from "@/components/app/export/export-toast";
import type {
  ToastAction,
  ToastView,
} from "@/components/app/export/export-walk";
import { Button } from "@/components/ui/button";
import { DONE_MS, WALK_COPY } from "@/lib/export/walk";

/**
 * THE DOWNLOAD'S TOAST, EVERY STATE, FIRED ON THE PAGE'S OWN TOASTER (`export-toast.tsx`; the walk that drives it is
 * `export-walk.ts`, the words are `lib/export/walk.ts`).
 *
 * ★ FIRED, NOT DRAWN. Sonner holds a toast only after a call, so no server render can carry one, and the toast's parts
 * (its x, its answers) are not exported to draw by hand. Each button hands the real `exportToasts` the view the walk
 * builds for that state, on the toaster the root layout mounts (top centre, under the header: look up, not at the
 * button), and a press replaces the last toast in place by its one id, as a walk does. The words are `WALK_COPY`'s and the
 * clocks `DONE_MS`'s, so a copy edit shows here by itself.
 *
 * ★ THE CONTROLS WALK, THE WALK DOES NOT RUN. The x, a question's answers and Try again move the fixture between the
 * states they lead to in production (Cancel asks, Keep going goes back, Cancel ends, Try again prepares again); nothing
 * is minted, fetched or posted, and no request leaves the page.
 */

const ID = "library-download";

const show = (view: ToastView) => exportToasts.show(ID, view);
const away = () => exportToasts.dismiss(ID);
const dismiss: ToastAction = { label: WALK_COPY.dismiss, run: away };
const tryAgain: ToastAction = {
  label: WALK_COPY.tryAgain,
  run: () => show(preparing()),
};

/* ── the states, as the walk builds them ────────────────────────────────────────────────────────── */

function preparing(): ToastView {
  return {
    tone: "wait",
    title: WALK_COPY.preparing,
    close: { label: WALK_COPY.cancel, run: () => show(askCancel()) },
  };
}

/** A cancel asks first (E6): Keep going is first, since it is what an unintended press means. */
function askCancel(): ToastView {
  return {
    tone: "confirm",
    title: WALK_COPY.askCancel,
    actions: [
      { label: WALK_COPY.keepGoing, run: () => show(preparing()) },
      { label: WALK_COPY.cancel, run: () => show(cancelled()) },
    ],
  };
}

/** Hers, so neutral and never an error: said once, with the way back. */
function cancelled(): ToastView {
  return {
    tone: "cancelled",
    title: WALK_COPY.cancelled,
    action: tryAgain,
    close: dismiss,
    duration: DONE_MS.cancelled,
  };
}

/** A dropped connection names itself, with what to do. */
function dropped(): ToastView {
  return {
    tone: "refused",
    title: WALK_COPY.dropped,
    detail: WALK_COPY.droppedDetail,
    action: tryAgain,
    close: dismiss,
  };
}

/** The zip is streaming and her own line has stopped answering: said under "Saving…", never left reading as if all were well. */
function lineLost(): ToastView {
  return {
    tone: "downloading",
    title: WALK_COPY.downloading("downloads"),
    detail: WALK_COPY.lost,
    close: dismiss,
  };
}

function onItsWay(): ToastView {
  return {
    tone: "downloading",
    title: WALK_COPY.downloading("downloads"),
    close: dismiss,
  };
}

function saved(): ToastView {
  return {
    tone: "done",
    title: WALK_COPY.saved("downloads"),
    duration: DONE_MS.one,
  };
}

/** A host's selection that mixes hidden and shown items asks first. */
function hiddenAsk(): ToastView {
  const hidden = 3;
  return {
    tone: "ask",
    title: WALK_COPY.hiddenAsk(hidden, 12),
    actions: [
      { label: WALK_COPY.includeHidden(hidden), run: () => show(preparing()) },
      { label: WALK_COPY.leaveHidden(hidden), run: () => show(preparing()) },
    ],
    close: { label: WALK_COPY.cancel, run: () => show(askCancel()) },
  };
}

/** A big album is a walk, one tap a part: this one is on its way and the next is a tap. */
function betweenParts(): ToastView {
  return {
    tone: "between",
    title: WALK_COPY.partStarted(1, 3),
    action: { label: WALK_COPY.nextPart(2), run: () => show(preparing()) },
    close: { label: WALK_COPY.stop, run: () => show(askStop()) },
  };
}

/** Stopping between parts leaves the rest of the album behind, so it says so before it does. */
function askStop(): ToastView {
  return {
    tone: "confirm",
    title: WALK_COPY.askStop(1, 3),
    detail: WALK_COPY.askStopDetail(2, 3),
    actions: [
      { label: WALK_COPY.keepGoing, run: () => show(betweenParts()) },
      { label: WALK_COPY.stopHere, run: () => show(stoppedAfter()) },
    ],
  };
}

/** Where she stopped, with the tap that takes the next part still there. */
function stoppedAfter(): ToastView {
  return {
    tone: "between",
    title: WALK_COPY.stoppedAfter(1, 3),
    action: { label: WALK_COPY.nextPart(2), run: () => show(preparing()) },
    close: dismiss,
  };
}

/** Handed over, short: the count, and a Try again for exactly what it missed. */
function short(): ToastView {
  return {
    tone: "short",
    title: WALK_COPY.short(11, 12),
    action: { label: WALK_COPY.retryMissing(1), run: () => show(preparing()) },
    close: dismiss,
  };
}

/** Nothing was handed over, and why. */
function refused(): ToastView {
  return {
    tone: "refused",
    title: WALK_COPY.failed,
    action: tryAgain,
    close: dismiss,
  };
}

/**
 * The buttons, grouped as a walk meets them: all nine of the toast's tones, among them the states the lanes asked to
 * see (the cancel question, a cancel, a dropped connection, a line lost mid-stream, the done state).
 */
const GROUPS: {
  group: string;
  states: { label: string; view: () => ToastView }[];
}[] = [
  {
    group: "Getting ready",
    states: [
      { label: "Preparing", view: preparing },
      { label: "The cancel question", view: askCancel },
      { label: "Hidden items", view: hiddenAsk },
    ],
  },
  {
    group: "On its way",
    states: [
      { label: "Saving", view: onItsWay },
      { label: "A line lost mid-stream", view: lineLost },
      { label: "Between parts", view: betweenParts },
      { label: "Stop after a part?", view: askStop },
    ],
  },
  {
    group: "How it ended",
    states: [
      { label: "Saved", view: saved },
      { label: "Cancelled", view: cancelled },
      { label: "A dropped connection", view: dropped },
      { label: "Some missing", view: short },
      { label: "Could not start", view: refused },
    ],
  },
];

export function DownloadToastDemo() {
  // The toaster lives in the root layout and outlasts this page: a held toast (a wait, a question) would follow her to
  // the next Library entry with its x, so it goes when the specimen does.
  useEffect(() => away, []);

  return (
    <div className="flex w-full flex-col gap-4">
      {GROUPS.map(({ group, states }) => (
        <div key={group} className="flex flex-col gap-2">
          <p className="text-caption text-muted-foreground">{group}</p>
          <div className="flex flex-wrap items-center gap-2">
            {states.map(({ label, view }) => (
              <Button
                key={label}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => show(view())}
              >
                {label}
              </Button>
            ))}
          </div>
        </div>
      ))}
      <div>
        <Button type="button" variant="ghost" size="sm" onClick={away}>
          Put it away
        </Button>
      </div>
    </div>
  );
}
