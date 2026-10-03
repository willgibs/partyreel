/**
 * THE GUESTS' VIEW IS A LOOK, NEVER A DOOR, AND NOTHING ON IT IS HERS (event-header r2, `rooms=over`).
 *
 * Her album as a let-in guest meets it, from the guest page's own pieces: pinned that the album and every control on
 * it are inert (nothing she presses there writes as a guest), that its live source is asked as a guest (never the
 * owner, nothing of hers, no ticket), that it mounts none of the guest page's hands (the door, the upload queue, the
 * keep, the claims, the tracker), that its one live control is the way back where it is a page of its own, and that
 * Only me is the shut door every guest meets. The guest page's pieces are stood in for: what each draws is its own
 * tests'; what is pinned is what the view hands them.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const live = vi.hoisted(() => ({
  provider: [] as unknown[],
  gallery: [] as unknown[],
  wait: [] as unknown[],
}));
vi.mock("@/components/guest/gallery-live", () => ({
  GalleryLiveProvider: (props: { children: ReactNode }) => {
    live.provider.push(props);
    return <div data-testid="live-source">{props.children}</div>;
  },
}));
vi.mock("@/components/guest/live-gallery", () => ({
  LiveGallery: (props: unknown) => {
    live.gallery.push(props);
    return <div data-testid="album" />;
  },
}));
vi.mock("@/components/guest/gallery-empty-state-wait", () => ({
  AlbumWaitSource: (props: { children: ReactNode }) => {
    live.wait.push(props);
    return <>{props.children}</>;
  },
  AlbumWait: () => <div data-testid="wait" />,
}));
vi.mock("@/components/guest/event-experience-head", () => ({
  AlbumCover: ({
    name,
    actions,
    eyebrow,
  }: {
    name: string;
    actions: ReactNode;
    eyebrow?: ReactNode;
  }) => (
    <section data-testid="cover">
      {eyebrow ? <p data-testid="eyebrow">{eyebrow}</p> : null}
      <h1>{name}</h1>
      {actions}
    </section>
  ),
  CoverGround: () => null,
  createHeadBridge: () => ({
    get: () => null,
    subscribe: () => () => {},
    set: () => {},
  }),
}));
vi.mock("@/components/guest/guest-share", () => ({
  GuestShare: () => <button type="button">Invite</button>,
}));
vi.mock("@/components/guest/guest-action-dock", () => ({
  GuestActionDock: ({ onAdd }: { onAdd?: () => void }) => (
    <div data-testid="shutter" data-add={onAdd ? "yes" : "no"} />
  ),
}));
vi.mock("@/components/guest/report-dialog", () => ({
  ReportFoot: () => <footer>Report</footer>,
}));
vi.mock("@/components/guest/door/shut-door", () => ({
  ShutDoor: () => <h1>This album is closed</h1>,
}));
vi.mock("@/components/guest/door/album-light", () => ({
  AlbumLightSampler: () => null,
}));
vi.mock("@/components/guest/album-boundary", () => ({
  AlbumBoundary: ({ children }: { children: ReactNode }) => <>{children}</>,
}));
vi.mock("@/components/guest/gallery-skeleton", () => ({
  GallerySkeleton: () => null,
}));
vi.mock("@/components/social/guest-list", () => ({
  GUEST_LIST_FACES_THRESHOLD: 12,
  GuestList: ({ items }: { items: unknown[] }) => (
    <ul data-testid="guests">{items.length}</ul>
  ),
}));
vi.mock("@/lib/guest/door-light", () => ({
  useDoorHues: () => ({ hues: [] }),
}));

// jsdom observes nothing: the shutter's and the album end's sentinels simply rest.
class Unobserved {
  observe() {}
  unobserve() {}
  disconnect() {}
}
vi.stubGlobal("IntersectionObserver", Unobserved);

const { AsGuestView } = await import("./as-guest-view");

const EVENT = {
  id: "e1",
  qr_token: "a".repeat(32),
  name: "Maya & Jay",
  description: "Everything from the day.",
  event_date: "2026-10-03",
  host_display_name: "Maya",
  qr_style: "classic",
  accepting_uploads: true,
  show_reel: true,
  capture: "upload" as const,
  moderation_mode: "live" as "live" | "hold_for_approval",
  develops_at: null as string | null,
};

function view(over: Partial<Parameters<typeof AsGuestView>[0]> = {}) {
  return render(
    <AsGuestView
      event={EVENT}
      joinUrl="https://partyreel.test/e/abc"
      galleryPromise={new Promise(() => {})}
      stats={{ approvedTotal: 12, guestCount: 4 }}
      host={{ avatarUrl: null, seed: "s" }}
      guests={[{ kind: "unverified", id: "g1", displayName: "Theo" }] as never}
      shut={false}
      {...over}
    />,
  );
}

beforeEach(() => {
  live.provider.length = 0;
  live.gallery.length = 0;
  live.wait.length = 0;
});

describe("★ a look, never a door", () => {
  it("the album, its cover and every control on them are inert", () => {
    view();
    const album = document.querySelector("[data-guest-experience]");
    expect(album).toHaveAttribute("inert");
    for (const id of ["cover", "album", "shutter", "guests"]) {
      expect(album!.contains(screen.getByTestId(id)), id).toBe(true);
    }
    expect(
      album!.contains(screen.getByRole("button", { name: /add photos/i })),
    ).toBe(true);
  });

  it("★ its live source is asked as a guest: never the owner, nothing of hers, no ticket", () => {
    view();
    expect(live.provider).not.toHaveLength(0);
    expect(live.provider.at(-1)).toMatchObject({
      access: "full",
      isDemo: false,
      isOwner: false,
      isAuthed: false,
      canDeleteIds: [],
      sessionToken: null,
    });
    expect(live.gallery.at(-1)).toMatchObject({
      access: "full",
      isDemo: false,
    });
  });

  it("★ mounts none of the guest page's hands: no door, no upload queue, no keep, no claim, no tracker", () => {
    const src = readFileSync(
      join(process.cwd(), "src/components/app/share/as-guest-view.tsx"),
      "utf8",
    )
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/^\s*\/\/.*$/gm, "");
    for (const hand of [
      "EntryModal",
      "GuestUpload",
      "useUploadQueue",
      "UploadTracker",
      "useConfirmReturn",
      "ClaimAsk",
      "joinEvent",
      "GuestHeader",
      "LiveReel",
    ]) {
      expect(src, hand).not.toMatch(new RegExp(`\\b${hand}\\b`));
    }
  });
});

describe("its header", () => {
  it("framed over her hub, is a guest's with no account: inert, no way out of the frame", () => {
    view({ back: null });
    expect(
      screen.queryByRole("link", { name: /back to your hub/i }),
    ).toBeNull();
    const start = screen.getByRole("button", { name: /start for free/i });
    expect(start.closest("[inert]")).not.toBeNull();
  });

  it("as a page of its own, carries her one live control: the way back to her hub", () => {
    view({ back: "/dashboard/e1" });
    const back = screen.getByRole("link", { name: /back to your hub/i });
    expect(back).toHaveAttribute("href", "/dashboard/e1");
    expect(back.closest("[inert]")).toBeNull();
  });
});

describe("what a guest meets, as it stands", () => {
  it("uploads closed: no Add on the cover or the shutter, and the guest's own line", () => {
    view({ event: { ...EVENT, accepting_uploads: false } });
    expect(screen.queryByRole("button", { name: /add/i })).toBeNull();
    expect(screen.getByTestId("shutter")).toHaveAttribute("data-add", "no");
    expect(
      screen.getByText(/the host has closed uploads/i),
    ).toBeInTheDocument();
  });

  it("the album's camera says Take photos, as the guest page does", () => {
    view({ event: { ...EVENT, capture: "camera" } });
    expect(
      screen.getByRole("button", { name: /take photos/i }),
    ).toBeInTheDocument();
  });

  it("★ Only me is the shut door every guest meets, and no album at all", () => {
    view({ shut: true });
    expect(
      screen.getByRole("heading", { name: "This album is closed" }),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("album")).toBeNull();
    expect(live.provider).toHaveLength(0);
  });
});

/* WHAT WAITS, AS A GUEST MEETS IT (wait-wiring, the-wait r1's `wait=sheet` and `name=disposable`): a guest meets the
   contact sheet wherever photos wait and the cover's preset words on a disposable; her look is that page, so it mounts
   the guests' wait over the album (numbers only, off the guests' own live source; nothing of hers) and names the preset.
   Without it, a waiting album read here as the empty album, which no guest sees. */
