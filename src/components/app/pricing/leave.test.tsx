/**
 * THE WAY OUT FOR STRIPE'S PAGE TAKES A PHONE SHEET'S OWN HISTORY ENTRY WITH IT, AND NO ENTRY THAT IS NOT THE SHEET'S
 * (pricing-doors; `leave.ts` says why). This pins its decision, one input at a time: the plans' sheet up as a place (with
 * the popup's marker on the window's state, and with a router commit having stripped it), and everything that must keep
 * its plain push (a button on a page, the sheet at a desk, a sheet on its way out, a marker with no sheet). A replace
 * that took the PAGE's own entry would land Back on the page before it, so each "plain push" is as much a pin as the
 * replace is. The whole walk, with a real sheet and a real Back, is `pricing-sheet.back.test.tsx`'s.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { leaveForStripe, PLACE_SHAPES } from "@/components/app/pricing/leave";
import { POPUP_HISTORY_MARKER } from "@/components/ui/popup-back";
import { isPlaceShape, type PopupShape } from "@/components/ui/popup-kinds";

const STRIPE = "https://checkout.stripe.com/c/pay/cs_test_x";

const realLocation = window.location;
let log: string[] = [];

/** The window's navigations, recorded instead of followed. */
function watchNavigation() {
  log = [];
  Object.defineProperty(window, "location", {
    configurable: true,
    value: {
      get href() {
        return realLocation.href;
      },
      set href(url: string) {
        log.push(`assign ${url}`);
      },
      replace: (url: string) => log.push(`replace ${url}`),
      reload: () => log.push("reload"),
    },
  });
}

/** A page coming back from the back/forward cache, as the browser tells it. */
function pageshow(persisted: boolean) {
  window.dispatchEvent(Object.assign(new Event("pageshow"), { persisted }));
}

/** The plans' sheet, as the popup draws it: the attributes the way out reads. */
function sheet(shape: string, state = "open") {
  const el = document.createElement("div");
  el.setAttribute("data-slot", "popup-content");
  el.setAttribute("data-pricing-sheet", "plan");
  el.setAttribute("data-state", state);
  el.setAttribute("data-shape", shape);
  document.body.append(el);
  return el;
}

/** The size list a too-small price stacks over the sheet, as the popup draws it. */
function list(shape: string, state = "open") {
  const el = document.createElement("div");
  el.setAttribute("data-slot", "popup-content");
  el.setAttribute("data-storage-list", "goal");
  el.setAttribute("data-state", state);
  el.setAttribute("data-shape", shape);
  document.body.append(el);
  return el;
}

/** A Back on its way, landed (jsdom's traversal takes two timers). */
const landed = () => new Promise((resolve) => setTimeout(resolve, 40));

beforeEach(() => {
  watchNavigation();
  window.history.replaceState(null, "", "/dashboard");
});
afterEach(() => {
  // The window outlives a test: let the one listener a replace leaves go, as the first show it meets does.
  pageshow(false);
  Object.defineProperty(window, "location", {
    configurable: true,
    value: realLocation,
  });
  document.body.innerHTML = "";
  window.history.replaceState(null, "", "/");
});

describe("a button on a page leaves as it always did", () => {
  it("★ pushes Stripe's page on top: the page's own entry stays beneath it for Back", () => {
    leaveForStripe(STRIPE);
    expect(log).toEqual([`assign ${STRIPE}`]);
  });

  it("asks nothing of a page that comes back from the cache", () => {
    leaveForStripe(STRIPE);
    pageshow(true);
    expect(log).toEqual([`assign ${STRIPE}`]);
  });
});

describe("★ a phone sheet's own entry goes with the way out", () => {
  it("replaces it while the sheet is up as a place, with the popup's marker on the window's state", () => {
    window.history.replaceState({ [POPUP_HISTORY_MARKER]: "prPopup-1" }, "");
    sheet("cover");
    leaveForStripe(STRIPE);
    expect(log).toEqual([`replace ${STRIPE}`]);
  });

  it("replaces it with the marker gone, a router commit having stripped it while the sheet stayed open", () => {
    // `router.refresh()` writes the entry again with Next's own state alone, so no marker, and the sheet still open.
    window.history.replaceState({ __NA: true }, "");
    sheet("cover");
    leaveForStripe(STRIPE);
    expect(log).toEqual([`replace ${STRIPE}`]);
  });

  it("★ replaces for each shape that is a place in a hand, and for no other", () => {
    for (const shape of ["screen", "cover", "sheet"]) {
      document.body.innerHTML = "";
      sheet(shape);
      leaveForStripe(STRIPE);
    }
    expect(log).toEqual(Array(3).fill(`replace ${STRIPE}`));
    log.length = 0;
    for (const shape of ["wide", "dialog", "panel", "rows", "card", "menu"]) {
      document.body.innerHTML = "";
      sheet(shape);
      leaveForStripe(STRIPE);
    }
    expect(log).toEqual(Array(6).fill(`assign ${STRIPE}`));
  });

  it("★ pushes at a desk, where the sheet is a dialog that holds no entry and the entry beneath is the page's own", () => {
    window.history.replaceState({ __NA: true }, "");
    sheet("wide");
    leaveForStripe(STRIPE);
    expect(log).toEqual([`assign ${STRIPE}`]);
  });

  it("★ pushes for a sheet that is already on its way out: its entry is being taken back by the popup", () => {
    window.history.replaceState({ __NA: true }, "");
    sheet("cover", "closed");
    leaveForStripe(STRIPE);
    expect(log).toEqual([`assign ${STRIPE}`]);
  });

  it("pushes for any other popup open over the page: only the sheet's own entry is the way out's to take", () => {
    window.history.replaceState({ __NA: true }, "");
    const other = sheet("cover");
    other.removeAttribute("data-pricing-sheet");
    leaveForStripe(STRIPE);
    expect(log).toEqual([`assign ${STRIPE}`]);
  });

  it("★ pushes with a marker and no sheet (a reload stranded it): it replaces what it can see is a live sheet's, never a guess", () => {
    window.history.replaceState({ [POPUP_HISTORY_MARKER]: "prPopup-1" }, "");
    leaveForStripe(STRIPE);
    expect(log).toEqual([`assign ${STRIPE}`]);
  });
});

