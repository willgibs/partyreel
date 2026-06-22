/**
 * Host "Download all" — summary + mint for the streaming export Worker.
 *
 * Authz: getUser() (never getSession) + an own-event RLS read (host_id match, NOT the open-event
 * policy) which also fetches the event name for the zip + filenames. The zip set is the host's
 * non-removed media (listEventMedia, RLS-scoped), filtered by the modal's type + include-hidden, or
 * — for bulk "Download selected" — narrowed to the selected ids (a foreign id simply can't match,
 * since listEventMedia already scopes to this event). The shared service does the kill-switch +
 * limiter + cap + token sign + log.
 */
import { NextResponse } from "next/server";

import { z } from "zod";

import { listEventMedia } from "@/lib/db/queries/media";
import {
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
});

function bad() {
  return NextResponse.json({ ok: false, code: "bad_request" }, { status: 400 });
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return bad();
  }
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return bad();
  const { step, event_id, types, include_hidden, ids } = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ ok: false, code: "unauthorized" }, { status: 401 });
  }

  // Own-event check + the name in one RLS-scoped read (explicit host_id, not the open-event policy).
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
    type: m.type,
    original_key: m.original_key,
    file_size_bytes: m.file_size_bytes,
    status: m.status,
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
  });
  return mintResponse(result);
}
