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
 * ★ THE DOOR IS ASKED FIRST ON EVERY ONE OF THEM, before anything is read (route.test.ts): a door that
 * shuts this viewer out or holds her at it exports nothing.
 *
 * ★ AND HER SAVE (take-home r1, `guest=select`, `save=light`): Select, then Save. A summary asked with `ids` (her
 * selection) adds `selection`, its buckets at both sizes, so her two choices show their sizes; `save` answers the
 * links her phone's share sheets are filled from, at phone size (a photograph's 2048 px copy, else its original; a
 * clip as taken), minted only when she saves. Both narrow what she can see by her ids (or her set), never widen it.
 */
import { NextResponse } from "next/server";

import { z } from "zod";

import { mustQuery } from "@/lib/db/must-query";
import { getEventByQrToken } from "@/lib/db/queries/guest-events";
import { readOwnSealedMedia } from "@/lib/db/queries/guest-events-admin";
import {
  doorCallerFor,
  isShut,
  resolveGuestDoor,
} from "@/lib/events/closed-door.server";
import { doorGalleryDecision } from "@/lib/events/gallery-access";
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
import { readPhoneCopies } from "@/lib/export/phone-copies.server";
import { saveItemsFor } from "@/lib/export/take-home.server";
import { ownMediaIds } from "@/lib/export/yours.server";
import { clientIp } from "@/lib/security/unlock-rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  // `save` (take-home r1): the links her phone's Save fills its share sheets from.
  step: z.enum(["summary", "mint", "save"]),
  qr_token: z.string().min(1),
  types: z.enum(["all", "photo", "video"]).default("all"),
  // YOURS (`means=mine`): her own uploads, found on the server, never named by the request.
  set: z.enum(["album", "yours"]).default("album"),
  // A zip's missed ones asked again, or her selection (Select, then Save): it narrows what she can see and never
  // widens it.
  ids: z.array(z.uuid()).min(1).max(MAX_EXPORT_ITEMS).optional(),
  // Which copies a Save takes: her Save into Photos asks for phone size.
  size: z.enum(["original", "phone"]).default("original"),
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
  const { step, qr_token, types, set, ids, size, part, after } = parsed.data;
  // A position with no part to put it in is no request a client makes.
  if (after && (!part || part < 2)) return bad();

  // A door that shuts this viewer out (a block, a decline, a closed door and Only me: the same answer
  // and the same work, `closed-door.server.ts`), or holds her at it (the held door, the ask, a gate's
  // newcomer), exports nothing.
  const found = await getEventByQrToken(qr_token);
  const door = found.ok
    ? await resolveGuestDoor(found.data, await doorCallerFor(found.data.id))
    : null;
  if (!door || isShut(door) || doorGalleryDecision(door.decision)) {
    return NextResponse.json({ ok: false, code: "forbidden" }, { status: 403 });
  }
  // The event as the door lets her meet it, with the pass its reads ask for.
  const event = door.event;
  const admitted = door.decision.kind === "through" && door.decision.admitted;

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
      isOwner = await isEventOwner(event.id, user.id, supabase);
    }
  }
  // Someone already in passes the password without it (the one rule for everyone already in).
  const unlocked =
    event.visibility === "password"
      ? admitted || (await isUnlocked(event.id))
      : true;
  // This browser's ticket for the album: the upload gate's identity below, and Yours'.
  const sessionToken = isDemo ? null : await readGuestSessionCookie(event.id);
  /* ★ THE UPLOAD GATE REACHES THE ZIP (the door as three steps, 2026-09-21). This route hands a
     viewer the real originals, so it must resolve the SAME decision the album does: a guest held at
     the upload step is `teaser`, and below gets the teaser's rows alone rather than every original
     in the album. Its identity comes from the `pr_guest_<eventId>` cookie, like the page's. */
  const decision = isDemo
    ? { access: "full" as const, gate: null }
    : await resolveViewerDecision(event, {
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

  const gallery = await loadGalleryRowsForAccess(event, access);

  // HER OWN, when anything asks for it: the summary's Yours row, or a Yours zip. Never the demo's
  // (nobody is anybody there), and never from the request.
  const wantsOwn = step === "summary" || set === "yours";
  const own =
    wantsOwn && !isDemo
      ? await ownMediaIds({ eventId: event.id, userId, sessionToken })
      : new Set<string>();

  // ★ HER OWN SEALED SHOTS ARE HERS TO TAKE (the develop): a sealed shot is in no album yet, hers included, so it is
  // no row of `gallery.rows`; but it is hers to see (her waiting room), so Yours adds exactly those of hers, found by
  // the server from the ids it already knows are hers. Only at full access, and never in the album's own zip.
  const inAlbum = new Set(gallery.rows.map((r) => r.id));
  const ownSealed =
    wantsOwn && access === "full" && own.size > 0
      ? (await readOwnSealedMedia(event.id, [...own])).filter(
          // Two reads, two clocks: a shot that developed between them is the album's, never twice.
          (r) => !inAlbum.has(r.id),
        )
      : [];
  const ownSealedIds = new Set(ownSealed.map((r) => r.id));

  // WHAT THIS REQUEST IS ABOUT, narrowed from what she can see and never past it. The summary
  // always measures the whole album (Yours is counted inside it); a mint takes its set, then its ids.
  let visible =
    step === "summary" ? [...gallery.rows, ...ownSealed] : gallery.rows;
  if (step !== "summary" && set === "yours") {
    visible = [...visible.filter((r) => own.has(r.id)), ...ownSealed];
  }
  if (step !== "summary" && ids) {
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
  // ★ EACH PHOTOGRAPH'S PHONE-SIZE COPY, where her Save's sizes or links need it (never for an originals zip):
  // read for exactly the photographs this request already narrowed to, after their sizes (whose read is the cap
  // guard and fails first).
  const phones =
    step === "mint"
      ? new Map<string, { key: string; bytes: number }>()
      : await readPhoneCopies(
          admin,
          visible.filter((r) => r.type === "photo").map((r) => r.id),
        );
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
            phone_key: phones.get(r.id)?.key ?? null,
            phone_bytes: phones.get(r.id)?.bytes ?? null,
          },
        ];
  });

  if (step === "summary") {
    // Yours' own counts (her sealed shots inside them), or null when she has nothing here to take (no row is drawn
    // then). The album's own summary is the album: her sealed shots are none of it.
    const mine = rows.filter((r) => own.has(r.id));
    // Her selection (Select, then Save), as far as she can see it: its sizes beside each choice.
    const asked = ids ? new Set(ids) : null;
    return NextResponse.json({
      ok: true,
      summary: exportSummary(rows.filter((r) => !ownSealedIds.has(r.id))),
      yours: mine.length > 0 ? exportSummary(mine) : null,
      ...(asked
        ? {
            selection: exportSummary(
              rows.filter((r) => asked.has(r.id) && !ownSealedIds.has(r.id)),
            ),
          }
        : {}),
    });
  }

  if (step === "save") {
    // What she picked (her ids), or a set: the whole album she sees (All), or Yours.
    const { items, more } = await saveItemsFor({
      rows: rows.filter((r) => types === "all" || r.type === types),
      eventName: event.name,
      size,
    });
    return NextResponse.json({ ok: true, items, more });
  }

  const result = await mintExport({
    scope: "guest",
    eventId: event.id,
    eventName: event.name,
    rows,
    types,
    includeHidden: false,
    ip: clientIp(request.headers),
    walk: part ? { part, after: after ?? null } : undefined,
    zipLabel: set === "yours" ? "yours" : undefined,
    // The Worker reports this export back here (`export-ends`): the deployment that minted it.
    appOrigin: new URL(request.url).origin,
  });
  return mintResponse(result);
}
