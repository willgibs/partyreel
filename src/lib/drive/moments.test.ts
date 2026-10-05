import { describe, expect, it } from "vitest";

import { isUnfinished, momentOf, sendForAlbum, tileLight, timeLeftWords, type SendView } from "./moments";

const NOW = Date.parse("2026-10-05T12:00:00Z");

function send(over: Partial<SendView> = {}): SendView {
  return {
    id: "j1",
    eventId: "e1",
    albumName: "Maya & Jay",
    status: "sending",
    pauseReason: null,
    stopReason: null,
    resumeAt: null,
    includeHidden: false,
    itemsTotal: 312,
    itemsSent: 100,
    itemsKept: 0,
    itemsSkipped: 0,
    itemsFailed: 0,
    bytesTotal: 1_000_000_000,
    bytesSent: 300_000_000,
    folderUrl: "https://drive.google.com/drive/folders/abc",
    createdAt: "2026-10-05T11:50:00Z",
    startedAt: "2026-10-05T11:50:00Z",
    lastProgressAt: "2026-10-05T11:59:50Z",
    closedAt: null,
    flagDue: false,
    ...over,
  };
}

const EVERY: SendView[] = [
  send({ status: "preparing" }),
  send(),
  send({ status: "checking" }),
  ...["drive_full", "daily_limit", "disconnected", "folder_gone", "domain_policy", "failing", "breaker", "operator"].map(
    (pauseReason) => send({ status: "paused", pauseReason }),
  ),
  send({ status: "done", itemsSent: 312 }),
  send({ status: "partly_done", itemsSent: 309, itemsFailed: 3 }),
  ...["canceled", "operator", "disconnected", "account_changed", "album_deleted"].map((stopReason) =>
    send({ status: "canceled", stopReason }),
  ),
  send({ status: "stopped", stopReason: "expired" }),
  send({ status: "stopped", stopReason: "failed_to_start", itemsSent: 0 }),
];

describe("every moment", () => {
  it("has its light's word, a title, where it lands and its facts", () => {
    for (const s of EVERY) {
      const m = momentOf(s, NOW, "UTC");
      const label = `${s.status}:${s.pauseReason ?? s.stopReason ?? ""}`;
      expect(m.word, label).toBeTruthy();
      expect(m.title, label).toBeTruthy();
      expect(m.where, label).toBe("My Drive › Partyreel › Maya & Jay");
      expect(m.facts, label).toBeTruthy();
      expect(m.acts.filter((a) => a.lead).length, label).toBeLessThanOrEqual(1);
    }
  });

  it("★ never suggests deleting what was sent, or freeing space here (an off-ramp, never a one-click exit)", () => {
    for (const s of EVERY) {
      const m = momentOf(s, NOW, "UTC");
      const words = [m.word, m.title, m.facts, m.line ?? "", ...m.acts.map((a) => a.label)].join(" ");
      expect(words, `${s.status}:${s.pauseReason ?? s.stopReason ?? ""}`).not.toMatch(/\bdelete\b|\bfree up\b|\bfree space\b|\bremove\b|\bexit\b|\bclear out\b/i);
    }
  });

  it("says each stop's one act, and a pause that carries on by itself asks nothing", () => {
    const lead = (s: SendView) => momentOf(s, NOW, "UTC").acts.find((a) => a.lead)?.id ?? null;
    expect(lead(send({ status: "paused", pauseReason: "drive_full" }))).toBe("check");
    expect(lead(send({ status: "paused", pauseReason: "disconnected" }))).toBe("reconnect");
    expect(lead(send({ status: "paused", pauseReason: "folder_gone" }))).toBe("check");
    expect(lead(send({ status: "partly_done", itemsFailed: 3 }))).toBe("retry");
    expect(lead(send({ status: "paused", pauseReason: "daily_limit" }))).toBeNull();
    expect(lead(send({ status: "paused", pauseReason: "breaker" }))).toBeNull();
    expect(lead(send({ status: "paused", pauseReason: "operator" }))).toBeNull();
  });

  it("says done as done: every one checked, Open in Drive", () => {
    const m = momentOf(send({ status: "done", itemsSent: 312 }), NOW, "UTC");
    expect(m.title).toBe("Maya & Jay is in your Google Drive");
    expect(m.facts).toContain("every one checked");
    expect(m.acts).toEqual([{ id: "open", label: "Open in Drive" }]);
  });

  it("says a send that stopped moving is slow, without a guess at the time left", () => {
    const m = momentOf(send({ lastProgressAt: "2026-10-05T11:30:00Z" }), NOW, "UTC");
    expect(m.line).toMatch(/Taking longer than usual/);
    expect(m.facts).not.toMatch(/left$/);
  });
});

describe("the time left", () => {
  it("waits for a minute of pace, then reads it", () => {
    expect(timeLeftWords(send({ startedAt: "2026-10-05T11:59:30Z" }), NOW)).toBeNull();
    // 300 MB in 10 minutes; 700 MB to go: about 24 minutes.
    expect(timeLeftWords(send(), NOW)).toBe("about 24 minutes left");
    expect(timeLeftWords(send({ bytesSent: 0 }), NOW)).toBeNull();
  });
});

describe("the dashboard's light and the album's send", () => {
  it("lights a running send's percent and a stop's word; says nothing for one canceled", () => {
    expect(tileLight(send())).toEqual({ label: "Sending 32%", tone: "sending" });
    expect(tileLight(send({ status: "paused", pauseReason: "drive_full" }))?.label).toBe("Paused");
    expect(tileLight(send({ status: "done" }))?.label).toBe("In your Drive");
    expect(tileLight(send({ status: "canceled", stopReason: "canceled" }))).toBeNull();
  });

  it("shows an album's unfinished send before a newer closed one", () => {
    const sends = [send({ id: "new", status: "done" }), send({ id: "old", status: "paused", pauseReason: "drive_full" })];
    expect(sendForAlbum(sends, "e1")?.id).toBe("old");
    expect(sendForAlbum(sends, "e2")).toBeNull();
    expect(isUnfinished({ status: "checking" })).toBe(true);
    expect(isUnfinished({ status: "partly_done" })).toBe(false);
  });
});
