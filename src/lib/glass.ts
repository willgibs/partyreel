/**
 * THE GLASS MATERIAL, NAMED (the `glass` board, ruled whole 2026-09-20:
 * `material=crystal`, `edge=double`, and round one's six answers standing).
 *
 * ★ THIS FILE OWNS NO PIXELS. The material is CSS — the `--glass-*` tokens and
 * the `.glass` utility in `src/app/globals.css` — because a backdrop filter is a
 * paint instruction and a Tailwind `@utility` compiles only in the entry sheet.
 * What lives here is the material's NAMES, the classes the product wears, and
 * `glass.test.ts` holds that each one compiles in the stylesheet.
 *
 * ★ ONE MATERIAL, EVERYWHERE. Will, on the reel's white pane: "I don't want to
 * have separate glass treatments and would prefer to find a global that works
 * everywhere." A second recipe, anywhere, is the drift the whole round was run
 * to prevent, so the numbers have exactly one home, the `--glass-*` block.
 *
 * ★ GLASS IS MEDIA CHROME, NEVER A POPOVER. `ui/floating-layer.ts` refuses a
 * backdrop filter on a floating PANEL, and the glass ruling does not lift that
 * refusal: a menu, a tooltip, a dialog and a sheet are opaque surfaces with a
 * step and a ring (the floating-layer contract). Glass exists where a photograph is the ground.
 */

/** The class every glass surface in the product wears. */
export const GLASS = "glass";

/**
 * The material at the mark's blur, worn WITH `GLASS`. A tile carries a mark on
 * every photograph in an album; 42px of backdrop filter on each of them is a
 * phone's scroll budget spent on chrome nobody reads. It re-points one token, so
 * the tint, the edges and the backdrop are the material's exactly.
 */
export const GLASS_MARK = "glass glass-mark";

/**
 * The ground behind a photograph in the lightbox (`behind=album`): the album
 * blurred at half brightness, on its OWN element. Never on an ancestor of the
 * photograph — a backdrop filter blurs what is behind the element it sits on,
 * and a viewer that blurs the thing it exists to show is the one failure this
 * separation prevents.
 */
export const GLASS_BEHIND = "glass-behind";

/**
 * ★ A GLYPH ON GLASS CARRIES ITS OWN LIGHT, BECAUSE THE PANE CANNOT CARRY IT
 * FOR HIM. Round two measured what no round had: the rose `--like` mark reads
 * 4.4:1 through Crystal over the brightest photograph in the repo, under the
 * 4.5:1 floor. A pane cannot fix a COLOUR's contrast — and the same arithmetic
 * reaches WHITE on a near-white sky, which the board never saw because it drew
 * the lightbox's pill over the album already darkened to half brightness, where
 * production floats it over the raw photograph.
 *
 * So the fix is on the glyph rather than on the material: a dark halo, which
 * costs nothing over a dark photograph (it is invisible there) and is the whole
 * difference over a bright one. Crystal is untouched; one material still.
 */
export const GLASS_MARK_LIT = "glass-mark-lit";
