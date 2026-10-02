/**
 * WHICH PHOTOGRAPHS IN THIS ALBUM ARE THIS ANONYMOUS GUEST'S. Body:
 * `{ qr_token, session_token }` → `{ ok: true, ids: [...] }`.
 *
 * A guest can delete any photo they personally uploaded, with no time limit.
 * A signed-in viewer's list is computed in the page RSC (it
 * already has the user); an ANONYMOUS guest's identity is the device-bound
 * session token, which the page never sees — it lives in the browser's own
 * storage — so the browser asks for the list here and `live-gallery.tsx` caches
 * the answer for the session.
 *
 * ★ THE SERVER DECIDES, NOT THE BROWSER, and that is the whole reason this
 * route exists rather than a client-side ledger of what this tab uploaded. A
 * ledger would cover only uploads made after it shipped, would be lost with the
 * tab, and would be a client ASSERTION of ownership sitting one step away from
 * a delete. The list is read from the guest rows the token actually owns.
 *
 * ★ IT IS NOT IN THE GALLERY PAYLOAD, deliberately. `/api/guests/gallery`'s
 * ETag fingerprints content + access, which is shared by every viewer at that
 * access level; folding a per-VIEWER field into it would either break the
 * conditional poll or leak one guest's list to another.
 *
 * ★ THE TOKEN TRAVELS IN THE BODY, never the URL (a capability in a query
 * string ends up in a log, a referrer and somebody's history).
 *
 * An unknown token, a wrong event, a private event and an empty album all
 * answer the same empty list: from a browser they must be indistinguishable.
 *
 * ★ A SIGNED-IN ACCOUNT READS ONLY TICKETS THAT ARE HERS (crumbs-27, the read side of crumbs-26's owner
 * rule). On a shared phone the ticket in the body is whatever the phone still holds for the album, another
 * guest's name-only ticket included, and a list of "mine" made from it would offer her another guest's
 * photographs with a Remove control, and fill her tracker with their statuses. So the ticket is read only
 * as far as it may speak for her (her own row, or one the claim takes: `sortTickets`); signed out, it is the
 * device's, as it has always been.
 */
import { NextResponse } from "next/server";
import { z } from "zod";

import {
  countKeptTicketUploads,
  listSessionMediaIds,
  readOwnUploads,
  type OwnPicture,
  type OwnUpload,
} from "@/lib/db/mutations/guest-media";
import {
  getEventByQrToken,
  type GuestEvent,
} from "@/lib/db/queries/guest-events";
import { getUploadGate } from "@/lib/db/queries/guest-gate";
import type { RollCount } from "@/lib/disposable/roll";
import {
  doorCallerFor,
  isThrough,
  resolveGuestDoor,
} from "@/lib/events/closed-door.server";
import { sortTickets } from "@/lib/guest/session-owner.server";
import { TRACKER_TELLS_REFUSAL } from "@/lib/guest/upload-tracker";
import { captureError, captureWarning } from "@/lib/observability/sentry";
import { presignDownload } from "@/lib/r2/presign";
import {
  abuseHashes,
  checkAbuseRate,
} from "@/lib/security/abuse-rate-limit-store";
import { clientIp } from "@/lib/security/unlock-rate-limit";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const mineSchema = z.object({
  qr_token: z.string().trim().min(1),
  session_token: z.string().trim().min(1),
});

/**
 * ★ HER TRACKER'S ASK (`statuses: true`, `guest-capture` r1 `tracker=button`): where each of her
 * uploads here stands, `{ ok, items: [{ id, status }] }`, newest first. The one place a refusal can
 * be learned, since the album's sync moves only in and out of `approved` (`listOwnUploadStatuses`
 * says why). The token is optional here because an ACCOUNT speaks for its own rows: signed in, the
 * viewer is `getUser()`'s (never `getSession()`, a cookie is no boundary), and the answer is the
 * token's unclaimed row plus the account's rows at this event. Never an identity.
 *
 * ★ AND HER OWN PICTURES, FOR HER ALONE (the develop, and Will's walk of a held album, 2026-10-02: his held uploads
 * "landed" and vanished, with no way to remove them). An item the album cannot show her, held for the host's review or
 * sealed until the album develops (`sealed: true`), carries `picture: { type, at, tile }`: its preview (or the
 * original where it has none) presigned here, read only as far as the ticket is hers, so no other guest's read can
 * ever carry it. Never a refused item's (an operator's takedown is never presigned, even to its uploader). Her Remove
 * for any of them is the album's own (`/api/guests/remove`, `remove_my_upload`): both withdraw her own row in any
 * status, a held one before it ever reaches Review, a camera's shot giving its frame back (and purged that night). An
 * album with its camera on also answers her `roll` ({used, cap, taken, ceiling}).
 *
 * ★ AND, ASKED WITH `tell` (crumbs-38, the approval toast's server half): `news`, the ids of hers a decision let
 * into the album since she was last told, marked told as they are answered (`readOwnUploads`), so the album says
 * "One of yours is in the album" once across a reload, a return or her account's other device. Ids of her own
 * uploads, already in her `items`; never anybody else's, and nothing when the door holds her.
 */
