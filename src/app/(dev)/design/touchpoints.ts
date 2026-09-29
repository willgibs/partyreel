/**
 * THE STANDING BOARDS of the design lab: one row per board on the desk
 * (`sandbox/<id>/`), with what it asks, why, the files and docs it redraws
 * (`lives`) and the note the desk and the sidebar show.
 *
 * A board's row goes when its picks are built: the answer then lives in
 * production (and in the Library's catalog when it is a component), and
 * nothing is rewritten as a rule. SANDBOX (the desk and the sidebar) and
 * DESK_ORDER read this file, so it is the one place a board is added or
 * retired.
 */
export type Surface = "guest" | "host" | "marketing" | "shared" | "admin";

/** Surface display labels, in one home: the sidebar and the board header read
 *  these, so a label changes everywhere at once. */
export const SURFACE_LABEL: Record<Surface, string> = {
  guest: "Guest",
  host: "Host",
  marketing: "Marketing",
  shared: "Shared",
  // The ops portal is its own deployment, so it is a surface of its own rather
  // than shared machinery.
  admin: "Admin",
};

/** The boards standing in sandbox/, one row each below. */
export type SandboxId =
  | "admin-triage"
  | "emails"
  | "locked-door"
  | "help-center"
  | "event-settings"
  | "press-page"
  | "contact-page"
  | "disposable-mode"
  | "album-motion"
  | "loose-ends"
  | "privacy-hero";

export type Ruling = {
  id: SandboxId;
  title: string;
  surface: Surface;
  /** What the board asks, in one line. */
  asks: string;
  /** Why it is open, in one line (touchpoints.test.ts holds it to 170 characters). */
  why: string;
  /** The system docs and production paths the board redraws. */
  lives: string[];
  /** The desk's note and the board's variants. `tracks` names the lp/<track>
   *  branches building it when they differ from the board id (the desk reads it). */
  board: { note: string; variants: string[]; tracks?: string[] };
};

