/**
 * ★ THE HOST'S MANUAL ADD SAYS WHAT THE DEVICE IN HAND DOES (crumbs-91, the ROADMAP's Host line). Its one hint read
 * "Tap to choose, or drag them here": half wrong on a phone, which has no drag, and half at a desk, which clicks. The
 * hint is two lines now and the pointer's media query shows one, so what is pinned for the words is the switch
 * itself (jsdom runs no media query): the desk's line hidden under a coarse pointer, the phone's shown only there,
 * and both in the server's markup, which a phone's hydration leaves as it was (a read of the pointer at render would
 * swap them there: the flash the stylesheet avoids). The rest is what the box did before it moved to the host's side
 * and still does: the picker by a click, Enter or Space; the plan's accept and words; a drop at a desk; the reset that
 * lets the same file be picked again; and a disabled box that takes nothing.
 */
import { act, fireEvent, render, screen } from "@testing-library/react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import { FileDropzone } from "@/components/app/file-dropzone";

const DESK = "Click to choose, or drag them here";
const PHONE = "Tap to choose";

const photo = (name: string) => new File(["x"], name, { type: "image/jpeg" });

function mount(props: { allowVideos?: boolean; disabled?: boolean } = {}) {
  const onFiles = vi.fn();
  render(
    <FileDropzone
      onFiles={onFiles}
      allowVideos={props.allowVideos ?? true}
      disabled={props.disabled}
    />,
  );
  return {
    onFiles,
    box: screen.getByRole("button"),
    input: document.querySelector<HTMLInputElement>('input[type="file"]')!,
  };
}

/** Watches the input's value being written: a browser fires no change for the same file picked twice without it. */
function watchValue(input: HTMLInputElement) {
  const written = vi.fn();
  Object.defineProperty(input, "value", {
    configurable: true,
    get: () => "",
    set: written,
  });
  return written;
}

// The hydration case's own root and container (the rest are RTL's, which its cleanup takes).
let root: ReturnType<typeof hydrateRoot> | null = null;
let served: HTMLElement | null = null;
const realMatchMedia = window.matchMedia;
afterEach(() => {
  act(() => root?.unmount());
  root = null;
  served?.remove();
  served = null;
  window.matchMedia = realMatchMedia;
});

describe("the hint, for the device in hand", () => {
  it("★ says click or drag at a desk and tap alone on a phone, the pointer's media query choosing", () => {
    mount();
    const desk = screen.getByText(DESK);
    const phone = screen.getByText(PHONE);
    expect(desk).toHaveClass("pointer-coarse:hidden");
    expect(desk).not.toHaveClass("hidden");
    expect(phone).toHaveClass("hidden", "pointer-coarse:inline");
    // Neither line is the other device's: a phone is never told to drag, nor a desk to tap.
    expect(phone.textContent).not.toMatch(/drag|click/i);
    expect(desk.textContent).not.toMatch(/tap/i);
    // The one line half wrong on either is gone.
    expect(screen.queryByText(/Tap to choose, or drag/)).toBeNull();
  });

  it("★ is the server's markup on a phone too: nothing reads the pointer at render, so nothing swaps at hydration", async () => {
    const box = () => <FileDropzone onFiles={() => {}} allowVideos />;
    const container = document.createElement("div");
    served = container;
    container.innerHTML = renderToString(box());
    document.body.append(container);
    const markup = container.innerHTML;
    expect(container.textContent).toContain(DESK);
    expect(container.textContent).toContain(PHONE);

    // A phone: every pointer query a read could make answers coarse.
    window.matchMedia = ((query: string) => ({
      ...realMatchMedia(query),
      matches: /pointer:\s*coarse|any-pointer:\s*coarse|hover:\s*none/.test(
        query,
      ),
    })) as typeof window.matchMedia;
    const mismatches: unknown[] = [];
    await act(async () => {
      root = hydrateRoot(container, box(), {
        onRecoverableError: (error) => mismatches.push(error),
      });
    });
    expect(mismatches).toEqual([]);
    expect(container.innerHTML).toBe(markup);
  });
});

describe("the plan's words and accept", () => {
  it("offers photos and videos where the plan takes video", () => {
    const { input } = mount({ allowVideos: true });
    expect(screen.getByText("Add photos & videos")).toBeInTheDocument();
    expect(input.accept).toBe("image/*,video/*");
  });

  it("offers photos only where it does not, so a video cannot even be selected", () => {
    const { input } = mount({ allowVideos: false });
    expect(screen.getByText("Add photos")).toBeInTheDocument();
    expect(screen.queryByText(/videos/)).toBeNull();
    expect(input.accept).toBe("image/*");
  });
});

describe("the picker", () => {
  it("opens on a click, and on Enter or Space as a button does, and on no other key", () => {
    const { box, input } = mount();
    const open = vi.spyOn(input, "click").mockImplementation(() => {});
    fireEvent.click(box);
    expect(open).toHaveBeenCalledTimes(1);
    expect(fireEvent.keyDown(box, { key: "Enter" })).toBe(false);
    expect(open).toHaveBeenCalledTimes(2);
    // Space is taken, so the page does not scroll under the press.
    expect(fireEvent.keyDown(box, { key: " " })).toBe(false);
    expect(open).toHaveBeenCalledTimes(3);
    expect(fireEvent.keyDown(box, { key: "a" })).toBe(true);
    expect(open).toHaveBeenCalledTimes(3);
  });

  it("is a Tab stop, and its input takes many at a time", () => {
    const { box, input } = mount();
    expect(box.tabIndex).toBe(0);
    expect(input.multiple).toBe(true);
    expect(input.hidden).toBe(true);
  });

  it("★ hands over what she picked, then clears the input so the same file can be picked again", () => {
    const { onFiles, input } = mount();
    const written = watchValue(input);
    const a = photo("a.jpg");
    const b = photo("b.jpg");
    fireEvent.change(input, { target: { files: [a, b] } });
    expect(onFiles).toHaveBeenCalledTimes(1);
    expect(onFiles).toHaveBeenCalledWith([a, b]);
    expect(written).toHaveBeenCalledWith("");
  });

  it("hands over nothing for a pick she cancelled", () => {
    const { onFiles, input } = mount();
    fireEvent.change(input, { target: { files: [] } });
    expect(onFiles).not.toHaveBeenCalled();
  });
});

describe("a drop, at a desk", () => {
  it("★ takes the files dropped on it, and keeps the browser from opening them in the tab", () => {
    const { onFiles, box } = mount();
    const a = photo("a.jpg");
    // Both are taken: a dragover left alone refuses the drop, and a drop left alone opens the file in the tab.
    expect(fireEvent.dragOver(box)).toBe(false);
    expect(fireEvent.drop(box, { dataTransfer: { files: [a] } })).toBe(false);
    expect(onFiles).toHaveBeenCalledWith([a]);
  });

  it("takes nothing from a drop that carries no file (a link, a run of text)", () => {
    const { onFiles, box } = mount();
    fireEvent.drop(box, { dataTransfer: { files: [] } });
    expect(onFiles).not.toHaveBeenCalled();
  });
});

describe("a disabled box", () => {
  it("says so, and takes no files whichever way they come", () => {
    const { onFiles, box, input } = mount({ disabled: true });
    expect(box).toHaveAttribute("aria-disabled", "true");
    expect(input.disabled).toBe(true);
    fireEvent.drop(box, { dataTransfer: { files: [photo("a.jpg")] } });
    fireEvent.change(input, { target: { files: [photo("b.jpg")] } });
    expect(onFiles).not.toHaveBeenCalled();
  });
});
