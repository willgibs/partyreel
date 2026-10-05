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

import {
  actOn,
  connectHref,
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

/** Mounted on every host page; listens only for a host who uses Drive (the hint cookie), so nobody else polls. */
export function DriveFlag() {
  const [active, setActive] = useState(false);
  useEffect(() => {
    // The hint is the browser's cookie, read after mount (the server's render never sees it).
    // eslint-disable-next-line react-hooks/set-state-in-effect -- read once from the browser after mount
    setActive(hasDriveHint());
  }, []);
  return active ? <DriveFlagListening /> : <DriveReturnWord />;
}

/** A return from Google said where no place took it, even for a host with no hint yet (her first connect). */
function DriveReturnWord() {
  useEffect(() => {
    if (peekIntent()) return;
    const word = takeReturnWord();
    if (!word) return;
    const said = returnWords(word);
    if (said.good)
      toast.success(said.title, {
        description: said.detail,
        id: "drive-return",
      });
    else
      toast.warning(said.title, {
        description: said.detail,
        id: "drive-return",
      });
  }, []);
  return null;
}

function DriveFlagListening() {
  const router = useRouter();
  const { status } = useDriveStatus();
  const previous = useRef(new Map<string, SendView["status"]>());

  // A return from Google that no place on this page took (no send waiting in the tab): said here, once.
  useEffect(() => {
    if (peekIntent()) return;
    const word = takeReturnWord();
    if (!word) return;
    const said = returnWords(word);
    if (said.good)
      toast.success(said.title, {
        description: said.detail,
        id: "drive-return",
      });
    else
      toast.warning(said.title, {
        description: said.detail,
        id: "drive-return",
      });
  }, []);

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
