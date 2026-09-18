"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { neighbours } from "@/app/(dev)/design/_data/catalog";
import { commandFor } from "@/app/(dev)/design/_data/state";
import { useKeyed, useNav, usePalette } from "./shell-context";

/**
 * ONE KEY LISTENER FOR THE WHOLE LAB (the Library x Lab round, 2026-09-15).
 * The window is bound ONCE, here, and `commandFor` (_data/state.ts) decides
 * what a key means; a page never adds its own window listener, or two boards
 * end up fighting over `]`.
 *
 *   ⌘K / ctrl+K, or `/`   the palette
 *   [ and ]               the section's previous and next page
 *   1..9                  handed to whatever registered `useDigitKeys`
 *
 * The digit registry is the contract the desk's review session plugs into: it
 * owns what "pick option 3" means, the shell owns when a `3` is a command at
 * all (never while a field has focus, never with a modifier).
 */
type DigitHandler = (n: number) => void;

/** In registration order; the LAST one registered takes the keys. */
const digitHandlers: DigitHandler[] = [];

/**
 * While the component is mounted, `1`..`9` call `handler`; `null` registers
 * nothing. The LAST registered handler wins, so a review session opened inside
 * a board takes the digits from the board beneath it and gives them back when
 * it closes.
 *
 * Wrap the handler in `useCallback`: an inline closure re-registers on every
 * render, which is correct but wasteful, and makes "who holds the keys" depend
 * on render order rather than on mount order.
 */
export function useDigitKeys(handler: DigitHandler | null): void {
  useEffect(() => {
    if (!handler) return;
    digitHandlers.push(handler);
    return () => {
      const at = digitHandlers.lastIndexOf(handler);
      if (at >= 0) digitHandlers.splice(at, 1);
    };
  }, [handler]);
}

function fireDigit(n: number): boolean {
  const last = digitHandlers[digitHandlers.length - 1];
  if (!last) return false;
  last(n);
  return true;
}

export function LabKeys() {
  const router = useRouter();
  const nav = useNav();
  const to = useKeyed();
  const { open, setOpen } = usePalette();

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const command = commandFor({
        key: e.key,
        metaKey: e.metaKey,
        ctrlKey: e.ctrlKey,
        altKey: e.altKey,
        shiftKey: e.shiftKey,
        target: e.target,
      });
      if (!command) return;
      if (command.kind === "palette") {
        e.preventDefault();
        setOpen(!open);
        return;
      }
      // While the palette is open its own keys rule: its arrows and Enter are
      // the navigation, and a `[` there is a character in the query.
      if (open) return;
      if (command.kind === "digit") {
        if (fireDigit(command.n)) e.preventDefault();
        return;
      }
      const { prev, next } = neighbours(nav, window.location.pathname);
      const target = command.kind === "prev" ? prev : next;
      if (!target) return;
      e.preventDefault();
      router.push(to(target.href));
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [nav, open, router, setOpen, to]);

  return null;
}
