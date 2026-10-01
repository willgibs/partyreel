/**
 * WHAT SHE IS TOLD ON HER RETURN (crumbs-38). Pinned: an upload a decision let in since her row's mark is news, once;
 * one that went straight in, one still waiting, one hidden again and one already told are not; each row's mark moves to
 * the newest it told, exactly as the server wrote it, and never past what was read; rows keep their own marks; a time
 * that shares a millisecond with the mark but not a microsecond still counts.
 */
import { describe, expect, it } from "vitest";

import { letInNews, type LetInRow } from "./let-in-news";

const T = (micro: number) =>
  `2026-10-01T12:00:00.${String(micro).padStart(6, "0")}+00:00`;

const row = (
  id: string,
  letInAt: string | null,
  over: Partial<LetInRow> = {},
): LetInRow => ({
  id,
  guestId: "g-ticket",
  status: "approved",
  letInAt,
  ...over,
});

describe("her news", () => {
  it("★ an upload let in since her mark is news, and the mark moves to the newest it told", () => {
    const out = letInNews(
      [row("m1", T(100)), row("m2", T(300)), row("m3", T(200))],
      new Map([["g-ticket", null]]),
    );
    expect(out.ids).toEqual(["m2", "m3", "m1"]);
    expect(out.marks).toEqual(new Map([["g-ticket", T(300)]]));
  });

  it("told once: what the mark already covers is not news again", () => {
    const rows = [row("m1", T(100)), row("m2", T(300))];
    const first = letInNews(rows, new Map());
    const second = letInNews(rows, first.marks);
    expect(second.ids).toEqual([]);
    expect(second.marks.size).toBe(0);
  });

  it("never news: an upload that went straight in, one still waiting, one hidden or removed since", () => {
    const out = letInNews(
      [
        row("straight-in", null),
        row("waiting", null, { status: "pending" }),
        row("hidden-again", T(500), { status: "hidden" }),
        row("removed", T(600), { status: "removed" }),
      ],
      new Map(),
    );
    expect(out.ids).toEqual([]);
  });

  it("each row keeps its own mark: a ticket's and an account's are told apart", () => {
    const out = letInNews(
      [
        row("on-ticket", T(400)),
        row("on-account", T(150), { guestId: "g-account" }),
        row("told-on-account", T(90), { guestId: "g-account" }),
      ],
      new Map([
        ["g-ticket", T(500)],
        ["g-account", T(100)],
      ]),
    );
    expect(out.ids).toEqual(["on-account"]);
    expect(out.marks).toEqual(new Map([["g-account", T(150)]]));
  });

  it("★ compares to the microsecond: a decision inside the mark's millisecond but after it is still news", () => {
    const out = letInNews(
      [row("m1", T(123457))],
      new Map([["g-ticket", T(123456)]]),
    );
    expect(out.ids).toEqual(["m1"]);
  });

  it("a malformed time is never news, and never moves a mark", () => {
    const out = letInNews([row("m1", "yesterday")], new Map());
    expect(out.ids).toEqual([]);
    expect(out.marks.size).toBe(0);
  });
});
