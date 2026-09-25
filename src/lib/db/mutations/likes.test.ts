/**
 * THE BULK LIKE AND A WINDOW'S LIKE COUNTS, PINNED WHERE THE DATABASE KEEPS THEM (migration
 * 20260926300000_like_many). The house pattern of `migration-guards.test.ts`: the truth lives in the
 * migration FILES, the winning definition read latest-wins across the set with comments stripped, so
 * a later file that replaces a body, grants a client role or opens a second insert path fails here.
 *
 * What is load-bearing, and why:
 *   - like_many is SECURITY INVOKER and inserts nothing itself: every like still goes in through
 *     like_media, the one access-checked path ("a like is only as visible as its media"), and the
 *     advisor lists do not grow (database-security.md).
 *   - Its cap is the app's MAX_BULK_ITEMS, so the client's batches and the refusal agree.
 *   - media_like_counts reads every liker's rows, so no client role may ever execute it.
 *   - authenticated still holds no INSERT on media_likes, or like_many's INVOKER body would stop
 *     being the only door and a raw insert would skip the visibility check.
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it, vi } from "vitest";

import {
  likeManyInBatches,
  parseLikeManyFailed,
} from "@/lib/db/mutations/likes";
import { MAX_BULK_ITEMS } from "@/lib/event/bulk-selection";

const MIGRATIONS_DIR = join(
  __dirname,
  "..",
  "..",
  "..",
  "..",
  "supabase",
  "migrations",
);
const FILE = "20260926300000_like_many.sql";

/** Line comments out (prose is not code), whitespace collapsed. */
function code(sql: string): string {
  return sql.replace(/--[^\n]*/g, "").replace(/\s+/g, " ");
}

/** Every migration's executable SQL, in timestamp order. */
function migrations(): { file: string; sql: string }[] {
  return readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort()
    .map((file) => ({
      file,
      sql: code(readFileSync(join(MIGRATIONS_DIR, file), "utf8")),
    }));
}

/** The winning definition of a public function: its last `create` across the set, to its body's end. */
function latest(name: string): string {
  let body: string | null = null;
  for (const { sql } of migrations()) {
    const start = Math.max(
      sql.lastIndexOf(`create function public.${name}(`),
      sql.lastIndexOf(`create or replace function public.${name}(`),
    );
    if (start === -1) continue;
    const opener = sql.slice(start).match(/ as \$([a-z_]*)\$/);
    expect(opener, `${name} has no dollar-quoted body`).not.toBeNull();
    const tag = `$${opener![1]}$`;
    const from = start + opener!.index! + opener![0].length;
    body = sql.slice(start, sql.indexOf(`${tag};`, from) + tag.length + 1);
  }
  expect(body, `${name} is defined nowhere`).not.toBeNull();
  return body!;
}

const all = () =>
  migrations()
    .map((m) => m.sql)
    .join(" ");
const file = () => code(readFileSync(join(MIGRATIONS_DIR, FILE), "utf8"));

describe("like_many: the bulk Like, one call, through the one insert path", () => {
  it("takes the ids alone, answers one jsonb, and runs as its caller", () => {
    expect(latest("like_many")).toContain(
      "create function public.like_many(p_media_ids uuid[]) returns jsonb language plpgsql volatile security invoker set search_path = '' as $$",
    );
  });

  it("likes each id through like_media and never writes media_likes itself", () => {
    const body = latest("like_many");
    expect(body).toContain("public.like_media(v_id)");
    expect(body).not.toMatch(/insert into public\.media_likes/);
    // A repeated id is one id, and a null is none.
    expect(body).toContain(
      "select coalesce(array_agg(distinct x), '{}') into v_ids from unnest(coalesce(p_media_ids, '{}')) as x where x is not null;",
    );
  });

  it("refuses past MAX_BULK_ITEMS, the cap the client batches by, before anything is written", () => {
    const body = latest("like_many");
    const cap = body.match(
      /if cardinality\(v_ids\) > (\d+) then return jsonb_build_object\('ok', false, 'reason', 'too_many'\);/,
    );
    expect(cap, "the too_many refusal").not.toBeNull();
    expect(Number(cap![1])).toBe(MAX_BULK_ITEMS);
    expect(body.indexOf("'too_many'")).toBeLessThan(
      body.indexOf("like_media("),
    );
  });

  it("answers a caller with no session with a refusal, not an error", () => {
    expect(latest("like_many")).toContain(
      "if (select auth.uid()) is null then return jsonb_build_object('ok', false, 'reason', 'unauthorized'); end if;",
    );
  });

  it("is authenticated-only: every client role revoked by name, then authenticated granted", () => {
    expect(file()).toContain(
      "revoke all on function public.like_many(uuid[]) from public, anon, authenticated; grant execute on function public.like_many(uuid[]) to authenticated;",
    );
    expect(all()).not.toMatch(
      /grant execute on function public\.like_many\([^)]*\) to [^;]*\b(anon|public)\b/,
    );
  });

  it("stays the only way in: authenticated never gains INSERT on media_likes", () => {
    expect(all()).not.toMatch(
      /grant [^;]*\b(insert|all)\b[^;]* on (?:table )?[^;]*public\.media_likes\b[^;]* to [^;]*\bauthenticated\b/,
    );
  });
});

