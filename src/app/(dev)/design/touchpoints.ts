/**
 * THE PROTOTYPE CATALOG of the design lab. Each touchpoint page shows 2-3
 * labeled variants of ONE UX moment on the locked system (monochrome). It seeds
 * the lab's two standing purposes (lab refresh, 2026-06-19): a browsable design
 * reference, and a space to spin up multiple polished explorations per component
 * before integrating into the data-heavy app.
 *
 * The interactive picking mechanism is RETIRED (decisions now happen in chat
 * with more context). What survives is the DESIGN RECORD: `decision` +
 * `decisionNote` are the SHIPPED variant and the why, rendered read-only on each
 * touchpoint page. `surface` groups the catalog in the sidebar (adding an
 * exploration to a surface = one new entry here, picked up automatically).
 */
export type TouchpointId =
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
  | "pricing-plan-cards"
  | "pricing-calculator"
  | "contact-identity"
  | "press-identity"
  | "reel-reveal"
  | "reel-experience";

/** Which product surface a touchpoint prototypes - the sidebar's grouping.
 *  "marketing" was reserved from the lab refresh until the marketing-identity
 *  round (2026-07-03) claimed it. Empty groups are dropped automatically. */
export type Surface = "guest" | "host" | "marketing" | "shared";

/** Surface display labels - the ONE home (the sidebar + the touchpoint header
 *  both import this, never redefine it). */
export const SURFACE_LABEL: Record<Surface, string> = {
  guest: "Guest",
  host: "Host",
  marketing: "Marketing",
  shared: "Shared",
};

export type Touchpoint = {
  id: TouchpointId;
  title: string;
  note: string;
  /** The product surface this explores (groups the catalog in the sidebar). */
  surface: Surface;
  /** Variant names by number (index 0 = V1) - context for the shipped record. */
  variants: string[];
  /** The SHIPPED variant number (the design record). Unset = nothing shipped. */
  decision?: number;
  /** Why that variant shipped (the rationale, kept as the record). */
  decisionNote?: string;
};

