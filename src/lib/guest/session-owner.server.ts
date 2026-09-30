/**
 * THE SERVER HALF OF "WHOSE TICKET IS THIS?" (`session-owner.ts` holds the rule and the why).
 *
 * Every guest WRITE route that takes a session token from the body asks this before it writes:
 * the two upload routes (presign, and complete, since a presign outlives a sign-out by up to 2h),
 * and the rename and attach-address doors. The capability RPCs cannot ask it themselves: they run
 * on the service-role client, where `auth.uid()` is nobody, so the caller's identity has to come
 * from the route's own `getUser()` (never `getSession()`, which only decodes a cookie).
 *
 * ★ THE ANONYMOUS CROWD STILL PAYS ONE INDEXED READ AND NOTHING ELSE. Whether anyone is signed in is
 * the question for a name-only row too (crumbs-26), so `getUser()` is asked for every row that can be
 * somebody's; with no session it answers from the cookie jar and makes no request (auth-js returns
 * before its fetch), so the crowd behind one venue NAT (the common path) pays nothing for it, and a
 * signed-in guest pays the Auth round trip once per request, as on their own row. A confirmed row whose
 * account is gone is nobody's whoever asks, so it asks nobody.
 *
 * ★ A NAME-ONLY ROW AND A SIGNED-IN ACCOUNT: THE CLAIM DECIDES, THEN AND THERE. The row may be hers (a
 * ticket she typed at this album before she signed in, which her sign-in's claim takes and has not yet:
 * a sign-in in another tab, a claim that failed), or somebody else's that the sign-in rightly left on the
 * phone. `claim_anonymous_uploads` is the one place that tells them apart (`whose_ticket`, migration
 * 20260929234000), so it is asked about this one ticket, as her (her own client: `auth.uid()`), and the
 * row read again: taken, it is her row and she writes through it; left, it is refused as an account's is,
 * and the client puts it down and joins as her. It changes nothing her sign-in's claim would not have,
 * and a failed claim THROWS, for the reason a failed read does.
 *
 * ★ THE ROW'S ACCOUNT NEVER LEAVES THE SERVER. The answer is "may write" or the refusal code; the
 * `user_id` it was decided on is read on the service-role client and dropped here, so no response
 * can tell a browser whose ticket it was holding.
 *
 * ★ WHY THE READ AND THE CLAIM LIVE HERE AND NOT IN `src/lib/db/`: the read is one column the rule needs
 * and nothing else reads, and `forensics/capture.ts` resolves the same token on the same client for the
 * same reason (the RPCs that own the row return no `user_id`, by design); the claim is the browser's own
 * RPC (`claim-uploads.ts` calls it the same way), asked here as the same caller. No SQL changed for it.
 *
 * ★ THE READS ASK IT TOO (`sortTickets`, crumbs-27). The rule was the writes' alone, and on a shared phone
 * a signed-in account's READS still took whatever ticket the phone held for the album beside her account:
 * the door's standing counted her let in (or waiting, or blocked) through another guest's ticket, A photo
 * first counted another guest's contribution as hers, her Yours (the export's own ids, her tracker) listed
 * another guest's photographs. So every read that carries a ticket beside an account sorts them first:
 * the ones that may speak for her (her own rows, or one the claim just took) and the rest.
 */
import "server-only";

import {
  SESSION_OTHER_ACCOUNT,
  SESSION_OTHER_ACCOUNT_MESSAGE,
  sessionBelongsTo,
} from "@/lib/guest/session-owner";
import { mustQuery } from "@/lib/db/must-query";
import { inChunks } from "@/lib/db/read-all";
import { isSessionTokenShape } from "@/lib/guest/session-cookie";
import { captureError } from "@/lib/observability/sentry";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

/** A row as the owner rule reads it: who holds it, and whether an address was proved on it. */
type OwnerRow = { userId: string | null; verified: boolean };

export type SessionOwnerCheck =
  | { ok: true }
  | {
      ok: false;
      code: typeof SESSION_OTHER_ACCOUNT;
      message: string;
    };

/**
 * May THIS request write through the row `sessionToken` names?
 *
 * An unknown token answers `ok`, deliberately: the capability RPC behind every caller owns the
 * canonical refusal for a dead session (`invalid_session`), and a second opinion here would only
 * be a second way of saying it. A read failure THROWS, the house posture for this path
 * (`getUploadContext` throws on the same class of error): failing open would hand the exact hole
 * this closes to a database blip, and answering `SESSION_OTHER_ACCOUNT` would make a legitimate
 * guest's device put its own ticket down.
 */
