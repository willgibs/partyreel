/**
 * ★ WHAT EACH `cloud_*` CALL PUTS ON THE WIRE, now that its arguments are typed. The generated Args can say neither
 * "takes null" nor "has no default", and PostgREST finds a function by the names it is sent: a key an argument
 * WITHOUT a default leaves out is a 404 (PGRST202), never a null, so those carry their null as a null; an argument WITH
 * a default is left out when it has nothing to say, and the default (null) applies. Held against the functions' own
 * signatures (the migrations), over the stubbed service-role client, read as it is serialised: an `undefined` is no key
 * on the wire. A real zero is a value, never "nothing to say".
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

import { liveFunction } from "@/lib/db/testing/migrations";

const rpc = vi.fn();

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({ rpc: (...args: unknown[]) => rpc(...args) }),
}));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({}) }));

const drive = await import("@/lib/db/queries/drive");

const ID = "00000000-0000-4000-8000-000000000001";
const AT = "2026-10-05T12:00:00.000Z";

beforeEach(() => {
  rpc.mockReset();
  rpc.mockResolvedValue({ data: {}, error: null });
});

/** A function's arguments as the migrations declare them, and whether each has to be sent (it has no default). */
function declared(fn: string): { arg: string; required: boolean }[] {
  return liveFunction(fn)
    .params.split(/,\s*(?=p_)/)
    .filter((part) => part.trim() !== "")
    .map((part) => ({
      arg: part.trim().split(/\s+/)[0]!,
      required: !/\bdefault\b/i.test(part),
    }));
}

/** The last call's function and the JSON body PostgREST receives for it. */
function sent(): { fn: string; body: Record<string, unknown> } {
  const [fn, args] = rpc.mock.calls.at(-1)!;
  return { fn, body: JSON.parse(JSON.stringify(args ?? {})) };
}

type Case = {
  title: string;
  fn: string;
  call: () => Promise<unknown>;
  wire: Record<string, unknown>;
};

const upsert = {
  userId: ID,
  sub: "google-sub",
  email: null,
  emailVerified: false,
  name: null,
  scopes: ["https://www.googleapis.com/auth/drive.file"],
  refreshCt: "refresh-ct",
  accessCt: "access-ct",
  accessExpiresAt: AT,
  refreshExpiresAt: null,
};
const upsertWire = {
  p_user: ID,
  p_sub: "google-sub",
  p_email: null,
  p_email_verified: false,
  p_name: null,
  p_scopes: ["https://www.googleapis.com/auth/drive.file"],
  p_refresh_ct: "refresh-ct",
  p_access_ct: "access-ct",
  p_access_expires_at: AT,
  p_refresh_expires_at: null,
};