/**
 * The list of place shapes is `ui/popup-kinds.ts`'s `isPlaceShape` by value (importing the function would put the popup's
 * tables in every marketing page's JS), so it is held to the rule here, over EVERY shape a popup can wear: a shape added
 * to `PopupShape` fails this file's compile until it is named, and one the rule calls a place that the list lacks fails
 * the run.
 */
describe("the place shapes are the popup's own rule", () => {
  const EVERY_SHAPE = {
    dialog: true,
    wide: true,
    panel: true,
    menu: true,
    card: true,
    anchored: true,
    screen: true,
    cover: true,
    sheet: true,
    rows: true,
  } satisfies Record<PopupShape, true>;

  it.each(Object.keys(EVERY_SHAPE) as PopupShape[])(
    "★ %s is a place in a hand exactly when isPlaceShape says so",
    (shape) => {
      expect(PLACE_SHAPES.includes(shape)).toBe(isPlaceShape(shape));
    },
  );
});

describe("★ a page the browser keeps for Back is started clean", () => {
  beforeEach(() => {
    sheet("cover");
  });

  it("reloads once when it comes back from the cache, since its sheet believes in an entry the replace took", () => {
    leaveForStripe(STRIPE);
    expect(log).toEqual([`replace ${STRIPE}`]);
    pageshow(true);
    expect(log).toEqual([`replace ${STRIPE}`, "reload"]);
    // Once: the next restore of a document that has already reloaded is not this listener's.
    pageshow(true);
    expect(log).toEqual([`replace ${STRIPE}`, "reload"]);
  });

  it("leaves a page that was not kept alone, and takes its listener off at the first show it meets", () => {
    leaveForStripe(STRIPE);
    pageshow(false);
    expect(log).toEqual([`replace ${STRIPE}`]);
    pageshow(true);
    expect(log).toEqual([`replace ${STRIPE}`]);
  });

  it("★ asks for one reload however many times it was pressed (a second press while Stripe's page loads)", () => {
    leaveForStripe(STRIPE);
    leaveForStripe(STRIPE);
    leaveForStripe(STRIPE);
    expect(log).toEqual(Array(3).fill(`replace ${STRIPE}`));
    pageshow(true);
    expect(log.filter((line) => line === "reload")).toHaveLength(1);
  });
});

/**
 * ★ TWO PLACES ARE TWO ENTRIES (crumbs-83; the ROADMAP's "the storage list's goal strip ... leaves for Stripe ... over the
 * list's own history entry (and the plan sheet's, when opened from it)"). The size list a too-small price opens stacks
 * over the sheet, each a place over an entry of its own. A replace takes one, and left the sheet's under Stripe's page;
 * so the way out steps Back over both, to the page's own entry, and pushes Stripe's page from there.
 */
describe("★ the size list stacked over the sheet (crumbs-83)", () => {
  /** The page's own entry, then the sheet's and the list's over it, where the window stands. */
  function stacked() {
    window.history.pushState({ [POPUP_HISTORY_MARKER]: "prPopup-sheet" }, "");
    window.history.pushState({ [POPUP_HISTORY_MARKER]: "prPopup-list" }, "");
    sheet("cover");
    list("screen");
  }
  const markerHere = () =>
    (window.history.state as Record<string, unknown> | null)?.[
      POPUP_HISTORY_MARKER
    ];

  it("★ steps Back over both entries, then pushes Stripe's page from the page's own", async () => {
    stacked();
    const go = vi.spyOn(window.history, "go");
    leaveForStripe(STRIPE);
    expect(go).toHaveBeenCalledWith(-2);
    // Nothing leaves before that Back has landed: a navigation would cancel it.
    expect(log).toEqual([]);
    await landed();
    expect(log).toEqual([`assign ${STRIPE}`]);
    // Pushed from the page's own entry, so the sheet's and the list's are gone from under Stripe's page.
    expect(markerHere()).toBeUndefined();
    go.mockRestore();
  });

  it("asks for one reload if the page ever comes back from the cache, its places believing in entries it took", async () => {
    stacked();
    leaveForStripe(STRIPE);
    await landed();
    pageshow(true);
    expect(log).toEqual([`assign ${STRIPE}`, "reload"]);
  });

  it("goes Back once only, however many times it was pressed while that Back was on its way", async () => {
    stacked();
    const go = vi.spyOn(window.history, "go");
    leaveForStripe(STRIPE);
    leaveForStripe(STRIPE);
    expect(go).toHaveBeenCalledTimes(1);
    await landed();
    expect(log).toEqual([`assign ${STRIPE}`]);
    go.mockRestore();
  });

  it("replaces the list's entry when the list is the one place up", () => {
    list("screen");
    leaveForStripe(STRIPE);
    expect(log).toEqual([`replace ${STRIPE}`]);
  });

  it("★ pushes at a desk, where the list is a panel and the sheet a dialog, neither holding an entry", () => {
    sheet("wide");
    list("panel");
    leaveForStripe(STRIPE);
    expect(log).toEqual([`assign ${STRIPE}`]);
  });
});
