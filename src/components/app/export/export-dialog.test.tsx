/**
 * THE DOWNLOAD MENU (`export-dialog.tsx`), as `export-flow` r1 left it: Yours at the top for a guest
 * who has something here (`means=mine`, the server's own count), every row live however big the
 * album (`cap=split`: the walk takes it in parts, and no label says "zips"), and a note that says
 * where the file goes on this device (`phone`: Files on an iPhone, with the way into Photos).
 */
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ExportDialog } from "@/components/app/export/export-dialog";
import type { ExportSummary } from "@/lib/export/build-manifest";

const fetchSummary = vi.fn();
const startDownload = vi.fn();
vi.mock("@/components/app/export/use-export-download", () => ({
  useExportDownload: () => ({ fetchSummary, startDownload }),
}));

const MB = 1024 * 1024;
const summary = (
  photos: number,
  videos: number,
  hidden = 0,
): ExportSummary => ({
  shown: {
    photo: { count: photos, bytes: photos * 4 * MB },
    video: { count: videos, bytes: videos * 90 * MB },
  },
  hidden: {
    photo: { count: hidden, bytes: hidden * MB },
    video: { count: 0, bytes: 0 },
  },
});

const DESK_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36";
const IPHONE_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
const ANDROID_UA =
  "Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Mobile Safari/537.36";

function useAgent(ua: string) {
  Object.defineProperty(window.navigator, "userAgent", {
    value: ua,
    configurable: true,
  });
}

async function openMenu(scope: "guest" | "host") {
  render(
    <ExportDialog scope={scope} albumKey="key-1" isHost={scope === "host"}>
      <button type="button">Download all</button>
    </ExportDialog>,
  );
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "Download all" }));
  });
  await waitFor(() =>
    expect(screen.getByRole("menu")).not.toHaveTextContent("Adding it up"),
  );
  return screen.getByRole("menu");
}

const rowLabels = () =>
  screen.getAllByRole("menuitem").map((r) => r.textContent ?? "");

beforeEach(() => {
  vi.clearAllMocks();
  useAgent(DESK_UA);
  startDownload.mockResolvedValue(true);
});
afterEach(() => {
  useAgent(DESK_UA);
});

describe("Yours (means=mine)", () => {
  it("leads a guest's menu with her own count and size, and takes her set", async () => {
    fetchSummary.mockResolvedValue({
      summary: summary(126, 22),
      yours: summary(11, 3),
    });
    await openMenu("guest");

    expect(fetchSummary).toHaveBeenCalledWith("guest", { qr_token: "key-1" });
    const labels = rowLabels();
    expect(labels[0]).toMatch(/^Yours14 · /);
    expect(labels.slice(1).map((l) => l.replace(/[\d,. ·A-Z]+B$/, ""))).toEqual(
      ["Everything", "Photos", "Videos"],
    );

    fireEvent.click(screen.getAllByRole("menuitem")[0]);
    expect(startDownload).toHaveBeenCalledWith("guest", {
      qr_token: "key-1",
      types: "all",
      set: "yours",
    });
  });

  it("is not drawn when nothing here is hers", async () => {
    fetchSummary.mockResolvedValue({ summary: summary(12, 0), yours: null });
    await openMenu("guest");
    expect(rowLabels().some((l) => l.startsWith("Yours"))).toBe(false);
  });

  it("never reaches a host's menu", async () => {
    fetchSummary.mockResolvedValue({
      summary: summary(12, 0),
      yours: summary(2, 0),
    });
    await openMenu("host");
    expect(rowLabels().some((l) => l.startsWith("Yours"))).toBe(false);
  });
});

describe("the limit (cap=split)", () => {
  it("keeps a row past 2,000 items live, says the parts only in the note, and takes the lot", async () => {
    fetchSummary.mockResolvedValue({
      summary: summary(2280, 160),
      yours: null,
    });
    const menu = await openMenu("host");

    const everything = screen.getAllByRole("menuitem")[0];
    expect(everything).toHaveTextContent(/^Everything2,440 · /);
    expect(everything).not.toBeDisabled();
    expect(menu).not.toHaveTextContent(/zips?\b/i);
    expect(menu).toHaveTextContent(
      "Each downloads as one file, a big album in parts.",
    );

    fireEvent.click(everything);
    expect(startDownload).toHaveBeenCalledWith("host", {
      event_id: "key-1",
      types: "all",
      include_hidden: false,
    });
  });

  it("says nothing of parts when every row fits in one", async () => {
    fetchSummary.mockResolvedValue({ summary: summary(126, 22), yours: null });
    const menu = await openMenu("guest");
    expect(menu).toHaveTextContent("Each downloads as one file.");
    expect(menu).not.toHaveTextContent("parts");
  });

  it("still leaves an empty row dead", async () => {
    fetchSummary.mockResolvedValue({ summary: summary(12, 0), yours: null });
    await openMenu("guest");
    expect(screen.getAllByRole("menuitem")[2]).toBeDisabled();
  });
});

describe("where it lands (phone)", () => {
  it("tells an iPhone its Files app, and a photograph's way into Photos", async () => {
    useAgent(IPHONE_UA);
    fetchSummary.mockResolvedValue({ summary: summary(126, 22), yours: null });
    const menu = await openMenu("guest");
    expect(menu).toHaveTextContent(
      "Each saves to your Files app. To keep a photo in Photos, open it and tap Save.",
    );
  });

  it("tells an Android phone its Downloads", async () => {
    useAgent(ANDROID_UA);
    fetchSummary.mockResolvedValue({ summary: summary(126, 22), yours: null });
    const menu = await openMenu("guest");
    expect(menu).toHaveTextContent("Each saves to your Downloads.");
  });

  it("says it could not add up when the summary never came", async () => {
    fetchSummary.mockResolvedValue(null);
    const menu = await openMenu("guest");
    expect(menu).toHaveTextContent("Couldn't add it up. Close and try again.");
    for (const row of screen.getAllByRole("menuitem"))
      expect(row).toBeDisabled();
  });
});
