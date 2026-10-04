/**
 * THE STORAGE METER AND THE STORAGE GUARD READ ONE AGGREGATE (`public.host_storage_summary`, 20260923140000, its
 * Deleted figure narrowed by 20260923160000, made exactly the host's Deleted by 20260928140000, and summed off
 * `host_deleted_media` by 20261003220000).
 *
 * Her plan's cap holds her albums and her Deleted together (trash-in-storage, Will 2026-10-03), so the meter's figures
 * and the storage guard's one (a plan change is refused off `storedBytes`, so an undercount SELLS a plan the host does
 * not fit) come from one SQL row, whatever the album's size. What is pinned: the read goes to the function with the id
 * `getUser()` proved and nothing else, answers in one request, reads nothing for a signed-out caller, and throws rather
 * than reporting an empty account; the admin's account view reads the same function and counts its items without
 * reading rows; its ACTIVE figure is `host_active_bytes` itself (the one definition every upload function reads); and
 * its DELETED figure is the sum of `host_deleted_media`, exactly what her two Deleted lists show: never a guest's own
 * withdrawal (Will, 2026-09-23: "I want it gone everywhere, not still visible to the host as well"), never an
 * operator's removal (Will, 2026-09-28: "it should be fully purged from the event, not moved to deleted"), never an
 * item asked to leave for good, and nothing past the 30-day window, where a held item would be the one byte count
 * telling her a hold exists.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { beforeEach, describe, expect, it, vi } from "vitest";

import { RECENTLY_DELETED_WINDOW_DAYS } from "@/lib/lifecycle/recently-deleted";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/env", () => ({ serverEnv: { STRIPE_SECRET_KEY: "sk_test_x" } }));

let signedIn = true;
let rpcCalls: [string, unknown][] = [];
let rpcAnswer: { data: unknown; error: unknown } = {
  data: [{ active_bytes: 0, standby_bytes: 0, system_bytes: 0 }],
  error: null,
};
let mediaCountRead: {
  select: string;
  opts: unknown;
  filters: unknown[][];
} | null = null;

/** Just enough of the admin client for the aggregate and for the account view's reads around it. */
function fakeAdmin() {
  return {
    rpc(name: string, args: unknown) {
      rpcCalls.push([name, args]);
      return Promise.resolve(rpcAnswer);
    },
    from(table: string) {
      const filters: unknown[][] = [];
      let select = "";
      let opts: unknown = undefined;
      const builder = {
        select(columns: string, options?: unknown) {
          select = columns;
          opts = options;
          if (table === "media") mediaCountRead = { select, opts, filters };
          return builder;
        },
        eq: (...args: unknown[]) => (filters.push(["eq", ...args]), builder),
        is: (...args: unknown[]) => (filters.push(["is", ...args]), builder),
        neq: (...args: unknown[]) => (filters.push(["neq", ...args]), builder),
        maybeSingle: () =>
          Promise.resolve({
            data: {
              id: "host-1",
              tier: "pro",
              storage_cap_bytes: null,
              storage_used_bytes: 99,
              stripe_subscription_id: null,
              stripe_customer_id: null,
              email: "host@example.com",
            },
            error: null,
          }),
        then(resolve: (value: unknown) => unknown) {
          // A HEAD count: no rows, just the number (2,500 items, past PostgREST's 1,000-row cap).
          const count = table === "media" ? 2500 : 3;
          return Promise.resolve({ data: null, count, error: null }).then(
            resolve,
          );
        },
      };
      return builder;
    },
  };
}

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => fakeAdmin(),
}));
vi.mock("@/lib/supabase/request-auth", () => ({
  getRequestAuth: async () => ({
    supabase: {},
    user: signedIn ? { id: "host-1" } : null,
  }),
}));

const { getHostStorageSummary, readHostStorageSummary } =
  await import("@/lib/db/queries/storage");
const { getAccountDetail } = await import("@/lib/db/queries/accounts");

beforeEach(() => {
  signedIn = true;
  rpcCalls = [];
  rpcAnswer = {
    data: [{ active_bytes: 0, standby_bytes: 0, system_bytes: 0 }],
    error: null,
  };
  mediaCountRead = null;
});

