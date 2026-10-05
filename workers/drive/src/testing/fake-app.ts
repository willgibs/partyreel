/**
 * A MODEL OF THE APP'S HALF FOR ONE SEND, for the lane's suite: the `cloud_*` transitions a lane drives (20261005120000,
 * with 20261005180000's settle), as decisions and not as locks. A lease hands out a batch of what is pending, oldest
 * first (ten at most), or one page of the closing check behind its cursor; a report records what each file did and
 * settles the send; a check page confirms what Drive answered for and ends the walk when nothing sent is left past the
 * cursor. ★ Only a walk that is through closes a checking send (`guard`, on as the database is now; off is the old
 * settle, kept to show what the walk found). The rolled-back checks at the migrations' feet prove the SQL itself; this
 * proves the Worker drives it to a check that really runs.
 *
 * Every lease answers the protocol's pinned lease token and seal (`protocol.test.ts`), so the lane opens each; the model
 * keeps which lease that token means now (one lane runs at a time here).
 */
import type { AppClient, ReportAnswer, Unreachable } from "../app-client";
import type {
  CheckItem,
  CheckResult,
  LeaseAnswer,
  LeaseItem,
  ReportItem,
} from "../protocol";

export const MODEL_LEASE = "11111111-2222-4333-8444-555555555555";
export const MODEL_SEALED =
  "AAECAwQFBgcICQoL.aMw-A8qgcjRVADPQGL_vMXpkVNCx3Mg9YHD3mtjp2jtfY1kX6Hnq53bRVA";

type ItemState = {
  item: LeaseItem;
  status: "pending" | "leased" | "sent" | "skipped" | "failed";
  fileId: string | null;
  md5: string | null;
  confirmedAt: number | null;
};

export type ModelStatus =
  | "sending"
  | "checking"
  | "done"
  | "partly_done"
  | "canceled";

export class FakeApp implements AppClient {
  readonly items = new Map<string, ItemState>();
  status: ModelStatus = "sending";
  checkAfter: string | null = null;
  itemsSent = 0;
  itemsFailed = 0;
  /** What the lane said, in order: each report's and check page's word. */
  readonly said: (
    | { kind: "report"; items: ReportItem[]; done: boolean }
    | { kind: "check"; results: CheckResult[] }
  )[] = [];
  /** The lease the pinned token means now. */
  private current: { kind: "send" | "check"; live: boolean } | null = null;
  private seq = 0;
  /** When the model's own clock stamps a confirmation (each confirmation a tick, so their order reads). */
  private tick = 0;

  constructor(
    items: LeaseItem[],
    readonly opts: { guard: boolean; folderId?: string } = { guard: true },
  ) {
    for (const item of items)
      this.items.set(item.mediaId, {
        item,
        status: "pending",
        fileId: null,
        md5: null,
        confirmedAt: null,
      });
  }

  /** The send's items in media-id order (the check walks that order, as the SQL does). */
  private byMedia(): ItemState[] {
    return [...this.items.values()].sort((a, b) =>
      a.item.mediaId < b.item.mediaId ? -1 : 1,
    );
  }

  private pastCursor(): ItemState[] {
    return this.byMedia().filter(
      (s) =>
        s.status === "sent" &&
        (this.checkAfter === null || s.item.mediaId > this.checkAfter),
    );
  }

  /** `cloud_export_settle`: the closing check once anything went; a checking send closes only once its walk is through. */
  settle(): ModelStatus {
    if (this.status !== "sending" && this.status !== "checking")
      return this.status;
    const open = [...this.items.values()].some(
      (s) => s.status === "pending" || s.status === "leased",
    );
    if (open) return this.status;
    if (this.status === "sending" && this.itemsSent > 0) {
      this.status = "checking";
      this.checkAfter = null;
      return this.status;
    }
    if (
      this.status === "checking" &&
      this.opts.guard &&
      this.pastCursor().length > 0
    )
      return this.status;
    this.status = this.itemsFailed > 0 ? "partly_done" : "done";
    return this.status;
  }

