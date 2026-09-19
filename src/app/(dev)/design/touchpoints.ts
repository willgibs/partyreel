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
export type Surface = "guest" | "host" | "marketing" | "shared" | "admin";

/** Surface display labels: the ONE home (the sidebar, the record page and the
 *  touchpoint header all import this, never redefine it). */
export const SURFACE_LABEL: Record<Surface, string> = {
  guest: "Guest",
  host: "Host",
  marketing: "Marketing",
  shared: "Shared",
  // The ops portal became its own deployment on 2026-09-18 (admin-split), so it is
  // a surface of its own here too rather than "shared" machinery.
  admin: "Admin",
};

export type RulingId =
  | "first-event"
  | "press-page"
  | "contact-page"
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
  | "app-vocabulary"
  | "guest-shape"
  | "album-motion"
  | "app-shape"
  | "cursor-backdrop"
  | "image-trail"
  | "admin"
  | "loose-ends"
  | "glass"
  | "body-type"
  | "voice"
  | "privacy-hero"
  | "album-page"
  | "river-card"
  | "gallery-width"
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
  | "rounding"
  | "type-phone";

/** The boards standing in sandbox/ (each has `board` set below). */
export type SandboxId =
  | "first-event"
  | "press-page"
  | "contact-page"
  | "app-vocabulary"
  | "guest-shape"
  | "album-motion"
  | "admin"
  | "loose-ends"
  | "glass"
  | "body-type"
  | "voice"
  | "privacy-hero"
  | "app-shape";

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
    ruled:
      "2026-08-28 and 08-31, the lit surface 2026-09-17; the board retired 2026-09-18",
    shipped:
      "the spill engine (glow.tsx), the bright edge ([data-lit]) with light-wiring, the Aurora with aurora-wiring",
    why: "Retired with nothing open: SPILL is light from a lit thing, BEAM a live subject lit at its edge; the engine, the bright edge and the Aurora all ship.",
    lives: [
      "docs/systems/design-system.md#light-spill-beam-and-the-lamp-set",
      "src/components/shared/glow.tsx",
      "src/app/globals.css",
    ],
  },
  {
    id: "glow-moments",
    title: "Spill placements",
    surface: "shared",
    ruled:
      "2026-08-31, the publish beat 2026-09-17; the board retired 2026-09-18",
    shipped:
      "the placements with light-wiring, the publish beat in the house five with publish-bloom",
    why: "Retired with nothing open: the placements ship, the QR plate takes our own light, the upload takes none, and the publish beat wears the house five.",
    lives: ["docs/systems/design-system.md#the-shipped-light"],
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
  // RULED AND RETIRED (round eight, 2026-09-17). Will answered every step the
  // board still asked (both shadows, the bright edge kept and polished, the
  // streak of light banked for a delight moment), so its scenes and its paste
  // left sandbox/; git keeps them and docs/design/rulings.md keeps his words.
  // The ruling is two tokens, one attribute and two Library sections now, which
  // is what `lives` points at.
  {
    id: "light",
    title: "Light, shadow and lamp",
    surface: "shared",
    ruled: "2026-09-17",
    shipped: "Both shadows by role, the bright edge, the Aurora",
    why: "Step and ring everywhere, a small shadow only on a real overlap, a larger one under a layer; the bright edge on three kinds of surface; the Aurora, never on paper.",
    lives: [
      "docs/systems/design-system.md#light-spill-beam-and-the-lamp-set",
      "docs/systems/design-system.md#elevation-contract-four-heights-one-job-each",
      "src/app/globals.css",
      "src/app/theme.css",
      "src/lib/elevation-policy.test.ts",
      "src/components/shared/lit-edge-contract.test.ts",
      "src/app/(dev)/design/(shell)/library/foundations/page.tsx#elevation",
      "src/app/(dev)/design/(shell)/library/foundations/page.tsx#bright-edge",
      "src/components/marketing/system/section-light.tsx",
      "src/components/shared/glow.tsx",
    ],
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
    ruled: "2026-09-17",
    shipped: "Card's anatomy, the nested corner, entrances by frequency",
    why: "Bible 15 as a module: one corner derived from --radius-float, one entrance language per kind with the clock set by frequency, one light, and no glass anywhere.",
    lives: [
      "docs/systems/design-system.md#the-floating-layer-contract",
      "src/components/ui/floating-layer.ts",
      "src/components/ui/floating-layer.test.ts",
      "src/components/ui/dropdown-menu.tsx",
      "src/components/ui/select.tsx",
    ],
  },
  {
    id: "brand-voice",
    title: "The brand voice",
    surface: "marketing",
    ruled:
      "2026-09-17, retired UNRULED at round seven: Will killed it because six voices had been deepened through rounds nobody reviewed (the ledger was never once written), and asked for the voice to be rebuilt from won lines, one real line at a time, on the `voice` board",
    shipped:
      "the three calls a voice never decided: album as the one noun a guest reads, the link preview as one invitation, the bigger counts on one line",
    why: "Retired unruled: the six were forced apart by a contract that made agreement owe an excuse; only its three non-voice answers shipped.",
    lives: ["src/lib/constants/marketing-voice.ts", "docs/design/rulings.md"],
  },
  {
    id: "media-kit",
    title: "The media kit",
    surface: "marketing",
    ruled:
      "2026-09-17, killed at round seven: Will chose generated frames over stock or a shoot, made in one Higgsfield month once the site is shaped, and ruled that no agent tracks an image's rights",
    shipped:
      "the credit field gone from the marketing stills and their type, so no generated frame can carry one",
    why: "Killed: stock was the wrong supply and the shoot is off; every frame will be generated for its slot, in one look, from a brief written when the track starts.",
    lives: [
      "docs/design/rulings.md",
      "src/lib/constants/marketing-media.ts",
      "docs/ASSETS.md",
      "docs/specs/media-kit.md",
    ],
  },
  // RULED AND RETIRED (round one, 2026-09-18). Will answered with the fix
  // the board never offered (the ladder, not the page) and `clamped` for the
  // trim; the board left sandbox/ and docs/design/rulings.md keeps his words.
  {
    id: "type-phone",
    title: "Type at a phone",
    surface: "shared",
    ruled: "2026-09-18",
    shipped:
      "The order at a phone, the subhead step, every heading on the ladder, the clamped trim",
    why: "The law is the order: prose rises to keep each heading above the one it heads at 375, subhead names the sub-head pair, and no heading is set off the ladder.",
    lives: [
      "docs/systems/design-system.md#type-the-heading-face-the-ladder",
      "src/app/theme.css",
      "src/lib/type-ladder-policy.test.ts",
      "src/components/marketing/system/page-hero.tsx",
      "src/app/(dev)/design/(shell)/library/foundations/page.tsx#ladder",
    ],
  },
  // RULED AND RETIRED (round seven, 2026-09-18). Will answered every step
  // (family C, today's actions, quarters, the dead rungs dropped, the gap
  // pinned); the board left sandbox/ and docs/design/rulings.md keeps his words.
  {
    id: "rounding",
    title: "The rounding",
    surface: "shared",
    ruled: "2026-09-18",
    shipped:
      "C, soft: an 8px surface, a 12px floating layer, a 4px photograph with the gap pinned to it, the steps in quarters, the 44px cta",
    why: "Family C in quarters: one token per layer, a control still twice as round as the surface under it, the gallery gap following the photograph's corner.",
    lives: [
      "docs/systems/design-system.md#rounding-sharp-surfaces-round-actions",
      "src/app/globals.css",
      "src/app/theme.css",
      "src/components/ui/button.tsx",
      "src/app/(dev)/design/(shell)/library/foundations/page.tsx#radius",
    ],
  },
  // RULED AND RETIRED (round three, 2026-09-18). Will answered `none` on the
  // composition and the rest in full; the field it drew became the privacy
  // hero's, and the three answers that were about THIS page shipped with the
  // album page's own round. The board left sandbox/ with the wiring;
  // docs/design/rulings.md keeps his words.
  {
    id: "album-hero",
    title: "The album page's hero",
    surface: "marketing",
    ruled: "2026-09-18",
    shipped:
      "No composition of its own: the album at the scale's 896 step with its foot faded, the title step for the headline, the page's own copy, and the settled composition with no script",
    why: "The album under the words IS the hero's visual, so the words take the title step and compete with nothing; the calm caps that made four compositions boring left with it.",
    lives: [
      "src/components/marketing/sections/features/album/arrivals-hero.tsx",
      "src/components/marketing/sections/features/album/live-album-stage.tsx",
      "src/components/marketing/system/page-hero.tsx",
      "src/lib/constants/feature-pages.ts",
    ],
  },
  // RULED AND RETIRED (round two, 2026-09-18, wired 2026-09-19). Its home is a
  // CARD, not a section: the flow pours out of the real scannable code in the
  // QR feature door, and the ghost of it stands on the guest album's empty
  // state. The board left sandbox/ with the wiring; rulings.md keeps his words.
  {
    id: "river-visual",
    title: "The river, a feature visual",
    surface: "marketing",
    ruled: "2026-09-18 (round two)",
    shipped:
      "The river in a card's picture slot, born from the real scannable code, and ghosted on the guest album's empty state",
    why: "The river's home is a card, not a section: one flow out of the object it is born from, at full luminance everywhere but the empty album, where the PLACEMENT fades it.",
    lives: [
      "src/components/shared/river/river.tsx",
      "src/components/shared/river/river-engine.ts",
      "src/components/shared/river/qr-plate.tsx",
      "src/components/guest/gallery-empty-state.tsx",
      "src/components/marketing/sections/features/shared/feature-door.tsx",
      "src/app/(dev)/design/(shell)/library/components/gallery-demos.tsx#river",
    ],
  },
  {
    id: "first-event",
    title: "A host's first event",
    surface: "host",
    ruled:
      'open (Will, 2026-09-19: the host app is unprotected, "absolutely everything is up for relitigation or reconcepting from the ground up")',
    shipped: null,
    why: "The moment a host gets once: a style picked against a link that 404s, a refusal that inserts the row first, no paper anywhere in the product, and no live signal.",
    lives: [
      "src/components/app/create-event-wizard.tsx",
      "src/components/app/event-qr.tsx",
      "src/components/app/qr-preset-picker.tsx",
      "src/components/app/event-share-dialog.tsx",
      "src/components/app/event-uploads.tsx",
      "src/app/(app)/dashboard/new/page.tsx",
    ],
    board: {
      note: "Eight decisions in three beats, every option drawn on the real create card, QR picker, code plates and event page with fixtures at 1440 and 375, every code's module edge measured in the frame: what creating asks for, where the code's style is chosen, what a Free host at their one event meets, how the code reaches a table, where a new host lands, what she holds out at the door, what the page says before the first photograph, and what marks it when it comes",
      variants: [
        "What creating asks",
        "The code's style",
        "The Free host's second",
        "Out of the screen",
        "Where she lands",
        "In a hand",
        "The empty event",
        "The first photograph",
      ],
    },
  },
  {
    id: "press-page",
    title: "What Partyreel hands the world",
    surface: "marketing",
    ruled:
      'open (Will, 2026-09-19, "stack the lab": /press is unprotected, "absolutely everything is up for relitigation or reconcepting from the ground up")',
    shipped: null,
    why: "Seven decisions on the real page pieces: who it is for, the sheet, the words, the facts, whether anyone is named, the close, and the reading order.",
    lives: [
      "src/app/(marketing)/(cinema)/press/page.tsx",
      "src/components/marketing/press/press-section.tsx",
      "src/components/marketing/press/press-sheet.tsx",
      "src/lib/constants/press.ts",
    ],
    board: {
      note: "Seven decisions, every option drawn on the real PageHero, PressSection, PressSheet and copy buttons at 1440 and 375: who the page is for, what the asset sheet shows, how the words are handed over, how checkable the fact sheet is, whether anyone is named, how the page closes, and how it all reads top to bottom",
      variants: [
        "Who the page is for",
        "What the sheet shows",
        "How the words hand over",
        "How checkable the facts are",
        "Whether anyone is named",
        "How the page closes",
        "How the page reads",
      ],
    },
  },
  {
    id: "contact-page",
    title: "Reaching a person",
    surface: "marketing",
    ruled:
      "open (Will, 2026-09-19: stack the lab while deployments are capped, /contact cut from his read-only map)",
    shipped: null,
    why: "Six decisions on the real desk: the way in, the receipt, an urgent path, the topic picker, the page's rhythm, and what stands beside it.",
    lives: [
      "docs/systems/marketing-content.md",
      "src/app/(marketing)/(paper)/contact/page.tsx",
      "src/app/(marketing)/(paper)/contact/contact-form.tsx",
      "src/app/(marketing)/(paper)/contact/actions.ts",
      "src/lib/constants/contact.ts",
    ],
    board: {
      note: "Six decisions on the real desk (PageHero, ContactForm, ContactFacts, the self-serve directory), drawn on a host mid-event, a planner weighing a plan and a reporter on background: the way in, the receipt, an urgent path, the topic picker, the page's identity against the rest of the site, and what stands beside the form",
      variants: [
        "The way in",
        "The receipt",
        "Something urgent",
        "The topic picker",
        "The page's identity",
        "Beside the form",
      ],
    },
  },
  {
    id: "album-motion",
    title: "The album's falling-in",
    surface: "marketing",
    ruled:
      'open (Will, 2026-09-19, asked what improving the falling-in means: "I love the images falling into the album. I was just curious to see maybe two to three variations of this concept to get an idea of what the best version is.")',
    shipped: null,
    why: "One decision: which way a photograph reaches the album, drawn on the wired hero so the pick is already built.",
    lives: [
      "src/components/shared/album-stream/stream-engine.ts",
      "src/components/marketing/sections/features/album/arrivals-hero.tsx",
    ],
    board: {
      note: "One decision, three whole variations of the falling-in drawn on the LIVE /features/album hero at 1440 and 375 (the shipped one among them): a pair sliding under the album's edge, a pair born large and dissolving into it, and singles landing on it; every number under a tile measured off the engine against the home hero's",
      variants: ["Glide", "Gather", "Cascade"],
    },
  },
  {
    id: "app-shape",
    title: "The host app's shape",
    surface: "host",
    ruled:
      "open (Will, 2026-09-19: the app and the guest pages are unprotected, to be reconceived from the foundation)",
    shipped: null,
    why: "The host app's shape asked from the foundation: what the home is, what an event's page is, and where navigation, sharing, settings and money live.",
    lives: [
      "docs/systems/host-app.md",
      "src/components/shared/app-shell.tsx",
      "src/app/(app)/dashboard/page.tsx",
      "src/app/(app)/dashboard/[eventId]/page.tsx",
    ],
    board: {
      note: "Eight decisions on one host's Saturday night, every option drawn on the shipped components with fixtures at 1440 and again at 375: the home, how an event draws on it, the event as a place, how seven routes are reached, where sharing lives, where settings live, where the plan and your own photographs live, and the shape in a hand",
      variants: [
        "The host's home",
        "The event as a place",
        "Moving around",
        "In a hand",
      ],
    },
  },
  {
    id: "app-vocabulary",
    title: "The app's shared vocabulary",
    surface: "shared",
    ruled:
      'open (Will, 2026-09-19: the host app and the guest pages are unprotected, "a better system from its foundation")',
    shipped: null,
    why: "The parts under both shapes, drawn once: five empty states, loading on two routes, four tile grammars, two bulk toolbars, a tile-size control, and the confirm switch.",
    lives: [
      "docs/systems/host-app.md",
      "docs/systems/guest-flow.md",
      "src/components/shared/empty-state.tsx",
      "src/components/app/host-media-grid.tsx",
      "src/components/app/recently-deleted-grid.tsx",
      "src/components/app/event-feed/review-actions.tsx",
      "src/components/app/event-feed/gallery-actions.tsx",
      "src/components/shared/masonry.tsx",
      "src/components/app/event-settings/uploads-section.tsx",
    ],
    board: {
      note: "Seven decisions, no page: how many treatments answer nothing-here-yet, whether a route's loading skeleton is a shared primitive or none, one tile grammar for the host grid, the bin, the review queue and the personal feeds, words or icons on the bulk toolbar, where the gallery's tile-size control lives and how it persists, and the visual cue on a switch that asks before it flips; every option on the real components at 1440 and 375",
      variants: [
        "Nothing here yet",
        "Loading",
        "One tile, one grammar",
        "The bulk toolbar",
        "The gallery's controls",
        "How the choice persists",
        "The confirm switch",
      ],
    },
  },
  {
    id: "guest-shape",
    title: "The guest experience's shape",
    surface: "guest",
    ruled:
      "open (Will, 2026-09-19: the app and the guest pages are unprotected, to be reconceived from the foundation)",
    shipped: null,
    why: "Round one asks the shape from the scan: the door, an album with nothing in it, the chrome over a wide album, the other surfaces, a guest's own photograph.",
    lives: [
      "docs/systems/guest-flow.md",
      "src/app/(guest)/e/[token]/page.tsx",
      "src/components/guest/event-experience.tsx",
      "src/components/guest/entry-shell.tsx",
      "src/components/guest/gallery-empty-state.tsx",
    ],
    board: {
      note: "Seven decisions on the real guest components over one wedding in its four access states, phone first at 375 and also at 1440: the door, one language for nothing-here-yet, the chrome over an album that runs to the window, whether the album admits it is filling, one object for the other four surfaces, what a guest can do about their own photograph, and how many voices ask for an account",
      variants: [
        "The door",
        "Nothing here yet",
        "The album's chrome",
        "The other surfaces",
      ],
    },
  },
  // RULED AND RETIRED (round one, 2026-09-18). Will answered every step
  // (full-quality, the plate, the band with its rail, the slide, the rhythm as
  // a soft ruling, the phone at four or five scroll steps) and added the
  // architectural ruling that outranks this instance: a full-image section is a
  // way to CROSS a chapter cut, used sometimes and never at every one. The
  // board left sandbox/ with the wiring; docs/design/rulings.md keeps his words.
  {
    id: "cursor-backdrop",
    title: "Cursor backdrop",
    surface: "marketing",
    ruled: "2026-09-18",
    shipped:
      "The photograph section: full-quality on a switching full-bleed pool, the glass plate, the band with the rail at its foot, the slide, and four or five steps at a phone",
    why: "A full-image section carries a chapter cut, so the page turns through a picture instead of over a hairline, and the photograph is indexed by where the reader is.",
    lives: [
      "docs/systems/design-system.md#chapters-the-attention-arc",
      "src/components/shared/backdrop/photo-section.tsx",
      "src/components/shared/backdrop/backdrop-engine.ts",
      "src/components/shared/backdrop/room-frames.ts",
      "src/components/marketing/sections/home/full-quality.tsx",
      "src/components/marketing/sections/home/section-ids.ts",
      "src/app/(dev)/design/(shell)/library/components/gallery-demos.tsx#photo-section",
    ],
  },
  // RULED AND RETIRED (round one, 2026-09-19). Will answered all six steps
  // (d140, the long decay at his own three seconds, the flick, 180 px, the 404
  // as its home, and a phone that walks rather than waits for a finger) and left
  // one open note the wiring answered: the walk must not trace the same figure
  // every visit. The engine left sandbox/ for src/components/shared/trail/ with
  // the board; docs/design/rulings.md keeps his words.
  {
    id: "image-trail",
    title: "The image trail",
    surface: "marketing",
    ruled: "2026-09-19",
    shipped:
      "The trail on the root 404: 140 px between photographs, three seconds to go, thrown the way the hand went, 180 px and 100 at a phone, walking its own figure until a hand arrives",
    why: "A page nobody plans to see is the classic home for a rare delight, and the trail is the site's own photographs arriving where the one that was asked for is missing.",
    lives: [
      "src/components/shared/trail/trail-engine.ts",
      "src/components/shared/trail/trail.tsx",
      "src/components/shared/trail/trail-frames.ts",
      "src/app/not-found.tsx",
      "src/app/(dev)/design/(shell)/library/components/gallery-demos.tsx#trail",
    ],
  },
  {
    id: "privacy-hero",
    title: "The privacy page's hero",
    surface: "marketing",
    ruled:
      'open (Will, 2026-09-19: the spiral/orbit arrival didn\'t land, "totally different concept... more fitting for its theme"; round three draws three new, still concepts instead)',
    shipped: null,
    why: "Three still concepts (a breathing aperture, a turn-taking grid, sealed cards) built on what privacy means, not a figure in flight: one decision, drawn at 1440 and 375.",
    lives: [
      "src/app/(marketing)/(cinema)/features/privacy/page.tsx",
      "src/components/marketing/system/page-hero.tsx",
    ],
    board: {
      note: "Four decisions, no page: the spirals' pace against the home hero's, the gap between frames, the trail each arm leaves, and what a phone draws; every option is the live privacy page's first screen at 1440 and 375",
      variants: ["The pace", "The gap", "The trail", "At a phone"],
      tracks: ["heroes"],
    },
  },
  // RULED AND RETIRED (round one, 2026-09-19). Will answered every step and
  // added the note that shaped the page's foot: the floor light needs a full
  // image section beneath it rather than paper. The board left sandbox/ with
  // the wiring; the motion's remaining question became `album-motion`.
  {
    id: "album-page",
    title: "The album page's hero, round four",
    surface: "marketing",
    ruled: "2026-09-19",
    shipped:
      "The live guest album under the host's own header, photographs falling into its top edge, the Glow halo behind the frame, and the Aurora on the quality section's floor over a full-image section",
    why: "The page's own sentence, drawn: the album that fills itself under the words, photographs arriving into it, lit from behind so the frame glows and they stay clean.",
    lives: [
      "src/app/(marketing)/(cinema)/features/album/page.tsx",
      "src/components/marketing/sections/features/album/arrivals-hero.tsx",
      "src/components/marketing/sections/features/album/live-album-stage.tsx",
      "src/components/marketing/sections/features/album/quality-section.tsx",
      "src/components/shared/album-stream/album-stream.tsx",
      "src/components/shared/album-stream/stream-engine.ts",
      "src/app/(dev)/design/(shell)/library/components/gallery-demos.tsx#album-stream",
    ],
  },
  // RULED AND RETIRED (round one, 2026-09-19). Will answered every step and
  // added the ruling that outranks this instance: the card's copy gradient is
  // the CARD's, "not exclusive to the QR code card, nor part of the river
  // visual design itself", so it went to every media-forward card on the site.
  // The board left sandbox/ with the wiring; rulings.md keeps his words.
  {
    id: "river-card",
    title: "The river in the QR door",
    surface: "marketing",
    ruled: "2026-09-19",
    shipped:
      "The code at a tenth of the tall door with the whole card streaming behind the copy, the card's own bottom-left gradient on every door, and /demo as what the code opens",
    why: "The QR door's picture is the album pouring out of a real scannable code, and the copy over it reads on a gradient that belongs to the card rather than to any one visual.",
    lives: [
      "docs/systems/design-system.md#the-media-forward-card",
      "src/components/marketing/sections/features/shared/feature-door.tsx",
      "src/components/marketing/sections/features/shared/related-features.tsx",
      "src/components/marketing/sections/home/event-type-card.tsx",
      "src/components/shared/river/qr-plate.tsx",
      "src/app/demo/route.ts",
    ],
  },
  {
    id: "gallery-width",
    title: "Gallery width",
    surface: "shared",
    ruled: "2026-09-19",
    shipped: "240px columns, the full window, words at the edge",
    why: "A gallery declares a column WIDTH, never a count: ~240px tiles, 5 / 6 / 8 columns at 1280 / 1512 / 1920, the album 20px from each edge, one left line.",
    lives: [
      "docs/systems/guest-flow.md",
      "docs/systems/host-app.md",
      "src/components/shared/masonry.tsx",
      "src/components/guest/guest-masonry.tsx",
      "src/components/guest/event-experience.tsx",
      "src/components/shared/app-shell.tsx",
    ],
  },
  {
    id: "loose-ends",
    title: "Six loose ends",
    surface: "shared",
    ruled:
      "open (cut 2026-09-18: six ROADMAP decisions drawn on their real surfaces)",
    shipped: null,
    why: "Six ROADMAP one-liners drawn as decisions: the admin chart ramp's cast, one FAQ look, the home hero at tablet widths, and the album's three ambient pieces.",
    lives: [
      "src/app/globals.css",
      "src/components/marketing/faq-accordion.tsx",
      "src/components/marketing/sections/home/hero-stream.ts",
      "src/components/marketing/sections/features/album/getting-in-stage.tsx",
      "src/components/marketing/sections/features/album/review-switch.tsx",
      "src/components/marketing/sections/features/album/everywhere-stage.tsx",
    ],
    board: {
      note: "Seven asks, no page: the chart ramp's cast (light and dark, chosen separately) on the real MetricsCharts; one FAQ look on both the pricing and the album page's FAQ; the home hero's geometry at a real 900 px tablet width; and the album page's three ambient pieces (the phone's screen cycle, the Live | Review photograph, the lightbox pill), each on its real section at 1440 and 375",
      variants: [
        "Chart ramp, light",
        "Chart ramp, dark",
        "One FAQ look",
        "The hero at tablet widths",
        "The phone's screen cycle",
        "The Live | Review photograph",
        "The lightbox pill",
      ],
    },
  },
  {
    id: "glass",
    title: "Glass",
    surface: "shared",
    ruled:
      'open (Will, 2026-09-17: "bank a near-term agent for a dedicated Glass exploration across marketing and app so it feels more infused to our product"; 2026-09-18: the app\'s media chrome first, both grounds asked separately)',
    shipped: null,
    why: "The system has no translucent surface and the app has faint glass nobody decided; round one makes it one material and asks which media surfaces wear it, on each ground.",
    lives: [
      "src/components/shared/media-lightbox.tsx",
      "src/components/app/host-media-grid.tsx",
      "src/components/guest/guest-reel-overlay.tsx",
      "src/components/ui/floating-layer.ts",
    ],
    board: {
      note: "Seven decisions, no page, every option a real app screen in a real viewport over real photographs at 1440 and 375: the recipe itself on the lightbox's action pill (four, named in numbers, each one's contrast and frame cost measured), one grade of glass or two, what sits behind the photograph, the chips over tiles at a phone, the reel's controls, the host's row as three panes or one, and the light ground on its own step",
      variants: [
        "The recipe",
        "The grades",
        "Behind the photograph",
        "The tiles",
        "The reel's controls",
        "The host's row",
        "On paper",
      ],
    },
  },
  {
    id: "body-type",
    title: "Body and label type",
    surface: "shared",
    ruled:
      'open (Will, 2026-09-18: "everything should be addressed in our design system type ladder" reaches body and label sizes, one question-first board first)',
    shipped: null,
    why: "The heading ladder stops at 16 and about 920 sites below it pick their own size; seven decisions set the body, caption and label steps that replace them.",
    lives: [
      "src/app/theme.css",
      "src/lib/utils.ts",
      "src/lib/type-ladder-policy.test.ts",
    ],
    board: {
      note: "Seven decisions, no page: a guest's reading copy on a real phone, the app's working body on the dashboard and the admin's table, marketing's copy fixed or fluid, the caption step and the floor under it, the label's size-and-tracking pair, the buttons, and the line-height rule; every option is a real surface at a real viewport with its size and leading measured inside the frame",
      variants: [
        "A guest's reading copy",
        "The app's working body",
        "Marketing reading copy",
        "The caption step, and the floor",
        "The label step",
        "Buttons on the ladder",
        "The line-height rule",
      ],
    },
  },
  {
    id: "voice",
    title: "The voice",
    surface: "shared",
    ruled:
      "open (Will, 2026-09-17: the brand-voice board killed unruled at round seven; the voice is rebuilt from won lines, one real comparison at a time)",
    shipped: null,
    why: "No voice is declared: eight real lines in their real places, three or four close candidates each, and the voice is written up from what his wins share.",
    lives: [
      "src/lib/constants/marketing-voice.ts",
      "src/app/(dev)/design/rules/bible.ts",
    ],
    board: {
      note: "Eight decisions, no page: bible 20's open question drawn on the guest sheet's own line, the home hero's sentence, a feature page's headline, the Pro card's line beside the Free card, a host's empty dashboard, the email ask, an empty album and an upload's toast; every candidate set in the shipped surface at 1440 or in a 375 column",
      variants: [
        "Naming an absence",
        "The home hero's sentence",
        "A feature page's headline",
        "The Pro card's line",
        "A host's first screen",
        "Asking for an email",
        "An empty album",
        "The upload's answer",
      ],
    },
  },
  {
    id: "admin",
    title: "The admin portal",
    surface: "admin",
    ruled:
      'open (Will, 2026-09-18: "the full portal could likely be rethought from the ground up... plenty of thought should go into this prior to diving straight in")',
    shipped: null,
    why: "Sixteen routes behind one dropdown, every page a column of cards, no health signal away from the jobs console; round one asks the portal's shape as seven decisions.",
    lives: [
      "docs/systems/admin-observability.md",
      "src/lib/admin/nav.ts",
      "src/components/admin/admin-shell.tsx",
      "src/app/admin/page.tsx",
    ],
    board: {
      note: "Seven decisions, no page: the operator's home on one Tuesday's fixtures, the nav for twelve surfaces, the density of a list on the support inbox and the accounts table, how far a state's colour travels on the jobs console, one grammar for three destructive acts, where the backend's health is said, and how much of the product's bar the portal keeps; every option is the real admin components at 1440 by 900, a laptop screen",
      variants: [
        "The operator's home",
        "The navigation",
        "Density and the list",
        "Colour for state",
        "Destructive actions",
        "The health strip",
        "The chrome's identity",
      ],
    },
  },
];

/** The standing boards, in registry order: the sidebar's Sandbox zone. */
export const SANDBOX: Ruling[] = RULINGS.filter((r) => r.board !== undefined);

export function getRuling(id: string): Ruling | undefined {
  return RULINGS.find((r) => r.id === id);
}
