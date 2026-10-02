"use client";

import { useEffect } from "react";

import { FAMILY_CSS } from "../families";
import type { FamilyId, ViewId, Width } from "../model";
import { Specimen } from "../views/specimen";
import { AddScreen } from "../views/guest";
import { HubScreen, SettingsScreen } from "../views/host";

import { postReading, readView } from "./reading";

/** The dev server's own badge is the frame's to hide: it is no part of a page. */
const SCENE_ONLY = "nextjs-portal{display:none!important}";

/**
 * ONE FRAME'S DOCUMENT: a family's sheet over one view of production.
 *
 * ★ A DOCUMENT OF ITS OWN, NOT A PORTAL. A portalled scene runs in the lab's
 * window, and production's popups ask THAT window which shape to be
 * (`useMediaQuery`): a 375 frame on a 1440 lab drew Settings as a desk's
 * panel and the Add sheet as a desk's menu. Loaded as its own route, every
 * `matchMedia`, `fixed`, toast and focus belongs to the frame, so a 375 frame
 * is a phone all the way down.
 *
 * ★ THE SHEET IS IN THE DOCUMENT FROM THE FIRST PAINT (a `<style>` the server
 * renders), after every stylesheet in the head, so the family wins without a
 * flash of today and without a specificity war: its rules are unlayered, and
 * production's utilities sit in a layer.
 */
export function SceneRoot({
  family,
  view,
  w,
  id,
}: {
  family: FamilyId;
  view: ViewId;
  w: Width;
  id: string;
}) {
  useEffect(() => {
    let last = "";
    const read = () => {
      try {
        const text = readView(view, document);
        if (text && text !== last) {
          last = text;
          postReading(id, text);
        }
      } catch {
        // Not settled; the next pass reads it.
      }
    };
    const timers = [400, 1200, 2400, 4000].map((ms) =>
      window.setTimeout(read, ms),
    );
    document.fonts?.ready.then(read).catch(() => {});
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [id, view]);

  return (
    <>
      <style data-identity-family={family}>
        {FAMILY_CSS[family] + SCENE_ONLY}
      </style>
      {view === "hub" ? (
        <HubScreen w={w} />
      ) : view === "settings" ? (
        <SettingsScreen w={w} />
      ) : view === "add" ? (
        <AddScreen w={w} />
      ) : (
        <Specimen w={w} part={view === "specimen" ? undefined : view} />
      )}
    </>
  );
}
