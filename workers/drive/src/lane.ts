/**
 * A LANE, ONE SLICE OF IT (drive-export.md, "Lanes, per connection, and how each one ends"). A Queue message is a lane:
 * `{ v: 1, connectionId }`. A connection runs at most three, however many albums she sends at once, oldest send first.
 *
 * A slice leases a batch (at most 10 originals or 1 GiB), sends them one after another, reports every 10 seconds and at
 * its end, and leases again, until it has run 11 minutes (a Queue consumer gets 15) or spent its own share of
 * subrequests; then, with work left, it sends itself back to the queue (a fresh message, no delay) and acks. Slices are
 * what make it fair: a 1 TB host's lanes go to the back of the queue every 11 minutes, so nobody waits behind her.
 *
 * ★ A LANE THAT IS TOLD TO STOP, ENDS: a lease answering wait (her lanes are busy), paused, stopped or idle, or a
 * report answering stop (her Cancel, a pause, the switch, an operator), acks and ends, never re-queuing itself, so a busy
 * or paused connection costs nothing while it waits; paused sends come back through the sweep. Only two answers
 * re-queue: Google's "slow down" (a fresh message delayed to the app's `until`, or two minutes) and an app that cannot
 * answer (60 seconds on, a fresh message, so retries never pile into the dead-letter queue).
 */
import type { AppClient, Unreachable } from "./app-client";
import { checkPage } from "./check";
import type { DriveAdapter } from "./google-drive";
import { log } from "./log";
import {
  openLeaseToken,
  type Finding,
  type LeaseAnswer,
  type LeaseItem,
  type ReportItem,
} from "./protocol";
import { sendOne, type Bucket, type TransferContext } from "./transfer";

/** A slice's length: a Queue consumer gets 15 minutes of wall clock; the last reports fit in the rest. */
export const SLICE_MS = 11 * 60_000;

/** A running lane reports at least this often (each report also keeps its lease). */
export const REPORT_EVERY_MS = 10_000;

/** A slice's own share of subrequests (every R2 read, Google call and report counts; the platform allows 20,000). */
export const SUBREQUEST_BUDGET = 9_000;

/** An app that cannot answer: the lane comes back this much later. */
export const APP_DOWN_DELAY_S = 60;

/** Google's "slow down" with no time from the app: two minutes. */
export const THROTTLE_DELAY_S = 120;

export type LaneMessage = { v: 1; connectionId: string };

export type LaneDeps = {
  app: AppClient;
  drive: DriveAdapter;
  bucket: Bucket;
  secret: string;
  /** Send this lane back to the queue (a fresh message), optionally delayed. */
  requeue(message: LaneMessage, delaySeconds?: number): Promise<void>;
  fixedLength: TransferContext["fixedLength"];
  md5Of: TransferContext["md5Of"];
  now(): number;
  sleep(ms: number): Promise<void>;
  random(): number;
  /** Counted on every subrequest the lane's own code makes (the adapter's and the bucket's are counted by the wiring). */
  spent(): number;
};

export type LaneEnd =
  | "wait"
  | "paused"
  | "stopped"
  | "idle"
  | "stop"
  | "throttled"
  | "app_down"
  | "sliced"
  | "finding";

const isUnreachable = (v: unknown): v is Unreachable =>
  typeof v === "object" &&
  v !== null &&
  (v as { state?: unknown }).state === "unreachable";

