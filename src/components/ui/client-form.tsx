import type { ComponentProps } from "react";

/**
 * A FORM THE CLIENT SUBMITS, NEVER THE BROWSER (crumbs-20).
 *
 * A `<form onSubmit>` with no method and no action is, until React has attached its handler, the
 * browser's own form: a press or an Enter submits it as a GET to the current address and carries
 * every named field into the URL, the history and a server log (the sign-in step's email address,
 * the careers application's name and note). That window is the first second of a slow phone, which
 * is exactly when a guest is quickest to tap.
 *
 * ★ `method="dialog"` CLOSES IT AT THE SOURCE. Outside a `<dialog>` the browser's own submission
 * does nothing at all (the HTML Standard's form submission algorithm returns at "if form does not
 * have an ancestor dialog element"): no request, no navigation, no field in any address. A press
 * before hydration is a press that waits, and once React attaches its `onSubmit` every handler
 * `preventDefault`s exactly as it did. It also holds when the script never loads at all.
 *
 * WHY THIS AND NOT THE OTHER TWO. A hydrated flag on the submit button (`useHydrated`; /contact
 * keeps one so a long message never meets a silent press) needs every form's button found and
 * disabled, flashes a disabled state on every load, and leaves a form with no submit button (or
 * one Enter reaches) submitting anyway. A `method="post"` form still leaves the page for a POST it
 * cannot answer, or for an endpoint kept only to answer 204. The attribute is one line, has no
 * state to get wrong, and answers for a form's submit button and its Enter alike (measured in
 * Chrome: no request reached the server).
 *
 * A form that names its own native answer needs none of this and stays a plain `<form>`: an
 * `action` (a Server Function, whose form works before hydration by design) or `method="get"` (a
 * search meant to be a link). `client-form-policy.test.ts` refuses every other `<form>`, so a new
 * one cannot be added without choosing. `method` and `action` are not props here, and the attribute
 * is written after the spread, so nothing handed in can undo it.
 */
export function ClientForm(
  props: Omit<ComponentProps<"form">, "method" | "action">,
) {
  return <form {...props} method="dialog" />;
}
