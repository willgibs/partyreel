"use client";

/**
 * A FIELD TYPED INTO BEFORE REACT OWNED IT KEEPS WHAT WAS TYPED (crumbs-23, build 26's red-team: "the first
 * keystroke or click after a page load is often lost": the new event's name, the Guests room's Invited
 * field).
 *
 * A controlled field is server-rendered with its state's value (`""`) and typeable from the browser's first
 * paint, but React attaches nothing to it until the page has hydrated, a second or three on a cold phone.
 * What is typed in that window sits in the DOM alone: React's state still says `""`, and the first render
 * that follows (a form library re-renders a field the moment it mounts) writes the state's value over the
 * DOM's, so the field snaps back to its placeholder with the person's words gone. It was measured on
 * `/login`'s email field with the page's scripts held: typed "typed.before@example.com", scripts released,
 * the field empty in the same frame and for good; the same node, still focused, so no remount, only the
 * write. A browser's autofill lands in the same window and is wiped the same way.
 *
 * ★ THE ROOT IS THAT NOTHING TOLD THE STATE. So at the field's own mount, before any render can overwrite
 * it, a value the DOM holds that its state does not is handed to the field's own `onChange`, exactly as if
 * it had been typed a moment later: the state (a form library's, or a `useState`) takes it, the next render
 * writes it back over itself, and the field never blinked. Only text the DOM holds and the state does not
 * is touched, so a field mounted on the client (whose DOM was just written from its state) is never
 * disturbed.
 *
 * ★ HOW A CHANGE IS MADE VISIBLE TO REACT. React answers an `input` event with `onChange` only when the
 * value differs from the one it last saw on the node (its "value tracker", set by every write through the
 * node's own `value`). So the field is first written `""`-through-the-tracker (React now knows `""`), then
 * the typed text goes in through the prototype's own setter (past the tracker), and a bubbling `input`
 * event is dispatched: React reads `""` against the typed text and calls `onChange` with a real event, for
 * whatever handler the field has. Every step is a public DOM API (this is how testing libraries type into
 * React), and `adopt-typed-value.test.tsx` hydrates a server-rendered form to hold the whole of it against
 * the React it runs on.
 */
import { useCallback, useEffect, useLayoutEffect, useRef } from "react";

type Field = HTMLInputElement | HTMLTextAreaElement;

/** The kinds of input whose text a person types (the rest have no typed `value` to lose). */
const TEXT_LIKE = new Set([
  "text",
  "email",
  "search",
  "tel",
  "url",
  "password",
  "number",
]);

/**
 * Whether an `<input type>` is one a person types text into (no `type` is `text`). The one home of the list:
 * the hook reads it, and so does `adopt-typed-value-policy.test.ts`, which refuses a bare controlled field
 * of one of these kinds.
 */
export function isTextLikeInputType(type: string | undefined): boolean {
  return TEXT_LIKE.has(type ?? "text");
}

/**
 * Whether a field is one whose typed text state may have missed: a controlled one (`controlled` is its
 * `value` prop; an uncontrolled field keeps its own text, which React never overwrites), that a person
 * can type into.
 */
function adoptable(node: Field, controlled: unknown): boolean {
  if (controlled === undefined || controlled === null) return false;
  if (node.disabled || node.readOnly) return false;
  return !(node instanceof HTMLInputElement) || isTextLikeInputType(node.type);
}

/**
 * Hand `typed` to React as a change, when the field's state does not hold it. True when it did.
 *
 * `typed` is what the DOM held when the field mounted; the DOM may since have been written back to what
 * state knew (a render got there first), and it is restored over that, but never over anything else, so
 * a person's later typing is never overwritten.
 */
export function adoptTypedValue(
  node: Field,
  controlled: unknown,
  typed: string = node.value,
): boolean {
  if (!adoptable(node, controlled)) return false;
  const known = String(controlled);
  if (typed === "" || typed === known) return false;
  if (node.value !== typed && node.value !== known) return false;
  const proto =
    node instanceof HTMLTextAreaElement
      ? HTMLTextAreaElement.prototype
      : HTMLInputElement.prototype;
  const write = Object.getOwnPropertyDescriptor(proto, "value")?.set;
  if (!write) return false;
  node.value = known;
  write.call(node, typed);
  node.dispatchEvent(new Event("input", { bubbles: true }));
  return true;
}

/**
 * A ref callback for a controlled field that adopts what was typed before React owned it. Hand it the
 * field's `value` prop and put the result on the element (a field that is handed a ref of its own calls
 * both: `Input` does).
 *
 * ★ THE TEXT IS TAKEN AT THE FIELD'S MOUNT AND OFFERED TO THE STATE TWICE. It is read in the layout
 * effect, before any render can overwrite it, and offered at once (a `useState` takes it there and then).
 * A form library (react-hook-form: the create wizard, the sign-in email) has not subscribed its field to
 * its own values yet at that moment, since it does so in effects that run after this one, so a change
 * announced this early reaches nobody and its next render writes `""` back. So it is offered again the
 * moment every effect of the commit has run (a microtask after the flush), and once more a frame on, each
 * time only if the state still does not hold it.
 *
 * ★ A PERSON'S OWN TYPING ENDS THE OFFERS. The offers replay what the field held at its mount, so one that
 * landed after the person had typed a character on top of it would put the old text back over the new: any
 * `input` event that is not this hook's own marks the field touched, and a touched field is never offered
 * to again.
 */
export function useAdoptTypedValue<T extends Field>(value: unknown) {
  const nodeRef = useRef<T | null>(null);
  const latestRef = useRef(value);
  const typedRef = useRef<string | null>(null);
  const touchedRef = useRef(false);
  const ownRef = useRef(false);
  useLayoutEffect(() => {
    latestRef.current = value;
  });
  /** Offer the text to the state, marking the event this dispatches as the hook's own. */
  const offerTo = useCallback((el: Field, text: string) => {
    ownRef.current = true;
    try {
      return adoptTypedValue(el, latestRef.current, text);
    } finally {
      ownRef.current = false;
    }
  }, []);
  useLayoutEffect(() => {
    const el = nodeRef.current;
    if (!el) return;
    const onInput = () => {
      if (!ownRef.current) touchedRef.current = true;
    };
    el.addEventListener("input", onInput);
    if (adoptable(el, latestRef.current)) {
      const known = String(latestRef.current);
      if (el.value !== "" && el.value !== known) {
        typedRef.current = el.value;
        offerTo(el, el.value);
      }
    }
    // At mount only: a change after it is a render's own, and the DOM and the state already agree.
    return () => el.removeEventListener("input", onInput);
  }, [offerTo]);
  useEffect(() => {
    const text = typedRef.current;
    if (text === null) return;
    const offer = () => {
      const el = nodeRef.current;
      if (el && !touchedRef.current && String(latestRef.current) !== text)
        offerTo(el, text);
    };
    queueMicrotask(offer);
    const frame = requestAnimationFrame(offer);
    return () => cancelAnimationFrame(frame);
  }, [offerTo]);
  return useCallback((el: T | null) => {
    nodeRef.current = el;
  }, []);
}
