/**
 * THE RULINGS REGISTRY of the design lab (thinned in the library round, 2026-09-02).
 *
 * One entry per ruling the lab has taken: what shipped, why in one line, and
 * where the rule lives now. The ruling verbatim is docs/design/rulings.md and
 * the board's spec carries its round; git keeps a retired board. The rules a reader must
 * obey live in the system docs named in `lives`, never here.
 *
 * `board` is set ONLY while a board still stands in sandbox/ (its ruling is
 * open). When the ruling lands: the rule moves to its system doc, the record doc
 * keeps the history, the board is deleted, and `board` goes with it. SANDBOX and
 * the sidebar derive from that, so this file is the one place a board is added
 * or retired. The touchpoint dispatcher (c/[touchpoint]/page.tsx) maps the same
 * four ids to their components.
 */
export type Surface = "guest" | "host" | "marketing" | "shared";

/** Surface display labels: the ONE home (the sidebar, the record page and the
 *  touchpoint header all import this, never redefine it). */
export const SURFACE_LABEL: Record<Surface, string> = {
  guest: "Guest",
  host: "Host",
  marketing: "Marketing",
  shared: "Shared",
};

export type RulingId =
  | "entry"
  | "upload"
  | "gallery"
  | "header"
  | "buttons"
  | "lightbox"
  | "event-card"
  | "forms"
  | "states"
  | "qr-card"
  | "arrival"
  | "host-event"
  | "host-dashboard"
  | "host-event-page"
  | "host-event-build"
  | "gallery-actions"
  | "marketing-identity"
  | "marketing-voice"
  | "marketing-decomposition"
  | "marketing-hero-substrate"
  | "home-hero"
  | "album-hero"
  | "river-visual"
  | "pricing-plan-cards"
  | "pricing-calculator"
  | "contact-identity"
  | "press-identity"
  | "blog-identity"
  | "careers-identity"
  | "reel-reveal"
  | "reel-experience"
  | "glow-doctrine"
  | "glow-moments"
  | "palette"
  | "light"
  | "type-scale"
  | "floating-surfaces"
  | "brand-voice"
  | "media-kit"
  | "rounding";

/** The boards standing in sandbox/ (each has `board` set below). */
export type SandboxId =
  | "album-hero"
  | "river-visual"
  | "glow-doctrine"
  | "glow-moments"
  | "light"
  | "floating-surfaces"
  | "brand-voice"
  | "media-kit"
  | "rounding";

export type Ruling = {
  id: RulingId;
  title: string;
  surface: Surface;
  /** An ISO date, a phase, an ADR, or "open" followed by what is still open. */
  ruled: string;
  /** "V<n> <name>" for a shipped variant; null when rejected, a placement list, or open. */
  shipped: string | null;
  /** The ruling in one line (the long form is the record doc). */
  why: string;
  /** Where the rule lives now: system-doc anchors and production paths. */
  lives: string[];
  /** Present only while the board stands in sandbox/. `tracks` names the lp/<track>
   *  branches building it when they differ from the board id (the desk reads it). */
  board?: { note: string; variants: string[]; tracks?: string[] };
};

