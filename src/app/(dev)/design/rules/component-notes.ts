/**
 * Notes on the component index (the hand layer that survived the "less is
 * more" reset, 2026-09-12).
 *
 * EVERY file the index knows carries a `for` line, and gallery.test.ts fails
 * on a missing one. It is the single line the /design library index and each
 * component's own page show beside the name, so an agent can find the right
 * component without opening a source file: say what the thing is FOR in this
 * product, not what category it belongs to ("the app's one h1 source", never
 * "a heading component"), and where a non-obvious constraint is the main
 * thing to know (a singleton, a sibling-not-child rule, an inert preview),
 * say that instead of the obvious.
 *
 * A component file the library does not import ALSO needs an `unspecimened`
 * reason, or component-index.test.ts fails; those reasons are the exceptions,
 * the `for` line is the rule. Keys are grouped by directory, then sorted (a
 * lazy wrapper sits with the component it wraps).
 */

export type ComponentNote = {
  /** One line: what the component is for. Required of every indexed file. */
  for?: string;
  /** Why the library does not render it (a specimen is the default). */
  unspecimened?: string;
};

export const COMPONENT_NOTES: Record<string, ComponentNote> = {
  // ★ AT THE HEAD, not in the shared/ block below, because three wiring lanes
  // add their own `for` lines this round and each one's landing at the top is
  // what keeps the three merges apart. The collector does not index
  // subdirectories of shared/ on its own, so these are here because they carry
  // contracts, and their Library entries read these lines like every other
  // component's (the backdrop and the river said the same thing first).
  "src/components/shared/album-stream/album-stream.tsx": {
    for: "photographs falling out of the room around a hero's words and into the album beneath it; decorative, and its resting frame is server HTML so a reader with no script still meets the composition",
  },
  "src/components/shared/album-stream/stream-engine.ts": {
    for: "that stream's arithmetic alone (no React, no DOM, nothing measured): a horizontal is affine in the hero's half-width and a vertical is px from the album's own top edge, so one table is right at every window",
    unspecimened: "pure functions; the stream above is what they draw",
  },

  "src/components/shared/trail/trail.tsx": {
    for: "photographs laid down behind a cursor, or behind a figure walked on its own; decorative, and the words it is given stand inside it rather than over it",
  },
  "src/components/shared/trail/trail-engine.ts": {
    for: "the trail's arithmetic alone (no React, no DOM, nothing measured): one sample of a moving source goes in, the next ring of photographs comes out",
    unspecimened: "pure functions; the trail above is what they draw",
  },
  "src/components/shared/trail/trail-frames.ts": {
    for: "the photographs a trail lays down: the slot ASSETS row 21 fills, so a generated set lands as a data change and no component ever names a picture",
    unspecimened: "a list of image ids; the trail above is where they are seen",
  },
  /* shared / river (river-wiring, 2026-09-19) */
  "src/components/shared/river/qr-plate.tsx": {
    for: "the real scannable code a river is born from inside a feature door; server-rendered, no link and no label, and sized off its own value so a module never drops under the scan floor",
  },
  "src/components/shared/river/qr-door-frames.ts": {
    for: "the twelve photographs the QR door pours, in launch order with their crops: the slot a generated set lands in, never the pictures",
  },

  /* marketing / chrome */
  "src/components/marketing/chrome/marketing-footer.tsx": {
    for: "the ink slab closing every marketing page: the demo invite, the index, the legal bar",
  },

  /* marketing / frames */
  "src/components/marketing/frames/album-frame.tsx": {
    for: "the browser-album mock: an even grid of tiles holding event media, decorative",
  },
  "src/components/marketing/frames/browser-frame.tsx": {
    for: "the browser card every media frame is built on: one card look, one window bar",
  },
  "src/components/marketing/frames/gallery-frame.tsx": {
    for: "the lightbox-style album mock: one big frame on the dark gallery ground, plus a filmstrip",
  },
  "src/components/marketing/frames/live-qr.tsx": {
    for: "the real, scannable demo QR; client only, since qr-code-styling touches window",
  },
  "src/components/marketing/frames/phone-frame.tsx": {
    for: "the phone bezel (PhoneShell) and the guest-upload mock that fills it",
  },
  "src/components/marketing/frames/qr-frame.tsx": {
    for: "the scan-to-join card: a drawn QR block, or the live demo code when a URL is passed",
  },
  "src/components/marketing/frames/reel-frame.tsx": {
    for: "the video-player frame; pass real media and the painted-on transport steps aside",
  },

  /* marketing / legal */
  "src/components/marketing/legal/legal-document.tsx": {
    for: "the one shell Privacy and Terms both render, so the two read as one document",
  },

  /* marketing / sections / features / shared */
  "src/components/marketing/sections/features/shared/feature-door.tsx": {
    for: "a feature's door card: the photograph IS the card, plus the chip that surface draws",
  },
  "src/components/marketing/sections/features/shared/feature-faq.tsx": {
    for: "the one FAQ band all six feature pages share, and the only place their JSON-LD is emitted",
  },
  "src/components/marketing/sections/features/shared/feature-hero-eyebrow.tsx":
    {
      for: "the feature hero's one eyebrow",
    },
  "src/components/marketing/sections/features/shared/ghost-grid.tsx": {
    for: "the locked-gallery tease: the app's ghost grid, shape and count, zero pixels",
  },
  "src/components/marketing/sections/features/shared/go-deeper.tsx": {
    for: "the quiet pointer to the help center, so a marketing page never becomes documentation",
  },
  "src/components/marketing/sections/features/shared/related-features.tsx": {
    for: "the sibling-features band that opens every feature page's closing chapter",
  },
  "src/components/marketing/sections/features/shared/text-swap.tsx": {
    for: "swaps one line of text for another: the old blurs up and out, the new rises in",
  },

  /* marketing / sections / home */
  "src/components/marketing/sections/home/hero-stream.ts": {
    for: "the home hero's band: where every photograph leaving the QR is at any instant, and the measured line the headline hangs from",
    unspecimened:
      "pure geometry; the hero it solves is the specimen (/design/library/cinema-hero)",
  },
  "src/components/marketing/sections/home/pro-card-beam.tsx": {
    for: "the beam on the Pro card, the one standing beam: its ring is always the card's own corner",
  },

  /* marketing / sections / shared */
  "src/components/marketing/sections/shared/bulk-select-mock.tsx": {
    for: "the app's select tile and bulk bar, quoted for marketing: resting shapes, never controls",
  },
  "src/components/marketing/sections/shared/confetti-burst.tsx": {
    for: "the celebratory beat: confetti with real physics, one shot per fire, never an ambient loop",
  },
  /* sections/shared (loop-wiring, 2026-09-19) */
  "src/components/marketing/sections/shared/how-it-works-stepper.tsx": {
    for: "the whole six-step loop inside one ordinary section, one step on screen at a time: reads the same single source /how-it-works walks, so a teaser can never be shallower than the page it points at",
    unspecimened:
      "a full-width section rather than a component; the home's how-it-works passage is where it is seen, and its contract is beside it",
  },
  "src/components/marketing/sections/shared/inline-reel-player.tsx": {
    for: "the poster-first reel surface: no video bytes until someone asks to play",
  },
  "src/components/marketing/sections/shared/learn-chevron.tsx": {
    for: "the bare learn-more chevron, for a row that is already a link and cannot nest another",
  },
  "src/components/marketing/sections/shared/learn-more-link.tsx": {
    for: "the recurring see-more link: the chevron's arms spread on hover, pure CSS",
  },
  "src/components/marketing/sections/shared/sample-reel-overlay.lazy.tsx": {
    for: "the watch-a-sample-reel overlay, lazy so the home page never carries it",
  },
  "src/components/marketing/sections/shared/texts-reveal.tsx": {
    for: "trips a group of lines into their staggered rise; that recipe keys a class, not a flag",
  },

  /* marketing / system */
  "src/components/marketing/system/caption.tsx": {
    for: "the one caption atom: every label, hint and descriptor on the site, data included, on the body face",
  },
  "src/components/marketing/system/card-grid.tsx": {
    for: "the recurring card grid; server-first, and the tilt island is opt-in per grid",
  },
  "src/components/marketing/system/conveyor.tsx": {
    for: "the marquee shell: renders its children twice, and owns the loop-pause contract",
  },
  "src/components/marketing/system/cta-band.tsx": {
    for: "the closing conversion band, with the credit line that ends a page",
  },
  "src/components/marketing/system/demo-cta-link.tsx": {
    for: "the recurring live-demo link, gated on a configured demo event so it is never dead",
  },
  "src/components/marketing/system/demo-ticket.tsx": {
    for: "the demo ticket: a scannable QR beside the tap-through, in the hero and the mega-panel",
  },
  "src/components/marketing/system/eyebrow.tsx": {
    for: "the section eyebrow atom: Inter, uppercase, tracked",
  },
  "src/components/marketing/system/media-split.tsx": {
    for: "the media-and-copy split; the media half gets the wider run, because media is the color",
  },
  "src/components/marketing/system/morph-delegate.tsx": {
    for: "one delegated listener grows a clicked card into the page it opens; the cards stay server",
  },
  "src/components/marketing/system/page-hero.tsx": {
    for: "the shared hero lockup for the identity pages: eyebrow, heading, subhead, actions",
  },
  "src/components/marketing/system/paper-chapter.tsx": {
    for: "a run of sections forced onto paper inside a cinema page; the flip is a chapter cut",
  },
  "src/components/marketing/system/reveal.tsx": {
    for: "the in-view trigger firing the marketing arrival grammar; CSS owns every bit of motion",
  },
  "src/components/marketing/system/screen-lamp.tsx": {
    for: "the one underlight: a lit object throws light down, as a SIBLING and never from inside",
  },
  "src/components/marketing/system/section-light.tsx": {
    for: "the Aurora at chapter scale: a section's own two edges lit, and never on a light ground",
  },
  "src/components/marketing/system/section-shell.tsx": {
    for: "the marketing section wrapper: eyebrow, heading, subhead, clamp and arrival register",
  },
  "src/components/marketing/system/stat-band.tsx": {
    for: "the counter band: numbers that roll or pop once, when the band scrolls into view",
  },
  "src/components/marketing/system/tilt-card.tsx": {
    for: "the 3D pointer tilt; mouse only, because a finger on a card must scroll the page",
  },
  "src/components/marketing/system/web-analytics.tsx": {
    for: "the analytics singleton and the data-track listener",
    unspecimened:
      "a document singleton mounted once in the marketing layout; a second mount doubles every event, so the page lists it as text",
  },

  /* guest (not a library directory: indexed for the empty state's contract) */
  "src/components/guest/gallery-empty-state.tsx": {
    for: "an album with nothing in it yet: the river ghosted under the promise, with the CTA only when the viewer can upload",
  },

  /* reel (not a library directory: indexed for the publish light's contract) */
  "src/components/reel/publish-light.tsx": {
    for: "the light a shared reel rests in: the house five behind the Studio's frame and under the share card, swelling only for a share made on this page",
  },
  "src/components/reel/reel-share-card.tsx": {
    for: "the share card under the reel's poster, with useReelPublish, the one share state the card, the chip and the Studio agree on",
  },
  "src/components/reel/reel-studio.tsx": {
    for: "the reel's own room; its header, dock and tray are positioned so they stay above the publish light",
  },

  /* shared */
  "src/components/shared/action-tooltip.tsx": {
    for: "the lightbox's icon tooltips; never on the SSR'd gallery tiles, which use native title",
  },
  "src/components/shared/anonymous-info.tsx": {
    for: "the (i) beside an Anonymous credit; tap to open, because guests are on phones",
  },
  "src/components/shared/app-shell.tsx": {
    for: "the signed-in app frame",
    unspecimened: "provider-bound (auth, the nav state); no in-lab harness",
  },
  "src/components/shared/claim-uploads-on-auth.tsx": {
    for: "claims a guest's uploads onto the account that just signed in",
    unspecimened:
      "an effect with no render of its own; it talks to Supabase on mount",
  },
  "src/components/shared/container.tsx": {
    for: "the centered page gutter: the single source of horizontal rhythm",
  },
  "src/components/shared/empty-state.tsx": {
    for: "the neutral placeholder for an empty gallery, dashboard or list",
  },
  "src/components/shared/floating-add-button.tsx": {
    for: "the floating Add photos pill, shown only while the header's Add button is off screen",
  },
  "src/components/shared/glow-filter.tsx": {
    for: "the turbulence field every Glow warps through",
    unspecimened:
      "a document singleton mounted once in the root layout; the lab must never mount a second",
  },
  "src/components/shared/glow.tsx": {
    for: "the light primitive; it takes no className, since one utility would erase the warp",
  },
  "src/components/shared/kbd.tsx": {
    for: "the keyboard-key chip; dropped in a tooltip it picks that treatment up by data-slot",
  },
  "src/components/shared/legal-consent-line.tsx": {
    for: "the one acceptance line tying a sign-in or a guest's entry to Terms and Privacy",
  },
  "src/components/shared/logo.tsx": {
    for: "the brand: the v1 wordmark alone, in the colour of whatever ground it sits on",
  },
  "src/components/shared/masonry.tsx": {
    for: "the shared masonry grid: true aspect ratios, space reserved before an image loads",
  },
  "src/components/shared/media-lightbox.tsx": {
    for: "the media lightbox with its gesture physics",
    unspecimened:
      "data- and provider-heavy; its behaviour pins live in media-lightbox.test.tsx",
  },
  "src/components/shared/media-lightbox.lazy.tsx": {
    for: "the lazy wrapper around the lightbox",
    unspecimened: "the lightbox's loader; see media-lightbox.tsx",
  },
  "src/components/shared/not-found-screen.tsx": {
    for: "the shared dead end for the not-found pages; content only, it wraps itself in nothing",
  },
  "src/components/shared/page-heading.tsx": {
    for: "the app's one h1 source: the page tier of the heading scale, above CardTitle",
  },
  "src/components/shared/password-strength-meter.tsx": {
    for: "soft guidance while a new password is typed; never a gate, the validators enforce",
  },
  "src/components/shared/play-badge.tsx": {
    for: "the this-is-a-video badge on a poster; pointer-transparent, so it never eats a swipe",
  },
  // Two subdirectories, so the collector does not index these on its own: they
  // are here because they carry contracts, and their Library entries read their
  // `for` lines from this table like every other component's.
  "src/components/shared/backdrop/backdrop-engine.ts": {
    for: "the switching backdrop's arithmetic alone (no React, no DOM, nothing in pixels): a position from 0 to 1 goes in, a stack of photographs comes out",
    unspecimened:
      "pure functions; the photograph section above is what they draw",
  },
  "src/components/shared/backdrop/photo-section.tsx": {
    for: "a section standing on a full-bleed photograph that switches as the reader moves, its copy on a glass plate; the device that carries a chapter cut",
  },
  "src/components/shared/backdrop/room-frames.ts": {
    for: "the photographs that section stands on, and how many a phone passes: the slot ASSETS row 20 fills, so a generated set lands as a data change",
    unspecimened:
      "a list of image ids; the photograph section above is where they are seen",
  },
  "src/components/shared/river/river-engine.ts": {
    for: "the river's arithmetic alone (no React, no DOM), in fractions of the box, so the server, the browser and a test all compute the same frame",
    unspecimened: "pure functions; the river above is what they draw",
  },
  "src/components/shared/river/river.tsx": {
    for: "a flow of photographs falling through a box, sized by its container; decorative, and a placement that wants it quiet filters its own wrapper",
  },
  "src/components/shared/route-error.tsx": {
    for: "the route error boundary",
    unspecimened:
      "fires Sentry on mount; /design/library/patterns renders a static mock of its screen",
  },
  "src/components/shared/set-name-step.tsx": {
    for: "the one required add-your-name step, reused at every gate that asks for one",
  },
  "src/components/shared/upload-thumbnail.tsx": {
    for: "the per-file thumbnail in the upload queue",
    unspecimened:
      "takes a live File from the upload queue; a specimen would need a client-made blob to show a square of nothing",
  },

  /* ui */
  "src/components/ui/avatar.tsx": {
    for: "the account face: the user menu, the account page, a guest in the list",
  },
  "src/components/ui/badge.tsx": {
    for: "the small status pill; the admin portal's states are most of its work",
  },
  "src/components/ui/button.tsx": {
    for: "every action in the product: the round family whose radius rides its height",
  },
  "src/components/ui/card.tsx": {
    for: "the panel the settings, dashboard, admin and auth surfaces are built out of",
  },
  "src/components/ui/dialog.tsx": {
    for: "the modal, plus the fullScreen takeover a whole-screen surface asks for",
  },
  "src/components/ui/drawer.tsx": {
    for: "the vaul bottom sheet; in the kit, and no product surface has claimed it yet",
  },
  "src/components/ui/dropdown-menu.tsx": {
    for: "the menu behind the user menu, the notification bell and the admin controls",
  },
  "src/components/ui/form.tsx": {
    for: "the react-hook-form field stack, hand-authored: the radix-nova registry has no form item",
  },
  "src/components/ui/input-otp.tsx": {
    for: "the six-slot code field: the emailed sign-in code, and the delete-account confirm",
  },
  "src/components/ui/input.tsx": {
    for: "the one text field, from the guest password gate to the admin console",
  },
  "src/components/ui/label.tsx": {
    for: "the field label in Inter 500: the per-setting tier under a card's title",
  },
  "src/components/ui/navigation-menu.tsx": {
    for: "the mega-menu primitive behind the marketing header, held to the floating-layer contract",
  },
  "src/components/ui/popover.tsx": {
    for: "the tap-to-open note: the storage meter's breakdown, the Anonymous explainer",
  },
  "src/components/ui/progress.tsx": {
    for: "the determinate bar: an upload's bytes, a reel's stitch, a guest's download",
  },
  "src/components/ui/select.tsx": {
    for: "the option picker; the contact form's topic is its one call site today",
  },
  "src/components/ui/separator.tsx": {
    for: "the hairline rule, and the or divider between the two sign-in paths",
  },
  "src/components/ui/sheet.tsx": {
    for: "the edge panel; the marketing mobile menu is what it carries today",
  },
  "src/components/ui/skeleton.tsx": {
    for: "the loading block: a shimmer sweep that goes static under reduced motion",
  },
  "src/components/ui/sonner.tsx": {
    for: "the themed Toaster",
    unspecimened:
      "mounted once in the root layout; the toast demo on /design/library/components fires it",
  },
  "src/components/ui/switch.tsx": {
    for: "the settings toggle, from an event's upload rules to the admin kill switches",
  },
  "src/components/ui/tabs.tsx": {
    for: "the tab group, filled or underlined; only the design lab mounts it today",
  },
  "src/components/ui/textarea.tsx": {
    for: "the long-form field: an event description, a report, an announcement",
  },
  "src/components/ui/tooltip.tsx": {
    for: "the hover and focus label; useless on touch, where a Popover is the honest answer",
  },

  /* lib */
  "src/lib/constants/feature-pages.ts": {
    for: "the six feature pages' shared identity: nav, hub, footer, sitemap and each page's hero",
  },
  "src/lib/shared/sampled-palette.ts": {
    for: "law 3 made real: the spill takes its hues from the photograph it is lighting",
  },

  /* the lab kit (src/components/lab) */
  "src/components/lab/index.ts": {
    for: "the lab kit's one import surface; nothing outside /design may import it (boundary.test.ts)",
    unspecimened: "a barrel, not a component",
  },
  "src/components/lab/board-spec.ts": {
    for: "what an exploration board IS as data: the question, the verdict, the asks, the sections, the controls, the walk",
  },
  "src/components/lab/board-page.tsx": {
    for: "the template every board renders through: the dock, the answer, the index, the sections, the meta, in one fixed order",
    unspecimened: "its specimen is a whole board (/design/lab/light)",
  },
  "src/components/lab/board-state.tsx": {
    for: "a board's declared controls, read from the URL rather than mirrored to it, so a link reopens the exact canvas and candidate",
    unspecimened: "a hook; the dock on any board is the specimen",
  },
  "src/components/lab/dock.tsx": {
    for: "a board's page-wide controls, always on screen, with the shell's reading controls at its right end",
  },
  "src/components/lab/lab-chrome.tsx": {
    for: "the shell's reading preferences written onto <html>, and the guard that catches a browser holding an old copy of the lab's stylesheet before it renders as five layout bugs",
  },
  "src/components/lab/step.tsx": {
    for: "One context and its question alone on the screen: the options drawn as preview tiles on one specimen, the real thing on a stage below, Back and Next; showing an option is not answering it",
  },
  "src/components/lab/before-after.tsx": {
    for: "The same specimen twice, touching: as today, then with the idea, captioned under the judged area, so a difference is looked at rather than remembered",
  },
  "src/app/(dev)/design/(shell)/lab/_desk/copy-so-far.tsx": {
    for: "The batch so far as one pasteable line, omitting every answer the ledger already holds, so a sitting can be sent in pieces without re-sending itself",
    unspecimened: "one button; the step's spine and the desk are its specimens",
  },
  "src/app/(dev)/design/(shell)/lab/_desk/session-step.ts": {
    for: "one step of a review, derived once from a board's spec and its ledger: what is asked, in what state, and whether it is staged behind a question nobody has answered yet",
    unspecimened: "pure data; the step surface is the specimen",
  },
  "src/components/lab/catalog.tsx": {
    for: "An exploration as a grid of finished ideas: each card its own line, its live preview, its facts and the reviewer's verdict; every control on it drives a page-wide declared control",
  },
  "src/components/lab/compare-two.tsx": {
    for: "Any two catalog cards side by side from the board's declared A and B, and the same real places drawn under both (the spot shape)",
  },
  "src/components/lab/item-verdict.tsx": {
    for: "The reviewer's row on one item: keep, refine or kill a catalog card (or keep, redesign, retire a Library entry) with a note, on the store every review surface shares",
  },
  "src/components/lab/frame.tsx": {
    for: "the only 1:1 surface the lab has: a same-origin iframe wearing a candidate as an adopted stylesheet, in scroll-locked rows",
    unspecimened:
      "it loads real pages; mounting one on a library page would load the site into the library",
  },
  "src/components/lab/specimen.tsx": {
    for: "the judged thing and the line that names it; a label is never inside the judged area and a stage never goes in a Cell",
  },
  "src/components/lab/apply.tsx": {
    for: "hands the whole site the exact block a ruling would land; a radio across a board, never a checkbox on each candidate",
  },
  "src/app/(dev)/design/sandbox/registry.ts": {
    for: "every standing board's spec, imported here and nowhere else, so the desk, the board page and the ledger read one list",
  },
};
