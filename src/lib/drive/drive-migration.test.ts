/**
 * SEND TO GOOGLE DRIVE'S MIGRATION (20261005120000), its load-bearing facts pinned (database-security.md: "a new
 * load-bearing fact earns a guard"): every function a pinned SECURITY DEFINER the service role's alone (the two
 * helpers no served role's); five tables deny-all and the one a client reads granted exactly the progress columns the
 * app selects; the one lock order; no exit and nothing that deletes anything of hers; the spend watch's readings
 * restated byte for byte but for the Drive section; the switch seeded on.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const MIGRATIONS = join(process.cwd(), "supabase", "migrations");
const raw = readFileSync(join(MIGRATIONS, "20261005120000_cloud_export.sql"), "utf8");

/** The executable SQL: the rolled-back check at the foot, and every comment line, left out. */
function executable(text: string): string {
  return text
    .split("\n")
    .filter((line) => !line.trimStart().startsWith("--"))
    .join("\n");
}
const sql = executable(raw);

function functionNames(text: string): string[] {
  return [...text.matchAll(/create (?:or replace )?function public\.(\w+)\(/g)].map((m) => m[1]!);
}

function bodyOf(text: string, name: string): string {
  const start = text.search(new RegExp(`create (?:or replace )?function public\\.${name}\\(`));
  expect(start, name).toBeGreaterThanOrEqual(0);
  const end = text.indexOf("$$;", text.indexOf("as $$", start));
  return text.slice(start, end);
}

const HELPERS = ["cloud_export_pause", "cloud_export_settle"];
const NAMES = functionNames(sql);

describe("the functions", () => {
  it("are the ones the app calls, each once", () => {
    expect(new Set(NAMES).size).toBe(NAMES.length);
    expect(NAMES.filter((n) => n.startsWith("cloud_")).length).toBeGreaterThanOrEqual(20);
    expect(NAMES).toContain("spend_watch_readings");
  });

  it("★ are each a SECURITY DEFINER with an empty search_path (the watch's readings stay an INVOKER read)", () => {
    for (const name of NAMES) {
      const body = bodyOf(sql, name);
      if (name === "spend_watch_readings") {
        expect(body, name).toMatch(/security invoker\s+set search_path = ''/);
      } else {
        expect(body, name).toMatch(/security definer\s+set search_path = ''/);
      }
    }
  });

  it("★ revoke PUBLIC's default first, then grant the service role alone; the helpers no served role", () => {
    for (const name of NAMES) {
      const revoke = sql.search(new RegExp(`revoke all on function public\\.${name}\\([^)]*\\) from public, anon, authenticated`));
      expect(revoke, `${name} is never revoked from public`).toBeGreaterThan(-1);
      const grant = sql.search(new RegExp(`grant execute on function public\\.${name}\\([^)]*\\) to service_role;`));
      if (HELPERS.includes(name)) {
        expect(sql).toMatch(new RegExp(`revoke all on function public\\.${name}\\([^)]*\\) from public, anon, authenticated, service_role;`));
        expect(grant, `${name} is granted`).toBe(-1);
      } else {
        expect(grant, `${name} is never granted`).toBeGreaterThan(revoke);
      }
    }
    expect(sql).not.toMatch(/grant execute[^;]*to (anon|authenticated|public)/);
  });

  it("answer one value each, never a set PostgREST could cut at 1,000 rows", () => {
    for (const name of NAMES) {
      expect(bodyOf(sql, name), name).toMatch(/\)\s*returns (jsonb|integer|text)\s/);
    }
  });
});

describe("the tables", () => {
  const DENY_ALL = [
    "cloud_connections",
    "cloud_event_folders",
    "cloud_export_items",
    "cloud_export_leases",
    "cloud_export_sent_hours",
  ];

  it("★ keep RLS on all six, five with no policy and no client grant", () => {
    for (const table of [...DENY_ALL, "cloud_exports"]) {
      expect(sql, table).toContain(`alter table public.${table} enable row level security;`);
    }
    for (const table of DENY_ALL) {
      expect(sql, table).not.toMatch(new RegExp(`create policy \\w+ on public\\.${table}\\b`));
      expect(sql, table).not.toMatch(new RegExp(`grant [^;]* on (table )?public\\.${table}\\b`));
    }
    expect(sql).toMatch(
      /revoke all on table public\.cloud_connections, public\.cloud_event_folders, public\.cloud_export_items,\s+public\.cloud_export_leases, public\.cloud_export_sent_hours from anon, authenticated;/,
    );
  });

  it("★ let a host read only her own sends, and only the progress columns the app selects", () => {
    expect(sql).toMatch(
      /create policy cloud_exports_owner_select on public\.cloud_exports\s+for select to authenticated\s+using \(user_id = \(select auth\.uid\(\)\)\);/,
    );
    const policies = [...sql.matchAll(/create policy (\w+) on public\.(\w+)/g)].map((m) => `${m[1]}:${m[2]}`);
    expect(policies).toEqual(["cloud_exports_owner_select:cloud_exports"]);

    const grant = /grant select \(([^)]*)\) on public\.cloud_exports to authenticated;/.exec(sql);
    expect(grant).not.toBeNull();
    const granted = grant![1]!.split(",").map((c) => c.trim()).sort();
    // The app's SELECT list, read from its one home (the module itself needs a server to import).
    const queries = readFileSync(join(process.cwd(), "src", "lib", "db", "queries", "drive.ts"), "utf8");
    const selected = /export const SEND_COLUMNS =\s*"([^"]+)"/.exec(queries)![1]!.split(",").map((c) => c.trim());
    for (const column of selected) expect(granted, column).toContain(column);
    // Never the connection, a folder id, a token, a session or a cursor.
    for (const secret of ["connection_id", "folder_id", "tz", "user_id", "stuck_since", "done_mailed_at"]) {
      expect(granted, secret).not.toContain(secret);
    }
    // No later table-level SELECT revoke from authenticated (it would cascade to the column grant).
    expect(sql).not.toMatch(/revoke select on table public\.cloud_exports from [^;]*authenticated/);
  });
});

