import { describe, expect, it } from "vitest";

import { buildHomeView } from "@/lib/dashboard/home-view";
import { momentEvent } from "@/lib/dashboard/moment";

import {
  HOSTS,
  JO_EVENT_COUNT,
  JO_THREE,
  RAE_EVENT_COUNT,
  RAE_TARGET,
} from "./fixtures";
import {
  arrange,
  changed,
  COUNT_WORDS,
  countSaid,
  factOf,
  factsOf,
  headLine,
  homeAround,
  homeInput,
  leadLine,
  leadOf,
  leadWhyOf,
  lifted,
  PREFS_DEFAULT,
  rangeLabel,
  rangeLine,
  rangeWhen,
  recentRows,
  RULES,
  weekWithUndated,
} from "./model";

/**
 * THE BOARD DRAWS PRODUCTION'S PAGE, AND ITS RULES SAY WHAT THE SPEC SAYS.
 *
 * The frames are only worth a decision if the page in them is the page
 * production composes, so the first half pins that: around production's own
 * lead the board's page is `buildHomeView`'s, and moving the stage to another
 * event changes nothing but the stage, where its event is left out, and a
 * range's words. The second half pins the rules to the frames' words: the four
 * rules and the fact each read, a range's when, the collection's filter and
 * sort, and the details H6 draws the other way.
 */

const ALL = Object.values(HOSTS);

describe("the page the frames draw", () => {
  it("is production's own around production's lead", () => {
    for (const host of ALL) {
      const lead = momentEvent(host.hosted, host.ctx.today)!.event;
      const production = buildHomeView(homeInput(host, lead.id));
      // The decoy's route to the same lead draws the same page, to the byte.
      expect(lifted(host, lead)).toEqual(production);
      // And the board's page differs from it only in a range's words.
      const drawn = homeAround(host, lead.id);
      expect(drawn.stage).toEqual(production.stage);
      expect(drawn.events.seasons).toEqual(production.events.seasons);
      drawn.events.rows.forEach((row, i) => {
        const was = production.events.rows[i]!;
        if (host.ends[row.id]) expect(row.dateLabel).not.toBe(was.dateLabel);
        else expect(row).toEqual(was);
      });
    }
  });

  it("moves only the stage when another event leads", () => {
    for (const host of ALL) {
      for (const lead of host.hosted.slice(0, 12)) {
        const view = homeAround(host, lead.id);
        expect(view.stage?.event.id).toBe(lead.id);
        const rows = view.events.rows
          .filter((r) => r.kind === "hosted")
          .map((r) => r.id)
          .sort();
        const others = host.hosted
          .map((e) => e.id)
          .filter((id) => id !== lead.id)
          .sort();
        expect(rows).toEqual(others);
        expect(view.week.some((c) => c.id === lead.id)).toBe(false);
        expect(JSON.stringify(view)).not.toContain("hd-decoy");
      }
    }
  });

  it("holds one, three, ten, forty and two hundred events, and no party on its day", () => {
    expect(HOSTS.maya.hosted).toHaveLength(1);
    expect(HOSTS.nia.hosted).toHaveLength(3);
    expect(HOSTS.ari.hosted).toHaveLength(10);
    expect(JO_EVENT_COUNT).toBe(40);
    expect(RAE_EVENT_COUNT).toBe(200);
    for (const host of ALL)
      expect(
        host.hosted.some((e) => e.date === host.ctx.today),
        `${host.id} has a party on the board's day, which would draw a live stage`,
      ).toBe(false);
    // Rae's names are an event's, never repeated: a list of two hundred is read by name.
    const names = HOSTS.rae.hosted.map((e) => e.name);
    expect(new Set(names).size).toBe(names.length);
  });
});

