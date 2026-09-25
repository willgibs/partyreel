import { createRef, Suspense } from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { GridMedia } from "@/components/app/media-grid";
import {
  albumCount,
  buildGuestViewGroups,
  LiveGallery,
  type GalleryPayload,
  type LiveGalleryHandle,
} from "@/components/guest/live-gallery";
import type { GalleryAccess } from "@/lib/events/gallery-access";
import type { TileSize } from "@/lib/shared/tile-size-cookie";
import { setViewportWidth } from "../../../vitest.setup";

// Hoisted so the mock factory below (itself hoisted above the imports) can
// close over it — the rename suite's own seam: the stub renders nothing to read
// the credit off, so a rename's patch is proven by inspecting the `items` prop
// GuestMasonry was actually handed, never the DOM. `doorbellRefreshRef` is the
// stricter-drift suite's own seam: the doorbell's `onRefresh` is literally
// `() => void refresh()` (fire-and-forget by design — the hook never awaits
// it), so capturing the closure IS the only way to drive a "poll landed" tick
// from outside without standing up a real Realtime socket or fake-timering the
// 12s/60s fallback cadence.
const { guestMasonrySpy, doorbellRefreshRef } = vi.hoisted(() => ({
  guestMasonrySpy: vi.fn(),
  doorbellRefreshRef: { current: null as (() => void) | null },
}));

/**
 * THE GUEST ALBUM'S ONE VIEW MENU, AND THE COOKIE BEHIND ITS TILE SIZE.
 *
 * Two layers, on purpose. `buildGuestViewGroups` is pure arithmetic (the two
 * gates: disabled below 640, Showing present only with something owned) —
 * `yours-filter.test.ts`'s own style, no rendering. The `LiveGallery` describe
 * blocks below are the seam the pure function cannot prove by itself: that the
 * `initialTileSize` PROP (the page RSC's cookie read, never a client-only one)
 * actually reaches the `--album-column` custom property on the grid's own
 * wrapper, and that a missing value (an unseen guest, no cookie yet) falls
 * back to the wired default rather than an unstyled column.
 *
 * The doorbell (a real Realtime channel) and GuestMasonry (its own column
 * measurement, lightbox and like context) are stubbed: neither is this file's
 * contract, and the wrapper this suite reads sits ABOVE the grid component,
 * never inside it — masonry.tsx's own seam, so a stub proves nothing leaked
 * onto the grid by mistake either.
 */
// The real actions.ts chains into mutations/my-uploads.ts, which is
// `server-only` (throws outside a server bundle) — irrelevant to this file's
// contract (no test here removes a photo), and neither Server Function is
// called by these tests, so both become inert spies.
vi.mock("@/app/(guest)/e/[token]/actions", () => ({
  removeMyUploadGuestAction: vi.fn(),
  setTileSizeAction: vi.fn(),
}));
vi.mock("@/lib/guest/use-gallery-doorbell", () => ({
  useGalleryDoorbell: (opts: { onRefresh: () => void }) => {
    doorbellRefreshRef.current = opts.onRefresh;
    return { live: false };
  },
}));
vi.mock("@/components/guest/guest-masonry", () => ({
  GuestMasonry: (props: unknown) => {
    guestMasonrySpy(props);
    return <div data-testid="guest-masonry-stub" />;
  },
}));

function makeItem(id: string): GridMedia {
  return { id, type: "photo", url: `https://example.test/${id}.jpg` };
}

/**
 * ★ THE RENDER ITSELF MUST BE INSIDE THE ASYNC `act()`, NOT FOLLOWED BY ONE.
 * `use(galleryPromise)` suspends on mount and resolves on the very next
 * microtask (an already-fulfilled `Promise.resolve`) — quick enough that a
 * separate `await act(async () => {})` afterwards starts too late to catch
 * the retry, which then lands OUTSIDE any tracked act() and gets dropped
 * (React's own warning: "suspended inside an act scope, but the act call was
 * not awaited"). Awaiting the SAME promise inside the act that renders is
 * what keeps the retry inside the tracked scope, so no separate settle/wait
 * step is needed after `mount()` resolves.
 */
