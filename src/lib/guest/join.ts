/**
 * THE THREE CALLS THE DOOR MAKES (the identity reshape, 2026-09-21; the
 * optional address added by "guest identity: name only, unconfirmed email,
 * verified account", 2026-09-22).
 *
 * Anonymity left the product on Will's `address=none` and his note: a host's
 * switch is **Require verified emails**, and with it OFF a guest types a display
 * name at the door and uploads under it, marked until they confirm. That door
 * has three verbs, and they live here rather than inside a component so the
 * entry modal, the header's rename, the guest menu's add-email dialog and the
 * upload queue's silent join all speak to the routes through one shape.
 *
 *   joinEvent({ qrToken, displayName?, email? })  -> POST /api/guests
 *   renameGuest({ qrToken, sessionToken, displayName }) -> POST /api/guests/name
 *   attachGuestEmail({ qrToken, sessionToken, email }) -> POST /api/guests/email
 *
 * ★ THE ADDRESS IS A CLAIM NUMBER, NOT AN IDENTITY (Will, 2026-09-22, verbatim:
 * a names-mode door entry without a login is "simply a name with an invisible
 * claim number (the email)"). It is stored UNCONFIRMED in `guests.pending_email`,
 * never shown to the host or to another guest, never mailed on its own. Nothing
 * here ever reads one back: both routes answer with a BOOLEAN (`email_attached`)
 * and never the address, so no surface above this module can leak what it was
 * never handed.
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
import { parseGuestEmail } from "@/lib/validation/upload";

/**
 * Why a join or a rename did not happen. `name_required` and `name_invalid` are
 * the door's own business (it shows them under the field); `verification_required`
 * means the host flipped the switch ON while this guest was standing at the door,
 * so the session they hold is worth nothing and the gate is the way in;
 * `invalid_session` is a DEAD token — `/api/guests/name`'s own "not found"
 * (Postgres's `NO_DATA_FOUND`), the row this session named no longer exists;
 * `unauthorized` is a VERIFIED row (their name is their profile's, so a rename
 * is refused outright) from that same route, or a private event from the join
 * route; `email_invalid` is the optional address at the door, refused in the
 * same slot the name's refusals land in; `other` carries the server's own
 * sentence for everything else (rate limits, a dead link), which is always
 * better than a house paraphrase.
 */
export type JoinRefusal = {
  kind:
    | "name_required"
    | "name_invalid"
    | "email_invalid"
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
  /**
   * The row now carries an UNCONFIRMED address. A boolean, never the address:
   * the route answers `email_attached` and nothing more, and this device stores
   * only the boolean beside its name (`use-stored-name.ts`).
   */
  emailAttached: boolean;
};

export type JoinResult =
  | { ok: true; guest: JoinedGuest }
  | { ok: false; refusal: JoinRefusal };

/** The two routes' own codes, so a typo cannot silently become an `other`. */
const REFUSALS = new Set([
  "name_required",
  "name_invalid",
  "email_invalid",
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

/**
 * Parse the door's OPTIONAL address. A blank field is `{ok: true, email: null}`
 * and not a refusal, because "I would rather not" is a valid answer to an
 * optional question and the guest is already past the field by then. That one
 * rule is the whole difference between this and the route's own parse.
 *
 * ★ EVERYTHING ELSE IS `parseGuestEmail`'S, NOT THIS MODULE'S. The trim, the
 * lowercase, the 254 and the regex are the ROUTE's policy (`lib/validation/
 * upload.ts`, which the route, the column's CHECK and this field all read), and
 * a second copy here would be the kind of drift that shows up as a door that
 * accepts what the server then refuses. This exists for the same reason
 * `checkDisplayName` does: a typo answered under the field beats a round trip
 * that says the same thing, and the sentence it says is the route's own.
 */
export function checkGuestEmail(
  raw: string,
): { ok: true; email: string | null } | { ok: false; refusal: JoinRefusal } {
  if (!raw.trim()) return { ok: true, email: null };
  const parsed = parseGuestEmail(raw);
  if (!parsed.ok) {
    return {
      ok: false,
      refusal: { kind: "email_invalid", message: parsed.message },
    };
  }
  return { ok: true, email: parsed.email };
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
  /**
   * The door's optional address, sent ONLY when a guest typed one. A verified
   * session never carries it (the route ignores the field beside a confirmed
   * account), and a verified-required event nulls it before the insert.
   */
  email?: string;
}): Promise<JoinResult> {
  const res = await post("/api/guests", {
    qr_token: input.qrToken,
    // Absent rather than null when there is no name: the route's schema treats the
    // key as optional, and an explicit null is a different thing to have to allow.
    ...(input.displayName === undefined
      ? {}
      : { display_name: input.displayName }),
    // Same rule for the address: the optional field's empty state sends no key
    // at all, so the join body of a guest who declined is byte-for-byte the one
    // the door sent before this field existed.
    ...(input.email === undefined ? {} : { email: input.email }),
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
    email_attached?: boolean;
  };
  return {
    ok: true,
    guest: {
      sessionToken: ok.session_token,
      displayName: ok.display_name ?? null,
      verified: Boolean(ok.verified),
      emailAttached: Boolean(ok.email_attached),
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

/**
 * Put an UNCONFIRMED address on the row this session token names, or take one
 * off it (`email: null`). The token rides in the BODY like every other guest
 * capability, and the route owns the parse, the limiter and the refusals.
 *
 * ★ IT IS THE SECOND WAY IN, NOT THE FIRST. The door's own field rides the join
 * in ONE post; this is for the two doors that come later: the guest menu's "Add
 * your email" on an album already entered, and the held-session path at the door
 * (a row minted before this round, renamed first, then given the address it was
 * never asked for).
 *
 * ★ AND IT NEVER HANDS THE ADDRESS BACK. The answer is `email_attached`, a
 * boolean, for the same reason the join's is: a route that could echo an
 * unconfirmed address is a route a host could be pointed at.
 */
export async function attachGuestEmail(input: {
  qrToken: string;
  sessionToken: string;
  email: string | null;
}): Promise<
  { ok: true; emailAttached: boolean } | { ok: false; refusal: JoinRefusal }
> {
  const res = await post("/api/guests/email", {
    qr_token: input.qrToken,
    session_token: input.sessionToken,
    email: input.email,
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
      refusal: refusalOf(body, "We couldn't save that email. Try again."),
    };
  }
  const ok = body as { email_attached?: boolean };
  return { ok: true, emailAttached: Boolean(ok.email_attached) };
}
