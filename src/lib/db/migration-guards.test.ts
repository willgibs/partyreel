/**
 * FILE-content guards on the write-spine migration invariants (QA #17 + #18, migration
 * 20260729190000). Same house pattern as forensics/migration-guards.test.ts: the truth lives in
 * the migration FILES, resolved LATEST-WINS across the whole set (never pinned to one file — a
 * later `create or replace` silently replacing the body is exactly the drift these guards catch;
 * QA Q3 did precisely that to restore_media).
 *
 * What they pin:
 *   1. Every cap decision keeps its `for update` profiles-row lock (Pattern D): create_media,
 *      create_media_as_host, restore_media, restore_event, enforce_event_limit. Dropping the lock
 *      re-opens the concurrent over-admit race the round closed.
 *   2. create_guest keeps the visibility refusals (private never mints; password requires
 *      p_unlock_proven) and stays service-role-only.
 *   3. get_upload_context keeps its `visibility` output (the presign/complete lock re-check feeds
 *      on it) AND its anon EXECUTE grant — it is one of the FIVE 0028 anon read RPCs; a replaced
 *      body must re-assert the grant explicitly (the MCP anon-grant landmine cuts both ways).
 *   4. The identity reshape (2026-09-21, migration 20260921150000): anonymity left the product, so
 *      every one of its load-bearing SQL facts is pinned here rather than in the file that happens
 *      to hold it today — the twin-keeper trigger, create_guest's verified-email refusal and its
 *      nulled name, create_media's post-flip refusal AND the exact wording that keeps the SHIPPED
 *      mapCheckViolation correct, get_upload_context's two new keys, set_guest_display_name's
 *      posture, and the display-name cap's parity with DISPLAY_NAME_MAX_LENGTH.
 *   5. get_event_by_qr_token's QA #40 redaction, which until now was pinned to the FILE that added
 *      it (escalation-guards.test.ts). The reshape drops and recreates that function, which is
 *      exactly the drift a file-pinned guard cannot see — so it gets a latest-wins guard too.
 *   6. claim_anonymous_uploads's TWO arms (the guest identity round deliberately inverted the old
 *      "never writes email" pin — that describe carries the reasoning).
 *   7. The guest identity round (2026-09-22, migrations 20260922120000 + 20260922122000): the
 *      unproved address lives in its own fail-closed column with its CHECK and partial index, the
 *      five claim/attach RPCs sit exactly where database-security.md puts them, nothing expires, and
 *      a profile publishes no attended event until its owner chooses it.
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { DISPLAY_NAME_MAX_LENGTH } from "@/lib/validation/profile";

const ROOT = join(__dirname, "..", "..", "..");
const MIGRATIONS_DIR = join(ROOT, "supabase/migrations");

/** Whitespace-tolerant: the shape is the contract, never the SQL's line breaks. */
function collapse(sql: string): string {
  return sql.replace(/\s+/g, " ");
}

/** Every migration, in timestamp order, as one string — for facts that are not a function body. */
function allMigrations(): string {
  return readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort()
    .map((f) => readFileSync(join(MIGRATIONS_DIR, f), "utf8"))
    .join("\n");
}

/**
 * The definition that actually WINS on the live DB: the LAST `create [or replace] function
 * public.<name>(` across the migration set in timestamp order, sliced to its closing dollar-quote
 * (bodies use `$$` and `$function$`; the tag is read from the `as $tag$` opener so either works).
 * Returns the winning body and the whole winning FILE (grants live outside the body).
 */
