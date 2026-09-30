import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { act } from "@testing-library/react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { adoptTypedValue, useAdoptTypedValue } from "@/lib/adopt-typed-value";

/**
 * A FIELD TYPED INTO BEFORE REACT OWNED IT KEEPS WHAT WAS TYPED (crumbs-23, build 26's red-team).
 *
 * The page is rendered on a server, the person types into its field before any script has run, and only
 * then does React hydrate it: the exact order that lost the new event's name, the Guests room's Invited
 * field and the sign-in email. `renderToString` is the server, a change to the container's own field
 * (through the prototype's setter, as a keystroke writes the DOM without React's knowledge) is the typing,
 * and `hydrateRoot` is the page arriving; a re-render then follows, as a form library's does at its
 * field's mount, which is what used to write `""` over the words.
 */

let root: ReturnType<typeof hydrateRoot> | null = null;
afterEach(() => {
  act(() => root?.unmount());
  root = null;
  document.body.innerHTML = "";
});

/** Type into a node the way the browser does before React is there: past React, no event listener heard. */
function typeIntoDom(
  node: HTMLInputElement | HTMLTextAreaElement,
  text: string,
) {
  const proto =
    node instanceof HTMLTextAreaElement
      ? HTMLTextAreaElement.prototype
      : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, "value")!.set!.call(node, text);
}

/** Server-render `element` into the document, as the browser met it before its scripts. */
function serve(element: React.ReactElement) {
  const container = document.createElement("div");
  container.innerHTML = renderToString(element);
  document.body.append(container);
  return container;
}

/** Hydrate `element` over the served HTML; a second render follows at once (a form library's mount). */
async function hydrate(container: HTMLElement, element: React.ReactElement) {
  await act(async () => {
    root = hydrateRoot(container, element);
  });
}

