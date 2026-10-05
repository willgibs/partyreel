/**
 * THE PRESS: SEND TO GOOGLE DRIVE (`POST /api/drive/exports`, one album from Take it home or the storage list, or a
 * season of them from Your events; drive-export.md, "Making one").
 *
 * `getUser()`, her account's limiter (about ten presses a minute: a script pressing Send costs one limiter row a press),
 * her connection, then her Drive's room asked ONCE for everything the press would put there (what is new to this
 * Drive: a file an earlier send left and she kept is confirmed, not sent), so a send her Drive cannot hold is answered
 * before anything starts ("Your Drive has 3.1 GB free. This album is 7.4 GB."), never half-sent into a folder that
 * looks whole and is not. Then each album: one RPC builds its whole snapshot (`cloud_export_create`: her Download
 * panel's Originals, one statement however large the album), this route makes its folder in her Drive (metadata only,
 * no media byte), and the Worker is kicked once for the connection.
 *
 * A second press of an album with a send under way opens that send (and a send still waiting for its folder, after a
 * Google call failed, gets it now). An album not hers or in Deleted is refused alone, its siblings unaffected.
 */
import { after, NextResponse } from "next/server";

import { z } from "zod";

import { driveRoom, DriveCallError } from "@/lib/drive/google";
import { DRIVE_HINT_COOKIE, DRIVE_HINT_MAX_AGE_S } from "@/lib/drive/links";
import { MAX_ALBUMS_A_PRESS, type PressRefusal, type PressResult } from "@/lib/drive/press";
import { notifyReconnect } from "@/lib/drive/mail.server";
import { accessTokenFor, kickConnection, makeSendFolders } from "@/lib/drive/service.server";
import { createSend, previewAlbums, readConnection, recordRoom } from "@/lib/db/queries/drive";
import { driveConfigured } from "@/lib/env";
import { captureError } from "@/lib/observability/sentry";
import { checkAccountAbuseRate } from "@/lib/security/abuse-rate-limit-store";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** How long her Drive's room (about.get) is taken from the connection rather than asked again. */
const ROOM_CACHE_MS = 60_000;
export const maxDuration = 60;

const bodySchema = z.object({
  event_ids: z.array(z.uuid()).min(1).max(MAX_ALBUMS_A_PRESS),
  include_hidden: z.boolean().default(false),
  /** Her browser's zone: the files' names say when each arrived, in her own time. */
  tz: z.string().min(1).max(64).default("UTC"),
});

function refuse(code: PressRefusal, status: number, extra: Record<string, unknown> = {}) {
  return NextResponse.json({ ok: false, code, ...extra }, { status, headers: { "Cache-Control": "private, no-store" } });
}

/** A Google refusal at the press, in the code the panel words. */
function googleCode(e: unknown): PressRefusal {
  if (e instanceof DriveCallError) {
    if (e.reason === "storageQuotaExceeded") return "drive_full";
    if (e.reason === "domainPolicy") return "domain_policy";
    if (e.status === 401) return "disconnected";
  }
  return "google_unreachable";
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return refuse("bad_request", 400);
  }
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return refuse("bad_request", 400);
  const { event_ids, include_hidden, tz } = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return refuse("unauthorized", 401);
  if (!driveConfigured()) return refuse("unavailable", 503);

  const gate = await checkAccountAbuseRate("drive_send", user.id);
  if (!gate.allowed) return refuse("rate_limited", 429, { retryAfterSec: gate.retryAfterSec });

  const connection = await readConnection(user.id);
  if (!connection) return refuse("not_connected", 409);
  if (connection.status === "revoked") return refuse("disconnected", 409);
  if (connection.operatorPausedAt) return refuse("paused", 409);

  // What the press would put in her Drive: the new bytes of every album not already under way.
  const { albums } = await previewAlbums({ userId: user.id, eventIds: event_ids, includeHidden: include_hidden });
  const newBytes = event_ids.reduce((n, id) => {
    const a = albums.get(id);
    return a && !a.unfinished ? n + a.newBytes : n;
  }, 0);

  const access = await accessTokenFor(connection.id);
  if (!access.ok) {
    if (access.why === "revoked" && access.firstRevoked) {
      after(() => notifyReconnect({ connectionId: connection.id, userId: user.id, why: "revoked" }));
    }
    return refuse(access.why === "revoked" ? "disconnected" : access.why === "wait" ? "busy" : "google_unreachable", 409);
  }

  if (newBytes > 0) {
    try {
      // about.get's answer is kept a minute on the connection: a second press in quick succession asks Google nothing.
      const askedAt = connection.quota.at ? Date.parse(connection.quota.at) : Number.NaN;
      const cached =
        Number.isFinite(askedAt) && Date.now() - askedAt < ROOM_CACHE_MS && connection.quota.usage !== null
          ? { limit: connection.quota.limit, usage: connection.quota.usage }
          : null;
      const room = cached ?? (await driveRoom(access.token));
      if (!cached) {
        after(() =>
          recordRoom({ connectionId: connection.id, limit: room.limit, usage: room.usage, resume: false }).then(
            () => undefined,
          ),
        );
      }
      // Plus 1% for what Drive counts that we do not. No limit (unlimited, or a Workspace's pooled one): it holds it.
      if (room.limit !== null && room.limit - room.usage < newBytes + Math.ceil(newBytes / 100)) {
        return refuse("drive_full", 409, { free: Math.max(room.limit - room.usage, 0), needs: newBytes });
      }
    } catch (e) {
      return refuse(googleCode(e), 409);
    }
  }

  const results: PressResult[] = [];
  let started = false;
  for (const eventId of event_ids) {
    try {
      const created = await createSend({ userId: user.id, eventId, includeHidden: include_hidden, tz });
      if (!created.ok) {
        results.push({ eventId, jobId: null, state: "refused", code: created.code });
        continue;
      }
      if (created.existing === false && created.empty) {
        results.push({ eventId, jobId: created.jobId, state: "empty" });
        continue;
      }
      if (created.existing && created.status !== "preparing") {
        results.push({ eventId, jobId: created.jobId, state: "open" });
        continue;
      }
      try {
        await makeSendFolders({ jobId: created.jobId, facts: created.facts, accessToken: access.token });
        started = true;
        results.push({ eventId, jobId: created.jobId, state: created.existing ? "open" : "started" });
      } catch (e) {
        // The send waits for its folder; the next press makes it (or the sweep stops it in ten minutes).
        captureError("export", e, { action: "drive_folders", eventId });
        results.push({ eventId, jobId: created.jobId, state: "failed", code: googleCode(e) });
      }
    } catch (e) {
      captureError("export", e, { action: "drive_press", eventId });
      results.push({ eventId, jobId: null, state: "failed", code: "unknown" });
    }
  }

  if (started) after(() => kickConnection(connection.id).then(() => undefined));
  const response = NextResponse.json({ ok: true, results }, { headers: { "Cache-Control": "private, no-store" } });
  // This browser's host uses Drive: her pages listen for her sends (`links.ts`), on this device too.
  response.cookies.set(DRIVE_HINT_COOKIE, "1", {
    path: "/",
    maxAge: DRIVE_HINT_MAX_AGE_S,
    sameSite: "lax",
    secure: new URL(request.url).protocol === "https:",
    httpOnly: false,
  });
  return response;
}
