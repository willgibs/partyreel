/**
 * THE ONE BLOCK SCREEN'S CONTRACT: the number it shows is the act's own (a preview from the block
 * itself, and Block waits for it), the names-only switch appears only where a block would hold on
 * one phone and is off until the host turns it on, and a person already blocked is told so rather
 * than blocked twice. Words are pinned only where they are the rule (the count, the switch).
 */
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
const toast = { success: vi.fn(), error: vi.fn() };
vi.mock("sonner", () => ({ toast }));
const previewBlockAction = vi.fn();
const blockFromEventAction = vi.fn();
vi.mock("@/app/(app)/dashboard/[eventId]/guests/actions", () => ({
  previewBlockAction: (...a: unknown[]) => previewBlockAction(...a),
  blockFromEventAction: (...a: unknown[]) => blockFromEventAction(...a),
}));

const { BlockConfirm } = await import("./block-confirm");

const TARGET = { kind: "row", guestId: "g-1" } as const;
const preview = (over: Record<string, unknown> = {}) => ({
  ok: true,
  preview: {
    eventId: "e-1",
    label: "Theo",
    verified: false,
    uploads: 3,
    namesOnly: true,
    already: false,
    ...over,
  },
});

function mount(onOpenChange = vi.fn()) {
  render(
    <BlockConfirm
      open
      onOpenChange={onOpenChange}
      target={TARGET}
      name="Theo"
    />,
  );
  return onOpenChange;
}

const blockButton = () => screen.getByRole("button", { name: "Block" });

beforeEach(() => {
  vi.clearAllMocks();
});

describe("BlockConfirm", () => {
  it("★ Block waits for the act's own preview, then shows its count", async () => {
    let answer: (value: unknown) => void = () => {};
    previewBlockAction.mockReturnValue(new Promise((r) => (answer = r)));
    mount();
    expect(screen.getByText("Block Theo from this event?")).toBeInTheDocument();
    expect(blockButton()).toBeDisabled();
    expect(previewBlockAction).toHaveBeenCalledWith(TARGET);

    await act(async () => answer(preview()));
    expect(
      screen.getByText("Their 3 uploads move to Deleted"),
    ).toBeInTheDocument();
    expect(blockButton()).toBeEnabled();
  });

  it("★ on a names-only album the switch is offered, off; Block sends it as the host left it", async () => {
    previewBlockAction.mockResolvedValue(preview());
    blockFromEventAction.mockResolvedValue({
      ok: true,
      removed: 3,
      already: false,
    });
    const onOpenChange = mount();
    const offer = await screen.findByRole("switch", {
      name: /Also require verified emails/,
    });
    expect(offer).toHaveAttribute("aria-checked", "false");

    fireEvent.click(blockButton());
    await waitFor(() =>
      expect(blockFromEventAction).toHaveBeenCalledWith(TARGET, {
        requireVerifiedEmail: false,
      }),
    );
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
    expect(toast.success).toHaveBeenCalledWith("Theo is blocked.", {
      description: "3 uploads moved to Deleted.",
    });
    expect(refresh).toHaveBeenCalled();
  });

  it("turning the switch on sends it on", async () => {
    previewBlockAction.mockResolvedValue(preview());
    blockFromEventAction.mockResolvedValue({
      ok: true,
      removed: 3,
      already: false,
    });
    mount();
    fireEvent.click(
      await screen.findByRole("switch", {
        name: /Also require verified emails/,
      }),
    );
    fireEvent.click(blockButton());
    await waitFor(() =>
      expect(blockFromEventAction).toHaveBeenCalledWith(TARGET, {
        requireVerifiedEmail: true,
      }),
    );
  });

  it("an album that already requires verified emails offers no switch, and never asks for one", async () => {
    previewBlockAction.mockResolvedValue(
      preview({ namesOnly: false, verified: true }),
    );
    blockFromEventAction.mockResolvedValue({
      ok: true,
      removed: 0,
      already: false,
    });
    mount();
    await screen.findByText("Their 3 uploads move to Deleted");
    expect(screen.queryByRole("switch")).toBeNull();
    fireEvent.click(blockButton());
    await waitFor(() =>
      expect(blockFromEventAction).toHaveBeenCalledWith(TARGET, {
        requireVerifiedEmail: false,
      }),
    );
  });

  it("a person already blocked is told so, with no Block to press", async () => {
    previewBlockAction.mockResolvedValue(preview({ already: true }));
    mount();
    expect(
      await screen.findByText("Theo is already blocked"),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Block" })).toBeNull();
  });

  it("a refused preview says why, and Block stays shut", async () => {
    previewBlockAction.mockResolvedValue({
      ok: false,
      message: "That person or event is no longer available.",
    });
    mount();
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "That person or event is no longer available.",
    );
    expect(blockButton()).toBeDisabled();
  });

  it("a refused block keeps the screen open and says why", async () => {
    previewBlockAction.mockResolvedValue(preview());
    blockFromEventAction.mockResolvedValue({
      ok: false,
      message: "Only a guest who added photos can be blocked.",
    });
    const onOpenChange = mount();
    await screen.findByText("Their 3 uploads move to Deleted");
    fireEvent.click(blockButton());
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "Only a guest who added photos can be blocked.",
      ),
    );
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(refresh).not.toHaveBeenCalled();
  });

  it("an equal target on a re-render asks nothing twice", async () => {
    previewBlockAction.mockResolvedValue(preview());
    const { rerender } = render(
      <BlockConfirm
        open
        onOpenChange={vi.fn()}
        target={{ ...TARGET }}
        name="Theo"
      />,
    );
    await screen.findByText("Their 3 uploads move to Deleted");
    rerender(
      <BlockConfirm
        open
        onOpenChange={vi.fn()}
        target={{ ...TARGET }}
        name="Theo"
      />,
    );
    expect(previewBlockAction).toHaveBeenCalledOnce();
  });
});
