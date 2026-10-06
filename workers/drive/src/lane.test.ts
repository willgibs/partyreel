/**
 * A LANE'S SLICE AND HOW EACH ONE ENDS (drive-export.md, "Lanes, per connection"), against a scripted app, a fake
 * Drive and a fake bucket: a lane told to wait, pause, stop or idle acks and ends without re-queuing itself (a busy or
 * paused connection costs nothing); only Google's "slow down" and an app that cannot answer re-queue, each delayed; a
 * stop mid-batch ends the lane within its next report, a big file's at its next chunk; a slice's end sends the lane to
 * the back of the queue. ★ And against a model of the app's own transitions (`testing/fake-app.ts`): a batch's end is
 * one word, the closing check really runs before a send is done (the walk's first send said "every one checked" of a
 * check that never ran), and a "slow down" on a file's bytes costs the file none of its five attempts.
 */
import { describe, expect, it } from "vitest";

import type { AppClient, ReportAnswer, Unreachable } from "./app-client";
import { DriveError, driveAdapter } from "./google-drive";
import {
  CHECK_HELD_DELAY_S,
  REPORT_EVERY_MS,
  runSlice,
  SLICE_MS,
  THROTTLE_DELAY_S,
  type LaneDeps,
  type LaneMessage,
} from "./lane";
import type {
  CheckResult,
  LeaseAnswer,
  LeaseItem,
  ReportItem,
} from "./protocol";
import { FakeApp } from "./testing/fake-app";
import {
  FakeBucket,
  bytesOf,
  fixedLengthOf,
  md5OfStream,
} from "./testing/fake-bucket";
import { FakeDrive } from "./testing/fake-drive";

const SECRET = "drive-vector-secret";
const CONNECTION = "33333333-4444-4555-8666-777777777777";
const LEASE = "11111111-2222-4333-8444-555555555555";
// The pinned vector's sealed token, for LEASE (protocol.test.ts).
const SEALED =
  "AAECAwQFBgcICQoL.aMw-A8qgcjRVADPQGL_vMXpkVNCx3Mg9YHD3mtjp2jtfY1kX6Hnq53bRVA";

function item(n: number, bucket: FakeBucket): LeaseItem {
  const mediaId = `66666666-7777-4888-9999-${String(n).padStart(12, "0")}`;
  const key = `events/e/photo/${mediaId}/original.jpg`;
  bucket.put(key, bytesOf(1000 + n, n));
  return {
    mediaId,
    key,
    bytes: 1000 + n,
    contentType: "image/jpeg",
    name: `photo ${n}.jpg`,
    description: "From Partyreel.",
    modifiedTime: "2026-09-12T20:14:05.000Z",
    attempts: 1,
    priorFileId: null,
    lookUp: false,
    session: null,
  };
}

type Scripted = {
  leases: (LeaseAnswer | Unreachable)[];
  /** Answers to reports, in order (ok when the list runs out). */
  reportAnswers?: (ReportAnswer | Unreachable)[];
};

function harness(script: Scripted) {
  const drive = new FakeDrive();
  const bucket = new FakeBucket();
  const reports: {
    lease: string;
    items: ReportItem[];
    finding?: string;
    done?: boolean;
  }[] = [];
  const checks: {
    results: CheckResult[];
    duplicates?: number;
    finding?: string;
  }[] = [];
  const requeued: { delay?: number }[] = [];
  let clock = 5_000_000;
  const app: AppClient = {
    lease: async () => script.leases.shift() ?? { state: "idle" },
    report: async (input) => {
      reports.push(input);
      return script.reportAnswers?.shift() ?? { state: "ok" };
    },
    check: async (input) => {
      checks.push(input);
      return { state: "ok" };
    },
    laneFail: async () => true,
    sweep: async () => ({ kick: [] }),
  };
  const deps: LaneDeps = {
    app,
    drive: driveAdapter(drive.fetch, () => clock),
    bucket,
    secret: SECRET,
    requeue: async (_m: LaneMessage, delay?: number) => {
      requeued.push({ delay });
    },
    fixedLength: fixedLengthOf,
    md5Of: md5OfStream,
    now: () => clock,
    sleep: async (ms) => {
      clock += ms;
    },
    random: () => 0.5,
    spent: () => 0,
  };
  return {
    drive,
    bucket,
    reports,
    checks,
    requeued,
    deps,
    tick: (ms: number) => (clock += ms),
  };
}

