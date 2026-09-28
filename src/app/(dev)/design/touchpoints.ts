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
  | "identity-claims"
  | "hero-card"
  | "voice-guest"
  | "site-chrome"
  | "profile-page"
  | "export-flow"
  | "admin-triage"
  | "emails"
  | "help-center"
  | "host-curation"
  | "host-storage"
  | "event-safety"
  | "press-page"
  | "contact-page"
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
    id: "identity-claims",
    title: "Photos waiting for you",
    surface: "host",
    asks: "where Priya first meets the one review of the four events waiting under her email: nothing at the album, a line to her dashboard, a line opening it over the album, the four named, or a count on her avatar and bell",
    why: "Rounds one and two settled the review itself; pointer came back twice asking for the best options, so round three draws five whole strategies for where she meets it.",
    lives: [
      "docs/systems/host-app.md",
      "docs/systems/guest-flow.md",
      "docs/systems/profiles-social.md",
      "src/components/app/dashboard/claims-card.tsx",
      "src/app/(app)/dashboard/claims-actions.ts",
      "src/components/guest/follow-moment-card.tsx",
      "src/components/guest/claim-handle-prompt.tsx",
      "src/components/guest/guest-account-menu.tsx",
      "src/lib/notifications/build.ts",
    ],
    board: {
      note: "Round three asks pointer alone, five answers each drawn as a whole strategy over Priya and four waiting events: the moment at Maya and Jay's album, where she sorts the four in popups' side panel, and her dashboard a week on if she never does",
      variants: ["Where she meets the review"],
    },
  },
  {
    id: "hero-card",
    title: "The home hero's card",
    surface: "marketing",
    asks: "which version of his link card stands at the centre of the home hero, then, drawn in the one he picks, its own light and the hero's geometry on a tablet",
    why: "He took the link in round one and asked for more ideas branching from it; the tablet's geometry moved here from loose-ends, since it sizes the hero round this card.",
    lives: [
      "docs/systems/marketing-content.md",
      "src/components/marketing/sections/home/cinema-hero.tsx",
      "src/components/marketing/sections/home/hero-stream.ts",
      "src/components/marketing/system/demo-ticket.tsx",
    ],
    board: {
      note: "Round two, drawn in the real first screen at 1440, 900 and 375: his link beside four branches (the guests on the photographs they added, the link as it lands in the group chat, the album spread lower along it, the address typed out in front), then the card's own light and the tablet's geometry in the card he picks",
      variants: [
        "The link card",
        "The card's own light",
        "The hero at a tablet",
      ],
    },
  },
  {
    id: "voice-guest",
    title: "The voice of the guest journey",
    surface: "guest",
    asks: "seven lines a guest reads, each in its real place: the welcome, the password's ask, the landing, a failed upload, the empty album's button, a held photo, and the capture's words",
    why: "The voice is built one won line at a time in its real place; these seven are the guest's most-read words and where most of the asks live.",
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
      note: "Seven real lines of the guest journey, each drawn where it ships on a 375 phone over Priya at Maya and Jay's wedding, today's words beside four registers (plain and warm, bright and playful, quiet and exact, soft and tender), so the lines he picks build the voice",
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
    id: "site-chrome",
    title: "The marketing site's chrome",
    surface: "marketing",
    asks: "the footer beneath a page's own closing call to action: its register, a page with none above it, and how its code reaches a phone",
    why: "Most pages close on a call to action, so the footer's demo invitation has to work beneath one rather than repeat it; the rest of the chrome is built.",
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
      note: "Round two, the footer alone: what the footer's demo register should be right under a page's own closing CTA, whether a page with no CTA above it gets the same footer or a closing line built for it, and how its code reaches a phone (hidden, revealed on a tap, always shown, or dropped); every option drawn under a real CtaBand and under a real page with none, at 1440 and 375.",
      variants: [
        "The foot after a close",
        "The foot where nothing closes the page",
        "The phone's foot",
      ],
    },
  },
  {
    id: "profile-page",
    title: "What a person is here",
    surface: "guest",
    asks: "how the full guest list opens from the faces row, what a name opens first, how a profile keeps the scanned event reachable, and what should stand above it now that it does",
    why: "A person's page ships; three pieces stay open, and a fourth, the header, is asked again now way-back changes what it has to solve alone.",
    lives: [
      "docs/systems/profiles-social.md",
      "src/app/(guest)/u/[slug]/page.tsx",
      "src/components/social/guest-list.tsx",
      "src/components/social/follow-button.tsx",
      "src/components/social/profile-actions-menu.tsx",
      "src/components/social/profile-slug-control.tsx",
    ],
    board: {
      note: "Four decisions on the shipped guest list and profile, phone first at 375 with 1440 on the knob, a 240-name fixture beside a 24-name one: how the full list opens from the faces row, what a name opens first, how a profile keeps the scanned event reachable, and, asked again now that it does, what should stand above the page at all",
      variants: ["View all", "Quick-look", "Way back", "The head, asked again"],
    },
  },
  {
    id: "export-flow",
    title: "Getting everything out",
    surface: "shared",
    asks: "what Download hands a guest, the wait, a request that never answers, a hollow zip, the item limit, and where the file lands on a phone",
    why: "Taking everything home is where a host and a guest end, so it is asked from the foundation on the real download menu, phone first.",
    lives: [
      "docs/systems/uploads-and-r2.md",
      "src/components/app/export/export-dialog.tsx",
      "src/components/app/export/use-export-download.ts",
      "src/lib/export/export-service.ts",
      "src/app/api/export/host/route.ts",
      "workers/export/src/index.ts",
    ],
    board: {
      note: "Six decisions on the real download menu with fixture summaries, phone first at 375 with 1440 on the knob: what Download hands a guest, what the album shows while the zip is made, what a mint that never answers does, what a hollow zip says, what the 2,000 item limit does, and where the file lands on a phone",
      variants: [
        "What a guest takes",
        "The wait",
        "A tap with no answer",
        "A zip with nothing in it",
        "The limit",
        "Where the file lands",
      ],
    },
  },
  {
    id: "admin-triage",
    title: "Acting on a report",
    surface: "admin",
    asks: "a report in the queue, a wordless one, what a verdict costs and records, a closed report, the legal hold, the phone, one idiom for four inboxes, and who is told",
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
    id: "emails",
    title: "Every email Partyreel sends",
    surface: "shared",
    asks: "one shell or two, the brand, the sender, the foot, the sign-in code, which moments send, whether a guest is ever sent one, and the dark inbox",
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
    asks: "who the hub greets first, the index sheet, a how-to's shape, a guest's way in from the product, feedback, troubleshooting's dead end, and search's reach",
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
    asks: "how a waiting photograph shows, the verb for refusing one, what a tap opens, the keyboard, after a bulk act, an arrival mid-visit, the count, and whether a refused guest is told",
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
    asks: "where a host sees each item's size, largest-first or grouped by event, how freeing space reads for a plan switch, the pricing sheet's refusal, and a Pro host's six prices",
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
    asks: "where a host blocks someone, the block's sheet, the door a blocked person meets, the blocked list and letting back in, the Guests room with its list off, and the three closed doors",
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
    id: "album-motion",
    title: "The album's falling-in",
    surface: "marketing",
    asks: "which way a photograph reaches the album on the /features/album hero: Glide, Gather, Cascade or Bloom",
    why: "One decision, drawn on the wired hero so the pick is already built: the falling-in stays, and only its motion is asked.",
    lives: [
      "src/components/shared/album-stream/stream-engine.ts",
      "src/components/marketing/sections/features/album/arrivals-hero.tsx",
    ],
    board: {
      note: "One decision, four whole variations of the falling-in drawn on the LIVE /features/album hero at 1440 and 375 (the shipped one among them): a pair sliding under the album's edge, a pair born large and dissolving into it, singles landing on it, and singles arriving lit by the product's own glow; every number under a tile measured off the engine against the home hero's",
      variants: ["Glide", "Gather", "Cascade", "Bloom"],
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
    title: "Six loose ends",
    surface: "shared",
    asks: "the admin chart ramp's cast in each mode, one FAQ look, the home hero at a tablet width, and the album page's three ambient pieces",
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
  "identity-claims",
  "hero-card",
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

export const SANDBOX: Ruling[] = [...RULINGS].sort(
  (a, b) => deskIndex(a.id) - deskIndex(b.id),
);

export function getRuling(id: string): Ruling | undefined {
  return RULINGS.find((r) => r.id === id);
}
