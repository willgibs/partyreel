/**
 * THE CLAIMS REVIEW'S MACHINE (`identity-claims` r1 and r2, Will 2026-09-27). Pinned: one event at a
 * time, every decision written the moment it is made, a Not mine asking at its own card, an answer
 * that names another card dropped, a card that waits for its write, and a closed review that keeps
 * what she did and owes one toast. The double tap `claims-r3` found on the board is played here as
 * the sequence of dispatches a real double tap makes.
 */
import { describe, expect, it } from "vitest";

import type { ClaimableEvent } from "@/lib/db/queries/claims";

import {
  type Action,
  type Batch,
  bannerWords,
  EMPTY,
  endWords,
  photoCount,
  reduce,
  reviewOf,
  toastPointsToPage,
  toastWords,
} from "./claims-batch";

const row = (id: string, uploadCount: number): ClaimableEvent => ({
  eventId: id,
  eventName: `Event ${id}`,
  eventDate: "2026-08-29",
  names: ["Priya"],
  uploadCount,
  lastUploadAt: "2026-08-29T22:40:00.000Z",
  gate: null,
  previews: [],
});

const TOMS = row("toms", 4);
const BONFIRE = row("bonfire", 2);
const ANAS = row("anas", 3);
const QUIZ = row("quiz", 2);
const FOUR = [TOMS, BONFIRE, ANAS, QUIZ];

function play(actions: Action[], fresh = FOUR, from: Batch = EMPTY): Batch {
  return actions.reduce((b, a) => reduce(b, a, fresh), from);
}

const OPEN: Action = { type: "open" };
const claimed = (eventId: string): Action => ({
  type: "landed",
  eventId,
  outcome: { choice: "claim", next: null },
});

describe("one event at a time", () => {
  it("opens on the list's first event, the rest waiting in its order", () => {
    const review = reviewOf(play([OPEN]), FOUR);
    expect(review.top?.eventId).toBe("toms");
    expect(review.waiting.map((r) => r.eventId)).toEqual([
      "toms",
      "bonfire",
      "anas",
      "quiz",
    ]);
  });

  it("★ a Claim holds its card on top until its write lands, then the next comes up", () => {
    const writing = play([OPEN, { type: "claim", eventId: "toms" }]);
    expect(writing.writing?.row.eventId).toBe("toms");
    expect(reviewOf(writing, FOUR).top?.eventId).toBe("toms");
    const landed = reduce(writing, claimed("toms"), FOUR);
    expect(landed.decided.toms.choice).toBe("claim");
    expect(landed.writing).toBeNull();
    expect(reviewOf(landed, FOUR).top?.eventId).toBe("bonfire");
    expect(landed.added).toBe(4);
  });

  it("answers nothing while the review is closed", () => {
    expect(play([{ type: "claim", eventId: "toms" }])).toBe(EMPTY);
  });
});

describe("★ the double tap claims one event", () => {
  it("drops an answer that names a card other than the one on top", () => {
    const b = play([OPEN, { type: "claim", eventId: "bonfire" }]);
    expect(b.writing).toBeNull();
    expect(b.asking).toBeNull();
  });

  it("drops a second Claim while the first is being written, even on the same card", () => {
    const first = play([OPEN, { type: "claim", eventId: "toms" }]);
    expect(reduce(first, { type: "claim", eventId: "toms" }, FOUR)).toBe(first);
    expect(reduce(first, { type: "not-mine", eventId: "toms" }, FOUR)).toBe(
      first,
    );
  });

  it("a tap that reaches the machine after the write landed still names the card it was pressed on", () => {
    // Tap one claims Tom's; tap two, pressed on Tom's too, arrives once Bonfire is on top.
    const b = play([
      OPEN,
      { type: "claim", eventId: "toms" },
      claimed("toms"),
      { type: "claim", eventId: "toms" },
    ]);
    expect(b.writing).toBeNull();
    expect(Object.keys(b.decided)).toEqual(["toms"]);
  });
});

describe("Not mine asks at its card", () => {
  it("asks for the card on top and writes only once its dialog says Delete", () => {
    const asking = play([OPEN, { type: "not-mine", eventId: "toms" }]);
    expect(asking.asking?.eventId).toBe("toms");
    expect(asking.writing).toBeNull();
    const deleting = reduce(asking, { type: "delete", eventId: "toms" }, FOUR);
    expect(deleting.writing).toEqual({ row: TOMS, choice: "disown" });
    const done = reduce(
      deleting,
      { type: "landed", eventId: "toms", outcome: { choice: "disown" } },
      FOUR,
    );
    expect(done.asking).toBeNull();
    expect(done.decided.toms.choice).toBe("disown");
    expect(done.added).toBe(0);
    expect(reviewOf(done, FOUR).top?.eventId).toBe("bonfire");
  });

  it("Go back leaves the card on top, decided nothing", () => {
    const b = play([
      OPEN,
      { type: "not-mine", eventId: "toms" },
      { type: "go-back" },
    ]);
    expect(b.asking).toBeNull();
    expect(b.decided).toEqual({});
    expect(reviewOf(b, FOUR).top?.eventId).toBe("toms");
  });

  it("while the dialog asks, the card answers nothing else, and Delete names only the asking card", () => {
    const asking = play([OPEN, { type: "not-mine", eventId: "toms" }]);
    expect(reduce(asking, { type: "claim", eventId: "toms" }, FOUR)).toBe(
      asking,
    );
    expect(reduce(asking, { type: "delete", eventId: "bonfire" }, FOUR)).toBe(
      asking,
    );
  });

  it("the dialog cannot be put down while its Delete is being written", () => {
    const deleting = play([
      OPEN,
      { type: "not-mine", eventId: "toms" },
      { type: "delete", eventId: "toms" },
    ]);
    expect(reduce(deleting, { type: "go-back" }, FOUR)).toBe(deleting);
  });

  it("a failed Delete keeps the dialog asking, so she can try again or go back", () => {
    const b = play([
      OPEN,
      { type: "not-mine", eventId: "toms" },
      { type: "delete", eventId: "toms" },
      { type: "failed", eventId: "toms" },
    ]);
    expect(b.writing).toBeNull();
    expect(b.asking?.eventId).toBe("toms");
    expect(b.decided).toEqual({});
  });
});

