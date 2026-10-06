import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { DoorParts, doorAttrs, doorName } from "./room-card-door";

/**
 * THE DOOR, A CARD AT REST AND A PILL UNDER THE BAR (event-header r4's cards over the seam): its name, its pieces in both
 * forms, and what each face puts on it. How it looks and where it stands are the sheet's (`room-card.css`) and the
 * browser's; what is held here is what a reader, a count and the fold's own hooks depend on.
 */

/** A door as the row draws it: an element wearing the shared attributes, the pieces inside. */
function Door({
  room = "review",
  face,
}: {
  room?: Parameters<typeof DoorParts>[0]["room"];
  face: Parameters<typeof DoorParts>[0]["face"];
}) {
  return (
    <a href="#room" {...doorAttrs(room, face.value)}>
      <DoorParts room={room} face={face} />
    </a>
  );
}

const piece = (door: HTMLElement, name: string) =>
  door.querySelector<HTMLElement>(`[data-fold="${name}"]`);

describe("a door's name", () => {
  it("is its room and its line, so a reader hears the door once in either form", () => {
    expect(doorName("review", "8 waiting")).toBe("Review: 8 waiting");
    expect(doorName("as-guest", "What they see")).toBe(
      "As a guest: What they see",
    );
    expect(doorName("reel", "Live for guests")).toBe(
      "Highlight reel: Live for guests",
    );
  });

  it("is the one name: every piece inside says nothing twice", () => {
    render(<Door face={{ value: "8 waiting", amber: true, count: 8 }} />);
    const door = screen.getByRole("link", { name: "Review: 8 waiting" });
    // Everything drawn inside the door is hidden from a reader; the name carries it all.
    for (const child of door.children) {
      expect(child.getAttribute("aria-hidden"), child.className).toBe("true");
    }
  });
});

describe("the pieces the fold carries", () => {
  it("draws every piece of both forms once, named for the fold", () => {
    render(<Door face={{ value: "All caught up" }} />);
    const door = screen.getByRole("link");
    for (const name of ["skin", "disc", "glyph", "title", "text", "word"]) {
      expect(piece(door, name), name).not.toBeNull();
    }
    // Nothing waits, so there is no light and no numeral to carry.
    expect(piece(door, "light")).toBeNull();
    expect(piece(door, "num")).toBeNull();
  });

  it("wears the sheet's hook and the room's own, for the row and the frames' captions to find it", () => {
    render(<Door room="guests" face={{ value: "31 guests" }} />);
    const door = screen.getByRole("link");
    expect(door).toHaveClass("hub-door");
    expect(door).toHaveAttribute("data-hub-door", "guests");
  });

  it("puts a card's title and a pill's word in two elements, never one restyled (the ladder's two roles)", () => {
    render(<Door face={{ value: "All caught up" }} />);
    const door = screen.getByRole("link");
    expect(piece(door, "title")).toHaveTextContent("Review");
    expect(piece(door, "word")).toHaveTextContent("Review");
    // The title is the heading face at its step; the word is a control's label, with no heading face beside its weight.
    expect(piece(door, "title")?.className).toContain("font-heading");
    expect(piece(door, "word")?.className).not.toContain("font-heading");
  });

  it("gives the reel a whole name and a short one, both in the page, so the server's paint is right at every width", () => {
    render(<Door room="reel" face={{ value: "Live for guests" }} />);
    const title = piece(screen.getByRole("link"), "title")!;
    expect(title.querySelector(".hub-door-full")).toHaveTextContent(
      "Highlight reel",
    );
    expect(title.querySelector(".hub-door-short")).toHaveTextContent("Reel");
  });

  it("gives a door whose name is already short one name only", () => {
    render(<Door face={{ value: "All caught up" }} />);
    const title = piece(screen.getByRole("link"), "title")!;
    expect(title.querySelector(".hub-door-full")).toBeNull();
    expect(title).toHaveTextContent("Review");
  });
});

describe("a waiting count", () => {
  it("is a numeral and the waiting light, and the line keeps the word it counts", () => {
    render(<Door face={{ value: "8 waiting", amber: true, count: 8 }} />);
    const door = screen.getByRole("link");
    expect(piece(door, "num")).toHaveTextContent("8");
    expect(piece(door, "light")).toHaveClass("hub-door-light");
    expect(piece(door, "text")).toHaveTextContent("waiting");
    expect(piece(door, "text")).not.toHaveTextContent("8");
  });

  it("★ is never a wash: the card itself wears no waiting colour", () => {
    render(<Door face={{ value: "8 waiting", amber: true, count: 8 }} />);
    const door = screen.getByRole("link");
    // The needs-action token appears only as the light's own (the sheet), never as a class on the card or its line.
    expect(door.outerHTML).not.toMatch(/warning/);
  });

  it("★ gives a count past 999 the compact numeral a card and a pill have room for, the exact number in the name", () => {
    render(
      <Door
        face={{ value: "1,234 waiting", amber: true, count: 1234 }}
        room="review"
      />,
    );
    const door = screen.getByRole("link", { name: "Review: 1,234 waiting" });
    expect(piece(door, "num")).toHaveTextContent("1.2K");
    expect(piece(door, "text")).toHaveTextContent("waiting");
  });

  it("whole to 999", () => {
    render(<Door face={{ value: "128 waiting", amber: true, count: 128 }} />);
    expect(piece(screen.getByRole("link"), "num")).toHaveTextContent("128");
  });

  it("lights nothing for an amber face with no count", () => {
    render(<Door face={{ value: "8 waiting", amber: true }} />);
    expect(piece(screen.getByRole("link"), "light")).toBeNull();
  });
});

