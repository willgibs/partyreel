/**
 * THE DOORBELL'S TWO HALVES SAY ONE THING (crumbs-61, red-team 48's LOW; migration 20261003211000): the database rings once
 * for a write that moved many rows (`album_doorbell`: a develop, a hold released) with `{"moment": true}`, and the guest's
 * doorbell (`isMoment`, `refresh-coalescer.ts`, which `use-gallery-doorbell.ts` calls) asks at once for exactly that key. A key renamed on one side only
 * would make every develop wait for the batch clock again with no error anywhere, so the contract is read off the SQL
 * itself and handed to the client's own reader. The row-by-row ping an arrival makes stays contentless.
 *
 * What the file may not do is pinned too: the function's shape, its guard and its owner-only grants are the foundation's
 * (20261002200000), and nothing else moves (the trigger's own ping, the tables, the other functions).
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { isMoment } from "@/lib/guest/refresh-coalescer";

const MIGRATIONS_DIR = join(process.cwd(), "supabase", "migrations");
const FILE = "20261003211000_doorbell_moment.sql";

const code = (sql: string) => sql.replace(/--[^\n]*/g, "").replace(/\s+/g, " ");
const migration = () =>
  code(readFileSync(join(MIGRATIONS_DIR, FILE), "utf8")).trim();

/** The winning body of `public.<name>(`: its last definition across the whole migration set (latest wins). */
function latestBody(name: string): string {
  let found: string | null = null;
  for (const file of readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort()) {
    const sql = code(readFileSync(join(MIGRATIONS_DIR, file), "utf8"));
    const re = new RegExp(
      `create (?:or replace )?function public\\.${name}\\(`,
      "g",
    );
    let m: RegExpExecArray | null;
    while ((m = re.exec(sql))) {
      const opener = sql.slice(m.index).match(/\bas (\$[a-z_]*\$)/);
      if (!opener) continue;
      const tag = opener[1];
      const start = m.index + opener.index! + opener[0].length;
      found = sql.slice(
        m.index,
        sql.indexOf(`${tag};`, start) + tag.length + 1,
      );
    }
  }
  expect(found, `${name} defined nowhere`).not.toBeNull();
  return found!;
}

/** The JSON a body hands `realtime.send` as its payload. */
function sentPayload(body: string): unknown {
  const literal = body.match(
    /realtime\.send\('(\{[^']*\})'::jsonb, 'ping', 'gallery:' \|\| v_qr, false\)/,
  );
  expect(literal, "no ping to the gallery's channel").not.toBeNull();
  return JSON.parse(literal![1]);
}

describe("★ the ring for a whole write says so, in the key the client reads", () => {
  it("album_doorbell sends the payload isMoment answers yes to, on the same event, topic and guard as ever", () => {
    const body = latestBody("album_doorbell");
    const payload = sentPayload(body);
    expect(payload).toEqual({ moment: true });
    // The delivered message is `{ type, event, payload }`, the payload with the id `realtime.send` stamps beside it.
    expect(
      isMoment({
        type: "broadcast",
        event: "ping",
        payload: { ...(payload as object), id: "811f5cbe-0d21" },
      }),
    ).toBe(true);
    // The guard: a realtime failure never fails the write that rang.
    expect(body).toContain("exception when others then null;");
    // A deleted or unknown event rings nothing.
    expect(body).toContain(
      "where e.id = p_event_id and e.deleted_at is null; if v_qr is null then return; end if;",
    );
  });

  it("★ an arrival's ping, a row at a time, stays contentless: the client batches it", () => {
    const payload = sentPayload(latestBody("notify_gallery_change"));
    expect(payload).toEqual({});
    expect(isMoment({ type: "broadcast", event: "ping", payload })).toBe(false);
    expect(
      isMoment({ type: "broadcast", event: "ping", payload: { id: "x" } }),
    ).toBe(false);
  });
});

describe("the migration is the one body and its grants, and nothing else", () => {
  it("replaces album_doorbell with the foundation's own shape: void, invoker, an empty search_path", () => {
    expect(migration()).toContain(
      "create or replace function public.album_doorbell(p_event_id uuid) returns void language plpgsql security invoker set search_path = '' as $$",
    );
  });

  it("restates the owner-only grants, and grants nothing to anyone", () => {
    const sql = migration();
    expect(sql).toContain(
      "revoke all on function public.album_doorbell(uuid) from public, anon, authenticated, service_role;",
    );
    expect(sql).not.toMatch(/\bgrant\b/);
  });

  it("changes nothing else: no table, no column, no trigger, no other function, no row", () => {
    const sql = migration();
    expect(sql.match(/create (or replace )?function/g)).toHaveLength(1);
    expect(sql).not.toMatch(
      /\b(create table|alter table|drop |add column|create trigger|create policy|insert into public|update public|delete from)\b/,
    );
  });
});
