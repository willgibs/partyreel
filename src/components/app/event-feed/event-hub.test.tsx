import { readFileSync } from "node:fs";
import { join } from "node:path";

import { act, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { EVENT_ROOMS } from "@/lib/event/sections";

import { EventCardsRow } from "./event-cards-row";

// The row's own neighbours, stood in for so it mounts without the hub's server graph: the page's
// share island (the Invite pill shows, as it does once the header's code has scrolled away), the
// album's store (none: the served cards stand), and the reel card's one server read.
vi.mock("@/components/app/share/event-share-provider", () => ({
  useEventShare: () => ({
    openSheet: vi.fn(),
    openCode: vi.fn(),
    headerCodeHidden: true,
    morphNameFor: () => undefined,
  }),
}));
vi.mock("@/components/app/event-feed/host-album", () => ({
  useHostAlbum: () => null,
  useHubCounts: () => null,
  useHubEntries: () => null,
}));
vi.mock("@/app/(app)/dashboard/[eventId]/actions", () => ({
  refreshHubReelAction: vi.fn(),
}));

/**
 * THE HUB'S ROW OF DOORS AND THE ALBUM UNDER IT (Will's `event=hub`,
 * `nav=crumbs` and `phone=same`, 2026-09-20).
 *
 * What this guards is FUNCTION: the cards are LINKS and not tabs, the row condenses in
 * place and never loops against its own footprint, the album's count never counts the
 * bin, and the bin is not paid for until a host asks for it. Three of the four are the
 * kind of regression that looks fine in a screenshot: a `role="tablist"` reads correctly
 * to the eye and wrongly to a screen reader; a row that moves the album it sits over
 * flickers between its two forms for ever; an eager bin is N presigns nobody sees on a
 * waterfall.
 *
 * ★ RESHAPED ON PURPOSE (event-header r4's cards over the seam, Will's pick: every door in sight on a phone): the row no
 * longer scrolls sideways, so the sideways scroller, its edge fades and the tests that drove them went with it; what the
 * fades guarded (a permanent gradient that looks like a design choice) cannot happen on a row with no edge. The stick's own
 * tests below keep their scar and read the row's new DOM (the band is the group's parent now).
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
const FOLD = "src/components/app/event-feed/event-cards-row-fold.ts";
const ROW_CSS = "src/components/app/event-feed/event-cards-row.css";
const DOOR_CSS = "src/components/app/event-feed/room-card.css";
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
    // Every room opens over the hub and its door is STILL an anchor, so middle-click and open-in-new-tab do the
    // honest thing and the URL is real. ★ RESHAPED ON PURPOSE (event-header r2, `rooms=over`): this pinned the
    // sheet-vs-room branch (Review and Guests linked to routes of their own, Settings to `?room=settings`); every
    // room stands on the hub's address now, so every door's href is the one builder's (`roomHref`), See it as a
    // guest's included.
    expect(/<Link\b/.test(src), "a card stopped being a link").toBe(true);
    expect(
      /href: roomHref\(eventId, room\)/.test(src),
      "a door stopped carrying the room's real URL",
    ).toBe(true);
    expect(
      /roomDoor\(eventId, AS_GUEST_DOOR\.id/.test(src),
      "See it as a guest stopped being a door at the row's end",
    ).toBe(true);
    // Whitespace-tolerant: the formatter breaks the condition across lines once
    // the row's JSX nests it deeper (reel-host-wiring), and a pin on a line
    // break would fail on formatting rather than on the guard going.
    expect(
      /e\.metaKey\s*\|\|\s*e\.ctrlKey\s*\|\|\s*e\.shiftKey/.test(src),
      "a modified click on a door no longer falls through to a navigation",
    ).toBe(true);
  });

  it("never scrolls sideways, and never ends its own stick by clipping itself wrongly", () => {
    // Every door is in sight at every width (a hand's grid, a tablet's tiles, a desk's cards, pills sized to a 320px
    // phone), so nothing here may be a sideways scroller. And the footprint is the sticky element: `overflow: hidden`,
    // `auto` or `scroll` on it (or on the band inside it) would make it a scroll container and end the stick, which the
    // crumbs-14 loop below guards from the other side. `clip` is the one overflow it may wear, so a row that ran past the
    // screen is cut at the window's edge rather than scrolling the whole hub sideways.
    const css = `${read(ROW_CSS)}\n${read(DOOR_CSS)}`.replace(
      /\/\*[\s\S]*?\*\//g,
      "",
    );
    expect(css, "a sideways scroller came back").not.toMatch(
      /overflow(-x)?:\s*(auto|scroll)/,
    );
    // The rules for the footprint and the band themselves (a piece inside them may clip its own box).
    const rules = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(
      (m) => [m[1].trim(), m[2]] as const,
    );
    const sticky = rules.filter(([sel]) =>
      /^(\.hub-row|\.hub-band(\[data-stuck\])?)$/.test(sel),
    );
    expect(sticky.length, "the row's own rules were not found").toBeGreaterThan(
      2,
    );
    for (const [sel, body] of sticky)
      expect(body, `${sel} became a scroll container`).not.toMatch(
        /overflow(-x|-y)?:\s*(hidden|auto|scroll)/,
      );
    expect(
      sticky.some(
        ([sel, body]) => sel === ".hub-row" && /overflow-x:\s*clip/.test(body),
      ),
    ).toBe(true);
  });

  it("condenses in place, without remounting the row", () => {
    // A remount would drop the QR pill's view-transition-name mid-morph and
    // restart the ticking count, so the compact state is STYLING on the same
    // DOM rather than a second component swapped in.
    // ★ RESHAPED ON PURPOSE (the cards over the seam): the band's `data-stuck` is written by hand, by the fold, between its
    // two reads (React never writes it), so the pin names the fold's write and keeps the negative.
    const src = code(CARDS);
    expect(/toggleAttribute\("data-stuck"/.test(code(FOLD))).toBe(true);
    expect(
      /data-stuck=/.test(src),
      "React started writing the band's stuck attribute, which the fold reads the old form off",
    ).toBe(false);
    expect(
      /\{stuck \? \(\s*<EventCardsRow/.test(src),
      "the row started swapping itself out on the condense",
    ).toBe(false);
  });

  it("★ stuck, leads with the head it came from: the cover's first photograph and the name", () => {
    // `event-header` r1 (`host=shared`, his note: "Love how they're captured into a sticky menu on scroll"):
    // the band carries the head's face once the head has gone, and only then (at rest the head is above it).
    const src = read(CARDS);
    expect(
      /\{stuck && head && \(/.test(src),
      "the band's lead stopped waiting for the band to stick",
    ).toBe(true);
    expect(src).toContain("data-band-lead");
    // The face is the cover's own, live as the cover is (`event-hub-head.tsx`), never a second rule.
    expect(src).toMatch(/useHubCoverStills\(/);
  });

  it("shows the code's chip only once the band has stuck and the head's code is off screen", () => {
    // Nothing is duplicated at rest: at the top of the page the head's code
    // IS the code, and the chip is the same object once that one has gone.
    // ★ Reshaped on purpose (`event-header` r1): the QR pill became the code
    // chip (`ui/code-chip.tsx`), and it stands in the stuck band alone, since
    // the code is in the cover above the band at rest.
    const src = read(CARDS);
    expect(
      /\{stuck && headerCodeHidden && \(/.test(src),
      "the sticky code chip stopped being gated on the head's code",
    ).toBe(true);
  });
});

/**
 * A PAGE TO JUMP IN: the part of a browser the row's stick depends on, at 375. jsdom lays nothing
 * out and anchors nothing, so this plays the browser: where the row rests, the band's two heights,
 * the sticky footprint's box, the IntersectionObserver the row asks (fired on its threshold's
 * crossings, its root cut by the rootMargin the row passes), the ResizeObservers (fired when the
 * band's box changes), and SCROLL ANCHORING, the other half of the loop, which keeps the album below
 * the row still by moving the page by whatever the footprint gained or lost.
 */
function stickPage({ footprintFollowsBand = false, viewport = 812 } = {}) {
  const REST_TOP = 333; // where the row rests in the page (the hub, measured at 375: the cards over the seam)
  const VIEWPORT = viewport;
  const BAND = { rest: 184, stuck: 64 }; // the 2x2 grid and the guest's view under it, and the pills stuck to the bar
  let scrollY = 0;

  const group = () =>
    document.querySelector<HTMLElement>(
      '[role="group"][aria-label="This event"]',
    );
  const band = () => group()!.parentElement!;
  const stuck = () => band().hasAttribute("data-stuck");
  const bandHeight = () => (stuck() ? BAND.stuck : BAND.rest);

  // The box the row's own floor reads: the band's, from its state.
  const realRect = Element.prototype.getBoundingClientRect;
  vi.spyOn(Element.prototype, "getBoundingClientRect").mockImplementation(
    function (this: Element) {
      if (!group() || this !== band()) return realRect.call(this);
      const height = bandHeight();
      return {
        x: 0,
        y: 0,
        width: 375,
        height,
        top: 0,
        left: 0,
        bottom: height,
        right: 375,
        toJSON: () => ({}),
      };
    },
  );

  type Watch = { cb: ResizeObserverCallback; els: Set<Element> };
  const resizes: Watch[] = [];
  vi.stubGlobal(
    "ResizeObserver",
    class {
      watch: Watch;
      constructor(cb: ResizeObserverCallback) {
        this.watch = { cb, els: new Set() };
        resizes.push(this.watch);
      }
      observe(el: Element) {
        this.watch.els.add(el);
      }
      unobserve(el: Element) {
        this.watch.els.delete(el);
      }
      disconnect() {
        this.watch.els.clear();
      }
    },
  );

  type Sight = {
    cb: IntersectionObserverCallback;
    rootTop: number;
    rootBottom: number;
    target: HTMLElement | null;
  };
  const sights: Sight[] = [];
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      sight: Sight;
      constructor(
        cb: IntersectionObserverCallback,
        options: IntersectionObserverInit = {},
      ) {
        // The root is the viewport cut and grown by the rootMargin the row passes: its top is the
        // bar the row sticks under, its bottom the fold or, grown, further down the page.
        const [top = "0px", , bottom = top] = (
          options.rootMargin ?? "0px"
        ).split(/\s+/);
        const edge = (margin: string) =>
          margin.endsWith("%")
            ? (parseFloat(margin) / 100) * VIEWPORT
            : parseFloat(margin);
        this.sight = {
          cb,
          rootTop: -edge(top),
          rootBottom: VIEWPORT + edge(bottom),
          target: null,
        };
        sights.push(this.sight);
      }
      observe(el: HTMLElement) {
        this.sight.target = el;
      }
      unobserve() {}
      disconnect() {}
      takeRecords() {
        return [];
      }
    },
  );

  // The row's own observer: the one watching what holds the row (a link's prefetch may watch too).
  const rowSight = () => sights.find((s) => s.target?.contains(group()))!;
  const footprint = () => rowSight().target!;
  // What the row takes up in the page: the band, or the floor its footprint holds, whichever is
  // taller (unless the model plays the old row, whose footprint WAS the band).
  const footprintHeight = () =>
    footprintFollowsBand
      ? bandHeight()
      : Math.max(bandHeight(), parseFloat(footprint().style.minHeight) || 0);
  // Sticky under the bar: the footprint rests in the page until the page scrolls it up to the bar.
  const ratio = () => {
    const { rootTop, rootBottom } = rowSight();
    const top = Math.max(rootTop - 1, REST_TOP - scrollY);
    const height = footprintHeight();
    const seen = Math.min(top + height, rootBottom) - Math.max(top, rootTop);
    return Math.max(0, seen) / height;
  };

  let full: boolean | null = null;
  let lastFootprint = 0;
  let lastBand = 0;

  /** Frames until nothing moves (or 40): how many times the row flipped between its two states. */
  async function settle() {
    let flips = 0;
    let wasStuck = stuck();
    let quiet = 0;
    for (let frame = 0; frame < 40 && quiet < 3; frame++) {
      let moved = false;
      // Layout, then scroll anchoring: the album below the row is kept where it was.
      const height = footprintHeight();
      if (lastFootprint && height !== lastFootprint) {
        scrollY = Math.max(0, scrollY + height - lastFootprint);
        moved = true;
      }
      lastFootprint = height;
      // The size observers watching the band, when its box changed.
      if (bandHeight() !== lastBand) {
        lastBand = bandHeight();
        moved = true;
        for (const { cb, els } of resizes) {
          if (els.has(band()))
            await act(async () => cb([], {} as ResizeObserver));
        }
      }
      // The row's observer, on its threshold's crossing (and its first report).
      const nowFull = ratio() >= 1;
      if (nowFull !== full) {
        full = nowFull;
        moved = true;
        const entry = {
          intersectionRatio: ratio(),
          isIntersecting: ratio() > 0,
          target: footprint(),
        } as unknown as IntersectionObserverEntry;
        await act(async () =>
          rowSight().cb([entry], {} as IntersectionObserver),
        );
      }
      if (stuck() !== wasStuck) {
        wasStuck = stuck();
        flips++;
        moved = true;
      }
      quiet = moved ? 0 : quiet + 1;
    }
    return flips;
  }

  function mount() {
    render(
      <EventCardsRow
        eventId="00000000-0000-4000-8000-000000000000"
        cards={[
          { id: "guests", value: "6 guests" },
          { id: "review", value: "Off" },
          { id: "settings", value: "Public" },
        ]}
        reel={{
          state: "off",
          have: 0,
          of: 2,
          stills: [],
          viewHref: "/e/probe?reel",
          moderated: false,
          pending: 0,
        }}
      />,
    );
  }

  return {
    mount,
    settle,
    /** The page's own jump: `scrollTo`, a find, a focus, or the viewer's `scrollIntoView`. */
    jump: (to: number) => {
      scrollY = to;
    },
    at: () => scrollY,
    stuck,
    footprintHeight,
    /** Where the row first meets the bar, and how much it loses there. */
    band: { from: REST_TOP - 56, loses: BAND.rest - BAND.stuck },
  };
}

