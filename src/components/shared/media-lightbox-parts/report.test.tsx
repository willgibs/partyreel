/**
 * A PHOTO'S OWN REPORT (admin-triage r2: "A photo can be reported"): the viewer's capsule asks the album's one
 * report form for this photograph, through `report-door.ts`. The rules pinned:
 *
 *  - ★ it is drawn only where a report form listens (the guest's album): the host's album, the dashboard's
 *    feeds and every other viewer draw none, so the control never promises a form nothing will open;
 *  - pressed, it names the photograph shown (its id, its kind, a picture of it) and nothing else;
 *  - never on the host's own viewer (her curate group removes it in one tap), never on the viewer's own upload
 *    (her Delete is beside it), and never in the bin.
 */
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { GridMedia } from "@/components/app/media-grid";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  onPhotoReportRequest,
  type PhotoReportRequest,
} from "@/lib/guest/report-door";

import { MediaLightbox } from "../media-lightbox";

const ITEMS: GridMedia[] = [
  {
    id: "p1",
    type: "photo",
    url: "https://r2.test/p1.jpg",
    previewUrl: "https://r2.test/p1-preview.jpg",
    downloadUrl: "https://r2.test/d1.jpg",
  },
  {
    id: "v1",
    type: "video",
    url: "https://r2.test/v1.mp4",
    downloadUrl: "https://r2.test/dv1.mp4",
  },
];

// jsdom plays no media: the clip's play and pause are stubs, as the viewer's own pins stub them.
Object.defineProperty(HTMLMediaElement.prototype, "play", {
  configurable: true,
  value: () => Promise.resolve(),
});
Object.defineProperty(HTMLMediaElement.prototype, "pause", {
  configurable: true,
  value: () => {},
});

let unsubscribe: (() => void) | null = null;

afterEach(() => {
  unsubscribe?.();
  unsubscribe = null;
  cleanup();
});

function listen() {
  const heard: PhotoReportRequest[] = [];
  unsubscribe = onPhotoReportRequest((r) => heard.push(r));
  return heard;
}

function mount(
  index = 0,
  extra?: Partial<Parameters<typeof MediaLightbox>[0]>,
) {
  return render(
    <TooltipProvider>
      <MediaLightbox
        items={ITEMS}
        index={index}
        onClose={() => {}}
        onIndexChange={() => {}}
        {...extra}
      />
    </TooltipProvider>,
  );
}

describe("a photo's own Report", () => {
  it("★ is drawn only where a report form listens", () => {
    mount();
    expect(screen.queryByRole("button", { name: /^report this/i })).toBeNull();
    cleanup();
    listen();
    mount();
    expect(
      screen.getByRole("button", { name: "Report this photo" }),
    ).toBeInTheDocument();
  });

  it("names the photograph shown, and a video as a video", () => {
    const heard = listen();
    mount(0);
    fireEvent.click(screen.getByRole("button", { name: "Report this photo" }));
    expect(heard).toEqual([
      {
        mediaId: "p1",
        type: "photo",
        previewUrl: "https://r2.test/p1-preview.jpg",
      },
    ]);
    cleanup();
    mount(1);
    fireEvent.click(screen.getByRole("button", { name: "Report this video" }));
    expect(heard[1]).toMatchObject({ mediaId: "v1", type: "video" });
  });

  it("★ is never drawn for the host, on the viewer's own upload, or in the bin", () => {
    listen();
    mount(0, { viewerIsHost: true, onSetStatus: vi.fn() });
    expect(screen.queryByRole("button", { name: /^report this/i })).toBeNull();
    cleanup();
    mount(0, { onDeleteCurrent: vi.fn(), canDelete: () => true });
    expect(screen.queryByRole("button", { name: /^report this/i })).toBeNull();
    cleanup();
    mount(0, { onRestore: vi.fn(), onPurge: vi.fn() });
    expect(screen.queryByRole("button", { name: /^report this/i })).toBeNull();
    cleanup();
    // Someone else's upload on a surface that deletes only her own: the Report is back.
    mount(0, { onDeleteCurrent: vi.fn(), canDelete: () => false });
    expect(
      screen.getByRole("button", { name: "Report this photo" }),
    ).toBeInTheDocument();
  });
});
