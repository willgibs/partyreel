/**
 * HOW GUESTS ADD, AND WHEN EVERYONE SEES WHAT'S ADDED (20261002200000): the mountable control's decisions. Each answer
 * is one save of both columns; a change that would show held or waiting photos asks first in its own line, and
 * nothing else asks; Develop now while a time waits; a develop time picked in her own zone, within reach.
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { developTimeWords } from "@/lib/disposable/develop-words";
import { defaultDevelopAt } from "@/lib/disposable/reveal";

// The bound control's Settings state reaches the server's actions; the mountable one under test takes a save.
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/lib/reel/defaults-action", () => ({ setReelDefaults: vi.fn() }));
vi.mock("@/app/(app)/dashboard/actions", () => ({
  updateEventAction: vi.fn(),
  updateEventSocialSettingsAction: vi.fn(),
}));
vi.mock("@/app/(app)/dashboard/[eventId]/actions", () => ({
  setEventDoorAction: vi.fn(),
}));

const { CaptureAndReveal } = await import("./camera-settings");

const NOW = new Date("2026-10-02T20:00:00Z");
const AHEAD = "2026-10-03T16:00:00.000Z";
const PAST = "2026-10-01T16:00:00.000Z";

type Value = Parameters<typeof CaptureAndReveal>[0]["value"];

function mount(value: Partial<Value> = {}, heldCount = 0) {
  const onSave = vi.fn();
  render(
    <CaptureAndReveal
      value={{ capture: "upload", review: false, developsAt: null, ...value }}
      rollSize={null}
      eventDate={null}
      heldCount={heldCount}
      savingCapture={false}
      savingReveal={false}
      onSave={onSave}
    />,
  );
  return onSave;
}

const radio = (name: string) => screen.getByRole("radio", { name });

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(NOW);
});
afterEach(() => {
  vi.useRealTimers();
});

describe("how guests add", () => {
  it("free uploads or the album's camera, the roll said; a choice saves the capture alone", () => {
    const onSave = mount();
    expect(radio("Free uploads")).toHaveAttribute("aria-checked", "true");
    expect(screen.getByText("A roll of 24 shots each. Removing one frees its frame.")).toBeInTheDocument();
    fireEvent.click(radio("The album's camera"));
    expect(onSave).toHaveBeenCalledWith({ capture: "camera" });
    // Choosing what is already chosen saves nothing.
    fireEvent.click(radio("Free uploads"));
    expect(onSave).toHaveBeenCalledTimes(1);
  });
});

describe("when everyone sees what's added: one choice of three", () => {
  it("reads the two columns as one answer", () => {
    mount({ review: true });
    expect(radio("Once you approve each")).toHaveAttribute("aria-checked", "true");
  });

  it("★ each answer is one save of both columns; nothing held, nothing asks", () => {
    const onSave = mount();
    fireEvent.click(radio("Once you approve each"));
    expect(onSave).toHaveBeenLastCalledWith({ review: true, developsAt: null });
    fireEvent.click(radio("At a develop time"));
    expect(onSave).toHaveBeenLastCalledWith({
      review: false,
      developsAt: defaultDevelopAt({ eventDate: null }).toISOString(),
    });
  });

  it("★ leaving approval with photos held asks first, and says what happens to them", () => {
    const onSave = mount({ review: true }, 2);
    fireEvent.click(radio("Right away"));
    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByText("2 photos under review are approved and show to everyone now.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Keep it as it is" }));
    expect(onSave).not.toHaveBeenCalled();

    fireEvent.click(radio("At a develop time"));
    expect(
      screen.getByText("2 photos under review are approved, and everyone sees them at the develop."),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Approve them for the develop" }));
    expect(onSave).toHaveBeenCalledWith({
      review: false,
      developsAt: defaultDevelopAt({ eventDate: null }).toISOString(),
    });
  });

  it("★ leaving a waiting develop asks first: every photo added so far shows at once", () => {
    const onSave = mount({ developsAt: AHEAD });
    expect(radio("At a develop time")).toHaveAttribute("aria-checked", "true");
    fireEvent.click(radio("Once you approve each"));
    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByText("Every photo added so far shows now, to every guest.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Show them now" }));
    expect(onSave).toHaveBeenCalledWith({ review: true, developsAt: null });
  });

  it("Develop now, while a time waits, asks first and saves now", () => {
    const onSave = mount({ developsAt: AHEAD });
    fireEvent.click(screen.getByRole("button", { name: "Develop now" }));
    expect(onSave).not.toHaveBeenCalled();
    const confirm = screen.getAllByRole("button", { name: "Develop now" }).at(-1)!;
    fireEvent.click(confirm);
    expect(onSave).toHaveBeenCalledWith({ developsAt: NOW.toISOString() });
  });

  it("no Develop now once developed, and the time says so", () => {
    mount({ developsAt: PAST });
    expect(screen.queryByRole("button", { name: "Develop now" })).toBeNull();
    expect(
      screen.getByText(`Developed ${developTimeWords(PAST)}. New ones show straight away.`),
    ).toBeInTheDocument();
  });

  it("says the time as the guest's own tracker does: one formatter (`develop-words`) for both sides", () => {
    mount({ developsAt: AHEAD });
    expect(screen.getByText(`Develops ${developTimeWords(AHEAD)}.`)).toBeInTheDocument();
  });

  it("a develop time picked in her own zone saves when she leaves the field; one out of reach saves nothing", () => {
    const onSave = mount({ developsAt: AHEAD });
    const field = screen.getByLabelText("Develop time");
    fireEvent.change(field, { target: { value: "2026-10-05T10:30" } });
    fireEvent.blur(field);
    expect(onSave).toHaveBeenCalledWith({ developsAt: new Date("2026-10-05T10:30").toISOString() });
    fireEvent.change(field, { target: { value: "2028-10-05T10:30" } });
    fireEvent.blur(field);
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Pick a time within a year.")).toBeInTheDocument();
  });
});