/** Run one slice of a lane. Throws only on a bug; every expected end is a `LaneEnd`. */
export async function runSlice(
  deps: LaneDeps,
  message: LaneMessage,
): Promise<LaneEnd> {
  const start = deps.now();
  const deadline = start + SLICE_MS;
  const { connectionId } = message;
  let authRetries = 0;
  let sent = 0;

  for (;;) {
    if (deps.now() >= deadline || deps.spent() >= SUBREQUEST_BUDGET) {
      await deps.requeue(message);
      log("drive-lane", {
        connectionId,
        end: "sliced",
        sent,
        ms: deps.now() - start,
      });
      return "sliced";
    }

    const answer = await deps.app.lease(connectionId);
    if (isUnreachable(answer)) {
      await deps.requeue(message, APP_DOWN_DELAY_S);
      log("drive-lane", {
        connectionId,
        end: "app_down",
        status: answer.status,
        sent,
      });
      return "app_down";
    }
    if (answer.state === "throttled") {
      const until = Date.parse(answer.until);
      const delay = Number.isFinite(until)
        ? Math.ceil((until - deps.now()) / 1000)
        : THROTTLE_DELAY_S;
      await deps.requeue(message, Math.min(Math.max(delay, 1), 86_400));
      log("drive-lane", { connectionId, end: "throttled", sent });
      return "throttled";
    }
    if (answer.state !== "work" && answer.state !== "check") {
      log("drive-lane", { connectionId, end: answer.state, sent });
      return answer.state;
    }

    const token = await openLeaseToken(deps.secret, answer.token, answer.lease);
    if (!token) {
      // A seal this lane cannot open: a secret that drifted between the app and this Worker. Give the batch back.
      await deps.app.report({ lease: answer.lease, items: [], done: true });
      await deps.requeue(message, APP_DOWN_DELAY_S);
      log("drive-error", {
        connectionId,
        what: "a lease token that does not open",
        sent,
      });
      return "app_down";
    }

    if (answer.state === "check") {
      const outcome = await checkPage({
        drive: deps.drive,
        token,
        folderId: answer.folderId,
        first: answer.first,
        items: answer.items,
      });
      const said = await deps.app.check({
        lease: answer.lease,
        results: outcome.results,
        ...(outcome.duplicates !== undefined
          ? { duplicates: outcome.duplicates }
          : {}),
        ...(outcome.finding ? { finding: outcome.finding } : {}),
      });
      if (isUnreachable(said)) {
        await deps.requeue(message, APP_DOWN_DELAY_S);
        return "app_down";
      }
      if (outcome.finding) {
        log("drive-lane", {
          connectionId,
          end: "finding",
          finding: outcome.finding,
          sent,
        });
        return "finding";
      }
      continue;
    }

    const end = await runBatch(deps, answer, token, deadline);
    sent += end.sent;
    if (end.kind === "continue") continue;
    if (end.kind === "auth" && authRetries < 1) {
      // A 401 mid-slice: the lease that follows refreshes the token. Once a slice; twice is not a token problem.
      authRetries++;
      continue;
    }
    if (end.kind === "throttled") {
      await deps.requeue(message, THROTTLE_DELAY_S);
      log("drive-lane", { connectionId, end: "throttled", sent });
      return "throttled";
    }
    if (end.kind === "app_down") {
      await deps.requeue(message, APP_DOWN_DELAY_S);
      log("drive-lane", { connectionId, end: "app_down", sent });
      return "app_down";
    }
    log("drive-lane", {
      connectionId,
      end: end.kind === "stop" ? "stop" : "finding",
      finding:
        end.kind === "finding" || end.kind === "auth" ? end.finding : null,
      sent,
    });
    return end.kind === "stop" ? "stop" : "finding";
  }
}

type BatchEnd =
  | { kind: "continue"; sent: number }
  | { kind: "stop"; sent: number }
  | { kind: "app_down"; sent: number }
  | { kind: "throttled"; sent: number }
  | { kind: "auth"; sent: number; finding: Finding }
  | { kind: "finding"; sent: number; finding: Finding };

/** Send a leased batch, reporting as it goes; the batch's end and how many reached her Drive. */
async function runBatch(
  deps: LaneDeps,
  lease: Extract<LeaseAnswer, { state: "work" }>,
  token: string,
  deadline: number,
): Promise<BatchEnd> {
  let buffer: ReportItem[] = [];
  let lastReport = deps.now();
  let sent = 0;
  let stopped = false;
  let unreachable = false;

  const flush = async (done: boolean, finding?: Finding): Promise<void> => {
    const items = buffer;
    buffer = [];
    lastReport = deps.now();
    const said = await deps.app.report({
      lease: lease.lease,
      items,
      ...(finding ? { finding } : {}),
      ...(done ? { done } : {}),
    });
    if (isUnreachable(said)) {
      unreachable = true;
      // What was not said is said again by the next lease's lookups: a sent file is found by its mark, never sent twice.
      return;
    }
    if (said.state === "stop") stopped = true;
  };

  const ctx: TransferContext = {
    token,
    jobId: lease.jobId,
    folderId: lease.folderId,
    drive: deps.drive,
    bucket: deps.bucket,
    fixedLength: deps.fixedLength,
    md5Of: deps.md5Of,
    deadlineMs: deadline,
    now: deps.now,
    sleep: deps.sleep,
    random: deps.random,
    progress: async (item: LeaseItem, sessionUri: string, offset: number) => {
      buffer.push({
        mediaId: item.mediaId,
        outcome: "progress",
        sessionUri,
        offset,
      });
      await flush(false);
    },
  };

  for (const item of lease.items) {
    if (
      stopped ||
      unreachable ||
      deps.now() >= deadline ||
      deps.spent() >= SUBREQUEST_BUDGET
    )
      break;
    const result = await sendOne(ctx, item);
    buffer.push(result.item);
    if (result.item.outcome === "sent") sent++;
    if (result.finding) {
      await flush(true, result.finding);
      if (result.finding === "throttled") return { kind: "throttled", sent };
      if (result.finding === "auth")
        return { kind: "auth", sent, finding: "auth" };
      return { kind: "finding", sent, finding: result.finding };
    }
    if (deps.now() - lastReport >= REPORT_EVERY_MS) await flush(false);
  }
  // The batch's end: what is left goes back to pending (the lease ends, the attempts not counted).
  await flush(true);
  if (unreachable) return { kind: "app_down", sent };
  if (stopped) return { kind: "stop", sent };
  return { kind: "continue", sent };
}