const message: LaneMessage = { v: 1, connectionId: CONNECTION };

function work(items: LeaseItem[]): LeaseAnswer {
  return {
    state: "work",
    lease: LEASE,
    until: "x",
    jobId: "job",
    folderId: "album",
    token: SEALED,
    items,
  };
}

describe("a lane's slice", () => {
  it("★ ends without re-queuing itself when told to wait, pause, stop or idle", async () => {
    for (const state of ["wait", "paused", "stopped", "idle"] as const) {
      const h = harness({ leases: [{ state }] });
      expect(await runSlice(h.deps, message)).toBe(state);
      expect(h.requeued).toEqual([]);
    }
  });

  it("re-queues itself delayed when Google said slow down, and 60 s on when the app cannot answer", async () => {
    const slow = harness({
      leases: [
        {
          state: "throttled",
          until: new Date(5_000_000 + 90_000).toISOString(),
        },
      ],
    });
    expect(await runSlice(slow.deps, message)).toBe("throttled");
    expect(slow.requeued).toEqual([{ delay: 90 }]);

    const down = harness({ leases: [{ state: "unreachable", status: 503 }] });
    expect(await runSlice(down.deps, message)).toBe("app_down");
    expect(down.requeued).toEqual([{ delay: 60 }]);
  });

  it("sends a batch, reports what went with the lease ended, and leases again", async () => {
    const h = harness({ leases: [] });
    h.deps.app.lease = async () =>
      h.reports.length === 0
        ? work([item(1, h.bucket), item(2, h.bucket)])
        : { state: "idle" };
    expect(await runSlice(h.deps, message)).toBe("idle");
    const last = h.reports.at(-1)!;
    expect(last.done).toBe(true);
    expect(
      h.reports.flatMap((r) => r.items).filter((i) => i.outcome === "sent"),
    ).toHaveLength(2);
    expect(h.drive.files.size).toBe(2);
  });

  it("reports at least every 10 seconds while a batch runs", async () => {
    const h = harness({ leases: [] });
    const items = [item(1, h.bucket), item(2, h.bucket), item(3, h.bucket)];
    h.deps.app.lease = async () =>
      h.reports.length === 0 ? work(items) : { state: "idle" };
    const inner = h.deps.bucket.head.bind(h.deps.bucket);
    h.deps.bucket = {
      ...h.deps.bucket,
      read: h.bucket.read.bind(h.bucket),
      head: async (k: string) => (h.tick(REPORT_EVERY_MS), inner(k)),
    };
    await runSlice(h.deps, message);
    expect(h.reports.length).toBeGreaterThanOrEqual(3);
  });

  it("★ stops within its next report when the send is canceled, the rest given back", async () => {
    const h = harness({ leases: [], reportAnswers: [{ state: "stop" }] });
    const items = [item(1, h.bucket), item(2, h.bucket), item(3, h.bucket)];
    h.deps.app.lease = async () => work(items);
    const inner = h.deps.bucket.head.bind(h.deps.bucket);
    h.deps.bucket = {
      ...h.deps.bucket,
      read: h.bucket.read.bind(h.bucket),
      head: async (k: string) => (h.tick(REPORT_EVERY_MS), inner(k)),
    };
    expect(await runSlice(h.deps, message)).toBe("stop");
    expect(h.requeued).toEqual([]);
    expect(h.reports.at(-1)!.done).toBe(true);
    expect(h.drive.files.size).toBeLessThan(3);
  });

  it("goes to the back of the queue when its slice is out, with no delay", async () => {
    const h = harness({ leases: [] });
    h.deps.app.lease = async () => {
      h.tick(SLICE_MS);
      return work([item(1, h.bucket)]);
    };
    expect(await runSlice(h.deps, message)).toBe("sliced");
    expect(h.requeued).toEqual([{ delay: undefined }]);
  });

  it("ends on a finding about her Drive, the finding reported with the lease ended", async () => {
    const h = harness({ leases: [] });
    h.drive.failures.quota = true;
    h.deps.app.lease = async () => work([item(1, h.bucket), item(2, h.bucket)]);
    expect(await runSlice(h.deps, message)).toBe("finding");
    expect(h.reports.at(-1)).toMatchObject({
      finding: "drive_full",
      done: true,
    });
    expect(h.requeued).toEqual([]);
  });

  it("slows down on a 'slow down' that will not let up: the finding, then itself re-queued two minutes on", async () => {
    const h = harness({ leases: [] });
    h.drive.failures.rate = 1000;
    h.deps.app.lease = async () => work([item(1, h.bucket)]);
    expect(await runSlice(h.deps, message)).toBe("throttled");
    expect(h.reports.at(-1)).toMatchObject({
      finding: "throttled",
      done: true,
    });
    expect(h.requeued).toEqual([{ delay: 120 }]);
  });

  it("★ a 'slow down' on a file's bytes is Google's pacing, never the file's failure: given back with its attempt not counted, then sent", async () => {
    const h = harness({ leases: [] });
    h.drive.add({ id: "album", size: 0 });
    const items = [item(1, h.bucket), item(2, h.bucket)];
    const app = new FakeApp(items);
    h.deps.app = app;
    h.drive.failures.throttlePuts = 1000;
    expect(await runSlice(h.deps, message)).toBe("throttled");
    expect(h.requeued).toEqual([{ delay: 120 }]);
    for (const i of items)
      expect(app.items.get(i.mediaId)).toMatchObject({
        status: "pending",
        attempts: 0,
      });
    const said = app.said.flatMap((w) => (w.kind === "report" ? w.items : []));
    expect(said.some((w) => w.outcome === "failed")).toBe(false);

    // Google lets up: the slice the queue brings back sends both, each on its first counted attempt, and checks them.
    h.drive.failures.throttlePuts = 0;
    expect(await runSlice(h.deps, message)).toBe("idle");
    for (const i of items)
      expect(app.items.get(i.mediaId)).toMatchObject({
        status: "sent",
        attempts: 1,
      });
    expect(app.status).toBe("done");
    expect(h.drive.files.size).toBe(3);
  });

  it("★ a big file Google slowed for good resumes its own session on the slice after, never sending a landed chunk again", async () => {
    const h = harness({ leases: [] });
    h.drive.add({ id: "album", size: 0 });
    h.deps.chunkBytes = 4096;
    const big = item(9, h.bucket);
    const bytes = bytesOf(10_000, 9);
    h.bucket.put(big.key, bytes);
    const app = new FakeApp([{ ...big, bytes: 10_000 }]);
    h.deps.app = app;
    // Google slows every PUT once the first chunk has landed (its progress word is the cue).
    const report = app.report.bind(app);
    app.report = async (input) => {
      if (
        input.items.some((i) => i.outcome === "progress" && i.offset === 4096)
      )
        h.drive.failures.throttlePuts = 1000;
      return report(input);
    };
    expect(await runSlice(h.deps, message)).toBe("throttled");
    const kept = app.items.get(big.mediaId)!;
    expect(kept).toMatchObject({ status: "pending", attempts: 0 });
    expect(kept.session).toMatchObject({ offset: 4096 });

    h.drive.failures.throttlePuts = 0;
    app.report = report;
    const readsBefore = h.bucket.readLog.length;
    expect(await runSlice(h.deps, message)).toBe("idle");
    expect(app.items.get(big.mediaId)).toMatchObject({
      status: "sent",
      attempts: 1,
    });
    // One session all along, and the slice after read only from Google's byte on.
    expect(h.drive.sessions.size).toBe(1);
    expect(h.bucket.readLog.slice(readsBefore)).toEqual([
      { offset: 4096, length: 4096 },
      { offset: 8192, length: 1808 },
    ]);
    const file = [...h.drive.files.values()].find((f) => f.id !== "album")!;
    expect(file.size).toBe(10_000);
  });

  it("gives the batch back when a lease's token does not open (a secret that drifted)", async () => {
    const h = harness({
      leases: [
        { ...work([]), token: "AAECAwQFBgcICQoL.broken" } as LeaseAnswer,
      ],
    });
    expect(await runSlice(h.deps, message)).toBe("app_down");
    expect(h.reports).toEqual([{ lease: LEASE, items: [], done: true }]);
  });

  it("runs a closing check's page and reports it", async () => {
    const h = harness({ leases: [] });
    h.drive.add({ id: "album", size: 0 });
    const file = h.drive.add({ size: 5 });
    let asked = 0;
    h.deps.app.lease = async () =>
      asked++ === 0
        ? {
            state: "check",
            lease: LEASE,
            until: "x",
            jobId: "job",
            folderId: "album",
            first: true,
            token: SEALED,
            items: [{ mediaId: "m1", fileId: file.id, bytes: 5, md5: null }],
          }
        : { state: "idle" };
    expect(await runSlice(h.deps, message)).toBe("idle");
    expect(h.checks).toEqual([
      {
        lease: LEASE,
        results: [{ mediaId: "m1", state: "ok" }],
        duplicates: 0,
      },
    ]);
  });

  // ★ drive-crumbs: a page Google did not answer for in full is held by the app; the lane comes back to ask again.
  it("★ a check page left held comes back a beat later rather than ending idle", async () => {
    const h = harness({ leases: [] });
    h.drive.add({ id: "album", size: 0 });
    const file = h.drive.add({ size: 5 });
    const adapter = h.deps.drive;
    h.deps.drive = {
      ...adapter,
      getFile: async (t, id) =>
        id === file.id
          ? Promise.reject(new Error("reset"))
          : adapter.getFile(t, id),
    };
    let asked = 0;
    h.deps.app.lease = async () =>
      asked++ === 0
        ? {
            state: "check",
            lease: LEASE,
            until: "x",
            jobId: "job",
            folderId: "album",
            first: false,
            token: SEALED,
            items: [{ mediaId: "m1", fileId: file.id, bytes: 5, md5: null }],
          }
        : { state: "idle" };
    expect(await runSlice(h.deps, message)).toBe("held");
    expect(h.checks[0]!.results).toEqual([{ mediaId: "m1", state: "unknown" }]);
    expect(h.requeued).toEqual([{ delay: CHECK_HELD_DELAY_S }]);
  });

  it("★ a check slowed past its pace tells the app (the connection slows) and comes back after the throttle", async () => {
    const h = harness({ leases: [] });
    h.drive.add({ id: "album", size: 0 });
    const file = h.drive.add({ size: 5 });
    const adapter = h.deps.drive;
    h.deps.drive = {
      ...adapter,
      getFile: async (t, id) =>
        id === file.id
          ? Promise.reject(
              new DriveError("rate", 429, "rateLimitExceeded", "slow down"),
            )
          : adapter.getFile(t, id),
    };
    h.deps.app.lease = async () => ({
      state: "check",
      lease: LEASE,
      until: "x",
      jobId: "job",
      folderId: "album",
      first: false,
      token: SEALED,
      items: [{ mediaId: "m1", fileId: file.id, bytes: 5, md5: null }],
    });
    expect(await runSlice(h.deps, message)).toBe("throttled");
    expect(h.checks).toEqual([
      {
        lease: LEASE,
        results: [{ mediaId: "m1", state: "unknown" }],
        finding: "throttled",
      },
    ]);
    expect(h.requeued).toEqual([{ delay: THROTTLE_DELAY_S }]);
  });

  it("★ says a batch's last file in its closing word, never in a timed word just before it", async () => {
    // Each file takes a report's beat, so a timed word falls due after every one, the last included.
    const h = harness({ leases: [] });
    const items = [item(1, h.bucket), item(2, h.bucket), item(3, h.bucket)];
    h.deps.app.lease = async () =>
      h.reports.length === 0 ? work(items) : { state: "idle" };
    const inner = h.deps.bucket.head.bind(h.deps.bucket);
    h.deps.bucket = {
      ...h.deps.bucket,
      read: h.bucket.read.bind(h.bucket),
      head: async (k: string) => (h.tick(REPORT_EVERY_MS), inner(k)),
    };
    expect(await runSlice(h.deps, message)).toBe("idle");
    const last = items.at(-1)!.mediaId;
    const carrying = h.reports.filter((r) =>
      r.items.some((i) => i.mediaId === last),
    );
    expect(carrying).toHaveLength(1);
    expect(carrying[0]).toMatchObject({ done: true });
    expect(h.reports.at(-1)).toBe(carrying[0]);
    // The old shape: a timed word with the last file, then an empty closing word (two settles).
    expect(h.reports.some((r) => r.done && r.items.length === 0)).toBe(false);
  });

  it("★ runs the closing check after a batch ends: the next lease is its first page, every file confirmed, then done", async () => {
    const h = harness({ leases: [] });
    h.drive.add({ id: "album", size: 0 });
    const items = [item(1, h.bucket), item(2, h.bucket), item(3, h.bucket)];
    const app = new FakeApp(items);
    h.deps.app = app;
    const inner = h.deps.bucket.head.bind(h.deps.bucket);
    h.deps.bucket = {
      ...h.deps.bucket,
      read: h.bucket.read.bind(h.bucket),
      head: async (k: string) => (h.tick(REPORT_EVERY_MS), inner(k)),
    };
    expect(await runSlice(h.deps, message)).toBe("idle");
    expect(app.status).toBe("done");
    // Two leases: the batch, then the check's first page (and an idle one to end).
    expect(app.leases).toBe(2);
    const lastReport = app.said.reduce(
      (at, w, i) => (w.kind === "report" ? i : at),
      -1,
    );
    const checks = app.said.flatMap((w, i) =>
      w.kind === "check" ? [{ i, w }] : [],
    );
    expect(checks).toHaveLength(1);
    expect(checks[0]!.i).toBeGreaterThan(lastReport);
    expect(checks[0]!.w.results.map((r) => r.state)).toEqual([
      "ok",
      "ok",
      "ok",
    ]);
    expect([...app.items.values()].every((s) => s.confirmedAt !== null)).toBe(
      true,
    );
  });

  it("the model holds the database's rule: a closing word after the timed one leaves the send checking (the old settle closed it)", async () => {
    for (const guard of [true, false]) {
      const bucket = new FakeBucket();
      const items = [item(1, bucket), item(2, bucket)];
      const app = new FakeApp(items, { guard });
      await app.lease();
      await app.report({
        lease: LEASE,
        items: items.map((i) => ({
          mediaId: i.mediaId,
          outcome: "sent" as const,
          fileId: `f${i.mediaId.slice(-1)}`,
        })),
      });
      expect(app.status).toBe("checking");
      await app.report({ lease: LEASE, items: [], done: true });
      // The walk's first send, on the old settle: done with nothing confirmed.
      expect(app.status).toBe(guard ? "checking" : "done");
      expect(
        [...app.items.values()].filter((s) => s.confirmedAt !== null),
      ).toHaveLength(0);
    }
  });

  it("★ stops a big file at its next chunk when her Cancel is heard on its chunk report, the session kept", async () => {
    const h = harness({
      leases: [],
      // The session written ahead (offset 0) answers ok; the first chunk's report hears the cancel.
      reportAnswers: [{ state: "ok" }, { state: "stop" }],
    });
    h.deps.chunkBytes = 4096;
    const big = item(9, h.bucket);
    h.bucket.put(big.key, bytesOf(10_000, 9));
    h.deps.app.lease = async () =>
      h.reports.length === 0
        ? work([{ ...big, bytes: 10_000 }])
        : { state: "idle" };
    expect(await runSlice(h.deps, message)).toBe("stop");
    const puts = h.drive.calls.filter((c) => c.method === "PUT");
    expect(puts).toHaveLength(1);
    expect(h.drive.files.size).toBe(0);
    const words = h.reports.flatMap((r) => r.items);
    expect(words.filter((w) => w.outcome === "progress").at(-1)).toMatchObject({
      offset: 4096,
    });
    expect(h.reports.at(-1)).toMatchObject({
      done: true,
      items: expect.arrayContaining([
        { mediaId: big.mediaId, outcome: "released" },
      ]),
    });
    expect(h.requeued).toEqual([]);
  });
});
