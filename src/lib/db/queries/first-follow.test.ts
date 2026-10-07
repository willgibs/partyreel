import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * WHETHER SHE FOLLOWS NO ONE YET (`account-moments` r2, `follow=once`). The Server Function asks this before it
 * writes, so a first follow says the private line once and every follow after is the button alone. Pinned: the read
 * is her own edge (`follower_id = her`) and one row deep, an empty list is the first, a list with anyone on it is not,
 * a signed-out caller is nobody's first (the follow itself refuses her), and a failed read is thrown for the caller to
 * decide, never read as an empty list (a failure must not hand out the line).
 */

vi.mock("server-only", () => ({}));

type Answer = { data: { followee_id: string }[] | null; error: unknown };
let user: { id: string } | null = { id: "her" };
let answer: Answer = { data: [], error: null };
/** What each read asked of the table, in order. */
const asked: { table: string; eq: [string, string][]; limit: number }[] = [];

vi.mock("@/lib/supabase/request-auth", () => ({
  getRequestAuth: async () => ({
    user,
    supabase: {
      from: (table: string) => {
        const call = { table, eq: [] as [string, string][], limit: -1 };
        asked.push(call);
        const chain = {
          select: () => chain,
          eq: (column: string, value: string) => {
            call.eq.push([column, value]);
            return chain;
          },
          limit: (n: number) => {
            call.limit = n;
            return Promise.resolve(answer);
          },
        };
        return chain;
      },
    },
  }),
}));

const { followsNoOne } = await import("./first-follow");

beforeEach(() => {
  user = { id: "her" };
  answer = { data: [], error: null };
  asked.length = 0;
});

describe("followsNoOne", () => {
  it("★ reads her own follows and nothing else, one row deep", async () => {
    await followsNoOne();
    expect(asked).toEqual([
      { table: "user_follows", eq: [["follower_id", "her"]], limit: 1 },
    ]);
  });

  it("is true for an empty list and false the moment anyone is on it", async () => {
    expect(await followsNoOne()).toBe(true);
    answer = { data: [{ followee_id: "maya" }], error: null };
    expect(await followsNoOne()).toBe(false);
  });

  it("reads a null answer as an empty list, as the client hands one for none", async () => {
    answer = { data: null, error: null };
    expect(await followsNoOne()).toBe(true);
  });

  it("is false for a caller who is signed out, and reads nothing", async () => {
    user = null;
    expect(await followsNoOne()).toBe(false);
    expect(asked).toEqual([]);
  });

  it("★ throws on a failed read, never reading a failure as an empty list", async () => {
    answer = { data: null, error: new Error("boom") };
    await expect(followsNoOne()).rejects.toThrow("boom");
  });
});
