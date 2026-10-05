import type { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { z } from "zod";

import { readHostManifestPage } from "@/lib/db/queries/album-host";
import {
  readAlbumChanges,
  readAlbumVersions,
} from "@/lib/db/queries/album-state";
import { getEvent } from "@/lib/db/queries/events";
import type { Database } from "@/lib/db/types";
import { readHostLinksBody } from "@/lib/event/host-links.server";
import { planAlbumSync } from "@/lib/events/album-sync";
import { hostAlbumEtag } from "@/lib/events/album-validator";
import {
  hostCarriedIds,
  type HostCarriedLinks,
  type HostCarriedSync,
} from "@/lib/events/album-wire-carry";
import { captureError } from "@/lib/observability/sentry";
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
 * ★ A DELTA CARRIES ITS NEW ITEMS' LINKS (compute-reads, as the guest's does: album-calm, PRICING lever 1c): the
 * newest approved upserts' (`hostCarriedIds`: a held or hidden one carries none, since the hub draws nothing for a
 * held upload and the host's own Hide is an upsert whose tile already holds its link), minted exactly as the links
 * route mints them (`readHostLinksBody`, the one builder of the host's links answer, like counts included), so a batch
 * of photographs arrives on the hub in this one call where it took two. A failed read is reported and costs the delta
 * nothing (the hub then asks the links route, as it always has), and the validator never moves for them: a 304 carries
 * nothing.
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
  const carry =
    plan.part.kind === "delta" ? hostCarriedIds(plan.part.upsert) : [];
  const links =
    carry.length > 0 ? await carriedLinks(supabase, event, carry) : null;
  const payload: HostCarriedSync = {
    ...plan.part,
    ok: true,
    counts: {
      album: plan.read.approved + (plan.read.hidden ?? 0),
      pending: plan.read.pending ?? 0,
    },
    ...(links ? { links } : {}),
  };
  return NextResponse.json(payload, { headers });
}

/**
 * A delta's carried links (see the head note), or null for none: the read found none of them, or it FAILED, which is
 * reported and never takes the delta down with it (the hub then asks the links route, as it always has). It runs after
 * the caller's own check (`getUser()`, then the event through RLS), which is what `readHostLinksBody` requires.
 */
async function carriedLinks(
  supabase: SupabaseClient<Database>,
  event: { id: string; name: string },
  ids: string[],
): Promise<HostCarriedLinks | null> {
  try {
    const minted = await readHostLinksBody(supabase, event, ids);
    if (minted.links.length === 0) return null;
    return {
      b: minted.b,
      now: minted.now,
      links: minted.links,
      likes: minted.likes,
    };
  } catch (error) {
    captureError("media", error, {
      eventId: event.id,
      seam: "host album sync: a delta's carried links",
    });
    return null;
  }
}
