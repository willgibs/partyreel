/**
 * Consent-scope guard for get_public_profile (its NEWEST definition, migration
 * 20260919140000, which restored the July anonymous-viewer gate after 20260919120000
 * dropped it while adding the bio; re-point this path whenever the function is replaced), parsed
 * as TEXT like the notification-prefs parity guard.
 *
 * The ATTENDED arm must stay gated to OPEN events: the album-side guest list
 * renders only to viewers who can OPEN the album, and profiles-social.md preserves
 * "locked pages leak name + count only" to capability holders. Without the
 * visibility gate, flipping show_guest_list on a password/private event would
 * publish the event's name/date + every uploader's attendance to fully
 * anonymous viewers via the anon RPC (the parity-review catch, 2026-07-08).
 *
 * The HOSTED arm deliberately has NO visibility gate: display_in_profile is the
 * host publishing their OWN event link (link-in-bio; discovery decoupled from
 * access), and a gated event still hits its lock at /e/. Don't "fix" that arm.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(
    __dirname,
    "..",
    "..",
    "..",
    "supabase/migrations/20260919140000_profile_rpc_anon_viewer_gate.sql",
  ),
  "utf8",
);

/** The executable function body (skip the header's commented contract check). */
function functionBody(): string {
  const start = migration.indexOf("function public.get_public_profile");
  expect(start).toBeGreaterThan(-1);
  const end = migration.indexOf("$$;", start);
  expect(end).toBeGreaterThan(start);
  return migration.slice(start, end);
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
    expect(attended).toContain("profile_hidden_events");
    expect(attended).toContain("m.status = 'approved'");
  });

  it("the attended arm never hands out the album capability link", () => {
    expect(attended).not.toContain("qr_token");
    expect(attended).not.toContain("custom_slug");
  });

  it("the hosted arm stays UNgated on visibility (host consent; the lock gates at /e/)", () => {
    expect(hosted).toContain("e.display_in_profile");
    expect(hosted).not.toContain("e.visibility = 'open'");
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