export const RULINGS: Ruling[] = [
  {
    id: "admin-triage",
    title: "Acting on a report",
    surface: "admin",
    asks: "the reports queue as a batch-first sweep with every fact on every report, what puts clear harm in front, how a reporter is asked for proof, and what a phone may do",
    why: "Round two, from his notes: a fast, batch-first queue where each report says all it takes to decide, and a way to ask for proof before anything comes down.",
    lives: [
      "docs/systems/admin-observability.md",
      "docs/systems/trust-safety-forensics.md",
      "src/app/admin/reports/page.tsx",
      "src/app/admin/reports/person-report-list.tsx",
      "src/components/app/report-review.tsx",
      "src/components/admin/destructive-sheet.tsx",
      "src/components/guest/report-dialog.tsx",
      "src/app/api/reports/route.ts",
      "src/lib/validation/report.ts",
      "src/lib/db/queries/reports.ts",
      "src/lib/email/templates.ts",
      "content/help/report-a-problem-as-a-guest.mdx",
    ],
    board: {
      note: "Four decisions on a Saturday night of 15 open reports in the portal as it ships, wearing his round one picks: the queue four ways at 1440 (a sheet, a list beside the report, the review grid with words, grouped by album), each with every fact and a front no sweep can take; then, on his queue, what puts clear harm in front (the guest's Report at 375 beside it), how a reporter is asked for proof (her form, her inbox, the report), and what a phone may do at 375",
      variants: [
        "The queue",
        "Clear harm, in front",
        "Asking for proof",
        "What a phone may do",
      ],
    },
  },
  {
    id: "emails",
    title: "Every email Partyreel sends",
    surface: "shared",
    asks: "one shell or two, the brand, the sender, the foot, the sign-in code, which moments send, a guest's album link, a newcomer let in, a reporter's closing note, and the dark inbox",
    why: "Every mail is drawn from the real templates.ts in an inbox mock at a phone's width and a laptop's, so each decision is judged where mail is read.",
    lives: [
      "docs/systems/lifecycle-recovery.md",
      "docs/systems/notifications-analytics-growth.md",
      "docs/systems/guest-flow.md",
      "src/lib/email/templates.ts",
      "src/lib/email/send.ts",
      "src/components/app/notification-prefs-form.tsx",
      "src/components/guest/save-account-prompt.tsx",
      "src/app/api/reports/route.ts",
    ],
    board: {
      note: "Ten decisions on the real templates.ts functions, drawn inside an inbox mock at a phone's width and a laptop's: one wrapper or two, what it wears, who it's from, whether it carries an unsubscribe, what the sign-in mail could show, which moments deserve a send, a guest's album link after Maybe later, a newcomer let in, a reporter's closing note, and how it reads in a dark inbox",
      variants: [
        "One shell",
        "The brand",
        "The sender",
        "The foot",
        "The code",
        "The moments",
        "The guest's link",
        "A newcomer let in",
        "The reporter",
        "The dark inbox",
      ],
    },
  },
  {
    id: "locked-door",
    title: "The locked door",
    surface: "guest",
    asks: "the one screen a guest meets whenever she can't get in (the album private, closed to newcomers, or she was blocked), and whether someone who was in reads a line of her own",
    why: "His event-safety notes made the private album's lock the blocked door and the closed door too, and asked for it polished, since it will be a high-traffic screen.",
    lives: [
      "docs/systems/guest-flow.md",
      "src/app/(guest)/e/[token]/page.tsx",
      "src/components/shared/not-found-screen.tsx",
      "src/components/guest/entry-shell.tsx",
      "src/components/guest/door/lit.tsx",
      "src/components/guest/door/heading.tsx",
    ],
    board: {
      note: "Two decisions at Maya and Jay's wedding, 375 first with 1440 on the knob: the locked screen drawn five ways, from today's to one over the album's cover, each in words true of a private album, a closed one and a block; then whether a guest who was in reads a line of her own, measured on a newcomer, Priya and Dom side by side",
      variants: ["The locked screen", "A previous guest's line"],
    },
  },
  {
    id: "help-center",
    title: "Where a problem lands",
    surface: "marketing",
    asks: "who the hub greets first, the hub's doors and its index, a how-to's shape, a guest's way in from the product, feedback, troubleshooting's dead end, and search's reach",
    why: "Help is where a host or a guest with a problem lands, so each piece is asked on the real help components over fixture articles.",
    lives: [
      "docs/systems/marketing-content.md",
      "docs/systems/guest-flow.md",
      "src/app/(marketing)/(cinema)/help/page.tsx",
      "src/app/(marketing)/(cinema)/help/[slug]/page.tsx",
      "src/components/marketing/mdx/spec-shared.tsx",
      "src/components/marketing/help/help-palette.tsx",
      "src/components/marketing/help/article-feedback.tsx",
      "src/components/guest/guest-name-menu.tsx",
      "src/components/guest/upload/failure-sheet.tsx",
      "src/components/guest/upload-tracker.tsx",
    ],
    board: {
      note: "Seven decisions on the real help pieces (PageHero, the emblem strip, the index, the article stage, ChipToc and ArticleToc, Checklist, ArticleFeedback, the search palette), the guest door's own steps, her menu and the failure sheet, over the catalog copied as fixtures, at 1440 and 375: who the hub greets first, whether its ten doors grow and the index survives under them, whether a how-to leans on prose, a checklist or the real screen, how a guest reaches help from inside the album, whether feedback goes anywhere, what a troubleshooting article does with no bigger picture, and how far search reaches",
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
    id: "event-settings",
    title: "An event's settings",
    surface: "host",
    asks: "how an event's settings are organised from the ground up, how a group opens, a setting that does nothing yet, the one Pro lock, and who can get in with its four asks",
    why: "Will called settings some of the ugliest, least intuitive UI for the most critical controls, and asked for them rebuilt from the ground up, as streamlined as possible.",
    lives: [
      "docs/systems/host-app.md",
      "src/components/app/event-settings/event-settings-sheet.tsx",
      "src/components/app/event-settings-form.tsx",
      "src/components/app/event-settings/visibility-section.tsx",
      "src/components/app/event-settings/uploads-section.tsx",
      "src/components/app/event-settings/highlight-reel-card.tsx",
      "src/components/app/event-settings/profile-social-card.tsx",
      "src/components/app/event-settings/danger-zone-section.tsx",
      "src/components/app/visibility-selector.tsx",
      "src/components/app/pricing/lock-chip.tsx",
    ],
    board: {
      note: "Nine decisions on Maya and Jay's wedding, phone first with 1440 on every knob, drawn over production with his answers worn: five structures for the settings graded against today's seven cards, each as it opens and as she pauses uploads, then how a group opens, a setting that does nothing yet, the one Pro lock, and who can get in with event-safety's four join asks",
      variants: [
        "The structure",
        "How a group opens",
        "A setting that does nothing yet",
        "The one Pro lock",
        "Who can get in",
        "The invite list",
      ],
    },
  },
  {
    id: "press-page",
    title: "What Partyreel hands the world",
    surface: "marketing",
    asks: "who /press is for, what the asset sheet shows, how the words hand over, how checkable the facts are, whether anyone is named, the close, and the reading order",
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
    asks: "the way in, the receipt, an urgent path, the topic picker, the page's identity against the rest of the site, and what stands beside the form",
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
    id: "disposable-mode",
    title: "A disposable camera",
    surface: "shared",
    asks: "what a guest shoots with and its look, when the roll develops and what the album shows until then, how a host turns it on, and where it sits between Free, Event Pass and Pro",
    why: "Will's note on export-flow: a disposable inside Partyreel (camera only, a shot limit), so POV's audience arrives without Partyreel being built around it.",
    lives: [
      "docs/systems/guest-flow.md",
      "docs/systems/uploads-and-r2.md",
      "docs/systems/billing-caps.md",
      "src/components/guest/event-experience.tsx",
      "src/components/guest/upload/intent-sheet.tsx",
      "src/components/app/create-event-wizard.tsx",
      "src/components/app/event-settings/uploads-section.tsx",
      "src/lib/constants/tiers.ts",
    ],
    board: {
      note: "Six decisions over Maya and Jay's wedding, every guest frame a 375 phone: the camera a guest shoots with (the phone's, the album's own, a disposable drawn) and its look, when the roll develops and what the album shows until then, how a host turns it on in Create and Settings (1440 on the knob), and its price against Free's new 100 MB",
      variants: [
        "The guest's camera",
        "The camera's look",
        "When it develops",
        "While it develops",
        "Turning it on",
        "Its price",
      ],
    },
  },
  {
    id: "album-motion",
    title: "The album's falling-in",
    surface: "marketing",
    asks: "which way a photograph reaches the album on the /features/album hero, over its album in rows: Glide, Gather, Cascade, Bloom or Push",
    why: "One decision, redrawn on the album as it now is (rows, and an arrival that opens its row): the falling-in stays, and only its motion is asked.",
    lives: [
      "src/components/shared/album-stream/stream-engine.ts",
      "src/components/shared/album-stream/album-stream.tsx",
      "src/components/marketing/sections/features/album/arrivals-hero.tsx",
      "src/components/marketing/sections/features/album/live-album-stage.tsx",
    ],
    board: {
      note: "One decision, five whole variations of the falling-in on the /features/album hero at 1440 and 375, its album laid out in rows as the real one now is: a pair sliding under the album's edge (what ships), a pair born large and dissolving into it, singles landing on it, singles lit by the product's own glow, and singles from the head's side that go in and open the album's first row, the real push; every number under a tile measured against the home hero's",
      variants: ["Glide", "Gather", "Cascade", "Bloom", "Push"],
    },
  },
  {
    id: "privacy-hero",
    title: "The privacy page's hero",
    surface: "marketing",
    asks: "the privacy page's hero: a breathing aperture, a grid that hands a tile over, sealed cards that lift, or a clearing drifting across one photograph",
    why: "Four still concepts built on what privacy means rather than a figure in flight: one decision, drawn at 1440 and 375.",
    lives: [
      "src/app/(marketing)/(cinema)/features/privacy/page.tsx",
      "src/components/marketing/system/page-hero.tsx",
    ],
    board: {
      note: "One decision, four concepts, no page: an aperture's breath, a grid that hands one tile over at a time, sealed photographs that lift, and a single photograph never wholly visible at once with a clearing drifting across it; every option is the live privacy page's first screen at 1440 and 375",
      variants: ["The aperture", "The sweep", "The sealed cards", "The veil"],
      tracks: ["heroes"],
    },
  },
  {
    id: "loose-ends",
    title: "Five loose ends",
    surface: "shared",
    asks: "the admin chart ramp's cast in each mode, one FAQ look, and the album page's three ambient pieces",
    why: "Small open questions drawn as decisions on their real surfaces rather than left as one-line tasks.",
    lives: [
      "src/app/globals.css",
      "src/components/marketing/faq-accordion.tsx",
      "src/components/marketing/sections/features/album/getting-in-stage.tsx",
      "src/components/marketing/sections/features/album/review-switch.tsx",
      "src/components/marketing/sections/features/album/everywhere-stage.tsx",
    ],
    board: {
      note: "Six asks, no page: the chart ramp's cast (light and dark, chosen separately) on the real MetricsCharts; one FAQ look on both the pricing and the album page's FAQ; and the album page's three ambient pieces (the phone's screen cycle, the Live | Review photograph on the switch as production draws it, the lightbox pill), each on its real section at 1440 and 375",
      variants: [
        "Chart ramp, light",
        "Chart ramp, dark",
        "One FAQ look",
        "The phone's screen cycle",
        "The Live | Review photograph",
        "The lightbox pill",
      ],
    },
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
  "admin-triage",
  "help-center",
  "event-settings",
  "emails",
  "locked-door",
  "privacy-hero",
  "album-motion",
  "loose-ends",
  "contact-page",
  "disposable-mode",
  "press-page",
];

const deskIndex = (id: string): number => {
  const i = (DESK_ORDER as readonly string[]).indexOf(id);
  return i < 0 ? DESK_ORDER.length : i;
};

export const SANDBOX: Ruling[] = [...RULINGS].sort(
  (a, b) => deskIndex(a.id) - deskIndex(b.id),
);

export function getRuling(id: string): Ruling | undefined {
  return RULINGS.find((r) => r.id === id);
}
