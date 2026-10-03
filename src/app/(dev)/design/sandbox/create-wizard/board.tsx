"use client";

import "./create-wizard.css";

import type { ReactNode } from "react";

import {
  type BoardState,
  ExplorationBoard,
  optionId,
  optionLabel,
  type PreviewsFor,
} from "@/components/lab";

import type { AddWay } from "./add";
import { screenOf, type ScreenId } from "./knobs";
import { SettingsOnPaper } from "./paper";
import { AddRoom, type AddState, TryIt } from "./room";
import { type Reader, readAdd, readPaper, Scene, Story } from "./scene";
import { CREATE_WIZARD } from "./spec";

/**
 * THE PREVIEWS, AND NOTHING ELSE: every option is the add step drawn in the
 * room as wired (production's room, its carry, its name, its look and its
 * beat) for Maya & Jay's wedding, at a phone or a laptop on the Screen knob.
 * Every frame is titled with its option's own name, read off the spec, and
 * every caption is read off the frame.
 *
 * Each option opens on Try it (Create running with the add step in its
 * place, opening on the add step as a host meets it), then the frames a
 * reviewer reads still: the disposable picked, its develop time where its
 * control will mount, and the night slid to the morning after. The option
 * that is Settings' own cards adds Settings on paper beside them, where the
 * pick lands. What a drawing is not: the guests' screens are this board's
 * small redrawings in the-wait's words, the photographs are the marketing
 * stills every board reuses, and nothing is wired.
 */

/** An option's own name, off the spec, so the frame's title and the tile agree. */
const LABEL = (option: string) => {
  const found = CREATE_WIZARD.asks
    .find((a) => a.id === "add")
    ?.options.find((o) => optionId(o) === option);
  return found ? optionLabel(found) : option;
};

/** One frame of an option: its title, its reader, its drawing. */
function Shot({
  id,
  screen,
  title,
  read,
  children,
}: {
  id: string;
  screen: ScreenId;
  title: string;
  read: Reader;
  children: ReactNode;
}) {
  return (
    <Scene id={id} screen={screen} title={title} measure={read}>
      {children}
    </Scene>
  );
}

const PICKED: AddState = { picked: "disposable", moment: "party" };
const MORNING: AddState = { picked: "disposable", moment: "morning" };

function addPreview(s: BoardState, way: AddWay) {
  const name = LABEL(way);
  const screen = screenOf(s.screen);
  const id = `cw-add-${way}`;
  return (
    <Story screen={screen}>
      <Shot
        id={`${id}-try`}
        screen={screen}
        title={`${name}: as the step opens`}
        read={readAdd}
      >
        <TryIt way={way} />
      </Shot>
      <Shot
        id={`${id}-disposable`}
        screen={screen}
        title={`${name}: Disposable picked`}
        read={readAdd}
      >
        <AddRoom way={way} state={PICKED} />
      </Shot>
      {way !== "strip" && (
        <Shot
          id={`${id}-morning`}
          screen={screen}
          title={`${name}: slid to the morning`}
          read={readAdd}
        >
          <AddRoom way={way} state={MORNING} />
        </Shot>
      )}
      {way === "styles" && (
        <Shot
          id={`${id}-paper`}
          screen={screen}
          title={`${name}: then Settings, on paper`}
          read={readPaper}
        >
          <SettingsOnPaper picked="disposable" />
        </Shot>
      )}
    </Story>
  );
}

const PREVIEWS: PreviewsFor<typeof CREATE_WIZARD> = {
  "add.pair": (s) => addPreview(s, "pair"),
  "add.styles": (s) => addPreview(s, "styles"),
  "add.one": (s) => addPreview(s, "one"),
  "add.strip": (s) => addPreview(s, "strip"),
};

export function CreateWizardBoard() {
  return <ExplorationBoard spec={CREATE_WIZARD} previews={PREVIEWS} />;
}