async function mount(
  props: Partial<Parameters<typeof LiveGallery>[0]> = {},
  payload: Partial<GalleryPayload> = {},
) {
  const galleryPromise: Promise<GalleryPayload> = Promise.resolve({
    items: [makeItem("m1"), makeItem("m2")],
    teaserTotal: null,
    // No head count unless a test gives one: the earlier suites below pin the
    // fallback rule (a payload from an older server), the exact-count suite the
    // live one.
    approvedTotal: null,
    etag: "etag-1",
    ...payload,
  });
  let utils!: ReturnType<typeof render>;
  await act(async () => {
    utils = render(
      <Suspense fallback={<div>loading</div>}>
        <LiveGallery
          galleryPromise={galleryPromise}
          qrToken="qr-token-1"
          access="full"
          isDemo={false}
          onOpenGate={() => {}}
          isAuthed
          {...props}
        />
      </Suspense>,
    );
    await galleryPromise;
  });
  return utils;
}

/**
 * A canned `/api/guests/gallery` poll response (the stricter-drift suite's
 * fixture) — just enough of `fetch`'s Response shape for `refresh()` to read:
 * `.status`, `.ok`, `.headers.get("etag")`, `.json()`.
 */
function pollResponse({
  access,
  gate = null,
  items = [],
  teaserTotal = null,
  approvedTotal,
  etag = "etag-2",
  guestCount,
}: {
  access: GalleryAccess;
  gate?: string | null;
  items?: GridMedia[];
  teaserTotal?: number | null;
  /** The album's head count; absent, the response reads as an older server's. */
  approvedTotal?: number | null;
  etag?: string;
  guestCount?: number;
}) {
  return {
    status: 200,
    ok: true,
    headers: { get: (name: string) => (name.toLowerCase() === "etag" ? etag : null) },
    json: async () => ({
      ok: true,
      items,
      access,
      gate,
      teaserTotal,
      ...(approvedTotal === undefined ? {} : { approvedTotal }),
      ...(guestCount === undefined ? {} : { guestCount }),
    }),
  };
}

/**
 * Drains the microtask queue past `refresh()`'s own chain of awaits (fetch,
 * then res.json(), then the state writes) via a real macrotask — a
 * `setTimeout` always fires after every microtask already queued, so this
 * needs no assumption about how many `await`s sit between them. `doorbellRefreshRef`
 * is `onRefresh` itself (`() => void refresh()`), fire-and-forget by design,
 * so nothing here can `await` the promise directly.
 */
