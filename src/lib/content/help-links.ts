/**
 * THE PRODUCT'S DOORS INTO THE HELP CENTER (help-center r1 `from-product=contextual`, Will: "Let's
 * also include the help center entry in the menu too. That way it's globally accessible for general
 * questions as well, not only when encountering trouble").
 *
 * Two links at the moment of trouble (the failure sheet, and a refused photo's row in her uploads),
 * each to the article that answers it, and one standing Help center row in every account menu. Held
 * here, fs-free, because the surfaces that carry them are client components that may never import
 * `help.ts` (it reaches `node:fs`); `help-links.test.ts` holds every one to a published article and,
 * where it names one, a heading that exists, so a renamed article or section fails the gate rather
 * than a guest's tap.
 *
 * ★ EVERY ONE OPENS IN A NEW TAB where it is used: a guest mid-upload holds her failed files in this
 * page's memory (the sheet's Retry needs them), and a host keeps their place in the app, so help is
 * read beside the product and never instead of it.
 */

/** The standing row in the guest's name menu, her account menu and the host's account menu. */
export const HELP_CENTER_HREF = "/help";

/** The failure sheet's line (and the door's in-step view of the same list): why a file did not go. */
export const UPLOAD_FAILED_HELP_HREF = "/help/an-upload-wont-finish";

/** A refused photo's row in her uploads ("Not approved"): the section that says what that means. */
export const NOT_APPROVED_HELP_HREF =
  "/help/a-photo-is-missing-from-the-album#the-host-turned-it-down-hid-or-removed-it";
