/**
 * THE LAB STYLESHEET'S GENERATION (the revamp, 2026-09-16).
 *
 * `next dev` names its CSS chunks by path, never by content, so a browser that
 * cached the lab's stylesheet keeps serving it after the file changed; Will's
 * Chrome held a copy from before the shell grid existed and the whole lab
 * collapsed into one column with nothing erroring. design.css declares this
 * number on `.lab-shell` (`--lab-css-generation`), LabChrome reads it after
 * mount, and a mismatch is a stale sheet: one automatic reload in development,
 * a notice everywhere. Bump BOTH when a rule the shell depends on changes;
 * lab-css-generation.test.ts keeps them equal.
 */
export const LAB_CSS_GENERATION = 2;
