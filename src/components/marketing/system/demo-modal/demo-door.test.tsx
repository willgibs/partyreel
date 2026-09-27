import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import { setViewportWidth } from "../../../../../vitest.setup";

import { DemoDoor } from "./demo-door";
import { closeDemoModal } from "./store";

/**
 * A DEMO DOOR, WHAT IT DOES AT A DESK AND WHAT IT LEAVES ALONE ON A PHONE.
 * The rule itself is `opens.test.ts`'s; this holds the door to it with a real
 * press: the modal opens with the code and the demo's own link, Escape closes
 * it and focus goes back to the door, and a phone or a modified press is left
 * to the link (its new tab). What fails here fails quietly on the site: a
 * door that navigates away at a desk, or a modal that strands the keyboard.
 */

const DEMO = "https://partyreel.com/e/abc123";

beforeAll(() => {
  // The live dot and the door read the loop-pause observer; jsdom has none.
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
});

afterEach(() => {
  setViewportWidth(1024);
  // The page's one modal outlives the door that opened it (that is the
  // point), so each test closes it on the way out.
  act(() => closeDemoModal());
});

function door() {
  render(
    <DemoDoor href={DEMO} source="test" aria-label="Try the demo">
      Try the demo
    </DemoDoor>,
  );
  return screen.getByRole("link", { name: "Try the demo" });
}

describe("a demo door", () => {
  it("is a real link to the demo in a new tab before anything runs", () => {
    const link = door();
    expect(link).toHaveAttribute("href", DEMO);
    expect(link).toHaveAttribute("target", "_blank");
    expect(link.getAttribute("rel")).toContain("noopener");
    expect(link).toHaveAttribute("data-track", "demo_open");
    expect(link).toHaveAttribute("data-track-source", "test");
  });

  it("opens the modal at a desk: the code, the short link and the demo's own link", () => {
    const link = door();
    const press = fireEvent.click(link);
    // fireEvent returns false when the default was prevented: the door did
    // not navigate, it opened the card.
    expect(press).toBe(false);
    const dialog = screen.getByRole("dialog", { name: "Try our demo event" });
    expect(dialog.querySelector("svg path")).not.toBeNull();
    expect(dialog).toHaveTextContent("/demo");
    const open = screen.getByRole("link", { name: /Open the demo/ });
    expect(open).toHaveAttribute("href", DEMO);
    expect(open).toHaveAttribute("target", "_blank");
  });

  it("closes on Escape and hands focus back to the door", async () => {
    const link = door();
    link.focus();
    fireEvent.click(link);
    const dialog = screen.getByRole("dialog");
    fireEvent.keyDown(dialog, { key: "Escape" });
    await vi.waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    // Radix hands focus back a tick after the content unmounts.
    await vi.waitFor(() => expect(document.activeElement).toBe(link));
  });

  it("keeps the modal up when the door that opened it leaves the page", () => {
    // The nav's pane: its panel closes as focus moves into the modal, and the
    // door goes with it. The modal is the page's, so it stays.
    const { unmount } = render(
      <DemoDoor href={DEMO} source="test">
        Explore the live demo
      </DemoDoor>,
    );
    fireEvent.click(
      screen.getByRole("link", { name: "Explore the live demo" }),
    );
    unmount();
    expect(
      screen.getByRole("dialog", { name: "Try our demo event" }),
    ).toBeInTheDocument();
  });

  it("leaves a phone's press to the link", () => {
    setViewportWidth(375);
    const link = door();
    expect(fireEvent.click(link)).toBe(true);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("leaves a modified press to the browser, even at a desk", () => {
    const link = door();
    expect(fireEvent.click(link, { metaKey: true })).toBe(true);
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
