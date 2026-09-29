"use client";

import {
  type BoardState,
  ExplorationBoard,
  type PreviewsFor,
} from "@/components/lab";

import { AboutDrawing, type FactsForm, type KitForm } from "./about";
import { readPage, Scene, SCREENS, type ScreenId } from "./scene";
import { ABOUT_PRESS } from "./spec";

/**
 * THE PREVIEWS, AND NOTHING ELSE: every option is the whole of /about as it
 * ships, drawn at 1440 and at 375 from production's components (`about.tsx`),
 * with the kit and the facts the only things an option changes (`kit.tsx`).
 * Each frame opens where that change sits, and its caption reads the kit's
 * height, its plates, the facts and the page's length off the frame.
 *
 * ★ ONE WORLD. `facts` waits on `kit` and is drawn wearing it (a function
 * preview reads the board's state, exploration.ts's convention for a decision
 * staged behind another), because four facts sit inside a kit when there is
 * one and on their own after the convictions when there is not; `kit` is
 * drawn wearing whatever `facts` holds, which is no facts until it is asked.
 */

const pick = <T extends string>(ids: readonly T[], v: unknown, d: T): T =>
  (ids as readonly string[]).includes(v as string) ? (v as T) : d;

const kitOf = (s: BoardState): KitForm =>
  pick(["chapter", "band", "line", "none"] as const, s.kit, "none");
const factsOf = (s: BoardState): FactsForm =>
  pick(["none", "strip"] as const, s.facts, "none");

/** Where a frame opens, in the words its title uses (about.tsx's `focus`). */
function openedAt(kit: KitForm, facts: FactsForm): string {
  if (kit === "chapter") return "the chapter";
  if (kit === "band") return "the band";
  if (facts === "strip") return "the facts";
  return kit === "line" ? "the close and its line" : "the close";
}

const SCREEN_ORDER: readonly ScreenId[] = ["1440", "375"];

/** One option: the laptop first, then the phone, each the whole page. */
function Page({ kit, facts }: { kit: KitForm; facts: FactsForm }) {
  return (
    <div className="flex flex-col gap-6">
      {SCREEN_ORDER.map((screen) => (
        <Scene
          key={screen}
          id={`ap-${kit}-${facts}`}
          screen={screen}
          title={`${screen}, ${SCREENS[screen].name}, opened at ${openedAt(kit, facts)}`}
          read={readPage}
        >
          <AboutDrawing kit={kit} facts={facts} />
        </Scene>
      ))}
    </div>
  );
}

const PREVIEWS: PreviewsFor<typeof ABOUT_PRESS> = {
  "kit.chapter": (s) => <Page kit="chapter" facts={factsOf(s)} />,
  "kit.band": (s) => <Page kit="band" facts={factsOf(s)} />,
  "kit.line": (s) => <Page kit="line" facts={factsOf(s)} />,
  "kit.none": (s) => <Page kit="none" facts={factsOf(s)} />,

  "facts.none": (s) => <Page kit={kitOf(s)} facts="none" />,
  "facts.strip": (s) => <Page kit={kitOf(s)} facts="strip" />,
};

export function AboutPressBoard() {
  return <ExplorationBoard spec={ABOUT_PRESS} previews={PREVIEWS} />;
}
