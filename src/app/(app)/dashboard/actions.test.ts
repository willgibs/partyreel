/**
 * THE GENERAL EVENT SAVE APPROVES HELD UPLOADS ONLY WHEN THE SAVE SAYS LIVE.
 *
 * `updateEventAction` runs `approveAllPending` whenever the parsed save carries
 * `moderation_mode: "live"` (the host's consent to live mode, enforced server-side). So the parsed
 * save must carry the mode only when the caller SENT it: a QR style save on an event under review
 * that parsed to `moderation_mode: "live"` would approve every held upload behind the host's back.
 * The mutations are mocked; what is pinned is the action's own decision and what it hands down.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const updateEvent = vi.fn();
const approveAllPending = vi.fn();
const captureError = vi.hoisted(() => vi.fn());

// A request-scoped client that records the one UPDATE a Server Function makes: its table, its patch and each
// filter chained after it, answering what `db.error` says.
const db = vi.hoisted(() => {
  const state = {
    user: { id: "host-1" } as { id: string } | null,
    error: null as unknown,
    calls: [] as { table: string; patch: unknown; filters: string[] }[],
  };
  const supabase = {
    from: (table: string) => ({
      update: (patch: unknown) => {
        const call = { table, patch, filters: [] as string[] };
        state.calls.push(call);
        const chain: Record<string, unknown> = {
          eq: (c: string, v: unknown) => (
            call.filters.push(`eq ${c} ${v}`),
            chain
          ),
          is: (c: string, v: unknown) => (
            call.filters.push(`is ${c} ${v}`),
            chain
          ),
          or: (f: string) => (call.filters.push(`or ${f}`), chain),
          then: (resolve: (v: unknown) => void) =>
            resolve({ error: state.error }),
        };
        return chain;
      },
    }),
  };
  return { state, supabase };
});

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("@/lib/supabase/request-auth", () => ({
  getRequestAuth: async () => ({ supabase: db.supabase, user: db.state.user }),
}));
vi.mock("@/lib/db/mutations/events", () => ({
  updateEvent: (...args: unknown[]) => updateEvent(...args),
  clearEventPassword: vi.fn(),
  clearEventSlug: vi.fn(),
  createEvent: vi.fn(),
  setEventPassword: vi.fn(),
  setEventSlug: vi.fn(),
  softDeleteEvent: vi.fn(),
}));
vi.mock("@/lib/db/mutations/media", () => ({
  approveAllPending: (...args: unknown[]) => approveAllPending(...args),
}));
vi.mock("@/lib/db/mutations/my-uploads", () => ({ removeMyUpload: vi.fn() }));
vi.mock("@/lib/db/mutations/social", () => ({
  setEventSocialSettings: vi.fn(),
}));
vi.mock("@/lib/observability/sentry", () => ({ captureError }));

const { noteEventOpenedAction, setEventsDisplayAction, updateEventAction } =
  await import("@/app/(app)/dashboard/actions");

beforeEach(() => {
  updateEvent.mockReset();
  approveAllPending.mockReset();
  captureError.mockReset();
  db.state.user = { id: "host-1" };
  db.state.error = null;
  db.state.calls = [];
  updateEvent.mockResolvedValue({ ok: true, data: { id: "event-1" } });
  approveAllPending.mockResolvedValue({ ok: true, data: { count: 0 } });
});

describe("updateEventAction: a one-field save is that field", () => {
  it("approves nothing when a review event saves its QR style", async () => {
    const result = await updateEventAction("event-1", { qr_style: "bold" });
    expect(result).toEqual({ ok: true });
    expect(updateEvent).toHaveBeenCalledWith("event-1", { qr_style: "bold" });
    expect(approveAllPending).not.toHaveBeenCalled();
  });

  it("hands the review room's switch down alone and approves nothing", async () => {
    await updateEventAction("event-1", {
      moderation_mode: "hold_for_approval",
    });
    expect(updateEvent).toHaveBeenCalledWith("event-1", {
      moderation_mode: "hold_for_approval",
    });
    expect(approveAllPending).not.toHaveBeenCalled();
  });

  it("approves the held uploads when the save turns live mode on", async () => {
    await updateEventAction("event-1", { moderation_mode: "live" });
    expect(approveAllPending).toHaveBeenCalledWith("event-1");
  });

  it("refuses a malformed save before it writes anything", async () => {
    const result = await updateEventAction("event-1", {
      qr_style: "neon" as never,
    });
    expect(result).toMatchObject({ ok: false, code: "validation" });
    expect(updateEvent).not.toHaveBeenCalled();
  });
});

/**
 * HER CHOICES, KEPT ON HER ACCOUNT (host-dashboard r3, `events=menu`, the carried `kept`): a public endpoint whose
 * payload is the caller's word, so it is narrowed to what the Display menu can mean, written sparse to her own row
 * and nowhere else, and a failure says so (and is reported once where failures are read).
 */