function latestDefinition(name: string): { body: string; file: string } {
  const files = readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();
  let latest: { body: string; file: string } | null = null;
  for (const file of files) {
    const sql = readFileSync(join(MIGRATIONS_DIR, file), "utf8");
    // The open paren keeps create_media from matching create_media_as_host.
    const starts = [
      sql.indexOf(`create or replace function public.${name}(`),
      sql.indexOf(`create function public.${name}(`),
    ].filter((i) => i !== -1);
    if (starts.length === 0) continue;
    const start = Math.min(...starts);
    const opener = sql.slice(start).match(/as \$([a-z_]*)\$/);
    expect(opener, `${file}: ${name} has no dollar-quoted body`).not.toBeNull();
    const tag = `$${opener![1]}$`;
    const bodyStart = start + opener!.index! + opener![0].length;
    const close = sql.indexOf(`${tag};`, bodyStart);
    expect(close, `${file}: ${name} body never closes`).toBeGreaterThan(start);
    latest = { body: sql.slice(start, close + tag.length + 1), file: sql };
  }
  expect(latest, `${name} defined nowhere`).not.toBeNull();
  return latest!;
}

describe("QA #17 — the cap row locks survive body replacement", () => {
  it("create_media locks the host's profiles row before the cap reads", () => {
    expect(latestDefinition("create_media").body).toContain(
      "from public.profiles where id = v_event.host_id for update",
    );
  });

  it("create_media_as_host locks the host's profiles row before the cap reads", () => {
    expect(latestDefinition("create_media_as_host").body).toContain(
      "from public.profiles where id = v_event.host_id for update",
    );
  });

  it("restore_media locks the host's profiles row before the capacity gate", () => {
    expect(latestDefinition("restore_media").body).toContain(
      "from public.profiles where id = v_event.host_id for update",
    );
  });

  it("restore_event locks the host's profiles row before the slot + capacity gates", () => {
    expect(latestDefinition("restore_event").body).toContain(
      "from public.profiles where id = v_event.host_id for update",
    );
  });

  it("enforce_event_limit locks the host's profiles row before the slot count", () => {
    expect(latestDefinition("enforce_event_limit").body).toContain(
      "perform 1 from public.profiles where id = new.host_id for update;",
    );
  });
});

describe("QA #18 — create_guest inherits the read gate", () => {
  it("refuses a private event's mint outright", () => {
    const { body } = latestDefinition("create_guest");
    expect(body).toContain("v_event.visibility = 'private'");
  });

  it("requires proof of unlock for a password event", () => {
    const { body } = latestDefinition("create_guest");
    expect(body).toContain("p_unlock_proven");
    expect(body).toContain("v_event.visibility = 'password'");
  });

  it("stays service-role-only (database-security.md) in its defining migration", () => {
    const { file } = latestDefinition("create_guest");
    expect(file).toMatch(
      /revoke execute on function public\.create_guest\([^)]*\) from public, anon, authenticated;/,
    );
    expect(file).toMatch(
      /grant execute on function public\.create_guest\([^)]*\) to service_role;/,
    );
  });
});

describe("QA #18 — get_upload_context feeds the route lock re-check", () => {
  it("returns the event's visibility", () => {
    expect(latestDefinition("get_upload_context").body).toContain(
      "'visibility', v_event.visibility",
    );
  });

  it("keeps the anon EXECUTE grant (0028 — the four anon read RPCs) in its defining migration", () => {
    // A body replacement WITHOUT an explicit re-grant fails here on purpose: re-assert it
    // (never service-role this one — the session token IS the authorization, database-security.md).
    const { file } = latestDefinition("get_upload_context");
    expect(file).toContain(
      "grant execute on function public.get_upload_context(text, public.media_type) to anon, authenticated;",
    );
  });
});

