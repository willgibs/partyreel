import { readFileSync } from "node:fs";
import { join } from "node:path";

import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import { TooltipProvider } from "@/components/ui/tooltip";

import { ComparisonTable } from "./comparison-table";
import { RowTip } from "./row-tip";

/**
 * ★ A MATRIX ROW'S FINE PRINT OPENS BY A FINGER (red-team 52's MEDIUM). `/pricing`'s comparison matrix carried the
 * published terms of Uploads and Deleted in a tooltip a tap could not open ("a tap focuses the label and the trigger
 * stays closed": the primitive refuses a finger on purpose, `ui/tooltip.test.tsx`), while its subhead told a reader to
 * hover. The press model is the glyph count's (`ui/glyph-count.test.tsx`): a finger toggles, a key toggles, a cursor's
 * click keeps the words that hover opened. The orders below are a phone's, fired as a phone fires them.
 */

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

/** The table's <Reveal> observes itself into view; visible at once. */
beforeAll(() => {
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      constructor(private cb: IntersectionObserverCallback) {}
      observe(target: Element) {
        this.cb(
          [{ isIntersecting: true, target } as IntersectionObserverEntry],
          this as unknown as IntersectionObserver,
        );
      }
      unobserve() {}
      disconnect() {}
    },
  );
});

afterEach(() => {
  vi.useRealTimers();
});

const TIP =
  "Everything you and your guests keep, counted on the original files.";

function mount() {
  render(
    <TooltipProvider delayDuration={0}>
      <RowTip label="Storage" tip={TIP} />
      <RowTip label="Uploads" tip="What you and your guests can add." />
      <p>Elsewhere on the page</p>
    </TooltipProvider>,
  );
  return {
    storage: screen.getByRole("button", { name: "Storage" }),
    uploads: screen.getByRole("button", { name: "Uploads" }),
  };
}

const words = () =>
  Array.from(document.querySelectorAll("[data-slot='tooltip-content']")).map(
    (el) => el.textContent ?? "",
  );

/** One tap as a phone makes it: the pointer down and up, then the click (its compatibility mouse events never come). */
async function tap(el: Element) {
  await act(async () => {
    fireEvent.pointerDown(el, { pointerType: "touch", isPrimary: true });
    fireEvent.pointerUp(el, { pointerType: "touch", isPrimary: true });
    fireEvent.click(el, { detail: 1 });
  });
}

/** Radix starts listening for a press outside its words one task after they open. */
const settle = () =>
  act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });

describe("a row's fine print under a finger", () => {
  it("★ a tap opens its words, and the next tap on the label puts them away", async () => {
    const { storage } = mount();
    expect(words()).toEqual([]);
    await tap(storage);
    expect(words()).toEqual([expect.stringContaining(TIP)]);
    await settle();
    await tap(storage);
    expect(words()).toEqual([]);
  });

  it("★ a tap anywhere else puts them away", async () => {
    const { storage } = mount();
    await tap(storage);
    await settle();
    const elsewhere = screen.getByText("Elsewhere on the page");
    await act(async () => {
      fireEvent.pointerDown(elsewhere, { pointerType: "touch" });
      fireEvent.pointerUp(elsewhere, { pointerType: "touch" });
      fireEvent.click(elsewhere, { detail: 1 });
    });
    expect(words()).toEqual([]);
  });

  it("★ a tap on another row's label opens that row's words and puts the first away: one at a time", async () => {
    const { storage, uploads } = mount();
    await tap(storage);
    await settle();
    await tap(uploads);
    expect(words()).toEqual([
      expect.stringContaining("What you and your guests"),
    ]);
  });

  it("a tap on the words themselves puts them away", async () => {
    const { storage } = mount();
    await tap(storage);
    await settle();
    const bubble = document.querySelector("[data-slot='tooltip-content']")!;
    await act(async () => {
      fireEvent.pointerDown(bubble, { pointerType: "touch" });
      fireEvent.click(bubble, { detail: 1 });
    });
    expect(words()).toEqual([]);
  });

  it("a finger's focus alone opens nothing: only its click does (the primitive's scar, crumbs-33, stands)", async () => {
    const { storage } = mount();
    fireEvent.pointerDown(storage, { pointerType: "touch", isPrimary: true });
    await act(async () => {
      storage.focus();
    });
    expect(words()).toEqual([]);
    fireEvent.pointerUp(storage, { pointerType: "touch", isPrimary: true });
    await act(async () => {
      fireEvent.click(storage, { detail: 1 });
    });
    expect(words()).toHaveLength(1);
  });

  it("the words hold the page's side gutter at the narrowest width, never flush to the glass", () => {
    const source = readFileSync(
      join(
        process.cwd(),
        "src/components/marketing/sections/pricing/row-tip.tsx",
      ),
      "utf8",
    );
    expect(source).toMatch(/const GUTTER = 16;/);
    expect(source).toContain("collisionPadding={GUTTER}");
  });
});

