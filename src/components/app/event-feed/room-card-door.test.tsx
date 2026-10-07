import { readFileSync } from "node:fs";
import { join } from "node:path";

import { act, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { DoorParts, doorAttrs, doorName } from "./room-card-door";

/**
 * THE DOOR, A CARD AT REST AND A PILL UNDER THE BAR (event-header r4's cards, as r6 drew them: `card=shoulder`): its name,
 * its pieces in both forms, and what each face puts on it. How it looks and where it stands are the sheet's
 * (`room-card.css`) and the browser's; what is held here is what a reader, a count and the fold's own hooks depend on.
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
    render(<Door face={{ value: "8 waiting", needs: true, count: 8 }} />);
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
    // Nothing waits, and nothing is hers to act on, so the glyph carries no badge.
    expect(piece(door, "badge")).toBeNull();
  });

  it("wears the sheet's hook, the room's own and the house's press, for the row and the frames' captions to find it", () => {
    render(<Door room="guests" face={{ value: "31 guests" }} />);
    const door = screen.getByRole("link");
    expect(door).toHaveClass("hub-door");
    // Identity r4's `press=shrink`: one press for every action, its give per form set by the sheet.
    expect(door).toHaveClass("press-shrink");
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

  // ★ RESHAPED ON PURPOSE (event-header r6's carried `reel-ink`): this pinned the reel's violet glyph as its one mark of its
  // own; Will took every glyph in the ink, since Afterglow paints no hue on a control.
  it("★ draws every glyph in the ink, the reel's too: no door wears a hue of its own", () => {
    render(<Door room="reel" face={{ value: "Live for guests" }} />);
    const door = screen.getByRole("link");
    expect(door.querySelector(".hub-door-reel")).toBeNull();
    expect(door.outerHTML).not.toMatch(/--reel|text-reel/);
  });
});

describe("a count that needs her", () => {
  it("★ rides the glyph's shoulder as a badge in the status, and the line keeps the word it counts", () => {
    render(<Door face={{ value: "8 waiting", needs: true, count: 8 }} />);
    const door = screen.getByRole("link");
    const badge = piece(door, "badge")!;
    expect(badge).toHaveTextContent("8");
    expect(badge).toHaveAttribute("data-badge", "needs");
    // On the glyph, so title and count read in one glance (his r5 note), never at the card's far end.
    expect(badge.closest(".hub-door-glyph")).not.toBeNull();
    expect(piece(door, "text")).toHaveTextContent("waiting");
    expect(piece(door, "text")).not.toHaveTextContent("8");
    // The line names what waits on her, so it reads in the ink.
    expect(piece(door, "text")?.className).toContain("text-foreground");
  });

  it("★ is never a wash: the card itself wears no status colour", () => {
    render(<Door face={{ value: "8 waiting", needs: true, count: 8 }} />);
    const door = screen.getByRole("link");
    // The status is the sheet's, on the badge alone (`room-card.css`), never a class on the card or its line.
    expect(door.outerHTML).not.toMatch(/warning|needs-you|signal/);
  });

  // ★ RESHAPED ON PURPOSE (Will, event-header r5: "Can max at 99+ so it never overflows into card title"): this gave a
  // count past 999 the compact numeral ("1.2K") a card and a pill had room for; the count now rides a badge that caps at
  // 99+. What it guarded stands: the exact number is in the door's name and the room it opens.
  it.each([
    [140, "99+"],
    [1234, "99+"],
    [100, "99+"],
    [99, "99"],
  ])(
    "★ caps a count of %i on the badge at %s, the whole number in the name",
    (n, said) => {
      const value = `${n.toLocaleString("en-US")} waiting`;
      render(<Door face={{ value, needs: true, count: n }} room="review" />);
      const door = screen.getByRole("link", { name: `Review: ${value}` });
      expect(piece(door, "badge")).toHaveTextContent(said);
      expect(piece(door, "text")).toHaveTextContent("waiting");
    },
  );

  it("draws no badge for a face that needs her with no count", () => {
    render(<Door face={{ value: "8 waiting", needs: true }} />);
    expect(piece(screen.getByRole("link"), "badge")).toBeNull();
  });

  // ★ THE FOLDED PILL'S BADGE GROWS OUTWARD (red-team 57): where a word stands beside the glyph, the sheet leaves the
  // room the count's width needs, so the badge carries how many characters it ends on, the CAP's (past 99 it is "99+",
  // three) and never the number that is ticking toward it.
  it.each([
    [1, "1"],
    [8, "1"],
    [9, "1"],
    [10, "2"],
    [42, "2"],
    [99, "2"],
    [100, "3"],
    [1234, "3"],
  ])("★ says a count of %i ends on %s character(s)", (n, len) => {
    render(
      <Door
        face={{ value: `${n} waiting`, needs: true, count: n }}
        room="review"
      />,
    );
    expect(piece(screen.getByRole("link"), "badge")).toHaveAttribute(
      "data-len",
      len,
    );
  });
});

describe("the folded pill's badge, in the sheet (`room-card.css`)", () => {
  // Where the badge stands is the sheet's, and no layout runs in jsdom: what is held is the one choice that failed. Pinned
  // by its right edge a wide count grew back over the 16px glyph ("99+" hid the whole icon, so the pill read only its
  // count), and that is the choice a later edit could restore without a test noticing.
  const sheet = readFileSync(
    join(process.cwd(), "src/components/app/event-feed/room-card.css"),
    "utf8",
  ).replace(/\/\*[\s\S]*?\*\//g, "");
  const rule = (selector: string) =>
    sheet.match(
      new RegExp(`${selector.replace(/[[\].]/g, "\\$&")}\\s*\\{([^}]*)\\}`),
    )?.[1] ?? "";

  it("★ pins the badge by its LEFT edge at the glyph's shoulder, so a wider count grows away from the icon", () => {
    const folded = rule("[data-stuck] .hub-door-badge");
    expect(folded, "the folded badge's rule was not found").not.toBe("");
    expect(folded).toMatch(/\bleft:\s*calc\(100% - 6px\)/);
    expect(folded).toMatch(/\bright:\s*auto/);
    // The card's own badge (a count there has no icon under it to grow over) keeps its right edge, which is what stops
    // it short of the title beside the glyph.
    expect(rule(".hub-door-badge")).toMatch(/\bright:\s*-8px/);
  });

  it("★ leaves a word its 3px of the room a wider count reaches into, from 800px", () => {
    // 13px is the one-digit badge's gap; two characters need one pixel more, "99+" seven.
    expect(sheet).toMatch(
      /\[data-stuck\] \.hub-door:has\(\.hub-door-badge\[data-len="2"\]\)\s*\{\s*gap:\s*14px/,
    );
    expect(sheet).toMatch(
      /\[data-stuck\] \.hub-door:has\(\.hub-door-badge\[data-len="3"\]\)\s*\{\s*gap:\s*20px/,
    );
  });
});

describe("the carried call G4: Settings' count is plain, and paused uploads read Paused", () => {
  it("★ draws the steps left in the ink and as a quiet badge where the door has no line, never the status", () => {
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
    const badge = piece(door, "badge")!;
    expect(badge).toHaveAttribute("data-badge", "quiet");
    expect(badge).toHaveTextContent("2");
    // Hers, so the sheet shows it only where the door has no line to say it in (a hand's tile, a pill).
    expect(badge).toHaveAttribute("data-hers");
  });

  it("★ says Paused in the ink, with the plain pause on a quiet badge", () => {
    render(<Door room="settings" face={{ value: "Paused", paused: true }} />);
    const door = screen.getByRole("link", { name: "Settings: Paused" });
    expect(piece(door, "text")).toHaveTextContent("Paused");
    expect(piece(door, "text")?.className).toContain("text-foreground");
    const badge = piece(door, "badge")!;
    expect(badge).toHaveAttribute("data-badge", "quiet");
    expect(badge).toHaveAttribute("data-hers");
    expect(badge.querySelector("svg")).not.toBeNull();
  });

  it("is quiet, in the muted grey, for a line that is neither", () => {
    render(<Door room="settings" face={{ value: "Public" }} />);
    const door = screen.getByRole("link");
    expect(piece(door, "text")?.className).toContain("text-muted-foreground");
    expect(piece(door, "badge")).toBeNull();
  });
});

/**
 * THE COUNT TICKS DOWN ON RETURN: a host clears nine photographs in Review and comes back; the badge sliding 12 to 3
 * says what she just did. First paint never animates; reduced motion shortens the travel to one frame.
 */
describe("the waiting count's travel", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  const face = (n: number) => ({
    value: `${n} waiting`,
    needs: true,
    count: n,
  });
  const moving = () =>
    vi.stubGlobal(
      "matchMedia",
      (query: string) =>
        ({ matches: false, media: query }) as unknown as MediaQueryList,
    );

  it("slides to the new count, through the numbers between", async () => {
    vi.useFakeTimers();
    moving();
    const { rerender } = render(<Door face={face(12)} />);
    expect(piece(screen.getByRole("link"), "badge")).toHaveTextContent("12");
    rerender(<Door face={face(3)} />);
    // Mid-travel it shows a number between, never the target at once.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });
    const mid = Number(piece(screen.getByRole("link"), "badge")?.textContent);
    expect(mid).toBeGreaterThan(3);
    expect(mid).toBeLessThan(12);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });
    expect(piece(screen.getByRole("link"), "badge")).toHaveTextContent("3");
  });

  it("says the badge's own words at every step, so a count clearing from past the cap reads 99+ until it is under it", async () => {
    vi.useFakeTimers();
    moving();
    const { rerender } = render(<Door face={face(140)} />);
    expect(piece(screen.getByRole("link"), "badge")).toHaveTextContent("99+");
    rerender(<Door face={face(120)} />);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });
    expect(piece(screen.getByRole("link"), "badge")).toHaveTextContent("99+");
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
    expect(piece(screen.getByRole("link"), "badge")).toHaveTextContent("3");
  });
});
