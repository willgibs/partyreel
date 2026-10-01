import { Suspense, use, type ReactNode } from "react";
import { act, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { GuestEvent } from "@/lib/db/queries/guest-events";

/**
 * A CRASH WHERE THE GUEST ALBUM RENDERS KEEPS THE PAGE (crumbs-28, from `owner-album`). A throw there took the guest
 * route's error screen, with nothing nearer: the event's name, its counts, Add photos and Invite all gone for a
 * failure that was the album's alone. Pinned on the page itself: with the album crashing, everything above it stands
 * and the album says it could not load, with its Try again.
 *
 * What is real here is the shell and the boundary; every child the album brings is a stand-in, and the live source is
 * one that throws where the album renders. ★ RESHAPED ON PURPOSE (crumbs-30; scar kept: the album's failure is the
 * album's alone): the throw was a seed whose read failed, `use()`d as `GalleryLiveProvider` did, and since crumbs-30
 * that seed is read and never thrown (the source stands, so her uploads list does: `gallery-live.test.tsx`, and the
 * album's own words for it: `live-gallery.test.tsx`), so the stand-in's rejected seed now stands for any crash.
 */
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/lib/observability/sentry", () => ({ captureError: vi.fn() }));
vi.mock("@/lib/supabase/client", () => ({ createClient: vi.fn() }));

const part = vi.hoisted(() => () => null);
const wrap = vi.hoisted(
  () =>
    ({ children }: { children?: ReactNode }) =>
      children ?? null,
);
vi.mock("@/components/guest/gallery-live", () => ({
  // A live source that crashes where the album renders: it suspends on its promise, and a rejected one throws.
  GalleryLiveProvider: ({
    galleryPromise,
    children,
  }: {
    galleryPromise: Promise<unknown>;
    children: ReactNode;
  }) => {
    use(galleryPromise);
    return <div data-testid="album">{children}</div>;
  },
}));
vi.mock("@/components/guest/live-gallery", () => ({ LiveGallery: part }));
vi.mock("@/components/guest/reel/live-reel", () => ({
  LiveReel: wrap,
  LiveReelTile: part,
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
  doorPass: null,
} as unknown as GuestEvent;

async function page(galleryPromise: Promise<never>) {
  await act(async () => {
    render(
      // The page's own boundary, as the (guest) route's error.tsx stands above it.
      <Suspense fallback={null}>
        <EventExperience
          event={EVENT}
          qrToken={EVENT.qr_token}
          joinUrl={`https://partyreel.test/e/${EVENT.qr_token}`}
          galleryPromise={galleryPromise}
          stats={{ approvedTotal: 3, guestCount: 2 }}
          isDemo={false}
          access="full"
          gate={null}
          needsName={false}
          hostAvatarUrl={null}
          isOwner={false}
          canDeleteIds={[]}
          isAuthed={false}
        />
      </Suspense>,
    );
  });
}

// jsdom has none; the row's sentinel (which of the row and the dock stands) only needs one to exist.
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
  vi.stubGlobal("IntersectionObserver", NoIntersections);
  // React logs the error the boundary caught; that is not what is pinned.
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("a guest album that crashes where it renders", () => {
  it("★ keeps the page: the name, the counts, Add photos and Invite stand, and the album alone says it could not load", async () => {
    const seed = Promise.reject(new Error("read failed")) as Promise<never>;
    seed.catch(() => {});
    await page(seed);

    expect(
      screen.getByRole("heading", { level: 1, name: "Maya's 30th" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/3 photos & videos/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Add photos/ })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Invite" })).toBeEnabled();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "The album didn’t load",
    );
    expect(screen.getByRole("button", { name: "Try again" })).toBeEnabled();
    expect(screen.queryByTestId("album")).toBeNull();
  });

  it("a seed that lands draws the album, with no word of failure", async () => {
    await page(Promise.resolve({ kind: "locked" }) as Promise<never>);
    expect(await screen.findByTestId("album")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).toBeNull();
  });
});
