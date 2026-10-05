import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

/**
 * THE TOOLS PAGE'S WARNING NAMES BOTH WAYS THE BOUNDARY PROBE FAILS (crumbs-79). The probe has two modes
 * (`boom/page.tsx`): bare, it throws inside the page and lands on the root `error.tsx`; `?boundary=global` crashes the
 * root layout itself and lands on `global-error.tsx`. The warning named the bare one alone, so a reader who came for
 * the last-resort screen never learned the second link existed.
 */
vi.mock("@/lib/design-gate/server", () => ({
  requireDesignKey: vi.fn(async () => null),
}));
vi.mock("@/app/(dev)/design/(shell)/_shell/page-header", () => ({
  PageHeader: ({ title }: { title: string }) => <h1>{title}</h1>,
}));
vi.mock("./tools-index", () => ({ ToolsIndex: () => null }));

const { default: ToolsPage } = await import("./page");

describe("the boundary probe's warning", () => {
  it("names the bare probe's root boundary, then ?boundary=global and global-error", async () => {
    render(await ToolsPage({ searchParams: Promise.resolve({}) }));
    const warning = screen.getByText(
      /The boundary probe crashes during render/,
    );
    expect(warning.textContent).toMatch(
      /Bare, .* root error\.tsx; with \?boundary=global .* global-error\.tsx/,
    );
  });
});
