/**
 * SEE IT AS A GUEST GRANTS NOTHING (event-header r2, `rooms=over`; the brief: "Security pins prove it grants nothing:
 * no write, no ticket, no row a guest could not see").
 *
 * The host's session is the owner everywhere, so a render of her album "as a guest" built on her session would be
 * her album: the guest page answers her as the owner and every SQL home exempts her from the seal. These pin the read
 * the guests' view stands on (`as-guest.server.ts`), end to end through the guests' own seed loader, on the fake
 * PostgREST (`fake-postgrest.ts`, which speaks the seal's `or` tree), over one album holding a row of every kind:
 *   - it shows only what a let-in guest sees: a sealed shot, a held upload and a hidden one never reach its seed,
 *     its links or its count, whatever her session could read;
 *   - it never asks the owner question of what it shows, and it decides as a guest past every step;
 *   - it writes nothing and mints nothing: no visit counted, no ticket, no mutation reached;
 *   - the door's pass it reads behind never leaves the server;
 *   - Only me is the shut door, read for nothing at all.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  asSupabase,
  createFakePostgrest,
  type FakePostgrest,
  type FakeRow,
} from "@/lib/db/testing/fake-postgrest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/env", () => ({ env: {}, serverEnv: {} }));

let fake: FakePostgrest;
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => asSupabase(fake),
}));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@/lib/supabase/anon", () => ({ createAnonClient: vi.fn() }));
vi.mock("@/lib/supabase/avatar-storage", () => ({
  getAvatarUrl: async () => null,
}));
vi.mock("@/lib/observability/sentry", () => ({
  captureWarning: vi.fn(),
  captureError: vi.fn(),
}));
vi.mock("@/lib/media/uploader-faces", () => ({
  withUploaderFaces: async (_event: string, named: unknown) => named,
}));
vi.mock("@/lib/r2/presign", () => ({
  presignDownload: async ({ key }: { key: string }) => `signed:${key}`,
}));
// The develop that a guest's first read runs when one is due: none is, here.
vi.mock("@/lib/disposable/develop.server", () => ({
  developIfDue: async () => {},
}));
vi.mock("@/lib/site-url", () => ({
  getSiteUrl: async () => "https://partyreel.test",
}));
const owner = vi.hoisted(() => ({ isRequestOwner: vi.fn(async () => true) }));
vi.mock("@/lib/events/gallery-access-owner.server", () => owner);
vi.mock("@/lib/events/unlock-cookie", () => ({
  isUnlocked: async () => false,
}));
vi.mock("@/lib/db/queries/social", () => ({
  getEventGuests: async () => ({ verifiedUserIds: [], unverifiedRows: [] }),
  getEventGuestList: vi.fn(async () => []),
}));
vi.mock("@/lib/social/cards", () => ({
  splitGuestList: (entries: unknown[]) => ({ cards: entries, unverified: [] }),
  withAvatarUrls: async (cards: unknown[]) => cards,
}));

const EVENT = "e0000000-0000-4000-8000-0000000000a5";
const TOKEN = "a".repeat(32);
const getEvent = vi.hoisted(() => vi.fn());
vi.mock("@/lib/db/queries/events", () => ({ getEvent }));

// The door's own resolution, as it answers the host: through, let in, carrying a pass the door issued.
const { issueDoorPass, holdsDoorPass } =
  await import("@/lib/event/door/pass.server");
const pageDoor = vi.hoisted(() => vi.fn());
vi.mock("@/lib/events/closed-door.server", () => ({ pageDoor }));
const decided = vi.hoisted(() => ({ ctx: [] as unknown[] }));
vi.mock("@/lib/events/gallery-access", async (importOriginal) => {
  const real =
    await importOriginal<typeof import("@/lib/events/gallery-access")>();
  return {
    ...real,
    resolveGalleryDecision: (
      ...args: Parameters<typeof real.resolveGalleryDecision>
    ) => {
      decided.ctx.push(args[1]);
      return real.resolveGalleryDecision(...args);
    },
  };
});
const seeds = vi.hoisted(() => ({ calls: [] as unknown[][] }));
vi.mock("@/lib/events/gallery-access.server", async (importOriginal) => {
  const real =
    await importOriginal<typeof import("@/lib/events/gallery-access.server")>();
  return {
    ...real,
    streamGallerySeed: (...args: Parameters<typeof real.streamGallerySeed>) => {
      seeds.calls.push(args);
      return real.streamGallerySeed(...args);
    },
  };
});

const { readAsGuest, letInGuestDecision } = await import("./as-guest.server");

const DAY = 86_400_000;
const id = (n: number) =>
  `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const OPEN = id(1);
const SEALED = id(2);
const HELD = id(3);
const HIDDEN = id(4);
const HELD_SEALED = id(5);

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
    guests: {
      user_id: null,
      email: null,
      display_name: `Guest ${n}`,
      verified_at: null,
      profiles: null,
    },
    sealed_until: null,
    ...over,
  };
}

/** The guests' event as the door shows it to someone it let in, with the pass the door issued. */
function doorEvent(door: string, visibility = "private") {
  return {
    id: EVENT,
    qr_token: TOKEN,
    name: "Maya & Jay",
    description: "Everything from the day.",
    moderation_mode: "hold_for_approval",
    visibility,
    has_password: false,
    accepting_uploads: true,
    require_verified_email: true,
    require_upload_to_view: true,
    event_date: "2026-10-03",
    qr_style: "classic",
    host_display_name: "Maya",
    custom_slug: null,
    show_reel: true,
    reel_style_id: null,
    reel_hold_sec: null,
    accepts_video: true,
    develops_at: new Date(Date.now() + DAY).toISOString(),
    door,
    doorPass: issueDoorPass(EVENT),
  };
}