const statusesSchema = z.object({
  qr_token: z.string().trim().min(1),
  session_token: z.string().trim().min(1).optional(),
  statuses: z.literal(true),
  tell: z.literal(true).optional(),
});

/**
 * ★ WHETHER THIS PHONE'S PHOTOS HERE ARE HERS NOW (`kept: true`, build 33's red-team): `{ ok, kept }`, the live
 * uploads on the body's ticket, counted only when its row is the signed-in account's (`getUser()`, never
 * `getSession()`) and the door lets it through. The album asks it once, when a confirm door opened there and her
 * own claim moved nothing, because the page's door read runs the claim first (`sortTickets`) and her claim alone
 * cannot tell a ticket already hers from one it left (`claim-uploads.ts`). A number, never an id; 0 for every "no":
 * signed out, another guest's ticket on a shared phone, a door that holds it.
 */
const keptSchema = z.object({
  qr_token: z.string().trim().min(1),
  session_token: z.string().trim().min(1),
  kept: z.literal(true),
});

/** The empty answer, used for every "no" this route is allowed to give. */
const NONE = { ok: true as const, ids: [] as string[] };

/** Every answer is per viewer: never cacheable. */
const PRIVATE = { "Cache-Control": "private, no-store" };

/**
 * The join limiter's BREADTH signal, checked and not recorded. Checked, because one IP asking about
 * many DISTINCT events is a token harvester and a venue is exactly one event. Not recorded, because
 * this runs once per guest page load: counting it into the per-(IP, event) backstop would let a busy
 * venue's ordinary browsing consume a ceiling that was sized for joins. Fails OPEN, like every other
 * guest route — the session token is the gate. Returns the refusal, or null to go on.
 */
async function breadthRefusal(
  request: Request,
  qrToken: string,
): Promise<Response | null> {
  try {
    const keys = abuseHashes(clientIp(request.headers), "join", qrToken);
    const gate = await checkAbuseRate("join", keys.ipHash, keys.scopeHash);
    if (!gate.allowed) {
      return NextResponse.json(
        { ok: false, code: "rate_limited" },
        { status: 429, headers: { "Retry-After": String(gate.retryAfterSec) } },
      );
    }
  } catch {
    captureWarning("security", "abuse_limiter_unavailable_fail_open", {
      kind: "join",
    });
  }
  return null;
}

/** Whether the door lets this ticket (and the account beside it) through to the album. */
async function letsThrough(
  event: GuestEvent,
  sessionToken: string | undefined,
): Promise<boolean> {
  const door = await resolveGuestDoor(
    event,
    await doorCallerFor(event.id, {
      bodyTokens: [sessionToken],
      cookie: false,
    }),
  );
  return isThrough(door);
}

