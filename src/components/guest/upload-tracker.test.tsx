import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { waitRule } from "@/lib/disposable/wait-words";
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
const action = vi.hoisted(() => ({ remove: vi.fn() }));
vi.mock("@/app/(guest)/e/[token]/actions", () => ({
  removeMyUploadGuestAction: (id: string) => action.remove(id),
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
      expect(tracker()).toHaveAccessibleName("Your uploads, 2 developing"),
    );
    expect(
      document.querySelector("[data-upload-tracker-count]")?.textContent,
    ).toBe("2");
    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [url, init] = vi.mocked(global.fetch).mock.calls[0];
    expect(url).toBe("/api/guests/mine");
    // `tell` (crumbs-38): every read of hers also asks for her news, and marks it told.
    expect(JSON.parse((init as RequestInit).body as string)).toEqual({
      qr_token: QR,
      session_token: TOKEN,
      statuses: true,
      tell: true,
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

  // ★ RESHAPED (voice-wiring). This pinned "with no new read": an approval moved the badge through
  // the album's sync and her rows were never asked again. voice-guest r2's carried `refusal-read`
  // made an arrival re-read her rows (the next test), so that half expired. The scar kept is the
  // live half: the badge moves on the album's own sync, before any read of her rows answers.
  it("★ an approval reaches the badge live through the album's own sync, before her rows answer", async () => {
    statuses([{ id: "m1", status: "pending" }]);
    const view = mount();
    await waitFor(() =>
      expect(tracker()).toHaveAccessibleName("Your uploads, 1 developing"),
    );
    // Her rows' next read never answers: whatever moves the badge now is the album's.
    vi.mocked(global.fetch).mockReturnValue(new Promise<Response>(() => {}));
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
  });

  // voice-guest r2's carried `refusal-read`: a host decides a pick in one go, so the arrival of one
  // of hers re-reads her rows, and the one left out beside it stops counting without an opening.
  it("★ one of hers arriving in the album re-reads her rows, so the one left out stops counting", async () => {
    statuses([
      { id: "m1", status: "pending" },
      { id: "m2", status: "pending" },
    ]);
    const view = mount();
    await waitFor(() =>
      expect(tracker()).toHaveAccessibleName("Your uploads, 2 developing"),
    );
    expect(global.fetch).toHaveBeenCalledTimes(1);
    // Maya lets m1 in and leaves m2 out; the album's sync brings m1, and only her rows say m2.
    statuses([
      { id: "m1", status: "approved" },
      { id: "m2", status: "refused" },
    ]);
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
    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(tracker()).toHaveAccessibleName("Your uploads"));
    expect(document.querySelector("[data-upload-tracker-count]")).toBeNull();
  });

  it("what her first read says is in the album is no arrival: nothing is read again", async () => {
    statuses([
      { id: "m1", status: "approved" },
      { id: "m2", status: "pending" },
    ]);
    live.current.serverIds = new Set(["m1"]);
    mount();
    await waitFor(() =>
      expect(tracker()).toHaveAccessibleName("Your uploads, 1 developing"),
    );
    // Give a stray re-read the chance to fire before saying it did not.
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
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
    // `model=time` (the-wait r1): a held one is developing, a refused one keeps its plain word.
    expect(screen.getByText("Developing")).toBeInTheDocument();
    expect(screen.getByText("Not approved")).toBeInTheDocument();
    expect(screen.getByText("In the album")).toBeInTheDocument();
    // The album's own link draws what is in it; nothing else is ever presigned for a guest.
    expect(
      document.querySelector('[data-upload-tracker-row="approved"] img'),
    ).toHaveAttribute("src", "https://r2.example/m3.jpg");
    expect(
      document.querySelector('[data-upload-tracker-row="waiting"] img'),
    ).toBeNull();
    expect(live.current.ensureLinks).toHaveBeenCalledWith(["m3"]);
    // help-center r1 `from-product=contextual`: the refused row, and only it, links to the
    // section that says what "Not approved" means, in a new tab so her list stays put.
    const why = document.querySelectorAll("[data-upload-tracker-why]");
    expect(why).toHaveLength(1);
    expect(why[0].closest("[data-upload-tracker-row]")).toHaveAttribute(
      "data-upload-tracker-row",
      "refused",
    );
    expect(why[0]).toHaveAttribute(
      "href",
      "/help/a-photo-is-missing-from-the-album#the-host-turned-it-down-hid-or-removed-it",
    );
    expect(why[0]).toHaveAttribute("target", "_blank");
    expect(why[0]).toHaveAccessibleName(/why\? what not approved means/i);
  });

  it("a signed-in guest's account speaks for its rows: no ticket needed to ask", async () => {
    statuses([{ id: "m1", status: "pending" }]);
    mount({ sessionToken: null, isAuthed: true });
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    const [, init] = vi.mocked(global.fetch).mock.calls[0];
    expect(JSON.parse((init as RequestInit).body as string)).toEqual({
      qr_token: QR,
      statuses: true,
      tell: true,
    });
  });
});

/**
 * ★ WHAT WAITS FOR THE HOST IS STILL HERS TO TAKE BACK (Will's live walk, 2026-10-02: "Definitely need a way to
 * delete pending uploads ... where something may have been a mistake"). Each of hers not yet in the album wears a
 * Remove on the album's own delete paths (the account's Server Function, the ticket's route), says so while it
 * works, leaves her list through the page's own record when the server agrees, and offers Try again when it
 * does not. Nothing in the album, or still sending, has one: the album's own Delete is that door.
 */
/* ★ RED-TEAM 43'S MEDIUM: on an album with a develop time ahead, her own shots are approved and sealed until it
   develops; her rows' read says so (`sealed: true`), and each waits, counted, hers to take back, under the album's
   sentence for the develop, never "In the album". RESHAPED (the-wait r1, `model=time`): its own words were "Waiting to
   develop" apart from approval's; every wait is "Developing" now, and the album's clock (the head's rule) tells them
   apart. The scar kept: never "In the album", counted, removable. */
describe("the develop", () => {
  it("★ her sealed shots are developing: counted, never in the album, and hers to take back", async () => {
    const ahead = "2026-10-03T13:00:00.000Z";
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        ok: true,
        items: [
          { id: "m1", status: "approved", sealed: true },
          { id: "m2", status: "approved", sealed: true },
        ],
      }),
    } as Response);
    const view = mount({ developsAt: ahead });
    await waitFor(() =>
      expect(tracker()).toHaveAccessibleName("Your uploads, 2 developing"),
    );
    expect(
      document.querySelector("[data-upload-tracker-count]")?.textContent,
    ).toBe("2");

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
            developsAt={ahead}
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
    const rows = [
      ...document.querySelectorAll("[data-upload-tracker-row]"),
    ].map((row) => row.getAttribute("data-upload-tracker-row"));
    expect(rows).toEqual(["waiting", "waiting"]);
    expect(screen.getAllByText("Developing")).toHaveLength(2);
    expect(screen.queryByText("In the album")).toBeNull();
    expect(
      screen.getAllByRole("button", { name: "Remove this upload" }),
    ).toHaveLength(2);
    // The album's one rule, in the wait's words (`wait-words.ts`), the time in her own clock.
    expect(
      screen.getByText(
        waitRule({ kind: "develop", developsAt: ahead }, Date.now()),
      ),
    ).toBeInTheDocument();
  });

  /* ★ THE-WAIT R1, `wait=sheet`: her waiting shots light up on the album's contact sheet, each with the picture her
     rows' read presigned for her alone and when she took it; the tracker publishes them, the sheet reads them. */
  it("★ publishes her waiting shots, with her own pictures, for the album's contact sheet", async () => {
    const ahead = "2026-12-03T13:00:00.000Z";
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        ok: true,
        items: [
          {
            id: "m1",
            status: "approved",
            sealed: true,
            picture: {
              type: "photo",
              at: 1_790_000_000_000,
              tile: "https://r2.example/m1-tile.webp",
            },
          },
          { id: "m2", status: "approved" },
        ],
      }),
    } as Response);
    live.current.serverIds = new Set(["m2"]);
    const view = mount({ developsAt: ahead });
    await waitFor(() => expect(view.store.hers.get()).toHaveLength(1));
    expect(view.store.hers.get()[0]).toEqual({
      key: "m1",
      at: 1_790_000_000_000,
      src: "https://r2.example/m1-tile.webp",
      video: false,
      sending: false,
    });
    live.current.serverIds = new Set();
  });
});

