/**
 * ★ THE HOST'S OWN PASSWORD ALBUM, END TO END (build 10's one blocker): the host opening their own
 * password event's guest page got "Something went wrong", because the page let the owner in while
 * the album's reads, gated on the unlock cookie alone, refused them.
 *
 * Here everything that decides is REAL: the viewer resolution the routes share
 * (`album-viewer.server.ts`), the page's decision and seed (`gallery-access.server.ts`), the owner
 * (`gallery-access-owner.server.ts`, through `getRequestAuth`), the reads and their gate
 * (`album-guest.ts`), the unlock cookie (`unlock-cookie.ts`, with cookies signed for real) and the
 * three routes. Only the edges stand in: the request's cookies, the auth user and the RLS-scoped
 * `events` read, the service role's tables, the album's version rows, the presigner.
 *
 * What is pinned, through the page's seed and all three routes: the host reads their password album
 * with no cookie; a signed-in stranger (a host, of another event), an anonymous viewer and a cookie
 * signed for another event are refused, and the service role never reads a media row for them; the
 * unlock cookie still opens it without an owner check; an open album is unchanged. And the same page's
 * "Download all" (`/api/export/guest`, over the real `getApprovedMediaForUnlock`) counts the host's
 * own album and nobody else's.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  asSupabase,
  createFakePostgrest,
  type FakePostgrest,
  type FakeRow,
} from "@/lib/db/testing/fake-postgrest";
import type { GuestEvent } from "@/lib/db/queries/guest-events";
import { summarizeMedia } from "@/lib/export/build-manifest";
import { unlockCookieName } from "@/lib/events/unlock-token";

const SECRET = "test-unlock-secret-please-rotate";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/env", () => ({
  env: {},
  serverEnv: { UNLOCK_COOKIE_SECRET: SECRET },
  assertUnlockEnv: () => ({ UNLOCK_COOKIE_SECRET: SECRET }),
}));

// THE REQUEST: its cookie jar, one store per request (the unlock cookie memoizes on it), and the
// auth user its RLS-scoped client answers `getUser()` with.
const request = vi.hoisted(() => ({
  jar: new Map<string, string>(),
  store: null as object | null,
}));
vi.mock("next/headers", () => ({
  cookies: async () => request.store,
}));

// The RLS-scoped client (`events` with its host) and the service role (`events` with the password
// hash, and `media`), each a fake that records every request.
const db = vi.hoisted(() => ({
  rls: null as FakePostgrest | null,
  admin: null as FakePostgrest | null,
}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => asSupabase(db.rls as FakePostgrest),
}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => asSupabase(db.admin as FakePostgrest),
}));

// The capability read behind a link, and the album's keyset helpers (guest-events.ts's own).
const events = vi.hoisted(() => new Map<string, unknown>());
vi.mock("@/lib/db/queries/guest-events", () => ({
  getEventByQrToken: async (token: string) =>
    events.has(token)
      ? { ok: true, data: events.get(token) }
      : { ok: false, code: "not_found" },
  getEventMediaByQrToken: vi.fn(),
  albumCursorOf: (row: { created_at: string; id: string }) => ({
    at: row.created_at,
    id: row.id,
  }),
  olderThan: (after: { at: string; id: string }) =>
    `created_at.lt.${after.at},and(created_at.eq.${after.at},id.lt.${after.id})`,
}));

// The album's version rows and change log (`album_state`, `album_changes_since`): a one-photo album.
vi.mock("@/lib/db/queries/album-state", () => ({
  readAlbumVersions: async () => ({ version: 3, albumMax: 3, attrVersion: 1 }),
  readAlbumChanges: async () => ({
    version: 3,
    albumMax: 3,
    attrVersion: 1,
    approved: 1,
    hidden: null,
    pending: null,
    changes: [],
  }),
  readAlbumAttribution: async () => new Map(),
}));
// The admin reads stand in, but the password album's whole read (the export's) is the REAL one, with
// its own gate. Its module's other imports stand in as its own tests stand them in.
vi.mock("@/lib/db/queries/guest-events-admin", async (importOriginal) => {
  const real =
    await importOriginal<
      typeof import("@/lib/db/queries/guest-events-admin")
    >();
  return {
    getLiveReelServerFacts: async () => ({
      liveReelEnabled: false,
      tier: "pro",
    }),
    countApprovedMedia: async () => 1,
    getGuestCount: async () => 0,
    getApprovedPhotoTeaser: vi.fn(),
    getUploaderIdentities: async () => new Map(),
    getApprovedMediaForUnlock: real.getApprovedMediaForUnlock,
  };
});
vi.mock("@/lib/db/queries/social", () => ({ getEventGuests: vi.fn() }));
vi.mock("@/lib/supabase/avatar-storage", () => ({ getAvatarUrl: vi.fn() }));
// "Download all"'s summary is the real one; nothing here mints.
vi.mock("@/lib/export/export-service", () => ({
  exportSummary: (rows: Parameters<typeof summarizeMedia>[0]) =>
    summarizeMedia(rows),
  mintExport: vi.fn(),
  mintResponse: vi.fn(),
}));
const getUploadGate = vi.fn();
vi.mock("@/lib/db/queries/guest-gate", () => ({
  getUploadGate: (...a: unknown[]) => getUploadGate(...a),
}));
vi.mock("@/lib/r2/presign", () => ({
  presignDownload: async ({ key }: { key: string }) =>
    `https://r2.test/${key}?sig`,
}));
const captureWarning = vi.fn();
vi.mock("@/lib/observability/sentry", () => ({
  captureWarning: (...a: unknown[]) => captureWarning(...a),
  captureError: vi.fn(),
}));
vi.mock("@/lib/demo", () => ({ isDemoToken: () => false }));

const { POST: sync } = await import("@/app/api/album/guest/sync/route");
const { POST: exportGuest } = await import("@/app/api/export/guest/route");
const { POST: media } = await import("@/app/api/album/guest/media/route");
const { POST: manifest } = await import("@/app/api/album/guest/manifest/route");
const { resolveViewerDecision, streamGallerySeed } =
  await import("@/lib/events/gallery-access.server");
const { isRequestOwner } =
  await import("@/lib/events/gallery-access-owner.server");
const { getRequestAuth } = await import("@/lib/supabase/request-auth");
const { isUnlocked, readUnlockStateByToken, signUnlock } =
  await import("@/lib/events/unlock-cookie");
const { readGuestSessionCookie } = await import("@/lib/guest/session-cookie");

const HOST = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const STRANGER = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const PW = "e0b1f5fc-b475-4992-b02a-850b46644126";
const OTHER = "22222222-2222-4222-8222-222222222222";
const OPEN = "33333333-3333-4333-8333-333333333333";
const PHOTO = "00000000-0000-4000-8000-000000000001";
const OTHER_PHOTO = "00000000-0000-4000-8000-000000000002";
const OPEN_PHOTO = "00000000-0000-4000-8000-000000000003";
const AT = "2026-09-24T21:14:03.120456Z";
const AT_MICROS = 1790284443120456;
const HASH_PW = "$2a$06$abcdefghijklmnopqrstuuJ5x9o0wB0M8tqzSx3v1dW5c8i2n0mJe";
const HASH_OTHER =
  "$2a$06$zyxwvutsrqponmlkjihgfeQq6kqg2Yf3cT0n7ZrYpF0sL1uV9aBcS";

function guestEvent(
  id: string,
  token: string,
  visibility: GuestEvent["visibility"],
): GuestEvent {
  return {
    id,
    qr_token: token,
    name: "Alias red-team (disposable)",
    description: null,
    moderation_mode: "live",
    visibility,
    has_password: visibility === "password",
    accepting_uploads: true,
    require_verified_email: false,
    require_upload_to_view: false,
    event_date: null,
    qr_style: "classic",
    host_display_name: null,
    custom_slug: null,
    show_reel: true,
    reel_style_id: null,
    reel_hold_sec: null,
  };
}

function photo(id: string, eventId: string): FakeRow {
  return {
    id,
    event_id: eventId,
    status: "approved",
    type: "photo",
    width: 640,
    height: 480,
    duration_seconds: null,
    preview_key: null,
    original_key: `events/${eventId}/photo/${id}/original.jpg`,
    reel_eligible: true,
    created_at: AT,
    file_size_bytes: 1_234_567,
  };
}

type User = { id: string; email_confirmed_at: string | null };

/** A new request from this viewer: their cookies, and who `getUser()` says they are. */
function asViewer(user: User | null, cookies: Record<string, string> = {}) {
  request.jar = new Map(Object.entries(cookies));
  const jar = request.jar;
  request.store = {
    get: (name: string) =>
      jar.has(name) ? { name, value: jar.get(name) } : undefined,
    getAll: () => [...jar].map(([name, value]) => ({ name, value })),
  };
  (db.rls as FakePostgrest).user = user as FakePostgrest["user"];
  (db.rls as FakePostgrest).requests.length = 0;
  (db.admin as FakePostgrest).requests.length = 0;
}

