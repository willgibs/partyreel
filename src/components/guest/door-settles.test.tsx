import {
  Suspense,
  useEffect,
  useLayoutEffect,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { GuestEvent } from "@/lib/db/queries/guest-events";
import type { JoinResult } from "@/lib/guest/join";
import { NOTHING_WAITS, type UploadsWait } from "@/lib/guest/upload-tracker";

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
const trackerNow = vi.hoisted(() => ({
  handed: null as Record<string, unknown> | null,
}));
vi.mock("@/components/guest/upload-tracker", () => ({
  createUploadTrackerStore: () => ({}),
  UploadTracker: (props: Record<string, unknown>) => {
    trackerNow.handed = props;
    return null;
  },
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
// It reports its stage as the test sets it (`stageNow`), before paint, as the real one does.
const stageNow = vi.hoisted(() => ({
  open: false,
  handed: {} as {
    arrival?: unknown;
    welcomeSeen?: boolean;
    view?: unknown;
    keepHeld?: boolean;
    keepDevelopsAt?: string | null;
  },
}));
vi.mock("@/components/guest/entry-modal", () => ({
  EntryModal: ({
    storedName,
    onPendingChange,
    onStageChange,
    ...rest
  }: {
    storedName?: string | null;
    onPendingChange?: (pending: boolean) => void;
    onStageChange?: (open: boolean) => void;
    arrival?: unknown;
    welcomeSeen?: boolean;
    view?: unknown;
    keepHeld?: boolean;
    keepDevelopsAt?: string | null;
  }) => {
    stageNow.handed = rest;
    useEffect(() => onPendingChange?.(false), [onPendingChange]);
    useLayoutEffect(() => onStageChange?.(stageNow.open), [onStageChange]);
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
    ownerEventId?: string | null;
  },
  addFiles: vi.fn(),
}));
// Her choice at the held door, kept on the device (`door/wait-picks-store.ts`).
const heldPicks = vi.hoisted(() => ({
  files: null as File[] | null,
  forget: vi.fn(async () => {}),
}));
vi.mock("@/components/guest/door/wait-picks-store", () => ({
  doorOwner: async () => "u-lena",
  readHeldPicks: async () => heldPicks.files,
  forgetHeldPicks: heldPicks.forget,
}));
vi.mock("@/lib/guest/use-upload-queue", () => ({
  useUploadQueue: (options: {
    onDoorNeeded?: (ticketDown?: Promise<void>) => void;
    ownerEventId?: string | null;
  }) => {
    queueOptions.current = options;
    return {
      items: [],
      progress: {},
      addFiles: queueOptions.addFiles,
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
function Page({
  seed,
  verified,
  owner = false,
  access = "full",
  gate = null,
  event = EVENT,
  arrival,
  welcomeSeen,
  uploadsWait = NOTHING_WAITS,
}: {
  seed: Promise<never>;
  verified: boolean;
  owner?: boolean;
  access?: "none" | "teaser" | "full";
  gate?: "password" | "account" | "waiting" | "ask" | null;
  event?: GuestEvent;
  arrival?: { face: "welcome" | "rest" | null; scrim: boolean };
  welcomeSeen?: boolean;
  uploadsWait?: UploadsWait;
}) {
  return (
    <Suspense fallback={null}>
      <EventExperience
        event={event}
        qrToken={event.qr_token}
        joinUrl={`https://partyreel.test/e/${event.qr_token}`}
        galleryPromise={seed}
        stats={{ approvedTotal: 3, guestCount: 2 }}
        isDemo={false}
        access={access}
        gate={gate}
        needsName={false}
        hostAvatarUrl={null}
        isOwner={owner}
        canDeleteIds={[]}
        isAuthed={verified}
        isVerified={verified}
        arrival={arrival}
        welcomeSeen={welcomeSeen}
        uploadsWait={uploadsWait}
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
  trackerNow.handed = null;
  heldPicks.files = null;
  queueOptions.current = null;
  stageNow.open = false;
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

/**
 * ★ THE OWNER'S ADD IS THE HOST'S (crumbs-29's Deferred): the page hands its one queue the event's id when the album is
 * the viewer's own, so her files ride the host's pair and never a guest ticket at her own door (the queue's pins say
 * what it does with it). Everyone else's files ride their ticket, as ever.
 */
describe("the page's one queue, for the album's owner", () => {
  it("★ is told the album is hers, by its event's id", async () => {
    render(<Page seed={seed()} verified owner />);
    await waitFor(() =>
      expect(queueOptions.current?.ownerEventId).toBe(EVENT.id),
    );
  });

  it("is told nothing of the kind for a guest", async () => {
    render(<Page seed={seed()} verified />);
    await waitFor(() => expect(queueOptions.current).not.toBeNull());
    expect(queueOptions.current?.ownerEventId).toBeNull();
  });
});

/**
 * ★ THE DOOR AS THE PAGE, AT THE PAGE (`locked-door` r2, `shape=shared`; door-reveal's first byte): the page hands
 * the door what its first byte draws (`arrival`, the server's), and stands the album under it from that byte:
 * `inert`, and its words held so the walk through lands on the cover's photographs alone. At a gate nothing of the
 * album's own page is drawn at all (the door's stage is the page). An album under no stage is the page.
 */
describe("the door as the page, at the page", () => {
  /** A gate's event as the page hands it: the locked redaction (no host, no date). */
  const GATED = {
    ...EVENT,
    visibility: "private",
    host_display_name: null,
    event_date: null,
  } as unknown as GuestEvent;

  it("★ the first byte's door is the door's to draw: the page hands it the arrival and the welcome's word", async () => {
    stageNow.open = true;
    const arrival = { face: "welcome" as const, scrim: false };
    const view = render(
      <Page
        seed={seed()}
        verified={false}
        arrival={arrival}
        welcomeSeen={false}
      />,
    );
    await screen.findByTestId("door-name");
    expect(stageNow.handed.arrival).toEqual(arrival);
    expect(stageNow.handed.welcomeSeen).toBe(false);
    // The album's own cover rides into the open door (the walk lands on it).
    expect(stageNow.handed.view).toBeTruthy();
    // Under the welcome the album is laid out, inert, and its words wait for her.
    const box = view.container.querySelector("[data-guest-experience]");
    expect(box?.hasAttribute("data-reveal-curtain")).toBe(true);
    expect(
      view.container.querySelector("[data-door-behind]")?.hasAttribute("inert"),
    ).toBe(true);
  });

  it("★ at a gate nothing of the album's own page is drawn, and the door is handed no album to show", async () => {
    stageNow.open = true;
    const view = render(
      <Page
        seed={seed()}
        verified={false}
        access="none"
        gate="password"
        event={GATED}
        arrival={{ face: "rest", scrim: false }}
      />,
    );
    await screen.findByTestId("door-name");
    expect(view.container.querySelector("[data-door-behind]")).toBeNull();
    expect(view.container.textContent).not.toContain("Hosted by");
    expect(stageNow.handed.view).toBeUndefined();
  });

  it("★ an album under an open stage is inert with its words held; under none, it is the page", async () => {
    stageNow.open = true;
    const staged = render(<Page seed={seed()} verified={false} />);
    await screen.findByTestId("door-name");
    expect(
      staged.container
        .querySelector("[data-door-behind]")
        ?.hasAttribute("inert"),
    ).toBe(true);
    expect(
      staged.container
        .querySelector("[data-guest-experience]")
        ?.hasAttribute("data-reveal-curtain"),
    ).toBe(true);
    staged.unmount();
    stageNow.open = false;
    const open = render(<Page seed={seed()} verified={false} />);
    await screen.findByTestId("door-name");
    expect(
      open.container.querySelector("[data-door-behind]")?.hasAttribute("inert"),
    ).toBe(false);
    expect(
      open.container
        .querySelector("[data-guest-experience]")
        ?.hasAttribute("data-reveal-curtain"),
    ).toBe(false);
  });
});

/**
 * ★ HER CHOICE FROM THE HELD DOOR, SENT ON HER RETURN (door-reveal): she chose at the door and left, the host let
 * her in meanwhile, and the album she comes back to sends what she chose, once, put down on the device first.
 */
/* ★ RED-TEAM 43'S MEDIUM, AT THE PAGE: on an album with a develop time ahead her shots read as joined and vanished on
   a reload, with no tracker, because the page read "delayed" as the host's approval alone. Whatever the page's
   reading says waits (`uploadsWait`), her tracker mounts on it and the keep says it waits, and for the develop. */
describe("what she adds waits: her tracker and the keep are told", () => {
  it("★ an album with a develop time ahead: the tracker asks after hers, and the keep says the develop", async () => {
    // A day past the test's own clock: a fixed time read "ahead" only until it passed (13:00Z on 2026-10-03, which
    // turned this red for every lane), and the page reads the develop against the live clock.
    const ahead = new Date(Date.now() + 86_400_000).toISOString();
    render(
      <Page
        seed={seed()}
        verified={false}
        uploadsWait={{ waits: true, developsAt: ahead }}
      />,
    );
    await waitFor(() => expect(trackerNow.handed).not.toBeNull());
    expect(trackerNow.handed).toMatchObject({
      moderated: true,
      developsAt: ahead,
    });
    expect(stageNow.handed).toMatchObject({
      keepHeld: true,
      keepDevelopsAt: ahead,
    });
  });

  it("an album that shows what is added at once: no tracker to ask, and the keep says it joined", async () => {
    render(<Page seed={seed()} verified={false} />);
    await waitFor(() => expect(trackerNow.handed).not.toBeNull());
    expect(trackerNow.handed).toMatchObject({
      moderated: false,
      developsAt: null,
    });
    expect(stageNow.handed).toMatchObject({
      keepHeld: false,
      keepDevelopsAt: null,
    });
  });
});

describe("her choice from the held door", () => {
  it("★ the album she returns to sends it, once, and puts it down", async () => {
    const files = [new File(["a"], "a.jpg", { type: "image/jpeg" })];
    heldPicks.files = files;
    render(<Page seed={seed()} verified />);
    await waitFor(() =>
      expect(queueOptions.addFiles).toHaveBeenCalledWith(files),
    );
    expect(heldPicks.forget).toHaveBeenCalledWith(EVENT.qr_token);
    expect(queueOptions.addFiles).toHaveBeenCalledOnce();
  });

  it("nothing is sent from a door she is still outside, or for a visitor who was never at one", async () => {
    heldPicks.files = [new File(["a"], "a.jpg", { type: "image/jpeg" })];
    render(<Page seed={seed()} verified access="none" gate="waiting" />);
    await screen.findByTestId("door-name");
    cleanup();
    render(<Page seed={seed()} verified={false} />);
    await screen.findByTestId("door-name");
    await act(async () => {});
    expect(queueOptions.addFiles).not.toHaveBeenCalled();
  });
});
