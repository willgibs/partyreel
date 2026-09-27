import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { QueueItem } from "@/lib/guest/use-upload-queue";

import {
  createUploadTrackerStore,
  UploadTracker,
  UploadTrackerButton,
  type UploadTrackerStore,
} from "./upload-tracker";

/**
 * HER TRACKER, DRAWN AND WIRED (`guest-capture` r1, Will's `tracker=button`: "the button could
 * have a little status icon ... to display the item count (number only) of pending items"). The
 * rules are `upload-tracker.test.ts`'s; pinned here is that the button sits only where she has
 * something sent at a moderated event and wears the waiting count, that her own rows are read at
 * mount and again at each opening (never on a timer), and that the list says where each stands.
 */
const { live } = vi.hoisted(() => ({
  live: {
    current: {
      serverIds: new Set<string>(),
      items: [] as { id: string; url: string; previewUrl?: string | null }[],
      pendingUrls: new Map<string, string>(),
      ensureLinks: vi.fn(),
    },
  },
}));
vi.mock("@/components/guest/gallery-live", () => ({
  useGalleryLive: () => live.current,
}));

const QR = "qr-token-1";
const TOKEN = "sess-token-of-real-length-0000";

function statuses(items: { id: string; status: string }[]) {
  vi.mocked(global.fetch).mockResolvedValue({
    ok: true,
    json: async () => ({ ok: true, items }),
  } as Response);
}

function mount(
  props: Partial<React.ComponentProps<typeof UploadTracker>> & {
    store?: UploadTrackerStore;
  } = {},
) {
  const store = props.store ?? createUploadTrackerStore();
  const onOpenChange = vi.fn();
  const utils = render(
    <>
      <UploadTrackerButton store={store} onOpen={() => onOpenChange(true)} />
      <UploadTracker
        store={store}
        queue={[]}
        qrToken={QR}
        sessionToken={TOKEN}
        isAuthed={false}
        moderated
        isDemo={false}
        isOwner={false}
        removedIds={new Set()}
        open={false}
        onOpenChange={onOpenChange}
        {...props}
      />
    </>,
  );
  return { ...utils, store, onOpenChange };
}

const tracker = () => screen.queryByRole("button", { name: /^Your uploads/ });

beforeEach(() => {
  vi.clearAllMocks();
  global.fetch = vi.fn();
  live.current.serverIds = new Set();
  live.current.items = [];
  live.current.pendingUrls = new Map();
});

