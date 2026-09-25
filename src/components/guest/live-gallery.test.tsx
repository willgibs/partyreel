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
import type { ViewMenuGroup } from "@/components/shared/view-menu";
import type {
  AlbumLinkTuple,
  GuestWhoTuple,
  ManifestEntry,
} from "@/lib/events/album-wire";
import type { GalleryItem } from "@/lib/events/gallery-reel";
import type { RowStep } from "@/lib/shared/album-rows";
import { setViewportWidth } from "../../../vitest.setup";

/**
 * THE GUEST ALBUM'S VIEW (live-gallery.tsx) ON THE PAGED ALBUM: the rows it hands the grid, the View
 * menu (the density slider and Yours), the teaser's count, the rename patch, the stricter-drift
 * guard, this visit's own adds and removals, and the header's exact, live count.
 *
 * Two seams are stubbed, on purpose. The doorbell (a real Realtime channel) is captured so a test can
 * ring it (`poll()`: one `store.sync()`); the rows (`GalleryRows`: their own measurement, window and
 * viewer) are a spy, so what this file pins is exactly what the view HANDS the grid. The album store
 * itself is real: the seed (`GalleryPayload`) is adopted through its primed first sync with no
 * request, and every later sync is a `fetch` of `/api/album/guest/sync` answered here with the route's
 * own bodies (a delta, a manifest, a teaser, a 304).
 */
const { rowsSpy, doorbellRefreshRef } = vi.hoisted(() => ({
  rowsSpy: vi.fn(),
  doorbellRefreshRef: { current: null as (() => void) | null },
}));

// The real actions.ts chains into a `server-only` module; neither Server Function is this file's
// contract, so both become inert spies.
vi.mock("@/app/(guest)/e/[token]/actions", () => ({
  removeMyUploadGuestAction: vi.fn(),
  setRowStepAction: vi.fn(),
}));
vi.mock("@/lib/guest/use-gallery-doorbell", () => ({
  useGalleryDoorbell: (opts: { onRefresh: () => void }) => {
    doorbellRefreshRef.current = opts.onRefresh;
    return { live: false };
  },
}));
vi.mock("@/components/guest/gallery-rows", () => ({
  GalleryRows: (props: unknown) => {
    rowsSpy(props);
    return <div data-testid="gallery-rows-stub" />;
  },
}));

/* ── fixtures: the paged album's own shapes ── */

const T0 = 1_790_000_000_000_000;
const ids = ["m1", "m2", "m3", "m9"] as const;
/** A manifest entry for one of the fixture's ids: a 4:3 photograph, reel-eligible. */
const entry = (id: string): ManifestEntry => [
  id,
  640,
  480,
  4,
  T0 - ids.indexOf(id as (typeof ids)[number]),
];
const linkOf = (
  id: string,
  who: GuestWhoTuple | null = null,
): AlbumLinkTuple<GuestWhoTuple> => [
  id,
  `https://r2.test/t/${id}`,
  null,
  `https://r2.test/d/${id}`,
  who,
];

function fullSeed({
  entries = ["m1", "m2"],
  total,
  linked = entries,
}: {
  entries?: string[];
  total?: number;
  linked?: string[];
} = {}): GalleryPayload {
  return {
    kind: "full",
    sync: {
      ok: true,
      kind: "manifest",
      access: "full",
      gate: null,
      v: 10,
      attr: 1,
      entries: entries.map(entry),
      next: null,
      total: total ?? entries.length,
      reel: null,
    },
    etag: '"a1-seed"',
    links: {
      ok: true,
      access: "full",
      gate: null,
      b: Math.floor(Date.now() / 1_800_000),
      now: Date.now(),
      links: linked.map((id) => linkOf(id)),
      missing: [],
    },
  };
}

const teaserItem = (id: string): GalleryItem => ({
  id,
  type: "photo",
  url: `https://r2.test/o/${id}.jpg`,
  status: "approved",
});

function teaserSeed({
  items = ["m1"],
  teaserTotal = null,
  approvedTotal = null,
  gate = "account",
}: {
  items?: string[];
  teaserTotal?: number | null;
  approvedTotal?: number | null;
  gate?: "account" | "upload";
} = {}): GalleryPayload {
  return {
    kind: "teaser",
    sync: {
      ok: true,
      kind: "teaser",
      access: "teaser",
      gate,
      items: items.map(teaserItem),
      teaserTotal,
      approvedTotal,
    },
    etag: '"a1-teaser"',
  };
}

