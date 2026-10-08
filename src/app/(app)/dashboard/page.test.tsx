import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { HomeView } from "@/lib/dashboard/home-view";
import type { Leading } from "@/lib/dashboard/leading";

/**
 * THE HOME'S READS AND WHAT THEY HAND THE PAGE (host-dashboard r1's wiring). Every read is answered by
 * hand; the composition is caught as the props it is given. Pinned:
 *
 *   - the head is the viewer's own day and the account's count and plan;
 *   - the party of the moment leads, and only the reads its phase needs are made: on its day its wall
 *     and its guests, before its day readiness's own; the week's parties before their day get
 *     readiness's reads, and no party further off pays for one;
 *   - ★ a hosted row says Paused for paused uploads, never Closed, the door's word for Only people
 *     already in (crumbs-42, from `event-ready`): the rows view's word, from `uploadsLabel`;
 *   - ★ the stage leads with the rule her account keeps (host-dashboard r4, `chooser=words`), Newest, which is the
 *     moment, until she chose; the events her other rules would lead with are asked readiness's reads too (so a press
 *     draws them whole) and only where she has a choice; and the client is handed what a press takes (`leading`) only
 *     there as well.
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
  /** What her profile keeps in `events_display`: her Display's choices and, beside them, her stage's rule. */
  display: undefined as unknown,
  /** An event's last upload, by id: the instant `getLastArrivals` answers. */
  arrivals: new Map<string, string>(),
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
  getLastArrivals: async () => db.arrivals,
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
    events_display: db.display,
    id: "host-1",
    email: "maya@example.com",
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
  leading: null as Leading | null,
}));
vi.mock("@/components/app/dashboard/home", () => ({
  DashboardHome: ({
    view,
    head,
    leading,
    alert,
  }: {
    view: HomeView;
    head: { day: string; line: string };
    leading: Leading | null;
    alert?: ReactNode;
  }) => {
    shown.view = view;
    shown.head = head;
    shown.leading = leading;
    // The alert slot is drawn, so what it holds can be asked of the page (the one line a link owes).
    return <>{alert}</>;
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

async function open(
  searchParams: { welcome?: string; signed_in?: string } = {},
) {
  render(await DashboardPage({ searchParams: Promise.resolve(searchParams) }));
  return shown.view!;
}

beforeEach(() => {
  db.events = [];
  db.opened = [];
  db.stagePhotos = [];
  db.guests = [];
  db.dayCounts = [];
  db.display = undefined;
  db.arrivals = new Map();
  shown.leading = null;
});

/**
 * ★ THE LINE A CREATE ACCOUNT LINK OWES (crumbs-88): the callback lands the dashboard marked (`signed_in=existing`) after the
 * server's own test, and the page draws "Signed you into the account <email> already had." under the head, with the address
 * her own profile holds. Exactly the one value the callback sends, as `welcome=pro` is the checkout's: a hand-typed other
 * value draws nothing, and the mark never reads the database for anyone but the viewer's own row.
 */
describe("the existing-account line", () => {
  it("★ is drawn for the callback's mark, with her own profile's address", async () => {
    await open({ signed_in: "existing" });
    expect(screen.getByRole("status")).toHaveTextContent(
      "Signed you into the account maya@example.com already had.",
    );
  });

  it.each([
    ["no mark", {}],
    ["another value", { signed_in: "1" }],
    ["the value in other words", { signed_in: "Existing" }],
    ["the checkout's mark", { welcome: "pro" }],
  ])("draws nothing for %s", async (_name, params) => {
    await open(params);
    expect(screen.queryByRole("status")).toBeNull();
  });
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

/**
 * WHAT LEADS THE STAGE, BY THE RULE HER ACCOUNT KEEPS (host-dashboard r4, `chooser=words`). Friday 2 October 2026,
 * nothing on its day: a wedding made the day before (empty, nothing dated), a party in 44 days (past the month, so it
 * does not lead under Newest, but it is the soonest ahead under Upcoming), an old party, and an album whose photographs
 * landed last.
 */
describe("the rule that leads the stage", () => {
  const quiet = () => [
    event("wedding", { created_at: "2026-10-01T12:00:00Z" }),
    event("soon", {
      created_at: "2026-09-01T12:00:00Z",
      event_date: "2026-11-15",
    }),
    event("old", {
      created_at: "2026-06-01T12:00:00Z",
      event_date: "2026-06-10",
      host_opened_at: "2026-09-30T08:00:00Z",
    }),
    event("album", { created_at: "2026-07-01T12:00:00Z" }),
  ];

  it("★ is Newest until she chooses: the page a host who never chose has always met", async () => {
    db.events = quiet();
    const view = await open();
    expect(view.stage?.event.id).toBe("wedding");
    expect(shown.leading?.rule).toBe("newest");
  });

  it.each([
    ["upcoming", "soon"],
    ["opened", "old"],
    ["photos", "album"],
  ])("leads with %s's event when her account keeps it", async (rule, id) => {
    db.events = quiet();
    db.arrivals = new Map([["album", "2026-09-20T10:00:00Z"]]);
    db.display = { layout: "table", lead: rule };
    const view = await open();
    expect(view.stage?.event.id).toBe(id);
    expect(shown.leading?.rule).toBe(rule);
    // The page around it is the rule's page: its event is on the stage and nowhere below it.
    expect(view.events.rows.some((r) => r.id === id)).toBe(false);
  });

  it("★ takes a forged rule for the default, whatever the column holds", async () => {
    db.events = quiet();
    db.display = { lead: "everything" };
    const view = await open();
    expect(view.stage?.event.id).toBe("wedding");
    expect(shown.leading?.rule).toBe("newest");
  });

  it("★ asks readiness of the events her other rules would lead with, before their day, so a press draws them whole", async () => {
    db.events = quiet();
    await open();
    // The wedding leads (nobody has opened it, no date: before its day) and the party in 44 days is Upcoming's.
    expect(db.opened).toEqual([["wedding", "soon"]]);
    expect(Object.keys(shown.leading!.alts).sort()).toEqual(["old", "soon"]);
    expect(shown.leading!.alts.soon!.event.ready).toEqual({
      opened: 1,
      guestsIn: 0,
    });
  });

  it("asks nothing more for a stage that is after its day: its guests are read for the stage alone", async () => {
    db.events = quiet();
    db.display = { lead: "opened" };
    const view = await open();
    expect(view.stage?.event.id).toBe("old");
    expect(view.stage?.guests).toBe(2);
    expect(db.guests).toEqual(["old"]);
  });

  it("sends nothing to press for one event, and asks no alternate anything", async () => {
    db.events = [event("only", { event_date: "2026-10-09" })];
    await open();
    expect(shown.leading).toBeNull();
    expect(db.opened).toEqual([["only"]]);
  });

  it("sends nothing to press while a party is on its day: it leads under every rule", async () => {
    db.events = [...quiet(), event("tonight", { event_date: "2026-10-02" })];
    db.display = { lead: "photos" };
    const view = await open();
    expect(view.stage?.event.id).toBe("tonight");
    expect(shown.leading).toBeNull();
    // Readiness for the week's parties only, never an alternate: nothing is left to choose.
    expect(db.opened).toEqual([[]]);
  });
});
