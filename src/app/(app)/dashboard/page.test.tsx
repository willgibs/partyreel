import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { HomeView } from "@/lib/dashboard/home-view";

/**
 * THE HOME'S READS AND WHAT THEY HAND THE PAGE (host-dashboard r1's wiring). Every read is answered by
 * hand; the composition is caught as the props it is given. Pinned:
 *
 *   - the head is the viewer's own day and the account's count and plan;
 *   - the party of the moment leads, and only the reads its phase needs are made: on its day its wall
 *     and its guests, before its day readiness's own; the week's parties before their day get
 *     readiness's reads, and no party further off pays for one;
 *   - ★ a hosted row says Paused for paused uploads, never Closed, the door's word for Only people
 *     already in (crumbs-42, from `event-ready`): the rows view's word, from `uploadsLabel`.
 */

vi.mock("server-only", () => ({}));
// Friday 2 October 2026, 21:00 in the viewer's zone (UTC, named by the request's header below).
vi.useFakeTimers({ toFake: ["Date"] });
vi.setSystemTime(new Date("2026-10-02T21:00:00.000Z"));

vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => undefined }),
  headers: async () => ({ get: () => "UTC" }),
}));
vi.mock("next/navigation", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/navigation")>()),
  redirect: (url: string) => {
    throw new Error(`redirect ${url}`);
  },
}));

const event = (
  id: string,
  over: Record<string, unknown> = {},
): Record<string, unknown> => ({
  id,
  name: `Event ${id}`,
  event_date: null,
  created_at: "2026-09-30T12:00:00Z",
  accepting_uploads: true,
  show_reel: true,
  qr_token: `${id}-token`,
  qr_style: "classic",
  door: "open",
  has_password: false,
  description: "A note",
  ...over,
});

const db = vi.hoisted(() => ({
  events: [] as Record<string, unknown>[],
  opened: [] as string[][],
  stagePhotos: [] as string[],
  guests: [] as string[],
  dayCounts: [] as string[],
}));

vi.mock("@/lib/db/queries/events", () => ({
  listEvents: async () => db.events,
  countActiveEvents: async () => db.events.length,
  listRecentlyDeletedEvents: async () => [],
  getEventCardStills: async () => new Map(),
  getEventCoverUrls: async () => new Map(),
  getEventCardStats: async () => new Map(),
  getReelProgress: async () => new Map(),
}));
vi.mock("@/lib/db/queries/dashboard", () => ({
  getLastArrivals: async () => new Map(),
  countArrivalsSince: async (id: string) => {
    db.dayCounts.push(id);
    return 0;
  },
  getOpenedCounts: async (ids: string[]) => {
    db.opened.push(ids);
    return new Map(ids.map((id) => [id, 1]));
  },
  getStagePhotos: async (id: string) => {
    db.stagePhotos.push(id);
    return [];
  },
}));
vi.mock("@/lib/db/queries/profile", () => ({
  getProfile: async () => ({
    id: "host-1",
    display_name: "Maya",
    welcomed_at: "2026-09-01T00:00:00Z",
    tier: "pro",
    slug: "maya",
    event_slots: null,
    storage_cap_bytes: null,
    stripe_customer_id: null,
    tier_expires_at: null,
    storage_grace_until: null,
  }),
}));
vi.mock("@/lib/db/queries/social", () => ({
  getMyGuestEventCards: async () => [],
  getMyAttendedEvents: async () => [],
  getEventGuests: async (id: string) => {
    db.guests.push(id);
    return { verifiedUserIds: ["a", "b"], unverifiedRows: [] };
  },
}));
vi.mock("@/lib/db/queries/storage", () => ({
  getHostStorageSummary: async () => ({
    activeBytes: 0,
    deletedBytes: 0,
    systemBytes: 0,
    storedBytes: 0,
  }),
}));
vi.mock("@/lib/db/queries/claims", () => ({
  getMyClaimableGuestRows: async () => [],
}));
vi.mock("@/lib/db/queries/guest-events-admin", () => ({
  getLiveReelServerFacts: async () => ({ liveReelEnabled: true, tier: null }),
}));
vi.mock("@/lib/db/queries/event-doors", () => ({
  getHostDoorWaiting: async () => new Map(),
  getDoorCounts: async () => ({ in: 0, waiting: 0 }),
}));
vi.mock("@/lib/site-url", () => ({
  getSiteUrl: async () => "https://partyreel.com",
}));
vi.mock("@/lib/observability/sentry", () => ({ captureError: vi.fn() }));
vi.mock("@/lib/avatar/seed", () => ({ seedFor: () => "seed" }));
vi.mock("@/app/(app)/dashboard/claims-actions", () => ({
  claimEventAction: vi.fn(),
  disownEventAction: vi.fn(),
}));

