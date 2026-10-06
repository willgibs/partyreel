/**
 * A FRAME WEARS ITS PANE'S THEME, NOT ONLY THE PAGE'S (lab-kit-2, from ROADMAP's line on the Specimen's split).
 *
 * A portalled scene lands on its own ground: the frame's `<html>` and the scene's wrapper take the lab page's class
 * list (`frame.tsx`: the font variables a scene falls back to a serif without, and the theme, followed while the frame
 * is open). That is the page's theme, and a pane is not always the page: the Library's Specimen draws a specimen twice
 * in its split, one pane forced to paper (`.surface-paper`) and one to the room (`.dark`), and a `Stage` forces its
 * ground the same way. A frame read the page's class in both, so the split drew a frame's scene twice in one theme and
 * a frame on a light stage in a dark lab was dark.
 *
 * ★ THE NEAREST `.dark` OR `.surface-paper` ABOVE THE FRAME IS ITS GROUND, which is what the stylesheet itself does for
 * anything inside a pane (the tokens come from the nearest block, and `dark:` is `&:is(.dark *):not(.surface-paper *)`).
 * With none, or when the nearest is the page's own root, the frame wears the page's class as it always did. With one,
 * the page's class stands except for its theme: the pane's ground replaces the page's `dark`, `light` (next-themes'
 * word for paper) and `surface-paper`, so the frame never wears two.
 *
 * ★ A ROUTED FRAME IS NOT REACHED. Its `<html>` is the site's own, written by the site's own theme provider (and
 * rewritten by it), so a pane's ground cannot be put on it without a fight; it follows the lab's toggle through that
 * provider as it does today. Only the scenes the lab draws itself take a pane's.
 */

/** The grounds a pane can force on what stands inside it. */
const GROUNDS = ["dark", "surface-paper"];
/** The page's own words for its theme: the grounds, and next-themes' `light`. */
const THEME_WORDS = [...GROUNDS, "light"];

/** The class list a frame's root and its scene's ground wear, drawn from where its figure stands in the lab. */
export function frameClass(figure: Element | null): string {
  const root = document.documentElement;
  const page = root.className;
  const pane = figure?.closest(".dark, .surface-paper") ?? null;
  if (!pane || pane === root) return page;
  const worn = GROUNDS.filter((ground) => pane.classList.contains(ground));
  return [
    ...page.split(/\s+/).filter((word) => word && !THEME_WORDS.includes(word)),
    ...worn,
  ].join(" ");
}

/**
 * Hears every class on the way from the figure to the page's root change: the lab's own toggle writes the root's, and
 * a board that changes its stage's ground writes the pane's. A store for `useSyncExternalStore`, so a frame is
 * re-skinned before it paints.
 */
export function subscribeFrameClass(
  figure: Element | null,
  notify: () => void,
): () => void {
  const observer = new MutationObserver(notify);
  for (let node = figure; node; node = node.parentElement)
    observer.observe(node, { attributes: true, attributeFilter: ["class"] });
  return () => observer.disconnect();
}