  async lease(): Promise<LeaseAnswer | Unreachable> {
    if (this.current?.live) return { state: "wait" };
    if (this.status === "checking") {
      const page = this.pastCursor().slice(0, 100);
      if (page.length === 0) {
        this.settle();
        return { state: "idle" };
      }
      this.current = { kind: "check", live: true };
      this.seq++;
      return {
        state: "check",
        lease: MODEL_LEASE,
        until: "x",
        jobId: "job",
        folderId: this.opts.folderId ?? "album",
        first: this.checkAfter === null,
        token: MODEL_SEALED,
        items: page.map(
          (s): CheckItem => ({
            mediaId: s.item.mediaId,
            fileId: s.fileId!,
            bytes: s.item.bytes,
            md5: s.md5,
          }),
        ),
      };
    }
    if (this.status !== "sending") return { state: "idle" };
    const batch = [...this.items.values()]
      .filter((s) => s.status === "pending")
      .slice(0, 10);
    if (batch.length === 0) {
      this.settle();
      return { state: "idle" };
    }
    for (const s of batch) s.status = "leased";
    this.current = { kind: "send", live: true };
    this.seq++;
    return {
      state: "work",
      lease: MODEL_LEASE,
      until: "x",
      jobId: "job",
      folderId: this.opts.folderId ?? "album",
      token: MODEL_SEALED,
      items: batch.map((s) => s.item),
    };
  }

  async report(input: {
    lease: string;
    items: ReportItem[];
    done?: boolean;
  }): Promise<ReportAnswer | Unreachable> {
    this.said.push({
      kind: "report",
      items: input.items,
      done: input.done ?? false,
    });
    if (!this.current?.live || this.current.kind !== "send")
      return { state: "stop" };
    for (const r of input.items) {
      const s = this.items.get(r.mediaId);
      if (!s || s.status !== "leased") continue;
      if (r.outcome === "sent") {
        s.status = "sent";
        s.fileId = r.fileId;
        s.md5 = r.md5 ?? null;
        this.itemsSent++;
      } else if (r.outcome === "released") s.status = "pending";
      else if (r.outcome === "skipped") s.status = "skipped";
      else if (r.outcome === "failed") {
        s.status = r.retry ? "pending" : "failed";
        if (!r.retry) this.itemsFailed++;
      }
    }
    if (input.done) {
      for (const s of this.items.values())
        if (s.status === "leased") s.status = "pending";
      this.current.live = false;
    }
    const status = this.settle();
    return { state: status === "canceled" ? "stop" : "ok" };
  }

  async check(input: {
    lease: string;
    results: CheckResult[];
  }): Promise<ReportAnswer | Unreachable> {
    this.said.push({ kind: "check", results: input.results });
    if (!this.current?.live || this.current.kind !== "check")
      return { state: "stop" };
    this.current.live = false;
    if (this.status !== "checking") return { state: "stop" };
    let last: string | null = null;
    for (const r of input.results) {
      const s = this.items.get(r.mediaId);
      if (
        !s ||
        s.status !== "sent" ||
        (this.checkAfter !== null && r.mediaId <= this.checkAfter)
      )
        continue;
      if (last === null || r.mediaId > last) last = r.mediaId;
      if (r.state === "ok") s.confirmedAt = ++this.tick;
      else if (r.state !== "unknown") {
        s.status = "pending";
        s.fileId = null;
        this.itemsSent--;
      }
    }
    this.checkAfter = last ?? this.checkAfter;
    if (this.pastCursor().length === 0) {
      const open = [...this.items.values()].some(
        (s) => s.status === "pending" || s.status === "leased",
      );
      if (open) {
        this.status = "sending";
        this.checkAfter = null;
      } else this.settle();
    }
    return { state: "ok" };
  }

  async laneFail(): Promise<boolean> {
    return true;
  }

  async sweep() {
    return { kick: [] };
  }

  /** Her Cancel, from the app's side: the send ends; a lane hears it at its next word. */
  cancel(): void {
    this.status = "canceled";
  }

  /** How many leases the model handed out (work and check pages alike). */
  get leases(): number {
    return this.seq;
  }
}