const CASES: Case[] = [
  // The arguments with no default, sent as the nulls they are.
  {
    title:
      "a connection with no address, no name and no refresh expiry sends all three as null",
    fn: "cloud_connection_upsert",
    call: () => drive.upsertConnection(upsert),
    wire: upsertWire,
  },
  {
    title: "a Drive with no quota limit says so as null",
    fn: "cloud_connection_room",
    call: () =>
      drive.recordRoom({
        connectionId: ID,
        limit: null,
        usage: 5,
        resume: false,
      }),
    wire: { p_connection: ID, p_limit: null, p_usage: 5, p_resume: false },
  },
  {
    title: "a limit of 0 is a limit, not an absent one",
    fn: "cloud_connection_room",
    call: () =>
      drive.recordRoom({
        connectionId: ID,
        limit: 0,
        usage: 0,
        resume: true,
      }),
    wire: { p_connection: ID, p_limit: 0, p_usage: 0, p_resume: true },
  },
  {
    title:
      "a root claim with no candidate and nothing expected sends both as null",
    fn: "cloud_connection_root",
    call: () =>
      drive.claimRoot({ connectionId: ID, candidate: null, expected: null }),
    wire: { p_connection: ID, p_candidate: null, p_expected: null },
  },
  {
    title:
      "an operator's act names no account: p_user goes as null beside p_operator",
    fn: "cloud_export_act",
    call: () =>
      drive.actOnSend({
        userId: null,
        jobId: ID,
        act: "cancel",
        operator: true,
      }),
    wire: { p_user: null, p_job: ID, p_act: "cancel", p_operator: true },
  },
  // The arguments with a default, left out when there is nothing to say.
  {
    title:
      "a refresh that brought no new refresh token leaves p_refresh_ct out",
    fn: "cloud_connection_refreshed",
    call: () =>
      drive.recordRefreshed({
        connectionId: ID,
        accessCt: "access-ct",
        accessExpiresAt: AT,
        refreshCt: null,
      }),
    wire: {
      p_connection: ID,
      p_access_ct: "access-ct",
      p_access_expires_at: AT,
    },
  },
  {
    title: "a refresh that rotated the refresh token sends it",
    fn: "cloud_connection_refreshed",
    call: () =>
      drive.recordRefreshed({
        connectionId: ID,
        accessCt: "access-ct",
        accessExpiresAt: AT,
        refreshCt: "rotated-ct",
      }),
    wire: {
      p_connection: ID,
      p_access_ct: "access-ct",
      p_access_expires_at: AT,
      p_refresh_ct: "rotated-ct",
    },
  },
  {
    title: "an operator's act with no note leaves p_note out",
    fn: "cloud_connection_operator",
    call: () => drive.operatorOnConnection(ID, "pause"),
    wire: { p_connection: ID, p_act: "pause" },
  },
  {
    title: "an operator's note is sent as it was written",
    fn: "cloud_connection_operator",
    call: () => drive.operatorOnConnection(ID, "lift_breaker", "asked by mail"),
    wire: { p_connection: ID, p_act: "lift_breaker", p_note: "asked by mail" },
  },
  {
    title:
      "a report with no finding leaves p_finding out and still says whether the lane is done",
    fn: "cloud_export_report",
    call: () =>
      drive.reportWork({
        lease: ID,
        items: [{ media_id: ID, outcome: "released" }],
        finding: null,
        done: false,
      }),
    wire: {
      p_lease: ID,
      p_items: [{ media_id: ID, outcome: "released" }],
      p_done: false,
    },
  },
  {
    title: "a report's finding is sent",
    fn: "cloud_export_report",
    call: () =>
      drive.reportWork({
        lease: ID,
        items: [],
        finding: "drive_full",
        done: true,
      }),
    wire: { p_lease: ID, p_items: [], p_finding: "drive_full", p_done: true },
  },
  {
    title:
      "a check page with no duplicates count and no finding leaves both out",
    fn: "cloud_export_check_page",
    call: () =>
      drive.reportCheckPage({
        lease: ID,
        results: [],
        duplicates: null,
        finding: null,
      }),
    wire: { p_lease: ID, p_results: [] },
  },
  {
    title: "a duplicates count of 0 is a count, not an absent one",
    fn: "cloud_export_check_page",
    call: () =>
      drive.reportCheckPage({
        lease: ID,
        results: [{ media_id: ID, state: "found" }],
        duplicates: 0,
        finding: "drive_full",
      }),
    wire: {
      p_lease: ID,
      p_results: [{ media_id: ID, state: "found" }],
      p_duplicates: 0,
      p_finding: "drive_full",
    },
  },
];

describe("what each cloud_* call puts on the wire", () => {
  it.each(CASES)("★ $title", async ({ fn, call, wire }) => {
    await call();
    expect(rpc).toHaveBeenCalledTimes(1);
    const { fn: called, body } = sent();
    expect(called).toBe(fn);
    expect(body).toEqual(wire);

    // And the function's own signature agrees: every argument with no default is on the wire (null or not), and no
    // key names an argument the function does not have.
    const args = declared(fn);
    for (const { arg, required } of args) {
      if (required) expect(Object.keys(body), arg).toContain(arg);
    }
    for (const key of Object.keys(body)) {
      expect(
        args.map((a) => a.arg),
        key,
      ).toContain(key);
    }
  });

  it("★ the sweep takes no arguments, so it is called with none", async () => {
    await drive.sweepSends();
    expect(rpc).toHaveBeenCalledTimes(1);
    expect(rpc.mock.calls[0]).toEqual(["cloud_export_sweep"]);
    expect(declared("cloud_export_sweep")).toEqual([]);
  });
});