describe("the identity reshape — the host's switch and its legacy twin", () => {
  // `require_verified_email` lands BESIDE `allow_anonymous_uploads` rather than replacing it, so
  // the build already in production keeps reading a truthful flag through the deploy window. The
  // trigger is what makes that true, and get_public_profile's QA #36 attended-arm clause still
  // reads the legacy column — drop the trigger and that clause silently goes stale.
  it("keeps the two flags opposite in both directions", () => {
    const { body } = latestDefinition("sync_event_verified_email_flags");
    expect(body).toContain(
      "new.require_verified_email := not new.allow_anonymous_uploads;",
    );
    expect(body).toContain(
      "new.allow_anonymous_uploads := not new.require_verified_email;",
    );
  });

  it("stays off the RPC surface (trigger-only, NEITHER advisor list)", () => {
    expect(latestDefinition("sync_event_verified_email_flags").file).toContain(
      "revoke execute on function public.sync_event_verified_email_flags() from public, anon, authenticated;",
    );
  });

  it("fires BEFORE insert or update on events", () => {
    expect(collapse(allMigrations())).toContain(
      "create or replace trigger events_sync_verified_email_flags before insert or update on public.events for each row execute function public.sync_event_verified_email_flags();",
    );
  });
});

describe("the identity reshape — create_guest mints an identity", () => {
  it("refuses a mint without a verified email when the switch is on", () => {
    expect(collapse(latestDefinition("create_guest").body)).toContain(
      "if v_event.require_verified_email and (v_uid is null or v_confirmed is null) then",
    );
  });

  it("nulls a typed name when a confirmed account already carries the identity", () => {
    // One identity per row: a profile name and a typed name must never sit side by side and
    // disagree. Wave 1's precedence rule depends on this being true in the DATA, not in the UI.
    expect(collapse(latestDefinition("create_guest").body)).toContain(
      "if v_confirmed is not null then v_name := null; end if;",
    );
  });

  it("stamps verified_at from the confirmed session, never from a client value", () => {
    const body = collapse(latestDefinition("create_guest").body);
    // The column list grew by the guest identity round's two columns (20260922120000); what this
    // pins is that `email` and `verified_at` are still written from the SERVER-read auth.users row
    // and in that order, never from a client value.
    expect(body).toContain(
      "insert into public.guests (event_id, user_id, email, session_token, display_name, verified_at, pending_email, pending_email_at)",
    );
    expect(body).toContain("v_name, v_confirmed");
    // v_confirmed comes from auth.users under definer privilege — the whole point.
    expect(body).toContain(
      "select email, email_confirmed_at into v_email, v_confirmed from auth.users where id = v_uid;",
    );
  });

  it("still mints without a name (the deployed build passes none)", () => {
    // An expand migration production survives: the shipped /api/guests sends three arguments and
    // no name at all. A required name here would 422 every anonymous upload until wave 1 deploys.
    expect(collapse(latestDefinition("create_guest").body)).not.toContain(
      "if v_name is null then raise",
    );
  });
});

describe("the identity reshape — create_media gates the upload, not only the join", () => {
  it("refuses an unverified guest after the host flips the switch on", () => {
    expect(collapse(latestDefinition("create_media").body)).toContain(
      "if v_event.require_verified_email and v_guest.verified_at is null then",
    );
  });

  it("words that refusal so the SHIPPED error mapping still reads uploads_closed", () => {
    // The coupling is real and invisible: mapCheckViolation matches the substring "not accepting"
    // FIRST, so this wording is what stops the deployed build showing "Couldn't save the upload"
    // for a refusal it understands perfectly well. Reword one side and this fails.
    const body = latestDefinition("create_media").body;
    expect(body).toContain(
      "This event is not accepting uploads without a verified email.",
    );
    expect(body).toContain("This event is not accepting uploads.");
    const mutation = readFileSync(
      join(ROOT, "src/lib/db/mutations/guest.ts"),
      "utf8",
    );
    expect(mutation).toContain('m.includes("not accepting")');
    expect(collapse(mutation)).toContain(
      'if (m.includes("not accepting") || m.includes("no longer exists")) { return { ok: false, code: "uploads_closed",',
    );
  });
});

describe("the identity reshape — get_upload_context carries the identity gate", () => {
  it("returns the event's gate and this session's standing", () => {
    const body = latestDefinition("get_upload_context").body;
    expect(body).toContain(
      "'require_verified_email', v_event.require_verified_email",
    );
    expect(body).toContain(
      "'guest_verified', (v_guest.verified_at is not null)",
    );
  });
});

