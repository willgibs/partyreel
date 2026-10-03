"use client";

/**
 * ★ WHETHER WHAT SHE ADDS WAITS, AND FOR WHAT, LIVE ON THE PAGE (red-team 44). The page's server reads it once
 * (`uploadsWait`, `upload-tracker.ts`), and a page left open across a develop (Develop now, or the time passing) kept
 * the develop's promise ("Uploads appear in the album when it develops, ...") over an album that had developed; with
 * the album's head routed by it, her next upload would have been kept out of an album that now shows it at once. So
 * the page holds the reading live: it starts at the server's, ends when the develop time comes on this device's clock,
 * and follows every word the album's sync carries about the develop (`waiting.developsAt`: a Develop now, a time set,
 * moved or taken away). Approve-each keeps hers waiting for as long as the page's event says so. Everything that
 * speaks of the wait follows it: the slot's line and the camera, the album's head, her tracker, the keep and the
 * failure sheet.
 */
import { useCallback, useEffect, useMemo, useState } from "react";

import { NOTHING_WAITS, type UploadsWait } from "@/lib/guest/upload-tracker";

/** A timer's longest delay (about 24.8 days): a develop further ahead is waited out in steps. */
const LONGEST_DELAY_MS = 2 ** 31 - 1;

/** The album's develop time as the page holds it, and whether it is still ahead (read off the clock, never a render). */
type Develop = { at: string | null; ahead: boolean };

/** Whether `at` is still ahead of this device's clock (read when a word lands or a timer fires, never in a render). */
function aheadNow(at: string | null): boolean {
  if (!at) return false;
  const due = Date.parse(at);
  return Number.isFinite(due) && due > Date.now();
}

export function useLiveUploadsWait({
  initial,
  moderationMode,
}: {
  /** The page's server reading (`uploadsWait`, at render): its develop time is set only while ahead. */
  initial: UploadsWait;
  /** The page's event's `moderation_mode`: approve-each keeps hers waiting, whatever the develop says. */
  moderationMode: string;
}): {
  reading: UploadsWait;
  /** A full sync's word on the develop time (ahead or reached, or none): the album's live source calls it. */
  onSynced: (developsAt: string | null) => void;
  /**
   * The album's develop time as the page last heard it, ahead OR reached (null for none): the cover's word over the
   * event's name says "develops" or "developed" by it (`coverEyebrow`), where `reading` keeps only a time still ahead.
   */
  developsAt: string | null;
} {
  const [develop, setDevelop] = useState<Develop>(() => ({
    at: initial.developsAt,
    ahead: initial.developsAt !== null,
  }));
  // A fresh server reading (the page rendered again: a refresh) is the newest word (the adjust-state-during-render
  // pattern, so no frame says the old one).
  const [seen, setSeen] = useState(initial.developsAt);
  if (initial.developsAt !== seen) {
    setSeen(initial.developsAt);
    setDevelop({ at: initial.developsAt, ahead: initial.developsAt !== null });
  }

  // The sync's word, with the clock read as it lands: a develop already reached never reads as ahead, even for a frame.
  const onSynced = useCallback((at: string | null) => {
    setDevelop((prev) => {
      const ahead = aheadNow(at);
      return prev.at === at && prev.ahead === ahead ? prev : { at, ahead };
    });
  }, []);

  // ★ THE TIME COMING ENDS IT, with no reload and no poll: one timer to the develop time (in steps past a timer's
  // reach), and the reading turns as it fires.
  useEffect(() => {
    if (!develop.ahead || !develop.at) return;
    const at = develop.at;
    const due = Date.parse(at);
    const timer = window.setTimeout(
      () =>
        setDevelop((prev) =>
          prev.at !== at
            ? prev
            : Date.now() >= due
              ? { at, ahead: false }
              : { ...prev },
        ),
      Math.min(Math.max(0, due - Date.now()), LONGEST_DELAY_MS),
    );
    return () => window.clearTimeout(timer);
  }, [develop]);

  const held = moderationMode === "hold_for_approval";
  const reading = useMemo<UploadsWait>(
    () =>
      develop.ahead
        ? { waits: true, developsAt: develop.at }
        : held
          ? { waits: true, developsAt: null }
          : NOTHING_WAITS,
    [develop.ahead, develop.at, held],
  );
  return { reading, onSynced, developsAt: develop.at };
}

/**
 * ★ WHAT THIS VIEWER'S OWN ADDS WAIT FOR (red-team 44): the album's reading (`useLiveUploadsWait`'s), as it falls on
 * whoever is adding. A guest's wait wherever uploads wait. The host's own ride her pair, approved since she is the
 * moderator, so only a develop time ahead keeps hers back (`create_media_as_host` seals them with everyone's). The
 * demo's are simulated and land at once. Where they wait, nothing of hers in the air stands at the album's head, and
 * the failure sheet says the rest waits rather than that it is in the album.
 */
export function addsWaitFor(input: {
  uploadsWait: UploadsWait;
  isOwner: boolean;
  isDemo: boolean;
}): UploadsWait {
  const { uploadsWait, isOwner, isDemo } = input;
  if (isDemo) return NOTHING_WAITS;
  if (isOwner) {
    return uploadsWait.developsAt === null
      ? NOTHING_WAITS
      : { waits: true, developsAt: uploadsWait.developsAt };
  }
  return uploadsWait;
}
