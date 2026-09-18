// @contract-for: src/components/lab/lab-chrome.tsx
import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { LAB_CSS_GENERATION } from "./lab-css-generation";
import { LabChrome, labStylesheetIsStale } from "./lab-chrome";
import { setLabPref } from "./lab-prefs";

/**
 * THE CHROME'S CONTRACT: the reading preferences reach <html>, and a stale
 * stylesheet is caught rather than rendered as five layout bugs (the revamp,
 * 2026-09-16). Nothing about the notice's look is pinned.
 */

const FLAG = "partyreel.lab.css-reload";
const reload = vi.fn();

function shell(generation: string, bodyDisplay = "grid") {
  document.body.innerHTML =
    '<div class="lab-shell"><div class="lab-shell-body"></div></div>';
  vi.spyOn(window, "getComputedStyle").mockImplementation(
    (el) =>
      ({
        display: (el as Element).classList.contains("lab-shell-body")
          ? bodyDisplay
          : "block",
        getPropertyValue: (name: string) =>
          name === "--lab-css-generation" ? generation : "",
      }) as unknown as CSSStyleDeclaration,
  );
}

beforeEach(() => {
  sessionStorage.clear();
  reload.mockClear();
  vi.stubGlobal("location", { ...window.location, reload });
  // The probe waits one frame for the sheet; run it at once here.
  vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
    cb(0);
    return 1;
  });
  vi.stubGlobal("cancelAnimationFrame", () => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  document.body.innerHTML = "";
});

describe("the lab chrome", () => {
  it("writes the reading preferences onto <html> and follows a change", () => {
    shell(String(LAB_CSS_GENERATION));
    render(<LabChrome autoReload={false} />);
    const html = document.documentElement;
    expect(html.getAttribute("data-lab-fit")).toBe("true");
    act(() => setLabPref("sidebar", "open"));
    expect(html.getAttribute("data-lab-sidebar")).toBe("open");
    act(() => setLabPref("sidebar", "collapsed"));
    expect(html.getAttribute("data-lab-sidebar")).toBe("collapsed");
  });

  it("renders nothing on a fresh stylesheet and forgets a past reload", () => {
    sessionStorage.setItem(FLAG, String(LAB_CSS_GENERATION));
    shell(String(LAB_CSS_GENERATION));
    render(<LabChrome autoReload />);
    expect(screen.queryByRole("alert")).toBeNull();
    expect(reload).not.toHaveBeenCalled();
    expect(sessionStorage.getItem(FLAG)).toBeNull();
  });

  it("reloads exactly once on a stale sheet in development", () => {
    shell(String(LAB_CSS_GENERATION - 1));
    render(<LabChrome autoReload />);
    expect(reload).toHaveBeenCalledTimes(1);
    expect(sessionStorage.getItem(FLAG)).toBe(String(LAB_CSS_GENERATION));
  });

  it("shows the notice instead of a second reload", () => {
    sessionStorage.setItem(FLAG, String(LAB_CSS_GENERATION));
    shell("");
    render(<LabChrome autoReload />);
    expect(reload).not.toHaveBeenCalled();
    expect(screen.getByRole("alert").textContent).toMatch(/old copy/);
  });

  it("treats a shell body that is not a grid as stale, whatever the number", () => {
    shell(String(LAB_CSS_GENERATION), "block");
    expect(labStylesheetIsStale()).toBe(true);
    render(<LabChrome autoReload={false} />);
    expect(screen.getByRole("alert")).toBeTruthy();
  });

  it("is quiet where there is no shell to check", () => {
    document.body.innerHTML = "<main></main>";
    expect(labStylesheetIsStale()).toBe(false);
  });
});
