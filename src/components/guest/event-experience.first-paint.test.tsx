/**
 * ★ THE FIRST BYTE IS THE DOOR (door-reveal; Will's live walk of 2026-10-02: "entered the address, full guest
 * album was visible before gate appeared over it (big bug)", and his rule: "let's ensure that the album is never
 * visible before any door/gate that should be encountered first. Very bad UX for both revealing the album (could
 * catch screen recording) and the guest flow 'what just happened? i saw the album, now i'm out'").
 *
 * The invariant, on the SERVER'S FIRST PAINT (`renderToString`: no effect runs, no script, nothing hydrated), for
 * every door a newcomer can meet on the album's page: the welcome at a Public album and at an email-first album,
 * a password, the email step where the host lets each guest in, the ask, the wait; and a sheet step that comes
 * first (the door's scrim over the album). Each one draws the door, opaque and standing from the first frame (no
 * fade of its own), and the album, where the page lays it out at all, only under it: `inert`, its words held. A
 * returning guest who owes nothing gets her album at once. The shut door is the page's own early return, pinned
 * beside the page (`page.first-paint.test.tsx`).
 *
 * The real door (`EntryModal`) and the real shell; only the album's live parts and the browser's stores are
 * stand-ins. Each case's first paint is the page's own decision (`doorArrival`), from what the request carries.
 */
import { renderToString } from "react-dom/server";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { uploadsWait } from "@/lib/guest/upload-tracker";

import type { GuestEvent } from "@/lib/db/queries/guest-events";
import { doorArrival } from "@/lib/guest/entry-steps";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn(), replace: vi.fn() }),
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/lib/observability/sentry", () => ({ captureError: vi.fn() }));
vi.mock("@/lib/supabase/client", () => ({ createClient: vi.fn() }));
// The door's own Server Function (its name write): a reference the server render never calls.
vi.mock("@/app/(app)/account/actions", () => ({
  updateDisplayNameAction: vi.fn(),
}));

const part = vi.hoisted(() => () => null);
// The album's live source and its views, drawn as plain marks: what the first paint must keep under the door.
vi.mock("@/components/guest/gallery-live", () => ({
  GalleryLiveProvider: ({ children }: { children: ReactNode }) => (
    <div data-album-live="">{children}</div>
  ),
}));
vi.mock("@/components/guest/live-gallery", () => ({
  LiveGallery: () => <p data-album-photos="">the album, its photographs</p>,
}));
vi.mock("@/components/guest/reel/live-reel", () => ({
  LiveReel: ({ children }: { children?: ReactNode }) => children ?? null,
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
    holdAtDoor: vi.fn(),
    retry: vi.fn(),
    dismiss: vi.fn(),
  }),
  useLiveQueue: (queue: unknown) => queue,
}));
vi.mock("@/lib/guest/keep-ask", () => ({
  useKeepAskPutDown: () => false,
  putDownKeepAsk: vi.fn(),
}));
vi.mock("@/lib/guest/claim-uploads", () => ({
  claimAnonymousUploads: vi.fn(),
  claimLeftForAnotherAddress: vi.fn(),
}));
vi.mock("@/lib/guest/settle-name", () => ({ settleConfirmedName: vi.fn() }));

const { EventExperience } = await import("./event-experience");

const EVENT = {
  id: "11111111-2222-4333-8444-555555555555",
  qr_token: "0123456789abcdef0123456789abcdef",
  name: "Maya's 30th",
  description: "The barn, then the lake.",
  event_date: "2026-09-12",
  visibility: "open",
  accepting_uploads: true,
  moderation_mode: "live",
  require_upload_to_view: false,
  require_verified_email: false,
  host_display_name: "Maya",
  custom_slug: null,
  qr_style: "classic",
  accepts_video: true,
  show_reel: true,
  doorPass: null,
} as unknown as GuestEvent;

/** A gate's event as the page hands it at access `none` (the locked redaction: no date, no note). */
const GATED = {
  ...EVENT,
  visibility: "private",
  description: null,
  event_date: null,
} as unknown as GuestEvent;

