"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Clock } from "lucide-react";

import { DoorWords } from "@/components/guest/door/door-page";
import { StageGlyph } from "@/components/guest/door/stage";
import { switchEmail } from "@/components/guest/door/switch-email";
import { WaitPicks, type WaitPick } from "@/components/guest/door/wait-picks";
import {
  doorOwner,
  forgetHeldPicks,
  keepHeldPicks,
  readHeldPicks,
} from "@/components/guest/door/wait-picks-store";
import { Button } from "@/components/ui/button";
import { checkInAtDoor } from "@/lib/guest/join";

/**
 * HOW OFTEN THE HELD DOOR CHECKS IN (the brief: "about every 30 s"), and again the moment the tab
 * comes back into view. Each check-in stamps her waiting rows, so the banked let-in mail can later tell
 * whether she is still at the door or left; no mail sends from here.
 */
export const WAITING_CHECK_IN_MS = 30_000;

/**
 * THE HELD DOOR'S WORDS (event-settings r1, `waiting=held`: "The door she confirmed in says Maya will
 * let her in, and opens onto the album the moment she does"). The host is named again rather than
 * given a pronoun: a display name can be anyone's ("Maya", "The Chens").
 */
export function waitingCopy(hostName?: string | null): {
  title: string;
  reason: string;
} {
  const host = hostName?.trim() || null;
  return {
    title: host ? `${host} will let you in` : "The host will let you in",
    reason: `The album opens right here the moment ${host ?? "the host"} does. Keep this link: it opens the album whenever you come back.`,
  };
}

/**
 * THE HELD DOOR: a newcomer who confirmed an email at a door the host answers waits at the doorway,
 * ajar, with nothing of the album behind it, and the door swings the rest of the way open by itself the
 * moment the host lets her in (`locked-door` r2: the door as the page, `door/stage.tsx`). While she waits
 * she can choose what she will add (`wait=pick`), and the page's queue sends it once she is in.
 *
 * ★ IT ASKS, IT NEVER GUESSES. Every check-in answers `in` (the beat, then the album), `moved` (the
 * door changed under her: the page refreshes onto whatever the server now says, the shut screen
 * included, with no beat) or `waiting`. A failed check-in waits for the next one.
 *
 * ★ HER CHOICE OUTLIVES THE TAB (`wait-picks-store.ts`): what she picks is kept on the device as well as
 * held by the page's queue, so the door that comes back after a reload or a closed tab puts it back in her
 * hands, and the album she returns to once let in sends it (`event-experience.tsx`). It is put down the
 * moment she is let in, the door moves, or she switches address.
 */