// The composition is caught as the props it is given; the bands it draws are their own files' to pin.
const shown = vi.hoisted(() => ({
  view: null as HomeView | null,
  head: null as { day: string; line: string } | null,
}));
vi.mock("@/components/app/dashboard/home", () => ({
  DashboardHome: ({
    view,
    head,
  }: {
    view: HomeView;
    head: { day: string; line: string };
  }) => {
    shown.view = view;
    shown.head = head;
    return null;
  },
}));
const part = vi.hoisted(() => () => null);
vi.mock("@/components/app/dashboard/claims-review", () => ({
  ClaimsReview: part,
}));
vi.mock("@/components/app/dashboard/page-invite-card", () => ({
  PageInviteCard: part,
}));
vi.mock("@/components/app/dashboard/grace-banner", () => ({
  GraceBanner: part,
}));
vi.mock("@/components/app/dashboard/storage-meter", () => ({
  StorageMeter: part,
}));
vi.mock("@/components/app/pricing/welcome-to-pro", () => ({
  WelcomeToPro: part,
}));
vi.mock("@/app/(app)/welcome/mark-welcomed", () => ({
  MarkWelcomedOnMount: part,
}));

const { default: DashboardPage } = await import("./page");

async function open() {
  render(await DashboardPage({ searchParams: Promise.resolve({}) }));
  return shown.view!;
}

beforeEach(() => {
  db.events = [];
  db.opened = [];
  db.stagePhotos = [];
  db.guests = [];
  db.dayCounts = [];
});

describe("the head", () => {
  it("is the viewer's own day, and the account's count and plan", async () => {
    db.events = [event("a"), event("b")];
    await open();
    expect(shown.head).toEqual({
      day: "Friday, October 2",
      line: "2 events · Pro",
    });
  });
});

describe("the reads each phase needs", () => {
  it("★ on its day, the stage reads its wall, its guests and its day's counts, and no readiness", async () => {
    db.events = [
      event("tonight", { event_date: "2026-10-02" }),
      event("tomorrow", { event_date: "2026-10-03" }),
      event("far", { event_date: "2026-12-12" }),
    ];
    const view = await open();
    expect(view.stage?.event.id).toBe("tonight");
    expect(db.stagePhotos).toEqual(["tonight"]);
    expect(db.guests).toEqual(["tonight"]);
    expect(new Set(db.dayCounts)).toEqual(new Set(["tonight"]));
    // Readiness for the week's party before its day only; the party in December pays for nothing.
    expect(db.opened).toEqual([["tomorrow"]]);
    expect(view.week.map((c) => c.id)).toEqual(["tomorrow"]);
  });

  it("before its day, the stage reads readiness alone: no wall, and nobody has come yet", async () => {
    db.events = [event("soon", { event_date: "2026-10-09" })];
    const view = await open();
    expect(view.stage?.event.id).toBe("soon");
    expect(view.stage?.event.ready).toEqual({ opened: 1, guestsIn: 0 });
    expect(db.stagePhotos).toEqual([]);
    expect(db.guests).toEqual([]);
    expect(db.opened).toEqual([["soon"]]);
  });

  it("after its day, the stage reads who came, and never a wall", async () => {
    db.events = [event("last-week", { event_date: "2026-09-26" })];
    const view = await open();
    expect(view.stage?.event.id).toBe("last-week");
    expect(view.stage?.guests).toBe(2);
    expect(db.stagePhotos).toEqual([]);
    expect(db.opened).toEqual([[]]);
  });
});

describe("a hosted row's word for whether guests can add", () => {
  it("★ says Paused for paused uploads, never Closed, and Open while guests can add", async () => {
    db.events = [
      event("lead", { event_date: "2026-10-02" }),
      event("open"),
      event("paused", { accepting_uploads: false }),
    ];
    const view = await open();
    const words = new Map(
      view.events.rows
        .filter((r) => r.kind === "hosted")
        .map((r) => [r.id, r.statusLabel]),
    );
    expect(words.get("paused")).toBe("Paused");
    expect(words.get("open")).toBe("Open");
    expect([...words.values()]).not.toContain("Closed");
  });
});
