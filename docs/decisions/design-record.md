# The design record

> **ROLE:** the history of every ruling taken in the `/design` lab: what was tried, what shipped, why, and where each board stood when it left the workshop. **NOT LAW:** the rules live in [`docs/systems/design-system.md`](../systems/design-system.md) and the surface docs (`guest-flow.md`, `host-app.md`, `marketing-content.md`); this file explains how they were reached, the way the `t1-*` tombstones beside it keep ruled options-docs. **BELONGS HERE:** one section per touchpoint, the ruling verbatim as the lab recorded it, the board's files and last SHA. **NOT HERE:** anything a reader must obey today (that is a system doc's line) or a deferred task (ROADMAP). **GROWS BY:** one section per lab round, added when its board leaves `sandbox/`; the standing boards are listed with `ruled: open` and move to "deleted" when their round lands. Sections are never rewritten to say something new about the present.

Deleted boards were last at `9b75ec1` (`git show 9b75ec1:<path>` reopens any of them) and were removed on 2026-09-02 in the library round; the thin registry the lab reads is [`src/app/(dev)/design/touchpoints.ts`](../../src/app/(dev)/design/touchpoints.ts) (`RULINGS`), rendered at `/design/record`.

| id | surface | ruled | shipped |
| --- | --- | --- | --- |
| [entry](#entry) | guest | Phase 1 (June 2026) | V4 Adaptive sheet + ghost grid |
| [upload](#upload) | guest | Phase 1 (June 2026) | V4 Floating + tile combo |
| [gallery](#gallery) | guest | Phase 1 (June 2026) | V2 Masonry columns |
| [header](#header) | guest | Phase 1 (June 2026) | V1 Left editorial |
| [buttons](#buttons) | shared | Phase 1 (June 2026) | V4 Sharp surfaces, round actions |
| [lightbox](#lightbox) | guest | Phase 1 (June 2026) | V2 Floating pill |
| [event-card](#event-card) | host | Phase 1 (June 2026) | V3 Stat-forward overlay |
| [forms](#forms) | host | Phase 1 (June 2026) | V1 Card sections |
| [states](#states) | shared | Phase 1 (June 2026) | V3 Photographic promise |
| [qr-card](#qr-card) | shared | Phase 1 (June 2026) | V1 Minimal ink |
| [arrival](#arrival) | guest | 2026-06-11 | V1 Calm arrival |
| [host-event](#host-event) | host | 2026-06-12 | V1 Gallery-first |
| [host-dashboard](#host-dashboard) | host | 2026-06-12 | V3 Single feed |
| [host-event-page](#host-event-page) | host | 2026-06-20 | V1 Composition: editorial |
| [host-event-build](#host-event-build) | host | 2026-06-20 | V6 Review: focused mode |
| [gallery-actions](#gallery-actions) | shared | 2026-06-20 | V1 Universal action colors + the grouped lightbox (the model) |
| [marketing-identity](#marketing-identity) | marketing | 2026-07-05 (T1) | V1 Editorial gallery |
| [marketing-voice](#marketing-voice) | marketing | 2026-08-25 | V1 Collection-led |
| [marketing-decomposition](#marketing-decomposition) | marketing | open | open |
| [marketing-hero-substrate](#marketing-hero-substrate) | marketing | open | open |
| [home-hero](#home-hero) | marketing | open | open |
| [pricing-plan-cards](#pricing-plan-cards) | marketing | 2026-08-27 | V2 Stacked photos |
| [pricing-calculator](#pricing-calculator) | marketing | 2026-08-27 | V1 Album fill |
| [contact-identity](#contact-identity) | marketing | 2026-08-28 | V2 The desk |
| [press-identity](#press-identity) | marketing | 2026-08-28 | V1 The contact sheet |
| [blog-identity](#blog-identity) | marketing | 2026-08-28 | V4 The Cutting Room |
| [careers-identity](#careers-identity) | marketing | 2026-08-28 | nothing (all three rejected) |
| [reel-reveal](#reel-reveal) | host | 2026-07-05 (T1), ratified as built 2026-07-08 | V1 Composite (ruled) |
| [reel-experience](#reel-experience) | host | ADR-0023 | V1 Marquee in the feed |
| [glow-doctrine](#glow-doctrine) | shared | 2026-08-28 and 08-31; open: the lit surface | open |
| [glow-moments](#glow-moments) | shared | 2026-08-31; open: the publish beat's violet | open |
| [event-feed](#event-feed) | host | 2026-06-22 | Condense, Fade, FLIP |
| [palette](#palette) | shared | open (the review wave, 2026-09-14) | open |
| [light](#light) | shared | open (the review wave, 2026-09-14) | open |
| [type-scale](#type-scale) | shared | open (the review wave, 2026-09-14) | open |
| [floating-surfaces](#floating-surfaces) | shared | open (the review wave, 2026-09-14) | open |
| [brand-voice](#brand-voice) | marketing | open (the review wave, 2026-09-14) | open |
| [media-kit](#media-kit) | marketing | open (the review wave, 2026-09-14) | open |
| [rounding](#rounding) | shared | open (the review wave, 2026-09-14; Orchestrator-run) | open |

## entry

**Guest entry** (guest). Ruled Phase 1 (June 2026). Shipped: V4 Adaptive sheet + ghost grid.  
How the welcome moment is staged on a guest's phone.  
Variants: V1 Centered card; V2 Bottom sheet; V3 Full-screen welcome; V4 Adaptive sheet + ghost grid; V5 Full-screen marquee; V6 Inline teaser + sticky bar.

The ruling, verbatim: the perfect combo: V2 staging for public events (real backdrop), ghost grid when locked/empty; lock mark above the heading; the account step framed as the host's safety choice, not a capture gate

Board: `src/app/(dev)/design/components/entry-variants.tsx`, last at `9b75ec1`, deleted 2026-09-02.  
Lives: `docs/systems/guest-flow.md`

## upload

**Upload moment** (guest). Ruled Phase 1 (June 2026). Shipped: V4 Floating + tile combo.  
Where adding photos lives and how progress feels.  
Variants: V1 Dropzone card; V2 Floating action bar; V3 Add tile in the grid; V4 Floating + tile combo.

The ruling, verbatim: combo minus the add tile (too busy): header Add on load, floating Add appears on scroll (never both), in-gallery progress, green check, subtle play badge on video tiles

Board: `src/app/(dev)/design/components/upload-variants.tsx`, last at `9b75ec1`, deleted 2026-09-02.  
Lives: `docs/systems/guest-flow.md`, `docs/systems/uploads-and-r2.md`

## gallery

**Gallery grid** (guest). Ruled Phase 1 (June 2026). Shipped: V2 Masonry columns.  
How the media field itself is laid out.  
Variants: V1 Uniform grid; V2 Masonry columns; V3 Edge-to-edge.

The ruling, verbatim: unique and personalized vs standard grids; this creative separation is global philosophy

Board: `src/app/(dev)/design/components/gallery-variants.tsx`, last at `9b75ec1`, deleted 2026-09-02.  
Lives: `docs/systems/guest-flow.md`

## header

**Event header** (guest). Ruled Phase 1 (June 2026). Shipped: V1 Left editorial.  
The event's identity block above the gallery.  
Variants: V1 Left editorial; V2 Centered formal; V3 Cover hero.

The ruling, verbatim: minimal and fully contextual, no cover-image pressure on the host, more room for the gallery; meta UI keeps refining

Board: `src/app/(dev)/design/components/header-variants.tsx`, last at `9b75ec1`, deleted 2026-09-02.  
Lives: `docs/systems/guest-flow.md`, `docs/systems/host-app.md`

## buttons

**Buttons & shape** (shared). Ruled Phase 1 (June 2026). Shipped: V4 Sharp surfaces, round actions.  
The pressable language: shape, weight, sizes.  
Variants: V1 Soft rectangle; V2 Pill; V3 Sharp; V4 Sharp surfaces, round actions.

The ruling, verbatim: sharp general UI + 16px-at-40px-height scaled radius on interactive elements; one token to go full pill later

Board: `src/app/(dev)/design/components/button-variants.tsx`, last at `9b75ec1`, deleted 2026-09-02.  
Lives: `docs/systems/design-system.md#rounding-sharp-surfaces-round-actions`, `src/app/globals.css`, `src/components/ui/button.tsx`

## lightbox

**Lightbox chrome** (guest). Ruled Phase 1 (June 2026). Shipped: V2 Floating pill.  
Controls and attribution around a full-screen photo.  
Variants: V1 Pinned chrome; V2 Floating pill; V3 Immersive auto-hide.

The ruling, verbatim: max media space + mobile-friendly floating pattern; no like counts (utility not social), attribution baked under the pill, subtle swipe hints, video state designed

Board: `src/app/(dev)/design/components/lightbox-variants.tsx`, last at `9b75ec1`, deleted 2026-09-02.  
Lives: `docs/systems/guest-flow.md`

## event-card

**Host event card** (host). Ruled Phase 1 (June 2026). Shipped: V3 Stat-forward overlay.  
The dashboard's atomic unit: one event at a glance.  
Variants: V1 Cover-led; V2 Compact row; V3 Stat-forward overlay.

The ruling, verbatim: refined pills + QR chip top-left (opens QR/link modal); leans on the cover image, which keeps proving useful

Board: `src/app/(dev)/design/components/event-card-variants.tsx`, last at `9b75ec1`, deleted 2026-09-02.  
Lives: `docs/systems/host-app.md`

## forms

**Forms & inputs** (host). Ruled Phase 1 (June 2026). Shipped: V1 Card sections.  
The settings language: fields, toggles, sections.  
Variants: V1 Card sections; V2 Inline rows; V3 Focused column.

The ruling, verbatim: V1 refined for settings/management; V3 focused column for onboarding + creation. SYSTEM RULE: Urbanist is for identity moments (page titles, event names); functional section headings use Inter

Board: `src/app/(dev)/design/components/form-variants.tsx`, last at `9b75ec1`, deleted 2026-09-02.  
Lives: `docs/systems/host-app.md`, `docs/systems/design-system.md#type-the-heading-face-the-tiered-scale`

## states

**Empty & loading** (shared). Ruled Phase 1 (June 2026). Shipped: V3 Photographic promise.  
What nothing looks like, and what almost-something looks like.  
Variants: V1 Typographic; V2 Iconographic; V3 Photographic promise.

The ruling, verbatim: ghost mosaic fills the visible field, CTA centered in it; empty-state header drops the primary Add in favor of the CTA

Board: `src/app/(dev)/design/components/state-variants.tsx`, last at `9b75ec1`, deleted 2026-09-02.  
Lives: `docs/systems/design-system.md`

## qr-card

**QR table card** (shared). Ruled Phase 1 (June 2026). Shipped: V1 Minimal ink.  
The printed growth artifact guests actually scan.  
Variants: V1 Minimal ink; V2 Invitation frame; V3 Photo-backed.

The ruling, verbatim: expand the QR tool: V1 AND V3 are the base presets; the share studio (configurator) is the real feature, on the ROADMAP

Board: `src/app/(dev)/design/components/qr-card-variants.tsx`, last at `9b75ec1`, deleted 2026-09-02.  
Lives: `docs/systems/host-app.md`, `docs/ROADMAP.md`

## arrival

**Guest arrival** (guest). Ruled 2026-06-11. Shipped: V1 Calm arrival.  
The gated first-open as one choreographed flow: stage, invitation, threshold, reveal.  
Variants: V1 Calm arrival; V2 Swift arrival; V3 Stately arrival.

Context, as the lab recorded it: Phase 4.5 (Will's iPhone pass of the live gated entry, 2026-06-11): the arrival is judged as ONE choreographed flow, not static screens - this touchpoint's variants are composed TIMING/PRESENCE presets played by an interactive flow player (real Vaul sheet physics, fake password "demo"). The knob tuning Will lands on rides into decisionNote verbatim and becomes the production constants.

The ruling, verbatim: Calm with a longer pause - THE PRODUCTION CONSTANTS: arrival beat 700ms (password return visits 350ms, reduced motion 0) / welcome tall (~55svh) / step transition slide (directional 16px crossfade + 300ms height glide) / success morph + hold 900ms in --success green / type bumped (welcome hero 28px, gate titles 22px, page h1 28px)

Board: `src/app/(dev)/design/components/arrival-variants.tsx`, `src/app/(dev)/design/components/arrival-player.tsx`, last at `9b75ec1`, deleted 2026-09-02.  
Lives: `docs/systems/guest-flow.md`, `docs/systems/design-system.md#the-arrival-choreography-phase-45-ratified-calm-700ms`

## host-event

**Host event page** (host). Ruled 2026-06-12. Shipped: V1 Gallery-first.  
How one event's management surface is composed: gallery, share, review queue, settings.  
Variants: V1 Gallery-first; V2 Command center; V3 Tabbed surfaces.

Context, as the lab recorded it: Phase 5 (Will at plan review, 2026-06-12): Phase 1 ratified COMPONENTS but never the host PAGE COMPOSITIONS - "the host event page feels terribly designed". These two touchpoints stage page ARCHITECTURES by composing the already-ratified pieces (stat-forward cards, masonry, card-section forms). Direction-setting; finetuning stays post-roadmap.

The ruling, verbatim: Gallery-first (Will, 2026-06-12): the host page mirrors the guest experience - the gallery IS the page under a minimal left-editorial header (the ratified header rule: max room for the gallery, cohesion with the guest surface). Management collapses into ONE compact command strip: Share/QR + the amber 'N to review' chip (opens the pending queue) + a settings entry point. Moderation is one tap away, not a wall in front of the gallery.

Board: `src/app/(dev)/design/components/host-event-variants.tsx`, last at `9b75ec1`, deleted 2026-09-02.  
Lives: `docs/systems/host-app.md`

## host-dashboard

**Host dashboard** (host). Ruled 2026-06-12. Shipped: V3 Single feed.  
How the home surface is composed: events, storage, the personal tabs.  
Variants: V1 Cards-first; V2 Ambient storage; V3 Single feed.

The ruling, verbatim: Single feed + ambient storage, a HYBRID (Will, 2026-06-12): tabs become FILTER chips over ONE continuous feed - events (V3 stat-forward cards) THEN your uploads (masonry) THEN likes, in one scroll. WHY: a free user with ONE event still gets a full, exciting page (content beneath the lone event) instead of a sparse list + forced navigation to find the rest. Storage = the AMBIENT slim meter from V2 (NOT V1's in-your-face card): polished + visible to incentivize the upgrade when it matters, never a hero block. Trash stays a filter (the recovery bin). The personal feeds (uploads/likes) keep their own empty-state ownership (client-only unlike).

Board: `src/app/(dev)/design/components/host-dashboard-variants.tsx`, last at `9b75ec1`, deleted 2026-09-02.  
Lives: `docs/systems/host-app.md`

## host-event-page

**Gallery-first event page** (host). Ruled 2026-06-20. Shipped: V1 Composition: editorial.  
The ratified gallery-first event page made concrete: the whole-page composition plus the two open forks (settings entry, deleted placement).  
Variants: V1 Composition: editorial; V2 Composition: stat line; V3 Composition: share-forward; V4 Settings: route; V5 Settings: drawer; V6 Settings: dialog; V7 Deleted: behind settings; V8 Deleted: command strip; V9 Deleted: gallery toggle.

Context, as the lab recorded it: Phase 5 S3·S0 (Will, 2026-06-20): the gallery-first DIRECTION is ratified (host-event decision 1); this touchpoint makes it concrete and resolves the two open BUILD forks. Three labeled groups in one variant file: A. whole-page composition (react to the architecture), B. settings entry, C. deleted placement. Ratification happens in chat; the picks land in decisionNote below. Label is "Deleted" (the 2026-06-20 rename).

The ruling, verbatim: Ratified (Will, 2026-06-20): A = Editorial (1) refined - icon sub-stats (items/contributors/views) + date + subtle visibility & accepting-uploads status; Share = PRIMARY; the Review button leaves the strip for its own horizontal-scroll TEASER section (faded right edge, only when reviews exist) below the actions (mobile: Share full-width / Add+Settings 2-col / Review teaser / gallery). B = Settings as a dedicated ROUTE (1), smooth view-transition feel, polished + tooltips. C = Deleted BEHIND settings (1) - intentional + rare, the retrieval path is where a host looks. The refined composition + settings-page explorations live in the gallery-first refinement round; the cross-surface hover/lightbox action model is the new `gallery-actions` touchpoint.

Board: `src/app/(dev)/design/components/host-event-page-variants.tsx`, last at `9b75ec1`, deleted 2026-09-02.  
Lives: `docs/systems/host-app.md`

## host-event-build

**Gallery-first page: build** (host). Ruled 2026-06-20. Shipped: V6 Review: focused mode.  
The execution craft of the ratified gallery-first page (header config status, the responsive command strip, the settings crossfade) plus the one open fork: the review surface, interactive so it can be felt.  
Variants: V1 Header: status row; V2 Header: inline meta; V3 Strip: mobile (stacked); V4 Strip: desktop (one row); V5 Review: in-page expansion; V6 Review: focused mode; V7 Settings: route + crossfade.

Context, as the lab recorded it: Phase 5 S3·3b (Will, 2026-06-20): the gallery-first BUILD round. The composition direction + the two forks are ratified (host-event-page decision 1); this touchpoint is the EXECUTION CRAFT plus the one open interaction - the review surface (in-page expansion vs focused mode), built INTERACTIVE so Will can feel it. `decision` stays unset until he picks the review form in chat; then it records the picked form + the header/strip/settings craft calls.

The ruling, verbatim: Ratified (Will, 2026-06-20, felt live). A = Header STATUS ROW (1): counts on one line (date + items / contributors / views icons), then a SEPARATE row of small bordered chips for the config status (visibility Open/Password/Private + an Accepting-uploads dot) - state reads as state, worth the extra line. B = the command strip ships RESPONSIVE both ways (phone: Share full-width, then Add + Settings; one row when wide); review has LEFT the strip for its own teaser. C = the review surface is FOCUSED REVIEW MODE (6): the pending teaser (faded right edge, only when reviews exist) opens a full TAKEOVER (its own header 'Review N' + back, the page hidden behind) with tap-to-select + a sticky bulk bar (Hide / Approve selected, Approve all); moderation is INSTANT (no theater), toasts fire (Approved N, Hidden from everyone). D = Settings is a dedicated ROUTE with a lean crossfade (the ONE place motion is spent) + Deleted BEHIND it. Next: the incremental A->D build, hydration-safe (native title on SSR'd surfaces, NO radix Tooltip - the regression cause), each increment verified on Will's real browser + the gated probe.

Board: `src/app/(dev)/design/components/host-event-build-variants.tsx`, `src/app/(dev)/design/components/host-event-build-demos.tsx`, last at `9b75ec1`, deleted 2026-09-02.  
Lives: `docs/systems/host-app.md`

## gallery-actions

**Gallery actions** (shared). Ruled 2026-06-20. Shipped: V1 Universal action colors + the grouped lightbox (the model).  
The universal action-color system (monochrome at rest, color on hover/state) across the tile reveal and the lightbox pill, plus the host lightbox moderation set and the Like/Hide feedback toasts.  
Variants: V1 Universal action colors + the grouped lightbox (the model); V2 Host tile: rest / on-hover; V3 Host lightbox: grouped pill; V4 Guest parity; V5 Feedback toasts.

Context, as the lab recorded it: Phase 5 S3·3c (Will, 2026-06-20): the GALLERY ACTION MODEL across guest + host. 3c.1 SHIPPED the host tile reveal (top-right hover row, like far-right, hidden = 30% dim). This pass shapes 3c.2: the LIGHTBOX host actions (the grouped "enjoy | curate" pill + Share), the UNIVERSAL per-action COLOR layer (same colors guest + host; only the action SET differs), and the Like/Hide feedback toasts. `decision` stays unset until Will ratifies the colors + toast copy in chat.

The ruling, verbatim: Ratified (Will, 2026-06-20). UNIVERSAL per-action colors (guest + host; only the action SET differs): like pink, save/download blue, hide/show amber, approve green, delete red. Emil: monochrome at rest, color on direct icon-hover + active state (liked = filled pink); native title tooltips. TILE (3c.1, shipped): the top-right hover-reveal row, Like FAR-RIGHT (stays colored when liked, never shifts on hover-off), hidden = 30% opacity; mobile keeps Like + Save only (hide/delete move to the lightbox). LIGHTBOX (3c.2): the grouped 'enjoy | curate' pill, Like LEFTMOST of enjoy [like, count, download, share] then a divider then [approve-or-hide-or-unhide, remove]; delete behind a modal confirm, everything else 1-way-safe or reversible; Share passes the event JOIN url. The guest lightbox keeps its exact behavior + gestures, it just gains the same colors. TOASTS: Like 'Added to your likes'; Hide 'Hidden from everyone', firing from BOTH the tile hover-row and the lightbox. Corrects the prior 'viewer pill is unchanged' reading: the color clarity is for everyone, not host-only. POLISH (Will, 2026-06-20): OPTIMISTIC moderation (instant tile + lightbox via useOptimistic; reverts + toasts on failure); a PERSISTENT amber hidden marker (off-hover + mobile, like the liked heart, atop the 30% dim); the lightbox Like is a bare icon; Share hovers blue (shared with download/save). STYLED tooltips are LIGHTBOX-ONLY: wrapping the SSR'd tiles in radix Tooltips regressed host-gallery hydration on prod (the lightbox is ssr:false so its tooltips are safe; tiles use native title). See the hydration gotcha in docs/systems/architecture.md.

Board: `src/app/(dev)/design/components/gallery-actions-variants.tsx`, last at `9b75ec1`, deleted 2026-09-02.  
Lives: `docs/systems/host-app.md`, `docs/systems/design-system.md`, `docs/systems/architecture.md`

## marketing-identity

**Marketing identity** (marketing). Ruled 2026-07-05 (T1). Shipped: V1 Editorial gallery.  
Three site identities for the marketing rebuild, same mono system: they differ in composition, type scale, motion language, and media treatment.  
Variants: V1 Editorial gallery; V2 The reel is the hero; V3 Live event energy.

Context, as the lab recorded it: Marketing-identity lab round (2026-07-03): the marketing site is content-complete but pre-V1 identity (it still wears the retired accent). This round prototypes 3 genuinely distinct site identities ON the locked mono system - directions differ in COMPOSITION, TYPE SCALE, MOTION LANGUAGE, and MEDIA TREATMENT, never in palette - so Will can pick one direction for the full marketing rebuild. Each variant is a desktop hero plus one signature scroll section inside a scrollable browser mock (feel the motion, don't imagine it). `decision` stays unset until Will rules.

The ruling, verbatim: T1 ruling (Will, 2026-07-05): B+C HYBRID. B's cinema hero leads (the desired visual language, the most design magic) with B's how-it-works reel animation kept, and C's animated product-demo as a close follow-up section visualizing the how. A rejected as too templated. BINDING CAVEAT: these wow sections are the FLOOR, not the site: the build is gated on a full-site IA/content-architecture round (core loop + supporting features) done collaboratively with Will (T2.5) before any production pages.

Board: `src/app/(dev)/design/components/marketing-identity-variants.tsx`, `src/app/(dev)/design/components/marketing-editorial-direction.tsx`, `src/app/(dev)/design/components/marketing-cinema-direction.tsx`, `src/app/(dev)/design/components/marketing-live-direction.tsx`, last at `9b75ec1`, deleted 2026-09-02.  
Lives: `docs/systems/marketing-content.md`, `src/components/marketing/sections/home/`

## marketing-voice

**Marketing voice** (marketing). Ruled 2026-08-25. Shipped: V1 Collection-led.  
Three copy groupings for the marketing rebuild, all anchored on the owner's ratified eight-line palette but leading with a different thesis (collection, arc, reel-tempered), type-set dark-mono with a three-mode word-animation toggle (Roll default).  
Variants: V1 Collection-led; V2 Arc-led; V3 Reel-led.

Context, as the lab recorded it: Marketing-voice lab round (T2.5 cluster-4). ROUND 2 (2026-07-08) rebuilt the groupings on the owner's ratified palette (event language, collection co-lead) with a word-animation toggle (Roll default) after the hard cut read glitchy on text-only boards. Round 1 (2026-07-07) had drafted four boards off a D2xD4 blend; the owner's rulings reset it: the copy leaned too hard on the reel (most value is the easy collection), "night" was banned as identity language, and eight lines were ratified as the GOLDEN SET to build around verbatim. The three groupings differ in H1/thesis strategy (G1 collection-led, G2 arc-led, G3 reel-led-tempered); a ratified- palette strip type-sets his eight lines above them. `decision` stays unset until he confirms which grouping + the animation mode.

The ruling, verbatim: Ruled in chat (2026-08-25), not as a pure grouping pick: the thesis Will supplied ('The whole event, in one album.') is Collection-led's evolved form, so V1 stands as the shipped spine while 'Arc has a much better voice in the sentence examples' guides the register. He supplied the subhead verbatim + a per-section header map (marketing-voice.ts is the single source; ruled vs provisional flagged there with his notes), warmed the decomposition's third fact to 'Created for you.', ordered pricing after the reel section, and rejected the width-reserving kinetic slot ('a huge inline gap') in favor of a measured, animated width. The word-ANIMATION mode still confirms on the hero prototype.

Board: `src/app/(dev)/design/components/marketing-voice-boards.tsx`, last at `9b75ec1`, deleted 2026-09-02.  
Lives: `src/lib/constants/marketing-voice.ts`, `docs/systems/marketing-content.md`

## marketing-decomposition

**Marketing decomposition** (marketing). Ruled open. Shipped: open.  
The home's signature move, two ways: the hero's reel comes apart into its source tiles while three counters land as facts, played once on scroll or scrubbed by it, plus the tactile photo-pile and card-stack candidates and the mono confetti proposal.  
Variants: V1 One-shot play; V2 Scroll-driven; V3 Photo-pile drag (extra); V4 Card-stack hover (extra); V5 Confetti proposal (extra).

Context, as the lab recorded it: Track B F5 lab round 1 (2026-08-25, the trackb-marketing-build plan): the home's SIGNATURE section (IA section 3, the made-from spine's anchor beat) has NO prototype; the lab-first gate mandates this round before lp/mkt-home builds it. Two selectable mechanics for the same story (the hero's reel comes APART into its source tiles while three counters land as facts): V1 plays once on scroll-into-view; V2 is scrubbed by scroll (the one sanctioned scroll-linked JS candidate; V1 is the fallback if the feel is off). The same session carries the plan's tactile candidates (drag-drop photo pile, card-stack hover) and the mono confetti-burst proposal for the live demo's "Reel ready" beat (default OFF). `decision` stays unset until Will rules V1 vs V2 (+ the extras' fate) in-session.

The ruling: not yet taken (see the board).

Board: `src/app/(dev)/design/sandbox/marketing-decomposition-variants.tsx`, standing in `sandbox/` until the ruling lands.  
Lives: `docs/systems/marketing-content.md`, `docs/ROADMAP.md`

## marketing-hero-substrate

**Marketing hero substrate** (marketing). Ruled open. Shipped: open.  
The production hero decided against real footage: an mp4 substrate slot with poster-first loading and montage fallback, story progress and timecode synced to the video, and the kinetic H1 word toggling Roll, Type, or Cut across all three voice groupings.  
Variants: V1 Roll on footage; V2 Type on footage; V3 Cut on footage.

Context, as the lab recorded it: Track B F5 lab round 2 (2026-08-25, the trackb-marketing-build plan): decides the PRODUCTION hero. The cinema hero is ruled (Direction B) but the round-2 voice finding was that a hard word cut needs an IMAGE cut to motivate it, so this round judges Roll/Type/Cut against MOVING footage: a substrate slot plays /marketing/reels/hero-candidate-01.mp4 when the render session has landed it (poster-first, ambient-pause wired) and falls back to the 4-shot Ken Burns montage until then. The kinetic H1 is parameterized across ALL THREE voice groupings so an unanswered voice pick cannot stall it (both picks can land in one sitting). `decision` stays unset until Will rules the word animation (+ grouping if open).

The ruling: not yet taken (see the board).

Board: `src/app/(dev)/design/sandbox/marketing-hero-substrate-variants.tsx`, standing in `sandbox/` until the ruling lands.  
Lives: `docs/systems/marketing-content.md`, `docs/ROADMAP.md`

## home-hero

**The home hero** (marketing). Ruled open. Shipped: open.  
The full hero redesign as one question, asked four ways: the type as a cell in the album, as its own column, as a band over an album that fills, or as a title card on a single frame, every one of them at 100% media.  
Variants, round one: V1 The contact sheet; V2 The split; V3 The arrival; V4 One frame (left the board at `bd9d98e`: `git show bd9d98e:src/app/(dev)/design/sandbox/home-hero-variants.tsx`).  
Variants, round two: The source; The reel; The gathering.

Context, as the lab recorded it: its own agent round (Will, 2026-09-01 and 2026-09-12: "I'd love a full home hero redesign"), cut alongside `design-gallery` off milestone-24. The round's finding is the board: the shipped hero carries three darkening layers over its wall of 24 tiles at desktop and a fourth below `sm`, because white type had to survive over whichever tile the drift parked under it, so bible rule 1 is inverted and not one photograph reads as a photograph. That makes the design question "where does the type live, so no photograph is ever dimmed", and the four variants are the four answers: a cell in the album's own grid, its own column against a hard frame edge, a band over an album that fills guest by guest, a small opaque title card on one frame. Measured on the preview: the four stages carry ZERO darkening layers over media between them, against three on the shipped hero rendered beside them from production code. Held fixed: the ruled copy verbatim, the h1 never gated and at opacity 1 at paint, the ladder's `lg` and `xl` steps, cinema and unlit. Two sub-questions ride the ruling: the kinetic word (a toggle on the board; the recommendation is to retire it, since the variety it carried is now carried by the photographs) and, if V3 wins, the live-demo section, which already does the same thing at position 7 of the home arc.

The ruling on round one: none of the four (Will, 2026-09-14: "very bland and generic, using image grids that felt very popular 10 to 20 years ago", not capturing "the one QR/link -> full event album concept"). Round two, same day: one sharper question, THE HERO IS THE QR BECOMING THE ALBUM, asked three ways with a reference each for its strength: the source (Melius's centre-out stream, the QR as the origin), the reel (Ploy's encapsulated video with the announcement card carrying the live QR), the gathering (Frame.io's bespoke field, the QR as the eyebrow). Each proposes its own eyebrow (Will does not love the current one) and its own copy beside the ruled thesis, names the assets that replace its stand-ins (the unlimited-design-resources policy, set the same day), and flags departures on the board. Built by three tracks in parallel against one shell (`sandbox/home-hero/shared.tsx`).

The ruling on round two: not yet taken (see the board).

Board: `src/app/(dev)/design/sandbox/home-hero/board.tsx` (the shell; one file per concept beside it), standing in `sandbox/` until the ruling lands.  
Lives: `docs/systems/marketing-content.md`, `src/components/marketing/sections/home/cinema-hero.tsx`

## pricing-plan-cards

**Pricing plan cards** (marketing). Ruled 2026-08-27. Shipped: V2 Stacked photos.  
The pair's visual identity layer: a media burst, a stacked-photo depth read, or quiet concentric ink.  
Variants: V1 Media burst; V2 Stacked photos; V3 Quiet ink.

Context, as the lab recorded it: The pricing round (2026-08-27): /pricing rebuilt on the restrained default; this decides the plan cards' visual identity layer (the Biograph-burst equivalent, built from media). Each variant renders the REAL pair anatomy (paper Free + ink Pro) in miniature so the identity is judged across both registers at once. V2 uses the back-pocket soft-shadow exception (photos physically stacking).

The ruling, verbatim: V2 Stacked photos (Will, 2026-08-27): 'v1 is really cool but within the card v2 has a nice balance.' Wired into /pricing the same day (Free stacks two grayscale, Pro four vivid on ink; hover spreads; the back-pocket soft-shadow exception carries the depth). His sitting also flagged the mono face on the cards ('don't know where this mono font is coming from') -> the pricing-wide price-register swap: money in the display face (Urbanist, tabular digits), values in Inter; Geist Mono survives only as the wall's timecode chips.

Board: `src/app/(dev)/design/components/pricing-plan-cards-variants.tsx`, last at `9b75ec1`, deleted 2026-09-02.  
Lives: `src/app/(marketing)/(cinema)/pricing/`, `docs/systems/marketing-content.md`

## pricing-calculator

**Pricing calculator** (marketing). Ruled 2026-08-27. Shipped: V1 Album fill.  
The find-your-size slider's expression: the album-fill wall against the shipped receipt meter.  
Variants: V1 Album fill; V2 Receipt meter.

Context, as the lab recorded it: The pricing round (2026-08-27): does the find-your-size slider earn its delight layer? V1 makes the golden line mechanical (the album wall fills as you slide); V2 is the shipped receipt meter reproduced as the baseline. Both run the same stop ladder + the same pure recommendPlan brain, so only the EXPRESSION differs.

The ruling, verbatim: V1 Album fill (Will, 2026-08-27): 'definitely the V1 direction. Cool idea already!' The wall replaced the bare meter in /pricing#fit on the real gallery grammar (3px tiles/gaps); the receipt line + aria-live verdict stay the accessible summary; clip tiles keep the one legitimate mono (a timecode).

Board: `src/app/(dev)/design/components/pricing-calculator-variants.tsx`, last at `9b75ec1`, deleted 2026-09-02.  
Lives: `src/app/(marketing)/(cinema)/pricing/`, `docs/systems/marketing-content.md`

## contact-identity

**Contact identity** (marketing). Ruled 2026-08-28. Shipped: V2 The desk.  
The form chapter from zero: a stationery note with a photo stamp, a media-split desk, or a bare-paper editorial ledger.  
Variants: V1 The note; V2 The desk; V3 The ledger.

Context, as the lab recorded it: The contact round REDO (2026-08-28): the first build kept the old page's wireframe DNA and Will called it ("super bland... did not follow 'if this page didn't already exist'"). The IA survives (topic router, help search, directory); THIS touchpoint re-designs the form chapter's visual identity from zero. Each direction carries its own topic-router treatment, so one ruling settles the page.

The ruling, verbatim: COMPOSITE on V2 (Will, 2026-08-28): 'I like the V2 desk layout most for the form section, as it feels very structured, but I'd like to use the V1 note design and the v2 form itself to jazz up the visual design.' Wired same-day: the desk structure + facts rows, the note's stamp + letterhead on the card, the Polaroid spread DROPPED ('so it doesn't feel too busy'), the seven open chips collapsed to a clean dropdown ('takes a ton of room'), and the card on the Biograph gray panel with white fields (his biograph.com/contact reference). V3's numbered-index grammar was grafted onto the self-serve directory.

Board: `src/app/(dev)/design/components/contact-identity-variants.tsx`, last at `9b75ec1`, deleted 2026-09-02.  
Lives: `src/app/(marketing)/(paper)/contact/`, `docs/systems/marketing-content.md`

## press-identity

**Press identity** (marketing). Ruled 2026-08-28. Shipped: V1 The contact sheet.  
Two directions for the press kit, same content and IA throughout: the assets as a photographic contact sheet on ink, or as a type-foundry specimen sheet on paper.  
Variants: V1 The contact sheet; V2 The specimen sheet.

Context, as the lab recorded it: The /press redesign (2026-08-28). The page is the last wireframe-grade surface on the marketing site and has no metaphor, while every elevated surface here is a physical object. Two full page-chapter directions, rendering IDENTICAL content from constants/press.ts + PRESS_KIT so the ruling is about identity alone. Will's constraint: the logo changes before launch, so this round builds the SYSTEM (a manifest, a rebuildable kit zip, rules written against the mark's own box), never a shrine to the current glyph. `decision` stays unset until Will rules V1 vs V2 (a hybrid of V1's sheet with V2's register is an expected outcome).

The ruling, verbatim: Ruled by Will (2026-08-28): the contact sheet, for "focusing press around the assets and quick hit points" where the specimen sheet "felt more like internal brand guidelines." The ruling came with a scope cut that survived into the build: the logo usage guidelines (clear space, minimum size, misuse) are OUT of the shipped page entirely. Only the two usage points that are press business rather than brand-book material ship, as quick hits beside the copy they govern: quoting needs no permission, and how to write the name. V2's register is kept here as the design record, and its rules array moved into this lab file so production carries no dead constant. One mechanic was promoted from this round: [data-mkt-isolate] into marketing.css as a general recipe. The page also briefly borrowed the concurrent lp/about CinemaChapter, then dropped it when it moved into the (cinema) route group instead, which is where it shipped.

Board: `src/app/(dev)/design/components/press-identity-variants.tsx`, `src/app/(dev)/design/components/press-contact-sheet-direction.tsx`, `src/app/(dev)/design/components/press-specimen-direction.tsx`, `src/app/(dev)/design/components/press-lab-shared.tsx`, last at `9b75ec1`, deleted 2026-09-02.  
Lives: `src/app/(marketing)/(cinema)/press/page.tsx`, `src/components/marketing/press/press-sheet.tsx`, `docs/systems/marketing-content.md`

## blog-identity

**Blog identity** (marketing). Ruled 2026-08-28. Shipped: V4 The Cutting Room.  
The index from zero: a type-led broadsheet, a photographic contact sheet, a desk of physical objects, or a letterboxed edit track.  
Variants: V1 The Broadsheet; V2 The Contact Sheet; V3 The Reading Table; V4 The Cutting Room.

Context, as the lab recorded it: The blog round (2026-08-28): /blog is the last marketing surface still on its route-completeness scaffold (centered hero, pill row, card boxes, and NO photography on a media product). Will ruled the move into the (cinema) group, an optional per-post `cover` with a deterministic fallback, and freeform tags with a redesigned rail; his brief for the shape was "a bespoke header/hero article, with a polished library beneath that can be filtered as needed". That makes DISTINCTNESS FROM /help the round's hard constraint (both hubs now open on the dark stage), so every direction opens on the lead STORY rather than on an instrument. V4 was added after a fresh-eyes pass found the first three each carry a structural flaw: V1 restates /help's index sheet, V2 is the most exposed to a 12-image manifest, and V3's fanning stack already ships in the footer of every page.

The ruling, verbatim: COMPOSITE on V4 (Will, 2026-08-28): "Let's Frankenstein this thing. I like the cutting room as the primary direction. However, I love broadsheet's small 'notes' title and underline above the featured blog card... should say 'Blog' instead of 'Notes'. I'd like the cutting room's tags to be sticky on the left as you scroll. Rather than library cards stretching the full width of its column, let's do two to three columns of cards in the library (desktop, width depending). Very media-forward cards... When a tag is selected, there should be a polished motion transition, then cards reorganize." Wired the same day: the Broadsheet masthead (a small h1 + the drawn rule, a deliberate departure from the 4xl-7xl H1 ladder so the featured card owns the stage), the Cutting Room letterbox kept for the FEATURED card only (21:9 - a 16:9 hero measured 684px against an 820px fold), the library as 4/5 portrait cards at 1/2/3 columns, and the margin index made sticky. The filter became the two-beat grammar (exit together, then a two-axis FLIP reorganize) and useFlip was generalized to X+Y to carry it.

Board: `src/app/(dev)/design/components/blog-identity-variants.tsx`, last at `9b75ec1`, deleted 2026-09-02.  
Lives: `src/app/(marketing)/(cinema)/blog/blog-list.tsx`, `docs/systems/marketing-content.md`

## careers-identity

**Careers identity** (marketing). Ruled 2026-08-28. Shipped: nothing (all three rejected).  
The careers page from zero: an album of the build, an annotated handoff, or one role in one room.  
Variants: V1 The contact sheet; V2 The handoff; V3 One room.

Context, as the lab recorded it: Careers-identity lab round (the careers round, 2026-08-28). Today's /careers is a template instance: it shares its hero AND its numbered- principles grid with /about (whose comment calls the shape "the careers idiom"), invents a team album that does not exist, restates the product pitch four times before the job appears, and buries the reel engine one click deep. Ruled before prototyping: cinema-led with paper chapters, no JobPosting JSON-LD while the listing is placeholder, the small-team hook KEPT (headcount and founder identity stay off the site), and copy leads, so each direction carries its own rewritten voice and one ruling settles layout and words together.  Two directions were dropped BEFORE build, with reasons, so they are not re-proposed: THE CALL SHEET (a call sheet persuades by being full of facts we are forbidden from publishing, and it is mono-native against the R6 mono ruling) and THE WORK SAMPLE (its centrepiece was the live style switcher, already /reel's ruled flagship signature, and it would drag the engine into a marketing chunk that style-switcher-island.tsx exists to keep it out of). The proof survives as a LINK to /reel#styles.

Context, as the lab recorded it: No `decision`: ALL THREE WERE REJECTED (Will, 2026-08-28), which is the most useful thing this entry records. Kept as the standing warning about what a careers page is not.

The ruling, verbatim: ALL THREE REJECTED (Will, 2026-08-28): 'a total back to the drawing board.' The directions were three costumes over the wrong CONTENT. (1) Engine internals do not belong on a careers page: 'why in the world am I reading about Reel CSS rendering on the careers page... this will all be handled during interviews' and 'we don't need to pour our heart out about the internal workings of our app.' D was 'the most visually engaging version but doesn't feel like a careers page at all', and its H1 (built from our own details-nobody-notices value) was 'laughably one of the least incentivizing things I could read as a prospect'. (2) E exposed 'the full state of our app to anybody online... never seen a careers page like this.' (3) C 'feels closer to an actual career listing than a careers page' and we are 'definitely not centering the entire careers page around a single role' (the General Application is ongoing and more listings are coming). Also ruled: stop dwelling on pre-launch, 'we're building this for launch.' SALVAGED into the shipped page: D's header, re-aimed off the reel engine onto global Partyreel concepts ('the subtle technical art kind of makes it feel cool in a developer this is cool work way versus repeating more images'), and C's metric row, which was then CUT with him for lack of honest content (no social proof exists, hiring facts read as boring). Shipped instead, after TWO more rebuild prototypes were rejected as generic: a page that argues in PHOTOGRAPHS (a contact-sheet hero, then the roll -> the selects -> the reel), because the cause was never layout - both prototypes were claims about ourselves on a page whose reader had already met the pitch twice.

Board: `src/app/(dev)/design/components/careers-identity-variants.tsx`, last at `9b75ec1`, deleted 2026-09-02.  
Lives: `src/app/(marketing)/(cinema)/careers/`, `docs/systems/marketing-content.md`

## reel-reveal

**Reel reveal moment** (host). Ruled 2026-07-05 (T1), ratified as built 2026-07-08. Shipped: V1 Composite (ruled).  
The ruled composite reveal on the real playing canvas engine, above its three source choreographies: a cinema premiere, the making-of made visible, and photo-becomes-cinema.  
Variants: V1 Composite (ruled); V2 Lights down; V3 Assembly; V4 First frame held.

Context, as the lab recorded it: Reel reveal-moment lab round (2026-07-03): the beat where a host who just tapped Create reel watches their reel exist for the first time (the North Star wow; a RARE moment, so animate-by-frequency allows real delight). Built on the NEW canvas engine: each stage choreographs around the real CanvasReelPlayer held at frame 0 and released at its ignite beat, which client-side encode makes honest (the reel is watchable instantly, no progress theater). Each direction carries its guest (/e/) adaptation sketch on the page. T1 ruled a COMPOSITE of the three; it is built as V1 with every beat a --tune-rvl-* var + the MotionTuner on the page, so the T2 device session tunes it live (Copy CSS -> bake -> reset).

The ruling, verbatim: T1 ruling (Will, 2026-07-05): a NEW COMPOSITE, not a single source variant (built as V1 of this touchpoint; Assembly's flight is its base mechanic). Sequence: start from the shared base state (gallery at top, no reel placeholder) -> tiles assemble into center screen -> hold + CAMERA FLASH -> scale to full-bleed from center (the First-frame-held expansion) -> as it reaches full screen, the Lights-down overlay event-name intro plays -> the reel takes breath. Cleaner than no intro (Assembly) or the polaroid mat (First frame held). Explicitly fine-tunable with Will; T2 device session is the tuning venue (the page mounts the motion tuner over the --tune-rvl-* beats). The three originals stay as V2-V4 for reference. T2 (Will, 2026-07-08, on-device): RATIFIED AS-BUILT, no retime (the shipped defaults ARE the tuned values); stays in the lab with the tuner for later revisits; production wiring is R3's job.

Board: `src/app/(dev)/design/components/reel-reveal-variants.tsx`, `src/app/(dev)/design/components/reel-reveal-shared.tsx`, last at `9b75ec1`, deleted 2026-09-02.  
Lives: `src/app/globals.css`, `docs/systems/design-system.md`

## reel-experience

**Reel experience** (host). Ruled ADR-0023. Shipped: V1 Marquee in the feed.  
Three directions for the reel as a product moment: the event-page section, creation with 14-style identity, the publish moment, and the guest arrival.  
Variants: V1 Marquee in the feed; V2 The Studio; V3 The Premiere.

Context, as the lab recorded it: Reel-experience lab round (R3 slice C, 2026-07-21): Will's verdict on the shipped reel UI, verbatim, "very weak and v1". Three directions over the SAME four moments (event-page section, creation/curation with 14-style identity, the publish moment, the guest arrival) so they compare like-for-like; the product model is ruled and closed (ADR-0021/ 0022), the UI is the canvas. The ratified reveal grammar is reused untouched (V3's Create reel fires it); only the publish beats carry new tuner knobs. The ruling lands in chat and is recorded here when it does.

The ruling, verbatim: V1 Marquee (ADR-0023): richer + feed-native, a clear create action for the host, and the most beautiful guest arrival. Composite: V1 IS the feed section (poster card, labeled control rows, engine-thumb style rail); deeper editing GRADUATES to a Reel Studio destination (V2's room, entered from the card, never forced inline); the reel is still BORN by an explicit Create act, which is what the ratified reveal triggers on. Re-opened for the production build: the quick-add signal (most-liked is unreliable when likes are sparse, so blend likes + recency + per-guest coverage + media mix behind an honest label, never random)

Board: `src/app/(dev)/design/components/reel-experience-variants.tsx`, `src/app/(dev)/design/components/reel-experience-shared.tsx`, last at `9b75ec1`, deleted 2026-09-02.  
Lives: `docs/adr/0023-qa-round-product-rulings.md`, `docs/systems/host-app.md`

## glow-doctrine

**The spill doctrine** (shared). Ruled 2026-08-28 and 08-31; open: the lit surface. Shipped: open.  
Two light systems: our spill engine for light from a lit thing, and the vendored border-beam for an object that IS the live thing.  
Variants: V1 Seam; V2 Throw; V3 Sweep; V4 Bloom; V5 Halo; V6 Corner A/B.

Context, as the lab recorded it: THE SPILL DOCTRINE (the glow round, 2026-08-28). Will asked for the footer's organic-shimmer seam glow to become core to the visual design "without forcing it everywhere". That is a doctrine problem before it is an engineering one: an unbounded glow undoes the ratified zero-chroma identity, and the first framing I tried ("an edge where media is, arrives, or is about to") disqualified nothing in a media product. This board proposes SPILL (light is never a material, always spill from a lit thing), its four laws, the engine, and the measurements. Concepts only: the engine is lab-local in design.css, and promotion into globals.css is a separate ruling because it deletes the test fence that currently keeps colour literals scoped to --mkt-confetti-N.

The ruling, verbatim: MOSTLY SETTLED (Will, 2026-08-28 + 08-31). One item on this board is still OPEN and the round recorded it as closed: the LIT SURFACE carve-out. Its cue set was ruled (hairline + lip at 9%, air blur gone), but the doc contract it amends was not: [data-lit] adds two inset box-shadows against the ratified "Dark: NO shadows anywhere" rule, and it is already applied to three of four moment-12 specimens including the Get Pro card, while the board and design.css both still say "lab-local until you rule". It wants its own round the way the corner became the rounding round, because if adopted its production surface is every dark card in the app. Do NOT un-apply data-lit from the specimens to re-judge them: those are bare divs with no ring, so removing the 9% hairline puts them further from the shipped Card, not closer. Everything else here IS settled. Law 3 (sampled where there is media, the ratified five where there is not); the engine cleared for promotion to globals.css; lights-on over lights-off; the PALETTE ours globally, with border-beam's own colours reviewed side by side and not adopted; the CORNER the rounder one, which grew into its own rounding round rather than riding out here (the rounded-* scale is derived from --radius by multiplication, so the literal reading overshoots what was approved, across 445 uses in 140 files). Also ruled: the register at 8s, and the lit surface trimmed to hairline + lip at 9%, with the air blur gone. Section 05 records that the round misread Will's original note: he meant component design in general, not three named cues. The doctrine's sibling stands: SPILL is light from a lit thing falling on its surroundings, BEAM is an object lit at its own edge because it IS the live subject. Carried forward, not blocking: the frame cost of the three sweep drives, which needs a foreground window.

Board: `src/app/(dev)/design/sandbox/glow-doctrine-variants.tsx`, standing in `sandbox/` until the ruling lands.  
Lives: `docs/systems/design-system.md#light-spill-beam-and-the-lamp-set`, `src/components/shared/glow.tsx`, `src/app/globals.css`

## glow-moments

**Spill placements** (shared). Ruled 2026-08-31; open: the publish beat's violet. Shipped: open.  
Thirteen moments argued against the doctrine, including where a beam is allowed, then the whole page they compose into.  
Variants: V1 Hero underlight; V2 Locked door; V3 Doorbell arrival; V4 Awaiting media; V5 Album straddle; V6 QR plate; V7 Publish beat; V8 CTA rim; V9 Paper probe; V10 Upload as light; V11 Scan-through; V12 Where a beam is allowed; V13 The whole page.

Context, as the lab recorded it: The placement half of the same round. Every specimen names its lamp, its direction, its colour source and the law that admits it, and carries a verdict. The rejects are BUILT rather than described on purpose: a placement you have seen and turned down stays turned down.

The ruling, verbatim: REVIEWED (Will, 2026-08-31), and merged 2026-08-31 with TWO items the record wrongly listed as closed. (1) THE PUBLISH BEAT'S VIOLET is unruled: moment 07 still says "needs a ruling on the violet", and the constraint is real, since violet is a ratified STATE colour for reel curation and law 3 forbids a state colour, so the sampled spill has to stay outside the frame while violet stays on the controls, or a state colour has quietly become decoration. (2) THE HELP-PALETTE BEAM is listed as shipping while its own specimen still reads "New, wants your eye", and it should come OFF the beam list: production forces surface-paper on that palette so it is near-white in every session, which is the exact ground that got the QR plate's beam rejected. The rule that falls out is worth more than the placement: the ground picks the sibling, ink takes the beam and paper takes spill in the paper register. Same correction retires the reel-render beam from this list, not as a reject but because today's stitching dialog is a minimal stand-in rather than the finished reel-render surface, so it rides that surface's own round. SHIPS: the hero underlight, the locked door, the doorbell arrival (its lap softened to light, since a 1px rounded stroke read as chrome on a gallery with no border), awaiting-media, the album straddle, the QR plate switching on, the publish beat's sampled spill, the paper probe, the whole-page scarcity test, and three beam surfaces (Get Pro at rest, the reel while it renders, the help palette while focused). RULED TO SOMETHING ELSE: the QR plate takes our own light rather than the beam (the beam reads too faintly on a white plate); the upload takes NO light at all (the opacity climb plus the bar already say it, and the sweep read as forced), which leaves the engine's scalar drive exercised but unplaced. KILLED: the pointer lamp, the CTA rim (border-beam does that job better on premium buttons), and the scan-through (its own ground-up round; the POUR is kept and parked as a working technique with no placement).

Board: `src/app/(dev)/design/sandbox/glow-moments-variants.tsx`, standing in `sandbox/` until the ruling lands.  
Lives: `docs/systems/design-system.md#the-shipped-light`

## event-feed

**Event feed** (host). Ruled 2026-06-22. Shipped: Condense, Fade, FLIP.  
The `/design/event-feed` prototype, not a touchpoint: where the pill behavior (A=Condense), the filter-swap transition (B=Fade) and the urgency-reorder (C=FLIP) were felt and ratified before they touched the hydration-sensitive host page. The framer-motion reorder was trialed here and rejected in favor of the CSS FLIP.

Board: `src/app/(dev)/design/event-feed/` (event-feed-lab.tsx, feed-sections.tsx, sample-feed.ts, a stale copy of use-flip.ts), last at `9b75ec1`, deleted 2026-09-02.  
Lives: `docs/systems/design-system.md#event-feed-review-motion-the-live-motion-tuner`, `docs/systems/host-app.md`, `src/lib/shared/use-flip.ts`

## palette

**The palette** (shared). Ruled open. Shipped: open.  
The achromatic ramp between black and white in both modes, the accent's role, and the muted panel as a real register, asked as three candidate token blocks beside today's on real sections, on cinema, paper and ink, at both widths.

Context, as the lab recorded it: opened by Will's rule-by-rule review of the bible (2026-09-14). Rule 1 was "mostly correct" with the longest note: the accent carries state and UI colour where there is no media, marketing may carry colour beyond media (aurora, non-sampled spill), a section without a picture should still be beautiful, and "achromatic" is the intent where "grayscale" was written; the greys themselves "feel off". The facts the board starts from: the light ramp has a 0.455 hole between 0.45 and 0.905, the dark ramp crushes four surfaces into 0.14 to 0.25, three darks ship (cinema 0.11, the app 0.14, ink 0.155), the panel ships at three alphas, and `--brand` is an alias of ink with a two-line hook left in `theme.css` for exactly this decision.

Board: `src/app/(dev)/design/sandbox/palette/board.tsx`, standing in `sandbox/` until the ruling lands.  
Lives: `src/app/globals.css`, `src/app/theme.css`, `docs/systems/design-system.md`

## light

**Light** (shared). Ruled open. Shipped: open.  
Light, shadow and lamp as one system with the aurora infused as identity: where shadows return in dark (stacked media cards, a layer over content), lamps that emit from nothing (the footer's seam as the model), a section-scoped aurora on a media-less section, the cadence at 8s and 11s, the publish beat's violet, the lit surface.

Context, as the lab recorded it: opened by the review (2026-09-14). Rule 10 ("dark has no shadows") was rewritten to depth-is-light-first with shadows where objects stack; rule 11 (source and direction) is retiring, because as written it forbade the one production lamp Will likes most; the parked light rulings (b) the lit surface, (c) the publish beat's violet and (d) the cadence ride this board and unpark. The doctrine it replaces: SPILL's four laws, BEAM's four laws, the three registers and the elevation contract in `design-system.md`.

Board: `src/app/(dev)/design/sandbox/light/board.tsx`, standing in `sandbox/` until the ruling lands.  
Lives: `docs/systems/design-system.md`, `src/components/shared/glow.tsx`, `src/app/globals.css`

## type-scale

**The type scale** (shared). Ruled open. Shipped: open.  
One heading ladder for marketing and one for the app, shown on real pages at 1440 and 375 as three candidate scales beside today's, proposed as a token table the wiring round bakes.

Context, as the lab recorded it: opened by the review (2026-09-14); rule 5 holds but "the sizes are not nailed". Marketing declares five steps (`PageHero` display, `xl`, `lg`; `SectionShell` `lg` and `default`) and the app has one atom (`PageHeading`, 23 call sites) with about ten ad-hoc combinations and admin h2s at 14 px; no size tokens exist. The face pairing is not the question and is not protected either: a candidate that needs a different pairing shows it once, flagged as a departure.

Board: `src/app/(dev)/design/sandbox/type-scale/board.tsx`, standing in `sandbox/` until the ruling lands.  
Lives: `docs/systems/design-system.md`, `src/components/marketing/system/page-hero.tsx`, `src/components/marketing/system/section-shell.tsx`

## floating-surfaces

**Floating surfaces** (shared). Ruled open. Shipped: open.  
Every floating primitive (dialog, drawer, dropdown, popover, select, sheet, toast, tooltip, the nav viewport) on cinema, paper and ink at both widths, today beside two candidate treatments of radius, entrance and light-or-shadow in dark, the outliers brought onto whichever contract wins.

Context, as the lab recorded it: opened by the review (2026-09-14); rule 15 holds and gets its dedicated exploration. Five primitives ride the contract, `select` is stock shadcn, the drawer has the radius without the shadow, the sheet is square by side; the phone canvas is primary for sheets, drawers and dialogs, the desktop canvas for menus, popovers and tooltips.

Board: `src/app/(dev)/design/sandbox/floating-surfaces/board.tsx`, standing in `sandbox/` until the ruling lands.  
Lives: `docs/systems/design-system.md`, `src/components/ui/`

## brand-voice

**The brand voice** (marketing). Ruled open. Shipped: open.  
The voice as a guide (its three registers, the do's as sentence shapes with examples per surface, what it never does, a rewrite procedure) and a board of sample headings and lines beside today's on real section shells, with the home arc's seven provisional headers rewritten in the proposed voice as the worked example.

Context, as the lab recorded it: opened by the review (2026-09-14). Rule 20 was "messy: don'ts without do's" and rule 21 (ruled copy) was killed: all copy is open until the voice exists. There is no voice doc anywhere; the written rule was the em-dash ban. The guide lands as `docs/specs/brand-voice.md` (a proposal) and is promoted into `docs/systems/` at the ruling; the `voice-infusion` round then carries it site-wide.

Board: `src/app/(dev)/design/sandbox/brand-voice/board.tsx`, standing in `sandbox/` until the ruling lands.  
Lives: `docs/specs/brand-voice.md`, `src/lib/constants/marketing-voice.ts`

## media-kit

**The media kit** (marketing). Ruled open. Shipped: open.  
The licensing rule written down (no stock at launch; every frame ours or under a license we can name, with author, source and retrieval date on every manifest entry), a survey of the licensed sources whose terms allow a marketing use, a plan for the kit Will makes himself, and a contact-sheet board of a candidate first batch beside the current 12, with provenance under each.

Context, as the lab recorded it: opened by the review (2026-09-14); rule 18 was "an unspoken rule". All 12 marketing stills carry "provenance unverified", the lab pack they came from is gone, and the manifest test checks only that a license line is non-empty. The batch is staged under `public/design/media-kit/`, not wired; the stand-ins stay until the wiring round.

Board: `src/app/(dev)/design/sandbox/media-kit/board.tsx`, standing in `sandbox/` until the ruling lands.  
Lives: `docs/specs/media-kit.md`, `src/lib/constants/marketing-media.ts`, `docs/ASSETS.md`

## rounding

**The rounding and tweaking GUI round** (shared, Orchestrator-run). Ruled open. Shipped: open.  
The radius system's sitting surface: the sharp-surface / round-action contrast at candidate values for every radius token, beside the tuner that drags the real pages.

Context, as the lab recorded it: opened at the review (2026-09-14; "can be initiated whenever you're ready"), after two stagings (the three knobs on the marketing tuner, 2026-09-01; the knobs on `/design/motion`, 2026-09-11). The round first earns the sitting: a store outside the tuner component (persisted, exported) fixes the two defects at their one root, every knob gets a description and where it ships, the three action-radius knobs join, and a knob without a specimen is retired. Bible 8 inherits the values.

Board: `src/app/(dev)/design/sandbox/rounding/board.tsx`, standing in `sandbox/` until the ruling lands.  
Lives: `src/app/globals.css`, `src/app/theme.css`, `src/components/dev/motion-tuner-config.ts`, `docs/systems/design-system.md`
