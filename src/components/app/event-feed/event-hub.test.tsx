// @contract-for: src/components/app/event-feed/event-cards-row.tsx
// @contract-for: src/components/app/event-feed/event-gallery.tsx
// @contract-for: src/components/app/event-feed/review-room.tsx
// @contract-for: src/components/app/event-settings/event-settings-sheet.tsx

import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { EVENT_ROOMS } from "@/lib/event/sections";

/**
 * THE HUB'S ROW OF DOORS AND THE ALBUM UNDER IT (Will's `event=hub`,
 * `nav=crumbs` and `phone=same`, 2026-09-20).
 *
 * What this guards is FUNCTION: the cards are LINKS and not tabs, the row
 * scrolls sideways in a hand with its fades conditional on there being an edge,
 * the album's count never counts the bin, and the bin is not paid for until a
 * host asks for it. Three of the four are the kind of regression that looks
 * fine in a screenshot: a `role="tablist"` reads correctly to the eye and
 * wrongly to a screen reader; a permanent gradient looks like a design choice;
 * an eager bin is N presigns nobody sees on a waterfall.
 *
 * Not a class, a size, a count or a word is pinned.
 */

const ROOT = process.cwd();
const read = (rel: string) => readFileSync(join(ROOT, rel), "utf8");

/**
 * Source with its comments removed. The files below NAME the things they are
 * forbidden to do, in prose, in order to explain why — so a scan that reads the
 * explanation as the offence is a test that can only be passed by deleting the
 * reason it exists. Every scan that asks "is this pattern absent" reads this.
 */
const code = (rel: string) =>
  read(rel)
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");
const CARDS = "src/components/app/event-feed/event-cards-row.tsx";
const GALLERY = "src/components/app/event-feed/event-gallery.tsx";
const HUB = "src/app/(app)/dashboard/[eventId]/page.tsx";

