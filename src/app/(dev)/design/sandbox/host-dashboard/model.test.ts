import { describe, expect, it } from "vitest";

import { buildHomeView } from "@/lib/dashboard/home-view";
import { momentEvent } from "@/lib/dashboard/moment";

import {
  dayById,
  HOSTS,
  JO_AFTER_THREE,
  JO_EVENT_COUNT,
  JO_THREE,
} from "./fixtures";
import {
  contenders,
  displayGroups,
  homeAround,
  homeInput,
  indexOf,
  lifted,
  recentRows,
  rests,
  ruleLead,
} from "./model";

/**
 * THE BOARD DRAWS PRODUCTION'S PAGE, AND ITS RULES SAY WHAT THE SPEC SAYS.
 *
 * The frames are only worth a decision if the page as built in them is the
 * page production composes, so the first half pins that: around production's
 * own lead the board's page is `buildHomeView`'s, and the decoy that moves the
 * stage to another event changes nothing but the stage and where its event is
 * left out. The second half pins the quiet-day rules to the frames' words.
 */

const ALL = Object.values(HOSTS);

describe("the page the frames draw", () => {
  it("is production's own around production's lead", () => {
    for (const host of ALL) {
      const lead = momentEvent(host.hosted, host.ctx.today)!.event;
      const production = buildHomeView(homeInput(host, lead.id));
      expect(homeAround(host, lead.id)).toEqual(production);
      // The decoy's route to the same lead draws the same page, to the byte.
      expect(lifted(host, lead)).toEqual(production);
    }
  });

  it("moves only the stage when another event leads", () => {
    for (const host of ALL) {
      for (const lead of host.hosted) {
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
        const grouped = view.events.seasons
          .filter((s) => s.id !== "guest")
          .flatMap((s) => s.ids)
          .sort();
        expect(grouped).toEqual(others);
        expect(view.week.some((c) => c.id === lead.id)).toBe(false);
        expect(JSON.stringify(view)).not.toContain("hd-decoy");
      }
    }
  });

  it("holds forty events for Jo, and no party on its day for anyone", () => {
    expect(JO_EVENT_COUNT).toBe(40);
    for (const host of ALL)
      expect(
        host.hosted.some((e) => e.date === host.ctx.today),
        `${host.id} has a party on the board's day, which would draw a live stage`,
      ).toBe(false);
  });
});

describe("the quiet day's rules", () => {
  const { nia, jo, maya } = HOSTS;

  it("leads Nia's page with the old album as built, and her new wedding otherwise", () => {
    expect(ruleLead("time", nia, nia.trail)?.id).toBe("nia-engagement");
    expect(ruleLead("made", nia, nia.trail)?.id).toBe("nia-wedding");
    expect(ruleLead("left", nia, nia.trail)?.id).toBe("nia-wedding");
  });

  it("leads Jo's lull with her next party, her newest event, or where she left off", () => {
    expect(ruleLead("time", jo, jo.trail)?.id).toBe("jo-holiday-26");
    expect(ruleLead("made", jo, jo.trail)?.id).toBe("jo-spring-launch");
    expect(ruleLead("left", jo, jo.trail)?.id).toBe("jo-theo-ana");
    // Coming back from another old album moves `left`'s stage, and only `left`'s.
    const back = ["jo-grace-femi", ...jo.trail];
    expect(ruleLead("left", jo, back)?.id).toBe("jo-grace-femi");
    expect(ruleLead("time", jo, back)?.id).toBe("jo-holiday-26");
    expect(ruleLead("made", jo, back)?.id).toBe("jo-spring-launch");
  });

  it("leaves a host with one event on that event, whatever the rule", () => {
    for (const rule of ["time", "made", "left", "rest"] as const)
      expect(ruleLead(rule, maya, maya.trail)?.id).toBe("maya-30th");
  });

  it("rests the stage for a planner's quiet day only", () => {
    expect(rests("rest", jo)).toBe(true);
    expect(ruleLead("rest", jo, jo.trail)?.id).toBe("jo-holiday-26");
    // Under nine events the stage stands: a host with a few keeps the page that is her party.
    expect(rests("rest", nia)).toBe(false);
    expect(rests("rest", maya)).toBe(false);
    for (const rule of ["time", "made", "left"] as const)
      expect(rests(rule, jo)).toBe(false);
  });

  it("steps through three distinct contenders, the rule's lead first", () => {
    const list = contenders("time", jo, jo.trail);
    expect(list.map((e) => e.id)).toEqual([
      "jo-holiday-26",
      "jo-spring-launch",
      "jo-offsite",
    ]);
    expect(contenders("made", nia, nia.trail)[0]!.id).toBe("nia-wedding");
  });
});

describe("the collection's layouts", () => {
  const { jo } = HOSTS;
  const days = dayById(jo);

  it("puts the three weddings she opened at the head of Recent", () => {
    const view = homeAround(jo, "jo-holiday-26");
    const recent = recentRows(view, JO_AFTER_THREE).map((r) => r.id);
    expect(recent.slice(0, 3)).toEqual([...JO_THREE].reverse());
    // The stage's own event never repeats in the row under it.
    expect(recent).not.toContain("jo-holiday-26");
  });

  it("groups by year with the undated first, every event once", () => {
    const view = homeAround(jo, "jo-holiday-26");
    const live = view.events.rows.filter((r) => r.kind !== "deleted");
    const groups = displayGroups(live, view.events.seasons, days, {
      show: "list",
      group: "year",
      order: "date",
    });
    expect(groups.map((g) => g.label)).toEqual(["No date yet", "2026", "2025"]);
    expect(groups.flatMap((g) => g.rows).length).toBe(live.length);
  });

  it("keeps what is coming as covers and lists the rest", () => {
    const view = homeAround(jo, "jo-holiday-26");
    const live = view.events.rows.filter((r) => r.kind !== "deleted");
    const { near, past, years } = indexOf(live, view.events.seasons, days);
    expect(near.map((g) => g.id)).toEqual(["coming"]);
    expect(near[0]!.rows.length + past.length).toBe(live.length);
    expect(years).toEqual(["2026", "2025"]);
  });
});
