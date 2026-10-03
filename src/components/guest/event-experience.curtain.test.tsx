import { Suspense, useEffect, useInsertionEffect, type ReactNode } from "react";
import { act, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { uploadsWait } from "@/lib/guest/upload-tracker";

import { TooltipProvider } from "@/components/ui/tooltip";
import type { GuestEvent } from "@/lib/db/queries/guest-events";

/**
 * THE REEL'S CURTAIN THROUGH A SOFT NAVIGATION (crumbs-52; red-team 43's second MEDIUM: the hub's Reel card, a
 * `next/link` to `/e/<token>?reel`, showed the album for 0.3 to 1 s before the reel). `header-wiring` made the
 * owner's `?reel` meet black from the first byte, and a typed or reloaded address kept it; a SOFT navigation drew
 * the curtain and took it away again in the very task it was drawn in, so the first painted frame was the album.
 *
 * ★ THE ORDER THIS PINS (measured under `next dev` with the page's seed already resolved, which is a fast host's
 * order and the red-team's: the album mounts in the SAME commit as the page; a production build showed the same
 * order and the same bare frame): the page RENDERS against the address of the page it is leaving, because Next writes the new address in
 * that commit (`HistoryUpdater`, an insertion effect in `app-router.js`), so every `window.location` read made while
 * rendering predates the navigation. The reel's controller read `?reel` as absent in that render and told the head so
 * from its first effect, by when the address was already right, and the page took that word for "the address stopped
 * asking" and let the curtain go for good. A hard load never meets it: its address is right from the first render,
 * which is why only the Link lost the black.
 *
 * Nothing here mocks the reel's controller or its address: the real `EventExperience`, the real `LiveReel` and the
 * real `useReelParam`, around a live source that is a stand-in and a view that is a dialog's stand-in. The navigation
 * is `NavigationCommit`, which writes the address from an insertion effect as Next's router does.
 */
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("sonner", () => ({ toast: vi.fn() }));
vi.mock("@/lib/observability/sentry", () => ({ captureError: vi.fn() }));
vi.mock("@/lib/supabase/client", () => ({ createClient: vi.fn() }));

const part = vi.hoisted(() => () => null);
// What the stand-in source says about the reel: the host's switch, which a test turns off for a reel that cannot play.
const source = vi.hoisted(() => ({ showReel: true }));

// The album's live source: suspends on the page's seed, then hands the reel what the real one hands it (two
// reel-eligible stills, so the reel exists), and no more.
vi.mock("@/components/guest/gallery-live", async () => {
  const { createContext, use: useThenable, useContext } = await import("react");
  const Live = createContext<unknown>(null);
  const still = (id: string) => ({
    id,
    type: "photo",
    url: `https://r2.test/o/${id}.jpg`,
    previewUrl: `https://r2.test/p/${id}.webp`,
    status: "approved",
    drawable: true,
  });
  const live = {
    qrToken: "0123456789abcdef0123456789abcdef",
    access: "full",
    isDemo: false,
    teaserTotal: null,
    serverItems: [],
    items: [],
    serverIds: new Set<string>(),
    count: 2,
    reelItems: [still("m1"), still("m2")],
    clips: { get: () => null },
    ensureLinks: () => {},
    ownIds: new Set<string>(),
    reportPossibleExpiry: () => {},
  };
  return {
    GalleryLiveProvider: ({
      galleryPromise,
      children,
    }: {
      galleryPromise: Promise<unknown>;
      children: ReactNode;
    }) => {
      useThenable(galleryPromise);
      const reel = {
        showReel: source.showReel,
        liveReelEnabled: true,
        styleId: null,
        clip: null,
      };
      return (
        <Live.Provider value={{ ...live, reel }}>{children}</Live.Provider>
      );
    },
    useGalleryLive: () => useContext(Live),
  };
});
// The view is a dialog that closes through the controller's own `onClose` (its own file pins the engine).
vi.mock("@/components/guest/reel/live-reel-view", () => ({
  LiveReelView: ({ onClose }: { onClose: () => void }) => (
    <div role="dialog" aria-label="Highlight reel">
      <button type="button" onClick={onClose}>
        Close the view
      </button>
    </div>
  ),
}));
vi.mock("@/components/guest/reel/creator-seam", () => ({
  REEL_CREATOR: null,
  preloadReelCreator: () => {},
}));
vi.mock("@/lib/reel/defaults-action", () => ({ setReelDefaults: vi.fn() }));
vi.mock("@/components/guest/live-gallery", () => ({ LiveGallery: part }));
vi.mock("@/components/guest/upload-tracker", () => ({
  createUploadTrackerStore: () => ({}),
  UploadTracker: part,
  UploadTrackerButton: part,
}));
vi.mock("@/components/guest/guest-upload", () => ({
  GuestUpload: part,
  TurnCard: part,
}));
vi.mock("@/components/guest/guest-action-dock", () => ({
  GuestActionDock: part,
}));
vi.mock("@/components/guest/guest-share", () => ({
  GuestShare: () => <button type="button">Invite</button>,
}));
vi.mock("@/components/guest/report-dialog", () => ({ ReportFoot: part }));
vi.mock("@/components/guest/claim-handle-prompt", () => ({
  ClaimHandlePrompt: part,
}));
vi.mock("@/components/guest/door/album-light", () => ({
  AlbumLightSampler: part,
}));
vi.mock("@/components/guest/gallery-skeleton", () => ({
  GallerySkeleton: () => <p>loading the album</p>,
}));
vi.mock("@/components/guest/gallery-empty-state", () => ({
  GhostRiver: part,
}));
// The owner meets no door: the door says so on its first report, as the real one does for her.
vi.mock("@/components/guest/entry-modal", () => ({
  EntryModal: ({
    onPendingChange,
  }: {
    onPendingChange?: (pending: boolean) => void;
  }) => {
    useEffect(() => onPendingChange?.(false), [onPendingChange]);
    return null;
  },
}));
vi.mock("@/components/app/user-menu", () => ({
  initial: (_: unknown, name: string) => name.slice(0, 1),
}));
vi.mock("@/lib/guest/use-confirm-return", () => ({
  useConfirmReturn: () => ({ moment: false, elsewhere: 0 }),
}));
vi.mock("@/lib/guest/use-upload-queue", () => ({
  useUploadQueue: () => ({
    items: [],
    progress: {},
    addFiles: vi.fn(),
    addClip: vi.fn(),
    retry: vi.fn(),
    dismiss: vi.fn(),
  }),
  useLiveQueue: (queue: unknown) => queue,
}));
vi.mock("@/lib/guest/use-stored-session", () => ({
  readStoredSession: () => null,
  useStoredSession: () => [null, vi.fn()],
}));
vi.mock("@/lib/guest/use-stored-name", () => ({
  setStoredEmailAttached: vi.fn(),
  useStoredName: () => [null],
}));
vi.mock("@/lib/guest/keep-ask", () => ({ useKeepAskPutDown: () => false }));
vi.mock("@/lib/guest/name-door", () => ({
  onNameDoorRequest: () => () => {},
}));
vi.mock("@/lib/guest/confirm-beat", () => ({
  confirmBeatToast: vi.fn(),
  mergeConfirmBeats: vi.fn(),
  onConfirmBeat: () => () => {},
}));
vi.mock("@/lib/guest/confirm-beat-name", () => ({
  openToldNameChange: vi.fn(),
  ToldNameForm: part,
}));
vi.mock("@/lib/guest/claim-uploads", () => ({
  claimLeftForAnotherAddress: vi.fn(),
}));
vi.mock("@/lib/guest/settle-name", () => ({ settleConfirmedName: vi.fn() }));
vi.mock("@/lib/guest/join", () => ({
  joinEvent: vi.fn(),
  passedTicket: vi.fn(),
}));

const { EventExperience } = await import("./event-experience");
const { LiveReel } = await import("@/components/guest/reel/live-reel");
const { createHeadBridge } =
  await import("@/components/guest/event-experience-head");
// The stand-in source above (the mock's own export), typed as the one prop it reads.
const { GalleryLiveProvider: Source } =
  (await import("@/components/guest/gallery-live")) as unknown as {
    GalleryLiveProvider: (props: {
      galleryPromise: Promise<never>;
      children: ReactNode;
    }) => ReactNode;
  };

const EVENT = {
  id: "11111111-2222-4333-8444-555555555555",
  qr_token: "0123456789abcdef0123456789abcdef",
  name: "Maya's 30th",
  description: null,
  event_date: null,
  visibility: "open",
  accepting_uploads: true,
  moderation_mode: "live",
  require_upload_to_view: false,
  host_display_name: "Maya",
  custom_slug: null,
  qr_style: "classic",
  accepts_video: true,
  show_reel: true,
  doorPass: null,
} as unknown as GuestEvent;

const HUB = "/dashboard/evt-1";
const REEL = `/e/${EVENT.qr_token}?reel`;

/**
 * NEXT'S NAVIGATION COMMIT, as far as the address goes (`HistoryUpdater`, `node_modules/next/dist/client/
 * components/app-router.js`): the router writes the new address from an INSERTION effect of the commit that
 * mounts the page, so every render of that page reads the old one, and every layout and passive effect of the
 * commit reads the new one. The state it hands is its own (`__NA`), which Next's patch applies as it stands.
 */
function NavigationCommit({
  to,
  children,
}: {
  to: string;
  children: ReactNode;
}) {
  useInsertionEffect(() => {
    window.history.pushState({ __NA: true }, "", to);
  }, [to]);
  return children;
}

/** What React Flight hands a client for a promise that resolved before the page did: a thenable that says so. */
function resolvedSeed(): Promise<never> {
  const seed = Promise.resolve({ kind: "locked" }) as Promise<never> & {
    status?: string;
    value?: unknown;
  };
  seed.status = "fulfilled";
  seed.value = { kind: "locked" };
  return seed;
}

/** A seed that has not arrived yet: the album mounts when `arrive` is called, after the page has committed. */
function lateSeed() {
  let arrive!: () => void;
  const seed = new Promise<never>((resolve) => {
    arrive = () => resolve({ kind: "locked" } as never);
  });
  return { seed, arrive };
}

function Page({
  seed,
  reelAsked,
  isOwner = true,
}: {
  seed: Promise<never>;
  reelAsked: boolean;
  /** The album's host (her hub's Reel card), or a returning guest on a shared reel link. */
  isOwner?: boolean;
}) {
  return (
    <TooltipProvider>
      <Suspense fallback={null}>
        <EventExperience
          event={EVENT}
          qrToken={EVENT.qr_token}
          joinUrl={`https://partyreel.test/e/${EVENT.qr_token}`}
          galleryPromise={seed}
          stats={{ approvedTotal: 2, guestCount: 1 }}
          isDemo={false}
          access="full"
          gate={null}
          needsName={false}
          hostAvatarUrl={null}
          isOwner={isOwner}
          canDeleteIds={[]}
          isAuthed
          reelAsked={reelAsked}
          uploadsWait={uploadsWait(EVENT)}
        />
      </Suspense>
    </TooltipProvider>
  );
}

const curtain = () => document.querySelector("[data-reel-curtain]");
const view = () => screen.queryByRole("dialog", { name: "Highlight reel" });

/**
 * The curtain's whole life as the document saw it, not a look at its end: a curtain drawn in one commit and taken
 * away in the next, in one task, is a frame the album painted bare (the red-team's own observer saw "no curtain" by
 * asking the document after the fact), so every removal is counted as it happens.
 */
function watchCurtain() {
  const holds = (node: Node) =>
    node instanceof Element &&
    (node.matches("[data-reel-curtain]") ||
      node.querySelector("[data-reel-curtain]") !== null);
  const seen = { drawn: 0, removed: 0 };
  const observer = new MutationObserver((records) => {
    for (const record of records) {
      record.addedNodes.forEach((node) => {
        if (holds(node)) seen.drawn += 1;
      });
      record.removedNodes.forEach((node) => {
        if (holds(node)) seen.removed += 1;
      });
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
  return {
    seen,
    /** Deliver what the document has queued, then say what it saw. */
    read() {
      for (const record of observer.takeRecords()) {
        record.addedNodes.forEach((node) => {
          if (holds(node)) seen.drawn += 1;
        });
        record.removedNodes.forEach((node) => {
          if (holds(node)) seen.removed += 1;
        });
      }
      return { ...seen };
    },
    stop: () => observer.disconnect(),
  };
}

/** Let the lazy view's chunk resolve inside act, so its boundary's retry is flushed. */
async function settle() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 60));
  });
}

