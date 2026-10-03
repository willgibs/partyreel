/**
 * THE ALBUM'S WAIT, DRAWN (the-wait r1, Will's `wait=sheet`): the contact sheet stands over the album wherever photos
 * wait, everyone's from the sync's numbers and hers lit with her own pictures; the empty album yields to it; it never
 * stands where nothing waits, at a teaser, or on an album that shows what is added at once; and it is capped, the count
 * climbing past the squares it draws.
 *
 * Function, never look: what it says and what it draws, not its sizes or its light.
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { HerShots } from "@/components/guest/upload-tracker";
import type { HerShot } from "@/lib/disposable/contact-sheet";
import type { GuestWaiting } from "@/lib/disposable/facts";
import type { WaitClock } from "@/lib/disposable/wait-words";

import { GalleryEmptyState } from "./gallery-empty-state";
import { AlbumWait, AlbumWaitSource } from "./gallery-empty-state-wait";
import { AlbumWaitingProvider } from "./gallery-empty-state-yield";

// The river behind the empty album draws through an IntersectionObserver jsdom lacks; its presence is what is asked.
vi.mock("@/components/shared/river/river", () => ({
  River: () => <div data-testid="river" />,
}));

const MIN = 60_000;
const T0 = 1_790_000_000_000 - (1_790_000_000_000 % MIN);
const HELD: WaitClock = { kind: "held", hostName: "Maya" };

function shots(list: HerShot[]): HerShots {
  return { get: () => list, subscribe: () => () => {}, set: () => {} };
}

function mount({
  waiting,
  access = "full",
  clock = HELD,
  hers = [],
  onOpenHers,
  rule,
}: {
  waiting: GuestWaiting | null;
  access?: "full" | "teaser";
  clock?: WaitClock | null;
  hers?: HerShot[];
  onOpenHers?: () => void;
  rule?: boolean;
}) {
  return render(
    <AlbumWaitingProvider value={{ access, waiting }}>
      <AlbumWaitSource
        clock={clock}
        hers={shots(hers)}
        onOpenHers={onOpenHers}
        rule={rule}
      >
        <AlbumWait />
        <GalleryEmptyState />
      </AlbumWaitSource>
    </AlbumWaitingProvider>,
  );
}

const waiting = (count: number, minutes: [number, number][]): GuestWaiting => ({
  count,
  minutes,
  developsAt: null,
});

describe("the sheet stands where photos wait", () => {
  it("★ draws everyone's from the numbers alone, the count over them, and the empty album yields", () => {
    const { container } = mount({
      waiting: waiting(5, [
        [T0, 2],
        [T0 + MIN, 3],
      ]),
    });
    expect(container.querySelector("[data-album-wait]")).not.toBeNull();
    expect(container.querySelector("[data-wait-count]")).toHaveAttribute(
      "data-wait-count",
      "5",
    );
    expect(container.querySelectorAll(".wait-cell")).toHaveLength(5);
    expect(screen.getByText("Developing")).toBeInTheDocument();
    expect(screen.getByText("As Maya lets them in")).toBeInTheDocument();
    // The empty album's promise steps aside: the sheet is the album's state.
    expect(screen.queryByText("The album starts with you")).toBeNull();
    // ★ No id, no picture and no name of anyone else's: everyone's squares are bare.
    expect(container.querySelectorAll(".wait-cell img")).toHaveLength(0);
    expect(container.innerHTML).not.toMatch(
      /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-/,
    );
  });

  it("★ lights hers with her own pictures, counts them, and opens her uploads from 'Yours'", () => {
    const open = vi.fn();
    const { container } = mount({
      waiting: waiting(3, [[T0, 3]]),
      hers: [
        {
          key: "m1",
          at: T0 + 5_000,
          src: "https://r2.example/m1.webp",
          video: false,
          sending: false,
        },
      ],
      onOpenHers: open,
    });
    const lit = container.querySelectorAll(".wait-cell[data-hers] img");
    expect(lit).toHaveLength(1);
    expect(lit[0]).toHaveAttribute("src", "https://r2.example/m1.webp");
    screen.getByRole("button", { name: /Yours · 1/ }).click();
    expect(open).toHaveBeenCalledTimes(1);
  });

  it("stands for her first photo on its way, before anything is counted", () => {
    const { container } = mount({
      waiting: waiting(0, []),
      hers: [
        { key: "q1", at: null, src: "blob:q1", video: false, sending: true },
      ],
    });
    expect(container.querySelectorAll(".wait-cell[data-sending]")).toHaveLength(
      1,
    );
    expect(container.querySelector("[data-wait-count]")).toHaveAttribute(
      "data-wait-count",
      "0",
    );
  });

  it("★ capped: a few rows of squares at most, the oldest folded into one number while the count climbs", () => {
    const { container } = mount({ waiting: waiting(1000, [[T0, 1000]]) });
    expect(container.querySelector("[data-wait-count]")).toHaveAttribute(
      "data-wait-count",
      "1000",
    );
    const drawn = container.querySelectorAll(".wait-cell").length;
    const folded = Number(
      container
        .querySelector("[data-wait-folded]")
        ?.getAttribute("data-wait-folded"),
    );
    expect(drawn).toBeLessThanOrEqual(12 * 8);
    expect(drawn + folded).toBe(1000);
  });
});

describe("and nowhere else", () => {
  it("an album that waits with nothing in it yet keeps its own empty state", () => {
    const { container } = mount({ waiting: waiting(0, []) });
    expect(container.querySelector("[data-album-wait]")).toBeNull();
    expect(screen.getByText("The album starts with you")).toBeInTheDocument();
  });

  it("an album that shows what is added at once never draws a wait, whatever a stale count says", () => {
    const { container } = mount({
      waiting: waiting(4, [[T0, 4]]),
      clock: null,
    });
    expect(container.querySelector("[data-album-wait]")).toBeNull();
  });

  it("a viewer at the door (a teaser) meets no wait", () => {
    const { container } = mount({
      waiting: waiting(4, [[T0, 4]]),
      access: "teaser",
    });
    expect(container.querySelector("[data-album-wait]")).toBeNull();
  });

  it("with no source above it (a standalone album, the Library), the empty album stands", () => {
    render(<GalleryEmptyState />);
    expect(screen.getByText("The album starts with you")).toBeInTheDocument();
  });
});

/* MOVED HERE FROM THE ADD SLOT (`guest-upload.test.tsx`'s "moderation copy" and "an album that develops later", their
   scars kept: only an album that waits says a rule, and a develop that has come says none). The slot said the rule
   beside the sheet, which said it again under its count (the-wait r1's pick draws one clock, the sheet's): the rule
   is the wait's own line now, said in the sheet's place until the sheet stands. */
