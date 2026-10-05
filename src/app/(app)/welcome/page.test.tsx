import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * /WELCOME COUNTS AND READS THE VIEWER ONCE (compute-reads).
 *
 * The page decides one thing about Guest cards, whether the account holds any (`isGuestFirstVisit`: a guest-made
 * account is owed the name and never the tour), and it used to build every card (hosts, a presigned cover and a gate
 * each) to read the list's length; it also called `getUser()` on a client of its own beside the request's cached one,
 * a second round trip to the auth server. Pinned here: the count, never the cards, and the viewer from the request's
 * own cache, with the decision (`needsWelcome`, the name and its prefill) what it was.
 */
const reads = vi.hoisted(() => ({
  user: {
    id: "u-1",
    user_metadata: { full_name: "Maya Lin" } as Record<string, unknown>,
  },
  profile: { display_name: null, welcomed_at: null } as {
    display_name: string | null;
    welcomed_at: string | null;
  } | null,
  claimable: [] as { names: string[] }[],
  hosted: 0,
  cards: 0,
  getRequestAuth: vi.fn(),
  createClient: vi.fn(),
  getUser: vi.fn(),
  countMyGuestEventCards: vi.fn(),
  getMyGuestEventCards: vi.fn(),
}));

vi.mock("@/lib/supabase/request-auth", () => ({
  getRequestAuth: async () => {
    reads.getRequestAuth();
    return { supabase: {}, user: reads.user };
  },
}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => {
    reads.createClient();
    return {
      auth: {
        getUser: async () => {
          reads.getUser();
          return { data: { user: reads.user } };
        },
      },
    };
  },
}));
vi.mock("@/lib/db/queries/profile", () => ({
  getProfile: async () => reads.profile,
}));
vi.mock("@/lib/db/queries/claims", () => ({
  getMyClaimableGuestRows: async () => reads.claimable,
}));
vi.mock("@/lib/db/queries/events", () => ({
  countActiveEvents: async () => reads.hosted,
}));
vi.mock("@/lib/db/queries/social", () => ({
  countMyGuestEventCards: async () => {
    reads.countMyGuestEventCards();
    return reads.cards;
  },
  getMyGuestEventCards: async () => {
    reads.getMyGuestEventCards();
    return Array.from({ length: reads.cards }, () => ({}));
  },
}));
vi.mock("@/components/app/welcome-flow", () => ({
  WelcomeFlow: () => null,
}));

const { default: WelcomePage } = await import("./page");

/** The page's answer: the props it hands the flow. */
async function flow() {
  const element = (await WelcomePage()) as {
    props: { needsName: boolean; needsWelcome: boolean; namePrefill: string };
  };
  return element.props;
}

beforeEach(() => {
  vi.clearAllMocks();
  reads.user = { id: "u-1", user_metadata: { full_name: "Maya Lin" } };
  reads.profile = { display_name: null, welcomed_at: null };
  reads.claimable = [];
  reads.hosted = 0;
  reads.cards = 0;
});

describe("the welcome's reads", () => {
  it("★ counts the Guest cards and never builds them", async () => {
    reads.cards = 3;
    await flow();
    expect(reads.countMyGuestEventCards).toHaveBeenCalledTimes(1);
    expect(reads.getMyGuestEventCards).not.toHaveBeenCalled();
  });

  it("★ reads the viewer from the request's own cache, never by a getUser() of its own", async () => {
    await flow();
    expect(reads.getRequestAuth).toHaveBeenCalledTimes(1);
    expect(reads.createClient).not.toHaveBeenCalled();
    expect(reads.getUser).not.toHaveBeenCalled();
  });
});

describe("the welcome's decision, as it was", () => {
  it("★ a guest-made account (hosts nothing, holds a Guest card) is owed the name and never the tour", async () => {
    reads.cards = 2;
    expect(await flow()).toMatchObject({
      needsName: true,
      needsWelcome: false,
    });
  });

  it("an account with nothing takes the tour", async () => {
    expect(await flow()).toMatchObject({ needsName: true, needsWelcome: true });
  });

  it("a host takes the tour whatever she holds as a guest", async () => {
    reads.hosted = 1;
    reads.cards = 4;
    expect((await flow()).needsWelcome).toBe(true);
  });

  it("an account already welcomed needs no tour", async () => {
    reads.profile = {
      display_name: "Maya",
      welcomed_at: "2026-10-01T00:00:00Z",
    };
    expect(await flow()).toMatchObject({
      needsName: false,
      needsWelcome: false,
    });
  });

  it("prefills the name from the sign-in's own, else the newest claimable row's, else blank", async () => {
    expect((await flow()).namePrefill).toBe("Maya Lin");
    reads.user = { id: "u-1", user_metadata: {} };
    reads.claimable = [{ names: [] }, { names: ["Maya L."] }];
    expect((await flow()).namePrefill).toBe("Maya L.");
    reads.claimable = [];
    expect((await flow()).namePrefill).toBe("");
  });
});
