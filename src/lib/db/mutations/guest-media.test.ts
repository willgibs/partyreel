/**
 * A GUEST'S OWN PHOTOGRAPHS, READ WHOLE (M8, the 1,000-row round, 2026-09-23).
 *
 * The ids a guest may remove are the media on their own guest rows. That list decides whether a
 * Remove control appears on each tile, and it was one PostgREST read, so a guest with more than
 * 1,000 uploads to one event (a photographer on the guest link) lost Remove on everything past the
 * newest thousand, silently. It now pages; a read failure still answers an empty list (the guest
 * page must never fail, or fail open, on it) but is captured, never swallowed.
 *
 * On the clamping fake (`src/lib/db/testing/fake-postgrest.ts`): an unpaged read comes back cut at
 * 1,000 here as it did live.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  asSupabase,
  createFakePostgrest,
  type FakePostgrest,
  type FakeRow,
} from "@/lib/db/testing/fake-postgrest";

let fake: FakePostgrest;
const captured: unknown[][] = [];

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => asSupabase(fake),
}));
vi.mock("@/lib/observability/sentry", () => ({
  captureError: (...args: unknown[]) => captured.push(args),
  captureWarning: () => {},
}));

const { listAccountMediaIds, listSessionMediaIds } =
  await import("./guest-media");

const TOKEN = "session-token-0123456789";
const uuid = (i: number) =>
  `00000000-0000-4000-8000-${String(i).padStart(12, "0")}`;

/** `n` uploads on guest row `guestId`, every tenth one already removed. */
function uploads(guestId: string, n: number, from: number): FakeRow[] {
  return Array.from({ length: n }, (_, i) => ({
    id: uuid(from + i),
    event_id: "ev-1",
    guest_id: guestId,
    status: i % 10 === 9 ? "removed" : "approved",
  }));
}

beforeEach(() => {
  captured.length = 0;
  fake = createFakePostgrest({
    tables: {
      guests: [
        // An anonymous session's row, and the two rows one account holds (one claimed at sign-in).
        {
          id: "g-session",
          event_id: "ev-1",
          session_token: TOKEN,
          user_id: null,
        },
        {
          id: "g-account-a",
          event_id: "ev-1",
          session_token: "a".repeat(20),
          user_id: "u-1",
        },
        {
          id: "g-account-b",
          event_id: "ev-1",
          session_token: "b".repeat(20),
          user_id: "u-1",
        },
        {
          id: "g-other",
          event_id: "ev-1",
          session_token: "c".repeat(20),
          user_id: "u-2",
        },
      ],
      media: [
        ...uploads("g-session", 2400, 0),
        ...uploads("g-account-a", 1300, 10_000),
        ...uploads("g-account-b", 1200, 20_000),
        ...uploads("g-other", 50, 30_000),
      ],
    },
  });
});

const live = (guestIds: string[]) =>
  fake.tables.media
    .filter(
      (m) => guestIds.includes(String(m.guest_id)) && m.status !== "removed",
    )
    .map((m) => m.id)
    .sort();

describe("a guest's removable photographs", () => {
  it("lists every one of an anonymous session's 2,160 live uploads", async () => {
    const ids = await listSessionMediaIds({
      eventId: "ev-1",
      sessionToken: TOKEN,
    });
    expect(ids).toHaveLength(2160);
    expect([...ids].sort()).toEqual(live(["g-session"]));
    expect(fake.requests.every((r) => !r.failed)).toBe(true);
  });

  it("lists every live upload across an account's guest rows, and nobody else's", async () => {
    const ids = await listAccountMediaIds({ eventId: "ev-1", userId: "u-1" });
    expect(ids).toHaveLength(2250);
    expect([...ids].sort()).toEqual(live(["g-account-a", "g-account-b"]));
  });

  it("answers an unknown or short token with nothing, reading nothing for the short one", async () => {
    expect(
      await listSessionMediaIds({ eventId: "ev-1", sessionToken: "short" }),
    ).toEqual([]);
    expect(fake.requests).toHaveLength(0);
    expect(
      await listSessionMediaIds({
        eventId: "ev-1",
        sessionToken: "x".repeat(24),
      }),
    ).toEqual([]);
    expect(captured).toHaveLength(0);
  });

  it("fails CLOSED and LOUDLY: an empty list, and the failure captured", async () => {
    delete fake.tables.media;
    expect(
      await listSessionMediaIds({ eventId: "ev-1", sessionToken: TOKEN }),
    ).toEqual([]);
    expect(captured).toHaveLength(1);
    expect(captured[0][0]).toBe("media");
    expect(captured[0][2]).toMatchObject({
      seam: "guest_media_ids_fail_closed",
      eventId: "ev-1",
    });
  });
});