describe("taking one of hers back", () => {
  /** The list open over her rows: m1 held, m3 in the album. */
  async function openList(
    over: {
      isAuthed?: boolean;
      sessionToken?: string | null;
      removedIds?: ReadonlySet<string>;
      onOwnRemoved?: (id: string, remaining: number) => void;
    } = {},
  ) {
    statuses([
      { id: "m1", status: "pending" },
      { id: "m3", status: "approved" },
    ]);
    live.current.serverIds = new Set(["m3"]);
    const store = createUploadTrackerStore();
    const tree = (removedIds: ReadonlySet<string>) => (
      <UploadTracker
        store={store}
        queue={[]}
        qrToken={QR}
        sessionToken={
          over.sessionToken === undefined ? TOKEN : over.sessionToken
        }
        isAuthed={over.isAuthed ?? false}
        moderated
        isDemo={false}
        isOwner={false}
        removedIds={removedIds}
        onOwnRemoved={over.onOwnRemoved}
        open
        onOpenChange={() => {}}
      />
    );
    const view = render(tree(over.removedIds ?? new Set()));
    await waitFor(() =>
      expect(
        document.querySelector('[data-upload-tracker-row="waiting"]'),
      ).not.toBeNull(),
    );
    return {
      ...view,
      rerenderRemoved: (ids: ReadonlySet<string>) => view.rerender(tree(ids)),
    };
  }
  const removes = () => [
    ...document.querySelectorAll("[data-upload-tracker-remove]"),
  ];

  it("★ offers a Remove on what waits for the host, and only there", async () => {
    await openList();
    const buttons = removes();
    expect(buttons).toHaveLength(1);
    expect(buttons[0]!.closest("[data-upload-tracker-row]")).toHaveAttribute(
      "data-upload-tracker-row",
      "waiting",
    );
    expect(buttons[0]).toHaveAccessibleName("Remove this upload");
  });

  it("★ a guest's ticket takes it back on the ticket's route, the ticket in the body", async () => {
    const onOwnRemoved = vi.fn();
    const view = await openList({ onOwnRemoved });
    vi.mocked(global.fetch).mockResolvedValueOnce({ ok: true } as Response);
    await act(async () => {
      fireEvent.click(removes()[0]!);
    });
    const call = vi
      .mocked(global.fetch)
      .mock.calls.find(([url]) => url === "/api/guests/remove")!;
    expect(JSON.parse((call[1] as RequestInit).body as string)).toEqual({
      qr_token: QR,
      session_token: TOKEN,
      media_id: "m1",
    });
    expect(onOwnRemoved).toHaveBeenCalledWith("m1", expect.any(Number));
    expect(action.remove).not.toHaveBeenCalled();
    // The page records it (`removedIds`), and her list forgets it.
    view.rerenderRemoved(new Set(["m1"]));
    expect(
      document.querySelector('[data-upload-tracker-row="waiting"]'),
    ).toBeNull();
  });

  it("an account takes it back through its own Server Function", async () => {
    action.remove.mockResolvedValueOnce({ ok: true });
    const onOwnRemoved = vi.fn();
    await openList({ isAuthed: true, sessionToken: null, onOwnRemoved });
    await act(async () => {
      fireEvent.click(removes()[0]!);
    });
    expect(action.remove).toHaveBeenCalledWith("m1");
    expect(onOwnRemoved).toHaveBeenCalledWith("m1", expect.any(Number));
  });

  it("★ says so while it works, and stays with a Try again when the server refuses", async () => {
    const onOwnRemoved = vi.fn();
    await openList({ onOwnRemoved });
    let answer!: (r: Response) => void;
    vi.mocked(global.fetch).mockReturnValueOnce(
      new Promise<Response>((resolve) => {
        answer = resolve;
      }),
    );
    await act(async () => {
      fireEvent.click(removes()[0]!);
    });
    const row = () =>
      document.querySelector('[data-upload-tracker-row="waiting"]')!;
    expect(row()).toHaveAttribute("data-removing", "working");
    expect(removes()[0]).toBeDisabled();
    expect(removes()[0]).toHaveTextContent("Removing");
    await act(async () => {
      answer({ ok: false } as Response);
    });
    expect(row()).toHaveAttribute("data-removing", "failed");
    expect(row()).toHaveTextContent("Couldn't remove it");
    expect(removes()[0]).toHaveAccessibleName("Try removing this upload again");
    expect(onOwnRemoved).not.toHaveBeenCalled();
    // Try again is the same act.
    vi.mocked(global.fetch).mockResolvedValueOnce({ ok: true } as Response);
    await act(async () => {
      fireEvent.click(removes()[0]!);
    });
    expect(onOwnRemoved).toHaveBeenCalledWith("m1", expect.any(Number));
  });
});

