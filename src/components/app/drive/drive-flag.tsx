"use client";

/**
 * A STOP SHE CANNOT MISS (Will, desk 2, `hard = in-place` and his note: "a warning tucked where she can navigate away is
 * easily never seen"): a send stopped on something that needs her (her Drive full, the connection lost, the folder in
 * her bin, her admin's policy, files that would not go, a send that gave up) flags itself on her next page anywhere in
 * the app, as the house's toast, ONCE a stop (her app says it showed it: `seen`, so another device or tab does not say
 * it again), carrying its one act or the way to the album. A pause that carries on by itself (Google's day) stays
 * quiet in place, with its email.
 *
 * It also says, as it happens in front of her, that a send finished ("Maya & Jay is in your Google Drive"), and what a
 * return from Google said where no place on the page took it.
 */
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { albumPath, hasDriveHint } from "@/lib/drive/links";
import { isUnfinished, momentOf, type SendView } from "@/lib/drive/moments";
import type { DriveReturn } from "@/lib/drive/oauth-cookie";

import {
  actOn,
  connectHref,
  intentIsHere,
  peekIntent,
  returnWords,
  takeReturnWord,
} from "./drive-client";
import { useDriveStatus } from "./use-drive-status";

/** Stops this page already flagged (the server's `seen` makes it once across her devices; this, once in a page). */
const flagged = new Set<string>();

function stopKey(send: SendView): string {
  return `${send.id}:${send.status}:${send.pauseReason ?? ""}`;
}

/**
 * Mounted on every host page. The return word is for every host, even one with no hint yet (her first connect); the
 * rest listens only for a host who uses Drive (the hint cookie), so nobody else polls.
 */
export function DriveFlag() {
  const [active, setActive] = useState(false);
  useEffect(() => {
    // The hint is the browser's cookie, read after mount (the server's render never sees it).
    // eslint-disable-next-line react-hooks/set-state-in-effect -- read once from the browser after mount
    setActive(hasDriveHint());
  }, []);
  return (
    <>
      <DriveReturnWord />
      {active ? <DriveFlagListening /> : null}
    </>
  );
}

/**
 * ★ WHAT A RETURN FROM GOOGLE SAID IS SAID A BEAT AFTER THE COMMIT, NEVER FROM THE MOUNT EFFECT (red-team 55's MEDIUM).
 * Every return is a full page load, and the root layout draws `<Toaster />` AFTER `{children}`: effects run in tree
 * order, so this page's effect runs before the Toaster has subscribed, and sonner shows a toast only to the Toaster
 * that is subscribed when it is published (no replay): `/account?drive=unavailable` cleaned its address and said
 * nothing, where a client navigation (the Toaster already there) said it. A timer lets the whole commit's effects land
 * first (the boom probe's own beat: `root-layout-crash.tsx`).
 *
 * ★ THE WORD IS TAKEN NOW AND SAID THEN, AND THE BEAT IS NEVER CANCELLED WITH THE EFFECT. `takeReturnWord` is once for
 * the address (the first place takes it and the rest read nothing), so an effect that took the word and gave up its
 * timer on cleanup would lose it for good when React runs the effect twice (`next dev`'s Strict Mode): the toast belongs
 * to the page, not to this component.
 *
 * ★ THE PLACE THAT OWNS A SEND WAITING IN THIS TAB TAKES THE WORD IN PLACE (Take it home, Your events' picker: they say
 * it on their own page, with the final press), but only an intent for THIS page (`intentIsHere`): one left by an
 * abandoned send for another album would otherwise swallow Account's Connect and every Reconnect, which carry no intent.
 */
function DriveReturnWord() {
  useEffect(() => {
    const intent = peekIntent();
    if (intent && intentIsHere(intent, window.location.pathname)) return;
    const word = takeReturnWord();
    if (word) sayReturnWord(word);
  }, []);
  return null;
}

/** The return's words as the house's toast, once the Toaster can hear them (`DriveReturnWord`). */
function sayReturnWord(word: DriveReturn) {
  const said = returnWords(word);
  setTimeout(() => {
    const show = said.good ? toast.success : toast.warning;
    show(said.title, { description: said.detail, id: "drive-return" });
  }, 0);
}

function DriveFlagListening() {
  const router = useRouter();
  const { status } = useDriveStatus();
  const previous = useRef(new Map<string, SendView["status"]>());

  useEffect(() => {
    if (!status) return;
    const nowMs = Date.parse(status.now);
    for (const send of status.sends) {
      const before = previous.current.get(send.id);
      previous.current.set(send.id, send.status);

      // Finished in front of her: said once, never on a later visit (the strip says done for a day).
      if (
        before &&
        isUnfinished({ status: before }) &&
        send.status === "done"
      ) {
        toast.success(`${send.albumName} is in your Google Drive`, {
          id: `drive-done-${send.id}`,
          description: "Every one checked against ours.",
          action: send.folderUrl
            ? {
                label: "Open in Drive",
                onClick: () =>
                  window.open(send.folderUrl!, "_blank", "noopener,noreferrer"),
              }
            : undefined,
        });
      }

      if (!send.flagDue || flagged.has(stopKey(send))) continue;
      flagged.add(stopKey(send));
      const moment = momentOf(send, nowMs);
      const album = send.eventId ? albumPath(send.eventId) : "/dashboard";
      const reconnect = moment.acts.find((a) => a.id === "reconnect");
      toast.warning(moment.title, {
        id: `drive-flag-${send.id}`,
        description: moment.line ?? moment.facts,
        duration: Infinity,
        action: reconnect
          ? {
              label: reconnect.label,
              onClick: () => window.location.assign(connectHref(album)),
            }
          : { label: "Open the album", onClick: () => router.push(album) },
      });
      // Said: her app tells the server, so it flags once across her devices.
      void actOn(send.id, "seen");
    }
  }, [status, router]);

  return null;
}
