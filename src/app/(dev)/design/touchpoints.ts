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
  | "seed-avatar"
  | "error-pages"
  | "event-type-pages"
  | "how-it-works"
  | "site-chrome"
  | "profile-page"
  | "export-flow"
  | "admin-triage"
  | "media-viewer"
  | "emails"
  | "reel-studio"
  | "help-center"
  | "host-curation"
  | "guest-upload"
  | "first-event"
  | "pricing-page"
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
  | "event-identity"
  | "app-door"
  | "app-pricing"
  | "app-vocabulary"
  | "demo-event"
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
  | "seed-avatar"
  | "site-chrome"
  | "profile-page"
  | "export-flow"
  | "admin-triage"
  | "media-viewer"
  | "emails"
  | "reel-studio"
  | "help-center"
  | "host-curation"
  | "guest-upload"
  | "first-event"
  | "app-door"
  | "pricing-page"
  | "app-pricing"
  | "press-page"
  | "contact-page"
  | "app-vocabulary"
  | "demo-event"
  | "guest-shape"
  | "album-motion"
  | "admin"
  | "loose-ends"
  | "body-type"
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
  // RULED AND RETIRED (round one, 2026-09-19). Will answered all seven steps
  // and left a note on nearly every one: the drawings "are not nearly good
  // enough for an event page this is the proposed final page design", the
  // statement's "UI could be improved a lot", the cards "could use a ton of
  // design polish", the door's right half "could use a redesign", the ladder's
  // sizes were his own numbers, and the phone wanted the visual crossing the
  // fold. The wiring answered each on the real pages; the board left sandbox/
  // with it, and docs/design/rulings.md keeps his words.
  {
    id: "event-identity",
    title: "The event pages' visual identity",
    surface: "marketing",
    ruled: "2026-09-19",
    shipped:
      "One lit object per type carrying the demo's real scannable code, a statement section in place of the paragraph and its tag list, a photograph the page turns to paper across, the photograph as the card for all four types at both of its sizes, a door with the river pouring through it and the reel beside it, the hero subhead on a 20 to 22 clamp site-wide with the openings at 18, and a phone whose object crosses the fold",
    why: "The hub and four type pages from the ground up: what makes an event page its own, once every one of them wears the same lockup.",
    lives: [
      "docs/systems/marketing-content.md",
      "src/lib/constants/events.ts",
      "src/app/(marketing)/(cinema)/events/page.tsx",
      "src/app/(marketing)/(cinema)/events/[slug]/page.tsx",
      "src/components/marketing/sections/events/event-object.tsx",
      "src/components/marketing/sections/events/event-statement.tsx",
      "src/components/marketing/sections/events/event-turn.tsx",
      "src/components/marketing/sections/events/event-type-card.tsx",
      "src/components/marketing/sections/events/event-door.tsx",
      "src/components/marketing/system/page-hero.tsx",
    ],
  },
  {
    id: "error-pages",
    title: "Every failure page as one grammar",
    surface: "shared",
    ruled: "2026-09-19",
    shipped:
      "One primitive for every dead end and every crash, a quiet line to a person on each, the photo strip standing where the icon was, a copyable code on every crash, each surface inside its own chrome, the private lock in the family with a way home, the admin host answering as the portal, and a way home on the last-resort screen",
    why: "A dead end is the page a reader least expected and most needs a way out of, so all twelve of them say it in one grammar, in each surface's own words.",
    lives: [
      "docs/systems/lifecycle-recovery.md",
      "src/components/shared/not-found-screen.tsx",
      "src/components/shared/error-digest.tsx",
      "src/components/shared/route-error.tsx",
      "src/components/marketing/marketing-not-found.tsx",
      "src/components/marketing/marketing-route-error.tsx",
      "src/components/admin/admin-not-found-screen.tsx",
      "src/components/guest/guest-bar.tsx",
      "src/app/not-found.tsx",
      "src/app/error.tsx",
      "src/app/global-error.tsx",
    ],
  },
  // RULED AND RETIRED (round one, 2026-09-19). Will answered seven of the eight
  // steps as direct picks and turned the eighth into a fresh round: the pages
  // "were thrown up in a very fast V1... they could use a total visual identity
  // redesign", which became `event-identity` above and wired with it. Two notes
  // kept for the record and never marketing copy: kids are never a target user,
  // and planners get a partners page rather than a line in this hero. The board
  // left sandbox/ with the wiring; docs/design/rulings.md keeps his words.
  {
    id: "event-type-pages",
    title: "The event-type landing pages",
    surface: "marketing",
    ruled: "2026-09-19",
    shipped:
      "One template for four types, the host alone greeted, every page on the shared PageHero lockup, the hub's 2x2 directory kept with its tilt, the FAQ-to-close gap halved at a phone, and the demo door in place of the reel band as the proof on all five pages",
    why: "Four umbrella landing pages carry the site's search equity, and a reader who arrives on one from search has to meet the same product the home page sells.",
    lives: [
      "docs/systems/marketing-content.md",
      "src/lib/constants/events.ts",
      "src/app/(marketing)/(cinema)/events/page.tsx",
      "src/app/(marketing)/(cinema)/events/[slug]/page.tsx",
      "src/components/marketing/sections/events/type-directory.tsx",
      "src/components/marketing/sections/home/events-teaser.tsx",
    ],
  },
  // RULED AND RETIRED (round one, 2026-09-19). Will answered seven of the
  // eight steps and dissolved the eighth: `phone` asked what should change
  // about the page in a guest's hand and he could not read the question ("I'm
  // not sure what's being asked here. How is this 'in a guest's hand?'"). Its
  // three options only rewrapped host-facing pieces, and the rebuild answers it
  // by construction instead: the guest half of the walkthrough IS a phone, six
  // screens of one, so there is no bezel left to add to a video. His toggle ask
  // arrived with `shape` and became the page's spine. The board left sandbox/
  // with the wiring; docs/design/rulings.md keeps his words.
  {
    id: "how-it-works",
    title: "The page that tells the loop",
    surface: "marketing",
    ruled: "2026-09-19",
    shipped:
      "One scroll of six steps with a Host/Guest toggle above them and a step set per side, twelve bespoke pictures (the host's on a desk, the guest's in a phone), the demo as a finished album rather than a second reel, one folded close, and the same six steps as a numbered stepper on the home",
    why: "The page a first-time host reads to understand the whole loop, and the one surface where both sides of it can be shown from one set of six moments.",
    lives: [
      "docs/systems/marketing-content.md",
      "src/lib/constants/how-it-works.ts",
      "src/app/(marketing)/(cinema)/how-it-works/page.tsx",
      "src/components/marketing/sections/how-it-works/spine.tsx",
      "src/components/marketing/sections/how-it-works/host-pictures.tsx",
      "src/components/marketing/sections/how-it-works/guest-pictures.tsx",
      "src/components/marketing/sections/how-it-works/demo-door.tsx",
      "src/components/marketing/sections/shared/how-it-works-stepper.tsx",
      "content/help/how-partyreel-works.mdx",
    ],
  },
  {
    id: "site-chrome",
    title: "The marketing site's chrome",
    surface: "marketing",
    ruled:
      "2026-09-19: seven of eight decisions ruled and landed on the real chrome by chrome-wiring (the bar hides going down and returns coming up, a Dashboard hint for a signed-in host, Start free always with the demo beside it when one is set, both nav doors to /how-it-works; the shape, the holds and the phone's menu kept as they were). The eighth, the foot's job, stays open for round two: the footer alone, against a real closing CTA, his ask by name",
    shipped: null,
    why: "Round two re-asks the footer's register after a real closing CTA, and whether a page with none deserves the same; the other seven are ruled and shipped by chrome-wiring.",
    lives: [
      "docs/systems/marketing-content.md",
      "src/components/marketing/chrome/marketing-header.tsx",
      "src/components/marketing/chrome/header-shell.tsx",
      "src/components/marketing/chrome/mega-panel.tsx",
      "src/components/marketing/chrome/mobile-menu.tsx",
      "src/components/marketing/chrome/marketing-footer.tsx",
      "src/lib/constants/marketing-nav.ts",
    ],
    board: {
      note: "Round two, the footer alone: three decisions on what the footer's demo register should be right under a page's own closing CTA, whether a page with no CTA above it keeps the same footer, and how the invitation travels to a phone; every option drawn under a real CtaBand and under a real page with none, at 1440 and 375.",
      variants: [
        "The shape",
        "What it holds",
        "The returning host",
        "The phone's menu",
        "On scroll",
        "The foot's job",
      ],
    },
  },
  {
    id: "seed-avatar",
    title: "The colour a new account is",
    surface: "shared",
    ruled:
      "open: round one on the desk (2026-09-19, Will's ask by name), seven decisions on the seeded default avatar that replaces the grey initial until a photograph lands",
    shipped: null,
    why: "Every account without a photograph draws the same grey disc today; a colour derived from the account itself is what makes a guest list read as people.",
    lives: [
      "docs/systems/profiles-social.md",
      "src/components/ui/avatar.tsx",
      "src/components/social/guest-list.tsx",
      "src/components/app/user-menu.tsx",
      "src/components/guest/guest-account-menu.tsx",
      "src/components/app/account-avatar-form.tsx",
    ],
    board: {
      note: "Our own zero-dependency generator in hashvatar's gradient register (no canvas, server-renderable, a contract test holding a thousand seeds to three contrast floors), drawn on every real avatar surface with a wedding's twenty-four guests, phone first at 375 with 1440 on the knob",
      variants: [
        "The shape",
        "The crowd",
        "The wheel",
        "The initial",
        "The seed",
        "After a photograph",
        "Motion",
      ],
    },
  },
  {
    id: "profile-page",
    title: "What a person is here",
    surface: "guest",
    ruled:
      "round one ruled whole (Will, 2026-09-19, the fourth batch); `profile-wiring` wires the eight picks; round two open on the three he left: how View all opens, the quick-look, and the way back to the scanned event",
    shipped: null,
    why: "Round two, on the three he left open: how the full list opens from the faces row, what a name opens first, and how a profile keeps the scanned event reachable.",
    lives: [
      "docs/systems/profiles-social.md",
      "src/app/(guest)/u/[slug]/page.tsx",
      "src/components/social/guest-list.tsx",
      "src/components/social/follow-button.tsx",
      "src/components/social/profile-actions-menu.tsx",
      "src/components/social/profile-slug-control.tsx",
    ],
    board: {
      note: "Three decisions on the shipped guest list and profile, phone first at 375 with 1440 on the knob, a 240-name fixture beside round one's 24 (Will's own edge case, a quarter of his imagined thousand): how the full list opens from the faces row, what a name opens first, and how a profile keeps the scanned event reachable",
      variants: ["View all", "Quick-look", "Way back"],
    },
  },
  {
    id: "export-flow",
    title: "Getting everything out",
    surface: "shared",
    ruled:
      'open (Will, 2026-09-19, "the overnight round": the download act is unprotected, "at worst, net neutral and fully deleted")',
    shipped: null,
    why: "Round one asks the take-it-home act from the foundation: what a guest takes, the wait, a tap with no answer, a hollow zip, the limit, and where the file lands.",
    lives: [
      "docs/systems/uploads-and-r2.md",
      "src/components/app/export/export-dialog.tsx",
      "src/components/app/export/use-export-download.ts",
      "src/lib/export/export-service.ts",
      "src/app/api/export/host/route.ts",
      "workers/export/src/index.ts",
    ],
    board: {
      note: "Eight decisions on the real download dialog with fixture summaries, phone first at 375 with 1440 on the knob: what Download hands a guest, what a teaser's third chip does, what the album shows while the zip is made, what a mint that never answers does, what a hollow zip says, what the 2,000 item limit does, what the dialog offers as keeping the album, and where the file lands on a phone",
      variants: [
        "What a guest takes",
        "The wait",
        "A tap with no answer",
        "The limit",
        "Where the file lands",
      ],
    },
  },
  {
    id: "admin-triage",
    title: "Acting on a report",
    surface: "admin",
    ruled:
      "open (Will, 2026-09-18: the admin portal is rethought from the ground up as an on-brand devtool)",
    shipped: null,
    why: "Round one asks the operator's act from the ground up: what a report is on screen, what a verdict records, how a legal hold is reached, and who is told.",
    lives: [
      "docs/systems/admin-observability.md",
      "docs/systems/trust-safety-forensics.md",
      "src/app/admin/reports/page.tsx",
      "src/components/app/report-review.tsx",
      "src/components/admin/triage-status-control.tsx",
      "src/lib/moderation/operator-actions.ts",
    ],
    board: {
      note: "Eight decisions on presentational forks of the real admin pieces with fixtures, inside the shape the admin board is asking about, at 1440 by 900 with 375 on a knob: what a report looks like in the queue, what a wordless one does, what a verdict costs and records, what a closed report leaves, how a legal hold is reached from the report, what an operator can do from a phone, whether four inboxes speak one language, and who outside the portal is told",
      variants: [
        "The first look",
        "The verdict",
        "The legal hold",
        "Once it is closed",
        "Who is told",
      ],
    },
  },
  {
    id: "media-viewer",
    title: "What a photograph opens as",
    surface: "shared",
    ruled:
      "open (Will, 2026-09-19: the app and the guest pages are unprotected, to be reconceived from the foundation)",
    shipped: null,
    why: "One viewer serves all six galleries and every album click ends on it. Round one asks what a tap builds, what stands beside the photograph, and how close a guest may get.",
    lives: [
      "docs/systems/guest-flow.md",
      "docs/systems/uploads-and-r2.md",
      "src/components/shared/media-lightbox.tsx",
      "src/components/shared/masonry.tsx",
      "src/components/guest/guest-masonry.tsx",
    ],
    board: {
      note: "Eight decisions on the real viewer's pieces with fixtures, phone first at 375 by 812 and again at 1440, over one open wedding of twenty-six items from nine guests: what a tap opens, what stands beside the photograph, how it says who took it, how the next one comes, whether a guest can get close, how a video meets them, how they get back to the album, and whether an open photograph has an address",
      variants: [
        "The opening",
        "What it holds",
        "The next one",
        "Close up",
        "The way out",
      ],
    },
  },
  {
    id: "emails",
    title: "Every email Partyreel sends",
    surface: "shared",
    ruled:
      "open (Will, 2026-09-19: the overnight round, every mail cut from a read-only map, unprotected like the rest)",
    shipped: null,
    why: "Eight decisions on the real templates.ts functions in an inbox mock: one wrapper, the brand, the sender, the foot, the code, the moments, the guest's, and the dark inbox.",
    lives: [
      "docs/systems/lifecycle-recovery.md",
      "docs/systems/notifications-analytics-growth.md",
      "src/lib/email/templates.ts",
      "src/lib/email/send.ts",
      "src/components/app/notification-prefs-form.tsx",
    ],
    board: {
      note: "Eight decisions on the real templates.ts functions, drawn inside an inbox mock at a phone's width and a laptop's: one wrapper or two, what it wears, who it's from, whether it carries an unsubscribe, what the sign-in mail could show, which moments deserve a send, whether a guest is ever one of them, and how it reads in a dark inbox",
      variants: [
        "One shell",
        "The brand",
        "The sender",
        "The foot",
        "The code",
        "The moments",
      ],
    },
  },
  {
    id: "reel-studio",
    title: "The highlight reel",
    surface: "host",
    ruled:
      "open (Will, 2026-09-19: the app and the guest pages are unprotected, to be reconceived from the foundation)",
    shipped: null,
    why: "Round one asks the product's North Star from the foundation: the door into the studio, the room at a laptop, and what a guest finally meets.",
    lives: [
      "docs/systems/host-app.md",
      "docs/systems/guest-flow.md",
      "src/components/reel/reel-studio.tsx",
      "src/components/reel/style-rail.tsx",
      "src/components/reel/studio-moments-picker.tsx",
      "src/components/guest/guest-reel-card.tsx",
    ],
    board: {
      note: "Eight decisions on local replicas of the studio with fixtures, at 1440 by 900 with 375 on the knob, every reel frame drawn by the real engine: the door in, the room at a laptop, where fourteen looks live, where moments are picked, what a blocked tile says, how unsharing is answered, what the export's minute looks like, and how a guest meets the reel",
      variants: [
        "The door",
        "The room",
        "The looks",
        "The moments",
        "How a guest watches",
      ],
    },
  },
  {
    id: "help-center",
    title: "Where a problem lands",
    surface: "marketing",
    ruled:
      'open (Will, 2026-09-19, "the overnight round": the help center is unprotected, "at worst, net neutral and fully deleted")',
    shipped: null,
    why: "Round one: who the hub greets, the index sheet's survival, a how-to's shape, a guest's path in, feedback, troubleshooting's dead end, and search's reach.",
    lives: [
      "docs/systems/marketing-content.md",
      "src/app/(marketing)/(cinema)/help/page.tsx",
      "src/app/(marketing)/(cinema)/help/[slug]/page.tsx",
      "src/components/marketing/help/help-palette.tsx",
      "src/components/marketing/help/article-feedback.tsx",
      "src/components/guest/report-dialog.tsx",
    ],
    board: {
      note: "Seven decisions on the real help pieces (PageHero, the category emblems, the index sheet, the article stage, ChipToc and ArticleToc, Checklist, ArticleFeedback, ReportDialog, the search palette) with hand-authored fixture bodies, at 1440 and 375: who the hub greets first, whether the full index sheet survives below it, whether a how-to leans on prose, a checklist or the real screen, how a guest reaches help from inside the product, whether feedback goes anywhere, what a troubleshooting article does with no bigger picture, and how far search reaches",
      variants: [
        "Who first",
        "The hub",
        "The article",
        "From the product",
        "Feedback",
        "The dead end",
        "Search",
      ],
    },
  },
  {
    id: "host-curation",
    title: "Reviewing what guests send",
    surface: "host",
    ruled:
      'open (Will, 2026-09-19: the app is unprotected, "absolutely everything is up for relitigation or reconcepting from the ground up")',
    shipped: null,
    why: "Round one asks the act where a host judges another person's photograph: 4:5 crops, one word for two acts, a look with no verdict on it, and three counts that disagree.",
    lives: [
      "docs/systems/host-app.md",
      "src/components/app/event-feed/review-section.tsx",
      "src/components/app/event-feed/review-actions.tsx",
      "src/components/app/event-feed/use-review-triage.ts",
      "src/components/app/event-feed/selectable-media-grid.tsx",
      "src/components/app/host-media-grid.tsx",
    ],
    board: {
      note: "Eight decisions on the real review surface with fixtures, at 1440 with 375 on the knob: how a waiting photograph is shown, what refusing one is called, what a tap opens, whether the keyboard can clear a queue, what a bulk act offers afterwards, what happens when one lands mid-visit, how many places say the count, and whether the guest ever finds out",
      variants: [
        "The queue",
        "The verb",
        "The peek",
        "The keyboard",
        "After a bulk act",
      ],
    },
  },
  {
    id: "guest-upload",
    title: "The upload act",
    surface: "guest",
    ruled:
      "open (Will, 2026-09-19: the app and the guest pages are unprotected, to be reconceived from the foundation)",
    shipped: null,
    why: "Round one asks the product's core act from the foundation: what the tap opens, how a photograph reads while it flies, and what the page does when one is held or refused.",
    lives: [
      "docs/systems/guest-flow.md",
      "docs/systems/uploads-and-r2.md",
      "src/components/guest/guest-upload.tsx",
      "src/components/guest/guest-masonry.tsx",
      "src/lib/guest/use-upload-queue.ts",
    ],
    board: {
      note: "Eight decisions on the real guest components with fixtures, phone first at 375 by 812 and again at 1440: what the tap opens, how one photograph reads while it flies, what a dozen at once does to the album's head, the moment it lands, what a held upload draws, what a refused file says, what a guest is told before anything flies, and how big the two smallest sentences are",
      variants: [
        "The tap",
        "Sending",
        "A dozen at once",
        "Waiting for the host",
        "A file that will not go",
      ],
    },
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
    id: "app-door",
    title: "The door into the host app",
    surface: "host",
    ruled:
      'open (Will, 2026-09-19, "stack the lab": login and signup is one of the surfaces he named, and everything is open to relitigate from the ground up)',
    shipped: null,
    why: "The door asked from the foundation: what it asks for, how many account surfaces there are, what /login is, and what stands between a new account and the app.",
    lives: [
      "docs/systems/auth-accounts.md",
      "src/app/(auth)/login/page.tsx",
      "src/components/auth/login-form.tsx",
      "src/components/auth/password-sign-in.tsx",
      "src/components/auth/email-sign-in.tsx",
      "src/components/guest/enter-event-prompt.tsx",
      "src/components/app/welcome-flow.tsx",
    ],
    board: {
      note: "Seven decisions on the real auth components with fixtures at 1440 and 375: what the door asks for first, how many account surfaces the product has, what stands between a new account and the app, what /login is as a page, what happens when a new account's email already has one, how the door fails, and what a host the browser already knows meets",
      variants: [
        "What the door asks for",
        "How many doors",
        "The first screen",
        "The page",
        "The returning host",
      ],
    },
  },
  {
    id: "pricing-page",
    title: "The pricing page",
    surface: "marketing",
    ruled:
      "2026-09-20: six of eight decisions ruled and landed on the real page by pricing-wiring (the paper opening, Free and Pro side by side with Pro's own slider, the Event Pass a wide ticket, one dark room from the tiles to the table, six FAQ items). Two stay open for round two, his ask by name: Find your size (a couple more explorations, naming Higgsfield's configurator-and-result shape) and the phone row (its demo repaired first, proven with lab:demo)",
    shipped: null,
    why: "Round two re-asks Find your size and the phone row on the real shipped pair and ticket; the other six are ruled and shipped by pricing-wiring.",
    lives: [
      "src/app/(marketing)/(cinema)/pricing/page.tsx",
      "src/components/marketing/sections/pricing/",
      "docs/systems/marketing-content.md",
    ],
    board: {
      note: "Round two, two decisions on the real shipped pair and ticket at 1440 and 375, every price read from tiers.ts and nothing able to reach Checkout: what the Find your size block should be, and what the plans do at 375 now that the swipe demo is repaired and lab:demo-pressed",
      variants: ["Find your size", "The page in a hand"],
    },
  },
  {
    id: "app-pricing",
    title: "Pricing in the app",
    surface: "host",
    ruled:
      "open (Will, 2026-09-19: \"an in-app pricing modal so we don't take users out of the app to the marketing site by default every pricing click... The marketing site can be a more comprehensive 'Learn More' second-layer resource\")",
    shipped: null,
    why: "Every pricing click in the host app leaves it for a static, tier-blind marketing page; this round asks what opens instead, and what the marketing page becomes.",
    lives: [
      "docs/PRICING.md",
      "docs/systems/billing-caps.md",
      "src/lib/constants/tiers.ts",
      "src/components/app/dashboard/storage-meter.tsx",
      "src/components/app/event-password-control.tsx",
      "src/app/(marketing)/(cinema)/pricing/page.tsx",
    ],
    board: {
      note: "Eight decisions on the shipped app chrome with four real hosts (Free at a locked password, Free out of room, a Pro subscriber, an Event Pass holder) at 1440 and 375, every number read from tiers.ts and no preview reaching Stripe: what a pricing click opens, what it opens on, how much it carries, how the marketing page stays one click away, how much of the pass belongs inside, where the app opens it from, how a locked control asks, and what Checkout comes back to",
      variants: [
        "The object",
        "The first view",
        "How much it carries",
        "The second layer",
      ],
    },
  },
  {
    id: "demo-event",
    title: "The live demo",
    surface: "marketing",
    ruled:
      'open (Will, 2026-09-19: the demo event is unprotected, "absolutely everything is up for relitigation or reconcepting from the ground up")',
    shipped: null,
    why: "The demo is the one place a prospective host meets the product working, and it drops them inside somebody's wedding with one grey line of explanation and no way on.",
    lives: [
      "src/lib/demo.ts",
      "src/app/demo/route.ts",
      "src/components/guest/event-experience.tsx",
      "src/components/marketing/chrome/footer-demo.tsx",
      "src/components/marketing/system/demo-cta-link.tsx",
    ],
    board: {
      note: "Seven decisions on the shipped demo over one wedding, LAPTOP first at 1440 and also at 375 (the inverse of guest-shape: everyone who opens the demo followed a link that said 'try the live demo'): the first seconds, how it keeps admitting it is a demo, what the one simulated upload is for, where the way out sits, what a door promises before it is opened, what a code scanned off the laptop does, and how many parties the demo is",
      variants: [
        "The first seconds",
        "Adding a photo",
        "What a door promises",
        "Scanned off a laptop",
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
      "src/components/marketing/sections/events/event-type-card.tsx",
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
      "2026-09-20 (both rounds; round two answered `material=crystal` and `edge=double`, and round one's other six stand)",
    shipped:
      "Crystal with the double edge as the ONE material every surface over a photograph wears (the `--glass-*` tokens and the `glass` utility), the album blurred at half brightness behind the lightbox, a tile that carries MARKS and no controls, the host's row as one pane, the reel's controls and the marketing plate on the same tokens, dark glass on paper",
    why: "He asked for a global rather than separate treatments, so the material has exactly one home and a pane that types its own tint is a red test.",
    lives: [
      "src/app/globals.css",
      "src/lib/glass.ts",
      "src/components/shared/masonry.tsx",
      "src/components/shared/media-lightbox.tsx",
      "src/components/likes/like-button.tsx",
      "src/components/guest/guest-reel-overlay.tsx",
      "src/components/shared/backdrop/photo-section.css",
      "docs/systems/design-system.md",
    ],
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
      "2026-09-19 (the fifth batch, voice r1: all eight answered; bible 20 ruled PERMISSIVE and rewritten with it)",
    shipped:
      'The account rule (never promise "no account"; "No app required." everywhere), his hero sentence, the curation h1 kept, the Pro line, the album noun on both empty states, his gate line, today\'s toast',
    why: 'An absence may be NAMED, a denial of someone else may not, and "no account" is never promised: Require accounts to upload defaults on.',
    lives: [
      "src/lib/constants/marketing-voice.ts",
      "src/app/(dev)/design/rules/bible.ts",
      "docs/systems/marketing-content.md",
    ],
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
/**
 * ★ THE DESK'S ORDER IS BY LEVERAGE, AND THIS LIST IS ITS ONE HOME (Will,
 * 2026-09-19, verbatim in docs/design/rulings.md): "our board groups should be
 * ordered by leverage, such that if a question/group compounds into a later
 * question/group, the more atomic question is handled first... for any
 * potential snowball effects, the earlier influence is addressed first." He
 * reviews what is presented top to bottom, so a board whose answer changes
 * another board's question sits ABOVE it, and boards that touch nothing else
 * sit at the foot in any order. The desk, the board-to-board paging and
 * `BOARDS` in sandbox/registry.ts all sort by this list. The chain as it
 * stands: the voice binds every line on every board (bible 20 and 21); the body
 * ladder sizes every reading slot; Glass is the material the two shapes' chrome
 * wears; the host app's shape and the guest experience's shape decide the parts
 * (app-vocabulary), the doors (app-door, app-pricing), the first event, the
 * upload, the viewer, curation, the reel and the export; the admin's shape
 * decides triage; the demo's promise decides every demo door, the footer's
 * included. A lane registering a NEW board adds its id at the HEAD of this list
 * (as it does in `BOARDS`; merges stay line-disjoint) and the Orchestrator moves
 * it into its place at the next record; a retiring lane removes its id.
 * registry.test.ts holds this list and `BOARDS` to the same members.
 */
export const DESK_ORDER: readonly SandboxId[] = [
  "body-type",
  "app-shape",
  "guest-shape",
  "app-vocabulary",
  "seed-avatar",
  "admin",
  "app-door",
  "demo-event",
  "pricing-page",
  "app-pricing",
  "first-event",
  "guest-upload",
  "media-viewer",
  "host-curation",
  "reel-studio",
  "export-flow",
  "admin-triage",
  "help-center",
  "emails",
  "site-chrome",
  "profile-page",
  "privacy-hero",
  "album-motion",
  "loose-ends",
  "contact-page",
  "press-page",
];

const deskIndex = (id: string): number => {
  const i = (DESK_ORDER as readonly string[]).indexOf(id);
  return i < 0 ? DESK_ORDER.length : i;
};

export const SANDBOX: Ruling[] = RULINGS.filter(
  (r) => r.board !== undefined,
).sort((a, b) => deskIndex(a.id) - deskIndex(b.id));

export function getRuling(id: string): Ruling | undefined {
  return RULINGS.find((r) => r.id === id);
}
