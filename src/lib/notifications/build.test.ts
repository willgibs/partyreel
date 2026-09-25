import { describe, expect, it } from "vitest";

import {
  buildNotifications,
  type NotificationSignals,
} from "@/lib/notifications/build";

const NOW = new Date("2026-06-01T00:00:00Z");

function signals(
  overrides: Partial<NotificationSignals> = {},
): NotificationSignals {
  return {
    pendingCount: 0,
    storageGraceUntil: null,
    tier: "free",
    tierExpiresAt: null,
    recoverySoonestPurgeAt: null,
    announcements: [],
    announcementsSeenAt: null,
    now: NOW,
    ...overrides,
  };
}

describe("buildNotifications", () => {
  it("no signals → no items, badge 0", () => {
    const r = buildNotifications(signals());
    expect(r.items).toEqual([]);
    expect(r.badgeCount).toBe(0);
  });

  it("pending uploads → a review alert with pluralized count", () => {
    const r = buildNotifications(signals({ pendingCount: 3 }));
    expect(r.items.find((i) => i.kind === "review")?.title).toBe(
      "3 uploads to review",
    );
    expect(
      buildNotifications(signals({ pendingCount: 1 })).items.find(
        (i) => i.kind === "review",
      )?.title,
    ).toBe("1 upload to review");
    // ONE NUMBER (`reel-host`, `review=agree`): the badge counts the uploads, so it
    // reads the event card's "3 to review" and Review's own 3. Reshaped on purpose
    // in reel-host-wiring: the badge used to count the review alert as one.
    expect(r.badgeCount).toBe(3);
  });

  it("names each event with a queue and opens that event's Review room", () => {
    const r = buildNotifications(
      signals({
        pendingCount: 5,
        pendingByEvent: [
          { eventId: "e1", eventName: "Mia & Theo's wedding", pending: 3 },
          { eventId: "e2", eventName: "Ruby's 30th", pending: 2 },
          { eventId: "e3", eventName: "Caught up", pending: 0 },
        ],
      }),
    );
    const rows = r.items.filter((i) => i.kind === "review");
    expect(rows.map((i) => [i.title, i.body, i.href])).toEqual([
      ["3 uploads to review", "Mia & Theo's wedding", "/dashboard/e1/review"],
      ["2 uploads to review", "Ruby's 30th", "/dashboard/e2/review"],
    ]);
    // Keys stay unique per event, so two queues are two rows.
    expect(new Set(rows.map((i) => i.key)).size).toBe(2);
    expect(r.badgeCount).toBe(5);
  });

  it("an empty queue list draws no review row, whatever the head count said", () => {
    // The per-event read is the one the rows and the badge share; a stale head
    // count must not add a row the rows cannot back.
    const r = buildNotifications(
      signals({ pendingCount: 2, pendingByEvent: [] }),
    );
    expect(r.items.some((i) => i.kind === "review")).toBe(false);
    expect(r.badgeCount).toBe(0);
  });

  it("over capacity → an alert linking to /pricing, carrying the deadline", () => {
    const r = buildNotifications(
      signals({ storageGraceUntil: "2026-06-20T00:00:00Z" }),
    );
    const alert = r.items.find((i) => i.kind === "over_capacity");
    expect(alert?.href).toBe("/pricing");
    expect(alert?.date).toBe("2026-06-20T00:00:00Z");
    expect(r.badgeCount).toBe(1);
  });

  it("Event Pass expiring only within the renewal window AND only for event_pass", () => {
    const within = buildNotifications(
      signals({ tier: "event_pass", tierExpiresAt: "2026-06-10T00:00:00Z" }),
    );
    expect(within.items.some((i) => i.kind === "pass_expiring")).toBe(true);

    const farOut = buildNotifications(
      signals({ tier: "event_pass", tierExpiresAt: "2026-07-01T00:00:00Z" }),
    );
    expect(farOut.items.some((i) => i.kind === "pass_expiring")).toBe(false);

    const freeWithExpiry = buildNotifications(
      signals({ tier: "free", tierExpiresAt: "2026-06-05T00:00:00Z" }),
    );
    expect(freeWithExpiry.items.some((i) => i.kind === "pass_expiring")).toBe(
      false,
    );
  });

  it("announcement is unread iff published after the seen marker", () => {
    const announcements = [
      {
        id: "a",
        title: "Old",
        body: "…",
        href: null,
        published_at: "2026-05-01T00:00:00Z",
      },
      {
        id: "b",
        title: "New",
        body: "…",
        href: "/x",
        published_at: "2026-05-20T00:00:00Z",
      },
    ];
    const r = buildNotifications(
      signals({ announcements, announcementsSeenAt: "2026-05-10T00:00:00Z" }),
    );
    expect(r.items.filter((i) => i.kind === "announcement")).toHaveLength(2);
    expect(r.items.find((i) => i.key === "announcement:a")?.unread).toBe(false);
    expect(r.items.find((i) => i.key === "announcement:b")?.unread).toBe(true);
    expect(r.badgeCount).toBe(1);
  });

  it("a never-seen announcement counts; a seen one does not", () => {
    const ann = {
      id: "a",
      title: "Hi",
      body: "x",
      href: null,
      published_at: "2026-05-20T00:00:00Z",
    };
    expect(
      buildNotifications(signals({ announcements: [ann] })).badgeCount,
    ).toBe(1);
    expect(
      buildNotifications(
        signals({
          announcements: [ann],
          announcementsSeenAt: "2026-05-21T00:00:00Z",
        }),
      ).badgeCount,
    ).toBe(0);
  });

  it("badge = uploads waiting + the other active alerts + unread announcements", () => {
    const r = buildNotifications(
      signals({
        pendingCount: 2,
        storageGraceUntil: "2026-06-15T00:00:00Z",
        announcements: [
          {
            id: "a",
            title: "Hi",
            body: "x",
            href: null,
            published_at: "2026-05-20T00:00:00Z",
          },
        ],
      }),
    );
    // over_capacity (1) + the 2 uploads waiting + 1 unread announcement = 4
    expect(r.badgeCount).toBe(4);
  });

  it("recovery alert fires only when the soonest purge is within the nudge window", () => {
    // NOW = 2026-06-01; RECOVERY_PURGE_NUDGE_DAYS = 7.
    const within = buildNotifications(
      signals({ recoverySoonestPurgeAt: "2026-06-05T00:00:00Z" }), // 4 days out
    );
    const alert = within.items.find((i) => i.kind === "recovery_clearing");
    expect(alert?.href).toBe("/dashboard");
    expect(alert?.date).toBe("2026-06-05T00:00:00Z");
    expect(within.badgeCount).toBe(1);

    const farOut = buildNotifications(
      signals({ recoverySoonestPurgeAt: "2026-06-20T00:00:00Z" }), // 19 days out
    );
    expect(farOut.items.some((i) => i.kind === "recovery_clearing")).toBe(
      false,
    );

    const none = buildNotifications(signals());
    expect(none.items.some((i) => i.kind === "recovery_clearing")).toBe(false);
  });
});
