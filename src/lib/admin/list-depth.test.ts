import { describe, expect, it } from "vitest";

import {
  hrefWith,
  LIST_PAGE,
  parseShow,
  readNewest,
  showParam,
} from "@/lib/admin/list-depth";
import {
  asSupabase,
  createFakePostgrest,
} from "@/lib/db/testing/fake-postgrest";

/**
 * THE OPERATOR'S LIST DEPTH (the 1,000-row round, 2026-09-23). An inbox reads its newest `?show=`
 * rows and knows whether there are more. What is pinned: the depth a URL can ask for (never below one
 * page, never a fraction or garbage), the links that carry it (a default leaves the URL clean), and
 * that `more` is exact at every depth, past 1,000 included, on the fake that clamps like PostgREST.
 */

describe("parseShow", () => {
  it("reads a deeper page, and anything else as the first page", () => {
    expect(parseShow("150")).toBe(150);
    expect(parseShow(["2000", "5"])).toBe(2000);
    for (const raw of [undefined, "", "abc", "-5", "0", "12.5", "20", String(LIST_PAGE)]) {
      expect(parseShow(raw), String(raw)).toBe(LIST_PAGE);
    }
  });
});

describe("the links", () => {
  it("drop empty values, so the first page's URL stays clean", () => {
    expect(hrefWith("/admin/support", { status: undefined, show: showParam(LIST_PAGE) })).toBe(
      "/admin/support",
    );
    expect(hrefWith("/admin/support", { status: "new", show: showParam(100), id: "" })).toBe(
      "/admin/support?status=new&show=100",
    );
  });
});

describe("readNewest", () => {
  const rows = Array.from({ length: 2500 }, (_, i) => ({
    id: `r${String(i).padStart(5, "0")}`,
  }));
  const read = (show: number, n = rows.length) => {
    const fake = createFakePostgrest({ tables: { contact_submissions: rows.slice(0, n) } });
    const db = asSupabase(fake);
    return readNewest(
      "test: newest",
      show,
      (after: string | null, limit) => {
        let q = db
          .from("contact_submissions")
          .select("id")
          .order("id", { ascending: false })
          .limit(limit);
        if (after) q = q.lt("id", after);
        return q;
      },
      (row) => row.id,
    );
  };

  it("★ is exact at any depth, past 1,000 included", async () => {
    const deep = await read(1800);
    expect(deep.rows).toHaveLength(1800);
    expect(deep.more).toBe(true);
    expect(new Set(deep.rows.map((r) => r.id)).size).toBe(1800);
    expect(deep.rows[0].id).toBe("r02499");
  });

  it("offers nothing more when the list holds exactly its depth, or less", async () => {
    await expect(read(50, 50)).resolves.toMatchObject({ more: false });
    const short = await read(50, 12);
    expect(short).toMatchObject({ more: false });
    expect(short.rows).toHaveLength(12);
  });
});
