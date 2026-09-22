/**
 * Consent-scope guard for get_public_profile, resolved LATEST-WINS across the whole migration set
 * (it used to be pinned to 20260919140000, the migration that restored the July anonymous-viewer
 * gate after 20260919120000 dropped it while adding the bio — a hand-repointed path is exactly how
 * that drift went unseen the first time). Parsed as TEXT like the notification-prefs parity guard.
 *
 * The ATTENDED arm must stay gated to OPEN events: the album-side guest list
 * renders only to viewers who can OPEN the album, and profiles-social.md preserves
 * "locked pages leak name + count only" to capability holders. Without the
 * visibility gate, flipping show_guest_list on a password/private event would
 * publish the event's name/date + every uploader's attendance to fully
 * anonymous viewers via the anon RPC (the parity-review catch, 2026-07-08).
 *
 * ★ Since the guest identity round (2026-09-22, migration 20260922122000) that arm is an OPT-IN:
 * `profile_shown_events` replaced `profile_hidden_events`, so a profile publishes NO attended event
 * until its owner turns it on (Will: "we don't simply start adding all of their uploads there
 * publicly until they decide what goes up"), and a `verified_at` belt means only a PROVED identity
 * attends in public — a typed name or a typed, unproved address publishes nothing even when its
 * event is chosen. Both are pinned below; reverting either re-publishes by default.
 *
 * The HOSTED arm deliberately has NO visibility gate: display_in_profile is the
 * host publishing their OWN event link (link-in-bio; discovery decoupled from
 * access), and a gated event still hits its lock at /e/. Don't "fix" that arm.
 *
 * ★ The identity reshape (2026-09-21) did NOT replace this function, and the attended arm's
 * account-required clause still names `allow_anonymous_uploads`. That stays correct only because
 * the events_sync_verified_email_flags trigger keeps the legacy flag exactly opposite to the new
 * `require_verified_email` switch, so the last test below pins the two together: whoever finally
 * drops the legacy column must re-point this clause in the same change.
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const MIGRATIONS_DIR = join(__dirname, "..", "..", "..", "supabase/migrations");

function migrationFiles(): string[] {
  return readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();
}

/**
 * The definition that actually WINS on the live DB: the LAST migration in timestamp order that
 * creates or replaces get_public_profile, sliced to its closing dollar-quote. Same resolver as
 * db/migration-guards.test.ts — the truth is the migration SET, never one file in it.
 */
function functionBody(): string {
  let latest: string | null = null;
  for (const file of migrationFiles()) {
    const sql = readFileSync(join(MIGRATIONS_DIR, file), "utf8");
    const start = sql.indexOf(
      "create or replace function public.get_public_profile",
    );
    if (start === -1) continue;
    const end = sql.indexOf("$$;", start);
    expect(
      end,
      `${file}: get_public_profile body never closes`,
    ).toBeGreaterThan(start);
    latest = sql.slice(start, end);
  }
  expect(latest, "get_public_profile defined nowhere").not.toBeNull();
  return latest!;
}

/**
 * The same SQL with its `--` line comments stripped. A comment may legitimately NAME the thing it
 * replaced (the attended arm's own comment says which table it stopped reading), so a "must not
 * contain" assertion has to read CODE, not prose, or it fails on its own documentation.
 */
function code(sql: string): string {
  return sql.replace(/--[^\n]*/g, "");
}

function arm(body: string, name: "hosted_events" | "attended_events"): string {
  const start = body.indexOf(`'${name}'`);
  expect(start).toBeGreaterThan(-1);
  const end = body.indexOf("'[]'::jsonb", start);
  expect(end).toBeGreaterThan(start);
  return body.slice(start, end);
}

describe("get_public_profile consent scope (migration SQL)", () => {
  const body = functionBody();
  const attended = arm(body, "attended_events");
  const hosted = arm(body, "hosted_events");

  it("the attended arm keeps every gate: host key, open-only, hides, approved media", () => {
    expect(attended).toContain("e.show_guest_list");
    // QA #36 (20260729180000): an open but account-required album hides its guest list
    // from an anonymous viewer, so the reverse surface must too. 20260919120000 dropped
    // this clause once; this line is what stops it happening twice.
    expect(attended).toContain(
      "(e.allow_anonymous_uploads or (select auth.uid()) is not null)",
    );
    expect(attended).toContain("e.visibility = 'open'");
    expect(attended).toContain("e.deleted_at is null");
    expect(attended).toContain("m.status = 'approved'");
  });

  it("publishes NOTHING until chosen: the opt-in table, never the opt-out one", () => {
    // The inversion (2026-09-22). `profile_hidden_events` is not dropped — the deployed build still
    // writes it — so a careless re-point back to it would compile, apply and silently republish
    // every attended event by default. That is what this pair of assertions exists to stop.
    expect(code(attended)).toContain("public.profile_shown_events");
    expect(code(attended)).not.toContain("profile_hidden_events");
  });

  it("only a PROVED identity attends in public (the verified belt)", () => {
    // Level 1 (a typed name) and level 2 (a typed, unproved address) are not identities anyone has
    // confirmed, so an impersonator's uploads can never surface under someone else's profile.
    expect(attended.replace(/\s+/g, " ")).toContain(
      "g.verified_at is not null",
    );
  });

  it("the attended arm never hands out the album capability link", () => {
    expect(code(attended)).not.toContain("qr_token");
    expect(code(attended)).not.toContain("custom_slug");
  });

  it("the hosted arm stays UNgated on visibility (host consent; the lock gates at /e/)", () => {
    expect(hosted).toContain("e.display_in_profile");
    expect(hosted).not.toContain("e.visibility = 'open'");
  });

  it("the legacy flag it reads is kept truthful by the twin-keeper trigger", () => {
    // The attended arm's account-required clause names allow_anonymous_uploads, which the identity
    // reshape demoted to a compatibility twin. If this trigger ever goes without the clause being
    // re-pointed, an account-required album starts publishing its attendance to anonymous viewers
    // again — the exact 2026-07-08 leak, reintroduced by a column rename nobody connected to it.
    const all = migrationFiles()
      .map((f) => readFileSync(join(MIGRATIONS_DIR, f), "utf8"))
      .join("\n")
      .replace(/\s+/g, " ");
    expect(all).toContain(
      "create or replace trigger events_sync_verified_email_flags before insert or update on public.events",
    );
    expect(all).toContain(
      "new.allow_anonymous_uploads := not new.require_verified_email;",
    );
  });

  it("the contract check exercises the gated-event negative (the leak repro)", () => {
    // The leak repro is a DO block in the FOUNDING migration (20260708120000), which
    // ran once at apply time; a later CREATE OR REPLACE of the function does not
    // carry it, so this assertion reads the founding file, not the newest body.
    const foundation = readFileSync(
      join(
        process.cwd(),
        "supabase/migrations/20260708120000_profiles_social_foundation.sql",
      ),
      "utf8",
    );
    expect(foundation).toContain("gated event leaked to the attended arm");
  });
});