/** The sync route's answers, as `fetch` hands them to the transport. */
function respond(body: Record<string, unknown> | 304, etag = '"a1-next"') {
  return body === 304
    ? { status: 304, ok: false, headers: { get: () => null } }
    : {
        status: 200,
        ok: true,
        headers: {
          get: (name: string) => (name.toLowerCase() === "etag" ? etag : null),
        },
        json: async () => body,
      };
}
const delta = (
  upsert: string[],
  remove: string[],
  total: number,
  extra: Record<string, unknown> = {},
) => ({
  ok: true,
  kind: "delta",
  access: "full",
  gate: null,
  v: 11,
  attr: 1,
  upsert: upsert.map(entry),
  remove,
  total,
  reel: null,
  ...extra,
});
const teaserBody = (items: string[], extra: Record<string, unknown> = {}) => ({
  ok: true,
  kind: "teaser",
  access: "teaser",
  gate: "upload",
  items: items.map(teaserItem),
  teaserTotal: items.length,
  approvedTotal: items.length,
  ...extra,
});
const manifestBody = (
  entries: string[],
  extra: Record<string, unknown> = {},
) => ({
  ok: true,
  kind: "manifest",
  access: "full",
  gate: null,
  v: 20,
  attr: 1,
  entries: entries.map(entry),
  next: null,
  total: entries.length,
  reel: null,
  ...extra,
});