describe("the identity reshape — set_guest_display_name", () => {
  it("is service-role-only, like every other server-mediated guest write", () => {
    // Doubly so here: profanity and the reserved-name list CANNOT be checked in SQL (the obscenity
    // matcher must never ship to a browser), so the route that calls this is load-bearing.
    const { file } = latestDefinition("set_guest_display_name");
    expect(file).toContain(
      "revoke execute on function public.set_guest_display_name(text, text) from public, anon, authenticated;",
    );
    expect(file).toContain(
      "grant execute on function public.set_guest_display_name(text, text) to service_role;",
    );
  });

  it("refuses to give a verified guest a second name", () => {
    expect(collapse(latestDefinition("set_guest_display_name").body)).toContain(
      "if v_guest.verified_at is not null then",
    );
  });
});

describe("QA #40 — get_event_by_qr_token's redaction survives a drop + create", () => {
  // Pinned latest-wins here because the reshape DROPPED and recreated this function; a guard
  // pinned to 20260729180000 (escalation-guards.test.ts) can no longer see the winning body.
  it("redacts metadata for a non-owner of a gated event, and the name only for private", () => {
    const body = collapse(latestDefinition("get_event_by_qr_token").body);
    expect(body).toContain(
      "(e.visibility <> 'open' and e.host_id is distinct from (select auth.uid())) as hide_meta",
    );
    expect(body).toContain(
      "(e.visibility = 'private' and e.host_id is distinct from (select auth.uid())) as hide_name",
    );
    expect(body).toContain("case when r.hide_name then null else e.name end");
    for (const field of [
      "e.description",
      "e.event_date",
      "e.custom_slug",
      "p.display_name",
    ]) {
      expect(body).toContain(
        `case when r.hide_meta then null else ${field} end`,
      );
    }
  });

  it("keeps qr_token unredacted (the locked page hands it to the client by design)", () => {
    expect(latestDefinition("get_event_by_qr_token").body).toContain(
      "e.qr_token,",
    );
  });

  it("returns BOTH identity flags, neither of them redacted", () => {
    // The lock screen and the entry sheet must render the right refusal, and the deployed build
    // still reads the legacy one. Redacting either would break a page the RPC exists to back.
    const body = collapse(latestDefinition("get_event_by_qr_token").body);
    expect(body).toContain(
      "e.accepting_uploads, e.allow_anonymous_uploads, e.require_verified_email,",
    );
    expect(body).toContain(
      "allow_anonymous_uploads boolean, require_verified_email boolean,",
    );
  });

  it("re-asserts the anon EXECUTE grant its drop took away (0028)", () => {
    expect(latestDefinition("get_event_by_qr_token").file).toContain(
      "grant execute on function public.get_event_by_qr_token(text) to anon, authenticated;",
    );
  });
});

