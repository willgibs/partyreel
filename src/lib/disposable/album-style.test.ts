/**
 * THE ALBUM'S STYLE (the-wait r1, `model=time` with option 2's Settings): three named albums over the event's two
 * answers, each press one save of all three columns; a mix outside them is no style; what a switch shows or releases is
 * asked first; approval never stands with a develop (`both=never`).
 */
import { describe, expect, it } from "vitest";

import {
  ALBUM_STYLES,
  APPROVAL_NEVER_WITH_A_DEVELOP,
  approvalWithADevelop,
  createFieldsOf,
  PRESET_NAME,
  patchForStyle,
  styleLine,
  styleOf,
  STYLE_NAMES,
  styleSwitchConsequence,
} from "@/lib/disposable/album-style";
import { defaultDevelopAt } from "@/lib/disposable/reveal";

const NOW = Date.parse("2026-10-10T20:00:00Z");
const AHEAD = "2026-10-11T16:00:00.000Z";
const PAST = "2026-10-09T16:00:00.000Z";

describe("styleOf: a style is words over the columns, never a column", () => {
  it("Live is free uploads right away; Review free uploads held for her; Disposable the camera with a develop time", () => {
    expect(
      styleOf({ capture: "upload", review: false, developsAt: null }),
    ).toBe("live");
    expect(styleOf({ capture: "upload", review: true, developsAt: null })).toBe(
      "approval",
    );
    expect(
      styleOf({ capture: "camera", review: false, developsAt: AHEAD }),
    ).toBe("disposable");
  });

  it("★ a disposable that developed is still a disposable (its develop time stands, reached)", () => {
    expect(
      styleOf({ capture: "camera", review: false, developsAt: PAST }),
    ).toBe("disposable");
  });

  it("a mix outside the three is no style: Settings shows it under Customize", () => {
    expect(
      styleOf({ capture: "camera", review: false, developsAt: null }),
    ).toBeNull();
    expect(
      styleOf({ capture: "camera", review: true, developsAt: null }),
    ).toBeNull();
    expect(
      styleOf({ capture: "upload", review: false, developsAt: AHEAD }),
    ).toBeNull();
  });

  it("the preset is named Disposable (Will's `name=disposable`), and the three in their order", () => {
    expect(PRESET_NAME).toBe("Disposable");
    expect(ALBUM_STYLES).toEqual(["live", "approval", "disposable"]);
    // ★ RESHAPED ON PURPOSE (create-wizard r3, Will: "should we go with a more simple 'Review'?"; scar kept: three
    // one-word modes, the middle named for where its photos go, her Review room): it read "Reviewed" before.
    expect(STYLE_NAMES).toEqual({
      live: "Live",
      approval: "Review",
      disposable: "Disposable",
    });
  });

  it("each style says itself in one line, the roll's own size on the disposable", () => {
    expect(styleLine("live", { rollSize: null })).toBe(
      "Every photo shows the moment it's added.",
    );
    expect(styleLine("approval", { rollSize: null })).toBe(
      "You let each photo in before anyone sees it.",
    );
    expect(styleLine("disposable", { rollSize: 12 })).toBe(
      "The album's camera, 12 shots each. Everyone's develop at once.",
    );
    expect(styleLine("disposable", { rollSize: null })).toBe(
      "The album's camera, 24 shots each. Everyone's develop at once.",
    );
  });
});

describe("patchForStyle: one save of all three columns, so no half-state is ever stored", () => {
  it("Live and Review write free uploads and no develop time", () => {
    const from = {
      capture: "camera" as const,
      review: false,
      developsAt: AHEAD,
    };
    expect(
      patchForStyle("live", from, { eventDate: null, nowMs: NOW }),
    ).toEqual({
      capture: "upload",
      review: false,
      developsAt: null,
    });
    expect(
      patchForStyle("approval", from, { eventDate: null, nowMs: NOW }),
    ).toEqual({
      capture: "upload",
      review: true,
      developsAt: null,
    });
  });

  it("Disposable keeps a develop time still ahead, else offers 9 am the day after the party, and never approval", () => {
    expect(
      patchForStyle(
        "disposable",
        { capture: "upload", review: false, developsAt: AHEAD },
        { eventDate: "2026-10-10", nowMs: NOW },
      ),
    ).toEqual({ capture: "camera", review: false, developsAt: AHEAD });
    const fresh = patchForStyle(
      "disposable",
      { capture: "upload", review: true, developsAt: null },
      { eventDate: "2026-10-10", nowMs: NOW },
    );
    expect(fresh).toEqual({
      capture: "camera",
      review: false,
      developsAt: defaultDevelopAt({
        eventDate: "2026-10-10",
        now: new Date(NOW),
      }).toISOString(),
    });
  });
});

