import { describe, expect, it } from "vitest";

import {
  checkedAll,
  isUnfinished,
  momentOf,
  sendForAlbum,
  tileLight,
  timeLeftWords,
  type SendView,
} from "./moments";

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
  ...[
    "drive_full",
    "daily_limit",
    "disconnected",
    "folder_gone",
    "domain_policy",
    "failing",
    "breaker",
    "operator",
  ].map((pauseReason) => send({ status: "paused", pauseReason })),
  send({ status: "done", itemsSent: 312 }),
  send({ status: "partly_done", itemsSent: 309, itemsFailed: 3 }),
  // A Disconnect's and another account's cancels are an earlier connection's: no place draws them (this-connection.ts).
  ...["canceled", "operator", "album_deleted"].map((stopReason) =>
    send({ status: "canceled", stopReason }),
  ),
  send({ status: "stopped", stopReason: "expired" }),
  send({ status: "stopped", stopReason: "failed_to_start", itemsSent: 0 }),
  send({ status: "canceled", stopReason: "canceled", landing: true }),
  send({ status: "stopped", stopReason: "expired", landing: true }),
  send({ status: "done", itemsSent: 0, itemsSkipped: 3 }),
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

  it("says who stopped a canceled send, and a stop with no words of its own never says she canceled it", () => {
    const title = (stopReason: string | null) =>
      momentOf(send({ status: "canceled", stopReason }), NOW, "UTC").title;
    expect(title("canceled")).toBe("You canceled this send");
    expect(title(null)).toBe("You canceled this send");
    expect(title("operator")).toBe("We stopped this send");
    for (const earlier of ["disconnected", "account_changed", "unheard_of"])
      expect(title(earlier), earlier).toBe("This send stopped");
  });

  it("★ never suggests deleting what was sent, or freeing space here (an off-ramp, never a one-click exit)", () => {
    for (const s of EVERY) {
      const m = momentOf(s, NOW, "UTC");
      const words = [
        m.word,
        m.title,
        m.facts,
        m.line ?? "",
        ...m.acts.map((a) => a.label),
      ].join(" ");
      expect(
        words,
        `${s.status}:${s.pauseReason ?? s.stopReason ?? ""}`,
      ).not.toMatch(
        /\bdelete\b|\bfree up\b|\bfree space\b|\bremove\b|\bexit\b|\bclear out\b/i,
      );
    }
  });

  it("says each stop's one act, and a pause that carries on by itself asks nothing", () => {
    const lead = (s: SendView) =>
      momentOf(s, NOW, "UTC").acts.find((a) => a.lead)?.id ?? null;
    expect(lead(send({ status: "paused", pauseReason: "drive_full" }))).toBe(
      "check",
    );
    expect(lead(send({ status: "paused", pauseReason: "disconnected" }))).toBe(
      "reconnect",
    );
    expect(lead(send({ status: "paused", pauseReason: "folder_gone" }))).toBe(
      "check",
    );
    expect(lead(send({ status: "partly_done", itemsFailed: 3 }))).toBe("retry");
    expect(
      lead(send({ status: "paused", pauseReason: "daily_limit" })),
    ).toBeNull();
    expect(lead(send({ status: "paused", pauseReason: "breaker" }))).toBeNull();
    expect(
      lead(send({ status: "paused", pauseReason: "operator" })),
    ).toBeNull();
  });

  it("says done as done: every one checked, Open in Drive", () => {
    const m = momentOf(send({ status: "done", itemsSent: 312 }), NOW, "UTC");
    expect(m.title).toBe("Maya & Jay is in your Google Drive");
    expect(m.facts).toContain("every one checked");
    expect(m.acts).toEqual([{ id: "open", label: "Open in Drive" }]);
  });

  it("★ never says every one checked of a send that sent nothing (nothing was checked)", () => {
    const nothing = send({
      status: "done",
      itemsTotal: 3,
      itemsSent: 0,
      itemsSkipped: 3,
      bytesSent: 0,
    });
    const m = momentOf(nothing, NOW, "UTC");
    expect(m.facts).not.toContain("checked");
    expect(m.title).toBe("Nothing of Maya & Jay was left to send");
    expect(m.facts).toBe("3 left the album while sending");
    expect(checkedAll(nothing)).toBe(false);
    expect(tileLight(nothing)).toBeNull();
    expect(checkedAll(send({ status: "done", itemsSent: 1 }))).toBe(true);
    expect(checkedAll(send({ status: "checking", itemsSent: 9 }))).toBe(false);
  });

  it("★ tells what a canceled send landed: so far while its files land, what stayed once they have, Send again only then", () => {
    const landing = momentOf(
      send({
        status: "canceled",
        stopReason: "canceled",
        itemsTotal: 60,
        itemsSent: 10,
        landing: true,
      }),
      NOW,
      "UTC",
    );
    expect(landing).toMatchObject({
      word: "Stopping",
      title: "You canceled this send",
      facts: "10 of 60 reached your Drive so far",
      line: "The files already on their way are still landing.",
      acts: [],
    });
    const landed = momentOf(
      send({
        status: "canceled",
        stopReason: "canceled",
        itemsTotal: 60,
        itemsSent: 14,
      }),
      NOW,
      "UTC",
    );
    expect(landed.facts).toBe(
      "14 of 60 reached your Drive and stay there. Sending again takes only the rest.",
    );
    expect(landed.acts).toEqual([{ id: "send_again", label: "Send again" }]);
    // A send that ran too long lands its last files the same way; one that never started has none on their way.
    expect(
      momentOf(
        send({ status: "stopped", stopReason: "expired", landing: true }),
        NOW,
        "UTC",
      ).word,
    ).toBe("Stopping");
    expect(
      momentOf(
        send({
          status: "stopped",
          stopReason: "failed_to_start",
          itemsSent: 0,
          landing: true,
        }),
        NOW,
        "UTC",
      ).word,
    ).toBe("Stopped");
  });

  it("says a send that stopped moving is slow, without a guess at the time left", () => {
    const m = momentOf(
      send({ lastProgressAt: "2026-10-05T11:30:00Z" }),
      NOW,
      "UTC",
    );
    expect(m.line).toMatch(/Taking longer than usual/);
    expect(m.facts).not.toMatch(/left$/);
  });
});

