/**
 * Guest "Download all" — summary + mint for the streaming export Worker.
 *
 * Authz mirrors the gallery RSC + poll EXACTLY (the single source of "what this viewer sees"):
 * getEventByQrToken → resolveViewerDecision → loadGalleryRowsForAccess. A guest can NEVER export more
 * than `gallery.rows` (hidden/pending/removed are never in that set; a teaser caps to the 9; a
 * locked/private/none event is rejected). The guest gallery rows omit file_size_bytes, so the sizes
 * come from an authoritative admin read keyed by the ALREADY access-gated ids (never client input),
 * in chunks of `IN_CHUNK` ids, so the whole album is measured however large it is.
 */
import { NextResponse } from "next/server";

import { z } from "zod";

import { mustQuery } from "@/lib/db/must-query";
import { getEventByQrToken } from "@/lib/db/queries/guest-events";
import { inChunks } from "@/lib/db/read-all";
import { isDemoToken } from "@/lib/demo";
import {
  isEventOwner,
  loadGalleryRowsForAccess,
  resolveViewerDecision,
} from "@/lib/events/gallery-access.server";
import { isUnlocked } from "@/lib/events/unlock-cookie";
import { readGuestSessionCookie } from "@/lib/guest/session-cookie";
import type { ExportMediaRow } from "@/lib/export/build-manifest";
import {
  exportSummary,
  mintExport,
  mintResponse,
} from "@/lib/export/export-service";
import { clientIp } from "@/lib/security/unlock-rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  step: z.enum(["summary", "mint"]),
  qr_token: z.string().min(1),
  types: z.enum(["all", "photo", "video"]).default("all"),
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
  const { step, qr_token, types } = parsed.data;

  const event = await getEventByQrToken(qr_token);
  if (!event.ok || event.data.visibility === "private") {
    return NextResponse.json({ ok: false, code: "forbidden" }, { status: 403 });
  }

  // Same access computation as the gallery RSC + poll. Authorize with getUser(), never getSession().
  const isDemo = isDemoToken(qr_token);
  let isAuthed = false;
  let isOwner = false;
  let userId: string | null = null;
  if (!isDemo) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      userId = user.id;
      isAuthed = Boolean(user.email_confirmed_at);
      isOwner = await isEventOwner(event.data.id, user.id, supabase);
    }
  }
  const unlocked =
    event.data.visibility === "password"
      ? await isUnlocked(event.data.id)
      : true;
  /* ★ THE UPLOAD GATE REACHES THE ZIP (the door as three steps, 2026-09-21). This route hands a
     viewer the real originals, so it must resolve the SAME decision the album does: a guest held at
     the upload step is `teaser`, and below gets the teaser's rows alone rather than every original
     in the album. Its identity comes from the `pr_guest_<eventId>` cookie, like the page's. */
  const decision = isDemo
    ? { access: "full" as const, gate: null }
    : await resolveViewerDecision(event.data, {
        isOwner,
        isAuthed,
        isUnlocked: unlocked,
        userId,
        sessionToken: await readGuestSessionCookie(event.data.id),
      });
  const access = decision.access;
  if (access === "none") {
    return NextResponse.json({ ok: false, code: "forbidden" }, { status: 403 });
  }

  const gallery = await loadGalleryRowsForAccess(event.data, access);
  // mustQuery is the CAP GUARD here, not just hygiene. This is the only read of
  // the real byte sizes; if it failed silently every row fell back to 0, so a
  // 40 GB album summarised as "0 files, 0 bytes" (an empty-looking download to
  // the guest) AND sailed through the 20 GB ceiling in exportSummary. A failed
  // size read must abort the export, never approve an unmeasured one, and a
  // failed chunk stops the rest (inChunks).
  //
  // ★ READ IN CHUNKS (the 1,000-row round). The album is read whole now, and one
  // `.in("id", ids)` over all of it put every id in a single URL, which fails
  // outright past about 200 ids; `inChunks` sends at most 150 a request, each
  // chunk at most one row an id, far under the 1,000-row cap.
  const admin = createAdminClient();
  const sizes = await inChunks(
    "export/guest: media sizes",
    gallery.rows.map((r) => r.id),
    async (chunk) =>
      (await mustQuery(
        admin.from("media").select("id, file_size_bytes").in("id", chunk),
        "export/guest: media sizes",
      )) ?? [],
  );
  const sizeById = new Map(sizes.map((s) => [s.id, s.file_size_bytes]));
  // ★ AN UNMEASURED ROW IS NEVER ZERO BYTES. With every chunk read, an id with no
  // size is a row that stopped existing between the album read and this one (a
  // purge or a deletion racing the request): it leaves the export rather than
  // counting as nothing toward the 20 GB ceiling, and its object may be gone.
  const rows: ExportMediaRow[] = gallery.rows.flatMap((r) => {
    const size = sizeById.get(r.id);
    return size === undefined
      ? []
      : [
          {
            type: r.type,
            original_key: r.original_key,
            file_size_bytes: size,
            status: "approved" as const,
          },
        ];
  });

  if (step === "summary") {
    return NextResponse.json({ ok: true, summary: exportSummary(rows) });
  }

  const result = await mintExport({
    scope: "guest",
    eventId: event.data.id,
    eventName: event.data.name,
    rows,
    types,
    includeHidden: false,
    ip: clientIp(request.headers),
  });
  return mintResponse(result);
}
