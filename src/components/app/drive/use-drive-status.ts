"use client";

/**
 * WHERE HER SENDS STAND, ONE POLL FOR THE WHOLE PAGE (drive-export.md, "What her page reads"): the album's strip, the
 * dashboard's lights, Take it home, Account's card and the app-wide flag all read this one store, so a page polls
 * `GET /api/drive/status` once however many places show a send.
 *
 * ★ IT POLLS ONLY WHILE SOMETHING MOVES: every 3 seconds while a send is running and the page is looked at, 15 when it
 * has not moved since the last answer, and not at all when nothing is unfinished (a press asks again at once:
 * `refreshDriveStatus`). A hidden tab stops; coming back to it asks at once. Nothing runs in the browser but this
 * reading: the send itself goes on with every tab shut.
 *
 * ★ A FAILED READ KEEPS THE LAST ANSWER and tries again on the slow beat: a send never vanishes from her page because
 * one poll did not come back.
 */
import { useSyncExternalStore } from "react";

import type { DriveStatus } from "@/lib/drive/status";

export const FAST_MS = 3_000;
export const SLOW_MS = 15_000;

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
      const status = (await res.json()) as DriveStatus;
      const sig = signature(status);
      const changed = sig !== lastSignature;
      lastSignature = sig;
      emit({ status, loaded: true });
      if (moving(status)) schedule(changed ? FAST_MS : SLOW_MS);
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
