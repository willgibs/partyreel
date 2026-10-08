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
 *   - the browser's own bar wears the room's dark, whatever the session's theme;
 *   - ★ an album's like (the address's, else the one her sign-up carried in the like door's cookie) is read through
 *     the album's door as the visitor she is, lends the style alone, and lends nothing where the door shuts her out,
 *     where the read fails, or at the cap.
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
  storage: {
    activeBytes: 720,
    deletedBytes: 200,
    systemBytes: 0,
    storedBytes: 920,
  } as
    | {
        activeBytes: number;
        deletedBytes: number;
        systemBytes: number;
        storedBytes: number;
      }
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

// The like door's cookie, and the album's door as the visitor meets it (`pageDoor`, the guest page's own answer).
const jar = vi.hoisted(() => ({ like: null as string | null }));
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) =>
      name === "pr_create_like" && jar.like !== null
        ? { name, value: jar.like }
        : undefined,
  }),
}));
const door = vi.hoisted(() => ({
  asked: [] as string[],
  answer: null as
    | null
    | Error
    | { shut: boolean; event: Record<string, unknown> },
}));
vi.mock("@/lib/events/closed-door.server", () => ({
  pageDoor: async (token: string) => {
    door.asked.push(token);
    if (door.answer instanceof Error) throw door.answer;
    if (!door.answer) return null;
    return {
      decision: { kind: door.answer.shut ? "shut" : "through" },
      event: door.answer.event,
    };
  },
  isShut: (d: { decision: { kind: string } }) => d.decision.kind === "shut",
}));

/** A Review album in Dots, with a name, a date and a host none of which may cross. */
const ALBUM = {
  id: "album_1",
  name: "Priya's 30th",
  event_date: "2026-11-02",
  description: "Bring everything",
  host_display_name: "Priya",
  capture: "upload",
  moderation_mode: "hold_for_approval",
  develops_at: null,
  qr_style: "dots",
  roll_size: null,
};

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

async function open(like?: string) {
  render(
    await NewEventPage({
      searchParams: Promise.resolve(like === undefined ? {} : { like }),
    }),
  );
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
  // 720 in her albums and 200 in Deleted: her plan holds 920 of its 1,000 (trash-in-storage).
  db.storage = {
    activeBytes: 720,
    deletedBytes: 200,
    systemBytes: 0,
    storedBytes: 920,
  };
  shown.props = null;
  captureError.mockClear();
  jar.like = null;
  door.asked = [];
  door.answer = { shut: false, event: ALBUM };
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

describe("Make one like this: Create in an album's style (bridge=end)", () => {
  const TOKEN = "7f3a9c2e5b8d4f1a9e6c3b7d2a5f8e1c";

  it("opens as it always does with no like on the address or the device", async () => {
    const props = await open();
    expect(props.like).toBeNull();
    expect(door.asked).toEqual([]);
  });

  it("★ lends the album's style and look alone, read through its door: nothing of the album crosses", async () => {
    const props = await open(TOKEN);
    expect(door.asked).toEqual([TOKEN]);
    expect(props.like).toEqual({ style: "approval", look: "dots", roll: null });
    expect(JSON.stringify(props.like)).not.toMatch(/Priya|2026|Bring|album_1/);
  });

  it("★ reads the like her sign-up carried when the address has none", async () => {
    jar.like = TOKEN;
    const props = await open();
    expect(door.asked).toEqual([TOKEN]);
    expect(props.like).toMatchObject({ style: "approval" });
  });

  it("★ lends nothing where the album's door shuts her out, or names no album", async () => {
    door.answer = { shut: true, event: ALBUM };
    expect((await open(TOKEN)).like).toBeNull();
    door.answer = null;
    expect((await open(TOKEN)).like).toBeNull();
  });

  it("asks nothing of a token of the wrong shape", async () => {
    expect((await open("../../etc/passwd")).like).toBeNull();
    expect((await open("a".repeat(200))).like).toBeNull();
    expect(door.asked).toEqual([]);
  });

  it("is never worth the page: a failed read is no like, filed", async () => {
    door.answer = new Error("rpc down");
    const props = await open(TOKEN);
    expect(props.like).toBeNull();
    expect(captureError).toHaveBeenCalledWith(
      "db",
      door.answer,
      expect.objectContaining({ seam: "create_like" }),
    );
  });

  it("reads no album at the cap: the door stands there instead", async () => {
    db.count = 1;
    const props = await open(TOKEN);
    expect(props.atCap).toBe(true);
    expect(props.like).toBeNull();
    expect(door.asked).toEqual([]);
  });

  it("lends nothing of a mix outside the three styles", async () => {
    door.answer = {
      shut: false,
      event: { ...ALBUM, capture: "camera", develops_at: null },
    };
    expect((await open(TOKEN)).like).toBeNull();
  });
});
