/**
 * THE UPKEEP ROUND'S MIGRATIONS, PINNED (crumbs-37): the album change log's prune under a watermark
 * (20261001150000) and the removed-media index the nightly host discovery and the removed-media sweep share
 * (20261001151000). Each pin reads CODE (comments stripped), latest wins across the migration set, so a later
 * file that replaces one of these bodies and drops a clause fails here. The lane's own file, beside
 * `migration-guards.test.ts`, which other lanes write in.
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { jobById } from "@/app/admin/jobs/catalog";

const MIGRATIONS_DIR = join(
  __dirname,
  "..",
  "..",
  "..",
  "supabase",
  "migrations",
);

const collapse = (sql: string) => sql.replace(/\s+/g, " ");
const stripComments = (sql: string) => sql.replace(/--[^\n]*/g, "");

function files(): { file: string; sql: string }[] {
  return readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort()
    .map((file) => ({
      file,
      sql: readFileSync(join(MIGRATIONS_DIR, file), "utf8"),
    }));
}

/** Every migration's executable SQL, comments stripped and whitespace collapsed, in order. */
const everything = () =>
  files()
    .map(({ sql }) => collapse(stripComments(sql)))
    .join(" ");

/** The winning body of `public.<name>(`: the last create across the set, to its closing dollar-quote. */
function latest(name: string): string {
  let body: string | null = null;
  for (const { file, sql } of files()) {
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
    body = sql.slice(start, close + tag.length + 1);
  }
  expect(body, `${name} defined nowhere`).not.toBeNull();
  return collapse(stripComments(body!));
}

const fileSql = (name: string) =>
  collapse(stripComments(readFileSync(join(MIGRATIONS_DIR, name), "utf8")));

describe("the album change log, pruned under a watermark (20261001150000)", () => {
  const FILE = "20261001150000_album_log_prune.sql";

  it("album_state carries two watermarks, one per scope, zero until a prune", () => {
    expect(fileSql(FILE)).toContain(
      "alter table public.album_state add column host_watermark bigint not null default 0, add column album_watermark bigint not null default 0;",
    );
  });

  it("★ the reader answers the asked scope's watermark in the snapshot it reads the changes in", () => {
    const reader = latest("album_changes_since");
    expect(reader).toContain(
      "'watermark', case p_scope when 'host' then coalesce(s.host_watermark, 0) when 'album' then coalesce(s.album_watermark, 0) else 0 end,",
    );
    // Still one statement over album_state and album_changes: one snapshot.
    expect(reader).toContain(
      " returns jsonb language sql stable security invoker set search_path = ''",
    );
    expect(reader).toContain(
      "from (select 1) as one left join public.album_state s on s.event_id = p_event_id;",
    );
  });

  it("the prune is SECURITY DEFINER with an empty search_path, the service role's alone", () => {
    expect(latest("album_prune_tombstones")).toContain(
      "create function public.album_prune_tombstones( p_after uuid default null, p_limit integer default 5000 ) returns jsonb language plpgsql security definer set search_path = ''",
    );
    expect(fileSql(FILE)).toContain(
      "revoke all on function public.album_prune_tombstones(uuid, integer) from public, anon, authenticated; grant execute on function public.album_prune_tombstones(uuid, integer) to service_role;",
    );
    expect(everything()).not.toMatch(
      /grant execute on function public\.album_prune_tombstones\([^)]*\) to [^;]*\b(anon|authenticated|public)\b/,
    );
  });

  it("★ the prune takes the album's version row FIRST, then its change rows (the album rows' one order)", () => {
    const prune = latest("album_prune_tombstones");
    const lock = prune.indexOf(
      "perform 1 from public.album_state s where s.event_id = r.event_id for no key update;",
    );
    const del = prune.indexOf("delete from public.album_changes c");
    const raise = prune.indexOf(
      "update public.album_state s set host_watermark",
    );
    expect(lock).toBeGreaterThan(-1);
    expect(del).toBeGreaterThan(lock);
    expect(raise).toBeGreaterThan(del);
    // Albums one at a time in event-id order, as the flush takes them.
    expect(prune).toContain(
      "where c.event_id = any (v_albums) group by c.event_id order by c.event_id loop",
    );
  });

  it("★ only a purged item's row is pruned, and the watermarks only ever rise to what was deleted", () => {
    const prune = latest("album_prune_tombstones");
    expect(prune).toContain(
      "array_agg(c.media_id) filter (where m.id is null) as gone from public.album_changes c left join public.media m on m.id = c.media_id",
    );
    expect(prune).toContain(
      "where c.event_id = r.event_id and c.media_id = any (r.gone) and not exists (select 1 from public.media m where m.id = c.media_id) returning c.host_version, c.album_version",
    );
    expect(prune).toContain(
      "set host_watermark = greatest(s.host_watermark, v_top_host), album_watermark = greatest(s.album_watermark, coalesce(v_top_album, 0))",
    );
  });

  it("nothing but the prune ever writes a watermark", () => {
    const writers = new Set<string>();
    const fn = /create (?:or replace )?function public\.([a-z_0-9]+)\(/g;
    for (const { sql } of files()) {
      const code = stripComments(sql);
      const starts = [...code.matchAll(fn)];
      starts.forEach((m, i) => {
        const body = code.slice(m.index, starts[i + 1]?.index ?? code.length);
        if (/\b(host_watermark|album_watermark)\s*=/.test(body))
          writers.add(m[1]);
      });
    }
    expect([...writers]).toEqual(["album_prune_tombstones"]);
  });

  it("a pass walks album boundaries: the window's albums taken whole, `last` the next call's cursor", () => {
    const prune = latest("album_prune_tombstones");
    expect(prune).toContain(
      "select c.event_id from public.album_changes c where p_after is null or c.event_id > p_after order by c.event_id, c.media_id limit v_limit",
    );
    expect(prune).toContain(
      "v_limit constant integer := least(greatest(coalesce(p_limit, 5000), 1), 50000);",
    );
    expect(prune).toContain(
      "'last', (select x.a from unnest(v_albums) as x(a) order by x.a desc limit 1)",
    );
  });

  it("its switch is seeded ON under the catalog's own key", () => {
    expect(jobById("purge_album_log")?.flagKey).toBe("purge_album_log_enabled");
    expect(fileSql(FILE)).toContain(
      "insert into public.ops_flags (key, enabled) values ('purge_album_log_enabled', true) on conflict (key) do nothing;",
    );
  });
});
