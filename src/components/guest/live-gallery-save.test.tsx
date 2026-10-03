/**
 * HER SAVE (take-home r1, `save=light`): on a phone whose own sheet takes files, Save asks one quick question, each
 * choice with its size (Photos at phone size beside the originals in Files: his note, "so they can clearly see that
 * saving to files seems to be a more high quality download"); at a desk, Save is the originals' zip and asks
 * nothing. The engine and the download walk are spies: what this pins is which one her choice starts, with what.
 */
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { GridMedia } from "@/components/app/media-grid";
import { GuestSaveChoice } from "@/components/guest/live-gallery-save";
import { guestSelect } from "@/components/guest/live-gallery-select";
import { setViewportWidth } from "../../../vitest.setup";

const { start, stop, tap, startDownload, toastError } = vi.hoisted(() => ({
  start: vi.fn(async () => {}),
  stop: vi.fn(),
  tap: vi.fn(),
  startDownload: vi.fn(async () => true),
  toastError: vi.fn(),
}));
vi.mock("@/components/app/export/take-home-save", () => ({
  createTakeHomeSaver: () => ({ start, stop, tap, busy: false }),
}));
vi.mock("@/components/app/export/use-export-download", () => ({
  useExportDownload: () => ({ startDownload, fetchSummary: vi.fn() }),
}));
vi.mock("sonner", () => ({ toast: { error: toastError } }));

const MB = 1024 * 1024;
const IPHONE =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
const DESK =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36";

const restore: (() => void)[] = [];
function onNavigator(values: Record<string, unknown>) {
  for (const [key, value] of Object.entries(values)) {
    const before = Object.getOwnPropertyDescriptor(navigator, key);
    Object.defineProperty(navigator, key, { configurable: true, value });
    restore.push(() => {
      if (before) Object.defineProperty(navigator, key, before);
      else delete (navigator as unknown as Record<string, unknown>)[key];
    });
  }
}
const phone = () =>
  onNavigator({
    userAgent: IPHONE,
    maxTouchPoints: 5,
    share: vi.fn(),
    canShare: () => true,
  });

const item = (id: string, type: "photo" | "video" = "photo"): GridMedia =>
  ({ id, type, url: `https://r2.test/${id}` }) as GridMedia;
const ITEMS = [item("p1"), item("p2"), item("p3"), item("v1", "video")];

const summaryOf = (photos: number, clips: number) => ({
  shown: {
    photo: {
      count: photos,
      bytes: Math.round(photos * 2.9 * MB),
      phone: Math.round(photos * 0.55 * MB),
    },
    video: { count: clips, bytes: clips * 22 * MB, phone: clips * 22 * MB },
  },
  hidden: {
    photo: { count: 0, bytes: 0, phone: 0 },
    video: { count: 0, bytes: 0, phone: 0 },
  },
});

let posted: Record<string, unknown>[] = [];

beforeEach(() => {
  vi.clearAllMocks();
  posted = [];
  setViewportWidth(375);
  global.fetch = vi.fn(async (_url: RequestInfo | URL, init?: RequestInit) => {
    const body = JSON.parse(String(init?.body)) as Record<string, unknown>;
    posted.push(body);
    const ids = (body.ids as string[] | undefined) ?? ITEMS.map((i) => i.id);
    const photos = ids.filter((id) => id.startsWith("p")).length;
    return new Response(
      JSON.stringify({
        ok: true,
        summary: summaryOf(3, 1),
        ...(body.ids
          ? { selection: summaryOf(photos, ids.length - photos) }
          : {}),
      }),
      { status: 200 },
    );
  }) as unknown as typeof fetch;
});

afterEach(() => {
  act(() => guestSelect.exit());
  while (restore.length) restore.pop()!();
  setViewportWidth(1024);
});

function mountWith(picks: string[]) {
  render(<GuestSaveChoice qrToken="qr-1" items={ITEMS} />);
  act(() => {
    guestSelect.enter();
    guestSelect.pick(picks);
  });
}

