import { Suspense, use, useEffect, type ReactNode } from "react";
import { act, cleanup, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { TooltipProvider } from "@/components/ui/tooltip";
import type { GuestEvent } from "@/lib/db/queries/guest-events";
import { uploadsWait } from "@/lib/guest/upload-tracker";

/**
 * THE PAGE'S HALF OF THE ALBUM'S CAMERA (crumbs-52; `disposable-camera`'s Questions, and red-team 43's NITs on a
 * sealed album). The camera itself is `components/guest/camera/` and `GuestUpload`'s (its own pins); what the PAGE
 * owes it is five small facts, each pinned here against a `GuestUpload`, a live source, a dock and a door that are
 * recorders, so what is read is exactly what the page hands them:
 *
 *  - the door's keep, which her first landed shot makes due, is HELD while the camera is open (`onCameraOpenChange`):
 *    it used to rise over the camera mid-shoot;
 *  - a landing the server SEALED until the album develops is kept as a held one is (`inFlightUploads`): her tracker
 *    draws this visit's picture of it, and the cover says Add photos once she has shot, never "the first photo";
 *  - the album's host is handed to the camera (`isOwner`, never the demo's), so her own camera keeps no roll, and a
 *    shot taken back inside the camera is the page's own removal (`onOwnRemoved`): a require-an-upload album re-asks
 *    its door when her last one goes;
 *  - the Add says Take photos, with the camera glyph, where it opens the camera: the cover's white Add, and the
 *    shutter's face (the dock's `camera`).
 *
 * ★ AND WHAT HER ADDS WAIT FOR, AS IT FALLS ON THIS VIEWER (red-team 44): the album is told whether anything of hers in
 * the air may stand at its head (`addsWait`: never where what she adds waits, which drew a pick in flight in the album
 * for her alone), the slot the same reading for the failure sheet's words, and the door what she sent, by kind, for
 * the keep's noun.
 */
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: seen.refresh }),
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/lib/observability/sentry", () => ({ captureError: vi.fn() }));
// The demo's phone pair listens on a Realtime channel from its first render: a client that holds one and says nothing.
vi.mock("@/lib/supabase/client", () => {
  const channel: Record<string, unknown> = {};
  channel.on = () => channel;
  channel.subscribe = () => channel;
  return {
    createClient: () => ({ channel: () => channel, removeChannel: vi.fn() }),
  };
});

const part = vi.hoisted(() => () => null);
// The page's one queue, which a test fills, and what each recorder was handed on its last render.
const queueState = vi.hoisted(() => ({ items: [] as unknown[] }));
const seen = vi.hoisted(() => ({
  refresh: vi.fn(),
  upload: null as Record<string, unknown> | null,
  pending: [] as unknown[],
  dock: null as Record<string, unknown> | null,
  door: null as Record<string, unknown> | null,
  gallery: null as Record<string, unknown> | null,
  tracker: null as Record<string, unknown> | null,
  reel: null as Record<string, unknown> | null,
  developsAtChange: null as ((developsAt: string | null) => void) | null,
  waitingChange: null as ((waits: boolean) => void) | null,
  countWordsChange: null as ((words: string) => void) | null,
  uploadsWordChange: null as ((accepting: boolean) => void) | null,
}));
// The live source's handle as the page holds it: what the page asks of the album.
const galleryHandle = vi.hoisted(() => ({
  notifyUploaded: vi.fn(),
  renameMine: vi.fn(),
  askUploadsWord: vi.fn(),
}));

