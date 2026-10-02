"use client";

import { useEffect } from "react";

/**
 * AS WIRING WOULD MAKE THEM: the screen parts that are not atoms yet, handed
 * the atom they become, so a screen shows its own parts in an option's terms
 * (r1's carried call: the screens' parts wear the family) while the sheet
 * styles atoms alone (`sheet/index.ts`).
 *
 * ★ THIS IS THE DRAWING'S, NEVER THE SHEET'S. A rule here names a production
 * part by its own hook and says which atom it is once wired; the wiring
 * replaces the part with that atom, and this file leaves with the board. The
 * sheet never learns a screen's selector, so nothing dead is inherited.
 *
 * ★ IT FOLLOWS THE PAGE: a part that mounts later (a gate turned on) or
 * changes state (a gate chosen) is adopted again on the mutation.
 */

type Rule = { sel: string; adopt: (el: HTMLElement) => void };

/** Sets an attribute only when it differs, so the observer never feeds itself. */
const set = (el: Element | null | undefined, name: string, value: string) => {
  if (el && el.getAttribute(name) !== value) el.setAttribute(name, value);
};

const RULES: Rule[] = [
  {
    // Settings' door, step one: what the link opens is a segmented control.
    sel: "[data-door-choice]",
    adopt: (el) => {
      set(el, "data-slot", "toggle-group-item");
      set(el.parentElement, "data-slot", "toggle-group");
      set(el.parentElement, "data-variant", "segmented");
    },
  },
  {
    // Settings' door, step two: each gate is a radio card, its dot a radio.
    sel: "[data-door-gate]",
    adopt: (el) => {
      set(el, "data-slot", "radio-card");
      const on = el.getAttribute("data-state") === "on";
      const dot = el.querySelector<HTMLElement>(
        "span[aria-hidden].rounded-full",
      );
      set(dot, "data-slot", "radio-group-item");
      set(dot, "data-state", on ? "checked" : "unchecked");
      set(dot?.firstElementChild, "data-slot", "radio-group-indicator");
      set(
        el.querySelector("span.block.text-sm"),
        "data-slot",
        "radio-card-title",
      );
    },
  },
  {
    // A form's own `<label>` is the Label atom once wired.
    sel: "label[for]:not([data-slot])",
    adopt: (el) => set(el, "data-slot", "label"),
  },
  {
    // Review's head: the queue's count is a badge, in the waiting tone.
    sel: "[data-review-room] h1 + span",
    adopt: (el) => {
      set(el, "data-slot", "badge");
      set(el, "data-variant", "warning");
    },
  },
];

function adoptAll(root: ParentNode) {
  for (const rule of RULES)
    root.querySelectorAll<HTMLElement>(rule.sel).forEach(rule.adopt);
}

/** Adopts the screen's parts now and whenever the page changes. */
export function useAdopt(on: boolean) {
  useEffect(() => {
    if (!on) return;
    adoptAll(document);
    const mo = new MutationObserver(() => adoptAll(document));
    mo.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["data-state"],
    });
    return () => mo.disconnect();
  }, [on]);
}
