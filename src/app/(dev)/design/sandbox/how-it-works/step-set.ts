import { FIVE_STEPS, SIX_STEPS, THREE_STEPS, type StepDatum } from "./content";
import type { StepsShape } from "./steps";

/** The one map from THE STEPS' option id to its step list, shared by every
 *  decision that draws a step count (steps.tsx, pictures.tsx, shape.tsx). */
export const STEP_SET: Record<StepsShape, readonly StepDatum[]> = {
  six: SIX_STEPS,
  five: FIVE_STEPS,
  three: THREE_STEPS,
};

export const STEP_HEADING: Record<StepsShape, string> = {
  six: "Six steps, two sides.",
  five: "Five steps, start to finish.",
  three: "Three steps. That's it.",
};
