/**
 * KEEP AND POST (take-home r1, `host=two`): the album's Download opens two sets, each named for what it is for,
 * pictured by the album, with its size and its one act. At a desk the originals lead and both download; on a phone
 * whose sheet takes files, phone size leads and saves into Photos. The engine and the download walk are spies:
 * what this pins is which one each act starts, with what.
 */
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { GalleryDownloadAllButton } from "@/components/app/export/download-all-button";
import {
  ClipsLine,
  OriginalsCard,
  PhoneSizeCard,
} from "@/components/app/export/take-home-panel";
import { takeHomeSizes } from "@/lib/export/take-home";
import { setViewportWidth } from "../../../../vitest.setup";

const { start, startDownload } = vi.hoisted(() => ({
  start: vi.fn(async () => {}),
  startDownload: vi.fn(async () => true),
}));
vi.mock("@/components/app/export/take-home-save", () => ({
  createTakeHomeSaver: () => ({
    start,
    stop: vi.fn(),
    tap: vi.fn(),
    busy: false,
  }),
}));
vi.mock("@/components/app/export/use-export-download", () => ({
  useExportDownload: () => ({ startDownload, fetchSummary: vi.fn() }),
}));

const MB = 1024 * 1024;
const IPHONE =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";

/** Maya's album: 196 photographs and 18 clips shown, 3 photographs hidden. */
const SUMMARY = {
  shown: {
    photo: {
      count: 196,
      bytes: Math.round(196 * 2.9 * MB),
      phone: Math.round(196 * 0.55 * MB),
    },
    video: { count: 18, bytes: 18 * 22 * MB, phone: 18 * 22 * MB },
  },
  hidden: {
    photo: {
      count: 3,
      bytes: Math.round(3 * 2.9 * MB),
      phone: Math.round(3 * 0.55 * MB),
    },
    video: { count: 0, bytes: 0, phone: 0 },
  },
};
const PICTURES = Array.from(
  { length: 6 },
  (_, i) => `https://r2.test/tile-${i}.webp`,
);

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

beforeEach(() => {
  vi.clearAllMocks();
  global.fetch = vi.fn(
    async () =>
      new Response(
        JSON.stringify({ ok: true, summary: SUMMARY, pictures: PICTURES }),
        {
          status: 200,
        },
      ),
  ) as unknown as typeof fetch;
});

afterEach(() => {
  while (restore.length) restore.pop()!();
  setViewportWidth(1024);
});

async function open(mount = true) {
  if (mount) render(<GalleryDownloadAllButton eventId="evt-1" />);
  fireEvent.click(screen.getByRole("button", { name: "Download" }));
  const dialog = await screen.findByRole("dialog");
  await waitFor(() =>
    expect(within(dialog).getByText(/964 MB|964\.\d MB/)).toBeInTheDocument(),
  );
  return dialog;
}

const card = (dialog: HTMLElement, name: string) =>
  dialog.querySelector<HTMLElement>(`[data-set-card="${name}"]`)!;

describe("at her desk", () => {
  beforeEach(() => setViewportWidth(1440));

  it("names both sets for what they are for, sized, pictured by the album, the originals first", async () => {
    const dialog = await open();
    expect(within(dialog).getByText("Take it home")).toBeInTheDocument();
    const cards = [...dialog.querySelectorAll("[data-set-card]")].map((c) =>
      c.getAttribute("data-set-card"),
    );
    expect(cards).toEqual(["Originals", "Phone size"]);
    expect(card(dialog, "Originals")).toHaveTextContent(
      "Full size, to keep for good.",
    );
    expect(card(dialog, "Originals")).toHaveTextContent(
      "214 · 964.4 MB · a zip",
    );
    expect(card(dialog, "Phone size")).toHaveTextContent(
      "Light enough to post tonight.",
    );
    expect(card(dialog, "Phone size")).toHaveTextContent(
      "196 photos · 107.8 MB · 2,048 px",
    );
    expect(
      within(dialog).getByText(/Clips come as they were taken: 18 · 396 MB/),
    ).toBeInTheDocument();
    expect(card(dialog, "Originals").querySelectorAll("img")).toHaveLength(6);
  });

  it("Originals downloads every original; Phone size downloads the copies as a zip", async () => {
    const dialog = await open();
    fireEvent.click(
      within(card(dialog, "Originals")).getByRole("button", {
        name: /Download/,
      }),
    );
    expect(startDownload).toHaveBeenLastCalledWith("host", {
      event_id: "evt-1",
      types: "all",
      include_hidden: false,
    });
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    const again = await open(false);
    fireEvent.click(
      within(card(again, "Phone size")).getByRole("button", {
        name: /Download/,
      }),
    );
    expect(startDownload).toHaveBeenLastCalledWith("host", {
      event_id: "evt-1",
      types: "photo",
      include_hidden: false,
      size: "phone",
    });
    expect(start).not.toHaveBeenCalled();
  });

  it("Include hidden items, when anything is hidden, changes what both sets take and weigh", async () => {
    const dialog = await open();
    fireEvent.click(
      within(dialog).getByRole("switch", { name: "Include hidden items" }),
    );
    expect(card(dialog, "Phone size")).toHaveTextContent("199 photos");
    fireEvent.click(
      within(card(dialog, "Originals")).getByRole("button", {
        name: /Download/,
      }),
    );
    expect(startDownload).toHaveBeenLastCalledWith("host", {
      event_id: "evt-1",
      types: "all",
      include_hidden: true,
    });
  });
});

