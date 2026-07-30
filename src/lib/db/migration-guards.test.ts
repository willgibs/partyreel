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
 *      on it) AND its anon EXECUTE grant — it is one of the FOUR 0028 anon read RPCs; a replaced
 *      body must re-assert the grant explicitly (the MCP anon-grant landmine cuts both ways).
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const MIGRATIONS_DIR = join(__dirname, "..", "..", "..", "supabase/migrations");

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

  it("stays service-role-only (ADR-0016) in its defining migration", () => {
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
    // (never service-role this one — the session token IS the authorization, ADR-0004).
    const { file } = latestDefinition("get_upload_context");
    expect(file).toContain(
      "grant execute on function public.get_upload_context(text, public.media_type) to anon, authenticated;",
    );
  });
});