const FIRST_PAINT = {
  step: 1 as const,
  rhythm: "double" as const,
  seed: 7,
  width: 390,
};

beforeEach(() => {
  seeds.calls.length = 0;
  decided.ctx.length = 0;
  owner.isRequestOwner.mockClear();
  getEvent.mockReset().mockResolvedValue({ id: EVENT, qr_token: TOKEN });
  pageDoor.mockReset().mockImplementation(async () => ({
    decision: { kind: "through", admitted: true },
    standing: { host: true },
    event: doorEvent("approve"),
  }));
  const tomorrow = new Date(Date.now() + DAY).toISOString();
  fake = createFakePostgrest({
    tables: {
      media: [
        row(1, {}),
        row(2, { sealed_until: tomorrow }),
        row(3, { status: "pending" }),
        row(4, { status: "hidden" }),
        row(5, { status: "pending", sealed_until: tomorrow }),
      ],
      events: [{ id: EVENT, host_id: "host-1" }],
      profiles: [{ id: "host-1", display_name: "Maya" }],
      ops_flags: [{ key: "live_reel_enabled", enabled: true }],
      album_state: [
        { event_id: EVENT, version: 9, album_max: 9, attr_version: 1 },
      ],
    },
    rpc: {
      // The snapshot the plan reads first: the album's versions and counts, the guest's scope (approved and
      // unsealed: one), and what waits as numbers, never ids.
      album_changes_since: () => ({
        version: 9,
        album_max: 9,
        attr_version: 1,
        watermark: 0,
        approved: 1,
        hidden: null,
        pending: null,
        changes: [],
        waiting: { count: 3, minutes: 4 },
      }),
    },
  });
});

describe("★ a sealed album shows no sealed shot: what the guests' view reads is what a let-in guest sees", () => {
  it("the album's seed, its links and its count hold the open photograph alone", async () => {
    const read = await readAsGuest(EVENT, FIRST_PAINT);
    expect(read).not.toBeNull();
    const seed = await read!.galleryPromise;
    expect(seed.kind).toBe("full");
    if (seed.kind !== "full") return;
    const manifest = seed.sync.entries.map((e) => e[0]);
    expect(manifest).toEqual([OPEN]);
    const linked = seed.links.links.map((l) => l[0]);
    expect(linked).toEqual([OPEN]);
    for (const never of [SEALED, HELD, HIDDEN, HELD_SEALED]) {
      expect(manifest, never).not.toContain(never);
      expect(JSON.stringify(seed), never).not.toContain(never);
    }
    expect(read!.stats.approvedTotal).toBe(1);
  });
});