describe("the storage summary is one aggregate", () => {
  it("★ asks host_storage_summary for the SIGNED-IN host's own id, once", async () => {
    rpcAnswer = {
      data: [
        { active_bytes: 47_093_782, standby_bytes: 2_491_989, system_bytes: 0 },
      ],
      error: null,
    };
    // What her plan holds is both: her albums and her Deleted.
    await expect(getHostStorageSummary()).resolves.toEqual({
      activeBytes: 47_093_782,
      deletedBytes: 2_491_989,
      systemBytes: 0,
      storedBytes: 49_585_771,
    });
    expect(rpcCalls).toEqual([
      ["host_storage_summary", { p_host_id: "host-1" }],
    ]);
  });

  it("answers a 35,000-item account in the same one request as a small one", async () => {
    rpcAnswer = {
      data: [
        {
          active_bytes: 140_000_000_000,
          standby_bytes: 9_000_000_000,
          system_bytes: 1_000_000_000,
        },
      ],
      error: null,
    };
    await expect(getHostStorageSummary()).resolves.toEqual({
      activeBytes: 140_000_000_000,
      deletedBytes: 9_000_000_000,
      systemBytes: 1_000_000_000,
      storedBytes: 149_000_000_000,
    });
    expect(rpcCalls).toHaveLength(1);
  });

  it("reads nothing for a signed-out caller", async () => {
    signedIn = false;
    await expect(getHostStorageSummary()).resolves.toEqual({
      activeBytes: 0,
      deletedBytes: 0,
      systemBytes: 0,
      storedBytes: 0,
    });
    expect(rpcCalls).toEqual([]);
  });

  it("throws on a failed read rather than reporting an empty account", async () => {
    // The guard would read a swallowed failure as "stores nothing" and sell any size; a failed read must fail the
    // request instead.
    rpcAnswer = { data: null, error: { message: "boom" } };
    await expect(getHostStorageSummary()).rejects.toEqual({ message: "boom" });
  });

  it("reads numbers, never NaN: an absent row is zeros and a bigint sent as text is a number", async () => {
    rpcAnswer = { data: [], error: null };
    await expect(readHostStorageSummary("host-1")).resolves.toEqual({
      activeBytes: 0,
      deletedBytes: 0,
      systemBytes: 0,
      storedBytes: 0,
    });
    rpcAnswer = {
      data: [{ active_bytes: "123", standby_bytes: "4", system_bytes: "1" }],
      error: null,
    };
    await expect(readHostStorageSummary("host-1")).resolves.toEqual({
      activeBytes: 123,
      deletedBytes: 4,
      systemBytes: 1,
      storedBytes: 127,
    });
    // A build deployed before the third column reads its own two; a row without it reads none of Deleted as the
    // system's.
    rpcAnswer = { data: [{ active_bytes: 5, standby_bytes: 2 }], error: null };
    await expect(readHostStorageSummary("host-1")).resolves.toMatchObject({
      systemBytes: 0,
      storedBytes: 7,
    });
  });
});

describe("the admin's account view reads the same aggregate", () => {
  it("★ active bytes from host_storage_summary and the item count as a HEAD count, neither capped at 1,000 rows", async () => {
    rpcAnswer = {
      data: [
        { active_bytes: 5_000_000_000, standby_bytes: 7, system_bytes: 0 },
      ],
      error: null,
    };
    const account = await getAccountDetail("host-1");
    expect(rpcCalls).toEqual([
      ["host_storage_summary", { p_host_id: "host-1" }],
    ]);
    expect(account?.activeBytes).toBe(5_000_000_000);
    expect(account?.mediaCount).toBe(2500);
    // The count reads no rows, under the active filters.
    expect(mediaCountRead?.opts).toEqual({ count: "exact", head: true });
    expect(mediaCountRead?.filters).toEqual(
      expect.arrayContaining([
        ["eq", "events.host_id", "host-1"],
        ["is", "events.deleted_at", null],
        ["neq", "status", "removed"],
      ]),
    );
  });
});

