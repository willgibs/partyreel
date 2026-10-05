import { Suspense, use, type ReactNode } from "react";
import { act, cleanup, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { uploadsWait } from "@/lib/guest/upload-tracker";

import type { HeadBridge } from "@/components/guest/event-experience-head";
import { useCoverUnderHeader } from "@/components/guest/guest-header-cover";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { GuestEvent } from "@/lib/db/queries/guest-events";

/**
 * THE ALBUM'S HEAD ON THE PAGE (`event-header` r1): what the page itself decides about its cover, around a live
 * album that is a stand-in. The reel's round stands from the first paint on the page's guess and then on the
 * album's word; an owner arriving on `?reel` meets the reel's black from the first byte, gone the moment the
 * address stops asking and never back; and the header is told a cover is under it, and when a door's stage takes
 * the page, that it is not.
 */
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/lib/observability/sentry", () => ({ captureError: vi.fn() }));
vi.mock("@/lib/supabase/client", () => ({ createClient: vi.fn() }));

const part = vi.hoisted(() => () => null);
// What the live source is handed to tell the page: its count and the count's words.
const live = vi.hoisted(() => ({
  told: null as null | {
    count?: (n: number) => void;
    words?: (words: string) => void;
  },
}));
vi.mock("@/components/guest/gallery-live", () => ({
  // A live source that suspends on its promise, then draws what it holds.
  GalleryLiveProvider: ({
    galleryPromise,
    onCountChange,
    onCountWordsChange,
    children,
  }: {
    galleryPromise: Promise<unknown>;
    onCountChange?: (n: number) => void;
    onCountWordsChange?: (words: string) => void;
    children: ReactNode;
  }) => {
    use(galleryPromise);
    live.told = { count: onCountChange, words: onCountWordsChange };
    return <div data-testid="album">{children}</div>;
  },
}));
// The album's view says only which Add it was handed: the empty state's own (`onAddFirst`) or none.
vi.mock("@/components/guest/live-gallery", () => ({
  LiveGallery: ({ onAddFirst }: { onAddFirst?: () => void }) => (
    <p data-testid="add-first">{onAddFirst ? "yes" : "no"}</p>
  ),
}));
// The reel's controller, reduced to what it tells the head: the test holds the bridge it was handed.
const reel = vi.hoisted(() => ({ bridge: null as unknown }));
vi.mock("@/components/guest/reel/live-reel", () => ({
  LiveReel: ({
    headBridge,
    children,
  }: {
    headBridge?: unknown;
    children?: ReactNode;
  }) => {
    reel.bridge = headBridge;
    return children ?? null;
  },
}));
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
vi.mock("@/components/guest/entry-modal", () => ({ EntryModal: part }));
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

/** What the header island reads: the album's word, the page's (false) until it has one. */
function HeaderProbe() {
  return (
    <p data-testid="header-on-cover">{String(useCoverUnderHeader(false))}</p>
  );
}

async function page(
  over: {
    reelAsked?: boolean;
    approvedTotal?: number;
    /** What the server counted the album holds by kind (`getGalleryStats`'s `kinds`); absent for a stand-in page. */
    kinds?: { photos: number; videos: number } | null;
    access?: "full" | "teaser";
    event?: GuestEvent;
  } = {},
) {
  const event = over.event ?? EVENT;
  await act(async () => {
    render(
      <TooltipProvider>
        <HeaderProbe />
        <Suspense fallback={null}>
          <EventExperience
            event={event}
            qrToken={event.qr_token}
            joinUrl={`https://partyreel.test/e/${event.qr_token}`}
            galleryPromise={
              Promise.resolve({ kind: "locked" }) as Promise<never>
            }
            stats={{
              approvedTotal: over.approvedTotal ?? 3,
              guestCount: 2,
              ...(over.kinds !== undefined && { kinds: over.kinds }),
            }}
            isDemo={false}
            access={over.access ?? "full"}
            gate={null}
            needsName={false}
            hostAvatarUrl={null}
            isOwner={Boolean(over.reelAsked)}
            canDeleteIds={[]}
            isAuthed={false}
            reelAsked={over.reelAsked}
            uploadsWait={uploadsWait(event)}
          />
        </Suspense>
      </TooltipProvider>,
    );
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

const bridge = () => reel.bridge as HeadBridge;
const publish = (reelWord: { available: boolean; viewAsked: boolean }) =>
  act(() => {
    bridge().set({
      stills: [],
      reportExpiry: () => {},
      reel: { ...reelWord, open: () => {}, preload: () => {} },
    });
  });

class NoIntersections {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}

beforeEach(() => {
  vi.clearAllMocks();
  reel.bridge = null;
  live.told = null;
  vi.stubGlobal("IntersectionObserver", NoIntersections);
});

describe("the reel's round on the cover", () => {
  const round = () =>
    screen.queryByRole("button", { name: "Watch the highlight reel" });

  it("stands from the first paint on the page's guess (the host's switch and two photographs)", async () => {
    await page({ approvedTotal: 3 });
    expect(round()).not.toBeNull();
  });

  it("is not guessed below two photographs", async () => {
    await page({ approvedTotal: 1 });
    expect(round()).toBeNull();
  });

  it("is not guessed with the host's switch off", async () => {
    await page({ event: { ...EVENT, show_reel: false } as GuestEvent });
    expect(round()).toBeNull();
  });

  it("★ follows the album's word once it has one", async () => {
    await page({ approvedTotal: 3 });
    await publish({ available: false, viewAsked: false });
    expect(round()).toBeNull();
    await publish({ available: true, viewAsked: false });
    expect(round()).not.toBeNull();
  });
});

/**
 * ★ THE COVER'S COUNT NAMES WHAT THE ALBUM HOLDS FROM THE FIRST BYTE (crumbs-74): the glyph's words ("12 photos") are
 * the server's own count of the kinds (`stats.kinds`) until the live album has told them, and then the live album's, by
 * the one function both say them with, so there is no beat of "12 photos & videos" over twelve photographs.
 */
describe("the cover's count words", () => {
  const words = (label: string) => screen.queryByLabelText(label);

  it("★ names photographs from the first paint, before the live album has told a word", async () => {
    await page({ approvedTotal: 12, kinds: { photos: 12, videos: 0 } });
    expect(live.told).not.toBeNull();
    expect(words("12 photos")).not.toBeNull();
    expect(words("12 photos & videos")).toBeNull();
  });

  it("names clips alone, and a lone item by what it is", async () => {
    await page({ approvedTotal: 3, kinds: { photos: 0, videos: 3 } });
    expect(words("3 videos")).not.toBeNull();
    cleanup();
    await page({ approvedTotal: 1, kinds: { photos: 1, videos: 0 } });
    expect(words("1 photo")).not.toBeNull();
    expect(words("1 photo or video")).toBeNull();
  });

  it("a mix says what the live album says of one: photos & videos, counted together", async () => {
    await page({ approvedTotal: 15, kinds: { photos: 12, videos: 3 } });
    expect(words("15 photos & videos")).not.toBeNull();
  });

  it("says both nouns where the page names no kinds (a stand-in page) or the server could not", async () => {
    await page({ approvedTotal: 12 });
    expect(words("12 photos & videos")).not.toBeNull();
    cleanup();
    await page({ approvedTotal: 12, kinds: null });
    expect(words("12 photos & videos")).not.toBeNull();
  });

  it("★ says both nouns at a teaser, as its live album does (a teaser's nine cannot see in): no flash either way", async () => {
    await page({
      access: "teaser",
      approvedTotal: 12,
      kinds: { photos: 12, videos: 0 },
    });
    expect(words("12 photos & videos")).not.toBeNull();
    expect(words("12 photos")).toBeNull();
  });

  it("★ hands over to the live album's own words once it has told them, and follows them", async () => {
    await page({ approvedTotal: 12, kinds: { photos: 12, videos: 0 } });
    expect(words("12 photos")).not.toBeNull();
    // A clip lands: the live album counts 13 and says the mix.
    await act(async () => {
      live.told!.count!(13);
      live.told!.words!("13 photos & videos");
    });
    expect(words("13 photos & videos")).not.toBeNull();
    expect(words("12 photos")).toBeNull();
  });

  it("the server's kinds never name a number they do not add up to", async () => {
    // A count the live album moved (13) beside kinds counted at render (12): both nouns, never a stale kind.
    await page({ approvedTotal: 12, kinds: { photos: 12, videos: 0 } });
    await act(async () => {
      live.told!.count!(13);
    });
    expect(words("13 photos & videos")).not.toBeNull();
  });
});

describe("an owner arriving for her reel", () => {
  const curtain = () => document.querySelector("[data-reel-curtain]");

  it("★ meets the reel's black from the first byte, until the address stops asking, and never again", async () => {
    await page({ reelAsked: true });
    expect(curtain()).not.toBeNull();
    // The album says the view is on its way or open: the black stays under it.
    await publish({ available: true, viewAsked: true });
    expect(curtain()).not.toBeNull();
    // The view closed (or the reel could not play and the album dropped `?reel`): the album shows.
    await publish({ available: true, viewAsked: false });
    expect(curtain()).toBeNull();
    // A reel she opens later from the cover opens over her album.
    await publish({ available: true, viewAsked: true });
    expect(curtain()).toBeNull();
  });

  it("is never drawn for a page that did not ask", async () => {
    await page();
    expect(curtain()).toBeNull();
  });
});

describe("the header and the cover", () => {
  it("★ tells the header its cover is under it", async () => {
    await page();
    expect(screen.getByTestId("header-on-cover")).toHaveTextContent("true");
  });
});