type Door = {
  access: "none" | "teaser" | "full";
  gate: "password" | "account" | "upload" | "waiting" | "ask" | null;
  doorGate?: "approve" | "invite" | null;
  welcomeSeen?: boolean;
  ticketHeld?: boolean;
  isVerified?: boolean;
  event?: GuestEvent;
};

/** The page's first byte for one request: its decision, then the shell and the door as the server draws them. */
function firstPaint(door: Door): Document {
  const event =
    door.event ?? (door.access === "none" ? GATED : (EVENT as GuestEvent));
  const arrival = doorArrival({
    gate: door.gate,
    access: door.access,
    isOwner: false,
    isDemo: false,
    welcomeSeen: door.welcomeSeen ?? false,
    isVerified: door.isVerified ?? false,
    needsName: false,
    ticketHeld: door.ticketHeld ?? false,
    uploadsOpen: event.accepting_uploads,
    requireUpload: event.require_upload_to_view,
    hasContributed: false,
  });
  const html = renderToString(
    <EventExperience
      event={event}
      qrToken={event.qr_token}
      joinUrl={`https://partyreel.test/e/${event.qr_token}`}
      galleryPromise={new Promise<never>(() => {})}
      stats={{ approvedTotal: 48, guestCount: 6 }}
      isDemo={false}
      access={door.access}
      gate={door.gate}
      doorGate={door.doorGate ?? null}
      needsName={false}
      hostAvatarUrl={null}
      isOwner={false}
      canDeleteIds={[]}
      isAuthed={door.isVerified ?? false}
      isVerified={door.isVerified ?? false}
      welcomeSeen={door.welcomeSeen ?? false}
      arrival={arrival}
      doorPhase={0.25}
      uploadsWait={uploadsWait(event)}
    />,
  );
  return new DOMParser().parseFromString(html, "text/html");
}

/** The door standing as the page from the first byte: open, opaque, over everything the page lays out. */
function standingDoor(doc: Document) {
  const stage = doc.querySelector<HTMLElement>("[data-door-stage]");
  expect(stage, "the first byte draws the door's page").not.toBeNull();
  expect(stage?.getAttribute("data-state")).toBe("open");
  // Opaque, over the album's whole box, and in place from the first frame (no fade of its own).
  expect(stage?.className).toContain("bg-background");
  expect(stage?.className).toContain("absolute inset-0");
  expect(stage?.hasAttribute("data-door-stage-first")).toBe(true);
  // The resting light starts from the page's place on the wheel.
  expect(stage?.style.getPropertyValue("--door-phase")).toBe("0.25");
  return stage!;
}

/** The album, where the page lays it out at all: only under the door, unreachable, its words held. */
function albumOnlyUnderTheDoor(doc: Document) {
  const behind = doc.querySelector("[data-door-behind]");
  if (behind) {
    expect(behind.hasAttribute("inert")).toBe(true);
    expect(
      doc
        .querySelector("[data-guest-experience]")
        ?.hasAttribute("data-reveal-curtain"),
    ).toBe(true);
  }
}

