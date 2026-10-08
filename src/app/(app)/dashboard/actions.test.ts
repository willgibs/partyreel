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
// filter chained after it, answering what `db.error` says; and the one profile read a keep makes first (`events_display`,
// answering what `db.stored` holds, or `db.readError`).
const db = vi.hoisted(() => {
  const state = {
    user: { id: "host-1" } as { id: string } | null,
    error: null as unknown,
    stored: {} as unknown,
    readError: null as unknown,
    calls: [] as { table: string; patch: unknown; filters: string[] }[],
    reads: [] as { table: string; columns: string; filters: string[] }[],
  };
  const supabase = {
    from: (table: string) => ({
      select: (columns: string) => {
        const read = { table, columns, filters: [] as string[] };
        state.reads.push(read);
        const chain: Record<string, unknown> = {
          eq: (c: string, v: unknown) => (
            read.filters.push(`eq ${c} ${v}`),
            chain
          ),
          maybeSingle: async () => ({
            data: state.readError ? null : { events_display: state.stored },
            error: state.readError,
          }),
        };
        return chain;
      },
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

const guests = vi.hoisted(() => ({
  event: vi.fn(),
  read: vi.fn(),
}));

vi.mock("server-only", () => ({}));
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
vi.mock("@/lib/db/queries/events", () => ({
  getEvent: (...args: unknown[]) => guests.event(...args),
}));
vi.mock("@/lib/db/queries/social", () => ({
  getEventGuests: (...args: unknown[]) => guests.read(...args),
}));
vi.mock("@/lib/observability/sentry", () => ({ captureError }));

const {
  createEventInWizard,
  noteEventOpenedAction,
  readStageGuestsAction,
  setEventsDisplayAction,
  setLeadRuleAction,
  updateEventAction,
} = await import("@/app/(app)/dashboard/actions");
const { createEvent } = await import("@/lib/db/mutations/events");

beforeEach(() => {
  updateEvent.mockReset();
  approveAllPending.mockReset();
  captureError.mockReset();
  db.state.user = { id: "host-1" };
  db.state.error = null;
  db.state.stored = {};
  db.state.readError = null;
  db.state.calls = [];
  db.state.reads = [];
  guests.event.mockReset();
  guests.read.mockReset();
  updateEvent.mockResolvedValue({ ok: true, data: { id: "event-1" } });
  approveAllPending.mockResolvedValue({ ok: true, data: { count: 0 } });
});

/**
 * ★ A CREATE'S KEY IS THE CALLER'S WORD (20261007120000, `events.create_key`): a public endpoint takes it as a second argument,
 * and only a uuid's shape reaches `createEvent` (a malformed one is refused here in the wizard's own words, never read as a
 * Postgres cast error), lower-cased so one attempt is one key; none sent is the create it always was. What the key does is
 * `lib/db/mutations/events-create-key.test.ts`'s and the migration's own check.
 */
describe("createEventInWizard: the attempt's key", () => {
  const FIRST = {
    id: "evt-first",
    name: "Maya's 30th",
    qr_token: "7f3a9c2e5b8d4f1a9e6c3b7d2a5f8e1c",
    qr_style: "classic",
    host_id: "host-1",
  };
  const KEY = "c2c20000-0000-4000-8000-0000000000a1";
  const INPUT = { name: "Maya's 30th" };

  beforeEach(() => {
    vi.mocked(createEvent).mockReset();
    vi.mocked(createEvent).mockResolvedValue({
      ok: true,
      data: FIRST,
    } as never);
  });

  it("★ hands the key down with the parsed values, so the retry returns the first event, and answers only what the beat draws", async () => {
    const result = await createEventInWizard(INPUT, KEY);
    expect(createEvent).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Maya's 30th" }),
      KEY,
    );
    expect(result).toEqual({
      ok: true,
      event: {
        id: "evt-first",
        name: "Maya's 30th",
        qr_token: FIRST.qr_token,
        qr_style: "classic",
      },
    });
  });

  it("lower-cases it, so one attempt is one key whatever spelling the caller used", async () => {
    await createEventInWizard(INPUT, KEY.toUpperCase());
    expect(vi.mocked(createEvent).mock.calls[0]![1]).toBe(KEY);
  });

  it("sends none down where none came (an older build, a specimen): the create it always was", async () => {
    await createEventInWizard(INPUT);
    expect(createEvent).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Maya's 30th" }),
      undefined,
    );
  });

  it.each([
    ["a string that is not a uuid", "not-a-uuid"],
    ["an empty string", ""],
    ["null", null],
    ["a number", 42],
    ["an object", { key: KEY }],
    ["a uuid with a tail", `${KEY}; drop table events`],
  ])("★ refuses %s before anything is made or read", async (_name, attempt) => {
    const result = await createEventInWizard(INPUT, attempt);
    expect(result).toMatchObject({ ok: false, code: "validation" });
    expect(createEvent).not.toHaveBeenCalled();
  });

  it("answers a refusal as it comes (the cap, a CHECK), so the wizard holds it in its own words", async () => {
    vi.mocked(createEvent).mockResolvedValue({
      ok: false,
      code: "limit_reached",
      message: "You've reached the event limit for your plan.",
    });
    expect(await createEventInWizard(INPUT, KEY)).toEqual({
      ok: false,
      code: "limit_reached",
      message: "You've reached the event limit for your plan.",
    });
  });
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

  it("★ keeps the stage's rule beside the menu's choices: a layout chosen after a rule never undoes it", async () => {
    db.state.stored = { layout: "list", lead: "photos" };
    await setEventsDisplayAction({ layout: "table" });
    expect(db.state.reads).toEqual([
      {
        table: "profiles",
        columns: "events_display",
        filters: ["eq id host-1"],
      },
    ]);
    expect(db.state.calls[0]?.patch).toEqual({
      events_display: { layout: "table", lead: "photos" },
    });
    // Reset (the menu's own defaults) leaves the rule where it was.
    await setEventsDisplayAction({});
    expect(db.state.calls[1]?.patch).toEqual({
      events_display: { lead: "photos" },
    });
  });

  it("★ never takes the rule from the menu's payload: the rule has one writer", async () => {
    await setEventsDisplayAction({ layout: "table", lead: "upcoming" });
    expect(db.state.calls[0]?.patch).toEqual({
      events_display: { layout: "table" },
    });
    db.state.stored = { lead: "photos" };
    await setEventsDisplayAction({ lead: "upcoming" });
    expect(db.state.calls[1]?.patch).toEqual({
      events_display: { lead: "photos" },
    });
  });

  it("writes nothing, and says so, when it cannot read the rule it must keep", async () => {
    db.state.readError = { message: "boom" };
    expect(await setEventsDisplayAction({ layout: "list" })).toEqual({
      ok: false,
      message: "Couldn't keep that for your account. Please try again.",
    });
    expect(db.state.calls).toEqual([]);
    expect(captureError).toHaveBeenCalledWith("account", db.state.readError, {
      seam: "events_display",
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
 * HER STAGE'S RULE, KEPT ON HER ACCOUNT (host-dashboard r4, `chooser=words`): a public endpoint whose value is the
 * caller's word, so only one of the four rules is written, to her own row, beside the menu's choices (read back through
 * the page's own narrowing) and sparse (the default is no key).
 */
describe("setLeadRuleAction", () => {
  it("keeps the rule beside the menu's choices, in her own profile row and nowhere else", async () => {
    db.state.stored = { layout: "table", sort: "date", recent: "folded" };
    expect(await setLeadRuleAction("upcoming")).toEqual({ ok: true });
    expect(db.state.reads).toEqual([
      {
        table: "profiles",
        columns: "events_display",
        filters: ["eq id host-1"],
      },
    ]);
    expect(db.state.calls).toEqual([
      {
        table: "profiles",
        patch: {
          events_display: {
            layout: "table",
            sort: "date",
            recent: "folded",
            lead: "upcoming",
          },
        },
        filters: ["eq id host-1"],
      },
    ]);
  });

  it("keeps the default as no key, so a default changed later reaches whoever never chose", async () => {
    db.state.stored = { layout: "table", lead: "photos" };
    await setLeadRuleAction("newest");
    expect(db.state.calls[0]?.patch).toEqual({
      events_display: { layout: "table" },
    });
  });

  it("★ refuses anything that is not one of the four rules, before it reads or writes", async () => {
    for (const forged of [
      "",
      "UPCOMING",
      "photos ",
      "__proto__",
      null,
      undefined,
      7,
      {},
      ["opened"],
      { toString: () => "opened" },
    ]) {
      expect(await setLeadRuleAction(forged)).toEqual({
        ok: false,
        message: "That isn't a way to lead.",
      });
    }
    expect(db.state.reads).toEqual([]);
    expect(db.state.calls).toEqual([]);
  });

  it("★ drops a stranger the column holds as it rewrites it: a forged key or value is never carried", async () => {
    db.state.stored = {
      layout: "carousel",
      sort: "photos",
      is_admin: true,
      lead: "everything",
    };
    await setLeadRuleAction("opened");
    expect(db.state.calls[0]?.patch).toEqual({
      events_display: { sort: "photos", lead: "opened" },
    });
  });

  it("writes nothing for a signed-out caller", async () => {
    db.state.user = null;
    expect(await setLeadRuleAction("photos")).toEqual({
      ok: false,
      message: "Sign in and try again.",
    });
    expect(db.state.reads).toEqual([]);
    expect(db.state.calls).toEqual([]);
  });

  it("says a failed keep, and reports it once where failures are read, on the read and on the write", async () => {
    db.state.readError = { message: "boom" };
    const failed = {
      ok: false,
      message: "Couldn't keep that for your account. Please try again.",
    };
    expect(await setLeadRuleAction("photos")).toEqual(failed);
    expect(db.state.calls).toEqual([]);
    expect(captureError).toHaveBeenLastCalledWith(
      "account",
      db.state.readError,
      {
        seam: "lead_rule",
      },
    );
    db.state.readError = null;
    db.state.error = { message: "column does not exist" };
    expect(await setLeadRuleAction("photos")).toEqual(failed);
    expect(captureError).toHaveBeenLastCalledWith("account", db.state.error, {
      seam: "lead_rule",
    });
    expect(captureError).toHaveBeenCalledTimes(2);
  });
});

/**
 * WHO CAME, FOR A STAGE A RULE JUST MOVED (host-dashboard r4): the guests are read on the service role, so the event
 * must be proved the caller's own first, and nobody else's, a gone event's or a malformed id's is simply null.
 */
describe("readStageGuestsAction", () => {
  const ID = "6f1c2c9e-5a3b-4d11-9a0a-1d2f3a4b5c6d";

  it("counts the guests of her own live event, as the album says them", async () => {
    guests.event.mockResolvedValue({ id: ID });
    guests.read.mockResolvedValue({
      verifiedUserIds: ["a", "b"],
      unverifiedRows: [{ id: "g", displayName: "Sam" }],
    });
    expect(await readStageGuestsAction(ID)).toBe(3);
    expect(guests.event).toHaveBeenCalledWith(ID);
    expect(guests.read).toHaveBeenCalledWith(ID);
  });

  it("★ reads nobody's guests for an event that is not hers, gone, or not an id", async () => {
    guests.event.mockResolvedValue(null);
    expect(await readStageGuestsAction(ID)).toBeNull();
    expect(await readStageGuestsAction(undefined)).toBeNull();
    expect(await readStageGuestsAction({ id: ID })).toBeNull();
    expect(guests.read).not.toHaveBeenCalled();
  });

  it("answers null and says so once when a read fails, never throwing into the stage", async () => {
    const boom = new Error("boom");
    guests.event.mockResolvedValue({ id: ID });
    guests.read.mockRejectedValue(boom);
    expect(await readStageGuestsAction(ID)).toBeNull();
    expect(captureError).toHaveBeenCalledWith("db", boom, {
      seam: "dashboard_stage_guests",
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
