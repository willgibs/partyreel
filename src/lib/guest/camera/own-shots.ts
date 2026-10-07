/**
 * HER ROLL AND HER SHOTS, AS THE SERVER KNOWS THEM: one read of `/api/guests/mine` with `statuses` (the route her
 * tracker asks), which answers her own uploads here (each one's status, `sealed` while the album develops later, and a
 * picture presigned for her alone where the album cannot show it) and, on an album with its camera on, her `roll`.
 *
 * ★ NEVER `tell`. That flag marks her approval news told as it answers; the camera only counts, and the news is the
 * tracker's to spend (`upload-tracker.tsx`), so a camera read can never swallow the toast "One of yours is in the album".
 *
 * ★ THE TICKET RIDES THE BODY, never the URL (a capability in a query string ends up in a log). A signed-in account
 * speaks for its own rows without one (the route asks `getUser()`).
 */
import { useEffect, useRef, useState } from "react";

import { parseRollCount, type RollCount } from "@/lib/disposable/roll";
import { waitsForLine } from "@/lib/guest/unsent/standby";
import type { QueueItem } from "@/lib/guest/use-upload-queue";

/** One of her uploads, as the read answers it. */
export type OwnShot = {
  id: string;
  status: "pending" | "approved" | "refused";
  /** Approved, and sealed until the album develops. */
  sealed?: boolean;
  /** Her own picture of it (held or sealed only), presigned for her alone. */
  picture?: { type: "photo" | "video"; at: number; tile: string };
};

export type OwnRollRead = { roll: RollCount | null; shots: OwnShot[] };

function ownShot(value: unknown): OwnShot | null {
  if (!value || typeof value !== "object") return null;
  const o = value as Record<string, unknown>;
  if (typeof o.id !== "string") return null;
  if (
    o.status !== "pending" &&
    o.status !== "approved" &&
    o.status !== "refused"
  ) {
    return null;
  }
  const p = o.picture as Record<string, unknown> | undefined;
  const type = p?.type === "photo" || p?.type === "video" ? p.type : null;
  const picture: OwnShot["picture"] =
    p && type && typeof p.tile === "string" && typeof p.at === "number"
      ? { type, at: p.at, tile: p.tile }
      : undefined;
  return {
    id: o.id,
    status: o.status,
    ...(o.sealed === true ? { sealed: true } : {}),
    ...(picture ? { picture } : {}),
  };
}

/** The route's answer, read defensively (it crosses a process boundary). */
export function parseOwnRoll(json: unknown): OwnRollRead | null {
  if (!json || typeof json !== "object") return null;
  const o = json as Record<string, unknown>;
  if (o.ok !== true || !Array.isArray(o.items)) return null;
  return {
    roll: parseRollCount(o.roll),
    shots: o.items.flatMap((item) => {
      const shot = ownShot(item);
      return shot ? [shot] : [];
    }),
  };
}

/** Her roll and her shots, or null where the read failed (the camera keeps what it knew). */
export async function readOwnRoll(input: {
  qrToken: string;
  sessionToken: string | null;
}): Promise<OwnRollRead | null> {
  try {
    const res = await fetch("/api/guests/mine", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        qr_token: input.qrToken,
        ...(input.sessionToken ? { session_token: input.sessionToken } : {}),
        statuses: true,
      }),
    });
    if (!res.ok) return null;
    return parseOwnRoll(await res.json());
  } catch {
    return null;
  }
}

/** Her roll as the album read it ahead of the camera (`useRollAhead`). */
export type RollAhead = {
  read: OwnRollRead;
  /** When the read began: what the camera takes after it is counted on top of it. */
  from: number;
  /** The page's files that had landed as it began (the queue's ids): in its count. One that lands after is on top. */
  landed: ReadonlySet<string>;
};