describe("a row's fine print under a cursor and a key, as before", () => {
  it("a cursor's hover opens it, and its click keeps the same words open without blinking them", async () => {
    const { storage } = mount();
    await act(async () => {
      fireEvent.pointerMove(storage, { pointerType: "mouse" });
      // The provider's delay is 0, which radix still rides on a timer.
      await new Promise((resolve) => setTimeout(resolve, 5));
    });
    const before = document.querySelector("[data-slot='tooltip-content']");
    expect(before).not.toBeNull();
    await settle();
    // The press: radix would dismiss the words at the pointerdown (the trigger is outside them) and the click would
    // reopen them a beat later; this label's own press is no dismissal.
    await act(async () => {
      fireEvent.pointerDown(storage, { pointerType: "mouse" });
    });
    expect(document.querySelector("[data-slot='tooltip-content']")).toBe(
      before,
    );
    await act(async () => {
      fireEvent.pointerUp(storage, { pointerType: "mouse" });
      fireEvent.click(storage, { detail: 1 });
    });
    expect(document.querySelector("[data-slot='tooltip-content']")).toBe(
      before,
    );
    expect(words()).toHaveLength(1);
  });

  it("a key's focus opens it, Enter or Space puts it away, and Escape does too", async () => {
    const { storage } = mount();
    await act(async () => {
      storage.focus();
    });
    expect(words()).toEqual([expect.stringContaining(TIP)]);
    // `detail` 0 is how a click no pointer made reads.
    await act(async () => {
      fireEvent.click(storage, { detail: 0 });
    });
    expect(words()).toEqual([]);
    await act(async () => {
      fireEvent.click(storage, { detail: 0 });
    });
    expect(words()).toHaveLength(1);
    await act(async () => {
      fireEvent.keyDown(storage, { key: "Escape" });
    });
    expect(words()).toEqual([]);
  });
});

describe("the matrix on /pricing, read by a phone", () => {
  it("★ Uploads and Deleted, the two rows whose terms a phone could not read, open on a tap", async () => {
    render(
      <TooltipProvider delayDuration={0}>
        <ComparisonTable />
      </TooltipProvider>,
    );
    for (const [name, phrase] of [
      ["Uploads", "deleting something never gives its upload back"],
      ["Deleted", "they count in your storage until they leave"],
    ] as const) {
      const label = screen.getByRole("button", { name });
      await tap(label);
      expect(words().join(" ")).toContain(phrase);
      await settle();
      await tap(label);
      expect(words()).toEqual([]);
    }
  });

  it("its subhead tells a reader the way in for a finger too", () => {
    render(
      <TooltipProvider delayDuration={0}>
        <ComparisonTable />
      </TooltipProvider>,
    );
    expect(
      screen.getByText(/Hover or tap a row name for the fine print/),
    ).toBeInTheDocument();
  });
});
