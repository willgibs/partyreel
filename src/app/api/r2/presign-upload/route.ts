import { getUploadContext } from "@/lib/db/mutations/guest";
import { parseRollCount, type RollCount } from "@/lib/disposable/roll";
import { cameraShotRefusal } from "@/lib/disposable/shot";
import { mayUploadPastLock } from "@/lib/events/upload-lock";
import { checkSessionOwner } from "@/lib/guest/session-owner.server";
import { guestUploadsOpen } from "@/lib/jobs/spend-watch-switches";
import { captureWarning } from "@/lib/observability/sentry";
import {
  checkAbuseRate,
  recordAbuseEvent,
  sessionAbuseHashes,
} from "@/lib/security/abuse-rate-limit-store";
import { splitBurst } from "@/lib/upload/burst";
// ★ The album's cap sentences, one home with the complete's backstop: a guest's words name the album, never the plan.
import {
  ALBUM_STORAGE_FULL,
  ALBUM_UPLOADS_SPENT,
} from "@/lib/upload/cap-words";
import {
  runPresignPipeline,
  type PresignStrategy,
} from "@/lib/upload/server-pipeline";
import { formatBytes } from "@/lib/utils";
import { presignUploadSchema } from "@/lib/validation/upload";

/**
 * ★ HER ROLL AS A BURST'S SHOT MEETS IT (compute-uploads): the context counts the shots that have landed, and the shots
 * this burst admitted before this one land with it, so they are counted too, exactly as a shot sent one at a time met a
 * roll its earlier shots had already filled. Each is a frame and a take (`roll.ts`: a video is one shot).
 */
function rollAfter(roll: RollCount | null, earlier: number): RollCount | null {
  return roll && earlier > 0
    ? { ...roll, used: roll.used + earlier, taken: roll.taken + earlier }
    : roll;
}

/** Her own budget's refusal: what happened, and the one way out (the meter's hourly sentence is its neighbour). */
const BUDGET_SPENT =
  "You've sent a lot of uploads this hour. Try again in a little while.";

/**
 * ★ HER OWN BUDGET (`presign`; abuse-rate-limit.ts says why its numbers are what they are): one read of her ticket's
 * window and, under the line, every file of the burst counted in ONE insert before any of them is presigned (the
 * account kinds' order), so a burst costs one read and one write whatever its size, and a burst sent beside another
 * can miss the other's count only inside that one round trip, never across its whole presigning. A refused burst
 * counts nothing, so the window drains while she waits. Fails OPEN on a limiter error, like every guest kind: her
 * ticket and `create_media` are the real gates, and the meter's breaker stands behind it.
 */
async function spendPresignBudget(
  sessionToken: string,
  files: number,
): Promise<{ allowed: boolean; retryAfterSec: number }> {
  try {
    const { ipHash, scopeHash } = sessionAbuseHashes("presign", sessionToken);
    const gate = await checkAbuseRate("presign", ipHash, scopeHash);
    if (!gate.allowed) return gate;
    // Best-effort: a swallowed write only ever under-counts (fails open), and the store reports its own failures.
    await recordAbuseEvent("presign", ipHash, scopeHash, files).catch(() => {});
    return gate;
  } catch {
    captureWarning("security", "abuse_limiter_unavailable_fail_open", {
      kind: "presign",
    });
    return { allowed: true, retryAfterSec: 0 };
  }
}

/**
 * ONE REQUEST'S BUDGET: how many files its burst carries (`burstFiles`), and the window its refusal quotes, which the
 * engine has no seat for (a strategy's refusal carries no `Retry-After`), so `POST` puts it on the answer.
 */
type PresignBudget = { readonly files: number; retryAfterSec?: number };

/**
 * How many files this request carries, read off a clone before the engine reads the body, so her budget counts the
 * burst whole at its one ask. A body the engine cannot read counts none: it is refused whole before any gate.
 */
async function burstFiles(request: Request): Promise<number> {
  try {
    const burst = splitBurst(await request.clone().json());
    return burst === "malformed" ? 0 : burst.files.length;
  } catch {
    return 0;
  }
}