/* ★ THE HEAD NAMES WHAT THE ALBUM HOLDS (red-team 46's NIT): "28 photos & videos" stood over an album of 28 photos and no
   video. The panel knows the kinds (the summary counts photographs and clips apart), so the noun follows them as the
   rest of the app words a set (`setNoun`): photos, videos, or both. */
describe("★ the head says what the album holds", () => {
  beforeEach(() => setViewportWidth(1440));

  /** An album's summary of photographs and clips, nothing hidden. */
  const holding = (photos: number, clips: number) => ({
    shown: {
      photo: { count: photos, bytes: photos * 3 * MB, phone: photos * MB },
      video: { count: clips, bytes: clips * 20 * MB, phone: clips * 20 * MB },
    },
    hidden: {
      photo: { count: 0, bytes: 0, phone: 0 },
      video: { count: 0, bytes: 0, phone: 0 },
    },
  });

  /** The line under "Take it home", the popup's own description. */
  async function headSays(summary: ReturnType<typeof holding>) {
    global.fetch = vi.fn(
      async () =>
        new Response(
          JSON.stringify({ ok: true, summary, pictures: PICTURES }),
          { status: 200 },
        ),
    ) as unknown as typeof fetch;
    render(<GalleryDownloadAllButton eventId="evt-1" />);
    fireEvent.click(screen.getByRole("button", { name: "Download" }));
    const dialog = await screen.findByRole("dialog");
    await waitFor(() =>
      expect(dialog.querySelector("[data-set-facts]")?.textContent).not.toBe(
        "Adding it up",
      ),
    );
    return document.getElementById(dialog.getAttribute("aria-describedby")!)
      ?.textContent;
  }

  it("★ photographs only: photos, never 'photos & videos'", async () => {
    expect(await headSays(holding(28, 0))).toBe("28 photos");
  });

  it("one photograph is a photograph", async () => {
    expect(await headSays(holding(1, 0))).toBe("1 photo");
  });

  it("★ clips only: videos", async () => {
    expect(await headSays(holding(0, 3))).toBe("3 videos");
  });

  it("one clip is a video", async () => {
    expect(await headSays(holding(0, 1))).toBe("1 video");
  });

  it("both kinds: photos & videos, counted together", async () => {
    expect(await headSays(holding(196, 18))).toBe("214 photos & videos");
  });
});

describe("on her phone", () => {
  beforeEach(() => {
    setViewportWidth(375);
    onNavigator({
      userAgent: IPHONE,
      maxTouchPoints: 5,
      share: vi.fn(),
      canShare: () => true,
    });
  });

  it("leads with phone size, which saves into Photos", async () => {
    const dialog = await open();
    const cards = [...dialog.querySelectorAll("[data-set-card]")].map((c) =>
      c.getAttribute("data-set-card"),
    );
    expect(cards).toEqual(["Phone size", "Originals"]);
    act(() => {
      fireEvent.click(
        within(card(dialog, "Phone size")).getByRole("button", {
          name: /Save/,
        }),
      );
    });
    expect(start).toHaveBeenCalledWith("host", {
      event_id: "evt-1",
      types: "photo",
      include_hidden: false,
      size: "phone",
    });
    expect(startDownload).not.toHaveBeenCalled();
  });
});

/* THE PANEL'S PIECES, AS A PICTURE OF IT DRAWS THEM (retired-mocks): the marketing site's Take it home composes the
   exported cards and the clips' line, so each must render, on its own, exactly what it renders inside the panel. */
describe("the exported pieces draw what the panel draws", () => {
  beforeEach(() => setViewportWidth(1440));

  it("each card and the clips' line, outside the panel, match the open panel's to the markup", async () => {
    const dialog = await open();
    const sizes = takeHomeSizes(SUMMARY);
    const alone = render(
      <div>
        <OriginalsCard sizes={sizes} pictures={PICTURES} desk act={null} />
        <PhoneSizeCard sizes={sizes} pictures={PICTURES} desk act={null} />
        <ClipsLine sizes={sizes} />
      </div>,
    ).container;
    for (const name of ["Originals", "Phone size"]) {
      const inPanel = card(dialog, name);
      const outside = alone.querySelector<HTMLElement>(
        `[data-set-card="${name}"]`,
      )!;
      // The card's frame, its picture and its words are the same markup; only the act is the caller's.
      expect(outside.getAttribute("class")).toBe(inPanel.getAttribute("class"));
      expect(outside.hasAttribute("data-lead")).toBe(
        inPanel.hasAttribute("data-lead"),
      );
      expect(outside.firstElementChild!.outerHTML).toBe(
        inPanel.firstElementChild!.outerHTML,
      );
      expect(
        outside.querySelector("[data-set-facts]")!.parentElement!.outerHTML,
      ).toBe(
        inPanel.querySelector("[data-set-facts]")!.parentElement!.outerHTML,
      );
    }
    expect(alone).toHaveTextContent(
      "Clips come as they were taken: 18 · 396 MB, with the originals.",
    );
  });

  it("while the sizes are asked, and once they could not be, the cards say so", () => {
    const { container } = render(
      <div>
        <OriginalsCard sizes={null} pictures={[]} desk act={null} />
        <PhoneSizeCard sizes={null} failed pictures={[]} desk act={null} />
        <ClipsLine sizes={null} />
      </div>,
    );
    const facts = [...container.querySelectorAll("[data-set-facts]")].map(
      (f) => f.textContent,
    );
    expect(facts).toEqual(["Adding it up", "Couldn't add it up"]);
    expect(container.querySelectorAll("p")).toHaveLength(0);
  });
});
