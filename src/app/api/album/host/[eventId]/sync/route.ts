import { NextResponse } from "next/server";
import { z } from "zod";

import { readHostManifestPage } from "@/lib/db/queries/album-host";
import {
  readAlbumChanges,
  readAlbumVersions,
} from "@/lib/db/queries/album-state";
import { getEvent } from "@/lib/db/queries/events";
import { planAlbumSync } from "@/lib/events/album-sync";
import { hostAlbumEtag } from "@/lib/events/album-validator";
import type { HostSyncBody } from "@/lib/events/album-wire";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * THE PAGED ALBUM'S POLL, FOR THE HOST. Body: `{ since? }`, the host-scope version the client holds.
 *
 * The host's album is everything but the bin (approved, hidden and held, each entry's status in its
 * flags), and every status change moves the host's version, so a held upload on a moderated event
 * reaches the one person who can approve it: the hub polls here, and is answered with the change
 * itself. A matching `If-None-Match` is a 304 that read one row (album-validator.ts).
 * A 200 carries the manifest (first load, or more than 500 changes behind) or the delta, and the two
 * numbers the hub says, the album (approved + hidden) and Review (held), counted in the same snapshot
 * as the version.
 *
 * AUTH: `getUser()` re-validates the JWT (the proxy is no boundary), and the event comes back through
 * `getEvent`, RLS-scoped and filtered on `deleted_at`: a foreign, missing or deleted event is a 404,
 * never a refusal, so this route never says an event exists. The change log is read by the service
 * role after that check (it is deny-all); the manifest on the host's own RLS client.
 */
const bodySchema = z.object({
  since: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER).optional(),
});

export async function POST(
  request: Request,
  // Next 16: params is a Promise.
  { params }: { params: Promise<{ eventId: string }> },
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, code: "unauthorized", message: "Sign in." },
      { status: 401 },
    );
  }

  let body: unknown = {};
  try {
    const text = await request.text();
    body = text ? JSON.parse(text) : {};
  } catch {
    return NextResponse.json(
      { ok: false, code: "bad_request" },
      { status: 400 },
    );
  }
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, code: "bad_request" },
      { status: 400 },
    );
  }
  const since = parsed.data.since ?? null;

  const { eventId } = await params;
  const event = await getEvent(eventId);
  if (!event) {
    return NextResponse.json(
      { ok: false, code: "not_found", message: "No such event." },
      { status: 404 },
    );
  }

  const headers = new Headers({ "Cache-Control": "private, no-store" });
  const versions = await readAlbumVersions(event.id);
  const quietEtag = hostAlbumEtag({
    eventId: event.id,
    version: versions.version,
    attrVersion: versions.attrVersion,
  });
  if (since !== null && request.headers.get("if-none-match") === quietEtag) {
    headers.set("ETag", quietEtag);
    return new Response(null, { status: 304, headers });
  }

  const plan = await planAlbumSync({
    scope: "host",
    since,
    read: (after, limit) => readAlbumChanges(event.id, "host", after, limit),
    page: (after, budget) =>
      readHostManifestPage(supabase, event.id, after, budget),
  });
  headers.set(
    "ETag",
    hostAlbumEtag({
      eventId: event.id,
      version: plan.read.version,
      attrVersion: plan.read.attrVersion,
    }),
  );
  const payload: HostSyncBody = {
    ...plan.part,
    ok: true,
    counts: {
      album: plan.read.approved + (plan.read.hidden ?? 0),
      pending: plan.read.pending ?? 0,
    },
  };
  return NextResponse.json(payload, { headers });
}
