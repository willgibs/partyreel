/**
 * THE GUESTS ROOM OVER THE HUB DRAWS THE NEWEST READ THERE IS (event-header r2, `rooms=over`).
 *
 * The room stands in the one panel on the hub's address, and its rows come from two reads of one function
 * (`room.server.ts`): the hub's own render whenever its address names the room (a link, a reload, and each act in the
 * room, whose action revalidates the hub), and the room's own ask when a card opened it in place (a press writes the
 * address without the server). Pinned: a fresh served read is the answer at once and asks nothing; a press with
 * nothing served asks, the room's shimmer standing until it lands; a newer served read wins over an older ask; a read
 * that fails says so with Try again rather than drawing an empty room; and the section a link named is handed over.
 */
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { GuestsRoomData } from "@/app/(app)/dashboard/[eventId]/guests/room.server";

const readGuestsRoomAction = vi.hoisted(() => vi.fn());
vi.mock("@/app/(app)/dashboard/[eventId]/actions", () => ({
  readGuestsRoomAction,
}));
// The room itself is its own tests'; here it says what it was handed.
vi.mock("./room-chunks", () => ({
  loadGuestsRoom: async () => ({
    GuestsRoom: ({
      data,
      anchor,
    }: {
      data: GuestsRoomData;
      anchor: string | null;
    }) => (
      <p data-testid="room">
        {`${data.items.length} guests, read at ${data.readAt}, anchor ${anchor ?? "none"}`}
      </p>
    ),
  }),
}));
const takeAnchor = vi.hoisted(() => vi.fn<() => string | null>(() => null));
vi.mock("./event-share-provider", () => ({
  useEventShare: () => ({ openSheet: vi.fn(), takeAnchor }),
}));

const { GuestsPanel } = await import("./guests-panel");

const room = (n: number, readAt: number): GuestsRoomData => ({
  readAt,
  items: Array.from({ length: n }, (_, i) => ({
    kind: "unverified",
    id: `g${i}`,
    displayName: `Guest ${i}`,
  })) as unknown as GuestsRoomData["items"],
  waiting: 0,
  emails: [],
  atTheDoor: [],
  doorTotal: 0,
  invited: [],
  blocked: [],
});

let event = 0;
function panel(served: GuestsRoomData | null, eventId = `e${++event}`) {
  const ui = (s: GuestsRoomData | null) => (
    <GuestsPanel
      open
      onOpenChange={vi.fn()}
      eventId={eventId}
      eventName="Maya & Jay"
      joinUrl="https://partyreel.test/e/abc"
      qrStyle="classic"
      door="open"
      served={s}
    />
  );
  const view = render(ui(served));
  return { ...view, serve: (s: GuestsRoomData | null) => view.rerender(ui(s)) };
}

beforeEach(() => {
  readGuestsRoomAction.mockReset();
  takeAnchor.mockReset().mockReturnValue(null);
});

describe("the Guests room's rows", () => {
  it("★ a fresh read the hub's render brought is the room at once, and asks nothing", async () => {
    panel(room(3, Date.now()));
    expect(await screen.findByTestId("room")).toHaveTextContent("3 guests");
    expect(readGuestsRoomAction).not.toHaveBeenCalled();
  });

  it("★ a card's press with nothing served asks for the room, its shimmer standing meanwhile", async () => {
    let answer: (v: unknown) => void = () => {};
    readGuestsRoomAction.mockReturnValue(new Promise((r) => (answer = r)));
    panel(null);
    expect(document.querySelector("[data-room-reading='list']")).not.toBeNull();
    expect(readGuestsRoomAction).toHaveBeenCalledTimes(1);
    await act(async () => answer({ ok: true, room: room(2, 5) }));
    expect(await screen.findByTestId("room")).toHaveTextContent("2 guests");
  });

  it("a newer read from the hub's render wins over the room's own older ask (an act revalidated the hub)", async () => {
    readGuestsRoomAction.mockResolvedValue({ ok: true, room: room(2, 5) });
    const view = panel(null);
    expect(await screen.findByTestId("room")).toHaveTextContent("read at 5");
    view.serve(room(4, 9));
    await waitFor(() =>
      expect(screen.getByTestId("room")).toHaveTextContent("4 guests"),
    );
    // An older render never undoes a newer read.
    view.serve(room(1, 3));
    expect(screen.getByTestId("room")).toHaveTextContent("4 guests");
  });

  it("★ a read that fails says so, with Try again, never an empty room", async () => {
    readGuestsRoomAction.mockResolvedValueOnce({ ok: false });
    panel(null);
    expect(
      await screen.findByText(/couldn.t load your guests/i),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("room")).toBeNull();
    readGuestsRoomAction.mockResolvedValueOnce({ ok: true, room: room(1, 7) });
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByTestId("room")).toHaveTextContent("1 guests");
  });

  it("hands the room the section its opener's link named (`#invited`)", async () => {
    takeAnchor.mockReturnValueOnce("invited");
    panel(room(1, Date.now()));
    expect(await screen.findByTestId("room")).toHaveTextContent(
      "anchor invited",
    );
  });

  it("the panel is the one room panel, named for the room, titled by it, the event under it", async () => {
    panel(room(1, Date.now()));
    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveAttribute("data-room-panel", "guests");
    expect(dialog).toHaveAttribute("data-kind", "settings");
    expect(screen.getByRole("heading", { name: "Guests" })).toBeInTheDocument();
    expect(screen.getByText("Maya & Jay")).toBeInTheDocument();
  });
});
