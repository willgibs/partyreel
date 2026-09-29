/**
 * Guest "Download all" — summary + mint for the streaming export Worker.
 *
 * Authz mirrors the gallery RSC + poll EXACTLY (the single source of "what this viewer sees"):
 * getEventByQrToken → resolveViewerDecision → loadGalleryRowsForAccess. A guest can NEVER export more
 * than `gallery.rows` (hidden/pending/removed are never in that set; a teaser caps to the 9; a
 * locked/private/none event is rejected). The guest gallery rows omit file_size_bytes, so the sizes
 * come from an authoritative admin read keyed by the ALREADY access-gated ids (never client input),
 * in chunks of `IN_CHUNK` ids, so the whole album is measured however large it is.
 *
 * `export-flow` r1 adds three things, each of which can only NARROW `gallery.rows`:
 *  - `set: "yours"` (`means=mine`), her own uploads, found here from her account and this browser's
 *    ticket (`yours.server.ts`), never from an id list; the summary carries Yours' own counts.
 *  - `ids`, a zip's missed ones asked again ("Try again for the 6"), intersected with what she sees.
 *  - `part` and `after` (`cap=split`), a walk through an album past one zip's ceilings.
 * ★ THE CLOSED DOOR IS ASKED FIRST ON EVERY ONE OF THEM, before anything is read (route.test.ts).
 */
import { NextResponse } from "next/server";

import { z } from "zod";

import { mustQuery } from "@/lib/db/must-query";
import { getEventByQrToken } from "@/lib/db/queries/guest-events";
import { isClosedToThisBrowser } from "@/lib/events/closed-door.server";
import { inChunks } from "@/lib/db/read-all";
import { isDemoToken } from "@/lib/demo";
import {
  isEventOwner,
  loadGalleryRowsForAccess,
  resolveViewerDecision,
} from "@/lib/events/gallery-access.server";
import { isUnlocked } from "@/lib/events/unlock-cookie";
import { readGuestSessionCookie } from "@/lib/guest/session-cookie";
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
import { ownMediaIds } from "@/lib/export/yours.server";
import { clientIp } from "@/lib/security/unlock-rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  step: z.enum(["summary", "mint"]),
  qr_token: z.string().min(1),
  types: z.enum(["all", "photo", "video"]).default("all"),
  // YOURS (`means=mine`): her own uploads, found on the server, never named by the request.
  set: z.enum(["album", "yours"]).default("album"),
  // A zip's missed ones, asked again: it narrows what she can see and never widens it.
  ids: z.array(z.uuid()).min(1).max(MAX_EXPORT_ITEMS).optional(),
  // THE WALK (`cap=split`): which part this mint is, and where the last one ended.
  part: z.number().int().min(1).max(10_000).optional(),
  after: z.string().regex(EXPORT_CURSOR_RE).optional(),
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
  const { step, qr_token, types, set, ids, part, after } = parsed.data;
  // A position with no part to put it in is no request a client makes.
  if (after && (!part || part < 2)) return bad();

  // A private album, or one closed to this browser by a block (the closed door: the same answer and
  // the same work, `closed-door.server.ts`), exports nothing.
  const event = await getEventByQrToken(qr_token);
  if (!event.ok || (await isClosedToThisBrowser(event.data))) {
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
  // This browser's ticket for the album: the upload gate's identity below, and Yours'.
  const sessionToken = isDemo
    ? null
    : await readGuestSessionCookie(event.data.id);
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
        sessionToken,
      });
  const access = decision.access;
  if (access === "none") {
    return NextResponse.json({ ok: false, code: "forbidden" }, { status: 403 });
  }

  const gallery = await loadGalleryRowsForAccess(event.data, access);

  // HER OWN, when anything asks for it: the summary's Yours row, or a Yours zip. Never the demo's
  // (nobody is anybody there), and never from the request.
  const wantsOwn = step === "summary" || set === "yours";
  const own =
    wantsOwn && !isDemo
      ? await ownMediaIds({ eventId: event.data.id, userId, sessionToken })
      : new Set<string>();

  // WHAT THIS REQUEST IS ABOUT, narrowed from what she can see and never past it. The summary
  // always measures the whole album (Yours is counted inside it); a mint takes its set, then its ids.
  let visible = gallery.rows;
  if (step === "mint" && set === "yours") {
    visible = visible.filter((r) => own.has(r.id));
  }
  if (step === "mint" && ids) {
    const asked = new Set(ids);
    visible = visible.filter((r) => asked.has(r.id));
  }
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
    visible.map((r) => r.id),
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
  const rows: ExportMediaRow[] = visible.flatMap((r) => {
    const size = sizeById.get(r.id);
    return size === undefined
      ? []
      : [
          {
            id: r.id,
            type: r.type,
            original_key: r.original_key,
            file_size_bytes: size,
            status: "approved" as const,
            created_at: r.created_at,
          },
        ];
  });

  if (step === "summary") {
    // Yours' own counts, or null when she has nothing here to take (no row is drawn then).
    const mine = rows.filter((r) => own.has(r.id));
    return NextResponse.json({
      ok: true,
      summary: exportSummary(rows),
      yours: mine.length > 0 ? exportSummary(mine) : null,
    });
  }

  const result = await mintExport({
    scope: "guest",
    eventId: event.data.id,
    eventName: event.data.name,
    rows,
    types,
    includeHidden: false,
    ip: clientIp(request.headers),
    walk: part ? { part, after: after ?? null } : undefined,
    zipLabel: set === "yours" ? "yours" : undefined,
  });
  return mintResponse(result);
}