describe("patchForStyle takes the party's zone directly (crumbs-85: the seeding retired in its home)", () => {
  // ★ Reshaped by crumbs-91 (call AY1; scar kept: the party's 9 am, never the browser's). The expired reason: the album
  // turning at that same instant, which it no longer does (it turns at her close, or at this develop itself).
  it("★ offers 9 am the morning after in the PARTY's zone, the default develop's own rule, never the browser's", () => {
    const facts = { eventDate: "2026-10-09", eventEndDate: "2026-10-11" };
    const nowMs = Date.parse("2026-10-05T22:00:00Z");
    const fresh = patchForStyle(
      "disposable",
      { capture: "upload", review: false, developsAt: null },
      { ...facts, nowMs, zone: "Pacific/Auckland" },
    );
    // Monday 12 October, 9:00 NZDT.
    expect(fresh.developsAt).toBe("2026-10-11T20:00:00.000Z");
    expect(fresh.developsAt).toBe(
      defaultDevelopAt({
        ...facts,
        now: new Date(nowMs),
        zone: "Pacific/Auckland",
      }).toISOString(),
    );
  });

  it("an unreadable zone is the one fallback (UTC); none at all is the browser's own clock", () => {
    const at = (zone: string | null | undefined) =>
      patchForStyle(
        "disposable",
        { capture: "upload", review: false, developsAt: null },
        { eventDate: "2026-10-10", nowMs: NOW, zone },
      ).developsAt;
    expect(at("Mars/Olympus")).toBe("2026-10-11T09:00:00.000Z");
    const browser = defaultDevelopAt({
      eventDate: "2026-10-10",
      now: new Date(NOW),
    }).toISOString();
    expect(at(null)).toBe(browser);
    expect(at(undefined)).toBe(browser);
  });
});

describe("createFieldsOf: a new event is born with a style's three columns in one insert", () => {
  it("★ writes exactly what Settings' press of each style writes, in the create's own field names", () => {
    const fresh = {
      capture: "upload" as const,
      review: false,
      developsAt: null,
    };
    const opts = { eventDate: null, nowMs: NOW };
    expect(createFieldsOf(patchForStyle("live", fresh, opts))).toEqual({
      capture: "upload",
      moderation_mode: "live",
      roll_size: null,
      develops_at: null,
    });
    expect(createFieldsOf(patchForStyle("approval", fresh, opts))).toEqual({
      capture: "upload",
      moderation_mode: "hold_for_approval",
      roll_size: null,
      develops_at: null,
    });
    expect(createFieldsOf(patchForStyle("disposable", fresh, opts))).toEqual({
      capture: "camera",
      moderation_mode: "live",
      roll_size: null,
      develops_at: defaultDevelopAt({
        eventDate: null,
        now: new Date(NOW),
      }).toISOString(),
    });
  });

  it("★ the roll she picked rides with the camera alone: a Disposable is born with it, Live and Review with none", () => {
    const fresh = {
      capture: "upload" as const,
      review: false,
      developsAt: null,
    };
    const opts = { eventDate: null, nowMs: NOW };
    expect(
      createFieldsOf(patchForStyle("disposable", fresh, opts), 50).roll_size,
    ).toBe(50);
    expect(
      createFieldsOf(patchForStyle("live", fresh, opts), 50).roll_size,
    ).toBeNull();
    expect(
      createFieldsOf(patchForStyle("approval", fresh, opts), 12).roll_size,
    ).toBeNull();
  });

  it("★ no style is ever born holding approval and a develop time together (`both=never`, at birth too)", () => {
    for (const style of ALBUM_STYLES) {
      const f = createFieldsOf(
        patchForStyle(
          style,
          { capture: "camera", review: true, developsAt: AHEAD },
          { eventDate: null, nowMs: NOW },
        ),
      );
      expect(approvalWithADevelop(f)).toBe(false);
    }
  });
});

describe("styleSwitchConsequence: what a switch shows or releases is said first, nothing else asks", () => {
  it("leaving a develop still ahead shows everything added so far", () => {
    expect(
      styleSwitchConsequence({
        from: { capture: "camera", review: false, developsAt: AHEAD },
        to: { capture: "upload", review: false, developsAt: null },
        heldCount: 0,
        nowMs: NOW,
      }),
    ).toEqual({ kind: "show-waiting" });
  });

  it("leaving approval with photos held approves them now, or (★ the settled answer) they join the roll", () => {
    const from = { capture: "upload" as const, review: true, developsAt: null };
    expect(
      styleSwitchConsequence({
        from,
        to: { capture: "upload", review: false, developsAt: null },
        heldCount: 3,
        nowMs: NOW,
      }),
    ).toEqual({ kind: "approve-held", count: 3 });
    expect(
      styleSwitchConsequence({
        from,
        to: { capture: "camera", review: false, developsAt: AHEAD },
        heldCount: 3,
        nowMs: NOW,
      }),
    ).toEqual({ kind: "join-roll", count: 3 });
  });

  it("nothing waiting and nothing held: nothing asks (a develop already reached shows nothing new)", () => {
    expect(
      styleSwitchConsequence({
        from: { capture: "camera", review: false, developsAt: PAST },
        to: { capture: "upload", review: false, developsAt: null },
        heldCount: 0,
        nowMs: NOW,
      }),
    ).toBeNull();
    expect(
      styleSwitchConsequence({
        from: { capture: "upload", review: true, developsAt: null },
        to: { capture: "upload", review: false, developsAt: null },
        heldCount: 0,
        nowMs: NOW,
      }),
    ).toBeNull();
  });
});

describe("approval never stands with a develop (`both=never`)", () => {
  it("refuses a patch that sets both, in words, and only that", () => {
    expect(
      approvalWithADevelop({
        moderation_mode: "hold_for_approval",
        develops_at: AHEAD,
      }),
    ).toBe(true);
    expect(
      approvalWithADevelop({
        moderation_mode: "hold_for_approval",
        develops_at: null,
      }),
    ).toBe(false);
    expect(
      approvalWithADevelop({ moderation_mode: "live", develops_at: AHEAD }),
    ).toBe(false);
    expect(approvalWithADevelop({ moderation_mode: "hold_for_approval" })).toBe(
      false,
    );
    expect(approvalWithADevelop({ develops_at: AHEAD })).toBe(false);
    expect(APPROVAL_NEVER_WITH_A_DEVELOP).toMatch(/develop time/);
  });
});
