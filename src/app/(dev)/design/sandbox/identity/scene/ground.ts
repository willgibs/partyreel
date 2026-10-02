"use client";

import { useLayoutEffect } from "react";

import type { GroundId } from "../model";

/**
 * THE FRAME'S GROUND, HELD: paper or the room for the whole document, so a
 * screen and everything it opens (a panel, a menu, a toast, all portalled to
 * the body) stand on the ground the board asked for.
 *
 * ★ HELD AGAINST THE THEME. The root layout's theme provider writes the
 * visitor's stored theme onto `<html>` and writes it again whenever the lab's
 * toggle changes it (the storage event reaches every frame), so the ground is
 * re-asserted on every change of the class. Only `light` and `dark` are
 * touched: the faces' classes on `<html>` stay.
 */
export function useHeldGround(ground: GroundId) {
  useLayoutEffect(() => {
    const html = document.documentElement;
    const want = ground === "room" ? "dark" : "light";
    const other = want === "dark" ? "light" : "dark";
    const hold = () => {
      if (html.classList.contains(other)) html.classList.remove(other);
      if (!html.classList.contains(want)) html.classList.add(want);
      if (html.style.colorScheme !== want) html.style.colorScheme = want;
    };
    hold();
    const mo = new MutationObserver(hold);
    mo.observe(html, { attributes: true, attributeFilter: ["class", "style"] });
    return () => mo.disconnect();
  }, [ground]);
}