describe("the row's stick, jumped into (crumbs-14)", () => {
  // ★ THE LOOP THIS GUARDS (the claims walk on build 21, and a phone's everyday path: closing the
  // viewer scrolls its photo back to the centre, `masonry.tsx`'s `returnTo()`). A jump into the
  // band where the row meets the bar condensed it, scroll anchoring moved the page by what it lost
  // to keep the album still, which took the row off the bar, which expanded it, which anchoring
  // moved back: 250 to 151 and back for ever at 375, and a jump past the band landing short by what the
  // row lost.
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("★ settles a jump into the band at once, where it was sent, and back out the same way", async () => {
    const page = stickPage();
    page.mount();
    expect(await page.settle(), "at rest, above the bar").toBe(0);
    const footprint = page.footprintHeight();

    for (const into of [0, page.band.loses / 2, page.band.loses - 1]) {
      const to = page.band.from + into;
      page.jump(to);
      expect(await page.settle(), `a jump to ${to}: one settle`).toBe(1);
      expect(page.stuck()).toBe(true);
      expect(page.at(), "the page stayed where it was sent").toBe(to);
      expect(page.footprintHeight(), "nothing below the row moved").toBe(
        footprint,
      );

      const back = page.band.from - 40;
      page.jump(back);
      expect(await page.settle(), "and back above the bar: one settle").toBe(1);
      expect(page.stuck()).toBe(false);
      expect(page.at()).toBe(back);
      expect(page.footprintHeight()).toBe(footprint);
    }
  });

  it("lands a jump past the band exactly where it was sent, not short by what the row lost", async () => {
    const page = stickPage();
    page.mount();
    await page.settle();
    const to = page.band.from + page.band.loses + 200;
    page.jump(to);
    expect(await page.settle()).toBe(1);
    expect(page.at()).toBe(to);
  });

  it("reads the bar, never the fold: a phone on its side rests unstuck at the top", async () => {
    // At 330 tall the resting row's foot is below the fold. Measured to the fold, a ratio under 1
    // read that as stuck, and stuck and resting never crossed a threshold between them.
    const page = stickPage({ viewport: 330 });
    page.mount();
    expect(await page.settle()).toBe(0);
    expect(page.stuck(), "at the top of the page").toBe(false);
    page.jump(page.band.from + 20);
    expect(await page.settle()).toBe(1);
    expect(page.stuck()).toBe(true);
    page.jump(0);
    expect(await page.settle()).toBe(1);
    expect(page.stuck(), "back at the top").toBe(false);
  });

  it("is a page that does loop when the footprint follows the band, as the old row's did", async () => {
    // The control: without it the tests above could pass on a page too tame to loop at all.
    const page = stickPage({ footprintFollowsBand: true });
    page.mount();
    await page.settle();
    const to = page.band.from + page.band.loses / 2;
    page.jump(to);
    expect(await page.settle()).toBeGreaterThan(10);
    expect(page.at()).not.toBe(to);
  });
});

