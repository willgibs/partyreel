/**
 * THE LEAK MATRIX, APP HALF (20261002200000): every guest-path PostgREST read of an album's media, run on the fake
 * PostgREST (`lib/db/testing/fake-postgrest.ts`, which speaks the `or` logic tree the seal's filter is), against one
 * album holding a row of every kind: open, sealed until tomorrow, sealed until yesterday (developed by the clock, not
 * yet by a write), held, and held and sealed. A guest's read never answers a sealed or a held id; a read past the
 * develop time answers the developed one; the one read that names her own sealed shots answers only the ids handed
 * in, and only those still sealed. The SQL half (every SQL home, the host's exemption) is the lane's rolled-back
 * check and `migration-guards.test.ts`.
 *
 * Each cell is a read a route reaches: the paged album's manifest page and its links (`album-guest.ts`), the
 * unlocked password album, the teaser, the album's size, the uploader credits, the photo card's item, and her own
 * sealed shots for her download (`guest-events-admin.ts`).
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  asSupabase,
  createFakePostgrest,
  type FakePostgrest,
  type FakeRow,
} from "@/lib/db/testing/fake-postgrest";

vi.mock("server-only", () => ({}));
const isUnlocked = vi.fn();
vi.mock("@/lib/events/unlock-cookie", () => ({
  isUnlocked: (...args: unknown[]) => isUnlocked(...args),
}));
vi.mock("@/lib/events/gallery-access-owner.server", () => ({
  isRequestOwner: vi.fn().mockResolvedValue(false),
}));
vi.mock("@/lib/db/queries/social", () => ({
  getEventGuests: vi.fn().mockResolvedValue({ verifiedUserIds: [], unverifiedRows: [] }),
}));
vi.mock("@/lib/supabase/avatar-storage", () => ({ getAvatarUrl: vi.fn() }));
vi.mock("@/lib/observability/sentry", () => ({
  captureWarning: vi.fn(),
  captureError: vi.fn(),
}));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@/lib/supabase/anon", () => ({ createAnonClient: vi.fn() }));
vi.mock("@/lib/media/uploader-faces", () => ({
  withUploaderFaces: async (_event: string, named: unknown) => named,
}));

let fake: FakePostgrest;
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => asSupabase(fake),
}));

const admin = await import("@/lib/db/queries/guest-events-admin");
const album = await import("@/lib/db/queries/album-guest");

const EVENT = "e0000000-0000-4000-8000-0000000000d1";
const OTHER = "e0000000-0000-4000-8000-0000000000d2";
const DAY = 86_400_000;

const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const OPEN = id(1);
const DEVELOPED = id(2);
const SEALED = id(3);
const HELD = id(4);
const HELD_SEALED = id(5);
const HER_SEALED = id(6);
const OTHERS_SEALED = id(7);
const VISIBLE = [OPEN, DEVELOPED];
const NEVER = [SEALED, HELD, HELD_SEALED, HER_SEALED, OTHERS_SEALED];

/** Postgres's own timestamp text, for the keyset; the seal's times share the filter's own spelling. */
function stamp(second: number): string {
  const at = new Date(Date.UTC(2026, 9, 2, 12, 0, 0) + second * 1000);
  return `${at.toISOString().slice(0, 19)}.000000+00:00`;
}

function row(n: number, over: Partial<FakeRow>): FakeRow {
  return {
    id: id(n),
    event_id: EVENT,
    status: "approved",
    type: "photo",
    original_key: `events/${EVENT}/photo/${n}/original.jpg`,
    preview_key: `events/${EVENT}/photo/${n}/preview.webp`,
    width: 4,
    height: 3,
    duration_seconds: null,
    reel_eligible: true,
    created_at: stamp(n),
    guest_id: `g${n}`,
    guests: { user_id: null, email: null, display_name: `Guest ${n}`, verified_at: null, profiles: null },
    sealed_until: null,
    ...over,
  };
}

