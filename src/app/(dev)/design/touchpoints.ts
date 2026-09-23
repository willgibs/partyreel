/**
 * THE RULINGS REGISTRY of the design lab: one row per ruled component or page,
 * and one per standing board.
 *
 * A ruled row states what Will ruled as the rule it holds today (`ruled`), why
 * in one line (`why`), what ships (`shipped`) and where the rule lives
 * (`lives`: the system-doc anchors and production paths that are its homes;
 * this row is their index). It is a working rule, not a wall: new work follows
 * it by default and reshapes it deliberately when a better solution needs it.
 * The Library renders the ruled rows at /design/library/rules#rulings. A
 * standing board's row carries `board`, and its `ruled` opens with "open" and
 * says what it asks.
 *
 * `board` is set ONLY while a board stands in sandbox/. When Will rules on one,
 * the wiring lands the rule in its homes, the board leaves sandbox/, `board`
 * goes, and the row is rewritten as the rule; a row whose board or item leaves
 * without a winner is deleted. SANDBOX (the desk and the sidebar) derives from
 * `board` and RULED from its absence, so this file is the one place a board is
 * added or retired.
 */
export type Surface = "guest" | "host" | "marketing" | "shared" | "admin";

/** Surface display labels: the ONE home (the sidebar, the rules page and the
 *  board header import this; never redefine it). */
export const SURFACE_LABEL: Record<Surface, string> = {
  guest: "Guest",
  host: "Host",
  marketing: "Marketing",
  shared: "Shared",
  // The ops portal is its own deployment, so it is a surface of its own rather
  // than shared machinery.
  admin: "Admin",
};

export type RulingId =
  | "identity-door"
  | "identity-claims"
  | "identity-profile"
  | "reel-screen"
  | "guest-capture"
  | "voice-guest"
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
  | "reel-story"
  | "admin"
  | "media-viewer"
  | "emails"
  | "reel-view"
  | "help-center"
  | "host-curation"
  | "host-storage"
  | "event-safety"
  | "reel-host"
  | "reel-cut"
  | "first-event"
  | "pricing-page"
  | "press-page"
  | "contact-page"
  | "entry"
  | "upload"
  | "gallery"
  | "header"
  | "lightbox"
  | "event-card"
  | "forms"
  | "states"
  | "qr-card"
  | "arrival"
  | "gallery-actions"
  | "marketing-voice"
  | "home-hero"
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
  | "contact-identity"
  | "press-identity"
  | "blog-identity"
  | "careers-identity"
  | "glow-doctrine"
  | "glow-moments"
  | "palette"
  | "light"
  | "type-scale"
  | "floating-surfaces"
  | "rounding"
  | "type-phone";

/** The boards standing in sandbox/ (each has `board` set below). */
export type SandboxId =
  | "identity-door"
  | "identity-claims"
  | "identity-profile"
  | "reel-screen"
  | "guest-capture"
  | "voice-guest"
  | "reel-front"
  | "site-chrome"
  | "profile-page"
  | "export-flow"
  | "admin-triage"
  | "reel-story"
  | "media-viewer"
  | "emails"
  | "reel-view"
  | "help-center"
  | "host-curation"
  | "host-storage"
  | "event-safety"
  | "reel-host"
  | "reel-cut"
  | "press-page"
  | "contact-page"
  | "album-motion"
  | "loose-ends"
  | "privacy-hero";

