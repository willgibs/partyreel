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
  | "album-columns"
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
    id: "identity-door",
    title: "Asking for an email at the door",
    surface: "guest",
    asks:
      "where the optional email sits against the name, where a member's sign-in lives, how the verified gate frames its benefit, what the guest's own menu says, and where undoing an email lives",
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
    asks:
      "where the claim ticket lives on the dashboard, how the album points to it, working through more than one event, the warning before a deletion, and what Finish leaves",
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
    asks:
      "how a verified guest sets up her page, how she chooses what shows, when the app offers the setup, and what an empty page says to a visitor",
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
    asks:
      "the live reel on a venue's screen: where the code lives, how the event is named, the just-added beat, the pace, before it begins, the Start plate, Review on a public wall, and the way in",
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
    asks:
      "when the second ask to keep her photos reaches a guest the door already offered an email, the ask's shape, whom she can follow once she confirms, and whether her typed name gets one look before it becomes her account's",
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
    asks:
      "seven lines a guest reads, each in its real place: the welcome, the password's ask, the landing, a failed upload, the empty album's button, a held photo, and the capture's words",
    why: "The voice is built one won line at a time in its real place (bible 10); these seven are the guest's most-read words and where most of the asks live.",
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
    asks:
      "the live reel's tile at the album's head: what it is, its verbs, its small states, the beat after a first photo, the door's backdrop, once uploads close, and the hub's Reel card",
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
    id: "site-chrome",
    title: "The marketing site's chrome",
    surface: "marketing",
    asks:
      "the footer beneath a page's own closing call to action: its register, a page with none above it, and the phone",
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
    id: "profile-page",
    title: "What a person is here",
    surface: "guest",
    asks:
      "how the full guest list opens from the faces row, what a name opens first, and how a profile keeps the scanned event reachable",
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
      note: "Three decisions on the shipped guest list and profile, phone first at 375 with 1440 on the knob, a 240-name fixture beside a 24-name one: how the full list opens from the faces row, what a name opens first, and how a profile keeps the scanned event reachable",
      variants: ["View all", "Quick-look", "Way back"],
    },
  },
  {
    id: "export-flow",
    title: "Getting everything out",
    surface: "shared",
    asks:
      "what Download hands a guest, the wait, a request that never answers, a hollow zip, the item limit, keeping the album, and where the file lands on a phone",
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
    asks:
      "where the host's Style lives, the Show the reel switch, where Play on a screen opens, the dashboard's line, a host's own cut added to the album, and Review's interplay",
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
    asks:
      "a report in the queue, a wordless one, what a verdict costs and records, a closed report, the legal hold, the phone, one idiom for four inboxes, and who is told",
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
    asks:
      "the reel's thesis line, the /reel page's arc, the home's teaser, the pricing rows, the loop's last step, the events' reel column, and the help category's name",
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
    asks:
      "what a tap opens, what stands beside the photograph, how it says who took it, the next one, close up, video, the way out, and whether an open photograph has an address",
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
    asks:
      "the live reel's full-screen view: the chrome and its fade, the controls, the arrival, a tap, the posture, the pace, the loop's seam, and reduced motion",
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
    asks:
      "one shell or two, the brand, the sender, the foot, the sign-in code, which moments send, whether a guest is ever sent one, and the dark inbox",
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
    asks:
      "who the hub greets first, the index sheet, a how-to's shape, a guest's way in from the product, feedback, troubleshooting's dead end, and search's reach",
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
    asks:
      "how a waiting photograph shows, the verb for refusing one, what a tap opens, the keyboard, after a bulk act, an arrival mid-visit, the count, and whether a refused guest is told",
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
    asks:
      "where a host sees each item's size, largest-first or grouped by event, how freeing space reads for a plan switch, the pricing sheet's refusal, and a Pro host's six prices",
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
    asks:
      "where a host blocks someone, the block's sheet, the door a blocked person meets, the blocked list and letting back in, the Guests room with its list off, and the three closed doors",
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
    asks:
      "the creator a guest meets from the reel: the way in, the room, the fourteen looks, the moments, a hidden tile, the export's wait, the finish, the free mark, whether it carries sound, and a device that cannot encode",
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
      note: "Ten decisions on the creator a guest meets after tapping Make your own, over the album media-viewer already draws: the way in from the reel, the room at both sizes, the fourteen looks, the moments as a local pick with three fills, a hidden tile only the host meets, the export's minute, the finish, the free mark, whether a cut ever carries sound, and a device that cannot encode",
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
    id: "press-page",
    title: "What Partyreel hands the world",
    surface: "marketing",
    asks:
      "who /press is for, what the asset sheet shows, how the words hand over, how checkable the facts are, whether anyone is named, the close, and the reading order",
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
    asks:
      "the way in, the receipt, an urgent path, the topic picker, the page's identity against the rest of the site, and what stands beside the form",
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
    asks:
      "which way a photograph reaches the album on the /features/album hero: Glide, Gather or Cascade",
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
    id: "album-columns",
    title: "The album's column rule",
    surface: "shared",
    asks:
      "whether masonry is the right layout at all, how wide the album runs, what the biggest screens do once columns would climb forever, what a bigger phone earns, whether hosting and guesting share one tile-size preference, and the control's own form",
    why: "Masonry sets the album's columns by a declared width across the middle of the range; both ends, and the layout itself, are open, and this board looks at all three.",
    lives: [
      "src/components/shared/masonry.tsx",
      "src/lib/shared/tile-size-cookie.ts",
      "src/components/guest/live-gallery.tsx",
      "src/components/app/event-feed/event-gallery.tsx",
    ],
    board: {
      note: "Six decisions, no page: whether masonry is even the right layout (beside justified rows, the uniform grid and a mosaic), the album's own width, what the biggest screens do once columns would climb forever, what a bigger phone earns, whether hosting and guesting share one tile-size preference, and the control's own form; every option is the real fixture album on the real masonry grid (or its own algorithm, honestly quoted), at the width where it shows.",
      variants: [
        "The layout itself",
        "Album width",
        "The scale ceiling",
        "The phone's columns",
        "One preference, or two",
        "The control's form",
      ],
    },
  },
  {
    id: "privacy-hero",
    title: "The privacy page's hero",
    surface: "marketing",
    asks:
      "the privacy page's hero: a breathing aperture, a grid whose tiles take turns clearing, or sealed cards that lift",
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
    id: "loose-ends",
    title: "Six loose ends",
    surface: "shared",
    asks:
      "the admin chart ramp's cast in each mode, one FAQ look, the home hero at a tablet width, and the album page's three ambient pieces",
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
  "album-columns",
  "reel-screen",
  "reel-host",
  "reel-cut",
  "reel-story",
  "reel-front",
  "media-viewer",
  "reel-view",
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

export const SANDBOX: Ruling[] = [...RULINGS].sort(
  (a, b) => deskIndex(a.id) - deskIndex(b.id),
);

export function getRuling(id: string): Ruling | undefined {
  return RULINGS.find((r) => r.id === id);
}