export const RULINGS: Ruling[] = [
  {
    id: "entry",
    title: "Guest entry",
    surface: "guest",
    ruled: "Phase 1 (June 2026)",
    shipped: "V4 Adaptive sheet + ghost grid",
    why: "V2 staging for public events and a ghost grid when locked or empty; the account step framed as the host's safety choice.",
    lives: ["docs/systems/guest-flow.md"],
  },
  {
    id: "upload",
    title: "Upload moment",
    surface: "guest",
    ruled: "Phase 1 (June 2026)",
    shipped: "V4 Floating + tile combo",
    why: "Header Add on load and a floating Add on scroll, never both; progress in the gallery, a green check, a play badge on video.",
    lives: ["docs/systems/guest-flow.md", "docs/systems/uploads-and-r2.md"],
  },
  {
    id: "gallery",
    title: "Gallery grid",
    surface: "guest",
    ruled: "Phase 1 (June 2026)",
    shipped: "V2 Masonry columns",
    why: "V2 over a standard grid: unique and personalized; that creative separation became global philosophy.",
    lives: ["docs/systems/guest-flow.md"],
  },
  {
    id: "header",
    title: "Event header",
    surface: "guest",
    ruled: "Phase 1 (June 2026)",
    shipped: "V1 Left editorial",
    why: "Left editorial: minimal and contextual, no cover-image pressure on the host, more room for the gallery.",
    lives: ["docs/systems/guest-flow.md", "docs/systems/host-app.md"],
  },
  {
    id: "buttons",
    title: "Buttons & shape",
    surface: "shared",
    ruled: "Phase 1 (June 2026)",
    shipped: "V4 Sharp surfaces, round actions",
    why: "Sharp surfaces, round actions: a near-sharp surface radius and a 16px-at-40px action radius, one token each to retune.",
    lives: [
      "docs/systems/design-system.md#rounding-sharp-surfaces-round-actions",
      "src/app/globals.css",
      "src/components/ui/button.tsx",
    ],
  },
  {
    id: "lightbox",
    title: "Lightbox chrome",
    surface: "guest",
    ruled: "Phase 1 (June 2026)",
    shipped: "V2 Floating pill",
    why: "The floating pill: maximum media, attribution under the pill, no like counts, video state designed.",
    lives: ["docs/systems/guest-flow.md"],
  },
  {
    id: "event-card",
    title: "Host event card",
    surface: "host",
    ruled: "Phase 1 (June 2026)",
    shipped: "V3 Stat-forward overlay",
    why: "Stat-forward overlay on the cover image, refined pills, the QR chip top-left opening the QR and link modal.",
    lives: ["docs/systems/host-app.md"],
  },
  {
    id: "forms",
    title: "Forms & inputs",
    surface: "host",
    ruled: "Phase 1 (June 2026)",
    shipped: "V1 Card sections",
    why: "Card sections for settings, the focused column for onboarding; Urbanist for identity moments, Inter for functional headings.",
    lives: [
      "docs/systems/host-app.md",
      "docs/systems/design-system.md#type-the-heading-face-the-ladder",
    ],
  },
  {
    id: "states",
    title: "Empty & loading",
    surface: "shared",
    ruled: "Phase 1 (June 2026)",
    shipped: "V3 Photographic promise",
    why: "The photographic promise: a ghost mosaic fills the visible field with the CTA centered in it.",
    lives: ["docs/systems/design-system.md"],
  },
  {
    id: "qr-card",
    title: "QR table card",
    surface: "shared",
    ruled: "Phase 1 (June 2026)",
    shipped: "V1 Minimal ink",
    why: "Minimal ink and photo-backed as the base presets; the share studio configurator is the real feature (ROADMAP).",
    lives: ["docs/systems/host-app.md", "docs/ROADMAP.md"],
  },
  {
    id: "arrival",
    title: "Guest arrival",
    surface: "guest",
    ruled: "2026-06-11",
    shipped: "V1 Calm arrival",
    why: "Calm arrival with a longer pause: a 700ms beat, a tall welcome, the directional step slide, the 900ms success morph.",
    lives: [
      "docs/systems/guest-flow.md",
      "docs/systems/design-system.md#the-arrival-choreography-calm-700ms",
    ],
  },
  {
    id: "host-event",
    title: "Host event page",
    surface: "host",
    ruled: "2026-06-12",
    shipped: "V1 Gallery-first",
    why: "Gallery-first: the gallery is the page under a minimal editorial header, management in one compact command strip.",
    lives: ["docs/systems/host-app.md"],
  },
  {
    id: "host-dashboard",
    title: "Host dashboard",
    surface: "host",
    ruled: "2026-06-12",
    shipped: "V3 Single feed",
    why: "A hybrid: filter chips over one continuous feed (events, then uploads, then likes) with the ambient storage meter.",
    lives: ["docs/systems/host-app.md"],
  },
  {
    id: "host-event-page",
    title: "Gallery-first event page",
    surface: "host",
    ruled: "2026-06-20",
    shipped: "V1 Composition: editorial",
    why: "The editorial composition with icon sub-stats, Share primary, the review teaser below the actions; settings as a route, Deleted behind it.",
    lives: ["docs/systems/host-app.md"],
  },
  {
    id: "host-event-build",
    title: "Gallery-first page: build",
    surface: "host",
    ruled: "2026-06-20",
    shipped: "V6 Review: focused mode",
    why: "A header status row, a responsive command strip, focused review mode as a takeover with instant moderation, settings as a route with a crossfade.",
    lives: ["docs/systems/host-app.md"],
  },
  {
    id: "gallery-actions",
    title: "Gallery actions",
    surface: "shared",
    ruled: "2026-06-20",
    shipped: "V1 Universal action colors + the grouped lightbox (the model)",
    why: "Universal per-action colors (like pink, save blue, hide amber, approve green, delete red): monochrome at rest, color on hover and state.",
    lives: [
      "docs/systems/host-app.md",
      "docs/systems/design-system.md",
      "docs/systems/architecture.md",
    ],
  },
  {
    id: "marketing-identity",
    title: "Marketing identity",
    surface: "marketing",
    ruled: "2026-07-05 (T1)",
    shipped: "V1 Editorial gallery",
    why: "A B plus C hybrid: the cinema hero leads with the reel animation, C's product demo follows; A rejected as too templated.",
    lives: [
      "docs/systems/marketing-content.md",
      "src/components/marketing/sections/home/",
    ],
  },
  {
    id: "marketing-voice",
    title: "Marketing voice",
    surface: "marketing",
    ruled: "2026-08-25",
    shipped: "V1 Collection-led",
    why: "Collection-led stands as the spine ('The whole event, in one album.') with Arc's register guiding the sentences; marketing-voice.ts is the source.",
    lives: [
      "src/lib/constants/marketing-voice.ts",
      "docs/systems/marketing-content.md",
    ],
  },
  {
    id: "marketing-decomposition",
    title: "Marketing decomposition",
    surface: "marketing",
    ruled:
      "2026-09-15, retired unruled: the home hero's rounds (the source, the scan, the inflow) superseded the reel-that-comes-apart; the board left the lab in the Library x Lab migration wave, git keeps it (its last head is the wave's merge)",
    shipped: null,
    why: "Retired: one-shot versus scroll-driven for a decomposition the home no longer has; the pile, stack and confetti extras wait in the record.",
    lives: ["docs/systems/marketing-content.md", "docs/ROADMAP.md"],
  },
  {
    id: "marketing-hero-substrate",
    title: "Marketing hero substrate",
    surface: "marketing",
    ruled:
      "2026-09-15, retired unruled: the production hero decided against footage and the home hero's rounds replaced the kinetic H1; the board left the lab in the Library x Lab migration wave, git keeps it",
    shipped: null,
    why: "Retired: Roll, Type or Cut for a word animation the hero no longer carries; the mp4 substrate slot is recorded for any page that wants footage.",
    lives: ["docs/systems/marketing-content.md", "docs/ROADMAP.md"],
  },
  {
    id: "home-hero",
    title: "The home hero",
    surface: "marketing",
    ruled: "2026-09-17",
    shipped: "Stacked, code above",
    why: "Stacked, code above: the album streams out of the real demo code on one axis and the whole lockup hangs under it as one block, with no scrim over a photograph.",
    lives: [
      "src/components/marketing/sections/home/cinema-hero.tsx",
      "src/components/marketing/sections/home/hero-stream.ts",
      "docs/systems/marketing-content.md",
    ],
  },
  {
    id: "pricing-plan-cards",
    title: "Pricing plan cards",
    surface: "marketing",
    ruled: "2026-08-27",
    shipped: "V2 Stacked photos",
    why: "Stacked photos: two grayscale on Free, four vivid on ink for Pro, hover spreads; money set in the display face.",
    lives: [
      "src/app/(marketing)/(cinema)/pricing/",
      "docs/systems/marketing-content.md",
    ],
  },
  {
    id: "pricing-calculator",
    title: "Pricing calculator",
    surface: "marketing",
    ruled: "2026-08-27",
    shipped: "V1 Album fill",
    why: "Album fill: the wall fills as you slide, on the real gallery grammar; the receipt line stays the accessible summary.",
    lives: [
      "src/app/(marketing)/(cinema)/pricing/",
      "docs/systems/marketing-content.md",
    ],
  },
  {
    id: "contact-identity",
    title: "Contact identity",
    surface: "marketing",
    ruled: "2026-08-28",
    shipped: "V2 The desk",
    why: "A composite on the desk: its structure and form, the note's stamp and letterhead, the Polaroid spread dropped, the chips collapsed to a dropdown.",
    lives: [
      "src/app/(marketing)/(paper)/contact/",
      "docs/systems/marketing-content.md",
    ],
  },
  {
    id: "press-identity",
    title: "Press identity",
    surface: "marketing",
    ruled: "2026-08-28",
    shipped: "V1 The contact sheet",
    why: "The contact sheet: press around the assets and quick hit points; the logo usage guidelines cut from the page entirely.",
    lives: [
      "src/app/(marketing)/(cinema)/press/page.tsx",
      "src/components/marketing/press/press-sheet.tsx",
      "docs/systems/marketing-content.md",
    ],
  },
  {
    id: "blog-identity",
    title: "Blog identity",
    surface: "marketing",
    ruled: "2026-08-28",
    shipped: "V4 The Cutting Room",
    why: "A composite on the cutting room: the broadsheet masthead, the letterboxed featured card, a portrait-card library, a sticky tag index.",
    lives: [
      "src/app/(marketing)/(cinema)/blog/blog-list.tsx",
      "docs/systems/marketing-content.md",
    ],
  },
  {
    id: "careers-identity",
    title: "Careers identity",
    surface: "marketing",
    ruled: "2026-08-28",
    shipped: null,
    why: "All three rejected as costumes over the wrong content; the page that shipped argues in photographs, and engine internals never belong here.",
    lives: [
      "src/app/(marketing)/(cinema)/careers/",
      "docs/systems/marketing-content.md",
    ],
  },
  {
    id: "reel-reveal",
    title: "Reel reveal moment",
    surface: "host",
    ruled: "2026-07-05 (T1), ratified as built 2026-07-08",
    shipped: "V1 Composite (ruled)",
    why: "A new composite: tiles assemble, a camera flash, the full-bleed expansion, the lights-down title, then the reel breathes; ratified as built on device.",
    lives: ["src/app/globals.css", "docs/systems/design-system.md"],
  },
  {
    id: "reel-experience",
    title: "Reel experience",
    surface: "host",
    ruled: "milestone-1.5 (the QA round's product rulings)",
    shipped: "V1 Marquee in the feed",
    why: "Marquee in the feed: the poster card is the feed section, deeper editing graduates to a Reel Studio, the reel is born by Create.",
    lives: ["docs/systems/host-app.md"],
  },
  {
    id: "glow-doctrine",
    title: "The spill doctrine",
    surface: "shared",
    ruled: "2026-08-28 and 08-31; open: the lit surface",
    shipped: null,
    why: "Settled but for the lit surface: SPILL is light from a lit thing, BEAM is the live subject lit at its edge; the engine promoted, our palette, the 8s register.",
    lives: [
      "docs/systems/design-system.md#light-spill-beam-and-the-lamp-set",
      "src/components/shared/glow.tsx",
      "src/app/globals.css",
    ],
    board: {
      note: "Two light systems: our spill engine for light from a lit thing, and the vendored border-beam for an object that IS the live thing",
      variants: ["Seam", "Throw", "Sweep", "Bloom", "Halo", "Corner A/B"],
      tracks: ["glow-specs"],
    },
  },
  {
    id: "glow-moments",
    title: "Spill placements",
    surface: "shared",
    ruled: "2026-08-31; open: the publish beat's violet",
    shipped: null,
    why: "Reviewed: ten spill placements and three beams ship, the QR plate takes our own light, the upload takes none; the publish beat's violet is unruled.",
    lives: ["docs/systems/design-system.md#the-shipped-light"],
    board: {
      note: "Thirteen moments argued against the doctrine, including where a beam is allowed, then the whole page they compose into",
      variants: [
        "Hero underlight",
        "Locked door",
        "Doorbell arrival",
        "Awaiting media",
        "Album straddle",
        "QR plate",
        "Publish beat",
        "CTA rim",
        "Paper probe",
        "Upload as light",
        "Scan-through",
        "Where a beam is allowed",
        "The whole page",
      ],
      tracks: ["glow-specs"],
    },
  },
  // THE REVIEW WAVE (Will's rule-by-rule review of the bible, 2026-09-14):
  // seven boards registered up front by the Orchestrator so each track owns
  // only its sandbox/<id>/ directory. `variants` holds a placeholder until the
  // track hands off and the Orchestrator renames them at integration.
  // RULED AND RETIRED (round eight, 2026-09-17). The board's twelve cards, its
  // registers and its paste are gone from sandbox/; git keeps them and
  // docs/design/rulings.md keeps Will's words. The ruling itself is now a
  // stylesheet, which is what `lives` points at.
  {
    id: "palette",
    title: "The palette",
    surface: "shared",
    ruled: "2026-09-17",
    shipped: "Graphite",
    why: "Graphite: one room at 0.105, a page at 0.995 and Apple's cool greys between them; no accent, an opaque dark card, and --faint as the third text step.",
    lives: [
      "docs/systems/design-system.md#the-identity-achromatic-media-is-the-color",
      "src/app/globals.css",
      "src/app/theme.css",
      "src/app/(marketing)/marketing.css",
    ],
  },
  {
    id: "light",
    title: "Light, shadow and lamp",
    surface: "shared",
    ruled: "in part (2026-09-17): the Aurora in three forms, off paper, on an 8 second clock, placed as a mix composed per section; the bloom, the halo (behind objects only) and the beam kept; three steps open",
    shipped: null,
    why: "Bible 10 rewritten and 11 retiring: depth in dark is light first with shadows where objects stack; a lamp may light a section without media; the aurora as identity.",
    lives: [
      "docs/systems/design-system.md#light-spill-beam-and-the-lamp-set",
      "docs/systems/design-system.md#elevation-contract-one-depth-technique-per-mode",
      "src/components/shared/glow.tsx",
    ],
    board: {
      note: "Round eight, the three steps still open: shadows in dark mode on one scene with a legend, the thin bright edge enlarged, and the streak of light that plays once",
      variants: ["Depth", "Face", "Sweep"],
    },
  },
  {
    id: "type-scale",
    title: "The type scale",
    surface: "shared",
    ruled: "2026-09-17",
    shipped: "B, rungs",
    why: "B, rungs: nine named steps on one rung set, each with its own leading and tracking; marketing travels four rungs between 375 and 1440, the app one, the card step none.",
    lives: [
      "docs/systems/design-system.md#type-the-heading-face-the-ladder",
      "src/app/theme.css",
      "src/app/(dev)/design/(shell)/library/foundations/page.tsx#ladder",
      "src/components/marketing/system/page-hero.tsx",
      "src/components/marketing/system/section-shell.tsx",
      "src/components/shared/page-heading.tsx",
    ],
  },
  {
    id: "floating-surfaces",
    title: "Floating surfaces",
    surface: "shared",
    ruled: "open (the revamp's catalog, 2026-09-16)",
    shipped: null,
    why: "Bible 15 under exploration: every floating primitive on every ground, today beside two candidate treatments of radius, entrance and light or shadow in dark.",
    lives: [
      "docs/systems/design-system.md#the-floating-layer-contract",
      "src/components/ui/",
    ],
    board: {
      note: "Seven directions as cards, each the event menu at 328 wide on the app's dark over the album with the Ground switch moving all seven; the host's desk under two directions at once; four questions (the submenu, the radius, the entrance, the light)",
      variants: [
        "Today",
        "Card",
        "Glass",
        "Command",
        "Compact",
        "Paper",
        "Lift",
      ],
    },
  },
  {
    id: "brand-voice",
    title: "The brand voice",
    surface: "marketing",
    ruled: "open (the revamp's catalog, 2026-09-16)",
    shipped: null,
    why: "Bible 20 under exploration, 21 open: the voice as a guide with do's, three registers and examples per surface; sample lines beside today's on real section shells.",
    lives: [
      "docs/specs/brand-voice.md",
      "src/lib/constants/marketing-voice.ts",
    ],
    board: {
      note: "Round seven: six voices as cards, each writing the same three lines of the home page's first screen at the size a phone draws them, decided by one pick or none; the real home page under the card being pressed; the noun, the link preview, the numbers and how far the winner reaches as steps of their own, every answer drawn at once",
      variants: ["Today", "Keepsake", "Live", "Plain", "Everyone", "Aside"],
    },
  },
  {
    id: "media-kit",
    title: "The media kit",
    surface: "marketing",
    ruled: "open (the revamp's catalog, 2026-09-16)",
    shipped: null,
    why: "Bible 18 written down: no stock at launch, every frame ours or under a license we can name; the sources surveyed, the kit planned, a candidate first batch staged.",
    lives: [
      "docs/specs/media-kit.md",
      "src/lib/constants/marketing-media.ts",
      "docs/ASSETS.md",
    ],
    board: {
      note: "Thirteen real catalogues as cards, ranked by whether they hold a release, each with its clause, its price and a contact sheet at the real card size, ship above the line and kill below; four questions about the thirteen (the rule, the spend, the crowds, the shoot)",
      variants: [
        "Unsplash+",
        "iStock",
        "Stocksy",
        "Adobe Stock",
        "Artgrid",
        "Web Summit",
        "Flickr CC",
      ],
    },
  },
  {
    id: "rounding",
    title: "The rounding",
    surface: "shared",
    ruled: "open (the revamp's catalog, 2026-09-16)",
    shipped: null,
    why: "Bible 8 under exploration: the radius values on the tuner, the sharp-surface / round-action contrast at candidate values for every radius token; the sitting surface.",
    lives: [
      "docs/systems/design-system.md#rounding-sharp-surfaces-round-actions",
      "src/app/globals.css",
      "src/components/dev/motion-tuner-config.ts",
    ],
    board: {
      note: "Six families as cards, each the card, the menu, the photograph and the button at true size plus a 375 frame; two families on the same real page scroll-locked; four questions (the button rung, the derived ladder, the dead rungs, the album's gap)",
      variants: [
        "A, today",
        "B, square",
        "C, soft",
        "D, one family",
        "E, print",
        "F, half a step",
      ],
    },
  },
  {
    id: "album-hero",
    title: "The album page's hero",
    surface: "marketing",
    ruled:
      "open (Will, 2026-09-15: the burst's field, killed as the home hero, becomes the live album's hero; his six notes of 2026-09-17 sent it back for a custom, calm round three)",
    shipped: null,
    why: "Round three answers his notes: a lockup composed for this page as one block, four calm compositions on one engine, the live album centred under each.",
    lives: [
      "src/app/(marketing)/(cinema)/features/album/page.tsx",
      "src/lib/constants/feature-pages.ts",
    ],
    board: {
      note: "Four calm compositions of the album page's hero on one engine (the orbit, the field calmed, the shelf, the arrival), the lockup composed for this page as one block with no gap, the live album centred under each on a 720 / 880 / 1040 step, and the whole shipped route under the pick; the board picks the orbit",
      variants: ["The orbit", "The field, calmed", "The shelf", "The arrival"],
    },
  },
  {
    id: "river-visual",
    title: "The river, a feature visual",
    surface: "marketing",
    ruled:
      "open (Will, 2026-09-15: the river, killed as a hero, streamlined to one flow and kept in the bank)",
    shipped: null,
    why: "The river as a section-scale feature visual: one stream dropping out of the code, at three sizes on cinema and paper, banked with its placements, props and cost.",
    lives: [
      "src/components/marketing/system/section-shell.tsx",
      "src/lib/constants/feature-pages.ts",
    ],
    board: {
      note: "The river as one stream out of one printed object, every number derived from the box so a 560 column, a 400 card and a 240 thumbnail are one visual at three scales, three origins on one dock switch, three placements composed on production shells, banked with its props and its cost",
      variants: [
        "560, the column",
        "400, the card",
        "240, the thumbnail",
        "The placements",
      ],
    },
  },
];

/** The standing boards, in registry order: the sidebar's Sandbox zone. */
export const SANDBOX: Ruling[] = RULINGS.filter((r) => r.board !== undefined);

export function getRuling(id: string): Ruling | undefined {
  return RULINGS.find((r) => r.id === id);
}
