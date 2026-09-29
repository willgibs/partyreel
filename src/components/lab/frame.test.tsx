/**
 * A PORTALLED FRAME MOUNTS ITS SCENE ONCE, INTO THE DOCUMENT THAT STAYS (crumbs-16).
 *
 * An iframe with a `srcdoc` is born holding an `about:blank` document, and the srcdoc one commits over
 * it a task or more later. A scene portalled into the first document is mounted twice, and every image
 * it asked for is cancelled with that document: on a board of fifteen frames that is 320 requests where
 * 150 are needed, and Next's dev image optimizer, which shares one pending result among the requests
 * for an image, never answers the frames' own second ask. The server's six connections fill and the
 * next navigation cannot start: gate 71's `lab:demo` hung on `demo-framing.names` exactly so
 * (`frame.tsx`, the copy effect, has the whole account).
 *
 * jsdom never replaces an iframe's document (it does not implement `srcdoc`), so the first document is
 * stood in front of the frame here: until the iframe's own `load`, `contentDocument` is a document
 * that will go; from the load on it is the one that stays. That is the browser's order, and the order
 * the frame's copy effect has to wait out. The other test is the case the wait must not break: a frame
 * in the server's HTML, whose srcdoc committed before React hydrated, so no `load` is coming for React
 * to hear, and whose document already reads `about:srcdoc`.
 */
import { act, render } from "@testing-library/react";
import { useEffect, useRef } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Frame } from "./frame";

const realContentDocument = Object.getOwnPropertyDescriptor(
  HTMLIFrameElement.prototype,
  "contentDocument",
)!.get!;

/** What the scene records when it mounts: the document it landed in. */
function Scene({ onMount }: { onMount: (doc: Document) => void }) {
  const ref = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    if (ref.current) onMount(ref.current.ownerDocument);
  }, [onMount]);
  return <p ref={ref}>the scene</p>;
}

/** Resolves on the iframe's next `load`, whichever of the listeners hears it. */
function nextLoad(iframe: HTMLIFrameElement) {
  return new Promise<void>((resolve) =>
    iframe.addEventListener("load", () => resolve(), { once: true }),
  );
}

/** Lets the frame's own effects and timers run once the load has been heard. */
async function settle() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 20));
  });
}

function hasCopiedSheets(doc: Document) {
  return doc.head.querySelector("[data-lab-copied]") !== null;
}

describe("Frame: a portalled scene and the iframe's first document", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
    // A sheet in the parent, for the frame to copy across.
    const sheet = document.createElement("style");
    sheet.dataset.testSheet = "";
    sheet.textContent = "body{color:red}";
    document.head.appendChild(sheet);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    document.head.querySelector("[data-test-sheet]")?.remove();
  });

  it("waits for the first document to go, then mounts once into the one that stays", async () => {
    const first = document.implementation.createHTMLDocument("first");
    vi.spyOn(
      HTMLIFrameElement.prototype,
      "contentDocument",
      "get",
    ).mockImplementation(function (this: HTMLIFrameElement) {
      const real = realContentDocument.call(this) as Document | null;
      // jsdom's own document is `loading` until the frame's load: that is the moment the browser's
      // srcdoc document commits over the first one.
      return real && real.readyState === "loading" ? first : real;
    });

    const mounts: Document[] = [];
    const onMount = (doc: Document) => {
      mounts.push(doc);
    };
    const { container } = render(
      <Frame id="scene" w={400} h={300} title="Scene">
        <Scene onMount={onMount} />
      </Frame>,
    );
    const iframe = container.querySelector("iframe")!;
    // The premise: the frame is holding the document that will go.
    expect(iframe.contentDocument).toBe(first);

    const loaded = nextLoad(iframe);
    await act(async () => {
      await loaded;
    });
    await settle();

    const stays = iframe.contentDocument!;
    expect(stays).not.toBe(first);
    const label = (doc: Document) =>
      doc === first ? "first" : doc === stays ? "stays" : "other";
    expect(mounts.map(label)).toEqual(["stays"]);
    // Nor were the parent's sheets copied into the document that went.
    expect(hasCopiedSheets(first)).toBe(false);
    expect(hasCopiedSheets(stays)).toBe(true);
  });

  it("does not wait for a load that already happened (a srcdoc that committed before hydration)", async () => {
    const committed = document.implementation.createHTMLDocument("committed");
    Object.defineProperty(committed, "URL", { value: "about:srcdoc" });
    vi.spyOn(
      HTMLIFrameElement.prototype,
      "contentDocument",
      "get",
    ).mockReturnValue(committed);

    const mounts: Document[] = [];
    const onMount = (doc: Document) => {
      mounts.push(doc);
    };
    const { container } = render(
      <Frame id="scene" w={400} h={300} title="Scene">
        <Scene onMount={onMount} />
      </Frame>,
    );
    // Right after the first commit, before any load event: nothing is coming that React would hear
    // (its onLoad did not exist when the browser fired it), so waiting for one would leave the frame
    // empty for good.
    expect(mounts).toEqual([committed]);

    const loaded = nextLoad(container.querySelector("iframe")!);
    await act(async () => {
      await loaded;
    });
    await settle();
    // And a load that does come is not a second mount.
    expect(mounts).toEqual([committed]);
  });
});
