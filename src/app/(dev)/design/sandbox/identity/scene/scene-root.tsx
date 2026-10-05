"use client";

import { useEffect } from "react";

import {
  type Choice,
  type GroundId,
  isSheet,
  type MomentId,
  type PageNo,
  type ViewId,
  type Width,
} from "../model";
import { sheetFor } from "../sheet";
import { GROUND_TOASTS } from "../views/ground";
import { SCREENS } from "../views/screens";
import { Sheet } from "../views/sheets";

import { useAdopt } from "./adopt";
import { useHeldGround } from "./ground";
import { postReading, readView } from "./reading";
import { useWorkingWords } from "./working-words";

/** The dev server's own badge is the frame's to hide: it is no part of a page. */
const SCENE_ONLY = "nextjs-portal{display:none!important}";

/**
 * ONE FRAME'S DOCUMENT: a set and a working state over one view of
 * production, caught in one moment.
 *
 * ★ A DOCUMENT OF ITS OWN, NOT A PORTAL. Production's popups ask the window
 * which shape to be (`useMediaQuery`), so a 375 frame must be a phone all the
 * way down: every `matchMedia`, `fixed`, toast and focus here is the frame's.
 *
 * ★ THE SHEET IS IN THE DOCUMENT FROM THE FIRST PAINT (a `<style>` the server
 * renders), after every stylesheet in the head, so the set wins without a
 * flash of production and without a specificity war: its rules are unlayered,
 * and production's utilities sit in a layer.
 *
 * ★ A PICTURE OF A PAGE GOES NOWHERE: a link pressed in it does not navigate
 * and a form does not submit (React's events reach this root from inside every
 * portal too), and every write a screen holds is inert.
 */
export function SceneRoot({
  choice,
  view,
  moment,
  w,
  ground,
  page,
  id,
}: {
  choice: Choice;
  view: ViewId;
  moment: MomentId;
  w: Width;
  ground: GroundId;
  page: PageNo;
  id: string;
}) {
  const sheet = isSheet(view);
  // A desk's sheet draws both grounds inside a room document; a phone's draws its own.
  useHeldGround(sheet && w === 1440 ? "room" : ground);
  useAdopt(!sheet);
  useWorkingWords(choice.loading === "words");

  useEffect(() => {
    let last = "";
    const read = () => {
      try {
        const text = readView(view, moment, document);
        if (text && text !== last) {
          last = text;
          postReading(id, text);
        }
      } catch {
        // Not settled; the next pass reads it.
      }
    };
    const timers = [800, 1600, 2800, 4400].map((ms) =>
      window.setTimeout(read, ms),
    );
    document.fonts?.ready.then(read).catch(() => {});
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [id, view, moment]);

  const Screen = sheet ? null : SCREENS[view];
  return (
    <div
      data-identity-scene={view}
      data-identity-moment={moment}
      data-identity-set={choice.set}
      data-identity-loading={choice.loading}
      onClickCapture={(event) => {
        if ((event.target as Element | null)?.closest?.("a[href]"))
          event.preventDefault();
      }}
      onSubmitCapture={(event) => event.preventDefault()}
    >
      <style data-identity-sheet="">
        {sheetFor(choice) + GROUND_TOASTS + SCENE_ONLY}
      </style>
      {sheet ? (
        <Sheet view={view} w={w} ground={ground} page={page} />
      ) : Screen ? (
        <Screen moment={moment} w={w} ground={ground} />
      ) : null}
    </div>
  );
}