describe("the stage's rule", () => {
  const { nia, jo, maya, ari } = HOSTS;

  it("leads Nia's page with the wedding she made last night, as lead=made settled", () => {
    expect(leadOf(nia, "newest", nia.trail)?.id).toBe("nia-wedding");
    expect(leadOf(nia, "opened", nia.trail)?.id).toBe("nia-wedding");
    // Nothing of hers is dated, so Upcoming falls back to the newest.
    expect(leadOf(nia, "upcoming", nia.trail)?.id).toBe("nia-wedding");
    expect(leadOf(nia, "photos", nia.trail)?.id).toBe("nia-engagement");
  });

  it("gives Jo's lull four different stages, one a rule", () => {
    expect(leadOf(jo, "newest", jo.trail)?.id).toBe("jo-spring-launch");
    expect(leadOf(jo, "upcoming", jo.trail)?.id).toBe("jo-holiday-26");
    expect(leadOf(jo, "opened", jo.trail)?.id).toBe(JO_THREE[2]);
    expect(leadOf(jo, "photos", jo.trail)?.id).toBe("jo-offsite");
  });

  it("leads with a party within a month under Newest", () => {
    // Ari's housewarming is her newest and 18 days out: the two agree.
    expect(leadOf(ari, "newest", ari.trail)?.id).toBe("ari-housewarming");
    const rae = HOSTS.rae;
    const lead = leadOf(rae, "newest", rae.trail)!;
    expect(momentEvent(rae.hosted, rae.ctx.today)!.event.id).toBe(lead.id);
  });

  it("leaves a host with one event on that event, whatever the rule", () => {
    for (const rule of ["newest", "upcoming", "opened", "photos"] as const)
      expect(leadOf(maya, rule, maya.trail)?.id).toBe("maya-30th");
  });
});

describe("why a rule leads", () => {
  const { nia, jo, lena } = HOSTS;
  const say = (host: (typeof HOSTS)[keyof typeof HOSTS]) =>
    Object.fromEntries(
      RULES.map((r) => {
        const lead = leadWhyOf(host, r.id, host.trail)!;
        return [r.id, leadLine(lead, host.ends, host.ctx.today)];
      }),
    );

  it("says the fact each rule read, so three agreeing on Nia's wedding read as three reasons", () => {
    expect(say(nia)).toEqual({
      newest: "Nia & Alex's Wedding · made yesterday",
      upcoming: "Nia & Alex's Wedding · nothing dated ahead",
      opened: "Nia & Alex's Wedding · opened last",
      photos: "Our Engagement Party · photos Sep 26",
    });
  });

  it("names Newest's party within a month by its day, never as her newest", () => {
    // Lena's newest made is Sunday's pancakes; Thursday's lunch leads by being near.
    const lead = leadWhyOf(lena, "newest", lena.trail)!;
    expect(lead.event.id).toBe("lena-lunch");
    expect(lead.why).toBe("near");
    expect(factOf(lead, lena.ends, lena.ctx.today)).toBe("in 2 days");
  });

  it("agrees with leadOf on every host and rule", () => {
    for (const host of ALL)
      for (const r of RULES)
        expect(leadWhyOf(host, r.id, host.trail)?.event.id).toBe(
          leadOf(host, r.id, host.trail)?.id,
        );
    expect(leadWhyOf(jo, "upcoming", jo.trail)?.why).toBe("next");
  });
});

describe("the dashboard's details the other way (H6)", () => {
  const { maya, lena } = HOSTS;

  it("counts a capped plan's events against its limit only the other way", () => {
    expect(headLine(maya, false)).toBe("1 event · Event Pass");
    expect(headLine(maya, true)).toBe("1 of 1 event · Event Pass");
    // A plan with no cap says the same either way.
    expect(headLine(lena, true)).toBe(headLine(lena, false));
  });

  it("holds an undated album in the week by its photos' day only the other way", () => {
    const built = homeAround(lena, leadOf(lena, "newest", lena.trail)!.id);
    expect(built.week.map((c) => c.id)).toEqual(["lena-40th"]);
    const other = weekWithUndated(built, lena);
    // The nearest first: Sunday's photos before Saturday's party.
    expect(other.week.map((c) => c.id)).toEqual(["lena-pancakes", "lena-40th"]);
    expect(other.week[0]!.when).toMatch(/^Photos /);
  });

  it("says the count's other word wherever the week says it", () => {
    const built = homeAround(lena, leadOf(lena, "newest", lena.trail)!.id);
    const said = countSaid(built, COUNT_WORDS.other);
    expect(said.week[0]!.quiet).toBe("128 photos and videos");
  });
});

