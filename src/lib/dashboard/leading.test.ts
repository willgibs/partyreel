import { describe, expect, it } from "vitest";

import type { GuestEventCardData } from "./guest-events";
import {
  buildHomeView,
  type DeletedEvent,
  type HomeInput,
  type HostedEvent,
} from "./home-view";
import { RULES, type RuleId } from "./lead";
import { drawnOf, leadingOf, pageAround } from "./leading";
import { homeContext, hostedEvent } from "./testing/home";

/**
 * THE PAGE AROUND ANY LEAD (host-dashboard r4, `chooser=words`). A rule's press moves the stage in the same frame, so the
 * client recomposes the page around the new lead from what the server sent. The one property that matters is that it
 * recomposes THE PAGE THE SERVER WOULD HAVE DRAWN for that choice: the lead leaves the week and her events, the lead the
 * server drew takes its place in them, every other card and row is untouched. Held here for every rule the server may
 * have drawn against every rule she may press, over a host whose week, bin and guest albums are all in play.
 */

const TODAY = "2026-11-10";
const ctx = homeContext(TODAY);

const guest: GuestEventCardData = {
  eventId: "g1",
  lastUploadAt: "2026-08-15T12:00:00Z",
  href: "/e/qr-g1",
  name: "Priya & Sam's Wedding",
  dateLabel: "August 15, 2026",
  byline: "Hosted by Priya",
  coverUrl: "https://r2.test/g1.webp",
  accessible: true,
  passwordProtected: false,
};
const binned: DeletedEvent = {
  id: "d1",
  name: "Test event",
  date: null,
  dateLabel: "No date set",
  coverUrl: null,
  deletedAt: "2026-11-01T10:00:00Z",
  countdown: "Deletes in 18 days",
};

/**
 * Lena's quiet Tuesday: a team lunch in two days and her 40th three days ago (both in the week), pancakes nobody dated
 * whose photographs landed five days ago (her newest made), a holiday party, and an old wedding she opened this morning.
 */
const LENA: HostedEvent[] = [
  hostedEvent({
    id: "pancakes",
    name: "Sunday pancakes",
    createdAt: "2026-11-04T09:00:00Z",
    lastArrival: { at: "2026-11-05T09:30:00Z", day: "2026-11-05" },
    approved: 40,
    stills: ["https://r2.test/pancakes.webp"],
  }),
  hostedEvent({
    id: "lunch",
    name: "Team lunch",
    createdAt: "2026-10-20T12:00:00Z",
    date: "2026-11-12",
    stills: [],
  }),
  hostedEvent({
    id: "fortieth",
    name: "Lena's 40th",
    createdAt: "2026-09-01T12:00:00Z",
    date: "2026-11-07",
    lastArrival: { at: "2026-11-07T22:00:00Z", day: "2026-11-07" },
    approved: 128,
    stills: ["https://r2.test/40th-a.webp", "https://r2.test/40th-b.webp"],
  }),
  hostedEvent({
    id: "holiday",
    name: "Holiday party",
    createdAt: "2026-08-01T12:00:00Z",
    date: "2026-12-12",
  }),
  hostedEvent({
    id: "wedding",
    name: "The Okafor wedding",
    createdAt: "2026-04-01T12:00:00Z",
    date: "2026-04-18",
    openedAt: "2026-11-10T08:00:00Z",
    approved: 300,
    stills: ["https://r2.test/okafor.webp"],
  }),
];

const input = (rule: RuleId, hosted = LENA): HomeInput => ({
  ctx,
  hosted,
  guests: [guest],
  deleted: [binned],
  siteUrl: "https://partyreel.com",
  stageReads: null,
  rule,
});

const byId = <T extends { id: string; kind?: string }>(list: readonly T[]) =>
  [...list].sort((a, b) =>
    `${a.kind}-${a.id}`.localeCompare(`${b.kind}-${b.id}`),
  );

describe("the lead each rule would draw", () => {
  it("is three different events on Lena's Tuesday, each with its words", () => {
    const view = buildHomeView(input("newest"));
    const leading = leadingOf(input("newest"), view)!;
    expect(
      Object.fromEntries(RULES.map((r) => [r, leading.choices[r].eventId])),
    ).toEqual({
      newest: "lunch",
      upcoming: "lunch",
      opened: "wedding",
      photos: "fortieth",
    });
    expect(leading.choices.newest.reason).toBe("In 2 days");
    expect(leading.choices.opened.reason).toBe("Where you left off");
    expect(leading.choices.photos.line).toBe(
      "Lena's 40th\u00a0· photos\u00a0Nov\u00a07",
    );
    expect(leading.rule).toBe("newest");
  });

  it("sends a stage for every other event a rule would lead with, and never the drawn one's", () => {
    const leading = leadingOf(input("newest"), buildHomeView(input("newest")))!;
    expect(Object.keys(leading.alts).sort()).toEqual(["fortieth", "wedding"]);
    expect(leading.alts.wedding!.event.id).toBe("wedding");
    expect(leading.alts.wedding!.photos.map((p) => p.url)).toEqual([
      "https://r2.test/okafor.webp",
    ]);
    // An unread fact is never guessed: no guest number for a stage nobody asked the guests of.
    expect(leading.alts.wedding!.guests).toBeNull();
    expect(leading.alts.wedding!.share.joinUrl).toBe(
      "https://partyreel.com/e/qr-wedding",
    );
  });

  it("parks the drawn lead's card and row, and the week's order whole", () => {
    const leading = leadingOf(input("newest"), buildHomeView(input("newest")))!;
    // The lunch is in the week and leads, so its card is parked; the week's order holds it beside the 40th.
    expect(leading.parked.card?.id).toBe("lunch");
    expect(leading.parked.row).toMatchObject({ kind: "hosted", id: "lunch" });
    expect(leading.weekIds).toEqual(["lunch", "fortieth"]);
    // A drawn lead that is not in the week parks no card.
    const opened = leadingOf(input("opened"), buildHomeView(input("opened")))!;
    expect(opened.parked.card).toBeNull();
    expect(opened.parked.row.id).toBe("wedding");
  });
});

