/**
 * A CONTROLLED FIELD TYPED INTO THE WAY A PERSON TYPES: the value set through
 * the element's own setter and an input event raised, so React hears it as a
 * keystroke and the component's state follows (a value written straight to
 * the DOM is overwritten by the next render).
 */
export function typeInto(input: HTMLInputElement, value: string) {
  const set = Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype,
    "value",
  )?.set;
  set?.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
}
