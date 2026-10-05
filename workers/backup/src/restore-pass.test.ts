/**
 * ONE RESTORE PASS, WIRED (restore-pass.ts): the pass the prune's Durable Object runs when its alarm fires, on fake
 * buckets, the real lone copies' table (Node's SQLite) and a stand-in for the app (its heartbeat and its confirm
 * route, by fetch). It reports on the restore's own card, fails closed when the app cannot answer, honours its switch
 * and its mode, and every report carries the table's count after it.
 */
import { afterEach, describe, expect, it, vi } from "vitest";

import type { LoneStore } from "./lone-store";
import { PRIMARY_MISSING_KEY } from "./prune-run";
import { RESTORE_JOB, runRestorePass, type RestoreEnv } from "./restore-pass";
import { createFakeR2, putCalls, type FakeR2 } from "./testing/fake-r2";
import { openLoneStore } from "./testing/sqlite";

const NOW = Date.UTC(2026, 9, 5, 5, 0, 0);
const OLD = new Date(NOW - 40 * 86_400_000);
const key = (n: number, variant = "original.jpg") =>
  `events/0000000e-0000-4000-8000-000000000001/photo/00000000-0000-4000-8000-${String(n).padStart(12, "0")}/${variant}`;

type Post = { url: string; body: Record<string, unknown> };

function app(opts: {
  named?: Set<string>;
  paused?: boolean;
  down?: boolean;
  confirmDown?: boolean;
}): Post[] {
  const posts: Post[] = [];
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { "content-type": "application/json" },
    });
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init: RequestInit) => {
      const body = JSON.parse(String(init.body)) as Record<string, unknown>;
      posts.push({ url, body });
      if (opts.down) throw new Error("network down");
      if (url.endsWith("/job-run")) {
        if (body.phase === "start") {
          return json(
            opts.paused
              ? { ok: true, paused: true }
              : { ok: true, paused: false, runId: "run-1", startedAtMs: NOW },
          );
        }
        return json({ ok: true });
      }
      if (url.endsWith("/backup-prune")) {
        if (opts.confirmDown) return json({}, 503);
        const asked = body.loneKeys as string[];
        return json({ named: asked.filter((k) => opts.named?.has(k)) });
      }
      return json({}, 404);
    }),
  );
  return posts;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

/** `null` leaves RESTORE_MODE unset, as a deploy without the var would. */
async function world(mode: string | null) {
  const backup = createFakeR2([], { nowMs: NOW });
  const primary = createFakeR2([], { nowMs: NOW });
  const store = await openLoneStore();
  const env: RestoreEnv = {
    BACKUP: backup as unknown as R2Bucket,
    PRIMARY: primary as unknown as R2Bucket,
    RESTORE_MODE: mode ?? undefined,
    PRUNE_API_URL: "https://partyreel.com/api/internal/backup-prune",
    PRUNE_API_SECRET: "s3cret",
  };
  const hold = (k: string) => {
    backup.objects.set(k, {
      key: k,
      uploaded: OLD,
      size: 1024,
      contentType: "image/jpeg",
    });
    store.walk(
      { after: null, through: k, found: [...store.page(null, 100), k] },
      NOW,
    );
    return k;
  };
  return { backup, primary, store, env, hold };
}

const finishOf = (posts: Post[]) =>
  posts.find((p) => p.url.endsWith("/job-run") && p.body.phase === "finish")
    ?.body;

function quietly<T>(fn: () => Promise<T>): Promise<T> {
  const spies = (["log", "warn", "error"] as const).map((m) =>
    vi.spyOn(console, m).mockImplementation(() => {}),
  );
  return fn().finally(() => spies.forEach((s) => s.mockRestore()));
}

