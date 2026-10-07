/**
 * ★ THE RESTORES TAKE THEIR ROWS WITHOUT WAITING UNDER HER LOCK (crumbs-91, 20261008030000; storage-sums-signal's Q2),
 * pinned latest-wins across the whole migration set through the one reader (`testing/migrations.ts`).
 *
 * Every capacity decision takes the host's profiles row first, and every media write takes it after the media rows it
 * wrote (the storage sums' statement trigger, the meter, the purge's own update), so a body holding her row that then
 * waits on a media row closes a cycle with any writer holding that row on its way to hers (database-security.md, the
 * lock order). What these hold, so a later `create or replace` that drops a lock or reorders one fails here, by name:
 *   1. ★ restore_media takes the item right after her row, NOWAIT, before every read that decides, and only a row of
 *      her own events (no caller can lock another host's row), the media row alone (never the event's);
 *   2. ★ let_back_in, restoring, takes the block's rows SKIP LOCKED after her row, and still counts what came back;
 *   3. both keep their grants as they stand: the signed-in host's, never anon's or PUBLIC's.
 * Their behaviour on the live schema is the migration's own rolled-back proof, their races the pre-flight's (its header).
 */
import { describe, expect, it } from "vitest";

import {
  executableMigrations,
  liveFunction,
} from "@/lib/db/testing/migrations";

const FILE = "20261008030000_crumbs_91.sql";

/** Where a needle sits in a body's code, failing loudly when it is absent. */
function at(code: string, needle: string): number {
  const i = code.indexOf(needle);
  expect(i, needle).toBeGreaterThan(-1);
  return i;
}

/** Every grant or revoke naming the function, across the set, in order, as code. */
function grantsOf(name: string): string[] {
  const out: string[] = [];
  for (const { sql } of executableMigrations()) {
    const re = new RegExp(
      `(?:grant|revoke) [^;]* on function public\\.${name}\\([^)]*\\)[^;]*;`,
      "g",
    );
    for (const m of sql.matchAll(re)) out.push(m[0]);
  }
  return out;
}

describe("1. restore_media: her row, then the item at once or not at all", () => {
  const restore = () => liveFunction("restore_media");

  it("is this file's definition or a later one", () => {
    expect(restore().file >= FILE, restore().file).toBe(true);
  });

  it("★ takes her profiles row first, then the item NOWAIT, then reads it, then writes it", () => {
    const { code } = restore();
    const herRow = at(
      code,
      "select * into v_profile from public.profiles where id = (select auth.uid()) for update;",
    );
    const theItem = at(
      code,
      "perform 1 from public.media x join public.events e on e.id = x.event_id where x.id = p_media_id and e.host_id = (select auth.uid()) for no key update of x nowait;",
    );
    // Every read that decides comes after the lock, so none is an older snapshot's: whose it is, withdrawn or asked,
    // its album's deletion, its window, a hold, a takedown.
    const read = at(code, "select m.* into v_media from public.media m");
    const write = at(
      code,
      "update public.media set status = v_target, removed_at = null, removed_by_system = false where id = p_media_id and status = 'removed';",
    );
    expect(theItem).toBeGreaterThan(herRow);
    expect(read).toBeGreaterThan(theItem);
    expect(write).toBeGreaterThan(read);
  });

  it("locks nothing else: one lock of her row, one of the item, the media row alone and never another host's", () => {
    const { code } = restore();
    expect(code.split("from public.profiles").length - 1).toBe(1);
    expect(code.split("nowait").length - 1).toBe(1);
    expect(code.split("for no key update").length - 1).toBe(1);
    // `of x`: the event row, which a door's move and a develop's save lock, is joined, never locked; and the join keys
    // the lock on the caller's own events, so a loop of calls holds no other host's row.
    expect(code).toContain("for no key update of x nowait");
    expect(code).not.toMatch(/\bfor update of\b|\bfor share\b/);
  });

  it("keeps its grants as they stand: the signed-in host's, PUBLIC's default revoked first", () => {
    expect(grantsOf("restore_media").slice(-2)).toEqual([
      "revoke execute on function public.restore_media(uuid) from public, anon, authenticated;",
      "grant execute on function public.restore_media(uuid) to authenticated;",
    ]);
  });
});

describe("2. let_back_in: only the block's rows it can take at once", () => {
  const lift = () => liveFunction("let_back_in");

  it("is this file's definition or a later one, let_in's three arguments kept", () => {
    expect(lift().file >= FILE, lift().file).toBe(true);
    expect(lift().params).toBe(
      "p_block_id uuid, p_restore boolean default false, p_let_in boolean default false",
    );
  });

  it("★ takes her profiles row first, then the block's rows SKIP LOCKED, counting only what came back", () => {
    const { code } = lift();
    const herRow = at(
      code,
      "select * into v_profile from public.profiles where id = v_event.host_id for update;",
    );
    const theRows = at(
      code,
      "order by m.created_at desc, m.id desc for update skip locked loop",
    );
    const counted = at(code, "v_restored := v_restored + 1;");
    expect(theRows).toBeGreaterThan(herRow);
    expect(counted).toBeGreaterThan(theRows);
    // No media row is ever waited on: the loop's is its one lock of media, and it skips.
    expect(code.split("for update").length - 1).toBe(2);
    expect(code).toContain("'restored', v_restored,");
  });

  it("keeps its grants as they stand: the signed-in host's, PUBLIC's default revoked first", () => {
    expect(grantsOf("let_back_in").slice(-2)).toEqual([
      "revoke all on function public.let_back_in(uuid, boolean, boolean) from public, anon, authenticated;",
      "grant execute on function public.let_back_in(uuid, boolean, boolean) to authenticated;",
    ]);
  });
});