class NoIntersections {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}

let watch: ReturnType<typeof watchCurtain>;

beforeEach(() => {
  source.showReel = true;
  vi.stubGlobal("IntersectionObserver", NoIntersections);
  // The hub the owner pressed the Reel card on: the entry the navigation pushes over, and Close goes back to.
  window.history.replaceState(null, "", HUB);
  watch = watchCurtain();
});

afterEach(() => {
  watch.stop();
  vi.unstubAllGlobals();
  window.history.replaceState(null, "", "/");
});

describe("an owner arriving on ?reel from her hub (a soft navigation)", () => {
  it("★ meets the reel's black in the very commit the page is drawn in, and keeps it until the view stands", async () => {
    // The page renders against the hub's address, and the router writes `?reel` in the commit.
    expect(window.location.search).toBe("");
    await act(async () => {
      render(
        <NavigationCommit to={REEL}>
          <Page seed={resolvedSeed()} reelAsked />
        </NavigationCommit>,
      );
    });
    expect(window.location.search).toBe("?reel");
    expect(curtain()).not.toBeNull();
    // Every frame between that commit and the view's opening was black: the curtain was never taken away.
    await settle();
    expect(view()).not.toBeNull();
    expect(curtain()).not.toBeNull();
    expect(watch.read()).toEqual({ drawn: 1, removed: 0 });
  });

  it("holds it the same when the album arrives after the page (the seed still streaming)", async () => {
    const late = lateSeed();
    await act(async () => {
      render(
        <NavigationCommit to={REEL}>
          <Page seed={late.seed} reelAsked />
        </NavigationCommit>,
      );
    });
    expect(curtain()).not.toBeNull();
    expect(view()).toBeNull();
    await act(async () => {
      late.arrive();
      await late.seed;
    });
    await settle();
    expect(view()).not.toBeNull();
    expect(curtain()).not.toBeNull();
    expect(watch.read().removed).toBe(0);
  });

  it("★ goes only when the address stops asking, with her Close, and never comes back", async () => {
    await act(async () => {
      render(
        <NavigationCommit to={REEL}>
          <Page seed={resolvedSeed()} reelAsked />
        </NavigationCommit>,
      );
    });
    await settle();
    expect(curtain()).not.toBeNull();
    // Her Close goes back to the hub she came from (`returnBack`): the address stops asking, and the album shows.
    await act(async () => {
      within(view() as HTMLElement)
        .getByRole("button", { name: "Close the view" })
        .click();
      await new Promise((resolve) => setTimeout(resolve, 80));
    });
    expect(window.location.pathname).toBe(HUB);
    expect(view()).toBeNull();
    expect(curtain()).toBeNull();
    expect(watch.read().removed).toBe(1);
  });
});