describe("the button", () => {
  it("reads her rows once at mount, the ticket in the body, and wears what waits", async () => {
    statuses([
      { id: "m1", status: "pending" },
      { id: "m2", status: "pending" },
      { id: "m3", status: "approved" },
    ]);
    mount();
    await waitFor(() =>
      expect(tracker()).toHaveAccessibleName(
        "Your uploads, 2 waiting for the host",
      ),
    );
    expect(
      document.querySelector("[data-upload-tracker-count]")?.textContent,
    ).toBe("2");
    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [url, init] = vi.mocked(global.fetch).mock.calls[0];
    expect(url).toBe("/api/guests/mine");
    expect(JSON.parse((init as RequestInit).body as string)).toEqual({
      qr_token: QR,
      session_token: TOKEN,
      statuses: true,
    });
  });

  it("nothing waiting: the button stands with no badge", async () => {
    statuses([{ id: "m3", status: "approved" }]);
    mount();
    await waitFor(() => expect(tracker()).toHaveAccessibleName("Your uploads"));
    expect(document.querySelector("[data-upload-tracker-count]")).toBeNull();
  });

  it("nothing of hers sent: no button at all", async () => {
    statuses([]);
    mount();
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    expect(tracker()).toBeNull();
  });

  it("never at an event that does not hold uploads, in the demo, or for the host; and asks nothing there", () => {
    for (const props of [
      { moderated: false },
      { isDemo: true },
      { isOwner: true },
    ]) {
      const { unmount } = mount(props);
      expect(tracker()).toBeNull();
      unmount();
    }
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("her own file in the air, at a moderated event: the button stands at once, counting nothing yet", () => {
    statuses([]);
    const queue: QueueItem[] = [
      {
        id: "q1",
        file: new File(["x"], "a.jpg", { type: "image/jpeg" }),
        kind: "photo",
        status: "uploading",
        progress: 10,
      },
    ];
    mount({ queue });
    expect(tracker()).toHaveAccessibleName("Your uploads");
  });

  it("★ an approval reaches the badge live through the album's own sync, with no new read", async () => {
    statuses([{ id: "m1", status: "pending" }]);
    const view = mount();
    await waitFor(() =>
      expect(tracker()).toHaveAccessibleName(
        "Your uploads, 1 waiting for the host",
      ),
    );
    live.current.serverIds = new Set(["m1"]);
    view.rerender(
      <>
        <UploadTrackerButton store={view.store} onOpen={() => {}} />
        <UploadTracker
          store={view.store}
          queue={[]}
          qrToken={QR}
          sessionToken={TOKEN}
          isAuthed={false}
          moderated
          isDemo={false}
          isOwner={false}
          removedIds={new Set()}
          open={false}
          onOpenChange={() => {}}
        />
      </>,
    );
    await waitFor(() => expect(tracker()).toHaveAccessibleName("Your uploads"));
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it("opens the list", async () => {
    statuses([{ id: "m1", status: "pending" }]);
    const { onOpenChange } = mount();
    await waitFor(() => expect(tracker()).not.toBeNull());
    fireEvent.click(tracker()!);
    expect(onOpenChange).toHaveBeenCalledWith(true);
  });
});

describe("the list", () => {
  it("says where each of hers stands, and reads her rows again as it opens", async () => {
    statuses([
      { id: "m1", status: "pending" },
      { id: "m2", status: "refused" },
      { id: "m3", status: "approved" },
    ]);
    live.current.items = [
      { id: "m3", url: "https://r2.example/m3.jpg", previewUrl: null },
    ];
    live.current.serverIds = new Set(["m3"]);
    const view = mount();
    await waitFor(() => expect(tracker()).not.toBeNull());
    expect(global.fetch).toHaveBeenCalledTimes(1);

    act(() => {
      view.rerender(
        <>
          <UploadTrackerButton store={view.store} onOpen={() => {}} />
          <UploadTracker
            store={view.store}
            queue={[]}
            qrToken={QR}
            sessionToken={TOKEN}
            isAuthed={false}
            moderated
            isDemo={false}
            isOwner={false}
            removedIds={new Set()}
            open
            onOpenChange={() => {}}
          />
        </>,
      );
    });
    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(2));
    expect(screen.getByText("Your uploads")).toBeInTheDocument();
    const rows = [
      ...document.querySelectorAll("[data-upload-tracker-row]"),
    ].map((row) => row.getAttribute("data-upload-tracker-row"));
    expect(rows).toEqual(["waiting", "refused", "approved"]);
    expect(screen.getByText("Waiting for the host")).toBeInTheDocument();
    expect(screen.getByText("Not in the album")).toBeInTheDocument();
    expect(screen.getByText("In the album")).toBeInTheDocument();
    // The album's own link draws what is in it; nothing else is ever presigned for a guest.
    expect(
      document.querySelector('[data-upload-tracker-row="approved"] img'),
    ).toHaveAttribute("src", "https://r2.example/m3.jpg");
    expect(
      document.querySelector('[data-upload-tracker-row="waiting"] img'),
    ).toBeNull();
    expect(live.current.ensureLinks).toHaveBeenCalledWith(["m3"]);
  });

  it("a signed-in guest's account speaks for its rows: no ticket needed to ask", async () => {
    statuses([{ id: "m1", status: "pending" }]);
    mount({ sessionToken: null, isAuthed: true });
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    const [, init] = vi.mocked(global.fetch).mock.calls[0];
    expect(JSON.parse((init as RequestInit).body as string)).toEqual({
      qr_token: QR,
      statuses: true,
    });
  });
});