async function poll() {
  await act(async () => {
    doorbellRefreshRef.current?.();
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

/** Radix's dropdown trigger opens on pointerdown, not click (the house
 *  technique, `view-menu.test.tsx`'s own `openMenu`). */
function openViewMenu() {
  fireEvent.pointerDown(screen.getByRole("button", { name: "View" }), {
    ctrlKey: false,
    button: 0,
  });
}

/**
 * jsdom has no IntersectionObserver; the empty state's river arms its pause
 * through one (`use-ambient-pause.ts`), which only the one-true-count suite's
 * own `items: []` fixture reaches in this file (every other test seeds two
 * items and never mounts the empty state at all). A minimal, inert stand-in —
 * this suite never asserts on the river's paused/visible state, only that the
 * teaser CTA beside it reads right.
 */
class TestIntersectionObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  takeRecords = vi.fn(() => []);
}

beforeEach(() => {
  global.fetch = vi.fn();
  setViewportWidth(1024);
  guestMasonrySpy.mockClear();
  doorbellRefreshRef.current = null;
  vi.stubGlobal("IntersectionObserver", TestIntersectionObserver);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("buildGuestViewGroups: the guest album's View menu, as arithmetic", () => {
  function base(
    overrides: Partial<Parameters<typeof buildGuestViewGroups>[0]> = {},
  ) {
    return {
      tileSize: 240 as TileSize,
      setTileSize: vi.fn(),
      wideEnough: true,
      showingMine: false,
      setShowingMine: vi.fn(),
      ownedCount: 0,
      ...overrides,
    };
  }

  it("is Tile size alone when the guest owns nothing on the album", () => {
    const groups = buildGuestViewGroups(base());
    expect(groups.map((g) => g.id)).toEqual(["tile-size"]);
  });

  it("adds Showing once the guest owns something, the count inside Yours' own label", () => {
    const groups = buildGuestViewGroups(base({ ownedCount: 3 }));
    expect(groups.map((g) => g.id)).toEqual(["tile-size", "showing"]);
    expect(groups[1].options).toEqual([
      { value: "all", label: "Everyone's" },
      { value: "mine", label: "Yours (3)" },
    ]);
  });

  it("Showing's value follows the live intent, never a stale snapshot", () => {
    const on = buildGuestViewGroups(base({ ownedCount: 2, showingMine: true }));
    expect(on[1].value).toBe("mine");
    const off = buildGuestViewGroups(
      base({ ownedCount: 2, showingMine: false }),
    );
    expect(off[1].value).toBe("all");
  });

  it("routes Showing's onChange to setShowingMine as a boolean, never the raw string", () => {
    const setShowingMine = vi.fn();
    const [, showing] = buildGuestViewGroups(
      base({ ownedCount: 1, setShowingMine }),
    );
    showing.onChange("mine");
    expect(setShowingMine).toHaveBeenCalledWith(true);
    showing.onChange("all");
    expect(setShowingMine).toHaveBeenCalledWith(false);
  });

  it("reserves Tile size below 640 rather than removing it", () => {
    const [tileSize] = buildGuestViewGroups(base({ wideEnough: false }));
    expect(tileSize.disabled).toBe(true);
    expect(tileSize.hint).toBe("Wider screens");
  });

  it("is live at 640 and up, with no hint", () => {
    const [tileSize] = buildGuestViewGroups(base({ wideEnough: true }));
    expect(tileSize.disabled).toBe(false);
    expect(tileSize.hint).toBeUndefined();
  });

  it("routes Tile size's onChange to setTileSize as a number, never the raw string", () => {
    const setTileSize = vi.fn();
    const [tileSize] = buildGuestViewGroups(base({ setTileSize }));
    tileSize.onChange("300");
    expect(setTileSize).toHaveBeenCalledWith(300);
  });
});

describe("LiveGallery: the cookie's value reaches the album's wrapper", () => {
  it("paints --album-column from the server-resolved initialTileSize on first render", async () => {
    await mount({ initialTileSize: 180 });
    const wrapper = screen.getByTestId("guest-masonry-stub").parentElement!;
    expect(wrapper.style.getPropertyValue("--album-column")).toBe("180px");
  });

  it("falls back to the wired default when the cookie was missing", async () => {
    await mount({ initialTileSize: undefined });
    const wrapper = screen.getByTestId("guest-masonry-stub").parentElement!;
    expect(wrapper.style.getPropertyValue("--album-column")).toBe("240px");
  });

  it("checks the matching option in the View menu, never just the CSS", async () => {
    await mount({ initialTileSize: 300 });
    openViewMenu();
    expect(
      screen.getByRole("menuitemradio", { name: "Large" }).getAttribute(
        "aria-checked",
      ),
    ).toBe("true");
  });
});

describe("LiveGallery: the Showing group's own gate", () => {
  it("omits Showing when the guest owns nothing on the album", async () => {
    await mount({ canDeleteIds: [] });
    openViewMenu();
    expect(screen.getByRole("group", { name: "Tile size" })).toBeTruthy();
    expect(screen.queryByRole("group", { name: "Showing" })).toBeNull();
  });

  it("adds Showing, with the owned count in Yours, once something is theirs", async () => {
    // m1 is both a rendered item (mount()'s fixture) and this viewer's own —
    // the same server-read seam `ownIds` always reads off (never a client tally).
    await mount({ canDeleteIds: ["m1"] });
    openViewMenu();
    expect(screen.getByRole("group", { name: "Showing" })).toBeTruthy();
    expect(
      screen.getByRole("menuitemradio", { name: "Yours (1)" }),
    ).toBeTruthy();
  });
});

describe("LiveGallery: Tile size reserved below 640", () => {
  it("disables the group with the Wider screens hint under 640", async () => {
    setViewportWidth(375);
    await mount();
    openViewMenu();
    expect(screen.getByText("Wider screens")).toBeTruthy();
    expect(
      screen
        .getByRole("menuitemradio", { name: "Medium" })
        .getAttribute("aria-disabled"),
    ).toBe("true");
  });

  it("is live at 640 and up, with no hint", async () => {
    setViewportWidth(1024);
    await mount();
    openViewMenu();
    expect(screen.queryByText("Wider screens")).toBeNull();
    // Radix reflects disabled by PRESENCE, not a "false" string — live is the
    // attribute's absence (`view-menu.test.tsx`'s own disabled case is the
    // "true" string; this is its mirror).
    expect(
      screen
        .getByRole("menuitemradio", { name: "Medium" })
        .getAttribute("aria-disabled"),
    ).toBeNull();
  });
});

/* ── THE ONE TRUE COUNT: the teaser's header and its CTA read one number.
   `approvedTotal` (photos and videos, the same number the gate reads) is what
   the header and the CTA both read at teaser access, never the CAPPED,
   photo-only loaded count or the photo-only teaserTotal, so no two surfaces
   count different things for the same album. A caller that has not passed it
   still gets the photo-only teaserTotal, never a regression. ── */

describe("LiveGallery: the teaser's one true count", () => {
  it("reports the true approvedTotal to the header, and the CTA counts the same album", async () => {
    const onCountChange = vi.fn();
    await mount(
      { access: "teaser", approvedTotal: 50, onCountChange },
      { teaserTotal: 44 },
    );
    // The fixture loads 2 items and the photo-only teaserTotal is 44 — 50
    // (photos AND videos) is the number both surfaces read.
    expect(onCountChange).toHaveBeenCalledWith(50);
    expect(
      screen.getByRole("button", { name: "See all 50 photos & videos" }),
    ).toBeInTheDocument();
  });

  it("falls back to the photo-only teaserTotal when approvedTotal is not passed", async () => {
    const onCountChange = vi.fn();
    await mount({ access: "teaser", onCountChange }, { teaserTotal: 44 });
    expect(onCountChange).toHaveBeenCalledWith(44);
    expect(
      screen.getByRole("button", { name: "See all 44 photos & videos" }),
    ).toBeInTheDocument();
  });

  it("falls to the account line once nothing more exists beyond what loaded", async () => {
    await mount({ access: "teaser", approvedTotal: 2 }, { teaserTotal: 2 });
    expect(
      screen.getByRole("button", {
        name: "Confirm your email to see everything",
      }),
    ).toBeInTheDocument();
  });

  it("says one photo in the singular", async () => {
    // Nothing loaded yet (items: []) so `count(1) > rawCount(0)` is the "more
    // exists" branch — the default fixture's two items would otherwise mask it.
    await mount(
      { access: "teaser", approvedTotal: 1 },
      { items: [], teaserTotal: 0 },
    );
    expect(
      screen.getByRole("button", { name: "See all 1 photo & videos" }),
    ).toBeInTheDocument();
  });
});

/* ── THE RENAME PATCH: a rename patches this device's own credits at once.
   "Change name" updates the header chip and localStorage immediately, so
   without the patch the lightbox pill would keep the old name until the next
   poll tick. `renameMine` patches every item `ownIds` already knows is this
   device's own, locally, with no network round trip; the poll's own truth
   still lands on schedule and simply confirms the same value. ── */

describe("LiveGallery: renameMine patches this device's own credits", () => {
  it("patches only the caller's own items, leaving everyone else's alone, no network call", async () => {
    const ref = createRef<LiveGalleryHandle>();
    await mount({ ref, canDeleteIds: ["m1"] });
    guestMasonrySpy.mockClear();

    act(() => {
      ref.current!.renameMine("Rt Alias Three B");
    });

    const lastProps = guestMasonrySpy.mock.calls.at(-1)![0] as {
      items: GridMedia[];
    };
    const mine = lastProps.items.find((i) => i.id === "m1");
    const notMine = lastProps.items.find((i) => i.id === "m2");
    expect(mine?.uploaderName).toBe("Rt Alias Three B");
    expect(notMine?.uploaderName).toBeUndefined();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("does nothing when this device owns nothing on the album", async () => {
    const ref = createRef<LiveGalleryHandle>();
    await mount({ ref, canDeleteIds: [] });
    guestMasonrySpy.mockClear();

    act(() => {
      ref.current!.renameMine("New Name");
    });

    const lastProps = guestMasonrySpy.mock.calls.at(-1)![0] as {
      items: GridMedia[];
    };
    expect(
      lastProps.items.every((i) => i.uploaderName === undefined),
    ).toBe(true);
  });
});

/* ── THE STRICTER-DRIFT GUARD: a STRICTER drift never yanks an open album out
   from under a thumb. Without it, a name-only guest in a full 54-tile album
   whose host turns Require an upload to view ON would see the grid hold 9
   tiles within one poll tick, though no sheet had appeared and no act had been
   taken. The rule: when a poll's decision is LESS open than the one this
   instance mounted with, `refresh()` still tells the shell once
   (`onAccessDrift`, deduped by signature) but never touches
   `serverItems`/count itself — the shell spends the remembered drift on the
   guest's own next act instead. A LOOSER (or equally-open) drift applies at
   once. ── */

describe("LiveGallery: a stricter drift never yanks an open album", () => {
  it("holds a full gallery's items and count against a narrower teaser poll, firing the drift once", async () => {
    const onAccessDrift = vi.fn();
    const onCountChange = vi.fn();
    await mount(
      { access: "full", onAccessDrift, onCountChange },
      { items: [makeItem("m1"), makeItem("m2")] },
    );

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      pollResponse({
        access: "teaser",
        gate: "upload",
        items: [makeItem("m1")],
        teaserTotal: 1,
      }),
    );

    // Two poll ticks report the SAME narrower decision — the steady state
    // once the host's switch has settled — and the callback must fire only
    // for the CHANGE, never once per tick.
    await poll();
    await poll();

    expect(onAccessDrift).toHaveBeenCalledTimes(1);
    expect(onAccessDrift).toHaveBeenCalledWith({
      access: "teaser",
      gate: "upload",
    });
    const lastProps = guestMasonrySpy.mock.calls.at(-1)![0] as {
      items: GridMedia[];
    };
    expect(lastProps.items.map((i) => i.id)).toEqual(["m1", "m2"]);
    // The count line under full access never dips to the narrower total: every
    // report across both ticks (including the seed's own) stayed at 2.
    expect(onCountChange.mock.calls.every(([n]) => n === 2)).toBe(true);
  });

  it("applies at once when a teaser gallery polls into a fuller decision, firing the drift once", async () => {
    const onAccessDrift = vi.fn();
    await mount(
      { access: "teaser", onAccessDrift },
      { items: [makeItem("m1")], teaserTotal: 1 },
    );

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      pollResponse({
        access: "full",
        gate: null,
        items: [makeItem("m1"), makeItem("m2"), makeItem("m3")],
      }),
    );

    await poll();
    await poll();

    expect(onAccessDrift).toHaveBeenCalledTimes(1);
    expect(onAccessDrift).toHaveBeenCalledWith({ access: "full", gate: null });
    const lastProps = guestMasonrySpy.mock.calls.at(-1)![0] as {
      items: GridMedia[];
    };
    expect(lastProps.items.map((i) => i.id)).toEqual(["m1", "m2", "m3"]);
  });

  it("a fresh mount at a new access prop shows exactly that payload (the shell's own key={access} remount)", async () => {
    const atFull = await mount(
      { access: "full" },
      { items: [makeItem("m1"), makeItem("m2")] },
    );
    expect(
      (guestMasonrySpy.mock.calls.at(-1)![0] as { items: GridMedia[] }).items.map(
        (i) => i.id,
      ),
    ).toEqual(["m1", "m2"]);

    // A real access change is never a prop update on a live instance (the
    // shell remounts under a new key) — proven here as a fresh mount, which
    // must show exactly its OWN payload, untouched by the stricter hold a
    // poll would have applied against the instance above.
    atFull.unmount();
    guestMasonrySpy.mockClear();
    await mount(
      { access: "teaser" },
      { items: [makeItem("m3")], teaserTotal: 1 },
    );
    expect(
      (guestMasonrySpy.mock.calls.at(-1)![0] as { items: GridMedia[] }).items.map(
        (i) => i.id,
      ),
    ).toEqual(["m3"]);
  });
});

/* ── THIS VISIT'S OWN ADDS AND REMOVALS, ON EITHER IDENTITY. The server lists
   arrive once a render (`canDeleteIds`) or once a mount (`/api/guests/mine`),
   so between them the gallery itself has to know what this device just added
   and just removed: otherwise a signed-in guest's new photograph has no Trash
   and no mark, and a removed one still counts toward "your last upload", so
   the last-removal warning and the page's refresh read one upload too many. ── */

const { removeMyUploadGuestAction } = await import(
  "@/app/(guest)/e/[token]/actions"
);

type MasonryProps = {
  items: GridMedia[];
  canDelete?: (item: GridMedia) => boolean;
  onDeleteItem?: (id: string) => void;
  mineIds?: ReadonlySet<string>;
};
const lastMasonry = () =>
  guestMasonrySpy.mock.calls.at(-1)![0] as MasonryProps;

describe("LiveGallery: a visit's own adds and removals, on either identity", () => {
  it("a signed-in guest's new photograph is theirs the moment it lands (Trash and mark)", async () => {
    const ref = createRef<LiveGalleryHandle>();
    await mount({ ref, isAuthed: true, canDeleteIds: [] });
    await act(async () => {
      ref.current!.notifyUploaded({
        mediaId: "m9",
        queueId: "q1",
        file: new File(["x"], "x.jpg", { type: "image/jpeg" }),
        kind: "photo",
        status: "approved",
      });
    });
    const props = lastMasonry();
    expect(props.canDelete?.(makeItem("m9"))).toBe(true);
    expect(props.mineIds?.has("m9")).toBe(true);
    expect(props.canDelete?.(makeItem("m2"))).toBe(false);
  });

  it("passes each removed id up, and a removal leaves the count on a signed-in guest too", async () => {
    vi.mocked(removeMyUploadGuestAction).mockResolvedValue({ ok: true });
    const onOwnRemoved = vi.fn();
    await mount({
      isAuthed: true,
      canDeleteIds: ["m1", "m2"],
      closesOnLastRemoval: true,
      onOwnRemoved,
    });
    await act(async () => {
      lastMasonry().onDeleteItem?.("m1");
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    expect(onOwnRemoved).toHaveBeenLastCalledWith("m1", 1);
    // The RSC's list still names m1 (nothing re-rendered the page), and the gallery knows better.
    expect(lastMasonry().canDelete?.(makeItem("m1"))).toBe(false);
    await act(async () => {
      lastMasonry().onDeleteItem?.("m2");
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    // The LAST one: nothing of theirs is left, which is what closes a require-upload album.
    expect(onOwnRemoved).toHaveBeenLastCalledWith("m2", 0);
  });
});

describe("LiveGallery: the header's guest count comes from the server", () => {
  it("reports the poll's guest count, and only from a poll that carried one", async () => {
    const onGuestCountChange = vi.fn();
    await mount({ onGuestCountChange });
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      pollResponse({ access: "full", items: [makeItem("m1")] }),
    );
    await poll();
    expect(onGuestCountChange).not.toHaveBeenCalled();
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      pollResponse({
        access: "full",
        items: [makeItem("m1"), makeItem("m3")],
        etag: "etag-3",
        guestCount: 5,
      }),
    );
    await poll();
    expect(onGuestCountChange).toHaveBeenCalledWith(5);
  });

  it("a 304 changes nothing", async () => {
    const onGuestCountChange = vi.fn();
    await mount({ onGuestCountChange });
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      status: 304,
      ok: false,
      headers: { get: () => null },
      json: async () => ({}),
    });
    await poll();
    expect(onGuestCountChange).not.toHaveBeenCalled();
  });
});

/* ── THE EXACT, LIVE COUNT, AT EVERY LEVEL. A count is counted, never a list's
   length: the payload (the render's and every poll's 200) carries the album's
   head count, and the header shows it plus whatever this device changed since
   (an optimistic tile in, the guest's own removal out). ── */

describe("albumCount: the header's number, as arithmetic", () => {
  it("is the server's head count plus what this device changed since", () => {
    const server = { total: 1145, loaded: 9 };
    expect(
      albumCount({ access: "teaser", server, shown: 9, teaserTotal: 1100 }),
    ).toBe(1145);
    // An approved upload's optimistic tile is on screen before the server has it.
    expect(
      albumCount({ access: "teaser", server, shown: 10, teaserTotal: 1100 }),
    ).toBe(1146);
    // The guest's own removal, taken off the screen before the next 200.
    expect(
      albumCount({
        access: "full",
        server: { total: 1145, loaded: 1145 },
        shown: 1144,
        teaserTotal: null,
      }),
    ).toBe(1144);
  });

  it("wins over the page's fallback and the photo-only total when the payload carried it", () => {
    expect(
      albumCount({
        access: "teaser",
        server: { total: 50, loaded: 2 },
        shown: 2,
        fallbackTotal: 48,
        teaserTotal: 44,
      }),
    ).toBe(50);
  });

  it("without a head count keeps the earlier rule (an older server's payload)", () => {
    const server = { total: null, loaded: 2 };
    expect(
      albumCount({ access: "full", server, shown: 2, teaserTotal: null }),
    ).toBe(2);
    expect(
      albumCount({
        access: "teaser",
        server,
        shown: 2,
        fallbackTotal: 48,
        teaserTotal: 44,
      }),
    ).toBe(48);
    expect(
      albumCount({ access: "teaser", server, shown: 2, teaserTotal: 44 }),
    ).toBe(44);
  });

  it("never goes below zero", () => {
    expect(
      albumCount({
        access: "full",
        server: { total: 0, loaded: 1 },
        shown: 0,
        teaserTotal: null,
      }),
    ).toBe(0);
  });
});

describe("LiveGallery: the header's count, exact and live", () => {
  it("at full, reports the payload's head count, never the list's length", async () => {
    const onCountChange = vi.fn();
    // Two items loaded, but the server counted 1,145: the count is the server's.
    await mount({ access: "full", onCountChange }, { approvedTotal: 1145 });
    expect(onCountChange).toHaveBeenLastCalledWith(1145);
  });

  it("at teaser, a poll moves the count when only the album behind the nine grew (a video landed)", async () => {
    const onCountChange = vi.fn();
    await mount(
      { access: "teaser", approvedTotal: 48, onCountChange },
      { items: [makeItem("m1")], teaserTotal: 40, approvedTotal: 48 },
    );
    expect(onCountChange).toHaveBeenLastCalledWith(48);
    expect(
      screen.getByRole("button", { name: "See all 48 photos & videos" }),
    ).toBeInTheDocument();

    // Same nine (here one) photographs, same photo-only total: only the head count moved.
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      pollResponse({
        access: "teaser",
        gate: "account",
        items: [makeItem("m1")],
        teaserTotal: 40,
        approvedTotal: 49,
      }),
    );
    await poll();

    expect(onCountChange).toHaveBeenLastCalledWith(49);
    expect(
      screen.getByRole("button", { name: "See all 49 photos & videos" }),
    ).toBeInTheDocument();
  });

  it("an approved upload counts the instant its tile lands, and the next 200 settles it", async () => {
    const onCountChange = vi.fn();
    const ref = createRef<LiveGalleryHandle>();
    await mount(
      { access: "full", ref, onCountChange },
      { approvedTotal: 2 },
    );
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      status: 304,
      ok: false,
      headers: { get: () => null },
      json: async () => ({}),
    });
    await act(async () => {
      ref.current!.notifyUploaded({
        mediaId: "m9",
        queueId: "q1",
        file: new File(["x"], "x.jpg", { type: "image/jpeg" }),
        kind: "photo",
        status: "approved",
      });
    });
    expect(onCountChange).toHaveBeenLastCalledWith(3);

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      pollResponse({
        access: "full",
        items: [makeItem("m9"), makeItem("m1"), makeItem("m2")],
        approvedTotal: 3,
        etag: "etag-3",
      }),
    );
    await poll();
    expect(onCountChange).toHaveBeenLastCalledWith(3);
  });

  it("the guest's own removal leaves the count at once", async () => {
    vi.mocked(removeMyUploadGuestAction).mockResolvedValue({ ok: true });
    const onCountChange = vi.fn();
    await mount(
      { access: "full", isAuthed: true, canDeleteIds: ["m1"], onCountChange },
      { approvedTotal: 2 },
    );
    await act(async () => {
      lastMasonry().onDeleteItem?.("m1");
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    expect(onCountChange).toHaveBeenLastCalledWith(1);
  });

  it("a stricter drift holds the count with the album (the rows and the count move together)", async () => {
    const onCountChange = vi.fn();
    await mount(
      { access: "full", onCountChange, onAccessDrift: vi.fn() },
      { approvedTotal: 2 },
    );
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      pollResponse({
        access: "teaser",
        gate: "upload",
        items: [makeItem("m1")],
        teaserTotal: 1,
        approvedTotal: 7,
      }),
    );
    await poll();
    expect(onCountChange.mock.calls.every(([n]) => n === 2)).toBe(true);
  });
});
