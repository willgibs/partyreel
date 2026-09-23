// @contract-for: src/components/guest/save-account-prompt.tsx
/**
 * THE OFFER CARD'S CONTRACT (`account=after` 2026-09-20; the capture flow folded
 * in at the identity reshape, 2026-09-21).
 *
 * Five functions, none of them a look:
 *   1. IT COUNTS WHAT JUST LANDED. The offer is about the photographs in front
 *      of the guest, so the number is in the sentence and the singular reads as
 *      a singular.
 *   2. "MAYBE LATER" IS FINAL, PER EVENT. A nudge that comes back after being
 *      declined is an advert.
 *   3. OPENING THE DOOR LEAVES A MARKER. `pr_pending_offer_<qr_token>` is what
 *      makes a magic-link round trip land the same beat as the in-page code;
 *      without it a guest who left the page comes back to nothing.
 *   4. CONFIRMING CLAIMS, AND ONLY CLAIMS (guest by upload, 2026-09-22): the
 *      claim brings the event with the photographs, so there is no save step.
 *   5. THE NEWSLETTER SWITCH RIDES THIS DOOR, and posts only when it is on.
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { claimAnonymousUploads } from "@/lib/guest/claim-uploads";

import { SaveAccountPrompt } from "./save-account-prompt";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
const { session } = vi.hoisted(() => ({
  session: { current: null as null | { user: { id: string } } },
}));
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      // Signed out by default: the card stands and its trigger is the door.
      getSession: vi.fn(async () => ({ data: { session: session.current } })),
    },
  }),
}));
vi.mock("@/lib/guest/claim-uploads", () => ({
  claimAnonymousUploads: vi.fn(async () => null),
}));

function mount(count: number, hintEmail?: string | null) {
  return render(
    <SaveAccountPrompt
      qrToken="tok-1"
      sessionToken="sess-1"
      count={count}
      hintEmail={hintEmail}
    />,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  session.current = null;
});

describe("SaveAccountPrompt", () => {
  it("counts what landed, and says one photograph in the singular", () => {
    const { unmount } = mount(7);
    expect(screen.getByText(/all 7 stay with you/i)).toBeInTheDocument();
    unmount();

    mount(1);
    expect(screen.getByText(/it stays with you/i)).toBeInTheDocument();
  });

  // POLISH 3 (the identity red-team, 2026-09-21): the heading said "photos"
  // for one file too, reading as a typo beside its own body's "it stays".
  it("the heading counts too: singular for exactly one, plural otherwise", () => {
    const { unmount } = mount(7);
    expect(screen.getByText("Keep these photos")).toBeInTheDocument();
    unmount();

    mount(1);
    expect(screen.getByText("Keep this photo")).toBeInTheDocument();
  });

  it("asks for a confirmed email, which is what the door behind it does", () => {
    mount(3);
    expect(
      screen.getByRole("button", { name: /confirm your email/i }),
    ).toBeInTheDocument();
  });

  it("Maybe later is final for this event", () => {
    const { container, unmount } = mount(3);
    fireEvent.click(screen.getByRole("button", { name: /maybe later/i }));
    expect(container).toBeEmptyDOMElement();
    unmount();

    const second = mount(3);
    expect(second.container).toBeEmptyDOMElement();
  });

  /* ★ THE ADDRESS TYPED AT THE DOOR ARRIVES IN THE FIELD (2026-09-22), which
     is the one thing the optional field buys a guest before they confirm: the
     offer card is often minutes after the door, and typing the same address
     twice in one visit is the friction the field was meant to remove. The
     card's own words are unchanged, which is the point — the offer is the
     same, one tap cheaper. */
  it("opens its door on the address typed at the door", async () => {
    mount(3, "priya@example.com");
    fireEvent.click(screen.getByRole("button", { name: /confirm your email/i }));
    const field = await screen.findByPlaceholderText(/you@/i);
    await waitFor(() =>
      expect((field as HTMLInputElement).value).toBe("priya@example.com"),
    );
  });

  it("opens on an empty field for a guest who skipped it", async () => {
    mount(3);
    fireEvent.click(screen.getByRole("button", { name: /confirm your email/i }));
    const field = await screen.findByPlaceholderText(/you@/i);
    expect((field as HTMLInputElement).value).toBe("");
  });

  it("marks the door's opening, so a redirect sign-in lands the same beat", async () => {
    mount(3);
    expect(localStorage.getItem("pr_pending_offer_tok-1")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /confirm your email/i }));
    await waitFor(() =>
      expect(localStorage.getItem("pr_pending_offer_tok-1")).toBe("1"),
    );
  });

  it("carries the newsletter switch in its door, off until the guest turns it on", async () => {
    mount(3);
    fireEvent.click(screen.getByRole("button", { name: /confirm your email/i }));
    const toggle = await screen.findByRole("switch", {
      name: /send me occasional partyreel updates/i,
    });
    expect(toggle).toHaveAttribute("aria-checked", "false");
  });

  it("stands aside for somebody who already has an account (the belt under the slot's own rule)", async () => {
    session.current = { user: { id: "u1" } };
    const { container } = mount(3);
    await waitFor(() => expect(container).toBeEmptyDOMElement());
  });

  it("never claims before a code is verified: opening the door only marks it", async () => {
    mount(3);
    fireEvent.click(screen.getByRole("button", { name: /confirm your email/i }));
    await screen.findByPlaceholderText(/you@/i);
    expect(claimAnonymousUploads).not.toHaveBeenCalled();
  });
});
