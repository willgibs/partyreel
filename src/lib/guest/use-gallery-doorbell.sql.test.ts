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
import { describe, expect, it } from "vitest";

import {
  executableMigrations,
  liveFunction,
} from "@/lib/db/testing/migrations";
import { isMoment } from "@/lib/guest/refresh-coalescer";

const FILE = "20261003211000_doorbell_moment.sql";

/** This one migration as code (comments gone, whitespace collapsed): what the file itself may and may not do. */
function migration(): string {
  const found = executableMigrations().find(({ file }) => file === FILE);
  expect(found, `${FILE} is gone`).toBeDefined();
  return found!.sql.trim();
}

/**
 * The winning body of `public.<name>(`, as code: the definition that wins across the whole migration set
 * (`testing/migrations.ts` replays its creates AND drops in order), so a function a later file drops throws here,
 * naming the file, rather than reading as the body it had before.
 */
const latestBody = (name: string): string => liveFunction(name).code;

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