describe("what the functions do", () => {
  it("★ take the connection row first wherever they lock a send or its items (one order, no cycle)", () => {
    for (const name of NAMES) {
      if (HELPERS.includes(name) || name === "cloud_export_sweep" || name === "spend_watch_readings") continue;
      const body = bodyOf(sql, name);
      const locks = [...body.matchAll(/for update/g)].map((m) => m.index!);
      if (locks.length === 0) continue;
      const first = body.slice(Math.max(0, locks[0]! - 220), locks[0]!);
      expect(first, `${name}: its first lock is not the connection's`).toMatch(/public\.cloud_connections/);
    }
  });

  it("★ the sweep's send-only updates skip what a lane holds", () => {
    const sweep = bodyOf(sql, "cloud_export_sweep");
    const sendOnly = sweep.slice(sweep.indexOf("update public.cloud_exports j\n     set status = 'stopped', stop_reason = 'failed_to_start'"));
    for (const update of sendOnly.matchAll(/update public\.cloud_exports j[\s\S]*?;/g)) {
      expect(update[0]).toContain("for update skip locked");
    }
  });

  it("never lock or write an album's rows: media and events are read, never locked", () => {
    expect(sql).not.toMatch(/from public\.(media|events)\b[^;]*for update/);
    expect(sql).not.toMatch(/update public\.(media|events|profiles)\b/);
    expect(sql).not.toMatch(/delete from public\.(media|events|profiles)\b/);
  });

  it("★ offer no exit: her acts are cancel, resume, retry and seen, and nothing deletes what she sent", () => {
    const act = bodyOf(sql, "cloud_export_act");
    const acts = [...act.matchAll(/p_act = '(\w+)'/g)].map((m) => m[1]).sort();
    expect(acts).toEqual(["cancel", "resume", "retry", "seen"]);
    expect(sql).not.toMatch(/'exit'|'delete_copy'|'free'/);
  });

  it("refuse a retry while a newer send of the album runs (one unfinished send an album)", () => {
    expect(sql).toMatch(/create unique index cloud_exports_one_unfinished\s+on public\.cloud_exports \(user_id, event_id\)\s+where status in \('preparing', 'sending', 'paused', 'checking'\);/);
    expect(bodyOf(sql, "cloud_export_act")).toContain("'already_sending'");
  });

  it("read the switch inside the kick, the lease and the report, a missing row reading on", () => {
    const read = "coalesce((select f.enabled from public.ops_flags f where f.key = 'drive_export_enabled'), true)";
    for (const name of ["cloud_connection_kick", "cloud_export_create", "cloud_export_lease", "cloud_export_report"]) {
      expect(bodyOf(sql, name), name).toContain(read);
    }
    expect(sql).toContain("insert into public.ops_flags (key, enabled) values ('drive_export_enabled', true)");
    expect(sql).toMatch(/values \('drive_export_enabled', true\)\s+on conflict \(key\) do nothing;/);
  });

  it("stop at 700 GB of Google's 750 a day, per connection", () => {
    expect(bodyOf(sql, "cloud_export_lease")).toMatch(/700(::bigint)? \* 1024 \* 1024 \* 1024/);
  });
});

describe("the spend watch's readings, restated", () => {
  it("★ are 20261003190000's body byte for byte, but for the Drive section", () => {
    const before = bodyOf(executable(readFileSync(join(MIGRATIONS, "20261003190000_spend_watch.sql"), "utf8")), "spend_watch_readings");
    const mine = bodyOf(sql, "spend_watch_readings");
    const section = /\n  begin\n    select coalesce\(sum\(h\.bytes\), 0\)::bigint into v_n[\s\S]*?jsonb_build_object\('drive_bytes', sqlerrm\);\n  end;\n/.exec(mine);
    expect(section, "the Drive section").not.toBeNull();
    expect(mine.replace(section![0], "")).toBe(before);
  });

  it("trap the Drive section's failure alone", () => {
    const mine = bodyOf(sql, "spend_watch_readings");
    expect(mine).toContain("v_errors := v_errors || jsonb_build_object('drive_bytes', sqlerrm);");
    expect(mine.match(/exception when others then/g)).toHaveLength(7);
  });
});