describe("on a phone: two ways, each with its size", () => {
  it("asks Photos or Files, with phone size beside the originals", async () => {
    phone();
    mountWith(["p1", "p2"]);
    act(() => guestSelect.press());
    expect(await screen.findByText("Save 2 photos")).toBeInTheDocument();
    const photos = screen.getByRole("menuitem", { name: /Save to Photos/ });
    const files = screen.getByRole("menuitem", { name: /Save to Files/ });
    await waitFor(() => expect(photos).toHaveTextContent("2 photos · 1.1 MB"));
    expect(files).toHaveTextContent("Originals · 5.8 MB");
    expect(posted[0]).toEqual({
      step: "summary",
      qr_token: "qr-1",
      ids: ["p1", "p2"],
    });
  });

  it("Photos starts the Save at phone size, inside the tap", async () => {
    phone();
    mountWith(["p1", "v1"]);
    act(() => guestSelect.press());
    fireEvent.click(
      await screen.findByRole("menuitem", { name: /Save to Photos/ }),
    );
    expect(start).toHaveBeenCalledWith("guest", {
      qr_token: "qr-1",
      ids: ["p1", "v1"],
      size: "phone",
    });
    expect(startDownload).not.toHaveBeenCalled();
  });

  it("Files takes the originals as one zip through the download's walk, and select mode ends", async () => {
    phone();
    mountWith(["p3"]);
    act(() => guestSelect.press());
    fireEvent.click(
      await screen.findByRole("menuitem", { name: /Save to Files/ }),
    );
    expect(startDownload).toHaveBeenCalledWith("guest", {
      qr_token: "qr-1",
      ids: ["p3"],
      types: "all",
    });
    expect(guestSelect.get().active).toBe(false);
  });

  it("all of the album is asked as the album, never as a list of ids", async () => {
    phone();
    mountWith(ITEMS.map((i) => i.id));
    act(() => guestSelect.press());
    fireEvent.click(
      await screen.findByRole("menuitem", { name: /Save to Photos/ }),
    );
    expect(start).toHaveBeenCalledWith("guest", {
      qr_token: "qr-1",
      set: "album",
      size: "phone",
    });
  });
});

describe("past one Save's 2,000", () => {
  it("Photos waits with its limit, the note says where they all go, and Files still takes them", async () => {
    phone();
    // All of an album bigger than one Save: asked as the album, its sizes the album's own.
    global.fetch = vi.fn(
      async () =>
        new Response(
          JSON.stringify({ ok: true, summary: summaryOf(2345, 0) }),
          { status: 200 },
        ),
    ) as unknown as typeof fetch;
    mountWith(ITEMS.map((i) => i.id));
    act(() => guestSelect.press());
    const photos = await screen.findByRole("menuitem", {
      name: /Save to Photos/,
    });
    await waitFor(() => expect(photos).toBeDisabled());
    expect(photos).toHaveTextContent("Up to 2,000");
    expect(
      screen.getByText(
        "Photos takes up to 2,000 at a time: the originals take them all.",
      ),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("menuitem", { name: /Save to Files/ }));
    expect(start).not.toHaveBeenCalled();
    expect(startDownload).toHaveBeenCalledWith("guest", {
      qr_token: "qr-1",
      set: "album",
      types: "all",
    });
  });
});

describe("the press, by where the Save stands", () => {
  it("at a desk, Save is the originals' zip, no question asked", () => {
    onNavigator({ userAgent: DESK, maxTouchPoints: 0 });
    setViewportWidth(1440);
    mountWith(["p1"]);
    act(() => guestSelect.press());
    expect(screen.queryByRole("menuitem")).toBeNull();
    expect(startDownload).toHaveBeenCalledWith("guest", {
      qr_token: "qr-1",
      ids: ["p1"],
      types: "all",
    });
  });

  it("while photographs arrive a press stops it; once ready it opens the sheet", () => {
    phone();
    mountWith(["p1"]);
    act(() => guestSelect.setRun({ kind: "getting", progress: 0.3 }));
    act(() => guestSelect.press());
    expect(stop).toHaveBeenCalledTimes(1);
    act(() => guestSelect.setRun({ kind: "ready" }));
    act(() => guestSelect.press());
    expect(tap).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("menuitem")).toBeNull();
  });

  it("nothing picked, nothing happens", () => {
    phone();
    mountWith([]);
    act(() => guestSelect.press());
    expect(screen.queryByRole("menuitem")).toBeNull();
    expect(startDownload).not.toHaveBeenCalled();
  });
});