// Issues presigned URLs for a guest's browser → R2 DIRECT upload. The pipeline
// engine (lib/upload/server-pipeline.ts) owns the shared spine; this strategy
// owns the GUEST gates: the capability session, whose ticket it is (an
// account's row uploads only for that signed-in account), event state, video
// gating, caps, the host-configurable per-event size cap (which binds
// GUESTS ONLY — the host route has no equivalent check), and her own budget of
// files an hour. create_media (at complete) remains authoritative for
// everything re-checked here, but for the month, which the engine's meter
// counts and decides here at the presign.
//
// ★ A BURST (the engine's head note) asks the switch, the ticket's context, the lock, the ticket's owner and her own
// budget ONCE (`burst.memo`, keyed by what each depends on), and every gate about who is sending and where is the
// burst's own (`scope: "burst"`): one sentence answers the whole request, as it answered each file's. A video, a size,
// a shot and the meter are each file's own. Built per request, since her budget counts this request's files.
const guestPresignStrategy = (
  budget: PresignBudget,
): PresignStrategy<typeof presignUploadSchema> => ({
  schema: presignUploadSchema,
  async resolveEvent(parsed, kind, burst) {
    const token = parsed.session_token;
    // ★ THE PLATFORM'S UPLOADS SWITCH (the spend watch's offer, `ops_flags.uploads_enabled`), asked FIRST: while it
    // is off, a runaway costs one small read a request and nothing else, and the sentence is Partyreel's, never the
    // host's, so it says nothing about the album. It fails OPEN (`guestUploadsOpen`): a switch nobody can read never
    // stops a real party. A file already presigned completes; nothing in flight is cut.
    if (!(await burst.memo("uploads-open", guestUploadsOpen))) {
      return {
        ok: false,
        refusal: {
          status: 503,
          code: "uploads_paused",
          message:
            "Uploads are paused on Partyreel for now. Try again in a little while.",
          scope: "burst",
        },
      };
    }
    const ctx = await burst.memo(`context:${kind}:${token}`, () =>
      getUploadContext(token, kind),
    );
    if (!ctx.ok) {
      return {
        ok: false,
        refusal: {
          status: 401,
          code: "invalid_session",
          message: ctx.message,
          scope: "burst",
        },
      };
    }
    if (ctx.data.event_deleted) {
      return {
        ok: false,
        refusal: {
          status: 409,
          code: "event_gone",
          message: "This event is no longer available.",
          scope: "burst",
        },
      };
    }
    // The write path inherits the read gate (database-security.md), re-checked per request: the
    // context answers the DOOR as this ticket sees it (`get_upload_context`, the doors' migration
    // 20260929120000). A ticket past the door reads open, under a password or a gate added later too
    // (a gate stops newcomers, never the guests inside); a waiting, declined or blocked ticket reads
    // private, as every ticket does at Only me, which is how a leaked link's stranger is put out. The
    // lock outranks every other upload state: a viewer who can't see the album learns nothing else
    // about it. Owner uploads ride the host routes. `password` still decides on a database before the
    // doors' migration: the unlock cookie or the owner (mayUploadPastLock).
    if (ctx.data.visibility === "private") {
      return {
        ok: false,
        refusal: {
          status: 403,
          code: "unauthorized",
          message: "This event is private.",
          scope: "burst",
        },
      };
    }
    const eventId = ctx.data.event_id;
    if (
      ctx.data.visibility === "password" &&
      !(await burst.memo(`lock:${eventId}`, () => mayUploadPastLock(eventId)))
    ) {
      return {
        ok: false,
        refusal: {
          status: 403,
          code: "unlock_required",
          message: "This event is locked. Enter the event password to upload.",
          scope: "burst",
        },
      };
    }
    if (!ctx.data.accepting_uploads) {
      return {
        ok: false,
        refusal: {
          status: 403,
          code: "uploads_closed",
          message: "This event isn't accepting uploads right now.",
          scope: "burst",
        },
      };
    }
    // ★ WHOSE TICKET IS THIS (lib/guest/session-owner.ts). A row that carries an account writes only
    // for that signed-in account, so a browser that kept a confirmed guest's ticket cannot credit the
    // next person's photograph to them (another account, or anyone signed out, past Require verified
    // emails). Under the lock and the closed switch, which are the truer sentences when they hold for
    // everybody; ABOVE the identity gate, because a ticket that is not yours says nothing about
    // whether YOU have confirmed an email. The client reads the code by name, puts the ticket down
    // and joins as whoever is holding the phone, so this sentence is almost never seen.
    const owner = await burst.memo(`owner:${token}`, () =>
      checkSessionOwner(token),
    );
    if (!owner.ok) {
      return {
        ok: false,
        refusal: {
          status: 403,
          code: owner.code,
          message: owner.message,
          scope: "burst",
        },
      };
    }
    // ★ THE IDENTITY GATE, RE-CHECKED PER REQUEST. A session token minted while the event was
    // name-only would otherwise upload forever after the host flipped Require verified emails ON;
    // create_media refuses it anyway, but only after the file has already gone to R2, so the honest
    // place to say so is here, before the bytes move. Read from the CONTEXT (the RPC's own view of
    // the event and this guest's standing), never from anything the client sent. Sits under
    // accepting_uploads on purpose: when uploads are closed for everybody, "uploads are closed" is
    // the truer sentence than "prove an email".
    if (ctx.data.require_verified_email && !ctx.data.guest_verified) {
      // A flip's fallout must be VISIBLE. This is the signal that says a real party started
      // refusing real guests, and it is the difference between noticing within the hour and
      // hearing about it from the host.
      captureWarning("security", "upload_refused_unverified", {
        event_id: eventId,
        stage: "presign",
      });
      return {
        ok: false,
        refusal: {
          status: 403,
          code: "verification_required",
          message: "Confirm your email to add photos to this event.",
          scope: "burst",
        },
      };
    }
    // A free event is photos-only. The message is EVENT-framed, never
    // tier-framed — a guest must not learn the host's plan. A burst's photographs still go.
    if (ctx.data.video_blocked) {
      return {
        ok: false,
        refusal: {
          status: 403,
          code: "video_not_allowed",
          message: "This event accepts photos only.",
        },
      };
    }
    // Already full, or its uploads spent: no file of the burst fits (the meter judges each file that might).
    if (ctx.data.at_storage_cap || ctx.data.at_monthly_cap) {
      return {
        ok: false,
        refusal: {
          status: 409,
          code: "cap_reached",
          message: ctx.data.at_storage_cap
            ? ALBUM_STORAGE_FULL
            : ALBUM_UPLOADS_SPENT,
          scope: "burst",
        },
      };
    }
    // Host-configurable per-event cap (guests only). The universal 10 GB is
    // already enforced by the engine's validateUpload, so this only bites when
    // the host set a stricter cap; create_media re-checks on the R2-HEAD size.
    if (parsed.size_bytes > ctx.data.max_upload_bytes) {
      return {
        ok: false,
        refusal: {
          status: 422,
          code: "too_large",
          message: `Files for this event are capped at ${formatBytes(ctx.data.max_upload_bytes)}.`,
        },
      };
    }
    // ★ THE ALBUM'S CAMERA (20261002200000): a video shot has a length and a byte bound (`media/limits.ts`), her roll
    // holds its frames (24), and a period takes the roll and its 3 re-shoots. Refused here before the bytes move, in the server's own words;
    // create_media holds the same lines on the R2-HEAD size and counts the roll under its locks, so this is the
    // friendly half, never the boundary. A burst's earlier shots are counted on her roll (`rollAfter`).
    const shot = cameraShotRefusal(
      {
        capture: ctx.data.capture,
        roll: rollAfter(parseRollCount(ctx.data.roll), burst.admitted.files),
      },
      kind,
      parsed,
    );
    if (shot) return { ok: false, refusal: shot };
    // ★ HER OWN BUDGET, LAST AND ONCE A BURST (`spendPresignBudget`): only a file past every gate above can go on to
    // spend the host's hourly breaker, so the first such file asks, for the whole burst, and a burst the album cannot
    // take at all (closed, full, every file refused for itself) spends nothing. Under every other burst gate on
    // purpose: when they hold, their sentence is the truer one for everybody. No file is admitted before this answers,
    // so its refusal is always the whole request's, its window in `Retry-After` (`POST`). At least the file in hand is
    // counted, whatever the body's count said.
    const spent = await burst.memo(`budget:${token}`, () =>
      spendPresignBudget(token, Math.max(budget.files, 1)),
    );
    if (!spent.allowed) {
      budget.retryAfterSec = spent.retryAfterSec;
      return {
        ok: false,
        refusal: {
          status: 429,
          code: "rate_limited",
          message: BUDGET_SPENT,
          scope: "burst",
        },
      };
    }
    return { ok: true, eventId };
  },
  // ★ THE METER'S REFUSALS, IN THE ALBUM'S WORDS (upload-meter): the meter judges THIS file (the context above only
  // knew whether the album was already full), so a file the room or the month cannot take is refused here, before its
  // bytes move and before it spends the month. `cap_reached` keeps the refresh ladder the guest queue already reads
  // (`upload-refusal.ts`); the breaker's is a retry, the hour's end in `Retry-After`.
  meterRefusal(refusal) {
    switch (refusal.reason) {
      case "storage":
        return {
          status: 409,
          code: "cap_reached",
          message: ALBUM_STORAGE_FULL,
        };
      case "monthly":
        return {
          status: 409,
          code: "cap_reached",
          message: ALBUM_UPLOADS_SPENT,
        };
      case "hourly":
        return {
          status: 429,
          code: "rate_limited",
          message:
            "This album has taken a lot of uploads this hour. Try again in a little while.",
        };
      case "event_gone":
        return {
          status: 409,
          code: "event_gone",
          message: "This event is no longer available.",
        };
    }
  },
});

export async function POST(request: Request) {
  const budget: PresignBudget = { files: await burstFiles(request) };
  const response = await runPresignPipeline(
    request,
    guestPresignStrategy(budget),
  );
  // Her budget's refusal says when, as the meter's hourly one does (the engine sets that one's itself).
  if (budget.retryAfterSec && response.status === 429) {
    response.headers.set("Retry-After", String(budget.retryAfterSec));
  }
  return response;
}
