/**
 * FILE-content guards on the QA Q3 migration (20260729180000_qa_q3_escalation_guards.sql), in the
 * same style as the forensics + tiers parity guards: the truth lives in SQL, so the SQL is parsed
 * as TEXT rather than imported.
 *
 * These pin the properties that make the Q3 fixes real, each of which is a one-line edit away from
 * silently reverting:
 *
 *   1. The guards are ROLE-scoped (`current_user`), not blanket. A guard that fired for every role
 *      would break restore_media, the purge cron and every admin action; a guard that fired for
 *      NOBODY would restore the escalation. The exemption test is as load-bearing as the refusal.
 *   2. The legal-hold branch SKIPS silently (return null) and is checked BEFORE the raising branch.
 *      Raising there would (a) abort whole bulk statements and (b) hand the host a hold oracle.
 *   3. The newly locked columns are never granted to `authenticated`, and the two revokes drop the
 *      TABLE grant before re-granting columns (a column revoke is a silent no-op otherwise).
 *   4. restore_media refuses operator takedowns and lands on the PRIOR status.
 *   5. The two anon READ RPCs' redactions as this file wrote them (each is re-pinned latest-wins
 *      where its winning body lives: db/migration-guards.test.ts, social/public-profile-visibility.test.ts).
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const ROOT = join(__dirname, "..", "..", "..");
const sql = readFileSync(
  join(ROOT, "supabase/migrations/20260729180000_qa_q3_escalation_guards.sql"),
  "utf8",
);

/** A `create or replace function public.<name>` body, up to its closing `$$;`. */
function fn(name: string): string {
  const start = sql.indexOf(`create or replace function public.${name}`);
  expect(start).toBeGreaterThan(-1);
  const end = sql.indexOf("$$;", start);
  expect(end).toBeGreaterThan(start);
  return sql.slice(start, end);
}

/** Everything before the commented-out contract check (the executable part of the migration). */
function executableSql(): string {
  const checkAt = sql.indexOf("ROLLED-BACK CONTRACT CHECK");
  expect(checkAt).toBeGreaterThan(-1);
  return sql.slice(0, checkAt);
}

describe("media escalation guard (QA #7)", () => {
  const body = fn("guard_media_privileged_transitions");

  it("exempts every role that is not a direct client write", () => {
    // The six legitimate host moderation paths keep their update(status, removed_at) grant; the
    // RPCs and the service-role cron/admin client must pass straight through.
    expect(body).toContain("current_user not in ('authenticated', 'anon')");
    expect(body).toContain("return new;");
  });

  it("refuses a direct un-remove (restore must go through restore_media)", () => {
    expect(body).toContain("old.status = 'removed'");
    expect(body).toContain("new.status is distinct from 'removed'");
    expect(body).toContain("raise exception");
  });

  it("never names the legal hold in an error a host could read", () => {
    // trust-safety-forensics.md discretion: the host may BE the investigated uploader.
    const raises = body.match(/raise exception '[^']*'/g) ?? [];
    expect(raises.length).toBeGreaterThan(0);
    for (const r of raises) {
      expect(r.toLowerCase()).not.toContain("hold");
      expect(r.toLowerCase()).not.toContain("legal");
    }
  });

  it("skips a held row silently, and checks the hold BEFORE the raising branch", () => {
    const holdAt = body.indexOf("old.legal_hold_at is not null");
    const raiseAt = body.indexOf("raise exception");
    expect(holdAt).toBeGreaterThan(-1);
    expect(raiseAt).toBeGreaterThan(holdAt); // hold first: a held row can never take the raise
    // `return null` = the row is skipped with no error, so a bulk statement carrying one held id
    // still applies to every other row (and a .single() write surfaces the not-found copy).
    expect(body.slice(holdAt, raiseAt)).toContain("return null;");
  });

  it("is wired as a BEFORE UPDATE row trigger on media", () => {
    expect(executableSql()).toMatch(
      /create or replace trigger media_guard_privileged_transitions\s+before update on public\.media/,
    );
  });
});

describe("events un-delete guard + ceiling (QA #10)", () => {
  const body = fn("guard_event_privileged_transitions");

  it("refuses only the un-delete, and only for a direct client write", () => {
    expect(body).toContain("current_user not in ('authenticated', 'anon')");
    expect(body).toContain(
      "old.deleted_at is not null and new.deleted_at is null",
    );
    expect(body).toContain("raise exception");
  });

  it("re-fires the per-tier event ceiling on the un-delete UPDATE", () => {
    // Without this, an un-delete performed by any path that bypasses restore_event (the
    // service-role client, or two concurrent restores racing its check-then-act) walks past the
    // free-tier ceiling that tiers.ts calls the anti-abuse core.
    expect(executableSql()).toMatch(
      /create or replace trigger events_enforce_limit_on_undelete\s+before update on public\.events/,
    );
    expect(executableSql()).toContain(
      "when (old.deleted_at is not null and new.deleted_at is null)",
    );
    expect(executableSql()).toContain(
      "execute function public.enforce_event_limit()",
    );
  });
});

describe("removal provenance (QA #8 + #24)", () => {
  const body = fn("set_media_removal_provenance");

  it("stamps the prior status on the way into the bin", () => {
    expect(body).toContain("new.status_before_removed := old.status;");
  });

  it("lands an un-remove back on the stamped status, then clears the stamp", () => {
    expect(body).toContain("new.status := old.status_before_removed;");
    expect(body).toContain("new.status_before_removed := null;");
  });

  it("adds both provenance columns without granting them to authenticated", () => {
    const exec = executableSql();
    expect(exec).toContain(
      "add column if not exists removed_by_admin boolean not null default false",
    );
    expect(exec).toContain(
      "add column if not exists status_before_removed public.media_status",
    );
    // The media SELECT/UPDATE grants are column-scoped and are NOT re-issued here, so both columns
    // are fail-closed. Assert no grant on media sneaks in alongside them.
    expect(exec).not.toMatch(/grant [^;]*on public\.media to authenticated/);
  });
});