describe("a restore pass", () => {
  it("★ copies back what the app names, on the restore's own card, carrying the table's count after it", async () => {
    const w = await world("on");
    const named = w.hold(key(1));
    const dropped = w.hold(key(2, "phone.jpg"));
    const posts = app({ named: new Set([named]) });
    await quietly(() => runRestorePass(w.env, w.store, "manual"));

    expect(posts[0]).toEqual({
      url: "https://partyreel.com/api/internal/job-run",
      body: { phase: "start", job: RESTORE_JOB, triggeredBy: "manual" },
    });
    expect(posts[1].body).toEqual({ loneKeys: [named, dropped] });
    expect(putCalls(w.primary)).toEqual([
      expect.objectContaining({ key: named, condition: "*", stored: true }),
    ]);
    expect(finishOf(posts)).toMatchObject({
      job: RESTORE_JOB,
      status: "ok",
      counts: {
        restore_mode: "on",
        restored: 1,
        unnamed: 1,
        [PRIMARY_MISSING_KEY]: 0,
      },
    });
    expect(w.store.tally().keys).toBe(0);
  });

  it("copies nothing in a dry run, its default, and says what it would", async () => {
    const w = await world(null);
    const k = w.hold(key(3));
    const posts = app({ named: new Set([k]) });
    await quietly(() => runRestorePass(w.env, w.store, "schedule"));
    expect(putCalls(w.primary)).toEqual([]);
    expect(finishOf(posts)).toMatchObject({
      status: "ok",
      counts: {
        restore_mode: "dryrun",
        would_restore: 1,
        [PRIMARY_MISSING_KEY]: 1,
      },
    });
  });

  it("★ fails closed when the app cannot be reached: no copy, no row", async () => {
    const w = await world("on");
    w.hold(key(4));
    const posts = app({ down: true });
    await quietly(() => runRestorePass(w.env, w.store, "schedule"));
    expect(putCalls(w.primary)).toEqual([]);
    expect(posts).toHaveLength(1);
    expect(w.store.tally().keys).toBe(1);
  });

  it("copies nothing while its switch is paused (the app wrote the skipped row)", async () => {
    const w = await world("on");
    w.hold(key(5));
    const posts = app({ paused: true, named: new Set([key(5)]) });
    await quietly(() => runRestorePass(w.env, w.store, "schedule"));
    expect(putCalls(w.primary)).toEqual([]);
    expect(posts).toHaveLength(1);
  });

  it("closes skipped with the count when RESTORE_MODE is off, so it never reads as missed and the lone copies stay said", async () => {
    const w = await world("off");
    w.hold(key(6));
    const posts = app({ named: new Set([key(6)]) });
    await quietly(() => runRestorePass(w.env, w.store, "schedule"));
    expect(putCalls(w.primary)).toEqual([]);
    expect(posts.some((p) => p.url.endsWith("/backup-prune"))).toBe(false);
    expect(finishOf(posts)).toMatchObject({
      status: "skipped",
      counts: { restore_mode: "off", [PRIMARY_MISSING_KEY]: 1 },
      note: expect.stringMatching(
        /^RESTORE_MODE is off, so it copied nothing: 1 keys stand held/,
      ),
    });
  });

  it("closes as an error, copying nothing more, when the app cannot say which keys a row names", async () => {
    const w = await world("on");
    w.hold(key(7));
    const posts = app({ confirmDown: true });
    await quietly(() => runRestorePass(w.env, w.store, "schedule"));
    expect(putCalls(w.primary)).toEqual([]);
    expect(finishOf(posts)).toMatchObject({
      status: "error",
      counts: { [PRIMARY_MISSING_KEY]: 1 },
      note: expect.stringMatching(
        /Could not ask the app which keys a live row names \(HTTP 503\)/,
      ),
    });
  });

  it("closes its row as an error when the table itself fails", async () => {
    const w = await world("on");
    const broken: LoneStore = {
      ...w.store,
      page: () => {
        throw new Error("the table is gone");
      },
    };
    const posts = app({});
    await quietly(() => runRestorePass(w.env, broken, "schedule"));
    expect(finishOf(posts)).toMatchObject({
      status: "error",
      note: expect.stringMatching(/the table is gone/),
    });
  });

  it("asks nothing of anyone without its URL and secret", async () => {
    const w = await world("on");
    const posts = app({});
    await quietly(() =>
      runRestorePass(
        { ...w.env, PRUNE_API_SECRET: undefined },
        w.store,
        "schedule",
      ),
    );
    expect(posts).toEqual([]);
  });
});

// The fake's own record, kept in scope for a failing test's debugging.
void ({} as FakeR2);