describe("an owner arriving on ?reel for a reel that cannot play", () => {
  it("meets the black, then the album once the controller has dropped the address (the black never strands her)", async () => {
    // The host's switch is off: the controller drops `?reel` quietly (nothing to play), in place, and the address
    // stops asking: the curtain goes with it, and the album is what she has.
    source.showReel = false;
    await act(async () => {
      render(
        <NavigationCommit to={REEL}>
          <Page seed={resolvedSeed()} reelAsked />
        </NavigationCommit>,
      );
    });
    await settle();
    expect(window.location.search).toBe("");
    expect(view()).toBeNull();
    expect(curtain()).toBeNull();
    // It was drawn (a removal is of a curtain that stood), and taken away once.
    expect(watch.read().removed).toBe(1);
  });
});

describe("the same page on a hard load (the control)", () => {
  it("stands from the first render, the address being right from it, and holds through the view", async () => {
    window.history.replaceState(null, "", REEL);
    await act(async () => {
      render(<Page seed={resolvedSeed()} reelAsked />);
    });
    expect(curtain()).not.toBeNull();
    await settle();
    expect(view()).not.toBeNull();
    expect(curtain()).not.toBeNull();
    expect(watch.read().removed).toBe(0);
  });
});

/* ★ A RETURNING GUEST ON A SHARED REEL LINK (red-team 44's LOW): the page says the reel was asked for a viewer who owes
   no door (`reelAsked`, the page's own pins), and the black is hers as it is the owner's, from the first commit of a
   soft navigation to the view. Her Close is a guest's: the address drops `?reel` in place (she came by a link, not
   from a page of hers to go back to), and the album she is let into is what she has. */