describe("the album's one rule: said before anything waits, then the sheet's clock says it", () => {
  const AHEAD: WaitClock = {
    kind: "develop",
    developsAt: new Date(Date.now() + 6 * 3_600_000).toISOString(),
  };

  it("★ before anything waits, a held album says how uploads develop here, over its empty state", () => {
    const { container } = mount({ waiting: waiting(0, []), rule: true });
    expect(
      screen.getByText("Uploads develop as Maya lets each one in."),
    ).toBeInTheDocument();
    expect(container.querySelector("[data-wait-rule]")).toHaveAttribute(
      "data-wait-rule",
      "held",
    );
    expect(screen.getByText("The album starts with you")).toBeInTheDocument();
  });

  it("★ an album with a develop time ahead says its uploads develop all at once", () => {
    mount({ waiting: waiting(0, []), rule: true, clock: AHEAD });
    expect(
      screen.getByText(/^Uploads develop all at once/),
    ).toBeInTheDocument();
    expect(screen.queryByText(/lets each one in/)).toBeNull();
  });

  it("★ once the sheet stands, the rule steps aside: the sheet's clock says it, once", () => {
    mount({ waiting: waiting(3, [[T0, 3]]), rule: true });
    expect(screen.queryByText(/^Uploads develop/)).toBeNull();
    expect(screen.getByText("As Maya lets them in")).toBeInTheDocument();
  });

  it("no rule where nothing waits (a live album, a develop that has come), where she cannot add, or at the door", () => {
    const live = mount({ waiting: waiting(0, []), rule: true, clock: null });
    expect(screen.queryByText(/^Uploads develop/)).toBeNull();
    live.unmount();
    const closed = mount({ waiting: waiting(0, []), rule: false });
    expect(screen.queryByText(/^Uploads develop/)).toBeNull();
    closed.unmount();
    mount({ waiting: waiting(0, []), rule: true, access: "teaser" });
    expect(screen.queryByText(/^Uploads develop/)).toBeNull();
  });
});
