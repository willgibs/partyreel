/**
 * THE STORAGE METER AND THE STORAGE GUARD READ ONE AGGREGATE (`public.host_storage_summary`, 20260923140000, its
 * Deleted figure narrowed by 20260923160000).
 *
 * The meter's two numbers, and the storage guard's one (a plan change is refused off `activeBytes`, so an
 * undercount SELLS a plan the host does not fit), come from one SQL SUM each, whatever the album's size. What is
 * pinned: the read goes to the function with the id `getUser()` proved and nothing else, answers in one request, reads
 * nothing for a signed-out caller, and throws rather than reporting an empty account; the admin's account view reads
 * the same function and counts its items without reading rows; the function's ACTIVE filter is `host_active_bytes`'
 * (the one definition every upload function enforces), read off both migrations, so the meter can never show a host
 * a number the cap does not enforce; and its DELETED filter is only what the host can restore, so a guest's own
 * withdrawal (Will, 2026-09-23: "I want it gone everywhere, not still visible to the host as well") counts in
 * neither number.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/env", () => ({ serverEnv: { STRIPE_SECRET_KEY: "sk_test_x" } }));

let signedIn = true;
let rpcCalls: [string, unknown][] = [];
let rpcAnswer: { data: unknown; error: unknown } = {
  data: [{ active_bytes: 0, standby_bytes: 0 }],
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
  rpcAnswer = { data: [{ active_bytes: 0, standby_bytes: 0 }], error: null };
  mediaCountRead = null;
});

describe("the storage summary is one aggregate", () => {
  it("★ asks host_storage_summary for the SIGNED-IN host's own id, once", async () => {
    rpcAnswer = {
      data: [{ active_bytes: 47_093_782, standby_bytes: 2_491_989 }],
      error: null,
    };
    await expect(getHostStorageSummary()).resolves.toEqual({
      activeBytes: 47_093_782,
      standbyBytes: 2_491_989,
    });
    expect(rpcCalls).toEqual([
      ["host_storage_summary", { p_host_id: "host-1" }],
    ]);
  });

  it("answers a 35,000-item account in the same one request as a small one", async () => {
    rpcAnswer = {
      data: [{ active_bytes: 140_000_000_000, standby_bytes: 0 }],
      error: null,
    };
    await expect(getHostStorageSummary()).resolves.toEqual({
      activeBytes: 140_000_000_000,
      standbyBytes: 0,
    });
    expect(rpcCalls).toHaveLength(1);
  });

  it("reads nothing for a signed-out caller", async () => {
    signedIn = false;
    await expect(getHostStorageSummary()).resolves.toEqual({
      activeBytes: 0,
      standbyBytes: 0,
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
      standbyBytes: 0,
    });
    rpcAnswer = {
      data: [{ active_bytes: "123", standby_bytes: "4" }],
      error: null,
    };
    await expect(readHostStorageSummary("host-1")).resolves.toEqual({
      activeBytes: 123,
      standbyBytes: 4,
    });
  });
});

describe("the admin's account view reads the same aggregate", () => {
  it("★ active bytes from host_storage_summary and the item count as a HEAD count, neither capped at 1,000 rows", async () => {
    rpcAnswer = {
      data: [{ active_bytes: 5_000_000_000, standby_bytes: 7 }],
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
   THE AGGREGATE'S ACTIVE BYTES ARE host_active_bytes', AND ITS DELETED BYTES ARE WHAT THE HOST CAN RESTORE, READ OFF
   THE MIGRATIONS. Text-parsed (Vitest has no Postgres) from the NEWEST migration defining each function, so a
   redefinition of any is read the day it lands, and fail-closed: a body this parser cannot read fails rather than
   passes.
   ──────────────────────────────────────────────────────────────────────────── */
describe("host_storage_summary's filters, read off the migrations", () => {
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
    return new Set(text.split(/\s+and\s+/).map((part) => part.trim()));
  }

  /**
   * The TOP-LEVEL `and` conjuncts of a filter, parentheses respected:
   * `not (a and b) and not (c and d)` → [`not (a and b)`, `not (c and d)`].
   */
  function topLevelConjuncts(text: string): string[] {
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
    return parts;
  }

  /** The aggregate's two SUM filters, active first and standby second. */
  function summaryFilters(): string[] {
    return [
      ...summary.body.matchAll(
        /sum\(m\.file_size_bytes\) filter \( where (.+?) \)/g,
      ),
    ].map(([, text]) => text);
  }

  /** "The guest removed it themselves", as get_upload_gate reads it (20260923120000) and restore_media refuses it. */
  const WITHDRAWN = "m.status = 'removed' and m.removed_by_uploader";

  const active = newestBody("host_active_bytes");
  const summary = newestBody("host_storage_summary");

  it("found both definitions (a canary for the parser)", () => {
    expect(active.body).toContain("sum(m.file_size_bytes)");
    expect(summary.body).toContain("sum(m.file_size_bytes) filter");
  });

  it("both read the same rows: one host's media joined to its events", () => {
    const from =
      "from public.media m join public.events e on e.id = m.event_id";
    expect(active.body).toContain(from);
    expect(summary.body).toContain(from);
    expect(active.body).toMatch(/where e\.host_id = p_host_id\b/);
    expect(summary.body).toMatch(/where e\.host_id = p_host_id$/);
  });

  it("★ the aggregate's active filter is exactly host_active_bytes' own", () => {
    const where = active.body.match(/where (.+)$/)?.[1];
    if (!where)
      throw new Error(
        `Cannot read host_active_bytes' WHERE in ${active.file}.`,
      );
    const activeRule = conjuncts(where);
    activeRule.delete("e.host_id = p_host_id");

    const filters = summaryFilters();
    // Two SUMs: active first, standby second.
    expect(filters).toHaveLength(2);
    expect(conjuncts(filters[0])).toEqual(activeRule);
    expect(activeRule).toEqual(
      new Set(["e.deleted_at is null", "m.status <> 'removed'"]),
    );
  });

  it("★ standby is what the host can restore: the negation of the active filter, less a guest's own withdrawal", () => {
    const [activeFilter, standbyFilter] = summaryFilters();
    const standby = topLevelConjuncts(standbyFilter);
    // Exactly two conditions: not active (a host's removal, a deleted event's media) and not withdrawn.
    expect(standby).toHaveLength(2);
    const notActive = standby.find((part) => !part.includes("removed_by_uploader"));
    const negated = notActive?.match(/^not \((.+)\)$/)?.[1];
    if (!negated) {
      throw new Error(`Cannot read standby's "not active" arm in ${summary.file}.`);
    }
    expect(conjuncts(negated)).toEqual(conjuncts(activeFilter));
    // ...and a withdrawal counts in NEITHER number: it fails active (it is removed) and this arm keeps it out
    // of standby, whatever the event's state.
    expect(standby).toContain(`not (${WITHDRAWN})`);
  });

  it("leaves out exactly the row the host's restore refuses on the uploader's behalf", () => {
    // restore_media's ownership read carries the uploader's marker, so the bytes the figure drops are the
    // bytes no Restore could ever bring back: the Deleted figure and the Deleted list agree.
    const restore = newestBody("restore_media");
    expect(restore.body).toContain("and m.removed_by_uploader = false");
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
});