describe("a returning guest arriving on ?reel from a shared link (a soft navigation)", () => {
  it("★ meets the reel's black from the first commit, until the view stands, and her album once she closes it", async () => {
    const REEL_FROM = "/help";
    window.history.replaceState(null, "", REEL_FROM);
    await act(async () => {
      render(
        <NavigationCommit to={REEL}>
          <Page seed={resolvedSeed()} reelAsked isOwner={false} />
        </NavigationCommit>,
      );
    });
    expect(curtain()).not.toBeNull();
    await settle();
    expect(view()).not.toBeNull();
    expect(curtain()).not.toBeNull();
    expect(watch.read()).toEqual({ drawn: 1, removed: 0 });
    await act(async () => {
      within(view() as HTMLElement)
        .getByRole("button", { name: "Close the view" })
        .click();
      await new Promise((resolve) => setTimeout(resolve, 80));
    });
    // Closed in place: still the album's own address, with no `?reel`.
    expect(window.location.pathname).toBe(`/e/${EVENT.qr_token}`);
    expect(window.location.search).toBe("");
    expect(view()).toBeNull();
    expect(curtain()).toBeNull();
    expect(watch.read().removed).toBe(1);
  });
});

describe("a page that was not asked for the reel", () => {
  it("never draws it, whatever the address says", async () => {
    await act(async () => {
      render(
        <NavigationCommit to={REEL}>
          <Page seed={resolvedSeed()} reelAsked={false} />
        </NavigationCommit>,
      );
    });
    await settle();
    expect(curtain()).toBeNull();
    expect(watch.read().drawn).toBe(0);
  });
});

