/**
 * THE TRAPS: every ★ landmine the boards paid for, written down ONCE.
 *
 * Each of these cost a round. They were discovered on one board, commented in
 * that board's file, and then rediscovered on the next board because nobody
 * reads a comment in a file they are not editing. A trap leaves with the kit
 * piece that answered it: the lab revamp (2026-09-29) retired the tools no
 * board used, and seven traps with them (git keeps both). The kit's whole reason to
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
    id: "vw-in-a-narrow-div",
    tried:
      "Preview a phone-width surface by putting the real markup in a 375px-wide div on the board page, and label it 375.",
    breaks:
      "Every step of the type ladder is a `vw` clamp, and `vw` is the BROWSER's width, not the container's. On a 1550 page the masthead rendered at 160px inside a box 375 wide, while the caption underneath said 64. Nothing errors and the layout looks plausible, so the reviewer answers a question about the wrong sizes: the previews are not merely imprecise, they are of the other breakpoint entirely.",
    instead:
      "A same-origin iframe is the only real viewport the lab has. `Frame` takes `children` and portals the composition INTO the frame's document, so no scene route is needed; it also copies the parent's <html> class, without which next/font's variables are absent and the whole scene falls back to a serif.",
    file: "src/components/lab/frame.tsx",
  },
  {
    id: "stale-lab-stylesheet",
    tried:
      "Trust `next dev` to serve design.css as it is on disk after a change.",
    breaks:
      "The CSS chunk's URL is its path, not its content, so a browser can keep an old copy for hours while the JS is fresh; and Turbopack's persistent cache (.next/dev) can keep serving the old chunk after an edit while the TSX around it is fresh. Either way the shell grid, the sticky dock and the wide page's max-width lift vanish, the sidebar stacks above the content, and nothing errors. It reads as five layout bugs.",
    instead:
      "LabChrome reads `--lab-css-generation` off `.lab-shell` after mount and reloads once (a notice where it cannot); bump the number in design.css and lab-css-generation.ts together when a shell rule changes.",
    file: "src/components/lab/lab-chrome.tsx",
  },
  {
    id: "post-hydration-value-in-evidence",
    tried:
      "Build an element inside a board's evidence value from a value that is only known after hydration (next-themes' resolvedTheme, an approach flag) and hand it through the template's callbacks.",
    breaks:
      "The element keeps the SERVER's attributes: resolvedTheme is undefined on the server and the real mode after hydration, and an element built once in a callback never re-renders on the change. The rounding board measured it twice (2026-09-16): a ground box stayed dark in a light lab while the frame inside it had switched, and an approach flag held in the board never reached the row it gated.",
    instead:
      "Read the value in the component that renders the thing it drives, and key an element on the value that changes its identity, so the change is a re-render rather than a stale attribute.",
    file: "src/components/lab/board-page.tsx",
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
    id: "cross-origin-proxy",
    tried:
      "Treat an unreachable frame's contentWindow as null, and guard the read rather than the use.",
    breaks:
      "A cross-origin `contentWindow` is NOT null: it is a WindowProxy, and the read succeeds. The SecurityError comes later, on the first real property access, which was `addEventListener` inside the scroll lock and outside the caller's try. A reader clicking a link in a frame that left the origin took the whole board to its error boundary, all four frames with it.",
    instead:
      "Guard the USE, not the read: the join itself is the reachability test, `register` returns false when it throws, and the frame draws its blocked banner while its siblings keep their candidate. The injection is polled too, because an off-origin navigation is a change nothing re-renders for.",
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
      "`Measured` reads the number off the frame's own document (its observer, its timers and the webfont) and the caption prints what it read; `null` from the probe means not settled yet, never a guess.",
    file: "src/components/lab/scene.tsx",
  },
  {
    id: "empty-derived-token",
    tried: "Read `--radius-xl` to caption a derived step.",
    breaks:
      "`@theme inline` substitutes each derived step into its utility at build time, so the variable is empty at runtime and the caption prints nothing or falls back to a literal.",
    instead:
      "Probe with a hidden element wearing the utility inside the frame and measure it with `Measured`. The only honest number for a baked value is the browser's.",
    file: "src/components/lab/scene.tsx",
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
    id: "a-button-in-the-success-hold",
    tried:
      "Draw a next step, a link or a button inside the door's held success view, 'You're in'.",
    breaks:
      "The hold is a fixed beat, about 900ms (`useSuccessHold`'s `minBeatMs`), that releases the instant the server's refresh lands, whichever comes last: a control there is reachable for however long the beat happens to run and then it is gone, never a screen a reader gets to act on. Two boards drew one there anyway, because the held view sits still long enough to look like a settled screen.",
    instead:
      "Treat the held step as a transition, not a screen: its one job is to mask the refresh round-trip and hand off to whatever comes next (the reveal, or the next gate). A next action belongs on the surface the hold reveals, never inside the hold.",
    file: "src/lib/guest/use-success-hold.ts",
  },
  {
    id: "lab-utility-loses-to-production",
    tried:
      "Pair a lab-only responsive utility with a production class on the same element to preview a variant (e.g. `hidden lg:contents` beside a production class, or `sm:max-w-md` beside production's `max-w-[calc(100%-2rem)]`).",
    breaks:
      "The lab's own utilities compile into their `utilities.lab` sub-layer, which loses to production's own layer whatever the source order or specificity says: `hidden lg:contents` stayed hidden at 1440, and `sm:max-w-md` beside production's `max-w-[calc(100%-2rem)]` drew a 1408px dialog. Nothing errors, and DevTools still shows the lab class matching, so the board looks like it is showing the variant when production quietly won.",
    instead:
      "Override production through the board's own sheet or `cn()`, never a bare Tailwind utility competing with a production class on the same element.",
    file: "src/app/(dev)/design/design.css",
  },
  {
    id: "reduced-motion-measure",
    tried:
      "Write a box's width (or zoom) from a script and read its size back in the same task, to measure a layout: the whole stage tries a dozen widths that way.",
    breaks:
      "Under reduced motion globals.css gives every element `transition-duration: 0.01ms !important` (never 0, or radix's exits would wait for ever), and `transition-property` is `all` by default, so every style write is a transition and the read gets the value from before the write. The stage measured every width as the same height and fitted four phones stacked at 11%; `lab:demo` runs under reduced motion, so the gate saw it and Will, without it, would not have.",
    instead:
      "design.css takes only what the stage writes and reads (its drawing's box and the frames' names) out of the guard, inside the guard's own layer, so every other transition in a drawing keeps it.",
    file: "src/components/lab/whole.ts",
  },
  {
    id: "zoom-lands-late-on-a-frame",
    tried:
      "Switch a zoom off to measure a box at its natural size and back on again, since zoom is how the lab scales a frame.",
    breaks:
      "A zoom on a box that holds an iframe lands a frame or two after it is set (13 to 36 ms, measured in Chrome 154), because the frame's own scale follows it; a plain box takes it at once. A read in between measures the old picture, and the drawing is fitted to a size it no longer has.",
    instead:
      "`offsetWidth` and `offsetHeight` answer in the box's own unscaled pixels whatever its zoom, and a width set under a zoom lays out at once, so the whole stage measures under the zoom it already wears and never undoes one.",
    file: "src/components/lab/whole.ts",
  },
];
