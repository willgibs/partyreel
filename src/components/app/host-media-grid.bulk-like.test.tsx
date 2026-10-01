import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { GridMedia } from "@/components/app/media-grid";

/**
 * THE ALBUM'S BULK LIKE NAMES WHAT IT LIKED (crumbs-28, from `reel-and-copy`). Its toast said "Liked 1 photo" for a
 * selection that held a video, since it counted with "photo" hand-written. It names what the like added now, by kind
 * ("1 video", "2 items" for a mix, the album's own word for one, as the storage list's), through the one count of
 * known kinds (`formatKindCount`), and counts only what the like added: an item already liked is not liked again.
 *
 * ★ AND A PRESS THAT ADDED NOTHING STILL SAYS WHAT HAPPENED (build 33's red-team, a NIT). A selection she had liked
 * already closed with no word at all, so the press looked lost: it says "Already liked" in the success's own words
 * now, and a like the server refused says so as the heart's own refusal does.
 *
 * The grid's selection, likes and toast are real (the in-memory likes store the lab's scale page uses; a refusal
 * needs a store the server can refuse, so one test hands in its own); the rows it lays, the hub's writes and the
 * export are not what is pinned here.
 */
const toast = vi.hoisted(() =>
  Object.assign(vi.fn(), {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  }),
);
vi.mock("sonner", () => ({ toast }));
/** A likes store the test hands in instead of the provider's (null: the real in-memory one). */
const likesOverride = vi.hoisted(() => ({
  value: null as null | {
    isLiked: (id: string) => boolean;
    likeMany: (ids: string[]) => Promise<string[]>;
  },
}));
vi.mock("@/components/likes/likes-provider", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/components/likes/likes-provider")>();
  return {
    ...actual,
    useLikes: () => likesOverride.value ?? actual.useLikes(),
  };
});
vi.mock("@/components/shared/masonry", () => ({
  MasonryColumns: () => <div data-testid="grid" />,
}));
vi.mock("@/components/app/event-feed/host-album", () => ({
  useHubWrites: () => ({
    setStatus: vi.fn(async () => ({ ok: true as const })),
    remove: vi.fn(async () => ({ ok: true as const })),
    setStatusBulk: vi.fn(async () => ({ ok: true as const })),
    removeBulk: vi.fn(async () => ({ ok: true as const })),
  }),
}));
vi.mock("@/components/app/export/use-export-download", () => ({
  useExportDownload: () => ({ startDownload: vi.fn() }),
}));
vi.mock("@/components/likes/like-button", () => ({
  useLikeAction: () => () => null,
}));

const { HostMediaGrid } = await import("@/components/app/host-media-grid");
const { HostSelectionProvider, useHostSelection } =
  await import("@/components/app/host-selection-provider");
const { LocalLikesProvider } =
  await import("@/components/likes/likes-provider");

const item = (id: string, type: GridMedia["type"]): GridMedia => ({
  id,
  type,
  url: `https://r2.test/o/${id}`,
  previewUrl: `https://r2.test/t/${id}`,
  width: 640,
  height: 480,
  status: "approved",
});
const ALBUM = [item("p1", "photo"), item("v1", "video"), item("p2", "photo")];

/** The bar's two presses, as the header's BulkBar makes them: select these, then Like. */
function Bar({ ids }: { ids: string[] }) {
  const selection = useHostSelection();
  return (
    <>
      <button
        type="button"
        onClick={() => {
          selection?.enterSelect(ids[0]);
          for (const id of ids.slice(1)) selection?.toggle(id);
        }}
      >
        select
      </button>
      <button type="button" onClick={() => selection?.run("like")}>
        like
      </button>
    </>
  );
}

async function likeSelection(ids: string[], alreadyLiked: string[] = []) {
  render(
    <LocalLikesProvider initialLikedIds={alreadyLiked}>
      <HostSelectionProvider>
        <HostMediaGrid eventId="evt" items={ALBUM} selectable />
        <Bar ids={ids} />
      </HostSelectionProvider>
    </LocalLikesProvider>,
  );
  fireEvent.click(screen.getByText("select"));
  await act(async () => {
    fireEvent.click(screen.getByText("like"));
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  likesOverride.value = null;
});

describe("the album's bulk Like", () => {
  it("★ calls a video a video", async () => {
    await likeSelection(["v1"]);
    expect(toast.success).toHaveBeenCalledWith("Liked 1 video");
  });

  it("★ names a mix by the album's word for one, never 'photos'", async () => {
    await likeSelection(["p1", "v1", "p2"]);
    expect(toast.success).toHaveBeenCalledWith("Liked 3 items");
  });

  it("names what the like added, leaving out what was liked already", async () => {
    await likeSelection(["p1", "v1"], ["v1"]);
    expect(toast.success).toHaveBeenCalledWith("Liked 1 photo");
    expect(toast).not.toHaveBeenCalled();
  });

  // Reshaped on purpose (build 33's red-team): this pinned the silence, "says nothing when nothing was added",
  // which is the NIT itself. The scar it kept stays: a like already there is never counted as liked again.
  it("★ says a selection it had liked already is liked already, never that it liked it", async () => {
    await likeSelection(["p1"], ["p1"]);
    expect(toast).toHaveBeenCalledWith("Already liked 1 photo");
    expect(toast.success).not.toHaveBeenCalled();
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("names what was liked already by kind, as the success does", async () => {
    await likeSelection(["p1", "v1"], ["p1", "v1"]);
    expect(toast).toHaveBeenCalledWith("Already liked 2 items");
  });
});

describe("the album's bulk Like, refused", () => {
  function refusing(likedAlready: string[]) {
    likesOverride.value = {
      isLiked: (id) => likedAlready.includes(id),
      // The server refused every id it was asked to like (a network drop, a removed item).
      likeMany: async () => [],
    };
  }

  it("★ says a like the server refused, in the heart's own words, never 'Already liked'", async () => {
    refusing([]);
    await likeSelection(["p1"]);
    expect(toast.error).toHaveBeenCalledWith("Couldn't save that like.");
    expect(toast).not.toHaveBeenCalled();
  });

  it("counts only what it asked for: a selection partly liked already, the rest refused", async () => {
    refusing(["p1"]);
    await likeSelection(["p1", "v1", "p2"]);
    expect(toast.error).toHaveBeenCalledWith("Couldn't save those likes.");
    expect(toast.success).not.toHaveBeenCalled();
  });
});
