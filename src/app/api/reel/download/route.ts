/**
 * POST /api/reel/download — a GUEST saving the event's reel mp4 (R3, ADR-0022 rulings 3+4).
 *
 * Authz re-derives the viewer's gallery access from the capability token EXACTLY like the guest
 * export route (the RSC's computation re-run server-side; never trust client state) — but STRICTER:
 * the reel exists only at access FULL (ruled §5; export serves a teaser its capped set, this serves
 * a teaser nothing). The route can only ever answer with a presigned GET of an mp4 the host already
 * produced, or a refusal — a guest has NO write path, NO render, NO mint here.
 *
 * Response statuses, deliberately split by KIND of answer:
 *   200 `artifact` / 200 `no_artifact`  — both are valid LADDER answers ("here is the file" /
 *        "no file yet; you may self-encode"). `no_artifact` still carries the filename so a local
 *        encode names its file identically to the host's.
 *   404 `no_reel`  — ONE indistinguishable answer for absent/uncurated/unpublished (never a
 *        publish-state oracle), 403 `forbidden`, 429 `rate_limited` (+ Retry-After), 400.
 *
 * FRESHNESS is computed HERE, at request time (rendered_hash === the current render hash — TS-only,
 * render-hash.ts; SQL cannot reproduce it). The artifact is additionally BLESSED against a
 * post-finalize overwrite exactly like beginClientReelUpload's cache block: an object newer than
 * rendered_at (+30s skew) was not the row's mp4 — never serve bytes the row did not bless.
 */
import { NextResponse } from "next/server";

import { getEventByQrToken } from "@/lib/db/queries/guest-events";
import type { Database } from "@/lib/db/types";
import { isDemoToken } from "@/lib/demo";
import { resolveGalleryAccess } from "@/lib/events/gallery-access";
import { isEventOwner } from "@/lib/events/gallery-access.server";
import { isUnlocked } from "@/lib/events/unlock-cookie";
import { captureWarning } from "@/lib/observability/sentry";
import {
  reelDownloadBodySchema,
  type ReelDownloadResponse,
} from "@/lib/reel/guest-download-contract";
import {
  reelFilename,
  resolveReelRenderContext,
} from "@/lib/reel/render-service";
import { reelOutputKey } from "@/lib/r2/keys";
import { headObject, presignDownload } from "@/lib/r2/presign";
import {
  abuseHashes,
  checkAbuseRate,
  recordAbuseEvent,
} from "@/lib/security/abuse-rate-limit-store";
import { clientIp } from "@/lib/security/unlock-rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ReelRow = Database["public"]["Tables"]["highlight_reels"]["Row"];
// TODO(drop after types regen): `guest_visible` lands with the 20260730120000 migration.
type ReelRowPendingRegen = ReelRow & { guest_visible?: boolean };

function json(body: ReelDownloadResponse, init?: ResponseInit) {
  return NextResponse.json(body, init);
}

export async function POST(request: Request) {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return json({ ok: false, code: "bad_request" }, { status: 400 });
  }
  const parsed = reelDownloadBodySchema.safeParse(raw);
  if (!parsed.success) {
    return json({ ok: false, code: "bad_request" }, { status: 400 });
  }
  const { qr_token } = parsed.data;

  const event = await getEventByQrToken(qr_token);
  if (!event.ok || event.data.visibility === "private") {
    return json({ ok: false, code: "forbidden" }, { status: 403 });
  }

  // Same access computation as the gallery RSC + poll + export. getUser(), never getSession().
  const isDemo = isDemoToken(qr_token);
  let isAuthed = false;
  let isOwner = false;
  if (!isDemo) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      isAuthed = Boolean(user.email_confirmed_at);
      isOwner = await isEventOwner(event.data.id, user.id, supabase);
    }
  }
  const unlocked =
    event.data.visibility === "password"
      ? await isUnlocked(event.data.id)
      : true;
  const access = isDemo
    ? "full"
    : resolveGalleryAccess(event.data, {
        isOwner,
        isAuthed,
        isUnlocked: unlocked,
      });
  // STRICTER than export on purpose: below FULL the reel does not exist for this viewer (ruled §5).
  if (access !== "full") {
    return json({ ok: false, code: "forbidden" }, { status: 403 });
  }

  const admin = createAdminClient();
  const ctx = await resolveReelRenderContext(admin, event.data.id);
  const row = (ctx?.row ?? null) as ReelRowPendingRegen | null;
  // ONE indistinguishable `no_reel` for absent / uncurated / unpublished (the contract's oracle note).
  if (
    !ctx ||
    row?.guest_visible !== true ||
    ctx.orderedApprovedIds.length === 0
  ) {
    return json({ ok: false, code: "no_reel" }, { status: 404 });
  }

  const filename = reelFilename(ctx.eventName);

  // The venue-NAT-aware limiter (kind reel_guest_download): check BEFORE presigning, record only
  // after a successful artifact mint below (a `no_artifact` answer mints nothing). Fails OPEN —
  // access above is the real gate — but visibly (the armed warning), per the house pattern.
  let hashes: { ipHash: string; scopeHash: string } | null = null;
  try {
    hashes = abuseHashes(
      clientIp(request.headers),
      "reel_guest_download",
      event.data.qr_token,
    );
    const gate = await checkAbuseRate(
      "reel_guest_download",
      hashes.ipHash,
      hashes.scopeHash,
    );
    if (!gate.allowed) {
      return json(
        {
          ok: false,
          code: "rate_limited",
          retryAfterSec: gate.retryAfterSec,
        },
        {
          status: 429,
          headers: { "Retry-After": String(gate.retryAfterSec) },
        },
      );
    }
  } catch {
    captureWarning("security", "abuse_limiter_unavailable_fail_open", {
      kind: "reel_guest_download",
    });
  }

  // Artifact state, mirroring beginClientReelUpload's cache block: a candidate row must have its
  // object present, non-empty, and BLESSED (not newer than rendered_at + 30s skew — a still-valid
  // mint presign from a superseded attempt can rewrite the stable key after finalize).
  const candidate = row.status === "ready" && !!row.output_key;
  if (candidate) {
    const renderedAtMs = row.rendered_at
      ? new Date(row.rendered_at).getTime()
      : null;
    const meta = await headObject({ key: reelOutputKey(event.data.id) });
    const blessed =
      meta != null &&
      meta.size > 0 &&
      (renderedAtMs == null ||
        meta.lastModified == null ||
        meta.lastModified.getTime() <= renderedAtMs + 30_000);
    if (blessed) {
      const fresh = row.rendered_hash === ctx.hash;
      const url = await presignDownload({
        key: reelOutputKey(event.data.id),
        downloadFilename: filename,
      });
      if (hashes) {
        // Best-effort observability, never in the response path's way: the limiter event (what the
        // breadth/backstop windows count) + a reel_render_log row so /admin/reels sees guest pulls.
        await recordAbuseEvent(
          "reel_guest_download",
          hashes.ipHash,
          hashes.scopeHash,
        ).then(
          () => {},
          () => {},
        );
        await admin
          .from("reel_render_log")
          .insert({
            event_id: event.data.id,
            requester_hash: hashes.ipHash,
            render_id: row.render_id,
            outcome: "guest_download",
            cost_usd: 0,
          })
          .then(
            () => {},
            () => {},
          );
      }
      return json({ ok: true, mode: "artifact", fresh, url, filename });
    }
  }

  // The reel exists and this viewer may see it — there is just no (blessed) mp4. The overlay's
  // ladder takes it from here: self-encode where WebCodecs allows, else "ask the host".
  return json({ ok: false, code: "no_artifact", filename });
}