describe("claim_anonymous_uploads writes email ONLY on the confirmed arm", () => {
  // ★ THIS PIN IS INVERTED ON PURPOSE (the guest identity round, 2026-09-22). It used to read
  // "never writes email", from the 20260602144343 invariant that a claim proves possession of a
  // session token and never ownership of an address. That reasoning held while the only address on
  // a guest row came from its own mint. It no longer does: a CONFIRMED caller presenting the
  // session token holds the device that made the upload AND has proved an address — strictly more
  // proof than claim_guest_rows_by_email asks for — so this is the one legitimate path from a typed
  // address to a confirmed one. What must NOT drift is the split: the unconfirmed arm still stamps
  // user_id and nothing else, which is what keeps the deployed build's sign-in correct.
  const body = collapse(latestDefinition("claim_anonymous_uploads").body);
  const updates = body
    .split("update public.guests")
    .slice(1)
    .map((chunk) => chunk.slice(0, chunk.indexOf(";")));

  it("has exactly two guests updates: the confirmed arm and the unconfirmed one", () => {
    expect(updates).toHaveLength(2);
  });

  it("the confirmed arm stamps the row whole and drops the unproved address", () => {
    const [confirmed] = updates;
    expect(confirmed).toContain("set user_id = v_uid");
    expect(confirmed).toContain("verified_at = now()");
    expect(confirmed).toContain("email = v_email");
    expect(confirmed).toContain("pending_email = null");
    expect(confirmed).toContain("pending_email_at = null");
    // The no-theft guard is what makes this safe to expose to the browser at all.
    expect(confirmed).toContain("user_id is null");
  });

  it("the unconfirmed arm is unchanged: user_id and nothing else", () => {
    const unconfirmed = updates[1];
    expect(unconfirmed).toContain("set user_id = v_uid");
    expect(unconfirmed).not.toContain("email");
    expect(unconfirmed).not.toContain("verified_at");
    expect(unconfirmed).toContain("user_id is null");
  });

  it("keeps its authenticated-only grant (0029, never 0028)", () => {
    const { file } = latestDefinition("claim_anonymous_uploads");
    expect(file).toContain(
      "revoke all on function public.claim_anonymous_uploads(text[]) from public, anon;",
    );
    expect(file).toContain(
      "grant execute on function public.claim_anonymous_uploads(text[]) to authenticated;",
    );
  });
});

describe("guests.display_name is capped where the app caps a name", () => {
  it("the CHECK mirrors DISPLAY_NAME_MAX_LENGTH", () => {
    // The zod schema is the UX gate; this CHECK is the hard backstop. They drift the moment one
    // number moves alone, and nothing else in the gate would notice.
    const sql = collapse(allMigrations());
    expect(sql).toContain(
      `add constraint guests_display_name_len check (display_name is null or char_length(display_name) between 1 and ${DISPLAY_NAME_MAX_LENGTH})`,
    );
    expect(sql).not.toContain("drop constraint guests_display_name_len");
  });
});

describe("the door round, wave 0 — Require an upload to view", () => {
  // The switch (Will, 2026-09-21, rulings.md "the door as three steps"): a genuinely new flag with
  // no legacy twin, off by default, free on every tier; the gate it drives is enforced by the
  // gallery access resolver through one service-role read.
  it("the column joins the column-locked host grant by a bare additive grant", () => {
    const sql = collapse(allMigrations());
    expect(sql).toContain(
      "grant insert (require_upload_to_view), update (require_upload_to_view) on public.events to authenticated;",
    );
  });

  it("get_event_by_qr_token returns the switch beside its sibling and keeps its client grant", () => {
    const { body, file } = latestDefinition("get_event_by_qr_token");
    expect(body).toContain(
      "require_verified_email boolean, require_upload_to_view boolean,",
    );
    expect(body).toContain(
      "e.require_verified_email, e.require_upload_to_view,",
    );
    expect(file).toContain(
      "grant execute on function public.get_event_by_qr_token(text) to anon, authenticated;",
    );
  });

  it("get_upload_gate is service-role only, punches the ticket once and mirrors the presign's caps", () => {
    const { body, file } = latestDefinition("get_upload_gate");
    expect(file).toContain(
      "revoke all on function public.get_upload_gate(uuid, text, uuid) from public, anon, authenticated;",
    );
    expect(file).toContain(
      "grant execute on function public.get_upload_gate(uuid, text, uuid) to service_role;",
    );
    // The token arm is the delete RPC's guard; the account arm is the server-verified id.
    expect(body).toContain(
      "g.session_token = p_session_token and g.user_id is null",
    );
    expect(body).toContain("p_user_id is not null and g.user_id = p_user_id");
    // ★ Punched once: no status filter, so neither a hide nor a removal re-closes the gate.
    expect(body).not.toContain("m.status");
    // ★ The fail-open pair is exactly what the presign refuses `cap_reached` on: both cap
    // expressions must read the same in both functions, or a guest could be held at a step the
    // presign would refuse anyway.
    const ctx = latestDefinition("get_upload_context").body;
    for (const expr of [
      "public.host_active_bytes(v_event.host_id) >= v_cap + (v_cap / 10)",
      "coalesce(v_month_bytes, 0) >= v_ingress_cap",
    ]) {
      expect(body).toContain(expr);
      expect(ctx).toContain(expr);
    }
  });
});

