import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { EventListRow } from "@/lib/dashboard/events-view";

/**
 * A PAUSED EVENT'S CARD SAYS PAUSED (crumbs-42, from `event-ready`). The dashboard card worded paused uploads
 * "Closed" while the hub's Settings card words the door Only people already in as "Private · Closed"
 * (`doorLabel`): one word for two states, so a host who paused uploads read that her door had shut. The card
 * now says the hub code's own word, Paused, from the one place that words whether guests can add
 * (`uploadsLabel`), and Open while they can.
 *
 * What is pinned is the card's word for each state, read off the rows the page hands the events list. Every
 * read is answered by hand; nothing about the page's other bands is pinned here.
 */

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => undefined }),
  headers: async () => ({ get: () => null }),
}));
vi.mock("next/navigation", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/navigation")>()),
  redirect: (url: string) => {
    throw new Error(`redirect ${url}`);
  },
}));

const event = (id: string, accepting: boolean) => ({
  id,
  name: `Event ${id}`,
  event_date: null,
  created_at: "2026-09-30T12:00:00Z",
  accepting_uploads: accepting,
  show_reel: true,
  qr_token: `${id}-token`,
  qr_style: "classic",
});

vi.mock("@/lib/db/queries/events", () => ({
  listEvents: async () => [event("open", true), event("paused", false)],
  countActiveEvents: async () => 2,
  listRecentlyDeletedEvents: async () => [],
  getEventCardStills: async () => new Map(),
  getEventCoverUrls: async () => new Map(),
  getEventCardStats: async () => new Map(),
  getReelProgress: async () => new Map(),
}));
vi.mock("@/lib/db/queries/profile", () => ({
  getProfile: async () => ({
    id: "host-1",
    display_name: "Maya",
    welcomed_at: "2026-09-01T00:00:00Z",
    tier: "free",
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
}));
vi.mock("@/lib/db/queries/storage", () => ({
  getHostStorageSummary: async () => ({ activeBytes: 0, standbyBytes: 0 }),
}));
vi.mock("@/lib/db/queries/pulse", () => ({
  getPulse: async () => ({
    newestByEvent: new Map(),
    arrivals: [],
    caption: null,
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

// The bands this pin is not about draw nothing; the events list hands back the rows it was given.
const shown = vi.hoisted(() => ({ rows: [] as EventListRow[] }));
const part = vi.hoisted(() => () => null);
vi.mock("@/components/app/dashboard/events-section", () => ({
  EventsSection: ({ rows }: { rows: EventListRow[] }) => {
    shown.rows = rows;
    return null;
  },
}));
vi.mock("@/components/app/dashboard/claims-review", () => ({
  ClaimsReview: part,
}));
vi.mock("@/components/app/dashboard/just-arrived", () => ({
  JustArrived: part,
}));
vi.mock("@/components/app/dashboard/next-step-band", () => ({
  NextStepBand: part,
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
vi.mock("@/components/app/pricing/pricing-sheet", () => ({
  PricingSheet: part,
}));
vi.mock("@/components/app/pricing/welcome-to-pro", () => ({
  WelcomeToPro: part,
}));
vi.mock("@/app/(app)/welcome/mark-welcomed", () => ({
  MarkWelcomedOnMount: part,
}));

const { default: DashboardPage } = await import("./page");

async function cards() {
  render(await DashboardPage({ searchParams: Promise.resolve({}) }));
  return new Map(
    shown.rows
      .filter((row) => row.kind === "hosted")
      .map((row) => [row.id, row.statusLabel]),
  );
}

describe("a hosted card's word for whether guests can add", () => {
  it("★ says Paused for paused uploads, never Closed, the door's word for Only people already in", async () => {
    const words = await cards();
    expect(words.get("paused")).toBe("Paused");
    expect([...words.values()]).not.toContain("Closed");
  });

  it("says Open while guests can add", async () => {
    const words = await cards();
    expect(words.get("open")).toBe("Open");
  });
});
