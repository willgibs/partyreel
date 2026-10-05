import { describe, expect, it } from "vitest";

import {
  clientHealth,
  connectionActs,
  connectionWord,
  PAUSE_WORDS,
  sendActs,
  sendWord,
  STOP_WORDS,
} from "./drive-words";

const send = (over: Partial<Parameters<typeof sendWord>[0]> = {}) => ({
  status: "sending",
  pauseReason: null,
  stopReason: null,
  stuckSince: null,
  itemsFailed: 0,
  ...over,
});

const conn = (over: Partial<Parameters<typeof connectionWord>[0]> = {}) => ({
  status: "connected" as const,
  operatorPausedAt: null,
  laneFailures: 0,
  breakerSends: 0,
  ...over,
});

describe("sendWord", () => {
  it("says a stalled send is stuck, tinted, whatever its status word", () => {
    expect(sendWord(send({ stuckSince: "2026-10-05T10:00:00Z" }))).toMatchObject({ label: "Stuck", row: "destructive" });
    expect(sendWord(send({ status: "checking", stuckSince: "2026-10-05T10:00:00Z" })).label).toBe("Stuck");
  });

  it("names every pause reason the migration can write", () => {
    for (const reason of ["drive_full", "daily_limit", "disconnected", "folder_gone", "domain_policy", "failing", "breaker", "operator"]) {
      expect(PAUSE_WORDS[reason], reason).toBeTruthy();
      expect(sendWord(send({ status: "paused", pauseReason: reason })).label).toBe(PAUSE_WORDS[reason]);
    }
  });

  it("names every stop reason the migration can write", () => {
    for (const reason of ["canceled", "operator", "disconnected", "account_changed", "album_deleted", "expired", "failed_to_start"]) {
      expect(STOP_WORDS[reason], reason).toBeTruthy();
    }
    expect(sendWord(send({ status: "stopped", stopReason: "expired" }))).toMatchObject({ label: "Waited 30 days", row: "warning" });
  });

  it("leaves Google's day and an operator's own pause untinted: nothing there needs an operator", () => {
    expect(sendWord(send({ status: "paused", pauseReason: "daily_limit" })).row).toBeUndefined();
    expect(sendWord(send({ status: "paused", pauseReason: "operator" })).row).toBeUndefined();
    expect(sendWord(send({ status: "paused", pauseReason: "breaker" })).row).toBe("warning");
  });

  it("counts a partly done send's failures", () => {
    expect(sendWord(send({ status: "partly_done", itemsFailed: 3 })).label).toBe("3 failed");
  });
});

describe("sendActs", () => {
  it("offers resume on a pause, retry on a partly done send, cancel on anything unfinished", () => {
    expect(sendActs({ status: "paused" })).toEqual(["resume", "cancel"]);
    expect(sendActs({ status: "sending" })).toEqual(["cancel"]);
    expect(sendActs({ status: "checking" })).toEqual(["cancel"]);
    expect(sendActs({ status: "preparing" })).toEqual(["cancel"]);
    expect(sendActs({ status: "partly_done" })).toEqual(["retry"]);
    expect(sendActs({ status: "done" })).toEqual([]);
    expect(sendActs({ status: "stopped" })).toEqual([]);
  });

  it("never offers anything that deletes what she sent", () => {
    for (const status of ["preparing", "sending", "paused", "checking", "done", "partly_done", "canceled", "stopped"]) {
      expect(sendActs({ status }).join(" ")).not.toMatch(/delete|exit|free/i);
    }
  });
});

describe("connectionWord and connectionActs", () => {
  it("puts an operator's pause first, then the breaker, then dying lanes", () => {
    expect(connectionWord(conn({ operatorPausedAt: "x", breakerSends: 2 })).label).toBe("Paused by an operator");
    expect(connectionWord(conn({ breakerSends: 2, laneFailures: 3 })).label).toBe("Breaker standing");
    expect(connectionWord(conn({ laneFailures: 3 })).label).toBe("Lanes dying");
    expect(connectionWord(conn({ status: "revoked" })).label).toBe("Lost access");
    expect(connectionWord(conn({ status: "failing" })).label).toBe("Refresh failing");
  });

  it("gives every state its control", () => {
    expect(connectionActs(conn())).toEqual(["pause", "disconnect"]);
    expect(connectionActs(conn({ operatorPausedAt: "x" }))).toEqual(["resume", "disconnect"]);
    expect(connectionActs(conn({ laneFailures: 3 }))).toEqual(["pause", "resume", "disconnect"]);
    expect(connectionActs(conn({ breakerSends: 1 }))).toEqual(["pause", "lift_breaker", "disconnect"]);
    expect(connectionActs(conn({ status: "revoked" }))).toEqual(["disconnect"]);
  });
});

describe("clientHealth", () => {
  const now = Date.parse("2026-10-05T12:00:00Z");
  it("reads attention past 150 idle days; with no connection yet there is no day to count from", () => {
    expect(clientHealth("2026-09-01T00:00:00Z", now)).toEqual({ attention: false, days: 34 });
    expect(clientHealth("2026-05-01T00:00:00Z", now).attention).toBe(true);
    expect(clientHealth(null, now)).toEqual({ attention: false, days: null });
  });
});