function Controlled({ onValue }: { onValue?: (v: string) => void }) {
  const [v, setV] = useState("");
  const [, setTick] = useState(0);
  return (
    <>
      <Input
        aria-label="name"
        value={v}
        onChange={(e) => {
          onValue?.(e.target.value);
          setV(e.target.value);
        }}
      />
      {/* Anything that re-renders the field on mount, as a form library does. */}
      <Ticker onTick={() => setTick((n) => n + 1)} />
    </>
  );
}
function Ticker({ onTick }: { onTick: () => void }) {
  // A re-render right after mount, in the effect phase: what wiped the typed text.
  useMountTick(onTick);
  return null;
}
function useMountTick(onTick: () => void) {
  useEffect(() => {
    onTick();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

describe("a controlled field typed into before it hydrated", () => {
  it("★ keeps the words: the state is told, and the re-render that follows writes them back", async () => {
    const seen = vi.fn();
    const element = <Controlled onValue={seen} />;
    const container = serve(element);
    const field = () => container.querySelector("input")!;
    expect(field().value).toBe("");

    typeIntoDom(field(), "Maya & Sam's Wedding");
    await hydrate(container, element);

    expect(field().value).toBe("Maya & Sam's Wedding");
    // Told once, as a real change with the typed text (whatever handler the field has takes it).
    expect(seen).toHaveBeenCalledWith("Maya & Sam's Wedding");
  });

  it("★ works for a textarea the same way", async () => {
    function Note() {
      const [v, setV] = useState("");
      const [, setTick] = useState(0);
      return (
        <>
          <Textarea
            aria-label="note"
            value={v}
            onChange={(e) => setV(e.target.value)}
          />
          <Ticker onTick={() => setTick((n) => n + 1)} />
        </>
      );
    }
    const element = <Note />;
    const container = serve(element);
    typeIntoDom(container.querySelector("textarea")!, "bring the good camera");
    await hydrate(container, element);
    expect(container.querySelector("textarea")!.value).toBe(
      "bring the good camera",
    );
  });

  it("keeps a keystroke that follows: the next character lands on what was adopted", async () => {
    const element = <Controlled />;
    const container = serve(element);
    typeIntoDom(container.querySelector("input")!, "Maya");
    await hydrate(container, element);
    const field = container.querySelector("input")!;
    await act(async () => {
      typeIntoDom(field, "Maya!");
      field.dispatchEvent(new Event("input", { bubbles: true }));
    });
    expect(field.value).toBe("Maya!");
  });

  it("leaves an empty field, and a field nobody typed in, exactly as it was", async () => {
    const seen = vi.fn();
    const element = <Controlled onValue={seen} />;
    const container = serve(element);
    await hydrate(container, element);
    expect(container.querySelector("input")!.value).toBe("");
    expect(seen).not.toHaveBeenCalled();
  });

  it("leaves a field whose state already holds the text alone (nothing to adopt, no second change)", async () => {
    const seen = vi.fn();
    function Prefilled() {
      const [v, setV] = useState("kept@example.com");
      return (
        <Input
          aria-label="email"
          value={v}
          onChange={(e) => {
            seen(e.target.value);
            setV(e.target.value);
          }}
        />
      );
    }
    const element = <Prefilled />;
    const container = serve(element);
    await hydrate(container, element);
    expect(container.querySelector("input")!.value).toBe("kept@example.com");
    expect(seen).not.toHaveBeenCalled();
  });

  it("never touches an uncontrolled field: React never overwrites its own text", async () => {
    const element = <Input aria-label="search" defaultValue="" />;
    const container = serve(element);
    typeIntoDom(container.querySelector("input")!, "typed early");
    await hydrate(container, element);
    expect(container.querySelector("input")!.value).toBe("typed early");
  });

  it("does nothing for a checkbox, a file, a disabled or a read-only field", () => {
    for (const attrs of [
      { type: "checkbox" },
      { type: "file" },
      { disabled: true },
      { readOnly: true },
    ]) {
      const input = document.createElement("input");
      Object.assign(input, attrs);
      const heard = vi.fn();
      input.addEventListener("input", heard);
      expect(adoptTypedValue(input, "")).toBe(false);
      expect(heard).not.toHaveBeenCalled();
    }
  });

  it("hands a field on the client (its DOM just written from its state) nothing to adopt", () => {
    const input = document.createElement("input");
    input.value = "already there";
    expect(adoptTypedValue(input, "already there")).toBe(false);
    // ...and no value prop at all (uncontrolled) is not a field to adopt into.
    expect(adoptTypedValue(input, undefined)).toBe(false);
    expect(adoptTypedValue(input, null)).toBe(false);
  });
});

describe("a raw controlled input adopts through the hook, as the primitives do", () => {
  it("★ the Guests room's Invited shape: a bare <input> over its own state", async () => {
    function Invited() {
      const [typed, setTyped] = useState("");
      const [, setTick] = useState(0);
      const adoptRef = useAdoptTypedValue<HTMLInputElement>(typed);
      return (
        <>
          <input
            ref={adoptRef}
            aria-label="Add or paste addresses"
            type="email"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
          />
          <Ticker onTick={() => setTick((n) => n + 1)} />
        </>
      );
    }
    const element = <Invited />;
    const container = serve(element);
    typeIntoDom(container.querySelector("input")!, "maya@example.com");
    await hydrate(container, element);
    expect(container.querySelector("input")!.value).toBe("maya@example.com");
  });
});

describe("★ a form library's field (react-hook-form, as the create wizard and the sign-in email are)", () => {
  /** The wizard's own shape: `FormField` over `Input`, `defaultValues` empty, a value read back out. */
  function Wizard({ onName }: { onName: (name: string) => void }) {
    const form = useForm<{ name: string }>({ defaultValues: { name: "" } });
    const name = useWatch({ control: form.control, name: "name" });
    useEffect(() => onName(name), [name, onName]);
    return (
      <Form {...form}>
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input aria-label="name" autoFocus {...field} />
              </FormControl>
            </FormItem>
          )}
        />
      </Form>
    );
  }

  it("keeps what was typed before hydration, in the field and in the form's own value", async () => {
    const onName = vi.fn();
    const element = <Wizard onName={onName} />;
    const container = serve(element);
    typeIntoDom(container.querySelector("input")!, "Maya & Sam's Wedding");
    await hydrate(container, element);
    // Let every passive effect and every re-render the form library makes settle.
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });
    expect(container.querySelector("input")!.value).toBe(
      "Maya & Sam's Wedding",
    );
    expect(onName).toHaveBeenLastCalledWith("Maya & Sam's Wedding");
  });
});
