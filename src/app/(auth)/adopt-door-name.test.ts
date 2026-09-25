/**
 * THE TYPED NAME SURVIVES THE MAGIC LINK, AND OVERWRITES NOTHING (lp/identity-email).
 *
 *   - a nameless profile takes the door's name, validated like any typed name, through a write
 *     conditioned on the column still being null;
 *   - a named profile, a reserved, profane or overlong name, and a value that is not a string are
 *     never written;
 *   - the stored copy is cleared in every one of those cases, and left alone when there is none;
 *   - it never throws: a failure is captured and the sign-in goes on.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

type Update = {
  values: Record<string, unknown>;
  filters: [string, string, unknown][];
};

const state = vi.hoisted(() => ({
  user: null as null | { id: string; user_metadata?: Record<string, unknown> },
  profile: { display_name: null } as { display_name: string | null } | null,
  readError: null as { message: string } | null,
  updates: [] as Update[],
  cleared: [] as { id: string; attrs: unknown }[],
  captureError: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/observability/sentry", () => ({
  captureError: state.captureError,
}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: {
      getUser: async () => ({ data: { user: state.user }, error: null }),
    },
  }),
}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({
            data: state.readError ? null : state.profile,
            error: state.readError,
          }),
        }),
      }),
      update: (values: Record<string, unknown>) => {
        const update: Update = { values, filters: [] };
        state.updates.push(update);
        const chain = {
          eq: (c: string, v: unknown) => {
            update.filters.push(["eq", c, v]);
            return chain;
          },
          is: (c: string, v: unknown) => {
            update.filters.push(["is", c, v]);
            return Promise.resolve({ error: null });
          },
        };
        return chain;
      },
    }),
    auth: {
      admin: {
        updateUserById: async (id: string, attrs: unknown) => {
          state.cleared.push({ id, attrs });
          return { error: null };
        },
      },
    },
  }),
}));

const { adoptDoorName } = await import("./adopt-door-name");

const CLEAR = { id: "user-1", attrs: { user_metadata: { door_name: null } } };

beforeEach(() => {
  state.user = { id: "user-1", user_metadata: { door_name: "Maya J." } };
  state.profile = { display_name: null };
  state.readError = null;
  state.updates = [];
  state.cleared = [];
  state.captureError.mockClear();
});

describe("adoptDoorName", () => {
  it("names a nameless profile, only while it is still nameless, then clears the copy", async () => {
    await adoptDoorName();
    expect(state.updates).toEqual([
      {
        values: { display_name: "Maya J." },
        filters: [
          ["eq", "id", "user-1"],
          ["is", "display_name", null],
        ],
      },
    ]);
    expect(state.cleared).toEqual([CLEAR]);
  });

  it("never overwrites a name, and still clears the copy", async () => {
    state.profile = { display_name: "Already Named" };
    await adoptDoorName();
    expect(state.updates).toEqual([]);
    expect(state.cleared).toEqual([CLEAR]);
  });

  it.each([
    ["a reserved name", "admin"],
    ["profanity", "fuckface"],
    ["an overlong name", "x".repeat(61)],
    ["a blank", "   "],
  ])(
    "refuses %s the way the account form would, and clears it",
    async (_, name) => {
      state.user = { id: "user-1", user_metadata: { door_name: name } };
      await adoptDoorName();
      expect(state.updates).toEqual([]);
      expect(state.cleared).toEqual([CLEAR]);
    },
  );

  it("refuses a value that is not a string (the metadata is client-writable)", async () => {
    state.user = { id: "user-1", user_metadata: { door_name: { name: "x" } } };
    await adoptDoorName();
    expect(state.updates).toEqual([]);
    expect(state.cleared).toEqual([CLEAR]);
  });

  it("does nothing at all without a stored name, or without a user", async () => {
    state.user = { id: "user-1", user_metadata: { full_name: "Google Name" } };
    await adoptDoorName();
    state.user = null;
    await adoptDoorName();
    expect(state.updates).toEqual([]);
    expect(state.cleared).toEqual([]);
  });

  it("captures a failed read instead of throwing, and leaves the copy for a later link", async () => {
    state.readError = { message: "connection reset" };
    await expect(adoptDoorName()).resolves.toBeUndefined();
    expect(state.updates).toEqual([]);
    expect(state.cleared).toEqual([]);
    expect(state.captureError).toHaveBeenCalledTimes(1);
  });
});
