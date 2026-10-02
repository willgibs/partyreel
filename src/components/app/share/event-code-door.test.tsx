import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { TooltipProvider } from "@/components/ui/tooltip";
import { DOORS, type Door } from "@/lib/event/door/door";
import { codeMark } from "@/lib/events/visibility-labels";

import { EventCodeDoor } from "./event-code-door";

/**
 * THE CODE AS THE DOOR (Will, event-ready `door=mark`, 2026-10-02: "the mark keeps the header from getting
 * too crowded with text where icons will likely work 99% of the time, and we could add tooltips to clarify
 * on the mark").
 *
 * What fails silently: a door a guest cannot pass that looks ready to scan (Only me drawn plain); a mark
 * pressed that opens the code card instead of saying what it means; and a phone left with a glyph it
 * cannot ask about, since the tooltip primitive refuses a tap on purpose. The words are pinned only where
 * they are the door's own (`visibility-labels.ts`), never retyped here.
 */

const share = vi.hoisted(() => ({
  openCode: vi.fn(),
  morphNameFor: () => undefined,
  setHeaderCodeHidden: vi.fn(),
}));
vi.mock("./event-share-provider", () => ({ useEventShare: () => share }));
// The sentinel watches the header's code leave the screen (the sticky pill's gate); jsdom lays nothing out.
vi.mock("@/lib/shared/use-in-view-sentinel", () => ({
  useInViewSentinel: () => ({ sentinelRef: () => {}, inView: true }),
}));
// `qr-code-styling` touches the window on construction; this is about the code's corner, not its modules.
vi.mock("@/components/app/styled-qr", () => ({
  StyledQr: () => <div data-testid="styled-qr" />,
}));

function door(
  over: { door?: Door; acceptingUploads?: boolean; waiting?: number } = {},
) {
  return render(
    <TooltipProvider>
      <EventCodeDoor
        eventName="Maya's 30th"
        joinUrl="https://partyreel.com/e/tok"
        qrStyle="classic"
        door={over.door ?? "open"}
        acceptingUploads={over.acceptingUploads ?? true}
        waiting={over.waiting ?? 0}
      />
    </TooltipProvider>,
  );
}

const mark = () => document.querySelector<HTMLElement>("[data-code-mark]");
const dimmed = () => document.querySelector("[data-code-dim]") !== null;
const tip = () => document.querySelector("[data-slot='tooltip-content']");

beforeEach(() => vi.clearAllMocks());

describe("the mark's words", () => {
  it("wears nothing on a Public album taking uploads, and a mark on every other door", () => {
    expect(
      codeMark({ door: "open", acceptingUploads: true, waiting: 0 }),
    ).toBeNull();
    for (const d of DOORS.filter((d) => d !== "open")) {
      expect(
        codeMark({ door: d, acceptingUploads: true, waiting: 0 }),
        d,
      ).not.toBeNull();
    }
  });

  it("★ shows the strongest glyph and says all of what holds", () => {
    expect(
      codeMark({ door: "private", acceptingUploads: false, waiting: 0 })?.glyph,
    ).toBe("only-me");
    const pausedGate = codeMark({
      door: "approve",
      acceptingUploads: false,
      waiting: 2,
    })!;
    expect(pausedGate.glyph).toBe("paused");
    // A paused Private album still names its gate and who waits at it.
    expect(pausedGate.words).toMatch(/private/i);
    expect(pausedGate.words).toMatch(/2 people/);
    expect(
      codeMark({ door: "password", acceptingUploads: true, waiting: 0 })?.glyph,
    ).toBe("gate");
  });

  it("counts who waits at a gate, and nobody at Public or Only me", () => {
    expect(
      codeMark({ door: "approve", acceptingUploads: true, waiting: 2 })
        ?.waiting,
    ).toBe(2);
    expect(
      codeMark({ door: "open", acceptingUploads: false, waiting: 3 })?.waiting,
    ).toBe(0);
    expect(
      codeMark({ door: "private", acceptingUploads: true, waiting: 3 })
        ?.waiting,
    ).toBe(0);
  });
});

describe("the code at each door", () => {
  it("stays plain and bright on a Public album taking uploads", () => {
    door();
    expect(mark()).toBeNull();
    expect(dimmed()).toBe(false);
  });

  it("★ dims where a guest who scans it cannot add: Only me and paused uploads", () => {
    door({ door: "private" });
    expect(dimmed()).toBe(true);
    expect(mark()?.dataset.codeMark).toBe("only-me");
  });

  it("dims paused uploads under a pause, as the dashboard's card says Paused", () => {
    door({ acceptingUploads: false });
    expect(dimmed()).toBe(true);
    expect(mark()?.dataset.codeMark).toBe("paused");
  });

  it("keeps a gated door bright, a lock on its corner and the count beside it", () => {
    door({ door: "approve", waiting: 2 });
    expect(dimmed()).toBe(false);
    expect(mark()?.dataset.codeMark).toBe("gate");
    expect(mark()?.textContent).toContain("2");
  });

  it("★ names the mark by its words, and pressing it never opens the code card", async () => {
    door({ door: "password" });
    const words = codeMark({
      door: "password",
      acceptingUploads: true,
      waiting: 0,
    })!.words;
    expect(screen.getByRole("button", { name: words })).toBe(mark());
    await act(async () => {
      fireEvent.click(mark()!);
    });
    expect(share.openCode).not.toHaveBeenCalled();
    // The code itself still opens it.
    fireEvent.click(screen.getByRole("button", { name: /show the code/i }));
    expect(share.openCode).toHaveBeenCalledTimes(1);
  });
});

describe("the mark's words on every input", () => {
  it("opens its tooltip on a keyboard's focus", async () => {
    door({ door: "invite" });
    await act(async () => {
      mark()!.focus();
    });
    expect(tip()?.textContent).toContain(
      codeMark({ door: "invite", acceptingUploads: true, waiting: 0 })!.words,
    );
  });

  it("★ a tap shows the same words, and a second tap puts them away", async () => {
    door({ door: "closed" });
    const tap = async () => {
      await act(async () => {
        fireEvent.pointerDown(mark()!, { pointerType: "touch" });
        fireEvent.pointerUp(mark()!, { pointerType: "touch" });
        fireEvent.click(mark()!, { detail: 1 });
      });
    };
    await tap();
    expect(tip()?.textContent).toContain(
      codeMark({ door: "closed", acceptingUploads: true, waiting: 0 })!.words,
    );
    await tap();
    expect(tip()).toBeNull();
  });

  it("a cursor's click keeps the words up rather than flicking them away", async () => {
    door({ door: "approve" });
    await act(async () => {
      fireEvent.pointerDown(mark()!, { pointerType: "mouse" });
      fireEvent.click(mark()!, { detail: 1 });
    });
    expect(tip()).not.toBeNull();
  });
});
