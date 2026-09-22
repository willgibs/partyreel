/**
 * THE TWO CALLS THE DOOR MAKES (the identity reshape, 2026-09-21).
 *
 * Anonymity left the product on Will's `address=none` and his note: a host's
 * switch is **Require verified emails**, and with it OFF a guest types a display
 * name at the door and uploads under it, marked until they confirm. That door
 * has exactly two verbs, and they live here rather than inside a component so
 * the entry modal, the header's rename and the upload queue's silent join all
 * speak to the route through one shape.
 *
 *   joinEvent({ qrToken, displayName? })  -> POST /api/guests
 *   renameGuest({ qrToken, sessionToken, displayName }) -> POST /api/guests/name
 *
 * ★ THE NAME IS OPTIONAL HERE AND REQUIRED THERE. `create_guest` accepts a
 * nameless mint on purpose (wave 0's finding: production keeps working through
 * the flip), so the REQUIREMENT is the route's, returned as a 422 `name_required`.
 * This module carries no policy of its own: it hands whatever it is given to the
 * route and translates the answer. The one thing it does locally is parse the
 * name through `displayNameSchema` (the single source, `lib/validation/profile.ts`),
 * because a reserved name refused in place beats a round trip that says the same
 * thing. Profanity is NOT checked here and must not be: the obscenity matcher is
 * server-only, and the route re-parses everything anyway.
 *
 * ★ NO REACT, NO SONNER, NO SUPABASE. Kept dependency-free like
 * `session-tokens.ts` beside it, so the refusal mapping is unit-testable in the
 * node env with a stubbed `fetch` and every caller decides how a refusal is SAID.
 */
import { displayNameSchema } from "@/lib/validation/profile";

/**
 * Why a join or a rename did not happen. `name_required` and `name_invalid` are
 * the door's own business (it shows them under the field); `verification_required`
 * means the host flipped the switch ON while this guest was standing at the door,
 * so the session they hold is worth nothing and the gate is the way in;
 * `invalid_session` is a DEAD token — `/api/guests/name`'s own "not found"
 * (Postgres's `NO_DATA_FOUND`), the row this session named no longer exists;
 * `unauthorized` is a VERIFIED row (their name is their profile's, so a rename
 * is refused outright) from that same route, or a private event from the join
 * route; `other` carries the server's own sentence for everything else (rate
 * limits, a dead link), which is always better than a house paraphrase.
 */
export type JoinRefusal = {
  kind:
    | "name_required"
    | "name_invalid"
    | "verification_required"
    | "invalid_session"
    | "unauthorized"
    | "other";
  message: string;
};

export type JoinedGuest = {
  sessionToken: string;
  /** The name the row carries, or null for a verified guest (their profile is the identity). */
  displayName: string | null;
  /** True when this session is a confirmed account's (`guests.verified_at` set). */
  verified: boolean;
};

export type JoinResult =
  | { ok: true; guest: JoinedGuest }
  | { ok: false; refusal: JoinRefusal };

/** The two routes' own codes, so a typo cannot silently become an `other`. */
const REFUSALS = new Set([
  "name_required",
  "name_invalid",
  "verification_required",
  "invalid_session",
  "unauthorized",
]);

function refusalOf(body: unknown, fallback: string): JoinRefusal {
  const code = (body as { code?: unknown } | null)?.code;
  const message = (body as { message?: unknown } | null)?.message;
  const said = typeof message === "string" && message.trim() ? message : fallback;
  if (typeof code === "string" && REFUSALS.has(code)) {
    return { kind: code as JoinRefusal["kind"], message: said };
  }
  return { kind: "other", message: said };
}

const OFFLINE: JoinRefusal = {
  kind: "other",
  message: "Check your connection and try again.",
};

/**
 * Parse a typed name through the shared schema. Returns the trimmed name, or the
 * schema's own sentence. A blank string is `name_required` rather than
 * `name_invalid`, because "Enter a name." is the door's empty state and not a
 * complaint about what was typed.
 */
export function checkDisplayName(
  raw: string,
): { ok: true; name: string } | { ok: false; refusal: JoinRefusal } {
  if (!raw.trim()) {
    return {
      ok: false,
      refusal: { kind: "name_required", message: "Enter a name." },
    };
  }
  const parsed = displayNameSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      refusal: {
        kind: "name_invalid",
        message: parsed.error.issues[0]?.message ?? "That name isn't available.",
      },
    };
  }
  return { ok: true, name: parsed.data };
}

async function post(url: string, payload: unknown): Promise<Response | null> {
  try {
    return await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    return null;
  }
}

/**
 * Mint (or re-mint) this browser's guest session. `displayName` is omitted by the
 * queue's silent join and by every signed-in path: on a verified session the RPC
 * nulls a typed name anyway, because a confirmed account's identity is its profile
 * name and one row never carries two identities that can disagree.
 */
export async function joinEvent(input: {
  qrToken: string;
  displayName?: string;
}): Promise<JoinResult> {
  const res = await post("/api/guests", {
    qr_token: input.qrToken,
    // Absent rather than null when there is no name: the route's schema treats the
    // key as optional, and an explicit null is a different thing to have to allow.
    ...(input.displayName === undefined
      ? {}
      : { display_name: input.displayName }),
  });
  if (!res) return { ok: false, refusal: OFFLINE };

  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    // A non-JSON answer (a proxy's HTML error page) is still a refusal.
  }
  if (!res.ok || !(body as { ok?: unknown } | null)?.ok) {
    return {
      ok: false,
      refusal: refusalOf(body, "We couldn't start your uploads. Try again."),
    };
  }
  const ok = body as {
    session_token: string;
    display_name?: string | null;
    verified?: boolean;
  };
  return {
    ok: true,
    guest: {
      sessionToken: ok.session_token,
      displayName: ok.display_name ?? null,
      verified: Boolean(ok.verified),
    },
  };
}

/**
 * Rename the row this session token names. The token rides in the BODY, never a
 * URL (guest-flow.md's rule for every capability), and the route owns the
 * profanity and reserved-name gate plus its own limiter.
 */
export async function renameGuest(input: {
  qrToken: string;
  sessionToken: string;
  displayName: string;
}): Promise<{ ok: true; displayName: string } | { ok: false; refusal: JoinRefusal }> {
  const res = await post("/api/guests/name", {
    qr_token: input.qrToken,
    session_token: input.sessionToken,
    display_name: input.displayName,
  });
  if (!res) return { ok: false, refusal: OFFLINE };

  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    // as above
  }
  if (!res.ok || !(body as { ok?: unknown } | null)?.ok) {
    return {
      ok: false,
      refusal: refusalOf(body, "We couldn't change your name. Try again."),
    };
  }
  const ok = body as { display_name?: string | null };
  return { ok: true, displayName: ok.display_name ?? input.displayName };
}