/** Every sync from here answers `body`; a links ask answers its ids; `/mine` answers nothing. */
function answerSync(body: Record<string, unknown> | 304, etag?: string) {
  (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(
    async (url: string, init?: { body?: string }) => {
      if (url === "/api/album/guest/sync") return respond(body, etag);
      if (url === "/api/album/guest/media") {
        const asked = JSON.parse(init?.body ?? "{}").ids as string[];
        return respond({
          ok: true,
          access: "full",
          gate: null,
          b: Math.floor(Date.now() / 1_800_000),
          now: Date.now(),
          links: asked.map((id) => linkOf(id)),
          missing: [],
        });
      }
      return respond({ ok: true, ids: [] });
    },
  );
}

/**
 * ★ THE RENDER ITSELF MUST BE INSIDE THE ASYNC `act()`, NOT FOLLOWED BY ONE: `use(galleryPromise)`
 * suspends on mount and resolves on the next microtask, and the retry must land inside a tracked
 * act. A macrotask after it lets the store adopt the seed (its primed first sync).
 */
async function mount(
  props: Partial<Parameters<typeof LiveGallery>[0]> = {},
  seed: GalleryPayload = fullSeed(),
) {
  const galleryPromise = Promise.resolve(seed);
  let utils!: ReturnType<typeof render>;
  await act(async () => {
    utils = render(
      <Suspense fallback={<div>loading</div>}>
        <LiveGallery
          galleryPromise={galleryPromise}
          qrToken="qr-token-1"
          access={seed.kind === "teaser" ? "teaser" : "full"}
          isDemo={false}
          onOpenGate={() => {}}
          isAuthed
          {...props}
        />
      </Suspense>,
    );
    await galleryPromise;
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
  return utils;
}

/** Ring the doorbell: one `store.sync()`, drained past its chain of awaits by a real macrotask. */
async function poll() {
  await act(async () => {
    doorbellRefreshRef.current?.();
    await new Promise((resolve) => setTimeout(resolve, 0));
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

type RowsProps = {
  items: GridMedia[];
  step: RowStep;
  canDelete?: (item: GridMedia) => boolean;
  onDeleteItem?: (id: string) => void;
  mineIds?: ReadonlySet<string>;
  onWindowChange?: (ids: readonly string[]) => void;
};
const lastRows = () => rowsSpy.mock.calls.at(-1)![0] as RowsProps;
const shownIds = () => lastRows().items.map((i) => i.id);

/** Radix's dropdown trigger opens on pointerdown, not click (`view-menu.test.tsx`'s own technique). */
function openViewMenu() {
  fireEvent.pointerDown(screen.getByRole("button", { name: "View" }), {
    ctrlKey: false,
    button: 0,
  });
}

/** jsdom has no IntersectionObserver; the empty state's river arms its pause through one. */
class TestIntersectionObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  takeRecords = vi.fn(() => []);
}

beforeEach(() => {
  global.fetch = vi.fn(async () => respond(304)) as unknown as typeof fetch;
  setViewportWidth(1024);
  rowsSpy.mockClear();
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
      step: 1 as RowStep,
      setStep: vi.fn(),
      boxWidth: null as number | null,
      showingMine: false,
      setShowingMine: vi.fn(),
      ownedCount: 0,
      ...overrides,
    };
  }
  const radio = (g: unknown) => g as ViewMenuGroup;

  it("is the density slider alone when the guest owns nothing on the album", () => {
    const groups = buildGuestViewGroups(base());
    expect(groups.map((g) => g.id)).toEqual(["size"]);
    expect(groups[0]).toMatchObject({
      kind: "density",
      label: "Size",
      value: 1,
    });
  });

  it("adds Showing once the guest owns something, the count inside Yours' own label", () => {
    const groups = buildGuestViewGroups(base({ ownedCount: 3 }));
    expect(groups.map((g) => g.id)).toEqual(["size", "showing"]);
    expect(radio(groups[1]).options).toEqual([
      { value: "all", label: "Everyone's" },
      { value: "mine", label: "Yours (3)" },
    ]);
  });

  it("Showing's value follows the live intent, never a stale snapshot", () => {
    const on = buildGuestViewGroups(base({ ownedCount: 2, showingMine: true }));
    expect(radio(on[1]).value).toBe("mine");
    const off = buildGuestViewGroups(
      base({ ownedCount: 2, showingMine: false }),
    );
    expect(radio(off[1]).value).toBe("all");
  });

  it("routes Showing's onChange to setShowingMine as a boolean, never the raw string", () => {
    const setShowingMine = vi.fn();
    const [, showing] = buildGuestViewGroups(
      base({ ownedCount: 1, setShowingMine }),
    );
    radio(showing).onChange("mine");
    expect(setShowingMine).toHaveBeenCalledWith(true);
    radio(showing).onChange("all");
    expect(setShowingMine).toHaveBeenCalledWith(false);
  });

  it("speaks in photographs a row once the album has laid its rows, and in plain names before", () => {
    const [cold] = buildGuestViewGroups(base());
    expect("perRow" in cold && cold.perRow).toBeFalsy();
    const [laid] = buildGuestViewGroups(base({ boxWidth: 1400 }));
    expect(laid.kind).toBe("density");
    if (laid.kind !== "density") return;
    // A desk: 3, 5 or 8 a row (album-rows.ts' ROW_CLASSES).
    expect([0, 1, 2].map((s) => laid.perRow?.(s as RowStep))).toEqual([
      3, 5, 8,
    ]);
  });

  it("routes the slider's pick to setStep as the step itself", () => {
    const setStep = vi.fn();
    const [size] = buildGuestViewGroups(base({ setStep }));
    if (size.kind !== "density") throw new Error("expected the density group");
    size.onChange(2);
    expect(setStep).toHaveBeenCalledWith(2);
  });
});

describe("LiveGallery: the step's cookie reaches the rows", () => {
  it("hands the rows the server-resolved step on first render", async () => {
    await mount({ initialRowStep: 2 });
    expect(lastRows().step).toBe(2);
  });

  it("falls back to the middle step when the cookie was missing", async () => {
    await mount({ initialRowStep: undefined });
    expect(lastRows().step).toBe(1);
  });

  it("checks the matching stop in the View menu, never just the rows", async () => {
    await mount({ initialRowStep: 0 });
    openViewMenu();
    expect(
      screen
        .getByRole("menuitemradio", { name: "Large" })
        .getAttribute("aria-checked"),
    ).toBe("true");
  });
});

describe("LiveGallery: the Showing group's own gate", () => {
  it("omits Showing when the guest owns nothing on the album", async () => {
    await mount({ canDeleteIds: [] });
    openViewMenu();
    expect(screen.getByRole("group", { name: "Size" })).toBeTruthy();
    expect(screen.queryByRole("group", { name: "Showing" })).toBeNull();
  });

  it("adds Showing, with the owned count in Yours, once something is theirs", async () => {
    await mount({ canDeleteIds: ["m1"] });
    openViewMenu();
    expect(screen.getByRole("group", { name: "Showing" })).toBeTruthy();
    expect(
      screen.getByRole("menuitemradio", { name: "Yours (1)" }),
    ).toBeTruthy();
  });

  it("counts the guest's own over the WHOLE manifest, linked or not", async () => {
    // m3 has no link yet (it is far down the album): it is still theirs, and still counted.
    await mount(
      { canDeleteIds: ["m1", "m3"] },
      fullSeed({ entries: ["m1", "m2", "m3"], linked: ["m1"] }),
    );
    openViewMenu();
    expect(
      screen.getByRole("menuitemradio", { name: "Yours (2)" }),
    ).toBeTruthy();
  });
});

describe("LiveGallery: the rows hold the whole album, and the window gets the links", () => {
  it("hands the rows every photograph of the manifest, a link-less one as a loading item", async () => {
    await mount({}, fullSeed({ entries: ["m1", "m2", "m3"], linked: ["m1"] }));
    const items = lastRows().items;
    expect(items.map((i) => i.id)).toEqual(["m1", "m2", "m3"]);
    expect(items[0].url).toBe("https://r2.test/t/m1");
    expect(items[2].url).toBe("");
  });

  it("asks for the window's links when the rows report it", async () => {
    answerSync(304);
    await mount({}, fullSeed({ entries: ["m1", "m2", "m3"], linked: ["m1"] }));
    await act(async () => {
      lastRows().onWindowChange?.(["m1", "m2", "m3"]);
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    const media = (global.fetch as ReturnType<typeof vi.fn>).mock.calls.filter(
      ([url]) => url === "/api/album/guest/media",
    );
    // The seeded link is answered from the page; only the other two go out.
    expect(media).toHaveLength(1);
    expect(JSON.parse(media[0][1].body).ids).toEqual(["m2", "m3"]);
    expect(lastRows().items.map((i) => i.url)).toEqual([
      "https://r2.test/t/m1",
      "https://r2.test/t/m2",
      "https://r2.test/t/m3",
    ]);
  });
});

/* ── THE ONE TRUE COUNT: the teaser's header and its CTA read one number. ── */

describe("LiveGallery: the teaser's one true count", () => {
  it("reports the true approvedTotal to the header, and the CTA counts the same album", async () => {
    const onCountChange = vi.fn();
    await mount(
      { onCountChange },
      teaserSeed({ items: ["m1", "m2"], teaserTotal: 44, approvedTotal: 50 }),
    );
    expect(onCountChange).toHaveBeenCalledWith(50);
    expect(
      screen.getByRole("button", { name: "See all 50 photos & videos" }),
    ).toBeInTheDocument();
  });

  it("falls back to the page's total, then the photo-only teaserTotal, when the answer carries none", async () => {
    const onCountChange = vi.fn();
    await mount(
      { approvedTotal: 48, onCountChange },
      teaserSeed({ items: ["m1", "m2"], teaserTotal: 44 }),
    );
    expect(onCountChange).toHaveBeenCalledWith(48);
  });

  it("falls to the account line once nothing more exists beyond what loaded", async () => {
    await mount(
      {},
      teaserSeed({ items: ["m1", "m2"], teaserTotal: 2, approvedTotal: 2 }),
    );
    expect(
      screen.getByRole("button", {
        name: "Confirm your email to see everything",
      }),
    ).toBeInTheDocument();
  });

  it("says one photo in the singular", async () => {
    await mount(
      {},
      teaserSeed({ items: [], teaserTotal: 0, approvedTotal: 1 }),
    );
    expect(
      screen.getByRole("button", { name: "See all 1 photo & videos" }),
    ).toBeInTheDocument();
  });
});

/* ── THE RENAME PATCH: a rename patches this device's own credits at once, with no request. ── */

describe("LiveGallery: renameMine patches this device's own credits", () => {
  it("patches only the caller's own items, leaving everyone else's alone, no network call", async () => {
    const ref = createRef<LiveGalleryHandle>();
    await mount({ ref, canDeleteIds: ["m1"] });
    (global.fetch as ReturnType<typeof vi.fn>).mockClear();
    rowsSpy.mockClear();
    act(() => {
      ref.current!.renameMine("Rt Alias Three B");
    });
    const items = lastRows().items;
    expect(items.find((i) => i.id === "m1")?.uploaderName).toBe(
      "Rt Alias Three B",
    );
    expect(items.find((i) => i.id === "m2")?.uploaderName).toBeNull();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("does nothing when this device owns nothing on the album", async () => {
    const ref = createRef<LiveGalleryHandle>();
    await mount({ ref, canDeleteIds: [] });
    act(() => {
      ref.current!.renameMine("New Name");
    });
    expect(lastRows().items.every((i) => i.uploaderName === null)).toBe(true);
  });
});

/* ── THE STRICTER-DRIFT GUARD: a STRICTER answer never yanks an open album out from under a thumb;
   the drift is reported once and the album, its count and its links hold. A LOOSER one applies. ── */

describe("LiveGallery: a stricter drift never yanks an open album", () => {
  it("holds a full album's items and count against a narrower teaser answer, firing the drift once", async () => {
    const onAccessDrift = vi.fn();
    const onCountChange = vi.fn();
    await mount({ onAccessDrift, onCountChange });
    answerSync(teaserBody(["m1"]));
    // Two polls report the SAME narrower decision: the callback fires for the CHANGE only.
    await poll();
    await poll();
    expect(onAccessDrift).toHaveBeenCalledTimes(1);
    expect(onAccessDrift).toHaveBeenCalledWith({
      access: "teaser",
      gate: "upload",
    });
    expect(shownIds()).toEqual(["m1", "m2"]);
    // The links the album held still draw (they live), though the store let them go.
    expect(lastRows().items[0].url).toBe("https://r2.test/t/m1");
    expect(onCountChange.mock.calls.every(([n]) => n === 2)).toBe(true);
  });

  it("applies at once when a teaser album polls into a fuller decision, firing the drift once", async () => {
    const onAccessDrift = vi.fn();
    await mount(
      { onAccessDrift },
      teaserSeed({ items: ["m1"], teaserTotal: 1 }),
    );
    answerSync(manifestBody(["m1", "m2", "m3"]));
    await poll();
    await poll();
    expect(onAccessDrift).toHaveBeenCalledTimes(1);
    expect(onAccessDrift).toHaveBeenCalledWith({ access: "full", gate: null });
    expect(shownIds()).toEqual(["m1", "m2", "m3"]);
  });

  it("a fresh mount at a new access shows exactly that seed (the shell's own key={access} remount)", async () => {
    const atFull = await mount();
    expect(shownIds()).toEqual(["m1", "m2"]);
    atFull.unmount();
    rowsSpy.mockClear();
    await mount({}, teaserSeed({ items: ["m3"], teaserTotal: 1 }));
    expect(shownIds()).toEqual(["m3"]);
  });
});

/* ── THIS VISIT'S OWN ADDS AND REMOVALS, ON EITHER IDENTITY. ── */

const { removeMyUploadGuestAction } =
  await import("@/app/(guest)/e/[token]/actions");
const aFile = () => new File(["x"], "x.jpg", { type: "image/jpeg" });

describe("LiveGallery: a visit's own adds and removals, on either identity", () => {
  it("a signed-in guest's new photograph is theirs the moment it lands (Trash and mark)", async () => {
    const ref = createRef<LiveGalleryHandle>();
    await mount({ ref, isAuthed: true, canDeleteIds: [] });
    await act(async () => {
      ref.current!.notifyUploaded({
        mediaId: "m9",
        queueId: "q1",
        file: aFile(),
        kind: "photo",
        status: "approved",
      });
    });
    const props = lastRows();
    expect(shownIds()[0]).toBe("m9");
    expect(props.canDelete?.({ id: "m9" } as GridMedia)).toBe(true);
    expect(props.mineIds?.has("m9")).toBe(true);
    expect(props.canDelete?.({ id: "m2" } as GridMedia)).toBe(false);
  });

  it("passes each removed id up, takes it off at once, and a removal leaves the count on a signed-in guest too", async () => {
    vi.mocked(removeMyUploadGuestAction).mockResolvedValue({ ok: true });
    const onOwnRemoved = vi.fn();
    await mount({
      isAuthed: true,
      canDeleteIds: ["m1", "m2"],
      closesOnLastRemoval: true,
      onOwnRemoved,
    });
    await act(async () => {
      lastRows().onDeleteItem?.("m1");
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    expect(onOwnRemoved).toHaveBeenLastCalledWith("m1", 1);
    expect(shownIds()).toEqual(["m2"]);
    expect(lastRows().canDelete?.({ id: "m1" } as GridMedia)).toBe(false);
    await act(async () => {
      lastRows().onDeleteItem?.("m2");
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    // The LAST one: nothing of theirs is left, which is what closes a require-upload album.
    expect(onOwnRemoved).toHaveBeenLastCalledWith("m2", 0);
  });

  it("a refused removal puts the photograph back, with no refetch", async () => {
    vi.mocked(removeMyUploadGuestAction).mockResolvedValue({
      ok: false,
      message: "nope",
    });
    await mount({ isAuthed: true, canDeleteIds: ["m1"] });
    (global.fetch as ReturnType<typeof vi.fn>).mockClear();
    await act(async () => {
      lastRows().onDeleteItem?.("m1");
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    expect(shownIds()).toEqual(["m1", "m2"]);
    expect(global.fetch).not.toHaveBeenCalled();
  });
});

describe("LiveGallery: the header's guest count comes from the server", () => {
  it("reports an answer's guest count, and only from an answer that carried one", async () => {
    const onGuestCountChange = vi.fn();
    await mount({ onGuestCountChange });
    answerSync(delta(["m3"], [], 3));
    await poll();
    expect(onGuestCountChange).not.toHaveBeenCalled();
    answerSync(delta(["m9"], [], 4, { guestCount: 5 }));
    await poll();
    expect(onGuestCountChange).toHaveBeenCalledWith(5);
  });

  it("a 304 changes nothing", async () => {
    const onGuestCountChange = vi.fn();
    await mount({ onGuestCountChange });
    answerSync(304);
    await poll();
    expect(onGuestCountChange).not.toHaveBeenCalled();
  });
});

/* ── THE EXACT, LIVE COUNT, AT EVERY LEVEL: the server's head count plus what this device changed. ── */

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
  it("at full, reports the answer's head count, never the list's length", async () => {
    const onCountChange = vi.fn();
    await mount({ onCountChange }, fullSeed({ total: 1145 }));
    expect(onCountChange).toHaveBeenLastCalledWith(1145);
  });

  it("at teaser, a poll moves the count when only the album behind the nine grew (a video landed)", async () => {
    const onCountChange = vi.fn();
    await mount(
      { approvedTotal: 48, onCountChange },
      teaserSeed({ items: ["m1"], teaserTotal: 40, approvedTotal: 48 }),
    );
    expect(onCountChange).toHaveBeenLastCalledWith(48);
    answerSync(
      teaserBody(["m1"], {
        gate: "account",
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

  it("an approved upload counts the instant its tile lands, and the delta settles it", async () => {
    const onCountChange = vi.fn();
    const ref = createRef<LiveGalleryHandle>();
    await mount({ ref, onCountChange });
    answerSync(304);
    await act(async () => {
      ref.current!.notifyUploaded({
        mediaId: "m9",
        queueId: "q1",
        file: aFile(),
        kind: "photo",
        status: "approved",
      });
    });
    expect(onCountChange).toHaveBeenLastCalledWith(3);
    answerSync(delta(["m9"], [], 3));
    await poll();
    expect(onCountChange).toHaveBeenLastCalledWith(3);
    // One tile for it, the manifest's (the optimistic one left the moment the manifest held it).
    expect(shownIds().filter((id) => id === "m9")).toHaveLength(1);
  });

  it("the guest's own removal leaves the count at once, and the delta agrees", async () => {
    vi.mocked(removeMyUploadGuestAction).mockResolvedValue({ ok: true });
    const onCountChange = vi.fn();
    await mount({ isAuthed: true, canDeleteIds: ["m1"], onCountChange });
    answerSync(delta([], ["m1"], 1));
    await act(async () => {
      lastRows().onDeleteItem?.("m1");
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    expect(onCountChange).toHaveBeenLastCalledWith(1);
    await poll();
    expect(onCountChange).toHaveBeenLastCalledWith(1);
  });

  it("a stricter drift holds the count with the album (the rows and the count move together)", async () => {
    const onCountChange = vi.fn();
    await mount({ onCountChange, onAccessDrift: vi.fn() });
    answerSync(teaserBody(["m1"], { approvedTotal: 7 }));
    await poll();
    expect(onCountChange.mock.calls.every(([n]) => n === 2)).toBe(true);
  });
});

describe("LiveGallery: the arrival", () => {
  it("what a delta brings that was not on screen glows, in its place; the seed never does", async () => {
    await mount();
    const arrived = () =>
      (rowsSpy.mock.calls.at(-1)![0] as { arrivedIds?: ReadonlySet<string> })
        .arrivedIds;
    expect(arrived()?.size ?? 0).toBe(0);
    answerSync(delta(["m3"], [], 3));
    await poll();
    // In the album's own order (m3 is the oldest of the three), and glowing.
    expect(shownIds()).toEqual(["m1", "m2", "m3"]);
    expect(arrived()?.has("m3")).toBe(true);
  });
});
