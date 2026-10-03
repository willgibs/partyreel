/**
 * THE SHUTTER'S ONE PRESS (Will's `video=hold`): a press is a photo on its release, a hold past `HOLD_MS` films and its
 * release stops it, a press the browser takes away ends as nothing (or keeps the video it began), and the camera's own
 * end of a video lets the lift that follows end as nothing.
 */
import { act, fireEvent, render, screen } from "@testing-library/react";
import { useEffect } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { HOLD_MS, useShutterPress } from "./use-shutter-press";

type Handlers = {
  onPhoto: () => void;
  onFilmStart: () => void;
  onFilmStop: (cancelled: boolean) => void;
};

const held: { release: () => void } = { release: () => {} };
const release = () => held.release();

function Shutter({
  canFilm,
  disabled = false,
  ...handlers
}: Handlers & { canFilm: boolean; disabled?: boolean }) {
  const press = useShutterPress({ canFilm, disabled, ...handlers });
  useEffect(() => {
    held.release = press.release;
  });
  return (
    <button
      type="button"
      data-pressed={press.pressed ? "" : undefined}
      {...press.handlers}
    >
      Shutter
    </button>
  );
}

function setup(canFilm: boolean, disabled = false) {
  const handlers = {
    onPhoto: vi.fn(),
    onFilmStart: vi.fn(),
    onFilmStop: vi.fn(),
  };
  render(<Shutter canFilm={canFilm} disabled={disabled} {...handlers} />);
  const button = screen.getByRole("button");
  // jsdom has no pointer capture; the hook asks for it and carries on without.
  button.setPointerCapture = vi.fn();
  return { button, ...handlers };
}

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

describe("useShutterPress", () => {
  it("takes a photo as a short press lifts", () => {
    const { button, onPhoto, onFilmStart } = setup(true);
    fireEvent.pointerDown(button, { pointerType: "touch", pointerId: 1 });
    expect(onPhoto).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(HOLD_MS - 50));
    fireEvent.pointerUp(button, { pointerId: 1 });
    expect(onPhoto).toHaveBeenCalledTimes(1);
    expect(onFilmStart).not.toHaveBeenCalled();
  });

  it("films a hold and stops as it lifts", () => {
    const { button, onPhoto, onFilmStart, onFilmStop } = setup(true);
    fireEvent.pointerDown(button, { pointerType: "touch", pointerId: 1 });
    act(() => vi.advanceTimersByTime(HOLD_MS));
    expect(onFilmStart).toHaveBeenCalledTimes(1);
    fireEvent.pointerUp(button, { pointerId: 1 });
    expect(onFilmStop).toHaveBeenCalledWith(false);
    expect(onPhoto).not.toHaveBeenCalled();
  });

  it("takes a photo however long the press where the album takes no video", () => {
    const { button, onPhoto, onFilmStart } = setup(false);
    fireEvent.pointerDown(button, { pointerType: "touch", pointerId: 1 });
    act(() => vi.advanceTimersByTime(HOLD_MS * 4));
    fireEvent.pointerUp(button, { pointerId: 1 });
    expect(onFilmStart).not.toHaveBeenCalled();
    expect(onPhoto).toHaveBeenCalledTimes(1);
  });

  it("ends a press the browser took away as nothing, and keeps a video it had begun", () => {
    const first = setup(true);
    fireEvent.pointerDown(first.button, { pointerType: "touch", pointerId: 1 });
    fireEvent.pointerCancel(first.button, { pointerId: 1 });
    expect(first.onPhoto).not.toHaveBeenCalled();

    fireEvent.pointerDown(first.button, { pointerType: "touch", pointerId: 2 });
    act(() => vi.advanceTimersByTime(HOLD_MS));
    fireEvent.pointerCancel(first.button, { pointerId: 2 });
    expect(first.onFilmStop).toHaveBeenCalledWith(true);
  });

  it("lets the lift after the camera ended a video itself end as nothing", () => {
    const { button, onPhoto, onFilmStop } = setup(true);
    fireEvent.pointerDown(button, { pointerType: "touch", pointerId: 1 });
    act(() => vi.advanceTimersByTime(HOLD_MS));
    act(() => release());
    fireEvent.pointerUp(button, { pointerId: 1 });
    expect(onPhoto).not.toHaveBeenCalled();
    expect(onFilmStop).not.toHaveBeenCalled();
    // And the next press is a press again.
    fireEvent.pointerDown(button, { pointerType: "touch", pointerId: 2 });
    fireEvent.pointerUp(button, { pointerId: 2 });
    expect(onPhoto).toHaveBeenCalledTimes(1);
  });

  it("presses from the keyboard, a key's own repeat no second press", () => {
    const { button, onPhoto, onFilmStart, onFilmStop } = setup(true);
    fireEvent.keyDown(button, { key: " " });
    fireEvent.keyDown(button, { key: " ", repeat: true });
    fireEvent.keyUp(button, { key: " " });
    expect(onPhoto).toHaveBeenCalledTimes(1);
    fireEvent.keyDown(button, { key: "Enter" });
    act(() => vi.advanceTimersByTime(HOLD_MS));
    fireEvent.keyUp(button, { key: "Enter" });
    expect(onFilmStart).toHaveBeenCalledTimes(1);
    expect(onFilmStop).toHaveBeenCalledWith(false);
  });

  it("takes no press while the camera cannot shoot, and no mouse button but the first", () => {
    const off = setup(true, true);
    fireEvent.pointerDown(off.button, { pointerType: "touch", pointerId: 1 });
    fireEvent.pointerUp(off.button, { pointerId: 1 });
    expect(off.onPhoto).not.toHaveBeenCalled();
  });
});