/**
 * ★ HER NEWS, HANDED TO THE TOAST (crumbs-38, the approval toast's server half). Every read of hers asks `tell`; the
 * ids the server answers as news land in the store's own news channel, once each, where the album's approval toast
 * reads them, and the button never re-renders for it. A failed read hands nothing (and is marked nothing).
 */
describe("her news", () => {
  function answer(body: Record<string, unknown>) {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true, ...body }),
    } as Response);
  }

  it("★ the server's news lands in the store, once each, across the visit's reads", async () => {
    answer({ items: [{ id: "m1", status: "approved" }], news: ["m1"] });
    const { store, rerender } = mount();
    await waitFor(() => expect(store.news.get()).toEqual(["m1"]));
    // A later read (its opening) answering the same and one more adds only the new one.
    answer({
      items: [
        { id: "m1", status: "approved" },
        { id: "m2", status: "approved" },
      ],
      news: ["m2", "m1"],
    });
    rerender(
      <>
        <UploadTrackerButton store={store} onOpen={() => {}} />
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
          open
          onOpenChange={() => {}}
        />
      </>,
    );
    await waitFor(() => expect(store.news.get()).toEqual(["m1", "m2"]));
  });

  it("a failed read, or one with no news, hands nothing", async () => {
    vi.mocked(global.fetch).mockResolvedValue({ ok: false } as Response);
    const { store } = mount();
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    expect(store.news.get()).toEqual([]);
    answer({ items: [{ id: "m1", status: "approved" }] });
    const second = mount();
    await waitFor(() => expect(tracker()).not.toBeNull());
    expect(second.store.news.get()).toEqual([]);
  });

  it("the store tells its listeners only when the news grows", () => {
    const store = createUploadTrackerStore();
    const heard = vi.fn();
    store.news.subscribe(heard);
    store.news.add([]);
    store.news.add(["m1"]);
    store.news.add(["m1"]);
    expect(heard).toHaveBeenCalledTimes(1);
    const before = store.news.get();
    store.news.add(["m1"]);
    // The same list object while nothing changed: a reader's snapshot holds still.
    expect(store.news.get()).toBe(before);
  });
});