describe("the carried call G4: Settings' count is plain, and paused uploads read Paused", () => {
  it("★ draws the steps left in the ink and as an unlit mark for a pill, never amber", () => {
    render(
      <Door
        room="settings"
        face={{ value: "2 left", strong: true, left: 2 }}
      />,
    );
    const door = screen.getByRole("link", { name: "Settings: 2 left" });
    expect(piece(door, "text")).toHaveTextContent("2 left");
    expect(piece(door, "text")?.className).toContain("text-foreground");
    expect(piece(door, "text")?.className).not.toContain("muted");
    const light = piece(door, "light");
    expect(light).toHaveClass("hub-door-unlit");
    expect(light).not.toHaveClass("hub-door-light");
    expect(piece(door, "num")).toHaveTextContent("2");
    // Only a pill shows it: the card's own line already says it.
    expect(light?.closest(".hub-door-count")).toHaveClass("hub-door-left");
    expect(door.outerHTML).not.toMatch(/warning/);
  });

  it("★ says Paused in the ink, with the plain pause for a pill", () => {
    render(<Door room="settings" face={{ value: "Paused", paused: true }} />);
    const door = screen.getByRole("link", { name: "Settings: Paused" });
    expect(piece(door, "text")).toHaveTextContent("Paused");
    expect(piece(door, "text")?.className).toContain("text-foreground");
    expect(door.querySelector(".hub-door-pause svg")).not.toBeNull();
    expect(piece(door, "num")).toBeNull();
  });

  it("is quiet, in the muted grey, for a line that is neither", () => {
    render(<Door room="settings" face={{ value: "Public" }} />);
    const door = screen.getByRole("link");
    expect(piece(door, "text")?.className).toContain("text-muted-foreground");
  });
});

describe("the light that follows the pointer (the room's one delight)", () => {
  it("writes the pointer's place on the card for a mouse, and leaves a finger alone", () => {
    render(<Door face={{ value: "All caught up" }} />);
    const door = screen.getByRole("link");
    vi.spyOn(door, "getBoundingClientRect").mockReturnValue({
      left: 100,
      top: 40,
      width: 200,
      height: 72,
      right: 300,
      bottom: 112,
      x: 100,
      y: 40,
      toJSON: () => ({}),
    });
    fireEvent.pointerMove(door, {
      pointerType: "mouse",
      clientX: 130,
      clientY: 60,
    });
    expect(door.style.getPropertyValue("--hub-door-x")).toBe("30px");
    expect(door.style.getPropertyValue("--hub-door-y")).toBe("20px");
    fireEvent.pointerMove(door, {
      pointerType: "touch",
      clientX: 250,
      clientY: 90,
    });
    expect(door.style.getPropertyValue("--hub-door-x")).toBe("30px");
  });
});

/**
 * THE COUNT TICKS DOWN ON RETURN: a host clears nine photographs in Review and comes back; the numeral sliding 12 to 3
 * says what she just did. First paint never animates; reduced motion shortens the travel to one frame.
 */
describe("the waiting count's travel", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  const face = (n: number) => ({
    value: `${n} waiting`,
    amber: true,
    count: n,
  });

  it("slides to the new count, through the numbers between", async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      "matchMedia",
      (query: string) =>
        ({ matches: false, media: query }) as unknown as MediaQueryList,
    );
    const { rerender } = render(<Door face={face(12)} />);
    expect(piece(screen.getByRole("link"), "num")).toHaveTextContent("12");
    rerender(<Door face={face(3)} />);
    // Mid-travel it shows a number between, never the target at once.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });
    const mid = Number(piece(screen.getByRole("link"), "num")?.textContent);
    expect(mid).toBeGreaterThan(3);
    expect(mid).toBeLessThan(12);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });
    expect(piece(screen.getByRole("link"), "num")).toHaveTextContent("3");
  });

  it("★ lands on the new count one frame later under reduced motion, never skipping the frame", async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      "matchMedia",
      (query: string) =>
        ({
          matches: query.includes("reduce"),
          media: query,
        }) as unknown as MediaQueryList,
    );
    const { rerender } = render(<Door face={face(12)} />);
    rerender(<Door face={face(3)} />);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(40);
    });
    expect(piece(screen.getByRole("link"), "num")).toHaveTextContent("3");
  });
});
