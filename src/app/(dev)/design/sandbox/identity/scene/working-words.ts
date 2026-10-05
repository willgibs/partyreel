"use client";

import { useEffect } from "react";

/**
 * THE WORDS A KEY SAYS WHILE IT WORKS, SHOWN WHERE THE WORKING STATE SAYS
 * THEM (the loading ask's `words`: "Unlocking", "Saving", "Creating your
 * event"). A screen marks a working key with the words it would say
 * (`busy(el, words)`, `data-working`), as a wired key renders its own, and
 * this hands the key those words in place of its resting ones; every other
 * working state keeps the key's own words.
 *
 * ★ THE DRAWING'S, NEVER THE SHEET'S: CSS cannot change a key's words, and a
 * wired key says them in its own render (production's own keys already say
 * "Saving…" and "Removing…"). It follows the page, so a key marked later (a
 * screen's script runs after the page has settled) is handed its words too.
 */
export function useWorkingWords(on: boolean) {
  useEffect(() => {
    if (!on) return;
    const swap = () => {
      document
        .querySelectorAll<HTMLElement>('[aria-busy="true"][data-working]')
        .forEach((key) => {
          const words = key.getAttribute("data-working");
          if (!words || key.getAttribute("data-working-shown") === words)
            return;
          // The key's own words: its last text with any letters in it.
          const walker = document.createTreeWalker(key, NodeFilter.SHOW_TEXT);
          let last: Text | null = null;
          for (let n = walker.nextNode(); n; n = walker.nextNode())
            if (n.textContent?.trim()) last = n as Text;
          if (!last) return;
          const lead = last.textContent?.match(/^\s*/)?.[0] ?? "";
          last.textContent = `${lead}${words}`;
          key.setAttribute("data-working-shown", words);
        });
    };
    swap();
    const mo = new MutationObserver(swap);
    mo.observe(document.body, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["aria-busy", "data-working"],
    });
    return () => mo.disconnect();
  }, [on]);
}