function seed() {
  const tomorrow = new Date(Date.now() + DAY).toISOString();
  const yesterday = new Date(Date.now() - DAY).toISOString();
  fake = createFakePostgrest({
    tables: {
      media: [
        row(1, {}),
        row(2, { sealed_until: yesterday }),
        row(3, { sealed_until: tomorrow }),
        row(4, { status: "pending" }),
        row(5, { status: "pending", sealed_until: tomorrow }),
        row(6, { sealed_until: tomorrow, guest_id: "her" }),
        row(7, { sealed_until: tomorrow, guest_id: "another" }),
        row(8, { event_id: OTHER, id: "f0000000-0000-4000-8000-000000000008" }),
      ],
      events: [{ id: EVENT, host_id: "host-1" }],
      profiles: [{ id: "host-1", display_name: "Maya" }],
    },
  });
}

beforeEach(() => {
  isUnlocked.mockReset().mockResolvedValue(true);
  seed();
});

const OPEN_EVENT = { id: EVENT, visibility: "open" as const };

describe("no guest read answers a sealed or a held id; the developed one reads", () => {
  it("the paged album's manifest page", async () => {
    const page = await album.readGuestManifestPage(OPEN_EVENT, null, 50);
    const ids = page!.entries.map((e) => e[0]);
    expect(ids.sort()).toEqual([...VISIBLE].sort());
  });

  it("the links route's read: a sealed or held id is `missing`, exactly as an unknown one", async () => {
    const out = await album.readGuestAlbumMedia(
      OPEN_EVENT,
      [...VISIBLE, ...NEVER, id(99)],
      { attribute: false },
    );
    expect(out!.rows.map((r) => r.id).sort()).toEqual([...VISIBLE].sort());
  });

  it("the unlocked password album, read whole", async () => {
    const rows = await admin.getApprovedMediaForUnlock({ id: EVENT, visibility: "password" } as never);
    expect(rows.map((r) => r.id).sort()).toEqual([...VISIBLE].sort());
  });

  it("the teaser, and its total", async () => {
    const teaser = await admin.getApprovedPhotoTeaser(OPEN_EVENT as never, 9);
    expect(teaser.rows.map((r) => r.id).sort()).toEqual([...VISIBLE].sort());
    expect(teaser.total).toBe(VISIBLE.length);
  });

  it("the album's size", async () => {
    expect(await admin.countApprovedMedia(OPEN_EVENT as never)).toBe(VISIBLE.length);
  });

  it("the uploader credits", async () => {
    const credits = await admin.getUploaderIdentities(EVENT);
    for (const sealed of [SEALED, HER_SEALED, OTHERS_SEALED, HELD_SEALED]) {
      expect(credits.has(sealed), sealed).toBe(false);
    }
    for (const seen of VISIBLE) expect(credits.has(seen), seen).toBe(true);
  });

  it("the photo card's one item: a sealed id unfurls as nothing, as an unknown one does", async () => {
    expect(await admin.getOpenAlbumItemForCard(OPEN_EVENT, SEALED)).toBeNull();
    expect(await admin.getOpenAlbumItemForCard(OPEN_EVENT, HELD)).toBeNull();
    expect(await admin.getOpenAlbumItemForCard(OPEN_EVENT, id(99))).toBeNull();
    expect(await admin.getOpenAlbumItemForCard(OPEN_EVENT, DEVELOPED)).not.toBeNull();
    expect(await admin.getOpenAlbumItemForCard(OPEN_EVENT, OPEN)).not.toBeNull();
  });
});

describe("her own sealed shots, for her own download", () => {
  it("★ answers only the ids handed in (the server's own list of hers), and only those approved and still sealed", async () => {
    const mine = await admin.readOwnSealedMedia(EVENT, [HER_SEALED, OPEN, HELD_SEALED, DEVELOPED]);
    expect(mine.map((r) => r.id)).toEqual([HER_SEALED]);
    // Another guest's sealed shot is never hers, whatever else is handed in.
    expect(mine.some((r) => r.id === OTHERS_SEALED)).toBe(false);
    expect(await admin.readOwnSealedMedia(EVENT, [])).toEqual([]);
  });

  it("another album's id handed in answers nothing", async () => {
    expect(await admin.readOwnSealedMedia(OTHER, [HER_SEALED])).toEqual([]);
  });
});