describe("the guest identity round, wave 0 — the unproved address", () => {
  // Will, 2026-09-22 (rulings.md "guest identity: name only, unconfirmed email, verified account"):
  // a typed address nobody has proved, stored in its OWN column, inert — never shown to the host,
  // never attributed, never mailed on its own, never expiring — and moved into `email` only by a
  // claim that proves it. Every load-bearing fact of migration 20260922120000 is pinned here rather
  // than in the file that happens to hold it, because a later `create or replace` is exactly the
  // drift a file-pinned guard cannot see.

  it("keeps the address in pending_email, shaped by a CHECK that storage can satisfy", () => {
    const sql = collapse(allMigrations());
    expect(sql).toContain("add constraint guests_pending_email_shape");
    // Normalised storage is what makes the claim's `= lower(v_email)` lookup exact.
    expect(sql).toContain("pending_email = lower(btrim(pending_email))");
    expect(sql).toContain("char_length(pending_email) between 3 and 254");
    expect(sql).toContain("position('@' in pending_email) > 1");
    expect(sql).not.toContain("drop constraint guests_pending_email_shape");
  });

  it("indexes it partially, which is the claim's only lookup", () => {
    expect(collapse(allMigrations())).toContain(
      "create index guests_pending_email_idx on public.guests (pending_email) where pending_email is not null;",
    );
  });

  it("★ never names the address in a guests SELECT grant (QA #41 fail-closed)", () => {
    // SELECT on guests is column-scoped, so a new column is invisible to the host over PostgREST
    // until a grant names it. The host sees a badge, never the address — that IS the ruling
    // ("there's no impersonation risk if the host can't see the attributed email"), and one
    // `grant select (…, pending_email, …)` anywhere in the set would undo it silently.
    const sql = collapse(allMigrations());
    expect(sql).toMatch(
      /grant select \(id, event_id, user_id, email, created_at\) on public\.guests to authenticated;/,
    );
    expect(sql).not.toMatch(/grant select \([^)]*pending_email/);
  });

  it("nothing expires it: no expiry job, no expiry function", () => {
    // Will, 2026-09-22: "I'd prefer not to expire/detach any uploads from an unconfirmed email's
    // upload history." A sweep added later would quietly delete a guest's claim ticket.
    expect(collapse(allMigrations())).not.toMatch(
      /create (or replace )?function public\.expire_/,
    );
  });

  it("denormalizes it on the forensic row, capture-only", () => {
    expect(collapse(allMigrations())).toContain(
      "alter table public.upload_forensics add column guest_pending_email text;",
    );
  });
});