describe("★ the first byte draws the door, never the album", () => {
  it("the welcome at a Public album: the door open onto the album's own cover, the album laid out under it", () => {
    const doc = firstPaint({ access: "full", gate: null });
    const stage = standingDoor(doc);
    expect(stage.textContent).toContain("You’re invited to");
    expect(stage.querySelector("h1")?.textContent).toBe("Maya's 30th");
    const way = stage.querySelector("[data-door-way]");
    expect(way?.getAttribute("data-door-way")).toBe("open");
    // Through the opening, the album's own cover (the walk lands on it).
    expect(
      way?.querySelector('[data-door-view="cover"] [data-cover-picture]'),
    ).not.toBeNull();
    albumOnlyUnderTheDoor(doc);
    expect(doc.querySelector("[data-door-behind]")).not.toBeNull();
    // No sheet and no scrim: the welcome is the door's page itself.
    expect(doc.querySelector("[data-door-first-scrim]")).toBeNull();
  });

  it("the welcome at an album that asks an email first (its teaser under the door)", () => {
    const doc = firstPaint({ access: "teaser", gate: "account" });
    const stage = standingDoor(doc);
    expect(stage.textContent).toContain("You’re invited to");
    albumOnlyUnderTheDoor(doc);
  });

  it("a password: the door shut, the album's name and its count, nothing of the album", () => {
    const doc = firstPaint({ access: "none", gate: "password" });
    const stage = standingDoor(doc);
    const way = stage.querySelector("[data-door-way]");
    expect(way?.getAttribute("data-door-way")).toBe("shut");
    expect(stage.querySelector("[data-door-view]")).toBeNull();
    expect(stage.querySelector("img")).toBeNull();
    expect(doc.querySelector("[data-door-behind]")).toBeNull();
  });

  it("a password, once the welcome has been met: the door at rest with the album's name and count", () => {
    const doc = firstPaint({
      access: "none",
      gate: "password",
      welcomeSeen: true,
    });
    const stage = standingDoor(doc);
    expect(stage.querySelector("h1")?.textContent).toBe("Maya's 30th");
    expect(stage.textContent).toContain("48 photos & videos inside");
    expect(doc.querySelector("[data-door-behind]")).toBeNull();
  });

  it("the email step where the host lets each guest in: the door shut, nothing of the album", () => {
    const doc = firstPaint({
      access: "none",
      gate: "account",
      doorGate: "approve",
      welcomeSeen: true,
    });
    const stage = standingDoor(doc);
    expect(
      stage.querySelector("[data-door-way]")?.getAttribute("data-door-way"),
    ).toBe("shut");
    expect(doc.querySelector("[data-door-behind]")).toBeNull();
  });

  it("the ask: the door shut, the host who lets her in, Ask to join", () => {
    const doc = firstPaint({
      access: "none",
      gate: "ask",
      welcomeSeen: true,
      isVerified: true,
    });
    const stage = standingDoor(doc);
    expect(stage.textContent).toContain("Maya lets each guest in");
    expect(stage.textContent).toContain("Ask to join");
    expect(doc.querySelector("[data-door-behind]")).toBeNull();
  });

  it("the wait: the door ajar, the host will let her in", () => {
    const doc = firstPaint({
      access: "none",
      gate: "waiting",
      welcomeSeen: true,
      isVerified: true,
    });
    const stage = standingDoor(doc);
    expect(
      stage.querySelector("[data-door-way]")?.getAttribute("data-door-way"),
    ).toBe("ajar");
    expect(stage.textContent).toContain("Maya will let you in");
    expect(doc.querySelector("[data-door-behind]")).toBeNull();
  });

  it("★ a sheet step first (the email step past the welcome): the door's scrim over the album, never the album bare", () => {
    const doc = firstPaint({
      access: "teaser",
      gate: "account",
      welcomeSeen: true,
    });
    const scrim = doc.querySelector<HTMLElement>("[data-door-first-scrim]");
    expect(scrim, "the first byte draws the door's scrim").not.toBeNull();
    expect(scrim?.getAttribute("data-door-first-scrim")).toBe("up");
    expect(scrim?.className).toContain("fixed inset-0");
    expect(scrim?.className).toContain("backdrop-blur");
    // No door's page: the sheet rises into the scrim after hydration.
    expect(doc.querySelector("[data-door-stage]")).toBeNull();
  });

  it("★ the name a newcomer still owes, past the welcome: the scrim, too", () => {
    const doc = firstPaint({ access: "full", gate: null, welcomeSeen: true });
    expect(doc.querySelector("[data-door-first-scrim]")).not.toBeNull();
  });

  it("★ a returning guest who owes nothing lands on her album at once: no door, no scrim, nothing held", () => {
    const doc = firstPaint({
      access: "full",
      gate: null,
      welcomeSeen: true,
      ticketHeld: true,
    });
    expect(doc.querySelector("[data-door-stage]")).toBeNull();
    expect(doc.querySelector("[data-door-first-scrim]")).toBeNull();
    const behind = doc.querySelector("[data-door-behind]");
    expect(behind).not.toBeNull();
    expect(behind?.hasAttribute("inert")).toBe(false);
    expect(
      doc
        .querySelector("[data-guest-experience]")
        ?.hasAttribute("data-reveal-curtain"),
    ).toBe(false);
  });
});
