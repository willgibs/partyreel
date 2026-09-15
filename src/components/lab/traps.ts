/**
 * THE TRAPS: every ★ landmine the boards paid for, written down ONCE.
 *
 * Each of these cost a round. They were discovered on one board, commented in
 * that board's file, and then rediscovered on the next board because nobody
 * reads a comment in a file they are not editing. The kit's whole reason to
 * exist is that a board should not be able to step on any of them, so the
 * mechanism is in the kit and the reason is here, rendered as a Traps section on
 * `/design/lab/kit`.
 *
 * Pure data: no React, no CSS, so the kit page, a test and a future desk can all
 * read it.
 */
export type Trap = {
  id: string;
  /** What a builder would naturally do. */
  tried: string;
  /** What actually happens, and why it is invisible. */
  breaks: string;
  /** The kit's answer. */
  instead: string;
  /** The kit file that holds the mechanism. */
  file: string;
};

export const TRAPS: readonly Trap[] = [
  {
    id: "breakpoints-in-a-stage",
    tried: "Use a Tailwind breakpoint prefix inside a 375 stage.",
    breaks:
      "A stage is a div, and `zoom` scales layout but never media queries, so `sm:` reads the real browser viewport and fires inside the phone canvas on a desktop. The stage looks plausible and is showing the desktop layout.",
    instead:
      "Key off the `mode` prop, or compute a column count from it (Specimen's `cols`). For a layout that must be judged at its real breakpoints, use a Frame: an iframe has its own viewport.",
    file: "src/components/lab/stage.tsx",
  },
  {
    id: "stage-in-a-flex-row",
    tried: "Put a Stage in a flex row beside its caption, or inside a Cell.",
    breaks:
      "Stage measures the box it is given to pick its zoom, so in a flex row it shrinks to its content width, measures about 100px and renders a 1440 canvas at seven percent. It looks like a deliberate thumbnail.",
    instead:
      "Stages and frames go in `Labeled` (full width, caption under); specimens go in `Cell`.",
    file: "src/components/lab/specimen.tsx",
  },
  {
    id: "candidate-css-order",
    tried:
      "Inject a candidate into a frame by appending a <style> to the frame's <head>.",
    breaks:
      "A candidate usually rewrites UTILITIES (`@theme inline` bakes the derived ladder into them, so it cannot be a token), and a utility override at equal specificity wins on source order alone. The head is not far enough: a lab route inside the frame mounts CandidateStyle, which writes its <style> into the BODY and beats it.",
    instead:
      "An adopted stylesheet constructed in the FRAME's own realm (a sheet built in the parent realm throws on adoption), which is ordered after every author sheet. The fallback is the last child of <body>, re-appended after a settle pass.",
    file: "src/components/lab/frame.tsx",
  },
  {
    id: "gated-frame-on-the-server",
    tried: "Render a frame whose src is a lab route from the server.",
    breaks:
      "Every lab route is gated and the key is browser-only, so the HTML ships a keyless src, the browser starts that load before hydration, and `requireDesignKey` answers with notFound() on every build but local dev. The reader watches a 404 paint inside the frame and then watches it reload.",
    instead:
      "`gated` holds the box until `useDesignKey()` has answered. Note the three values: undefined is 'the browser has not answered', null is 'open dev, no key', a string is the key. Collapsing undefined into null reintroduces the bug.",
    file: "src/components/lab/frame.tsx",
  },
  {
    id: "scroll-lock-from-onload",
    tried: "Join a frame to its scroll group in the iframe's onLoad handler.",
    breaks:
      "A frame in the server-rendered HTML starts loading before React hydrates, so its load event is gone by the time the handler exists. The split does not scroll together on first open and only starts to after a reload, which looks like a flaky feature.",
    instead:
      "Join from an effect keyed on a load COUNT, and have the register drop the previous window for that id first, so a frame is in the group exactly once whichever path got there.",
    file: "src/components/lab/frame.tsx",
  },
  {
    id: "listener-identity",
    tried: "Register the scroll handler with a fresh closure on every render.",
    breaks:
      "removeEventListener compares by identity, so a listener is left on every document the frame ever held and the second page is scrolled by three ghosts.",
    instead:
      "Store the handler with the window and remove that exact reference; keep the enabled flag in a ref so the registration never changes when the lock toggles.",
    file: "src/components/lab/frame.tsx",
  },
  {
    id: "knobs-through-the-url",
    tried: "Change a frame's src query to push a new state into it.",
    breaks:
      "Changing src reloads the document: the scroll position, the injected candidate and the frame's place in its lock group all go, and the reader flipping a knob sees the page blink.",
    instead:
      "`push` dispatches a `lab:set` CustomEvent into the frame's window; a lab scene listens for it. The URL is for the board's OWN state, never a frame's.",
    file: "src/components/lab/frame.tsx",
  },
  {
    id: "captions-as-literals",
    tried: "Type the value into the caption under the specimen.",
    breaks:
      "The specimen moves and the caption does not, and a reviewer has no way to tell which one is lying. It is the single most common way a board loses its authority.",
    instead:
      "`useComputedTokens` reads the computed cascade off a real element. Not the tuner store: a lab page mounts CandidateStyle and not the panel, so a store-driven caption prints an override nothing on the page is wearing.",
    file: "src/components/lab/measure.ts",
  },
  {
    id: "empty-derived-token",
    tried: "Read `--radius-xl` to caption a derived step.",
    breaks:
      "`@theme inline` substitutes each derived step into its utility at build time, so the variable is empty at runtime and the caption prints nothing or falls back to a literal.",
    instead:
      "Probe with a hidden element wearing the utility and measure it. The only honest number for a baked value is the browser's.",
    file: "src/components/lab/measure.ts",
  },
  {
    id: "inline-beats-the-block",
    tried: "Apply a candidate block that moves a token the tuner also owns.",
    breaks:
      "The tuner writes INLINE on <html>, and an inline declaration beats the `:root` block a candidate renders, so a standing knob silently masks the applied value and the site keeps wearing the knob.",
    instead:
      "Move the knobs with the block (`ApplyToSite`'s `onApply`), and clear any control whose range cannot express the value rather than leaving a phantom override that Reset never clears.",
    file: "src/components/lab/apply.tsx",
  },
  {
    id: "replay-by-listener",
    tried: "Re-run a one-shot animation by toggling a class on animationend.",
    breaks:
      "It races the compositor and leaves the element in whichever state the last frame happened to be, so a replay sometimes does nothing and there is no way to tell that from a dead button.",
    instead: "Remount: one incrementing key, `useReplay`.",
    file: "src/components/lab/motion.ts",
  },
  {
    id: "blanket-rest",
    tried: "Implement Rest as `animation: none` on the board.",
    breaks:
      "It also freezes the marketing reveal grammar on the real sections a board renders, whose pre-animation state is opacity 0, so the board reads as broken rather than at rest.",
    instead:
      "Rest is an attribute on the board's root and the board's own sheet decides, narrowly, what it freezes.",
    file: "src/components/lab/motion.ts",
  },
  {
    id: "state-in-the-initial-render",
    tried: "Seed the board's state from `window.location` during render.",
    breaks:
      "The server HTML and the browser's first render disagree whenever a link carries state; React reports a hydration mismatch and throws the server tree away.",
    instead:
      "Open on the declared defaults and adopt the URL on the first commit. Writes use `replaceState`, never push, and never touch a param the board does not own (`key` is the gate; dropping it 404s the next navigation).",
    file: "src/components/lab/board-state.tsx",
  },
  {
    id: "measuring-the-board",
    tried: "Take a frame-time sample with the whole board running.",
    breaks:
      "It measures the board, not the proposal, and a hidden tab throttles rAF on top of that, so the number is noise with three decimal places.",
    instead:
      "`CostMeter` solos its specimen through `data-lab-solo` while it runs, prints the static half that carries to a slower machine, and says so when a run was taken behind another window.",
    file: "src/components/lab/cost-meter.ts",
  },
  {
    id: "a-mark-around-the-specimen",
    tried: "Outline the recommended cell to say 'this one'.",
    breaks:
      "On any board judging edges, surfaces or corners the outline is one more cue, and the eye reads the marked card as the one with the extra edge.",
    instead: "The mark is in the LABEL: `Cell`'s `proposed` dot.",
    file: "src/components/lab/specimen.tsx",
  },
];