describe("the guest identity round — create_guest carries the optional address", () => {
  it("takes it as a 5th defaulted parameter and stays service-role-only", () => {
    const { body, file } = latestDefinition("create_guest");
    expect(collapse(body)).toContain("p_pending_email text default null");
    expect(file).toContain(
      "revoke execute on function public.create_guest(text, uuid, boolean, text, text) from public, anon, authenticated;",
    );
    expect(file).toContain(
      "grant execute on function public.create_guest(text, uuid, boolean, text, text) to service_role;",
    );
  });

  it("normalises it, and nulls it beside a confirmed account or a require-verified event", () => {
    const body = collapse(latestDefinition("create_guest").body);
    expect(body).toContain(
      "v_pending := lower(nullif(btrim(coalesce(p_pending_email, '')), ''));",
    );
    expect(body).toContain(
      "if v_confirmed is not null or v_event.require_verified_email then v_pending := null; end if;",
    );
  });

  it("belts the WHOLE check, floor included, so nothing reaches it as a raw 23514", () => {
    // 'a@' passes `position('@') > 1` and would otherwise hit guests_pending_email_shape as an
    // unmappable constraint error rather than the route's own message.
    const body = collapse(latestDefinition("create_guest").body);
    expect(body).toContain("char_length(v_pending) not between 3 and 254");
    expect(body).toContain("That email address does not look right.");
  });

  it("reports WHETHER an address is attached, and never echoes it back", () => {
    const body = collapse(latestDefinition("create_guest").body);
    expect(body).toContain("'email_attached', (v_pending is not null)");
    expect(body).not.toContain("'pending_email', v_pending");
  });
});

describe("the guest identity round — the four claim and attach RPCs", () => {
  it("set_guest_pending_email is service-role-only, and refuses a verified row", () => {
    const { body, file } = latestDefinition("set_guest_pending_email");
    expect(file).toContain(
      "revoke execute on function public.set_guest_pending_email(text, text) from public, anon, authenticated;",
    );
    expect(file).toContain(
      "grant execute on function public.set_guest_pending_email(text, text) to service_role;",
    );
    const collapsed = collapse(body);
    expect(collapsed).toContain("if v_guest.verified_at is not null then");
    // A blank DETACHES rather than erroring: "clear it" and "set it to nothing" are one intent.
    expect(collapsed).toContain(
      "set pending_email = null, pending_email_at = null",
    );
  });

  it("★ list_guest_rows_by_email is no oracle: the address is never a parameter", () => {
    // The one function that reads rows BY ADDRESS. It takes none: the address comes from
    // auth.users for auth.uid() under definer privilege, and an unconfirmed caller gets nothing
    // even for their own address. A parameter here would turn the product into "is this address a
    // Partyreel guest?".
    const { body, file } = latestDefinition("list_guest_rows_by_email");
    expect(body).toContain("create function public.list_guest_rows_by_email()");
    const collapsed = collapse(body);
    expect(collapsed).toContain("v_uid uuid := (select auth.uid());");
    expect(collapsed).toContain(
      "if v_confirmed is null or v_email is null then return; end if;",
    );
    // The album capability must not ride a list.
    expect(collapsed).not.toContain("qr_token");
    expect(collapsed).not.toContain("custom_slug");
    expect(file).toContain(
      "revoke all on function public.list_guest_rows_by_email() from public, anon;",
    );
    expect(file).toContain(
      "grant execute on function public.list_guest_rows_by_email() to authenticated;",
    );
  });

  it("claim_guest_rows_by_email stamps the row whole and names only a NAMELESS profile", () => {
    const { body, file } = latestDefinition("claim_guest_rows_by_email");
    const collapsed = collapse(body);
    expect(collapsed).toContain("verified_at = now(), email = v_email");
    expect(collapsed).toContain(
      "pending_email = null, pending_email_at = null",
    );
    // His rule: the active unverified name becomes the account's name — but only when the account
    // has none, and only from a row actually being claimed.
    expect(collapsed).toContain(
      "update public.profiles set display_name = v_name where id = v_uid and display_name is null;",
    );
    // Bounded, like every other array parameter in this schema.
    expect(collapsed).toContain("cardinality(p_event_ids) > 200");
    expect(file).toContain(
      "revoke all on function public.claim_guest_rows_by_email(uuid[]) from public, anon;",
    );
    expect(file).toContain(
      "grant execute on function public.claim_guest_rows_by_email(uuid[]) to authenticated;",
    );
  });

  it("disown_guest_rows_by_email removes through the uploader path and never reads null as ALL", () => {
    const { body, file } = latestDefinition("disown_guest_rows_by_email");
    const collapsed = collapse(body);
    // removed_by_uploader is what keeps a disowned upload out of the host's bin AND out of
    // restore_media (20260609150000) — the host cannot quietly put it back.
    expect(collapsed).toContain("removed_by_uploader = true");
    expect(collapsed).toContain("status = 'removed'");
    expect(collapsed).toContain("removed_at = coalesce(m.removed_at, now())");
    // ★ claim_ reads null as "all of mine"; on the destructive twin that shorthand would delete
    // every upload the caller ever made from an unclaimed row.
    expect(collapsed).toContain(
      "if p_event_ids is null or cardinality(p_event_ids) = 0 then",
    );
    // The guest ROW survives: the album's guest list and the forensic trail are history.
    expect(collapsed).not.toContain("delete from public.guests");
    expect(file).toContain(
      "revoke all on function public.disown_guest_rows_by_email(uuid[]) from public, anon;",
    );
    expect(file).toContain(
      "grant execute on function public.disown_guest_rows_by_email(uuid[]) to authenticated;",
    );
  });

  it("no claim RPC is reachable by anon (the 0028/0029 split IS the security property)", () => {
    const sql = collapse(allMigrations());
    for (const signature of [
      "public.list_guest_rows_by_email()",
      "public.claim_guest_rows_by_email(uuid[])",
      "public.disown_guest_rows_by_email(uuid[])",
      "public.set_guest_pending_email(text, text)",
    ]) {
      expect(sql).not.toContain(`on function ${signature} to anon`);
    }
  });
});

