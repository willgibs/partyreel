/**
 * APPROVAL NEVER STANDS WITH A DEVELOP, IN SQL (lane `wait-wiring`, 20261003100000; the-wait r1's `both=never`),
 * pinned LATEST-WINS across the migration set the way `migration-guards.test.ts` pins the foundation: each pin reads
 * CODE (comments stripped, whitespace collapsed), so a later file that drops a clause fails here. Its behaviour is the
 * migration's rolled-back check (its foot), red on today's schema and green with the file.
 *
 * What they hold:
 *   1. THE CHECK refuses the pair, by the name the host's write reads its refusal by, after the rows holding both are
 *      brought to one answer (their held rows approved, sealed while the develop is ahead).
 *   2. AN APPROVAL UNDER A DEVELOP TIME AHEAD SEALS THE ROW WITH IT: a held row joins the roll, whoever approves it.
 *   3. LEAVING APPROVAL RELEASES WHAT IS HELD IN THE SAME SAVE, skipping a row another writer holds, ringing once.
 *   4. Who may run what: two trigger functions, the client roles' EXECUTE revoked, and nothing that waits on a media
 *      row while the event row is held.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { readMigrations } from "@/lib/db/testing/migrations";
import { APPROVAL_NEVER_WITH_A_DEVELOP_CHECK } from "@/lib/disposable/album-style";

const MIGRATIONS_DIR = join(process.cwd(), "supabase", "migrations");
const FILE = "20261003100000_approval_never_with_a_develop.sql";

const collapse = (sql: string) => sql.replace(/\s+/g, " ");
const strip = (sql: string) => sql.replace(/--[^\n]*/g, "");

/** The winning definition of `public.<name>(`: the last create across the set. */
function code(name: string): string {
  let found: string | null = null;
  for (const { sql } of readMigrations()) {
    const text = strip(sql);
    const re = new RegExp(
      `create (?:or replace )?function public\\.${name}\\(`,
      "g",
    );
    let m: RegExpExecArray | null;
    while ((m = re.exec(text))) {
      const rest = text.slice(m.index);
      const opener = rest.match(/\bas (\$[a-z_]*\$)/);
      if (!opener) continue;
      const tag = opener[1];
      const start = m.index + opener.index! + opener[0].length;
      const close = text.indexOf(`${tag};`, start);
      found = collapse(text.slice(m.index, close + tag.length + 1));
    }
  }
  expect(found, `${name} defined nowhere`).not.toBeNull();
  return found!;
}

const fileSql = () =>
  collapse(strip(readFileSync(join(MIGRATIONS_DIR, FILE), "utf8")));

describe("1. the CHECK, after the rows holding both are brought to one answer", () => {
  it("refuses approval with a develop time, by the name the host's write reads", () => {
    expect(APPROVAL_NEVER_WITH_A_DEVELOP_CHECK).toBe(
      "events_approval_never_develops",
    );
    expect(fileSql()).toContain(
      "alter table public.events add constraint events_approval_never_develops check (not (moderation_mode = 'hold_for_approval' and develops_at is not null));",
    );
  });

  it("★ a row holding both leaves approval first, its held rows approved (and so sealed while the develop is ahead)", () => {
    const sql = fileSql();
    const approve = sql.indexOf(
      "update public.media m set status = 'approved' from public.events e where e.id = m.event_id and e.moderation_mode = 'hold_for_approval' and e.develops_at is not null and m.status = 'pending';",
    );
    const leave = sql.indexOf(
      "update public.events set moderation_mode = 'live' where moderation_mode = 'hold_for_approval' and develops_at is not null;",
    );
    const check = sql.indexOf("add constraint events_approval_never_develops");
    const seal = sql.indexOf("create trigger media_seal_on_approval");
    expect(seal).toBeGreaterThan(-1);
    // The seal stands before the approval it seals, the approval before the album leaves approval, both before the CHECK.
    expect(approve).toBeGreaterThan(seal);
    expect(leave).toBeGreaterThan(approve);
    expect(check).toBeGreaterThan(leave);
  });
});

describe("2. an approval under a develop time ahead seals the row with it", () => {
  it("★ a held row moving to approved, unsealed, takes its event's develop time while it is ahead, and only then", () => {
    const body = code("media_seal_on_approval");
    expect(body).toContain(
      "select e.develops_at into v_at from public.events e where e.id = new.event_id; if v_at > now() then new.sealed_until := v_at; end if; return new;",
    );
    expect(body).toContain(" security definer set search_path = ''");
    expect(fileSql()).toContain(
      "create trigger media_seal_on_approval before update of status on public.media for each row when (old.status = 'pending' and new.status = 'approved' and new.sealed_until is null) execute function public.media_seal_on_approval();",
    );
  });

  it("no guest has seen a held row, so sealing one hides nothing anyone saw (the foundation's invariant)", () => {
    // The only seal this file writes is the trigger's, on a row leaving `pending`: never an update of sealed_until.
    expect(fileSql()).not.toMatch(/set sealed_until/);
    expect(fileSql()).toContain("when (old.status = 'pending'");
  });
});

describe("3. leaving approval releases what is held, in the same save", () => {
  it("★ approves the held rows it can take at once, pings held, and rings once", () => {
    const body = code("events_hold_released");
    expect(body).toContain(
      "perform pg_catalog.set_config('partyreel.doorbell_hold', 'on', true); update public.media m set status = 'approved' where m.id in (select s.id from public.media s where s.event_id = new.id and s.status = 'pending' for update skip locked); get diagnostics v_n = row_count; perform pg_catalog.set_config('partyreel.doorbell_hold', '', true); if v_n > 0 then perform public.album_doorbell(new.id); end if; return null;",
    );
    expect(body).toContain(" security definer set search_path = ''");
    expect(fileSql()).toContain(
      "create trigger events_hold_released after update of moderation_mode on public.events for each row when (old.moderation_mode = 'hold_for_approval' and new.moderation_mode is distinct from 'hold_for_approval') execute function public.events_hold_released();",
    );
  });

  it("★ it never waits on a media row while the host's save holds the event row (the foundation's measured rule)", () => {
    const body = code("events_hold_released");
    expect(body).toContain("for update skip locked");
    expect(body).not.toMatch(
      /\bfrom public\.events\b[^;]*\bfor (share|update)/,
    );
  });
});

describe("4. who may run what", () => {
  it("both functions are triggers' alone: EXECUTE revoked from the client roles", () => {
    const sql = fileSql();
    expect(sql).toContain(
      "revoke all on function public.media_seal_on_approval() from public, anon, authenticated;",
    );
    expect(sql).toContain(
      "revoke all on function public.events_hold_released() from public, anon, authenticated;",
    );
    expect(sql).not.toMatch(
      /grant execute on function public\.(media_seal_on_approval|events_hold_released)/,
    );
  });

  it("an expand: it creates, and replaces no body the deployed build or another lane reads", () => {
    expect(fileSql()).not.toMatch(/create or replace function/);
    expect(fileSql()).not.toMatch(/drop (function|trigger|table)/);
  });
});