describe("a range of days", () => {
  const today = "2026-11-10";

  it("says a range in the tile's fewest words", () => {
    expect(rangeWhen("2026-11-14", "2026-11-15", today)).toBe("Sat – Sun");
    expect(rangeWhen("2026-05-01", "2026-05-03", today)).toBe("May 1 – 3");
    expect(rangeWhen("2026-10-30", "2026-11-01", today)).toBe(
      "Oct 30 – Nov 1",
    );
    expect(rangeWhen("2025-06-07", "2025-06-08", today)).toBe("Jun 2025");
  });

  it("says it in full for the table and the stage", () => {
    expect(rangeLabel("2026-10-06", "2026-10-07")).toBe("October 6 – 7, 2026");
    expect(rangeLabel("2026-10-31", "2026-11-01")).toBe(
      "October 31 – November 1, 2026",
    );
    expect(rangeLine("2026-11-14", "2026-11-15")).toBe(
      "Saturday, November 14 to Sunday, November 15",
    );
  });

  it("reaches the rows of a ranged event", () => {
    const jo = HOSTS.jo;
    const view = homeAround(jo, "jo-spring-launch");
    const hen = view.events.rows.find((r) => r.id === "jo-hen")!;
    expect(hen.when).toBe("May 1 – 3");
    expect(hen.dateLabel).toBe("May 1 – 3, 2026");
  });
});

describe("her events, laid out", () => {
  const { jo, rae } = HOSTS;

  it("opens as covers, the newest first, every event once", () => {
    const view = homeAround(jo, "jo-spring-launch");
    const facts = factsOf(jo, jo.trail);
    const [all] = arrange(view.events.rows, PREFS_DEFAULT, facts);
    const live = view.events.rows.filter((r) => r.kind !== "deleted");
    expect(all!.rows).toHaveLength(live.length);
    // Newest made first: the year's two big nights lead the launch's shadow.
    expect(all!.rows[0]!.id).toBe("jo-nye-grand");
    expect(changed(PREFS_DEFAULT)).toEqual([]);
  });

  // Round three's field that found by a word (`find`) retired with its round;
  // the Display menu's year is how the planner reaches an old party now.
  it("finds Rae's 2023 wedding by its year in the Display menu", () => {
    const raeView = homeAround(rae, leadOf(rae, "newest", rae.trail)!.id);
    const raeFacts = factsOf(rae, rae.trail);
    const groups = arrange(
      raeView.events.rows,
      { ...PREFS_DEFAULT, layout: "table", sort: "date", year: "2023" },
      raeFacts,
    );
    const ids = groups.flatMap((g) => g.rows.map((r) => r.id));
    expect(ids).toContain(RAE_TARGET);
    expect(ids.length).toBeLessThan(70);
  });

  it("keeps the undated last when sorted by date, either way", () => {
    const view = homeAround(jo, "jo-holiday-26");
    const facts = factsOf(jo, jo.trail);
    for (const desc of [true, false]) {
      const [all] = arrange(
        view.events.rows,
        { ...PREFS_DEFAULT, sort: "date", desc },
        facts,
      );
      expect(all!.rows.at(-1)!.id).toBe("jo-spring-launch");
    }
  });

  it("puts the three weddings she opened at the head of Recent, never the stage's", () => {
    const view = homeAround(jo, "jo-holiday-26");
    const recent = recentRows(view, ["jo-holiday-26", ...jo.trail]).map(
      (r) => r.id,
    );
    expect(recent.slice(0, 3)).toEqual([...JO_THREE].reverse());
    expect(recent).not.toContain("jo-holiday-26");
  });
});