export function WaitingStep({
  qrToken,
  sessionToken,
  hostName,
  onLetIn,
  onMoved,
  picks,
  onPick,
  acceptsVideo,
}: {
  qrToken: string;
  /** This device's ticket for the event, which the check-in carries beside the account. */
  sessionToken: string | null;
  hostName?: string | null;
  /** She is in: the door plays its beat and refreshes onto the album. */
  onLetIn: () => void;
  /** Something else changed about the door: a plain refresh. */
  onMoved: () => void;
  /** What she has chosen to add while she waits (the page's queue, held), and how she chooses. */
  picks?: readonly WaitPick[];
  onPick?: (files: File[]) => void;
  acceptsVideo?: boolean;
}) {
  const [switching, setSwitching] = useState(false);
  // Whether her choice is kept on the device (null until she has chosen, or it came back from there).
  const [kept, setKept] = useState<boolean | null>(null);

  // The latest callbacks and ticket, read by the loop without restarting it.
  const latest = useRef({ sessionToken, onLetIn, onMoved, onPick, picks });
  useEffect(() => {
    latest.current = { sessionToken, onLetIn, onMoved, onPick, picks };
  });

  // ★ HER CHOICE COMES BACK: the door she left (a reload, a closed tab) finds what she picked kept on the
  // device under her account, and hands it back to the page's queue, where it waits for the door as before.
  useEffect(() => {
    let live = true;
    void (async () => {
      const owner = await doorOwner();
      if (!live || !owner || (latest.current.picks?.length ?? 0) > 0) return;
      const files = await readHeldPicks(qrToken, owner);
      if (!live || !files?.length) return;
      latest.current.onPick?.(files);
      setKept(true);
    })();
    return () => {
      live = false;
    };
  }, [qrToken]);

  /** Her choice: held by the page's queue, and kept on the device for the door's return. */
  const choose = (files: File[]) => {
    onPick?.(files);
    void (async () => {
      const owner = await doorOwner();
      setKept(owner ? await keepHeldPicks(qrToken, owner, files) : false);
    })();
  };

  useEffect(() => {
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let inFlight = false;

    const schedule = () => {
      if (stopped) return;
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => void check(), WAITING_CHECK_IN_MS);
    };

    const check = async () => {
      if (stopped || inFlight) return;
      // A hidden tab waits for its return rather than polling a door nobody is looking at.
      if (document.visibilityState !== "visible") return schedule();
      inFlight = true;
      const answer = await checkInAtDoor({
        qrToken,
        sessionToken: latest.current.sessionToken,
      });
      inFlight = false;
      if (stopped) return;
      if (answer === "in") {
        stopped = true;
        // Her choice goes in from the page's queue now: the device's copy has done its job.
        void forgetHeldPicks(qrToken);
        latest.current.onLetIn();
        return;
      }
      if (answer === "moved") {
        stopped = true;
        // The door it waited for is not this one any more.
        void forgetHeldPicks(qrToken);
        latest.current.onMoved();
        return;
      }
      schedule();
    };

    const onVisible = () => {
      if (document.visibilityState === "visible") void check();
    };

    // The first check-in at once: it stamps that she is at the door, and a host who answered while
    // she was on another screen opens the door the moment she comes back to it.
    void check();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      stopped = true;
      if (timer) clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [qrToken]);

  return (
    <WaitingDoor
      hostName={hostName}
      switching={switching}
      onSwitchEmail={() => {
        setSwitching(true);
        // Another address is another person at the door: her choice goes with her.
        void forgetHeldPicks(qrToken).then(() => switchEmail());
      }}
      picks={picks}
      onPick={choose}
      kept={kept}
      acceptsVideo={acceptsVideo}
    />
  );
}

/**
 * THE HELD DOOR'S FACE, without its check-in loop: `WaitingStep` wraps it, and the help center's
 * picture of the step (`step-screens/door-screens.tsx`) draws this very face under its doorway, inert,
 * so the picture changes when the door does and never checks in from an article. Under the doorway,
 * ajar: "Asked" over who will let her in and why to keep the link, the live mark, her choice while she
 * waits (`WaitPicks`), and the one way out, another address.
 */
export function WaitingDoor({
  hostName,
  switching = false,
  onSwitchEmail,
  picks = [],
  onPick,
  kept = null,
  acceptsVideo = true,
}: {
  hostName?: string | null;
  switching?: boolean;
  onSwitchEmail?: () => void;
  picks?: readonly WaitPick[];
  onPick?: (files: File[]) => void;
  /** Her choice is kept on the device (it outlives the tab), or could not be (it lives in the tab). */
  kept?: boolean | null;
  acceptsVideo?: boolean;
}) {
  const copy = waitingCopy(hostName);
  return (
    <div data-door-waiting="" className="flex w-full flex-col items-center">
      <DoorWords
        eyebrow={
          <>
            <StageGlyph icon={Clock} />
            Asked
          </>
        }
        title={copy.title}
        titleAs="h1"
        lines={[copy.reason]}
      />
      <p
        data-door-line
        style={{ "--door-line-i": 3 } as CSSProperties}
        className="mt-5 flex items-center gap-2 text-sm text-muted-foreground"
        aria-live="polite"
      >
        {/* The live mark: a dot that breathes on the door's own clock while the door is held, with the
            light under it (the carried call `dot`: one rhythm on the page, never a ping of its own),
            still under reduced motion (`doorway.css`). */}
        <span
          aria-hidden
          data-door-waiting-dot
          className="relative flex size-2 shrink-0 items-center justify-center"
        >
          <span className="relative size-2 rounded-full bg-brand" />
        </span>
        Waiting at the door
      </p>
      <div
        data-door-line
        style={{ "--door-line-i": 4 } as CSSProperties}
        className="mt-7 w-full"
      >
        <WaitPicks
          picks={picks}
          onPick={onPick}
          kept={kept}
          acceptsVideo={acceptsVideo}
        />
      </div>
      <Button
        type="button"
        variant="ghost"
        className="mt-5 w-full text-muted-foreground"
        disabled={switching}
        onClick={onSwitchEmail}
      >
        Use a different email
      </Button>
    </div>
  );
}