describe("what the album tells the head about the address (the curtain's cause)", () => {
  /**
   * The album's controller alone, arriving in a soft navigation, and every word it tells the head. A word that is
   * false for a moment is the curtain gone for good: the page takes it for the address stopping asking.
   */
  async function mountAlbum(to: string) {
    const bridge = createHeadBridge();
    const words: boolean[] = [];
    bridge.subscribe(() => {
      const state = bridge.get();
      if (state) words.push(state.reel.viewAsked);
    });
    await act(async () => {
      render(
        <NavigationCommit to={to}>
          <Suspense fallback={null}>
            <Source galleryPromise={resolvedSeed()}>
              <LiveReel
                eventId={EVENT.id}
                eventName={EVENT.name}
                joinUrl={`https://partyreel.test/e/${EVENT.qr_token}`}
                displayAddress={`partyreel.test/e/${EVENT.qr_token}`}
                qrStyle="classic"
                isDemo={false}
                moderated={false}
                queue={[]}
                isOwner
                headBridge={bridge}
              >
                {null}
              </LiveReel>
            </Source>
          </Suspense>
        </NavigationCommit>,
      );
    });
    return words;
  }

  it("★ says the address asks from its first word, though its first render read the address it left", async () => {
    const words = await mountAlbum(REEL);
    expect(window.location.search).toBe("?reel");
    expect(words.length).toBeGreaterThan(0);
    // Never a word of "absent" between the commit and the render that catches up with the address.
    expect(words.every((asked) => asked)).toBe(true);
    await settle();
    expect(view()).not.toBeNull();
    expect(words.every((asked) => asked)).toBe(true);
  });

  it("says it does not, from its first word, when the address does not ask", async () => {
    const words = await mountAlbum(`/e/${EVENT.qr_token}`);
    expect(words.length).toBeGreaterThan(0);
    expect(words.every((asked) => !asked)).toBe(true);
    expect(view()).toBeNull();
  });

  it("says it stopped, and only then, when her Close lands", async () => {
    const words = await mountAlbum(REEL);
    await settle();
    await act(async () => {
      within(view() as HTMLElement)
        .getByRole("button", { name: "Close the view" })
        .click();
      await new Promise((resolve) => setTimeout(resolve, 80));
    });
    expect(window.location.pathname).toBe(HUB);
    expect(words.at(-1)).toBe(false);
    expect(words.slice(0, -1).every((asked) => asked)).toBe(true);
  });
});