describe("the time left", () => {
  it("waits for a minute of pace, then reads it", () => {
    expect(
      timeLeftWords(send({ startedAt: "2026-10-05T11:59:30Z" }), NOW),
    ).toBeNull();
    // 300 MB in 10 minutes; 700 MB to go: about 24 minutes.
    expect(timeLeftWords(send(), NOW)).toBe("about 24 minutes left");
    expect(timeLeftWords(send({ bytesSent: 0 }), NOW)).toBeNull();
  });
});

describe("the dashboard's light and the album's send", () => {
  it("lights a running send's percent and a stop's word; says nothing for one canceled", () => {
    expect(tileLight(send())).toEqual({
      label: "Sending 32%",
      tone: "sending",
    });
    expect(
      tileLight(send({ status: "paused", pauseReason: "drive_full" }))?.label,
    ).toBe("Paused");
    expect(tileLight(send({ status: "done" }))?.label).toBe("In your Drive");
    expect(
      tileLight(send({ status: "canceled", stopReason: "canceled" })),
    ).toBeNull();
  });

  it("shows an album's unfinished send before a newer closed one", () => {
    const sends = [
      send({ id: "new", status: "done" }),
      send({ id: "old", status: "paused", pauseReason: "drive_full" }),
    ];
    expect(sendForAlbum(sends, "e1")?.id).toBe("old");
    expect(sendForAlbum(sends, "e2")).toBeNull();
    expect(isUnfinished({ status: "checking" })).toBe(true);
    expect(isUnfinished({ status: "partly_done" })).toBe(false);
  });
});