describe("the album, and the bin as its filter", () => {
  it("never counts the bin's items in the album's count", () => {
    // A host reading "48 photos" must be reading the number their guests can
    // see or they have tucked away. The bin says its own size on its own header.
    //
    // The album branch is albumCount alone, and none at all on an empty album,
    // never a "0" (what an event still needs is the checklist's now, event-ready
    // `list=head`). What is forbidden, and is what this guards, is the bin
    // reaching that branch.
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
  it("opens over the album from a deep link, a page riding beside it", () => {
    // Scar: this pinned the retired form imported whole ("the sheet and the retired route cannot
    // disagree"). The form retired with event-settings r1 (every control saves itself), so what is
    // single-sourced now is the URL: the sheet's page is read off it by the provider, and the
    // retired route still lands on the sheet.
    const sheets = read("src/components/app/share/event-sheets.tsx");
    expect(/page=\{settingsPage\}/.test(sheets)).toBe(true);
    const redirect = read(
      "src/app/(app)/dashboard/[eventId]/settings/page.tsx",
    );
    // The room's one address (`roomHref`, `rooms=over`): the route spells it as the hub does.
    expect(/redirect\(roomHref\(eventId, "settings"\)\)/.test(redirect)).toBe(
      true,
    );
  });

  it("closes from any page, with nothing to discard", () => {
    // Scar: this pinned a guarded close ("confirms before discarding unsaved edits"). The reason
    // expired with the form's Save (event-settings r1): nothing waits on a save, so no close is
    // guarded, and every way out (Back, the X, Escape, the scrim) closes at once.
    const sheet = code(
      "src/components/app/event-settings/event-settings-sheet.tsx",
    );
    expect(/useUnsavedChangesGuard/.test(sheet)).toBe(false);
    expect(/Discard changes/.test(sheet)).toBe(false);
    expect(/onOpenChange=\{onOpenChange\}/.test(sheet)).toBe(true);
  });
});
