/**
 * UPLOAD SUMS (20261006180000): what a host stores, summed per event and per host by the database itself, so an
 * upload's three reads of her bytes (`host_storage_summary`) and the size list's totals stop walking every item she
 * owns. Text-parsed off the migrations (Vitest has no Postgres), newest definition wins, fail-closed: a body the parser
 * cannot read fails. That the sums EQUAL the walk is the migration's rolled-back proof and `storage_sums_drift`'s
 * nightly reconciliation; what is pinned here is the shape that makes that true and keeps it cheap:
 *
 *   - the summary reads the sums and never walks her items, but for the binned rows past their 30 days;
 *   - "binned" (what Deleted can hold) is spelled one way everywhere, and it is host_deleted_media's own rule;
 *   - the window is the Deleted lists' own (RECENTLY_DELETED_WINDOW_DAYS);
 *   - one trigger body on media, once a statement, for INSERT, UPDATE and DELETE, taking her profiles row before it
 *     writes a sum (the one lock order), and so does the rebuild;
 *   - the walk the sums answer to is the summary's old body, verbatim;
 *   - who reaches what: her own events' live totals under RLS, nothing else of either table, the functions exact.
 */
import { describe, expect, it } from "vitest";

import {
  executableMigrations,
  executableSql,
  liveFunction,
  readMigrations,
} from "@/lib/db/testing/migrations";
import { RECENTLY_DELETED_WINDOW_DAYS } from "@/lib/lifecycle/recently-deleted";

const FILE = "20261006180000_upload_sums.sql";

const migration = readMigrations().find((m) => m.file === FILE);
if (!migration) throw new Error(`${FILE} is missing.`);
/** The file as it runs: comments out (the proof at its foot is a comment), whitespace collapsed, lower case. */
const code = executableSql(migration.sql, FILE)
  .replace(/\s+/g, " ")
  .toLowerCase();

/** A function's body as code (comments out, whitespace collapsed, lower case), from the set's live definition. */
function body(name: string): string {
  const fn = liveFunction(name);
  const open = fn.code.indexOf("$$");
  const close = fn.code.lastIndexOf("$$");
  if (open < 0 || close <= open) throw new Error(`Cannot read ${name}'s body.`);
  return fn.code
    .slice(open + 2, close)
    .trim()
    .toLowerCase();
}

/** Binned, the one way: a removal that is neither a withdrawal, nor an operator's, nor asked to leave for good. */
const BINNED =
  /(\b[a-z]\.)?status = 'removed' and not \1?removed_by_uploader and not \1?removed_by_admin and \1?purge_asked_at is null/g;

describe("the summary reads the sums", () => {
  const summary = body("host_storage_summary");

  it("★ from her total, her deleted events' rows and the aged removals, never every item she owns", () => {
    expect(summary).toContain(
      "left join public.host_storage_sums h on h.host_id = p_host_id",
    );
    expect(summary).toContain(
      "from public.event_storage_sums x where x.event_id = e.id offset 0",
    );
    expect(summary).toContain(
      "where e.host_id = p_host_id and e.deleted_at is not null",
    );
    // The walk's two functions are the reconciliation's, never a request's.
    expect(summary).not.toContain("host_active_bytes(");
    expect(summary).not.toContain("host_deleted_media(");
    // The one media read: binned rows in an event whose oldest removal passed the edge, past their own 30 days.
    expect(summary.match(/public\.media m/g)).toHaveLength(1);
    expect(summary).toContain("s.binned_since < now() - interval");
    expect(summary).toContain("(m.removed_at < now() - interval");
  });

  it("★ reads the Deleted lists' own window, from its start on", () => {
    const windows = summary.match(/interval '(\d+) days'/g) ?? [];
    expect(windows.length).toBeGreaterThan(0);
    for (const w of windows)
      expect(w).toBe(`interval '${RECENTLY_DELETED_WINDOW_DAYS} days'`);
    // Inside is `>=` (host_deleted_media's own edge), so past it is `<`.
    expect(summary).toContain(
      `e.deleted_at >= now() - interval '${RECENTLY_DELETED_WINDOW_DAYS} days'`,
    );
    expect(summary).not.toMatch(
      /deleted_at > now\(\)|removed_at >= now\(\)|deleted_at <= now\(\)/,
    );
  });

  it("keeps its signature, columns and grants (the builds deployed read it by name)", () => {
    const fn = liveFunction("host_storage_summary");
    expect(fn.returns.replace(/\s+/g, " ")).toMatch(
      /^table ?\( ?active_bytes bigint, standby_bytes bigint, system_bytes bigint ?\)$/,
    );
    expect(fn.code.toLowerCase()).toMatch(
      /security definer set search_path = ''/,
    );
    expect(code).toContain(
      "revoke all on function public.host_storage_summary(uuid) from public, anon, authenticated; grant execute on function public.host_storage_summary(uuid) to service_role;",
    );
  });
});

