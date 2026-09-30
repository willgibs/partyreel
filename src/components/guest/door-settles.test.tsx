import {
  Suspense,
  useEffect,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { act, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { GuestEvent } from "@/lib/db/queries/guest-events";
import type { JoinResult } from "@/lib/guest/join";

/**
 * THE DOOR SETTLES ON WHO IS HERE BEFORE IT ASKS (crumbs-29, build 30's red-team), pinned on the page itself.
 *
 *   - A phone held another guest's ticket, its viewer signed in elsewhere and blocked here. The queue put the ticket
 *     down, the ticket's name went with it, and the door drew its name step from the phone alone for the 2 to 4 s the
 *     page's refresh took to draw "This album is private". Now the page holds its door from the moment the queue
 *     tells it (before anything goes down), refreshes once the ticket is down, and lets go when the server's render
 *     lands.
 *   - A page rendered across a sign-out still in flight took its viewer for a confirmed account; its own silent join
 *     is refused for want of one, and it now re-reads who is here rather than waiting for her Send to dead-end.
 *
 * What is real is the shell; the door is a stand-in that shows the name it is handed and reports itself clear, the
 * queue a stand-in that hands the page's `onDoorNeeded` to the test, the stored name a store the test drives.
 */
const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
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
  GalleryLiveProvider: ({ children }: { children: ReactNode }) => (
    <div>{children}</div>
  ),
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
vi.mock("@/components/guest/guest-share", () => ({ GuestShare: part }));
vi.mock("@/components/guest/report-dialog", () => ({ ReportFoot: part }));
vi.mock("@/components/guest/claim-handle-prompt", () => ({
  ClaimHandlePrompt: part,
}));
vi.mock("@/components/guest/door/album-light", () => ({
  AlbumLightSampler: part,
}));
vi.mock("@/components/guest/gallery-skeleton", () => ({
  GallerySkeleton: part,
}));
vi.mock("@/components/guest/gallery-empty-state", () => ({
  GhostRiver: part,
}));
// The door: the name it is handed, and clear of steps once it has mounted (so the page's own join may run).
vi.mock("@/components/guest/entry-modal", () => ({
  EntryModal: ({
    storedName,
    onPendingChange,
  }: {
    storedName?: string | null;
    onPendingChange?: (pending: boolean) => void;
  }) => {
    useEffect(() => onPendingChange?.(false), [onPendingChange]);
    return <p data-testid="door-name">{storedName ?? "(no name)"}</p>;
  },
}));
vi.mock("@/components/app/user-menu", () => ({
  initial: (_: unknown, name: string) => name.slice(0, 1),
}));
vi.mock("@/lib/guest/use-confirm-return", () => ({
  useConfirmReturn: () => ({ moment: false, elsewhere: 0 }),
}));

/** The queue stand-in keeps the options the page hands it, so the test can call `onDoorNeeded`. */
const queueOptions = vi.hoisted(() => ({
  current: null as null | {
    onDoorNeeded?: (ticketDown?: Promise<void>) => void;
  },
}));
vi.mock("@/lib/guest/use-upload-queue", () => ({
  useUploadQueue: (options: {
    onDoorNeeded?: (ticketDown?: Promise<void>) => void;
  }) => {
    queueOptions.current = options;
    return {
      items: [],
      progress: {},
      addFiles: vi.fn(),
      addClip: vi.fn(),
      retry: vi.fn(),
      dismiss: vi.fn(),
    };
  },
  useLiveQueue: (queue: unknown) => queue,
}));
vi.mock("@/lib/guest/use-stored-session", () => ({
  readStoredSession: () => null,
  useStoredSession: () => [null, vi.fn()],
}));

/** The phone's stored name, a store the test drives (the queue's drop is a store change, as it is in life). */
const phoneName = vi.hoisted(() => {
  let value: string | null = null;
  const listeners = new Set<() => void>();
  return {
    get: () => value,
    set(next: string | null) {
      value = next;
      for (const listener of listeners) listener();
    },
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
});
vi.mock("@/lib/guest/use-stored-name", () => ({
  setStoredEmailAttached: vi.fn(),
  useStoredName: () => [
    useSyncExternalStore(phoneName.subscribe, phoneName.get, phoneName.get),
  ],
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
const joinEvent = vi.hoisted(() => vi.fn<() => Promise<JoinResult>>());
vi.mock("@/lib/guest/join", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/guest/join")>()),
  joinEvent,
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

/** One server render of the page: its props are new objects every time, the seed included. */
function Page({ seed, verified }: { seed: Promise<never>; verified: boolean }) {
  return (
    <Suspense fallback={null}>
      <EventExperience
        event={EVENT}
        qrToken={EVENT.qr_token}
        joinUrl={`https://partyreel.test/e/${EVENT.qr_token}`}
        galleryPromise={seed}
        stats={{ approvedTotal: 3, guestCount: 2 }}
        isDemo={false}
        access="full"
        gate={null}
        needsName={false}
        hostAvatarUrl={null}
        isOwner={false}
        canDeleteIds={[]}
        isAuthed={verified}
        isVerified={verified}
      />
    </Suspense>
  );
}

function seed() {
  return new Promise<never>(() => {});
}

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
  queueOptions.current = null;
  phoneName.set(null);
  vi.stubGlobal("IntersectionObserver", NoIntersections);
});

describe("the door settles on who is here before it asks", () => {
  it("★ a ticket going down: the door keeps its name until the server answers, and the refresh waits for the ticket", async () => {
    phoneName.set("Sam");
    const first = seed();
    const view = render(<Page seed={first} verified={false} />);
    expect(await screen.findByTestId("door-name")).toHaveTextContent("Sam");

    let ticketDown = () => {};
    act(() => {
      // The queue tells the page, then puts the ticket down: its name goes with it.
      queueOptions.current!.onDoorNeeded!(
        new Promise<void>((resolve) => {
          ticketDown = resolve;
        }),
      );
      phoneName.set(null);
    });
    // The door still reads the name it had: no name step drawn from the phone alone.
    expect(screen.getByTestId("door-name")).toHaveTextContent("Sam");
    // Nothing re-read while the ticket's cookie is still leaving.
    expect(refresh).not.toHaveBeenCalled();

    await act(async () => ticketDown());
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("door-name")).toHaveTextContent("Sam");

    // The server's render lands (new props, a new seed): the door reads the phone as it now stands.
    view.rerender(<Page seed={seed()} verified={false} />);
    expect(screen.getByTestId("door-name")).toHaveTextContent("(no name)");
  });

  it("with nothing held, the door reads the phone's name as it changes", async () => {
    phoneName.set("Sam");
    render(<Page seed={seed()} verified={false} />);
    expect(await screen.findByTestId("door-name")).toHaveTextContent("Sam");
    act(() => phoneName.set(null));
    expect(screen.getByTestId("door-name")).toHaveTextContent("(no name)");
  });

  it("★ the page's own join refused for want of a confirmed account re-reads who is here (a sign-out in flight)", async () => {
    joinEvent.mockResolvedValue({
      ok: false,
      refusal: { kind: "name_required", message: "Enter a name." },
    });
    render(<Page seed={seed()} verified />);
    await waitFor(() => expect(joinEvent).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(refresh).toHaveBeenCalledTimes(1));
  });

  it("the page's own join refused for any other reason re-reads nothing", async () => {
    joinEvent.mockResolvedValue({
      ok: false,
      refusal: { kind: "other", message: "Too many joins." },
    });
    render(<Page seed={seed()} verified />);
    await waitFor(() => expect(joinEvent).toHaveBeenCalledTimes(1));
    await act(async () => {});
    expect(refresh).not.toHaveBeenCalled();
  });
});
