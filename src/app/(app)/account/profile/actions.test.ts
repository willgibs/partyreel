/**
 * THE PAGE SETUP'S FINISH, AND THE INVITATION'S NOT NOW (`identity-profile` r1).
 *
 *   ★ getUser() first: signed out, nothing is read or written.
 *   ★ The handle's rules run before any choice is written, and a page that already exists is never
 *     re-claimed from a stale wizard.
 *   ★ The one-time choice is applied to the events she has AT FINISH, read on the server: `all` and
 *     `none` are modes, `chosen` is intersected with her own events, so a stranger's id writes
 *     nothing.
 *   ★ THE ORDER IS THE PRIVACY: her choices are written before the handle is claimed, because the
 *     handle is what makes the page exist. A failed choice claims nothing.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  user: { id: "user-1" } as null | { id: string },
  slug: null as string | null,
  attended: [] as {
    id: string;
    shownOnProfile: boolean;
  }[],
  calls: [] as string[],
  apply: vi.fn(),
  claim: vi.fn(),
  revalidatePath: vi.fn(),
  cookieSet: vi.fn(),
  capture: vi.fn(),
  readFails: false,
}));

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: state.revalidatePath }));
vi.mock("next/headers", () => ({
  cookies: async () => ({ set: state.cookieSet }),
}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: {
      getUser: async () => ({ data: { user: state.user }, error: null }),
    },
  }),
}));
vi.mock("@/lib/avatar/seed", () => ({ seedFor: (id: string) => `seed:${id}` }));
vi.mock("@/lib/db/queries/social", () => ({
  getMyProfileSlug: async () => state.slug,
  getMyAttendedEvents: async () => {
    if (state.readFails) throw new Error("connection reset");
    return state.attended;
  },
}));
vi.mock("@/lib/observability/sentry", () => ({ captureError: state.capture }));
vi.mock("@/lib/db/mutations/social", () => ({
  applyShownEvents: (choice: { show: string[]; hide: string[] }) => {
    state.calls.push("events");
    return state.apply(choice);
  },
}));
vi.mock("@/app/(app)/account/social-actions", () => ({
  setProfileSlugAction: (slug: string) => {
    state.calls.push("handle");
    return state.claim(slug);
  },
}));

const { dismissPageInviteAction, finishProfileSetupAction } =
  await import("./actions");

const A = "11111111-1111-4111-8111-111111111111";
const B = "22222222-2222-4222-8222-222222222222";
const C = "33333333-3333-4333-8333-333333333333";
const STRANGER = "99999999-9999-4999-8999-999999999999";

beforeEach(() => {
  state.user = { id: "user-1" };
  state.slug = null;
  state.attended = [
    { id: A, shownOnProfile: false },
    { id: B, shownOnProfile: true },
    { id: C, shownOnProfile: false },
  ];
  state.calls = [];
  state.apply.mockReset();
  state.apply.mockResolvedValue({ ok: true, data: { shown: 0, hidden: 0 } });
  state.claim.mockReset();
  state.claim.mockResolvedValue({ ok: true });
  state.revalidatePath.mockReset();
  state.cookieSet.mockReset();
  state.capture.mockReset();
  state.readFails = false;
});

describe("finishProfileSetupAction refuses before it writes", () => {
  it("signed out: nothing read, nothing written", async () => {
    state.user = null;
    const result = await finishProfileSetupAction({
      slug: "priya",
      events: { mode: "all" },
    });
    expect(result.ok).toBe(false);
    expect(state.calls).toEqual([]);
  });

  it("a malformed request writes nothing", async () => {
    for (const input of [
      null,
      { slug: "priya" },
      { slug: "priya", events: { mode: "everything" } },
      { slug: "priya", events: { mode: "chosen", eventIds: ["not-a-uuid"] } },
    ]) {
      const result = await finishProfileSetupAction(input);
      expect(result.ok).toBe(false);
    }
    expect(state.calls).toEqual([]);
  });

  it("a handle a save would refuse writes no choice either", async () => {
    const result = await finishProfileSetupAction({
      slug: "admin",
      events: { mode: "all" },
    });
    expect(result).toMatchObject({ ok: false, step: "handle" });
    expect(state.calls).toEqual([]);
  });

  it("a failed read is answered in words and captured, never thrown into the page", async () => {
    state.readFails = true;
    const result = await finishProfileSetupAction({
      slug: "priya",
      events: { mode: "all" },
    });
    expect(result).toMatchObject({ ok: false, step: "events" });
    expect(state.capture).toHaveBeenCalled();
    expect(state.calls).toEqual([]);
  });

  it("a page that already exists is never re-claimed from a stale wizard", async () => {
    state.slug = "priya";
    const result = await finishProfileSetupAction({
      slug: "someone-else",
      events: { mode: "all" },
    });
    expect(result).toMatchObject({ ok: false, step: "done" });
    expect(state.calls).toEqual([]);
  });
});

describe("the one-time choice, applied to the events she has at Finish", () => {
  it("show all publishes every event not yet shown, and takes nothing back", async () => {
    await finishProfileSetupAction({ slug: "priya", events: { mode: "all" } });
    expect(state.apply).toHaveBeenCalledWith({ show: [A, C], hide: [] });
  });

  it("keep all private takes back what was shown, and publishes nothing", async () => {
    await finishProfileSetupAction({ slug: "priya", events: { mode: "none" } });
    expect(state.apply).toHaveBeenCalledWith({ show: [], hide: [B] });
  });

  it("chosen is intersected with her own events: a stranger's id writes nothing", async () => {
    await finishProfileSetupAction({
      slug: "priya",
      events: { mode: "chosen", eventIds: [C, STRANGER] },
    });
    expect(state.apply).toHaveBeenCalledWith({ show: [C], hide: [B] });
  });
});

describe("the order is the privacy", () => {
  it("writes her choices, then claims the handle, then answers with the page's address", async () => {
    const result = await finishProfileSetupAction({
      slug: "  Priya ",
      events: { mode: "all" },
    });
    expect(state.calls).toEqual(["events", "handle"]);
    expect(state.claim).toHaveBeenCalledWith("priya");
    expect(result).toEqual({ ok: true, slug: "priya" });
    expect(state.revalidatePath).toHaveBeenCalledWith("/dashboard");
    expect(state.revalidatePath).toHaveBeenCalledWith("/u/[slug]", "page");
  });

  it("a choice that fails to save claims no handle", async () => {
    state.apply.mockResolvedValue({
      ok: false,
      code: "unknown",
      message: "Couldn't save what shows on your page. Please try again.",
    });
    const result = await finishProfileSetupAction({
      slug: "priya",
      events: { mode: "all" },
    });
    expect(result).toMatchObject({ ok: false, step: "events" });
    expect(state.calls).toEqual(["events"]);
  });

  it("a handle taken since screen one sends her back to it, marked taken", async () => {
    state.claim.mockResolvedValue({
      ok: false,
      message: "That handle is already taken.",
      taken: true,
    });
    const result = await finishProfileSetupAction({
      slug: "priya",
      events: { mode: "none" },
    });
    expect(result).toEqual({
      ok: false,
      step: "handle",
      message: "That handle is already taken.",
      taken: true,
    });
    expect(state.revalidatePath).not.toHaveBeenCalled();
  });
});

describe("dismissPageInviteAction", () => {
  it("remembers Not now for this account, httpOnly, on this device", async () => {
    await expect(dismissPageInviteAction()).resolves.toEqual({ ok: true });
    expect(state.cookieSet).toHaveBeenCalledWith(
      "pr_page_invite",
      "seed:user-1",
      expect.objectContaining({ httpOnly: true, sameSite: "lax", path: "/" }),
    );
  });

  it("signed out, sets nothing", async () => {
    state.user = null;
    await expect(dismissPageInviteAction()).resolves.toEqual({ ok: false });
    expect(state.cookieSet).not.toHaveBeenCalled();
  });
});
