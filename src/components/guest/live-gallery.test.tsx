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
import { guestSelect } from "@/components/guest/live-gallery-select";
import type { ViewMenuGroup } from "@/components/shared/view-menu";
import type {
  AlbumLinkTuple,
  GuestWhoTuple,
  ManifestEntry,
} from "@/lib/events/album-wire";
import type { GalleryItem } from "@/lib/events/gallery-reel";
import type { QueueItem } from "@/lib/guest/use-upload-queue";
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
  pending?: { queueId: string; status: string }[];
  step: RowStep;
  canDelete?: (item: GridMedia) => boolean;
  onDeleteItem?: (id: string) => void;
  onWindowChange?: (ids: readonly string[]) => void;
  arrivals?: readonly string[];
  onNeedLinks?: (ids: readonly string[]) => void;
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

  it("reads a lone item as 'photo or video', never a lying 'photo' (build 9 and 10's red-teams)", async () => {
    await mount(
      {},
      teaserSeed({ items: [], teaserTotal: 0, approvedTotal: 1 }),
    );
    expect(
      screen.getByRole("button", { name: "See all 1 photo or video" }),
    ).toBeInTheDocument();
  });
});

/* ── ★ THE ALBUM'S OWN COUNT LINE NAMES WHAT IT HOLDS (crumbs-61, red-team 48's NIT): it said "12 photos & videos" over
   twelve photographs, where the host's Download panel said "12 photos". The words are the source's (`albumCountWords`,
   `gallery-live.test.tsx` pins them); this is the line saying them. ── */

