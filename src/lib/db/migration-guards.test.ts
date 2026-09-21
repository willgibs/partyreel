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
 *   6. claim_anonymous_uploads still never writes `email` (the email = verified-at-join invariant).
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
    expect(body).toContain(
      "insert into public.guests (event_id, user_id, email, session_token, display_name, verified_at)",
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

describe("claim_anonymous_uploads never writes email", () => {
  it("stamps user_id and nothing else", () => {
    // The email = verified-at-join invariant (20260602144343): a claim proves possession of a
    // session token, never ownership of an address, so it must not backfill one.
    const body = collapse(latestDefinition("claim_anonymous_uploads").body);
    const start = body.indexOf("update public.guests");
    expect(start).toBeGreaterThan(-1);
    const statement = body.slice(start, body.indexOf(";", start));
    expect(statement).toContain("set user_id = v_uid");
    expect(statement).not.toContain("email");
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
