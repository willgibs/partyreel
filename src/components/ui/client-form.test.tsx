/**
 * THE FORM THE CLIENT SUBMITS (crumbs-20): what the browser is handed BEFORE React attaches.
 *
 * The guard is an attribute on the server-rendered markup, so the test that matters reads the
 * server's own output (`renderToStaticMarkup`): that string is what a visitor's browser holds in
 * the first second of a slow load, and `method="dialog"` in it is what makes a press or an Enter a
 * no-op there (measured in Chrome with the page's scripts held, ROADMAP's forms line). jsdom does
 * not run the form submission algorithm, so the no-op itself is walked in a real browser, and
 * `client-form-policy.test.ts` keeps every other `<form>` from standing unguarded.
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { createRef } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { ClientForm } from "@/components/ui/client-form";

describe("ClientForm", () => {
  it("★ is `method=\"dialog\"` in the markup the server sends, before any script runs", () => {
    const html = renderToStaticMarkup(
      <ClientForm onSubmit={() => {}} className="space-y-3" noValidate>
        <input name="email" />
      </ClientForm>,
    );
    expect(html).toMatch(/^<form [^>]*method="dialog"/);
    // Nothing else names a destination: no action to POST or GET to.
    expect(html).not.toMatch(/action=/);
  });

  it("hands every other prop to the form, and its ref", () => {
    const ref = createRef<HTMLFormElement>();
    const onSubmit = vi.fn((e: React.FormEvent) => e.preventDefault());
    render(
      <ClientForm
        ref={ref}
        id="f"
        className="flex"
        noValidate
        data-told-name-edit=""
        aria-label="Change name"
        onSubmit={onSubmit}
      >
        <input name="name" />
        <button type="submit">Save</button>
      </ClientForm>,
    );
    const form = screen.getByRole("form", { name: "Change name" });
    expect(form).toBe(ref.current);
    expect(form).toHaveAttribute("id", "f");
    expect(form).toHaveClass("flex");
    expect(form).toHaveAttribute("novalidate");
    expect(form).toHaveAttribute("data-told-name-edit");
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("cannot be talked out of it: nothing handed in changes the method", () => {
    // Types refuse `method` and `action`; a spread the types cannot see is written over.
    const smuggled = { method: "get", action: "/leak" } as object;
    const html = renderToStaticMarkup(<ClientForm {...smuggled} />);
    expect(html).toContain('method="dialog"');
    expect(html).not.toContain('method="get"');
    render(<ClientForm {...smuggled} aria-label="x" />);
    expect((screen.getByRole("form", { name: "x" }) as HTMLFormElement).method).toBe(
      "dialog",
    );
  });
});
