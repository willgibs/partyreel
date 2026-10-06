"use client";

import { useEffect } from "react";

/**
 * THE WORDS A KEY SAYS WHILE IT WORKS, SHOWN WHERE THE WORKING STATE SAYS THEM
 * (the loading ask's `words` and `still`). A screen marks a working key with
 * the words it would say (`busy(el, words)`, `data-working`), as a wired key
 * renders its own, and this hands the key those words in place of its resting
 * ones; with `still`, past four seconds of work they turn to "Still saving",
 * and a field checking says "Still checking" in its status slot. The arc alone
 * keeps the key's own words.
 *
 * ★ THE DRAWING'S, NEVER THE SHEET'S: CSS cannot change a key's words, and a
 * wired key says them in its own render (production's own keys already say
 * "Saving…" and "Removing…"). It follows the page, so a key marked later (a
 * screen's script runs after the page has settled) is handed its words too.
 */

/** How long a key works before its words say it is still at it: a quick save never does. */
const STILL_AFTER_MS = 4000;

/** "Saving" as the second word of "Still saving". */
const still = (words: string) =>
  `Still ${words.charAt(0).toLowerCase()}${words.slice(1)}`;

/** A key's own words: its last text with any letters in it. */
function wordsOf(key: HTMLElement): Text | null {
  const walker = document.createTreeWalker(key, NodeFilter.SHOW_TEXT);
  let last: Text | null = null;
  for (let n = walker.nextNode(); n; n = walker.nextNode())
    if (n.textContent?.trim()) last = n as Text;
  return last;
}

export function useWorkingWords(mode: "arc" | "words" | "still") {
  useEffect(() => {
    if (mode === "arc") return;
    const started = new WeakMap<Element, number>();
    const ran = (el: Element) => {
      if (!started.has(el)) started.set(el, Date.now());
      return Date.now() - (started.get(el) ?? Date.now());
    };
    const swap = () => {
      document
        .querySelectorAll<HTMLElement>('[aria-busy="true"][data-working]')
        .forEach((key) => {
          const base = key.getAttribute("data-working");
          if (!base) return;
          const words =
            mode === "still" && ran(key) >= STILL_AFTER_MS ? still(base) : base;
          if (key.getAttribute("data-working-shown") === words) return;
          const text = wordsOf(key);
          if (!text) return;
          const lead = text.textContent?.match(/^\s*/)?.[0] ?? "";
          text.textContent = `${lead}${words}`;
          key.setAttribute("data-working-shown", words);
        });
      if (mode !== "still") return;
      document
        .querySelectorAll<HTMLElement>(
          '[data-slot="input"][aria-busy="true"] ~ [data-slot="field-status"]',
        )
        .forEach((slot) => {
          if (ran(slot) < STILL_AFTER_MS) return;
          if (slot.querySelector("[data-working-still]")) return;
          const said = document.createElement("span");
          said.setAttribute("data-working-still", "");
          said.textContent = "Still checking";
          slot.prepend(said);
        });
    };
    swap();
    const tick = window.setInterval(swap, 250);
    const mo = new MutationObserver(swap);
    mo.observe(document.body, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["aria-busy", "data-working"],
    });
    return () => {
      window.clearInterval(tick);
      mo.disconnect();
    };
  }, [mode]);
}