describe("media_like_counts: a window's counts, for the service role alone", () => {
  it("answers one jsonb and runs as its caller (the service role bypasses RLS)", () => {
    expect(latest("media_like_counts")).toContain(
      "create function public.media_like_counts(p_event_id uuid, p_media_ids uuid[]) returns jsonb language sql stable security invoker set search_path = '' as $$",
    );
  });

  it("counts only the asked ids of the asked event, at most MAX_BULK_ITEMS of them", () => {
    const body = latest("media_like_counts");
    expect(body).toContain("where m.event_id = p_event_id");
    const clamp = body.match(/l\.media_id = any\(p_media_ids\[1:(\d+)\]\)/);
    expect(clamp, "the input clamp").not.toBeNull();
    expect(Number(clamp![1])).toBe(MAX_BULK_ITEMS);
    // An id nobody liked is absent, the convention every count reader keeps.
    expect(body).toContain(
      "coalesce(jsonb_object_agg(c.media_id::text, c.n), '{}'::jsonb)",
    );
  });

  it("no client role ever executes it", () => {
    expect(file()).toContain(
      "revoke all on function public.media_like_counts(uuid, uuid[]) from public, anon, authenticated; grant execute on function public.media_like_counts(uuid, uuid[]) to service_role;",
    );
    expect(all()).not.toMatch(
      /grant execute on function public\.media_like_counts\([^)]*\) to [^;]*\b(anon|authenticated|public)\b/,
    );
  });
});

/**
 * THE CLIENT'S HALF: one `like_many` call per MAX_BULK_ITEMS, and exactly the ids that did not end up
 * liked handed back (the refused ones, and every id of a batch whose request failed), so the provider
 * reverts those hearts and no other.
 */
describe("likeManyInBatches", () => {
  const ids = (n: number, from = 0) =>
    Array.from({ length: n }, (_, i) => `id-${from + i}`);

  it("sends a whole album selected as batches of MAX_BULK_ITEMS, in order", async () => {
    const rpc = vi.fn(
      async (_fn: string, _args: { p_media_ids: string[] }) => ({
        data: { ok: true, liked: 0, failed: [] },
        error: null,
      }),
    );
    const failed = await likeManyInBatches({ rpc } as never, ids(4500));
    expect(failed.size).toBe(0);
    expect(rpc.mock.calls.map(([fn]) => fn)).toEqual([
      "like_many",
      "like_many",
      "like_many",
    ]);
    expect(rpc.mock.calls.map(([, args]) => args.p_media_ids.length)).toEqual([
      MAX_BULK_ITEMS,
      MAX_BULK_ITEMS,
      500,
    ]);
  });

  it("hands back the refused ids, and every id of a batch that failed outright", async () => {
    let call = 0;
    const rpc = vi.fn(async () => {
      call += 1;
      if (call === 1)
        return { data: { ok: true, liked: 1, failed: ["id-1"] }, error: null };
      return { data: null, error: { message: "network" } };
    });
    const failed = await likeManyInBatches(
      { rpc } as never,
      [...ids(2), ...ids(MAX_BULK_ITEMS, 2)].slice(0, MAX_BULK_ITEMS + 2),
    );
    expect(failed.has("id-1")).toBe(true);
    expect(failed.has("id-0")).toBe(false);
    // The second batch's two ids are the ones past the first MAX_BULK_ITEMS.
    expect(failed.size).toBe(1 + 2);
  });

  it("reads a refusal of the whole call, and a thrown request, as nothing liked", async () => {
    expect(parseLikeManyFailed({ ok: false, reason: "too_many" })).toBeNull();
    expect(parseLikeManyFailed({ ok: true, failed: ["a", 3] })).toEqual(["a"]);
    const threw = await likeManyInBatches(
      {
        rpc: async () => {
          throw new Error("offline");
        },
      } as never,
      ["x", "y"],
    );
    expect([...threw]).toEqual(["x", "y"]);
  });
});
