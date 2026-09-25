/**
 * THE UPLOAD'S PROGRESS, ONE REPORT A FRAME (the album-window lane). Every
 * report is a state patch that re-renders the album around the in-flight tile,
 * and XHR fires dozens a second; a frame can show one number. What is held: a
 * burst inside one frame reports once, with its latest fraction, and a request
 * that has settled reports nothing more (a late frame would drag the bar back).
 */
import { afterEach, describe, expect, it, vi } from "vitest";

import { perFrame } from "./uploader";

describe("upload progress is reported once a frame", () => {
  const frames: FrameRequestCallback[] = [];
  const flush = () => {
    const due = frames.splice(0);
    for (const f of due) f(0);
  };
  vi.stubGlobal("requestAnimationFrame", (f: FrameRequestCallback) => {
    frames.push(f);
    return frames.length;
  });
  vi.stubGlobal("cancelAnimationFrame", (id: number) => {
    frames.splice(id - 1, 1);
  });
  afterEach(() => {
    frames.length = 0;
  });

  it("reports the latest fraction of a burst, once", () => {
    const report = vi.fn();
    const p = perFrame(report);
    p.push(0.1);
    p.push(0.2);
    p.push(0.35);
    expect(report).not.toHaveBeenCalled();
    flush();
    expect(report).toHaveBeenCalledTimes(1);
    expect(report).toHaveBeenCalledWith(0.35);
    p.push(0.5);
    flush();
    expect(report).toHaveBeenLastCalledWith(0.5);
    expect(report).toHaveBeenCalledTimes(2);
  });

  it("reports nothing once the request has settled", () => {
    const report = vi.fn();
    const p = perFrame(report);
    p.push(0.9);
    p.stop();
    flush();
    expect(report).not.toHaveBeenCalled();
  });

  it("asks for no frame when nobody listens", () => {
    const p = perFrame(undefined);
    p.push(0.4);
    expect(frames).toHaveLength(0);
  });
});
