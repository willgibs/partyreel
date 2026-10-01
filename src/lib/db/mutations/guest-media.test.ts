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
/** A database before migration 20261001203810: a read naming either told column answers PostgREST's 42703. */
let schemaMissing = false;
/** A told mark whose write fails. */
let markFails = false;

/** A builder that takes any chain and answers one error, as postgrest-js resolves a refused request. */
function refused(code: string, message: string): unknown {
  const answer = {
    data: null,
    error: { code, message, details: "", hint: "" },
  };
  const chain: unknown = new Proxy(
    {},
    {
      get(_t, prop) {
        if (prop === "then") {
          return (resolve: (v: unknown) => unknown) => resolve(answer);
        }
        return () => chain;
      },
    },
  );
  return chain;
}

/** The fake, through the two failures the told mark's seam answers (the column missing, the write failing). */
function adminClient(): unknown {
  const client = asSupabase(fake) as unknown as {
    from: (table: string) => Record<string, (...a: unknown[]) => unknown>;
  };
  return new Proxy(client, {
    get(target, prop) {
      if (prop !== "from") {
        const value = (target as Record<string | symbol, unknown>)[prop];
        return typeof value === "function" ? value.bind(target) : value;
      }
      return (table: string) => {
        const query = target.from(table);
        return new Proxy(query, {
          get(q, method) {
            if (method === "select" && schemaMissing) {
              return (columns?: string, ...rest: unknown[]) =>
                typeof columns === "string" && columns.includes("let_in")
                  ? refused("42703", `column ${table}.let_in does not exist`)
                  : q.select(columns, ...rest);
            }
            if (method === "update" && markFails && table === "guests") {
              return () => refused("57014", "canceling statement");
            }
            const value = q[method as string];
            return typeof value === "function" ? value.bind(q) : value;
          },
        });
      };
    },
  });
}

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => adminClient(),
}));
vi.mock("@/lib/observability/sentry", () => ({
  captureError: (...args: unknown[]) => captured.push(args),
  captureWarning: () => {},
}));
// The owner's read goes through HER OWN client (RLS-scoped in production; the fake stands in for it).
let authUser: { id: string } | null = { id: "host-1" };
vi.mock("@/lib/supabase/request-auth", () => ({
  getRequestAuth: async () => ({ supabase: asSupabase(fake), user: authUser }),
}));

const {
  countKeptTicketUploads,
  listAccountMediaIds,
  listOwnerMediaIds,
  listOwnUploadStatuses,
  listSessionMediaIds,
  readOwnUploads,
} = await import("./guest-media");

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
  schemaMissing = false;
  markFails = false;
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

/**
 * THE ALBUM'S OWNER, ON HER OWN GUEST PAGE (crumbs-32): her uploads there ride the host's pair, so they have no guest
 * row, and the guest reads above never list them. Hers is the rows with no guest in this event, read through her own
 * client (RLS scopes it to her events in production), whole, failing closed and loudly.
 */
describe("the owner's own photographs on her guest page", () => {
  /** `n` uploads of the host's own (no guest row) in `eventId`, every tenth already removed. */
  function hostUploads(eventId: string, n: number, from: number): FakeRow[] {
    return Array.from({ length: n }, (_, i) => ({
      id: uuid(from + i),
      event_id: eventId,
      guest_id: null,
      status: i % 10 === 9 ? "removed" : i % 7 === 0 ? "hidden" : "approved",
    }));
  }

  beforeEach(() => {
    authUser = { id: "host-1" };
    fake.tables.media.push(
      ...hostUploads("ev-1", 1100, 40_000),
      ...hostUploads("ev-2", 30, 50_000),
    );
  });

  const hostLive = (eventId: string) =>
    fake.tables.media
      .filter(
        (m) =>
          m.event_id === eventId &&
          m.guest_id === null &&
          m.status !== "removed",
      )
      .map((m) => m.id)
      .sort();

  it("★ lists every live upload of hers in this event, past the 1,000-row cut, and no guest's", async () => {
    const ids = await listOwnerMediaIds("ev-1");
    expect(ids).toHaveLength(990);
    expect([...ids].sort()).toEqual(hostLive("ev-1"));
    // A guest row's upload, even an account's, is never on it: the RPC's guest arm refuses the host.
    expect(ids).not.toContain(uuid(10_000));
    expect(fake.requests.every((r) => !r.failed)).toBe(true);
  });

  it("answers nothing, reading nothing, with nobody signed in", async () => {
    authUser = null;
    expect(await listOwnerMediaIds("ev-1")).toEqual([]);
    expect(fake.requests).toHaveLength(0);
  });

  it("fails CLOSED and LOUDLY: an empty list, and the failure captured", async () => {
    delete fake.tables.media;
    expect(await listOwnerMediaIds("ev-1")).toEqual([]);
    expect(captured).toHaveLength(1);
    expect(captured[0][0]).toBe("media");
    expect(captured[0][2]).toMatchObject({
      seam: "owner_media_ids_fail_closed",
      eventId: "ev-1",
    });
  });
});

