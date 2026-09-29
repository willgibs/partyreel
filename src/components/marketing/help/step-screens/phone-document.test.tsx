/**
 * A PHONE SCREEN MOUNTS ITS PICTURE ONCE, INTO THE DOCUMENT THAT STAYS (crumbs-18; the lab's `Frame` had the
 * same shape, `lab/frame.test.tsx`, fixed by crumbs-16).
 *
 * An iframe with a `srcdoc` is born holding an `about:blank` document, and the srcdoc one commits over it a
 * task or more later. The picture used to be mounted into whichever document the frame held when the effect
 * ran and again on `load`: when the effect won that race, the site's stylesheets were cloned into the
 * document that was about to go, the whole door screen was built in it, and everything was built again in
 * the one that stayed (driven in a browser with the srcdoc held back 120ms: the first document took all six
 * stylesheets, and the picture moved out of it when the load came). Whether the effect wins depends on the
 * machine, so the wait is the rule, not a fix for one timing.
 *
 * jsdom never replaces an iframe's document (it does not implement `srcdoc`), so the first document is
 * stood in front of the frame here, as the frame's test does: until the iframe's own `load`,
 * `contentDocument` is a document that will go; from the load on it is the one that stays. The other test
 * is the case the wait must not break: a frame whose srcdoc had already committed by the time the effect
 * ran, so no `load` is coming that the effect could hear, and whose document already reads `about:srcdoc`.
 */
import { act, render } from "@testing-library/react";
import { useEffect, useRef } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { PhoneDocument } from "./phone-document";

const realContentDocument = Object.getOwnPropertyDescriptor(
  HTMLIFrameElement.prototype,
  "contentDocument",
)!.get!;

/** What the picture records when it mounts: the document it landed in. */
function Scene({ onMount }: { onMount: (doc: Document) => void }) {
  const ref = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    if (ref.current) onMount(ref.current.ownerDocument);
  }, [onMount]);
  return <p ref={ref}>the picture</p>;
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
  return doc.head.querySelector("[data-shot-copied]") !== null;
}

describe("PhoneDocument: the picture and the iframe's first document", () => {
  beforeEach(() => {
    // The reader is at the picture: the frame is made at once, on this first observation.
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        constructor(private readonly onSee: IntersectionObserverCallback) {}
        observe() {
          this.onSee(
            [{ isIntersecting: true } as IntersectionObserverEntry],
            this as unknown as IntersectionObserver,
          );
        }
        unobserve() {}
        disconnect() {}
      },
    );
    // A sheet in the page, for the frame to clone across.
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

  it("★ waits for the first document to go, then mounts once into the one that stays", async () => {
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
      <PhoneDocument label="A screen">
        <Scene onMount={onMount} />
      </PhoneDocument>,
    );
    const iframe = container.querySelector("iframe")!;
    // The premise: the frame is holding the document that will go.
    expect(iframe.contentDocument).toBe(first);
    // And nothing has been made in it: the picture waits.
    expect(mounts).toEqual([]);

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
    // Nor were the page's sheets cloned into the document that went.
    expect(hasCopiedSheets(first)).toBe(false);
    expect(hasCopiedSheets(stays)).toBe(true);
  });

  it("does not wait for a load that already happened (a srcdoc that committed before the effect ran)", async () => {
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
      <PhoneDocument label="A screen">
        <Scene onMount={onMount} />
      </PhoneDocument>,
    );
    // Right after the first commit, before any load event: nothing is coming that the effect would hear
    // (the browser fired it before the listener existed), so waiting for one would leave the phone empty
    // for good.
    expect(mounts).toEqual([committed]);
    expect(hasCopiedSheets(committed)).toBe(true);

    const loaded = nextLoad(container.querySelector("iframe")!);
    await act(async () => {
      await loaded;
    });
    await settle();
    // And a load that does come is not a second mount.
    expect(mounts).toEqual([committed]);
  });
});
