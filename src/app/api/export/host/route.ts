/**
 * Host "Download all" — summary + mint for the streaming export Worker.
 *
 * Authz: getUser() (never getSession) + an own-event RLS read (host_id match, NOT the open-event
 * policy) which also fetches the event name for the zip + filenames. The zip set is the host's
 * non-removed media (listEventMedia, RLS-scoped), filtered by the modal's type + include-hidden, or
 * — for bulk "Download selected" — narrowed to the selected ids (a foreign id simply can't match,
 * since listEventMedia already scopes to this event). The shared service does the kill-switch +
 * limiter + cap + token sign + log.
 *
 * ★ THE ALBUM IS READ WHOLE (the 1,000-row round): `listEventMedia` pages to the last row, so the
 * summary counts every item and a walk's parts (`part`, `after`: `export-flow` r1's `cap=split`)
 * cover every one; a request without a walk keeps the old 413 past one zip's 2,000 items. Through
 * one PostgREST request a 2,500-item album would arrive as its newest 1,000: the summary would
 * under-count, and the zip would silently leave out the oldest 1,500.
 */
import { NextResponse } from "next/server";

import { z } from "zod";

import { listEventMedia } from "@/lib/db/queries/media";
import { BULK_LIMIT_MESSAGE } from "@/lib/event/bulk-selection";
import {
  EXPORT_CURSOR_RE,
  type ExportMediaRow,
  MAX_EXPORT_ITEMS,
} from "@/lib/export/build-manifest";
import {
  exportSummary,
  mintExport,
  mintResponse,
} from "@/lib/export/export-service";
import { clientIp } from "@/lib/security/unlock-rate-limit";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  step: z.enum(["summary", "mint"]),
  event_id: z.uuid(),
  types: z.enum(["all", "photo", "video"]).default("all"),
  include_hidden: z.boolean().default(false),
  // Present only for bulk "Download selected" — narrows the set to these ids.
  ids: z.array(z.uuid()).min(1).max(MAX_EXPORT_ITEMS).optional(),
  // THE WALK (`cap=split`): which part this mint is, and where the last one ended. Every current
  // client sends `part`; without it, an album past one zip is the old 413 (build-manifest.ts).
  part: z.number().int().min(1).max(10_000).optional(),
  after: z.string().regex(EXPORT_CURSOR_RE).optional(),
});

function bad(message?: string) {
  return NextResponse.json(
    { ok: false, code: "bad_request", ...(message ? { message } : {}) },
    { status: 400 },
  );
}

/** A "Download selected" past the cap: the one bad body a host makes by hand (Select all). */
function overSelected(body: unknown): boolean {
  const ids = (body as { ids?: unknown } | null)?.ids;
  return Array.isArray(ids) && ids.length > MAX_EXPORT_ITEMS;
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return bad();
  }
  const parsed = bodySchema.safeParse(body);
  // The bar's other bulk verbs refuse the same selection in the same words (bulk-selection.ts).
  if (!parsed.success)
    return bad(overSelected(body) ? BULK_LIMIT_MESSAGE : undefined);
  const { step, event_id, types, include_hidden, ids, part, after } =
    parsed.data;
  // A position with no part to put it in is no request a client makes.
  if (after && (!part || part < 2)) return bad();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, code: "unauthorized" },
      { status: 401 },
    );
  }

  // Own-event check + the name in one RLS-scoped read (explicit host_id, not the open-event policy).
  // DELIBERATE swallow: this is an authz probe, so a failed read MUST fail closed.
  // `ev` undefined → 403, which is the safe answer to "I could not prove you own
  // this event". Do not "fix" this into a mustQuery.
  // eslint-disable-next-line partyreel/no-swallowed-db-error
  const { data: ev } = await supabase
    .from("events")
    .select("id, name")
    .eq("id", event_id)
    .eq("host_id", user.id)
    .maybeSingle();
  if (!ev) {
    return NextResponse.json({ ok: false, code: "forbidden" }, { status: 403 });
  }

  let mediaRows = await listEventMedia(event_id);
  if (ids && ids.length) {
    const set = new Set(ids);
    mediaRows = mediaRows.filter((m) => set.has(m.id));
  }
  const rows: ExportMediaRow[] = mediaRows.map((m) => ({
    id: m.id,
    type: m.type,
    original_key: m.original_key,
    file_size_bytes: m.file_size_bytes,
    status: m.status,
    created_at: m.created_at,
  }));

  if (step === "summary") {
    return NextResponse.json({ ok: true, summary: exportSummary(rows) });
  }

  const result = await mintExport({
    scope: "host",
    eventId: event_id,
    eventName: ev.name,
    rows,
    types,
    includeHidden: include_hidden,
    ip: clientIp(request.headers),
    walk: part ? { part, after: after ?? null } : undefined,
    // The Worker reports this export back here (`export-ends`): the deployment that minted it.
    appOrigin: new URL(request.url).origin,
  });
  return mintResponse(result);
}