/**
 * ★ HER ROLL, READ AHEAD OF THE CAMERA (no-signal r1, Will's `roll=taken`). The camera reads her roll as it opens, so a
 * camera first opened in a dead zone had no read and counted from the roll's size: a phone that shot 20 of 24 earlier
 * in the night offered 24 again, and every shot past her real roll was refused as it landed, the one refusal Will's
 * door rules out. So the album reads it as it opens, while the line is up, and the camera counts from this read until
 * its own answers (`album-camera.tsx`'s `ahead`). The camera's own rule holds: only while nothing of hers is in the air,
 * so a file is either in the count or lands after it, and what lands after is counted on top (`landed`). A read the
 * line could not carry goes again when the phone says it is back; one answered is never asked again (the camera reads
 * for itself from its opening). Only with a ticket on this device: without one nothing of hers here is on a roll yet,
 * so a first visit asks nothing.
 */
export function useRollAhead(input: {
  /** A guest's camera album: never the host (no roll counts her shots), never the demo. */
  enabled: boolean;
  qrToken: string;
  sessionToken: string | null;
  /** The page's one queue: what is in the air holds the read back, and what has landed is in its count. */
  queue: readonly QueueItem[];
}): RollAhead | null {
  const { enabled, qrToken, sessionToken, queue } = input;
  /** The answer, under the ticket it was read for (a ticket that changes is read for again). */
  const [ahead, setAhead] = useState<{
    ticket: string;
    value: RollAhead;
  } | null>(null);
  const [tick, setTick] = useState(0);
  const queueNow = useRef(queue);
  useEffect(() => {
    queueNow.current = queue;
  });
  /** The ticket a read is out for: one at a time per ticket, and a ticket that changes is read for at once. */
  const out = useRef<string | null>(null);
  // In the air, not waiting: a file standing by for the line goes nowhere, so it holds nothing back (it lands after).
  const busy = queue.some(
    (it) =>
      (it.status === "queued" || it.status === "uploading") &&
      !waitsForLine(it),
  );
  const answered = ahead !== null && ahead.ticket === sessionToken;
  useEffect(() => {
    if (!enabled || !sessionToken || answered || busy) return;
    if (out.current === sessionToken) return;
    const ticket = sessionToken;
    out.current = ticket;
    const from = Date.now();
    const landed = new Set(
      queueNow.current.filter((it) => it.status === "done").map((it) => it.id),
    );
    void readOwnRoll({ qrToken, sessionToken: ticket }).then((read) => {
      if (out.current === ticket) out.current = null;
      // No answer: the phone's `online` asks again (below). One for a ticket since replaced is kept under it, unread.
      if (read) setAhead({ ticket, value: { read, from, landed } });
    });
  }, [enabled, qrToken, sessionToken, answered, busy, tick]);
  // A read the line could not carry goes again the moment the phone says it is back, or she comes back to the page
  // (a venue's Wi-Fi with no internet never says offline, so its `online` never comes).
  useEffect(() => {
    if (!enabled || !sessionToken || answered) return;
    const again = () => setTick((n) => n + 1);
    const back = () => {
      if (document.visibilityState === "visible") again();
    };
    window.addEventListener("online", again);
    document.addEventListener("visibilitychange", back);
    return () => {
      window.removeEventListener("online", again);
      document.removeEventListener("visibilitychange", back);
    };
  }, [enabled, sessionToken, answered]);
  return enabled && ahead !== null && ahead.ticket === sessionToken
    ? ahead.value
    : null;
}

/**
 * Whether her picture of a video is the video file itself (no preview was made for it, so the server presigned the
 * original): drawn as the video's first frame, where a preview is an image. The key says which (`r2/keys.ts`:
 * `events/<event>/<kind>/<media>/<variant>.<ext>`).
 */
export function pictureIsVideoFile(picture: OwnShot["picture"]): boolean {
  if (!picture || picture.type !== "video") return false;
  try {
    return /\/original\.[a-z0-9]+$/i.test(new URL(picture.tile).pathname);
  } catch {
    return false;
  }
}

/** Whether one of hers is a shot the album cannot show anyone yet: held for the host, or sealed until it develops. */
export function waitsOutOfSight(shot: Pick<OwnShot, "status" | "sealed">) {
  return shot.status === "pending" || shot.sealed === true;
}