describe("restore_media (QA #8 + #24)", () => {
  const body = fn("restore_media");

  it("refuses a row an operator removed", () => {
    expect(body).toContain("v_media.removed_by_admin");
    expect(body).toContain("'admin_removed'");
  });

  it("returns the item to its prior status, defaulting to approved for pre-Q3 rows", () => {
    expect(body).toContain(
      "v_target := coalesce(v_media.status_before_removed, 'approved'::public.media_status);",
    );
    expect(body).toContain("update public.media set status = v_target");
  });

  it("keeps every guard it already carried", () => {
    expect(body).toContain("and m.removed_by_uploader = false");
    expect(body).toContain("v_media.legal_hold_at is not null");
    expect(body).toContain("insufficient_space");
    expect(body).toContain("'event_deleted'");
  });

  it("stays authenticated-only (re-asserted: MCP-applied SQL inherits an anon grant)", () => {
    expect(sql).toContain(
      "revoke execute on function public.restore_media(uuid) from public, anon, authenticated;",
    );
    expect(sql).toContain(
      "grant execute on function public.restore_media(uuid) to authenticated;",
    );
  });
});

describe("grant contractions (QA #23 + #41)", () => {
  const exec = executableSql();

  it("drops the profiles TABLE update grant before re-granting the allowlist", () => {
    const revokeAt = exec.indexOf("revoke update on public.profiles");
    const grantAt = exec.indexOf(
      "grant update (announcements_seen_at, welcomed_at)",
    );
    expect(revokeAt).toBeGreaterThan(-1);
    expect(grantAt).toBeGreaterThan(revokeAt);
  });

  it("removes email from the profiles write allowlist", () => {
    const grantAt = exec.indexOf(
      "grant update (announcements_seen_at, welcomed_at)",
    );
    const line = exec.slice(grantAt, exec.indexOf(";", grantAt));
    expect(line).not.toContain("email");
  });

  it("drops the guests TABLE select grant before re-granting the columns", () => {
    const revokeAt = exec.indexOf("revoke select on public.guests");
    const grantAt = exec.indexOf(
      "grant select (id, event_id, user_id, email, created_at)",
    );
    expect(revokeAt).toBeGreaterThan(-1);
    expect(grantAt).toBeGreaterThan(revokeAt);
  });

  it("never re-grants session_token (the plaintext guest upload capability)", () => {
    const grantAt = exec.indexOf(
      "grant select (id, event_id, user_id, email, created_at)",
    );
    const line = exec.slice(grantAt, exec.indexOf(";", grantAt));
    expect(line).not.toContain("session_token");
  });
});

describe("anon read redactions (QA #36 + #40)", () => {
  it("this file's get_public_profile wrote QA #36 as its first clause, within the consent scope", () => {
    // What this file holds, and nothing more: the Q3 body gated the attended arm on a signed-in
    // viewer for an account-required album. That clause was written on the legacy
    // `allow_anonymous_uploads` flag, which the identity contract (20260923150000) dropped; the
    // WINNING body carries QA #36 in its confirmed-viewer gate instead, pinned latest-wins in
    // src/lib/social/public-profile-visibility.test.ts, which is where a regression would show.
    const body = fn("get_public_profile");
    expect(body).toContain(
      "and (e.allow_anonymous_uploads or (select auth.uid()) is not null)",
    );
    expect(body).toContain("e.show_guest_list");
    expect(body).toContain("e.visibility = 'open'");
  });

  it("get_event_by_qr_token redacts metadata for a non-owner of a gated event", () => {
    // Whitespace-tolerant: the shape is the contract, not the SQL's line breaks.
    const body = fn("get_event_by_qr_token").replace(/\s+/g, " ");
    expect(body).toContain(
      "(e.visibility <> 'open' and e.host_id is distinct from (select auth.uid())) as hide_meta",
    );
    expect(body).toContain(
      "(e.visibility = 'private' and e.host_id is distinct from (select auth.uid())) as hide_name",
    );
    // name is withheld ONLY for private (a password event is link-shared; the name isn't the
    // secret — that is the page's own stated policy).
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
    // Withholding it would break the very lock screen the redaction protects: GuestHeader, the
    // join URL and every downstream qr_token-keyed RPC read it on a locked page.
    expect(fn("get_event_by_qr_token")).toContain("e.qr_token,");
  });

  it("re-asserts both anon EXECUTE grants (MCP default-grant landmine)", () => {
    expect(sql).toContain(
      "grant execute on function public.get_public_profile(text) to anon, authenticated;",
    );
    expect(sql).toContain(
      "grant execute on function public.get_event_by_qr_token(text) to anon, authenticated;",
    );
  });
});

describe("trigger functions stay off the RPC surface", () => {
  it("revokes EXECUTE from every client role on each new trigger function", () => {
    for (const name of [
      "set_media_removal_provenance",
      "guard_media_privileged_transitions",
      "guard_event_privileged_transitions",
    ]) {
      expect(sql).toContain(
        `revoke execute on function public.${name}() from public, anon, authenticated;`,
      );
    }
  });
});
