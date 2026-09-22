// @contract-for: src/components/guest/live-gallery.tsx
import { createRef, Suspense } from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { GridMedia } from "@/components/app/media-grid";
import {
  buildGuestViewGroups,
  LiveGallery,
  type GalleryPayload,
  type LiveGalleryHandle,
} from "@/components/guest/live-gallery";
import type { GalleryAccess } from "@/lib/events/gallery-access";
import type { TileSize } from "@/lib/shared/tile-size-cookie";
import { setViewportWidth } from "../../../vitest.setup";

// Hoisted so the mock factory below (itself hoisted above the imports) can
// close over it — POLISH 2's own seam: the stub renders nothing to read the
// credit off, so a rename's patch is proven by inspecting the `items` prop
// GuestMasonry was actually handed, never the DOM. `doorbellRefreshRef` is
// DEFECT 1's own seam (door-fixes, 2026-09-21): the doorbell's `onRefresh` is
// literally `() => void refresh()` (fire-and-forget by design — the hook
// never awaits it), so capturing the closure IS the only way to drive a
// "poll landed" tick from outside without standing up a real Realtime socket
// or fake-timering the 12s/60s fallback cadence.
const { guestMasonrySpy, doorbellRefreshRef } = vi.hoisted(() => ({
  guestMasonrySpy: vi.fn(),
  doorbellRefreshRef: { current: null as (() => void) | null },
}));

/**
 * THE GUEST ALBUM'S VIEW MENU, AND THE COOKIE BEHIND ITS TILE SIZE
 * (`controls-home=view-menu`, `theirs=mark`'s own note, 2026-09-20).
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
 * A canned `/api/guests/gallery` poll response (DEFECT 1's own fixture,
 * door-fixes 2026-09-21) — just enough of `fetch`'s Response shape for
 * `refresh()` to read: `.status`, `.ok`, `.headers.get("etag")`, `.json()`.
 */
function pollResponse({
  access,
  gate = null,
  items = [],
  teaserTotal = null,
  etag = "etag-2",
}: {
  access: GalleryAccess;
  gate?: string | null;
  items?: GridMedia[];
  teaserTotal?: number | null;
  etag?: string;
}) {
  return {
    status: 200,
    ok: true,
    headers: { get: (name: string) => (name.toLowerCase() === "etag" ? etag : null) },
    json: async () => ({ ok: true, items, access, gate, teaserTotal }),
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
 * through one (`use-ambient-pause.ts`), which only POLISH 1's own `items: []`
 * fixture reaches in this file (every other test seeds two items and never
 * mounts the empty state at all). A minimal, inert stand-in — this suite never
 * asserts on the river's paused/visible state, only that the teaser CTA beside
 * it reads right.
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

/* ── POLISH 1 (the identity red-team, 2026-09-21): the teaser's one true
   count. Three surfaces used to count three different things for the same
   album — the header read the CAPPED, photo-only loaded count, the CTA read
   the photo-only teaserTotal, and only the gate read the true approvedTotal
   (photos and videos). `approvedTotal` is now the one number the header and
   the CTA both read at teaser access; a caller that has not passed it still
   gets the old photo-only teaserTotal, never a regression. ── */

describe("LiveGallery: the teaser's one true count (POLISH 1)", () => {
  it("reports the true approvedTotal to the header, and the CTA counts the same album", async () => {
    const onCountChange = vi.fn();
    await mount(
      { access: "teaser", approvedTotal: 50, onCountChange },
      { teaserTotal: 44 },
    );
    // The fixture loads 2 items and the photo-only teaserTotal is 44 — 50
    // (photos AND videos) is the number both surfaces read now.
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

/* ── POLISH 2 (the identity red-team, 2026-09-21): a rename patches this
   device's own credits at once. "Change name" used to update the header chip
   and localStorage immediately while the lightbox pill kept the old name
   until the next poll tick. `renameMine` patches every item `ownIds` already
   knows is this device's own, locally, with no network round trip; the poll's
   own truth still lands on schedule and simply confirms the same value. ── */

describe("LiveGallery: renameMine patches this device's own credits (POLISH 2)", () => {
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

/* ── DEFECT 1 (the door red-team's follow-up, `door-fixes`, 2026-09-21): a
   STRICTER drift never yanks an open album out from under a thumb. The
   red-team walked a name-only guest into a full 54-tile album, then flipped
   Require an upload to view ON by SQL; within one poll tick the grid held 9
   tiles though no sheet had appeared and no act had been taken. The rule:
   when a poll's decision is LESS open than the one this instance mounted
   with, `refresh()` still tells the shell once (`onAccessDrift`, deduped by
   signature as before) but never touches `serverItems`/count itself — the
   shell spends the remembered drift on the guest's own next act instead. A
   LOOSER (or equally-open) drift applies at once, exactly as before. ── */

describe("LiveGallery: a stricter drift never yanks an open album (DEFECT 1)", () => {
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