export type Ruling = {
  id: RulingId;
  title: string;
  surface: Surface;
  /** A ruled row: the rule it holds today. A standing board: "open: " and what it asks. */
  ruled: string;
  /** What ships, in a few words; null on a standing board. */
  shipped: string | null;
  /** Why, in one line (touchpoints.test.ts holds it to 170 characters). */
  why: string;
  /** Where the rule lives: system-doc anchors and production paths. */
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
      "open: where the optional email sits against the name, where a member's sign-in lives, how the verified gate frames its benefit, what the guest's own menu says, and where undoing an email lives",
    shipped: null,
    why: "The email at the door, the trust levels, the verified gate and the guest menu are live; this board redesigns them on the shipped pieces.",
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
      "open: where the claim ticket lives on the dashboard, how the album points to it, working through more than one event, the warning before a deletion, and what Finish leaves",
    shipped: null,
    why: "The claim ticket ships deliberately plain; this board refines it on the shipped pieces and never gates the shipped flow.",
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
      "open: how a verified guest sets up her page, how she chooses what shows, when the app offers the setup, and what an empty page says to a visitor",
    shipped: null,
    why: "A profile publishes nothing until its owner chooses, so the setup is how a page fills; drawn on the account page's real cards and the public page.",
    lives: [
      "docs/systems/profiles-social.md",
      "src/components/social/attended-events-visibility.tsx",
      "src/app/(guest)/u/[slug]/page.tsx",
      "src/app/(app)/account/page.tsx",
    ],
    board: {
      note: "Four decisions on the account page's real cards and the public profile page, over Priya, verified, with photos added to three events and none shown: how setup itself happens, how she chooses what shows, when the app ever invites the setup, and what an empty claimed page says to a visitor",
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
      "open: the live reel on a venue's screen: where the code lives, how the event is named, the just-added beat, the pace, before it begins, the Start plate, Review on a public wall, and the way in",
    shipped: null,
    why: "Screen mode is a first-class way to play the live reel: one wall carries it full-bleed with the event's name and its code for a whole night.",
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
      "open: when the second ask to keep her photos reaches a guest the door already offered an email, the ask's shape, whom she can follow once she confirms, and whether her typed name gets one look before it becomes her account's",
    shipped: null,
    why: "The capture flow after a name-only guest's first upload is live; this board refines it and never gates the shipped flow.",
    lives: [
      "docs/systems/guest-flow.md",
      "src/components/guest/save-account-prompt.tsx",
      "src/components/guest/follow-moment-card.tsx",
      "src/components/guest/claim-handle-prompt.tsx",
      "src/components/guest/guest-header.tsx",
      "src/components/shared/unverified-mark.tsx",
    ],
    board: {
      note: "Four decisions on the shipped capture flow's real pieces, over Priya, an Unverified guest: when the second ask first reaches her, what shape it takes, whom she can follow once she confirms, and whether the name she typed at the door gets one look before it becomes her account's",
      variants: [
        "The moment",
        "The offer's shape",
        "The follow surface",
        "What the name becomes",
      ],
    },
  },
  {
    id: "voice-guest",
    title: "The voice of the guest journey",
    surface: "guest",
    ruled:
      "open: seven lines a guest reads, each in its real place: the welcome, the password's ask, the landing, a failed upload, the empty album's button, a held photo, and the capture's words",
    shipped: null,
    why: "The voice is built one won line at a time in its real place (bible 21); these seven are the guest's most-read words and where most of the asks live.",
    lives: [
      "src/components/guest/entry-modal.tsx",
      "src/components/guest/password-gate.tsx",
      "src/components/guest/upload/stack-tile.tsx",
      "src/components/guest/upload/failure-sheet.tsx",
      "src/components/guest/gallery-empty-state.tsx",
      "src/components/guest/save-account-prompt.tsx",
      "src/components/auth/account-door.tsx",
    ],
    board: {
      note: "Seven real lines of the guest journey, each drawn where it ships on a 375 phone over Priya at Maya and Jay's wedding, today's words beside three registers (plain and warm, bright and playful, quiet and exact), so the lines he picks build the voice",
      variants: [
        "The welcome",
        "The password's ask",
        "The landing",
        "A failed upload",
        "The empty album's button",
        "A held photo",
        "Keeping it",
      ],
    },
  },
  {
    id: "reel-front",
    title: "The album's living tile",
    surface: "guest",
    ruled:
      "open: the live reel's tile at the album's head: what it is, its verbs, its small states, the beat after a first photo, the door's backdrop, once uploads close, and the hub's Reel card",
    shipped: null,
    why: "The live reel plays from a tile at the head of the album; reel-view is the view it opens and reel-cut the creator beside it.",
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
    ruled:
      "Every visitor but the host passes one held sheet with no exit (the welcome, the password, the name, the email, the first upload, each only when owed) over what the server allows behind it: the album, the nine-photo teaser or the ghost river.",
    shipped: "One held sheet over the album",
    why: "The blurred album behind the sheet is the reward that pays for the name, the email and the first photo; a way out would hand it over for free.",
    lives: ["docs/systems/guest-flow.md"],
  },
  {
    id: "upload",
    title: "Upload moment",
    surface: "guest",
    ruled:
      "Every Add opens one sheet that reviews the picks before Send; a run is one stack tile at the album's head, a held file a waiting tile, the newest landing one sweep of light, and any failures one sheet when the run ends.",
    shipped: "The Add sheet, the stack tile, the sweep",
    why: "A guest sees what is going, what landed and what failed without hunting tiles or catching a toast, and nothing interrupts a run.",
    lives: ["docs/systems/guest-flow.md", "docs/systems/uploads-and-r2.md"],
  },
  {
    id: "gallery",
    title: "Gallery grid",
    surface: "guest",
    ruled:
      "Every album grid is one MasonryColumns of MediaTiles: natural aspect ratios in height-balanced columns, newest first, an arrival growing only its own column; only the reel and the Review queue go uniform.",
    shipped: "Masonry columns",
    why: "Real aspect ratios read as this party's own album rather than a stock grid, and one component keeps the guest's and the host's albums alike.",
    lives: ["docs/systems/guest-flow.md"],
  },
  {
    id: "header",
    title: "Event header",
    surface: "guest",
    ruled:
      "The guest album opens on a left-aligned editorial header (the name, Hosted by with the avatar and the date, the count line, an optional description), never a cover image; a locked event shows the name alone.",
    shipped: "Left editorial",
    why: "Context without a cover-image chore for the host, and more of the screen for the photographs.",
    lives: ["docs/systems/guest-flow.md", "docs/systems/host-app.md"],
  },
  {
    id: "lightbox",
    title: "Lightbox chrome",
    surface: "guest",
    ruled:
      "One lightbox serves every album: the media full-bleed, a glass close at the top, a glass action pill over the attribution pill at the foot, the album blurred behind; a guest never sees like counts.",
    shipped: "The floating pill",
    why: "Maximum media with the controls floating on it, so a photograph reads as lifted out of the album rather than opened on a new screen.",
    lives: ["docs/systems/guest-flow.md"],
  },
  {
    id: "event-card",
    title: "Host event card",
    surface: "host",
    ruled:
      "A hosted event's cover card is a 16:10 photograph with its name and glass stat pills (the date, the items, Open or Closed) over a dark gradient, the review count top-right and a QR chip top-left that opens its share sheet; Your events also lists as rows.",
    shipped: "The cover card, or rows",
    why: "Stats over the photograph keep the card the party's own face, and one share sheet means the chip and the event page never disagree.",
    lives: ["docs/systems/host-app.md"],
  },
  {
    id: "forms",
    title: "Forms & inputs",
    surface: "host",
    ruled:
      "Settings are stacked Card sections (an event's inside its Settings sheet, the account's in one column), onboarding is one centred column, and every heading wears Urbanist while the body and the labels read in Inter.",
    shipped: "Card sections",
    why: "A card per concern keeps a long form scannable, and one heading face with one body face holds the app to two typefaces.",
    lives: [
      "docs/systems/host-app.md",
      "docs/systems/design-system.md#type-the-heading-face-the-ladder",
    ],
  },
  {
    id: "states",
    title: "Empty & loading",
    surface: "shared",
    ruled:
      "An empty or locked guest album shows the ghosted river of stand-in frames in the reading column, with the promise and, when the guest can upload, the first-photo call centred on it; loading mirrors the grid.",
    shipped: "The ghost river",
    why: "An absence reads as photographs about to arrive rather than a void, and one picture of nothing keeps the locked and the empty screens alike.",
    lives: ["docs/systems/design-system.md"],
  },
  {
    id: "qr-card",
    title: "QR table card",
    surface: "shared",
    ruled:
      "The printed card is one ink-on-white face (the classic square code, Scan to add your photos, the event's name, the readable link) in three millimetre-exact pieces; a code on a screen wears one of four presets.",
    shipped: "One printed face, four screen presets",
    why: "Paper has to scan the first time: dark modules on white, painted before the print dialog opens; a gallery of printable designs is roadmap work.",
    lives: ["docs/systems/host-app.md", "docs/ROADMAP.md"],
  },
  {
    id: "arrival",
    title: "Guest arrival",
    surface: "guest",
    ruled:
      "The door opens after a 700ms beat (350ms when it opens past the welcome, none under reduced motion), the phone's welcome stands tall, steps slide by direction, and the last step holds a 900ms You're in.",
    shipped: "Calm arrival",
    why: "A first arrival is the one sanctioned slow moment: the page settles before the invitation, and the success beat covers the refresh behind it.",
    lives: [
      "docs/systems/guest-flow.md",
      "docs/systems/design-system.md#the-arrival-choreography-calm-700ms",
    ],
  },
  {
    id: "gallery-actions",
    title: "Gallery actions",
    surface: "shared",
    ruled:
      "Every action glyph on a tile and in the lightbox, guest and host alike, rests monochrome and takes its hue on hover or in its held state: like rose, save and share blue, hide amber, approve green, delete red, reel violet.",
    shipped: "Universal action colours",
    why: "The action set differs by role but the colour language never does, so a hue always means the same act and the photographs stay the colour.",
    lives: [
      "docs/systems/host-app.md",
      "docs/systems/design-system.md",
      "docs/systems/architecture.md",
    ],
  },
  {
    id: "marketing-voice",
    title: "Marketing voice",
    surface: "marketing",
    ruled:
      "'The whole event, in one album.' (SITE_THESIS) is the site's one thesis: the home hero's h1 and the head of the meta description, the social card and the footer; every ruled line lives in marketing-voice.ts.",
    shipped: "The whole event, in one album.",
    why: "The collection is the promise, so one sentence carries it everywhere, and changing it is a ruling rather than drift.",
    lives: [
      "src/lib/constants/marketing-voice.ts",
      "docs/systems/marketing-content.md",
    ],
  },
  {
    id: "home-hero",
    title: "The home hero",
    surface: "marketing",
    ruled:
      "The home hero streams the album both ways out of the demo frame on one centred axis; the h1, the sentence and two actions hang beneath as one block outside the stream's measured reach, with no scrim.",
    shipped: "Stacked, the demo frame above",
    why: "The geometry keeps type off the photographs without a darkening layer, and the object the album pours from is the live demo itself.",
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
    ruled:
      "Free on paper and Pro on ink stand side by side from lg, each under a small stack of real prints (two grayscale on Free, four vivid on Pro) that spreads on hover; the prices sit in the display face.",
    shipped: "Stacked prints",
    why: "Prints show what a plan holds and colour arrives with Pro; money in the heading face reads as the card's subject rather than as data.",
    lives: [
      "src/app/(marketing)/(cinema)/pricing/",
      "docs/systems/marketing-content.md",
    ],
  },
  {
    id: "contact-identity",
    title: "Contact identity",
    surface: "marketing",
    ruled:
      "/contact is a desk: the note (the form on a grey panel with a photo stamp and a letterhead caption, the topic one dropdown) beside plain email rows, then searchable help and a directory.",
    shipped: "The desk",
    why: "The form is the page's instrument; the stamp is its one media gesture, and a dropdown keeps the routing without chips crowding the form.",
    lives: [
      "src/app/(marketing)/(paper)/contact/",
      "docs/systems/marketing-content.md",
    ],
  },
  {
    id: "press-identity",
    title: "Press identity",
    surface: "marketing",
    ruled:
      "/press is a contact sheet: a one-word display masthead with the kit's download, then one paper body on a sticky spine (Assets, Words, Fact sheet); every asset is ours, and there is no brand-guidelines section.",
    shipped: "The contact sheet",
    why: "A reporter comes for assets and quotable facts; clear-space and misuse rules are internal brand-book material.",
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
    ruled:
      "/blog opens on a small masthead over a drawn rule and a letterboxed lead story (21:9 from sm), then a paper library of 4:5 photo cards beside a tag rail that sticks at lg.",
    shipped: "The cutting room",
    why: "The photographs own the page, the small h1 keeps the outline stable under a filter, and the shape stays distinct from /help.",
    lives: [
      "src/app/(marketing)/(cinema)/blog/blog-list.tsx",
      "docs/systems/marketing-content.md",
    ],
  },
  {
    id: "careers-identity",
    title: "Careers identity",
    surface: "marketing",
    ruled:
      "/careers argues in photographs: a contact-sheet hero, then one paper chapter (the roll, the selects, the reel; three principles; the open roles); no section explains how the product works inside.",
    shipped: "Argues in photographs",
    why: "Our own event media is the one thing nobody else can publish; engine internals belong in an interview, not on the page.",
    lives: [
      "src/app/(marketing)/(cinema)/careers/",
      "docs/systems/marketing-content.md",
    ],
  },
  {
    id: "glow-doctrine",
    title: "The spill doctrine",
    surface: "shared",
    ruled:
      "SPILL is light falling from a lit thing; BEAM marks the one live subject at its edge and ends with its state; both run on the Glow engine at the 8s --spill-cadence, in sampled media colours or the house five.",
    shipped: "The spill engine",
    why: "Light must come from something on the page; a glow with no source or live state is decoration, and state colours stay state.",
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
      "Light ships only at named placements (the footer seam, the film strip, the reel screen, the Pro card's beam, the feature heroes' lamps, the album's halo, the Aurora's call sites, the QR plate's bloom, the publish light); an upload takes none.",
    shipped: "Named placements",
    why: "Scarcity keeps light special, about a viewport of unlit page between lamps; a code has no media, so the QR plate and the publish beat wear the house five.",
    lives: ["docs/systems/design-system.md#the-shipped-light"],
  },
  {
    id: "palette",
    title: "The palette",
    surface: "shared",
    ruled:
      "Graphite: one room at L 0.105, a page at 0.995, every grey on hue 286, no accent hue, an opaque dark card, and --faint as the third text step, for captions only.",
    shipped: "Graphite",
    why: "The photographs are the only colour; cool greys keep the chrome alive without a hue, and one room replaces competing darks.",
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
    ruled:
      "Surfaces separate by step and hairline ring; shadow-lift only where one object overlaps another, shadow-layer only under a layer; [data-lit] edges photographs, screens and the QR card on dark; no Aurora on paper.",
    shipped: "Both shadows by role, the bright edge, the Aurora",
    why: "Each height gets one technique, so a shadow always means an overlap or a layer, and light never reads as a smudge on white.",
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
    ruled:
      "Headings take ten named steps (display to card-title), each a clamp between 375 and 1440 with its own leading and tracking; marketing steps travel up to four rungs, the app's one, card-title none.",
    shipped: "B, rungs",
    why: "One set serves both halves of the site; marketing may be louder, scale included, only as far as the heading order allows.",
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
    ruled:
      "Every floating surface reads floating-layer.ts: a 12px panel with rows 4px tighter, an opaque fill, a hairline ring and shadow-layer, one entrance on three clocks by frequency, menus two levels deep at most, no translucency.",
    shipped: "Card's anatomy, the nested corner, entrances by frequency",
    why: "One corner, one entrance and one light make the layer a family, and the clock follows frequency, so the most-opened menus arrive fastest.",
    lives: [
      "docs/systems/design-system.md#the-floating-layer-contract",
      "src/components/ui/floating-layer.ts",
      "src/components/ui/floating-layer.test.ts",
      "src/components/ui/dropdown-menu.tsx",
      "src/components/ui/select.tsx",
    ],
  },
  {
    id: "type-phone",
    title: "Type at a phone",
    surface: "shared",
    ruled:
      "At 375 and at 1440 every heading stays larger than the one it heads (title, prose, subhead, pinned by test); every heading sits on a ladder step, and the display step trims its top by its leading.",
    shipped: "The order at a phone",
    why: "The hierarchy has to hold on a phone too; a heading off the ladder, or smaller than its own subhead, breaks the order.",
    lives: [
      "docs/systems/design-system.md#type-the-heading-face-the-ladder",
      "src/app/theme.css",
      "src/lib/type-ladder-policy.test.ts",
      "src/components/marketing/system/page-hero.tsx",
      "src/app/(dev)/design/(shell)/library/foundations/page.tsx#ladder",
    ],
  },
  {
    id: "rounding",
    title: "The rounding",
    surface: "shared",
    ruled:
      "Corners: an 8px surface, a 12px floating layer, a 4px photograph with --gap-gallery pinned to it, actions at about 0.4 of their height (the 44px cta at 1.1x); the steps run in quarters, and 3xl and 4xl emit nothing.",
    shipped: "C, soft, in quarters",
    why: "One token per layer keeps the pixels clean, a control stays twice as round as its surface, and the gallery gap follows the photograph's corner.",
    lives: [
      "docs/systems/design-system.md#rounding-sharp-surfaces-round-actions",
      "src/app/globals.css",
      "src/app/theme.css",
      "src/components/ui/button.tsx",
      "src/app/(dev)/design/(shell)/library/foundations/page.tsx#radius",
    ],
  },
  {
    id: "river-visual",
    title: "The river, a feature visual",
    surface: "marketing",
    ruled:
      "The river is a card's picture, never a section: it pours out of the real code in the QR door and through the events' demo door, and stands ghosted wherever a guest meets an empty or locked album.",
    shipped: "The river in a card",
    why: "The flow comes out of the object it is born from; it stays at full luminance, and a quiet placement fades it rather than a layer over it.",
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
    id: "event-identity",
    title: "The event pages' visual identity",
    surface: "marketing",
    ruled:
      "Each /events page opens on PageHero over one lit still life per type carrying the demo's /demo code, then a one-claim statement, a full-width photograph turning the page to paper, the benefits, and the demo door.",
    shipped: "One lit object per type",
    why: "Every event page wears the same lockup, so what makes each one its own is the object, the claim and the photograph.",
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
    ruled:
      "Every 404 and crash renders NotFoundScreen inside its surface's own chrome, in that surface's words, with a help line (three named exceptions); a crash adds a copyable code, and the last resort links home.",
    shipped: "One primitive for every dead end",
    why: "A dead end is the page a reader least expected and most needs a way out of, so every failure says it in one grammar.",
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
  {
    id: "event-type-pages",
    title: "The event-type landing pages",
    surface: "marketing",
    ruled:
      "The four event types share one [slug] template fed by events.ts, greet the host alone, and close on the demo door, the FAQ and the band; the all-dark hub adds a 2x2 tilting directory.",
    shipped: "One template, four types",
    why: "These pages carry the site's search equity, and a reader arriving from search has to meet the same product the home page sells.",
    lives: [
      "docs/systems/marketing-content.md",
      "src/lib/constants/events.ts",
      "src/app/(marketing)/(cinema)/events/page.tsx",
      "src/app/(marketing)/(cinema)/events/[slug]/page.tsx",
      "src/components/marketing/sections/events/type-directory.tsx",
      "src/components/marketing/sections/home/events-teaser.tsx",
    ],
  },
  {
    id: "how-it-works",
    title: "The page that tells the loop",
    surface: "marketing",
    ruled:
      "/how-it-works tells the loop as six steps in one scroll with a Host/Guest toggle and a bespoke picture per step, proves it with the demo album, and closes on one band; the home shows the same steps as a numbered stepper.",
    shipped: "Six steps, two sides",
    why: "A first-time host reads the whole loop from both sides in one place, and the home's stepper shows the full flow at a normal section's height.",
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
      "open: the footer beneath a page's own closing call to action: its register, a page with none above it, and the phone",
    shipped: null,
    why: "Most pages close on a call to action, so the footer's demo invitation has to work beneath one rather than repeat it; the rest of the chrome is ruled.",
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
      "An account without a photo paints a seeded mesh (one hue at four depths) from its hashed profile id, the initial always on top at 4.5:1 or better, no motion, and the colour kept under a photo; a name-only guest keeps the plain initial.",
    shipped: "The mesh",
    why: "A crowd reads as distinct people rather than identical grey discs, and hashing the id keeps the colour public without exposing the id.",
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
      "open: how the full guest list opens from the faces row, what a name opens first, and how a profile keeps the scanned event reachable",
    shipped: null,
    why: "A person's page ships; three pieces stay open: the whole list's shape, a quick look before the page, and the way back to the event.",
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
      "open: what Download hands a guest, the wait, a request that never answers, a hollow zip, the item limit, keeping the album, and where the file lands on a phone",
    shipped: null,
    why: "Taking everything home is where a host and a guest end, so it is asked from the foundation on the real download dialog, phone first.",
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
    id: "reel-host",
    title: "The host's side of the reel",
    surface: "host",
    ruled:
      "open: where the host's Style lives, the Show the reel switch, where Play on a screen opens, the dashboard's line, a host's own cut added to the album, and Review's interplay",
    shipped: null,
    why: "The live reel makes itself, so a host keeps a default style, an off switch, the screen and a cut of their own; this board places each on the real hub.",
    lives: [
      "docs/systems/host-app.md",
      "src/app/(app)/dashboard/[eventId]/page.tsx",
      "src/components/app/event-settings/event-settings-sheet.tsx",
      "src/components/app/event-settings/profile-social-card.tsx",
      "src/app/(app)/dashboard/page.tsx",
      "src/components/app/share/event-sheets.tsx",
    ],
    board: {
      note: "Six decisions on the real hub, settings sheet, share sheet and dashboard, over Mia and Theo's wedding: where the host's Style control lives, where the Show the reel switch sits, where Play on a screen opens from, how the dashboard says the reel is live, what a host's own cut does to the album, and whether the reel ever explains a waiting queue",
      variants: [
        "Where Style lives",
        "The 'Show the reel' row",
        "Where 'Play on a screen' lives",
        "The dashboard's line",
        "A host's own cut, added",
        "Review's interplay",
      ],
    },
  },
  {
    id: "admin-triage",
    title: "Acting on a report",
    surface: "admin",
    ruled:
      "open: a report in the queue, a wordless one, what a verdict costs and records, a closed report, the legal hold, the phone, one idiom for four inboxes, and who is told",
    shipped: null,
    why: "The operator's act on a report, asked from the ground up inside the portal's own shape: an on-brand devtool.",
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
    id: "reel-story",
    title: "The marketing story of the reel",
    surface: "marketing",
    ruled:
      "open: the reel's thesis line, the /reel page's arc, the home's teaser, the pricing rows, the loop's last step, the events' reel column, and the help category's name",
    shipped: null,
    why: "Every marketing surface still sells the host-made, stored reel; the live reel and the cut need their story told on the real marketing pieces.",
    lives: [
      "docs/systems/marketing-content.md",
      "src/lib/constants/marketing-voice.ts",
      "src/components/marketing/sections/reel/",
      "src/components/marketing/sections/home/reel-teaser.tsx",
    ],
    board: {
      note: "Seven decisions on the real marketing pieces, at 1440 with 375 on the knob: the one thesis line (drawn on the home's close and the feature door), the /reel page's three-chapter order, what the home's teaser plays, how the pricing rows name the cut, the loop's last step on both sides, the event pages' reel column, and the help category's name",
      variants: [
        "The thesis line",
        "The /reel page's arc",
        "The home's teaser",
        "The pricing rows",
        "The how-it-works steps",
        "The events' reel column",
        "The help category's name",
      ],
    },
  },
  {
    id: "media-viewer",
    title: "What a photograph opens as",
    surface: "shared",
    ruled:
      "open: what a tap opens, what stands beside the photograph, how it says who took it, the next one, close up, video, the way out, and whether an open photograph has an address",
    shipped: null,
    why: "One viewer serves all six galleries and every album click ends on it, so what a tap builds and how close a guest may get is asked from the foundation.",
    lives: [
      "docs/systems/guest-flow.md",
      "docs/systems/uploads-and-r2.md",
      "src/components/shared/media-lightbox.tsx",
      "src/components/shared/masonry.tsx",
      "src/components/guest/guest-masonry.tsx",
    ],
    board: {
      note: "Eight decisions on the real viewer's pieces with fixtures, phone first at 375 by 812 and again at 1440, over one open wedding of twenty-six items from nine guests: what a tap opens, what stands beside the photograph, how it says who took it, how the next one comes, whether a guest can get close, how a video meets them, how they get back to where it opened, a tile or the reel, and whether an open photograph has an address",
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
      "open: the live reel's full-screen view: the chrome and its fade, the controls, the arrival, a tap, the posture, the pace, the loop's seam, and reduced motion",
    shipped: null,
    why: "The view a tap on the album's tile or ?reel opens; its chrome fades until the pointer moves, with Include videos and the style switch beside it.",
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
      "open: one shell or two, the brand, the sender, the foot, the sign-in code, which moments send, whether a guest is ever sent one, and the dark inbox",
    shipped: null,
    why: "Every mail is drawn from the real templates.ts in an inbox mock at a phone's width and a laptop's, so each decision is judged where mail is read.",
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
    id: "help-center",
    title: "Where a problem lands",
    surface: "marketing",
    ruled:
      "open: who the hub greets first, the index sheet, a how-to's shape, a guest's way in from the product, feedback, troubleshooting's dead end, and search's reach",
    shipped: null,
    why: "Help is where a host or a guest with a problem lands, so each piece is asked on the real help components over fixture articles.",
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
      "open: how a waiting photograph shows, the verb for refusing one, what a tap opens, the keyboard, after a bulk act, an arrival mid-visit, the count, and whether a refused guest is told",
    shipped: null,
    why: "Judging another person's photograph is the host's most delicate act; the review surface crops to 4:5, says one word for two acts and counts in three places.",
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
    id: "host-storage",
    title: "Where the largest files are",
    surface: "host",
    ruled:
      "open: where a host sees each item's size, largest-first or grouped by event, how freeing space reads for a plan switch, the pricing sheet's refusal, and a Pro host's six prices",
    shipped: null,
    why: "Sizes are stored but shown nowhere; a host near a cap cannot find what is filling it, and no plan switch may leave them over the new cap.",
    lives: [
      "docs/systems/billing-caps.md",
      "docs/systems/lifecycle-recovery.md",
      "src/lib/constants/tiers.ts",
      "src/components/app/dashboard/storage-meter.tsx",
      "src/components/app/pricing/pricing-sheet.tsx",
      "src/app/(app)/account/page.tsx",
      "src/app/(app)/dashboard/page.tsx",
      "src/components/app/event-feed/event-gallery.tsx",
    ],
    board: {
      note: "Five decisions on the shipped Plan card, storage meter, grace banner, View menu and pricing sheet, over one wedding videographer's account at 110.8 GB across four events: where a host sees each item's size, whether the list reads largest-first or grouped by event, how freeing space reads when a smaller plan is the reason, the pricing sheet's refusal of a size that does not fit, and how a Pro host's six prices sit beside it",
      variants: [
        "Where sizes live",
        "The order",
        "The goal",
        "The refusal",
        "The six prices",
      ],
    },
  },
  {
    id: "event-safety",
    title: "Keeping an event safe",
    surface: "host",
    ruled:
      "open: where a host blocks someone, the block's sheet, the door a blocked person meets, the blocked list and letting back in, the Guests room with its list off, and the three closed doors",
    shipped: null,
    why: "A bad actor with a verified email can be hidden photo by photo but never stopped; a block and three closed doors, all free, end that.",
    lives: [
      "docs/systems/guest-flow.md",
      "docs/systems/host-app.md",
      "docs/systems/trust-safety-forensics.md",
      "src/components/shared/media-lightbox.tsx",
      "src/app/(app)/dashboard/[eventId]/guests/page.tsx",
      "src/components/app/event-feed/review-room.tsx",
      "src/components/app/event-settings/visibility-section.tsx",
      "src/components/guest/entry-modal.tsx",
    ],
    board: {
      note: "Thirteen decisions over Maya and Jay's wedding, where Dom Hale keeps sending a nightclub to a wedding, at 375 with 1440 on the knob: where Block lives and what it says, the door a blocked person meets, the blocked list and what letting back in restores, the Guests room with its list off, how a host chooses who can join, and the doors of approving newcomers, closing to them and an invite list",
      variants: [
        "Where Block lives",
        "The block itself",
        "The blocked door",
        "Who can join",
        "The invite list",
      ],
    },
  },
  {
    id: "reel-cut",
    title: "From the reel to a cut",
    surface: "guest",
    ruled:
      "open: the creator a guest meets from the reel: the way in, the room, the fourteen looks, the moments, a hidden tile, the export's wait, the finish, the free mark, and a device that cannot encode",
    shipped: null,
    why: "A cut is anyone's, made on the device from the live reel, saved or shared as a file and never stored; this board is the creator that replaces the Studio.",
    lives: [
      "docs/systems/host-app.md",
      "src/components/reel/reel-studio.tsx",
      "src/components/reel/studio-moments-picker.tsx",
      "src/components/reel/style-rail.tsx",
      "src/components/reel/reel-stitching-dialog.tsx",
      "src/components/guest/guest-reel-overlay.tsx",
      "src/lib/reel/engine/registry.ts",
    ],
    board: {
      note: "Nine decisions on the creator a guest meets after tapping Make your own, over the album media-viewer already draws: the way in from the reel, the room at both sizes, the fourteen looks, the moments as a local pick with three fills, a hidden tile only the host meets, the export's minute, the finish, the free mark and a device that cannot encode",
      variants: [
        "The way in",
        "The room",
        "The looks",
        "The moments",
        "The wait",
      ],
    },
  },
  {
    id: "first-event",
    title: "A host's first event",
    surface: "host",
    ruled:
      "Create asks only for a name, then a style step of four large code swatches; a host at the cap meets the refusal before the form; Create ends once on the real code with Print and Share; paper comes from the print route at true millimetres; the hub goes live on the first photograph.",
    shipped: "One name, the style step, the beat, the print stock",
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
      "One AccountDoor serves every account ask (the login page, the guest gate, the post-upload keep, a like, the guest menu's sign-in): an email code first, Google beneath, a password on a quiet link, an existing account named only after the code, passkeys behind a flag; the welcome is a five-screen tour on the site's own pictures.",
    shipped: "One door, the tour as a film",
    why: "One account object rather than a login form per place; it asks for a confirmed email rather than an account, and never says which addresses exist.",
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
      "/pricing opens on one paper chapter (the heading, Free beside Pro, the Event Pass as a wide ticket, and the configurator: a slider, a video switch and a one-event or hosting-again fork beside one plan card whose prints fan as the slider climbs), then one dark room: the unlock tiles, the table, six questions, the band.",
    shipped: "The split configurator, one dark room",
    why: "A reader sizes the event while the plans are in view, and the dark room then proves what paid unlocks, with one change of ground.",
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
      "Every in-app pricing door opens the one pricing sheet led by its trigger, every gated control wears the LockChip (it says why and offers the upgrade), billing lives on the account page's Plan card, and Checkout returns to the control with Welcome to Pro.",
    shipped: "The pricing sheet, the lock chip",
    why: "A sheet that knows which control refused you says what a tier-blind pricing page never can, without leaving the app.",
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
      "Every demo door shows one DemoFrame, a photograph in a plain mat with the live code in its corner, sized for its place: the home hero, the footer, a feature page's line and the nav panel's featured pane.",
    shipped: "DemoFrame",
    why: "One framed photograph reads as intentional rather than reused, and stays legible from the hero down to the nav's small pane.",
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
      "open: who /press is for, what the asset sheet shows, how the words hand over, how checkable the facts are, whether anyone is named, the close, and the reading order",
    shipped: null,
    why: "What Partyreel hands the world about itself, asked on the real page pieces at 1440 and 375.",
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
      "open: the way in, the receipt, an urgent path, the topic picker, the page's identity against the rest of the site, and what stands beside the form",
    shipped: null,
    why: "How someone reaches a person at Partyreel, asked on the real desk over a host mid-event, a planner weighing a plan and a reporter.",
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
      "open: which way a photograph reaches the album on the /features/album hero: Glide, Gather or Cascade",
    shipped: null,
    why: "One decision, drawn on the wired hero so the pick is already built: the falling-in stays, and only its motion is asked.",
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
      "The dashboard is a pulse (next steps folded to the top three by tone behind N more, storage, Your events, Just arrived) and an event is a hub of rooms under crumbs, with Share and Settings as sheets over its album.",
    shipped: "The pulse and the hub",
    why: "What needs the host comes first and what just arrived after; an event's controls are doors around its album rather than a page in front of it.",
    lives: [
      "docs/systems/host-app.md",
      "src/components/shared/app-shell.tsx",
      "src/app/(app)/dashboard/page.tsx",
      "src/app/(app)/dashboard/[eventId]/page.tsx",
      "src/lib/dashboard/next-step.ts",
      "src/components/app/dashboard/next-step-band.tsx",
    ],
  },
  {
    id: "app-vocabulary",
    title: "The app's shared vocabulary",
    surface: "shared",
    ruled:
      "An album's view options live in one View menu (Tile size, a reserved Sort, and Filter with Deleted for the host; Tile size and Showing for a guest) beside the verbs Add photos, Download and Select.",
    shipped: "One View menu",
    why: "Five controls at the top level read as clutter, so view options go behind one button and only the verbs stay visible.",
    lives: [
      "docs/systems/host-app.md",
      "src/components/app/event-feed/event-gallery.tsx",
      "src/components/shared/view-menu.tsx",
      "src/components/shared/tile-size-control.tsx",
    ],
  },
  {
    id: "guest-verify",
    title: "Verify, or badge",
    surface: "guest",
    ruled:
      "A guest is at one of three levels: a typed name (the Unverified mark), a name with an unconfirmed email kept inert (never shown, never mailed), or a confirmed account; Require verified emails, on by default, asks for the last before the album.",
    shipped: "Three levels of trust",
    why: "Credit, proof and the host's safety are separate jobs: a name gives credit, a confirmed email gives proof, and the mark says which is missing.",
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
      "Add and Invite sit in a row under the event's name and dock at the foot once it scrolls away; the door is vaul on a phone and the responsive Sheet from 640; a mark on a guest's own tiles filters the album to theirs.",
    shipped: "The row, then the dock",
    why: "Found on landing and reachable at any depth: the row is seen first, and the dock keeps both actions in reach through a long album.",
    lives: [
      "docs/systems/guest-flow.md",
      "src/components/guest/event-experience.tsx",
      "src/components/guest/guest-action-dock.tsx",
      "src/components/guest/entry-shell.tsx",
      "src/components/guest/live-gallery.tsx",
      "src/components/shared/masonry.tsx",
    ],
  },
  {
    id: "cursor-backdrop",
    title: "Cursor backdrop",
    surface: "marketing",
    ruled:
      "A PhotoSection stands on a full-bleed pool of photographs that follows the cursor or steps with the scroll (five steps at a phone by default), its copy on a glass plate over an index rail; it crosses a chapter cut, never every one.",
    shipped: "The photograph section",
    why: "The page turns through a picture instead of over a hairline; used at every cut, the device would read as a template.",
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
  {
    id: "image-trail",
    title: "The image trail",
    surface: "marketing",
    ruled:
      "The root 404 runs the image trail: a photograph per 140px of travel, gone in 3s, turned the way the hand threw it, 180px (100px under 640px), walking its own path until a hand arrives.",
    shipped: "The trail on the 404",
    why: "A page nobody plans to see is the home for a rare delight: the site's photographs arriving where the page asked for is missing.",
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
      "open: the privacy page's hero: a breathing aperture, a grid whose tiles take turns clearing, or sealed cards that lift",
    shipped: null,
    why: "Three still concepts built on what privacy means rather than a figure in flight: one decision, drawn at 1440 and 375.",
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
  {
    id: "album-page",
    title: "The album page's hero",
    surface: "marketing",
    ruled:
      "/features/album's hero is the live guest album framed at the 896 step under the title-step lockup, its foot dissolving, photographs falling into its top edge from behind, lit by a sampled halo; with no script it settles into a still.",
    shipped: "The live album, falling in",
    why: "The page's sentence, drawn: the album fills itself under the words, lit from behind so the frame glows and the photographs stay clean.",
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
  {
    id: "river-card",
    title: "The river in the QR door",
    surface: "marketing",
    ruled:
      "The QR door's scannable /demo code sits a tenth down the 4:5 door with the river streaming behind the copy; every feature door and event card wears the card's own copy scrim over its visual.",
    shipped: "The code at a tenth, the card's scrim",
    why: "The copy gradient belongs to the card rather than to any one visual, and /demo is the shortest value, so the code stays small and scannable.",
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
    ruled:
      "A gallery declares a column width, never a count: two columns under 640, then as many columns of at least the Tile size (240px by default, set per device) as the window holds, the guest album 20px from each edge.",
    shipped: "Columns by width, to the window",
    why: "A wider window shows more photographs rather than bigger ones, so a tile keeps its in-hand size and the column count follows the window.",
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
      "open: the admin chart ramp's cast in each mode, one FAQ look, the home hero at a tablet width, and the album page's three ambient pieces",
    shipped: null,
    why: "Small open questions drawn as decisions on their real surfaces rather than left as one-line tasks.",
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
      "Every surface over a photograph wears the one Crystal material with its double edge from the --glass-* tokens (glass, glass-mark, glass-behind), dark in both themes, and never a menu, a dialog, a sheet or a popover.",
    shipped: "Crystal, the double edge",
    why: "One material with one home keeps every pane alike; a surface that types its own blur or tint is drift, not a variant.",
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
      "Body text takes six steps (copy 16 to 18, reading 16, working 14, caption 12, label 12 at 0.08em, micro 10 as the floor), each leading twice its size less 8; a button's icon sits one step above its text.",
    shipped: "Six body steps, the button rung",
    why: "Sentences get a ladder as headings do, every leading lands on the 4px grid, and an icon and its text stop looking mismatched.",
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
      "Say 'No app required.', never promise 'no account' and never call an upload anonymous; a subhead runs the opportunity, what we do, then the benefit; Pro is 'For videos and unlimited events.'; an empty album 'starts'.",
    shipped: "No app required.",
    why: "An absence a guest fears may be named, but a promise the product can break may not: Require verified emails is on by default.",
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
      "The admin is a 44px bar, a health band only on a bad day, a 232px rail and a command palette at lg, four figures over a worst-first queue, toned table rows, and one destructive sheet sized to the damage.",
    shipped: "Figures over the queue",
    why: "Numbers first and trouble visible on every page, with friction that scales with what cannot come back.",
    lives: [
      "docs/systems/admin-observability.md",
      "src/lib/admin/nav.ts",
      "src/components/admin/admin-shell.tsx",
      "src/app/admin/page.tsx",
    ],
  },
  {
    id: "toasts",
    title: "The toast, as a system",
    surface: "shared",
    ruled:
      "One Toaster at the top centre, 5rem down, always expanded on the popover card: an error stays until it is closed, other kinds time out, and a toast may carry one action or cancel (Upgrade, Undo).",
    shipped: "Top, expanded, errors held",
    why: "A failure that disappears before it is read repeats itself; the top centre clears every fixed control at the foot, and expanded needs no hover.",
    lives: [
      "src/components/ui/sonner.tsx",
      "src/app/layout.tsx",
      "src/app/globals.css",
      "docs/systems/design-system.md",
    ],
  },
];

/**
 * ★ THE DESK'S ORDER IS BY LEVERAGE, AND THIS LIST IS ITS ONE HOME. Will
 * reviews what is presented top to bottom, so a board whose answer changes
 * another board's question sits ABOVE it (the earlier influence first), and
 * boards that touch nothing else sit at the foot in any order. The desk, the
 * board-to-board paging and `BOARDS` in sandbox/registry.ts all sort by this
 * list. A lane registering a NEW board adds its id directly after the
 * neighbour its brief names, never at the head (siblings registering at one
 * shared spot mangle their merges), and the Orchestrator moves it into its
 * leverage place at the merge; a retiring lane removes its id.
 * registry.test.ts holds this list and `BOARDS` to the same members.
 */
export const DESK_ORDER: readonly SandboxId[] = [
  "media-viewer",
  "reel-view",
  "reel-front",
  "reel-screen",
  "reel-cut",
  "reel-host",
  "reel-story",
  "identity-door",
  "identity-claims",
  "identity-profile",
  "guest-capture",
  "voice-guest",
  "host-curation",
  "host-storage",
  "event-safety",
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

/** The ruled rows (no standing board): the rules page's rulings section and the search's rulings. */
export const RULED: Ruling[] = RULINGS.filter((r) => r.board === undefined);

export function getRuling(id: string): Ruling | undefined {
  return RULINGS.find((r) => r.id === id);
}
