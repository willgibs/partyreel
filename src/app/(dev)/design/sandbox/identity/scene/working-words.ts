"use client";

import { useEffect } from "react";

/**
 * THE WORDS A KEY SAYS WHILE IT WORKS, AND ITS TIME, SHOWN WHERE THE WORKING
 * STATE SAYS THEM (the loading ask's `words` and `time`). A screen marks a
 * working key with the words it would say (`busy(el, words)`,
 * `data-working`), as a wired key renders its own, and this hands the key
 * those words in place of its resting ones; with `time`, past two seconds of
 * work it also adds the wait as a readout after them ("Saving 0:04"), and a
 * field checking adds it to its status slot. The arc alone keeps the key's
 * own words.
 *
 * ★ THE DRAWING'S, NEVER THE SHEET'S: CSS cannot change a key's words, and a
 * wired key says them in its own render (production's own keys already say
 * "Saving…" and "Removing…"). It follows the page, so a key marked later (a
 * screen's script runs after the page has settled) is handed its words too.
 */

/** How long a key works before it shows its time: a quick save never does. */
const TIME_AFTER_MS = 2000;

const clock = (ms: number) => {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

export function useWorkingWords(mode: "arc" | "words" | "time") {
  useEffect(() => {
    if (mode === "arc") return;
    const started = new WeakMap<Element, number>();
    const swap = () => {
      document
        .querySelectorAll<HTMLElement>('[aria-busy="true"][data-working]')
        .forEach((key) => {
          if (!started.has(key)) started.set(key, Date.now());
          const words = key.getAttribute("data-working");
          if (!words || key.getAttribute("data-working-shown") === words)
            return;
          // The key's own words: its last text with any letters in it, outside a readout.
          const walker = document.createTreeWalker(key, NodeFilter.SHOW_TEXT);
          let last: Text | null = null;
          for (let n = walker.nextNode(); n; n = walker.nextNode())
            if (
              n.textContent?.trim() &&
              !n.parentElement?.closest("[data-working-time]")
            )
              last = n as Text;
          if (!last) return;
          const lead = last.textContent?.match(/^\s*/)?.[0] ?? "";
          last.textContent = `${lead}${words}`;
          key.setAttribute("data-working-shown", words);
        });
      if (mode !== "time") return;
      document
        .querySelectorAll<HTMLElement>(
          '[aria-busy="true"][data-working], [data-slot="input"][aria-busy="true"] ~ [data-slot="field-status"]',
        )
        .forEach((el) => {
          if (!started.has(el)) started.set(el, Date.now());
          const ran = Date.now() - (started.get(el) ?? Date.now());
          let readout = el.querySelector<HTMLElement>(
            ":scope > [data-working-time]",
          );
          if (ran < TIME_AFTER_MS) return;
          if (!readout) {
            readout = document.createElement("span");
            readout.setAttribute("data-working-time", "");
            readout.setAttribute("aria-hidden", "true");
            el.append(readout);
          }
          const text = clock(ran);
          if (readout.textContent !== text) readout.textContent = text;
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
