// @contract-for: src/components/guest/claim-handle-prompt.tsx
import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createClient } from "@/lib/supabase/client";

import { ClaimHandlePrompt } from "./claim-handle-prompt";

vi.mock("@/lib/supabase/client", () => ({ createClient: vi.fn() }));

const mockCreateClient = vi.mocked(createClient);

/** A supabase double: a session or none, and the profile row's slug. */
function stub({ signedIn, slug }: { signedIn: boolean; slug: string | null }) {
  mockCreateClient.mockReturnValue({
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session: signedIn ? { user: { id: "u1" } } : null },
      }),
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: vi.fn().mockResolvedValue({ data: { slug } }),
        }),
      }),
    }),
  } as unknown as ReturnType<typeof createClient>);
}

function mount(doneCount = 3) {
  return render(
    <ClaimHandlePrompt
      doneCount={doneCount}
      qrToken="tok-1"
      savePrompt={<div data-testid="save-account-prompt" />}
    />,
  );
}

/**
 * THE POST-UPLOAD SLOT'S CONTRACT (the profile wiring, 2026-09-19).
 *
 * The pinned function is the SEQUENCE, because the whole point of Will's
 * `claim=after` pick is that the offer arrives without getting in the way: one
 * card stands at a time, chosen by what the person actually needs next. Signed
 * out means there is no account to hang a page on, so the save prompt goes
 * first; signed in without a handle is the one state this card is for; somebody
 * who already has a page is offered nothing at all. Copy and layout are
 * precedent.
 */
beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});

describe("ClaimHandlePrompt", () => {
  it("signed out: the save-account prompt stands, and no handle is mentioned", async () => {
    stub({ signedIn: false, slug: null });
    mount();
    await screen.findByTestId("save-account-prompt");
    expect(screen.queryByRole("link", { name: /claim/i })).toBeNull();
  });

  it("signed in without a handle: the claim offer, with a door to the account", async () => {
    stub({ signedIn: true, slug: null });
    mount();
    const door = await screen.findByRole("link", { name: /claim/i });
    expect(door).toHaveAttribute("href", "/account#public-profile");
    expect(screen.queryByTestId("save-account-prompt")).toBeNull();
  });

  it("signed in with a handle: nothing at all", async () => {
    stub({ signedIn: true, slug: "maya" });
    const { container } = mount();
    await waitFor(() =>
      expect(mockCreateClient).toHaveBeenCalledTimes(1),
    );
    await waitFor(() => expect(container).toBeEmptyDOMElement());
  });

  it("counts the photographs that landed", async () => {
    stub({ signedIn: true, slug: null });
    mount(1);
    expect(await screen.findByText(/your photo is on this album/i)).toBeVisible();
  });
});
