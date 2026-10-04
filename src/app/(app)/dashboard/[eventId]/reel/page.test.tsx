import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * THE OLD REEL ROOM'S REDIRECT (`reel-host`; crumbs-69). A live reel went to the guests' page whatever the album's
 * develop time said, and that page has no reel until the develop (no guest-path read takes the owner's exemption), so an
 * old bookmark or a retired `?section=reel` link landed her on a page showing her what her guests have: none. While a
 * develop time is ahead a live reel now opens on her own hub (`?reel`, `hub-reel.tsx`), the Reel card's own press; after
 * the develop, and with no develop, it goes into the guests' view as it always did. A reel that cannot play goes to the hub.
 * `event-not-found.test.tsx` holds the gone event's answer.
 */
vi.mock("server-only", () => ({}));

const EVENT_ID = "6f1c2c9e-5a3b-4d11-9a0a-1d2f3a4b5c6d";
const TOKEN = "tok_9XkQ2mWv";

type World = {
  event: {
    id: string;
    qr_token: string;
    show_reel: boolean;
    develops_at: string | null;
  };
  playable: number;
  lever: boolean;
};
const world = vi.hoisted(() => ({}) as { current: World });
vi.mock("@/lib/db/queries/events", () => ({
  getEvent: async () => world.current.event,
  getReelProgress: async (ids: string[]) =>
    new Map(ids.map((id) => [id, world.current.playable])),
}));
vi.mock("@/lib/db/queries/guest-events-admin", () => ({
  getLiveReelServerFacts: async () => ({
    liveReelEnabled: world.current.lever,
  }),
}));
// Next's own redirect throws (it ends the render); the stand-in names where it was sent.
vi.mock("next/navigation", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/navigation")>()),
  redirect: (url: string) => {
    throw new Error(`redirect ${url}`);
  },
}));

const { default: ReelRedirectPage } = await import("./page");

const NOW = new Date("2026-10-04T10:00:00.000Z");
const AHEAD = "2026-10-05T09:00:00.000Z";
const REACHED = "2026-10-04T09:00:00.000Z";

const HUB = `/dashboard/${EVENT_ID}`;
const HER_REEL_ON_THE_HUB = `${HUB}?reel`;
const THE_GUESTS_VIEW = `/e/${TOKEN}?reel`;

async function sentTo(): Promise<string> {
  try {
    await ReelRedirectPage({ params: Promise.resolve({ eventId: EVENT_ID }) });
  } catch (error) {
    return (error as Error).message.replace(/^redirect /, "");
  }
  throw new Error("the route drew a page; it was meant to redirect");
}

function stand(
  over: Partial<World["event"]> & { playable?: number; lever?: boolean },
) {
  const { playable = 2, lever = true, ...event } = over;
  world.current = {
    event: {
      id: EVENT_ID,
      qr_token: TOKEN,
      show_reel: true,
      develops_at: null,
      ...event,
    },
    playable,
    lever,
  };
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("the old reel room, for a reel that plays", () => {
  it("★ opens her own reel on her hub while a develop time is ahead: the guests' page has none yet", async () => {
    stand({ develops_at: AHEAD });
    expect(await sentTo()).toBe(HER_REEL_ON_THE_HUB);
  });

  it("goes into the guests' view when no develop time is set, as it always did", async () => {
    stand({ develops_at: null });
    expect(await sentTo()).toBe(THE_GUESTS_VIEW);
  });

  it("goes into the guests' view once the develop time is reached", async () => {
    stand({ develops_at: REACHED });
    expect(await sentTo()).toBe(THE_GUESTS_VIEW);
  });

  it("reads the develop's own instant as developed, as every guest read does (new photographs show at once)", async () => {
    stand({ develops_at: NOW.toISOString() });
    expect(await sentTo()).toBe(THE_GUESTS_VIEW);
  });

  it("reads a time that does not parse as no develop, never as one ahead", async () => {
    stand({ develops_at: "soon" });
    expect(await sentTo()).toBe(THE_GUESTS_VIEW);
  });

  it("plays on the hub on the day the develop is ahead and on the guests' page the minute after it", async () => {
    stand({ develops_at: AHEAD });
    expect(await sentTo()).toBe(HER_REEL_ON_THE_HUB);
    vi.setSystemTime(new Date(Date.parse(AHEAD) + 60_000));
    expect(await sentTo()).toBe(THE_GUESTS_VIEW);
  });
});

describe("the old reel room, for a reel that cannot play", () => {
  it.each([
    [
      "one photograph short, develop ahead",
      { playable: 1, develops_at: AHEAD },
    ],
    ["one photograph short, no develop", { playable: 1, develops_at: null }],
    ["no photographs", { playable: 0, develops_at: AHEAD }],
    [
      "the host's switch off, develop ahead",
      { show_reel: false, develops_at: AHEAD },
    ],
    [
      "the host's switch off, no develop",
      { show_reel: false, develops_at: null },
    ],
    [
      "the platform lever off, develop ahead",
      { lever: false, develops_at: AHEAD },
    ],
    ["the platform lever off, no develop", { lever: false, develops_at: null }],
  ])(
    "%s: back to the hub, where the Reel card says why",
    async (_name, over) => {
      stand(over);
      expect(await sentTo()).toBe(HUB);
    },
  );
});
