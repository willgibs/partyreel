import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * WHAT /dashboard/new READS AND HANDS THE ROOM (create-wizard r2's wiring). Every read is answered by
 * hand; the room is caught as the props it is given. Pinned:
 *
 *   - the cap is the dashboard's own math (the slots a pass bought over the tier's number), decided on a
 *     count, and the names are read only when the door will say them;
 *   - ★ the account's storage reaches the beat (the carried `room`), and a failed read is never worth
 *     the page: room is left out and the failure is filed where failures are read;
 *   - the browser's own bar wears the room's dark, whatever the session's theme.
 */

vi.mock("server-only", () => ({}));
vi.mock("next/navigation", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/navigation")>()),
  redirect: (url: string) => {
    throw new Error(`redirect ${url}`);
  },
}));

const db = vi.hoisted(() => ({
  count: 0,
  listed: 0,
  profile: {
    display_name: "Maya",
    tier: "free",
    event_slots: null as number | null,
    storage_cap_bytes: 1000 as number | null,
  },
  storage: { activeBytes: 920, standbyBytes: 0 } as
    | { activeBytes: number; standbyBytes: number }
    | Error,
}));

vi.mock("@/lib/db/queries/events", () => ({
  countActiveEvents: async () => db.count,
  listEvents: async () => {
    db.listed++;
    return Array.from({ length: db.count }, (_, i) => ({
      id: `evt_${i}`,
      name: `Event ${i}`,
      password_hash: "never handed to the island",
    }));
  },
}));
vi.mock("@/lib/db/queries/profile", () => ({
  getProfile: async () => db.profile,
}));
vi.mock("@/lib/db/queries/storage", () => ({
  getHostStorageSummary: async () => {
    if (db.storage instanceof Error) throw db.storage;
    return db.storage;
  },
}));
vi.mock("@/lib/site-url", () => ({
  getSiteUrl: async () => "https://partyreel.com",
}));
const captureError = vi.hoisted(() => vi.fn());
vi.mock("@/lib/observability/sentry", () => ({ captureError }));

const shown = vi.hoisted(() => ({
  props: null as Record<string, unknown> | null,
}));
vi.mock("@/components/app/create-event-wizard", () => ({
  CreateEventWizard: (props: Record<string, unknown>) => {
    shown.props = props;
    return null;
  },
}));

const { default: NewEventPage, viewport } = await import("./page");

async function open() {
  render(await NewEventPage());
  return shown.props!;
}

beforeEach(() => {
  db.count = 0;
  db.listed = 0;
  db.profile = {
    display_name: "Maya",
    tier: "free",
    event_slots: null,
    storage_cap_bytes: 1000,
  };
  db.storage = { activeBytes: 920, standbyBytes: 0 };
  shown.props = null;
  captureError.mockClear();
});

describe("the cap, decided before the room opens", () => {
  it("lets a Free host with no event in, and reads no names for a door it will not draw", async () => {
    const props = await open();
    expect(props.atCap).toBe(false);
    expect(props.cappedEvents).toEqual([]);
    expect(db.listed).toBe(0);
  });

  it("stands the door at the plan's number, handing the island a name and an id and nothing more", async () => {
    db.count = 1;
    const props = await open();
    expect(props.atCap).toBe(true);
    expect(props.maxEvents).toBe(1);
    expect(props.cappedEvents).toEqual([{ id: "evt_0", name: "Event 0" }]);
  });

  it("counts a stacked pass's slots over the tier's number, as enforce_event_limit does", async () => {
    db.count = 2;
    db.profile = { ...db.profile, tier: "event_pass", event_slots: 3 };
    const props = await open();
    expect(props.atCap).toBe(false);
    expect(props.maxEvents).toBe(3);
  });
});

describe("the account's storage, for the beat (the carried `room`)", () => {
  it("★ hands the room the whole percent the hub's checklist reads", async () => {
    const props = await open();
    expect(props.storagePct).toBe(92);
  });

  it("★ is never worth the page: a failed read leaves room out and is filed", async () => {
    db.storage = new Error("rpc down");
    const props = await open();
    expect(props.storagePct).toBe(0);
    expect(captureError).toHaveBeenCalledWith(
      "db",
      db.storage,
      expect.objectContaining({ seam: expect.any(String) }),
    );
  });
});

describe("the browser's bar", () => {
  it("wears the room's dark in both themes, as the room does", () => {
    // `#040405` is the sRGB of the room's --background (layout.tsx says so for the dark scheme).
    expect(viewport.themeColor).toBe("#040405");
  });
});
