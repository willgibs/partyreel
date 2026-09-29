"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Clock } from "lucide-react";

import { DoorHeading } from "@/components/guest/door/heading";
import { DoorGlyph } from "@/components/guest/door/lit";
import { switchEmail } from "@/components/guest/door/switch-email";
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
 * let her in, and opens onto the album the moment she does, from the same sheet"). The host is named
 * again rather than given a pronoun: a display name can be anyone's ("Maya", "The Chens").
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
 * THE HELD DOOR: a newcomer who confirmed an email at a door the host answers waits in the same sheet,
 * with nothing real behind it (the ghost river), and the door opens onto the album by itself the
 * moment the host lets her in. `locked-door` r2 redraws this family; this is today's lit door.
 *
 * ★ IT ASKS, IT NEVER GUESSES. Every check-in answers `in` (the beat, then the album), `moved` (the
 * door changed under her: the page refreshes onto whatever the server now says, the shut screen
 * included, with no beat) or `waiting`. A failed check-in waits for the next one.
 */
export function WaitingStep({
  qrToken,
  sessionToken,
  hostName,
  onLetIn,
  onMoved,
}: {
  qrToken: string;
  /** This device's ticket for the event, which the check-in carries beside the account. */
  sessionToken: string | null;
  hostName?: string | null;
  /** She is in: the door plays its beat and refreshes onto the album. */
  onLetIn: () => void;
  /** Something else changed about the door: a plain refresh. */
  onMoved: () => void;
}) {
  const [switching, setSwitching] = useState(false);

  // The latest callbacks and ticket, read by the loop without restarting it.
  const latest = useRef({ sessionToken, onLetIn, onMoved });
  useEffect(() => {
    latest.current = { sessionToken, onLetIn, onMoved };
  });

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
        latest.current.onLetIn();
        return;
      }
      if (answer === "moved") {
        stopped = true;
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
        void switchEmail();
      }}
    />
  );
}

/**
 * THE HELD DOOR'S FACE, without its check-in loop: `WaitingStep` wraps it, and the help center's
 * picture of the step (`step-screens/door-screens.tsx`) draws this very face, inert, so the picture
 * changes when the door does and never checks in from an article.
 */
export function WaitingDoor({
  hostName,
  switching = false,
  onSwitchEmail,
}: {
  hostName?: string | null;
  switching?: boolean;
  onSwitchEmail?: () => void;
}) {
  const copy = waitingCopy(hostName);
  return (
    <div data-door-waiting className="flex flex-col gap-6">
      <DoorHeading
        eyebrow={
          <>
            <DoorGlyph icon={Clock} hue={1} className="size-3" />
            Asked
          </>
        }
        title={copy.title}
        reason={copy.reason}
        // The shell announces the same two sentences as the sheet's name.
        hidden
      />
      <p
        data-door-line
        style={{ "--door-line-i": 3 } as CSSProperties}
        className="flex items-center gap-2 text-sm text-muted-foreground"
        aria-live="polite"
      >
        {/* The live mark: a dot that breathes while the door is held, still under reduced motion,
            so the one moving thing on the sheet is honest about being alive. */}
        <span
          aria-hidden
          data-door-waiting-dot
          className="relative flex size-2 shrink-0 items-center justify-center"
        >
          <span className="absolute inset-0 rounded-full bg-brand/60 motion-safe:animate-ping" />
          <span className="relative size-2 rounded-full bg-brand" />
        </span>
        Waiting at the door
      </p>
      <Button
        type="button"
        variant="ghost"
        className="w-full text-muted-foreground"
        disabled={switching}
        onClick={onSwitchEmail}
      >
        Use a different email
      </Button>
    </div>
  );
}