/* ────────────────────────────────────────────────────────────────────────────
   THE AGGREGATE'S ACTIVE BYTES ARE host_active_bytes', AND ITS DELETED BYTES ARE host_deleted_media's, WHICH IS WHAT
   THE HOST'S TWO DELETED LISTS SHOW, READ OFF THE MIGRATIONS. Text-parsed (Vitest has no Postgres) from the NEWEST
   migration defining each function, so a redefinition of any is read the day it lands, and fail-closed: a body this
   parser cannot read fails rather than passes.
   ★ RESHAPED ON PURPOSE (trash-in-storage, 20261003220000; scar kept: active is host_active_bytes' own rule, Deleted
   is her two lists arm for arm, no row in both). The aggregate stopped spelling its two filters: it calls
   host_active_bytes for the first and sums host_deleted_media for the second, the one definition of Deleted that the
   eviction (`leave_deleted`) drains too, so the arms are read off that function's WHERE.
   ──────────────────────────────────────────────────────────────────────────── */
describe("host_storage_summary's figures, read off the migrations", () => {
  const MIGRATIONS = join(process.cwd(), "supabase", "migrations");

  function newestBody(fn: string): {
    file: string;
    body: string;
    header: string;
    sql: string;
  } {
    const definition = new RegExp(
      `create\\s+(?:or\\s+replace\\s+)?function\\s+public\\.${fn}\\s*\\(`,
      "i",
    );
    const hits = readdirSync(MIGRATIONS)
      .filter((file) => file.endsWith(".sql"))
      .sort()
      .map((file) => ({
        file,
        sql: readFileSync(join(MIGRATIONS, file), "utf8"),
      }))
      .filter(({ sql }) => definition.test(sql));
    const newest = hits.at(-1);
    if (!newest) throw new Error(`No migration defines public.${fn}.`);
    const start = newest.sql.search(definition);
    const open = newest.sql.indexOf("$$", start);
    const close = newest.sql.indexOf("$$", open + 2);
    if (open < 0 || close < 0) {
      throw new Error(`Cannot read public.${fn}'s body in ${newest.file}.`);
    }
    const header = newest.sql.slice(start, open);
    // One line of normalized SQL: comments out, whitespace collapsed, lowercased.
    const body = newest.sql
      .slice(open + 2, close)
      .split("\n")
      .map((line) => line.replace(/--.*$/, ""))
      .join(" ")
      .replace(/\s+/g, " ")
      .trim()
      .replace(/;$/, "")
      .trim()
      .toLowerCase();
    return {
      file: newest.file,
      body,
      header: header.toLowerCase(),
      sql: newest.sql.toLowerCase(),
    };
  }

  /** `a and b and c` → {a, b, c}, each trimmed (for a flat conjunction). */
  function conjuncts(text: string): Set<string> {
    const parts: string[] = [];
    let depth = 0;
    let start = 0;
    for (let i = 0; i < text.length; i++) {
      if (text[i] === "(") depth++;
      else if (text[i] === ")") depth--;
      else if (depth === 0 && text.startsWith(" and ", i)) {
        parts.push(text.slice(start, i).trim());
        start = i + " and ".length;
        i = start - 1;
      }
    }
    parts.push(text.slice(start).trim());
    return new Set(parts);
  }

  /** `(a) or (b)` → [a, b]: the TOP-LEVEL `or` arms, parentheses respected, each arm's own parentheses dropped. */
  function topLevelArms(text: string): string[] {
    const arms: string[] = [];
    let depth = 0;
    let start = 0;
    for (let i = 0; i < text.length; i++) {
      if (text[i] === "(") depth++;
      else if (text[i] === ")") depth--;
      else if (depth === 0 && text.startsWith(" or ", i)) {
        arms.push(text.slice(start, i).trim());
        start = i + " or ".length;
        i = start - 1;
      }
    }
    arms.push(text.slice(start).trim());
    return arms.map((arm) => arm.replace(/^\((.+)\)$/, "$1"));
  }

  /** "The guest removed it themselves", as get_upload_gate reads it (20260923120000) and restore_media refuses it. */
  const WITHDRAWN = "m.status = 'removed' and m.removed_by_uploader";

  const active = newestBody("host_active_bytes");
  const deleted = newestBody("host_deleted_media");
  const summary = newestBody("host_storage_summary");

  /** The window both Deleted lists read (RECENTLY_DELETED_WINDOW_DAYS), as the SQL spells it: from its start on. */
  const inWindow = (column: string) =>
    `${column} >= now() - interval '${RECENTLY_DELETED_WINDOW_DAYS} days'`;

  it("found all three definitions (a canary for the parser)", () => {
    expect(active.body).toContain("sum(m.file_size_bytes)");
    expect(summary.body).toContain(
      "from public.host_deleted_media(p_host_id) d",
    );
    expect(deleted.body).toMatch(/^select m\.id, m\.file_size_bytes, /);
  });

  it("both read the same rows: one host's media joined to its events", () => {
    const from =
      "from public.media m join public.events e on e.id = m.event_id";
    expect(active.body).toContain(from);
    expect(deleted.body).toContain(from);
    expect(active.body).toMatch(/where e\.host_id = p_host_id\b/);
    expect(deleted.body).toMatch(/where e\.host_id = p_host_id and \(/);
  });

  it("★ the aggregate's active figure is host_active_bytes itself, and its Deleted the sum of host_deleted_media", () => {
    expect(summary.body).toMatch(
      /^select public\.host_active_bytes\(p_host_id\), coalesce\(sum\(d\.file_size_bytes\), 0\)::bigint, coalesce\(sum\(d\.file_size_bytes\) filter \(where d\.by_system\), 0\)::bigint from public\.host_deleted_media\(p_host_id\) d$/,
    );
    const where = active.body.match(/where (.+)$/)?.[1];
    if (!where) {
      throw new Error(
        `Cannot read host_active_bytes' WHERE in ${active.file}.`,
      );
    }
    const activeRule = conjuncts(where);
    activeRule.delete("e.host_id = p_host_id");
    expect(activeRule).toEqual(
      new Set(["e.deleted_at is null", "m.status <> 'removed'"]),
    );
  });

  it("★ Deleted is exactly her two Deleted lists: a removal that is neither a withdrawal, nor an operator's, nor one she asked to delete, and a deleted event's live media, each inside the window", () => {
    const where = deleted.body.match(
      /where e\.host_id = p_host_id and \((.+)\)$/,
    )?.[1];
    if (!where) {
      throw new Error(
        `Cannot read host_deleted_media's WHERE in ${deleted.file}.`,
      );
    }
    const arms = topLevelArms(where).map((arm) => conjuncts(arm));
    expect(arms).toHaveLength(2);
    // The media bin (listRecentlyDeletedMedia, RLS supplying the operator's and the asked arms there), inside an event
    // that is itself inside its own window (an item never outlives its event: past it, the night's purge takes both).
    expect(arms[0]).toEqual(
      new Set([
        "m.status = 'removed'",
        "not m.removed_by_uploader",
        "not m.removed_by_admin",
        "m.purge_asked_at is null",
        inWindow("m.removed_at"),
        `(e.deleted_at is null or ${inWindow("e.deleted_at")})`,
      ]),
    );
    // The events bin (listRecentlyDeletedEvents): a deleted event's media that is not itself removed.
    expect(arms[1]).toEqual(
      new Set(["m.status <> 'removed'", inWindow("e.deleted_at")]),
    );
    // No row is in both figures: every Deleted arm is removed or in a deleted event, the two things active refuses.
    for (const arm of arms) {
      expect(
        arm.has("m.status = 'removed'") || arm.has(inWindow("e.deleted_at")),
      ).toBe(true);
    }
  });

  it("★ a removed row's own flag alone makes it the system's: a live row's stale flag never does", () => {
    // The Advisor's Q23: a restored system removal could keep its flag on a live row; Deleted reads the flag only on a
    // removed row, and the restores clear it (20261003220000).
    expect(deleted.body).toMatch(
      /^select m\.id, m\.file_size_bytes, least\(m\.removed_at, e\.deleted_at\), m\.status = 'removed' and m\.removed_by_system from /,
    );
    for (const fn of ["restore_media", "let_back_in"]) {
      expect(newestBody(fn).body, fn).toMatch(
        /update public\.media set status = v_target, removed_at = null, removed_by_system = false/,
      );
    }
  });

  /** media_host_all's USING as the live DB holds it: the last CREATE or ALTER of it across the set, comments out. */
  function hostMediaUsing(): string {
    let using: string | null = null;
    for (const file of readdirSync(MIGRATIONS)
      .filter((f) => f.endsWith(".sql"))
      .sort()) {
      const sql = readFileSync(join(MIGRATIONS, file), "utf8")
        .split("\n")
        .map((line) => line.replace(/--.*$/, ""))
        .join(" ")
        .replace(/\s+/g, " ")
        .toLowerCase();
      for (const m of sql.matchAll(
        /(?:create|alter) policy media_host_all on public\.media\b[^;]*?\busing \(/g,
      )) {
        const open = m.index! + m[0].length - 1;
        let depth = 0;
        for (let i = open; i < sql.length; i++) {
          if (sql[i] === "(") depth++;
          else if (sql[i] === ")" && --depth === 0) {
            using = sql.slice(open + 1, i).trim();
            break;
          }
        }
      }
    }
    if (!using)
      throw new Error("media_host_all has no USING in any migration.");
    return using;
  }

  // The Advisor's Q23: the lists read media through the host's own policy, which drops an operator's removal and an
  // asked row for them; host_deleted_media is a read inside definer bodies that restates both. A policy that stops
  // hiding either, or hides something new, fails here until the function (and the figure) agree with the lists again.
  it("★ host_deleted_media is her two lists only while media_host_all hides an operator's removal and an asked row", () => {
    const using = conjuncts(hostMediaUsing());
    expect(using.size).toBe(3);
    expect(using).toContain(
      "not (media.status = 'removed' and media.removed_by_admin)",
    );
    expect(using).toContain("media.purge_asked_at is null");
    expect([...using].some((c) => c.startsWith("exists ("))).toBe(true);
    // ...and the function restates both on its removed arm (a live row is never an operator's removal nor asked).
    expect(deleted.body).toContain(
      "m.status = 'removed' and not m.removed_by_uploader and not m.removed_by_admin and m.purge_asked_at is null",
    );
  });

  it("leaves out exactly the rows the host's restore refuses: a guest's withdrawal and an operator's removal", () => {
    // restore_media's ownership read carries the uploader's marker and it refuses an operator's removal, so the
    // bytes the figure drops are the bytes no Restore could ever bring back: the Deleted figure and the Deleted
    // list agree.
    const restore = newestBody("restore_media");
    expect(restore.body).toContain("and m.removed_by_uploader = false");
    expect(restore.body).toContain("if v_media.removed_by_admin then");
    // The same words get_upload_gate uses for "the guest removed it themselves".
    expect(newestBody("get_upload_gate").body).toContain(`not (${WITHDRAWN})`);
  });

  it("both stay service-role only: SECURITY DEFINER, an empty search_path, EXECUTE revoked from every client role", () => {
    for (const [fn, parsed] of [
      ["host_active_bytes", active],
      ["host_storage_summary", summary],
    ] as const) {
      // The definition's own header, not a neighbour's in the same file.
      expect(parsed.header, fn).toMatch(/security definer/);
      expect(parsed.header, fn).toMatch(/set search_path = ''/);
      expect(parsed.sql, fn).toMatch(
        new RegExp(
          `revoke all on function public\\.${fn}\\(uuid\\) from public, anon, authenticated`,
        ),
      );
    }
  });

  it("host_deleted_media is the owner's alone: SECURITY INVOKER, an empty search_path, EXECUTE revoked from every role PostgREST serves", () => {
    expect(deleted.header).toMatch(/security invoker/);
    expect(deleted.header).toMatch(/set search_path = ''/);
    expect(deleted.sql).toContain(
      "revoke all on function public.host_deleted_media(uuid) from public, anon, authenticated, service_role;",
    );
    expect(deleted.sql).not.toMatch(
      /grant execute on function public\.host_deleted_media/,
    );
  });
});
