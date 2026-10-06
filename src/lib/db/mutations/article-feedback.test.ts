/**
 * THE FEEDBACK BEACON'S WRITE AND ITS TABLE (help-center r1 `feedback=beacon`, migration
 * 20260928150000).
 *
 *  1. The write, on the PostgREST fake: one row, the two fields, and NOTHING read back (no trailing
 *     `.select()`, so PostgREST answers `return=minimal`); an error comes back as a value.
 *  2. The table's load-bearing SQL facts, read LATEST-WINS across the migration set (the house
 *     pattern of `db/migration-guards.test.ts`, kept here beside the code that depends on them so the
 *     two cannot drift): RLS on and no policy, every client grant revoked (reads included: `anon` has
 *     no table access), the summary SECURITY INVOKER with an empty search_path and EXECUTE for the
 *     service role alone. The same facts were proved on the live schema, rolled back, before handoff.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  asSupabase,
  createFakePostgrest,
  type FakePostgrest,
} from "@/lib/db/testing/fake-postgrest";
import { readMigrations } from "@/lib/db/testing/migrations";

const state = vi.hoisted(() => ({ fake: null as FakePostgrest | null }));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => asSupabase(state.fake!),
}));

const { recordArticleFeedback } =
  await import("@/lib/db/mutations/article-feedback");

beforeEach(() => {
  state.fake = createFakePostgrest({ tables: { article_feedback: [] } });
});

describe("recordArticleFeedback", () => {
  it("inserts one row with the slug and the answer, and reads nothing back", async () => {
    const result = await recordArticleFeedback({
      slug: "an-upload-wont-finish",
      helpful: false,
    });
    expect(result).toEqual({ ok: true });
    expect(state.fake!.tables.article_feedback).toEqual([
      { slug: "an-upload-wont-finish", helpful: false },
    ]);
    const [request] = state.fake!.requests;
    expect(request).toMatchObject({
      target: "table",
      name: "article_feedback",
      method: "POST",
      returned: 0,
    });
    // No `select=` on the write's URL: PostgREST was never asked for the row.
    expect(request.url).not.toContain("select=");
  });

  it("hands a refused write back as a value, never a throw (the migration not applied yet)", async () => {
    state.fake = createFakePostgrest({ tables: {} });
    const result = await recordArticleFeedback({
      slug: "you-cant-sign-in",
      helpful: true,
    });
    expect(result).toMatchObject({ ok: false, code: "PGRST205" });
  });
});

/* ── The SQL, latest-wins ─────────────────────────────────────────────────────────────────── */

function files(): { name: string; sql: string }[] {
  return readMigrations().map(({ file, sql }) => ({
    name: file,
    // Comments are not code: a quoted example must never satisfy (or trip) a guard.
    sql: sql
      .replace(/--[^\n]*/g, "")
      .replace(/\s+/g, " ")
      .toLowerCase(),
  }));
}

/** Every statement across the set that mentions the table, in order. */
function statementsAbout(needle: string): string[] {
  return files().flatMap(({ sql }) =>
    sql
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.includes(needle)),
  );
}

/** The winning definition of a function: its last create, from `create` to the body's end. */
function latestFunction(name: string): string {
  let latest = "";
  for (const { sql } of files()) {
    const start = Math.max(
      sql.lastIndexOf(`create or replace function public.${name}(`),
      sql.lastIndexOf(`create function public.${name}(`),
    );
    if (start === -1) continue;
    const end = sql.indexOf("$$;", sql.indexOf("$$", start) + 2);
    latest = sql.slice(start, end + 3);
  }
  return latest;
}

describe("article_feedback, as the migrations leave it", () => {
  const table = statementsAbout("public.article_feedback ");
  const all = statementsAbout("article_feedback");

  it("is created once, with only the slug, the answer and the time (no one's identity)", () => {
    const creates = all.filter((s) =>
      s.startsWith("create table public.article_feedback"),
    );
    expect(creates).toHaveLength(1);
    const columns = creates[0];
    for (const forbidden of [
      "ip",
      "user_id",
      "email",
      "session",
      "device",
      "note",
    ]) {
      expect(columns, `a ${forbidden} column`).not.toMatch(
        new RegExp(`[(,] ?${forbidden}[a-z_]* `),
      );
    }
    expect(columns).toContain("slug text not null");
    expect(columns).toContain("helpful boolean not null");
    expect(columns).toContain("article_feedback_slug_shape");
  });

  it("turns RLS on and never adds a policy (deny-all)", () => {
    expect(
      table.some((s) =>
        s.includes(
          "alter table public.article_feedback enable row level security",
        ),
      ),
    ).toBe(true);
    expect(all.some((s) => s.includes("create policy"))).toBe(false);
    expect(
      table.some((s) =>
        s.includes(
          "alter table public.article_feedback disable row level security",
        ),
      ),
    ).toBe(false);
  });

  it("revokes every client grant, reads included, and never grants one back", () => {
    expect(
      all.some(
        (s) =>
          s.startsWith("revoke all on table public.article_feedback from") &&
          s.includes("anon") &&
          s.includes("authenticated") &&
          s.includes("public"),
      ),
    ).toBe(true);
    const grants = all.filter(
      (s) =>
        s.startsWith("grant ") &&
        s.includes(" on table public.article_feedback"),
    );
    for (const grant of grants) {
      expect(grant, grant).not.toMatch(
        /\bto (anon|authenticated|public)\b|, ?(anon|authenticated)\b/,
      );
    }
  });

  it("keeps the summary an invoker read with an empty search_path, run by the service role alone", () => {
    const body = latestFunction("article_feedback_summary");
    expect(body).toContain("returns jsonb");
    expect(body).toContain("security invoker");
    expect(body).not.toContain("security definer");
    expect(body).toContain("set search_path = ''");
    const fnStatements = statementsAbout(
      "function public.article_feedback_summary()",
    );
    expect(
      fnStatements.some(
        (s) =>
          s.startsWith(
            "revoke all on function public.article_feedback_summary() from",
          ) &&
          s.includes("anon") &&
          s.includes("authenticated"),
      ),
    ).toBe(true);
    const grants = fnStatements.filter((s) => s.startsWith("grant "));
    expect(grants).toEqual([
      "grant execute on function public.article_feedback_summary() to service_role",
    ]);
  });
});