describe("the guest identity round — a profile publishes nothing until chosen", () => {
  it("the attended arm reads the OPT-IN table, not the opt-out one", () => {
    const { body } = latestDefinition("get_public_profile");
    const start = body.indexOf("'attended_events'");
    // Comments stripped: the arm's own comment names the table it stopped reading, and a "must
    // not contain" assertion has to read code rather than its own documentation.
    const attended = body
      .slice(start, body.indexOf("'[]'::jsonb", start))
      .replace(/--[^\n]*/g, "");
    expect(attended).toContain("public.profile_shown_events");
    expect(attended).not.toContain("profile_hidden_events");
  });

  it("and only a PROVED identity attends in public", () => {
    // The belt: a level-1 (typed name) or level-2 (typed, unproved address) row publishes nothing,
    // so an impersonator's uploads can never surface under someone's profile.
    const { body } = latestDefinition("get_public_profile");
    const start = body.indexOf("'attended_events'");
    const attended = collapse(
      body.slice(start, body.indexOf("'[]'::jsonb", start)),
    );
    expect(attended).toContain("g.verified_at is not null");
  });

  it("ships the table with RLS and the three owner policies, and no backfill", () => {
    const sql = collapse(allMigrations());
    expect(sql).toContain(
      "alter table public.profile_shown_events enable row level security;",
    );
    for (const policy of [
      "profile_shown_events_select_own",
      "profile_shown_events_insert_own",
      "profile_shown_events_delete_own",
    ]) {
      expect(sql).toContain(`create policy ${policy}`);
    }
    expect(sql).toContain(
      "grant insert (user_id, event_id) on public.profile_shown_events to authenticated;",
    );
    // ★ NO BACKFILL. Copying today's attendance in would publish exactly what the ruling says must
    // stay private until someone turns it on.
    expect(sql).not.toMatch(
      /insert into public\.profile_shown_events \(user_id, event_id\) select/,
    );
  });

  it("does NOT drop profile_hidden_events while the deployed build still writes it", () => {
    expect(collapse(allMigrations())).not.toContain(
      "drop table public.profile_hidden_events",
    );
  });

  it("re-states get_public_profile's anon grant (one of the five 0028 reads)", () => {
    expect(latestDefinition("get_public_profile").file).toContain(
      "grant execute on function public.get_public_profile(text) to anon, authenticated;",
    );
  });
});
