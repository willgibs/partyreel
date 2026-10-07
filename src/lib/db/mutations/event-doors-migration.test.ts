/**
 * ★ AN EMAIL FIRST REMEMBERS HER NAMES-ONLY DOOR, THE SQL FACTS (crumbs-89, 20261007140000), pinned latest-wins across the
 * whole migration set through the one reader (`testing/migrations.ts`), beside the call that reads them (`event-doors.ts`).
 *
 * Letting each person in and the invite list hold "An email first" on. A gate that turns it on from off is remembered by
 * the event (`events.email_held`), and the gate's leaving gives her names only back, on every path that moves a gate and
 * from every device: red-team 57b found the page's own note (crumbs-87) lost to a load. What these hold:
 *   1. ★ one trigger owns the memory both ways, on every write of the gate, and nothing else writes it;
 *   2. ★ set_event_door answers what the gate gave back from the row its update left, its update and every pin of
 *      today's body kept;
 *   3. no client role reaches the column's writes or the trigger's function.
 */
import { describe, expect, it } from "vitest";

import {
  executableMigrations,
  liveFunction,
} from "@/lib/db/testing/migrations";

const FILE = "20261007140000_email_first_memory.sql";
const held = () => liveFunction("events_email_held");
const door = () => liveFunction("set_event_door");

/** Where a needle sits in a body's code, failing loudly when it is absent. */
function at(code: string, needle: string): number {
  const i = code.indexOf(needle);
  expect(i, needle).toBeGreaterThan(-1);
  return i;
}

describe("1. the memory, owned by one trigger", () => {
  it("★ an address gate that turns the step on from off remembers; any other gate gives it back and forgets", () => {
    const { code, file } = held();
    expect(file >= FILE, file).toBe(true);
    // INVOKER with an empty path: it writes only NEW, so it borrows nobody's rights.
    expect(code).toMatch(
      /^create (or replace )?function public\.events_email_held\(\) returns trigger language plpgsql set search_path = '' as \$\$/,
    );
    expect(code).not.toMatch(/\bsecurity definer\b/);
    const remember = at(
      code,
      "if new.gate in ('approve', 'invite') then if not old.require_verified_email and new.require_verified_email then new.email_held := true; end if;",
    );
    const giveBack = at(
      code,
      "else if old.email_held then new.require_verified_email := false; end if; new.email_held := false; end if; return new;",
    );
    expect(giveBack).toBeGreaterThan(remember);
  });

  it("★ fires before every write of the gate, the one column every move of a gate writes, and is never dropped", () => {
    let standing = false;
    for (const { file, sql } of executableMigrations()) {
      for (const [statement, verb] of sql.matchAll(
        /\b(create|drop) trigger (?:if exists )?events_email_held\b[^;]*;/g,
      )) {
        standing = verb === "create";
        if (verb === "create") {
          expect(statement, file).toContain(
            "before update of gate on public.events for each row execute function public.events_email_held();",
          );
        }
      }
    }
    expect(standing).toBe(true);
  });

  it("★ no client role writes the memory: no grant names it, and no body but the trigger's writes it", () => {
    for (const { file, sql } of executableMigrations()) {
      for (const [statement] of sql.matchAll(
        /grant [^;]* on (?:table )?public\.events to [^;]*;/g,
      )) {
        expect(statement, file).not.toMatch(/\bemail_held\b/);
      }
      // A write of the column outside the trigger's NEW (an update's SET, an insert's list) would be a second writer.
      expect(sql, file).not.toMatch(/\bset\b[^;]*\bemail_held\s*=/);
    }
  });
});

describe("2. set_event_door answers what the gate gave back", () => {
  it("★ reads the row its update left, after the update, and answers email_restored beside today's keys", () => {
    const { code, file } = door();
    expect(file >= FILE, file).toBe(true);
    const update = at(
      code,
      "update public.events set visibility = v_visibility, gate = v_gate, require_verified_email = v_email where id = v_event.id;",
    );
    const read = at(
      code,
      "select e.require_verified_email into v_email_now from public.events e where e.id = v_event.id;",
    );
    expect(read).toBeGreaterThan(update);
    expect(code).toContain(
      "'email_held', v_email and not v_event.require_verified_email, 'email_restored', v_event.require_verified_email and not v_email_now, 'admitted', v_waiting + v_listed",
    );
  });

  it("keeps the host's own act as it stood: authenticated only, DEFINER, the host re-checked under the row's lock", () => {
    const { code, fileSql } = door();
    expect(code).toContain("security definer set search_path = ''");
    expect(code).toContain(
      "where e.id = p_event_id and e.host_id = v_uid and e.deleted_at is null for no key update;",
    );
    const sql = fileSql.replace(/--[^\n]*/g, "").replace(/\s+/g, " ");
    expect(sql).toContain(
      "revoke all on function public.set_event_door(uuid, text) from public, anon, authenticated; grant execute on function public.set_event_door(uuid, text) to authenticated;",
    );
  });
});

describe("3. the trigger's function is no client role's", () => {
  it("revokes it from every client role in its file, and no file grants it", () => {
    const { fileSql } = held();
    const sql = fileSql.replace(/--[^\n]*/g, "").replace(/\s+/g, " ");
    expect(sql).toContain(
      "revoke all on function public.events_email_held() from public, anon, authenticated;",
    );
    for (const { file, sql: text } of executableMigrations()) {
      expect(text, file).not.toMatch(
        /grant execute on function public\.events_email_held\(\) to/,
      );
    }
  });
});