describe("saved as she goes", () => {
  it("closing early keeps what she did, and the rest waits", () => {
    const b = play([
      OPEN,
      { type: "claim", eventId: "toms" },
      claimed("toms"),
      { type: "close" },
    ]);
    expect(b.open).toBe(false);
    expect(b.owed).toBe(true);
    expect(b.decided.toms.choice).toBe("claim");
    const fresh = [BONFIRE, ANAS, QUIZ];
    expect(reviewOf(b, fresh).waiting.map((r) => r.eventId)).toEqual([
      "bonfire",
      "anas",
      "quiz",
    ]);
  });

  it("a write still in flight when she closes lands anyway, and counts toward the toast it owes", () => {
    const b = play([
      OPEN,
      { type: "claim", eventId: "toms" },
      { type: "close" },
      claimed("toms"),
    ]);
    expect(b.decided.toms.choice).toBe("claim");
    expect(b.owed).toBe(true);
    expect(b.added).toBe(4);
    expect(reduce(b, { type: "said" }, FOUR)).toMatchObject({
      owed: false,
      added: 0,
    });
  });

  it("reopening shows what she decided above the card that waits", () => {
    const b = play([
      OPEN,
      { type: "claim", eventId: "toms" },
      claimed("toms"),
      { type: "close" },
      OPEN,
    ]);
    const review = reviewOf(b, [BONFIRE, ANAS, QUIZ]);
    expect(review.rows.map((r) => r.eventId)).toEqual([
      "toms",
      "bonfire",
      "anas",
      "quiz",
    ]);
    expect(review.top?.eventId).toBe("bonfire");
  });
});

describe("the list refreshed behind the review", () => {
  it("never pulls the card being written out from under her", () => {
    const writing = play([OPEN, { type: "claim", eventId: "toms" }]);
    // The refresh after an earlier write already dropped Tom's.
    const review = reviewOf(writing, [BONFIRE, ANAS, QUIZ]);
    expect(review.top?.eventId).toBe("toms");
  });

  it("keeps the asking card on top even when a new event joins the head of the list", () => {
    const asking = play([OPEN, { type: "not-mine", eventId: "toms" }]);
    const review = reviewOf(asking, [row("new", 1), ...FOUR]);
    expect(review.top?.eventId).toBe("toms");
  });

  it("lets an event sorted elsewhere leave, and a gone answer leave the list too", () => {
    const b = play([
      OPEN,
      { type: "claim", eventId: "toms" },
      { type: "landed", eventId: "toms", outcome: { choice: "gone" } },
    ]);
    const review = reviewOf(b, [ANAS, QUIZ]);
    expect(review.rows.map((r) => r.eventId)).toEqual(["anas", "quiz"]);
    expect(b.added).toBe(0);
  });
});

describe("the words", () => {
  it("counts photographs and events with their plurals and grouping", () => {
    expect(photoCount(1)).toBe("1\u00a0photo");
    expect(photoCount(1249)).toBe("1,249\u00a0photos");
    expect(bannerWords(FOUR, false)).toBe(
      "11\u00a0photos from 4 events are waiting for you",
    );
    expect(bannerWords([row("one", 1)], true)).toBe(
      "1\u00a0photo from 1 event is still waiting for you",
    );
    expect(endWords([])).toBe("Nothing was added to your account.");
    expect(endWords([TOMS, QUIZ])).toBe(
      "6\u00a0photos from 2 events are in your account now.",
    );
    expect(toastWords(1)).toBe("Added 1\u00a0photo to your account.");
  });

  it("★ points to her page once a beat: the invitation where it will stand, else the toast", () => {
    // No page, invitation not put away, nothing left: the invitation takes the banner's place.
    expect(toastPointsToPage({ invitesOnceSorted: true, waiting: 0 })).toBe(
      false,
    );
    // Events still wait: the banner stands, so the toast points.
    expect(toastPointsToPage({ invitesOnceSorted: true, waiting: 2 })).toBe(
      true,
    );
    // A page already, or the invitation put away: the toast is the only pointer.
    expect(toastPointsToPage({ invitesOnceSorted: false, waiting: 0 })).toBe(
      true,
    );
  });
});
