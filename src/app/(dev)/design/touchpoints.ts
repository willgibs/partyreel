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
  | "identity-door"
  | "identity-claims"
  | "identity-profile"
  | "reel-screen"
  | "guest-capture"
  | "reel-front"
  | "toasts"
  | "guest-verify"
  | "seed-avatar"
  | "error-pages"
  | "event-type-pages"
  | "how-it-works"
  | "site-chrome"
  | "profile-page"
  | "export-flow"
  | "admin-triage"
  | "admin"
  | "media-viewer"
  | "emails"
  | "reel-studio"
  | "reel-view"
  | "help-center"
  | "host-curation"
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
  | "identity-door"
  | "identity-claims"
  | "identity-profile"
  | "reel-screen"
  | "guest-capture"
  | "reel-front"
  | "site-chrome"
  | "profile-page"
  | "export-flow"
  | "admin-triage"
  | "media-viewer"
  | "emails"
  | "reel-view"
  | "help-center"
  | "host-curation"
  | "press-page"
  | "contact-page"
  | "album-motion"
  | "loose-ends"
  | "privacy-hero";

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
    id: "identity-door",
    title: "Asking for an email at the door",
    surface: "guest",
    ruled:
      "open (Will, 2026-09-22, rulings.md \"the morning after the identity round\" and \"guest identity\": \"We'll do a lot of lab work later to redesign here\" and \"I'd like to run most of this through the lab once our foundation is complete.\")",
    shipped: null,
    why: "The identity foundation (the email, the trust levels, the gate, the menu) is live; this board is its redesign catalog, never a gate on the shipped door.",
    lives: [
      "docs/systems/guest-flow.md",
      "src/components/guest/guest-name-step.tsx",
      "src/components/guest/enter-event-prompt.tsx",
      "src/components/guest/guest-name-menu.tsx",
      "src/components/guest/add-email-dialog.tsx",
      "src/components/auth/account-door.tsx",
      "src/components/shared/unverified-mark.tsx",
    ],
    board: {
      note: "Five decisions on the shipped door's real pieces, over Priya, guest-capture's own guest, one step earlier than that board finds her: where the optional email sits against her name, where a member's sign-in path lives, how the verified gate frames its benefit, what her own menu says, and where undoing an email lives",
      variants: [
        "The field",
        "The sign-in nudge",
        "The gate's framing",
        "The guest menu",
        "Removing the email",
      ],
    },
  },
  {
    id: "identity-claims",
    title: "Photos waiting for you",
    surface: "host",
    ruled:
      "open (Will, 2026-09-22, at the identity round's morning close: \"I'd like to run most of this through the lab once our foundation is complete... event claim UI, profile setup, etc.\")",
    shipped: null,
    why: "The claim ticket shipped deliberately plain in wave 1 of the identity reshape; this board is its refinement catalog, never a gate on the shipped flow.",
    lives: [
      "docs/systems/host-app.md",
      "docs/systems/profiles-social.md",
      "src/components/app/dashboard/claims-card.tsx",
      "src/components/guest/follow-moment-card.tsx",
      "src/components/app/notification-bell.tsx",
    ],
    board: {
      note: "Five decisions on the shipped claim ticket's real pieces, over Priya from guest-capture's own world: where it lives on the dashboard, how the album points to it, how she works through more than one event, how she is warned before a deletion, and what Finish leaves her looking at",
      variants: [
        "The ticket's home",
        "The pointer from the album",
        "Working through more than one",
        "Warning before a deletion",
        "What Finish leaves her looking at",
      ],
    },
  },
  {
    id: "identity-profile",
    title: "Setting up a page",
    surface: "guest",
    ruled:
      'open (Will, 2026-09-22, "the morning after the identity round": "I\'d like to run most of this through the lab once our foundation is complete... profile setup, etc")',
    shipped: null,
    why: "How a verified guest sets her page up, chooses what shows, when the app invites it, and what an empty page says to a visitor.",
    lives: [
      "docs/systems/profiles-social.md",
      "src/components/social/attended-events-visibility.tsx",
      "src/app/(guest)/u/[slug]/page.tsx",
      "src/app/(app)/account/page.tsx",
    ],
    board: {
      note: "Four decisions on the account page's real cards and the public profile page, over Priya, verified with three events joined and none shown: how setup itself happens, how she chooses what shows, when the app ever invites the setup, and what an empty claimed page says to a visitor",
      variants: [
        "How it's set up",
        "What shows",
        "When it's offered",
        "The empty page",
      ],
    },
  },
  {
    id: "reel-screen",
    title: "The reel on the wall",
    surface: "guest",
    ruled:
      'open (Will, 2026-09-22, "the reel, reconceived": "Could play at an event in real-time on a screen or something", and his ruling "A first-class screen mode")',
    shipped: null,
    why: "What is on a venue's television all night beside the reel: the code, the name, the just-added beat, the pace, the empty state, the Start plate, Review, and the door.",
    lives: [
      "docs/systems/guest-flow.md",
      "content/help/show-the-album-live-on-a-screen.mdx",
      "src/lib/reel/engine/player.tsx",
      "src/components/app/styled-qr.tsx",
    ],
    board: {
      note: "Eight decisions on the wall at 1920 by 1080 with a 1440 television on the knob, over Mia and Theo's wedding, every reel frame the real engine at its landscape composition: where the code lives and how big, how the event is named, what happens when a photograph lands, how long one holds, what is on screen before the reel begins, what the host presses to start it, whether Review is ever said on a public screen, and where the door sits on the hub",
      variants: [
        "The code",
        "The event's name",
        "The just-added beat",
        "The wall's pace",
        "Before it begins",
        "The Start plate",
        "Review on the wall",
        "The way in",
      ],
    },
  },
  {
    id: "guest-capture",
    title: "Keeping what she just added",
    surface: "guest",
    ruled:
      "open (Will, 2026-09-21, at the identity reshape's approval: \"You can wire it now as you recommended, but I'd like to get this in the lab for refinement.\")",
    shipped: null,
    why: "The capture flow after a name-only guest's first upload (verified-email-guest) is live; this board is its refinement catalog, never a gate on the shipped flow.",
    lives: [
      "docs/systems/guest-flow.md",
      "src/components/guest/save-account-prompt.tsx",
      "src/components/guest/follow-moment-card.tsx",
      "src/components/guest/claim-handle-prompt.tsx",
      "src/components/guest/guest-header.tsx",
      "src/components/shared/unverified-mark.tsx",
    ],
    board: {
      note: "Five decisions on the shipped capture flow's real pieces, over Priya, the unproven guest media-viewer's own board already marked: when the offer first reaches her, what shape it takes, whom she can follow once she confirms, where she lands afterward, and what becomes of the name she typed at the door",
      variants: [
        "The moment",
        "The offer's shape",
        "The follow surface",
        "The landing",
        "What the name becomes",
      ],
    },
  },
  {
    id: "reel-front",
    title: "The album's living tile",
    surface: "guest",
    ruled:
      "open (Will, 2026-09-22, rulings.md \"the reel, reconceived\": the reel is reconceived whole as a live, looping montage playing from a tile at the album's head)",
    shipped: null,
    why: "This is the album's own tile: what it is, its verbs, its states, the beat after a guest's upload, the door and the hub; reel-view and reel-cut are its sibling boards.",
    lives: [
      "docs/systems/guest-flow.md",
      "src/components/guest/event-experience.tsx",
      "src/components/guest/guest-reel-card.tsx",
      "src/components/reel/poster-card.tsx",
      "src/components/guest/entry-shell.tsx",
      "src/app/(app)/dashboard/[eventId]/page.tsx",
    ],
    board: {
      note: "Seven decisions on the album's own head, at Maya and Jay's wedding, every reel frame drawn by the real engine over fixture clips: what the living tile is, its verbs, its states before three items, the beat after a guest's first approved photo, the door's backdrop where access is already full, the keepsake state once uploads close, and the host hub's Reel card",
      variants: [
        "The living tile",
        "The tile's verbs",
        "The small states",
        "The beat after yours",
        "The door's backdrop",
        "Once uploads close",
        "The hub's Reel card",
      ],
    },
  },
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
    ruled: "2026-08-27, superseded 2026-09-20 by pricing-page r2 (fit=split)",
    shipped: "V2 The split configurator (V1 Album fill retired)",
    why: "The controls recessed beside one photographed plan card; its deck fans as the slider climbs, which is the album-fill delight the wall was ruled for, kept.",
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
  // RULED AND RETIRED (round two, 2026-09-20). Round one wired six of seven
  // asks (`avatar-wiring`); his one open question, whether the wired
  // diagonal was hashvatar's richest register, came back `look=mesh`
  // (rulings.md, "the closing sitting's second batch") and `avatar-mesh-
  // wiring` wired it. The board left sandbox/ with the wiring;
  // docs/design/rulings.md keeps his words.
  {
    id: "seed-avatar",
    title: "The colour a new account is",
    surface: "shared",
    ruled:
      "whole: round one (Will, 2026-09-20, the sixth batch) ruled the clipping bug fixed, full colour, the whole wheel, the initial always, the account id as seed, the colour waiting under a photograph, no motion, wired six of seven by `avatar-wiring`; round two, the look alone, ruled `look=mesh` (overrules the wired `diagonal`) at the closing sitting's second batch (2026-09-20) and wired by `avatar-mesh-wiring`",
    shipped:
      "hashvatar's own register: one identity hue read at four tonal depths (a bright primary pool, two darker secondary pools, a plain base fill beneath), diffused and blended with `overlay`/`soft-light` (`background()`'s `mesh` branch and `blendMode()`, `src/lib/avatar/gradient.ts`); the stricter centre-pixel measurement the board used for `look` moved beside the generator as `measure.ts` and holds the shipped look to 4.5:1 under the initial across a thousand real UUIDs",
    why: "Every account without a photograph draws a seeded colour, not grey; round two's mesh reads richer and measures better under the initial than the wired diagonal.",
    lives: [
      "docs/systems/auth-accounts.md",
      "docs/systems/profiles-social.md",
      "src/lib/avatar/gradient.ts",
      "src/lib/avatar/measure.ts",
      "src/lib/avatar/seed.ts",
      "src/components/ui/avatar.tsx",
      "src/components/social/guest-list.tsx",
      "src/components/app/user-menu.tsx",
      "src/components/guest/guest-account-menu.tsx",
      "src/components/app/account-avatar-form.tsx",
    ],
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
    id: "reel-view",
    title: "The reel's full-screen view",
    surface: "guest",
    ruled:
      "open (Will, 2026-09-22, THE REEL ROUND: the reel reconceived whole, rulings.md \"the reel, reconceived\")",
    shipped: null,
    why: "The view a tap on the album's tile or `?reel` opens: its chrome and fade, the controls, the arrival beat, the tap, the posture, the pacing, the loop, and reduced motion.",
    lives: [
      "docs/systems/guest-flow.md",
      "src/components/guest/guest-reel-overlay.tsx",
      "src/lib/reel/engine/player.tsx",
    ],
    board: {
      note: "Eight decisions over the shared wedding album, drawn by the real engine at 1440 with 375 on the knob: the chrome and its fade, the control set's arrangement, the arrival beat, what a tap does, whether the reel follows the device's shape, how fast a photograph holds, how a fresh loop announces itself, and what reduced motion starts on",
      variants: [
        "The chrome",
        "The controls",
        "The arrival",
        "The tap",
        "The posture",
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
      "2026-09-22, retired UNREVIEWED at round one: Will reconceived the reel whole in chat (rulings.md \"the reel, reconceived\": a live, looping montage of the visible album, a cut anyone makes on-device, no stored file, no Studio, no publish), so the room these eight questions were about no longer exists; `door` and `guests` reshape into `reel-front`, `room`, `styles`, `moments`, `blocked` and `wait` into `reel-cut`, `sharing` removed as valueless; the sandbox folder stays as `reel-cut`'s source until that board hands off, git keeps it after",
    shipped: null,
    why: "Round one asked the North Star from the foundation (the door, the room, what a guest meets); the reel round replaced the product it asked about.",
    lives: [
      "docs/systems/host-app.md",
      "docs/systems/guest-flow.md",
      "src/components/reel/reel-studio.tsx",
      "src/components/reel/style-rail.tsx",
      "src/components/reel/studio-moments-picker.tsx",
      "src/components/guest/guest-reel-card.tsx",
    ],
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
    id: "first-event",
    title: "A host's first event",
    surface: "host",
    ruled:
      "2026-09-21 (round one ruled whole, the closing sitting's third batch: asks=one, style=step, limit=door, venue=sheet, landing=beat, hand=same, empty=list, first=live)",
    shipped:
      "Create asks for a name and nothing else, on a borderless field at the size the name will be; the style step stays and is four large swatches on a container query, because it is where a host learns the feature exists; a Free host at their cap meets the refusal BEFORE the form, naming the plan's own number and the event holding the slot, with Delete and Pro beside it; Create ends on a beat, once, with the real code in a mat and two doors out of it. The app prints its own stock at real millimetres (nine table cards to a page, a welcome sign, a poster) from a route group outside the app shell, so the sticky header never reaches the printer. Sharing is ONE surface again (the legacy dialog retired into the sheet, redrawn at 375 with the code at the sheet's own width). Before the first photograph the page is a launch list of what is left; after it, the hub goes live on the guest's own doorbell plus a cheap host fingerprint, and a new tile arrives marked (first-event-wiring, 2026-09-21)",
    why: "The one moment a host only gets once, and the only place in the product where paper is the deliverable.",
    lives: [
      "src/components/app/create-event-wizard.tsx",
      "src/components/app/qr-preset-picker.tsx",
      "src/components/app/event-qr.tsx",
      "src/components/app/share/event-share-sheet.tsx",
      "src/components/app/print/print-stock.tsx",
      "src/app/(print)/dashboard/[eventId]/print/page.tsx",
      "src/components/app/event-feed/launch-list.tsx",
      "src/lib/qr/stock.ts",
      "src/lib/events/host-fingerprint.ts",
      "docs/systems/host-app.md",
    ],
  },
  {
    id: "app-door",
    title: "The door into the host app",
    surface: "host",
    ruled:
      "2026-09-20 (both rounds; round two answered `tour=film`, and round one's other six stand from `door-wiring`, f7075a73: lead=code, surfaces=one, page=beside, existing=tell, failure=paths, return=tap flagged and shipped as back)",
    shipped:
      "One AccountDoor worn four ways (the /login page, the guest gate, Save, a like), leading with a single email field and its code, Google beside it, a password on a quiet link; an existing account named only after a verified code; failures as one table of six kinds behind real buttons; /login beside a wall of marketing frames; passkeys wired dark behind a flag. The welcome tour is five screens: the required name untouched, three of the marketing site's own bespoke how-it-works pictures (StepPicture, quoted rather than redrawn) breathing under a copy plate that overlaps each one, a closing beat on ReelPicture into the same primary-and-skippable pair as always",
    why: "One account object rather than four login pages (round one); the tour wears the site's own pictures under a slow drift, not a fourth invented register (round two).",
    lives: [
      "src/components/auth/account-door.tsx",
      "src/app/(app)/welcome/page.tsx",
      "src/components/app/welcome-flow.tsx",
      "src/components/app/welcome-flow.css",
      "src/lib/constants/how-it-works.ts",
      "docs/systems/auth-accounts.md",
      "docs/systems/host-app.md",
    ],
  },
  {
    id: "pricing-page",
    title: "The pricing page",
    surface: "marketing",
    ruled:
      'ruled whole over two rounds (Will, 2026-09-20). r1\'s six: the paper opening, Free and Pro side by side with Pro\'s own slider, the Event Pass a wide ticket, one dark room from the tiles to the table, six FAQ items. r2\'s two: fit=split ("the configurator section directly beneath the plan cards feels much better... The upgrade section can start the next chapter as an overview, then table next, then FAQ", which he said himself overrides his r1 note) and phone=stack ("Scrolling is a much more common action than swiping, and the swipe cards may be missed")',
    shipped:
      "The album wall replaced by the split configurator: the slider, the video switch and the once-or-again fork recessed on bg-muted, one photographed plan card elevated on the page's own white beside them, its deck of prints fanning out as the slider climbs. It closes the PAPER chapter directly under the pair and the ticket, and the unlock tiles open the dark one as its overview, then the matrix, then the questions. 375 is the stack production already shipped; the swipe row is banked for future gallery-type sections",
    why: "Round two re-asked Find your size and the phone row on the real shipped pair and ticket; the other six were ruled and shipped by pricing-wiring.",
    lives: [
      "src/app/(marketing)/(cinema)/pricing/page.tsx",
      "src/components/marketing/sections/pricing/",
      "docs/systems/marketing-content.md",
    ],
  },
  {
    id: "app-pricing",
    title: "Pricing in the app",
    surface: "host",
    ruled:
      "2026-09-20 (all eight: the object, the first view, how much it carries, the second layer, the pass, the doors, the words at a gate, coming back)",
    shipped:
      "One pricing sheet on the responsive Sheet, led by the trigger (a locked feature names itself, running out of room opens on the smallest plan that clears it, a subscriber is told she subscribes), carrying Free beside one Pro size with three benefit lines, the Event Pass on one line, and a quiet foot to /pricing in a new tab; one lock chip behind every gated control, a button with a tooltip rather than a dead sentence; Plan and storage in the user menu and the account page's Plan card as billing's home; Checkout returning to the control that refused you with a welcome-to-Pro modal",
    why: "Every pricing click used to leave the app for a tier-blind page that could not name the control that refused you; the trigger is what keeping it inside buys.",
    lives: [
      "docs/PRICING.md",
      "docs/systems/billing-caps.md",
      "src/lib/constants/tiers.ts",
      "src/components/app/pricing/",
      "src/components/app/dashboard/storage-meter.tsx",
      "src/app/(app)/account/page.tsx",
      "src/app/api/stripe/checkout/route.ts",
    ],
  },
  {
    id: "demo-event",
    title: "The live demo",
    surface: "marketing",
    ruled:
      "round one ruled whole (Will, 2026-09-20, the sixth batch); round two ruled `door=frame` 2026-09-20/21 (the closing sitting's second batch), his note verbatim: \"this visual is the same height as the image banner behind, and isn't as noticeable as it could be\"",
    shipped:
      "One DemoFrame (a photograph in a plain mat, the code tucked into its corner) at all four doors: the hero's plate (sized past the shipped corridor's own tiles, measured, with a `heroCompact` pair below `lg`), the footer's invitation, a feature page's line beside its words, and the nav panel's featured pane the retired ticket left empty; DemoTicket kept as the frame's own door for the Library's specimen and the site-chrome sandbox (demo-frame-wiring, 2026-09-21)",
    why: "One photograph in a frame reads as intentional rather than reused, and stays legible from the hero's plate down to the nav pane's small slot.",
    lives: [
      "src/components/marketing/system/demo-ticket.tsx",
      "src/components/marketing/sections/home/cinema-hero.tsx",
      "src/components/marketing/chrome/footer-demo.tsx",
      "src/components/marketing/system/demo-cta-link.tsx",
      "src/components/marketing/chrome/mega-panel.tsx",
      "docs/systems/marketing-content.md",
    ],
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
      "round one ruled whole (Will, 2026-09-20, the sixth batch: home=pulse, density=both a cover/row toggle, event=hub, nav=crumbs, share its own room plus a QR mini-modal, settings=sheet, phone=same); round two ruled the same day (empty=wizard, first=pulse overrules share, busy=collapsed with his band-order note)",
    shipped:
      'The pulse and the hub (home-wiring 62a82a26, hub-wiring a91464cb, 2026-09-20); round two (home-states-wiring, 2026-09-20) verified the zero-event and one-event pages unchanged and wired the real fold: the band\'s top three by tone behind one "N more" chip that expands in place, and the page reordered to next-step, storage, events, Just arrived beneath them, by his note.',
    why: "The host app's shape asked from the foundation: what the home is, what an event's page is, and where navigation, sharing, settings and money live.",
    lives: [
      "docs/systems/host-app.md",
      "src/components/shared/app-shell.tsx",
      "src/app/(app)/dashboard/page.tsx",
      "src/app/(app)/dashboard/[eventId]/page.tsx",
      "src/lib/dashboard/next-step.ts",
      "src/components/app/dashboard/next-step-band.tsx",
    ],
  },
  // RULED AND RETIRED (round two, 2026-09-20). Round one wired six of seven
  // asks (`vocab-wiring`) with the tile-size cluster as the interim shape;
  // his crowding note on that exact cluster ("we may need to rethink where
  // all of these actions live") reopened round two, which he ruled
  // `controls-home=view-menu` and `controls-home-wiring` wired. The board
  // left sandbox/ with the wiring; docs/design/rulings.md keeps his words.
  {
    id: "app-vocabulary",
    title: "The app's shared vocabulary",
    surface: "shared",
    ruled:
      "2026-09-20: round one ruled whole (vocab-wiring wired six of seven, the tile-size cluster the interim shape); round two ruled the one he asked back (controls-home=view-menu) and controls-home-wiring wired it",
    shipped:
      "One View menu behind a single button holding Tile size, a reserved Sort and Filter (the Deleted lens folded in as its own option), Download and Select the row's only other two verbs; the tile-size cluster's interim reserved pills retired with it",
    why: "Where the host gallery's five crowded controls (download, tile size, sort, filter, select) live, on the real wired Album header.",
    lives: [
      "docs/systems/host-app.md",
      "src/components/app/event-feed/event-gallery.tsx",
      "src/components/shared/view-menu.tsx",
      "src/components/shared/tile-size-control.tsx",
    ],
  },
  // RULED WHOLE AND RETIRED (2026-09-21). Round two asked five questions and
  // his answer to the first, `address=none`, dissolved the other four with it:
  // "we remove the concept of 'anonymous' entirely... we shift the full concept
  // to 'require verified emails'". His four answers at approval settled what
  // was left, he asked for the board itself ("Retire it"), and the identity
  // reshape wires the shape in three lanes beside this one. Round one's four
  // rulings are no longer HELD: what supersedes them is his own next shape, not
  // a lane's reading (sandbox/overtaken.ts, the HELD note). `guest-capture` is
  // cut from the shipped capture flow for its refinement, on his word.
  {
    id: "guest-verify",
    title: "Verify, or badge",
    surface: "guest",
    ruled:
      'whole: round two ruled address=none (Will, 2026-09-21) and the note under it reshaped identity, with his four answers at approval settling the rest (the capture flow wired now "but I\'d like to get this in the lab for refinement", an unverified name "Listed, with the mark", "No cap now", "Retire it"); gate-switch is answered on his own words as a fourth shape, collision by the capture flow, unproven on the credit and the guest list, allowance left open. Round one\'s four were HELD on his "May have to relitigate": gate=after is SUPERSEDED (nothing waits on a mail in either mode), expiry=host is moot, and badge=mark with host-lens=badge carry onto the unverified name',
    shipped:
      "Anonymity leaves the product: every upload carries a name. The host's switch is Require verified emails, on by default. On, a guest confirms an email before the full album and any upload, as today with truer words. Off, a guest types a display name at the door and uploads under it wearing a small unverified mark that carries its own way out (Confirm your email); the name is listed on the album's guest list with the mark and the tile itself stays plain, and nothing caps what a name-only guest may add. After such a guest's first upload the capture flow offers to keep the photographs and the event on a profile, then the host and the other guests to follow (the identity reshape, 2026-09-21; wired by verified-email-server, verified-email-guest and verified-email-host-copy, and refined in the lab by guest-capture once it has shipped)",
    why: "One email gate was doing three jobs at once, credit, ownership and the host's safety; separating them is what let anonymity go without losing any of the three.",
    lives: [
      "docs/systems/guest-flow.md",
      "docs/systems/auth-accounts.md",
      "docs/systems/database-security.md",
      "src/components/guest/enter-event-prompt.tsx",
      "src/components/app/event-settings/uploads-section.tsx",
      "src/lib/media/uploader-identity.ts",
      "src/components/social/guest-list.tsx",
    ],
  },
  {
    id: "guest-shape",
    title: "The guest experience's shape",
    surface: "guest",
    ruled:
      "whole: round one (Will, 2026-09-20, the sixth batch) ruled door=today (the welcome-then-gate SEQUENCE, not its shell), nothing=river, live=land, yours (a guest's own upload, removable for ever, final for the host too), account=after and dialogs=stands, five of them wired at `7f4f2ffe` (`guest-wiring`); round two, the two he sent back plus where a guest finds their own photographs, ruled chrome=both, welcome=sheet and theirs=mark at the closing sitting's first batch (2026-09-20) and wired at `guest-chrome-wiring`",
    shipped:
      "The row under the event's name on landing and a dock of the same two actions at the foot once it scrolls away (the floating Add pill retired), the door on the one responsive Sheet from 640 up with vaul keeping the phone, and a fourth tile mark on a guest's own photographs whose tap filters the album to theirs",
    why: "His criterion held both halves at once, found on landing AND reachable at any depth, so the row he liked first becomes the dock he trusted.",
    lives: [
      "docs/systems/guest-flow.md",
      "src/components/guest/event-experience.tsx",
      "src/components/guest/guest-action-dock.tsx",
      "src/components/guest/entry-shell.tsx",
      "src/components/guest/live-gallery.tsx",
      "src/components/shared/masonry.tsx",
    ],
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
      "whole: round one (Will, 2026-09-19/20, the fifth batch) wired six of seven asks at `59345bc8` (`ladder-wiring`); round two, the button rung alone, ruled `pairs=step-up` at the closing sitting's first batch (2026-09-20) and wired at `buttons-wiring`",
    shipped:
      "The six body steps (reading=16, working=14, marketing=fluid 16 to 18, caption=10 with the caption step at 12, label=12 on 0.08em, leading=2x-8) plus the button rung: every Button size's icon one Tailwind icon-step over its own text (12/14, 14/16, 16/18), explicit on all eight sizes so none falls back to the base by accident",
    why: 'His "mismatched" icon/text pairing becomes a stated rule: every icon sits one Tailwind step over its text, costing the least motion since most sizes already sat there.',
    lives: [
      "src/app/theme.css",
      "src/lib/utils.ts",
      "src/lib/type-ladder-policy.test.ts",
      "src/components/ui/button.tsx",
      "docs/systems/design-system.md",
    ],
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
      "2026-09-20 (the sixth batch, seven answers: the numbers first with the queue beneath, a rail with a command palette, a table for data and a pane for prose, colour reaching the row, one destructive sheet sized to the damage, the health band under the bar, a 44 px tool bar)",
    shipped:
      "The portal on four figures with the ranked queue beneath, the 44 px bar with the crumb and the live tag, the 232 px rail at lg and the dropdown below it, the health band on a bad day, the command palette on ui/command-palette.tsx, ui/table.tsx with tone and four state colours reaching the row, one destructive sheet on nine controls, Exports in NAV (admin-wiring, merged b81ed49a, 2026-09-20); the board's fixtures survive as a Library demo.",
    why: "Sixteen routes behind one dropdown, every page a column of cards, no health signal away from the jobs console; round one asks the portal's shape as seven decisions.",
    lives: [
      "docs/systems/admin-observability.md",
      "src/lib/admin/nav.ts",
      "src/components/admin/admin-shell.tsx",
      "src/app/admin/page.tsx",
    ],
  },
  // RULED AND RETIRED (2026-09-20). Round one ruled whole, every one of the
  // five asks the board's own recommendation and no notes (Will, 20:05 EDT,
  // the build paste verbatim in docs/design/rulings.md); toasts-wiring wired
  // it the same night. The board left sandbox/ with the wiring;
  // docs/design/rulings.md keeps his words.
  {
    id: "toasts",
    title: "The toast, as a system",
    surface: "shared",
    ruled:
      "2026-09-20, 20:05 EDT (Will, the sixth batch): where=top, material=card, life=persist, stack=expanded, action=always, every one the board's recommendation",
    shipped:
      "The one Toaster at top-center under the tallest bar (5rem), always expanded, the popover card unchanged, an error held open behind a close control while every other kind keeps its clock (sonner's own `toast.error` patched once so the 65 existing call sites needed no edit), the action/cancel slot sanctioned for a future success toast (Undo) as much as today's refusals (Upgrade)",
    why: "Six boards already decided a toast's words; this asked the system underneath: if the control can show it, no toast halves the count before anything else is asked.",
    lives: [
      "src/components/ui/sonner.tsx",
      "src/app/layout.tsx",
      "src/app/globals.css",
      "docs/systems/design-system.md",
    ],
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
  // ★ A NEW BOARD REGISTERS BESIDE A NAMED NEIGHBOUR, NEVER ALL AT THE SAME
  // SPOT (2026-09-22: several same-round siblings inserting at one shared head
  // mangled two merges the same day), and the Orchestrator moves each into its
  // leverage place at the merge regardless of where it lands here: `reel-view`
  // sits right after `media-viewer`, whose answers it reads from;
  // `identity-door` right after `guest-capture`, since it draws the same guest
  // one step earlier in her walk through the door; `identity-claims` after
  // `identity-door` for the same reason; `identity-profile` after
  // `identity-claims`; `reel-front` after `guest-capture` too (its own
  // instruction named the same neighbour identity-door's chain already sat
  // beside, so this merge simply keeps both). Older history: `guest-verify`
  // went after `guest-shape` at its merge, `toasts` after `app-vocabulary` (a
  // part under both shapes), `guest-capture` after `media-viewer`, 2026-09-21
  // (the capture flow lives under the album's shape).
  "media-viewer",
  "reel-view",
  "reel-screen",
  "guest-capture",
  "reel-front",
  "identity-door",
  "identity-claims",
  "identity-profile",
  "host-curation",
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
