import { act } from "@testing-library/react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it } from "vitest";

import { LibraryIndex, type LibraryRow } from "./index-list";

/**
 * A SEARCH TYPED BEFORE THE PAGE HYDRATED FILTERS THE LIST (crumbs-25: the Library's search was a bare
 * controlled `<input>`, so what a reader typed while the page was loading stayed in the field and never
 * reached its state, and the list beneath it went on showing every entry).
 *
 * The page is rendered on a server, the reader types into the field before any script has run, and only then
 * does React hydrate it. The field keeps its text either way (nothing re-renders it in that window); what the
 * hook (`lib/adopt-typed-value.ts`) adds is that the state hears it, so the list agrees with the words.
 */

const row = (id: string, title: string): LibraryRow => ({
  id,
  title,
  href: `/design/library/${id}`,
  file: `src/components/${id}.tsx`,
  group: "Actions",
  for: `the ${title.toLowerCase()} control`,
  specimens: 1,
  variants: 0,
  play: false,
});
const ROWS = [row("button", "Button"), row("badge", "Badge")];

let root: ReturnType<typeof hydrateRoot> | null = null;
afterEach(() => {
  act(() => root?.unmount());
  root = null;
  document.body.innerHTML = "";
});

/** Type into a node the way the browser does before React is there: past React, no event listener heard. */
function typeIntoDom(node: HTMLInputElement, text: string) {
  Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype,
    "value",
  )!.set!.call(node, text);
}

describe("the Library's search", () => {
  it("★ hands a search typed before hydration to its state, so the list agrees with the field", async () => {
    const container = document.createElement("div");
    container.innerHTML = renderToString(<LibraryIndex rows={ROWS} />);
    document.body.append(container);
    const field = container.querySelector<HTMLInputElement>(
      'input[type="search"]',
    )!;
    const count = () =>
      container.querySelector('[role="search"] p')!.textContent;
    expect(count()).toBe("2 of 2");

    typeIntoDom(field, "zzqx-no-such-entry");
    await act(async () => {
      root = hydrateRoot(container, <LibraryIndex rows={ROWS} />);
    });

    expect(field.value).toBe("zzqx-no-such-entry");
    expect(count()).toBe("0 of 2");
    expect(container.querySelector('[role="status"]')?.textContent).toContain(
      "Nothing matches",
    );
  });

  it("filters to what was typed, and leaves an untouched field's list whole", async () => {
    const container = document.createElement("div");
    container.innerHTML = renderToString(<LibraryIndex rows={ROWS} />);
    document.body.append(container);
    const field = container.querySelector<HTMLInputElement>(
      'input[type="search"]',
    )!;
    typeIntoDom(field, "bad");
    await act(async () => {
      root = hydrateRoot(container, <LibraryIndex rows={ROWS} />);
    });
    expect(container.querySelector('[role="search"] p')!.textContent).toBe(
      "1 of 2",
    );
    expect(container.querySelectorAll("li a")).toHaveLength(1);
  });

  it("with nothing typed, hydrates to the whole list", async () => {
    const container = document.createElement("div");
    container.innerHTML = renderToString(<LibraryIndex rows={ROWS} />);
    document.body.append(container);
    await act(async () => {
      root = hydrateRoot(container, <LibraryIndex rows={ROWS} />);
    });
    expect(container.querySelector('[role="search"] p')!.textContent).toBe(
      "2 of 2",
    );
  });
});
