"use client";

import "./identity-claims.css";

import { ExplorationBoard } from "@/components/lab";
import type { BoardState } from "@/components/lab/board-spec";
import type { PreviewsFor } from "@/components/lab/exploration";

import type { Confirm, Mode, Next, Save, Step } from "./batch";
import { measureOf, Pair, Scene } from "./scene";
import { screenOf } from "./screens";
import { IDENTITY_CLAIMS } from "./spec";
import { ClaimsWorld } from "./world";

/**
 * THE PREVIEWS, AND NOTHING ELSE: each option is the one review played in its
 * mode, two frames stacked so the option stays one phone wide on the step.
 *
 * ★ EVERY FRAME IS A SCRIPT, NOT A PICTURE (`batch.ts`). Midway is "claim Tom's
 * Leaving Do, say Not mine to the bonfire"; the end is "decide the rest as her
 * memory would, then Finish". The frame opens where the machine lands and is
 * live from there, so what a caption reads is what the mode really does.
 *
 * ★ WHAT EACH ASK HOLDS STEADY. `save` draws each option with its dialog where
 * it naturally sits (Finish's at the end, as-you-go's at the card), the one
 * place a preview reads a knob of its own rather than the board's; `confirm`
 * and `next` are drawn in the world of the `save` answer the step wears (both
 * are staged behind it); `pointer` draws the album and where each option lands.
 */

const saveOf = (s: BoardState): Save => (s.save === "once" ? "once" : "finish");
const confirmOf = (s: BoardState): Confirm =>
  s.confirm === "card" ? "card" : "end";
const nextOf = (s: BoardState): Next =>
  s.next === "album" || s.next === "host" ? s.next : "both";

/** A world keyed by everything that shapes it, so a new option starts fresh. */
const keyOf = (mode: Mode, tag: string) =>
  `${mode.save}-${mode.confirm}-${mode.next}-${tag}`;

/** Tom's Leaving Do claimed, the bonfire said to be not hers. */
const MIDWAY = (mode: Mode): Step[] =>
  mode.confirm === "card"
    ? ["claim", "not-mine", "delete"]
    : ["claim", "not-mine"];

/**
 * What closing the review after two leaves on her dashboard first, because
 * that is where the two answers part at a glance (a toast, a shorter banner
 * and a new Guest card, or a banner still counting all four); the review
 * midway second, where the same difference sits in the list under the card.
 */
function saveScreen(id: Save, s: BoardState) {
  const sc = screenOf(s.screen);
  const mode: Mode = {
    save: id,
    confirm: id === "once" ? "card" : "end",
    next: nextOf(s),
  };
  return (
    <Pair>
      <Scene
        id={`save-${id}-closed`}
        screen={sc}
        title="She closes the review after two"
        measure={measureOf("banner", "toast", "events")}
      >
        <ClaimsWorld
          key={keyOf(mode, "closed")}
          mode={mode}
          script={[...MIDWAY(mode), "close"]}
        />
      </Scene>
      <Scene
        id={`save-${id}-midway`}
        screen={sc}
        title="The review midway, two decided"
        measure={measureOf("top", "rows", "events")}
      >
        <ClaimsWorld
          key={keyOf(mode, "midway")}
          mode={mode}
          script={MIDWAY(mode)}
        />
      </Scene>
    </Pair>
  );
}

function confirmScreen(id: Confirm, s: BoardState) {
  const sc = screenOf(s.screen);
  const mode: Mode = { save: saveOf(s), confirm: id, next: nextOf(s) };
  return (
    <Pair>
      <Scene
        id={`confirm-${id}-tap`}
        screen={sc}
        title="Not mine, on Beach Bonfire"
        measure={measureOf("dialog", "top", "rows")}
      >
        <ClaimsWorld
          key={keyOf(mode, "tap")}
          mode={mode}
          script={["claim", "not-mine"]}
        />
      </Scene>
      <Scene
        id={`confirm-${id}-end`}
        screen={sc}
        title="After the last card"
        measure={measureOf("dialog", "end")}
      >
        <ClaimsWorld
          key={keyOf(mode, "end")}
          mode={mode}
          // At the card the dialogs are behind her, so the end is Finish and
          // done; at the end, Finish is what raises the one dialog.
          script={id === "card" ? ["done"] : ["rest", "finish"]}
        />
      </Scene>
    </Pair>
  );
}

/**
 * The finished review first: every claimed row and what it offers, in either
 * world. Kept until Finish, nothing is offered as she goes (a held claim has no
 * album of hers yet), so the frame of the first claim reads the same for all
 * three and comes second.
 */
function nextScreen(id: Next, s: BoardState) {
  const sc = screenOf(s.screen);
  const mode: Mode = { save: saveOf(s), confirm: confirmOf(s), next: id };
  return (
    <Pair>
      <Scene
        id={`next-${id}-done`}
        screen={sc}
        title="The review done"
        measure={measureOf("end", "follow")}
      >
        <ClaimsWorld key={keyOf(mode, "done")} mode={mode} script={["done"]} />
      </Scene>
      <Scene
        id={`next-${id}-first`}
        screen={sc}
        title="Tom's Leaving Do, just claimed"
        measure={measureOf("top", "follow")}
      >
        <ClaimsWorld
          key={keyOf(mode, "first")}
          mode={mode}
          script={["claim"]}
        />
      </Scene>
    </Pair>
  );
}

/**
 * Where each option lands first, since that is what tells the three apart (two
 * of them say the same line at the album); the moment card that says it second.
 */
function pointerScreen(id: "quiet" | "line" | "here", s: BoardState) {
  const sc = screenOf(s.screen);
  const mode: Mode = {
    save: saveOf(s),
    confirm: confirmOf(s),
    next: nextOf(s),
  };
  return (
    <Pair>
      <Scene
        id={`pointer-${id}-lands`}
        screen={sc}
        title={
          id === "quiet"
            ? "Her dashboard, whenever she goes"
            : id === "line"
              ? "Where Review all 4 lands"
              : "Review all 4, opened over the album"
        }
        measure={
          id === "here" ? measureOf("sheet") : measureOf("sheet", "banner")
        }
      >
        <ClaimsWorld
          key={keyOf(mode, `lands-${id}`)}
          mode={mode}
          open={id !== "quiet"}
          where={id === "here" ? "album" : "dashboard"}
          pointer={id === "here"}
          reviewInPlace={id === "here"}
        />
      </Scene>
      <Scene
        id={`pointer-${id}-album`}
        screen={sc}
        title="The moment card at Maya & Jay"
        measure={measureOf("pointer")}
      >
        <ClaimsWorld
          key={keyOf(mode, `album-${id}`)}
          mode={mode}
          open={false}
          where="album"
          pointer={id !== "quiet"}
          reviewInPlace={id === "here"}
        />
      </Scene>
    </Pair>
  );
}

const PREVIEWS: PreviewsFor<typeof IDENTITY_CLAIMS> = {
  "save.finish": (s) => saveScreen("finish", s),
  "save.once": (s) => saveScreen("once", s),

  "confirm.card": (s) => confirmScreen("card", s),
  "confirm.end": (s) => confirmScreen("end", s),

  "next.album": (s) => nextScreen("album", s),
  "next.host": (s) => nextScreen("host", s),
  "next.both": (s) => nextScreen("both", s),

  "pointer.quiet": (s) => pointerScreen("quiet", s),
  "pointer.line": (s) => pointerScreen("line", s),
  "pointer.here": (s) => pointerScreen("here", s),
};

export function IdentityClaimsBoard() {
  return <ExplorationBoard spec={IDENTITY_CLAIMS} previews={PREVIEWS} />;
}
