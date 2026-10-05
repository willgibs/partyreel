/**
 * A LANE'S SLICE AND HOW EACH ONE ENDS (drive-export.md, "Lanes, per connection"), against a scripted app, a fake
 * Drive and a fake bucket: a lane told to wait, pause, stop or idle acks and ends without re-queuing itself (a busy or
 * paused connection costs nothing); only Google's "slow down" and an app that cannot answer re-queue, each delayed; a
 * stop mid-batch ends the lane within its next report; a slice's end sends the lane to the back of the queue.
 */
import { describe, expect, it } from "vitest";

import type { AppClient, ReportAnswer, Unreachable } from "./app-client";
import { driveAdapter } from "./google-drive";
import {
  REPORT_EVERY_MS,
  runSlice,
  SLICE_MS,
  type LaneDeps,
  type LaneMessage,
} from "./lane";
import type {
  CheckResult,
  LeaseAnswer,
  LeaseItem,
  ReportItem,
} from "./protocol";
import { FakeBucket, bytesOf, md5OfStream } from "./testing/fake-bucket";
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
    fixedLength: (s) => s,
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
});