/**
 * HER TRACKER'S READ (`guest-capture` r1, `tracker=button`): where each of her uploads stands, the
 * one place a refusal can be learned (the album's sync moves only in and out of `approved`). The
 * same rows the "mine" reads speak for, a withdrawal of her own never listed, newest first, read
 * whole, and failing closed and loudly like every read here.
 */
describe("her own uploads, with where each stands", () => {
  const at = (i: number) =>
    new Date(Date.UTC(2026, 8, 27, 0, 0, i)).toISOString();

  function mine(
    guestId: string,
    rows: [string, string, boolean][],
    from: number,
  ): FakeRow[] {
    return rows.map(([id, status, byUploader], i) => ({
      id,
      event_id: "ev-1",
      guest_id: guestId,
      status,
      removed_by_uploader: byUploader,
      created_at: at(from + i),
    }));
  }

  beforeEach(() => {
    fake = createFakePostgrest({
      tables: {
        guests: [
          {
            id: "g-session",
            event_id: "ev-1",
            session_token: TOKEN,
            user_id: null,
          },
          {
            id: "g-account",
            event_id: "ev-1",
            session_token: "a".repeat(20),
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
          ...mine(
            "g-session",
            [
              ["m-pending", "pending", false],
              ["m-approved", "approved", false],
              ["m-hidden", "hidden", false],
              ["m-host-removed", "removed", false],
              ["m-withdrawn", "removed", true],
            ],
            0,
          ),
          ...mine("g-account", [["m-account", "approved", false]], 10),
          ...mine("g-other", [["m-theirs", "pending", false]], 20),
        ],
      },
    });
  });

  it("says where each of the token's uploads stands, a refusal told as one, a withdrawal not listed", async () => {
    const items = await listOwnUploadStatuses({
      eventId: "ev-1",
      sessionToken: TOKEN,
    });
    expect(items).toEqual([
      { id: "m-host-removed", status: "refused" },
      { id: "m-hidden", status: "refused" },
      { id: "m-approved", status: "approved" },
      { id: "m-pending", status: "pending" },
    ]);
  });

  it("adds the account's own rows when she is signed in, newest first, and never anybody else's", async () => {
    const items = await listOwnUploadStatuses({
      eventId: "ev-1",
      sessionToken: TOKEN,
      userId: "u-1",
    });
    expect(items[0]).toEqual({ id: "m-account", status: "approved" });
    expect(items.map((i) => i.id)).not.toContain("m-theirs");
    expect(items.map((i) => i.id)).not.toContain("m-withdrawn");
  });

  it("an unknown or short token and no account answers nothing, reading nothing for the short one", async () => {
    expect(
      await listOwnUploadStatuses({ eventId: "ev-1", sessionToken: "short" }),
    ).toEqual([]);
    expect(fake.requests).toHaveLength(0);
    expect(
      await listOwnUploadStatuses({
        eventId: "ev-1",
        sessionToken: "x".repeat(24),
      }),
    ).toEqual([]);
  });

  it("reads whole past the 1,000-row cut", async () => {
    fake.tables.media = Array.from({ length: 1500 }, (_, i) => ({
      id: uuid(i),
      event_id: "ev-1",
      guest_id: "g-session",
      status: i % 2 ? "pending" : "approved",
      removed_by_uploader: false,
      created_at: at(i),
    }));
    const items = await listOwnUploadStatuses({
      eventId: "ev-1",
      sessionToken: TOKEN,
    });
    expect(items).toHaveLength(1500);
    expect(fake.requests.every((r) => !r.failed)).toBe(true);
  });

  it("fails CLOSED and LOUDLY: an empty list, and the failure captured", async () => {
    delete fake.tables.media;
    expect(
      await listOwnUploadStatuses({ eventId: "ev-1", sessionToken: TOKEN }),
    ).toEqual([]);
    expect(captured.at(-1)?.[2]).toMatchObject({
      seam: "own_upload_statuses_fail_closed",
      eventId: "ev-1",
    });
  });
});

/**
 * ★ WHAT SHE IS TOLD ON HER RETURN (crumbs-38, the approval toast's server half; the rule's own pins are
 * let-in-news.test.ts's). Asked with `tell`, the same read answers the uploads of hers a decision let in since her
 * row's mark and moves each row's mark up to the newest it told, forward only; without `tell` it marks nothing and
 * names neither column; a database without the migration answers the statuses and no news, loudly; a mark that fails
 * to write still answers the news (told twice beats never told), captured.
 */
describe("her news, read and marked told once", () => {
  const T = (micro: number) =>
    `2026-10-01T12:00:00.${String(micro).padStart(6, "0")}+00:00`;

  function upload(
    id: string,
    guestId: string,
    status: string,
    letInAt: string | null,
    i: number,
  ): FakeRow {
    return {
      id,
      event_id: "ev-1",
      guest_id: guestId,
      status,
      removed_by_uploader: false,
      created_at: new Date(Date.UTC(2026, 8, 27, 0, 0, i)).toISOString(),
      let_in_at: letInAt,
    };
  }

  beforeEach(() => {
    fake = createFakePostgrest({
      tables: {
        guests: [
          {
            id: "g-session",
            event_id: "ev-1",
            session_token: TOKEN,
            user_id: null,
            let_in_told_at: null,
          },
          {
            id: "g-account",
            event_id: "ev-1",
            session_token: "a".repeat(20),
            user_id: "u-1",
            let_in_told_at: T(500),
          },
        ],
        media: [
          upload("m-held-approved", "g-session", "approved", T(300), 0),
          upload("m-older-approved", "g-session", "approved", T(100), 1),
          upload("m-straight-in", "g-session", "approved", null, 2),
          upload("m-waiting", "g-session", "pending", null, 3),
          upload("m-hidden-again", "g-session", "hidden", T(200), 4),
          upload("m-told-on-account", "g-account", "approved", T(400), 5),
          upload("m-new-on-account", "g-account", "approved", T(600), 6),
        ],
      },
    });
  });

  const guestMark = (id: string) =>
    fake.tables.guests.find((g) => g.id === id)?.let_in_told_at;

  it("★ answers what a decision let in since her mark, and moves the mark to the newest it told", async () => {
    const out = await readOwnUploads({
      eventId: "ev-1",
      sessionToken: TOKEN,
      tell: true,
    });
    expect(out.news).toEqual(["m-held-approved", "m-older-approved"]);
    expect(out.items.map((i) => i.id)).toContain("m-waiting");
    expect(guestMark("g-session")).toBe(T(300));
    // The write moves the mark forward only: it takes the row only where its mark is older, or none.
    const patch = fake.requests.find(
      (r) => r.method === "PATCH" && r.name === "guests",
    );
    expect(decodeURIComponent(patch!.url)).toContain(
      `or=(let_in_told_at.is.null,let_in_told_at.lt.${T(300)})`,
    );
  });

  it("told once: the next read, on a reload or another device, answers nothing new", async () => {
    await readOwnUploads({ eventId: "ev-1", sessionToken: TOKEN, tell: true });
    const again = await readOwnUploads({
      eventId: "ev-1",
      sessionToken: TOKEN,
      tell: true,
    });
    expect(again.news).toEqual([]);
  });

  it("her ticket's row and her account's are told apart", async () => {
    const out = await readOwnUploads({
      eventId: "ev-1",
      sessionToken: TOKEN,
      userId: "u-1",
      tell: true,
    });
    expect(out.news).toEqual([
      "m-new-on-account",
      "m-held-approved",
      "m-older-approved",
    ]);
    expect(guestMark("g-account")).toBe(T(600));
    expect(guestMark("g-session")).toBe(T(300));
  });

  it("a mark already past the news is never moved back", async () => {
    fake.tables.guests[0].let_in_told_at = T(900);
    const out = await readOwnUploads({
      eventId: "ev-1",
      sessionToken: TOKEN,
      tell: true,
    });
    expect(out.news).toEqual([]);
    expect(guestMark("g-session")).toBe(T(900));
    expect(fake.requests.some((r) => r.method === "PATCH")).toBe(false);
  });

  it("without `tell` it marks nothing, and names neither column", async () => {
    const out = await readOwnUploads({ eventId: "ev-1", sessionToken: TOKEN });
    expect(out.news).toEqual([]);
    expect(guestMark("g-session")).toBeNull();
    expect(fake.requests.some((r) => r.method === "PATCH")).toBe(false);
    expect(fake.requests.some((r) => r.url.includes("let_in"))).toBe(false);
    // And the tracker's plain read is the same read.
    expect(
      await listOwnUploadStatuses({ eventId: "ev-1", sessionToken: TOKEN }),
    ).toEqual(out.items);
  });

  it("★ a database without the migration answers her statuses and no news, captured", async () => {
    schemaMissing = true;
    const out = await readOwnUploads({
      eventId: "ev-1",
      sessionToken: TOKEN,
      tell: true,
    });
    expect(out.news).toEqual([]);
    expect(out.items).toHaveLength(5);
    expect(captured.at(-1)?.[2]).toMatchObject({
      seam: "let_in_schema_missing",
      eventId: "ev-1",
    });
  });

  it("a mark that fails to write still answers the news, the failure captured", async () => {
    markFails = true;
    const out = await readOwnUploads({
      eventId: "ev-1",
      sessionToken: TOKEN,
      tell: true,
    });
    expect(out.news).toEqual(["m-held-approved", "m-older-approved"]);
    expect(guestMark("g-session")).toBeNull();
    expect(captured.at(-1)?.[2]).toMatchObject({
      seam: "let_in_told_mark_failed",
      eventId: "ev-1",
    });
  });
});

/**
 * ★ WHETHER A CONFIRMATION CARRIED THIS PHONE'S PHOTOS (build 33's red-team). The album's door read claims her ticket
 * before the page's own claim runs, so the page asks whether that ticket is hers now with its uploads. The TICKET is
 * the question, never the account: another device's rows of hers say nothing about what this phone kept, and a ticket
 * the claim left (another guest's, an address not hers) is not hers however much her account holds here.
 */
describe("the live uploads on this device's ticket, once it is hers", () => {
  const A = "a".repeat(20);
  const B = "b".repeat(20);
  const C = "c".repeat(20);

  it("★ counts her ticket's live uploads here, a removed one left out", async () => {
    // g-account-a: 1,300 uploads, every tenth removed.
    await expect(
      countKeptTicketUploads({
        eventId: "ev-1",
        sessionToken: A,
        userId: "u-1",
      }),
    ).resolves.toBe(1170);
    // A head count: nothing capped at 1,000, nothing paged.
    expect(fake.requests.every((r) => !r.failed)).toBe(true);
  });

  it("★ never counts a ticket that is not hers, whatever her account holds here", async () => {
    // A name-only ticket (the claim left it: another guest's, or one waiting on its own address).
    await expect(
      countKeptTicketUploads({
        eventId: "ev-1",
        sessionToken: TOKEN,
        userId: "u-1",
      }),
    ).resolves.toBe(0);
    // Another account's ticket.
    await expect(
      countKeptTicketUploads({
        eventId: "ev-1",
        sessionToken: C,
        userId: "u-1",
      }),
    ).resolves.toBe(0);
    // Her ticket, asked about at another album.
    await expect(
      countKeptTicketUploads({
        eventId: "ev-2",
        sessionToken: B,
        userId: "u-1",
      }),
    ).resolves.toBe(0);
    expect(captured).toHaveLength(0);
  });

  it("reads nothing for a token too short to be one", async () => {
    await expect(
      countKeptTicketUploads({
        eventId: "ev-1",
        sessionToken: "short",
        userId: "u-1",
      }),
    ).resolves.toBe(0);
    expect(fake.requests).toHaveLength(0);
  });

  it("fails CLOSED and LOUDLY: 0, and the failure captured", async () => {
    delete fake.tables.media;
    await expect(
      countKeptTicketUploads({
        eventId: "ev-1",
        sessionToken: A,
        userId: "u-1",
      }),
    ).resolves.toBe(0);
    expect(captured).toHaveLength(1);
    expect(captured[0][0]).toBe("media");
    expect(captured[0][2]).toMatchObject({
      seam: "kept_ticket_fail_closed",
      eventId: "ev-1",
    });
  });
});