describe("★ what waits, as a guest meets it", () => {
  type Source = { clock: unknown; hers: unknown; rule?: boolean };
  const source = () => live.wait.at(-1) as Source;
  const AHEAD = new Date(Date.now() + 6 * 3_600_000).toISOString();

  it("★ a disposable: the guests' sheet over the album, its clock the develop, and the cover names the preset", () => {
    view({
      event: { ...EVENT, capture: "camera", develops_at: AHEAD },
    });
    expect(screen.getByTestId("wait")).toBeInTheDocument();
    expect(source().clock).toEqual({ kind: "develop", developsAt: AHEAD });
    // Nothing of hers: no ticket, so no shots of her own to light.
    expect(source().hers).toBeNull();
    // Before anything waits, the album's rule is a guest's to read where she can add.
    expect(source().rule).toBe(true);
    expect(screen.getByTestId("eyebrow").textContent).toMatch(/^Disposable/);
  });

  it("a reviewed album waits as the host lets each in, with no word over its name", () => {
    view({ event: { ...EVENT, moderation_mode: "hold_for_approval" } });
    expect(source().clock).toEqual({ kind: "held", hostName: "Maya" });
    expect(screen.queryByTestId("eyebrow")).toBeNull();
  });

  it("a live album waits for nothing; uploads closed, no rule", () => {
    view({ event: { ...EVENT, accepting_uploads: false } });
    expect(source().clock).toBeNull();
    expect(source().rule).toBe(false);
  });
});