export async function checkSessionOwner(
  sessionToken: string,
): Promise<SessionOwnerCheck> {
  const row = await readOwner(sessionToken);
  if (!row) return { ok: true };

  const refused: SessionOwnerCheck = {
    ok: false,
    code: SESSION_OTHER_ACCOUNT,
    message: SESSION_OTHER_ACCOUNT_MESSAGE,
  };
  // A confirmed row with no account left is nobody's, whoever is asking: no Auth, no claim.
  if (row.userId === null && row.verified) return refused;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const viewerId = user?.id ?? null;
  if (sessionBelongsTo(row, viewerId)) return { ok: true };
  if (row.userId !== null || viewerId === null) return refused;

  // A name-only row and a signed-in account: the claim, as her, about this ticket alone (the header).
  await claimAsViewer(supabase, [sessionToken]);
  const now = await readOwner(sessionToken);
  return now && sessionBelongsTo(now, viewerId) ? { ok: true } : refused;
}

/**
 * THE TICKETS A REQUEST CARRIES, SORTED BY WHOSE THEY ARE TO THE VIEWER (crumbs-27; the read side of
 * `checkSessionOwner`, the same rule and the same claim).
 *
 * `hers` may speak for her: while nobody is signed in, every ticket is the device's (as every read has
 * always taken it: nothing is read, and not even Auth is asked); signed in, a row of her own account, or a
 * name-only row the claim takes for her then and there (a ticket she typed before she signed in). `others`
 * may not: a name-only row the claim leaves (another guest's, or one that waits for the address it was
 * typed with), another account's row, and a confirmed row whose account is gone. A ticket that names no
 * row says nothing either way and stays in `hers`, as `checkSessionOwner` passes it: the capability RPCs
 * own the dead-session answer. That includes a string that is not a token at all (`create_guest` mints 64
 * hex characters; a body's ticket is client input), which is never put into a query's filter list.
 *
 * The callers keep what `hers` says and drop the rest from what they read; the door alone keeps asking
 * whether a block holds an `others` ticket, since a typed name's block holds the phone that used it.
 *
 * ★ FAIL CLOSED, LOUDLY, AND NEVER THROWN: a read that fails here would otherwise be a page that fails, or
 * a ticket read as hers on faith. Her account speaks alone (every ticket goes to `others`) and the failure
 * is captured; the worst case is a ticket of hers not counted for one request.
 */
export async function sortTickets(
  viewerId: string | null,
  tickets: readonly string[],
): Promise<{ hers: string[]; others: string[] }> {
  const unique = [...new Set(tickets)];
  if (viewerId === null || unique.length === 0) {
    return { hers: unique, others: [] };
  }
  try {
    const owners = await readOwners(unique.filter(isSessionTokenShape));
    const mine = new Set<string>();
    const claimable: string[] = [];
    for (const ticket of unique) {
      const row = owners.get(ticket);
      if (!row || sessionBelongsTo(row, viewerId)) mine.add(ticket);
      else if (row.userId === null && !row.verified) claimable.push(ticket);
    }
    if (claimable.length > 0) {
      // The claim, as her, about every name-only ticket at once; what it took is read off the rows again.
      await claimAsViewer(await createClient(), claimable);
      const now = await readOwners(claimable);
      for (const ticket of claimable) {
        const row = now.get(ticket);
        if (row && sessionBelongsTo(row, viewerId)) mine.add(ticket);
      }
    }
    return {
      hers: unique.filter((ticket) => mine.has(ticket)),
      others: unique.filter((ticket) => !mine.has(ticket)),
    };
  } catch (error) {
    captureError("security", error, { seam: "ticket_owner_fail_closed" });
    return { hers: [], others: unique };
  }
}

/** The claim, asked as the viewer (their own client: `auth.uid()`), about exactly these tickets. */
async function claimAsViewer(
  supabase: Awaited<ReturnType<typeof createClient>>,
  sessionTokens: readonly string[],
) {
  const { error } = await supabase.rpc("claim_anonymous_uploads", {
    p_session_tokens: [...sessionTokens],
  });
  if (error) throw new Error(`session owner claim: ${error.message}`);
}

/** The rows a set of tickets name, as the rule reads them (service-role; never returned), by ticket. */
async function readOwners(
  sessionTokens: readonly string[],
): Promise<Map<string, OwnerRow>> {
  if (sessionTokens.length === 0) return new Map();
  // row-cap: guests.session_token is unique, so a chunk of tickets reads at most one row a ticket
  const rows = await inChunks(
    "session owners",
    sessionTokens,
    async (chunk) =>
      (await mustQuery(
        createAdminClient()
          .from("guests")
          .select("session_token, user_id, verified_at")
          .in("session_token", chunk),
        "session owners",
      )) ?? [],
  );
  return new Map(
    rows.map((row): [string, OwnerRow] => [
      row.session_token,
      { userId: row.user_id, verified: Boolean(row.verified_at) },
    ]),
  );
}

/** The row a ticket names, as the rule reads it (service-role; never returned), or null for no row. */
async function readOwner(sessionToken: string): Promise<OwnerRow | null> {
  const { data: row, error } = await createAdminClient()
    .from("guests")
    .select("user_id, verified_at")
    .eq("session_token", sessionToken)
    .maybeSingle();
  if (error) throw new Error(`session owner lookup: ${error.message}`);
  return row
    ? { userId: row.user_id, verified: Boolean(row.verified_at) }
    : null;
}