const confirmed = (id: string): User => ({
  id,
  email_confirmed_at: "2026-09-01T00:00:00Z",
});

/** A cookie signed for real, the way the unlock route signs one. */
async function unlockCookie(token: string) {
  const state = await readUnlockStateByToken(token);
  if (!state) throw new Error(`no password behind ${token}`);
  return signUnlock(state);
}

const FIRST_PAINT = {
  step: 1 as const,
  rhythm: "double" as const,
  seed: 42,
  width: null,
};

/** The page's own path to its seed (page.tsx, in its order): the cookie, the viewer, the decision. */
async function pageSeed(token: string) {
  const event = events.get(token) as GuestEvent;
  const unlocked =
    event.visibility === "password" ? await isUnlocked(event.id) : true;
  const { user } = await getRequestAuth();
  const decision = await resolveViewerDecision(
    event,
    {
      isOwner: user ? await isRequestOwner(event.id) : false,
      isAuthed: Boolean(user?.email_confirmed_at),
      isUnlocked: unlocked,
      userId: user?.id ?? null,
      sessionToken: await readGuestSessionCookie(event.id),
    },
    { withAlbumFull: true },
  );
  return streamGallerySeed(event, decision, FIRST_PAINT);
}

function post(route: (r: Request) => Promise<Response>, body: unknown) {
  return route(
    new Request("https://partyreel.com/api/album/guest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
}

/** One viewer through all four surfaces: the page's seed and the three routes. */
async function throughEverySurface(token: string, photoId: string) {
  const seed = await pageSeed(token);
  const polled = await post(sync, { qr_token: token });
  const linked = await post(media, { qr_token: token, ids: [photoId] });
  const paged = await post(manifest, {
    qr_token: token,
    after: [AT_MICROS + 1, photoId],
  });
  for (const res of [polled, linked, paged]) expect(res.status).toBe(200);
  return {
    seed,
    sync: await polled.json(),
    media: await linked.json(),
    manifest: await paged.json(),
  };
}

const mediaReads = () =>
  (db.admin?.requests ?? []).filter((r) => r.name === "media");
const ownerReads = () =>
  (db.rls?.requests ?? []).filter((r) => r.name === "events");

beforeEach(() => {
  vi.clearAllMocks();
  events.clear();
  events.set("tok_pw", guestEvent(PW, "tok_pw", "password"));
  events.set("tok_other", guestEvent(OTHER, "tok_other", "password"));
  events.set("tok_open", guestEvent(OPEN, "tok_open", "open"));
  db.rls = createFakePostgrest({
    tables: {
      // The worst case the explicit host_id match exists for: every row readable to everyone.
      events: [
        { id: PW, host_id: HOST },
        { id: OTHER, host_id: STRANGER },
        { id: OPEN, host_id: HOST },
      ],
    },
  });
  db.admin = createFakePostgrest({
    tables: {
      events: [
        {
          id: PW,
          qr_token: "tok_pw",
          event_password_hash: HASH_PW,
          deleted_at: null,
        },
        {
          id: OTHER,
          qr_token: "tok_other",
          event_password_hash: HASH_OTHER,
          deleted_at: null,
        },
        {
          id: OPEN,
          qr_token: "tok_open",
          event_password_hash: null,
          deleted_at: null,
        },
      ],
      media: [
        photo(PHOTO, PW),
        photo(OTHER_PHOTO, OTHER),
        photo(OPEN_PHOTO, OPEN),
      ],
    },
  });
  asViewer(null);
});

describe("★ the host reads their own password album with no unlock cookie", () => {
  it("through the page's seed and all three routes, and nothing is reported", async () => {
    asViewer(confirmed(HOST));
    const out = await throughEverySurface("tok_pw", PHOTO);

    expect(out.seed).toMatchObject({
      kind: "full",
      sync: { kind: "manifest", access: "full", total: 1 },
    });
    if (out.seed.kind !== "full") throw new Error("expected a full seed");
    expect(out.seed.sync.entries.map((e) => e[0])).toEqual([PHOTO]);
    expect(out.seed.links.links.map((l) => l[0])).toEqual([PHOTO]);

    expect(out.sync).toMatchObject({ kind: "manifest", access: "full" });
    expect(out.sync.entries.map((e: unknown[]) => e[0])).toEqual([PHOTO]);
    expect(out.media).toMatchObject({ access: "full", missing: [] });
    expect(out.media.links.map((l: unknown[]) => l[0])).toEqual([PHOTO]);
    expect(out.manifest).toMatchObject({ access: "full", gate: null });

    expect(captureWarning).not.toHaveBeenCalled();
    // Decided as the owner, by host_id, on the request's own client.
    expect(ownerReads().length).toBeGreaterThan(0);
    for (const read of ownerReads())
      expect(read.filters).toContainEqual({
        column: "host_id",
        op: "eq",
        value: HOST,
      });
  });
});

describe("nobody else gets past the password", () => {
  const LOCKED_SYNC = {
    ok: true,
    kind: "locked",
    access: "none",
    gate: "password",
  };

  async function expectRefusedEverywhere() {
    const out = await throughEverySurface("tok_pw", PHOTO);
    expect(out.seed).toEqual({ kind: "locked" });
    expect(out.sync).toEqual(LOCKED_SYNC);
    expect(out.media).toMatchObject({
      access: "none",
      gate: "password",
      links: [],
      missing: [PHOTO],
    });
    expect(out.manifest).toEqual({
      ok: true,
      access: "none",
      gate: "password",
      entries: [],
      next: null,
    });
    // Refused by the decision, before any read: the service role never touched a media row, and
    // the door working is no disagreement to report.
    expect(mediaReads()).toEqual([]);
    expect(captureWarning).not.toHaveBeenCalled();
  }

  it("a signed-in stranger (the host of another event)", async () => {
    asViewer(confirmed(STRANGER));
    await expectRefusedEverywhere();
    for (const read of ownerReads())
      expect(read.filters).toContainEqual({
        column: "host_id",
        op: "eq",
        value: STRANGER,
      });
  });

  it("an anonymous viewer, at no auth or owner read at all", async () => {
    asViewer(null);
    await expectRefusedEverywhere();
    expect(ownerReads()).toEqual([]);
  });

  it("a cookie signed for another event, under its own name or renamed onto this one", async () => {
    const other = await unlockCookie("tok_other");
    asViewer(null, { [other.name]: other.value });
    await expectRefusedEverywhere();

    asViewer(null, { [unlockCookieName(PW)]: other.value });
    await expectRefusedEverywhere();

    // The cookie itself is good: it opens the event it was signed for.
    asViewer(null, { [other.name]: other.value });
    const out = await throughEverySurface("tok_other", OTHER_PHOTO);
    expect(out.sync).toMatchObject({ kind: "manifest", access: "full" });
  });

  it("the signed-in stranger holding another event's cookie too", async () => {
    const other = await unlockCookie("tok_other");
    asViewer(confirmed(STRANGER), { [unlockCookieName(PW)]: other.value });
    await expectRefusedEverywhere();
  });
});

describe("the paths that already worked are unchanged", () => {
  it("the unlock cookie opens the password album, and never costs an owner check", async () => {
    const cookie = await unlockCookie("tok_pw");
    asViewer(null, { [cookie.name]: cookie.value });
    const out = await throughEverySurface("tok_pw", PHOTO);
    expect(out.seed).toMatchObject({ kind: "full" });
    expect(out.sync).toMatchObject({ kind: "manifest", access: "full" });
    expect(out.media.links.map((l: unknown[]) => l[0])).toEqual([PHOTO]);
    expect(out.manifest).toMatchObject({ access: "full" });
    expect(ownerReads()).toEqual([]);
  });

  it("an open album opens for an anonymous viewer, asking no cookie and no owner", async () => {
    asViewer(null);
    const out = await throughEverySurface("tok_open", OPEN_PHOTO);
    expect(out.seed).toMatchObject({ kind: "full" });
    expect(out.sync).toMatchObject({ kind: "manifest", access: "full" });
    expect(out.media.links.map((l: unknown[]) => l[0])).toEqual([OPEN_PHOTO]);
    expect(out.manifest).toMatchObject({ access: "full" });
    expect(ownerReads()).toEqual([]);
    expect(
      (db.admin?.requests ?? []).filter((r) => r.name === "events"),
    ).toEqual([]);
  });

  it("an album never leaks another album's photo, whoever asks", async () => {
    asViewer(confirmed(HOST));
    const res = await post(media, { qr_token: "tok_pw", ids: [OTHER_PHOTO] });
    expect(await res.json()).toMatchObject({
      access: "full",
      links: [],
      missing: [OTHER_PHOTO],
    });
  });
});

describe("the same page's Download all (the password album's whole read, `getApprovedMediaForUnlock`)", () => {
  async function summary(token = "tok_pw") {
    const res = await post(exportGuest, { step: "summary", qr_token: token });
    return { status: res.status, body: await res.json() };
  }

  it("★ counts the host's own album, cookie or not", async () => {
    asViewer(confirmed(HOST));
    const { status, body } = await summary();
    expect(status).toBe(200);
    expect(body.summary.shown.photo).toEqual({ count: 1, bytes: 1_234_567 });
  });

  it.each([
    ["a signed-in stranger", () => asViewer(confirmed(STRANGER))],
    ["an anonymous viewer", () => asViewer(null)],
  ])("refuses %s, reading no media at all", async (_label, as) => {
    as();
    expect(await summary()).toEqual({
      status: 403,
      body: { ok: false, code: "forbidden" },
    });
    expect(mediaReads()).toEqual([]);
  });

  it("refuses another event's cookie, and still counts for this event's own", async () => {
    const other = await unlockCookie("tok_other");
    asViewer(null, { [unlockCookieName(PW)]: other.value });
    expect((await summary()).status).toBe(403);

    const own = await unlockCookie("tok_pw");
    asViewer(null, { [own.name]: own.value });
    const { body } = await summary();
    expect(body.summary.shown.photo.count).toBe(1);
    expect(ownerReads()).toEqual([]);
  });
});
