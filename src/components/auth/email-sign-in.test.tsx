import { act, render } from "@testing-library/react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

/**
 * THE EMAIL STEP SAYS IT IS WAITING, UNTIL ITS PAGE IS (crumbs-50).
 *
 * The step is a `ClientForm`: before React has attached its handler a press sends nothing anywhere (safe, and
 * the whole of crumbs-20's answer), but it also said nothing, so a guest on a cold phone who pressed "Email me
 * a code" a second early met a button that took the press and did nothing. The button now wears a waiting cue
 * for exactly as long as that is true: it is in the HTML the server wrote (so a cold phone paints it) and gone
 * from the render after hydration, which is `useHydrated`'s whole contract. What is held here is that, not how
 * the cue looks (a spinner that arrives after half a second, so a page that hydrates inside it never shows one).
 */

vi.mock("@/app/(auth)/actions", () => ({ checkExistingAccount: vi.fn() }));
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: { signInWithOtp: vi.fn(), verifyOtp: vi.fn() },
  }),
}));

const { EmailSignIn } = await import("./email-sign-in");

const step = () => (
  <EmailSignIn
    emailRedirectTo="https://partyreel.test/auth/callback"
    onVerified={() => {}}
  />
);

const submit = (root: ParentNode) =>
  root.querySelector<HTMLButtonElement>("button[type='submit']")!;

describe("the sign-in email step's button", () => {
  it("★ is waiting in the HTML the server writes, which is what a cold phone paints", () => {
    const container = document.createElement("div");
    container.innerHTML = renderToString(step());
    const button = submit(container);
    expect(button, "no submit button in the server's HTML").not.toBeNull();
    expect(button.getAttribute("aria-disabled")).toBe("true");
    expect(button.querySelector("[data-waiting-cue]")).not.toBeNull();
    // The label is the real one: the first paint is the real step, not a placeholder.
    expect(button.textContent).toContain("Email me a code");
  });

  it("is ready, with no cue, once the page is the browser's own", () => {
    const { container } = render(step());
    const button = submit(container);
    expect(button.getAttribute("aria-disabled")).toBeNull();
    expect(button.querySelector("[data-waiting-cue]")).toBeNull();
  });

  it("★ drops the cue when React hydrates the server's markup, with nothing for React to report", async () => {
    const container = document.createElement("div");
    container.innerHTML = renderToString(step());
    document.body.append(container);
    expect(
      submit(container).querySelector("[data-waiting-cue]"),
    ).not.toBeNull();

    const errors: unknown[] = [];
    let root!: ReturnType<typeof hydrateRoot>;
    await act(async () => {
      root = hydrateRoot(container, step(), {
        onRecoverableError: (e) => errors.push(e),
      });
    });
    expect(errors).toEqual([]);
    expect(submit(container).querySelector("[data-waiting-cue]")).toBeNull();
    expect(submit(container).getAttribute("aria-disabled")).toBeNull();

    await act(async () => root.unmount());
    container.remove();
  });
});
