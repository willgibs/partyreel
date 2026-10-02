"use client";

import { Component, type ReactNode, useEffect, useRef, useState } from "react";

import { useMountOnApproach } from "@/components/lab/approach";
import { BoardPageProvider } from "@/components/lab/board-page-context";

import type { SessionStep } from "./session-step";

/**
 * A ROW'S PICTURE ON THE DESK (lab-sitting, 2026-10-01): the board itself, in
 * its thumbnail mode (`StepThumb`), drawing the one step this row names as
 * the step would land on it.
 *
 * ★ NOTHING IS DRAWN UNTIL THE ROW IS NEARLY IN VIEW, AND TWO AT A TIME. A
 * thumbnail is a board's real frames (two to five each, some 44 across
 * today's open steps), so the desk mounts them as the reader reaches them and
 * hands each pair of turns on once its frames have loaded (or after a few
 * seconds, whichever is first): a desk opened is a list at once and its
 * pictures arrive down it, rather than forty frames asking the server at once.
 * The server renders the box alone, so the desk's first paint is the list.
 *
 * ★ A BOARD THAT THROWS TAKES ITS PICTURE WITH IT, NEVER THE DESK. Each
 * thumbnail sits in a boundary of its own that draws nothing on an error.
 *
 * The picture is not a control: it takes no pointer and no focus (`inert`),
 * so a press anywhere on the row is the row's link, and a reader of the page
 * meets the row's words, never a board's drawing.
 */
export function DeskThumb({
  board,
  title,
  steps,
  param,
  marketing = false,
  children,
}: {
  board: string;
  title: string;
  /** The board's own steps, so the picture wears its other answers. */
  steps: readonly SessionStep[];
  /** The step this row is, `<board>.<ask>`. */
  param: string;
  /** A marketing board draws inside the marketing skin, as on its page. */
  marketing?: boolean;
  /** The board itself (its one export), rendered by the server page. */
  children: ReactNode;
}) {
  const [box, near] = useMountOnApproach("200px");
  const [turn, setTurn] = useState(false);
  const done = useRef<(() => void) | null>(null);

  // A turn is asked for once the row is near, and handed back on unmount.
  useEffect(() => {
    if (!near) return;
    let held = false;
    const release = () => {
      if (!held) return;
      held = false;
      done.current = null;
      handBack();
    };
    const cancel = ask(() => {
      held = true;
      done.current = release;
      setTurn(true);
    });
    return () => {
      cancel();
      release();
    };
  }, [near]);

  // The turn goes on once the picture's frames have loaded, or after a while.
  useEffect(() => {
    if (!turn) return;
    const started = Date.now();
    const timer = window.setInterval(() => {
      const frames = [...(box.current?.querySelectorAll("iframe") ?? [])];
      const loaded =
        frames.length > 0 &&
        frames.every((f) => {
          try {
            return f.contentDocument?.readyState === "complete";
          } catch {
            return true;
          }
        });
      if (loaded || Date.now() - started > TURN_MS) {
        window.clearInterval(timer);
        done.current?.();
      }
    }, 250);
    return () => window.clearInterval(timer);
  }, [turn, box]);

  return (
    <div
      ref={box}
      aria-hidden
      inert
      data-lab-desk-thumb=""
      data-drawn={turn ? "" : undefined}
      className="lab-desk-thumb"
    >
      {turn && (
        <Fallible>
          <BoardPageProvider
            value={{
              id: board,
              title,
              sections: [],
              review: { steps, param, thumb: true },
            }}
          >
            {marketing ? <div data-mkt="">{children}</div> : children}
          </BoardPageProvider>
        </Fallible>
      )}
    </div>
  );
}

/** How long a thumbnail holds its turn when its frames never say they loaded. */
const TURN_MS = 4000;
/** How many thumbnails draw at once. */
const AT_ONCE = 2;

let drawing = 0;
const waiting: (() => void)[] = [];

/** Asks for a turn; `grant` runs when one is free. Returns the way to stop waiting. */
function ask(grant: () => void): () => void {
  if (drawing < AT_ONCE) {
    drawing++;
    grant();
    return () => {};
  }
  waiting.push(grant);
  return () => {
    const at = waiting.indexOf(grant);
    if (at >= 0) waiting.splice(at, 1);
  };
}

/** Hands a turn back, and on to the next thumbnail waiting, if any. */
function handBack() {
  drawing = Math.max(0, drawing - 1);
  const next = waiting.shift();
  if (next) {
    drawing++;
    next();
  }
}

/** Draws nothing where its child throws: a board's picture never takes the desk down. */
class Fallible extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}
