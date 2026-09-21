// @contract-for: src/components/app/welcome-flow.tsx
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { HOW_IT_WORKS } from "@/lib/constants/how-it-works";

import { WelcomeFlow } from "./welcome-flow";

/**
 * THE TOUR'S CONTRACT (app-door round two, `tour=film`, 2026-09-20).
 *
 * The name step is a separate contract's job (SetNameStep, reused at every
 * onboarding gate); every case below starts past it with needsName={false} so
 * this file pins what round two actually changed: the four-screen tour and
 * its exits. Three functions, not one of them a look:
 *
 *   1. THE THREE LIVE BEATS WALK IN THE HOW-IT-WORKS ORDER (create, share,
 *      fill) and end on a fourth, distinct closing beat: the loop's copy is
 *      QUOTED, never re-typed, so a rewrite in how-it-works.ts cannot drift
 *      from what the tour says.
 *   2. BACK NEVER LEAVES THE FLOW. Only Skip and the closing pair navigate;
 *      Continue/Back only ever move the step index.
 *   3. EVERY EXIT PERSISTS welcomed_at BEFORE navigating (Skip and both
 *      closing doors), or the /dashboard guard bounces a host straight back
 *      into the tour it just left.
 *
 * Labels, motion and the picture components themselves are precedent: a
 * contract guards function, never look, and never pins copy.
 */

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

const markWelcomedAction = vi.hoisted(() => vi.fn(async () => {}));
vi.mock("@/app/(app)/actions", () => ({ markWelcomedAction }));

// SetNameStep (the untouched name step, screen one) is a "use server" action
// module away from a `server-only` import (lib/db/mutations/account.ts), which
// Vite cannot resolve outside Next's own build; this contract is about the
// TOUR past the name step, not the save itself, so the action is a stub.
vi.mock("@/app/(app)/account/actions", () => ({
  updateDisplayNameAction: vi.fn(async () => ({ ok: true })),
}));

// The three live beats and the close pull in the marketing site's real QR
// rendering, next/image and the style catalog; this contract is about the
// SCREENS and the exits, not what a picture draws, so every picture is a
// stub naming itself.
vi.mock("@/components/marketing/sections/how-it-works/step-picture", () => ({
  StepPicture: ({ id }: { id: string }) => <div data-testid={`picture-${id}`} />,
}));
vi.mock("@/components/marketing/sections/how-it-works/host-pictures", () => ({
  ReelPicture: () => <div data-testid="picture-reel" />,
}));

beforeEach(() => {
  push.mockClear();
  markWelcomedAction.mockClear();
});

describe("WelcomeFlow", () => {
  it("shows the required, untouched name step first when the account has none", () => {
    render(<WelcomeFlow needsName needsWelcome namePrefill="" />);
    expect(
      screen.getByRole("heading", { name: /welcome to partyreel/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/add your name/i)).toBeInTheDocument();
    expect(screen.queryByTestId("picture-create")).not.toBeInTheDocument();
  });

  it("walks the three live beats in the how-it-works order, then the close", () => {
    render(<WelcomeFlow needsName={false} needsWelcome namePrefill="" />);

    expect(screen.getByTestId("picture-create")).toBeInTheDocument();
    expect(screen.getByText(HOW_IT_WORKS[0].title)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /continue/i }));
    expect(screen.getByTestId("picture-share")).toBeInTheDocument();
    expect(screen.getByText(HOW_IT_WORKS[1].title)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /continue/i }));
    expect(screen.getByTestId("picture-fill")).toBeInTheDocument();
    expect(screen.getByText(HOW_IT_WORKS[2].title)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /continue/i }));
    expect(screen.getByTestId("picture-reel")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /continue/i })).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /create my first event/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /look around first/i }),
    ).toBeInTheDocument();
  });

  it("back returns to the previous beat and never navigates", () => {
    render(<WelcomeFlow needsName={false} needsWelcome namePrefill="" />);
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));
    expect(screen.getByTestId("picture-share")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /back/i }));
    expect(screen.getByTestId("picture-create")).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });

  it("has no back door on the first beat or the closing screen", () => {
    render(<WelcomeFlow needsName={false} needsWelcome namePrefill="" />);
    expect(screen.queryByRole("button", { name: /back/i })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /continue/i }));
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));
    expect(screen.queryByRole("button", { name: /back/i })).not.toBeInTheDocument();
  });

  it("marks welcomed before navigating to /dashboard on skip", async () => {
    render(<WelcomeFlow needsName={false} needsWelcome namePrefill="" />);
    fireEvent.click(screen.getByRole("button", { name: /^skip$/i }));
    await waitFor(() => expect(markWelcomedAction).toHaveBeenCalledTimes(1));
    expect(push).toHaveBeenCalledWith("/dashboard");
  });

  it("marks welcomed before navigating to the wizard on the primary close door", async () => {
    render(<WelcomeFlow needsName={false} needsWelcome namePrefill="" />);
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));
    fireEvent.click(
      screen.getByRole("button", { name: /create my first event/i }),
    );
    await waitFor(() => expect(markWelcomedAction).toHaveBeenCalledTimes(1));
    expect(push).toHaveBeenCalledWith("/dashboard/new");
  });

  it("marks welcomed before navigating to /dashboard on the skippable close door", async () => {
    render(<WelcomeFlow needsName={false} needsWelcome namePrefill="" />);
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));
    fireEvent.click(screen.getByRole("button", { name: /look around first/i }));
    await waitFor(() => expect(markWelcomedAction).toHaveBeenCalledTimes(1));
    expect(push).toHaveBeenCalledWith("/dashboard");
  });
});
