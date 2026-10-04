import { createHash } from "node:crypto";

import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  asSupabase,
  createFakePostgrest,
  type FakePostgrest,
} from "@/lib/db/testing/fake-postgrest";

/**
 * HER OWN COLOUR FOR HER OWN HEADER (`ticketSeed`, small-fixes): the colour every other surface gives a guest, by the
 * one rule everywhere. A typed name's ticket is its own guest ROW's hash; a proved row is its account's hash (so the
 * once-only switch on a claim reaches her header too); a ticket that names no row, or another event's, is null.
 */

vi.mock("server-only", () => ({}));
let fake: FakePostgrest;
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => asSupabase(fake),
}));

const { ticketSeed } = await import("./ticket-seed.server");
const seed = (id: string) => createHash("sha256").update(id).digest("hex");

const EVENT = "ev-1";
const TOKEN = "a".repeat(64);

beforeEach(() => {
  fake = createFakePostgrest({
    tables: {
      guests: [
        {
          id: "g-sam",
          event_id: EVENT,
          session_token: TOKEN,
          user_id: null,
          verified_at: null,
        },
        {
          id: "g-leah",
          event_id: EVENT,
          session_token: "b".repeat(64),
          user_id: "u-leah",
          verified_at: "2026-10-01T00:00:00Z",
        },
        {
          // An unconfirmed sign-up: a real account, still a typed name.
          id: "g-maya",
          event_id: EVENT,
          session_token: "c".repeat(64),
          user_id: "u-maya",
          verified_at: null,
        },
      ],
    },
  });
});

describe("ticketSeed", () => {
  it("★ a typed name's ticket is her own row's hash, never the raw id", async () => {
    const got = await ticketSeed({ eventId: EVENT, sessionToken: TOKEN });
    expect(got).toBe(seed("g-sam"));
    expect(got).not.toContain("g-sam");
  });

  it("★ a proved row is its account's hash: the claim's once-only switch reaches her own header", async () => {
    expect(
      await ticketSeed({ eventId: EVENT, sessionToken: "b".repeat(64) }),
    ).toBe(seed("u-leah"));
  });

  it("★ a real account behind a typed name is not a proof: her row's colour, as the list gives her", async () => {
    expect(
      await ticketSeed({ eventId: EVENT, sessionToken: "c".repeat(64) }),
    ).toBe(seed("g-maya"));
  });

  it("a ticket that names no row, or one of another event, is null: the plain disc", async () => {
    expect(
      await ticketSeed({ eventId: EVENT, sessionToken: "d".repeat(64) }),
    ).toBeNull();
    expect(
      await ticketSeed({ eventId: "ev-2", sessionToken: TOKEN }),
    ).toBeNull();
  });

  it("a failed read throws, never answers a colour it did not read", async () => {
    delete fake.tables.guests;
    await expect(
      ticketSeed({ eventId: EVENT, sessionToken: TOKEN }),
    ).rejects.toThrow();
  });
});