describe("it never asks the owner question of what it shows, and decides as a guest past every step", () => {
  it("★ the seed is the guests' own, decided for a guest (full, never the owner's answer), behind the door's pass", async () => {
    await readAsGuest(EVENT, FIRST_PAINT);
    expect(seeds.calls).toHaveLength(1);
    const [event, decision] = seeds.calls[0] as [
      Parameters<typeof holdsDoorPass>[0],
      { access: string; gate: string | null },
    ];
    expect(decision).toEqual({ access: "full", gate: null });
    // Asked as a guest, never as the owner the resolver answers first: a gate a guest meets is met here.
    expect(decided.ctx).toEqual([
      {
        isOwner: false,
        isAuthed: true,
        isUnlocked: true,
        hasContributed: true,
        canContribute: true,
      },
    ]);
    // The pass the door issued (forged, it reads nothing): the gated album's reads ask for it.
    expect(holdsDoorPass(event)).toBe(true);
    // Nothing on the read path asked whether she owns it.
    expect(owner.isRequestOwner).not.toHaveBeenCalled();
  });

  it.each([
    ["open", "open"],
    ["password", "password"],
    ["approve", "private"],
    ["invite", "private"],
    ["closed", "private"],
  ])(
    "a %s door: the album as a guest let in reads it (full, every gate passed)",
    (door, visibility) => {
      expect(
        letInGuestDecision({
          ...doorEvent(door, visibility),
          visibility: visibility as never,
        } as never),
      ).toEqual({ access: "full", gate: null });
    },
  );

  it("the door is asked of the event RLS proved hers, and of nothing else", async () => {
    getEvent.mockResolvedValue(null);
    expect(await readAsGuest(EVENT, FIRST_PAINT)).toBeNull();
    expect(pageDoor).not.toHaveBeenCalled();
    expect(seeds.calls).toHaveLength(0);
  });

  it("a door that does not let the request through shows nothing", async () => {
    pageDoor.mockResolvedValue({
      decision: { kind: "shut", previous: false },
      standing: {},
      event: doorEvent("approve"),
    });
    expect(await readAsGuest(EVENT, FIRST_PAINT)).toBeNull();
    expect(seeds.calls).toHaveLength(0);
  });
});

describe("the door's pass never leaves the server", () => {
  it("★ the event the view is handed holds no pass, and nothing it carries can be presented as one", async () => {
    const read = await readAsGuest(EVENT, FIRST_PAINT);
    expect(read!.event.doorPass).toBeNull();
    expect(holdsDoorPass(read!.event)).toBe(false);
  });
});

describe("Only me is the shut door", () => {
  it("★ reads no album, no count and no list: every guest meets the shut screen", async () => {
    pageDoor.mockResolvedValue({
      decision: { kind: "through", admitted: true },
      standing: { host: true },
      event: doorEvent("private"),
    });
    const read = await readAsGuest(EVENT, FIRST_PAINT);
    expect(read!.shut).toBe(true);
    expect(seeds.calls).toHaveLength(0);
    expect(await read!.galleryPromise).toEqual({ kind: "locked" });
    expect(read!.stats).toEqual({ approvedTotal: 0, guestCount: 0 });
    expect(read!.guests).toEqual([]);
    expect(fake.requests).toHaveLength(0);
  });
});

describe("★ it writes nothing and mints nothing", () => {
  it("every request it makes is a read", async () => {
    const read = await readAsGuest(EVENT, FIRST_PAINT);
    await read!.galleryPromise;
    expect(fake.requests.length).toBeGreaterThan(0);
    for (const request of fake.requests) {
      // A table read is a GET (a HEAD for a count); the one RPC is the snapshot, a read.
      if (request.target === "rpc")
        expect(request.name).toBe("album_changes_since");
      else expect(["GET", "HEAD"], request.name).toContain(request.method);
    }
  });

  it("reaches no mutation, counts no visit and reads or writes no ticket (its source, whole)", () => {
    const src = readFileSync(
      join(
        process.cwd(),
        "src/app/(app)/dashboard/[eventId]/as-guest.server.ts",
      ),
      "utf8",
    )
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/^\s*\/\/.*$/gm, "");
    expect(src).not.toMatch(/@\/lib\/db\/mutations\//);
    expect(src).not.toMatch(/recordLinkHit|readGuestSessionCookie|joinEvent/);
    expect(src).not.toMatch(/isRequestOwner|listOwnerMediaIds|getHostCard/);
    expect(src).not.toMatch(/\.set\(|cookies\(\)/);
  });
});