describe("★ the page around a lead is the page the server would draw", () => {
  for (const drawn of RULES) {
    for (const pressed of RULES) {
      it(`drawn for ${drawn}, then ${pressed} pressed`, () => {
        const view = buildHomeView(input(drawn));
        const leading = leadingOf(input(drawn), view)!;
        const around = pageAround(drawnOf(view)!, leading, pressed);
        const server = buildHomeView(input(pressed));
        expect(around.stage).toEqual(server.stage);
        expect(around.week).toEqual(server.week);
        // Her events lay themselves out by her Display, so their order here is not the page's: the set and each row are.
        expect(byId(around.rows)).toEqual(byId(server.events.rows));
      });
    }
  }

  it("takes the lead out of the week and out of her events, and holds every other event once", () => {
    const view = buildHomeView(input("newest"));
    const leading = leadingOf(input("newest"), view)!;
    const around = pageAround(drawnOf(view)!, leading, "photos");
    expect(around.stage?.event.id).toBe("fortieth");
    // The lunch the server drew goes back into the week, in the 40th's place.
    expect(around.week.map((c) => c.id)).toEqual(["lunch"]);
    const hosted = around.rows
      .filter((r) => r.kind === "hosted")
      .map((r) => r.id);
    expect(hosted.sort()).toEqual(["holiday", "lunch", "pancakes", "wedding"]);
    // Her guest albums and her bin ride along untouched.
    expect(
      around.rows.filter((r) => r.kind !== "hosted").map((r) => r.id),
    ).toEqual(["g1", "d1"]);
  });

  it("is the drawn page itself for the rule the server drew", () => {
    const view = buildHomeView(input("upcoming"));
    const leading = leadingOf(input("upcoming"), view)!;
    const around = pageAround(drawnOf(view)!, leading, "upcoming");
    expect(around.stage).toBe(view.stage);
    expect(around.week).toBe(view.week);
    expect(around.rows).toBe(view.events.rows);
  });

  it("is the drawn page for a rule that leads with the same event, whichever rule the server drew", () => {
    // Newest and Upcoming both lead with the lunch on this Tuesday.
    const view = buildHomeView(input("newest"));
    const leading = leadingOf(input("newest"), view)!;
    expect(pageAround(drawnOf(view)!, leading, "upcoming").stage).toBe(
      view.stage,
    );
  });
});

describe("where she has no choice", () => {
  it("sends nothing for one event", () => {
    const one = [LENA[0]!];
    expect(
      leadingOf(input("newest", one), buildHomeView(input("newest", one))),
    ).toBeNull();
  });

  it("sends nothing while a party is on its day: it leads under every rule", () => {
    const tonight = [
      ...LENA,
      hostedEvent({
        id: "tonight",
        createdAt: "2026-10-01T00:00:00Z",
        date: TODAY,
      }),
    ];
    const view = buildHomeView(input("photos", tonight));
    expect(view.stage?.event.id).toBe("tonight");
    expect(leadingOf(input("photos", tonight), view)).toBeNull();
  });

  it("sends nothing for no events at all", () => {
    expect(
      leadingOf(input("newest", []), buildHomeView(input("newest", []))),
    ).toBeNull();
  });
});

describe("the rule the page is drawn for", () => {
  it("leads with Newest's event when none is said, as the page always did", () => {
    const { rule: _said, ...plain } = input("newest");
    expect(buildHomeView(plain).stage?.event.id).toBe("lunch");
  });

  it("leads with the kept rule's event, and the stage's reads follow that event", () => {
    const view = buildHomeView({
      ...input("photos"),
      stageReads: { id: "fortieth", photos: null, guests: 7 },
    });
    expect(view.stage?.event.id).toBe("fortieth");
    expect(view.stage?.guests).toBe(7);
    // The same reads, for an event that does not lead, are nobody's.
    const other = buildHomeView({
      ...input("opened"),
      stageReads: { id: "fortieth", photos: null, guests: 7 },
    });
    expect(other.stage?.event.id).toBe("wedding");
    expect(other.stage?.guests).toBeNull();
  });
});
