"use client";

/**
 * WHERE HER SENDS STAND, ONE POLL FOR THE WHOLE PAGE (drive-export.md, "What her page reads"): the album's strip, the
 * dashboard's lights, Take it home, Account's card and the app-wide flag all read this one store, so a page polls
 * `GET /api/drive/status` once however many places show a send.
 *
 * ★ IT POLLS ONLY WHILE SOMETHING MOVES: every 3 seconds while a send is at work (preparing, sending or checking, and it
 * has reported within the last minute) and the page is looked at, never slower (crumbs-82: the lanes report every 10
 * seconds, so a poll between two reports finds nothing new, and a slower beat after it drew the strip in coarse steps, a
 * timed report never showing); 15 for a send that waits (paused), whose stopped files have stopped landing, or that has
 * said nothing for a minute (dead lanes: a faster beat could show nothing, and the page would pay three reads every
 * three seconds until she closed it); and not at all when nothing is unfinished (a press asks again at once:
 * `refreshDriveStatus`). A hidden tab stops; coming back to it asks at once. Nothing runs in the browser but this
 * reading: the send itself goes on with every tab shut.
 *
 * ★ A FAILED READ KEEPS THE LAST ANSWER and tries again on the slow beat: a send never vanishes from her page because
 * one poll did not come back.
 *
 * ★ EVERY PLACE READS THE CONNECTION SHE HAS NOW (`this-connection.ts`): a send of an earlier connection is history, so
 * no album wears its light or strip and the flag never speaks of it, as Your events' list, which the database answers
 * per connection, never did.
 */
import { useSyncExternalStore } from "react";

import type { DriveStatus } from "@/lib/drive/status";

import { onThisConnection } from "./this-connection";

export const FAST_MS = 3_000;
export const SLOW_MS = 15_000;
/** A send that has reported within this long is at work: the lanes report every 10 seconds. */
export const FRESH_MS = 60_000;

type Snapshot = { status: DriveStatus | null; loaded: boolean };

let snapshot: Snapshot = { status: null, loaded: false };
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setTimeout> | null = null;
let inflight: Promise<void> | null = null;
let lastSignature = "";
let subscribed = 0;

function emit(next: Snapshot) {
  snapshot = next;
  for (const l of listeners) l();
}

/**
 * Whether a send is at work now: running, and heard from within `FRESH_MS` (by the answer's own clock, never this
 * browser's), so its numbers move every few polls. A stamp that cannot be read keeps the beat: a send she can see is never
 * slowed by a bad one.
 */
function atWork(status: DriveStatus | null): boolean {
  if (!status) return false;
  const now = Date.parse(status.now);
  return status.sends.some((s) => {
    if (
      s.status !== "sending" &&
      s.status !== "preparing" &&
      s.status !== "checking"
    )
      return false;
    const heard = Date.parse(s.lastProgressAt ?? s.startedAt ?? s.createdAt);
    return (
      !Number.isFinite(now) || !Number.isFinite(heard) || now - heard < FRESH_MS
    );
  });
}

/**
 * Whether a send's numbers can move: running, or ★ stopped with files still landing (what was on its way at her
 * Cancel lands after it, and her page keeps listening until it has, never frozen at the number of the press).
 */
function moving(status: DriveStatus | null): boolean {
  return Boolean(
    status?.sends.some(
      (s) =>
        s.status === "sending" ||
        s.status === "preparing" ||
        s.status === "checking" ||
        s.landing === true,
    ),
  );
}

function unfinished(status: DriveStatus | null): boolean {
  return Boolean(
    status?.sends.some((s) =>
      ["sending", "preparing", "checking", "paused"].includes(s.status),
    ),
  );
}

/** What changed between two answers, as one string (a send's numbers and state). */
function signature(status: DriveStatus | null): string {
  return (status?.sends ?? [])
    .map(
      (s) =>
        `${s.id}:${s.status}:${s.itemsSent}:${s.bytesSent}:${s.landing ? 1 : 0}`,
    )
    .join("|");
}

function schedule(delay: number) {
  if (timer) clearTimeout(timer);
  timer = null;
  if (
    subscribed === 0 ||
    typeof document === "undefined" ||
    document.visibilityState === "hidden"
  )
    return;
  timer = setTimeout(() => void poll(), delay);
}

async function poll(): Promise<void> {
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      const res = await fetch("/api/drive/status", {
        cache: "no-store",
        credentials: "same-origin",
      });
      if (!res.ok) throw new Error(String(res.status));
      const status = onThisConnection((await res.json()) as DriveStatus);
      const sig = signature(status);
      const changed = sig !== lastSignature;
      lastSignature = sig;
      emit({ status, loaded: true });
      // ★ A SEND AT WORK KEEPS THE FAST BEAT WHETHER OR NOT THIS ANSWER MOVED: an unchanged answer is the gap between
      // two of its lanes' reports, never a send gone still. A send that has said nothing for a minute, and a stopped
      // send's landing files once they stop moving, slow down.
      if (atWork(status)) schedule(FAST_MS);
      else if (moving(status)) schedule(changed ? FAST_MS : SLOW_MS);
      else if (unfinished(status)) schedule(SLOW_MS);
    } catch {
      emit({ ...snapshot, loaded: true });
      schedule(SLOW_MS);
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}

function onVisibility() {
  if (document.visibilityState === "visible") void poll();
  else if (timer) {
    clearTimeout(timer);
    timer = null;
  }
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  subscribed++;
  if (subscribed === 1) {
    document.addEventListener("visibilitychange", onVisibility);
    void poll();
  }
  return () => {
    listeners.delete(listener);
    subscribed--;
    if (subscribed === 0) {
      document.removeEventListener("visibilitychange", onVisibility);
      if (timer) clearTimeout(timer);
      timer = null;
    }
  };
}

const serverSnapshot: Snapshot = { status: null, loaded: false };

/** Her sends and her connection, kept fresh while any place on the page shows one. */
export function useDriveStatus(): Snapshot {
  return useSyncExternalStore(
    subscribe,
    () => snapshot,
    () => serverSnapshot,
  );
}

/** Ask again now (after a press, an act, a return from Google). */
export function refreshDriveStatus(): Promise<void> {
  return poll();
}

/** Test seam: the store is module state. */
export function resetDriveStatus(): void {
  if (timer) clearTimeout(timer);
  timer = null;
  inflight = null;
  lastSignature = "";
  snapshot = { status: null, loaded: false };
}