describe("the cards row", () => {
  it("ends on Settings, which is the card the album replaced", () => {
    // His words: "we could switch the current 'Album' card to be 'Settings' and
    // move it to last in the row". The album stopped being a door at all.
    expect(EVENT_ROOMS.at(-1)!.id).toBe("settings");
    expect(EVENT_ROOMS.map((r) => r.id)).not.toContain("album");
  });

  it("is a group of links and never a tablist", () => {
    const src = code(CARDS);
    expect(/role="group"/.test(src), "the row stopped being a group").toBe(true);
    expect(
      /role="tab(list)?"/.test(src),
      "the row became tabs: three of its four cards are rooms you navigate to",
    ).toBe(false);
    // Settings opens a sheet and is STILL an anchor, so middle-click and
    // open-in-new-tab do the honest thing and the URL is real.
    // Every card, Settings included, renders as one <Link> whose href the
    // sheet-vs-room branch above it decides.
    expect(/<Link\b/.test(src), "a card stopped being a link").toBe(true);
    expect(
      /const href = room\.segment[\s\S]{0,200}\?room=settings/.test(src),
      "the Settings card stopped carrying a real URL",
    ).toBe(true);
    expect(
      /e\.metaKey \|\| e\.ctrlKey \|\| e\.shiftKey/.test(src),
      "a modified click on Settings no longer falls through to a navigation",
    ).toBe(true);
  });

  it("scrolls sideways and fades only the edge that has something past it", () => {
    const src = read(CARDS);
    expect(/overflow-x-auto/.test(src), "the row stopped scrolling").toBe(true);
    // Both edges are independent and both are measured, so a row of four that
    // fits at 1440 shows no fade at all (his "conditional gradient").
    expect(/overflowLeft/.test(src) && /overflowRight/.test(src)).toBe(true);
    expect(
      /data-\[overflow-left\]:\[mask-image/.test(src) &&
        /data-\[overflow-right\]:\[mask-image/.test(src),
      "the fades stopped being conditional on the overflow",
    ).toBe(true);
  });

  it("condenses in place, without remounting the row", () => {
    // A remount would drop the QR pill's view-transition-name mid-morph and
    // restart the ticking count, so the compact state is STYLING on the same
    // DOM rather than a second component swapped in.
    const src = code(CARDS);
    expect(/data-stuck=\{stuck \|\| undefined\}/.test(src)).toBe(true);
    expect(
      /\{stuck \? \(\s*<EventCardsRow/.test(src),
      "the row started swapping itself out on the condense",
    ).toBe(false);
  });

  it("shows the QR pill only while the header's code is off screen", () => {
    // Nothing is duplicated at rest: at the top of the page the header's code
    // IS the code, and the pill is the same object once that one has gone.
    const src = read(CARDS);
    expect(
      /\{headerCodeHidden && \(/.test(src),
      "the sticky QR pill stopped being gated on the header's code",
    ).toBe(true);
  });
});

describe("the album, and the bin as its filter", () => {
  it("never counts the bin's items in the album's count", () => {
    // A host reading "48 photos" must be reading the number their guests can
    // see. The bin says its own size on its own header.
    //
    // The album branch leads with albumCount and falls through to the LAUNCH
    // list's outstanding count when the album is empty (`empty=list`, Will
    // 2026-09-21: before the first photograph this section is the launch list,
    // and a "0" beside its name would be a count of the wrong thing). What is
    // still forbidden, and is what this guards, is the bin reaching that branch.
    const src = read(GALLERY);
    const branch = /view === "album"\s*\?([\s\S]*?):\s*\(bin\?\.length/.exec(src);
    expect(branch, "the count stopped branching on the view at all").toBeTruthy();
    expect(
      /albumCount/.test(branch![1]),
      "the album's count stopped being the album's own length",
    ).toBe(true);
    expect(
      /bin/.test(branch![1]),
      "the album's count started including something other than the album",
    ).toBe(false);
    // The hub passes the album's COUNTED number (the 1,000-row round: a list's
    // length stops where PostgREST stops reading, at 1,000), and that count is
    // approved + hidden, the bin's `removed` and Review's `pending` in neither:
    // media.test.ts pins countEventMedia's answer against a live album, a held
    // upload, the host's own removal and two withdrawals.
    const hub = code(HUB);
    expect(
      /albumCount=\{itemCount\}/.test(hub) &&
        /const \{ album: itemCount, pending: pendingCount \} = counts;/.test(hub) &&
        /countEventMedia\(event\.id\)/.test(hub),
      "the hub stopped passing the album's own counted number as the count",
    ).toBe(true);
    expect(
      /albumCount=\{[^}]*\.length\}/.test(hub),
      "the album's count went back to being a list's length",
    ).toBe(false);
  });

  it("loads the bin only when the filter is chosen, and only once", () => {
    const src = read(GALLERY);
    expect(
      /if \(bin\) return;/.test(src),
      "the bin stopped being cached, so flipping the filter re-presigns it",
    ).toBe(true);
    expect(
      /listDeletedMediaAction/.test(src) && !/listDeletedMediaAction/.test(read(HUB)),
      "the hub started loading the bin on every render",
    ).toBe(true);
  });

  it("re-verifies the caller inside the bin's action, not only in RLS", () => {
    // A Server Function is a public endpoint. RLS is the boundary and the
    // getUser() check is the defence in depth the security guardrails ask for.
    const actions = read("src/app/(app)/dashboard/[eventId]/actions.ts");
    const fn = actions.slice(actions.indexOf("export async function listDeletedMediaAction"));
    expect(/supabase\.auth\.getUser\(\)/.test(fn.slice(0, 1200))).toBe(true);
    expect(
      /getSession\(/.test(
        fn.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, ""),
      ),
      "authorised from a cookie rather than from a check",
    ).toBe(false);
  });
});

describe("the settings sheet", () => {
  it("opens over the album from a deep link, and keeps the form single-sourced", () => {
    const sheet = read("src/components/app/event-settings/event-settings-sheet.tsx");
    // The page of cards is not rebuilt: the shipped orchestrator is imported
    // whole, so the sheet and the retired route cannot disagree about what a
    // setting does.
    expect(/import \{ EventSettingsForm \}/.test(sheet)).toBe(true);
    // The retired route survives as a door to the sheet, so a bookmark to the
    // URL we published for months still lands somewhere.
    const redirect = read("src/app/(app)/dashboard/[eventId]/settings/page.tsx");
    expect(/redirect\(`\/dashboard\/\$\{eventId\}\?room=settings`\)/.test(redirect)).toBe(
      true,
    );
  });

  it("confirms before discarding unsaved edits, whichever way it is closed", () => {
    // The route guarded a hard nav and its back-LINK. A sheet has no back-link
    // and three ways out (the scrim, Escape, the close button), so all of them
    // land on one guarded close.
    const sheet = read("src/components/app/event-settings/event-settings-sheet.tsx");
    expect(/onOpenChange=\{requestClose\}/.test(sheet)).toBe(true);
    expect(/if \(dirty\) \{\s*setConfirmOpen\(true\);/.test(sheet)).toBe(true);
    expect(/useUnsavedChangesGuard\(dirty\)/.test(sheet)).toBe(true);
  });
});
