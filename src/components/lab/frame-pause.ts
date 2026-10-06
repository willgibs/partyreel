/**
 * A HIDDEN OPTION HOLDS STILL INSIDE ITS FRAMES TOO (lab-kit-2, from ROADMAP's line on the stage's pause and brand-r1's
 * deck, which bridged it by hand).
 *
 * The step draws every option at once and marks all but the shown one `data-paused` on its view (`step.tsx`), and
 * `design.css` freezes what is inside it (`[data-lab-view][data-paused] *`). A `Frame` is a document of its own, which
 * no selector of the lab's reaches, so a hidden option's drawings kept running behind the shown one: every CSS loop and
 * every video of every option at once (identity's Working step, measured in a real Chrome: four arcs turning in each of
 * the two hidden options' frames, none of them seen). A board could bridge it itself (`brand/deck/deck.tsx` mirrors the
 * view's mark onto its slides as `data-bd-paused`), and each that did was a copy of this.
 *
 * It is the same rule, written into the frame: while the view is paused the frame's root wears `data-lab-paused`, the
 * stylesheet below freezes every CSS animation under it, and the frame's `<video>` and `<audio>` are paused and, the
 * moment the option is shown again, played again.
 *
 * ★ A ROUTED FRAME TOO, NOT ONLY A PORTALLED ONE. A routed frame (identity's scene, the site's own pages) is a real
 * page whose document the lab can reach because it is the same origin, exactly as it writes the candidate sheet into
 * it, and is where most boards' loops live.
 *
 * ★ OF THE MEDIA, ONLY WHAT THIS STOPPED IS STARTED AGAIN. A video the page itself had paused (a reduced-motion
 * setting, a scene's own control) stays paused when its option is shown; and one that starts while the option is
 * hidden (`autoplay` finishing its load, a scene calling `play()`) is stopped as it starts, which is what the capturing
 * `play` listener is for (`play` does not bubble).
 *
 * ★ WHAT NO ONE CAN REACH FROM OUTSIDE IS A LOOP IN SCRIPT: a `requestAnimationFrame` chain or a timer is the frame's
 * own, so it reads `data-lab-paused` on its document's root as a loop on the lab's page reads `data-paused` (and a
 * portalled scene's loop runs in the lab's own window, where the frame's root is `ownerDocument.documentElement`).
 */

/** What the step writes on a view while another option is shown (`step.tsx`). */
const VIEW_MARK = "data-paused";

/** What a frame's root wears while its view is paused: the same word, in the frame's own document. */
export const FRAME_PAUSED = "data-lab-paused";

const RULE_ID = "lab-frame-paused";
/** The rule: every CSS animation of the document, its pseudo-elements and its root, held where it stands. */
const RULE =
  [
    `:root[${FRAME_PAUSED}]`,
    `:root[${FRAME_PAUSED}] *`,
    `:root[${FRAME_PAUSED}] *::before`,
    `:root[${FRAME_PAUSED}] *::after`,
  ].join(",") + "{animation-play-state:paused!important}";

type Tagged = CSSStyleSheet & { [RULE_ID]?: true };

/**
 * The rule, once per document. Adopted first and constructed in the FRAME'S realm (a sheet built in the lab's throws on
 * adoption), as the candidate sheet is: a routed frame under a strict `style-src` takes no `<style>` of ours, and an
 * adopted sheet is not one. Where adoption is unavailable (jsdom) it is a `<style>`.
 */
function putRule(doc: Document): void {
  const win = doc.defaultView as
    | (Window & { CSSStyleSheet?: typeof CSSStyleSheet })
    | null;
  if (win?.CSSStyleSheet && "adoptedStyleSheets" in doc) {
    if (doc.adoptedStyleSheets.some((sheet) => (sheet as Tagged)[RULE_ID]))
      return;
    const sheet = new win.CSSStyleSheet() as Tagged;
    sheet.replaceSync(RULE);
    sheet[RULE_ID] = true;
    doc.adoptedStyleSheets = [...doc.adoptedStyleSheets, sheet];
    return;
  }
  if (doc.getElementById(RULE_ID)) return;
  const style = doc.createElement("style");
  style.id = RULE_ID;
  style.textContent = RULE;
  (doc.head ?? doc.documentElement).appendChild(style);
}

/** A frame's elements wear the frame's own prototypes, so `instanceof HTMLMediaElement` answers false there. */
const isMedia = (node: unknown): node is HTMLMediaElement =>
  typeof node === "object" &&
  node !== null &&
  ["VIDEO", "AUDIO"].includes((node as Element).tagName);

/** What one document is holding: the media this stopped, to be started again. */
type Held = { doc: Document; stopped: Set<HTMLMediaElement> };

/**
 * Mirrors whether `view` is paused into the document `frame` holds, now and as it changes (a new document, a
 * navigation, a press on another option). Returns the release, which lets go of the document.
 */
export function mirrorPause(
  view: Element,
  frame: HTMLIFrameElement,
): () => void {
  let held: Held | null = null;

  const stop = (media: HTMLMediaElement) => {
    if (!held || media.paused) return;
    held.stopped.add(media);
    media.pause();
  };
  const onPlay = (event: Event) => {
    if (isMedia(event.target)) stop(event.target);
  };

  const hold = (doc: Document) => {
    if (!held) {
      held = { doc, stopped: new Set() };
      putRule(doc);
      doc.addEventListener("play", onPlay, true);
    }
    doc.documentElement.setAttribute(FRAME_PAUSED, "");
    doc.querySelectorAll<HTMLMediaElement>("video, audio").forEach(stop);
  };

  const letGo = () => {
    if (!held) return;
    const { doc, stopped } = held;
    held = null;
    try {
      doc.removeEventListener("play", onPlay, true);
      doc.documentElement?.removeAttribute(FRAME_PAUSED);
    } catch {
      // A document torn down mid-write: it takes its mark with it.
    }
    for (const media of stopped)
      if (media.isConnected && media.paused)
        void Promise.resolve(media.play()).catch(() => {});
    stopped.clear();
  };

  const sync = () => {
    let doc: Document | null = null;
    try {
      doc = frame.contentDocument;
    } catch {
      // Off-origin: nothing of it is the lab's to hold.
    }
    // A new document (a load, a navigation) is a new page: the old one's marks went with it.
    if (held && held.doc !== doc) letGo();
    if (doc?.documentElement && view.hasAttribute(VIEW_MARK)) hold(doc);
    else letGo();
  };

  sync();
  const observer = new MutationObserver(sync);
  observer.observe(view, { attributes: true, attributeFilter: [VIEW_MARK] });
  return () => {
    observer.disconnect();
    letGo();
  };
}