describe("LiveGallery: the album's own count line", () => {
  it("★ says what the album holds: photographs are '2 photos', never 'photos & videos'", async () => {
    await mount();
    expect(screen.getByText("2 photos")).toBeInTheDocument();
    expect(screen.queryByText(/photos & videos/)).toBeNull();
  });

  it("says both nouns where it cannot see into the album: a teaser's count is a total of kinds unknown", async () => {
    await mount(
      {},
      teaserSeed({ items: ["m1", "m2"], teaserTotal: 44, approvedTotal: 50 }),
    );
    expect(screen.getByText("50 photos & videos")).toBeInTheDocument();
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

/**
 * THE ALBUM'S YOURS, ON A SHARED PHONE (crumbs-27). A signed-in account's list is her account's, read in the page
 * (`canDeleteIds`), and the album never asks the ticket the phone still holds for it which photographs are hers:
 * that ask (`/api/guests/mine`) is the signed-out guest's alone, since another guest's name-only ticket is not hers
 * (crumbs-26's owner rule) and its photographs must never join her Yours or wear her Remove. Green before this
 * lane too (the album already read it so); pinned here because the export's own ids and her tracker did not, and
 * the four readers must agree.
 */
describe("LiveGallery: whose the photographs are on a shared phone", () => {
  const minesAsked = () =>
    (global.fetch as ReturnType<typeof vi.fn>).mock.calls.filter(
      ([url]) => url === "/api/guests/mine",
    );

  it("★ a signed-in guest's Yours is her account's alone: the phone's ticket is never asked which are hers", async () => {
    answerSync(304);
    await mount({
      isAuthed: true,
      canDeleteIds: ["m1"],
      sessionToken: "t".repeat(64),
    });
    expect(minesAsked()).toEqual([]);
    expect(lastRows().canDelete?.({ id: "m1" } as GridMedia)).toBe(true);
    expect(lastRows().canDelete?.({ id: "m2" } as GridMedia)).toBe(false);
  });

  it("a signed-out guest's Yours is the device ticket's, asked once, the token in the body", async () => {
    answerSync(304);
    await mount({
      isAuthed: false,
      canDeleteIds: [],
      sessionToken: "t".repeat(64),
    });
    expect(minesAsked()).toHaveLength(1);
    expect(JSON.parse(String(minesAsked()[0][1].body))).toEqual({
      qr_token: "qr-token-1",
      session_token: "t".repeat(64),
    });
  });
});

describe("LiveGallery: a visit's own adds and removals, on either identity", () => {
  it("a signed-in guest's new photograph is theirs the moment it lands (Trash and the Yours filter)", async () => {
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
    expect(shownIds()[0]).toBe("m9");
    const props = lastRows();
    expect(props.canDelete?.({ id: "m9" } as GridMedia)).toBe(true);
    expect(props.canDelete?.({ id: "m2" } as GridMedia)).toBe(false);

    // No mark rides the tile any more (`mine=none`): View's Showing, not a tap
    // on the tile, is how she finds it.
    openViewMenu();
    fireEvent.click(screen.getByRole("menuitemradio", { name: "Yours (1)" }));
    expect(shownIds()).toEqual(["m9"]);
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

/**
 * ★ THE OWNER'S OWN ARE THE HOST'S FROM THEIR FIRST FRAME (crumbs-32, from `crumbs-31`). On her own guest page the
 * album's owner adds through the host's pair, so `remove_my_upload`'s host arm takes her Delete to her Deleted, and
 * the viewer's confirm says so off the item's `isHost`. That flag rode the link's attribution alone, so a photograph
 * she had just added (and one of hers whose link had not landed) said the guest's "can't be recovered" until the
 * album's next sync. Her own items carry it now from the frame they first draw in; nobody else's ever do.
 */
describe("LiveGallery: the owner's own uploads are the host's from the first frame", () => {
  const hostOf = (id: string) =>
    lastRows().items.find((i) => i.id === id)?.isHost;
  const landMine = async (ref: { current: LiveGalleryHandle | null }) => {
    await act(async () => {
      ref.current!.notifyUploaded({
        mediaId: "m9",
        queueId: "q1",
        file: aFile(),
        kind: "photo",
        status: "approved",
      });
    });
  };

  it("★ a photograph she just added is the host's before the album holds it", async () => {
    answerSync(304);
    const ref = createRef<LiveGalleryHandle>();
    await mount({ ref, isOwner: true, isAuthed: true, canDeleteIds: [] });
    await landMine(ref);
    expect(shownIds()[0]).toBe("m9");
    expect(hostOf("m9")).toBe(true);
  });

  it("★ one of hers the album holds with no link's word yet is the host's, and a guest's beside it is not", async () => {
    await mount({ isOwner: true, isAuthed: true, canDeleteIds: ["m1"] });
    // The fixture's links carry no attribution, so only what the page knows can say whose m1 is.
    expect(hostOf("m1")).toBe(true);
    expect(hostOf("m2")).toBe(false);
  });

  it("stays the host's through the sync that brings it into the album, before its own link lands", async () => {
    const ref = createRef<LiveGalleryHandle>();
    await mount({ ref, isOwner: true, isAuthed: true, canDeleteIds: [] });
    answerSync(delta(["m9"], [], 3));
    await landMine(ref);
    await poll();
    expect(shownIds()).toContain("m9");
    expect(hostOf("m9")).toBe(true);
  });

  it("a guest's own are never the host's, whatever she adds", async () => {
    answerSync(304);
    const ref = createRef<LiveGalleryHandle>();
    await mount({ ref, isAuthed: true, canDeleteIds: ["m1"] });
    await landMine(ref);
    expect(hostOf("m9")).toBeFalsy();
    expect(hostOf("m1")).toBe(false);
  });
});

/**
 * ★ THE ALBUM'S HEAD DRAWS ONLY WHAT IS IN THE AIR (voice-guest r2, Will's `held=uploads`): a held
 * photograph shows only in her uploads, the badge beside Add counting it, and the album shows only
 * what is in it. A file still sending keeps its stack; one that failed is the failure sheet's.
 */
describe("LiveGallery: what this device draws at the album's head", () => {
  const queued = (
    id: string,
    status: QueueItem["status"],
    extra: Partial<QueueItem> = {},
  ): QueueItem => ({
    id,
    file: aFile(),
    kind: "photo",
    status,
    progress: status === "uploading" ? 40 : 0,
    ...extra,
  });

  it("★ a held photograph takes no head slot; the files still sending keep their stack", async () => {
    await mount({
      pendingUploads: [
        queued("q1", "done", { mediaStatus: "pending", mediaId: "h1" }),
        queued("q2", "uploading"),
        queued("q3", "queued"),
        queued("q4", "error", { error: "Too big" }),
      ],
    });
    expect(lastRows().pending?.map((p) => [p.queueId, p.status])).toEqual([
      ["q2", "uploading"],
      ["q3", "queued"],
    ]);
  });

  it("an album of only her held photographs is the album's empty state, never a grid of hers", async () => {
    rowsSpy.mockClear();
    await mount(
      {
        pendingUploads: [
          queued("q1", "done", { mediaStatus: "pending", mediaId: "h1" }),
        ],
      },
      fullSeed({ entries: [] }),
    );
    expect(rowsSpy).not.toHaveBeenCalled();
    expect(screen.getByText("The album starts with you")).toBeInTheDocument();
  });

  /* ★ WHERE WHAT SHE ADDS WAITS, NOTHING OF HERS IN THE AIR STANDS IN THE ALBUM (red-team 44's MEDIUM): on an album
     with a develop time ahead, or one whose host approves each, a pick in flight drew the stack at the album's head
     from the press until it landed and then vanished, so a video stood in the album for its whole upload. Hers live in
     her tracker from the press (sending, then waiting), and the album draws only what is in it. */
  it("★ where what she adds waits, nothing in the air takes a head slot, and an empty album stays its empty state", async () => {
    rowsSpy.mockClear();
    await mount(
      {
        addsWait: true,
        pendingUploads: [queued("q1", "uploading"), queued("q2", "queued")],
      },
      fullSeed({ entries: [] }),
    );
    expect(rowsSpy).not.toHaveBeenCalled();
    expect(screen.getByText("The album starts with you")).toBeInTheDocument();
  });

  it("★ and an album with photographs in it draws exactly them while hers go", async () => {
    await mount({
      addsWait: true,
      pendingUploads: [queued("q1", "uploading"), queued("q2", "queued")],
    });
    expect(lastRows().pending).toEqual([]);
    expect(shownIds()).toEqual(["m1", "m2"]);
  });

  it("an album that shows what is added at once keeps today's stack from the press, on an empty album too", async () => {
    rowsSpy.mockClear();
    await mount(
      { addsWait: false, pendingUploads: [queued("q1", "uploading")] },
      fullSeed({ entries: [] }),
    );
    expect(lastRows().pending?.map((p) => [p.queueId, p.status])).toEqual([
      ["q1", "uploading"],
    ]);
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
  it("what a delta brings that was not on screen is handed to the rows as an arrival, in its place; the seed never is", async () => {
    await mount();
    expect(lastRows().arrivals ?? []).toEqual([]);
    answerSync(delta(["m3"], [], 3));
    await poll();
    // In the album's own order (m3 is the oldest of the three), and an arrival: the rows hold it out
    // until its photograph is decoded and light it when it lands (`use-arrival-gate.ts`).
    expect(shownIds()).toEqual(["m1", "m2", "m3"]);
    expect(lastRows().arrivals).toEqual(["m3"]);
  });

  it("gives the rows the way to ask for an arrival's link, since no window stands on it to ask (crumbs-23)", async () => {
    // A delta brings the manifest's tuple alone; the link is asked for only by a window over the item.
    // The rows hold an arrival out of every window until its photograph is ready, so they must ask.
    await mount();
    const links = () =>
      (global.fetch as ReturnType<typeof vi.fn>).mock.calls.filter(
        ([url]) => url === "/api/album/guest/media",
      );
    answerSync(delta(["m3"], [], 3));
    await poll();
    expect(links()).toHaveLength(0);
    await act(async () => {
      lastRows().onNeedLinks?.(["m3"]);
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    expect(links()).toHaveLength(1);
    expect(JSON.parse(links()[0][1].body).ids).toEqual(["m3"]);
    // And the link that lands is the item's own, for the rows' tile to draw.
    expect(lastRows().items.find((i) => i.id === "m3")?.url).toBe(
      "https://r2.test/t/m3",
    );
  });

  it("never hands this device's own upload over as an arrival: it sweeps, it does not wait", async () => {
    const ref = createRef<LiveGalleryHandle>();
    await mount({ ref, isAuthed: true, canDeleteIds: [] });
    // The manifest brings the photograph this device just sent (m9), as it brings anyone's.
    answerSync(delta(["m9"], [], 3));
    await act(async () => {
      ref.current!.notifyUploaded({
        mediaId: "m9",
        queueId: "q1",
        file: new File(["x"], "x.jpg", { type: "image/jpeg" }),
        kind: "photo",
        status: "approved",
      });
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    await poll();
    // In the album and not an arrival: the rows hold an arrival out until its photograph is decoded,
    // and this device's own landing must appear the moment it is sent.
    expect(shownIds()).toContain("m9");
    expect(lastRows().arrivals ?? []).toEqual([]);
  });
});

describe("an album its source could not read (crumbs-30, from crumbs-28)", () => {
  /** A seed whose read failed (not a refusal, which answers locked), as the page streams it: already handled. */
  function failedSeed(): Promise<GalleryPayload> {
    const seed = Promise.reject(
      Object.assign(new Error("read failed: relation media timed out"), {
        digest: "1234567",
      }),
    );
    seed.catch(() => {});
    return seed;
  }

  const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

  async function mountFailed() {
    const galleryPromise = failedSeed();
    await act(async () => {
      render(
        <Suspense fallback={<div>loading</div>}>
          <LiveGallery
            galleryPromise={galleryPromise}
            qrToken="qr-token-1"
            access="full"
            isDemo={false}
            onOpenGate={() => {}}
            isAuthed
          />
        </Suspense>,
      );
      await galleryPromise.catch(() => {});
      await tick();
      await tick();
    });
  }

  /** Every sync answers a server error; everything else answers nothing. */
  function syncFails() {
    (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(
      async (url: string) =>
        url === "/api/album/guest/sync"
          ? { status: 500, ok: false, headers: { get: () => null } }
          : respond({ ok: true, ids: [] }),
    );
  }

  it("★ draws the album's skeleton while its own first read is in flight, so a read that heals at once never flashes a failure", async () => {
    let land: (reply: unknown) => void = () => {};
    (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(
      async (url: string) =>
        url === "/api/album/guest/sync"
          ? new Promise((resolve) => {
              land = resolve;
            })
          : respond({ ok: true, ids: [] }),
    );
    await mountFailed();
    expect(document.querySelector("[data-gallery-skeleton]")).not.toBeNull();
    expect(screen.queryByRole("alert")).toBeNull();
    await act(async () => {
      land(respond(manifestBody(["m1", "m2"])));
      await tick();
      await tick();
    });
    expect(document.querySelector("[data-gallery-skeleton]")).toBeNull();
    expect(shownIds()).toEqual(["m1", "m2"]);
  });

  it("★ says it could not load once that read has failed too, and Try again reads it again: the album draws, no refresh", async () => {
    syncFails();
    await mountFailed();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "The album didn’t load",
    );
    // Never the error's own words.
    expect(document.body.textContent).not.toMatch(/relation|timed out/);
    answerSync(manifestBody(["m3"]));
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Try again" }));
      await tick();
      await tick();
    });
    expect(screen.queryByRole("alert")).toBeNull();
    expect(shownIds()).toEqual(["m3"]);
  });

  it("a Try again that fails again says so again, and can be tried again", async () => {
    syncFails();
    await mountFailed();
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Try again" }));
      await tick();
      await tick();
    });
    expect(screen.getByRole("alert")).toHaveTextContent(
      "The album didn’t load",
    );
    expect(screen.getByRole("button", { name: "Try again" })).toBeEnabled();
  });

  it("the next poll heals it by itself", async () => {
    syncFails();
    await mountFailed();
    expect(screen.getByRole("alert")).toBeInTheDocument();
    answerSync(manifestBody(["m1"]));
    await poll();
    expect(screen.queryByRole("alert")).toBeNull();
    expect(shownIds()).toEqual(["m1"]);
  });
});

/**
 * SELECT, THEN SAVE (take-home r1, `guest=select`, Will's note: "drop the direct 'download all' in favor of hitting
 * select then selecting all, then save"): Select takes Download all's place in the album's row; in select mode the
 * bar (Cancel, what she has, Yours and All) stands in that row's place and the rows are handed a selection, every
 * tile a toggle. The foot's Save is the dock's (its own tests); what it does is `live-gallery-save.tsx`'s.
 */
describe("Select, then Save", () => {
  afterEach(() => act(() => guestSelect.exit()));

  type Selection = {
    selected: ReadonlySet<string>;
    onToggle: (id: string) => void;
  };
  const selectionOf = () =>
    (lastRows() as RowsProps & { selection?: Selection }).selection;

  it("offers Select where Download all stood, and no Download all at all", async () => {
    await mount();
    expect(screen.getByRole("button", { name: "Select" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Download all/ })).toBeNull();
    expect(selectionOf()).toBeUndefined();
  });

  it("turns the row into her selection's bar and every tile into a toggle", async () => {
    await mount();
    fireEvent.click(screen.getByRole("button", { name: "Select" }));
    expect(document.querySelector("[data-select-bar]")).not.toBeNull();
    expect(screen.getByText("Select photos")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
    act(() => selectionOf()!.onToggle("m2"));
    expect(screen.getByText("1 selected")).toBeInTheDocument();
    expect([...selectionOf()!.selected]).toEqual(["m2"]);
    act(() => selectionOf()!.onToggle("m2"));
    expect(selectionOf()!.selected.size).toBe(0);
  });

  it("All picks the whole album shown, and pressed again lets it all go", async () => {
    await mount();
    fireEvent.click(screen.getByRole("button", { name: "Select" }));
    const all = screen.getByRole("button", { name: "All" });
    fireEvent.click(all);
    expect([...selectionOf()!.selected].sort()).toEqual(["m1", "m2"]);
    expect(screen.getByRole("button", { name: "All" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    fireEvent.click(screen.getByRole("button", { name: "All" }));
    expect(selectionOf()!.selected.size).toBe(0);
  });

  it("Yours shows only when something here is hers, and picks hers", async () => {
    await mount({ canDeleteIds: ["m1"] });
    fireEvent.click(screen.getByRole("button", { name: "Select" }));
    fireEvent.click(screen.getByRole("button", { name: "Yours" }));
    expect([...selectionOf()!.selected]).toEqual(["m1"]);
  });

  it("Cancel and Escape leave it, every pick let go", async () => {
    await mount();
    fireEvent.click(screen.getByRole("button", { name: "Select" }));
    act(() => selectionOf()!.onToggle("m1"));
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(document.querySelector("[data-select-bar]")).toBeNull();
    expect(guestSelect.get()).toMatchObject({ active: false, picks: [] });
    fireEvent.click(screen.getByRole("button", { name: "Select" }));
    fireEvent.keyDown(window, { key: "Escape" });
    expect(guestSelect.get().active).toBe(false);
  });

  it("the demo offers none of it", async () => {
    await mount({ isDemo: true });
    expect(screen.queryByRole("button", { name: "Select" })).toBeNull();
  });
});
