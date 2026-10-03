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
import { parseRollCount, type RollCount } from "@/lib/disposable/roll";

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
