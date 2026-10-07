"use client";

import { useId } from "react";

import { StylePicture } from "@/components/app/event-settings/camera-settings-style-picture";
import { RollControl } from "@/components/app/event-settings/roll-control";

import type { AddChoice } from "./add-step";
import { DevelopRow } from "./develop-row";

/**
 * THE DISPOSABLE'S OWN SCREEN (create-wizard r4's `styles=focused`, Will 2026-10-07: "I like the additional disposable
 * settings getting their own focused view"): picking Disposable on the album's style adds one screen after it, its own,
 * so the develop time is a whole screen she cannot miss, never a row tucked under a card. It asks when the photos
 * develop: the Disposable's album the morning it opens (every frame lit, the reel's mark on it), the develop row under
 * it, then the roll.
 *
 * ★ IT IS A STEP ONLY WHILE DISPOSABLE IS PICKED: the wizard's steps grow by one when she picks it and shrink when she
 * picks another (`create-event-wizard.tsx`), and what she chose here is kept across both (`useAddChoice`), since a Live
 * or Review album sends neither the time nor the roll (`createFieldsOf`).
 *
 * ★ THE TIME IS JUDGED WHERE IT STANDS: Continue judges what the field holds (`confirm`), and a time refused, or one that
 * passed while she stood on a later screen, brings her back here with the words under its row.
 *
 * The state is `useAddChoice`'s, held by the wizard; the step itself is drawn.
 */

/** The screen's question, in the room's one place for it, and its quiet line. */
export const DEVELOP_QUESTION = "When do the photos develop?";
export const DEVELOP_SUB = "Everyone's open at once";

export function DevelopStep({ choice }: { choice: AddChoice }) {
  return (
    <div data-develop-step="" className="cr-develop-step">
      <StylePicture
        style="disposable"
        moment="morning"
        roll={choice.roll}
        className="cr-develop-step-pic"
      />
      <DevelopRow
        developsAt={choice.developsAt}
        draft={choice.draft}
        refusal={choice.refusal}
        onDraft={choice.type}
        onFinish={() => void choice.finish()}
      />
      <RollField roll={choice.roll} onRoll={choice.setRoll} />
    </div>
  );
}

/**
 * The Disposable's roll under its develop time (customize r1's `roll=both`: "never as a question: it stands under the
 * Disposable pick, a press to change, the way the develop time does"): its name, then film's three and Other, Settings'
 * own control. 24 unless she picks.
 */
function RollField({
  roll,
  onRoll,
}: {
  roll: number;
  onRoll: (n: number) => void;
}) {
  const labelId = useId();
  return (
    <div data-roll-field="" className="mt-6 space-y-2.5">
      <p id={labelId} className="px-1 text-working text-muted-foreground">
        Shots each
      </p>
      <RollControl value={roll} onChange={onRoll} labelledBy={labelId} />
    </div>
  );
}