export const TOUCHPOINTS: Touchpoint[] = [
  {
    id: "entry",
    title: "Guest entry",
    surface: "guest",
    note: "How the welcome moment is staged on a guest's phone",
    variants: [
      "Centered card",
      "Bottom sheet",
      "Full-screen welcome",
      "Adaptive sheet + ghost grid",
      "Full-screen marquee",
      "Inline teaser + sticky bar",
    ],
    decision: 4,
    decisionNote:
      "the perfect combo: V2 staging for public events (real backdrop), ghost grid when locked/empty; lock mark above the heading; the account step framed as the host's safety choice, not a capture gate",
  },
  {
    id: "upload",
    title: "Upload moment",
    surface: "guest",
    note: "Where adding photos lives and how progress feels",
    variants: [
      "Dropzone card",
      "Floating action bar",
      "Add tile in the grid",
      "Floating + tile combo",
    ],
    decision: 4,
    decisionNote:
      "combo minus the add tile (too busy): header Add on load, floating Add appears on scroll (never both), in-gallery progress, green check, subtle play badge on video tiles",
  },
  {
    id: "gallery",
    title: "Gallery grid",
    surface: "guest",
    note: "How the media field itself is laid out",
    variants: ["Uniform grid", "Masonry columns", "Edge-to-edge"],
    decision: 2,
    decisionNote:
      "unique and personalized vs standard grids; this creative separation is global philosophy",
  },
  {
    id: "header",
    title: "Event header",
    surface: "guest",
    note: "The event's identity block above the gallery",
    variants: ["Left editorial", "Centered formal", "Cover hero"],
    decision: 1,
    decisionNote:
      "minimal and fully contextual, no cover-image pressure on the host, more room for the gallery; meta UI keeps refining",
  },
  {
    id: "buttons",
    title: "Buttons & shape",
    surface: "shared",
    note: "The pressable language: shape, weight, sizes",
    variants: [
      "Soft rectangle",
      "Pill",
      "Sharp",
      "Sharp surfaces, round actions",
    ],
    decision: 4,
    decisionNote:
      "sharp general UI + 16px-at-40px-height scaled radius on interactive elements; one token to go full pill later",
  },
  {
    id: "lightbox",
    title: "Lightbox chrome",
    surface: "guest",
    note: "Controls and attribution around a full-screen photo",
    variants: ["Pinned chrome", "Floating pill", "Immersive auto-hide"],
    decision: 2,
    decisionNote:
      "max media space + mobile-friendly floating pattern; no like counts (utility not social), attribution baked under the pill, subtle swipe hints, video state designed",
  },
  {
    id: "event-card",
    title: "Host event card",
    surface: "host",
    note: "The dashboard's atomic unit: one event at a glance",
    variants: ["Cover-led", "Compact row", "Stat-forward overlay"],
    decision: 3,
    decisionNote:
      "refined pills + QR chip top-left (opens QR/link modal); leans on the cover image, which keeps proving useful",
  },
  {
    id: "forms",
    title: "Forms & inputs",
    surface: "host",
    note: "The settings language: fields, toggles, sections",
    variants: ["Card sections", "Inline rows", "Focused column"],
    decision: 1,
    decisionNote:
      "V1 refined for settings/management; V3 focused column for onboarding + creation. SYSTEM RULE: Urbanist is for identity moments (page titles, event names); functional section headings use Inter",
  },
  {
    id: "states",
    title: "Empty & loading",
    surface: "shared",
    note: "What nothing looks like, and what almost-something looks like",
    variants: ["Typographic", "Iconographic", "Photographic promise"],
    decision: 3,
    decisionNote:
      "ghost mosaic fills the visible field, CTA centered in it; empty-state header drops the primary Add in favor of the CTA",
  },
  {
    id: "qr-card",
    title: "QR table card",
    surface: "shared",
    note: "The printed growth artifact guests actually scan",
    variants: ["Minimal ink", "Invitation frame", "Photo-backed"],
    decision: 1,
    decisionNote:
      "expand the QR tool: V1 AND V3 are the base presets; the share studio (configurator) is the real feature, on the ROADMAP",
  },
  {
    // Phase 4.5 (Will's iPhone pass of the live gated entry, 2026-06-11): the
    // arrival is judged as ONE choreographed flow, not static screens - this
    // touchpoint's variants are composed TIMING/PRESENCE presets played by an
    // interactive flow player (real Vaul sheet physics, fake password "demo").
    // The knob tuning Will lands on rides into decisionNote verbatim and
    // becomes the production constants.
    id: "arrival",
    title: "Guest arrival",
    surface: "guest",
    note: "The gated first-open as one choreographed flow: stage, invitation, threshold, reveal",
    variants: ["Calm arrival", "Swift arrival", "Stately arrival"],
    decision: 1,
    decisionNote:
      "Calm with a longer pause - THE PRODUCTION CONSTANTS: arrival beat 700ms (password return visits 350ms, reduced motion 0) / welcome tall (~55svh) / step transition slide (directional 16px crossfade + 300ms height glide) / success morph + hold 900ms in --success green / type bumped (welcome hero 28px, gate titles 22px, page h1 28px)",
  },
  {
    // Phase 5 (Will at plan review, 2026-06-12): Phase 1 ratified COMPONENTS
    // but never the host PAGE COMPOSITIONS - "the host event page feels
    // terribly designed". These two touchpoints stage page ARCHITECTURES by
    // composing the already-ratified pieces (stat-forward cards, masonry,
    // card-section forms). Direction-setting; finetuning stays post-roadmap.
    id: "host-event",
    title: "Host event page",
    surface: "host",
    note: "How one event's management surface is composed: gallery, share, review queue, settings",
    variants: ["Gallery-first", "Command center", "Tabbed surfaces"],
    decision: 1,
    decisionNote:
      "Gallery-first (Will, 2026-06-12): the host page mirrors the guest experience - the gallery IS the page under a minimal left-editorial header (the ratified header rule: max room for the gallery, cohesion with the guest surface). Management collapses into ONE compact command strip: Share/QR + the amber 'N to review' chip (opens the pending queue) + a settings entry point. Moderation is one tap away, not a wall in front of the gallery.",
  },
  {
    id: "host-dashboard",
    title: "Host dashboard",
    surface: "host",
    note: "How the home surface is composed: events, storage, the personal tabs",
    variants: ["Cards-first", "Ambient storage", "Single feed"],
    decision: 3,
    decisionNote:
      "Single feed + ambient storage, a HYBRID (Will, 2026-06-12): tabs become FILTER chips over ONE continuous feed - events (V3 stat-forward cards) THEN your uploads (masonry) THEN likes, in one scroll. WHY: a free user with ONE event still gets a full, exciting page (content beneath the lone event) instead of a sparse list + forced navigation to find the rest. Storage = the AMBIENT slim meter from V2 (NOT V1's in-your-face card): polished + visible to incentivize the upgrade when it matters, never a hero block. Trash stays a filter (the recovery bin). The personal feeds (uploads/likes) keep their own empty-state ownership (client-only unlike).",
  },
  {
    // Phase 5 S3·S0 (Will, 2026-06-20): the gallery-first DIRECTION is ratified
    // (host-event decision 1); this touchpoint makes it concrete and resolves
    // the two open BUILD forks. Three labeled groups in one variant file:
    // A. whole-page composition (react to the architecture), B. settings entry,
    // C. deleted placement. Ratification happens in chat; the picks land in
    // decisionNote below. Label is "Deleted" (the 2026-06-20 rename).
    id: "host-event-page",
    title: "Gallery-first event page",
    surface: "host",
    note: "The ratified gallery-first event page made concrete: the whole-page composition plus the two open forks (settings entry, deleted placement)",
    variants: [
      "Composition: editorial",
      "Composition: stat line",
      "Composition: share-forward",
      "Settings: route",
      "Settings: drawer",
      "Settings: dialog",
      "Deleted: behind settings",
      "Deleted: command strip",
      "Deleted: gallery toggle",
    ],
    decision: 1,
    decisionNote:
      "Ratified (Will, 2026-06-20): A = Editorial (1) refined - icon sub-stats (items/contributors/views) + date + subtle visibility & accepting-uploads status; Share = PRIMARY; the Review button leaves the strip for its own horizontal-scroll TEASER section (faded right edge, only when reviews exist) below the actions (mobile: Share full-width / Add+Settings 2-col / Review teaser / gallery). B = Settings as a dedicated ROUTE (1), smooth view-transition feel, polished + tooltips. C = Deleted BEHIND settings (1) - intentional + rare, the retrieval path is where a host looks. The refined composition + settings-page explorations live in the gallery-first refinement round; the cross-surface hover/lightbox action model is the new `gallery-actions` touchpoint.",
  },
  {
    // Phase 5 S3·3b (Will, 2026-06-20): the gallery-first BUILD round. The
    // composition direction + the two forks are ratified (host-event-page
    // decision 1); this touchpoint is the EXECUTION CRAFT plus the one open
    // interaction - the review surface (in-page expansion vs focused mode),
    // built INTERACTIVE so Will can feel it. `decision` stays unset until he
    // picks the review form in chat; then it records the picked form + the
    // header/strip/settings craft calls.
    id: "host-event-build",
    title: "Gallery-first page: build",
    surface: "host",
    note: "The execution craft of the ratified gallery-first page (header config status, the responsive command strip, the settings crossfade) plus the one open fork: the review surface, interactive so it can be felt",
    variants: [
      "Header: status row",
      "Header: inline meta",
      "Strip: mobile (stacked)",
      "Strip: desktop (one row)",
      "Review: in-page expansion",
      "Review: focused mode",
      "Settings: route + crossfade",
    ],
    decision: 6,
    decisionNote:
      "Ratified (Will, 2026-06-20, felt live). A = Header STATUS ROW (1): counts on one line (date + items / contributors / views icons), then a SEPARATE row of small bordered chips for the config status (visibility Open/Password/Private + an Accepting-uploads dot) - state reads as state, worth the extra line. B = the command strip ships RESPONSIVE both ways (phone: Share full-width, then Add + Settings; one row when wide); review has LEFT the strip for its own teaser. C = the review surface is FOCUSED REVIEW MODE (6): the pending teaser (faded right edge, only when reviews exist) opens a full TAKEOVER (its own header 'Review N' + back, the page hidden behind) with tap-to-select + a sticky bulk bar (Hide / Approve selected, Approve all); moderation is INSTANT (no theater), toasts fire (Approved N, Hidden from everyone). D = Settings is a dedicated ROUTE with a lean crossfade (the ONE place motion is spent) + Deleted BEHIND it. Next: the incremental A->D build, hydration-safe (native title on SSR'd surfaces, NO radix Tooltip - the regression cause), each increment verified on Will's real browser + the gated probe.",
  },
  {
    // Phase 5 S3·3c (Will, 2026-06-20): the GALLERY ACTION MODEL across guest +
    // host. 3c.1 SHIPPED the host tile reveal (top-right hover row, like
    // far-right, hidden = 30% dim). This pass shapes 3c.2: the LIGHTBOX host
    // actions (the grouped "enjoy | curate" pill + Share), the UNIVERSAL
    // per-action COLOR layer (same colors guest + host; only the action SET
    // differs), and the Like/Hide feedback toasts. `decision` stays unset until
    // Will ratifies the colors + toast copy in chat.
    id: "gallery-actions",
    title: "Gallery actions",
    surface: "shared",
    note: "The universal action-color system (monochrome at rest, color on hover/state) across the tile reveal and the lightbox pill, plus the host lightbox moderation set and the Like/Hide feedback toasts",
    variants: [
      "Universal action colors + the grouped lightbox (the model)",
      "Host tile: rest / on-hover",
      "Host lightbox: grouped pill",
      "Guest parity",
      "Feedback toasts",
    ],
    decision: 1,
    decisionNote:
      "Ratified (Will, 2026-06-20). UNIVERSAL per-action colors (guest + host; only the action SET differs): like pink, save/download blue, hide/show amber, approve green, delete red. Emil: monochrome at rest, color on direct icon-hover + active state (liked = filled pink); native title tooltips. TILE (3c.1, shipped): the top-right hover-reveal row, Like FAR-RIGHT (stays colored when liked, never shifts on hover-off), hidden = 30% opacity; mobile keeps Like + Save only (hide/delete move to the lightbox). LIGHTBOX (3c.2): the grouped 'enjoy | curate' pill, Like LEFTMOST of enjoy [like, count, download, share] then a divider then [approve-or-hide-or-unhide, remove]; delete behind a modal confirm, everything else 1-way-safe or reversible; Share passes the event JOIN url. The guest lightbox keeps its exact behavior + gestures, it just gains the same colors. TOASTS: Like 'Added to your likes'; Hide 'Hidden from everyone', firing from BOTH the tile hover-row and the lightbox. Corrects the prior 'viewer pill is unchanged' reading: the color clarity is for everyone, not host-only. POLISH (Will, 2026-06-20): OPTIMISTIC moderation (instant tile + lightbox via useOptimistic; reverts + toasts on failure); a PERSISTENT amber hidden marker (off-hover + mobile, like the liked heart, atop the 30% dim); the lightbox Like is a bare icon; Share hovers blue (shared with download/save). STYLED tooltips are LIGHTBOX-ONLY: wrapping the SSR'd tiles in radix Tooltips regressed host-gallery hydration on prod (the lightbox is ssr:false so its tooltips are safe; tiles use native title). See the hydration gotcha in docs/systems/architecture.md.",
  },
  {
    // Marketing-identity lab round (2026-07-03): the marketing site is
    // content-complete but pre-V1 identity (it still wears the retired accent).
    // This round prototypes 3 genuinely distinct site identities ON the locked
    // mono system - directions differ in COMPOSITION, TYPE SCALE, MOTION
    // LANGUAGE, and MEDIA TREATMENT, never in palette - so Will can pick one
    // direction for the full marketing rebuild. Each variant is a desktop hero
    // plus one signature scroll section inside a scrollable browser mock (feel
    // the motion, don't imagine it). `decision` stays unset until Will rules.
    id: "marketing-identity",
    title: "Marketing identity",
    surface: "marketing",
    note: "Three site identities for the marketing rebuild, same mono system: they differ in composition, type scale, motion language, and media treatment",
    variants: [
      "Editorial gallery",
      "The reel is the hero",
      "Live event energy",
    ],
    decision: 1,
    decisionNote:
      "T1 ruling (Will, 2026-07-05): B+C HYBRID. B's cinema hero leads (the desired visual language, the most design magic) with B's how-it-works reel animation kept, and C's animated product-demo as a close follow-up section visualizing the how. A rejected as too templated. BINDING CAVEAT: these wow sections are the FLOOR, not the site: the build is gated on a full-site IA/content-architecture round (core loop + supporting features) done collaboratively with Will (T2.5) before any production pages.",
  },
  {
    // Marketing-voice lab round (T2.5 cluster-4). ROUND 2 (2026-07-08) rebuilt
    // the groupings on the owner's ratified palette (event language, collection
    // co-lead) with a word-animation toggle (Roll default) after the hard cut
    // read glitchy on text-only boards. Round 1 (2026-07-07) had drafted four
    // boards off a D2xD4 blend; the owner's rulings reset it: the copy leaned
    // too hard on the reel (most value is the easy collection), "night" was
    // banned as identity language, and eight lines were ratified as the GOLDEN
    // SET to build around verbatim. The three groupings differ in H1/thesis
    // strategy (G1 collection-led, G2 arc-led, G3 reel-led-tempered); a ratified-
    // palette strip type-sets his eight lines above them. `decision` stays unset
    // until he confirms which grouping + the animation mode.
    id: "marketing-voice",
    title: "Marketing voice",
    surface: "marketing",
    note: "Three copy groupings for the marketing rebuild, all anchored on the owner's ratified eight-line palette but leading with a different thesis (collection, arc, reel-tempered), type-set dark-mono with a three-mode word-animation toggle (Roll default)",
    variants: ["Collection-led", "Arc-led", "Reel-led"],
    decision: 1,
    decisionNote:
      "Ruled in chat (2026-08-25), not as a pure grouping pick: the thesis Will supplied ('The whole event, in one album.') is Collection-led's evolved form, so V1 stands as the shipped spine while 'Arc has a much better voice in the sentence examples' guides the register. He supplied the subhead verbatim + a per-section header map (marketing-voice.ts is the single source; ruled vs provisional flagged there with his notes), warmed the decomposition's third fact to 'Created for you.', ordered pricing after the reel section, and rejected the width-reserving kinetic slot ('a huge inline gap') in favor of a measured, animated width. The word-ANIMATION mode still confirms on the hero prototype.",
  },
  {
    // Track B F5 lab round 1 (2026-08-25, the trackb-marketing-build plan):
    // the home's SIGNATURE section (IA section 3, the made-from spine's anchor
    // beat) has NO prototype; the lab-first gate mandates this round before
    // lp/mkt-home builds it. Two selectable mechanics for the same story (the
    // hero's reel comes APART into its source tiles while three counters land
    // as facts): V1 plays once on scroll-into-view; V2 is scrubbed by scroll
    // (the one sanctioned scroll-linked JS candidate; V1 is the fallback if
    // the feel is off). The same session carries the plan's tactile candidates
    // (drag-drop photo pile, card-stack hover) and the mono confetti-burst
    // proposal for the live demo's "Reel ready" beat (default OFF). `decision`
    // stays unset until Will rules V1 vs V2 (+ the extras' fate) in-session.
    id: "marketing-decomposition",
    title: "Marketing decomposition",
    surface: "marketing",
    note: "The home's signature move, two ways: the hero's reel comes apart into its source tiles while three counters land as facts, played once on scroll or scrubbed by it, plus the tactile photo-pile and card-stack candidates and the mono confetti proposal",
    variants: [
      "One-shot play",
      "Scroll-driven",
      "Photo-pile drag (extra)",
      "Card-stack hover (extra)",
      "Confetti proposal (extra)",
    ],
  },
  {
    // Track B F5 lab round 2 (2026-08-25, the trackb-marketing-build plan):
    // decides the PRODUCTION hero. The cinema hero is ruled (Direction B) but
    // the round-2 voice finding was that a hard word cut needs an IMAGE cut to
    // motivate it, so this round judges Roll/Type/Cut against MOVING footage: a
    // substrate slot plays /marketing/reels/hero-candidate-01.mp4 when the
    // render session has landed it (poster-first, ambient-pause wired) and
    // falls back to the 4-shot Ken Burns montage until then. The kinetic H1 is
    // parameterized across ALL THREE voice groupings so an unanswered voice
    // pick cannot stall it (both picks can land in one sitting). `decision`
    // stays unset until Will rules the word animation (+ grouping if open).
    id: "marketing-hero-substrate",
    title: "Marketing hero substrate",
    surface: "marketing",
    note: "The production hero decided against real footage: an mp4 substrate slot with poster-first loading and montage fallback, story progress and timecode synced to the video, and the kinetic H1 word toggling Roll, Type, or Cut across all three voice groupings",
    variants: ["Roll on footage", "Type on footage", "Cut on footage"],
  },
  {
    // The pricing round (2026-08-27): /pricing rebuilt on the restrained
    // default; this decides the plan cards' visual identity layer (the
    // Biograph-burst equivalent, built from media). Each variant renders the
    // REAL pair anatomy (paper Free + ink Pro) in miniature so the identity is
    // judged across both registers at once. V2 uses the back-pocket
    // soft-shadow exception (photos physically stacking).
    id: "pricing-plan-cards",
    title: "Pricing plan cards",
    surface: "marketing",
    note: "The pair's visual identity layer: a media burst, a stacked-photo depth read, or quiet concentric ink",
    variants: ["Media burst", "Stacked photos", "Quiet ink"],
    decision: 2,
    decisionNote:
      "V2 Stacked photos (Will, 2026-08-27): 'v1 is really cool but within the card v2 has a nice balance.' Wired into /pricing the same day (Free stacks two grayscale, Pro four vivid on ink; hover spreads; the back-pocket soft-shadow exception carries the depth). His sitting also flagged the mono face on the cards ('don't know where this mono font is coming from') -> the pricing-wide price-register swap: money in the display face (Urbanist, tabular digits), values in Inter; Geist Mono survives only as the wall's timecode chips.",
  },
  {
    // The pricing round (2026-08-27): does the find-your-size slider earn its
    // delight layer? V1 makes the golden line mechanical (the album wall fills
    // as you slide); V2 is the shipped receipt meter reproduced as the
    // baseline. Both run the same stop ladder + the same pure recommendPlan
    // brain, so only the EXPRESSION differs.
    id: "pricing-calculator",
    title: "Pricing calculator",
    surface: "marketing",
    note: "The find-your-size slider's expression: the album-fill wall against the shipped receipt meter",
    variants: ["Album fill", "Receipt meter"],
    decision: 1,
    decisionNote:
      "V1 Album fill (Will, 2026-08-27): 'definitely the V1 direction. Cool idea already!' The wall replaced the bare meter in /pricing#fit on the real gallery grammar (3px tiles/gaps); the receipt line + aria-live verdict stay the accessible summary; clip tiles keep the one legitimate mono (a timecode).",
  },
  {
    // The contact round REDO (2026-08-28): the first build kept the old page's
    // wireframe DNA and Will called it ("super bland... did not follow 'if
    // this page didn't already exist'"). The IA survives (topic router, help
    // search, directory); THIS touchpoint re-designs the form chapter's
    // visual identity from zero. Each direction carries its own topic-router
    // treatment, so one ruling settles the page.
    id: "contact-identity",
    title: "Contact identity",
    surface: "marketing",
    note: "The form chapter from zero: a stationery note with a photo stamp, a media-split desk, or a bare-paper editorial ledger",
    variants: ["The note", "The desk", "The ledger"],
    decision: 2,
    decisionNote:
      "COMPOSITE on V2 (Will, 2026-08-28): 'I like the V2 desk layout most for the form section, as it feels very structured, but I'd like to use the V1 note design and the v2 form itself to jazz up the visual design.' Wired same-day: the desk structure + facts rows, the note's stamp + letterhead on the card, the Polaroid spread DROPPED ('so it doesn't feel too busy'), the seven open chips collapsed to a clean dropdown ('takes a ton of room'), and the card on the Biograph gray panel with white fields (his biograph.com/contact reference). V3's numbered-index grammar was grafted onto the self-serve directory.",
  },
  {
    // The /press redesign (2026-08-28). The page is the last wireframe-grade
    // surface on the marketing site and has no metaphor, while every elevated
    // surface here is a physical object. Two full page-chapter directions,
    // rendering IDENTICAL content from constants/press.ts + PRESS_KIT so the
    // ruling is about identity alone. Will's constraint: the logo changes
    // before launch, so this round builds the SYSTEM (a manifest, a rebuildable
    // kit zip, rules written against the mark's own box), never a shrine to the
    // current glyph. `decision` stays unset until Will rules V1 vs V2 (a hybrid
    // of V1's sheet with V2's register is an expected outcome).
    id: "press-identity",
    title: "Press identity",
    surface: "marketing",
    note: "Two directions for the press kit, same content and IA throughout: the assets as a photographic contact sheet on ink, or as a type-foundry specimen sheet on paper",
    variants: ["The contact sheet", "The specimen sheet"],
    decision: 1,
    decisionNote:
      'Ruled by Will (2026-08-28): the contact sheet, for "focusing press around the assets and quick hit points" where the specimen sheet "felt more like internal brand guidelines." The ruling came with a scope cut that survived into the build: the logo usage guidelines (clear space, minimum size, misuse) are OUT of the shipped page entirely. Only the two usage points that are press business rather than brand-book material ship, as quick hits beside the copy they govern: quoting needs no permission, and how to write the name. V2\'s register is kept here as the design record, and its rules array moved into this lab file so production carries no dead constant. One mechanic was promoted from this round: [data-mkt-isolate] into marketing.css as a general recipe. The page also briefly borrowed the concurrent lp/about CinemaChapter, then dropped it when it moved into the (cinema) route group instead, which is where it shipped.',
  },
  {
    // Reel reveal-moment lab round (2026-07-03): the beat where a host who just
    // tapped Create reel watches their reel exist for the first time (the North
    // Star wow; a RARE moment, so animate-by-frequency allows real delight).
    // Built on the NEW canvas engine: each stage choreographs around the real
    // CanvasReelPlayer held at frame 0 and released at its ignite beat, which
    // client-side encode makes honest (the reel is watchable instantly, no
    // progress theater). Each direction carries its guest (/e/) adaptation
    // sketch on the page. T1 ruled a COMPOSITE of the three; it is built as V1
    // with every beat a --tune-rvl-* var + the MotionTuner on the page, so the
    // T2 device session tunes it live (Copy CSS -> bake -> reset).
    id: "reel-reveal",
    title: "Reel reveal moment",
    surface: "host",
    note: "The ruled composite reveal on the real playing canvas engine, above its three source choreographies: a cinema premiere, the making-of made visible, and photo-becomes-cinema",
    variants: [
      "Composite (ruled)",
      "Lights down",
      "Assembly",
      "First frame held",
    ],
    decision: 1,
    decisionNote:
      "T1 ruling (Will, 2026-07-05): a NEW COMPOSITE, not a single source variant (built as V1 of this touchpoint; Assembly's flight is its base mechanic). Sequence: start from the shared base state (gallery at top, no reel placeholder) -> tiles assemble into center screen -> hold + CAMERA FLASH -> scale to full-bleed from center (the First-frame-held expansion) -> as it reaches full screen, the Lights-down overlay event-name intro plays -> the reel takes breath. Cleaner than no intro (Assembly) or the polaroid mat (First frame held). Explicitly fine-tunable with Will; T2 device session is the tuning venue (the page mounts the motion tuner over the --tune-rvl-* beats). The three originals stay as V2-V4 for reference. T2 (Will, 2026-07-08, on-device): RATIFIED AS-BUILT, no retime (the shipped defaults ARE the tuned values); stays in the lab with the tuner for later revisits; production wiring is R3's job.",
  },
  {
    // Reel-experience lab round (R3 slice C, 2026-07-21): Will's verdict on
    // the shipped reel UI, verbatim, "very weak and v1". Three directions over
    // the SAME four moments (event-page section, creation/curation with
    // 14-style identity, the publish moment, the guest arrival) so they
    // compare like-for-like; the product model is ruled and closed (ADR-0021/
    // 0022), the UI is the canvas. The ratified reveal grammar is reused
    // untouched (V3's Create reel fires it); only the publish beats carry new
    // tuner knobs. The ruling lands in chat and is recorded here when it does.
    id: "reel-experience",
    title: "Reel experience",
    surface: "host",
    note: "Three directions for the reel as a product moment: the event-page section, creation with 14-style identity, the publish moment, and the guest arrival",
    variants: ["Marquee in the feed", "The Studio", "The Premiere"],
    decision: 1,
    decisionNote:
      "V1 Marquee (ADR-0023): richer + feed-native, a clear create action for the host, and the most beautiful guest arrival. Composite: V1 IS the feed section (poster card, labeled control rows, engine-thumb style rail); deeper editing GRADUATES to a Reel Studio destination (V2's room, entered from the card, never forced inline); the reel is still BORN by an explicit Create act, which is what the ratified reveal triggers on. Re-opened for the production build: the quick-add signal (most-liked is unreliable when likes are sparse, so blend likes + recency + per-guest coverage + media mix behind an honest label, never random)",
  },
];

export function getTouchpoint(id: string): Touchpoint | undefined {
  return TOUCHPOINTS.find((t) => t.id === id);
}
