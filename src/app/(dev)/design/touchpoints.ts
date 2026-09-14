/**
 * THE RULINGS REGISTRY of the design lab (thinned in the library round, 2026-09-02).
 *
 * One entry per ruling the lab has taken: what shipped, why in one line, and
 * where the rule lives now. The long record (the ruling verbatim, the round's
 * context, the board's files and last SHA) is docs/decisions/design-record.md,
 * anchored by these ids and rendered at /design/record. The rules a reader must
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
  | "marketing-decomposition"
  | "marketing-hero-substrate"
  | "home-hero"
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
    ruled: "open",
    shipped: null,
    why: "Open: one-shot play (V1) versus scroll-driven (V2) for the home's signature decomposition; the extras ride the ruling.",
    lives: ["docs/systems/marketing-content.md", "docs/ROADMAP.md"],
    board: {
      note: "The home's signature move, two ways: the hero's reel comes apart into its source tiles while three counters land as facts, played once on scroll or scrubbed by it, plus the tactile photo-pile and card-stack candidates and the mono confetti proposal",
      variants: [
        "One-shot play",
        "Scroll-driven",
        "Photo-pile drag (extra)",
        "Card-stack hover (extra)",
        "Confetti proposal (extra)",
      ],
    },
  },
  {
    id: "marketing-hero-substrate",
    title: "Marketing hero substrate",
    surface: "marketing",
    ruled: "open",
    shipped: null,
    why: "Open: the kinetic H1's word animation (Roll, Type, or Cut) judged against moving footage.",
    lives: ["docs/systems/marketing-content.md", "docs/ROADMAP.md"],
    board: {
      note: "The production hero decided against real footage: an mp4 substrate slot with poster-first loading and montage fallback, story progress and timecode synced to the video, and the kinetic H1 word toggling Roll, Type, or Cut across all three voice groupings",
      variants: ["Roll on footage", "Type on footage", "Cut on footage"],
    },
  },
  {
    id: "home-hero",
    title: "The home hero",
    surface: "marketing",
    ruled:
      "open (round two ruled 2026-09-14: the source; round three varies it)",
    shipped: null,
    why: "The source won round two (a stranger should think 'if I scan this, I get all of these'); round three varies it three ways beside the source.",
    lives: [
      "docs/systems/marketing-content.md",
      "src/components/marketing/sections/home/cinema-hero.tsx",
    ],
    board: {
      note: "Round three: the source as the reference, then three variations of the same causality: the scan makes the cause literal, the burst takes the origin into every direction, the river runs the album down out of the code into the page; each proposes its supporting elements and copy",
      variants: ["The source (ruled)", "The scan", "The burst", "The river"],
      tracks: ["hero-scan", "hero-burst", "hero-river"],
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
    ruled: "ADR-0023",
    shipped: "V1 Marquee in the feed",
    why: "Marquee in the feed (ADR-0023): the poster card is the feed section, deeper editing graduates to a Reel Studio, the reel is born by Create.",
    lives: [
      "docs/adr/0023-qa-round-product-rulings.md",
      "docs/systems/host-app.md",
    ],
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
      note: "Today's ramp beside three candidate ramps on real sections, on cinema, paper and ink, at both widths; the accent as a hue on the brand call sites; the panel as one token",
      variants: ["Placeholder"],
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
      note: "Depth in dark on stacked cards, a layer over content and a flat card; lamps without media on cinema and paper; the cadence at 8s and 11s; the publish beat's violet; the lit surface",
      variants: ["Placeholder"],
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
      note: "Eleven stages driving the production components through three custom properties, so picking a ladder re-lays the real home arc, a feature page, help, about, the dashboard, an event page and admin",
      variants: ["Today", "A tuned", "B rungs", "C registers"],
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
      note: "Dialog, drawer, dropdown, popover, select, sheet, toast, tooltip and the nav viewport on cinema, paper and ink; the phone canvas primary for sheets and dialogs",
      variants: ["Placeholder"],
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
      note: "Three candidate voices on the real PageHero and SectionShell across cinema, paper and the app ground; the seven provisional home headers rewritten in each beside today's line; the unfurl both ways",
      variants: ["A the house", "B the room", "C the guest list"],
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
      note: "Three routes swapping in place on the same twelve positions with the provenance line under each, the vertical gap on the blog's cover pool, the sources with their clauses, and the blog plate at production geometry",
      variants: ["Licensed", "Ours", "Mix", "In place"],
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
      note: "One kit of every radius-bearing surface in four columns: three fixed candidates and a live column that follows the tuner, on the app's grounds and cinema",
      variants: [
        "Today",
        "B, soft surfaces",
        "C, the 16px column",
        "Live, the tuner",
      ],
    },
  },
];

/** The standing boards, in registry order: the sidebar's Sandbox zone. */
export const SANDBOX: Ruling[] = RULINGS.filter((r) => r.board !== undefined);

export function getRuling(id: string): Ruling | undefined {
  return RULINGS.find((r) => r.id === id);
}
