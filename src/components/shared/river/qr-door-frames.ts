import type { RiverFrame } from "@/components/shared/river/river";
import { marketingImage } from "@/lib/constants/marketing-media";

/**
 * THE TWELVE THE QR DOOR POURS: the pack the river falls out of the code with,
 * in launch order, with the crops the board was ruled on (`room-frames.ts` is
 * the same idea for the photograph section, and the same swap).
 *
 * ★ THIS IS THE SLOT, NOT THE PICTURES. The manifest's bootstrap stills stand
 * in until the generated set lands (docs/ROADMAP.md, one Higgsfield month);
 * the swap is a data change in `marketing-media.ts`, because nothing here
 * names a path.
 *
 * ★ THE ORDER IS THE COMPOSITION. One card per photograph, so none is ever
 * doubled in view, and the pool launches in this order, so NEIGHBOURS are the
 * two a reader sees together at the top of the flow: golden hour, then the
 * club floor, then the long table, alternating bright and dark the whole way
 * down rather than clustering a night section.
 *
 * ★ THE CROPS EXIST BECAUSE A CARD IS NEARLY SQUARE. A 3:2 still cut to a
 * 1:1 or 4:5 frame loses its sides, and the centre is rarely the subject;
 * these are `object-position` values read off each still by eye.
 */
export const QR_DOOR_FRAMES: readonly RiverFrame[] = (
  [
    ["wedding-golden", "45% 44%"],
    ["party-dj", "42% 42%"],
    ["reception-table", "44% 50%"],
    ["festival-lights", "46% 42%"],
    ["wedding-petals", "44% 34%"],
    ["concert-confetti", "50% 40%"],
    ["wedding-toast", "58% 50%"],
    ["festival-crowd", "52% 44%"],
    ["wedding-rings", "42% 52%"],
    ["reception-hall", "42% 52%"],
    ["party-balloons", "50% 40%"],
    ["wedding-arch", "32% 46%"],
  ] as const
).map(([id, position]) => ({ src: marketingImage(id).src, position }));

/**
 * The widest a frame is ever drawn: 40 percent of a door, and a door is about
 * 331 px in the hub's three-column grid and 343 in a phone's single column.
 * Stated rather than left to the optimizer's default, which would serve the
 * manifest's 900 px stills at about twelve times the bytes this decoration
 * needs.
 */
export const QR_DOOR_SIZES = "140px";