/** The `getUser()` account asking, or null: never `getSession()`, a cookie is no boundary. */
async function viewerId(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

async function answerStatuses(
  request: Request,
  input: { qr_token: string; session_token?: string; tell?: true },
): Promise<Response> {
  const refused = await breadthRefusal(request, input.qr_token);
  if (refused) return refused;

  // A door that does not let this ticket through (a block, a door that shut, a ticket still waiting on
  // the host): the same empty answer (`closed-door.server.ts`, asked with the body's ticket beside the
  // account: this route never reads the cookie).
  const event = await getEventByQrToken(input.qr_token);
  if (!event.ok || !(await letsThrough(event.data, input.session_token))) {
    return NextResponse.json({ ok: true, items: [] }, { headers: PRIVATE });
  }
  const userId = await viewerId();
  const ticket = input.session_token
    ? ((await sortTickets(userId, [input.session_token])).hers[0] ?? null)
    : null;
  const [{ items, news, pictures }, roll] = await Promise.all([
    readOwnUploads({
      eventId: event.data.id,
      sessionToken: ticket,
      userId,
      tell: input.tell === true,
    }),
    rollOf(event.data, ticket, userId),
  ]);
  // `host-curation`'s `told` is the flag's to answer: at `never` a refusal is not hers to learn.
  const told = TRACKER_TELLS_REFUSAL
    ? items
    : items.filter((item) => item.status !== "refused");
  const pictured = await withPictures(told, pictures, event.data.id);
  return NextResponse.json(
    {
      ok: true,
      items: pictured,
      ...(input.tell ? { news } : {}),
      ...(roll ? { roll } : {}),
    },
    { headers: PRIVATE },
  );
}

/** Her own upload's picture, as her tracker draws it: the kind, when she took it, and its tile, for her alone. */
type OwnPictureLink = { type: "photo" | "video"; at: number; tile: string };

/**
 * Each of her items the album cannot show her gets its picture, presigned here (stable inside the bucket, like every
 * album link, so a re-ask hands the browser the URL it cached). A presign that fails costs that picture alone: the
 * item stays, drawn as the placeholder it always was, and the failure is reported.
 */
async function withPictures(
  items: OwnUpload[],
  pictures: OwnPicture[],
  eventId: string,
): Promise<(OwnUpload & { picture?: OwnPictureLink })[]> {
  if (pictures.length === 0) return items;
  const minted = await Promise.allSettled(
    pictures.map(async (p): Promise<[string, OwnPictureLink]> => [
      p.id,
      {
        type: p.type,
        at: Date.parse(p.created_at),
        tile: await presignDownload({
          key: p.preview_key ?? p.original_key,
          stable: true,
        }),
      },
    ]),
  );
  const links = new Map<string, OwnPictureLink>();
  for (const result of minted) {
    if (result.status === "fulfilled") links.set(...result.value);
    else {
      captureError("media", result.reason, {
        seam: "own_picture_presign",
        eventId,
      });
    }
  }
  return items.map((item) => {
    const picture = links.get(item.id);
    return picture ? { ...item, picture } : item;
  });
}

/** The camera's roll for this viewer (her ticket as far as it is hers, and her account), else null. */
async function rollOf(
  event: GuestEvent,
  ticket: string | null,
  userId: string | null,
): Promise<RollCount | null> {
  if (event.capture !== "camera" || (!ticket && !userId)) return null;
  const gate = await getUploadGate({
    eventId: event.id,
    sessionToken: ticket,
    userId,
  });
  return gate.roll ?? null;
}

async function answerKept(
  request: Request,
  input: { qr_token: string; session_token: string },
): Promise<Response> {
  const refused = await breadthRefusal(request, input.qr_token);
  if (refused) return refused;
  const kept = async (): Promise<number> => {
    const userId = await viewerId();
    if (!userId) return 0;
    const event = await getEventByQrToken(input.qr_token);
    if (!event.ok || !(await letsThrough(event.data, input.session_token))) {
      return 0;
    }
    return countKeptTicketUploads({
      eventId: event.data.id,
      sessionToken: input.session_token,
      userId,
    });
  };
  return NextResponse.json(
    { ok: true, kept: await kept() },
    { headers: PRIVATE },
  );
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, code: "bad_request" },
      { status: 400 },
    );
  }

  const keep = keptSchema.safeParse(body);
  if (keep.success) return answerKept(request, keep.data);

  const asked = statusesSchema.safeParse(body);
  if (asked.success) return answerStatuses(request, asked.data);

  const parsed = mineSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, code: "bad_request" },
      { status: 400 },
    );
  }
  const { qr_token, session_token } = parsed.data;

  const refused = await breadthRefusal(request, qr_token);
  if (refused) return refused;

  const event = await getEventByQrToken(qr_token);
  if (!event.ok || !(await letsThrough(event.data, session_token))) {
    return NextResponse.json(NONE);
  }

  // The ticket answers only as far as it is hers to the viewer (the header): a signed-in account on a shared
  // phone is not handed another guest's photographs.
  const ticket = (await sortTickets(await viewerId(), [session_token])).hers[0];
  if (!ticket) return NextResponse.json(NONE, { headers: PRIVATE });
  const ids = await listSessionMediaIds({
    eventId: event.data.id,
    sessionToken: ticket,
  });
  // Never cacheable: the answer is per session token.
  return NextResponse.json({ ok: true, ids }, { headers: PRIVATE });
}