describe("setEventsDisplayAction", () => {
  it("writes only what differs from the defaults, to her own profile row", async () => {
    const result = await setEventsDisplayAction({
      layout: "table",
      sort: "date",
      desc: true,
      lens: "all",
    });
    expect(result).toEqual({ ok: true });
    expect(db.state.calls).toEqual([
      {
        table: "profiles",
        patch: { events_display: { layout: "table", sort: "date" } },
        filters: ["eq id host-1"],
      },
    ]);
  });

  it("★ narrows a forged payload: a stranger is a default, an unknown key is dropped, nothing else is stored", async () => {
    await setEventsDisplayAction({
      layout: "carousel",
      sort: "photos",
      year: "20x6",
      is_admin: true,
      tier: "pro",
      __proto__: { layout: "list" },
    });
    expect(db.state.calls[0]?.patch).toEqual({
      events_display: { sort: "photos" },
    });
    await setEventsDisplayAction("not even an object");
    expect(db.state.calls[1]?.patch).toEqual({ events_display: {} });
  });

  it("keeps Recent's fold with her choices", async () => {
    await setEventsDisplayAction({ recent: "folded" });
    expect(db.state.calls[0]?.patch).toEqual({
      events_display: { recent: "folded" },
    });
  });

  it("writes nothing for a signed-out caller", async () => {
    db.state.user = null;
    expect(await setEventsDisplayAction({ layout: "list" })).toEqual({
      ok: false,
      message: "Sign in and try again.",
    });
    expect(db.state.calls).toEqual([]);
  });

  it("says a failed save, and reports it once where failures are read", async () => {
    db.state.error = { message: "column does not exist" };
    const result = await setEventsDisplayAction({ layout: "list" });
    expect(result).toEqual({
      ok: false,
      message: "Couldn't keep that for your account. Please try again.",
    });
    expect(captureError).toHaveBeenCalledTimes(1);
    expect(captureError).toHaveBeenCalledWith("account", db.state.error, {
      seam: "events_display",
    });
  });
});

/**
 * AN EVENT OPENED, FOR THE RECENT ROW AND THE LAST OPENED ORDER (host-dashboard r3): one timestamp on the event
 * she pressed into, hers under RLS, at most once a minute, and nothing about it is ever the caller's to dictate.
 */
describe("noteEventOpenedAction", () => {
  const ID = "6f1c2c9e-5a3b-4d11-9a0a-1d2f3a4b5c6d";

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-10-04T10:00:00.000Z"));
  });

  it("stamps the server's own now on her live event, at most once a minute", async () => {
    await noteEventOpenedAction(ID);
    expect(db.state.calls).toEqual([
      {
        table: "events",
        patch: { host_opened_at: "2026-10-04T10:00:00.000Z" },
        filters: [
          `eq id ${ID}`,
          "is deleted_at null",
          "or host_opened_at.is.null,host_opened_at.lt.2026-10-04T09:59:00.000Z",
        ],
      },
    ]);
    expect(captureError).not.toHaveBeenCalled();
  });

  it("★ never takes a timestamp, a column or a table from the caller", async () => {
    await noteEventOpenedAction({ id: ID, host_opened_at: "2999-01-01" });
    await noteEventOpenedAction(`${ID}; drop table events`);
    await noteEventOpenedAction("not-a-uuid");
    await noteEventOpenedAction(undefined);
    await noteEventOpenedAction(7);
    expect(db.state.calls).toEqual([]);
  });

  it("writes nothing for a signed-out caller", async () => {
    db.state.user = null;
    await noteEventOpenedAction(ID);
    expect(db.state.calls).toEqual([]);
  });

  it("says a failed stamp once, and never throws into the press that caused it", async () => {
    db.state.error = { message: "column does not exist" };
    await expect(noteEventOpenedAction(ID)).resolves.toBeUndefined();
    expect(captureError).toHaveBeenCalledWith("db", db.state.error, {
      seam: "event_opened",
    });
  });
});