vi.mock("@/components/guest/gallery-live", () => ({
  // A live source that records the files the page says are still its own to hold (the head's stack).
  GalleryLiveProvider: ({
    ref,
    galleryPromise,
    pendingUploads,
    onDevelopsAtChange,
    onWaitingChange,
    onCountWordsChange,
    onUploadsWord,
    children,
  }: {
    ref?: (handle: unknown) => void;
    galleryPromise: Promise<unknown>;
    pendingUploads?: unknown[];
    onDevelopsAtChange?: (developsAt: string | null) => void;
    onWaitingChange?: (waits: boolean) => void;
    onCountWordsChange?: (words: string) => void;
    onUploadsWord?: (accepting: boolean) => void;
    children: ReactNode;
  }) => {
    use(galleryPromise);
    // The source's handle, as the page attaches it (its ask for the album's word on uploads is recorded).
    useEffect(() => {
      ref?.(galleryHandle);
      return () => ref?.(null);
    }, [ref]);
    // ... and whether the album takes uploads, each full answer's word (guest-requests).
    seen.uploadsWordChange = onUploadsWord ?? null;
    seen.pending = pendingUploads ?? [];
    // The album's sync, as the source tells the page what it carries about the develop.
    seen.developsAtChange = onDevelopsAtChange ?? null;
    // ... and whether anything waits in the album, everyone's (each change of it, never each count).
    seen.waitingChange = onWaitingChange ?? null;
    // ... and the words its count is said in, by what the album holds (`albumCountWords`).
    seen.countWordsChange = onCountWordsChange ?? null;
    return <div data-testid="album">{children}</div>;
  },
}));
// The album's view, as a recorder of what the page hands it (whether hers in the air may stand at its head).
vi.mock("@/components/guest/live-gallery", () => ({
  LiveGallery: (props: Record<string, unknown>) => {
    seen.gallery = props;
    return null;
  },
}));
vi.mock("@/components/guest/reel/live-reel", () => ({
  // A recorder too: its Add entries (the empty album's, a clip's) follow whether the album takes uploads (crumbs-93).
  LiveReel: (props: { children?: ReactNode } & Record<string, unknown>) => {
    seen.reel = props;
    return props.children ?? null;
  },
}));
vi.mock("@/components/guest/upload-tracker", () => ({
  createUploadTrackerStore: () => ({}),
  // Her tracker, as a recorder of the words the page hands it.
  UploadTracker: (props: Record<string, unknown>) => {
    seen.tracker = props;
    return null;
  },
  UploadTrackerButton: part,
}));
// The one Add entry, as a recorder of the props the page hands it.
vi.mock("@/components/guest/guest-upload", () => ({
  GuestUpload: (props: Record<string, unknown>) => {
    seen.upload = props;
    return <div data-testid="guest-upload" />;
  },
  TurnCard: part,
}));
vi.mock("@/components/guest/guest-action-dock", () => ({
  GuestActionDock: (props: Record<string, unknown>) => {
    seen.dock = props;
    return null;
  },
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
// The door, as a recorder of what it is told (the keep's `keepDue` is the line under test).
vi.mock("@/components/guest/entry-modal", () => ({
  EntryModal: (props: Record<string, unknown>) => {
    seen.door = props;
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
    items: queueState.items,
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
const { addsWaitFor } = await import("./event-experience-wait");

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

/** An album whose host chose the camera, with the roll of 24 and a develop time ahead: what a disposable album is. */
const CAMERA = {
  ...EVENT,
  capture: "camera",
  roll_size: 24,
  develops_at: new Date(Date.now() + 86_400_000).toISOString(),
} as unknown as GuestEvent;

/** A free-upload album that develops later: every upload is sealed, whichever surface sent it. */
const DEVELOPS = {
  ...EVENT,
  develops_at: new Date(Date.now() + 86_400_000).toISOString(),
} as unknown as GuestEvent;

/** A shot the server landed SEALED until the album develops (`landedAs`): done, and drawn nowhere. */
const sealedShot = (id: string) => ({
  id: `q-${id}`,
  file: new File(["x"], `${id}.jpg`, { type: "image/jpeg" }),
  kind: "photo",
  status: "done",
  progress: 100,
  mediaId: id,
  mediaStatus: "sealed",
});

async function page(
  over: {
    event?: GuestEvent;
    approvedTotal?: number;
    isOwner?: boolean;
    isDemo?: boolean;
    isAuthed?: boolean;
  } = {},
) {
  const event = over.event ?? CAMERA;
  await act(async () => {
    render(
      <TooltipProvider>
        <Suspense fallback={null}>
          <EventExperience
            event={event}
            qrToken={event.qr_token}
            joinUrl={`https://partyreel.test/e/${event.qr_token}`}
            galleryPromise={
              Promise.resolve({ kind: "locked" }) as Promise<never>
            }
            stats={{ approvedTotal: over.approvedTotal ?? 0, guestCount: 1 }}
            isDemo={over.isDemo ?? false}
            access="full"
            gate={null}
            needsName={false}
            hostAvatarUrl={null}
            isOwner={over.isOwner ?? false}
            canDeleteIds={[]}
            isAuthed={over.isAuthed ?? false}
            uploadsWait={uploadsWait(event)}
          />
        </Suspense>
      </TooltipProvider>,
    );
    await new Promise((resolve) => setTimeout(resolve, 0));
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

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("IntersectionObserver", NoIntersections);
  queueState.items = [];
  seen.upload = null;
  seen.pending = [];
  seen.dock = null;
  seen.door = null;
  seen.gallery = null;
  seen.tracker = null;
  seen.reel = null;
  seen.developsAtChange = null;
  seen.waitingChange = null;
  seen.countWordsChange = null;
  seen.uploadsWordChange = null;
});

const keepDue = () => seen.door?.keepDue;
const cameraOpens = (open: boolean) =>
  act(() => {
    (
      seen.upload?.onCameraOpenChange as ((open: boolean) => void) | undefined
    )?.(open);
  });
// The cover's white Add (the glyph count beside it is named "N photos & videos": the name starts with the verb).
const cover = () => screen.getByRole("button", { name: /^(Add|Take) / });

describe("the door's keep, while she shoots", () => {
  it("★ is held while the camera is open, and due again the moment it closes", async () => {
    queueState.items = [sealedShot("m1")];
    await page();
    // Her first landed shot made it due: a signed-out guest is asked to keep what she added.
    expect(keepDue()).toBe(true);
    // The camera tells the page when it opens and closes; the keep waits for her to be done.
    expect(typeof seen.upload?.onCameraOpenChange).toBe("function");
    cameraOpens(true);
    expect(keepDue()).toBe(false);
    cameraOpens(false);
    expect(keepDue()).toBe(true);
  });

  it("is never due before a shot has landed, camera or not", async () => {
    await page();
    expect(keepDue()).toBe(false);
    cameraOpens(true);
    expect(keepDue()).toBe(false);
    cameraOpens(false);
    expect(keepDue()).toBe(false);
  });
});

describe("her own sealed shots, which the album shows nowhere", () => {
  it("★ are kept as a held upload is, so her tracker draws this visit's picture of them", async () => {
    queueState.items = [sealedShot("m1"), sealedShot("m2")];
    await page({ event: DEVELOPS });
    expect(seen.pending).toHaveLength(2);
  });

  it("★ make the cover say Add photos, as an album with shots on it, never the first photo", async () => {
    await page({ event: DEVELOPS });
    expect(cover()).toHaveTextContent("Add the first photo");
    cleanup();
    queueState.items = [sealedShot("m1"), sealedShot("m2")];
    await page({ event: DEVELOPS });
    expect(cover()).toHaveTextContent("Add photos");
    expect(cover()).not.toHaveTextContent("first");
  });

  /* ★ THE FIRST PHOTO FOLLOWS WHAT WAITS, LIVE (crumbs-61, red-team 48's NIT): a guest who joined an empty album kept "Take
     the first photo" over her own live sheet ("3 photos developing") once others' shots waited, since the page's word on
     whether anything waits was the server's, at render. The source tells the page each change of it (`onWaitingChange`),
     and the Add says what a newcomer's does: Take photos. */
  it("★ stops asking for the first photo the moment others' shots wait, and asks again if nothing does", async () => {
    await page({ event: CAMERA });
    expect(cover()).toHaveTextContent("Take the first photo");
    expect(typeof seen.waitingChange).toBe("function");
    act(() => seen.waitingChange?.(true));
    expect(cover()).toHaveTextContent("Take photos");
    expect(cover()).not.toHaveTextContent("first");
    act(() => seen.waitingChange?.(false));
    expect(cover()).toHaveTextContent("Take the first photo");
  });

  it("★ says it for a free-upload album that develops later too: Add photos, never the first photo", async () => {
    await page({ event: DEVELOPS });
    expect(cover()).toHaveTextContent("Add the first photo");
    act(() => seen.waitingChange?.(true));
    expect(cover()).toHaveTextContent("Add photos");
  });

  /* ★ THE COVER'S COUNT SAYS WHAT THE ALBUM HOLDS (crumbs-61, red-team 48's NIT): the glyph's words are "12 photos & videos"
     from the first paint (the server knows a total, never its kinds) until the album's source names what it holds. */
  it("★ names its count by what the album holds once the source says it, and both nouns until then", async () => {
    await page({ event: DEVELOPS, approvedTotal: 12 });
    expect(
      screen.getByRole("button", { name: "12 photos & videos" }),
    ).toBeInTheDocument();
    act(() => seen.countWordsChange?.("12 photos"));
    expect(
      screen.getByRole("button", { name: "12 photos" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "12 photos & videos" }),
    ).toBeNull();
  });

  it("a shot she takes back is hers no longer: nothing keeps it, and the cover asks for the first again", async () => {
    queueState.items = [sealedShot("m1")];
    await page({ event: DEVELOPS });
    expect(seen.pending).toHaveLength(1);
    // The camera's own Remove reaches the page's removal, as her tracker's does.
    act(() => {
      (seen.upload?.onOwnRemoved as (id: string, left: number) => void)(
        "m1",
        0,
      );
    });
    expect(seen.pending).toHaveLength(0);
    expect(cover()).toHaveTextContent("Add the first photo");
  });
});

describe("the host's own camera, and a shot taken back inside it", () => {
  it("is handed the album's host, so her camera keeps no roll, and never the demo's", async () => {
    await page({ isOwner: true });
    expect(seen.upload?.isOwner).toBe(true);
    cleanup();
    await page({ isOwner: false });
    expect(seen.upload?.isOwner).toBe(false);
    cleanup();
    // The demo's visitor owns nothing (the page's `isOwner && !isDemo` for the live source says the same).
    await page({ isOwner: true, isDemo: true });
    expect(seen.upload?.isOwner).toBe(false);
  });

  it("★ a shot taken back inside the camera is the page's removal: a require-an-upload album re-asks its door", async () => {
    const REQUIRED = {
      ...CAMERA,
      require_upload_to_view: true,
    } as unknown as GuestEvent;
    queueState.items = [sealedShot("m1")];
    await page({ event: REQUIRED });
    expect(typeof seen.upload?.onOwnRemoved).toBe("function");
    // Her last one goes: the server decides (a held upload still counts), and the page asks it at once.
    act(() => {
      (seen.upload?.onOwnRemoved as (id: string, left: number) => void)(
        "m1",
        0,
      );
    });
    expect(seen.refresh).toHaveBeenCalledTimes(1);
  });

  it("asks nothing of the server while she still has others on the roll", async () => {
    const REQUIRED = {
      ...CAMERA,
      require_upload_to_view: true,
    } as unknown as GuestEvent;
    queueState.items = [sealedShot("m1"), sealedShot("m2")];
    await page({ event: REQUIRED });
    act(() => {
      (seen.upload?.onOwnRemoved as (id: string, left: number) => void)(
        "m1",
        1,
      );
    });
    expect(seen.refresh).not.toHaveBeenCalled();
  });
});

describe("Add on an album whose Add opens the camera", () => {
  it("★ says Take photos with the camera glyph, on the cover's Add and on the shutter's face", async () => {
    queueState.items = [sealedShot("m1")];
    await page({ event: CAMERA });
    expect(cover()).toHaveTextContent("Take photos");
    expect(cover().querySelector("svg.lucide-camera")).not.toBeNull();
    expect(cover().querySelector("svg.lucide-image-up")).toBeNull();
    // The foot's shutter is the dock's: the page says which Add it is.
    expect(seen.dock?.camera).toBe(true);
  });

  it("asks for the first shot while the roll is empty and nothing of hers waits", async () => {
    await page({ event: CAMERA });
    expect(cover()).toHaveTextContent("Take the first photo");
    expect(cover().querySelector("svg.lucide-camera")).not.toBeNull();
  });

  it("is today's Add photos with the upload glyph on every other album", async () => {
    await page({ event: DEVELOPS, approvedTotal: 3 });
    expect(cover()).toHaveTextContent("Add photos");
    expect(cover().querySelector("svg.lucide-image-up")).not.toBeNull();
    expect(cover().querySelector("svg.lucide-camera")).toBeNull();
    expect(seen.dock?.camera).toBeFalsy();
  });
});

/** An album whose host approves each upload, with nothing to develop. */
const APPROVES = {
  ...EVENT,
  moderation_mode: "hold_for_approval",
} as unknown as GuestEvent;

describe("addsWaitFor: what this viewer's own adds wait for", () => {
  it("is the album's reading for a guest: the host's approval, or a develop time ahead", () => {
    const develops = uploadsWait(DEVELOPS);
    expect(
      addsWaitFor({ uploadsWait: develops, isOwner: false, isDemo: false }),
    ).toEqual(develops);
    expect(
      addsWaitFor({
        uploadsWait: uploadsWait(APPROVES),
        isOwner: false,
        isDemo: false,
      }),
    ).toEqual({ waits: true, developsAt: null });
    expect(
      addsWaitFor({
        uploadsWait: uploadsWait(EVENT),
        isOwner: false,
        isDemo: false,
      }),
    ).toEqual({ waits: false, developsAt: null });
  });

  it("★ is the develop alone for the host: her own pair approves hers, and seals them with everyone's", () => {
    expect(
      addsWaitFor({
        uploadsWait: uploadsWait(APPROVES),
        isOwner: true,
        isDemo: false,
      }),
    ).toEqual({ waits: false, developsAt: null });
    const develops = uploadsWait(DEVELOPS);
    expect(
      addsWaitFor({ uploadsWait: develops, isOwner: true, isDemo: false }),
    ).toEqual(develops);
  });

  it("is nothing in the demo, whose uploads are simulated and land at once", () => {
    expect(
      addsWaitFor({
        uploadsWait: uploadsWait(DEVELOPS),
        isOwner: false,
        isDemo: true,
      }),
    ).toEqual({ waits: false, developsAt: null });
  });
});

describe("what her adds wait for, handed to the album, the slot and the door (red-team 44)", () => {
  it("★ tells the album that nothing of hers in the air stands at its head where what she adds waits", async () => {
    await page({ event: DEVELOPS });
    expect(seen.gallery?.addsWait).toBe(true);
    cleanup();
    await page({ event: APPROVES });
    expect(seen.gallery?.addsWait).toBe(true);
    cleanup();
    await page({ event: CAMERA });
    expect(seen.gallery?.addsWait).toBe(true);
  });

  it("keeps today's stack where what she adds shows at once, and for the host's own Add on an album she approves", async () => {
    await page({ event: EVENT });
    expect(seen.gallery?.addsWait).toBe(false);
    cleanup();
    await page({ event: APPROVES, isOwner: true });
    expect(seen.gallery?.addsWait).toBe(false);
    cleanup();
    await page({ event: DEVELOPS, isOwner: true });
    expect(seen.gallery?.addsWait).toBe(true);
  });

  it("hands the slot the album's reading, for its line, the camera and the failure sheet's words", async () => {
    await page({ event: DEVELOPS });
    expect(seen.upload?.uploadsWait).toEqual(uploadsWait(DEVELOPS));
    cleanup();
    await page({ event: APPROVES, isOwner: true });
    expect(seen.upload?.uploadsWait).toEqual({
      waits: true,
      developsAt: null,
    });
  });

  it("★ hands the door what she sent, by kind, and whether the album's camera took it, for the keep's noun", async () => {
    queueState.items = [
      sealedShot("m1"),
      {
        ...sealedShot("m2"),
        file: new File(["x"], "m2.mp4", { type: "video/mp4" }),
        kind: "video",
      },
      // Still in the air: not sent yet, so not the keep's.
      { ...sealedShot("m3"), status: "uploading", mediaStatus: undefined },
    ];
    await page({ event: CAMERA });
    expect(seen.door?.keepCount).toBe(2);
    expect(seen.door?.keepSent).toEqual({
      kinds: ["photo", "video"],
      camera: true,
    });
    cleanup();
    await page({ event: DEVELOPS });
    expect(seen.door?.keepSent).toEqual({
      kinds: ["photo", "video"],
      camera: false,
    });
  });
});

/* ★ RED-TEAM 44'S LOW: the page read whether what she adds waits once, at render, so an open page kept a develop's
   promise over an album that had developed (Develop now, or the time passing), and the album's head, routed by it, would
   have kept her next upload out of an album that now shows it at once. The reading is live: everything that speaks of
   the wait follows it, with no reload. */
describe("a page whose develop comes while it is open", () => {
  it("★ follows the develop time as it comes: the slot's line, the album's head, her tracker and the keep", async () => {
    const SOON = {
      ...EVENT,
      develops_at: new Date(Date.now() + 400).toISOString(),
    } as unknown as GuestEvent;
    queueState.items = [sealedShot("m1")];
    await page({ event: SOON });
    expect(seen.upload?.uploadsWait).toMatchObject({ waits: true });
    expect(seen.gallery?.addsWait).toBe(true);
    expect(seen.tracker?.moderated).toBe(true);
    expect(seen.door?.keepHeld).toBe(true);
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 700));
    });
    expect(seen.upload?.uploadsWait).toEqual({
      waits: false,
      developsAt: null,
    });
    // An upload sent now goes straight into the album, its stack at the head from the press.
    expect(seen.gallery?.addsWait).toBe(false);
    expect(seen.tracker?.moderated).toBe(false);
    expect(seen.tracker?.developsAt).toBeNull();
    expect(seen.door?.keepHeld).toBe(false);
    expect(seen.door?.keepDevelopsAt).toBeNull();
  });

  it("★ follows a Develop now the album's sync carries, at once", async () => {
    await page({ event: DEVELOPS });
    expect(seen.gallery?.addsWait).toBe(true);
    expect(typeof seen.developsAtChange).toBe("function");
    act(() => {
      seen.developsAtChange?.(new Date(Date.now() - 1_000).toISOString());
    });
    expect(seen.upload?.uploadsWait).toEqual({
      waits: false,
      developsAt: null,
    });
    expect(seen.gallery?.addsWait).toBe(false);
    expect(seen.tracker?.moderated).toBe(false);
  });

  it("keeps an approve-each album's uploads waiting for the host, whatever the develop says", async () => {
    await page({ event: APPROVES });
    act(() => {
      seen.developsAtChange?.(null);
    });
    expect(seen.gallery?.addsWait).toBe(true);
    expect(seen.tracker?.moderated).toBe(true);
  });
});

/**
 * ★ THE ALBUM'S WORD ON UPLOADS, HANDED TO THE CAMERA (guest-requests): the page holds whether the album takes uploads,
 * the server's reading at render and then each word the album's sync carries, every one counted (`useLiveUploadsWord`),
 * and hands it to the camera, whose closed refusal waits for a word heard after it; the camera's ask for the word afresh
 * reaches the album's live source.
 */
describe("the album's word on uploads, handed to the camera (guest-requests)", () => {
  it("★ is the page's render first, then each word the album's sync carries, every one counted", async () => {
    await page();
    expect(seen.upload?.uploadsWord).toEqual({ open: true, heard: 0 });
    expect(typeof seen.uploadsWordChange).toBe("function");
    act(() => seen.uploadsWordChange?.(false));
    expect(seen.upload?.uploadsWord).toEqual({ open: false, heard: 1 });
    act(() => seen.uploadsWordChange?.(false));
    expect(seen.upload?.uploadsWord).toEqual({ open: false, heard: 2 });
    act(() => seen.uploadsWordChange?.(true));
    expect(seen.upload?.uploadsWord).toEqual({ open: true, heard: 3 });
  });

  it("★ the camera's ask for the word afresh reaches the album's live source", async () => {
    await page();
    act(() => {
      (seen.upload?.onAskUploadsWord as () => void)();
    });
    expect(galleryHandle.askUploadsWord).toHaveBeenCalledTimes(1);
  });
});

/**
 * ★ ONE WORD FEEDS EVERY READER OF WHETHER SHE CAN ADD (crumbs-93, red-team 58's MEDIUM): the album's sync carried the
 * host's pause and reopen to the camera and the album's order alone, while the cover, its Add, the shutter, the empty
 * album's Add and the door read the render's `accepting_uploads`: with her page open a pause left the cover offering Add
 * over a send that meets a 403, and a reopen left "The host has closed uploads" until she reloaded. Every reader below is
 * one `uploadsOpen`, so each turns on the word and turns back on the next, with the page open throughout.
 *
 * ★ AND THE SLOT NEVER GOES FROM UNDER HER: `GuestUpload` hosts the camera, the Add sheet and the failure sheet, so a pause
 * with her page open leaves it standing (it draws nothing of its own) and only the cover's Add and the closed line turn.
 */
describe("the album's live word feeds every reader of whether she can add (crumbs-93)", () => {
  const PAUSED = {
    ...EVENT,
    accepting_uploads: false,
  } as unknown as GuestEvent;
  const readers = () => ({
    add: screen.queryByRole("button", { name: /^(Add|Take) / }) !== null,
    closedLine: screen.queryByText(/The host has closed uploads/) !== null,
    slot: screen.queryByTestId("guest-upload") !== null,
    door: seen.door?.uploadsOpen,
    shutter: typeof seen.dock?.onAdd,
    albumAdd: typeof seen.reel?.onAddYours,
    clip: typeof seen.reel?.addClipToAlbum,
  });
  const hear = (accepting: boolean) =>
    act(() => seen.uploadsWordChange?.(accepting));

  it("★ a pause with the page open turns every reader, and a reopen turns every one back, with no reload", async () => {
    await page({ event: EVENT, approvedTotal: 3 });
    expect(readers()).toEqual({
      add: true,
      closedLine: false,
      slot: true,
      door: true,
      shutter: "function",
      albumAdd: "function",
      clip: "function",
    });

    hear(false);
    expect(readers()).toEqual({
      add: false,
      closedLine: true,
      // Standing, so the camera, the Add sheet and the failure sheet that will say why a send was refused stay put.
      slot: true,
      door: false,
      shutter: "undefined",
      albumAdd: "undefined",
      clip: "object",
    });

    hear(true);
    expect(readers()).toEqual({
      add: true,
      closedLine: false,
      slot: true,
      door: true,
      shutter: "function",
      albumAdd: "function",
      clip: "function",
    });
  });

  it("★ a page that RENDERS paused mounts no slot, shows the closed line, and mounts the slot when the album reopens", async () => {
    await page({ event: PAUSED, approvedTotal: 3 });
    expect(readers()).toMatchObject({
      add: false,
      closedLine: true,
      slot: false,
      door: false,
    });
    hear(true);
    expect(readers()).toMatchObject({
      add: true,
      closedLine: false,
      slot: true,
      door: true,
    });
  });

  it("the demo never closes: it has no sync to hear, and no closed line even from a paused word", async () => {
    await page({ event: EVENT, isDemo: true, approvedTotal: 3 });
    expect(readers()).toMatchObject({ add: true, closedLine: false });
  });

  it("★ a send the album refused as closed asks the album for its word afresh, once, so the cover hears the pause within a round trip", async () => {
    await page({ event: EVENT, approvedTotal: 3 });
    expect(galleryHandle.askUploadsWord).not.toHaveBeenCalled();
    // The queue's item is replaced on every change, so a fresh refusal is a fresh object.
    queueState.items = [
      {
        id: "q-1",
        file: new File(["x"], "a.jpg", { type: "image/jpeg" }),
        kind: "photo",
        status: "error",
        progress: 0,
        errorCode: "uploads_closed",
        error: "This event isn't accepting uploads right now.",
      },
    ];
    hear(true);
    expect(galleryHandle.askUploadsWord).toHaveBeenCalledTimes(1);
    // The same refusal, heard about again, is not asked again.
    hear(true);
    expect(galleryHandle.askUploadsWord).toHaveBeenCalledTimes(1);
  });

  it("a camera album's refusal is the camera's to ask for (`album-camera.tsx`), never doubled by the page", async () => {
    queueState.items = [
      {
        id: "q-1",
        file: new File(["x"], "a.jpg", { type: "image/jpeg" }),
        kind: "photo",
        status: "error",
        progress: 0,
        errorCode: "uploads_closed",
      },
    ];
    await page({ event: CAMERA, approvedTotal: 3 });
    expect(galleryHandle.askUploadsWord).not.toHaveBeenCalled();
  });

  it("a page that already knows the album closed has nothing to ask", async () => {
    queueState.items = [
      {
        id: "q-1",
        file: new File(["x"], "a.jpg", { type: "image/jpeg" }),
        kind: "photo",
        status: "error",
        progress: 0,
        errorCode: "uploads_closed",
      },
    ];
    await page({ event: PAUSED, approvedTotal: 3 });
    expect(galleryHandle.askUploadsWord).not.toHaveBeenCalled();
  });
});
