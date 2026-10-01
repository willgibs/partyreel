/**
 * THE OWNER MODE'S SHOW MORE, AS A PUBLIC ENDPOINT (crumbs-38). A Server Function answers any POST, so what is pinned
 * is what a hand-made call can get: a cursor and nothing else is read from it, a malformed one is refused before any
 * read, signed out reads nothing, and a failed page answers in words with the failure captured. The gate itself is
 * the query's (`auth.uid()`), which no argument here can point anywhere else: the functions take no identity at all.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

let user: { id: string } | null = { id: "her" };
vi.mock("@/lib/supabase/request-auth", () => ({
  getRequestAuth: async () => ({ user, supabase: {} }),
}));
const asked: { feed: string; before: unknown; uid: string | null }[] = [];
let failWith: Error | null = null;
vi.mock("@/lib/db/queries/my-uploads", () => ({
  readMyUploadsPage: async (
    auth: { user: { id: string } | null },
    before: unknown,
  ) => {
    asked.push({ feed: "uploads", before, uid: auth.user?.id ?? null });
    if (failWith) throw failWith;
    return { items: [{ id: "m1" }], next: null };
  },
}));
vi.mock("@/lib/db/queries/my-likes", () => ({
  readMyLikesPage: async (
    auth: { user: { id: string } | null },
    before: unknown,
  ) => {
    asked.push({ feed: "likes", before, uid: auth.user?.id ?? null });
    if (failWith) throw failWith;
    return {
      items: [{ id: "l1" }],
      next: { at: "2026-09-20T08:00:00.000001+00:00", id: ID },
    };
  },
}));
const captured: unknown[][] = [];
vi.mock("@/lib/observability/sentry", () => ({
  captureError: (...args: unknown[]) => captured.push(args),
}));

const ID = "00000000-0000-4000-8000-000000000042";
const AT = "2026-09-23T23:31:24.644108+00:00";

const { readMyLikesPageAction, readMyUploadsPageAction } =
  await import("./feed-actions");

beforeEach(() => {
  user = { id: "her" };
  asked.length = 0;
  captured.length = 0;
  failWith = null;
});

describe("the Show more's two Server Functions", () => {
  it("reads the caller's next page after the cursor, the time handed on exactly", async () => {
    expect(
      await readMyUploadsPageAction({ before: { at: AT, id: ID } }),
    ).toEqual({ ok: true, items: [{ id: "m1" }], next: null });
    expect(await readMyLikesPageAction({ before: { at: AT, id: ID } })).toEqual(
      {
        ok: true,
        items: [{ id: "l1" }],
        next: { at: "2026-09-20T08:00:00.000001+00:00", id: ID },
      },
    );
    expect(asked).toEqual([
      { feed: "uploads", before: { at: AT, id: ID }, uid: "her" },
      { feed: "likes", before: { at: AT, id: ID }, uid: "her" },
    ]);
  });

  it("★ refuses anything but a cursor, before any read", async () => {
    for (const ask of [
      undefined,
      {},
      { before: null },
      { before: { at: "yesterday", id: ID } },
      { before: { at: AT, id: "not-an-id" } },
      { before: { at: `${AT}; drop table media`, id: ID } },
    ]) {
      expect(await readMyUploadsPageAction(ask)).toMatchObject({ ok: false });
    }
    expect(asked).toEqual([]);
  });

  it("answers signed out with sign in, reading nothing", async () => {
    user = null;
    expect(await readMyLikesPageAction({ before: { at: AT, id: ID } })).toEqual(
      { ok: false, message: "Sign in and try again." },
    );
    expect(asked).toEqual([]);
  });

  it("a failed page answers in words, the failure captured where it is caught", async () => {
    failWith = new Error("rpc down");
    expect(
      await readMyUploadsPageAction({ before: { at: AT, id: ID } }),
    ).toEqual({ ok: false, message: "Couldn't load more. Please try again." });
    expect(captured).toHaveLength(1);
    expect(captured[0][2]).toMatchObject({ seam: "my_uploads_page" });
  });

  it("takes no identity: each export's one argument is the ask", () => {
    // The owner mode's own guard (owner-mode.test.ts) for the page; this is the same for its Show more. A
    // profile id or handle here would be the first way to point the feed at somebody else.
    const src = readFileSync(
      join(
        process.cwd(),
        "src",
        "app",
        "(guest)",
        "u",
        "[slug]",
        "feed-actions.ts",
      ),
      "utf8",
    );
    const exported = [
      ...src.matchAll(/export async function (\w+)\(([^)]*)\)/g),
    ].map(([, name, params]) => [name, params.replace(/\s+/g, " ").trim()]);
    expect(exported).toEqual([
      ["readMyUploadsPageAction", "ask: unknown,"],
      ["readMyLikesPageAction", "ask: unknown,"],
    ]);
  });
});
