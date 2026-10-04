import { OVERLAYS } from "./states";

/**
 * THE CARRIED CALLS' CASES, WHERE THE LANE TAKES ONE OTHER THAN AS BUILT: the
 * same in every frame (a call is not an option), so the screens show the call
 * as the board takes it, and Will overrules it on the board (`spec.ts`'s
 * `carried`). The calls taken as built draw nothing here: production draws
 * them.
 *
 * ★ A3, THE VEIL (`veil`): a dialog, a panel or a sheet dims the page under it
 * by half and leaves it sharp (`floatingScrim`, as built). On paper half read
 * heavy (the fresh-eyes pass measured the page from 245 to 123), so the board
 * takes a quarter there; in the room a half does what a half can on near-black,
 * and stays.
 */
const onPaper = (list: string): string =>
  list
    .split(",")
    .map((s) => `${s.trim()}:not(:is(.dark *):not(.surface-paper *))`)
    .join(", ");

export const CALLS_CSS = `
${onPaper(OVERLAYS)} { background-color: oklch(0 0 0 / 25%); }
`;
