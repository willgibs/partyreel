import { readFileSync } from "node:fs";
import { join } from "node:path";

import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { EVENT_ROOMS } from "@/lib/event/sections";

import { EdgeFadeScroller } from "./edge-fade-scroller";

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
const SCROLLER = "src/components/app/event-feed/edge-fade-scroller.tsx";
const GALLERY = "src/components/app/event-feed/event-gallery.tsx";
const HUB = "src/app/(app)/dashboard/[eventId]/page.tsx";

describe("the cards row", () => {
  it("runs in his order: the Highlight reel, Guests, Review, and Settings last", () => {
    // His words (`event-settings` `queue`, 2026-09-29): "the highlight reel card
    // should be the first in the host events features row/grid. Then Guests,
    // then Review, then Settings." Settings was already last ("we could switch
    // the current 'Album' card to be 'Settings' and move it to last in the
    // row"), and the album stopped being a door at all. The row, the phone's
    // 2x2 grid (it fills by rows) and the help's picture all map this list.
    expect(EVENT_ROOMS.map((r) => r.id)).toEqual([
      "reel",
      "guests",
      "review",
      "settings",
    ]);
  });

  it("is a group of links and never a tablist", () => {
    const src = code(CARDS);
    expect(/role="group"/.test(src), "the row stopped being a group").toBe(
      true,
    );
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
    // Whitespace-tolerant: the formatter breaks the condition across lines once
    // the row's JSX nests it deeper (reel-host-wiring), and a pin on a line
    // break would fail on formatting rather than on the guard going.
    expect(
      /e\.metaKey\s*\|\|\s*e\.ctrlKey\s*\|\|\s*e\.shiftKey/.test(src),
      "a modified click on Settings no longer falls through to a navigation",
    ).toBe(true);
  });

  it("scrolls sideways inside the scroller whose fades are keyed on the overflow", () => {
    // ★ THE RESHAPE (crumbs-12): this pin also asked the source for the names
    // `overflowLeft` and `overflowRight`, and it stayed green for the whole life
    // of the bug it was written to stop. `el.dataset.x = undefined` stores the
    // string "undefined", so both flags stood at every width and both fades
    // showed on a row of four that fits at 1440. The names prove nothing; what
    // the fades DO is proven by driving the scroller (below). This keeps the
    // two things only the source can say: the row rides that scroller, and each
    // mask hangs off its own edge's flag.
    expect(
      /<EdgeFadeScroller>/.test(code(CARDS)),
      "the row stopped riding the scroller",
    ).toBe(true);
    const src = read(SCROLLER);
    expect(/overflow-x-auto/.test(src), "the row stopped scrolling").toBe(true);
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

/**
 * jsdom lays nothing out, so a test hands the scroller its geometry: how wide
 * the row runs, how much of it shows, and how far it is scrolled.
 */
function layOut(
  el: HTMLElement,
  box: { scrollWidth: number; clientWidth: number; scrollLeft: number },
) {
  for (const [key, value] of Object.entries(box)) {
    Object.defineProperty(el, key, { configurable: true, get: () => value });
  }
}

const fades = (el: HTMLElement) => ({
  left: el.hasAttribute("data-overflow-left"),
  right: el.hasAttribute("data-overflow-right"),
});

describe("the row's edge fades (his `queue` note: conditional per scrollable side)", () => {
  const mount = () => {
    const view = render(
      <EdgeFadeScroller>
        <div>four doors</div>
      </EdgeFadeScroller>,
    );
    return { view, el: view.container.firstElementChild as HTMLElement };
  };

  it("shows no fade on a row that fits, from its first paint", () => {
    // "not exist in the default desktop view when wide enough that scrolling
    // isn't needed". The first paint is jsdom's all-zero box: a row that fits.
    const { el } = mount();
    expect(fades(el)).toEqual({ left: false, right: false });
    layOut(el, { scrollWidth: 600, clientWidth: 600, scrollLeft: 0 });
    fireEvent.scroll(el);
    expect(fades(el)).toEqual({ left: false, right: false });
    // Nor within the pixel a fractional zoom leaves on a row that fits.
    layOut(el, { scrollWidth: 601, clientWidth: 600, scrollLeft: 0 });
    fireEvent.scroll(el);
    expect(fades(el)).toEqual({ left: false, right: false });
  });

  it("fades only the side with more of the row past it, and neither end once reached", () => {
    const { el } = mount();
    // "if you're at the first/last that shadow disappears, showing you're at
    // the end with nothing more hidden".
    layOut(el, { scrollWidth: 900, clientWidth: 600, scrollLeft: 0 });
    fireEvent.scroll(el);
    expect(fades(el), "at the start").toEqual({ left: false, right: true });
    layOut(el, { scrollWidth: 900, clientWidth: 600, scrollLeft: 150 });
    fireEvent.scroll(el);
    expect(fades(el), "in the middle").toEqual({ left: true, right: true });
    layOut(el, { scrollWidth: 900, clientWidth: 600, scrollLeft: 300 });
    fireEvent.scroll(el);
    expect(fades(el), "at the end").toEqual({ left: true, right: false });
    layOut(el, { scrollWidth: 900, clientWidth: 600, scrollLeft: 0 });
    fireEvent.scroll(el);
    expect(fades(el), "back at the start").toEqual({
      left: false,
      right: true,
    });
    // A flag and never a value: the variants match the attribute's presence.
    expect(el.getAttribute("data-overflow-right")).toBe("");
  });

  it("measures again when a render changes the row without a scroll or a resize", () => {
    // The Invite pill joins a row of tiles at a tablet's width and nothing
    // resizes: the row simply runs further than the screen.
    const { el, view } = mount();
    layOut(el, { scrollWidth: 760, clientWidth: 600, scrollLeft: 0 });
    view.rerender(
      <EdgeFadeScroller>
        <div>four doors and the Invite pill</div>
      </EdgeFadeScroller>,
    );
    expect(fades(el)).toEqual({ left: false, right: true });
  });
});

describe("the album, and the bin as its filter", () => {
  it("never counts the bin's items in the album's count", () => {
    // A host reading "48 photos" must be reading the number their guests can
    // see or they have tucked away. The bin says its own size on its own header.
    //
    // The album branch leads with albumCount and falls through to the LAUNCH
    // list's outstanding count when the album is empty (`empty=list`, Will
    // 2026-09-21: before the first photograph this section is the launch list,
    // and a "0" beside its name would be a count of the wrong thing). What is
    // still forbidden, and is what this guards, is the bin reaching that branch.
    const src = read(GALLERY);
    const branch = /view === "album"\s*\?([\s\S]*?):\s*bin\.status/.exec(src);
    expect(
      branch,
      "the count stopped branching on the view at all",
    ).toBeTruthy();
    expect(
      /albumCount/.test(branch![1]),
      "the album's count stopped being the album's own number",
    ).toBe(true);
    expect(
      /bin/.test(branch![1]),
      "the album's count started including something other than the album",
    ).toBe(false);
    // ★ The count is the album store's COUNTED number (the paged album, album-host-wiring; the
    // reshape of the 1,000-row round's pin, whose `countEventMedia` retired with the hub's whole
    // read): approved + hidden, counted in the same snapshot as the album's version, the bin's
    // `removed` and Review's `pending` in neither, and never a list's length. The page seeds it from
    // the host's first-load plan; the gallery reads it live off the store.
    const gallery = code(GALLERY);
    expect(
      /const albumCount = useAlbumCount\(album\);/.test(gallery) &&
        /useHubCounts\(album\)\?\.album/.test(gallery),
      "the gallery stopped reading the album's counted number",
    ).toBe(true);
    expect(
      /const albumCount = [^;]*\.length/.test(gallery),
      "the album's count went back to being a list's length",
    ).toBe(false);
    expect(
      /album: plan\.read\.approved \+ \(plan\.read\.hidden \?\? 0\)/.test(
        read("src/lib/event/host-album.server.ts"),
      ),
      "the seeded count stopped being approved + hidden from the version's snapshot",
    ).toBe(true);
  });

  it("loads the bin only when the filter is chosen, and its list carries no links", () => {
    // Choosing Deleted is what pays for the bin (its list; its links per window). ★ The reshape of
    // "and only once" (album-host-wiring): the list used to be kept for the island's life because the
    // old bin presigned every item in it; the paged bin's list has no links, so it is read again each
    // time the filter is chosen (`recently-deleted-grid.test.tsx` pins that), and a kept list hid what
    // the host had just deleted. What stays forbidden is the page paying for the bin, and the list
    // growing links, which would make each read again cost a presign per item.
    const gallery = code(GALLERY);
    expect(
      /const showDeleted = \(\) => \{\s*setView\("deleted"\);\s*bin\.open\(\);/.test(
        gallery,
      ),
      "the bin stopped loading on the filter's choice",
    ).toBe(true);
    expect(
      /presign/i.test(code("src/app/api/events/[eventId]/bin/route.ts")),
      "the bin's list started minting links, so each read of it costs a presign per item",
    ).toBe(false);
    expect(
      /useHubBin|\/bin/.test(code(HUB)),
      "the hub started loading the bin on every render",
    ).toBe(false);
  });

  it("re-verifies the caller inside the bin's routes, not only in RLS", () => {
    // A route is a public endpoint. RLS is the boundary and the getUser() check is the defence in
    // depth the security guardrails ask for.
    for (const route of [
      "src/app/api/events/[eventId]/bin/route.ts",
      "src/app/api/events/[eventId]/bin/media/route.ts",
    ]) {
      const src = code(route);
      expect(/supabase\.auth\.getUser\(\)/.test(src), route).toBe(true);
      expect(/getEvent\(eventId\)/.test(src), route).toBe(true);
      expect(
        /getSession\(/.test(src),
        `${route} authorised from a cookie rather than from a check`,
      ).toBe(false);
    }
  });
});

describe("the settings sheet", () => {
  it("opens over the album from a deep link, and keeps the form single-sourced", () => {
    const sheet = read(
      "src/components/app/event-settings/event-settings-sheet.tsx",
    );
    // The page of cards is not rebuilt: the shipped orchestrator is imported
    // whole, so the sheet and the retired route cannot disagree about what a
    // setting does.
    expect(/import \{ EventSettingsForm \}/.test(sheet)).toBe(true);
    // The retired route survives as a door to the sheet, so a bookmark to the
    // URL we published for months still lands somewhere.
    const redirect = read(
      "src/app/(app)/dashboard/[eventId]/settings/page.tsx",
    );
    expect(
      /redirect\(`\/dashboard\/\$\{eventId\}\?room=settings`\)/.test(redirect),
    ).toBe(true);
  });

  it("confirms before discarding unsaved edits, whichever way it is closed", () => {
    // The route guarded a hard nav and its back-LINK. A sheet has no back-link
    // and three ways out (the scrim, Escape, the close button), so all of them
    // land on one guarded close.
    const sheet = read(
      "src/components/app/event-settings/event-settings-sheet.tsx",
    );
    expect(/onOpenChange=\{requestClose\}/.test(sheet)).toBe(true);
    expect(/if \(dirty\) \{\s*setConfirmOpen\(true\);/.test(sheet)).toBe(true);
    expect(/useUnsavedChangesGuard\(dirty\)/.test(sheet)).toBe(true);
  });
});
