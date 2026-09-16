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
  | "home-hero"
  | "album-hero"
  | "river-visual"
  | "glow-doctrine"
  | "glow-moments"
  | "palette"
  | "light"
  | "type-scale"
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
      "docs/systems/design-system.md#type-the-heading-face-the-tiered-scale",
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
      "docs/systems/design-system.md#the-arrival-choreography-phase-45-ratified-calm-700ms",
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
    ruled:
      "open (round two ruled 2026-09-14: the source; round three ruled 2026-09-15: the source and the scan continue, the inflow joins)",
    shipped: null,
    why: "The source won round two; round three's ruling keeps the source and the scan, kills the burst and the river as heroes (their own boards now) and adds the inflow.",
    lives: [
      "docs/systems/marketing-content.md",
      "src/components/marketing/sections/home/cinema-hero.tsx",
    ],
    board: {
      note: "Round four: the source in its emanating direction and the scan with its phone, both loved; the inflow, the album streaming into the code rather than out of it, built to answer honestly whether the truer reading presents as well",
      variants: ["The source", "The scan", "The inflow"],
      tracks: ["hero-source", "hero-scan", "hero-inflow"],
    },
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
  {
    id: "palette",
    title: "The palette",
    surface: "shared",
    ruled: "open (the review wave, 2026-09-14)",
    shipped: null,
    why: "Bible 1 under exploration: the achromatic ramp in both modes (the greys feel off), the accent's role where there is no media, the muted panel as one token.",
    lives: [
      "docs/systems/design-system.md#the-identity-achromatic-media-is-the-color",
      "src/app/globals.css",
      "src/app/theme.css",
    ],
    board: {
      note: "Two modes chosen separately: six darks beside five lights, thirty pairs from two switches in the dock, each pair one paste; the theming model first (two modes, two grounds each, and the media well that belongs to neither) with the cinema-versus-ink answer in a sentence; live production sections, the footer, the plan pair, four home chapters and the floating primitives in unscaled frames; the accent on every job",
      variants: [
        "The model",
        "The dark: today, ladder, one room, ember, slate or lift",
        "The light: today, paper, bright, warm or cool",
        "The accent by job",
        "The mat",
      ],
    },
  },
  {
    id: "light",
    title: "Light, shadow and lamp",
    surface: "shared",
    ruled: "open (the review wave, 2026-09-14)",
    shipped: null,
    why: "Bible 10 rewritten and 11 retiring: depth in dark is light first with shadows where objects stack; a lamp may light a section without media; the aurora as identity.",
    lives: [
      "docs/systems/design-system.md#light-spill-beam-and-the-lamp-set",
      "docs/systems/design-system.md#elevation-contract-one-depth-technique-per-mode",
      "src/components/shared/glow.tsx",
    ],
    board: {
      note: "The light kit: twelve treatments across three jobs on the real sections that wear them, a composer that lights any marketing section and exports its paste and its mount, the spill doctrine and the placements folded in as one identity, and the order the identity enters the site",
      variants: [
        "The kit",
        "The treatments",
        "The composer",
        "The separate job",
        "The evidence",
        "The infusion plan",
        "The paste",
      ],
    },
  },
  {
    id: "type-scale",
    title: "The type scale",
    surface: "shared",
    ruled: "open (the review wave, 2026-09-14)",
    shipped: null,
    why: "Bible 5 under exploration: the sizes are not nailed; one ladder for marketing and one for the app, on real pages at both widths, proposed as tokens.",
    lives: [
      "docs/systems/design-system.md",
      "src/components/marketing/system/page-hero.tsx",
      "src/components/marketing/system/section-shell.tsx",
    ],
    board: {
      note: "Seven real routes in frames exactly the canvas wide with the candidate injected into their own documents, so the page's own breakpoints and an evaluated clamp do the work; the marketing ladder and the app ladder chosen separately in the dock, any of the sixteen pairs one nine-step set and one paste",
      variants: [
        "Marketing: today, A tuned, B rungs or C registers",
        "App: today, A tuned, B rungs or C registers",
        "The tracking law",
        "The 404's h1",
      ],
    },
  },
  {
    id: "floating-surfaces",
    title: "Floating surfaces",
    surface: "shared",
    ruled: "open (the review wave, 2026-09-14)",
    shipped: null,
    why: "Bible 15 under exploration: every floating primitive on every ground, today beside two candidate treatments of radius, entrance and light or shadow in dark.",
    lives: [
      "docs/systems/design-system.md#the-floating-layer-contract",
      "src/components/ui/",
    ],
    board: {
      note: "Three directions for the whole floating layer rather than three knobs: card changes the anatomy, glass the material, command the model; each real working UI on the real primitives with its paste, switched from the dock across eleven surfaces at true pixels (a host's desk at 1440, the same host on a phone, the guest's entry drawer)",
      variants: ["Today", "Card", "Glass", "Command", "The rungs"],
    },
  },
  {
    id: "brand-voice",
    title: "The brand voice",
    surface: "marketing",
    ruled: "open (the review wave, 2026-09-14)",
    shipped: null,
    why: "Bible 20 under exploration, 21 open: the voice as a guide with do's, three registers and examples per surface; sample lines beside today's on real section shells.",
    lives: [
      "docs/specs/brand-voice.md",
      "src/lib/constants/marketing-voice.ts",
    ],
    board: {
      note: "Two voices and today writing sixteen real surfaces across marketing, the app and a guest's phone, every comparison showing the distinction, then priced on whole pages; thirteen chapters with the usage first, the recommendation and its measured cost",
      variants: ["Today", "A, the house", "B, the room"],
    },
  },
  {
    id: "media-kit",
    title: "The media kit",
    surface: "marketing",
    ruled: "open (the review wave, 2026-09-14)",
    shipped: null,
    why: "Bible 18 written down: no stock at launch, every frame ours or under a license we can name; the sources surveyed, the kit planned, a candidate first batch staged.",
    lives: [
      "docs/specs/media-kit.md",
      "src/lib/constants/marketing-media.ts",
      "docs/ASSETS.md",
    ],
    board: {
      note: "Where the frames actually come from: thirteen real catalogues ranked by whether they hold a release, each with its clause, its price and a contact sheet of its own thumbnails, and a plan that totals $56",
      variants: ["The sheet", "The plan", "Mix", "Ours"],
    },
  },
  {
    id: "rounding",
    title: "The rounding",
    surface: "shared",
    ruled: "open (the review wave, 2026-09-14; Orchestrator-run)",
    shipped: null,
    why: "Bible 8 under exploration: the radius values on the tuner, the sharp-surface / round-action contrast at candidate values for every radius token; the sitting surface.",
    lives: [
      "docs/systems/design-system.md#rounding-sharp-surfaces-round-actions",
      "src/app/globals.css",
      "src/components/dev/motion-tuner-config.ts",
    ],
    board: {
      note: "The site and the app loaded into a viewport of their own at true pixels and re-skinned live from the dock, under five one-word rulings: the surface family A to D, the action rung and the derived ladder against a quarter-step retune",
      variants: [
        "A, today",
        "B, square",
        "C, soft",
        "D, one family",
        "Live, the tuner",
      ],
    },
  },
  {
    id: "album-hero",
    title: "The album page's hero",
    surface: "marketing",
    ruled:
      "open (Will, 2026-09-15: the burst's field, killed as the home hero, becomes the live album's hero)",
    shipped: null,
    why: "The burst's emanating field as the /features/album hero: looped for the live feel, no code, the album product as a calm wide visual below it.",
    lives: [
      "src/app/(marketing)/(cinema)/features/album/page.tsx",
      "src/lib/constants/feature-pages.ts",
    ],
    board: {
      note: "The burst's field with its centre taken out as the album page's hero, looped for ever with the page's own shipped lockup in a quiet zone no frame enters, the real guest album composed and calm below it, and the whole shipped route under the two so the cinema-to-paper cut is judged with the hero running",
      variants: ["The hero", "The live album, wide", "The page, whole"],
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