describe("binned is one rule", () => {
  it("★ is host_deleted_media's own removal arm", () => {
    const deleted = body("host_deleted_media");
    expect(deleted).toContain(
      "m.status = 'removed' and not m.removed_by_uploader and not m.removed_by_admin and m.purge_asked_at is null",
    );
  });

  it("★ is spelled that one way wherever this file reads a flag of it", () => {
    // Every mention of a withdrawal in the running SQL sits inside the whole rule, so no reader (the trigger's fold,
    // the index, the summary's aged read, the backfill, the reconciliation, the rebuild) can drift from the others.
    const mentions = code.match(/removed_by_uploader/g) ?? [];
    const whole = code.match(BINNED) ?? [];
    expect(mentions.length).toBeGreaterThan(8);
    expect(whole).toHaveLength(mentions.length);
  });

  it("the partial index is the rule, so the planner proves it", () => {
    expect(code).toContain(
      "create index media_binned_idx on public.media (event_id, removed_at nulls first) where status = 'removed' and not removed_by_uploader and not removed_by_admin and purge_asked_at is null;",
    );
  });
});

describe("one trigger body keeps the sums", () => {
  const trigger = body("media_storage_sums");

  it("★ after every INSERT, UPDATE and DELETE on media, once a statement, off its transition tables", () => {
    expect(code).toContain(
      "create trigger media_storage_sums_insert after insert on public.media referencing new table as new_rows for each statement execute function public.media_storage_sums();",
    );
    expect(code).toContain(
      "create trigger media_storage_sums_update after update on public.media referencing old table as old_rows new table as new_rows for each statement execute function public.media_storage_sums();",
    );
    expect(code).toContain(
      "create trigger media_storage_sums_delete after delete on public.media referencing old table as old_rows for each statement execute function public.media_storage_sums();",
    );
    // A later file that drops one would leave a writer uncounted.
    for (const name of ["insert", "update", "delete"]) {
      for (const m of executableMigrations()) {
        if (m.file <= FILE) continue;
        expect(executableSql(m.sql, m.file).toLowerCase()).not.toContain(
          `drop trigger media_storage_sums_${name}`,
        );
      }
    }
  });

  it("★ takes her profiles row, every host's in id order, before it writes a sum (the one lock order)", () => {
    const lock = trigger.indexOf(
      "from public.profiles p where p.id in (select (c ->> 'host_id')::uuid from jsonb_array_elements(v_changes) c) order by p.id for no key update",
    );
    expect(lock).toBeGreaterThan(0);
    const writes = [
      ...trigger.matchAll(
        /(insert into|update|delete from) public\.(event|host)_storage_sums/g,
      ),
    ].map((m) => m.index ?? -1);
    expect(writes.length).toBeGreaterThan(4);
    expect(Math.min(...writes)).toBeGreaterThan(lock);
    // A statement that moved nothing counted returns before the lock.
    expect(
      trigger.indexOf("if v_changes is null then return null; end if;"),
    ).toBeLessThan(lock);
  });

  it("only makes a sum row for an event its statement's new rows name (so it, and she, exist)", () => {
    const made = trigger.indexOf("insert into public.event_storage_sums");
    expect(trigger.lastIndexOf("if r.named_new then", made)).toBeGreaterThan(0);
    expect(
      trigger.match(/insert into public\.(event|host)_storage_sums/g),
    ).toHaveLength(2);
  });

  it("is SECURITY DEFINER with an empty search_path, and no role's to call", () => {
    expect(liveFunction("media_storage_sums").code.toLowerCase()).toMatch(
      /returns trigger language plpgsql security definer set search_path = ''/,
    );
    expect(code).toContain(
      "revoke all on function public.media_storage_sums() from public, anon, authenticated, service_role;",
    );
    expect(code).not.toMatch(
      /grant [^;]* on function public\.media_storage_sums\(/,
    );
  });

  it("★ no foreign key ties a sum row to its event (the cascade's order would lose her total)", () => {
    const table = code.slice(
      code.indexOf("create table public.event_storage_sums"),
      code.indexOf("create table public.host_storage_sums"),
    );
    expect(table).not.toContain("references");
    // Her total leaves with her profile.
    expect(code).toContain(
      "host_id uuid primary key references public.profiles (id) on delete cascade",
    );
  });
});

describe("the walk the sums answer to", () => {
  it("★ is the summary's body before this file, verbatim", () => {
    const before = readMigrations().find(
      (m) => m.file === "20261003220000_deleted_counts.sql",
    );
    if (!before) throw new Error("20261003220000 is missing.");
    const sql = before.sql;
    const start = sql.search(/create function public\.host_storage_summary\(/);
    const open = sql.indexOf("$$", start);
    const old = sql
      .slice(open + 2, sql.indexOf("$$", open + 2))
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
    expect(body("host_storage_walk")).toBe(old);
  });

  it("is the owner's alone, and the reconciliation and the rebuild read it", () => {
    expect(liveFunction("host_storage_walk").code.toLowerCase()).toMatch(
      /security invoker set search_path = ''/,
    );
    expect(code).toContain(
      "revoke all on function public.host_storage_walk(uuid) from public, anon, authenticated, service_role;",
    );
    expect(body("storage_sums_drift")).toContain(
      "from public.host_storage_walk(v_host)",
    );
    // The reconciliation writes nothing: it is STABLE, and no write verb appears in it.
    expect(liveFunction("storage_sums_drift").code.toLowerCase()).toMatch(
      /language plpgsql stable security definer/,
    );
    expect(body("storage_sums_drift")).not.toMatch(
      /\b(insert into|update public|delete from)\b/,
    );
  });

  it("★ the rebuild takes her profiles row before it touches a sum", () => {
    const rebuild = body("rebuild_storage_sums");
    const lock = rebuild.indexOf(
      "from public.profiles where id = p_host_id for no key update",
    );
    expect(lock).toBeGreaterThan(0);
    expect(
      rebuild.indexOf("delete from public.event_storage_sums"),
    ).toBeGreaterThan(lock);
  });
});

describe("who reaches what", () => {
  it("★ she reads her own events' live totals under RLS, and nothing else of either table", () => {
    expect(code).toContain(
      "alter table public.event_storage_sums enable row level security;",
    );
    expect(code).toContain(
      "alter table public.host_storage_sums enable row level security;",
    );
    expect(code).toContain(
      "revoke all on public.event_storage_sums from public, anon, authenticated, service_role;",
    );
    expect(code).toContain(
      "revoke all on public.host_storage_sums from public, anon, authenticated, service_role;",
    );
    const grants = code.match(
      /grant [^;]* on (table )?public\.(event|host)_storage_sums[^;]*;/g,
    );
    expect(grants).toEqual([
      "grant select (event_id, host_id, live_bytes, live_count) on public.event_storage_sums to authenticated;",
    ]);
    expect(code).toContain(
      "create policy event_storage_sums_host_read on public.event_storage_sums for select to authenticated using (host_id = (select auth.uid()));",
    );
    expect(code).not.toMatch(
      /create policy [^;]* on public\.host_storage_sums/,
    );
  });

  it("the reconciliation and the rebuild are the service role's alone", () => {
    for (const fn of [
      "storage_sums_drift(uuid, integer)",
      "rebuild_storage_sums(uuid)",
    ]) {
      expect(code).toContain(
        `revoke all on function public.${fn} from public, anon, authenticated;`,
      );
      expect(code).toContain(
        `grant execute on function public.${fn} to service_role;`,
      );
    }
  });
});
