/**
 * THE GLASS MATERIAL, NAMED (the `glass` board, ruled whole 2026-09-20:
 * `material=crystal`, `edge=double`, and round one's six answers standing).
 *
 * ★ THIS FILE OWNS NO PIXELS. The material is CSS — the `--glass-*` tokens and
 * the `.glass` utility in `src/app/globals.css` — because a backdrop filter is a
 * paint instruction and a Tailwind `@utility` compiles only in the entry sheet.
 * What lives here is the material's NAMES and the two rules a reviewer cannot
 * see in a className string, so `glass.test.ts` can hold both against the
 * stylesheet without a browser.
 *
 * ★ ONE MATERIAL, EVERYWHERE. Will, on the reel's white pane: "I don't want to
 * have separate glass treatments and would prefer to find a global that works
 * everywhere." A second recipe, anywhere, is the drift the whole round was run
 * to prevent, so the numbers have exactly one home and this module names it.
 *
 * ★ GLASS IS MEDIA CHROME, NEVER A POPOVER. `ui/floating-layer.ts` refuses a
 * backdrop filter on a floating PANEL, and the glass ruling does not lift that
 * refusal: a menu, a tooltip, a dialog and a sheet are opaque surfaces with a
 * step and a ring (bible 15). Glass exists where a photograph is the ground.
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

/**
 * EVERY TOKEN THE MATERIAL IS MADE OF, with the value the stylesheet declares.
 * The test reads `globals.css` and holds it to this table, so a retune is a
 * two-line change (here and there) and a DRIFT is a red test rather than a
 * surface nobody compared.
 */
export const GLASS_TOKENS = {
  /** Crystal's body. */
  "--glass-blur": "42px",
  "--glass-brightness": "0.68",
  "--glass-saturate": "2",
  "--glass-tint": "0.04",
  /** The double edge: a lip, and a hairline all the way round. */
  "--glass-lip": "0.28",
  "--glass-hairline": "0.1",
  /** The marks' cheaper blur. */
  "--glass-blur-mark": "12px",
  /** The lightbox's ground. */
  "--glass-behind-blur": "28px",
  "--glass-behind-brightness": "0.5",
  "--glass-behind-saturate": "1.2",
  "--glass-behind-tint": "0.35",
} as const satisfies Record<`--glass-${string}`, string>;

export type GlassToken = keyof typeof GLASS_TOKENS;

/**
 * The floating primitives the material may NOT reach, by file. Bible 15's layer
 * is opaque and stays opaque; `floating-layer.test.ts` already refuses a
 * `backdrop-filter` inside its own family, and this list is the glass side of
 * the same fence so the refusal survives a rename on either side.
 */
export const NOT_GLASS: readonly string[] = [
  "src/components/ui/dropdown-menu.tsx",
  "src/components/ui/popover.tsx",
  "src/components/ui/select.tsx",
  "src/components/ui/tooltip.tsx",
  "src/components/ui/sheet.tsx",
  "src/components/ui/floating-layer.ts",
];
